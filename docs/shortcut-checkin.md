# Apple Shortcut: nightly Check-in sync (steps + sleep)

Tap-by-tap build guide for the on-phone bridge from ADR 0003 — a Shortcuts automation
that reads **today's steps** and **last night's sleep** from Apple Health and POSTs them
to `POST /api/checkin` every evening. `feel` stays human: the Watch can't know how the
day felt in the body, so the app keeps asking only that.

Written against **iOS 26**; shipped and verified against real Watch data 2026-07-12.
Background research: [research/shortcuts-healthkit-actions.md](research/shortcuts-healthkit-actions.md).

**Design notes baked into this shortcut:**
- It sends **two separate POSTs** (steps, then sleep), each guarded by "only if the
  number is > 0". The endpoint merges by date, so a partial send is always safe, and a
  failed Health read never overwrites good data with zeros.
- Sleep is the **asleep stages only** (everything that isn't "In Bed" or "Awake" —
  i.e. Core + Deep + REM) from samples whose **End Date is today** — every sample of
  last night's sleep *ended* this morning, including any chunk that started before
  midnight.
- ⚠️ **Do not "improve" the sleep query with an hour-precise date window.** The Find
  Health Samples date filters are **day-granular**: an "is between [yesterday 18:00]
  and [today 12:00]" filter silently collapses to whole days ([start-day 00:00,
  end-day 00:00)), which drops any post-midnight sleep and returns the *previous*
  night instead. Found the hard way, verified empirically 2026-07-12 — see the
  research doc's correction. Anchoring on `End Date is today` sidesteps day
  granularity entirely.
- **If the phone is locked when the automation fires, the Health reads fail** — that's an
  Apple privacy guarantee, not a bug. The automation keeps *Notify When Run* on, so a
  locked run shows a banner; tapping it runs the sync unlocked. A missed night is fine:
  Check-ins are bonus-only.

---

## Part 1 — Build the shortcut

Shortcuts app → **+** (new shortcut) → rename it **Check-in Sync** (tap the title → Rename).

Add actions in this order (tap **Add Action** / the search bar and type the name):

### The date (action 1)

1. **Format Date** — set *Date* to **Current Date**; tap *Date Format* → **Custom** →
   format string exactly `yyyy-MM-dd`.

### Steps (actions 2–4)

> ⚠️ **Known overcount — superseded by ADR 0004.** This sum-all-samples query counts
> iPhone and Watch overlap twice (posted 12,000 vs Fitness 11,119 on 2026-07-11).
> The replacement design POSTs per-source hourly dumps to `/api/checkin/steps` and
> lets the server merge them (see docs/adr/0004); the tap-by-tap rebuild guide for
> that Shortcut hasn't been written yet. Until then these actions still work — they
> just read a little high on days you carry the phone and wear the Watch together.

2. **Find Health Samples** — it renders as "Find All Health Samples where…":
   - *Sample Type* (tap "All Health Samples") → **Steps**
   - **Add Filter** → **Start Date** · **is today**
   - Delete any auto-added empty "Value is anything" filter row (tap its ⊖).
   - *Sort by* → None; **Limit** *off*; **Group Samples by** → **Day** (big speed-up),
     and turn the **Fill Missing** toggle that appears *off*.
   - ⚠️ If the action shows "Filter Health Samples" instead of "Find All…", it grabbed an
     input from a previous action — tap the input variable and clear it.
3. **Calculate Statistics** — *Operation* → **Sum**, *Input* → the **Health Samples**
   magic variable from action 2. This is today's step total.
4. **If** — *Input* → the **Sum** from action 3 · *Condition* →
   **is greater than** · `0`. Then, **inside the If** (before "Otherwise"):
   - **Get Contents of URL**:
     - URL: `https://selfcarecentre.tyrion.uk/api/checkin`
     - Tap **Show More** → *Method* → **POST**
     - **Headers** → add one: key `X-Checkin-Token`, value = paste the token
     - **Request Body** → **JSON** → add two fields:
       - `date` · type **Text** · value = the **Formatted Date** variable (action 1)
       - `steps` · type **Number** · value = the **Sum** variable (action 3)
   - You can delete the empty **Otherwise** branch (tap its ✕) or leave it.

### Sleep (actions 5–9)

5. **Find Health Samples**:
   - *Sample Type* → **Sleep** (this is Sleep Analysis; do *not* pick "Sleep Changes")
   - **Add Filter** → **End Date** · **is today** — end date, not start date: it's the
     one filter that captures the whole night at day granularity (see design notes)
   - **Add Filter** → **Value** · **is not** · type `In Bed` (free text, capitals as shown)
   - **Add Filter** → **Value** · **is not** · type `Awake`
   - **Limit** *off*, no grouping.
6. **Repeat with Each** — *Input* → the **Health Samples** from action 5. Inside the loop:
   - **Get Time Between Dates** — careful with the three slots: the slot right after
     "Get" is the **unit** → **Minutes** (minutes, not hours — the action rounds, so
     summing minutes limits the error; expect the night's total to come out ~10 min
     under Health's figure from per-sample rounding). Then *from* → **Repeat Item** →
     tap the inserted token → pick **Start Date**; *to* → **Repeat Item → End Date**.
   - Nothing else in the loop; its output ("Repeat Results") collects each sample's
     minutes.
7. **Calculate Statistics** — **Sum** of **Repeat Results**. This is total sleep minutes.
8. **Calculate** — [Sum from action 7] **÷** `60`. This is sleep in hours (the
   server rounds to 1 decimal place).
9. **If** — [Sum from action 7, or the Calculation Result — either works]
   **is greater than** `0`, inside:
   - **Get Contents of URL** — same URL, POST, same `X-Checkin-Token` header;
     **Request Body JSON** fields:
     - `date` · **Text** · [Formatted Date]
     - `sleepHours` · **Number** · [Calculation Result from action 8]

### A gentle receipt (action 10, optional)

10. **Show Notification** — title `Checked in ✓`, body e.g.
    `[Sum (steps)] steps · [Calculation Result]h sleep`. Purely informational —
    no goals, no colours, in keeping with the app's no-judgement rule.

## Part 2 — First manual run

Tap **▶** at the bottom of the editor.

- First run, iOS asks Shortcuts for **Health access** — allow **Steps** and
  **Sleep** (toggle both on → Allow).
- First run may also ask to allow connecting to **selfcarecentre.tyrion.uk** — Allow.
- You should get the "Checked in ✓" notification with plausible numbers. Compare the
  sleep figure against Health → Browse → Sleep for last night; within ~15 minutes of
  the "time asleep" number (not "in bed") is a pass — see the rounding note above.
- Steps can read lower than the Health app right after activity: the Watch trickles
  steps to the phone with a lag. By evening it converges.

Then confirm the server got it — the app's **Progress tab** strip, or from a computer
(token on the clipboard, so it stays out of shell history):

```
curl -s "https://selfcarecentre.tyrion.uk/api/checkins?days=2" -H "X-Checkin-Token: $(pbpaste)"
```

## Part 3 — The nightly automation

Shortcuts app → **Automation** tab → **+**:

1. **Time of Day** → **21:45** → **Daily** → Next.
   (21:45 sits just after the 21:00 PM-skincare reminder — the phone is most likely in
   hand and *unlocked*, which the Health reads require.)
2. Pick **Check-in Sync**.
3. **Run Immediately** (not "Run After Confirmation").
4. Leave **Notify When Run** **ON** — this is deliberate: if the phone happens to be
   locked at 21:45 the reads fail, and the banner is the recovery path (tap → it reruns
   unlocked). Manual re-run any time from the shortcut itself also works.

## Debugging with a decoded shortcut

A trick that cracked the day-granularity bug, far better than debugging via screenshots:
share the shortcut as an iCloud link, then on a Mac fetch
`https://www.icloud.com/shortcuts/api/records/<id>` — the JSON's
`fields.shortcut.value.downloadURL` serves the raw plist (`plutil -convert xml1`),
showing every filter operator and which block each variable actually points to. The
reverse also works: edit the plist, `shortcuts sign --input … --output …`, and open the
signed file to import it. ⚠️ The plist contains the `X-Checkin-Token` header, and iCloud
share links can't be revoked — **rotate the token after sharing one**.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Sleep number matches the *previous* night / seems a day behind | A date filter got rebuilt as an hour-precise "is between" window — day granularity clips post-midnight sleep. Use **End Date · is today** (see design notes). |
| Notification shows steps but no sleep (or `0h`) | Check the End Date filter and both Value filters; confirm the Watch actually tracked last night (Health → Sleep). |
| Sleep number way too big (≈ whole night in bed) | An "In Bed" filter is missing/wrong — In Bed must be excluded, and never added on top of stages (double-counts). |
| Sleep ~10–15 min under Health's figure | Normal: Get Time Between Dates rounds each sample to whole minutes. Harmless for a gentle reference. |
| No "is not" operator on the Value filter | Fallback: drop both Value filters; inside the Repeat wrap Get Time Between Dates in two nested **If**s (If Value is not `In Bed` → If Value is not `Awake` → measure). |
| Nothing arrives on the server; red error on Get Contents of URL | 401 = token typo in the header (key must be exactly `X-Checkin-Token`). 400 = a body field has the wrong type — `steps`/`sleepHours` must be **Number**, `date` **Text** `yyyy-MM-dd`. |
| Automation "ran" at 21:45 but no notification / no data | Phone was locked — HealthKit refuses reads on a locked device (Apple privacy guarantee; no setting overrides it). Tap the automation banner, or run the shortcut manually. The guards mean nothing wrong was written. |
| Automation doesn't fire at all some nights | A Focus (especially Sleep Focus) can suppress time-of-day automations — check Focus schedules if 21:45 ever falls inside one. |
| Wrong date on the entry | The `date` field must be the phone's local date via Format Date `yyyy-MM-dd` — don't hand-type a date, and don't use any UTC/ISO variant (app timezone is Europe/London). |

Manual entries and the shortcut coexist safely: the server merges per-field by date, so
the shortcut's steps/sleep never touch a hand-entered `feel`, and re-runs just overwrite
steps/sleep with fresher numbers.
