#!/usr/bin/env node
/**
 * 從 packages/ 目錄讀取所有教學包元資料，寫入 SQLite
 * 用法：node scripts/db-seed-packages.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DB_PATH = join(ROOT, "_local", "cce.db");
const PACKAGES_DIR = join(ROOT, "packages");

const THEMES = {
  1: { name: "氣候科學", subtopics: { 1: "氣候系統", 2: "溫室效應與碳循環", 3: "氣候變遷的證據", 4: "未來氣候預測", 5: "氣候與天氣", 6: "碳足跡" } },
  2: { name: "自然環境", subtopics: { 1: "生態系與生物多樣性", 2: "水資源", 3: "海洋與海岸", 4: "極端天氣與災害", 5: "空氣品質", 6: "土地利用變遷" } },
  3: { name: "社會影響", subtopics: { 1: "健康與安全", 2: "糧食安全", 3: "氣候難民與公平正義", 4: "經濟影響" } },
  4: { name: "社會轉型", subtopics: { 1: "能源轉型", 2: "循環經濟", 3: "綠色交通", 4: "永續城市", 5: "氣候政策" } },
  5: { name: "永續行動", subtopics: { 1: "公民行動", 2: "校園行動", 3: "社區行動" } },
  6: { name: "綠色生活", subtopics: { 1: "綠色消費", 2: "節能減碳", 3: "永續消費行為", 4: "飲食與碳排" } },
};

const LEVEL_LABELS = {
  II: "幼兒園至國小低年級 (5-8歲)",
  III: "國小中高年級 (9-12歲)",
  IV: "國中 (13-15歲)",
  V: "高中 (15-18歲)",
};

if (!existsSync(DB_PATH)) {
  console.error("❌ 資料庫不存在，請先執行: node scripts/db-init.mjs");
  process.exit(1);
}

const db = new Database(DB_PATH);

const insert = db.prepare(`
  INSERT OR REPLACE INTO packages (key_id, theme_num, theme_name, subtopic, level, level_label, version, updated_at)
  VALUES (@key_id, @theme_num, @theme_name, @subtopic, @level, @level_label, @version, @updated_at)
`);

let count = 0;
const tx = db.transaction(() => {
  for (const levelDir of readdirSync(PACKAGES_DIR)) {
    const levelPath = join(PACKAGES_DIR, levelDir);
    if (!statSync(levelPath).isDirectory() || !levelDir.startsWith("level-")) continue;

    for (const pkgDir of readdirSync(levelPath)) {
      const pkgPath = join(levelPath, pkgDir);
      if (!statSync(pkgPath).isDirectory()) continue;

      const m = pkgDir.match(/^(\d+)\.(\d+)-(II|III|IV|V)$/);
      if (!m) continue;

      const themeNum = parseInt(m[1]);
      const subNum = parseInt(m[2]);
      const level = m[3];
      const keyId = pkgDir;

      const theme = THEMES[themeNum];
      if (!theme) continue;

      let version = "1.0.0";
      const versionFile = join(pkgPath, "_versions", "1.0.0", "version.json");
      if (existsSync(versionFile)) {
        try {
          const vj = JSON.parse(readFileSync(versionFile, "utf8"));
          version = vj.version || version;
        } catch {}
      }

      let updatedAt = null;
      const metaFile = join(pkgPath, "_meta.json");
      if (existsSync(metaFile)) {
        try {
          const mj = JSON.parse(readFileSync(metaFile, "utf8"));
          updatedAt = mj.lastModified || mj.updated_at || null;
        } catch {}
      }

      insert.run({
        key_id: keyId,
        theme_num: themeNum,
        theme_name: theme.name,
        subtopic: theme.subtopics[subNum] || `子主題${subNum}`,
        level,
        level_label: LEVEL_LABELS[level] || level,
        version,
        updated_at: updatedAt,
      });
      count++;
    }
  }
});
tx();

console.log(`✅ 已寫入 ${count} 個教學包到 packages 表`);
db.close();
