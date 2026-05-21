#!/usr/bin/env node
/**
 * weekly-merge.mjs — 每週一把 approved 改編提交合併到網站
 *
 * ═══════════════════════════════════════════════════════════════
 * 執行前提
 * ═══════════════════════════════════════════════════════════════
 * 1. 從 Google Sheet 匯出 CSV（篩選：狀態=approved 且 PR連結=空白）
 *    Sheet → 檔案 → 下載 → .csv (目前工作表)
 *
 * 2. 設好 GITHUB_PAT 環境變數（fine-grained PAT，限 community-cce-tw repo）
 *    必要 permissions: Contents: Read & write, Pull requests: Read & write
 *
 * ═══════════════════════════════════════════════════════════════
 * 使用方式
 * ═══════════════════════════════════════════════════════════════
 *
 *   node scripts/weekly-merge.mjs --csv ~/Downloads/approved.csv
 *
 *   選用旗標:
 *     --dry-run     只顯示會做什麼，不真正呼叫 GitHub API
 *     --repo        目標 repo，預設 yujchang2017/community-cce-tw
 *     --branch      要 PR 進的目標分支，預設 main
 *
 * ═══════════════════════════════════════════════════════════════
 * 流程說明
 * ═══════════════════════════════════════════════════════════════
 * 1. 讀取 CSV，過濾出「狀態=approved 且 PR連結=空白」的列
 * 2. 讀取 web/data/remixes.json（若不存在則從空陣列開始）
 * 3. 對每筆新 approved 提交，組成一個 RemixEntry 物件
 *    (去重：teacherName+keyId 已存在就略過)
 * 4. 寫回 web/data/remixes.json
 * 5. 用 GitHub API 建立分支 weekly-merge-YYYY-MM-DD
 * 6. 把更新後的 remixes.json 以 PUT /contents API 推上去
 * 7. 開 PR，PR body 列出本次合併的所有提交
 * 8. 輸出 PR 連結（請維護者手動 review 後 merge）
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT       = resolve(__dirname, '..');
const REMIXES_PATH = resolve(ROOT, 'web', 'data', 'remixes.json');

// ── CLI 解析 ─────────────────────────────────────────────────
const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const csvFlag = args.indexOf('--csv');
const CSV_PATH = csvFlag >= 0 ? resolve(args[csvFlag + 1]) : null;
const repoFlag = args.indexOf('--repo');
const REPO     = repoFlag >= 0 ? args[repoFlag + 1] : 'yujchang2017/community-cce-tw';
const branchFlag = args.indexOf('--branch');
const BASE_BRANCH = branchFlag >= 0 ? args[branchFlag + 1] : 'main';

const PAT = process.env.GITHUB_PAT;

// ── 入口 ────────────────────────────────────────────────────
if (!CSV_PATH) {
  console.error('❌  請指定 CSV 檔案路徑：--csv <file>');
  process.exit(1);
}
if (!existsSync(CSV_PATH)) {
  console.error(`❌  找不到 CSV 檔案：${CSV_PATH}`);
  process.exit(1);
}
if (!DRY_RUN && !PAT) {
  console.error('❌  請設定環境變數 GITHUB_PAT');
  console.error('    export GITHUB_PAT=github_pat_xxxxxxxxxxxx');
  process.exit(1);
}

main().catch(err => { console.error('❌ ', err.message); process.exit(1); });

// ════════════════════════════════════════════════════════════
async function main() {
  console.log(`📂  讀取 CSV：${CSV_PATH}`);
  const rows = parseCsv(readFileSync(CSV_PATH, 'utf-8'));

  // 過濾：狀態=approved 且 PR連結=空白
  const approved = rows.filter(r => {
    const status = (r['狀態'] ?? r['状態'] ?? '').trim().toLowerCase();
    const prLink = (r['PR 連結'] ?? r['PR連結'] ?? '').trim();
    return status === 'approved' && !prLink;
  });

  if (approved.length === 0) {
    console.log('ℹ️   沒有待合併的 approved 提交，結束。');
    return;
  }
  console.log(`✅  找到 ${approved.length} 筆待合併提交`);

  // 讀取現有 remixes
  const existingRemixes = existsSync(REMIXES_PATH)
    ? JSON.parse(readFileSync(REMIXES_PATH, 'utf-8'))
    : [];

  // 去重 key = keyId + teacherName
  const existingKeys = new Set(
    existingRemixes.map(r => `${r.keyId}::${r.teacherName}`)
  );

  const newEntries = [];
  for (const row of approved) {
    const keyId       = (row['教案編號'] ?? '').trim();
    const teacherName = (row['老師姓名'] ?? '').trim();
    const school      = (row['學校 / 機構'] ?? row['學校/機構'] ?? '').trim();
    const date        = formatDate(row['試教日期'] || row['審核日期'] || row['時間戳記'] || '');
    const title       = buildTitle(row);
    const score       = Number(row['審核員評分']) || 0;
    const badge       = (row['徽章類型'] ?? '').trim();

    if (!keyId || !teacherName) {
      console.warn(`⚠️   略過：教案編號或老師姓名為空（列：${JSON.stringify(row)}）`);
      continue;
    }

    const dedupeKey = `${keyId}::${teacherName}`;
    if (existingKeys.has(dedupeKey)) {
      console.log(`⏭️   略過重複：${keyId} · ${teacherName}`);
      continue;
    }

    // prNumber/prUrl 會在 PR 建立後由維護者手動填回 Sheet
    // 這裡暫用 0 / '' 作占位符，PR 建立後更新
    const entry = {
      keyId,
      prNumber: 0,         // PR 建立後請手動更新
      prUrl: '',           // 同上
      teacherName,
      school: school || undefined,
      date: date || new Date().toISOString().slice(0, 10),
      title: title || undefined,
      stars: score >= 4 ? score : 0,
      badge: badge || undefined,
    };

    // 移除 undefined 欄位
    Object.keys(entry).forEach(k => entry[k] === undefined && delete entry[k]);

    newEntries.push(entry);
    existingKeys.add(dedupeKey);
    console.log(`  ➕  ${keyId} · ${teacherName}（${school || '學校未填'}）`);
  }

  if (newEntries.length === 0) {
    console.log('ℹ️   所有提交皆已合併過，沒有新條目，結束。');
    return;
  }

  const updatedRemixes = [...existingRemixes, ...newEntries];

  if (DRY_RUN) {
    console.log('\n🔍  --dry-run 模式，不實際呼叫 GitHub API');
    console.log('    會寫入 remixes.json 並建立 PR，內容如下：');
    console.log(JSON.stringify(newEntries, null, 2));
    return;
  }

  // 寫本機 remixes.json（供參考，實際以 GitHub 版本為準）
  writeFileSync(REMIXES_PATH, JSON.stringify(updatedRemixes, null, 2) + '\n', 'utf-8');
  console.log(`\n💾  已更新本機 ${REMIXES_PATH}`);

  // ── GitHub API ──────────────────────────────────────────
  const today      = new Date().toISOString().slice(0, 10);
  const newBranch  = `weekly-merge-${today}`;
  const filePath   = 'web/data/remixes.json';
  const commitMsg  = `chore: weekly remix merge ${today} (${newEntries.length} 筆)`;

  console.log(`\n🐙  GitHub repo：${REPO}`);

  // 1. 取得 main 分支的最新 commit SHA
  const mainRef = await ghGet(`/repos/${REPO}/git/ref/heads/${BASE_BRANCH}`);
  const baseSha = mainRef.object.sha;
  console.log(`    main SHA：${baseSha.slice(0, 7)}`);

  // 2. 取得現有檔案的 blob SHA（用於 PUT）
  let existingFileSha = null;
  try {
    const fileInfo = await ghGet(`/repos/${REPO}/contents/${filePath}?ref=${BASE_BRANCH}`);
    existingFileSha = fileInfo.sha;
  } catch {
    // 檔案不存在，第一次建立
  }

  // 3. 建立新分支
  await ghPost(`/repos/${REPO}/git/refs`, {
    ref: `refs/heads/${newBranch}`,
    sha: baseSha,
  });
  console.log(`    已建立分支：${newBranch}`);

  // 4. PUT 檔案到新分支
  const fileContent = Buffer.from(
    JSON.stringify(updatedRemixes, null, 2) + '\n'
  ).toString('base64');

  const putBody = {
    message: commitMsg,
    content: fileContent,
    branch: newBranch,
  };
  if (existingFileSha) putBody.sha = existingFileSha;

  await ghPut(`/repos/${REPO}/contents/${filePath}`, putBody);
  console.log(`    已推送 ${filePath}`);

  // 5. 建立 PR
  const prBody = buildPrBody(newEntries, today);
  const pr = await ghPost(`/repos/${REPO}/pulls`, {
    title: `Weekly remix merge ${today} (${newEntries.length} 筆)`,
    body: prBody,
    head: newBranch,
    base: BASE_BRANCH,
  });

  console.log(`\n🎉  PR 已建立：${pr.html_url}`);
  console.log(`    請 review 後手動 merge，網站將在 5 分鐘內自動更新。`);
  console.log(`\n📝  注意：PR 合併後請在 Google Sheet 填入以下 PR 連結到「PR 連結」欄：`);
  newEntries.forEach(e => {
    console.log(`    ${e.keyId} · ${e.teacherName} → ${pr.html_url}`);
  });
}

// ════════════════════════════════════════════════════════════
// 工具函式
// ════════════════════════════════════════════════════════════

/** 極簡 CSV 解析（支援有無 header 的 RFC 4180 格式） */
function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  const result  = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCsvLine(line);
    const row    = {};
    headers.forEach((h, idx) => { row[h.trim()] = values[idx] ?? ''; });
    result.push(row);
  }
  return result;
}

/** 分割 CSV 一列（處理雙引號包圍的逗號） */
function splitCsvLine(line) {
  const result = [];
  let current  = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/** 把試教日期 / 審核日期標準化為 YYYY-MM-DD */
function formatDate(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d)) return raw.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/** 從 CSV 列組成改編標題字串 */
function buildTitle(row) {
  const brief   = (row['改編簡述'] ?? '').trim();
  if (brief) return brief.slice(0, 60) + (brief.length > 60 ? '…' : '');
  return '試教／回饋紀錄';
}

/** 產生 PR body Markdown */
function buildPrBody(entries, date) {
  const rows = entries.map((e, i) =>
    `| ${i + 1} | ${e.keyId} | ${e.teacherName} | ${e.school || ''} | ${e.date} | ${e.stars ? `${e.stars}★` : ''} |`
  ).join('\n');

  return `## Weekly Remix Merge — ${date}

本 PR 由 \`weekly-merge.mjs\` 自動產生，請 review 後手動 merge。

### 本次合併（${entries.length} 筆）

| # | 教案編號 | 老師 | 學校 | 日期 | 評分 |
|---|---|---|---|---|---|
${rows}

### 合併後效果

- Merge 後 GitHub Actions 會自動重新 build
- 約 5 分鐘後，各教案詳情頁的「🌳 改編紀錄」會出現新條目

### 待辦（Merge 後）

- [ ] 將本 PR 連結填入 Google Sheet 各列的「PR 連結」欄
- [ ] 填入「發布日期」
- [ ] 若老師評分≥4 且尚未標「推薦給獎」，補上標記
`;
}

// ── GitHub API helpers ───────────────────────────────────────

async function ghGet(path) {
  const res = await ghFetch('GET', path);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function ghPost(path, body) {
  const res = await ghFetch('POST', path, body);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function ghPut(path, body) {
  const res = await ghFetch('PUT', path, body);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

function ghFetch(method, path, body) {
  return fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAT}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
