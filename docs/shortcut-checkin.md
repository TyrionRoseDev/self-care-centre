# Apple Shortcut: nightly Check-in sync (steps + sleep)

Tap-by-tap build guide for the on-phone bridge from ADR 0003 — a Shortcuts automation
that reads **today's steps** and **last night's sleep** from Apple Health and POSTs them
to `POST /api/checkin` every evening. `feel` stays human: the Watch can't know how the
day felt in the body, so the app keeps asking only that.

Written against **iOS 26**. Action internals were verified July 2026 — see
[research/shortcuts-healthkit-actions.md](research/shortcuts-healthkit-actions.md) for
sources and the reasoning behind every choice below.

**Design notes baked into this shortcut:**
- It sends **two separate POSTs** (steps, then sleep), each guarded by "only if the
  number is > 0". The endpoint merges by date, so a partial send is always safe, and a
  failed Health read never overwrites good data with zeros.
- Sleep is the **asleep stages only (Core + Deep + REM)** over an 18:00-yesterday →
  noon-today window — that's the same "time asleep" number the Health app shows, and the
  window catches sleep that starts before midnight without catching afternoon naps.
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

2. **Find Health Samples** — it renders as "Find All Health Samples where…":
   - *Sample Type* (tap "All Health Samples") → **Steps**
   - **Add Filter** → **Start Date** · **is today**
   - *Sort by* → None. Tap **Show More** if needed: turn **Limit** *off*, and set
     **Group Samples by** → **Day** (big speed-up — collapses hundreds of raw samples).
   - ⚠️ If the action shows "Filter Health Samples" instead of "Find All…", it grabbed an
     input from a previous action — tap the input variable and clear it.
3. **Calculate Statistics** — *Operation* → **Sum**, *Input* → the **Health Samples**
   magic variable from action 2. This is today's step total.
4. **If** — *Input* → the **Statistics** result from action 3 · *Condition* →
   **is greater than** · `0`. Then, **inside the If** (before "Otherwise"):
   - **Get Contents of URL**:
     - URL: `https://selfcarecentre.tyrion.uk/api/checkin`
     - Tap **Show More** → *Method* → **POST**
     - **Headers** → add one: key `X-Checkin-Token`, value = paste the token
     - **Request Body** → **JSON** → add two fields:
       - `date` · type **Text** · value = the **Formatted Date** variable (action 1)
       - `steps` · type **Number** · value = the **Statistics** variable (action 3)
   - You can delete the empty **Otherwise** branch (tap Otherwise → delete) or leave it.

### Last night's sleep window (actions 5–7)

5. **Adjust Date** — *Date* → **Current Date**, operation → **Get Start of Day**.
   (Result: today at 00:00.)
6. **Adjust Date** — *Date* → the **Adjusted Date** from action 5, operation →
   **Subtract** · `6` · **Hours**. (Result: **yesterday 18:00** — the window start.)
7. **Adjust Date** — *Date* → the **Adjusted Date** from action **5** (careful: pick
   action 5's output, not action 6's), operation → **Add** · `12` · **Hours**.
   (Result: **today 12:00** — the window end.)

### Sleep (actions 8–12)

8. **Find Health Samples**:
   - *Sample Type* → **Sleep Analysis** (listed as just "Sleep" on some versions)
   - **Add Filter** → **Start Date** · **is between** · [Adjusted Date from action 6] ·
     [Adjusted Date from action 7]
   - **Add Filter** → **Value** · **is not** · **In Bed**
   - **Add Filter** → **Value** · **is not** · **Awake**
   - **Limit** *off*, no grouping.
   - *(If the Value operator list has no "is not": remove the two Value filters and use
     the fallback in Troubleshooting instead.)*
9. **Repeat with Each** — *Input* → the **Health Samples** from action 8. Inside the loop:
   - **Get Time Between Dates** — *from* → **Repeat Item** → tap it again and pick its
     **Start Date** detail; *to* → **Repeat Item → End Date**; *unit* → **Minutes**
     (minutes, not hours — the action rounds, so summing minutes avoids error).
   - Nothing else in the loop; the loop's output ("Repeat Results") collects each
     sample's minutes.
10. **Calculate Statistics** — **Sum** of **Repeat Results**. This is total sleep minutes.
11. **Calculate** — [Statistics from action 10] **÷** `60`. This is sleep in hours (the
    server rounds to 1 decimal place).
12. **If** — [Statistics from action 10] **is greater than** `0`, inside:
    - **Get Contents of URL** — same URL, POST, same `X-Checkin-Token` header;
      **Request Body JSON** fields:
      - `date` · **Text** · [Formatted Date]
      - `sleepHours` · **Number** · [Calculation Result from action 11]

### A gentle receipt (action 13, optional)

13. **Show Notification** — title `Checked in ✓`, body e.g.
    `[Statistics (steps)] steps · [Calculation Result]h sleep`. Purely informational —
    no goals, no colours, in keeping with the app's no-judgement rule.

## Part 2 — First manual run

Tap **▶** at the bottom of the editor.

- First run, iOS asks Shortcuts for **Health access** — allow **Steps** and
  **Sleep Analysis** (toggle both on → Allow).
- First run may also ask to allow connecting to **selfcarecentre.tyrion.uk** — Allow.
- You should get the "Checked in ✓" notification with plausible numbers. Compare the
  sleep figure against Health → Browse → Sleep for last night; it should match the
  "time asleep" number (not "in bed").

Then confirm the server got it — the app's **Progress tab** strip, or from a computer:

```
curl -s "https://selfcarecentre.tyrion.uk/api/checkins?days=2" -H "X-Checkin-Token: <token>"
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

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Notification shows steps but no sleep (or `0h`) | Sleep filters: check the `is between` window uses action 6 *and* 7's outputs, and the Value filters. Also check the Watch actually tracked last night (Health → Sleep). |
| Sleep number way too big (≈ whole night in bed) | An "In Bed" filter is missing/wrong — In Bed must be excluded, and never added on top of stages (double-counts). |
| No "is not" operator on the Value filter | Fallback: drop both Value filters; inside the Repeat loop wrap the Get Time Between Dates in two nested **If**s: If Repeat Item's Value **is not** `In Bed` → If Value **is not** `Awake` → (Get Time Between Dates). If the If action lacks "is not" too, use If **is** `In Bed` with the work in the **Otherwise** branch. |
| Nothing arrives on the server; shortcut shows a red error on Get Contents of URL | 401 = token typo in the header (key must be exactly `X-Checkin-Token`). 400 = a body field has the wrong type — `steps`/`sleepHours` must be **Number**, `date` **Text** `yyyy-MM-dd`. |
| Automation "ran" at 21:45 but no notification / no data | Phone was locked — HealthKit refuses reads on a locked device (Apple privacy guarantee; no setting overrides it). Tap the automation banner, or run the shortcut manually. The guards mean nothing wrong was written. |
| Automation doesn't fire at all some nights | A Focus (especially Sleep Focus) can suppress time-of-day automations — check Focus schedules if 21:45 ever falls inside one. |
| Wrong date on the entry | The `date` field must be the phone's local date via Format Date `yyyy-MM-dd` — don't hand-type a date, and don't use any UTC/ISO variant (app timezone is Europe/London). |

Manual entries and the shortcut coexist safely: the server merges per-field by date, so
the shortcut's steps/sleep never touch a hand-entered `feel`, and re-runs just overwrite
steps/sleep with fresher numbers.
