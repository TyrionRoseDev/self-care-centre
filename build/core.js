/* ============================================================================
   SKINCARE ROUTINE — SHARED CORE (data + cycle logic)
   ----------------------------------------------------------------------------
   To change your routine, edit the DATA object below. Everything in every
   design rebuilds from it. Step shapes:
     "plain text"                      -> a normal step
     { t:"text", wait:true }           -> a WAIT / emphasised step
   A day can carry: theme, accent, note (PM tip), amNote (morning tip),
   warns:[...] (things NOT to do), and either steps:[...] or
   sections:[{label, steps}] for the microneedling session itself.
   ============================================================================ */

/* ----------------------------------------------------------------------------
   PUSH NOTIFICATIONS CONFIG
   Single deployment: the app and its reminder API share one origin, so apiBase
   stays empty (the app calls /api/... on itself). vapidPublicKey must match the
   VAPID_PUBLIC env var on the server. Blank key = notifications disabled; the
   app still works fully. See DEPLOY.md.
---------------------------------------------------------------------------- */
const PUSH_CONFIG = {
  apiBase: "",  // same origin — leave empty
  vapidPublicKey: "BJYyAdG3OKRiLaYeipIC5ApGySMuzFz8u-shTdwh06F6tjG9tRZWhXo8eLmdhurPo02RMffwlWLupOaGjTXd2Vk",
};

const DATA = {
  meta: {
    title: "Skincare",
    subtitle: "Korean routine · PM rotation · cruelty-free",
    device: "Dr.pen M8 · 0.5 mm · speed 3",
  },

  am: {
    theme: "Morning",
    steps: [
      "Cleanser — Isntree Yam Root Vegan Milk Cleanser",
      "Toner — Purito Wonder Releaf Centella",
      "Essence — COSRX Advanced Snail 96 Mucin Power Essence",
      "Hydrating Serum — Torriden Dive-In",
      "Glow Serum — Beauty of Joseon Glow Serum (propolis + niacinamide)",
      "Moisturiser — Purito Oat-In Calming Gel Cream",
      "SPF — SKIN1004 Madagascar Centella Sun Serum (two finger lengths)",
    ],
  },

  // Normal weekly PM rotation, keyed by weekday.
  week: {
    Mon: {
      theme: "Retinol Night", accent: "retinol",
      note: "Use Mary & May 6 Peptide in step 6 until you start retinol.",
      steps: [
        "Oil Cleanse — Beauty of Joseon Radiance Cleansing Balm",
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser",
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "Hydrating Serum — Torriden Dive-In",
        "Retinol — MIZON 0.1% Retinol Youth Serum (pea-sized, avoid eyes & mouth corners, wait 5 min)",
        "Moisturiser — Purito Oat-In Calming Gel Cream",
        "Lip Essence — Torriden SOLID-IN",
      ],
    },
    Tue: {
      theme: "Repair & Calm", accent: "repair",
      steps: [
        "Oil Cleanse — Beauty of Joseon Radiance Cleansing Balm",
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser",
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "Hydrating Serum — Torriden Dive-In",
        "Glow Serum — Beauty of Joseon Glow Serum",
        "Moisturiser — Purito Oat-In Calming Gel Cream",
        "Spot Treatment — AXIS-Y (only if needed)",
        "Lip Essence — Torriden SOLID-IN",
      ],
    },
    Wed: {
      theme: "BHA Night #1", accent: "bha",
      warns: ["No glow serum. No sleeping mask."],
      steps: [
        "Oil Cleanse — Beauty of Joseon Radiance Cleansing Balm",
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser",
        { t: "WAIT 10–15 minutes — skin must be fully dry", wait: true },
        "BHA — COSRX BHA Blackhead Power Liquid (3–4 drops, avoid eyes & lips)",
        { t: "WAIT 5 minutes", wait: true },
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "Hydrating Serum — Torriden Dive-In",
        "Moisturiser — Purito Oat-In Calming Gel Cream",
        "Spot Treatment — AXIS-Y (only if needed)",
        "Lip Essence — Torriden SOLID-IN",
      ],
    },
    Thu: {
      theme: "Glow & Comfort", accent: "repair",
      steps: [
        "Oil Cleanse — Beauty of Joseon Radiance Cleansing Balm",
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser",
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "Hydrating Serum — Torriden Dive-In",
        "Glow Serum — Beauty of Joseon Glow Serum",
        "Moisturiser — Purito Oat-In Calming Gel Cream",
        "Spot Treatment — AXIS-Y (optional)",
        "Lip Essence — Torriden SOLID-IN",
      ],
    },
    Fri: {
      theme: "Retinol Night", accent: "retinol",
      note: "On a microneedling Friday, follow the Microneedling week instead.",
      steps: [
        "Oil Cleanse — Beauty of Joseon Radiance Cleansing Balm",
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser",
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "Hydrating Serum — Torriden Dive-In",
        "Retinol — MIZON 0.1% Retinol Youth Serum (pea-sized, avoid eyes & mouth corners, wait 5 min)",
        "Moisturiser — Purito Oat-In Calming Gel Cream",
        "Lip Essence — Torriden SOLID-IN",
      ],
    },
    Sat: {
      theme: "BHA Night #2", accent: "bha",
      note: "On a microneedling weekend, follow the Microneedling week instead.",
      warns: ["No glow serum. No sleeping mask."],
      steps: [
        "Oil Cleanse — Beauty of Joseon Radiance Cleansing Balm",
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser",
        { t: "WAIT 10–15 minutes — skin must be fully dry", wait: true },
        "BHA — COSRX BHA Blackhead Power Liquid (3–4 drops, avoid eyes & lips)",
        { t: "WAIT 5 minutes", wait: true },
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "Hydrating Serum — Torriden Dive-In",
        "Moisturiser — Purito Oat-In Calming Gel Cream",
        "Spot Treatment — AXIS-Y (only if needed)",
        "Lip Essence — Torriden SOLID-IN",
      ],
    },
    Sun: {
      theme: "Sleeping Mask Night", accent: "sleep",
      note: "On a microneedling weekend, follow the Microneedling week instead.",
      steps: [
        "Oil Cleanse — Beauty of Joseon Radiance Cleansing Balm",
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser",
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "Hydrating Serum — Torriden Dive-In",
        "Glow Serum — Beauty of Joseon Glow Serum",
        "Sleeping Mask — COSRX Rice Overnight Spa Mask (thin layer, replaces moisturiser)",
        "Lip Essence — Torriden SOLID-IN (thicker layer, treat as a lip mask)",
      ],
    },
  },

  // Microneedling week — overrides the whole Mon–Sun when confirmed.
  micro: {
    Mon: {
      theme: "Retinol — Last Active Night", accent: "retinol",
      note: "Retinol as normal. Last active night before the session.",
      steps: [
        "Oil Cleanse — Beauty of Joseon Radiance Cleansing Balm",
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser",
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "Hydrating Serum — Torriden Dive-In",
        "Retinol — MIZON 0.1% Retinol Youth Serum (pea-sized, avoid eyes & mouth corners, wait 5 min)",
        "Moisturiser — Purito Oat-In Calming Gel Cream",
        "Lip Essence — Torriden SOLID-IN",
      ],
    },
    Tue: {
      theme: "Plain Routine Only", accent: "calm",
      note: "Skip BHA. No actives from tonight until after you have healed.",
      warns: ["No BHA. No glow serum. No spot treatment."],
      steps: [
        "Oil Cleanse — Beauty of Joseon Radiance Cleansing Balm",
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser",
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "Hydrating Serum — Torriden Dive-In",
        "Moisturiser — Purito Oat-In Calming Gel Cream",
        "Lip Essence — Torriden SOLID-IN",
      ],
    },
    Wed: {
      theme: "Plain Routine Only", accent: "calm",
      warns: ["No BHA. No glow serum. No spot treatment."],
      steps: [
        "Oil Cleanse — Beauty of Joseon Radiance Cleansing Balm",
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser",
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "Hydrating Serum — Torriden Dive-In",
        "Moisturiser — Purito Oat-In Calming Gel Cream",
        "Lip Essence — Torriden SOLID-IN",
      ],
    },
    Thu: {
      theme: "Plain Routine Only", accent: "calm",
      note: "Keep skin calm going into tomorrow.",
      warns: ["No actives at all tonight."],
      steps: [
        "Oil Cleanse — Beauty of Joseon Radiance Cleansing Balm",
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser",
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "Hydrating Serum — Torriden Dive-In",
        "Moisturiser — Purito Oat-In Calming Gel Cream",
        "Lip Essence — Torriden SOLID-IN",
      ],
    },
    Fri: {
      theme: "Microneedling Session", accent: "session",
      warns: ["Nothing else tonight. No retinol, BHA, glow serum, or spot treatment."],
      sections: [
        {
          label: "Pen setup",
          steps: [
            "Wash hands thoroughly",
            "Put gloves on",
            "Wipe pen body with an alcohol wipe and leave to dry",
            "Attach a fresh cartridge — never reuse",
            "Set depth to 0.5 mm",
            "Set speed to 3",
          ],
        },
        {
          label: "Skin prep",
          steps: [
            "Oil Cleanse — Beauty of Joseon Radiance Cleansing Balm",
            "Cleanser — Isntree Yam Root Vegan Milk Cleanser",
            "Pat dry with a clean towel",
            "Apply EMLA numbing cream thickly over all areas you are treating",
            "Cover with cling film",
            { t: "WAIT 45–60 minutes — set a timer", wait: true },
            "Remove cling film, wipe EMLA off with dry cotton pads, then a damp pad",
            "Wipe over skin with sterile saline solution on a cotton pad",
            "Pat dry gently",
          ],
        },
        {
          label: "The session",
          warns: ["Redness like a mild sunburn is normal. Pinpoint bleeding means ease off."],
          steps: [
            "Apply a thin layer of Torriden Dive-In all over face as glide serum",
            "Work in sections — forehead, left cheek, right cheek, chin, nose",
            "Use light pressure — let the pen do the work, do not press hard",
            "Move in three directions per section: horizontal, vertical, diagonal",
            "Spend around 30–60 seconds per section",
            "Add more Torriden Dive-In if the pen starts to drag",
            "Go over any extra-dry patches with a gentle extra pass",
            "Avoid the eye area, the nostrils, and the perioral area around the mouth completely",
            "Bridge and sides of the nose are fine — just avoid the nostrils themselves",
          ],
        },
        {
          label: "After the session",
          steps: [
            "Rinse face gently with saline solution — no cleanser",
            "Pat dry very gently, do not rub",
            "Moisturiser — Purito Oat-In Calming Gel Cream (generous layer)",
            "Lip Essence — Torriden SOLID-IN",
          ],
        },
      ],
    },
    Sat: {
      theme: "Recovery — Day 1", accent: "calm",
      amNote: "Normal morning routine. Don't skip SPF — skin is sun-sensitive after needling.",
      note: "Skip your normal Saturday BHA. Plain routine plus a PDRN sheet mask — this is exactly what it's for: healing freshly needled skin.",
      warns: ["No BHA. No glow serum. No spot treatment. No actives at all."],
      steps: [
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser (no cleansing balm needed)",
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "PDRN Sheet Mask — smooth on gently over the whole face",
        { t: "WAIT 15–20 minutes", wait: true },
        "Remove mask and pat the leftover essence into your skin",
        "Moisturiser — Purito Oat-In Calming Gel Cream (generous, to seal)",
        "Lip Essence — Torriden SOLID-IN",
      ],
    },
    Sun: {
      theme: "Recovery — Day 2", accent: "calm",
      amNote: "Normal morning routine. SPF is especially important today.",
      note: "Skip the sleeping mask — your PDRN sheet mask is tonight's treatment. Keep everything else plain.",
      warns: ["No actives. No glow serum. No traditional sleeping mask tonight."],
      steps: [
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser (no cleansing balm needed)",
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "PDRN Sheet Mask — smooth on over the whole face",
        { t: "WAIT 15–20 minutes", wait: true },
        "Remove mask and pat the leftover essence into your skin",
        "Moisturiser — Purito Oat-In Calming Gel Cream (seals the mask in)",
        "Lip Essence — Torriden SOLID-IN",
      ],
    },
    footer: "Monday — return to your normal routine. Only resume retinol once skin feels fully settled. Repeat sessions every few weeks.",
  },
};

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = {
  Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday",
};

/* ----------------------------------------------------------------------------
   Date helpers (all local time, day-granularity)
---------------------------------------------------------------------------- */
function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n) { const x = startOfDay(d); x.setDate(x.getDate() + n); return x; }
function mondayOf(d) { const x = startOfDay(d); const off = (x.getDay() + 6) % 7; return addDays(x, -off); }
function fridayOf(d) { return addDays(mondayOf(d), 4); }
function iso(d) {
  const x = startOfDay(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}
function fromIso(s) { const [y, m, dd] = s.split("-").map(Number); return new Date(y, m - 1, dd); }

/* ----------------------------------------------------------------------------
   Persisted cycle state
   { lastSession:'YYYY-MM-DD'(a Friday), interval:5, answers:{ mondayIso: 'yes'|'no' } }
---------------------------------------------------------------------------- */
const STORE_KEY = "skincare.cycle.v1";
function loadState() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || null; }
  catch (e) { return null; }
}
function saveState(s) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

function setupCycle(lastSessionDate, intervalWeeks) {
  saveState({ lastSession: iso(fridayOf(lastSessionDate)), interval: intervalWeeks, answers: {} });
}

/* Compute everything about "today" relative to the cycle. */
function computeCycle(now) {
  const today = startOfDay(now);
  const state = loadState();
  if (!state) return { configured: false, today };

  const thisMonday = mondayOf(today);
  const answers = state.answers || {};

  // Walk the predicted session forward, absorbing skips ("no") and any
  // fully-missed past weeks, until we land on the current candidate week.
  let target = addDays(fromIso(state.lastSession), state.interval * 7);
  let guard = 0;
  while (guard++ < 520) {
    const wkMon = mondayOf(target);
    const key = iso(wkMon);
    const weekEnd = addDays(wkMon, 6);
    if (answers[key] === "no") { target = addDays(target, 7); continue; }
    if (answers[key] !== "yes" && today > weekEnd) { target = addDays(target, 7); continue; }
    break;
  }
  const candidateFriday = fridayOf(target);
  const candidateMonday = mondayOf(target);

  const thisAnswer = answers[iso(thisMonday)];
  const isCandidateWeek = thisMonday.getTime() === candidateMonday.getTime();
  const microActive = thisAnswer === "yes";
  const needPrompt = isCandidateWeek && thisAnswer == null;

  const weeksUntil = Math.round((candidateFriday - today) / (7 * 864e5));

  return {
    configured: true, today, state,
    candidateFriday, candidateMonday,
    isCandidateWeek, microActive, needPrompt, weeksUntil,
  };
}

function answerWeek(now, yes) {
  const state = loadState(); if (!state) return;
  const thisMonday = iso(mondayOf(now));
  state.answers = state.answers || {};
  state.answers[thisMonday] = yes ? "yes" : "no";
  if (yes) state.lastSession = iso(fridayOf(now)); // this week's Friday becomes the new anchor
  saveState(state);
}

/* Resolve the routine to show for a given day. */
function routineFor(dayKey, microActive) {
  const set = microActive ? DATA.micro : DATA.week;
  return set[dayKey];
}

/* AM/PM by clock: morning before 12:00, else evening. */
function phaseNow(now) { return now.getHours() < 12 ? "am" : "pm"; }

/* ============================================================================
   WORKOUT ROUTINE — data + schedule
   ----------------------------------------------------------------------------
   Home, no gym, hEDS-friendly. Three Sessions a week (Tue / Thu / Sun) plus a
   shared Warm-up. Every Move is written for someone who has never exercised:
   { name, focus, what, setup:[...], do:[...], cue, heds, swap }.
   A Session lists moves as [moveId, dose]. WORKOUT.schedule maps a weekday key
   to a Session; days not in it are Rest days.
   ============================================================================ */
const WORKOUT = {
  schedule: { Tue: "tue", Thu: "thu", Sun: "sun" },
  groups: { warm: "Warm-up", core: "Core · stomach", glute: "Glutes · bum", arm: "Arms" },

  moves: {
    marches: { name: "Marching on the Spot", focus: "warm",
      what: "Gentle marching to warm your body up — feet stay low, no jumping.",
      setup: ["Stand tall behind your chair, one hand resting on it for balance.", "Feet hip-width apart, shoulders relaxed."],
      do: ["Lift one knee to a comfortable height, then set it down.", "Lift the other, in a slow steady rhythm — like walking on the spot.", "Keep going for about a minute."],
      cue: "Breathe normally and steadily. It should feel easy, just warm.",
      heds: "Hold the chair the whole time so your ankles and knees never have to balance you.",
      swap: "If standing tires you, march sitting in the chair, lifting one knee at a time." },
    catcow: { name: "Cat–Cow", focus: "warm",
      what: "A slow, gentle rounding and arching of your back to loosen your spine.",
      setup: ["Come onto all fours: hands under shoulders, knees under hips.", "Cushion under your knees if they feel tender.", "Start with a flat, table-top back."],
      do: ["Slowly round your back up toward the ceiling, letting your head drop gently — like a cat stretching.", "Then reverse: let your tummy sink, lift your chest, look slightly forward — a soft arch.", "Move slowly between the two, 8 times."],
      cue: "Breathe out as you round up, in as you arch down. A comfortable roll, never a strain.",
      heds: "Only move as far as feels easy. With bendy joints, small and smooth beats big.",
      swap: "If all-fours bothers your wrists or knees, sit in the chair and round then arch your back the same way." },
    kneepushouts: { name: "Seated Banded Knee Push-Outs", focus: "warm",
      what: "A gentle way to switch your bum muscles on before you use them.",
      setup: ["Loop a booty band around both legs, just above your knees.", "Sit on the front edge of your chair, feet flat, knees bent hip-width apart."],
      do: ["Slowly push both knees outward against the band, as far as is comfortable.", "Hold for 1 second — feel the sides of your bum working.", "Slowly bring them back in, controlling the band. 15 times."],
      cue: "Breathe out as you push, in as you return. You'll feel the sides of your bum switch on.",
      heds: "You're fully supported here with no balancing, so this is a nice safe one.",
      swap: "No band yet? Press your hands against the outsides of your knees and push your knees into your hands." },
    armcircles: { name: "Arm Circles", focus: "warm",
      what: "Small, slow circles to warm up your shoulders.",
      setup: ["Sit or stand tall, arms out to your sides at shoulder height (a T shape).", "If standing tires you, sit in the chair."],
      do: ["Make small, slow forward circles — about the size of a dinner plate — for 10.", "Reverse and circle backward for 10.", "Keep them small and controlled."],
      cue: "Breathe normally. Shoulders should feel warm and loose, never pinched.",
      heds: "Keep circles small — a loose shoulder wanders too far on big circles.",
      swap: "If holding your arms up tires them, keep the arms only slightly raised and circle gently." },

    deadbug: { name: "Dead Bug", focus: "core",
      what: "Lying on your back, lowering an opposite arm and leg while keeping your tummy tight. The best safe core move for you — no neck strain, no crunching.",
      setup: ["Lie on your back. Lift both arms straight up, over your shoulders.", "Lift both legs so knees bend at a right angle, shins parallel to the floor (this is 'tabletop').", "Press your lower back flat into the mat and keep it there the whole time — this is the key."],
      do: ["Slowly lower your right arm back over your head and straighten your left leg toward the floor together (opposite arm, opposite leg).", "Only go as far as you can while your lower back stays flat. The moment it arches, that's your limit.", "Slowly return, then do the other side. That's 1 rep."],
      cue: "Breathe out slowly as you lower, in as you return. You'll feel a deep, low tension across your stomach — that tension is the exercise.",
      heds: "Slow and small beats big and floppy. Control is everything for you.",
      swap: "Too hard? Keep your legs still in tabletop and only move your arms. Add the legs later." },
    birddog: { name: "Bird-Dog", focus: "core",
      what: "On all fours, reaching one arm and the opposite leg out straight — a gentle whole-core and balance move.",
      setup: ["On all fours: hands under shoulders, knees under hips, cushion under knees if needed.", "Flatten your back to a table-top and tighten your tummy."],
      do: ["Slowly reach your right arm straight forward and your left leg straight back together.", "Reach them long, no higher than your body — don't let your back arch or hips tip.", "Hold 2 seconds, hips level. Slowly return, then do the other side. That's 1 rep."],
      cue: "Breathe out as you reach, in as you return. You'll feel your tummy and bum working to keep you level; a little wobble is normal.",
      heds: "Keep the reach at body height, not higher — a bendy back wants to over-arch.",
      swap: "Too wobbly? Reach just the leg back (no arm), or just the arm forward, until your balance builds." },
    pallof: { name: "Banded Pallof Hold", focus: "core",
      what: "Holding a band that pulls you sideways and refusing to twist — quietly one of the best core moves there is.",
      setup: ["Anchor a band at chest height to something solid — a door handle or a heavy sofa leg.", "Stand side-on to it, feet hip-width apart, holding the band at your chest with both hands.", "Step away until the band is taut."],
      do: ["Press the band straight out in front of your chest with both hands.", "The band will try to twist you toward the anchor — don't let it. Keep your chest facing forward.", "Hold 20 seconds, square and still. Then turn to face the other way and repeat."],
      cue: "Breathe slowly and normally — don't hold your breath while you brace. You'll feel the sides of your stomach working to stop you twisting.",
      heds: "Feet planted, knees soft (not locked). All the work is your core holding steady.",
      swap: "No anchor point? Loop the band under one foot and press it across your body, or just do an extra Dead Bug set." },
    sideplank: { name: "Side Plank (from knees)", focus: "core",
      what: "A supported side hold for the sides of your waist — done from your knees so it stays gentle.",
      setup: ["Lie on your side. Prop up on your forearm, elbow directly under your shoulder.", "Bend your knees so your lower legs rest behind you — you'll balance on forearm and knees, not feet."],
      do: ["Lift your hips off the floor so your body is a straight line from head to knees.", "Hold, keeping your hips up and body long, for 15–20 seconds.", "Lower gently, then roll over and do the other side."],
      cue: "Breathe steadily throughout — don't hold your breath. You'll feel the side of your waist nearest the floor holding you up.",
      heds: "Gently draw your supporting shoulder down away from your ear; don't sink into it. Elbow under shoulder, never locked.",
      swap: "Too much? Hold the lift for just 5 seconds at a time. (You're on your forearm here, so wrists stay safe.)" },
    heeltaps: { name: "Heel Taps", focus: "core",
      what: "Lying on your back, lowering one leg at a time to lightly tap the floor — a gentle lower-tummy move.",
      setup: ["Lie on your back, arms by your sides, palms down.", "Lift both legs into tabletop (knees bent at a right angle, shins parallel to floor).", "Press your lower back flat into the mat."],
      do: ["Slowly lower one foot to lightly tap your heel on the floor, keeping the knee bent.", "Keep your lower back flat — if it arches, tap lighter and higher.", "Return to tabletop, then tap with the other foot. That's 1 rep."],
      cue: "Breathe out as you lower, in as you return. You'll feel your lower tummy working to keep your back flat.",
      heds: "Keep it small and slow. The moment your back lifts off the mat, you've gone too far.",
      swap: "Too hard? Lower the foot only halfway toward the floor, not all the way." },

    glutebridge: { name: "Glute Bridge", focus: "glute",
      what: "Lying on your back and lifting your hips by squeezing your bum — the most beginner-friendly bum exercise there is.",
      setup: ["Lie on your back, knees bent, feet flat about hip-width apart.", "Slide your feet back until your fingertips can just brush your heels.", "Arms flat by your sides, palms down."],
      do: ["Push through your heels (not your toes) and squeeze your bum to lift your hips toward the ceiling.", "Stop when your body is a straight line from knees to shoulders — don't arch higher.", "Squeeze hard at the top for 1 second.", "Lower slowly (count 'one-two') until your bum almost touches the floor, then go again."],
      cue: "Breathe out as you lift, in as you lower. You'll feel your bum and the backs of your thighs — that's the point, not your lower back.",
      heds: "Stop at the straight line, never past it. 'Higher' just dumps into your lower back.",
      swap: "If it bothers your back, lift only halfway and hold for 3 seconds each rep." },
    hipthrust: { name: "Banded Hip Thrust", focus: "glute",
      what: "Like a glute bridge but with your upper back raised on the sofa — a bigger range, and the single best move for building a rounder bum.",
      setup: ["Sit on the floor with your upper back (shoulder-blade level) against the edge of a sturdy sofa or bed.", "Loop a booty band just above your knees. Feet flat, hip-width apart, knees bent.", "Rest your arms along the sofa edge."],
      do: ["Push through your heels and squeeze your bum to lift your hips until your body is flat from knees to shoulders, like a tabletop.", "As you rise, gently push your knees out against the band — don't let them cave inward.", "Squeeze hard at the top for 1–2 seconds.", "Lower slowly until your hips are just above the floor, then go again."],
      cue: "Breathe out as you lift, in as you lower. You'll feel your bum doing almost all the work — more than any other move here.",
      heds: "Stop at flat and level — don't over-arch past it. Later, rest a light dumbbell across your hips to make it harder.",
      swap: "Sofa feels awkward at first? Do the floor Glute Bridge until you're comfortable, then progress to this." },
    clamshell: { name: "Banded Clamshell", focus: "glute",
      what: "Lying on your side and opening your top knee like a clam — targets the side of your bum that gives you shape.",
      setup: ["Loop the band just above your knees.", "Lie on your side, knees bent and stacked, hips and shoulders stacked.", "Head resting on your lower arm; steady yourself with your top hand on the floor in front."],
      do: ["Keeping your feet together and hips still, lift your top knee, opening against the band.", "Only go as far as your hips can stay still — don't roll backward.", "Squeeze the side of your bum at the top, then lower slowly. 15 reps, then swap sides."],
      cue: "Breathe out as you open, in as you close. If you feel it in your lower back instead of your bum, your hips have rolled — reset.",
      heds: "Keep hips stacked and still. It's a small movement — small and controlled is correct, not big.",
      swap: "No band? Do it with no band first (still effective), then add the band once it feels easy." },
    hipabduction: { name: "Standing Banded Hip Abduction", focus: "glute",
      what: "Standing and lifting one leg out to the side against the band — the side of your bum, with the chair for safety.",
      setup: ["Loop the band just above your ankles (or above your knees if comfier to start).", "Stand tall, holding the back of your chair with both hands.", "Feet hip-width apart."],
      do: ["Keeping your leg straight but knee soft (not locked) and toes pointing forward, lift one leg out to the side against the band.", "Lift only as high as you can without leaning or tipping — usually not far.", "Lower slowly with control. 12 reps, then swap legs."],
      cue: "Breathe out as you lift, in as you lower. You'll feel the side of your bum on the moving leg working.",
      heds: "Hold the chair the whole time — your ankles and knees never balance you. Both knees soft, never locked.",
      swap: "Ankles unhappy with the band low? Move it up above your knees — same muscle, less ankle load." },
    kickback: { name: "All-Fours Banded Kickback", focus: "glute",
      what: "On all fours, pressing one foot back and up against the band — shapes the main part of your bum.",
      setup: ["Loop the band around one foot and hold the ends under your hands (or loop it around one foot and over the opposite thigh).", "Come onto all fours, cushion under your knees. Flatten your back, tighten your tummy."],
      do: ["Keeping your knee bent at a right angle, press one foot back and up, like pressing a footprint into the ceiling.", "Press only as high as your back stays flat — don't arch. Squeeze your bum at the top.", "Lower slowly. 12 reps, then swap legs."],
      cue: "Breathe out as you press up, in as you lower. You'll feel the main muscle of your bum squeezing — not your lower back.",
      heds: "Keep your back flat and still — let your bum do the lift, not your spine. Cushion under the resting knee.",
      swap: "Band fiddly at first? Do it with no band until the movement feels natural, then add it." },

    shoulderpress: { name: "Seated Shoulder Press", focus: "arm",
      what: "Pressing weights up overhead while seated — shapes your shoulders, which is what makes arms look toned and defined.",
      setup: ["Sit tall on your chair, feet flat, back supported.", "Hold a light dumbbell (or filled water bottle) in each hand at shoulder height, palms facing forward, elbows bent."],
      do: ["Press both weights straight up until your arms are nearly straight — but don't lock or snap your elbows.", "Pause briefly at the top.", "Lower slowly back to shoulder height. 10 reps."],
      cue: "Breathe out as you press up, in as you lower. Your shoulders and upper arms should feel tired by the last few reps — that's good.",
      heds: "Stop just before your elbows fully straighten — never lock them out. Start lighter than you think.",
      swap: "Too much overhead? Press up only to eye level, or use lighter bottles, and build the range over time." },
    bicepcurl: { name: "Bicep Curl", focus: "arm",
      what: "Curling weights up toward your shoulders — works the front of your upper arm.",
      setup: ["Sit tall or stand with a light dumbbell/bottle in each hand, arms hanging by your sides, palms facing forward."],
      do: ["Keeping your elbows tucked at your sides, bend your arms to curl the weights up toward your shoulders.", "Squeeze briefly at the top.", "Lower slowly all the way down (count 'one-two'). 12 reps."],
      cue: "Breathe out as you curl up, in as you lower. The slow way down is where the toning happens — don't drop the weight.",
      heds: "Don't lock your elbows straight at the bottom — stop just short, and control the lower.",
      swap: "No weights yet? Two filled water bottles work perfectly to start." },
    tricepkickback: { name: "Tricep Kickback", focus: "arm",
      what: "With support, straightening your arm behind you — targets the back of your upper arm, the exact area you want toned.",
      setup: ["Place one hand and one knee on the seat of your chair, back flat and roughly parallel to the floor.", "Hold a light dumbbell/bottle in your free hand, elbow bent at your side, upper arm level with your body."],
      do: ["Keeping your upper arm still and pinned to your side, straighten your arm to press the weight back behind you.", "Squeeze the back of your arm at the top — don't lock the elbow hard.", "Slowly bend back to the start. 12 reps, then swap arms."],
      cue: "Breathe out as you straighten, in as you bend back. You'll feel the back of your upper arm — this is your target zone.",
      heds: "Support yourself on the chair so your back and shoulder stay safe. Straighten to nearly-straight, not a hard lock.",
      swap: "Bending forward uncomfortable? Sit tall in the chair, lean forward slightly, and do the same arm movement." },
    pullapart: { name: "Band Pull-Apart", focus: "arm",
      what: "Pulling a band apart in front of you — strengthens your upper back and posture, which instantly makes you look more toned and pulled-in.",
      setup: ["Hold a light band with both hands out in front at chest height, arms straight, hands about shoulder-width apart.", "Sit or stand tall."],
      do: ["Keeping your arms straight, pull the band apart, moving your hands out to the sides and squeezing your shoulder-blades together.", "Bring your hands out until the band nearly touches your chest.", "Slowly return with control. 15 reps."],
      cue: "Breathe out as you pull apart, in as you return. You'll feel it across your upper back and shoulders — great for posture.",
      heds: "Shoulders down and relaxed, arms straight but elbows not locked. Use a light band; you don't need much.",
      swap: "No band? Do the same motion with a light towel held taut, squeezing your shoulder-blades together." },
  },

  sessions: {
    warmup: { eyebrow: "Every session · ~5 min", title: "Warm-up", meta: "The same six moves each time — wake the muscles up, don't stretch them out.",
      moves: [["marches", "~1 min"], ["catcow", "× 8"], ["glutebridge", "× 12"], ["kneepushouts", "× 15"], ["armcircles", "10 each way"], ["deadbug", "× 8, light"]] },
    tue: { eyebrow: "Tuesday evening · ~20–25 min", title: "Core + Arms", short: "Core + Arms", meta: "After work, before your PM skincare.",
      moves: [["shoulderpress", "3 × 10"], ["bicepcurl", "3 × 12"], ["tricepkickback", "3 × 12 ea. arm"], ["pullapart", "3 × 15"], ["deadbug", "3 × 10"], ["birddog", "3 × 8 ea. side"], ["pallof", "3 × 20 sec ea. side"], ["sideplank", "3 × 15–20 sec ea. side"]] },
    thu: { eyebrow: "Thursday evening · ~20–25 min", title: "Core + Glutes", short: "Core + Glutes", meta: "After work, before your PM skincare.",
      moves: [["hipthrust", "3 × 12"], ["glutebridge", "3 × 15"], ["clamshell", "3 × 15 ea. side"], ["hipabduction", "3 × 12 ea. leg"], ["kickback", "3 × 12 ea. leg"], ["deadbug", "3 × 10"], ["birddog", "3 × 8 ea. side"], ["heeltaps", "3 × 10"]] },
    sun: { eyebrow: "Sunday · ~30–35 min", title: "Full body", short: "Full body", meta: "Your freest day — the big one.",
      moves: [["hipthrust", "3 × 12"], ["glutebridge", "3 × 15"], ["clamshell", "3 × 15 ea. side"], ["shoulderpress", "3 × 10"], ["bicepcurl", "3 × 12"], ["tricepkickback", "3 × 12 ea. arm"], ["deadbug", "3 × 10"], ["birddog", "3 × 8 ea. side"], ["sideplank", "3 × 15–20 sec ea. side"], ["pallof", "3 × 20 sec ea. side"]],
      extra: "Optional finish — 10 minutes easy on the walking pad while you watch TV. Never mandatory; your fat loss runs on protein, not this." },
  },

  progression: [
    "Weeks 1–2 — lightest band, learn every move, slow and controlled. The easier version is fine.",
    "Weeks 3–4 — add reps (to the top of the range) or step up to the medium band.",
    "Weeks 5–6 — heavier band, a light dumbbell on your hips for thrusts, and lower for a slow count of 3.",
    "Weeks 7–8 — heaviest band, a touch more weight, or a fourth set of your favourites.",
    "Ongoing — when a move feels easy, that's your cue to make it harder.",
  ],
};

/* Session key for a weekday, or null on a Rest day. */
function sessionForDay(dayKey) { return WORKOUT.schedule[dayKey] || null; }

/* ============================================================================
   COMPLETION LOG + TRACKER (streaks & achievements)
   ----------------------------------------------------------------------------
   Log shape: { done: { 'YYYY-MM-DD': { am:true, workout:true, pm:true, protein:true } } }
   Blocks per day: am + pm always; workout only on training days; protein is a
   daily bonus that never breaks a streak. A day is "complete" when its required
   blocks (am, pm, and workout if a training day) are all ticked.
   ============================================================================ */
const LOG_KEY = "ritual.log.v1";
function loadLog() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY)) || { done: {} }; }
  catch (e) { return { done: {} }; }
}
function saveLog(l) { localStorage.setItem(LOG_KEY, JSON.stringify(l)); }

function isDone(dateIso, block) {
  const l = loadLog(); return !!(l.done[dateIso] && l.done[dateIso][block]);
}
function setDone(dateIso, block, val) {
  const l = loadLog();
  const day = l.done[dateIso] || (l.done[dateIso] = {});
  if (val) day[block] = true; else delete day[block];
  if (Object.keys(day).length === 0) delete l.done[dateIso];
  saveLog(l);
}
function toggleDone(dateIso, block) { const now = !isDone(dateIso, block); setDone(dateIso, block, now); return now; }

/* Required blocks for a date (protein excluded — it's a bonus). */
function requiredBlocks(dateIso) {
  const dayKey = DAY_KEYS[fromIso(dateIso).getDay()];
  const req = ["am", "pm"];
  if (sessionForDay(dayKey)) req.push("workout");
  return req;
}
function isCompleteDay(dateIso) {
  const l = loadLog(); const day = l.done[dateIso]; if (!day) return false;
  return requiredBlocks(dateIso).every(b => day[b]);
}

/* Current streak: consecutive complete days ending today (or yesterday if today
   isn't finished yet, so an unfinished today never reads as a broken streak). */
function currentStreak(now) {
  let d = startOfDay(now);
  if (!isCompleteDay(iso(d))) d = addDays(d, -1);
  let n = 0, guard = 0;
  while (guard++ < 1000 && isCompleteDay(iso(d))) { n++; d = addDays(d, -1); }
  return n;
}
function longestStreak() {
  const l = loadLog(); const keys = Object.keys(l.done).sort();
  if (!keys.length) return 0;
  let best = 0, run = 0, cursor = null;
  for (let d = fromIso(keys[0]); d <= fromIso(keys[keys.length - 1]); d = addDays(d, 1)) {
    if (isCompleteDay(iso(d))) { run++; best = Math.max(best, run); } else { run = 0; }
    cursor = d;
  }
  return best;
}
function countBlock(block) {
  const l = loadLog(); let n = 0;
  for (const k in l.done) if (l.done[k][block]) n++;
  return n;
}
function countCompleteDays() {
  const l = loadLog(); let n = 0;
  for (const k in l.done) if (isCompleteDay(k)) n++;
  return n;
}

/* Microneedling sessions the user has confirmed (from the skincare cycle). */
function microSessionsDone() {
  const st = loadState();
  if (!st || !st.answers) return 0;
  return Object.values(st.answers).filter(v => v === "yes").length;
}

/* Optional bonus habits — tracked, but never required for a streak. */
const EXTRA_BLOCKS = ["protein", "water", "vitamins", "move", "sleep"];

/* A "perfect day" = a complete day plus every bonus habit ticked. */
function isPerfectDay(dateIso) {
  if (!isCompleteDay(dateIso)) return false;
  const l = loadLog(); const day = l.done[dateIso] || {};
  return EXTRA_BLOCKS.every(b => day[b]);
}
function countPerfectDays() {
  const l = loadLog(); let n = 0;
  for (const k in l.done) if (isPerfectDay(k)) n++;
  return n;
}

function trackerStats(now) {
  return {
    streak: currentStreak(now),
    longest: longestStreak(),
    workouts: countBlock("workout"),
    protein: countBlock("protein"),
    completeDays: countCompleteDays(),
    am: countBlock("am"),
    pm: countBlock("pm"),
    micro: microSessionsDone(),
    water: countBlock("water"),
    vitamins: countBlock("vitamins"),
    move: countBlock("move"),
    sleep: countBlock("sleep"),
    perfect: countPerfectDays(),
  };
}

/* Achievements — consistency milestones only, never weight or looks. Each has a
   group, a target, and the current value so the UI can show progress. */
function achievements(now) {
  const s = trackerStats(now);
  const A = (id, label, desc, group, value, target) => ({
    id, label, desc, group, value, target,
    earned: value >= target,
    pct: Math.max(0, Math.min(100, Math.round((value / target) * 100))),
  });
  return [
    A("day1",    "First full day",     "Finish one whole day",            "streak",   s.completeDays, 1),
    A("streak3", "3-day streak",        "3 complete days in a row",        "streak",   s.longest, 3),
    A("week1",   "First full week",     "7 complete days in a row",        "streak",   s.longest, 7),
    A("week2",   "Two-week streak",     "14 complete days in a row",       "streak",   s.longest, 14),
    A("month1",  "One month strong",    "28 complete days in a row",       "streak",   s.longest, 28),
    A("week8",   "Eight-week streak",   "56 complete days in a row",       "streak",   s.longest, 56),
    A("club12",  "12-week club",        "84 complete days in total",       "streak",   s.completeDays, 84),

    A("w1",      "First workout",       "Complete any session",            "workout",  s.workouts, 1),
    A("w5",      "Five sessions",       "Do 5 workouts",                   "workout",  s.workouts, 5),
    A("w10",     "Ten sessions",        "Do 10 workouts",                  "workout",  s.workouts, 10),
    A("w25",     "Twenty-five sessions","Do 25 workouts",                  "workout",  s.workouts, 25),
    A("w50",     "Fifty sessions",      "Do 50 workouts",                  "workout",  s.workouts, 50),
    A("w100",    "Century",             "Do 100 workouts",                 "workout",  s.workouts, 100),

    A("am7",     "Morning person",      "7 morning skincare routines",     "skincare", s.am, 7),
    A("pm30",    "Night ritual",        "30 evening skincare routines",    "skincare", s.pm, 30),
    A("needle1", "First needling",      "Confirm a microneedling session", "skincare", s.micro, 1),
    A("needle3", "Needling regular",    "3 microneedling sessions",        "skincare", s.micro, 3),

    A("p7",      "Protein week",        "7 protein days",                  "protein",  s.protein, 7),
    A("p30",     "Protein habit",       "30 protein shakes",               "protein",  s.protein, 30),

    A("water7",  "Hydrated",            "7 days of water",                 "extra",    s.water, 7),
    A("water30", "Well hydrated",       "30 days of water",                "extra",    s.water, 30),
    A("vit7",    "Vitamins on",         "7 days of vitamins",              "extra",    s.vitamins, 7),
    A("vit30",   "Vitamin habit",       "30 days of vitamins",             "extra",    s.vitamins, 30),
    A("move7",   "Moving more",         "7 days of movement",              "extra",    s.move, 7),
    A("move30",  "Mover",               "30 days of movement",             "extra",    s.move, 30),
    A("sleep7",  "Well rested",         "7 good nights' sleep",            "extra",    s.sleep, 7),
    A("sleep30", "Rested habit",        "30 good nights' sleep",           "extra",    s.sleep, 30),

    A("perfect1","First perfect day",   "Tick everything in one day",      "milestone",s.perfect, 1),
    A("perfect7","Perfect week",        "7 perfect days",                  "milestone",s.perfect, 7),
    A("perfect30","Perfectionist",      "30 perfect days",                 "milestone",s.perfect, 30),
  ];
}
