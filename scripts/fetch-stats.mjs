/**
 * fetch-stats.mjs
 * 從 Google Sheets CSV 抓取試教/回饋表單資料，計算統計後寫入 web/data/stats.json
 * Build time 執行：node scripts/fetch-stats.mjs
 *
 * 欄位對應（0-indexed）：
 *   2  = 教案編號  (keyId, e.g. "1.1-IV")
 *   3  = 老師姓名
 *   4  = 學校 / 機構
 *   7  = 提交類型  (A/B/C)
 *   23 = 狀態      ("A" | "R" | "approved" | "needs-revision" | "rejected" | "")
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '../web/data/stats.json');

const THEME_NAMES = {
  1: '氣候科學',
  2: '生態系與生物多樣性',
  3: '氣候正義',
  4: '韌性建構',
  5: '後碳經濟',
  6: '永續生活型態',
};

function normalizeStatus(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'a' || raw === 'approved' || raw === 'approve') return 'approved';
  if (raw === 'r' || raw === 'needs-revision' || raw === 'need-revision' || raw === 'revision') return 'needs-revision';
  if (raw === 'rejected' || raw === 'reject') return 'rejected';
  return raw || 'pending';
}

// ---- CSV parser (handles quoted fields with embedded commas/newlines) ----
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuote) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuote = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ',') { row.push(field.trim()); field = ''; }
      else if (ch === '\n') {
        row.push(field.trim());
        if (row.some(f => f !== '')) rows.push(row);
        row = []; field = '';
      } else if (ch === '\r') { /* skip */ }
      else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field.trim()); if (row.some(f => f !== '')) rows.push(row); }
  return rows;
}

// ---- Main ----
const csvUrl = process.env.STATS_SHEET_CSV_URL;

if (!csvUrl) {
  console.warn('[fetch-stats] STATS_SHEET_CSV_URL not set — writing empty stats');
  writeEmpty();
  process.exit(0);
}

let text;
try {
  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  text = await res.text();
} catch (err) {
  console.error('[fetch-stats] Fetch failed:', err.message);
  writeEmpty();
  process.exit(0);
}

const rows = parseCsv(text);
if (rows.length < 2) {
  console.warn('[fetch-stats] No data rows found');
  writeEmpty();
  process.exit(0);
}

// Skip header row
const submittedRows = rows.slice(1).filter(r => {
  const keyId = (r[2] || '').trim();
  return Boolean(keyId);
});
const approvedRows = submittedRows.filter(r => normalizeStatus(r[23]) === 'approved');
const needsRevisionRows = submittedRows.filter(r => normalizeStatus(r[23]) === 'needs-revision');
const rejectedRows = submittedRows.filter(r => normalizeStatus(r[23]) === 'rejected');
const pendingRows = submittedRows.filter(r => normalizeStatus(r[23]) === 'pending');

// ---- Aggregate ----
const teacherMap = new Map();   // teacher -> { school, themes: Set }
const schoolMap = new Map();    // school -> { teachers: Set, submissions: number, themes: Set }
const themeCount = {};
for (let t = 1; t <= 6; t++) themeCount[t] = 0;

for (const row of approvedRows) {
  const keyId   = (row[2] || '').trim();
  const teacher = (row[3] || '').trim() || '(未填)';
  const school  = (row[4] || '').trim() || '(未填)';

  // 從 keyId 取主題編號（第一個字元）
  const themeNum = parseInt(keyId.charAt(0), 10);
  if (themeNum >= 1 && themeNum <= 6) themeCount[themeNum]++;

  // Teacher map
  if (!teacherMap.has(teacher)) teacherMap.set(teacher, { school, themes: new Set() });
  if (themeNum >= 1 && themeNum <= 6) teacherMap.get(teacher).themes.add(themeNum);

  // School map
  if (!schoolMap.has(school)) schoolMap.set(school, { teachers: new Set(), submissions: 0, themes: new Set() });
  const sm = schoolMap.get(school);
  sm.teachers.add(teacher);
  sm.submissions++;
  if (themeNum >= 1 && themeNum <= 6) sm.themes.add(themeNum);
}

const byTeacher = Array.from(teacherMap.entries())
  .map(([name, v]) => ({
    name,
    school: v.school,
    themes: Array.from(v.themes).sort(),
  }))
  .sort((a, b) => b.themes.length - a.themes.length);

const bySchool = Array.from(schoolMap.entries())
  .map(([school, v]) => ({
    school,
    teachers: v.teachers.size,
    submissions: v.submissions,
    themes: Array.from(v.themes).sort(),
    score: v.submissions * 2 + v.themes.size, // 複合排名：提交數×2 + 主題覆蓋數
  }))
  .sort((a, b) => b.score - a.score);

// KC 覆蓋率：被任一老師試教過的主題數
const coveredThemes = Object.entries(themeCount)
  .filter(([, n]) => n > 0)
  .map(([t]) => parseInt(t, 10));

const stats = {
  totalSubmissions: submittedRows.length,
  approvedSubmissions: approvedRows.length,
  needsRevisionSubmissions: needsRevisionRows.length,
  rejectedSubmissions: rejectedRows.length,
  pendingSubmissions: pendingRows.length,
  teachers: teacherMap.size,
  schools: schoolMap.size,
  kcCoverage: coveredThemes.length,
  byTheme: themeCount,
  themeNames: THEME_NAMES,
  coveredThemes,
  byTeacher,
  bySchool,
  generatedAt: new Date().toISOString(),
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(stats, null, 2), 'utf8');
console.log(`[fetch-stats] Done — 收到 ${submittedRows.length} 筆，通過 ${approvedRows.length} 筆，${teacherMap.size} 位老師，${schoolMap.size} 所學校，KC 覆蓋 ${coveredThemes.length}/6`);

function writeEmpty() {
  const empty = {
    totalSubmissions: 0, approvedSubmissions: 0, needsRevisionSubmissions: 0, rejectedSubmissions: 0, pendingSubmissions: 0,
    teachers: 0, schools: 0, kcCoverage: 0,
    byTheme: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    themeNames: THEME_NAMES, coveredThemes: [], byTeacher: [], bySchool: [],
    generatedAt: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(empty, null, 2), 'utf8');
}
