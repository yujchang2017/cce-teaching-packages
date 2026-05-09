#!/usr/bin/env node
/**
 * Copy only public teaching package files into Next.js static export output.
 *
 * GitHub Pages can serve only the uploaded artifact. After merging the website
 * and package repository, package HTML/data files must be included in web/out too,
 * otherwise /packages/... routes are caught by the Next.js 404 page.
 */
import { access, copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOURCE = join(ROOT, "packages");
const TARGET = join(ROOT, "web", "out", "packages");
const PUBLIC_FILES = new Set([
  "lesson_plan.html",
  "ppt.html",
  "worksheet.html",
  "data_card.json",
]);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function copyPublicPackageFiles() {
  const levels = await readdir(SOURCE, { withFileTypes: true });
  let packages = 0;
  let files = 0;

  for (const level of levels) {
    if (!level.isDirectory() || !level.name.startsWith("level-")) continue;

    const levelSource = join(SOURCE, level.name);
    const packageEntries = await readdir(levelSource, { withFileTypes: true });

    for (const pkg of packageEntries) {
      if (!pkg.isDirectory()) continue;
      packages++;

      const packageSource = join(levelSource, pkg.name);
      const packageTarget = join(TARGET, level.name, pkg.name);
      await mkdir(packageTarget, { recursive: true });

      const entries = await readdir(packageSource, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !PUBLIC_FILES.has(entry.name)) continue;
        await copyFile(join(packageSource, entry.name), join(packageTarget, entry.name));
        files++;
      }
    }
  }

  return { packages, files };
}

async function main() {
  if (!(await exists(SOURCE))) {
    console.error(`[copy-packages] 找不到 packages 目錄: ${SOURCE}`);
    process.exit(1);
  }

  await mkdir(dirname(TARGET), { recursive: true });
  await rm(TARGET, { recursive: true, force: true });
  const result = await copyPublicPackageFiles();
  console.log(`[copy-packages] copied ${result.files} public files from ${result.packages} packages -> ${TARGET}`);
}

main().catch((err) => {
  console.error("[copy-packages] failed:", err);
  process.exit(1);
});