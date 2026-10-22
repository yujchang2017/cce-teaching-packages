/**
 * fetch-view-stats.mjs
 * 從事件試算表「首頁指標」分頁（只發布彙總數字，不含原始紀錄）抓簡報／學習單點閱次數，
 * 寫入 web/data/view-stats.json。Build time 執行：node scripts/fetch-view-stats.mjs
 *
 * 分頁格式：A 欄事件名稱、B 欄次數，例如
 *   ppt_view,1768
 *   worksheet_view,1276
 * 沒設定 EVENTS_SUMMARY_CSV_URL 或抓取失敗時寫入 0，首頁就不顯示這兩個數字，建置照常進行。
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

function write(pptViews, worksheetViews) {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify({ pptViews, worksheetViews, generatedAt: new Date().toISOString() }, null, 2), 'utf8');
}

// 只需兩欄、不含引號內逗號的簡單 CSV；數字可能帶千分位（"1,768"），先去引號再去逗號
function parseCounts(text) {
  const counts = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*"?([a-z_]+)"?\s*,\s*"?([\d,]+)"?/i);
    if (m) counts[m[1].toLowerCase()] = parseInt(m[2].replace(/,/g, ''), 10) || 0;
  }
  return counts;
}

loadEnvFiles(ENV_PATHS);
const csvUrl = process.env.EVENTS_SUMMARY_CSV_URL;
if (!csvUrl) {
  console.warn('[fetch-view-stats] EVENTS_SUMMARY_CSV_URL not set — 首頁不顯示點閱次數');
  write(0, 0);
  process.exit(0);
}

try {
  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const counts = parseCounts(await res.text());
  const pptViews = counts.ppt_view ?? 0;
  const worksheetViews = counts.worksheet_view ?? 0;
  write(pptViews, worksheetViews);
  console.log(`[fetch-view-stats] Done — 簡報點閱 ${pptViews}、學習單點閱 ${worksheetViews}`);
} catch (err) {
  console.error('[fetch-view-stats] Fetch failed:', err.message);
  write(0, 0);
}
