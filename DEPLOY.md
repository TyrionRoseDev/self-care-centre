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
   CHECKIN_TOKEN=<a different random string — protects your nightly check-ins>
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

## Check-ins (steps · sleep · feel)

1. Set `CHECKIN_TOKEN` in Coolify (above) and redeploy.
2. In the app: gear → **Check-ins → paste the token → Save token**. Done — nightly
   Check-ins now back up to the server (`/data/checkins.json`).
3. An Apple Shortcut (or Health Auto Export) can POST the same data
   automatically: `POST /api/checkin` with header `X-Checkin-Token: <token>` and JSON
   body `{"date":"YYYY-MM-DD","steps":6240,"sleepHours":7.5,"feel":4}` — any subset of
   the three fields is fine. See docs/adr/0003, and **docs/shortcut-checkin.md** for
   the tap-by-tap Shortcut build guide.
4. Steps have a dedicated adapter, because summing raw HealthKit samples overcounts
   (iPhone + Watch overlap): `POST /api/checkin/steps` with the same token header and
   JSON body `{"date":"YYYY-MM-DD","watch":"<dump>","phone":"<dump>"}`, where each dump
   is newline-separated `count|bucketStartISO` lines (one per hour, per source). The
   server merges the two sources and stores only the daily total. The default rule
   trusts the Watch for any hour it recorded (never-inflate); set
   `STEPS_MERGE_RULE=hourly-max` to take the larger source per hour instead — the
   server logs both rules' answers on every POST so they can be compared against
   the Fitness figure (see docs/adr/0004). If both dumps are empty the POST is
   rejected and nothing is overwritten — that's the locked-phone guard, not an
   error to fix.

## Reminder times

Edit the `SCHEDULE` array in `server.js`. Currently: AM skincare 08:00, protein
12:00, workouts Tue/Thu 19:00, Sunday 17:00, PM skincare 21:00 (Europe/London).
