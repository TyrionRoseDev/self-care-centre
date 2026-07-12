/* ============================================================================
   Self-Care Centre — single server
   ----------------------------------------------------------------------------
   One process that does two jobs:
     1. serves the static app (index.html, sw.js, icons)
     2. runs the web-push reminder API (/api/*) + the cron schedule
   Because it's all one origin, the app talks to /api/... with no CORS and no
   second deployment. Deploy this repo on Coolify with the Dockerfile build pack.
   See DEPLOY.md.
   ============================================================================ */
const fs = require("fs");
const path = require("path");
const express = require("express");
const cron = require("node-cron");
const webpush = require("web-push");

const PORT = process.env.PORT || 8080;
const TZ = process.env.TZ || "Europe/London";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const CHECKIN_TOKEN = process.env.CHECKIN_TOKEN || "";
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const SUBS_FILE = path.join(DATA_DIR, "subscriptions.json");
const CHECKINS_FILE = path.join(DATA_DIR, "checkins.json");
if (!CHECKIN_TOKEN) console.warn("[!] Check-ins are OFF (CHECKIN_TOKEN missing). The app still works; check-ins stay on-device only.");

/* ---- VAPID (push credentials). If absent, the app still serves; reminders are
   simply disabled until the keys are provided as env vars. ---- */
const VAPID_PUBLIC = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:you@example.com";
let pushReady = !!(VAPID_PUBLIC && VAPID_PRIVATE);
if (pushReady) {
  try { webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE); }
  catch (e) { pushReady = false; console.error("[!] Invalid VAPID keys — reminders disabled (app still serves):", e.message); }
}
if (!pushReady) console.warn("[!] Reminders are OFF (VAPID keys missing or invalid). The app still serves normally.");

/* ---- subscription store (flat JSON on the /data volume) ---- */
function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SUBS_FILE)) fs.writeFileSync(SUBS_FILE, "[]");
}
function loadSubs() { try { return JSON.parse(fs.readFileSync(SUBS_FILE, "utf8")); } catch (_) { return []; } }
function saveSubs(list) { fs.writeFileSync(SUBS_FILE, JSON.stringify(list, null, 2)); }
ensureStore();

/* ---- check-in store (nightly Steps / Sleep / Feel, keyed by date) ---- */
function loadCheckins() { try { return JSON.parse(fs.readFileSync(CHECKINS_FILE, "utf8")) || {}; } catch (_) { return {}; } }
function saveCheckins(all) { fs.writeFileSync(CHECKINS_FILE, JSON.stringify(all, null, 2)); }
function upsertCheckin(date, partial) {
  const all = loadCheckins();
  all[date] = { ...(all[date] || {}), ...partial, updated: new Date().toISOString() };
  saveCheckins(all);
  return all[date];
}
const isCheckinDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(String(date || ""));
const isStepCount = (n) => Number.isFinite(n) && n >= 0 && n <= 200000;

async function sendToAll(payload) {
  if (!pushReady) return;
  const subs = loadSubs();
  if (!subs.length) { console.log("[push] no subscribers, skipping:", payload.title); return; }
  const body = JSON.stringify(payload);
  const alive = [];
  for (const s of subs) {
    try { await webpush.sendNotification(s.subscription, body); alive.push(s); }
    catch (err) {
      const code = err.statusCode;
      if (code === 404 || code === 410) console.log("[push] pruning expired subscription");
      else { console.error("[push] send error", code || err.message); alive.push(s); }
    }
  }
  if (alive.length !== subs.length) saveSubs(alive);
  console.log(`[push] sent "${payload.title}" to ${alive.length} device(s)`);
}

const app = express();
app.use(express.json({ limit: "16kb" }));

/* ---- push API under /api (same origin as the app) ---- */
const api = express.Router();
api.get("/health", (_req, res) => res.json({ ok: true, push: pushReady, checkins: !!CHECKIN_TOKEN, subs: loadSubs().length, tz: TZ }));

/* ---- check-ins: health data, so every read AND write needs the token.
   Deliberately a separate token from ADMIN_TOKEN (least privilege) and
   deliberately NOT open like /subscribe (see docs/adr/0003). ---- */
function requireCheckinToken(req, res) {
  if (!CHECKIN_TOKEN) { res.status(503).json({ error: "check-ins not configured — set CHECKIN_TOKEN (see DEPLOY.md)" }); return false; }
  if (req.get("X-Checkin-Token") !== CHECKIN_TOKEN) { res.status(401).json({ error: "unauthorized" }); return false; }
  return true;
}
/* ---- steps adapter (ADR 0004): the Shortcut can't reproduce Health's
   de-duplicated steps total, so it POSTs dumb per-source hourly dumps and the
   merge lives here where it's unit-testable and fixable with a git push. ---- */

/* One source's dump: newline-separated `count|bucketStartISO` lines.
   Timestamps are self-describing so buckets outside the claimed date are
   dropped rather than trusting the phone's date filters (they've lied before —
   see docs/shortcut-checkin.md). Malformed lines and non-positive counts are
   skipped. Returns { "HH": steps } hourly totals.

   "The date" means the owner's wall-clock day in TZ, whatever notation the
   Shortcut serializes — a 23:00 BST bucket arriving as 22:00Z must land in
   hour 23 of the same day, not get dropped as yesterday. (Offset-less strings
   parse as process-local time; the server runs with TZ set, so that's the same
   clock.) */
const bucketClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
});
function parseStepDump(text, date) {
  const buckets = {};
  for (const line of String(text || "").split(/\r?\n/)) {
    const [countRaw, iso] = line.split("|").map(s => (s || "").trim());
    const count = Math.round(Number(countRaw));
    if (!Number.isFinite(count) || count <= 0 || !iso) continue;
    const t = new Date(iso);
    if (isNaN(t)) continue;
    const p = Object.fromEntries(bucketClock.formatToParts(t).map(x => [x.type, x.value]));
    if (`${p.year}-${p.month}-${p.day}` !== date) continue;
    buckets[p.hour] = (buckets[p.hour] || 0) + count;
  }
  return buckets;
}

/* Merge two sources' hourly buckets into one daily total. Both rules
   approximate Health's finer-grained per-slice merge; the winner gets picked
   by replaying real dumps against the Fitness figure (ADR 0004). */
function mergeStepBuckets(watch, phone, rule) {
  const hours = new Set([...Object.keys(watch), ...Object.keys(phone)]);
  let total = 0;
  for (const h of hours) {
    if (rule === "watch-first") total += watch[h] !== undefined ? watch[h] : phone[h];
    else total += Math.max(watch[h] || 0, phone[h] || 0);
  }
  return total;
}

/* Upsert one night. Partial data is a valid Check-in (a bridge may only manage
   steps), so fields merge into whatever the date already holds. */
api.post("/checkin", (req, res) => {
  if (!requireCheckinToken(req, res)) return;
  const { date, steps, sleepHours, feel } = req.body || {};
  if (!isCheckinDate(date)) return res.status(400).json({ error: "date must be YYYY-MM-DD" });
  const entry = {};
  if (steps !== undefined && steps !== null && steps !== "") {
    const n = Math.round(Number(steps));
    if (!isStepCount(n)) return res.status(400).json({ error: "steps must be 0–200000" });
    entry.steps = n;
  }
  if (sleepHours !== undefined && sleepHours !== null && sleepHours !== "") {
    const n = Number(sleepHours);
    if (!Number.isFinite(n) || n < 0 || n > 24) return res.status(400).json({ error: "sleepHours must be 0–24" });
    entry.sleepHours = Math.round(n * 10) / 10;
  }
  if (feel !== undefined && feel !== null && feel !== "") {
    const n = Math.round(Number(feel));
    if (!Number.isFinite(n) || n < 1 || n > 5) return res.status(400).json({ error: "feel must be 1–5" });
    entry.feel = n;
  }
  if (!Object.keys(entry).length) return res.status(400).json({ error: "nothing to save — send steps, sleepHours or feel" });
  res.json({ ok: true, checkin: upsertCheckin(date, entry) });
});
/* Which merge rule approximates the Fitness number best is being picked
   empirically (ADR 0004); flip via env until it settles. watch-first is the
   default because it can only ever report less than hourly-max, and the
   owner's tie-break is "undercount rather than inflate". */
const STEPS_MERGE_RULE = process.env.STEPS_MERGE_RULE === "hourly-max" ? "hourly-max" : "watch-first";
api.post("/checkin/steps", (req, res) => {
  if (!requireCheckinToken(req, res)) return;
  const { date, watch, phone } = req.body || {};
  if (!isCheckinDate(date)) return res.status(400).json({ error: "date must be YYYY-MM-DD" });
  const watchBuckets = parseStepDump(watch, date);
  const phoneBuckets = parseStepDump(phone, date);
  /* Locked-phone guard: HealthKit returns nothing while the iPhone is locked
     and the trigger fires many times a day — never wipe a good value with 0.
     One empty source is a valid day (phone-only days are real). */
  if (!Object.keys(watchBuckets).length && !Object.keys(phoneBuckets).length)
    return res.status(400).json({ error: "both sources empty — phone likely locked, nothing saved" });
  const steps = mergeStepBuckets(watchBuckets, phoneBuckets, STEPS_MERGE_RULE);
  if (!isStepCount(steps)) return res.status(400).json({ error: "steps must be 0–200000" });
  /* Hourly counts are debug-only and deliberately not persisted (movement
     patterns don't belong on a public URL). Daily per-source totals AND both
     candidate rules' answers go to the ephemeral log — that log, next to the
     Fitness app's figure, is the dataset that picks the winning rule. */
  const sum = b => Object.values(b).reduce((a, n) => a + n, 0);
  const alt = r => mergeStepBuckets(watchBuckets, phoneBuckets, r);
  console.log(`[steps] ${date} watch=${sum(watchBuckets)} phone=${sum(phoneBuckets)} watch-first=${alt("watch-first")} hourly-max=${alt("hourly-max")} stored=${steps} rule=${STEPS_MERGE_RULE}`);
  res.json({ ok: true, checkin: upsertCheckin(date, { steps }), rule: STEPS_MERGE_RULE });
});
api.get("/checkins", (req, res) => {
  if (!requireCheckinToken(req, res)) return;
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 366);
  const all = loadCheckins();
  const out = {};
  for (const k of Object.keys(all).sort().slice(-days)) out[k] = all[k];
  res.json({ ok: true, checkins: out });
});
api.post("/subscribe", (req, res) => {
  const { subscription, tz } = req.body || {};
  if (!subscription || !subscription.endpoint) return res.status(400).json({ error: "missing subscription" });
  const subs = loadSubs().filter(s => s.subscription.endpoint !== subscription.endpoint);
  subs.push({ subscription, tz: tz || TZ, added: new Date().toISOString() });
  saveSubs(subs);
  res.json({ ok: true, subs: subs.length });
});
api.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: "missing endpoint" });
  saveSubs(loadSubs().filter(s => s.subscription.endpoint !== endpoint));
  res.json({ ok: true });
});
function requireAdmin(req, res) {
  if (ADMIN_TOKEN && req.get("X-Admin-Token") !== ADMIN_TOKEN) { res.status(401).json({ error: "unauthorized" }); return false; }
  return true;
}
api.post("/test", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  await sendToAll({ title: "Ritual ✨", body: "Reminders are working — see you at your next session.", url: "/", tag: "test" });
  res.json({ ok: true });
});
api.post("/send", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { title, body, url, tag } = req.body || {};
  if (!title) return res.status(400).json({ error: "missing title" });
  await sendToAll({ title, body: body || "", url: url || "/", tag: tag || "custom" });
  res.json({ ok: true });
});
app.use("/api", api);

/* ---- static app. Keep source/infra files off the web. ---- */
app.use((req, res, next) => {
  if (/^\/(node_modules|build|docs|test|push-service|data|\.git|server\.js|package(-lock)?\.json|Dockerfile|DEPLOY\.md|CONTEXT\.md)(\/|$)/.test(req.path))
    return res.status(404).end();
  next();
});
app.use(express.static(__dirname, {
  extensions: ["html"],
  dotfiles: "ignore",
  setHeaders: (res, filePath) => {
    // The app is a single inlined HTML file, so never let the shell go stale —
    // every visit fetches the latest. The service worker must revalidate too.
    if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-store");
    else if (filePath.endsWith("sw.js")) res.setHeader("Cache-Control", "no-cache");
  },
}));

/* ---- reminder schedule (server-local time = TZ). Edit freely.
   cron: minute hour day-of-month month day-of-week ---- */
const SCHEDULE = [
  { cron: "0 8 * * *",  title: "Morning skincare ☀", body: "Your AM routine — cleanse, serums, and SPF.", tag: "am" },
  { cron: "0 12 * * *", title: "Protein 🥤",          body: "Grab your shake — the biggest little win of your day.", tag: "protein" },
  { cron: "0 19 * * 2", title: "Workout time 💪",     body: "Tuesday — Core + Arms. About 20 minutes, then your PM skincare.", tag: "workout" },
  { cron: "0 19 * * 4", title: "Workout time 💪",     body: "Thursday — Core + Glutes. About 20 minutes, then your PM skincare.", tag: "workout" },
  { cron: "0 17 * * 0", title: "Sunday session 💪",   body: "The big one — full body, then straight into your Sunday pamper routine.", tag: "workout" },
  { cron: "0 21 * * *", title: "Evening skincare ☾",  body: "Wind-down routine — and tick off your day.", tag: "pm" },
];
if (pushReady) {
  for (const job of SCHEDULE) {
    if (!cron.validate(job.cron)) { console.error("[cron] invalid:", job.cron); continue; }
    cron.schedule(job.cron, () => sendToAll({ title: job.title, body: job.body, url: "/", tag: job.tag }), { timezone: TZ });
  }
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[self-care-centre] listening on :${PORT}  tz=${TZ}  push=${pushReady ? "on" : "off"}  subscribers=${loadSubs().length}`);
  });
}

module.exports = { app, parseStepDump, mergeStepBuckets };
