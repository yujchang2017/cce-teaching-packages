// 將 review_standalone.html 匯出的審查 CSV 套用到教案 HTML。
//
// 為什麼不能單純用「行號」或「同一個 URL」比對:
// 同一個外部連結常在同一個檔案出現好幾次(例如 cwa.gov.tw 出現 5 次),
// 每次出現的教學脈絡不同,審查者也是逐一分開審查。review_standalone.html
// 內嵌的 <script id="ccreview-data"> 目錄裡,每筆 issue 都帶有
// hrefOccurrenceIndex(第幾次出現,0-based)與 hrefOccurrenceCount(總共幾次),
// 這是唯一可靠、審查者原本就依賴的定位方式,必須用它,不能用行號猜測或
// 「同 URL 全部套用」的假設 —— 同一個連結在不同位置意義不同。
//
// Usage:
//   node scripts/link-review-apply.mjs --dir _local/reviewXXXXXX [--dry-run] [--resolutions resolutions.json]
//
// --dir           資料夾,內含 ccreview_responses*.csv 以及 review_standalone.html(或用 --tool 指定)
// --csv           逗號分隔的檔名,只處理資料夾內指定的 CSV(資料夾裡有舊的已套用過的 CSV 時很有用)
// --tool          review_standalone.html 路徑(預設在 --dir 內尋找)
// --dry-run       只驗證比對是否精確(occurrence count 需與目前檔案內容一致),不寫檔
// --resolutions   JSON 檔,人工決定的衝突該用哪個審查者版本,見下方「衝突」說明
// --reviewer-map  JSON 檔,審查者本名 -> 代號對照表(預設找 _local/reviewer-codenames.json)
//
// 衝突(同一個 occurrence,不同審查者給不同 replacementUrl)不會自動選最新的 ——
// 一定印出來、要求人工決定,並在 resolutions.json 指定要用哪位審查者的版本後才會套用。
// resolutions.json 格式: { "<node>|<file>|<url>|<occIndex>": "<reviewer原始CSV名字>" }

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}
const DRY_RUN = process.argv.includes("--dry-run");
const DIR = arg("dir");
if (!DIR) {
  console.error("需要 --dir <資料夾路徑>（放 ccreview_responses*.csv 與 review_standalone.html 的地方）");
  process.exit(1);
}
const dirAbs = path.isAbsolute(DIR) ? DIR : path.join(REPO_ROOT, DIR);
const toolPath = arg("tool") ?? path.join(dirAbs, "review_standalone.html");
const resolutionsPath = arg("resolutions");
const reviewerMapPath = arg("reviewer-map") ?? path.join(REPO_ROOT, "_local", "reviewer-codenames.json");
const TODAY = arg("date") ?? new Date().toISOString().slice(0, 10);

const SKIP_JUDGEMENT = new Set(["有效，保留", "網站擋機器，但人工可開"]);
const ACTIONABLE_JUDGEMENT = new Set(["內容不符，需替換", "失效，需替換", "待處理", "刪除此連結"]);
const TRACKING_PARAM_RE = /^(utm_|_ga|_gl$|_gcl_|fbclid$|gclid$|mc_[ce]id$|igshid$|ref_src$)/i;

function cleanUrl(u) {
  if (!u) return u;
  try {
    const url = new URL(u);
    [...url.searchParams.keys()].forEach((k) => {
      if (TRACKING_PARAM_RE.test(k)) url.searchParams.delete(k);
    });
    let s = url.toString();
    if (s.endsWith("?")) s = s.slice(0, -1);
    return s;
  } catch {
    return u;
  }
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function parseCsv(content) {
  content = content.replace(/^﻿/, "");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const records = [];
  let buf = "";
  for (const line of lines.slice(1)) {
    buf = buf ? buf + "\n" + line : line;
    const quoteCount = (buf.match(/"/g) || []).length;
    if (quoteCount % 2 === 0) {
      records.push(buf);
      buf = "";
    }
  }
  const rows = [];
  for (const r of records) {
    const cols = parseCsvLine(r);
    if (cols.length < 12) continue;
    const [
      responseId,
      createdAt,
      reviewer,
      level,
      node,
      currentFile,
      selectedIssueId,
      issueType,
      manualJudgement,
      problemUrl,
      replacementUrl,
      severity,
      notes,
    ] = cols;
    rows.push({
      responseId,
      createdAt,
      reviewer,
      level,
      node,
      currentFile,
      selectedIssueId,
      issueType,
      manualJudgement,
      problemUrl,
      replacementUrl,
      severity,
      notes,
    });
  }
  return rows;
}

// ---------- 1. load CSVs ----------
const csvFilter = arg("csv"); // optional: comma-separated filenames to limit to (e.g. only a newly-added CSV)
let csvFiles = fs.readdirSync(dirAbs).filter((f) => /^ccreview_responses.*\.csv$/i.test(f));
if (csvFilter) {
  const wanted = new Set(csvFilter.split(",").map((s) => s.trim()));
  csvFiles = csvFiles.filter((f) => wanted.has(f));
}
if (csvFiles.length === 0) {
  console.error(`${dirAbs} 內找不到 ccreview_responses*.csv`);
  process.exit(1);
}
let rows = [];
for (const f of csvFiles) {
  rows = rows.concat(parseCsv(fs.readFileSync(path.join(dirAbs, f), "utf8")));
}
console.log(`讀取 ${csvFiles.length} 個 CSV，共 ${rows.length} 筆原始回報`);

// ---------- 2. load the review tool's own issue catalog (authoritative occurrence index) ----------
if (!fs.existsSync(toolPath)) {
  console.error(`找不到 review_standalone.html: ${toolPath}\n這個檔案內嵌的 issue 目錄含有精確的 hrefOccurrenceIndex，沒有它就無法安全定位連結，不要用行號猜測代替。`);
  process.exit(1);
}
const toolHtml = fs.readFileSync(toolPath, "utf8");
const dataMatch = toolHtml.match(/<script id="ccreview-data" type="application\/json">([\s\S]*?)<\/script>/);
if (!dataMatch) {
  console.error("review_standalone.html 內找不到 #ccreview-data，無法取得精確定位資訊");
  process.exit(1);
}
const catalog = JSON.parse(dataMatch[1]);
const byIssueId = new Map(catalog.issues.map((i) => [i.issueId, i]));

// ---------- 3. reviewer codename map (optional) ----------
let reviewerMap = {};
if (fs.existsSync(reviewerMapPath)) {
  reviewerMap = JSON.parse(fs.readFileSync(reviewerMapPath, "utf8"));
}
const codename = (name) => reviewerMap[name] ?? name;

// ---------- 4. resolutions for known conflicts ----------
let resolutions = {};
if (resolutionsPath) {
  const p = path.isAbsolute(resolutionsPath) ? resolutionsPath : path.join(REPO_ROOT, resolutionsPath);
  if (fs.existsSync(p)) resolutions = JSON.parse(fs.readFileSync(p, "utf8"));
}

// ---------- 5. group by the authoritative occurrence key ----------
const groups = new Map();
let unmatched = 0;
for (const r of rows) {
  const issue = byIssueId.get(r.selectedIssueId);
  if (!issue) {
    unmatched++;
    continue;
  }
  if (r.replacementUrl && r.replacementUrl.startsWith("file:///")) continue;
  if (SKIP_JUDGEMENT.has(r.manualJudgement)) continue;
  if (!ACTIONABLE_JUDGEMENT.has(r.manualJudgement)) continue;
  if (r.severity && r.severity.includes("P3")) continue;
  if (r.manualJudgement !== "刪除此連結" && !r.replacementUrl) continue;

  const key = `${issue.node}|${issue.fileType}|${issue.url}|${issue.hrefOccurrenceIndex}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push({ ...r, issue });
}
if (unmatched) console.log(`⚠ ${unmatched} 筆的 selectedIssueId 在 review_standalone.html 目錄中找不到對應紀錄，已略過`);

const actions = [];
const unresolvedConflicts = [];

for (const [key, entries] of groups) {
  entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  let chosen = entries[entries.length - 1];

  const reviewers = new Set(entries.map((e) => e.reviewer));
  const distinctReplacements = new Set(entries.map((e) => cleanUrl(e.replacementUrl)));
  const isConflict = reviewers.size > 1 && distinctReplacements.size > 1;

  if (isConflict) {
    const pick = resolutions[key];
    if (pick) {
      const found = entries.find((e) => e.reviewer === pick);
      if (found) chosen = found;
    } else {
      unresolvedConflicts.push({ key, entries });
      continue; // don't guess -- surface for a human decision
    }
  }

  const issue = chosen.issue;
  const action = chosen.manualJudgement === "刪除此連結" ? "delete" : "replace";
  actions.push({
    node: issue.node,
    level: issue.level,
    file: issue.fileType,
    problemUrl: issue.url,
    hrefOccurrenceIndex: issue.hrefOccurrenceIndex,
    hrefOccurrenceCount: issue.hrefOccurrenceCount,
    context: issue.context,
    replacementUrl: action === "delete" ? "" : cleanUrl(chosen.replacementUrl),
    action,
    reviewer: codename(chosen.reviewer),
    issueId: chosen.selectedIssueId,
  });
}

if (unresolvedConflicts.length) {
  console.log(`\n=== ${unresolvedConflicts.length} 個衝突需要人工決定，尚未套用 ===`);
  for (const c of unresolvedConflicts) {
    const [node, file, url, occIndex] = c.key.split("|");
    const text = (byIssueId.get(c.entries[0].selectedIssueId)?.context || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    console.log(`\n${node}/${file} occ#${occIndex} ${url}`);
    console.log(`  內文: ${text.slice(0, 120)}`);
    for (const e of c.entries) console.log(`  ${codename(e.reviewer)} (${e.createdAt}) -> ${cleanUrl(e.replacementUrl)}`);
  }
  console.log(
    `\n請建立 resolutions.json，格式: { "<key如上面顯示>": "<要採用的審查者CSV原始名字>" }，再用 --resolutions 指定後重新執行。`
  );
}

console.log(`\n可執行動作: ${actions.length} 筆（替換 ${actions.filter((a) => a.action === "replace").length}，刪除 ${actions.filter((a) => a.action === "delete").length}）`);

// ---------- 6. dry-run / apply against the actual package files ----------
function pkgDir(node, level) {
  return path.join(REPO_ROOT, "packages", `level-${level.toLowerCase()}`, node);
}
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function findHrefOccurrences(content, url) {
  const re = new RegExp(`href=["']${escapeRe(url)}["']`, "g");
  const out = [];
  let m;
  while ((m = re.exec(content))) out.push(m.index);
  return out;
}

const byNodeFile = new Map();
for (const a of actions) {
  const k = `${a.node}|${a.file}`;
  if (!byNodeFile.has(k)) byNodeFile.set(k, []);
  byNodeFile.get(k).push(a);
}

const failed = [];
const ok = [];
const fileOps = new Map(); // filePath -> ops[]

for (const [key, acts] of byNodeFile) {
  const [node, file] = key.split("|");
  const level = acts[0].level;
  const filePath = path.join(pkgDir(node, level), file);
  if (!fs.existsSync(filePath)) {
    for (const a of acts) failed.push({ ...a, reason: "FILE_NOT_FOUND" });
    continue;
  }
  const content = fs.readFileSync(filePath, "utf8");
  const byUrl = new Map();
  for (const a of acts) {
    if (!byUrl.has(a.problemUrl)) byUrl.set(a.problemUrl, []);
    byUrl.get(a.problemUrl).push(a);
  }
  const ops = [];
  for (const [url, urlActs] of byUrl) {
    const occOffsets = findHrefOccurrences(content, url);
    for (const a of urlActs) {
      if (occOffsets.length !== a.hrefOccurrenceCount) {
        failed.push({ ...a, reason: "OCCURRENCE_COUNT_DRIFT", expected: a.hrefOccurrenceCount, actual: occOffsets.length });
        continue;
      }
      const offset = occOffsets[a.hrefOccurrenceIndex];
      if (offset == null) {
        failed.push({ ...a, reason: "INDEX_OUT_OF_RANGE" });
        continue;
      }
      ops.push({ offset, url, action: a });
      ok.push(a);
    }
  }
  if (ops.length) fileOps.set(filePath, ops);
}

console.log(`\n定位驗證: OK ${ok.length}，失敗 ${failed.length}`);
if (failed.length) {
  console.log("=== 定位失敗（教材檔案內容與審查當時不同，需人工檢查）===");
  for (const f of failed) console.log(`  ${f.node}/${f.file} occ#${f.hrefOccurrenceIndex} ${f.problemUrl} -> ${f.reason}`);
}

if (DRY_RUN || fileOps.size === 0) {
  console.log(DRY_RUN ? "\n(dry-run，未寫入任何檔案)" : "\n沒有可套用的變更");
  process.exit(0);
}

// ---------- 7. backup + write ----------
function versionBump(current) {
  const [maj, min, patch] = current.split(".").map(Number);
  if (maj === 1 && min < 2) return "1.2.0";
  if (maj === 1 && min === 2) return `1.2.${patch + 1}`;
  throw new Error(`無法自動判斷 ${current} 的下一版號，請手動處理`);
}

const touchedNodes = new Set();
for (const filePath of fileOps.keys()) {
  const node = path.basename(path.dirname(filePath));
  touchedNodes.add(node);
}

for (const node of touchedNodes) {
  const level = actions.find((a) => a.node === node).level;
  const dir = pkgDir(node, level);
  const vfPath = path.join(dir, "version.json");
  const vjson = JSON.parse(fs.readFileSync(vfPath, "utf8"));
  const currentVersion = vjson.currentVersion;
  const backupDir = path.join(dir, "_versions", currentVersion);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    for (const f of fs.readdirSync(dir)) {
      if (f === "_versions") continue;
      const src = path.join(dir, f);
      if (fs.statSync(src).isFile()) fs.copyFileSync(src, path.join(backupDir, f));
    }
  }
}

for (const [filePath, ops] of fileOps) {
  let content = fs.readFileSync(filePath, "utf8");
  ops.sort((a, b) => b.offset - a.offset);
  for (const op of ops) {
    const { offset, url, action } = op;
    const quote = content.slice(offset).match(/^href=(["'])/)[1];
    const hrefStr = `href=${quote}${url}${quote}`;
    if (action.action === "delete") {
      const tagStart = content.lastIndexOf("<a", offset);
      const tagOpenEnd = content.indexOf(">", offset) + 1;
      const tagCloseStart = content.indexOf("</a>", tagOpenEnd);
      const innerText = content.slice(tagOpenEnd, tagCloseStart);
      content = content.slice(0, tagStart) + innerText + content.slice(tagCloseStart + 4);
    } else {
      const newHref = `href=${quote}${action.replacementUrl}${quote}`;
      content = content.slice(0, offset) + newHref + content.slice(offset + hrefStr.length);
    }
  }
  fs.writeFileSync(filePath, content, "utf8");
}

for (const node of touchedNodes) {
  const level = actions.find((a) => a.node === node).level;
  const dir = pkgDir(node, level);
  const vfPath = path.join(dir, "version.json");
  const vjson = JSON.parse(fs.readFileSync(vfPath, "utf8"));
  const oldVersion = vjson.currentVersion;
  const nextVersion = versionBump(oldVersion);
  const reviewers = [...new Set(actions.filter((a) => a.node === node).map((a) => a.reviewer))];
  const isFirstReview = oldVersion.startsWith("1.0.") || oldVersion.startsWith("1.1.");

  const currentEntry = vjson.versions.find((v) => v.version === oldVersion);
  if (currentEntry) {
    currentEntry.archived = true;
    currentEntry.files = {
      lessonPlan: `_versions/${oldVersion}/lesson_plan.html`,
      ppt: `_versions/${oldVersion}/ppt.html`,
      worksheet: `_versions/${oldVersion}/worksheet.html`,
    };
  }
  vjson.versions.unshift({
    version: nextVersion,
    date: TODAY,
    label: isFirstReview ? "審查後修訂版" : "審查後修訂版（連結修正）",
    editor: "計畫團隊",
    reviewer: reviewers.join("，"),
    reviewStatus: "approved",
    summary: "依審查意見修正教材中失效、籠統或內容不符的外部參考連結。",
    files: { lessonPlan: "lesson_plan.html", ppt: "ppt.html", worksheet: "worksheet.html" },
  });
  vjson.currentVersion = nextVersion;
  vjson.recommendedVersion = nextVersion;
  vjson.status = "recommended";
  fs.writeFileSync(vfPath, JSON.stringify(vjson, null, 2) + "\n", "utf8");
}

console.log(`\n完成：${touchedNodes.size} 個教案包已更新（備份 + 連結替換 + 版本升級）`);
