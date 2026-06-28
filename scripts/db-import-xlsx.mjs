#!/usr/bin/env node
/**
 * 從本機 xlsx 檔匯入 events 到 SQLite（離線用，不需要 CSV URL）
 * 用法：node scripts/db-import-xlsx.mjs "path/to/events.xlsx"
 */
import { existsSync, readFileSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "_local", "cce.db");

const xlsxPath = process.argv[2];
if (!xlsxPath) {
  console.error("用法: node scripts/db-import-xlsx.mjs <xlsx路徑>");
  process.exit(1);
}

const absPath = resolve(xlsxPath);
if (!existsSync(absPath)) {
  console.error("❌ 找不到檔案:", absPath);
  process.exit(1);
}

import { spawnSync } from "child_process";
const tmpFile = join(__dirname, "..", "_local", "cce_events_tmp.json");
console.log("⏳ 讀取 xlsx...");
const pyScript = `
import pandas as pd, json, sys, math
df = pd.read_excel(sys.argv[1])
records = df.where(df.notna(), None).to_dict('records')
def clean(obj):
    if isinstance(obj, dict):
        return {k: clean(v) for k, v in obj.items()}
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, str) and obj == 'NaT':
        return None
    return obj
records = [clean(r) for r in records]
with open(sys.argv[2], 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, default=str)
print(f'OK: {len(records)} records')
`;
const py = spawnSync("python", ["-c", pyScript, absPath, tmpFile], { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
if (py.status !== 0) { console.error("❌ Python 錯誤:", py.stderr); process.exit(1); }
console.log(py.stdout.trim());
const rows = JSON.parse(readFileSync(tmpFile, "utf8"));

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec("DELETE FROM events");
const insert = db.prepare(`
  INSERT INTO events (timestamp, uuid, session_id, event, key_id, meta, useragent, referrer, screen_width, duration_ms)
  VALUES (@timestamp, @uuid, @session_id, @event, @key_id, @meta, @useragent, @referrer, @screen_width, @duration_ms)
`);

function parseMeta(metaStr) {
  try {
    const m = JSON.parse(metaStr || "{}");
    return { session_id: m.sid || null, referrer: m.ref || null, screen_width: m.sw || null, duration_ms: m.durationMs || null };
  } catch { return {}; }
}

const tx = db.transaction((items) => {
  for (const row of items) {
    const meta = parseMeta(row.meta);
    insert.run({
      timestamp: String(row.timestamp || ""),
      uuid: row.uuid || "",
      session_id: meta.session_id,
      event: row.event || "",
      key_id: row.resource || null,
      meta: row.meta || "{}",
      useragent: row.useragent || "",
      referrer: meta.referrer,
      screen_width: meta.screen_width,
      duration_ms: meta.duration_ms,
    });
  }
});
tx(rows);

console.log(`✅ 已匯入 ${rows.length} 筆事件`);

// 簡單驗證
const check = db.prepare("SELECT COUNT(*) as n FROM events").get();
const users = db.prepare("SELECT COUNT(DISTINCT uuid) as n FROM events").get();
console.log(`   資料庫現有 ${check.n} 筆事件, ${users.n} 位使用者`);

db.close();
