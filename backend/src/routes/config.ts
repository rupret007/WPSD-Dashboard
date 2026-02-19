import { Router, Request, Response } from "express";
import { getConfig, updateWpsdHost } from "../config";

async function fetchJson(url: string, opts: RequestInit & { timeout?: number } = {}) {
  const timeout = opts.timeout ?? 5000;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

/** Fetch with one retry after 1s (for flaky hotspot). */
async function fetchWithRetry(
  url: string,
  opts: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const attempt = async (): Promise<Response> => {
    const timeout = opts.timeout ?? 5000;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(t);
    return res;
  };
  try {
    return await attempt();
  } catch (e) {
    await new Promise((r) => setTimeout(r, 1000));
    return attempt();
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

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const base = getWpsdBase();
  let reachable = false;
  try {
    const res = await fetchWithRetry(`${base}/admin/system_api.php?action=get_ip&format=json`, {
      headers: { Authorization: `Basic ${getWpsdAuth()}` },
      timeout: 5000,
    });
    if (res.ok) reachable = true;
  } catch {
    // ignore
  }
  res.json({ wpsdHost: base, reachable });
});

router.put("/", (req: Request, res: Response) => {
  const { wpsdHost } = req.body ?? {};
  if (!wpsdHost || typeof wpsdHost !== "string") {
    res.status(400).json({ error: "wpsdHost required" });
    return;
  }
  const host = wpsdHost.trim().replace(/\/+$/, "");
  if (!host.startsWith("http://") && !host.startsWith("https://")) {
    res.status(400).json({ error: "wpsdHost must start with http:// or https://" });
    return;
  }
  const WPSD_HOST_MAX_LENGTH = 2048;
  if (host.length > WPSD_HOST_MAX_LENGTH) {
    res.status(400).json({
      error: `wpsdHost must be at most ${WPSD_HOST_MAX_LENGTH} characters`,
    });
    return;
  }
  try {
    updateWpsdHost(host);
    res.json({ ok: true, wpsdHost: host });
  } catch (err) {
    res.status(500).json({ error: String((err as Error).message) });
    return;
  }
});

export default router;
