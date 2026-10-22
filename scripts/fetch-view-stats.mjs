/**
 * fetch-view-stats.mjs
 * 從事件試算表「首頁指標」分頁（只發布彙總數字，不含原始紀錄）抓首頁要顯示的使用數字，
 * 寫入 web/data/view-stats.json。Build time 執行：node scripts/fetch-view-stats.mjs
 *
 * 分頁格式（A 欄名稱、B 欄起數字）：
 *   ppt_view,1768            簡報點閱次數
 *   worksheet_view,1276      學習單點閱次數
 *   visitors,850             參訪人數（不重複瀏覽器）
 *   visits,2300              參訪次數（不重複瀏覽工作階段）
 *   （空一列後是近 30 天各教案點閱的樞紐表）
 *   resource,ppt_view,worksheet_view
 *   1.1-III,81,29
 * 沒設定 EVENTS_SUMMARY_CSV_URL 或抓取失敗時全部寫 0，首頁就不顯示這些數字，建置照常進行。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '../web/data/view-stats.json');
const ENV_PATHS = [
  path.join(__dirname, '../web/.env.local'),
  path.join(__dirname, '../web/.env'),
];
const POPULAR_LIMIT = 6;
const EMPTY = { pptViews: 0, worksheetViews: 0, visitors: 0, visits: 0, popular: [] };

function loadEnvFiles(paths) {
  for (const envPath of paths) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
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

function write(data) {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify({ ...data, generatedAt: new Date().toISOString() }, null, 2), 'utf8');
}

// 單列 CSV 切欄（處理引號；數字可能帶千分位，如 "1,768"）
function splitCsvLine(line) {
  const cells = [];
  let field = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuote = false;
      else field += ch;
    } else if (ch === '"') inQuote = true;
    else if (ch === ',') { cells.push(field.trim()); field = ''; }
    else field += ch;
  }
  cells.push(field.trim());
  return cells;
}

const toInt = (value) => parseInt(String(value || '').replace(/,/g, ''), 10) || 0;
const isKeyId = (value) => /^\d+\.\d+-[IVX]+$/i.test(value);

function parseSummary(text) {
  const totals = {};
  const popular = [];
  let pivotCols = null; // 樞紐表標題列：事件名稱 -> 欄位索引
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const cells = splitCsvLine(line);
    const first = cells[0].toLowerCase();
    if (cells.slice(1).includes('ppt_view') || cells.slice(1).includes('worksheet_view')) {
      pivotCols = { ppt: cells.indexOf('ppt_view'), worksheet: cells.indexOf('worksheet_view') };
    } else if (pivotCols && isKeyId(cells[0])) {
      const ppt = pivotCols.ppt > 0 ? toInt(cells[pivotCols.ppt]) : 0;
      const worksheet = pivotCols.worksheet > 0 ? toInt(cells[pivotCols.worksheet]) : 0;
      if (ppt + worksheet > 0) popular.push({ keyId: cells[0], ppt, worksheet });
    } else if (/^[a-z_]+$/.test(first)) {
      totals[first] = toInt(cells[1]);
    }
  }
  popular.sort((a, b) => (b.ppt + b.worksheet) - (a.ppt + a.worksheet) || a.keyId.localeCompare(b.keyId));
  return {
    pptViews: totals.ppt_view ?? 0,
    worksheetViews: totals.worksheet_view ?? 0,
    visitors: totals.visitors ?? 0,
    visits: totals.visits ?? 0,
    popular: popular.slice(0, POPULAR_LIMIT),
  };
}

loadEnvFiles(ENV_PATHS);
const csvUrl = process.env.EVENTS_SUMMARY_CSV_URL;
if (!csvUrl) {
  console.warn('[fetch-view-stats] EVENTS_SUMMARY_CSV_URL not set — 首頁不顯示使用數字');
  write(EMPTY);
  process.exit(0);
}

try {
  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = parseSummary(await res.text());
  write(data);
  console.log(`[fetch-view-stats] Done — 參訪 ${data.visitors} 人／${data.visits} 次，簡報點閱 ${data.pptViews}、學習單點閱 ${data.worksheetViews}，熱門教案 ${data.popular.map((p) => p.keyId).join(', ') || '無'}`);
} catch (err) {
  console.error('[fetch-view-stats] Fetch failed:', err.message);
  write(EMPTY);
}
