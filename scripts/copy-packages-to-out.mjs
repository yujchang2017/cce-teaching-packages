#!/usr/bin/env node
/**
 * Copy public teaching package files into Next.js static export output.
 *
 * GitHub Pages can serve only the uploaded artifact. After merging the website
 * and package repository, package HTML files must be included in web/out too,
 * otherwise /packages/... routes are caught by the Next.js 404 page.
 */
import { cp, mkdir, rm, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOURCE = join(ROOT, "packages");
const TARGET = join(ROOT, "web", "out", "packages");

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(SOURCE))) {
    console.error(`[copy-packages] 找不到 packages 目錄: ${SOURCE}`);
    process.exit(1);
  }

  await mkdir(dirname(TARGET), { recursive: true });
  await rm(TARGET, { recursive: true, force: true });
  await cp(SOURCE, TARGET, { recursive: true });
  console.log(`[copy-packages] copied ${SOURCE} -> ${TARGET}`);
}

main().catch((err) => {
  console.error("[copy-packages] failed:", err);
  process.exit(1);
});