# Steps arrive as per-source hourly dumps; the server replicates Health's merge

Status: accepted (merge rule to be picked empirically — see below)

The Check-in bridge's obvious steps query — sum all step samples for the day — **overcounts**
(posted 12,000 vs Fitness 11,119 on 2026-07-11): iPhone and Watch both record overlapping
steps, and only Health's *display* de-dupes them by taking the prioritized source per
overlapping time-slice. No Shortcuts/HealthKit surface exposes that de-duplicated total,
so anything that wants the Fitness number must rebuild the merge itself. Simpler
approximations were rejected by the owner: Watch-only filtering loses phone-only days;
max-of-two-day-totals undercounts "Watch died mid-day" mixed days. Her spec: match the
Fitness number on every realistic day pattern, and where exact parity is impossible,
**undercount rather than inflate**.

**Decision:** the merge runs **server-side**, not in the Shortcut. The Shortcut does two
dumb per-source Finds (Watch, iPhone) grouped by hour and POSTs both datasets to a new
adapter route `POST /api/checkin/steps` (same `X-Checkin-Token`); the server computes the
merged daily total and upserts plain `{steps}` into `checkins.json` exactly as if it had
been posted to `/api/checkin`. Merge logic in `server.js` is versioned, unit-testable and
fixable with a git push; every tweak to Shortcut logic instead costs a
regenerate → sign → delete-old → reimport → re-point-automations cycle, and Shortcuts has
repeatedly defied its documentation (day-granular date filters), so we keep as little
logic there as possible. This is deliberately an **adapter in front of the same store**,
not a second store: ADR 0003's "bridge POSTs, server stores" contract is unchanged, and a
future Health-Auto-Export adapter would follow the same pattern.

**Wire format:** each source is a text field of newline-separated `count|bucketStartISO`
lines — the format the sleep dump proved Shortcuts can serialize, unlike JSON arrays from
Repeat Results (unverified). Self-describing timestamps let the server drop buckets that
fall outside the claimed date instead of trusting the phone's filters.

**Consequences:**

- The server gains its first *data-processing* responsibility (previously it only stored
  what it was given). Hourly step counts cross the wire but are **not persisted** — the
  adapter stores only the merged total (indistinguishable from a manual entry) and
  `console.log`s per-source totals for ephemeral debugging. Hour-by-hour movement data is
  far more revealing than a daily total and does not belong permanently on a public URL.
- **Locked-phone guard:** HealthKit returns nothing while the iPhone is locked (ADR 0003)
  and the trigger fires many times a day, so *both sources empty* → 400, write nothing —
  never wipe a good value with 0. *One* source empty is a valid day (phone-only days are
  why Watch-only filtering was rejected).
- The per-hour merge rule (per-hour max vs Watch-if-present-else-phone) is a genuine
  approximation of Health's finer-grained algorithm; each candidate fails a different
  realistic day. Both are implemented behind one pure function and the winner is picked
  by replaying real per-source dumps against the Fitness app's actual figure. Tie-break:
  the rule that never exceeds Fitness wins (never-inflate).
- Standing contingency: this all assumes `Group Samples by Hour` composes with a
  `Source is` filter on-device — unverified at decision time. If the dump shortcut
  disproves it, this ADR gets superseded, not silently ignored.
