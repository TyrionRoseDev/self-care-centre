# Check-ins live server-side, filled manually or by an on-phone bridge

The owner wants nightly Check-ins (Steps, Sleep, optional Feel) fed by her Apple Watch.
The obvious design — the app reads Apple Health directly — is **impossible**: HealthKit
is a native-frameworks-only API with no web/Safari equivalent, and Apple exposes no
cloud API either, so a PWA can never see Watch data. The data only leaves the phone if
something *on the phone* sends it.

**Decision:** Check-ins are stored **server-side** (`checkins.json` on the `/data`
volume) behind a single `POST /api/checkin` + `GET /api/checkins` contract, protected by
a dedicated `CHECKIN_TOKEN` (deliberately not `ADMIN_TOKEN` — least privilege; and
deliberately not open like `/api/subscribe`, because this is health data on a public
URL). The endpoint is filled **manually first** (a Check-in card in the app), with an
on-phone bridge layered on later — a free Apple Shortcuts automation, or the paid
Health Auto Export app if the Shortcut's quirks annoy — both POSTing to the same
endpoint. Upserts merge by date and accept partial data, so a bridge that only manages
steps still counts. Rejected: (a) building a native iOS app (weeks of work for one
feature), (b) localStorage-only storage (a bridge can't write to it, and it dies with
the browser profile).

**Consequences:** This is the first personal data the server stores — previously the
`/data` volume held only push subscriptions, and all Completions/Streak data lived in
the browser. The owner must set `CHECKIN_TOKEN` in Coolify and paste it once into the
app's settings. A future reader wondering why a Shortcut POSTs health data to our own
server instead of the app "just reading Health": that path does not exist on the web
platform. One more inherent limit of the on-phone bridge: HealthKit refuses *reads*
while the iPhone is locked (verified against Apple's docs, July 2026 — see
docs/research/shortcuts-healthkit-actions.md), so a time-triggered Shortcut can
silently skip a night; the Shortcut guards against posting empty data and keeps its
"Notify When Run" banner as the recovery path. Missed nights are acceptable because
Check-ins are bonus-only. The "bridge POSTs, server stores" contract later grew one
adapter in front of the same store — steps arrive as per-source hourly dumps that the
server merges (see ADR 0004).
