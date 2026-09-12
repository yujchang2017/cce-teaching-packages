#!/usr/bin/env node
/**
 * Copy only public teaching package files into Next.js static export output.
 *
 * GitHub Pages can serve only the uploaded artifact. After merging the website
 * and package repository, package HTML/data files must be included in web/out too,
 * otherwise /packages/... routes are caught by the Next.js 404 page.
 */
import { access, copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
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
// 公開的子目錄白名單。教材 HTML 以 <img src="images/xxx.png"> 引用圖片，
// 未複製會在網站上變成破圖。仍採白名單，避免 qa_report.md、ppt_script.md
// （教師講稿）、version.json、_versions/ 等非公開內容被一併發佈。
const PUBLIC_DIRS = new Set(["images"]);
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"]);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * 複製單一公開子目錄（目前只有 images/）。僅收圖片副檔名、不再往下遞迴，
 * 以免日後有人在 images/ 底下放了非公開素材而被一併發佈。
 */
async function copyPublicDir(sourceDir, targetDir) {
  const entries = await readdir(sourceDir, { withFileTypes: true });
  let copied = 0;

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!IMAGE_EXT.has(extname(entry.name).toLowerCase())) continue;
    if (copied === 0) await mkdir(targetDir, { recursive: true });
    await copyFile(join(sourceDir, entry.name), join(targetDir, entry.name));
    copied++;
  }

  return copied;
}

async function copyPublicPackageFiles() {
  const levels = await readdir(SOURCE, { withFileTypes: true });
  let packages = 0;
  let files = 0;
  let images = 0;

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
        if (entry.isDirectory()) {
          if (!PUBLIC_DIRS.has(entry.name)) continue;
          images += await copyPublicDir(
            join(packageSource, entry.name),
            join(packageTarget, entry.name),
          );
          continue;
        }
        if (!entry.isFile() || !PUBLIC_FILES.has(entry.name)) continue;
        await copyFile(join(packageSource, entry.name), join(packageTarget, entry.name));
        files++;
      }
    }
  }

  return { packages, files, images };
}

async function main() {
  if (!(await exists(SOURCE))) {
    console.error(`[copy-packages] 找不到 packages 目錄: ${SOURCE}`);
    process.exit(1);
  }

  await mkdir(dirname(TARGET), { recursive: true });
  await rm(TARGET, { recursive: true, force: true });
  const result = await copyPublicPackageFiles();
  console.log(
    `[copy-packages] copied ${result.files} public files + ${result.images} images ` +
      `from ${result.packages} packages -> ${TARGET}`,
  );
}

main().catch((err) => {
  console.error("[copy-packages] failed:", err);
  process.exit(1);
});