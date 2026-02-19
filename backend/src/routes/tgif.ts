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

function tgifSlot(timeslot: unknown): number {
  const ts = Math.max(1, Math.min(2, parseInt(String(timeslot), 10) || 2));
  return ts - 1;
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

function proxyErrorMsg(status: number): string {
  const base = getWpsdBase();
  return `Hotspot returned ${status}. Check wpsd.host (${base}), wpsd.username and wpsd.password in config.json and that the hotspot admin is reachable (same URL as TGIF Manager in the browser).`;
}

/**
 * Proxy link/unlink via hotspot tgif_manager.php (same as admin TGIF Manager page).
 * Form contract from Pi-Star/W0CHP: tgifSubmit (any), tgifSlot (1=TS1, 2=TS2), tgifNumber (TG id for link),
 * tgifAction = "LINK" | "UNLINK" (exact caps). PHP checks $_POST["tgifAction"] == "UNLINK"; else uses tgifNumber.
 */
async function tgifViaWpsdProxy(
  action: "link" | "unlink",
  timeslot: 1 | 2,
  tg?: string
): Promise<{ ok: boolean; message?: string }> {
  const base = getWpsdBase();
  const auth = getWpsdAuth();
  const url = `${base}/mmdvmhost/tgif_manager.php`;
  const slot1Based = timeslot;
  const body =
    action === "unlink"
      ? `tgifSubmit=1&tgifSlot=${slot1Based}&tgifAction=UNLINK`
      : `tgifSubmit=1&tgifSlot=${slot1Based}&tgifNumber=${encodeURIComponent(tg ?? "777")}&tgifAction=LINK`;
  console.log("[TGIF] Proxy", action, "to", url);
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body,
    timeout: 15000,
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, message: proxyErrorMsg(res.status) };
  }
  return { ok: true, message: text.includes("linked") || text.includes("unlinked") ? undefined : text.slice(0, 200) };
}

/**
 * Scrape the hotspot's tgif_links.php for current slot info.
 * The PHP on the hotspot calls the TGIF API internally; if the Pi can reach
 * tgif.network:5040, we get real slot data. Returns null slots on failure.
 */
async function scrapeHotspotSlots(): Promise<{ slot1: string | null; slot2: string | null }> {
  const base = getWpsdBase();
  const auth = getWpsdAuth();
  const url = `${base}/mmdvmhost/tgif_links.php`;
  console.log("[TGIF] Scraping status from", url);
  try {
    const res = await fetchWithTimeout(url, {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 10000,
    });
    if (!res.ok) {
      console.log("[TGIF] tgif_links.php returned", res.status);
      return { slot1: null, slot2: null };
    }
    const html = await res.text();
    // tgif_links.php renders two <td> cells after the "Connected to Master" cell.
    // Slot 1: contains "TG<number>" or "None"
    // Slot 2: contains "TG<number>" or "None"
    // Match all <td> contents and pick out the slot values.
    const tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = tdPattern.exec(html)) !== null) {
      const text = m[1].replace(/<[^>]*>/g, "").trim();
      cells.push(text);
    }
    // Table: [header cells...] then data row with master, slot1 (e.g. "TG777", "TG 720", "TG777 Parrot"), slot2 ("None" or "TG91")
    let slot1: string | null = null;
    let slot2: string | null = null;
    const slotValues: string[] = [];
    for (const cell of cells) {
      const tgMatch = cell.match(/TG\s*(\d+)/i); // TG optional space number (handles "TG 720", "TG720", "TG777 Parrot")
      if (tgMatch) {
        slotValues.push(tgMatch[1]);
      } else if (cell.trim() === "None") {
        slotValues.push("None");
      }
    }
    if (slotValues.length >= 1) {
      slot1 = slotValues[0] === "None" ? null : slotValues[0];
    }
    if (slotValues.length >= 2) {
      slot2 = slotValues[1] === "None" ? null : slotValues[1];
    }
    console.log("[TGIF] Scraped slots:", slot1, slot2);
    return { slot1, slot2 };
  } catch (err) {
    console.log("[TGIF] tgif_links.php scrape failed:", (err as Error).message);
    return { slot1: null, slot2: null };
  }
}

const router = Router();

/** Last TG linked via this dashboard (when hotspot can't report TGIF status). Cleared on unlink. */
let lastLinkedBySlot: { slot1: string | null; slot2: string | null } = { slot1: null, slot2: null };

router.get("/info", (_req: Request, res: Response) => {
  const cfg = getConfig();
  const dmrId = cfg.tgif?.dmrId ?? "3221205";
  const wpsdProxyUrl = `${getWpsdBase()}/mmdvmhost/tgif_manager.php`;
  const statusUrl = `${getWpsdBase()}/mmdvmhost/tgif_links.php`;
  res.json({ dmrId, wpsdProxyUrl, statusUrl });
});

router.get("/status", async (_req: Request, res: Response) => {
  const cfg = getConfig();
  const dmrId = cfg.tgif?.dmrId ?? "3221205";
  const { slot1, slot2 } = await scrapeHotspotSlots();
  res.json({
    dmrId,
    connected: true,
    slot1,
    slot2,
    lastLinkedSlot1: lastLinkedBySlot.slot1,
    lastLinkedSlot2: lastLinkedBySlot.slot2,
  });
});

router.post("/link", async (req: Request, res: Response) => {
  const { tg, timeslot = 2 } = req.body ?? {};
  const slot = tgifSlot(timeslot);
  const slot1Based = (slot + 1) as 1 | 2;
  const rawTg = parseInt(String(tg), 10);
  const targetTg =
    Number.isInteger(rawTg) && rawTg >= 1 && rawTg <= 99999999 ? String(rawTg) : "777";

  try {
    const result = await tgifViaWpsdProxy("link", slot1Based, targetTg);
    if (result.ok) {
      if (slot1Based === 1) lastLinkedBySlot.slot1 = targetTg;
      else lastLinkedBySlot.slot2 = targetTg;
      res.json({ ok: true, tg: targetTg, slot: slot + 1 });
      return;
    }
    res.status(500).json({ error: result.message ?? "Hotspot proxy failed" });
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    res.status(500).json({ error: `Could not reach hotspot: ${msg}. ${proxyErrorMsg(0).replace(/Hotspot returned 0\. /, "")}` });
  }
});

router.post("/unlink", async (req: Request, res: Response) => {
  const { timeslot = 2 } = req.body ?? {};
  const slot = tgifSlot(timeslot);
  const slot1Based = (slot + 1) as 1 | 2;

  try {
    const result = await tgifViaWpsdProxy("unlink", slot1Based);
    if (result.ok) {
      if (slot1Based === 1) lastLinkedBySlot.slot1 = null;
      else lastLinkedBySlot.slot2 = null;
      res.json({ ok: true, slot: slot + 1 });
      return;
    }
    res.status(500).json({ error: result.message ?? "Hotspot proxy failed" });
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    res.status(500).json({ error: `Could not reach hotspot: ${msg}. ${proxyErrorMsg(0).replace(/Hotspot returned 0\. /, "")}` });
  }
});

export default router;
