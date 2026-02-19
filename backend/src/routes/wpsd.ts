import { Router, Request, Response } from "express";
import { getConfig } from "../config";

async function fetchWithTimeout(url: string, opts: RequestInit & { timeout?: number } = {}) {
  const timeout = opts.timeout ?? 15000;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(t);
    return res;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

async function fetchJson(url: string, opts: RequestInit & { timeout?: number } = {}) {
  const res = await fetchWithTimeout(url, { ...opts, timeout: opts.timeout ?? 15000 });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function getWpsdBase(): string {
  const cfg = getConfig();
  return (cfg.wpsd?.host ?? "http://192.168.5.82").replace(/\/$/, "");
}

function getWpsdAuth(): string {
  const cfg = getConfig();
  const u = cfg.wpsd?.username ?? "pi-star";
  const p = cfg.wpsd?.password ?? "raspberry";
  return Buffer.from(`${u}:${p}`).toString("base64");
}

const ALLOWED_ACTIONS = [
  "reboot",
  "shutdown",
  "get_ip",
  "update_wpsd",
  "stop_wpsd_services",
  "restart_wpsd_services",
  "update_hostfiles",
  "reload_wifi",
];

const router = Router();

/**
 * Last-heard / live activity from the hotspot.
 * Tries Pi-Star/W0CHP endpoints in order:
 * 1. /api/last_heard.php?num_transmissions=N (Pi-Star JSON format)
 * 2. /api/?limit=N (fallback)
 * Same data source as the device's "Live" view (e.g. http://192.168.5.82/live/).
 */
router.get("/last-heard", async (req: Request, res: Response) => {
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 50));
  const base = getWpsdBase();
  const auth = getWpsdAuth();
  const headers = { Authorization: `Basic ${auth}` };
  try {
    // Prefer Pi-Star/W0CHP last_heard.php (returns time_utc, mode, callsign, target, src, duration, loss, bit_error_rate, rssi)
    let data: unknown;
    try {
      data = await fetchJson(`${base}/api/last_heard.php?num_transmissions=${limit}`, { headers });
    } catch {
      data = await fetchJson(`${base}/api/?limit=${limit}`, { headers });
    }
    const arr = Array.isArray(data) ? data : [];
    // Normalize field names if backend returns Pi-Star format (bit_error_rate, etc.)
    const rows = arr.map((row: Record<string, unknown>) => {
      const r = { ...row };
      if (r.bit_error_rate != null && r.ber == null) r.ber = r.bit_error_rate;
      return r;
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String((err as Error).message) });
  }
});

router.post("/action", async (req: Request, res: Response) => {
  const { action } = req.body ?? {};
  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    res.status(400).json({ error: "Invalid action" });
    return;
  }
  const base = getWpsdBase();
  const u = `${base}/admin/system_api.php?action=${encodeURIComponent(action)}&format=json`;
  try {
    const data = await fetchJson(u, {
      headers: { Authorization: `Basic ${getWpsdAuth()}` },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String((err as Error).message) });
  }
});

export default router;
