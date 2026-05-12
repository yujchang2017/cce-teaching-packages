#!/usr/bin/env node
/**
 * 在所有 packages/level-*\/<keyId>/{worksheet.html,ppt.html} 的 <head> 注入：
 *   <meta name="cce-key-id" content="...">
 *   <meta name="cce-page-type" content="worksheet|ppt">
 *   <script src="../../_shared/tracker.js" defer></script>
 *
 * 冪等：偵測到 cce-tracker-injected 標記就跳過。
 */
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PACKAGES = join(ROOT, "packages");

const MARKER = "<!-- cce-tracker-injected -->";

const FILES = [
  { name: "worksheet.html", pageType: "worksheet" },
  { name: "ppt.html", pageType: "ppt" },
];

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function processFile(filePath, keyId, pageType) {
  let html = await readFile(filePath, "utf8");
  if (html.includes(MARKER)) return { status: "skip", reason: "already injected" };
  if (!/<head[^>]*>/i.test(html)) return { status: "skip", reason: "no <head>" };

  const block =
    `\n  ${MARKER}\n` +
    `  <meta name="cce-key-id" content="${keyId}">\n` +
    `  <meta name="cce-page-type" content="${pageType}">\n` +
    `  <script src="/tracker.js" defer></script>\n`;

  html = html.replace(/<head([^>]*)>/i, (m) => m + block);
  await writeFile(filePath, html, "utf8");
  return { status: "injected" };
}

async function main() {
  const levels = (await readdir(PACKAGES, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && d.name.startsWith("level-"))
    .map((d) => d.name);

  let injected = 0, skipped = 0, missing = 0;
  for (const level of levels) {
    const levelDir = join(PACKAGES, level);
    const pkgs = (await readdir(levelDir, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const keyId of pkgs) {
      for (const f of FILES) {
        const fp = join(levelDir, keyId, f.name);
        if (!(await exists(fp))) { missing++; continue; }
        const r = await processFile(fp, keyId, f.pageType);
        if (r.status === "injected") {
          injected++;
          console.log(`[+] ${level}/${keyId}/${f.name}`);
        } else {
          skipped++;
        }
      }
    }
  }
  console.log(`\nDone. injected=${injected} skipped=${skipped} missing=${missing}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
