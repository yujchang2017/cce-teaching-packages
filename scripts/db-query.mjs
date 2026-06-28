#!/usr/bin/env node
/**
 * SQLite 查詢工具
 * 用法：node scripts/db-query.mjs "SQL語句"
 * 範例：
 *   node scripts/db-query.mjs "SELECT * FROM teachers LIMIT 5"
 *   node scripts/db-query.mjs "SELECT event, COUNT(*) as n FROM events GROUP BY event"
 *   node scripts/db-query.mjs tables          ← 列出所有表
 *   node scripts/db-query.mjs info teachers   ← 查看表結構
 */
import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, "..", "_local", "cce.db"), { readonly: true });

const arg = process.argv.slice(2).join(" ").trim();
if (!arg) {
  console.log("用法: node scripts/db-query.mjs <SQL | tables | info 表名>");
  console.log("\n常用查詢：");
  console.log('  "SELECT * FROM packages LIMIT 10"');
  console.log('  "SELECT event, COUNT(*) as n FROM events GROUP BY event ORDER BY n DESC"');
  console.log('  "SELECT county, COUNT(*) as n FROM teachers GROUP BY county ORDER BY n DESC"');
  console.log('  "SELECT * FROM v_package_stats ORDER BY views DESC LIMIT 10"');
  process.exit(0);
}

if (arg === "tables") {
  const tables = db.prepare("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY type, name").all();
  console.log("表格/視圖：");
  for (const t of tables) {
    const c = db.prepare(`SELECT COUNT(*) as n FROM "${t.name}"`).get();
    console.log(`  [${t.type}] ${t.name}: ${c.n} 筆`);
  }
} else if (arg.startsWith("info ")) {
  const table = arg.slice(5).trim();
  const cols = db.prepare(`PRAGMA table_info("${table}")`).all();
  if (!cols.length) { console.error("找不到表:", table); process.exit(1); }
  console.log(`${table} 結構：`);
  for (const c of cols) {
    const pk = c.pk ? " (PK)" : "";
    const nn = c.notnull ? " NOT NULL" : "";
    console.log(`  ${c.name}: ${c.type}${nn}${pk}`);
  }
  const count = db.prepare(`SELECT COUNT(*) as n FROM "${table}"`).get();
  console.log(`\n共 ${count.n} 筆`);
} else {
  try {
    const stmt = db.prepare(arg);
    if (stmt.reader) {
      const rows = stmt.all();
      if (!rows.length) { console.log("(無結果)"); }
      else { console.table(rows); console.log(`\n共 ${rows.length} 筆`); }
    } else {
      console.log("⚠ 此工具為唯讀模式，不執行寫入操作");
    }
  } catch (e) { console.error("SQL 錯誤:", e.message); }
}
db.close();
