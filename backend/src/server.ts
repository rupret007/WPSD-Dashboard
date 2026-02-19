import http from "http";
import { getConfig } from "./config";
import { startBackend } from "./app";

async function checkWpsdReachable(): Promise<void> {
  const cfg = getConfig();
  const base = (cfg.wpsd?.host ?? "http://192.168.5.82").replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/admin/system_api.php?action=get_ip&format=json`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${cfg.wpsd?.username ?? "pi-star"}:${cfg.wpsd?.password ?? "raspberry"}`).toString("base64")}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      console.log(`[OK] WPSD reachable at ${base}`);
    } else {
      console.warn(`[!] WPSD at ${base} returned HTTP ${res.status}`);
    }
  } catch {
    console.warn(`[!] WPSD not reachable at ${base}`);
    console.warn(`    Use Settings in the UI to update the IP when on mobile hotspot.`);
  }
}

const app = startBackend();
const server = http.createServer(app);
const cfg = getConfig();
const PORT = Number(cfg.server?.port) ?? 3456;
const HOST = cfg.server?.host ?? "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`WPSD Dashboard backend listening on http://${HOST}:${PORT}`);
  console.log(`Open from PC: http://localhost:${PORT}`);
  console.log(`Open from LAN: http://<your-pc-ip>:${PORT}`);
  checkWpsdReachable();
});
