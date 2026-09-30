#!/usr/bin/env node
/**
 * 教材可讀性：在 ppt.html / worksheet.html 的 </head> 前插入（或更新）一段有標記的樣式，
 * 把根字級等比放大。各檔 CSS 字級 95% 以上用 rem，所以只要調根字級就能整份等比放大，
 * 不必逐條改各檔不同的規則。SVG 圖中文字不受影響（另案處理）。
 *
 * 用法：
 *   node scripts/apply-readability.mjs --dry-run                 # 全部教案，只列出會改什麼
 *   node scripts/apply-readability.mjs                           # 全部教案，實際寫入
 *   node scripts/apply-readability.mjs level-iii/1.6-III ...     # 只處理指定教案
 *   node scripts/apply-readability.mjs --size 112.5              # 指定百分比（預設 112.5）
 *
 * 可重複執行：已有 <style id="cce-readability"> 就只更新其內容，不會重複插入。
 * 不動 _versions/。保留原檔的換行格式（CRLF/LF）。
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PKG = join(ROOT, "packages");
const FILES = ["ppt.html", "worksheet.html"];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sizeIdx = args.indexOf("--size");
const size = sizeIdx >= 0 ? Number(args[sizeIdx + 1]) : 112.5;
if (!(size > 50 && size < 200)) {
  console.error(`❌ --size 不合理：${args[sizeIdx + 1]}`);
  process.exit(1);
}
// 注意：沒給 --size 時 sizeIdx 為 -1，不可把第 0 個參數誤當成 size 的值而略過
const targets = args.filter((a, i) => !a.startsWith("--") && !(sizeIdx >= 0 && i === sizeIdx + 1));

const BLOCK = `<style id="cce-readability">/* 可讀性：根字級等比放大（說明見 docs/VISUAL_GUIDE.md） */html{font-size:${size}%}</style>`;
const BLOCK_RE = /<style id="cce-readability">[\s\S]*?<\/style>/;

function listPackages() {
  const out = [];
  for (const lv of readdirSync(PKG).filter((d) => d.startsWith("level-"))) {
    for (const p of readdirSync(join(PKG, lv))) out.push(`${lv}/${p}`);
  }
  return out.sort();
}

const pkgs = targets.length ? targets : listPackages();
const stats = { inserted: 0, updated: 0, unchanged: 0, skipped: [] };

for (const pkg of pkgs) {
  if (pkg.includes("_versions")) continue;
  for (const name of FILES) {
    const file = join(PKG, pkg, name);
    if (!existsSync(file)) continue;
    const src = readFileSync(file, "utf8");
    let next;
    if (BLOCK_RE.test(src)) {
      next = src.replace(BLOCK_RE, BLOCK);
      if (next === src) { stats.unchanged++; continue; }
      stats.updated++;
    } else {
      const n = src.split("</head>").length - 1;
      if (n !== 1) { stats.skipped.push(`${pkg}/${name}（</head> 出現 ${n} 次）`); continue; }
      const eol = src.includes("\r\n") ? "\r\n" : "\n";
      next = src.replace("</head>", `${BLOCK}${eol}</head>`);
      stats.inserted++;
    }
    if (dryRun) console.log(`[dry-run] ${pkg}/${name}`);
    else writeFileSync(file, next, "utf8");
  }
}

console.log(`${dryRun ? "[dry-run] " : ""}字級 ${size}%｜新插入 ${stats.inserted}、更新 ${stats.updated}、已是最新 ${stats.unchanged}`);
if (stats.skipped.length) {
  console.log(`⚠️ 略過 ${stats.skipped.length} 個（需人工處理）：`);
  for (const s of stats.skipped) console.log("   " + s);
  process.exitCode = 1;
}
