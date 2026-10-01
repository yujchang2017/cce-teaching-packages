#!/usr/bin/env node
/**
 * 教材可讀性：在 ppt.html / worksheet.html 的 </head> 前插入（或更新）一段有標記的樣式：
 *   1) 根字級等比放大（各檔字級 95% 以上用 rem，調根字級即整份等比放大）
 *   2) 小字下限：逐檔讀取該檔自己的 CSS，只替「在這份檔裡確實小於下限」的樣式補下限
 * 三層規則（2026-10 使用者裁定）：
 *   - SVG 圖中文字：一律不動（另案處理）
 *   - 真正的附註維持較小：資料來源、圖說（figcaption）、圖表小標籤／小註（viz-／chart- 系列、圖表框內文字）
 *   - 其餘文字（主文，以及用方框拼出來的 HTML 示意圖）一律套下限，整張圖一起放大、保持一致
 * 說明見 CONTRIBUTING.md「教材版面與可讀性規範」。
 *
 * 用法：
 *   node scripts/apply-readability.mjs --dry-run                 # 全部教案，只列出會改什麼
 *   node scripts/apply-readability.mjs                           # 全部教案，實際寫入
 *   node scripts/apply-readability.mjs level-iii/1.6-III ...     # 只處理指定教案
 *   node scripts/apply-readability.mjs --size 112.5              # 根字級百分比（預設 112.5）
 *
 * 安全設計：
 *   - 可重複執行：已有 <style id="cce-readability"> 就依最新規則重算並覆寫該區塊，不會重複插入。
 *   - 絕不縮小：同一選擇器只要在該檔任何地方宣告了 ≥ 下限的字級，就不替它加下限。
 *   - 不碰 SVG 與圖表框：每條下限規則都加 :not(svg *, figcaption *, 圖表框 *)，避免改到圖內文字與版面。
 *   - 不動介面元素（導覽列、返回鍵、頁碼等）。不動 _versions/。保留原檔換行格式。
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PKG = join(ROOT, "packages");

// 小字下限（rem，相對放大後的根字級）
const FLOOR = { "ppt.html": 0.95, "worksheet.html": 0.875 };
// 介面元素不套下限
const UI_EXCLUDE = /(navbar|topbar|btn-back|slide-num|counter|nav-|pbar|\bhint\b|kbd|progress|footer)/i;
// 真正的附註（可以維持較小）：資料來源、圖說、圖表小標籤／小註。名稱符合就不套下限。
// 注意：用方框拼出來的 HTML 示意圖（tri-node、pie-、map-pin 等）屬主文，不在此列（整張圖一起放大）。
const NOTE_EXCLUDE = /(viz|chart|figcaption|slide-source|slide-src|source|-src\b|\bsrc\b)/i;
// 指向 SVG 或其文字的選擇器不套下限
const SVG_SEL = /svg|(^|[\s>+~])(text|tspan)(?![-\w])/i;
// 根元素絕不套下限（html 設下限會改到 rem 基準、反而整份縮小；1.3-IV 曾因此出錯）
const ROOT_SEL = /^(html|:root|body)$/i;
// 位置判斷：SVG 內、圖說內、圖表框（放 SVG 圖表的容器）內的元素視為附註，不套下限
const CHART_CTX = "svg *,figcaption *,.slide-source *,.viz-panel *,.chart-box *,.chart-placeholder *";
const NOT_CTX = `:not(${CHART_CTX})`;

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
const ROOT_PX = 16 * (size / 100);

const BLOCK_RE = /<style id="cce-readability">[\s\S]*?<\/style>/;

// 在選擇器上加「不在 SVG／圖表框內」的條件；若有 ::偽元素，:not 要插在偽元素之前
function notSvg(sel) {
  const i = sel.indexOf("::");
  return i >= 0 ? `${sel.slice(0, i)}${NOT_CTX}${sel.slice(i)}` : `${sel}${NOT_CTX}`;
}
const cssEsc = (s) => s.replace(/([\[\].:/])/g, "\\$1");

function floorCss(src, name) {
  const floorRem = FLOOR[name];
  const floorPx = floorRem * ROOT_PX;
  const base = src.replace(BLOCK_RE, "");
  const rules = [];

  // 1) 該檔 <style> 內的規則
  const css = (base.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
  const maxPx = new Map(); // 選擇器 → 該檔內宣告過的最大字級
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const f = m[2].match(/font-size:\s*([0-9]*\.?[0-9]+)(rem|px)/);
    if (!f) continue;
    const px = f[2] === "rem" ? +f[1] * ROOT_PX : +f[1];
    for (let s of m[1].split(",")) {
      s = s.trim().replace(/\s+/g, " ");
      if (!s || s.startsWith("@")) continue;
      maxPx.set(s, Math.max(maxPx.get(s) ?? 0, px));
    }
  }
  const eligible = (s) => !ROOT_SEL.test(s) && !UI_EXCLUDE.test(s) && !NOTE_EXCLUDE.test(s) && !SVG_SEL.test(s);
  const lift = [...maxPx].filter(([s, px]) => px < floorPx - 0.05 && eligible(s)).map(([s]) => notSvg(s));
  if (lift.length) rules.push(`${lift.join(",")}{font-size:${floorRem}rem}`);

  // 1b) em 相對單位（相對上一層）：用 max(下限, 原值em)——結果一定 ≥ 原本大小，保證不縮小。
  //     只處理「該檔對這個選擇器只用 em 宣告」者，避免蓋掉同選擇器的 rem/px 規則。
  const emSel = new Map();
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const f = m[2].match(/font-size:\s*([0-9]*\.?[0-9]+)em\b/);
    if (!f || +f[1] >= 1) continue;
    for (let s of m[1].split(",")) {
      s = s.trim().replace(/\s+/g, " ");
      if (s && !s.startsWith("@")) emSel.set(s, f[1]);
    }
  }
  for (const [s, v] of emSel) {
    if (!maxPx.has(s) && eligible(s)) rules.push(`${notSvg(s)}{font-size:max(${floorRem}rem,${v}em)}`);
  }

  // 2) 直接寫在元素上的小字（inline style，不含 SVG 內）
  const body = base.replace(/<svg[\s\S]*?<\/svg>/g, "");
  const inl = new Set();
  for (const m of body.matchAll(/style="[^"]*?(font-size:\s*([0-9]*\.?[0-9]+)(rem|px))/g)) {
    const px = m[3] === "rem" ? +m[2] * ROOT_PX : +m[2];
    if (px < floorPx - 0.05) inl.add(`[style*="${m[1]}"]${NOT_CTX}`);
  }
  if (inl.size) rules.push(`${[...inl].join(",")}{font-size:${floorRem}rem!important}`);

  // 2b) <small> 標籤（瀏覽器預設「小一號」≈0.8333em，沒有 CSS 規則可讀）：max(下限, 預設大小)。
  //     若該檔自己寫了 small 的規則就不碰，以免蓋掉作者設定。
  if (/<small[\s>]/i.test(body) && !/(^|[\s,>+~}])small\b[^{}]*\{/i.test(css)) {
    rules.push(`small${NOT_CTX}{font-size:max(${floorRem}rem,.8333em)}`);
  }

  // 3) 學習單的 Tailwind 小字 class
  if (/class="[^"]*\btext-xs\b/.test(body)) rules.push(`.text-xs${NOT_CTX}{font-size:${floorRem}rem;line-height:1.25rem}`);
  const tw = new Set();
  for (const m of body.matchAll(/class="[^"]*?\b(text-\[([0-9]*\.?[0-9]+)(px|rem)\])/g)) {
    const px = m[3] === "rem" ? +m[2] * ROOT_PX : +m[2];
    if (px < floorPx - 0.05) tw.add(`.${cssEsc(m[1])}${NOT_CTX}`);
  }
  if (tw.size) rules.push(`${[...tw].join(",")}{font-size:${floorRem}rem}`);

  return rules.join("");
}

// 未公開的學層預設不處理（2026-10 維護者裁定：level-v 公開前另行處理）。
// 需要時可直接指定教案路徑，例如 level-v/1.1-V。
const UNPUBLISHED = new Set(["level-v"]);

function listPackages() {
  const out = [];
  for (const lv of readdirSync(PKG).filter((d) => d.startsWith("level-") && !UNPUBLISHED.has(d))) {
    for (const p of readdirSync(join(PKG, lv))) out.push(`${lv}/${p}`);
  }
  return out.sort();
}

const pkgs = targets.length ? targets : listPackages();
const stats = { inserted: 0, updated: 0, unchanged: 0, skipped: [] };

for (const pkg of pkgs) {
  if (pkg.includes("_versions")) continue;
  for (const name of Object.keys(FLOOR)) {
    const file = join(PKG, pkg, name);
    if (!existsSync(file)) continue;
    const src = readFileSync(file, "utf8");
    const block =
      `<style id="cce-readability">/* 可讀性：根字級等比放大＋小字下限（說明見 CONTRIBUTING.md「教材版面與可讀性規範」） */` +
      `html{font-size:${size}%}${floorCss(src, name)}</style>`;
    let next;
    if (BLOCK_RE.test(src)) {
      next = src.replace(BLOCK_RE, block);
      if (next === src) { stats.unchanged++; continue; }
      stats.updated++;
    } else {
      const n = src.split("</head>").length - 1;
      if (n !== 1) { stats.skipped.push(`${pkg}/${name}（</head> 出現 ${n} 次）`); continue; }
      const eol = src.includes("\r\n") ? "\r\n" : "\n";
      next = src.replace("</head>", `${block}${eol}</head>`);
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
