# WPSD Dashboard

Next-generation interface for W0CHP Digital Voice Hotspot control and monitoring. Parses MMDVMHost logs, displays system stats, and manages configuration.

## Features

- **Cockpit View** – Current mode, last caller, BER, CPU temp above the fold
- **Live Traffic** – Virtualized list of parsed MMDVM log entries (DMR, D-Star, YSF, P25)
- **System Status** – CPU load, temperature, disk, memory, uptime
- **MMDVM Config** – Edit callsign, frequency (mmdvmhost.ini)
- **TGIF Manager** – Link/unlink talkgroups (TG 777 Parrot, custom TG, TS1/TS2)
- **Admin Actions** – Restart/stop services, WPSD update, hostfiles, Wi-Fi, reboot, shutdown
- **Settings** – Update hotspot IP (mobile hotspot friendly)

## Requirements

- Node.js 18+
- Your PC and hotspot on the same LAN
- Hotspot IP reachable from your PC (default: 192.168.5.82)
- For MMDVM log parsing and config: Pi-Star or similar with `/var/log/pi-star/` and `/etc/mmdvmhost`

## Quick Start

1. Copy `config.example.json` to `config.json` and edit with your hotspot IP, credentials, and DMR ID.

2. **Optional one-shot script:** From the project root run `.\scripts\run-all.ps1` (PowerShell). It installs dependencies, builds backend and frontend, lints the frontend, and runs smoke tests if the backend is already running. Use `-SkipInstall` to skip install, `-SkipSmoke` to skip smoke tests.

3. Install dependencies (once, if not using the script):
   ```bash
   npm run install:all
   ```
   Or install manually: `npm install` in the project root, then in `backend/`, then in `frontend/`.

4. Start the app (backend + frontend together):
   ```bash
   npm run dev
   ```
   This starts the backend on port **3456** and the Next.js frontend on port **3000**. Open **http://localhost:3000** in your browser.

   To run only one process: `npm run backend` or `npm run frontend`.

5. **URLs**
   - **App (use this):** http://localhost:3000  
   - **Backend API:** http://localhost:3456  

The frontend proxies `/api/*` to the backend in development.

## Project Structure

```
WPSD-Dashboard/
├── backend/           # Express API bridge (log parsers, system stats, TGIF/WPSD proxy)
├── frontend/          # Next.js 14, React, Tailwind, Shadcn-style UI
├── shared/            # Shared TypeScript types
├── config.json        # Runtime config (gitignored)
└── config.example.json
```

## Using real data

- **Live traffic from MMDVM logs**  
  The backend reads `MMDVM-YYYY-MM-DD.log` from `paths.logDir`. To use real logs:
  1. **Run the backend on Pi-Star** (e.g. on the same Raspberry Pi as your hotspot). Then `/var/log/pi-star` exists and logs are used automatically.
  2. **Or point to a copy of the logs** on your PC: put MMDVM log files in a folder, then set that folder in `config.json` under `paths.logDir`, or set the env var when starting the backend:
     ```bash
     MMDVM_LOG_DIR=/path/to/folder/with/MMDVM-logs npm run backend
     ```
     The folder should contain files like `MMDVM-2025-02-19.log` (same format as Pi-Star).

- **When the log directory is missing** (e.g. backend on a Mac, no log path set), live traffic from logs is empty. The app still shows **real hotspot activity** via **WPSD Last Heard** (dashboard and Live Traffic page use it as a fallback when the log feed is empty). Set `wpsd.host` to your hotspot base URL (e.g. `http://192.168.5.82`). That is the same host as the device’s **Live** view (e.g. `http://192.168.5.82/live/`); the dashboard uses the same last-heard data source.

## Config (`config.json`)

When running the backend from compiled output (e.g. `node backend/dist/server.js`), `config.json` is read from the **project root** (the directory that contains the `backend/` folder). Keep `config.json` there so the backend can find it.

| Setting | Description | Default |
|---------|-------------|---------|
| `wpsd.host` | Hotspot base URL | http://192.168.5.82 |
| `wpsd.username` | WPSD login | pi-star |
| `wpsd.password` | WPSD password | raspberry |
| `tgif.dmrId` | Hotspot DMR ID for TGIF | 3221205 |
| `server.port` | Backend port | 3456 |
| `paths.logDir` | MMDVM log directory (or set `MMDVM_LOG_DIR` env) | /var/log/pi-star |
| `paths.mmdvmIni` | MMDVM ini file path | /etc/mmdvmhost |

### TGIF link/unlink and status

TGIF link/unlink work **exclusively through your hotspot**: the dashboard sends requests to your hotspot's admin page (`tgif_manager.php` — same as the TGIF Manager in the browser), and the hotspot talks to TGIF.

Slot status (TS1/TS2) is read from the hotspot's `tgif_links.php` page. If the hotspot's TGIF page can't reach the TGIF server, slots may show "None", but link/unlink still work.

- In `config.json`, set `tgif.dmrId` to your hotspot's DMR ID (same as in Pi-Star DMR settings).
- Ensure `wpsd.host`, `wpsd.username`, and `wpsd.password` are correct so the backend can reach the hotspot admin (same URL you use for TGIF Manager in the browser).
- To confirm which URLs the backend uses, open **GET /api/tgif/info** (e.g. `http://localhost:3456/api/tgif/info`) in a browser; it returns `dmrId`, `wpsdProxyUrl`, and `statusUrl`.

See [docs/TGIF_API_RESEARCH.md](docs/TGIF_API_RESEARCH.md) for background.

## Legacy Quick Admin

The original single-file quick admin (`server.js` + `public/index.html`) is still present. Run with:

```bash
npm start
```

This serves the legacy UI on port 3456 without the Next.js frontend.

**Note:** The legacy app now uses the same hotspot proxy as the main app for TGIF (tgif_manager.php, tgif_links.php). For the full UI, use the main app (`npm run dev` and open http://localhost:3000).

## Production

- **Build:** From the project root run `npm run build` (builds backend and frontend). The frontend output is in `frontend/.next`; the backend is in `backend/dist`.
- **Run:** Start the backend with `npm run backend` (or `node backend/dist/server.js` with `config.json` in place). Serve the frontend with `npm run frontend` (or `cd frontend && npm run start` after build). Keep `config.json` on the server; it is gitignored.
- **Single port (optional):** You can serve the built frontend from the Express backend or from a reverse proxy (e.g. nginx) so one port serves both API and static files.

## PWA / Quick page

The **Quick** page (`/quick`) is intended for drive mode: big “Link 777” and Unlink. The app includes a PWA manifest with `start_url` set to `/quick`. Install the app on your phone from the browser (e.g. “Add to Home Screen”) and open it to get the quick TGIF panel without the full dashboard.

## Running the backend on Pi-Star

To use real MMDVM logs and optional local config, run the backend on the same Raspberry Pi as your hotspot (e.g. on Pi-Star). Set `paths.logDir` to `/var/log/pi-star` and `paths.mmdvmIni` to `/etc/mmdvmhost` in `config.json`. Run the backend there and point your browser (or phone) at the machine’s IP (e.g. `http://192.168.5.82:3456` for API). You can run the frontend on your PC and set the API base to the Pi’s IP, or serve the built frontend from the Pi.

## License

MIT
