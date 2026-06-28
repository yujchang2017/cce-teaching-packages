#!/usr/bin/env node
/**
 * 掃描所有 ppt.html，提取 inline SVG，生成審核用 HTML。
 * 用法：node scripts/build-svg-review.cjs
 * 產出：scripts/svg-review.html（用瀏覽器開啟）
 */
const fs = require("fs");
const path = require("path");

const PACKAGES_DIR = path.join(__dirname, "..", "packages");
const OUTPUT = path.join(__dirname, "svg-review.html");

// Recursively find ppt.html, skip .claude, _versions, level-v
function findPptHtml(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".claude" || entry.name === "_versions" || entry.name === "node_modules" || entry.name === "level-v") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findPptHtml(full));
    } else if (entry.name === "ppt.html") {
      results.push(full);
    }
  }
  return results;
}

// Extract SVGs from HTML with context
function extractSvgs(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const lines = html.split("\n");
  const svgs = [];

  let i = 0;
  while (i < lines.length) {
    const svgMatch = lines[i].match(/<svg\b/);
    if (svgMatch) {
      // Find aria-label or class
      const openLine = lines[i];
      const ariaMatch = openLine.match(/aria-label="([^"]+)"/);
      const classMatch = openLine.match(/class="([^"]+)"/);
      const label = ariaMatch ? ariaMatch[1] : classMatch ? classMatch[1] : "";

      // Find the slide this SVG belongs to
      let slideId = "";
      for (let j = i - 1; j >= Math.max(0, i - 30); j--) {
        const slideMatch = lines[j].match(/id="([^"]+)"/);
        if (slideMatch) { slideId = slideMatch[1]; break; }
      }

      // Collect full SVG block
      let svgBlock = "";
      let depth = 0;
      let k = i;
      while (k < lines.length) {
        svgBlock += lines[k] + "\n";
        // Count svg opens/closes
        const opens = (lines[k].match(/<svg\b/g) || []).length;
        const closes = (lines[k].match(/<\/svg>/g) || []).length;
        depth += opens - closes;
        if (depth <= 0) break;
        k++;
      }

      // Classify: look for chart indicators
      const hasAxis = /axis|<line.*x[12]="0".*y|tick|gridline/i.test(svgBlock);
      const hasDataLabel = /\d{4}年|\d+°C|\+\d+\.\d+/i.test(svgBlock);
      const hasChartElements = /<(polyline|path)[^>]*d="M\s*\d+[\s,]\d+[\s,]*L/i.test(svgBlock) && hasDataLabel;
      const hasBarPattern = (svgBlock.match(/<rect/g) || []).length > 5 && hasDataLabel;

      let classification = "illustration";
      if (hasChartElements || hasBarPattern || (hasAxis && hasDataLabel)) {
        classification = "data-chart";
      }

      svgs.push({
        line: i + 1,
        slideId,
        label,
        classification,
        svgHtml: svgBlock.trim(),
      });
      i = k + 1;
    } else {
      i++;
    }
  }
  return svgs;
}

// Build review HTML (offline version — localStorage + JSON export)
function buildHtml(allData) {
  let totalSvgs = 0;
  let illustrationCount = 0;

  for (const { svgs } of allData) {
    totalSvgs += svgs.length;
    illustrationCount += svgs.filter(s => s.classification === "illustration").length;
  }

  let nav = "";
  for (const { pkg, svgs } of allData) {
    if (svgs.length === 0) continue;
    const id = pkg.replace(/[\/\\]/g, "-");
    nav += `<a href="#pkg-${id}" class="nav-item">${pkg} <span class="nav-count">${svgs.length}</span></a>\n`;
  }

  let cards = "";
  let idx = 0;

  for (const { pkg, svgs } of allData) {
    if (svgs.length === 0) continue;
    const id = pkg.replace(/[\/\\]/g, "-");
    cards += `<div class="pkg-header" id="pkg-${id}">${pkg} <span style="font-weight:normal;color:#6b7280">(${svgs.length} 張)</span></div>\n`;

    for (const svg of svgs) {
      idx++;
      const isChart = svg.classification === "data-chart";
      cards += `
<div class="card ${isChart ? 'chart' : 'illust'}" data-idx="${idx}" data-pkg="${pkg}" data-slide="${svg.slideId}" data-line="${svg.line}">
  <div class="card-header">
    <span class="badge ${isChart ? 'badge-chart' : 'badge-illust'}">${isChart ? '圖表' : '示意圖'}</span>
    <span class="label">${svg.label || svg.slideId || '?'}</span>
    <span class="meta">L${svg.line}</span>
  </div>
  <div class="card-body">
    <div class="svg-preview">${svg.svgHtml}</div>
    <div class="input-area">
      <div class="input-tabs">
        <button class="tab active" data-tab="prompt" onclick="switchTab(this)">AI 生圖</button>
        <button class="tab" data-tab="url" onclick="switchTab(this)">圖片連結</button>
        <button class="tab" data-tab="upload" onclick="switchTab(this)">上傳圖片</button>
        <button class="tab tab-skip" data-tab="skip" onclick="switchTab(this)">跳過</button>
      </div>
      <div class="tab-content tc-prompt">
        <textarea class="field" data-type="prompt" placeholder="${isChart ? '此為數據圖表，建議保留原圖' : '請用英文描述想要的圖片內容...'}" data-pkg="${pkg}" data-slide="${svg.slideId}" data-line="${svg.line}"></textarea>
        <div class="hint">${isChart ? '這看起來是數據圖表，建議保留原圖。' : '描述插圖的內容，建議使用英文以獲得最佳生圖效果。'}</div>
      </div>
      <div class="tab-content tc-url" style="display:none">
        <input type="url" class="field" data-type="url" placeholder="https://example.com/image.png" data-pkg="${pkg}" data-slide="${svg.slideId}" data-line="${svg.line}">
        <div class="img-preview-box"></div>
        <div class="hint">貼上圖片的直接連結（PNG/JPG/SVG）。</div>
      </div>
      <div class="tab-content tc-upload" style="display:none">
        <input type="file" class="field-file" accept="image/*" data-pkg="${pkg}" data-slide="${svg.slideId}" data-line="${svg.line}">
        <div class="img-preview-box"></div>
        <div class="hint">選擇圖片檔案（最大 5MB），匯出時會打包成 ZIP。</div>
      </div>
      <div class="tab-content tc-skip" style="display:none">
        <div class="skip-msg">保留原始 SVG 圖片，不做替換。</div>
      </div>
    </div>
  </div>
</div>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CCE 投影片圖片審核</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<style>
:root {
  --teal: #0f766e; --teal-light: #14b8a6; --blue: #2563eb;
  --green: #16a34a; --amber: #f59e0b;
  --gray-50: #f9fafb; --gray-100: #f3f4f6; --gray-200: #e5e7eb;
  --gray-500: #6b7280; --gray-700: #374151; --gray-900: #111827;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Microsoft JhengHei', sans-serif; background: var(--gray-100); }

.layout { display: flex; min-height: 100vh; }
.sidebar { width: 220px; background: var(--gray-900); color: white; padding: 16px 0; position: fixed; top: 0; left: 0; bottom: 0; overflow-y: auto; z-index: 10; }
.sidebar h2 { font-size: 13px; padding: 0 16px; margin-bottom: 12px; color: var(--teal-light); letter-spacing: 1px; }
.nav-item { display: flex; justify-content: space-between; padding: 5px 16px; color: #d1d5db; text-decoration: none; font-size: 12px; }
.nav-item:hover { background: rgba(255,255,255,0.1); color: white; }
.nav-count { background: rgba(255,255,255,0.15); padding: 0 6px; border-radius: 8px; font-size: 11px; }
.main { flex: 1; margin-left: 220px; padding: 20px 24px; max-width: 1100px; }

.header { background: linear-gradient(135deg, var(--teal), #065f46); color: white; padding: 24px 28px; border-radius: 14px; margin-bottom: 16px; }
.header h1 { font-size: 20px; margin-bottom: 6px; }
.header p { opacity: 0.85; font-size: 13px; line-height: 1.6; }
.stats { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
.stat { background: rgba(255,255,255,0.15); padding: 5px 12px; border-radius: 8px; font-size: 12px; }

.teacher-bar { background: white; padding: 12px 16px; border-radius: 10px; margin-bottom: 12px; display: flex; gap: 10px; align-items: center; border: 1px solid var(--gray-200); }
.teacher-bar label { font-weight: 600; font-size: 13px; white-space: nowrap; }
.teacher-bar input { flex: 1; min-width: 140px; padding: 7px 10px; border: 2px solid var(--gray-200); border-radius: 6px; font-size: 13px; }
.teacher-bar input:focus { border-color: var(--teal); outline: none; }

.controls { background: white; padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; border: 1px solid var(--gray-200); position: sticky; top: 0; z-index: 5; }
.controls button { padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all .15s; }
.btn-filter { background: var(--gray-200); color: var(--gray-700); }
.btn-filter:hover { background: #d1d5db; }
.btn-filter.active { background: var(--blue); color: white; }
.btn-export { background: var(--gray-700); color: white; }
.btn-export:hover { background: var(--gray-900); }
#counter { color: var(--gray-500); font-size: 12px; }

.pkg-header { font-size: 15px; font-weight: 700; color: var(--gray-900); margin: 24px 0 8px; padding: 6px 0; border-bottom: 2px solid var(--teal); }

.card { background: white; border-radius: 10px; margin-bottom: 8px; border: 1px solid var(--gray-200); overflow: hidden; transition: border-color .2s; }
.card.illust { border-left: 4px solid var(--amber); }
.card.chart { border-left: 4px solid var(--blue); }
.card.has-input { border-left: 4px solid var(--green); }
.card-header { padding: 7px 12px; background: var(--gray-50); display: flex; align-items: center; gap: 8px; }
.badge { font-size: 10px; padding: 2px 7px; border-radius: 10px; font-weight: 700; }
.badge-chart { background: #dbeafe; color: #1e40af; }
.badge-illust { background: #fef3c7; color: #92400e; }
.label { font-size: 12px; color: var(--gray-700); }
.meta { font-size: 10px; color: var(--gray-500); margin-left: auto; }
.card-body { display: flex; gap: 12px; padding: 12px; }
.svg-preview { width: 320px; min-width: 260px; background: var(--gray-50); border-radius: 8px; padding: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.svg-preview svg { max-width: 100%; max-height: 240px; }
.input-area { flex: 1; min-width: 0; }

.input-tabs { display: flex; gap: 4px; margin-bottom: 8px; }
.tab { padding: 5px 12px; border: 1px solid var(--gray-200); background: white; border-radius: 6px; cursor: pointer; font-size: 12px; color: var(--gray-500); }
.tab:hover { border-color: var(--teal); color: var(--teal); }
.tab.active { background: var(--teal); color: white; border-color: var(--teal); }
.tab-skip.active { background: var(--gray-500); border-color: var(--gray-500); }
.tab-content textarea { width: 100%; min-height: 70px; padding: 10px; border: 2px solid var(--gray-200); border-radius: 6px; font-size: 13px; font-family: monospace; resize: vertical; }
.tab-content input[type="url"] { width: 100%; padding: 10px; border: 2px solid var(--gray-200); border-radius: 6px; font-size: 13px; }
.tab-content textarea:focus, .tab-content input:focus { border-color: var(--teal); outline: none; }
.hint { font-size: 11px; color: var(--gray-500); margin-top: 6px; }
.skip-msg { padding: 20px; text-align: center; color: var(--gray-500); font-size: 14px; background: var(--gray-50); border-radius: 6px; }
.img-preview-box { margin-top: 8px; }
.img-preview-box img { max-width: 200px; max-height: 120px; border-radius: 6px; border: 1px solid var(--gray-200); }

@media (max-width: 900px) {
  .sidebar { display: none; }
  .main { margin-left: 0; }
  .card-body { flex-direction: column; }
  .svg-preview { width: 100%; min-width: unset; }
}

.hidden { display: none !important; }
#toast { position: fixed; bottom: 20px; right: 20px; background: var(--teal); color: white; padding: 12px 20px; border-radius: 10px; display: none; z-index: 999; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,.2); }
</style>
</head>
<body>

<div class="layout">
<nav class="sidebar">
  <h2>教學包</h2>
  ${nav}
</nav>

<div class="main">
<div class="header">
  <h1>CCE 投影片圖片審核</h1>
  <p>檢視每張 SVG 原圖，選擇替換方案：提供 AI 生圖 prompt、貼上圖片連結、或直接上傳圖片。<br>
  編輯結果會自動存在瀏覽器中，完成後點「匯出 ZIP」下載（JSON + 圖片檔案）。</p>
  <div class="stats">
    <div class="stat">${allData.filter(d => d.svgs.length > 0).length} 個教學包</div>
    <div class="stat">共 ${totalSvgs} 張 SVG</div>
    <div class="stat">${illustrationCount} 張示意圖</div>
    <div class="stat">${totalSvgs - illustrationCount} 張數據圖表</div>
  </div>
</div>

<div class="teacher-bar">
  <label>填寫者：</label>
  <input type="text" id="teacher-name" placeholder="你的名字（選填）" oninput="saveLocal()">
</div>

<div class="controls">
  <button class="btn-filter active" onclick="filterCards('all',this)">全部</button>
  <button class="btn-filter" onclick="filterCards('illust',this)">示意圖</button>
  <button class="btn-filter" onclick="filterCards('chart',this)">數據圖表</button>
  <button class="btn-filter" onclick="filterCards('filled',this)">已編輯</button>
  <span style="flex:1"></span>
  <span id="counter">已編輯: 0</span>
  <button class="btn-export" onclick="exportZip()">匯出 ZIP</button>
</div>

${cards}

</div>
</div>

<div id="toast"></div>

<script>
// ── In-memory image store (idx → { filename, arrayBuffer, dataUrl }) ──
const uploadedImages = {};

// ── LocalStorage auto-save (text fields only, not images) ──
const STORAGE_KEY = "cce-svg-review";

function saveLocal() {
  const teacher = document.getElementById("teacher-name").value;
  const data = { teacher, cards: {} };
  document.querySelectorAll(".card").forEach(card => {
    const idx = card.dataset.idx;
    const activeTab = card.querySelector(".tab.active")?.dataset?.tab || "";
    let type = "skip", value = "";
    if (activeTab === "prompt") {
      type = "prompt"; value = card.querySelector('[data-type="prompt"]')?.value || "";
    } else if (activeTab === "url") {
      type = "url"; value = card.querySelector('[data-type="url"]')?.value || "";
    } else if (activeTab === "upload") {
      if (uploadedImages[idx]) { type = "upload"; value = uploadedImages[idx].filename; }
    }
    if (value.trim()) data.cards[idx] = { type, value };
  });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.teacher) document.getElementById("teacher-name").value = data.teacher;
    for (const [idx, { type, value }] of Object.entries(data.cards || {})) {
      const card = document.querySelector('.card[data-idx="' + idx + '"]');
      if (!card) continue;
      if (type === "prompt") {
        const ta = card.querySelector('[data-type="prompt"]');
        if (ta) ta.value = value;
        const tab = card.querySelector('[data-tab="prompt"]');
        if (tab) switchTab(tab);
      } else if (type === "url") {
        const inp = card.querySelector('[data-type="url"]');
        if (inp) { inp.value = value; previewUrl(inp); }
        const tab = card.querySelector('[data-tab="url"]');
        if (tab) switchTab(tab);
      }
      markCard(card);
    }
    updateCounter();
  } catch(e) {}
}

// ── Tab switching ──
function switchTab(btn) {
  const card = btn.closest(".card");
  const type = btn.dataset.tab;
  card.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  card.querySelectorAll(".tab-content").forEach(tc => tc.style.display = "none");
  card.querySelector(".tc-" + type).style.display = "";
  markCard(card);
  saveLocal();
}

function markCard(card) {
  const activeTab = card.querySelector(".tab.active")?.dataset?.tab || "";
  const idx = card.dataset.idx;
  let hasInput = false;
  if (activeTab === "prompt") {
    hasInput = !!(card.querySelector('[data-type="prompt"]')?.value?.trim());
  } else if (activeTab === "url") {
    hasInput = !!(card.querySelector('[data-type="url"]')?.value?.trim());
  } else if (activeTab === "upload") {
    hasInput = !!(uploadedImages[idx] || card.querySelector('.field-file')?.files?.length);
  }
  card.classList.toggle("has-input", hasInput);
}

// ── Input events ──
document.querySelectorAll('.field').forEach(el => {
  el.addEventListener("input", () => { markCard(el.closest(".card")); updateCounter(); saveLocal(); });
  el.addEventListener("change", () => { markCard(el.closest(".card")); updateCounter(); saveLocal(); });
});

// URL preview
document.querySelectorAll('[data-type="url"]').forEach(inp => {
  inp.addEventListener("change", () => previewUrl(inp));
});
function previewUrl(inp) {
  const box = inp.closest(".tab-content").querySelector(".img-preview-box");
  const url = inp.value.trim();
  box.innerHTML = url ? '<img src="' + url.replace(/"/g, "&quot;") + '" onerror="this.remove()">' : "";
}

// File upload → read into memory
document.querySelectorAll(".field-file").forEach(inp => {
  inp.addEventListener("change", () => {
    const card = inp.closest(".card");
    const idx = card.dataset.idx;
    const box = inp.closest(".tab-content").querySelector(".img-preview-box");
    if (inp.files && inp.files[0]) {
      const file = inp.files[0];
      if (file.size > 5 * 1024 * 1024) { alert("檔案太大（上限 5MB）：" + file.name); inp.value = ""; return; }
      const pkg = card.dataset.pkg.replace(/[\\\\/]/g, "-");
      const slide = card.dataset.slide;
      const ext = file.name.split(".").pop() || "png";
      const filename = pkg + "_" + slide + "." + ext;
      const reader = new FileReader();
      reader.onload = e => {
        uploadedImages[idx] = { filename, arrayBuffer: e.target.result, originalName: file.name };
        // Show preview
        const blob = new Blob([e.target.result], { type: file.type });
        box.innerHTML = '<img src="' + URL.createObjectURL(blob) + '"><br><span style="font-size:11px;color:#6b7280;">' + file.name + '</span>';
        markCard(card); updateCounter(); saveLocal();
      };
      reader.readAsArrayBuffer(file);
    } else {
      delete uploadedImages[idx];
      box.innerHTML = "";
      markCard(card); updateCounter(); saveLocal();
    }
  });
});

function updateCounter() {
  const filled = document.querySelectorAll(".card.has-input").length;
  document.getElementById("counter").textContent = "已編輯: " + filled;
}

// ── Filter ──
function filterCards(type, btn) {
  document.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".card").forEach(card => {
    if (type === "all") card.classList.remove("hidden");
    else if (type === "filled") card.classList.toggle("hidden", !card.classList.contains("has-input"));
    else card.classList.toggle("hidden", !card.classList.contains(type));
  });
  document.querySelectorAll(".pkg-header").forEach(h => {
    let next = h.nextElementSibling, hasVisible = false;
    while (next && !next.classList.contains("pkg-header")) {
      if (next.classList.contains("card") && !next.classList.contains("hidden")) hasVisible = true;
      next = next.nextElementSibling;
    }
    h.classList.toggle("hidden", !hasVisible);
  });
}

// ── Export ZIP (JSON + images) ──
async function exportZip() {
  const teacher = document.getElementById("teacher-name").value || "anonymous";
  const result = { teacher, timestamp: new Date().toISOString(), entries: [] };
  const imageFiles = [];

  document.querySelectorAll(".card.has-input").forEach(card => {
    const pkg = card.dataset.pkg, slide = card.dataset.slide, line = card.dataset.line;
    const idx = card.dataset.idx;
    const activeTab = card.querySelector(".tab.active")?.dataset?.tab || "";
    if (activeTab === "prompt") {
      const v = card.querySelector('[data-type="prompt"]')?.value?.trim();
      if (v) result.entries.push({ pkg, slide, line, type: "prompt", value: v });
    } else if (activeTab === "url") {
      const v = card.querySelector('[data-type="url"]')?.value?.trim();
      if (v) result.entries.push({ pkg, slide, line, type: "url", value: v });
    } else if (activeTab === "upload" && uploadedImages[idx]) {
      const img = uploadedImages[idx];
      const imgPath = "images/" + img.filename;
      result.entries.push({ pkg, slide, line, type: "upload", file: imgPath });
      imageFiles.push({ path: imgPath, data: img.arrayBuffer });
    }
  });

  if (result.entries.length === 0) { alert("沒有需要匯出的編輯。"); return; }

  const zip = new JSZip();
  zip.file("review.json", JSON.stringify(result, null, 2));
  for (const img of imageFiles) {
    zip.file(img.path, img.data);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = "svg-review-" + teacher + ".zip"; a.click();

  const imgCount = imageFiles.length;
  showToast("已匯出 " + result.entries.length + " 筆" + (imgCount ? "（含 " + imgCount + " 張圖片）" : ""));
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.style.display = "block";
  setTimeout(() => t.style.display = "none", 4000);
}

// ── Init ──
loadLocal();
</script>
</body>
</html>`;
}

// Main
const files = findPptHtml(PACKAGES_DIR).sort();
console.log(`找到 ${files.length} 個 ppt.html`);

const allData = [];
for (const f of files) {
  const rel = path.relative(PACKAGES_DIR, path.dirname(f));
  const svgs = extractSvgs(f);
  if (svgs.length > 0) {
    allData.push({ pkg: rel, svgs });
    console.log(`  ${rel}: ${svgs.length} SVGs (${svgs.filter(s => s.classification === 'illustration').length} 示意圖, ${svgs.filter(s => s.classification === 'data-chart').length} 圖表)`);
  }
}

const html = buildHtml(allData);
fs.writeFileSync(OUTPUT, html, "utf8");
console.log(`\n✅ 產出：${OUTPUT}`);
console.log(`   共 ${allData.reduce((n, d) => n + d.svgs.length, 0)} 個 SVG`);
