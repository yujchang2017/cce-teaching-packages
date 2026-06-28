#!/usr/bin/env node
/**
 * 從 Google Sheets 同步資料到 SQLite
 * 用法：node scripts/db-sync.mjs
 *
 * 環境變數（放在 .env）：
 *   EVENTS_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/e/.../pub?output=csv
 *   FEEDBACK_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/e/.../pub?output=csv
 *
 * 不需要公開 URL — Google Sheets 的「發佈到網路」功能會產生
 * 一個無法被搜尋引擎索引的 CSV 連結，只有知道 URL 的人能存取。
 */
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DB_PATH = join(ROOT, "_local", "cce.db");
const ENV_PATH = join(ROOT, ".env");

// ---- 載入 .env ----
function loadEnv() {
  if (!existsSync(ENV_PATH)) {
    console.error("❌ 找不到 .env，請先建立（參考 .env.example）");
    process.exit(1);
  }
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

// ---- CSV fetch + parse ----
async function fetchCsv(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  const text = await res.text();
  const [headerLine, ...lines] = text.split("\n").filter(l => l.trim());
  const headers = parseCsvLine(headerLine);
  return lines.map(line => {
    const vals = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  });
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else current += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { result.push(current); current = ""; }
      else current += ch;
    }
  }
  result.push(current);
  return result;
}

// ---- meta JSON 欄位解析 ----
function parseMeta(metaStr) {
  try {
    const m = JSON.parse(metaStr || "{}");
    return {
      session_id: m.sid || null,
      referrer: m.ref || null,
      screen_width: m.sw || null,
      duration_ms: m.durationMs || null,
    };
  } catch { return {}; }
}

// ---- main ----
async function main() {
  loadEnv();
  if (!existsSync(DB_PATH)) {
    console.error("❌ 資料庫不存在，請先執行: node scripts/db-init.mjs");
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // ---- 同步 events ----
  const eventsUrl = process.env.EVENTS_SHEET_CSV_URL;
  if (eventsUrl) {
    console.log("⏳ 同步使用事件...");
    const rows = await fetchCsv(eventsUrl);

    db.exec("DELETE FROM events");
    const insert = db.prepare(`
      INSERT INTO events (timestamp, uuid, session_id, event, key_id, meta, useragent, referrer, screen_width, duration_ms)
      VALUES (@timestamp, @uuid, @session_id, @event, @key_id, @meta, @useragent, @referrer, @screen_width, @duration_ms)
    `);

    const tx = db.transaction((items) => {
      for (const row of items) {
        if (!row.timestamp || !row.event) continue;
        const meta = parseMeta(row.meta);
        insert.run({
          timestamp: row.timestamp,
          uuid: row.uuid || "",
          session_id: meta.session_id,
          event: row.event,
          key_id: row.resource || null,
          meta: row.meta,
          useragent: row.useragent,
          referrer: meta.referrer,
          screen_width: meta.screen_width,
          duration_ms: meta.duration_ms,
        });
      }
    });
    tx(rows);
    console.log(`   ✅ ${rows.length} 筆事件已同步`);
  } else {
    console.log("⏭️  跳過 events（未設定 EVENTS_SHEET_CSV_URL）");
  }

  // ---- 同步 feedback ----
  const feedbackUrl = process.env.FEEDBACK_SHEET_CSV_URL;
  if (feedbackUrl) {
    console.log("⏳ 同步教師回饋...");
    const rows = await fetchCsv(feedbackUrl);

    db.exec("DELETE FROM feedback");
    const insert = db.prepare(`
      INSERT INTO feedback (submitted_at, key_id, rating, comment, teacher_hash, raw_json)
      VALUES (@submitted_at, @key_id, @rating, @comment, @teacher_hash, @raw_json)
    `);

    const tx = db.transaction((items) => {
      for (const row of items) {
        // 欄位名稱需要根據你的 Google Forms 實際欄位調整
        // 以下是常見的對應，你可以跑一次 fetchCsv 看 headers
        const keys = Object.keys(row);
        insert.run({
          submitted_at: row[keys[0]] || "",  // 第一欄通常是 timestamp
          key_id: row[keys[1]] || null,       // 教學包 ID
          rating: parseInt(row[keys[2]]) || null,
          comment: row[keys[3]] || null,
          teacher_hash: null,                 // 不存個資
          raw_json: JSON.stringify(row),
        });
      }
    });
    tx(rows);
    console.log(`   ✅ ${rows.length} 筆回饋已同步`);
  } else {
    console.log("⏭️  跳過 feedback（未設定 FEEDBACK_SHEET_CSV_URL）");
  }

  // ---- 統計摘要 ----
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM events) AS total_events,
      (SELECT COUNT(DISTINCT uuid) FROM events) AS unique_users,
      (SELECT COUNT(*) FROM feedback) AS total_feedback,
      (SELECT COUNT(*) FROM revisions) AS total_revisions
  `).get();

  console.log("\n📊 資料庫摘要:");
  console.log(`   事件: ${stats.total_events} 筆`);
  console.log(`   使用者: ${stats.unique_users} 位`);
  console.log(`   回饋: ${stats.total_feedback} 筆`);
  console.log(`   修訂: ${stats.total_revisions} 筆`);

  db.close();
}

main().catch(err => { console.error("❌", err); process.exit(1); });
