const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");

const tmpDb = path.join(os.tmpdir(), `cigicounter-daily-goal-${process.pid}.db`);
process.env.CIGICOUNTER_DB = tmpDb;
for (const extra of [`${tmpDb}-wal`, `${tmpDb}-shm`]) {
  try {
    fs.unlinkSync(extra);
  } catch (_) {}
}
try {
  fs.unlinkSync(tmpDb);
} catch (_) {}

const express = require("express");
const routes = require("./routes");
const db = require("./db");
const { localToday, migrateLegacyDailyGoal } = require("./dailyGoals");

const app = express();
app.use(express.json());
app.use("/api", routes);

function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const payload = body === undefined ? null : JSON.stringify(body);
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: urlPath,
          method,
          headers: payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
              }
            : {},
        },
        (res) => {
          let raw = "";
          res.on("data", (chunk) => {
            raw += chunk;
          });
          res.on("end", () => {
            server.close();
            let parsed = null;
            if (raw) {
              try {
                parsed = JSON.parse(raw);
              } catch (_) {
                parsed = raw;
              }
            }
            resolve({ status: res.statusCode, body: parsed });
          });
        }
      );
      req.on("error", (err) => {
        server.close();
        reject(err);
      });
      if (payload) req.write(payload);
      req.end();
    });
  });
}

async function main() {
  const today = localToday();

  const empty = await request("GET", "/api/settings/daily-goal");
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.body, { goals: [] });

  const created = await request("PUT", "/api/settings/daily-goal", {
    day: "2026-10-14",
    dailyGoal: 10,
  });
  assert.equal(created.status, 200);
  assert.deepEqual(created.body, { day: "2026-10-14", dailyGoal: 10 });

  const updated = await request("PUT", "/api/settings/daily-goal", {
    day: "2026-10-14",
    dailyGoal: 8,
  });
  assert.equal(updated.status, 200);
  assert.deepEqual(updated.body, { day: "2026-10-14", dailyGoal: 8 });

  const secondDay = await request("PUT", "/api/settings/daily-goal", {
    day: "2026-10-01",
    dailyGoal: 15,
  });
  assert.equal(secondDay.status, 200);

  const listed = await request("GET", "/api/settings/daily-goal");
  assert.equal(listed.status, 200);
  assert.deepEqual(listed.body, {
    goals: [
      { day: "2026-10-01", goal: 15 },
      { day: "2026-10-14", goal: 8 },
    ],
  });

  const badDay = await request("PUT", "/api/settings/daily-goal", {
    day: "2026-02-31",
    dailyGoal: 10,
  });
  assert.equal(badDay.status, 400);

  const badGoal = await request("PUT", "/api/settings/daily-goal", {
    day: "2026-10-20",
    dailyGoal: 201,
  });
  assert.equal(badGoal.status, 400);

  const fractional = await request("PUT", "/api/settings/daily-goal", {
    day: "2026-10-20",
    dailyGoal: 1.5,
  });
  assert.equal(fractional.status, 400);

  const afterInvalid = await request("GET", "/api/settings/daily-goal");
  assert.deepEqual(afterInvalid.body.goals, listed.body.goals);

  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('daily_goal', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(JSON.stringify(12));
  db.prepare(
    "INSERT INTO daily_goals (day, goal) VALUES (?, ?) ON CONFLICT(day) DO UPDATE SET goal = excluded.goal"
  ).run(today, 4);
  migrateLegacyDailyGoal(db);
  const kept = db.prepare("SELECT goal FROM daily_goals WHERE day = ?").get(today);
  assert.equal(kept.goal, 4);
  assert.equal(
    db.prepare("SELECT value FROM settings WHERE key = 'daily_goal'").get(),
    undefined
  );

  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('daily_goal', ?)"
  ).run(JSON.stringify(9));
  migrateLegacyDailyGoal(db);
  const inserted = db
    .prepare("SELECT goal FROM daily_goals WHERE day = ?")
    .get(today);
  assert.equal(inserted.goal, 4);
  assert.equal(
    db.prepare("SELECT value FROM settings WHERE key = 'daily_goal'").get(),
    undefined
  );

  db.prepare("DELETE FROM daily_goals WHERE day = ?").run(today);
  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('daily_goal', ?)"
  ).run(JSON.stringify(9));
  migrateLegacyDailyGoal(db);
  const migrated = db
    .prepare("SELECT goal FROM daily_goals WHERE day = ?")
    .get(today);
  assert.equal(migrated.goal, 9);
  assert.equal(
    db.prepare("SELECT value FROM settings WHERE key = 'daily_goal'").get(),
    undefined
  );

  db.prepare("DELETE FROM cigarettes").run();
  db.prepare("DELETE FROM daily_goals").run();
  const imported = await request("POST", "/api/migrate", {
    cigarettes: [],
    settings: { dailyGoal: 7 },
  });
  assert.equal(imported.status, 200);
  assert.equal(imported.body.migrated, true);
  const afterImport = await request("GET", "/api/settings/daily-goal");
  assert.deepEqual(afterImport.body, {
    goals: [{ day: today, goal: 7 }],
  });

  console.log("ok");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    try {
      db.close();
    } catch (_) {}
    try {
      fs.unlinkSync(tmpDb);
    } catch (_) {}
  });
