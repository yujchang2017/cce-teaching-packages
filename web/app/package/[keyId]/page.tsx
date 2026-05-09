// 教案詳情頁 — 完全靜態化 (預先產生 136 個 HTML)
// 視覺與舊版 app_sample/app/package/[keyId]/page.tsx 一致
// 唯一差異:
//  1. generateStaticParams 預先產出所有路徑
//  2. 改編家族樹改成「改編列表」(讀 build-time remixes 陣列)

import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchPackageDetail, getAllKeyIds } from "@/lib/github-api";

export const dynamicParams = false; // 靜態匯出:不允許未列出的 keyId

const packageAssetVersion = process.env.GITHUB_SHA?.slice(0, 12) ?? String(Date.now());

function versionedUrl(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}v=${packageAssetVersion}`;
}

export async function generateStaticParams() {
  return getAllKeyIds().map((keyId) => ({ keyId }));
}

export default async function PackageDetail({
  params,
}: {
  params: Promise<{ keyId: string }>;
}) {
  const { keyId } = await params;
  const detail = await fetchPackageDetail(keyId);
  const summary = detail.summary;

  if (!summary) {
    notFound();
  }

  // HTML 版教案/簡報的 GitHub Pages URL（由 worksheetPagesUrl 推導）
  const lessonPlanHtmlUrl = detail.worksheetPagesUrl.replace("worksheet.html", "lesson_plan.html");
  const pptHtmlUrl = detail.worksheetPagesUrl.replace("worksheet.html", "ppt.html");
  const worksheetPagesUrl = versionedUrl(detail.worksheetPagesUrl);
  const lessonPlanHtmlViewUrl = versionedUrl(lessonPlanHtmlUrl);
  const pptHtmlViewUrl = versionedUrl(pptHtmlUrl);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
      {/* Breadcrumb */}
      <nav className="text-sm text-mute mb-6 flex flex-wrap items-center gap-1.5">
        <Link href="/" className="hover:text-sun transition">首頁</Link>
        <span className="text-earth/40">›</span>
        <span className="text-ink font-medium">
          {keyId} {summary.topic}
        </span>
      </nav>

      {/* HERO */}
      <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-8 sm:p-10 mb-6">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs bg-sand/80 text-earth font-mono font-bold px-2.5 py-1 rounded">{summary.keyId}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-forest/10 text-forest font-medium">{summary.levelLabel}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-sun/10 text-sunDeep">主題 {summary.themeNumber} · {summary.themeName}</span>
          {summary.ageBand && <span className="text-xs text-mute">年段 {summary.ageBand} 歲</span>}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-3">{summary.topic}</h1>
        {summary.mascot && <p className="text-base text-ink/80 mb-2">🎭 吉祥物角色：<b>{summary.mascot}</b></p>}
        {summary.publishedAt && <p className="text-xs text-mute">發布日期：{summary.publishedAt}</p>}
      </section>

      {/* CTA BAR */}
      <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-5 sm:p-6 mb-6 flex items-center gap-3 flex-wrap">
        <a href={worksheetPagesUrl} target="_blank" rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-full bg-sun text-white hover:bg-sunDeep transition text-sm font-semibold shadow-sm">
          1. 動態學習單（worksheet.html）
        </a>
        <a href={pptHtmlViewUrl} target="_blank" rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-full bg-sky-100 border border-sky-200 text-sky-700 hover:bg-sky-200 transition text-sm font-semibold">
          2. PPT.html
        </a>
        <Link href={`/remix/${keyId}/`}
          className="px-5 py-2.5 rounded-full bg-forest text-white hover:bg-forest/85 transition text-sm font-semibold">
          3. 試教／修改表單
        </Link>
      </section>

      {/* LESSON PLAN */}
      <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-6 sm:p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">📘 完整教案</h2>
          <a href={lessonPlanHtmlViewUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-sun hover:underline">新視窗開啟 ↗</a>
        </div>
        <iframe
          src={lessonPlanHtmlViewUrl}
          title={`${keyId} 完整教案`}
          className="w-full rounded-xl border border-earth/10"
          style={{ height: "80vh", minHeight: "600px" }}
        />
      </section>

      {/* 改編列表 (取代 Phase 0 的 FamilyTree;Phase 1 再升級成 SVG 樹) */}
      <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-6 sm:p-8 mb-6">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          🌳 改編紀錄 <span className="text-sm font-normal text-mute">({detail.remixes.length})</span>
        </h2>
        {detail.remixes.length === 0 ? (
          <div className="bg-sun/10 border border-sun/30 rounded-xl p-5 text-sm text-ink/85">
            本教案暫無改編版本，快來當<b>第一位改編者</b>！
            <Link href={`/remix/${keyId}/`} className="ml-3 underline text-sun hover:text-sunDeep">立即改編 →</Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {detail.remixes.map((r) => (
              <li key={r.prNumber} className="border-l-2 border-forest/40 pl-3 py-1">
                <a href={r.prUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-ink hover:text-forest">
                  <b>{r.teacherName}</b>
                  {r.school && <span className="text-mute"> · {r.school}</span>}
                  <span className="text-xs text-mute ml-2">{r.date}</span>
                </a>
                {r.title && <p className="text-xs text-ink/70 mt-0.5">{r.title}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* NAV */}
      <div className="flex items-center justify-between gap-3 flex-wrap mt-8 pt-6 border-t border-earth/10">
        <Link href="/" className="px-5 py-2.5 rounded-full border border-earth/30 text-earth hover:bg-earth hover:text-white transition text-sm font-medium">
          ← 回首頁看其他教案
        </Link>
        <span className="text-xs text-mute">{summary.keyId} · {summary.themeName}</span>
      </div>
    </main>
  );
}
