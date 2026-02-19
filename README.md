# WPSD-Dashboard

**WPSD Quick Admin** – A lightweight local dashboard for controlling your WPSD hotspot and TGIF talkgroups without logging into the full admin console.

## Features

- **TGIF Manager** – Link/unlink talkgroups (TG 777 “Parrot” preset, custom TG, TS1/TS2)
- **Admin Actions** – Restart/stop services, WPSD update, hostfiles update, reload Wi‑Fi, reboot, shutdown
- **Last Heard** – Recent transmissions from your hotspot
- **LAN Access** – Use from phone or tablet on your network

## Requirements

- Node.js 18 or later
- Your PC and hotspot on the same LAN
- Hotspot IP reachable from your PC (default: 192.168.5.82)

## Quick Start

1. Copy `config.example.json` to `config.json` and edit with your hotspot IP, credentials, and DMR ID.

2. Start the service. At startup, the server checks whether the WPSD is reachable and logs the result:
   ```bash
   npm start
   ```

3. Open in a browser:
   - **PC:** http://localhost:3456
   - **Phone/Tablet:** http://\<your-pc-ip\>:3456

## Config (`config.json`)

| Setting        | Description                          | Default       |
|----------------|--------------------------------------|---------------|
| `wpsd.host`    | Hotspot base URL                     | http://192.168.5.82 |
| `wpsd.username`| WPSD login                           | pi-star       |
| `wpsd.password`| WPSD password                        | raspberry     |
| `tgif.dmrId`   | Hotspot DMR ID for TGIF              | 3221205       |
| `server.port`  | Port for the quick admin server      | 3456          |
| `server.host`  | Bind address (0.0.0.0 = all LAN)     | 0.0.0.0       |

## Mobile Hotspot / IP Confirmation

When using a mobile hotspot, the WPSD may get a different IP from DHCP. Use the **Settings – WPSD Host** section in the UI to:

1. See the current IP and reachability (Test).
2. Update the IP and click **Update** to save (no restart required).

The server checks reachability at startup and logs whether the WPSD is reachable.

## TGIF Talkgroups

- **Link 777 (Parrot)** – Connects to Parrot TG; when someone stops transmitting, it moves to the next transmission.
- **Unlink** – Sets the selected timeslot back to unlinked (TG 4000).
- **Custom TG** – Enter any TG number and click Link.

## Security

- Credentials are stored only in `config.json` on your PC (not committed; see `config.example.json`).
- The helper service listens on the LAN; keep your network trusted.
- Reboot and shutdown require confirmation.

## License

MIT
