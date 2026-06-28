#!/usr/bin/env node
/**
 * Phase 2: 將 ppt.html 中的 inline SVG 替換為 <img src="images/slide-xxx.png">
 *
 * 用法：
 *   node scripts/replace-svg-with-img.cjs review.json [--dry-run]
 *
 * 流程：
 *   1. 讀取 review.json（從 ZIP 或直接 JSON）
 *   2. 篩選 type=prompt, value=v 的 entries
 *   3. 對每個 package：
 *      a. 備份 ppt.html 到 _versions/1.0.0/（如尚未備份）
 *      b. 找到 SVG 區塊（從指定行號往上找 <svg，往下找 </svg>）
 *      c. 替換為 <img> 標籤
 *      d. 更新/建立 version.json
 */
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const reviewPath = args.find(a => !a.startsWith("-"));

if (!reviewPath) {
  console.error("用法: node scripts/replace-svg-with-img.cjs <review.json-or-zip> [--dry-run]");
  process.exit(1);
}

// ── Load review data ──
function loadReview(filePath) {
  if (filePath.endsWith(".zip")) {
    // Use built-in zlib won't work for zip — require the JSON directly
    console.error("請先解壓 ZIP 並提供 review.json 路徑");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// ── Find SVG block around a line number ──
function findSvgBlock(lines, targetLine) {
  // targetLine is 1-based from the review tool
  // The target line should be inside or near the <svg> tag
  const idx = targetLine - 1; // 0-based

  // Search upward for <svg
  let svgStart = -1;
  for (let i = idx; i >= Math.max(0, idx - 50); i--) {
    if (lines[i].match(/<svg[\s>]/i)) {
      svgStart = i;
      break;
    }
  }
  if (svgStart === -1) {
    // Try searching from targetLine itself
    for (let i = idx; i < Math.min(lines.length, idx + 5); i++) {
      if (lines[i].match(/<svg[\s>]/i)) {
        svgStart = i;
        break;
      }
    }
  }
  if (svgStart === -1) return null;

  // Search downward for </svg>
  let svgEnd = -1;
  for (let i = svgStart; i < Math.min(lines.length, svgStart + 500); i++) {
    if (lines[i].includes("</svg>")) {
      svgEnd = i;
      break;
    }
  }
  if (svgEnd === -1) return null;

  return { start: svgStart, end: svgEnd };
}

// ── Get indentation of a line ──
function getIndent(line) {
  const match = line.match(/^(\s*)/);
  return match ? match[1] : "";
}

// ── Main ──
const reviewData = loadReview(reviewPath);
const entries = reviewData.entries || reviewData;
const vEntries = entries.filter(e => e.type === "prompt" && e.value === "v");

console.log(`載入 ${vEntries.length} 筆 v 標記\n`);

// Group by package
const byPkg = {};
for (const e of vEntries) {
  const pkg = e.pkg.replace(/\\/g, "/");
  if (!byPkg[pkg]) byPkg[pkg] = [];
  byPkg[pkg].push(e);
}

const pkgs = Object.keys(byPkg).sort();
console.log(`涉及 ${pkgs.length} 個 package\n`);

let totalReplaced = 0;
let totalSkipped = 0;

for (const pkg of pkgs) {
  const pkgEntries = byPkg[pkg];
  const pkgDir = path.join("packages", pkg);
  const pptPath = path.join(pkgDir, "ppt.html");

  if (!fs.existsSync(pptPath)) {
    console.log(`⚠️  ${pkg}: ppt.html 不存在，跳過`);
    totalSkipped += pkgEntries.length;
    continue;
  }

  console.log(`\n📦 ${pkg} (${pkgEntries.length} 筆替換)`);

  // Step 1: Backup to _versions/1.0.0/ if not already done
  const versionsDir = path.join(pkgDir, "_versions", "1.0.0");
  const backupPpt = path.join(versionsDir, "ppt.html");
  if (!fs.existsSync(backupPpt)) {
    if (!dryRun) {
      fs.mkdirSync(versionsDir, { recursive: true });
      fs.copyFileSync(pptPath, backupPpt);
      // Also backup version.json if exists
      const versionJsonPath = path.join(pkgDir, "version.json");
      if (fs.existsSync(versionJsonPath)) {
        fs.copyFileSync(versionJsonPath, path.join(versionsDir, "version.json"));
      }
    }
    console.log(`  📂 備份 ppt.html → _versions/1.0.0/`);
  } else {
    console.log(`  📂 備份已存在，跳過`);
  }

  // Step 2: Read ppt.html and replace SVGs
  let lines = fs.readFileSync(pptPath, "utf8").split("\n");
  let replaced = 0;

  // Sort entries by line number descending (replace from bottom up to preserve line numbers)
  const sorted = [...pkgEntries].sort((a, b) => b.line - a.line);

  for (const entry of sorted) {
    const slideId = entry.slide; // e.g., "slide-forest-home"
    const slideKey = slideId.replace(/^slide-/, ""); // e.g., "forest-home"
    const imgFile = `slide-${slideKey}.png`;
    const imgPath = path.join(pkgDir, "images", imgFile);

    if (!fs.existsSync(imgPath)) {
      console.log(`  ⚠️  ${imgFile} 不存在，跳過 ${slideId}`);
      totalSkipped++;
      continue;
    }

    const block = findSvgBlock(lines, entry.line);
    if (!block) {
      console.log(`  ⚠️  找不到 SVG 區塊 (line ${entry.line})，跳過 ${slideId}`);
      totalSkipped++;
      continue;
    }

    const indent = getIndent(lines[block.start]);
    const imgTag = `${indent}<img src="images/${imgFile}" alt="${slideId}" style="max-width:100%;height:auto;">`;

    if (dryRun) {
      console.log(`  🔍 ${slideId}: 行 ${block.start + 1}-${block.end + 1} (${block.end - block.start + 1} 行) → <img src="images/${imgFile}">`);
    } else {
      // Replace the SVG block with <img> tag
      lines.splice(block.start, block.end - block.start + 1, imgTag);
      console.log(`  ✅ ${slideId}: 行 ${block.start + 1}-${block.end + 1} → <img src="images/${imgFile}">`);
    }
    replaced++;
  }

  totalReplaced += replaced;

  // Step 3: Write modified ppt.html
  if (!dryRun && replaced > 0) {
    fs.writeFileSync(pptPath, lines.join("\n"), "utf8");
  }

  // Step 4: Update version.json
  const versionJsonPath = path.join(pkgDir, "version.json");
  let versionData;
  if (fs.existsSync(versionJsonPath)) {
    versionData = JSON.parse(fs.readFileSync(versionJsonPath, "utf8"));
  } else {
    versionData = {
      current: "1.0.0",
      history: [{ version: "1.0.0", date: "2025-06-01", note: "初始版本" }]
    };
  }

  if (versionData.current === "1.0.0" && replaced > 0) {
    const newVersion = "1.2.0";
    if (!dryRun) {
      versionData.current = newVersion;
      versionData.history.push({
        version: newVersion,
        date: new Date().toISOString().split("T")[0],
        note: `替換 ${replaced} 個 inline SVG 為 AI 生成插圖 (z_image_turbo)`
      });
      fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2) + "\n", "utf8");
    }
    console.log(`  📝 version: 1.0.0 → ${newVersion}`);
  }
}

console.log(`\n${"=".repeat(50)}`);
console.log(`替換完成：${totalReplaced} 個 SVG → <img>`);
console.log(`跳過：${totalSkipped} 個`);
if (dryRun) console.log(`\n(--dry-run 模式，未實際修改檔案)`);
