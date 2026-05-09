#!/usr/bin/env node
/**
 * Google Drive collaboration sync helper.
 *
 * Google Drive is used as a collaboration staging area. The git repository
 * remains the publication source of truth. This script only copies allowlisted
 * package files and rejects internal documents, credentials, and unexpected
 * files before importing anything into packages/.
 *
 * Usage:
 *   node scripts/drive-sync.mjs init [driveRoot]
 *   node scripts/drive-sync.mjs export [driveRoot] [--key=1.1-III] [--overwrite-drafts]
 *   node scripts/drive-sync.mjs verify [driveRoot]
 *   node scripts/drive-sync.mjs import [driveRoot] [--dry-run]
 *
 * Default driveRoot:
 *   ../CCE_Google_Drive_Staging
 */
import { access, copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PACKAGES = join(ROOT, "packages");
const DEFAULT_DRIVE_ROOT = resolve(ROOT, "..", "CCE_Google_Drive_Staging");

const DIRS = {
  templates: "00_templates",
  drafts: "01_drafts",
  review: "02_review",
  ready: "03_ready_to_publish",
  published: "04_published_snapshot",
  assets: "99_assets",
};

const PUBLISH_ALLOWED = new Set([
  "README.md",
  "data_card.json",
  "lesson_plan.md",
  "lesson_plan.html",
  "ppt_script.md",
  "ppt.html",
  "worksheet.html",
  "resources.md",
  "qa_report.md",
]);

const DRAFT_ALLOWED = new Set([
  "README.md",
  "data_card.json",
  "lesson_plan.md",
  "ppt_script.md",
  "resources.md",
]);

const BLOCKED_FILE_RE = /(^|[/\\])(\.env|docs|forms|\.git|node_modules|\.next|out)([/\\]|$)|\.(pem|key|p12|pfx|crt|cer|zip|7z|rar|tgz|tar\.gz)$/i;
const SECRET_CONTENT_RE = /(ghp_|ghs_|glpat-|sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|AKIA[0-9A-Z]{16}|eyJhbGciOiJ)/;

function usage() {
  console.log(`Usage:
  node scripts/drive-sync.mjs init [driveRoot]
  node scripts/drive-sync.mjs export [driveRoot] [--key=1.1-III] [--overwrite-drafts]
  node scripts/drive-sync.mjs verify [driveRoot]
  node scripts/drive-sync.mjs import [driveRoot] [--dry-run]

Default driveRoot: ${DEFAULT_DRIVE_ROOT}`);
}

function parseArgs(argv) {
  const command = argv[2] ?? "help";
  const options = new Map();
  const positional = [];

  for (const arg of argv.slice(3)) {
    if (arg.startsWith("--")) {
      const [key, value = "true"] = arg.slice(2).split("=");
      options.set(key, value);
    } else {
      positional.push(arg);
    }
  }

  return {
    command,
    driveRoot: resolve(positional[0] ?? process.env.CCE_DRIVE_ROOT ?? DEFAULT_DRIVE_ROOT),
    key: options.get("key"),
    dryRun: options.has("dry-run"),
    overwriteDrafts: options.has("overwrite-drafts"),
  };
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(root) {
  const output = [];

  async function walk(current) {
    if (!(await exists(current))) return;
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) await walk(fullPath);
      else if (entry.isFile()) output.push(fullPath);
    }
  }

  await walk(root);
  return output;
}

function normalizeRel(path) {
  return path.split(sep).join("/");
}

function packagePathFromDriveFile(readyRoot, file) {
  const rel = normalizeRel(relative(readyRoot, file));
  const parts = rel.split("/");
  if (parts.length !== 3) return null;

  const [levelDir, keyId, filename] = parts;
  if (!/^level-(ii|iii|iv|v)$/i.test(levelDir)) return null;
  if (!/^[1-6]\.[1-6]-(II|III|IV|V)$/.test(keyId)) return null;
  if (!PUBLISH_ALLOWED.has(filename)) return null;

  return join(PACKAGES, levelDir.toLowerCase(), keyId, filename);
}

async function hashFile(path) {
  const bytes = await readFile(path);
  return createHash("sha256").update(bytes).digest("hex");
}

async function hasSecretContent(file) {
  const ext = file.toLowerCase().split(".").pop();
  if (!["md", "json", "html", "txt"].includes(ext)) return false;
  const content = await readFile(file, "utf8");
  return SECRET_CONTENT_RE.test(content);
}

async function initDriveRoot(driveRoot) {
  for (const dir of Object.values(DIRS)) {
    await mkdir(join(driveRoot, dir), { recursive: true });
  }

  await writeFile(
    join(driveRoot, DIRS.templates, "README.txt"),
    [
      "CCE 教案共作區",
      "",
      "00_templates：說明與模板。",
      "01_drafts：老師共編使用，從目前已發布版本產生。",
      "02_review：完成草稿後放這裡給維護者審查。",
      "03_ready_to_publish：只有通過審查、準備匯入 GitHub 的正式檔案可放這裡。",
      "04_published_snapshot：從 GitHub 匯出的目前正式版本。",
      "99_assets：圖片、補充資料、Google Docs/Slides 匯出檔等。",
      "",
      "03_ready_to_publish 僅允許：",
      "README.md, data_card.json, lesson_plan.md, lesson_plan.html, ppt_script.md, ppt.html, worksheet.html, resources.md, qa_report.md",
      "",
    ].join("\n"),
    "utf8"
  );

  console.log(`[drive-sync] initialized: ${driveRoot}`);
}

async function packageDirs(keyFilter) {
  const levels = await readdir(PACKAGES, { withFileTypes: true });
  const dirs = [];
  for (const level of levels) {
    if (!level.isDirectory() || !level.name.startsWith("level-")) continue;
    const levelPath = join(PACKAGES, level.name);
    const packages = await readdir(levelPath, { withFileTypes: true });
    for (const pkg of packages) {
      if (!pkg.isDirectory()) continue;
      if (keyFilter && pkg.name !== keyFilter) continue;
      dirs.push({ levelDir: level.name, keyId: pkg.name, path: join(levelPath, pkg.name) });
    }
  }
  return dirs.sort((a, b) => a.keyId.localeCompare(b.keyId));
}

async function copyAllowedFiles(sourceDir, targetDir, allowed, { overwrite = true } = {}) {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });
  let copied = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !allowed.has(entry.name)) continue;
    const source = join(sourceDir, entry.name);
    const target = join(targetDir, entry.name);
    if (!overwrite && (await exists(target))) continue;
    await copyFile(source, target);
    copied++;
  }
  return copied;
}

async function exportToDrive(driveRoot, { key, overwriteDrafts }) {
  await initDriveRoot(driveRoot);
  const dirs = await packageDirs(key);
  if (key && dirs.length === 0) throw new Error(`找不到 keyId: ${key}`);

  let publishedFiles = 0;
  let draftFiles = 0;
  for (const pkg of dirs) {
    publishedFiles += await copyAllowedFiles(
      pkg.path,
      join(driveRoot, DIRS.published, pkg.levelDir, pkg.keyId),
      PUBLISH_ALLOWED,
      { overwrite: true }
    );
    draftFiles += await copyAllowedFiles(
      pkg.path,
      join(driveRoot, DIRS.drafts, pkg.levelDir, pkg.keyId),
      DRAFT_ALLOWED,
      { overwrite: overwriteDrafts }
    );
  }

  console.log(`[drive-sync] exported packages: ${dirs.length}`);
  console.log(`[drive-sync] published snapshot files: ${publishedFiles}`);
  console.log(`[drive-sync] draft files ${overwriteDrafts ? "overwritten" : "created if missing"}: ${draftFiles}`);
}

async function verifyReadyFolder(driveRoot) {
  const readyRoot = join(driveRoot, DIRS.ready);
  const files = await listFiles(readyRoot);
  const errors = [];

  for (const file of files) {
    const rel = normalizeRel(relative(driveRoot, file));
    if (BLOCKED_FILE_RE.test(rel)) {
      errors.push(`blocked path: ${rel}`);
      continue;
    }

    const target = packagePathFromDriveFile(readyRoot, file);
    if (!target) {
      errors.push(`not allowlisted for import: ${rel}`);
      continue;
    }

    const info = await stat(file);
    if (info.size > 10 * 1024 * 1024) {
      errors.push(`file too large (>10MB): ${rel}`);
      continue;
    }

    if (await hasSecretContent(file)) {
      errors.push(`possible secret/token content: ${rel}`);
    }
  }

  if (errors.length > 0) {
    console.error("[drive-sync] verification failed:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log(`[drive-sync] verification passed: ${files.length} ready files`);
  return files;
}

async function importFromDrive(driveRoot, { dryRun }) {
  const readyRoot = join(driveRoot, DIRS.ready);
  const files = await verifyReadyFolder(driveRoot);
  let changed = 0;
  let unchanged = 0;

  for (const file of files) {
    const target = packagePathFromDriveFile(readyRoot, file);
    const rel = normalizeRel(relative(ROOT, target));
    const same = (await exists(target)) && (await hashFile(file)) === (await hashFile(target));
    if (same) {
      unchanged++;
      continue;
    }

    changed++;
    console.log(`${dryRun ? "[dry-run] would import" : "[drive-sync] importing"}: ${rel}`);
    if (!dryRun) {
      await mkdir(dirname(target), { recursive: true });
      await copyFile(file, target);
    }
  }

  console.log(`[drive-sync] changed: ${changed}, unchanged: ${unchanged}`);
  if (!dryRun && changed > 0) {
    console.log("[drive-sync] next: git diff, npm run build, git commit, git push");
  }
}

async function main() {
  const args = parseArgs(process.argv);
  switch (args.command) {
    case "init":
      await initDriveRoot(args.driveRoot);
      break;
    case "export":
      await exportToDrive(args.driveRoot, args);
      break;
    case "verify":
      await verifyReadyFolder(args.driveRoot);
      break;
    case "import":
      await importFromDrive(args.driveRoot, args);
      break;
    default:
      usage();
  }
}

main().catch((err) => {
  console.error("[drive-sync] failed:", err.message);
  process.exit(1);
});