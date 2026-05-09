// Build-time JSON 讀取器,取代 runtime 打 GitHub raw API。
// 所有資料由 scripts/build-packages-index.mjs 在 build 前產生到 web/data/。
//
// 函式名稱與舊版 github-api.ts 保持相容,所以 app/ 內的 page.tsx 不需要大改。

import type { Level, PackageSummary } from "./types";
import packagesIndex from "@/data/packages.json";

const LEVEL_LABEL: Record<Level, string> = {
  II: "幼兒園低年級",
  III: "國小中高",
  IV: "國中",
  V: "高中",
};

const THEME_EMOJI: Record<number, string> = {
  1: "🌍",
  2: "🌱",
  3: "⚖️",
  4: "🧠",
  5: "♻️",
  6: "🚀",
};

// _index.json 的原始項目格式
type IndexEntry = {
  keyId: string;
  level: Level;
  ageBand: string;
  themeNumber: number;
  themeName: string;
  topic: string;
  mascot?: string;
  publishedAt?: string;
  files?: string[];
};

type IndexFile = {
  generated_at?: string;
  total_packages?: number;
  packages: IndexEntry[];
};

function toSummary(entry: IndexEntry): PackageSummary {
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

const _allPackages: PackageSummary[] = (packagesIndex as IndexFile).packages
  .map(toSummary)
  // 暫時隱藏高中 (V) 階段 — 待教案完善後再開放
  .filter((p) => p.level !== "V");

export function getAllPackages(): PackageSummary[] {
  return _allPackages;
}

// 為保持 app/page.tsx 等檔案的 await 寫法相容,提供 async wrapper
export async function fetchAllPackages(): Promise<PackageSummary[]> {
  return _allPackages;
}

export function getAllKeyIds(): string[] {
  return _allPackages.map((p) => p.keyId);
}

export type DataCard = {
  title?: string;
  age_band?: string;
  last_verified?: string;
  data_points?: Array<{
    id?: string;
    fact_zh?: string;
    value?: string;
    unit?: string;
    year?: string;
    reliability?: string;
    source_name?: string;
    source_url?: string;
    verified_date?: string;
    teaching_hook?: string;
  }>;
  glossary?: Array<{ term_zh?: string; definition_zh?: string }>;
  misconceptions?: Array<{ wrong?: string; correct?: string }>;
};

export type PackageDetail = {
  summary: PackageSummary | null;
  dataCard: DataCard | null;
  lessonPlanMd: string | null;
  pptScriptMd: string | null;
  resourcesMd: string | null;
  qaReportMd: string | null;
  worksheetRawUrl: string;
  worksheetPagesUrl: string;
  baseUrl: string;
  remixes: RemixEntry[];
};

// 改編列表 (Phase 0 取代 FamilyTree)
export type RemixEntry = {
  prNumber: number;
  prUrl: string;
  teacherName: string;
  school?: string;
  date: string;
  title?: string;
};

type DetailJson = {
  summary: PackageSummary;
  dataCard: DataCard | null;
  lessonPlanMd: string | null;
  pptScriptMd: string | null;
  resourcesMd: string | null;
  qaReportMd: string | null;
  worksheetRawUrl: string;
  worksheetPagesUrl: string;
  baseUrl: string;
  remixes?: RemixEntry[];
};

export async function fetchPackageDetail(keyId: string): Promise<PackageDetail> {
  // 動態 import 對應的 detail JSON。Next.js webpack 會在 build 時把所有 detail JSON 一併打包。
  try {
    const data = (await import(`@/data/packages-detail/${keyId}.json`)) as { default: DetailJson };
    const d = data.default;
    return {
      summary: d.summary,
      dataCard: d.dataCard,
      lessonPlanMd: d.lessonPlanMd,
      pptScriptMd: d.pptScriptMd,
      resourcesMd: d.resourcesMd,
      qaReportMd: d.qaReportMd,
      worksheetRawUrl: d.worksheetRawUrl,
      worksheetPagesUrl: d.worksheetPagesUrl,
      baseUrl: d.baseUrl,
      remixes: d.remixes ?? [],
    };
  } catch {
    // 該 keyId 不存在
    const parts = keyId.split("-");
    const levelLc = (parts[parts.length - 1] ?? "").toLowerCase();
    const base = `https://raw.githubusercontent.com/yujchang2017/cce-teaching-packages/main/packages/level-${levelLc}/${keyId}`;
    return {
      summary: null,
      dataCard: null,
      lessonPlanMd: null,
      pptScriptMd: null,
      resourcesMd: null,
      qaReportMd: null,
      worksheetRawUrl: `${base}/worksheet.html`,
      worksheetPagesUrl: `${base}/worksheet.html`,
      baseUrl: base,
      remixes: [],
    };
  }
}
