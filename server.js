/**
 * WPSD Quick Admin - Local helper service
 * Proxies TGIF API and WPSD admin endpoints for a lightweight control UI.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const CONFIG_PATH = path.join(__dirname, "config.json");
const DEFAULT_CONFIG = {
  wpsd: { host: "http://192.168.5.82", username: "pi-star", password: "raspberry" },
  tgif: { dmrId: "3221205" },
  server: { port: 3456, host: "0.0.0.0" },
};

function deepMerge(target, source) {
  const out = { ...target };
  for (const k of Object.keys(source)) {
    if (source[k] != null && typeof source[k] === "object" && !Array.isArray(source[k])) {
      out[k] = deepMerge(target[k] ?? {}, source[k]);
    } else if (source[k] !== undefined) {
      out[k] = source[k];
    }
  }
  return out;
}

function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    return deepMerge(DEFAULT_CONFIG, JSON.parse(raw));
  } catch (err) {
    if (err.code === "ENOENT") {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf8");
      return { ...DEFAULT_CONFIG };
    }
    console.error("Invalid config.json:", err.message);
    process.exit(1);
  }
}

let config = loadConfig();

const PORT = Number(config.server?.port) || 3456;
const HOST = config.server?.host ?? "0.0.0.0";
const TGIF_BASE = "http://tgif.network:5040";
const UNLINK_TG = "4000";

function getWpsdBase() {
  return (config.wpsd?.host || "http://192.168.5.82").replace(/\/$/, "");
}
function getWpsdAuth() {
  const u = config.wpsd?.username || "pi-star";
  const p = config.wpsd?.password || "raspberry";
  return Buffer.from(`${u}:${p}`).toString("base64");
}
function getDmrId() {
  return config.tgif?.dmrId || "3221205";
}

function fetchWithTimeout(u, opts = {}) {
  const timeoutMs = opts.timeout ?? 15000;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(u, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

async function fetchJson(u, opts = {}) {
  const { timeout, ...rest } = opts;
  const res = await fetchWithTimeout(u, { ...rest, timeout: timeout ?? 15000 });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

const MAX_BODY_SIZE = 64 * 1024; // 64KB

async function readBody(req, maxBytes = MAX_BODY_SIZE) {
  let body = "";
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      const err = new Error("Request body too large");
      err.statusCode = 413;
      throw err;
    }
    body += chunk;
  }
  return body;
}

function tgifSlot(timeslot) {
  // TS1 = 1 -> API slot 0, TS2 = 2 -> API slot 1
  const ts = Math.max(1, Math.min(2, parseInt(timeslot, 10) || 2));
  return ts - 1;
}

async function handleApi(req, res, parsed) {
  const p = parsed.pathname ?? "";
  const query = parsed.query;
  const method = req.method;

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    // --- TGIF ---
    if (p === "/api/tgif/status" && method === "GET") {
      const data = await fetchJson(`${TGIF_BASE}/api/sessions`, { timeout: 10000 });
      const dmrId = getDmrId();
      let session = null;
      if (Array.isArray(data?.sessions)) {
        session = data.sessions.find((s) => String(s?.repeater_id) === String(dmrId));
      }
      const out = {
        dmrId,
        connected: !!session,
        slot1: session ? (session.tg0 === UNLINK_TG ? null : session.tg0) : null,
        slot2: session ? (session.tg === UNLINK_TG ? null : session.tg) : null,
      };
      res.writeHead(200);
      res.end(JSON.stringify(out));
      return;
    }

    if (p === "/api/tgif/link" && method === "POST") {
      const body = await readBody(req);
      let parsed;
      try {
        parsed = JSON.parse(body || "{}");
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const { tg, timeslot = 2 } = parsed;
      const slot = tgifSlot(timeslot);
      const rawTg = parseInt(tg, 10);
      const targetTg = (Number.isInteger(rawTg) && rawTg >= 1 && rawTg <= 99999999) ? String(rawTg) : "777";
      const apiUrl = `${TGIF_BASE}/api/sessions/update/${getDmrId()}/${slot}/${targetTg}`;
      const tgifRes = await fetchWithTimeout(apiUrl, { method: "GET", timeout: 10000 });
      if (!tgifRes.ok) {
        throw new Error(`TGIF API returned ${tgifRes.status}`);
      }
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, tg: targetTg, slot: slot + 1 }));
      return;
    }

    if (p === "/api/tgif/unlink" && method === "POST") {
      const body = await readBody(req);
      let parsed;
      try {
        parsed = JSON.parse(body || "{}");
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const { timeslot = 2 } = parsed;
      const slot = tgifSlot(timeslot);
      const apiUrl = `${TGIF_BASE}/api/sessions/update/${getDmrId()}/${slot}/${UNLINK_TG}`;
      const tgifRes = await fetchWithTimeout(apiUrl, { method: "GET", timeout: 10000 });
      if (!tgifRes.ok) {
        throw new Error(`TGIF API returned ${tgifRes.status}`);
      }
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, slot: slot + 1 }));
      return;
    }

    // --- WPSD ---
    if (p === "/api/wpsd/last-heard" && method === "GET") {
      const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 50));
      const u = `${getWpsdBase()}/api/?limit=${limit}`;
      const data = await fetchJson(u, {
        headers: { Authorization: `Basic ${getWpsdAuth()}` },
      });
      res.writeHead(200);
      res.end(JSON.stringify(Array.isArray(data) ? data : []));
      return;
    }

    if (p === "/api/wpsd/action" && method === "POST") {
      const body = await readBody(req);
      let parsed;
      try {
        parsed = JSON.parse(body || "{}");
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const { action } = parsed;
      const allowed = [
        "reboot", "shutdown", "get_ip", "update_wpsd",
        "stop_wpsd_services", "restart_wpsd_services",
        "update_hostfiles", "reload_wifi",
      ];
      if (!allowed.includes(action)) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid action" }));
        return;
      }
      const u = `${getWpsdBase()}/admin/system_api.php?action=${encodeURIComponent(action)}&format=json`;
      const data = await fetchJson(u, {
        headers: { Authorization: `Basic ${getWpsdAuth()}` },
      });
      res.writeHead(200);
      res.end(JSON.stringify(data));
      return;
    }

    // --- Config (for IP confirmation / mobile hotspot) ---
    if (p === "/api/config" && method === "GET") {
      const base = getWpsdBase();
      let reachable = false;
      try {
        const u = `${base}/admin/system_api.php?action=get_ip&format=json`;
        await fetchJson(u, {
          headers: { Authorization: `Basic ${getWpsdAuth()}` },
          timeout: 5000,
        });
        reachable = true;
      } catch (_) {}
      res.writeHead(200);
      res.end(JSON.stringify({ wpsdHost: base, reachable }));
      return;
    }

    if (p === "/api/config" && method === "PUT") {
      const body = await readBody(req);
      let parsed;
      try {
        parsed = JSON.parse(body || "{}");
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }
      const { wpsdHost } = parsed;
      if (!wpsdHost || typeof wpsdHost !== "string") {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "wpsdHost required" }));
        return;
      }
      const host = wpsdHost.trim().replace(/\/+$/, "");
      if (!host.startsWith("http://") && !host.startsWith("https://")) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "wpsdHost must start with http:// or https://" }));
        return;
      }
      const newConfig = {
        ...config,
        wpsd: { ...(config.wpsd || {}), host },
      };
      try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), "utf8");
      } catch (writeErr) {
        console.error("Config write failed:", writeErr);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Failed to save config" }));
        return;
      }
      config = newConfig;
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, wpsdHost: host }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (err) {
    console.error(err);
    const status = err.statusCode === 413 ? 413 : 500;
    res.writeHead(status);
    res.end(JSON.stringify({ error: String(err.message || err) }));
  }
}

function serveStatic(req, res, filePath) {
  const ext = path.extname(filePath);
  const types = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".ico": "image/x-icon",
  };
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.setHeader("Content-Type", types[ext] || "application/octet-stream");
    res.writeHead(200);
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const p = parsed.pathname ?? "";

  if (p.startsWith("/api/")) {
    await handleApi(req, res, parsed);
    return;
  }

  const publicDir = path.resolve(__dirname, "public");
  const requested = p === "/" || p === "" ? "index.html" : path.normalize(p).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.resolve(publicDir, requested);
  if (filePath !== publicDir && !filePath.startsWith(publicDir + path.sep)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  serveStatic(req, res, filePath);
});

async function checkWpsdReachable() {
  const base = getWpsdBase();
  try {
    const u = `${base}/admin/system_api.php?action=get_ip&format=json`;
    const res = await fetchWithTimeout(u, {
      headers: { Authorization: `Basic ${getWpsdAuth()}` },
      timeout: 5000,
    });
    if (res.ok) {
      console.log(`[OK] WPSD reachable at ${base}`);
    } else {
      console.warn(`[!] WPSD at ${base} returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn(`[!] WPSD not reachable at ${base}`);
    console.warn(`    Use Settings in the UI to update the IP when on mobile hotspot.`);
  }
}

server.listen(PORT, HOST, () => {
  console.log(`WPSD Quick Admin listening on http://${HOST}:${PORT}`);
  console.log(`Open from PC: http://localhost:${PORT}`);
  console.log(`Open from LAN: http://<your-pc-ip>:${PORT}`);
  checkWpsdReachable();
});
