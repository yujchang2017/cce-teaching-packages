// 教案詳情頁 — 完全靜態化 (預先產生 136 個 HTML)
// 視覺與舊版 app_sample/app/package/[keyId]/page.tsx 一致
// 唯一差異:
//  1. generateStaticParams 預先產出所有路徑
//  2. 改編家族樹改成「改編列表」(讀 build-time remixes 陣列)

import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchPackageDetail, getAllKeyIds } from "@/lib/github-api";
import TrackPageView from "@/components/TrackPageView";
import TrackLink from "@/components/TrackLink";
import Giscus from "@/components/Giscus";

export const dynamicParams = false; // 靜態匯出:不允許未列出的 keyId

const packageAssetVersion = process.env.GITHUB_SHA?.slice(0, 12) ?? String(Date.now());

function versionedUrl(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}v=${packageAssetVersion}`;
}

const REVIEW_STATUS_LABEL: Record<string, string> = {
  not_reviewed: "尚未審查",
  reviewing: "審查中",
  approved: "已審查",
  needs_revision: "待修訂",
};

const RESOURCE_TYPE_LABEL: Record<string, string> = {
  article: "文章",
  video: "影片",
  dataset: "資料集",
  tool: "工具",
  other: "其他",
};

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
  const currentVersion = detail.version.currentVersion;
  const recommendedVersion = detail.version.recommendedVersion;
  const resources = detail.resources.resources ?? [];

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
      <TrackPageView event="view_package" resource={keyId} meta={{ theme: summary.themeNumber, level: summary.levelLabel }} />
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
          <span className="text-xs px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 font-medium">v{currentVersion}</span>
          {recommendedVersion && recommendedVersion !== currentVersion && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-forest/10 text-forest">推薦 v{recommendedVersion}</span>
          )}
          {summary.ageBand && <span className="text-xs text-mute">年段 {summary.ageBand} 歲</span>}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-3">{summary.topic}</h1>
        {summary.mascot && <p className="text-base text-ink/80 mb-2">🎭 吉祥物角色：<b>{summary.mascot}</b></p>}
        {summary.publishedAt && <p className="text-xs text-mute">發布日期：{summary.publishedAt}</p>}
      </section>

      {/* CTA BAR */}
      <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-5 sm:p-6 mb-6 flex items-center gap-3 flex-wrap">
        <TrackLink href={worksheetPagesUrl} target="_blank" rel="noopener noreferrer"
          event="open_worksheet" resource={keyId}
          className="px-5 py-2.5 rounded-full bg-sun text-white hover:bg-sunDeep transition text-sm font-semibold shadow-sm">
          1. 動態學習單（worksheet.html）
        </TrackLink>
        <TrackLink href={pptHtmlViewUrl} target="_blank" rel="noopener noreferrer"
          event="open_ppt" resource={keyId}
          className="px-5 py-2.5 rounded-full bg-sky-100 border border-sky-200 text-sky-700 hover:bg-sky-200 transition text-sm font-semibold">
          2. PPT.html
        </TrackLink>
        <Link href={`/remix/${keyId}/`}
          className="px-5 py-2.5 rounded-full bg-forest text-white hover:bg-forest/85 transition text-sm font-semibold">
          3. 試教／回饋表單
        </Link>
      </section>

      {/* VERSION HISTORY */}
      <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-6 sm:p-8 mb-6">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">版本紀錄</h2>
          <span className="text-xs rounded-full bg-sand/80 text-earth px-3 py-1 font-medium">
            目前版 v{currentVersion}
          </span>
        </div>
        <ul className="space-y-3">
          {detail.version.versions.map((item) => (
            <li key={`${item.version}-${item.date ?? ""}`} className="border-l-2 border-sun/60 pl-4 py-1">
              <div className="flex items-center gap-2 flex-wrap">
                <b className="text-sm text-ink">v{item.version}</b>
                {item.label && <span className="text-xs text-earth bg-sand/60 rounded-full px-2 py-0.5">{item.label}</span>}
                {item.reviewStatus && <span className="text-xs text-mute">{REVIEW_STATUS_LABEL[item.reviewStatus] ?? item.reviewStatus}</span>}
                {item.date && <span className="text-xs text-mute">{item.date}</span>}
              </div>
              {item.summary && <p className="text-sm text-ink/75 mt-1">{item.summary}</p>}
              {(item.editor || item.reviewer) && (
                <p className="text-xs text-mute mt-1">
                  {item.editor && <>編修：{item.editor}</>}
                  {item.editor && item.reviewer && <span> · </span>}
                  {item.reviewer && <>審查：{item.reviewer}</>}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* RESOURCES */}
      <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-6 sm:p-8 mb-6">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          延伸資源 <span className="text-sm font-normal text-mute">({resources.length})</span>
        </h2>
        {resources.length === 0 ? (
          <div className="bg-sand/50 border border-earth/10 rounded-xl p-5 text-sm text-ink/75">
            尚未加入延伸資源；短期先保留欄位，後續可由維護者手動新增文章、影片、資料集或工具連結。
          </div>
        ) : (
          <ul className="space-y-3">
            {resources.map((resource) => (
              <li key={resource.url} className="border border-earth/10 rounded-xl p-4">
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-forest hover:underline">
                  {resource.title}
                </a>
                <p className="text-xs text-mute mt-1">
                  {resource.type && <span>{RESOURCE_TYPE_LABEL[resource.type] ?? resource.type}</span>}
                  {resource.type && resource.provider && <span> · </span>}
                  {resource.provider && <span>{resource.provider}</span>}
                </p>
                {resource.note && <p className="text-sm text-ink/75 mt-2">{resource.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* LESSON PLAN */}
      <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-6 sm:p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">📘 參考教案</h2>
          <a href={lessonPlanHtmlViewUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-sun hover:underline">新視窗開啟 ↗</a>
        </div>
        <iframe
          src={lessonPlanHtmlViewUrl}
          title={`${keyId} 參考教案`}
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
            本教案暫無改編版本；目前先收集試教與回饋資料。
            <Link href={`/remix/${keyId}/`} className="ml-3 underline text-sun hover:text-sunDeep">填寫回饋 →</Link>
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

      {/* DISCUSSIONS */}
      <section className="mt-8 pt-6 border-t border-earth/10">
        <h2 className="text-xl font-bold text-ink flex items-center gap-2 mb-4">💬 討論與回饋</h2>
        <p className="text-sm text-mute mb-4">使用 GitHub 帳號登入即可留言、按讚或提出建議。</p>
        <Giscus term={summary.keyId} />
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
