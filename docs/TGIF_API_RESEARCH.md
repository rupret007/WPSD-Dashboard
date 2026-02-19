# TGIF API – Deep Research Summary

## 1. Canonical API (from Pi-Star_DV_Dash and W0CHP) — DEPRECATED

The **only** documented usage of the TGIF "sessions" API in the wild comes from:

- **Pi-Star DV Dashboard** (AndyTaylorTweet/Pi-Star_DV_Dash)
- **W0CHP** (same author as WPSD) in [issue #119](https://github.com/AndyTaylorTweet/Pi-Star_DV_Dash/issues/119) and [PR #120](https://github.com/AndyTaylorTweet/Pi-Star_DV_Dash/pull/120) (Oct 2020)

### Endpoints (historical — no longer working)

| Purpose        | Method | URL |
|----------------|--------|-----|
| List sessions  | GET    | `http://tgif.network:5040/api/sessions` |
| Link / Unlink  | GET    | `http://tgif.network:5040/api/sessions/update/{dmrId}/{slot}/{targetTg}` |

- **Slot**: 0 = TS1, 1 = TS2 (0-based in the URL).
- **Unlink**: use talkgroup `4000` (e.g. `.../update/3221205/1/4000` for TS2 unlink).
- **Response (sessions)**: JSON with a `sessions` array; each element has `repeater_id`, `tg0` (slot 1 TG), `tg` (slot 2 TG). `"4000"` means unlinked.

### Source references

- `mmdvmhost/tgif_links.php`: `file_get_contents("http://tgif.network:5040/api/sessions", ...)` and parse `$json->sessions[$session_nr]->repeater_id`, `tg0`, `tg`.
- `mmdvmhost/tgif_manager.php`: `$tgifApiUrl = "http://tgif.network:5040/api/sessions/update/".$dmrID."/".$targetSlot."/".$targetTG;` then `file_get_contents($tgifApiUrl)` (GET).

---

## 2. Why the direct API is dead

- **W0CHP (PR #120, 2020)**: *"the referenced API URL ... is seemingly deprecating and not working 50% of the time."*
- **W0CHP/WPSD README (2026)**: *"Since TGIF has moved to a new platform with no API available, this currently does not work until TGIF's API is made available."*
- **No official TGIF API docs** were found. No public changelog or "API moved" notice.
- All tested URLs (`http://tgif.network:5040/api/sessions`, `https://tgif.network/api/sessions`, `https://prime.tgif.network/api/sessions`) return **404**.
- **No known replacement public API** exists for sessions listing or programmatic link/unlink.

---

## 3. TGIF "Prime" and self-care

- **prime.tgif.network** and **tgif.network** both have web self-care (login, talkgroup management, net schedule, etc.).
- Community mentions a move from a "legacy" server to a "prime" server; no public API documentation was found for the new setup.
- **Programmatic talkgroup switch**: no documented public API for the current (Prime) web stack. Self-care is browser-based only.

---

## 4. Current approach: hotspot-only

As of Feb 2026, this dashboard works **exclusively through the hotspot**:

- **Link/unlink**: The backend POSTs to your hotspot's `mmdvmhost/tgif_manager.php` with the same form fields the admin page uses (tgifSubmit, tgifSlot, tgifNumber, tgifAction). The PHP on the hotspot calls the TGIF update endpoint (`http://tgif.network:5040/api/sessions/update/...`) from the Pi's network, where it still works. No direct TGIF API calls are made from the dashboard backend.
- **Status (TS1/TS2)**: The backend GETs your hotspot's `mmdvmhost/tgif_links.php` (with Basic auth) and parses the HTML for slot values. The PHP on the hotspot calls the TGIF sessions endpoint internally. If the Pi can reach it, real slot data is shown; otherwise slots display as "None."
- **Config**: Only `tgif.dmrId` is needed. The old `tgif.base` and `tgif.useWpsdProxy` settings are no longer used.
- **Verify**: `GET /api/tgif/info` returns the `wpsdProxyUrl` and `statusUrl` the backend uses.

---

## 5. If TGIF restores a public API

If TGIF provides a new public API in the future, the hotspot-only approach can be supplemented with direct calls. Until then, the hotspot proxy is the only reliable method.

---

## 6. References

- Pi-Star_DV_Dash TGIF issue (W0CHP): https://github.com/AndyTaylorTweet/Pi-Star_DV_Dash/issues/119
- Pi-Star_DV_Dash TGIF fix (W0CHP): https://github.com/AndyTaylorTweet/Pi-Star_DV_Dash/pull/120
- Pi-Star_DV_Dash `tgif_links.php`: https://github.com/AndyTaylorTweet/Pi-Star_DV_Dash/blob/master/mmdvmhost/tgif_links.php
- Pi-Star_DV_Dash `tgif_manager.php`: https://github.com/AndyTaylorTweet/Pi-Star_DV_Dash/blob/master/mmdvmhost/tgif_manager.php
- W0CHP-PiStar-Dash (WPSD): https://github.com/ytlzq0228/W0CHP-PiStar-Dash
- TGIF Network: https://tgif.network/ , https://prime.tgif.network/
- TGIF FAQ: https://tgif.network/faq.php
- TGIF support: support@tgif.network
