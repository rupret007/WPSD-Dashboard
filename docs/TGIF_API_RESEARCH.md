# TGIF API – Research Summary (background only)

**This app does not call any direct TGIF API.** All TGIF link/unlink and status go through your hotspot (tgif_manager.php, tgif_links.php). This document is kept for background on why the direct API is not used.

## 1. Historical “sessions” API (deprecated / not used by this app)

Some Pi-Star/WPSD code (e.g. Pi-Star_DV_Dash, W0CHP PR #120) used a direct “sessions” API. That API is deprecated and returns 404 from the public internet. This dashboard does not use it.

- **List sessions**: was GET to a sessions endpoint.
- **Link / Unlink**: was GET to an update endpoint with dmrId, slot (0=TS1, 1=TS2), and target TG (4000 = unlink).
- **Source**: Pi-Star_DV_Dash `tgif_links.php` and `tgif_manager.php` (see References below).

## 2. Why we use the hotspot only

- The direct sessions API is deprecated and often returns 404.
- TGIF moved to a new platform with no public API documented.
- The hotspot’s PHP (tgif_manager.php, tgif_links.php) may still call the old API from the Pi’s network; the dashboard never calls it directly.

## 3. Current approach: hotspot-only

- **Link/unlink**: Backend POSTs to the hotspot’s `mmdvmhost/tgif_manager.php` with the same form fields the admin page uses. No direct TGIF API calls from the dashboard.
- **Status (TS1/TS2)**: Backend GETs the hotspot’s `mmdvmhost/tgif_links.php` and parses the HTML for slot values. If the hotspot can reach the TGIF server, real slot data is shown; otherwise slots show "None."
- **Config**: Only `tgif.dmrId` is needed. `GET /api/tgif/info` returns the `wpsdProxyUrl` and `statusUrl` the backend uses.

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
