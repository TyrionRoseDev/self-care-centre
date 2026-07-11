# Deploy (one deployment)

The app and its reminder sender are a single Node server (`server.js`) — it serves
the static app **and** runs the web-push schedule on the same origin. So there's
just one Coolify resource to configure.

## Reconfigure your existing Coolify app

1. Open your **Self-Care Centre** app in Coolify.
2. **Build Pack → Dockerfile** (the repo now has a root `Dockerfile`). Save.
3. **Ports Exposes → `8080`**.
4. **Environment Variables** (bulk/raw paste):
   ```
   VAPID_PUBLIC=<the public key — must match PUSH_CONFIG in build/core.js>
   VAPID_PRIVATE=<the private key — keep secret>
   VAPID_SUBJECT=mailto:euanmorgan48@gmail.com
   TZ=Europe/London
   ADMIN_TOKEN=<any random string>
   DATA_DIR=/data
   PORT=8080
   ```
5. **Persistent Storage → add a Volume mounted at `/data`** (keeps your phone's
   subscription across restarts).
6. Keep the domain as **https://selfcarecentre.tyrion.uk**.
7. **Deploy.** Then open **https://selfcarecentre.tyrion.uk/api/health** — you want
   `{"ok":true,"push":true,...}`. (`push:false` means the VAPID env vars are missing.)

## Turn reminders on (iPhone)

1. Open the app in Safari → **Share → Add to Home Screen**.
2. Open it **from the Home Screen icon**.
3. Gear → **Reminders → Turn on reminders → Allow**.

Test buzz:
```
curl -X POST https://selfcarecentre.tyrion.uk/api/test -H "X-Admin-Token: <ADMIN_TOKEN>"
```

## Reminder times

Edit the `SCHEDULE` array in `server.js`. Currently: AM skincare 08:00, protein
12:00, workouts Tue/Thu 19:00, Sunday 17:00, PM skincare 21:00 (Europe/London).
