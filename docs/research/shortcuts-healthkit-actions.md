# iOS Shortcuts + Apple Health: reading steps & sleep and POSTing them nightly

Research for the nightly Check-ins automation (read today's steps and last night's sleep from
Apple Health on the owner's iPhone, POST to our server at ~21:30). Every claim is cited inline.
Each section ends with a **Confidence** note: `verified-primary` (Apple's own docs),
`corroborated-secondary` (multiple independent third-party sources agree), or `uncertain`.

**iOS version note:** Apple renumbered iOS to **iOS 26** in 2025 (skipping 17→26 to align with the
model year); it is the successor to iOS 18. No Health/Shortcuts action in this doc was renamed in that
jump — the action names below (`Find Health Samples`, `Calculate Statistics`, `Get Contents of URL`)
are current as of iOS 26. Where a name historically varied, it's flagged.

---

## 1. Reading today's step count

**Action name.** The action is **Find Health Samples**. In the shortcut editor it renders as a
sentence: **"Find All *Health Samples* where …"** with editable filter rows. (A gotcha: if you place
it *immediately after* a `Log Health Sample` action, Shortcuts auto-binds it and relabels it
**"Filter Health Samples"**, which only passes through the just-logged sample — clear the input
variable so it reads **Find All Health Samples** and queries the whole store.)
[1thingaweek](https://www.1thingaweek.com/week/405/solved-using-health-shortcuts-shortcut-app),
[Matthew Cassinelli – Find Health Samples](https://matthewcassinelli.com/actions/find-health-samples/)

**Filtering to steps for today.** In the action set:
- **Sample Type = Steps** (the sample-type picker; "Steps" is the Health quantity type).
- Add a filter row: **Start Date · is today** (the Start-Date operator offers **"is on / is today /
  is between / is in the last"**).
- Turn **Limit** *off* (otherwise it caps the number of samples returned) and turn **"fill missing"**
  *off*.
[1thingaweek](https://www.1thingaweek.com/week/405/solved-using-health-shortcuts-shortcut-app),
[Cassinelli](https://matthewcassinelli.com/actions/find-health-samples/)

**Getting a summed total.** Two working approaches:
1. **Calculate Statistics** (recommended, simplest). Follow `Find Health Samples` with the
   **Calculate Statistics** action and set the operation to **Sum** over the returned samples. This
   gives one number = total steps today.
   [1thingaweek](https://www.1thingaweek.com/week/405/solved-using-health-shortcuts-shortcut-app),
   [LifeTips weekly-summary walkthrough](https://lifetips.alibaba.com/tech-efficiency/auto-generate-apple-health-weekly-summaries)
2. **Group by Day.** `Find Health Samples` has a **Group Samples by** option with periods
   **Minute / Hour / Day / Week / Month / 3 Months / Year**. Grouping by **Day** collapses the
   hundreds of raw step samples into one total per day — this is also the key *performance*
   optimisation (Wade Urry reports it cutting a health query "from over hours to under 5 seconds";
   the raw ungrouped query iterates every intraday sample).
   [Cassinelli](https://matthewcassinelli.com/actions/find-health-samples/),
   [Wade Urry](https://www.iwader.co.uk/posts/2023/11/improve-performance-when-querying-apple-health-samples-in-shortcuts/)

There is **no** built-in "Sum" toggle inside `Find Health Samples` itself — summation is done by the
separate `Calculate Statistics` action (or implicitly by day-grouping). A repeat-loop is unnecessary
for steps.

> **Recommended step recipe:** `Find All Health Samples where [Steps], Start Date is today, Limit off`
> → `Calculate Statistics · Sum`. Read the result as a Number.

**Confidence:** corroborated-secondary (multiple independent third-party walkthroughs agree on both
the action names and the `Find → Calculate Statistics · Sum` pattern; Apple's own Shortcuts User Guide
does not document Health-action internals, so no primary source exists for the exact filter labels).

---

## 2. Reading last night's sleep

### How sleep is exposed
Sleep lives under the **Sleep Analysis** sample type. Historically its value is one of **In Bed /
Asleep / Awake**. Since **watchOS 9 / iOS 16 (Sept 2022)**, Apple Watch sleep tracking additionally
records **sleep *stages*: Core, Deep, REM**, plus **Awake**, and legacy/third-party data may appear as
a generic **"Asleep (unspecified)"**. Each night is therefore a *series of many short samples*, each
tagged with one stage, logged every few minutes.
[Six Colors](https://sixcolors.com/post/2019/02/simple-sleep-tracking-with-shortcuts/),
[AutoSleep – Sleep Stages](https://autosleepapp.tantsissa.com/clock/sleep-stages),
[Empirical Health](https://www.empirical.health/blog/apple-watch-deep-sleep-meaning/)

### Which value(s) to sum for "hours asleep last night"
Sum the **asleep stages only: Core + Deep + REM** (i.e. exclude **Awake** and exclude the container
**In Bed**). On a stage-tracking Apple Watch, Core+Deep+REM *is* the time-asleep figure Apple shows.

- **Do not use "In Bed"** as your asleep total — "In Bed" spans the whole bedtime window including
  awake-in-bed minutes, so it overstates sleep.
- **Do not add "In Bed" *and* the stages together** — that double-counts (the stages sit *inside* the
  In Bed window).
- If a night has **no** stage data (older device, or a third-party sleep app that only writes generic
  "Asleep (unspecified)"), fall back to summing the **"Asleep"** samples.

The Health-app / HealthKit convention corroborates this: HealthKit models sleep as category samples
where Core/Deep/REM are the "asleep" sub-states; Nick Rodriguez's HealthKit walkthrough sums exactly
these "asleep" category values (he refers to them by their raw enum indices) and drops In Bed/Awake.
[Nick Rodriguez – calculating sleep duration](https://nrodrig1.medium.com/how-to-calculate-your-sleep-duration-from-your-apple-health-data-38e8aa775f9a),
[Automators – export sleep data](https://talk.automators.fm/t/shortcut-to-export-sleep-data/18100)

### Does Shortcuts expose the stage as the sample's Value?
Yes — for Sleep Analysis, the sample's **Value** is the stage/state string (In Bed / Awake / Core /
Deep / REM / Asleep), which you can filter on in a `Find Health Samples` **Value is …** filter row.
The value attributes exposed for filtering/sorting are **Value / Start Date / End Date / Duration /
Source / Name**.
[Cassinelli](https://matthewcassinelli.com/actions/find-health-samples/),
[Six Colors](https://sixcolors.com/post/2019/02/simple-sleep-tracking-with-shortcuts/)

### Is per-sample Duration exposed, and in what unit — and how to total it
`Duration` **is** exposed as a sample attribute (you can filter and sort by it). **However**, Sleep
Analysis is a *category* sample whose Value is a stage string, **not** a number — so
`Calculate Statistics · Sum` (which sums numeric sample *values*) does **not** cleanly total sleep
hours the way it totals steps. The reliable, widely-used pattern is:

> **Recommended sleep recipe:**
> 1. `Find All Health Samples where [Sleep Analysis]`, with a **Value is** filter limiting to asleep
>    stages (Core, Deep, REM — you may need one Find per stage, or an "is not In Bed / is not Awake"
>    filter), over the night window (see below).
> 2. **Repeat with Each** sample → inside the loop use **Get Time Between Dates** (from the sample's
>    **Start Date** to its **End Date**), unit = **Minutes**, and accumulate a running total (via a
>    variable or by collecting into a list).
> 3. `Calculate Statistics · Sum` the collected minutes (or add them up), then **divide by 60** for
>    hours.

Caveat on units: `Get Time Between Dates` only lets you pick a single unit and **rounds** — so total
in **Minutes** and divide by 60 yourself rather than asking for "Hours" directly, to avoid per-sample
rounding error.
[Six Colors](https://sixcolors.com/post/2019/02/simple-sleep-tracking-with-shortcuts/),
[Automators – export sleep data](https://talk.automators.fm/t/shortcut-to-export-sleep-data/18100),
[Cassinelli](https://matthewcassinelli.com/actions/find-health-samples/)

### Capturing the night that spans midnight
This is the trickiest part. `Find Health Samples`' **Start Date** filter is **day-granular** for the
`is today` / `is in the last N days` operators — it has *no hour unit* — so a naïve **"Start Date is
today"** filter **misses the pre-midnight portion** of last night's sleep (samples that began
yesterday evening carry *yesterday's* date). This is a real, reported limitation: users note they
"can't just have it start 24 hours ago" with the day-unit filter.
[Automators – export sleep data](https://talk.automators.fm/t/shortcut-to-export-sleep-data/18100)

**Reliable recipe — build an explicit datetime window with `is between`.** The **"is between"**
operator accepts two *date values*, which you can compute to the hour using the **Date** /
**Adjust Date** actions. Since the automation runs in the *evening* (~21:30) and you want the sleep
that ended *this morning*:
- **Window start** = yesterday ~18:00 (6 PM) — e.g. `Adjust Date` on "today at 00:00" minus 6 hours,
  or "Current Date" minus ~27 hours.
- **Window end** = today ~12:00 (noon), safely after any wake-up.
- Filter: **Start Date · is between · [window start] · [window end]**.

This single 18:00→12:00 window brackets exactly one night regardless of what side of midnight each
sample falls on, and won't pick up naps from this afternoon. (The Automators community uses the same
idea in reverse for a 5 PM run — "pull samples from 5 PM yesterday to 5 PM today.")
[Automators – export sleep data](https://talk.automators.fm/t/shortcut-to-export-sleep-data/18100)

**Confidence:** corroborated-secondary for the mechanics (stage names, Value/Duration exposure, the
repeat+Get-Time-Between-Dates totalling, the midnight-window workaround) — several independent sources
agree and it matches HealthKit's data model. The Core+Deep+REM vs In-Bed **summing recommendation** is
corroborated-secondary + consistent with HealthKit's category model, but Apple publishes no primary
Shortcuts-specific guidance, so validate the exact per-night number against the Health app once on the
owner's device.

---

## 3. POSTing JSON with a custom header (`Get Contents of URL`)

Apple's **Shortcuts User Guide** ("Request your first API") confirms the core capability:
- **Method**: **GET / POST / PUT / PATCH / DELETE** — "POST allows you to create new data."
- When switched to **POST/PUT/PATCH**, a **Request Body** parameter appears, supporting
  **JSON / Form / File**.
[Apple Support – Request your first API in Shortcuts](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios)

Apple's guide stops short of documenting headers and per-field JSON types, but these are standard and
corroborated by third-party references. Under **Show More** on the action you get:
- **Headers** — add custom **key/value** pairs (e.g. `Authorization: Bearer <token>`,
  `Content-Type: application/json`). This is where your token-protected sync header goes.
- **Request Body = JSON** — add named fields; **each field has a type selector: Text, Number,
  Boolean, Dictionary, Array**. So send `steps` and `sleepHours` as **Number** (not Text) if the
  server expects typed numeric JSON.
[Cassinelli – Get Contents of URL](https://matthewcassinelli.com/actions/get-contents-of-url/),
[Automators – POST with Get Contents of URL](https://talk.automators.fm/t/send-post-request-with-get-contents-of-url/15943),
[8x8 Developer Portal – Apple Shortcuts](https://developer.8x8.com/connect/docs/apples-shortcuts/)

> **Recommended POST recipe:** `Get Contents of URL` → **Method POST** → **Headers**:
> `Authorization = <token>` (and `Content-Type = application/json`) → **Request Body: JSON** with
> `steps` (Number), `sleepHours` (Number), `date` (Text). Point the URL at our sync endpoint.

**Confidence:** verified-primary for Method + JSON request body (Apple's User Guide);
corroborated-secondary for the **Headers** key/value UI and the **Number/Text/Boolean/Dictionary/
Array** field-type picker (Apple's guide doesn't spell these out, but multiple independent references
do, and this matches the shipping action).

---

## 4. Daily time-of-day automation + the locked-phone caveat

### Run at 21:30 with no confirmation
Create a **Personal Automation → Time of Day**, set **21:30**, choose **Daily**. During setup pick
**Run Immediately** (vs **Run After Confirmation**); optionally leave **Notify When Run** on so you get
a banner when it fires. Since **iOS 15.4**, time-of-day automations set to **Run Immediately** fire
*without* the old tap-to-confirm notification. This UI is unchanged through iOS 26.
[Automators discussion of Run-Immediately behaviour](https://talk.automators.fm/t/why-do-some-time-triggered-shortcuts-run-on-a-locked-iphone-and-others-fail/18608)

### ⚠️ Locked-phone caveat — this is the load-bearing risk (answer: YES, it can silently fail)
**Reading Health data requires the iPhone to be unlocked.** This is a HealthKit-level privacy
guarantee, not a Shortcuts quirk, so no toggle works around it:

- Apple's **HealthKit "Protecting user privacy"** doc: *"the HealthKit store is encrypted when the
  device is locked … your app is not allowed to read health data while a device is locked"* (it may
  still *save* data, which is buffered to a temporary file and merged into HealthKit when the device
  is next unlocked).
  [Apple Developer – Protecting user privacy](https://developer.apple.com/documentation/healthkit/protecting-user-privacy)
- The failure surfaces as **`HKError.Code.errorDatabaseInaccessible`** — "HealthKit data is
  unavailable because it's protected and the device is locked."
  [Apple Developer – errorDatabaseInaccessible](https://developer.apple.com/documentation/healthkit/hkerror/code/errordatabaseinaccessible)

**Consequence for us:** if the 21:30 automation fires while the iPhone is **locked**, the
`Find Health Samples` (steps *and* sleep) steps fail — the POST would send nothing/garbage or the
shortcut errors. Even with "Run Immediately" + "Allow Running While Locked", the *time trigger* may
fire on a locked device but the *Health read inside it* still cannot access the encrypted store. (Note
a narrow HealthKit exception exists for **workout** data access while locked; it does **not** cover
step or sleep reads.)
[Apple Developer – Protecting user privacy](https://developer.apple.com/documentation/healthkit/protecting-user-privacy),
[Apple Developer forum – background access while locked](https://developer.apple.com/forums/thread/824819)

**Mitigations (in order of robustness):**
1. **Leave "Notify When Run" ON** so a locked-phone run surfaces a tappable notification; tapping it
   (which unlocks) lets the Health reads succeed. This trades "fully silent" for "reliable."
2. **Pick a time you're reliably using the phone.** 21:30 is usually fine (evening, phone in hand and
   unlocked), which is why it often *appears* to work — but it is not guaranteed.
3. **Add a guard in the shortcut**: after the Health reads, `If` the steps/sleep result is empty →
   skip the POST (or POST a "deferred" flag) so a locked-phone run doesn't overwrite good data with
   zeros.
4. **Separately, Focus/Sleep mode** can also suppress time automations at night — an independent
   failure mode from the lock issue, worth noting if the trigger ever moves later.
   [Automators – why some locked automations fail](https://talk.automators.fm/t/why-do-some-time-triggered-shortcuts-run-on-a-locked-iphone-and-others-fail/18608)

**Confidence:** verified-primary for the locked-device read restriction and the error code (Apple's
own HealthKit docs). corroborated-secondary for the Run-Immediately-since-15.4 behaviour and the
Focus-mode interaction.

---

## Sources
Primary (Apple):
- [Protecting user privacy — HealthKit](https://developer.apple.com/documentation/healthkit/protecting-user-privacy) — Health reads blocked while device locked; store encrypted when locked; writes buffered.
- [errorDatabaseInaccessible — HealthKit](https://developer.apple.com/documentation/healthkit/hkerror/code/errordatabaseinaccessible) — the error thrown when reading Health on a locked device.
- [Request your first API in Shortcuts — Apple Support](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios) — Get Contents of URL Method (GET/POST/…) and Request Body (JSON/Form/File).

Authoritative secondary / corroborating:
- [Matthew Cassinelli — Find Health Samples](https://matthewcassinelli.com/actions/find-health-samples/) — filter operators, sample attributes (Value/Start/End/Duration/Source/Name), grouping periods.
- [Matthew Cassinelli — Get Contents of URL](https://matthewcassinelli.com/actions/get-contents-of-url/) — Method, Headers, Request Body types.
- [1thingaweek — Using Health shortcuts](https://www.1thingaweek.com/week/405/solved-using-health-shortcuts-shortcut-app) — Find All vs Filter, Calculate Statistics · Sum, Limit/fill-missing toggles.
- [Wade Urry — Improve performance querying Health samples](https://www.iwader.co.uk/posts/2023/11/improve-performance-when-querying-apple-health-samples-in-shortcuts/) — group-by-day performance.
- [Six Colors — Simple sleep tracking with Shortcuts](https://sixcolors.com/post/2019/02/simple-sleep-tracking-with-shortcuts/) — Sleep Analysis values, Get Time Between Dates rounding.
- [Automators — Shortcut to export sleep data](https://talk.automators.fm/t/shortcut-to-export-sleep-data/18100) — stage list, day-unit filter limitation, evening-window workaround.
- [Automators — POST with Get Contents of URL](https://talk.automators.fm/t/send-post-request-with-get-contents-of-url/15943) — headers + JSON body in practice.
- [Automators — why some locked automations fail](https://talk.automators.fm/t/why-do-some-time-triggered-shortcuts-run-on-a-locked-iphone-and-others-fail/18608) — Run Immediately + Focus-mode nuances.
- [Nick Rodriguez — Calculating sleep duration from Apple Health](https://nrodrig1.medium.com/how-to-calculate-your-sleep-duration-from-your-apple-health-data-38e8aa775f9a) — asleep-category summing (HealthKit model).
- [Empirical Health — Apple Watch deep sleep](https://www.empirical.health/blog/apple-watch-deep-sleep-meaning/) / [AutoSleep — Sleep Stages](https://autosleepapp.tantsissa.com/clock/sleep-stages) — watchOS 9 Core/Deep/REM stage model.
- [8x8 Developer Portal — Apple Shortcuts](https://developer.8x8.com/connect/docs/apples-shortcuts/) — headers/JSON POST reference.

## Open items to confirm on-device (Apple docs are silent)
- Exact label of the asleep-stage filter: whether one `Value is` row can select Core/Deep/REM together
  or needs one `Find` per stage / an `is not In Bed`+`is not Awake` pair.
- Whether `Calculate Statistics` offers any direct duration total for category (Sleep Analysis) samples
  on iOS 26, which would let us drop the Repeat loop.
- That the 18:00→noon `is between` window matches the Health app's nightly figure for the owner's
  actual bed/wake times.
