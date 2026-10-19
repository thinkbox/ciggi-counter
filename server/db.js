// Opens the SQLite file and creates the tables the first time the app runs.
// `CIGICOUNTER_DB` overrides the file path, which the tests use so they
// do not write the real data/cigicounter.db.

const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const dataDir = path.join(__dirname, "..", "data");
const dbPath =
  process.env.CIGICOUNTER_DB || path.join(dataDir, "cigicounter.db");

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS cigarettes (
    id TEXT PRIMARY KEY,
    smoked_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  CREATE TABLE IF NOT EXISTS daily_goals (
    day TEXT PRIMARY KEY,
    goal INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS brands_name_nocase ON brands(name COLLATE NOCASE);
  CREATE TABLE IF NOT EXISTS packs (
    id TEXT PRIMARY KEY,
    brand_id TEXT NOT NULL,
    size INTEGER NOT NULL,
    cost_cents INTEGER NOT NULL,
    opened_at TEXT NOT NULL,
    given_away INTEGER NOT NULL DEFAULT 0
  );
`);

const { migrateLegacyDailyGoal } = require("./dailyGoals");
migrateLegacyDailyGoal(db);

module.exports = db;
