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
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const SUBS_FILE = path.join(DATA_DIR, "subscriptions.json");

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
api.get("/health", (_req, res) => res.json({ ok: true, push: pushReady, subs: loadSubs().length, tz: TZ }));
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
  if (/^\/(node_modules|build|docs|push-service|data|\.git|server\.js|package(-lock)?\.json|Dockerfile|DEPLOY\.md|CONTEXT\.md)(\/|$)/.test(req.path))
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

app.listen(PORT, () => {
  console.log(`[self-care-centre] listening on :${PORT}  tz=${TZ}  push=${pushReady ? "on" : "off"}  subscribers=${loadSubs().length}`);
});
