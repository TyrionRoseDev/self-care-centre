# Real web push from v1, via a companion service on Coolify

Reminders are core to the owner actually sticking to the routine, so notifications must
fire even when the app is closed. That is impossible from a purely static file — it needs
something running to send on schedule. The owner hosts on a **VPS with Coolify** (can run
always-on Docker services and cron), which makes real Web Push viable.

**Decision:** Build Web Push into v1. The static frontend gains a **service worker**; a
small **companion push service** deployed as a separate Coolify app stores the push
subscription (VAPID keys) and runs a scheduler that sends notifications at the configured
times (weekday Sessions ~18:30, Sunday Session, skincare AM/PM). Rejected the phased
alternative (calendar-reminder `.ics` in v1, push later) — the owner wants proper native
push now and already has the backend-capable infra, so there's no reason to ship a
stopgap.

**Consequences:** This introduces the app's **first backend component**, amending
ADR-0001's "emits one static file": the *frontend* is still one static file, but the
system now also includes a service worker and a companion push service. On iOS, push only
works once the app is added to the home screen (iOS 16.4+) — the existing PWA
manifest/icons already cover the install requirement.
