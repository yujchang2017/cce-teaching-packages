#!/usr/bin/env node
/**
 * ppt_script.md → PPTX 轉換器
 *
 * 用法：
 *   node scripts/md2pptx.cjs packages/level-iii/1.1-III/ppt_script.md
 *   node scripts/md2pptx.cjs packages/level-iii/1.1-III/ppt_script.md -o output.pptx
 *   node scripts/md2pptx.cjs packages/level-iii/1.1-III/ppt_script.md --no-notes
 *
 * 每張投影片若有對應圖片（同資料夾 images/slide-01.png 等），會自動嵌入。
 * 無圖片時以純色背景 + shape 裝飾呈現。
 */
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

// ── CLI ──
const args = process.argv.slice(2);
const mdPath = args.find(a => !a.startsWith("-"));
if (!mdPath) {
  console.error("用法: node scripts/md2pptx.cjs <ppt_script.md> [-o output.pptx] [--no-notes]");
  process.exit(1);
}
const noNotes = args.includes("--no-notes");
const outIdx = args.indexOf("-o");
const outPath = outIdx !== -1 && args[outIdx + 1]
  ? path.resolve(args[outIdx + 1])
  : path.resolve(path.dirname(mdPath), "ppt.pptx");

// ── Parse Markdown ──
function parseMd(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);

  let header = "";
  const slides = [];
  let cur = null;
  let fieldKey = null;

  for (const line of lines) {
    // Document title
    const h1 = line.match(/^#\s+(.+)/);
    if (h1 && !line.startsWith("##")) { header = h1[1].trim(); continue; }

    // Slide heading
    const h2 = line.match(/^##\s+Slide\s+(\S+)\s*[—–-]\s*(.*)/i);
    if (h2) {
      if (cur) slides.push(cur);
      cur = {
        id: h2[1],
        heading: h2[2].trim(),
        visual: "",
        title: "",
        notes: "",
        source: "",
        question: "",
        body: [],
      };
      fieldKey = null;
      continue;
    }

    if (!cur) continue;
    if (line.trim() === "---") continue;

    // Field markers
    const field = line.match(/^\*\*(\S+?)\*\*\s*[：:]\s*(.*)/);
    if (field) {
      const key = field[1];
      const val = field[2].trim();
      if (key === "視覺") { cur.visual = val; fieldKey = "visual"; }
      else if (key === "標題") { cur.title = val; fieldKey = "title"; }
      else if (key.startsWith("講者稿")) { cur.notes = val; fieldKey = "notes"; }
      else if (key === "資料來源") { cur.source = val; fieldKey = "source"; }
      else if (key.startsWith("提問")) { cur.question = val; fieldKey = "question"; }
      else { fieldKey = null; }
      continue;
    }

    // Source in blockquote
    const bq = line.match(/^>\s*資料來源\s*[：:]\s*(.*)/);
    if (bq) { cur.source = bq[1].trim(); fieldKey = "source"; continue; }
    const bqCont = line.match(/^>\s*(.*)/);
    if (bqCont && fieldKey === "source") { cur.source += " " + bqCont[1].trim(); continue; }

    // Continuation lines for current field
    const trimmed = line.trim();
    if (trimmed && fieldKey === "notes") { cur.notes += "\n" + trimmed; }
    else if (trimmed && fieldKey === "visual") { cur.visual += " " + trimmed; }
    else if (trimmed && fieldKey === "source") { cur.source += " " + trimmed; }
    else if (trimmed && fieldKey === "question") { cur.question += " " + trimmed; }
  }
  if (cur) slides.push(cur);
  return { header, slides };
}

// ── PALETTE ──
const C = {
  teal: "0F766E", tealSoft: "CCFBF1", tealBg: "F0FDFA",
  blue: "2563EB", blueSoft: "DBEAFE",
  pink: "DB2777", pinkSoft: "FCE7F3",
  green: "16A34A", greenSoft: "DCFCE7",
  orange: "EA580C", orangeSoft: "FFF7ED",
  red: "DC2626", redSoft: "FEE2E2",
  text: "1F2937", muted: "6B7280", light: "F3F4F6",
  white: "FFFFFF", border: "E5E7EB",
};
const FONT = "Arial";
const mkShadow = () => ({ type: "outer", color: "000000", blur: 6, offset: 2, angle: 45, opacity: 0.12 });

// ── Detect slide type from heading/id ──
function slideType(slide) {
  const h = slide.heading.toLowerCase();
  const id = slide.id.toLowerCase();
  if (h.includes("封面") || id === "1") return "cover";
  if (h.includes("延伸") || h.includes("回家")) return "closing";
  if (h.includes("活動")) return "activity";
  if (h.includes("總結") || h.includes("關鍵字")) return "summary";
  if (h.includes("wsa") || h.includes("全校")) return "wsa";
  return "content";
}

// ── Find slide image ──
function findImage(mdDir, slideId) {
  const pad2 = String(slideId).replace(/[ab]/gi, "").padStart(2, "0");
  const suffix = slideId.match(/[ab]/i) ? slideId.match(/[ab]/i)[0] : "";
  const candidates = [
    `images/slide-${pad2}${suffix}.png`,
    `images/slide-${pad2}${suffix}.jpg`,
    `images/slide-${slideId}.png`,
    `images/slide-${slideId}.jpg`,
  ];
  for (const c of candidates) {
    const full = path.join(mdDir, c);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

// ── Build PPTX ──
function buildPptx({ header, slides }, mdDir) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "CCE Teaching Packages";
  pres.title = header;

  for (const sl of slides) {
    const type = slideType(sl);
    const s = pres.addSlide();
    const imgPath = findImage(mdDir, sl.id);

    // ── COVER ──
    if (type === "cover") {
      s.background = { color: C.teal };
      // Decorative circles
      s.addShape(pres.shapes.OVAL, { x: 7.5, y: -0.5, w: 3, h: 3, fill: { color: C.white, transparency: 90 } });
      s.addShape(pres.shapes.OVAL, { x: 8.5, y: 3.5, w: 2, h: 2, fill: { color: C.white, transparency: 85 } });

      const title = sl.title || sl.heading;
      s.addText(title, {
        x: 0.8, y: 1.2, w: 7.5, h: 2.2,
        fontSize: 40, color: C.white, fontFace: FONT, bold: true, lineSpacingMultiple: 1.3,
      });
      // Visual description as subtitle
      if (sl.visual) {
        s.addText(sl.visual.slice(0, 80), {
          x: 0.8, y: 3.5, w: 7, h: 0.5,
          fontSize: 14, color: C.tealSoft, fontFace: FONT, italic: true,
        });
      }
      // If image exists, put it on the right
      if (imgPath) {
        s.addImage({ path: imgPath, x: 6.0, y: 0.8, w: 3.5, h: 4.0, sizing: { type: "contain", w: 3.5, h: 4.0 } });
      }
      s.addText(header, {
        x: 0.8, y: 4.8, w: 8, h: 0.4,
        fontSize: 12, color: C.tealSoft, fontFace: FONT,
      });

    // ── CLOSING (dark bg) ──
    } else if (type === "closing") {
      s.background = { color: C.teal };
      s.addText(sl.heading, {
        x: 0.8, y: 0.5, w: 8.5, h: 0.8,
        fontSize: 32, color: C.white, fontFace: FONT, bold: true, align: "center",
      });
      // Extract numbered items from notes/visual
      const numbered = (sl.notes || sl.visual || "").match(/\d+\.\s*[^\n]+/g);
      if (numbered) {
        s.addText(numbered.map((item, i) => ({
          text: item, options: { breakLine: i < numbered.length - 1, fontSize: 18, color: C.white }
        })), { x: 1.5, y: 1.6, w: 7, h: 3.2, fontFace: FONT, paraSpaceAfter: 16 });
      }

    // ── ACTIVITY ──
    } else if (type === "activity") {
      // Activity tag
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 0.5, y: 0.4, w: 1.5, h: 0.35, fill: { color: C.orangeSoft }, rectRadius: 0.05,
      });
      s.addText("活動", {
        x: 0.5, y: 0.4, w: 1.5, h: 0.35,
        fontSize: 11, color: C.orange, fontFace: FONT, bold: true, align: "center", margin: 0,
      });
      s.addText(sl.heading.replace(/^活動[：:]?\s*/, ""), {
        x: 0.5, y: 0.9, w: 9, h: 0.7,
        fontSize: 28, color: C.teal, fontFace: FONT, bold: true,
      });
      // Visual description
      if (sl.visual) {
        s.addText(sl.visual, {
          x: 0.8, y: 1.8, w: 8.4, h: 1.0,
          fontSize: 14, color: C.muted, fontFace: FONT, italic: true,
        });
      }
      if (imgPath) {
        s.addImage({ path: imgPath, x: 2.5, y: 2.0, w: 5, h: 3, sizing: { type: "contain", w: 5, h: 3 } });
      }
      if (sl.question) {
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
          x: 1.0, y: 4.4, w: 8, h: 0.8, fill: { color: C.tealBg }, rectRadius: 0.1,
        });
        s.addText(sl.question, {
          x: 1.0, y: 4.4, w: 8, h: 0.8,
          fontSize: 16, color: C.teal, fontFace: FONT, bold: true, align: "center",
        });
      }

    // ── CONTENT (default) ──
    } else {
      s.addText(sl.heading, {
        x: 0.5, y: 0.4, w: 9, h: 0.7,
        fontSize: 28, color: C.teal, fontFace: FONT, bold: true,
      });

      if (imgPath) {
        // Two-column: image right, visual description left
        s.addImage({ path: imgPath, x: 5.2, y: 1.3, w: 4.3, h: 3.5, sizing: { type: "contain", w: 4.3, h: 3.5 } });
        if (sl.visual) {
          s.addText(sl.visual, {
            x: 0.5, y: 1.3, w: 4.5, h: 3.5,
            fontSize: 15, color: C.text, fontFace: FONT,
          });
        }
      } else {
        // No image: show visual description as placeholder hint + decorative shape
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
          x: 5.5, y: 1.3, w: 4.0, h: 3.5,
          fill: { color: C.light }, rectRadius: 0.15, shadow: mkShadow(),
        });
        // Image placeholder label
        s.addText("[圖片]\n" + (sl.visual || "").slice(0, 100), {
          x: 5.5, y: 1.3, w: 4.0, h: 3.5,
          fontSize: 12, color: C.muted, fontFace: FONT, align: "center", valign: "middle",
        });
        // Key content from visual field on the left
        if (sl.visual) {
          s.addText(sl.visual, {
            x: 0.5, y: 1.3, w: 4.7, h: 3.5,
            fontSize: 15, color: C.text, fontFace: FONT,
          });
        }
      }

      // Question callout
      if (sl.question) {
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
          x: 0.5, y: 4.5, w: 6, h: 0.7, fill: { color: C.tealBg }, rectRadius: 0.08,
        });
        s.addText("Q: " + sl.question, {
          x: 0.7, y: 4.5, w: 5.6, h: 0.7,
          fontSize: 13, color: C.teal, fontFace: FONT, bold: true,
        });
      }

      // Source
      if (sl.source) {
        s.addText("資料來源：" + sl.source, {
          x: 0.5, y: 5.15, w: 9, h: 0.35,
          fontSize: 8, color: C.muted, fontFace: FONT,
        });
      }
    }

    // ── Speaker notes ──
    if (!noNotes && sl.notes) {
      s.addNotes(sl.notes);
    }
  }

  return pres;
}

// ── Main ──
const mdAbs = path.resolve(mdPath);
const mdDir = path.dirname(mdAbs);
const parsed = parseMd(mdAbs);

console.log(`解析完成：${parsed.slides.length} 張投影片`);
parsed.slides.forEach(s => console.log(`  Slide ${s.id} — ${s.heading}`));

const imgDir = path.join(mdDir, "images");
const imgCount = fs.existsSync(imgDir)
  ? fs.readdirSync(imgDir).filter(f => /\.(png|jpe?g)$/i.test(f)).length
  : 0;
console.log(`圖片資料夾：${imgCount} 張（${imgDir}）`);

const pres = buildPptx(parsed, mdDir);
pres.writeFile({ fileName: outPath }).then(() => {
  const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
  console.log(`\n✅ 產出 ${outPath}（${kb} KB）`);
  if (imgCount === 0) {
    console.log("\n💡 目前沒有投影片圖片。放入圖片到 images/ 資料夾後重新執行即可嵌入：");
    console.log("   images/slide-01.png, slide-02.png, ... slide-22a.png, slide-22b.png");
  }
});
