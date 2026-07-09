#!/usr/bin/env node
/**
 * Build-time data fetcher for community.cce.tw Lite
 *
 * 統一 repo 模式（預設）:
 *   直接讀本地 packages/ 目錄，速度更快且完全離線。
 *
 * 遠端 repo 模式（fallback / PACKAGES_REPO 指定時）:
 *   從 GitHub raw URL 抓取（向下相容原本的 cce-tw-lite 用法）。
 *
 * 產出:
 *   1. packages/_index.json  → web/data/packages.json
 *   2. 每個 keyId 的 detail  → web/data/packages-detail/{keyId}.json
 *
 * Usage:
 *   node scripts/build-packages-index.mjs              # 自動偵測（本地優先）
 *   node scripts/build-packages-index.mjs --remote     # 強制使用遠端 HTTP
 *   node scripts/build-packages-index.mjs --offline    # 跳過 build（web/data 已存在）
 */

import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WEB_DATA = join(ROOT, "web", "data");
const DETAIL_DIR = join(WEB_DATA, "packages-detail");
const LOCAL_PACKAGES = join(ROOT, "packages");

const REPO = process.env.PACKAGES_REPO ?? "yujchang2017/cce-teaching-packages";
const BRANCH = process.env.PACKAGES_BRANCH ?? "main";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const CUSTOM_DOMAIN = process.env.CUSTOM_DOMAIN?.trim();
const PAGES_BASE = CUSTOM_DOMAIN
  ? `https://${CUSTOM_DOMAIN}`
  : `https://${REPO.split("/")[0]}.github.io/${REPO.split("/")[1]}`;
const INDEX_URL = `${RAW_BASE}/packages/_index.json`;

const isOffline = process.argv.includes("--offline");
const forceRemote = process.argv.includes("--remote");

/** 自動偵測：packages/ 目錄存在且有 _index.json → 使用本地模式 */
async function detectLocalMode() {
  if (forceRemote) return false;
  try {
    await access(join(LOCAL_PACKAGES, "_index.json"));
    return true;
  } catch {
    return false;
  }
}

/** 簡易 fetch with retry + timeout */
async function fetchWithRetry(url, { retries = 2, timeoutMs = 15000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) return res;
      if (res.status === 404) return res; // 404 不重試
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

async function fetchText(path) {
  try {
    const res = await fetchWithRetry(`${RAW_BASE}/${path}`);
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

async function fetchJson(path) {
  try {
    const res = await fetchWithRetry(`${RAW_BASE}/${path}`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

const LEVEL_LABEL = { II: "幼兒園低年級", III: "國小中高", IV: "國中", V: "高中" };
const THEME_EMOJI = { 1: "🌍", 2: "🌱", 3: "⚖️", 4: "🧠", 5: "♻️", 6: "🚀" };

function toSummary(entry) {
  return {
    keyId: entry.keyId,
    level: entry.level,
    levelLabel: LEVEL_LABEL[entry.level] ?? entry.level,
    topic: entry.topic,
    themeNumber: entry.themeNumber,
    themeName: entry.themeName,
    summary: entry.mascot
      ? `吉祥物：${entry.mascot} · 年段 ${entry.ageBand}`
      : `年段 ${entry.ageBand} · 主題 ${entry.themeNumber} ${entry.themeName}`,
    stars: 0,
    forks: 0,
    contributors: 0,
    emojis: THEME_EMOJI[entry.themeNumber] ?? "📘",
    isOfficial: true,
    hasDetail: true,
    mascot: entry.mascot,
    ageBand: entry.ageBand,
    publishedAt: entry.publishedAt,
    files: entry.files,
  };
}

function fallbackVersionMetadata(entry) {
  return {
    currentVersion: "1.0.0",
    recommendedVersion: "1.0.0",
    status: "initial",
    versions: [
      {
        version: "1.0.0",
        date: entry.publishedAt ?? "2026-04-17",
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

function fallbackResourcesMetadata() {
  return { resources: [] };
}

// ---- 模式一：改編紀錄 ----
// 資料來源 packages/remixes.json（追蹤檔，維護者用 scripts/add-remix-record.mjs 收錄）。
// 每筆含 keyId + 顯示欄位；build 時依 keyId 掛到「原教案頁」的 remixes（前端已會渲染）。
let REMIX_INDEX = new Map(); // keyId -> remix[]（已去除 keyId）

async function loadRemixIndex(useLocal) {
  let arr = null;
  if (useLocal) {
    try {
      const raw = await readFile(join(LOCAL_PACKAGES, "remixes.json"), "utf8");
      arr = JSON.parse(raw.replace(/^﻿/, ""));
    } catch {
      arr = null; // 檔案不存在或空 → 視為沒有改編紀錄
    }
  } else {
    arr = await fetchJson("packages/remixes.json");
  }
  const map = new Map();
  if (Array.isArray(arr)) {
    for (const r of arr) {
      if (!r || !r.keyId) continue;
      const { keyId, ...rest } = r;
      if (!map.has(keyId)) map.set(keyId, []);
      map.get(keyId).push(rest);
    }
  }
  REMIX_INDEX = map;
  console.log(`[build] 改編紀錄：載入 ${Array.isArray(arr) ? arr.length : 0} 筆，涵蓋 ${map.size} 個教案`);
}

function remixesFor(keyId) {
  return REMIX_INDEX.get(keyId) ?? [];
}

/** 本地模式：從 packages/ 資料夾讀取一個教案的 detail */
async function buildOneDetailLocal(entry) {
  const keyId = entry.keyId;
  const parts = keyId.split("-");
  const levelLc = (parts[parts.length - 1] ?? "").toLowerCase();
  const pkgDir = join(LOCAL_PACKAGES, `level-${levelLc}`, keyId);
  const pagesBase = `${PAGES_BASE}/packages/level-${levelLc}/${keyId}`;
  const rawBase = `${RAW_BASE}/packages/level-${levelLc}/${keyId}`;

  async function readLocalJson(filename) {
    try { return JSON.parse(await readFile(join(pkgDir, filename), "utf8")); } catch { return null; }
  }

  const dataCard = await readLocalJson("data_card.json");
  const version = await readLocalJson("version.json") ?? fallbackVersionMetadata(entry);
  const resources = await readLocalJson("resources.json") ?? fallbackResourcesMetadata();

  return {
    summary: toSummary(entry),
    dataCard,
    version,
    resources,
    worksheetRawUrl: `${rawBase}/worksheet.html`,
    worksheetPagesUrl: `${pagesBase}/worksheet.html`,
    baseUrl: rawBase,
    remixes: remixesFor(keyId),
  };
}

/** 遠端模式：從 GitHub raw URL 讀取一個教案的 detail */
async function buildOneDetail(entry) {
  const keyId = entry.keyId;
  const parts = keyId.split("-");
  const levelLc = (parts[parts.length - 1] ?? "").toLowerCase();
  const dir = `packages/level-${levelLc}/${keyId}`;
  const base = `${RAW_BASE}/${dir}`;
  const pagesBase = `${PAGES_BASE}/${dir}`;

  const dataCard = await fetchJson(`${dir}/data_card.json`);
  const version = await fetchJson(`${dir}/version.json`) ?? fallbackVersionMetadata(entry);
  const resources = await fetchJson(`${dir}/resources.json`) ?? fallbackResourcesMetadata();

  return {
    summary: toSummary(entry),
    dataCard,
    version,
    resources,
    worksheetRawUrl: `${base}/worksheet.html`,
    worksheetPagesUrl: `${pagesBase}/worksheet.html`,
    baseUrl: base,
    remixes: remixesFor(keyId),
  };
}

async function main() {
  await mkdir(WEB_DATA, { recursive: true });
  await mkdir(DETAIL_DIR, { recursive: true });

  if (isOffline) {
    const indexPath = join(WEB_DATA, "packages.json");
    if (!(await fileExists(indexPath))) {
      console.error("[build] --offline 模式但 packages.json 不存在,中止");
      process.exit(1);
    }
    console.log("[build] --offline 模式,跳過下載");
    return;
  }

  const useLocal = await detectLocalMode();

  let indexJson;
  if (useLocal) {
    console.log(`[build] 本地模式：讀取 ${LOCAL_PACKAGES}/_index.json`);
    try {
      const raw = await readFile(join(LOCAL_PACKAGES, "_index.json"), "utf8");
      // 移除可能的 BOM
      indexJson = JSON.parse(raw.replace(/^\uFEFF/, ""));
    } catch (err) {
      console.error("[build] 讀取本地 _index.json 失敗:", err.message);
      process.exit(1);
    }
  } else {
    console.log(`[build] 遠端模式：抓取 ${INDEX_URL}`);
    try {
      const res = await fetchWithRetry(INDEX_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      indexJson = await res.json();
    } catch (err) {
      console.error(`[build] 抓 _index.json 失敗:`, err.message);
      await writeFile(
        join(WEB_DATA, "packages.json"),
        JSON.stringify({ generated_at: new Date().toISOString(), total_packages: 0, packages: [], _error: String(err) }, null, 2)
      );
      process.exit(1);
    }
  }

  const packages = Array.isArray(indexJson.packages) ? indexJson.packages : [];
  console.log(`[build] 取得 ${packages.length} 個教案，${useLocal ? "本地" : "遠端"}讀取 detail...`);

  // 寫入主 index
  await writeFile(join(WEB_DATA, "packages.json"), JSON.stringify(indexJson, null, 2));

  // 載入改編紀錄（模式一），供各教案 detail 掛上
  await loadRemixIndex(useLocal);

  // 並行 detail（限制並發）
  const CONCURRENCY = useLocal ? 20 : 6;
  let done = 0;
  let failed = 0;
  const queue = [...packages];

  async function worker() {
    while (queue.length) {
      const entry = queue.shift();
      if (!entry) break;
      try {
        const detail = useLocal
          ? await buildOneDetailLocal(entry)
          : await buildOneDetail(entry);
        await writeFile(
          join(DETAIL_DIR, `${entry.keyId}.json`),
          JSON.stringify(detail, null, 2)
        );
        done++;
        if (done % 20 === 0) console.log(`[build] ...完成 ${done}/${packages.length}`);
      } catch (err) {
        failed++;
        console.error(`[build] ✗ ${entry.keyId}: ${err.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`[build] 完成: ${done} 成功, ${failed} 失敗 / 共 ${packages.length}`);

  if (failed > packages.length / 4) {
    console.error("[build] 失敗超過 25%,視為 build 失敗");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[build] 未預期錯誤:", err);
  process.exit(1);
});
