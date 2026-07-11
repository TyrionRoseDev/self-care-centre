# Real web push from v1, via a companion service on Coolify

Reminders are core to the owner actually sticking to the routine, so notifications must
fire even when the app is closed. That is impossible from a purely static file — it needs
something running to send on schedule. The owner hosts on a **VPS with Coolify** (can run
always-on Docker services and cron), which makes real Web Push viable.

**Decision:** Build Web Push into v1. The frontend gains a **service worker**, and the
app is served by a **single Node server** (`server.js`) that also exposes the push API
(`/api/subscribe` etc.) and runs the cron schedule (workouts Tue/Thu 19:00 & Sun 17:00,
skincare AM/PM, protein). The owner explicitly wanted **one deployment, not two**, so the
push backend is folded into the app's own server rather than a separate companion service
— same origin, so no CORS and nothing extra to host. Rejected: (a) the phased
calendar-`.ics` stopgap, and (b) a standalone companion push service (the first cut),
which was a second Coolify resource for no benefit once the app is already a server.

**Consequences:** The app is no longer a purely static file — it's a Node/Express server
(Dockerfile build on Coolify) that serves the built `index.html` + `sw.js` and sends
pushes. `PUSH_CONFIG.apiBase` stays empty (same origin); `vapidPublicKey` must match the
server's `VAPID_PUBLIC`. Subscriptions persist on a `/data` volume. On iOS, push only
works once the app is added to the Home Screen (iOS 16.4+) — the existing PWA
manifest/icons already cover that. See DEPLOY.md.
