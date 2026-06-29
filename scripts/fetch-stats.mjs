/**
 * fetch-stats.mjs
 * 從 Google Sheets CSV 抓取試教/回饋表單資料，計算統計後寫入 web/data/stats.json
 * Build time 執行：node scripts/fetch-stats.mjs
 *
 * 欄位對應：優先依 CSV 標題列辨識「教案編號」「老師姓名」「學校 / 機構」。
 * 若 CSV 沒有標題列，會自動找第一個像 1.1-IV 的欄位，並假設後兩欄是老師與學校。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '../web/data/stats.json');
const ENV_PATHS = [
  path.join(__dirname, '../web/.env.local'),
  path.join(__dirname, '../web/.env'),
];

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

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_／/()（）:：-]/g, '');
}

function findHeaderColumn(headers, candidates) {
  const normalizedCandidates = candidates.map(normalizeHeader);
  const index = headers.findIndex((header) => normalizedCandidates.includes(normalizeHeader(header)));
  return index;
}

function looksLikeKeyId(value) {
  return /^[1-6]\.[0-9]+-[A-Z]+$/i.test(String(value || '').trim());
}

function findKeyIdColumn(rows) {
  const sampleRows = rows.slice(0, 10);
  const maxColumns = Math.max(0, ...sampleRows.map((row) => row.length));
  let bestIndex = -1;
  let bestCount = 0;

  for (let index = 0; index < maxColumns; index++) {
    const count = sampleRows.filter((row) => looksLikeKeyId(row[index])).length;
    if (count > bestCount) {
      bestIndex = index;
      bestCount = count;
    }
  }

  return bestCount > 0 ? bestIndex : -1;
}

function getCell(row, index) {
  return index >= 0 ? row[index] : '';
}

function normalizeOptionalText(value) {
  const text = String(value || '').trim();
  return text && text !== '(未填)' ? text : '';
}

function loadEnvFiles(paths) {
  for (const envPath of paths) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (!key || process.env[key] !== undefined) continue;
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

// ---- Main ----
loadEnvFiles(ENV_PATHS);
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

if (!text.trim()) {
  console.warn('[fetch-stats] CSV URL returned an empty file — check that the published sheet tab contains rows');
  writeEmpty();
  process.exit(0);
}

const rows = parseCsv(text);
if (rows.length < 2) {
  console.warn('[fetch-stats] No data rows found');
  writeEmpty();
  process.exit(0);
}

const headerCandidates = {
  keyId: ['教案編號', '教案代碼', 'keyId', 'key_id', 'packageId', 'package_id'],
  teacher: ['老師姓名', '教師姓名', '教師顯示名稱', '姓名', 'teacher', 'teacherName'],
  school: ['學校／機構', '學校/機構', '學校機構', '學校', '服務學校', '任教學校', 'school'],
  status: ['狀態', '審查狀態', 'status', 'reviewStatus'],
  studentCount: ['學生人數', '學生數', '人數', 'studentCount', 'student_count', 'students'],
  trialDate: ['試教日期', '日期', 'trialDate', 'date'],
  city: ['任教縣市', '縣市', 'city'],
  grade: ['任教年級', '年級', 'grade'],
};

const headers = rows[0];
const headerKeyIdColumn = findHeaderColumn(headers, headerCandidates.keyId);
const hasHeader = headerKeyIdColumn >= 0;
const dataRows = hasHeader ? rows.slice(1) : rows;
const detectedKeyIdColumn = hasHeader ? headerKeyIdColumn : findKeyIdColumn(dataRows);

const columns = {
  keyId: detectedKeyIdColumn >= 0 ? detectedKeyIdColumn : 2,
  teacher: hasHeader ? findHeaderColumn(headers, headerCandidates.teacher) : detectedKeyIdColumn + 1,
  school: hasHeader ? findHeaderColumn(headers, headerCandidates.school) : detectedKeyIdColumn + 2,
  status: hasHeader ? findHeaderColumn(headers, headerCandidates.status) : -1,
  studentCount: hasHeader ? findHeaderColumn(headers, headerCandidates.studentCount) : -1,
  trialDate: hasHeader ? findHeaderColumn(headers, headerCandidates.trialDate) : -1,
  city: hasHeader ? findHeaderColumn(headers, headerCandidates.city) : -1,
  grade: hasHeader ? findHeaderColumn(headers, headerCandidates.grade) : -1,
};
if (columns.teacher < 0) columns.teacher = columns.keyId + 1;
if (columns.school < 0) columns.school = columns.keyId + 2;

const submittedRows = dataRows.filter(r => {
  const keyId = (getCell(r, columns.keyId) || '').trim();
  return Boolean(keyId);
});
const needsRevisionRows = submittedRows.filter(r => normalizeStatus(getCell(r, columns.status)) === 'needs-revision');
const rejectedRows = submittedRows.filter(r => normalizeStatus(getCell(r, columns.status)) === 'rejected');
const pendingRows = submittedRows.filter(r => normalizeStatus(getCell(r, columns.status)) === 'pending');

// ---- Aggregate ----
const packageMap = new Map();   // keyId -> { submissions, teachers: Set, schools: Set, themeNum, students }
const teacherMap = new Map();   // teacher -> { school, submissions, themes: Set, students }
const schoolMap = new Map();    // school -> { teachers: Set, submissions: number, themes: Set, students }
const cityMap = new Map();      // city -> { teachers: Set, schools: Set, submissions }
const themeCount = {};
for (let t = 1; t <= 6; t++) themeCount[t] = 0;
let totalStudents = 0;
let trialSessions = 0; // 有填學生人數的試教次數

for (const row of submittedRows) {
  const keyId   = (getCell(row, columns.keyId) || '').trim();
  const teacher = normalizeOptionalText(getCell(row, columns.teacher));
  const school  = normalizeOptionalText(getCell(row, columns.school));
  const city    = normalizeOptionalText(getCell(row, columns.city));
  const studentCountRaw = (getCell(row, columns.studentCount) || '').trim();
  const studentCount = parseInt(studentCountRaw, 10) || 0;

  if (studentCount > 0) {
    totalStudents += studentCount;
    trialSessions++;
  }

  // 從 keyId 取主題編號（第一個字元）
  const themeNum = parseInt(keyId.charAt(0), 10);
  if (themeNum >= 1 && themeNum <= 6) themeCount[themeNum]++;

  // Package map
  if (!packageMap.has(keyId)) packageMap.set(keyId, { submissions: 0, teachers: new Set(), schools: new Set(), themeNum, students: 0 });
  const pm = packageMap.get(keyId);
  pm.submissions++;
  pm.students += studentCount;
  if (teacher) pm.teachers.add(teacher);
  if (school) pm.schools.add(school);

  // Teacher map
  if (teacher) {
    if (!teacherMap.has(teacher)) teacherMap.set(teacher, { school: school || '未提供學校', submissions: 0, themes: new Set(), students: 0 });
    const tm = teacherMap.get(teacher);
    tm.submissions++;
    tm.students += studentCount;
    if (themeNum >= 1 && themeNum <= 6) tm.themes.add(themeNum);
  }

  // School map
  if (school) {
    if (!schoolMap.has(school)) schoolMap.set(school, { teachers: new Set(), submissions: 0, themes: new Set(), students: 0 });
    const sm = schoolMap.get(school);
    if (teacher) sm.teachers.add(teacher);
    sm.submissions++;
    sm.students += studentCount;
    if (themeNum >= 1 && themeNum <= 6) sm.themes.add(themeNum);
  }

  // City map
  if (city) {
    if (!cityMap.has(city)) cityMap.set(city, { teachers: new Set(), schools: new Set(), submissions: 0 });
    const cm = cityMap.get(city);
    if (teacher) cm.teachers.add(teacher);
    if (school) cm.schools.add(school);
    cm.submissions++;
  }
}

const byTeacher = Array.from(teacherMap.entries())
  .map(([name, v]) => ({
    name,
    school: v.school,
    submissions: v.submissions,
    students: v.students,
    themes: Array.from(v.themes).sort(),
    badge: getBadge(v.submissions, v.themes.size),
  }))
  .sort((a, b) => b.submissions - a.submissions || b.themes.length - a.themes.length);

const byPackage = Array.from(packageMap.entries())
  .map(([keyId, v]) => ({
    keyId,
    submissions: v.submissions,
    students: v.students,
    teachers: v.teachers.size,
    schools: v.schools.size,
    theme: v.themeNum,
    themeName: THEME_NAMES[v.themeNum] ?? '未分類',
  }))
  .sort((a, b) => b.submissions - a.submissions || b.teachers - a.teachers || a.keyId.localeCompare(b.keyId));

const bySchool = Array.from(schoolMap.entries())
  .map(([school, v]) => ({
    school,
    teachers: v.teachers.size,
    submissions: v.submissions,
    students: v.students,
    themes: Array.from(v.themes).sort(),
    score: v.submissions * 2 + v.themes.size,
  }))
  .sort((a, b) => b.score - a.score);

const byCity = Array.from(cityMap.entries())
  .map(([city, v]) => ({
    city,
    teachers: v.teachers.size,
    schools: v.schools.size,
    submissions: v.submissions,
  }))
  .sort((a, b) => b.submissions - a.submissions);

// KC 覆蓋率：被任一老師試教過的主題數
const coveredThemes = Object.entries(themeCount)
  .filter(([, n]) => n > 0)
  .map(([t]) => parseInt(t, 10));

const stats = {
  totalSubmissions: submittedRows.length,
  approvedSubmissions: submittedRows.length,
  needsRevisionSubmissions: needsRevisionRows.length,
  rejectedSubmissions: rejectedRows.length,
  pendingSubmissions: pendingRows.length,
  totalStudents,
  trialSessions,
  teachers: teacherMap.size,
  schools: schoolMap.size,
  cities: cityMap.size,
  kcCoverage: coveredThemes.length,
  byTheme: themeCount,
  themeNames: THEME_NAMES,
  coveredThemes,
  byPackage,
  byTeacher,
  bySchool,
  byCity,
  generatedAt: new Date().toISOString(),
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(stats, null, 2), 'utf8');
console.log(`[fetch-stats] Done — 收到 ${submittedRows.length} 筆，${teacherMap.size} 位老師，${schoolMap.size} 所學校，${packageMap.size} 份教案，KC 覆蓋 ${coveredThemes.length}/6，學生人次 ${totalStudents}（${trialSessions} 次試教）`);
console.log(`[fetch-stats] Columns — header=${hasHeader ? 'yes' : 'no'}, keyId=${columns.keyId + 1}, teacher=${columns.teacher + 1}, school=${columns.school + 1}`);

function writeEmpty() {
  const empty = {
    totalSubmissions: 0, approvedSubmissions: 0, needsRevisionSubmissions: 0, rejectedSubmissions: 0, pendingSubmissions: 0,
    totalStudents: 0, trialSessions: 0,
    teachers: 0, schools: 0, cities: 0, kcCoverage: 0,
    byTheme: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    themeNames: THEME_NAMES, coveredThemes: [], byPackage: [], byTeacher: [], bySchool: [], byCity: [],
    announcements: [],
    generatedAt: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(empty, null, 2), 'utf8');
}

function getBadge(submissions, themeCount) {
  if (themeCount >= 6) return '氣候教育師';
  if (submissions >= 10) return '共學領航';
  if (submissions >= 3) return '青樹';
  if (submissions >= 1) return '新芽';
  return '未授章';
}
