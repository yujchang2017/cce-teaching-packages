#!/usr/bin/env node
/**
 * Regenerate packages/_index.json by reading each data_card.json.
 * - Replaces themeName with the 6 UNESCO《綠色課程指南》aligned names.
 * - Extracts a Chinese topic title from data_card.title (or .topic as fallback).
 * - Preserves prior English topic as topicEn fallback for UI safety.
 *
 * Usage: node scripts/build_index.js
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const PKG_DIR = path.join(REPO_ROOT, 'packages');
const OLD_INDEX_PATH = path.join(PKG_DIR, '_index.json');
const LEVELS = ['level-ii', 'level-iii', 'level-iv', 'level-v'];

// UNESCO 《綠色課程指南：氣候行動的教學與學習》 6 themes
const THEME_NAMES = {
  1: '氣候科學',
  2: '生態系與生物多樣性',
  3: '氣候正義',
  4: '韌性建構',
  5: '後碳經濟',
  6: '永續生活形態',
};

// Any trailing " — 數據資料卡 / 資料卡 / 國中數據資料卡 / 高中數據資料卡 / 小小...資料卡" is stripped.
// Separators we consider: " — " (em dash), " - " (hyphen/en dash), " · ", "——" (double em), " : ", " 》"
// Basic rule: if the string contains a trailing section that ends with 資料卡, drop from the last
// separator before that section. Otherwise, keep as-is.
const SEPARATORS = [' — ', ' – ', ' - ', '——', ' · ', ' ： ', '：', ' | '];

function stripTrailingCard(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim();
  if (!s) return null;

  // 1) Strip trailing parentheticals of any kind: (5-8 歲), （角色:...）, （氣候情緒啟蒙）, （臭氧層、氮循環與 RRRR）, (小農夫米米) etc.
  //    Repeat because there may be multiple trailing parentheticals.
  for (let i = 0; i < 4; i++) {
    const next = s.replace(/\s*[（(][^（()）]*[)）]\s*$/, '').trim();
    if (next === s) break;
    s = next;
  }

  // 4) If the whole title still ends in 資料卡/小卡/卡, cut from the last separator.
  const endsWithCard = /(資料卡|小卡)[）)」」]?\s*$/.test(s);
  if (endsWithCard) {
    let cut = -1;
    let sepLen = 0;
    for (const sep of SEPARATORS) {
      const idx = s.lastIndexOf(sep);
      if (idx > cut) {
        cut = idx;
        sepLen = sep.length;
      }
    }
    if (cut > 0) {
      const left = s.slice(0, cut).trim();
      const right = s.slice(cut + sepLen).trim();
      // Only strip if the right side ends in 資料卡/小卡.
      if (/(資料卡|小卡)[）)」」]?\s*$/.test(right)) {
        s = left;
      }
    }
  }

  // 5) Strip trailing "· 國中數據資料卡" / "— 資料卡" style tails if still present.
  s = s.replace(/\s*(?:·|——|－|—|-)\s*(?:國中|高中|小學)?\s*(?:數據)?(?:資料卡|小卡)\s*$/, '').trim();

  // 6) If separators remain and one side contains 資料卡/小卡, drop that side.
  //    e.g. "小小能源偵探資料卡 — 陽光、風與我們的地球" → "陽光、風與我們的地球" (drop left)
  //    e.g. "碳循環 — 小樹朋友的...祕密" — no 資料卡 either side, keep as-is.
  for (const sep of SEPARATORS) {
    if (s.includes(sep)) {
      const parts = s.split(sep);
      if (parts.length === 2) {
        const [L, R] = parts.map((p) => p.trim());
        const lCard = /(資料卡|小卡)/.test(L);
        const rCard = /(資料卡|小卡)/.test(R);
        if (rCard && !lCard) { s = L; break; }
        if (lCard && !rCard) { s = R; break; }
      }
    }
  }

  // 7) Strip any now-dangling trailing dash/separator.
  s = s.replace(/[\s\-—–·]+$/u, '').trim();

  return s || raw.trim();
}

/** Heuristic: true if the string is mostly Latin letters (English-ish). */
function looksEnglish(s) {
  if (!s) return false;
  const latin = (s.match(/[A-Za-z]/g) || []).length;
  const cjk = (s.match(/[\u4e00-\u9fff]/g) || []).length;
  return latin > 2 && cjk === 0;
}

function readJson(file) {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function main() {
  const oldIndex = readJson(OLD_INDEX_PATH) || { packages: [] };
  const oldByKey = new Map();
  for (const p of oldIndex.packages || []) oldByKey.set(p.keyId, p);

  const stats = { extractedZh: 0, fallbackTopic: 0, fallbackOldEnglish: 0, skipped: 0, warnings: [] };
  const out = [];

  for (const level of LEVELS) {
    const levelDir = path.join(PKG_DIR, level);
    if (!fs.existsSync(levelDir)) continue;
    const keys = fs.readdirSync(levelDir).filter((d) =>
      fs.statSync(path.join(levelDir, d)).isDirectory()
    );

    for (const keyId of keys.sort()) {
      const dataCardPath = path.join(levelDir, keyId, 'data_card.json');
      const oldEntry = oldByKey.get(keyId);
      if (!oldEntry) {
        stats.warnings.push(`No prior index entry for ${keyId}`);
      }

      const dc = readJson(dataCardPath);
      let topicZh = null;
      let source = 'none';

      if (dc) {
        // Prefer data_card.title, else data_card.topic.
        const candidate = (typeof dc.title === 'string' && dc.title.trim()) ||
                          (typeof dc.topic === 'string' && dc.topic.trim()) ||
                          null;

        if (candidate) {
          if (looksEnglish(candidate)) {
            // English title — skip, will fallback below.
            stats.warnings.push(`[${keyId}] title field looks English: ${candidate}`);
          } else {
            const cleaned = stripTrailingCard(candidate);
            if (cleaned) {
              topicZh = cleaned;
              source = dc.title ? 'title' : 'topic';
              stats.extractedZh += 1;
              if (source === 'topic') stats.fallbackTopic += 1;
            }
          }
        }
      } else {
        stats.warnings.push(`[${keyId}] data_card.json missing or malformed`);
      }

      // Fallback chain: if no Chinese topic found, keep the old entry's topic (may be English).
      if (!topicZh && oldEntry && oldEntry.topic) {
        topicZh = oldEntry.topic;
        source = 'old-index';
        if (looksEnglish(topicZh)) stats.fallbackOldEnglish += 1;
      }

      if (!topicZh && !oldEntry) {
        stats.warnings.push(`[${keyId}] no data_card and no old index entry — skipping`);
        stats.skipped += 1;
        continue;
      }

      // Build new entry by preserving the old entry's fields and overriding topic + themeName.
      const base = oldEntry ? { ...oldEntry } : {
        keyId,
        level: level.replace('level-', '').toUpperCase(),
        themeNumber: Number(keyId.split('.')[0]),
      };

      const themeNumber = base.themeNumber;
      const newThemeName = THEME_NAMES[themeNumber] || base.themeName;

      // Preserve prior English topic as topicEn for UI fallback (only if it was English).
      const prevTopic = oldEntry && oldEntry.topic ? oldEntry.topic : null;
      const topicEn = prevTopic && looksEnglish(prevTopic) ? prevTopic : (base.topicEn || undefined);

      const newEntry = {
        ...base,
        themeName: newThemeName,
        topic: topicZh,
      };
      if (topicEn) newEntry.topicEn = topicEn;
      else delete newEntry.topicEn;

      out.push(newEntry);
    }
  }

  const newIndex = {
    generated_at: new Date().toISOString().slice(0, 10),
    total_packages: out.length,
    packages: out,
  };

  fs.writeFileSync(OLD_INDEX_PATH, JSON.stringify(newIndex, null, 2) + '\n', 'utf8');

  console.log(`Wrote ${OLD_INDEX_PATH}`);
  console.log(`  total: ${out.length}`);
  console.log(`  zh extracted: ${stats.extractedZh}`);
  console.log(`  via .topic fallback: ${stats.fallbackTopic}`);
  console.log(`  via old-index English fallback: ${stats.fallbackOldEnglish}`);
  console.log(`  skipped: ${stats.skipped}`);
  if (stats.warnings.length) {
    console.log(`  warnings (${stats.warnings.length}):`);
    for (const w of stats.warnings.slice(0, 40)) console.log(`    - ${w}`);
    if (stats.warnings.length > 40) console.log(`    ... (+${stats.warnings.length - 40} more)`);
  }
}

main();
