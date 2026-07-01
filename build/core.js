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
      note: "Skip your normal Saturday BHA. Plain routine only.",
      warns: ["No BHA. No glow serum. No spot treatment. No actives at all."],
      steps: [
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser (no cleansing balm needed)",
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "Moisturiser — Purito Oat-In Calming Gel Cream",
        "Lip Essence — Torriden SOLID-IN",
      ],
    },
    Sun: {
      theme: "Recovery — Day 2", accent: "calm",
      amNote: "Normal morning routine. SPF is especially important today.",
      note: "Skip the sleeping mask. Keep it plain. A PDRN gel mask is fine tonight — apply after toner, skip everything else underneath it.",
      warns: ["No actives. No glow serum. No traditional sleeping mask tonight."],
      steps: [
        "Cleanser — Isntree Yam Root Vegan Milk Cleanser (no cleansing balm needed)",
        "Toner — Purito Wonder Releaf Centella",
        "Essence — COSRX Snail 96 Mucin",
        "Moisturiser — Purito Oat-In Calming Gel Cream",
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
