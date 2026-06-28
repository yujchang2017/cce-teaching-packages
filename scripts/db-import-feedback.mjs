#!/usr/bin/env node
/**
 * 從本機回饋 xlsx 匯入 feedback 到 SQLite（完整欄位，僅限本機使用）
 * 用法：node scripts/db-import-feedback.mjs "path/to/回饋.xlsx"
 */
import { existsSync, readFileSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "_local", "cce.db");

const xlsxPath = process.argv[2];
if (!xlsxPath) { console.error("用法: node scripts/db-import-feedback.mjs <xlsx路徑>"); process.exit(1); }
const absPath = resolve(xlsxPath);
if (!existsSync(absPath)) { console.error("❌ 找不到:", absPath); process.exit(1); }

const tmpFile = join(__dirname, "..", "_local", "cce_feedback_tmp.json");

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

// 重建 feedback 表（完整欄位）
db.exec(`
  DROP TABLE IF EXISTS feedback;
  CREATE TABLE feedback (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    submitted_at  TEXT,
    key_id        TEXT,
    email         TEXT,
    teacher_name  TEXT,
    school        TEXT,
    county        TEXT,
    grade_level   TEXT,
    student_count INTEGER,
    wants_update  INTEGER DEFAULT 0,
    raw_json      TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_feedback_key ON feedback(key_id);
  CREATE INDEX IF NOT EXISTS idx_feedback_teacher ON feedback(email);
`);

const insert = db.prepare(`
  INSERT INTO feedback (submitted_at, key_id, email, teacher_name, school, county, grade_level, student_count, wants_update)
  VALUES (@submitted_at, @key_id, @email, @teacher_name, @school, @county, @grade_level, @student_count, @wants_update)
`);

const tx = db.transaction((items) => {
  let skipped = 0;
  for (const row of items) {
    if (!row["電子郵件地址"] && !row["教案編號"]) { skipped++; continue; }
    const keyId = String(row["教案編號"] || "").replace(/-(iv|iii|ii|v)$/i, m => m.toUpperCase());
    const updatePref = row["教案改版或更新"] || "";
    insert.run({
      submitted_at: String(row["試教日期"] || ""),
      key_id: keyId || null,
      email: row["電子郵件地址"] || null,
      teacher_name: row["老師姓名"] || null,
      school: row["學校/機構"] || null,
      county: row["任教縣市"] || null,
      grade_level: row["任教年級"] || null,
      student_count: row["學生人數"] ? parseInt(row["學生人數"]) : null,
      wants_update: updatePref.includes("通知") ? 1 : 0,
    });
  }
});
tx(rows);

const s = db.prepare("SELECT COUNT(*) as n, COUNT(DISTINCT email) as t, COUNT(DISTINCT key_id) as p, COUNT(DISTINCT county) as c FROM feedback").get();
console.log(`✅ ${s.n} 筆回饋 | ${s.t} 位教師 | ${s.p} 個教學包 | ${s.c} 個縣市`);
db.close();
