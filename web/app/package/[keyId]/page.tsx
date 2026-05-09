// 教案詳情頁 — 完全靜態化 (預先產生 136 個 HTML)
// 視覺與舊版 app_sample/app/package/[keyId]/page.tsx 一致
// 唯一差異:
//  1. generateStaticParams 預先產出所有路徑
//  2. 改編家族樹改成「改編列表」(讀 build-time remixes 陣列)

import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { fetchPackageDetail, getAllKeyIds } from "@/lib/github-api";

export const dynamicParams = false; // 靜態匯出:不允許未列出的 keyId

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

  const githubWebUrl = detail.baseUrl
    .replace("raw.githubusercontent.com", "github.com")
    .replace("/main/", "/tree/main/");

  // HTML 版教案/簡報的 GitHub Pages URL（由 worksheetPagesUrl 推導）
  const lessonPlanHtmlUrl = detail.worksheetPagesUrl.replace("worksheet.html", "lesson_plan.html");
  const pptHtmlUrl = detail.worksheetPagesUrl.replace("worksheet.html", "ppt.html");

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
        <a href={detail.worksheetPagesUrl} target="_blank" rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-full bg-sun text-white hover:bg-sunDeep transition text-sm font-semibold shadow-sm">
          🎮 互動學習單（直接玩）
        </a>
        <Link href={`/remix/${keyId}/`}
          className="px-5 py-2.5 rounded-full bg-forest text-white hover:bg-forest/85 transition text-sm font-semibold">
          ✏️ 我要試教／改編這個教案
        </Link>
        <a href={pptHtmlUrl} target="_blank" rel="noopener noreferrer"
          className="px-4 py-2 rounded-full border border-earth/30 text-earth hover:bg-sand/50 transition text-xs">
          📊 檢視 PPT.html
        </a>
      </section>

      {/* LESSON PLAN */}
      <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-6 sm:p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">📘 完整教案</h2>
          <a href={lessonPlanHtmlUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-sun hover:underline">新視窗開啟 ↗</a>
        </div>
        <iframe
          src={lessonPlanHtmlUrl}
          title={`${keyId} 完整教案`}
          className="w-full rounded-xl border border-earth/10"
          style={{ height: "80vh", minHeight: "600px" }}
        />
      </section>

      {/* DATA CARD */}
      {detail.dataCard && (
        <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold text-ink mb-4">📊 數據資料卡</h2>
          {detail.dataCard.last_verified && (
            <p className="text-xs text-mute mb-4">資料驗證日：{detail.dataCard.last_verified}{detail.dataCard.age_band && ` · 年段：${detail.dataCard.age_band} 歲`}</p>
          )}
          {Array.isArray(detail.dataCard.data_points) && detail.dataCard.data_points.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-bold text-earth">核心數據點</h3>
              <div className="grid gap-3">
                {detail.dataCard.data_points.map((dp, i) => (
                  <div key={dp.id ?? i} className="border border-earth/10 rounded-xl p-4 bg-sand/30">
                    <p className="text-sm text-ink font-medium mb-2">{dp.fact_zh ?? "(未填寫)"}</p>
                    {(dp.value || dp.unit || dp.year) && (
                      <p className="text-xs text-mute mb-1.5"><b className="text-earth">{dp.value} {dp.unit}</b>{dp.year && ` · ${dp.year}`}</p>
                    )}
                    {dp.teaching_hook && <p className="text-xs text-ink/70 italic mb-1.5">💡 教學切入：{dp.teaching_hook}</p>}
                    {dp.source_name && (
                      <p className="text-xs text-mute">來源：{dp.source_url ? <a href={dp.source_url} target="_blank" rel="noopener noreferrer" className="text-sun hover:underline">{dp.source_name}</a> : dp.source_name}{dp.reliability && ` · 可信度：${dp.reliability}`}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(detail.dataCard.glossary) && detail.dataCard.glossary.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-earth mb-3">詞彙表</h3>
              <dl className="grid sm:grid-cols-2 gap-3">
                {detail.dataCard.glossary.map((g, i) => (
                  <div key={i} className="border-l-2 border-forest/30 pl-3">
                    <dt className="text-sm font-bold text-ink">{g.term_zh}</dt>
                    <dd className="text-xs text-ink/75 mt-0.5">{g.definition_zh}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {Array.isArray(detail.dataCard.misconceptions) && detail.dataCard.misconceptions.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-earth mb-3">常見迷思</h3>
              <div className="space-y-2">
                {detail.dataCard.misconceptions.map((m, i) => (
                  <div key={i} className="text-xs">
                    <p className="text-ink/70">❌ 迷思：{m.wrong}</p>
                    <p className="text-forest">✅ 正解：{m.correct}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* PPT SCRIPT */}
      {detail.pptScriptMd && (
        <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-6 sm:p-8 mb-6">
          <details className="group">
            <summary className="cursor-pointer select-none text-xl font-bold text-ink flex items-center gap-2">
              🎬 簡報腳本<span className="text-xs text-mute font-normal ml-auto">點擊展開 / 收合</span>
            </summary>
            <article className="prose prose-sm max-w-none mt-4 prose-headings:text-ink prose-p:text-ink/85 prose-li:text-ink/85 prose-strong:text-earth">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{detail.pptScriptMd}</ReactMarkdown>
            </article>
          </details>
        </section>
      )}

      {/* RESOURCES */}
      {detail.resourcesMd && (
        <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold text-ink mb-4">📚 參考資源</h2>
          <article className="prose prose-sm max-w-none prose-headings:text-ink prose-p:text-ink/85 prose-li:text-ink/85 prose-a:text-sun">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{detail.resourcesMd}</ReactMarkdown>
          </article>
        </section>
      )}

      {/* QA REPORT */}
      {detail.qaReportMd && (
        <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-6 sm:p-8 mb-6">
          <details className="group">
            <summary className="cursor-pointer select-none text-xl font-bold text-ink flex items-center gap-2">
              ✅ 品管報告<span className="text-xs text-mute font-normal ml-auto">點擊展開 / 收合</span>
            </summary>
            <article className="prose prose-sm max-w-none mt-4 prose-headings:text-ink prose-p:text-ink/85 prose-li:text-ink/85">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{detail.qaReportMd}</ReactMarkdown>
            </article>
          </details>
        </section>
      )}

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
