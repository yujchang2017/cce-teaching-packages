#!/usr/bin/env node
/**
 * 將所有 packages/level-*\/*\/worksheet.html 的
 *   <script src="https://cdn.tailwindcss.com"></script>
 * 替換為
 *   <link rel="stylesheet" href="/tailwind.css">
 *
 * 跳過 .claude/ worktrees。
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PACKAGES = join(ROOT, "packages");

const OLD = '<script src="https://cdn.tailwindcss.com"></script>';
const NEW = '<link rel="stylesheet" href="/tailwind.css">';

let updated = 0, skipped = 0;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".claude") continue; // 跳過 worktrees
      await walk(full);
    } else if (entry.name === "worksheet.html") {
      const content = await readFile(full, "utf8");
      if (content.includes(OLD)) {
        await writeFile(full, content.replace(OLD, NEW), "utf8");
        console.log("UPDATED:", full.replace(PACKAGES, ""));
        updated++;
      } else {
        skipped++;
      }
    }
  }
}

await walk(PACKAGES);
console.log(`\nDone: updated=${updated}, skipped=${skipped}`);
