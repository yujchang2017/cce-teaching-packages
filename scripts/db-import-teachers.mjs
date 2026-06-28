#!/usr/bin/env node
/**
 * 從本機 xlsx 匯入教師基本資料 + 報名表到 SQLite（僅限本機使用）
 * 用法：node scripts/db-import-teachers.mjs <基本資料.xlsx> [報名表.xlsx]
 */
import { existsSync, readFileSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "_local", "cce.db");

function loadXlsx(filePath) {
  const absPath = resolve(filePath);
  if (!existsSync(absPath)) { console.error("❌ 找不到:", absPath); process.exit(1); }
  const tmpFile = join(__dirname, "..", "_local", "cce_tmp_" + Date.now() + ".json");
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
  try { require("fs").unlinkSync(tmpFile); } catch {}
  return rows;
}

const profilePath = process.argv[2];
const regPath = process.argv[3];
if (!profilePath) {
  console.error("用法: node scripts/db-import-teachers.mjs <基本資料.xlsx> [報名表.xlsx]");
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// 建立 teachers 表（合併基本資料 + 報名表）
db.exec(`
  DROP TABLE IF EXISTS teachers;
  CREATE TABLE teachers (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT UNIQUE,
    teacher_name  TEXT,
    school        TEXT,
    county        TEXT,
    grade_level   TEXT,
    role          TEXT,
    specialty     TEXT,
    phone         TEXT,
    is_env_edu    INTEGER DEFAULT 0,
    cc_by_sa      INTEGER DEFAULT 0,
    portrait_ok   INTEGER DEFAULT 0,
    privacy_ok    INTEGER DEFAULT 0,
    registered_at TEXT,
    profile_at    TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
  CREATE INDEX IF NOT EXISTS idx_teachers_county ON teachers(county);
`);

const upsert = db.prepare(`
  INSERT INTO teachers (email, teacher_name, school, county, grade_level, role, specialty, phone, is_env_edu, cc_by_sa, portrait_ok, privacy_ok, registered_at, profile_at)
  VALUES (@email, @teacher_name, @school, @county, @grade_level, @role, @specialty, @phone, @is_env_edu, @cc_by_sa, @portrait_ok, @privacy_ok, @registered_at, @profile_at)
  ON CONFLICT(email) DO UPDATE SET
    teacher_name = COALESCE(excluded.teacher_name, teachers.teacher_name),
    school = COALESCE(excluded.school, teachers.school),
    county = COALESCE(excluded.county, teachers.county),
    grade_level = COALESCE(excluded.grade_level, teachers.grade_level),
    role = COALESCE(excluded.role, teachers.role),
    specialty = COALESCE(excluded.specialty, teachers.specialty),
    phone = COALESCE(excluded.phone, teachers.phone),
    is_env_edu = MAX(excluded.is_env_edu, teachers.is_env_edu),
    cc_by_sa = MAX(excluded.cc_by_sa, teachers.cc_by_sa),
    portrait_ok = MAX(excluded.portrait_ok, teachers.portrait_ok),
    privacy_ok = MAX(excluded.privacy_ok, teachers.privacy_ok),
    registered_at = COALESCE(excluded.registered_at, teachers.registered_at),
    profile_at = COALESCE(excluded.profile_at, teachers.profile_at)
`);

// ---- 匯入基本資料表 ----
console.log("\n📋 匯入基本資料表...");
const profiles = loadXlsx(profilePath);
const txProfile = db.transaction((items) => {
  for (const row of items) {
    if (!row["電子郵件地址"]) continue;
    const privacy = String(row["個資同意\n我們將收集您的電子郵件和基本信息，以便在您完成回饋後，統計個別與校別相關資料，作為提供獎勵參考。蒐集相關資訊僅用於此目的，不會用於其他用途。  "] || "");
    upsert.run({
      email: row["電子郵件地址"],
      teacher_name: row["老師姓名"] || null,
      school: row["學校 / 機構"] || null,
      county: row["任教縣市"] || null,
      grade_level: row["任教年段"] || null,
      role: null,
      specialty: null,
      phone: null,
      is_env_edu: 0,
      cc_by_sa: row["CC-BY-SA 4.0 授權同意"] ? 1 : 0,
      portrait_ok: row["肖像權同意"] ? 1 : 0,
      privacy_ok: privacy.includes("同意") ? 1 : 0,
      registered_at: null,
      profile_at: String(row["時間戳記"] || ""),
    });
  }
});
txProfile(profiles);

// ---- 匯入報名表 ----
if (regPath) {
  console.log("\n📋 匯入報名表...");
  const regs = loadXlsx(regPath);
  const txReg = db.transaction((items) => {
    for (const row of items) {
      if (!row["電子郵件地址"]) continue;
      const envEdu = String(row["是否(曾)為單位環境教育人員"] || "");
      upsert.run({
        email: row["電子郵件地址"],
        teacher_name: row["姓名"] || null,
        school: row["任職單位 / 學校名稱"] || null,
        county: row["服務縣市"] || null,
        grade_level: null,
        role: row["職稱"] || null,
        specialty: row["專長或任教領域 (可複選)"] || null,
        phone: row["聯絡電話/或常用 mail（作為視訊連結通知用，若無則免填）"] || null,
        is_env_edu: envEdu.includes("是") || envEdu.includes("目前") ? 1 : 0,
        cc_by_sa: 0,
        portrait_ok: 0,
        privacy_ok: 0,
        registered_at: String(row["時間戳記"] || ""),
        profile_at: null,
      });
    }
  });
  txReg(regs);
}

const s = db.prepare(`
  SELECT COUNT(*) as n, COUNT(DISTINCT county) as c,
    SUM(CASE WHEN registered_at IS NOT NULL AND registered_at != '' THEN 1 ELSE 0 END) as reg,
    SUM(CASE WHEN profile_at IS NOT NULL AND profile_at != '' THEN 1 ELSE 0 END) as prof
  FROM teachers
`).get();
console.log(`\n✅ ${s.n} 位教師 | ${s.c} 個縣市 | ${s.reg} 已報名 | ${s.prof} 已填基本資料`);
db.close();
