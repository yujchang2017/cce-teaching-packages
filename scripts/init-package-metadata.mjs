#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PACKAGES_DIR = join(ROOT, "packages");
const INDEX_PATH = join(PACKAGES_DIR, "_index.json");

const VERSION = "1.0.0";
const VERSION_DATE = "2026-04-17";

function packageDirForKeyId(keyId) {
  const level = keyId.split("-").pop()?.toLowerCase();
  return join(PACKAGES_DIR, `level-${level}`, keyId);
}

function createVersionMetadata(entry) {
  return {
    currentVersion: VERSION,
    recommendedVersion: VERSION,
    status: "initial",
    versions: [
      {
        version: VERSION,
        date: entry.publishedAt || VERSION_DATE,
        label: "初始版",
        editor: "系統產生",
        reviewer: "",
        reviewStatus: "not_reviewed",
        summary: "依 UNESCO 綠色課程指南架構產生初版教案、簡報與互動學習單。",
        files: {
          lessonPlan: "lesson_plan.html",
          ppt: "ppt.html",
          worksheet: "worksheet.html"
        }
      }
    ]
  };
}

function createResourcesMetadata() {
  return {
    resources: []
  };
}

async function main() {
  const raw = await readFile(INDEX_PATH, "utf8");
  const index = JSON.parse(raw.replace(/^\uFEFF/, ""));
  const packages = Array.isArray(index.packages) ? index.packages : [];
  let written = 0;

  for (const entry of packages) {
    const pkgDir = packageDirForKeyId(entry.keyId);
    await mkdir(pkgDir, { recursive: true });
    await writeFile(
      join(pkgDir, "version.json"),
      `${JSON.stringify(createVersionMetadata(entry), null, 2)}\n`,
      "utf8"
    );
    await writeFile(
      join(pkgDir, "resources.json"),
      `${JSON.stringify(createResourcesMetadata(), null, 2)}\n`,
      "utf8"
    );
    written++;
  }

  console.log(`[metadata] wrote version.json/resources.json for ${written} packages`);
}

main().catch((error) => {
  console.error("[metadata] failed:", error);
  process.exit(1);
});