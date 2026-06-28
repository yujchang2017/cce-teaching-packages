#!/usr/bin/env node
/**
 * 初始化 CCE SQLite 資料庫結構
 * 用法：node scripts/db-init.mjs
 * 產出：_local/cce.db（已在 .gitignore blocklist 中）
 */
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DB_DIR = join(ROOT, "_local");
const DB_PATH = join(DB_DIR, "cce.db");

if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
-- 教學包主表
CREATE TABLE IF NOT EXISTS packages (
  key_id      TEXT PRIMARY KEY,   -- e.g. '2.1-III'
  theme_num   INTEGER NOT NULL,   -- 1-6
  theme_name  TEXT NOT NULL,      -- e.g. '自然環境'
  subtopic    TEXT NOT NULL,      -- e.g. '生態系與生物多樣性'
  level       TEXT NOT NULL,      -- II/III/IV/V
  level_label TEXT NOT NULL,      -- e.g. '國小中高年級'
  version     TEXT DEFAULT '1.0.0',
  updated_at  TEXT
);

-- 使用事件（從 Google Sheets 同步）
CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp   TEXT NOT NULL,
  uuid        TEXT NOT NULL,
  session_id  TEXT,
  event       TEXT NOT NULL,      -- view_home / view_package / worksheet_click / ...
  key_id      TEXT,               -- → packages.key_id
  meta        TEXT,               -- 原始 JSON
  useragent   TEXT,
  referrer    TEXT,
  screen_width INTEGER,
  duration_ms INTEGER
);
CREATE INDEX IF NOT EXISTS idx_events_key ON events(key_id);
CREATE INDEX IF NOT EXISTS idx_events_event ON events(event);
CREATE INDEX IF NOT EXISTS idx_events_uuid ON events(uuid);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(timestamp);

-- 教師回饋（從 Google Sheets 同步）
CREATE TABLE IF NOT EXISTS feedback (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  submitted_at TEXT NOT NULL,
  key_id      TEXT,               -- → packages.key_id
  rating      INTEGER,            -- 1-5
  comment     TEXT,
  teacher_hash TEXT,              -- 匿名化的教師識別（不存原始個資）
  raw_json    TEXT                -- 原始表單欄位備份
);
CREATE INDEX IF NOT EXISTS idx_feedback_key ON feedback(key_id);

-- 修訂紀錄（手動或腳本寫入）
CREATE TABLE IF NOT EXISTS revisions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  key_id      TEXT NOT NULL,      -- → packages.key_id
  version     TEXT NOT NULL,      -- e.g. '1.1.0'
  revised_at  TEXT NOT NULL,
  changed_files TEXT,             -- JSON array, e.g. ["lesson_plan.html","ppt.html"]
  change_summary TEXT,            -- 改了什麼的簡述
  source      TEXT                -- 'feedback' / 'qa' / 'manual'
);
CREATE INDEX IF NOT EXISTS idx_revisions_key ON revisions(key_id);

-- 統計快照（方便產報表）
CREATE VIEW IF NOT EXISTS v_package_stats AS
SELECT
  p.key_id,
  p.theme_name,
  p.level,
  COUNT(DISTINCT CASE WHEN e.event = 'view_package' THEN e.id END) AS views,
  COUNT(DISTINCT CASE WHEN e.event = 'worksheet_click' THEN e.id END) AS clicks,
  COUNT(DISTINCT e.uuid) AS unique_users,
  COUNT(DISTINCT f.id) AS feedback_count,
  ROUND(AVG(f.rating), 1) AS avg_rating,
  COUNT(DISTINCT r.id) AS revision_count,
  MAX(r.revised_at) AS last_revised
FROM packages p
LEFT JOIN events e ON e.key_id = p.key_id
LEFT JOIN feedback f ON f.key_id = p.key_id
LEFT JOIN revisions r ON r.key_id = p.key_id
GROUP BY p.key_id;
`);

console.log("✅ Database created at", DB_PATH);
console.log("   Tables: packages, events, feedback, revisions");
console.log("   View:   v_package_stats");

db.close();
