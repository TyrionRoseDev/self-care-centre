/* ============================================================================
   Ritual push-service
   ----------------------------------------------------------------------------
   Tiny always-on companion for the Quiet Ritual app. Stores this device's push
   subscription and fires scheduled reminders (workouts + skincare + protein).
   Deploy on Coolify from this folder's Dockerfile. See README.md.
   ============================================================================ */
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const webpush = require("web-push");

const PORT = process.env.PORT || 8080;
const TZ = process.env.TZ || "Europe/London";
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*"; // set to your app's origin in prod
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";     // optional guard for /test and /send
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const SUBS_FILE = path.join(DATA_DIR, "subscriptions.json");

/* ---- VAPID keys ---- */
let VAPID_PUBLIC = process.env.VAPID_PUBLIC;
let VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:you@example.com";
if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  const k = webpush.generateVAPIDKeys();
  VAPID_PUBLIC = k.publicKey; VAPID_PRIVATE = k.privateKey;
  console.warn("\n[!] No VAPID_PUBLIC / VAPID_PRIVATE in the environment — generated a TEMPORARY pair.");
  console.warn("    Set these as env vars in Coolify so they survive restarts, then paste the");
  console.warn("    public key into the app's PUSH_CONFIG. Generated for this run only:");
  console.warn("    VAPID_PUBLIC=" + VAPID_PUBLIC);
  console.warn("    VAPID_PRIVATE=" + VAPID_PRIVATE + "\n");
}
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

/* ---- subscription store (flat JSON file; keep it on a Coolify volume) ---- */
function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SUBS_FILE)) fs.writeFileSync(SUBS_FILE, "[]");
}
function loadSubs() {
  try { return JSON.parse(fs.readFileSync(SUBS_FILE, "utf8")); } catch (_) { return []; }
}
function saveSubs(list) { fs.writeFileSync(SUBS_FILE, JSON.stringify(list, null, 2)); }
ensureStore();

/* ---- push send helper (prunes dead subscriptions) ---- */
async function sendToAll(payload) {
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

/* ---- HTTP API ---- */
const app = express();
app.use(cors({ origin: ALLOW_ORIGIN }));
app.use(express.json({ limit: "16kb" }));

app.get("/health", (_req, res) => res.json({ ok: true, subs: loadSubs().length, tz: TZ }));

app.post("/subscribe", (req, res) => {
  const { subscription, tz } = req.body || {};
  if (!subscription || !subscription.endpoint) return res.status(400).json({ error: "missing subscription" });
  const subs = loadSubs().filter(s => s.subscription.endpoint !== subscription.endpoint);
  subs.push({ subscription, tz: tz || TZ, added: new Date().toISOString() });
  saveSubs(subs);
  res.json({ ok: true, subs: subs.length });
});

app.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: "missing endpoint" });
  saveSubs(loadSubs().filter(s => s.subscription.endpoint !== endpoint));
  res.json({ ok: true });
});

function requireAdmin(req, res) {
  if (ADMIN_TOKEN && req.get("X-Admin-Token") !== ADMIN_TOKEN) { res.status(401).json({ error: "unauthorized" }); return false; }
  return true;
}
// Fire a one-off test notification to confirm the pipe works.
app.post("/test", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  await sendToAll({ title: "Ritual ✨", body: "Reminders are working — see you at your next session.", url: "/", tag: "test" });
  res.json({ ok: true });
});
// Send an arbitrary payload (admin) — handy for tweaking copy.
app.post("/send", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { title, body, url, tag } = req.body || {};
  if (!title) return res.status(400).json({ error: "missing title" });
  await sendToAll({ title, body: body || "", url: url || "/", tag: tag || "custom" });
  res.json({ ok: true });
});

/* ---- schedule (server-local time = TZ). Edit freely. ----
   cron format: minute hour day-of-month month day-of-week  */
const SCHEDULE = [
  { cron: "0 8 * * *",   title: "Morning skincare ☀", body: "Your AM routine — cleanse, serums, and SPF.", tag: "am" },
  { cron: "0 12 * * *",  title: "Protein 🥤",          body: "Grab your shake — the biggest little win of your day.", tag: "protein" },
  { cron: "0 19 * * 2",  title: "Workout time 💪",     body: "Tuesday — Core + Arms. About 20 minutes, then your PM skincare.", tag: "workout" },
  { cron: "0 19 * * 4",  title: "Workout time 💪",     body: "Thursday — Core + Glutes. About 20 minutes, then your PM skincare.", tag: "workout" },
  { cron: "0 17 * * 0",  title: "Sunday session 💪",   body: "The big one — full body, then straight into your Sunday pamper routine.", tag: "workout" },
  { cron: "0 21 * * *",  title: "Evening skincare ☾",  body: "Wind-down routine — and tick off your day.", tag: "pm" },
];
for (const job of SCHEDULE) {
  if (!cron.validate(job.cron)) { console.error("[cron] invalid expression:", job.cron); continue; }
  cron.schedule(job.cron, () => sendToAll({ title: job.title, body: job.body, url: "/", tag: job.tag }), { timezone: TZ });
}

app.listen(PORT, () => {
  console.log(`[ritual-push] listening on :${PORT}  tz=${TZ}  subscribers=${loadSubs().length}`);
  console.log(`[ritual-push] VAPID public key:\n${VAPID_PUBLIC}`);
});
