/**
 * fetch-announcements.mjs
 * 從 Google Sheets CSV 抓取公告/最新消息，寫入 web/data/announcements.json
 * Build time 執行：node scripts/fetch-announcements.mjs
 *
 * Google Sheet 欄位（建議）：
 *   時間戳記 | 標題 | 內容 | 分類 | 發布者 | 置頂
 *
 * 環境變數：ANNOUNCEMENTS_SHEET_CSV_URL（在 web/.env.local 設定）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '../web/data/announcements.json');
const ENV_PATHS = [
  path.join(__dirname, '../web/.env.local'),
  path.join(__dirname, '../web/.env'),
];

// ---- CSV parser (same as fetch-stats) ----
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
  return String(value || '').trim().toLowerCase().replace(/[\s_／/()（）:：-]/g, '');
}

function findCol(headers, candidates) {
  const normed = candidates.map(normalizeHeader);
  return headers.findIndex(h => normed.includes(normalizeHeader(h)));
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
const csvUrl = process.env.ANNOUNCEMENTS_SHEET_CSV_URL;

if (!csvUrl) {
  console.warn('[fetch-announcements] ANNOUNCEMENTS_SHEET_CSV_URL not set — writing empty');
  writeEmpty();
  process.exit(0);
}

let text;
try {
  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  text = await res.text();
} catch (err) {
  console.error('[fetch-announcements] Fetch failed:', err.message);
  writeEmpty();
  process.exit(0);
}

if (!text.trim()) {
  console.warn('[fetch-announcements] Empty CSV');
  writeEmpty();
  process.exit(0);
}

const rows = parseCsv(text);
if (rows.length < 2) {
  console.warn('[fetch-announcements] No data rows');
  writeEmpty();
  process.exit(0);
}

const headers = rows[0];
const col = {
  timestamp: findCol(headers, ['時間戳記', '時間', 'timestamp', 'date', '日期']),
  title: findCol(headers, ['標題', 'title', '主題']),
  content: findCol(headers, ['內容', '說明', 'content', 'body', 'description']),
  category: findCol(headers, ['分類', '類別', 'category', 'type']),
  author: findCol(headers, ['發布者', '作者', 'author', '姓名']),
  pinned: findCol(headers, ['置頂', 'pinned', 'pin', '釘選']),
};

const dataRows = rows.slice(1);
const announcements = dataRows
  .map(row => {
    const title = (row[col.title] || '').trim();
    if (!title) return null;
    const content = col.content >= 0 ? (row[col.content] || '').trim() : '';
    const category = col.category >= 0 ? (row[col.category] || '').trim() : '公告';
    const author = col.author >= 0 ? (row[col.author] || '').trim() : '';
    const timestamp = col.timestamp >= 0 ? (row[col.timestamp] || '').trim() : '';
    const pinnedRaw = col.pinned >= 0 ? (row[col.pinned] || '').trim().toLowerCase() : '';
    const pinned = pinnedRaw === '是' || pinnedRaw === 'yes' || pinnedRaw === 'true' || pinnedRaw === '1';

    // Parse date from Google Sheets timestamp format (2026/6/29 下午 2:30:00 or 2026-06-29)
    let date = '';
    if (timestamp) {
      const match = timestamp.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
      if (match) {
        date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      }
    }

    return { title, content, category, author, date, pinned };
  })
  .filter(Boolean)
  .sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.date.localeCompare(a.date);
  });

const output = { announcements, generatedAt: new Date().toISOString() };
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf8');
console.log(`[fetch-announcements] Done — ${announcements.length} 則公告`);

function writeEmpty() {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify({ announcements: [], generatedAt: new Date().toISOString() }, null, 2), 'utf8');
}
