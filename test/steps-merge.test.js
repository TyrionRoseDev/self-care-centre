/* Tests for the ADR 0004 steps adapter: pure merge functions + the
   POST /api/checkin/steps route. Uses node's built-in test runner. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Isolate the store and enable check-ins BEFORE the server module loads.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "checkins-test-"));
process.env.CHECKIN_TOKEN = "test-token";

const { app, parseStepDump, mergeStepBuckets } = require("../server.js");

/* Boot the real app on an ephemeral port and speak HTTP to it, exactly as the
   Shortcut does. */
let server, base;
test.before(() => new Promise(resolve => {
  server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; resolve(); });
}));
test.after(() => server.close());

async function postSteps(body, token = "test-token") {
  const res = await fetch(`${base}/api/checkin/steps`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { "X-Checkin-Token": token } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function getCheckin(date) {
  const res = await fetch(`${base}/api/checkins?days=366`, { headers: { "X-Checkin-Token": "test-token" } });
  return (await res.json()).checkins[date];
}

const DATE = "2026-07-11";
const dump = (pairs) => pairs.map(([count, hour]) => `${count}|${DATE}T${hour}:00:00+01:00`).join("\n");

test("hourly-max takes the larger source per hour and sums", () => {
  // Watch and phone overlap 09:00 and 10:00; phone alone has 11:00 (Watch on charge).
  const watch = parseStepDump(dump([[500, "09"], [700, "10"]]), DATE);
  const phone = parseStepDump(dump([[450, "09"], [900, "10"], [300, "11"]]), DATE);
  assert.equal(mergeStepBuckets(watch, phone, "hourly-max"), 500 + 900 + 300);
});

test("watch-first trusts the Watch for any hour it recorded, phone otherwise", () => {
  const watch = parseStepDump(dump([[500, "09"], [700, "10"]]), DATE);
  const phone = parseStepDump(dump([[450, "09"], [900, "10"], [300, "11"]]), DATE);
  // 10:00 keeps the Watch's 700 even though the phone claims more.
  assert.equal(mergeStepBuckets(watch, phone, "watch-first"), 500 + 700 + 300);
});

test("parseStepDump keeps only positive counts stamped with the claimed date", () => {
  const text = [
    `500|${DATE}T09:00:00+01:00`,   // good
    `120|2026-07-10T23:00:00+01:00`, // previous day — Shortcuts date filters are not trusted
    `0|${DATE}T10:00:00+01:00`,      // zero — HealthKit noise, not steps
    `oops|${DATE}T11:00:00+01:00`,   // garbage count
    `300`,                            // no timestamp
    "",                               // blank line
    `250|${DATE}T09:30:00+01:00`,    // same hour as the first line — summed
  ].join("\n");
  assert.deepEqual(parseStepDump(text, DATE), { "09": 750 });
});

test("parseStepDump buckets by wall-clock time even when Shortcuts emits UTC", () => {
  // 23:00 BST on the 11th serialized as 22:00Z — same moment, and it must land
  // in the 11th's hour 23, not get silently dropped as "wrong date".
  assert.deepEqual(parseStepDump(`400|2026-07-11T22:00:00Z`, DATE), { "23": 400 });
  // Midnight-adjacent the other way: 23:30Z on the 10th is 00:30 BST on the 11th.
  assert.deepEqual(parseStepDump(`200|2026-07-10T23:30:00Z`, DATE), { "00": 200 });
});

test("parseStepDump tolerates Shortcuts' locale rendering of counts", () => {
  // A health sample's Value can arrive as "1,234" or "1,234 count" depending on
  // how the Shortcut serializes it — dropping those lines would silently
  // undercount every busy hour.
  const text = [
    `1,234|${DATE}T09:00:00+01:00`,
    `567 count|${DATE}T10:00:00+01:00`,
    `89.0|${DATE}T11:00:00+01:00`,
  ].join("\n");
  assert.deepEqual(parseStepDump(text, DATE), { "09": 1234, "10": 567, "11": 89 });
});

test("parseStepDump of nothing is an empty day, not an error", () => {
  assert.deepEqual(parseStepDump("", DATE), {});
  assert.deepEqual(parseStepDump(undefined, DATE), {});
});

test("POST /api/checkin/steps stores the merged daily total as a plain check-in", async () => {
  const { status, body } = await postSteps({
    date: DATE,
    watch: dump([[500, "09"], [700, "10"]]),
    phone: dump([[450, "09"], [900, "10"], [300, "11"]]),
  });
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  const stored = await getCheckin(DATE);
  // Merged, not summed (12k-vs-11k overcount is the whole reason this route
  // exists), and merged with watch-first — the never-inflate default until the
  // empirical replay picks a winner (ADR 0004).
  assert.equal(stored.steps, 500 + 700 + 300);
  // Indistinguishable from a manual entry: no per-hour data persisted.
  assert.deepEqual(Object.keys(stored).sort(), ["steps", "updated"]);
});

test("both sources empty → 400 and yesterday's good value survives (locked-phone guard)", async () => {
  const date = "2026-07-09";
  await postSteps({ date, watch: dump([[8000, "12"]]).replaceAll(DATE, date), phone: "" });
  const { status } = await postSteps({ date, watch: "", phone: "" });
  assert.equal(status, 400);
  assert.equal((await getCheckin(date)).steps, 8000);
});

test("steps route needs the check-in token, like every other health read/write", async () => {
  assert.equal((await postSteps({ date: DATE, watch: dump([[100, "09"]]) }, null)).status, 401);
  assert.equal((await postSteps({ date: DATE, watch: dump([[100, "09"]]) }, "wrong")).status, 401);
});

test("merged steps land beside an existing manual check-in without touching it", async () => {
  const date = "2026-07-08";
  await fetch(`${base}/api/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Checkin-Token": "test-token" },
    body: JSON.stringify({ date, sleepHours: 7.5, feel: 4 }),
  });
  await postSteps({ date, phone: dump([[4000, "14"]]).replaceAll(DATE, date) });
  assert.deepEqual(await getCheckin(date).then(({ updated, ...rest }) => rest), { sleepHours: 7.5, feel: 4, steps: 4000 });
});
