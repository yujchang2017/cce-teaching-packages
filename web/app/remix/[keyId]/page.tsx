// 試教／回饋入口頁
// 不再 iframe 整張表單;改成按鈕直接開新分頁,預填「教案編號」。
//
// 環境變數 (build 時注入,public):
//   NEXT_PUBLIC_FORM_URL                   — Google Form viewform URL
//   NEXT_PUBLIC_FORM_ENTRY_KEY_ID          — Q2「教案編號」entry.xxx
//   NEXT_PUBLIC_PROFILE_FORM_URL           — 貢獻者基本資料 Google Form viewform URL (選填)

import Link from "next/link";
import { notFound } from "next/navigation";
import ContributorFormGate from "@/components/ContributorFormGate";
import { fetchAllPackages, getAllKeyIds } from "@/lib/github-api";

export const dynamicParams = false;

function buildFormUrl(opts: {
  formBase: string;
  keyEntry: string;
  keyId: string;
}): string {
  const { formBase, keyEntry, keyId } = opts;
  const sep = formBase.includes("?") ? "&" : "?";
  const params = [
    "usp=pp_url",
    `entry.${keyEntry}=${encodeURIComponent(keyId)}`,
  ].join("&");
  return `${formBase}${sep}${params}`;
}

export async function generateStaticParams() {
  return getAllKeyIds().map((keyId) => ({ keyId }));
}

export default async function RemixPage({
  params,
}: {
  params: Promise<{ keyId: string }>;
}) {
  const { keyId } = await params;
  const all = await fetchAllPackages();
  const pkg = all.find((p) => p.keyId === keyId);
  if (!pkg) notFound();

  const formBase = process.env.NEXT_PUBLIC_FORM_URL ?? "";
  const keyEntry = process.env.NEXT_PUBLIC_FORM_ENTRY_KEY_ID ?? "";
  const profileFormUrl = process.env.NEXT_PUBLIC_PROFILE_FORM_URL ?? "";
  const ready = formBase && keyEntry;

  const feedbackUrl = ready
    ? buildFormUrl({ formBase, keyEntry, keyId })
    : "";

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
      {/* Breadcrumb */}
      <nav className="text-sm text-mute mb-4 flex flex-wrap items-center gap-1.5">
        <Link href="/" className="hover:text-sun transition">首頁</Link>
        <span className="text-earth/40">›</span>
        <Link href={`/package/${keyId}/`} className="hover:text-sun transition">{keyId}</Link>
        <span className="text-earth/40">›</span>
        <span className="text-ink font-medium">試教／回饋</span>
      </nav>

      {/* Hero */}
      <section className="bg-white rounded-2xl shadow-warm border border-earth/10 p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs bg-sand/80 text-earth font-mono font-bold px-2.5 py-1 rounded">{pkg.keyId}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-forest/10 text-forest font-medium">{pkg.levelLabel}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-sun/10 text-sunDeep">主題 {pkg.themeNumber} · {pkg.themeName}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-2">試教／回饋《{pkg.topic}》</h1>
        <p className="text-sm text-ink/75">點選下方入口後,表單會預填教案編號。進入 Google Form 後,請依題目填寫試教紀錄、教學觀察或回饋內容。</p>
        <p className="text-xs text-ink/55 mt-2 flex items-start gap-1.5">
          <span>📌</span>
          <span>照片、學生作品等素材可在表單中各自選擇授權範圍；未明確授權公開的內容只作內部統計與教案改進參考。</span>
        </p>
      </section>

      <ContributorFormGate
        profileFormUrl={profileFormUrl}
        submissions={[
          {
            title: "試教／回饋",
            description: "分享使用教案的試教經驗、教學觀察或回饋意見",
            href: feedbackUrl,
            accent: "forest",
          },
        ]}
      />

      {!ready && (
        <section className="bg-white rounded-2xl border border-earth/10 p-6 mb-8 text-sm text-mute">
          <p className="font-bold text-ink mb-2">⚙️ 表單尚未設定</p>
          <p>
            維護者請在 <code className="bg-sand/50 px-1.5 py-0.5 rounded">.env.local</code> 設定:
            <code className="text-xs ml-1">NEXT_PUBLIC_FORM_URL</code>、
            <code className="text-xs ml-1">NEXT_PUBLIC_FORM_ENTRY_KEY_ID</code>
          </p>
          <p className="mt-2 text-xs">取得方式見 <code>forms/form_checklist_for_helper.md</code> §7</p>
        </section>
      )}

      {/* 徽章 + 流程說明 */}
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <div className="bg-white rounded-2xl shadow-warm border border-earth/10 p-5">
          <h3 className="font-bold text-ink mb-3 flex items-center gap-2">🏆 累積徽章</h3>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-xl">🌱</span>
              <div>
                <b className="text-forest">新芽</b>
                <p className="text-xs text-mute">提交 ≥ 1 件</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xl">🌳</span>
              <div>
                <b className="text-forest">青樹</b>
                <p className="text-xs text-mute">提交 ≥ 3 件</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xl">🏔️</span>
              <div>
                <b className="text-sunDeep">氣候教育師</b>
                <p className="text-xs text-mute">6 大主題各有提交 ≥ 1 件 + 年會頒獎</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl shadow-warm border border-earth/10 p-5">
          <h3 className="font-bold text-ink mb-3 flex items-center gap-2">📅 接下來會發生什麼</h3>
          <ol className="space-y-2 text-sm text-ink/80 list-decimal list-inside">
            <li>第一次提交先建立基本資料</li>
            <li>送出回饋後收到 Google 表單副本</li>
            <li>系統定期彙整試教／回饋件數</li>
            <li>首頁排行榜與徽章統計會隨資料更新</li>
          </ol>
          <div className="mt-4 pt-3 border-t border-earth/10 text-xs text-mute">
            <p>💡 我們以你的 <b>Google Email</b> 作為唯一識別,沒有額外帳號要記。</p>
          </div>
        </div>
      </div>

      {/* 返回 */}
      <div className="pt-6 border-t border-earth/10">
        <Link href={`/package/${keyId}/`} className="text-sm text-earth hover:text-sunDeep">
          ← 返回教案頁
        </Link>
      </div>
    </main>
  );
}
