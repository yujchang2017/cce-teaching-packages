// 維護者收錄「改編紀錄」用（本機執行，模式一）。
//
// 把一筆改編紀錄加進 packages/remixes.json；build 時會依 keyId 顯示在「原教案頁」的
// 「改編紀錄」區（前端 page.tsx 已會渲染 teacherName/school/date/title/prUrl）。
// 這條路不新增獨立教案頁、不動 packages/_index.json。
//
// 用法：
//   node scripts/add-remix-record.mjs --keyId 1.1-III --remixer 王老師 \
//        --school 某某國小 --title "都會區情境版" --pr 12
//   （也可用 --url 直接指定成果連結，或 --date 指定日期）

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REMIXES = path.join(REPO_ROOT, "packages", "remixes.json");
const INDEX = path.join(REPO_ROOT, "packages", "_index.json");
const REPO_SLUG = process.env.PACKAGES_REPO || "yujchang2017/cce-teaching-packages";

function arg(n) {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const keyId = arg("keyId");
const remixer = arg("remixer");
if (!keyId || !remixer) {
  console.error("需要 --keyId <原教案代號> 與 --remixer <改編者稱呼>");
  process.exit(1);
}
const school = arg("school") || "";
const title = arg("title") || "";
const prNum = arg("pr") ? Number(arg("pr")) : 0;
const url = arg("url") || (prNum ? `https://github.com/${REPO_SLUG}/pull/${prNum}` : "");
const date = arg("date") || new Date().toISOString().slice(0, 10);

// 驗證 keyId 真的存在，避免掛到不存在的教案
let index;
try {
  index = JSON.parse(fs.readFileSync(INDEX, "utf8").replace(/^﻿/, ""));
} catch (e) {
  console.error("讀 packages/_index.json 失敗:", e.message);
  process.exit(1);
}
const known = new Set((index.packages || []).map((p) => p.keyId));
if (!known.has(keyId)) {
  console.error(`packages/_index.json 裡沒有教案 ${keyId}，請確認代號`);
  process.exit(1);
}

let list = [];
if (fs.existsSync(REMIXES)) {
  try {
    list = JSON.parse(fs.readFileSync(REMIXES, "utf8").replace(/^﻿/, ""));
  } catch (e) {
    console.error("packages/remixes.json 格式錯誤:", e.message);
    process.exit(1);
  }
  if (!Array.isArray(list)) {
    console.error("packages/remixes.json 應為陣列");
    process.exit(1);
  }
}

// 去重：同教案 + 同 PR（>0）視為同一筆
if (prNum > 0 && list.some((r) => r.keyId === keyId && r.prNumber === prNum)) {
  console.error(`已存在 ${keyId} 的 PR #${prNum} 改編紀錄，未重複新增`);
  process.exit(1);
}

list.push({ keyId, teacherName: remixer, school, date, title, prNumber: prNum, prUrl: url });
fs.writeFileSync(REMIXES, JSON.stringify(list, null, 2) + "\n", "utf8");
console.log(`已收錄改編紀錄 → ${keyId}：${remixer}${school ? ` · ${school}` : ""}  ${title || ""}  ${url || "(無連結)"}`);
console.log(`packages/remixes.json 目前 ${list.length} 筆`);
