# Ritual push-service

A tiny always-on service that sends your phone reminders for your workouts,
skincare and protein — even when the app is closed. It stores one thing (your
push subscription) and runs a schedule.

The main app works fully **without** this. Reminders are the only feature that
needs it, because a static site can't send a notification on a timer by itself.

## What it does

- `POST /subscribe` — the app sends this device's push subscription here.
- Runs a cron schedule (see `SCHEDULE` in `server.js`) that pushes reminders:
  - 08:00 daily — Morning skincare
  - 12:00 daily — Protein
  - Tue & Thu 19:00 — Workout
  - Sun 17:00 — Sunday session
  - 21:00 daily — Evening skincare
- `GET /health`, `POST /unsubscribe`, `POST /test`, `POST /send` (admin).

Edit the copy or times freely in the `SCHEDULE` array in `server.js`.

## Deploy on Coolify (once)

1. **Generate your VAPID keys** (the app's push credentials). Locally, in this
   folder: `npm install && npm run vapid`. Copy the two lines it prints.
   *(Or just deploy first and read them from the container logs on first boot —
   but keys generated at boot are temporary, so set them as env vars below.)*

2. **New Resource → Docker/Dockerfile**, pointed at this `push-service/` folder
   (same Git repo, base directory `push-service`).

3. **Environment variables** (from `.env.example`):
   - `VAPID_PUBLIC`, `VAPID_PRIVATE` — the pair from step 1.
   - `VAPID_SUBJECT` — `mailto:` you@…
   - `ALLOW_ORIGIN` — your app's origin, e.g. `https://ritual.yourdomain.com`.
   - `TZ` — `Europe/London`.
   - `ADMIN_TOKEN` — any random string (protects `/test` and `/send`).

4. **Persistent storage** — add a volume mounted at `/data` so your
   subscription survives redeploys.

5. **Domain** — give it a URL, e.g. `https://ritual-push.yourdomain.com`. Deploy.
   Check `https://…/health` returns `{"ok":true}`.

## Connect the app

In `build/core.js`, fill in `PUSH_CONFIG`:

```js
const PUSH_CONFIG = {
  apiBase: "https://ritual-push.yourdomain.com",
  vapidPublicKey: "<the VAPID_PUBLIC key>",
};
```

Then `node build/build.js` and redeploy the app.

## Turn it on (per device)

Web push on iPhone only works from an installed app:

1. Open the app in Safari → **Share → Add to Home Screen**.
2. Open it **from the Home Screen icon** (not Safari).
3. Go to the gear → **Reminders → Turn on reminders**, and allow notifications.

Test it: `curl -X POST https://ritual-push.yourdomain.com/test -H "X-Admin-Token: <ADMIN_TOKEN>"`
— your phone should buzz.
