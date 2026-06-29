// 首頁 — 從 build-time JSON 讀取 136 包
// 與舊版 app_sample/app/page.tsx 視覺 100% 一致

import fs from 'fs';
import path from 'path';
import { fetchAllPackages, fetchPackageDetail } from "@/lib/github-api";
import HomeBrowser from "@/components/HomeBrowser";
import DisclaimerModal from "@/components/DisclaimerModal";
import TrackPageView from "@/components/TrackPageView";
import type { PackageSummary } from "@/lib/types";

type PackageRank = { keyId: string; submissions: number; teachers: number; schools: number; theme: number; themeName: string };
type TeacherRank = { name: string; school: string; submissions: number; themes: number[]; badge: string };
type SchoolRank = { school: string; teachers: number; submissions: number; themes: number[]; score?: number };
type Announcement = { title: string; content: string; category: string; author: string; date: string; pinned: boolean };
type StatsData = {
  totalSubmissions: number;
  approvedSubmissions?: number;
  totalStudents: number;
  trialSessions: number;
  teachers: number;
  schools: number;
  kcCoverage: number;
  byTheme: Record<string, number>;
  themeNames: Record<string, string>;
  byPackage: PackageRank[];
  byTeacher: TeacherRank[];
  bySchool: SchoolRank[];
};

const EMPTY_STATS: StatsData = {
  totalSubmissions: 0,
  approvedSubmissions: 0,
  totalStudents: 0,
  trialSessions: 0,
  teachers: 0,
  schools: 0,
  kcCoverage: 0,
  byTheme: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  themeNames: {
    1: '氣候科學',
    2: '生態系與生物多樣性',
    3: '氣候正義',
    4: '韌性建構',
    5: '後碳經濟',
    6: '永續生活型態',
  },
  byPackage: [],
  byTeacher: [],
  bySchool: [],
};

function loadStats(): StatsData {
  try {
    const p = path.join(process.cwd(), 'data', 'stats.json');
    return { ...EMPTY_STATS, ...JSON.parse(fs.readFileSync(p, 'utf8')) };
  } catch {
    return EMPTY_STATS;
  }
}

function loadAnnouncements(): Announcement[] {
  try {
    const p = path.join(process.cwd(), 'data', 'announcements.json');
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return data.announcements || [];
  } catch {
    return [];
  }
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  '更新': { bg: 'bg-forest/10', text: 'text-forest' },
  '公告': { bg: 'bg-sun/20', text: 'text-sunDeep' },
  '活動': { bg: 'bg-earth/10', text: 'text-earth' },
  '維護': { bg: 'bg-ink/10', text: 'text-ink/70' },
};

function medal(index: number) {
  return ["🥇", "🥈", "🥉"][index] ?? "•";
}

function packageTitle(packages: PackageSummary[], keyId: string) {
  return packages.find((pkg) => pkg.keyId === keyId)?.topic ?? keyId;
}

export default async function Home() {
  const basePackages = await fetchAllPackages();
  const allPackages = await Promise.all(
    basePackages.map(async (pkg) => {
      const detail = await fetchPackageDetail(pkg.keyId);
      return { ...pkg, currentVersion: detail.version.currentVersion };
    })
  );
  const stats = loadStats();
  const announcements = loadAnnouncements();
  const themeRows = Object.entries(stats.byTheme ?? {})
    .map(([theme, count]) => ({ theme, count, name: stats.themeNames?.[theme] ?? `主題 ${theme}` }))
    .sort((a, b) => Number(a.theme) - Number(b.theme));
  const maxThemeCount = Math.max(1, ...themeRows.map((row) => row.count));

  return (
    <>
      <DisclaimerModal />
      <TrackPageView event="view_home" />
      {/* HERO BANNER */}
      <section
        className="border-b border-earth/10 relative"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(232,136,79,0.15), transparent 60%), radial-gradient(ellipse at top right, rgba(60,110,71,0.10), transparent 60%), linear-gradient(135deg, #FFF7E5 0%, #FAF5E9 50%, #FFEDD8 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative">
          <div className="absolute top-6 right-6 text-5xl opacity-40 select-none hidden md:block">🌡️</div>
          <div className="absolute bottom-6 right-24 text-4xl opacity-40 select-none hidden md:block">🌏</div>
          <div className="absolute top-14 right-44 text-3xl opacity-40 select-none hidden lg:block">🌱</div>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 text-xs text-forest bg-forest/10 px-3 py-1 rounded-full mb-4">
              <span>📚</span> 開源教案社群 · CC BY-SA 4.0
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-tight mb-3">
              氣候變遷<span className="text-sun">教育教案庫</span>
            </h1>
            <p className="text-base sm:text-lg text-ink/80 leading-relaxed max-w-2xl">
              <b className="text-earth">{allPackages.length}</b> 個教學組合包 · <b className="text-earth">4</b> 個年段 · <b className="text-earth">6</b> 大主題
              <br className="hidden sm:inline" />
              <span className="text-mute">
                依據 UNESCO <a href="https://cce.tw/" target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">《綠色課程指南：氣候行動的教學與學習》</a>開發；老師改編共創的開源社群。
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { icon: "🎒", n: allPackages.length, label: "教學組合包", border: "border-sun" },
            { icon: "👩‍🏫", n: stats.teachers, label: "位回饋教師", border: "border-forest" },
            { icon: "📋", n: stats.totalSubmissions ?? 0, label: "試教／回饋件數", sublabel: `${stats.kcCoverage ?? 0}/6 主題有資料`, border: "border-earth" },
            { icon: "🏫", n: stats.schools, label: "所參與學校", border: "border-sunDeep" },
            { icon: "🧑‍🎓", n: stats.totalStudents ?? 0, label: "試教學生人次", sublabel: stats.trialSessions ? `${stats.trialSessions} 次試教` : undefined, border: "border-forest" },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-xl p-4 sm:p-5 shadow-warm border-t-4 ${s.border} text-center`}>
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="text-3xl sm:text-4xl font-bold text-ink">{s.n}</div>
              <div className="text-xs sm:text-sm text-mute mt-1">{s.label}</div>
              {'sublabel' in s && s.sublabel && <div className="text-[11px] text-mute/80 mt-0.5">{s.sublabel}</div>}
            </div>
          ))}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        {/* ANNOUNCEMENTS */}
        {announcements.length > 0 && (
          <section className="mb-8">
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">📢 最新消息</h2>
              <span className="text-sm text-mute">維護進度與更動說明</span>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 5).map((a, i) => {
                const style = CATEGORY_STYLES[a.category] ?? CATEGORY_STYLES['公告'];
                return (
                  <article key={`${a.date}-${i}`} className="bg-white rounded-xl shadow-warm border border-earth/10 p-4 flex items-start gap-3">
                    {a.pinned && <span className="text-lg shrink-0 mt-0.5">📌</span>}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>{a.category || '公告'}</span>
                        <h3 className="font-bold text-ink text-sm sm:text-base">{a.title}</h3>
                      </div>
                      {a.content && <p className="text-sm text-ink/70 leading-relaxed whitespace-pre-line">{a.content}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-mute">
                        {a.date && <span>{a.date}</span>}
                        {a.author && <span>— {a.author}</span>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* TRIAL FEEDBACK DASHBOARD */}
        <section className="mb-8 grid lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl shadow-warm border border-earth/10 p-5 lg:col-span-2">
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">📋 教案試教／回饋排行榜</h2>
              <span className="text-sm text-mute">依上傳件數排序</span>
            </div>
            {stats.byPackage.length > 0 ? (
              <div className="space-y-3">
                {stats.byPackage.slice(0, 6).map((pkg, index) => (
                  <article key={pkg.keyId} className="flex items-center gap-3 rounded-xl border border-earth/10 p-3">
                    <div className="w-8 text-center text-xl">{medal(index)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-sand/80 text-earth font-mono font-bold px-2 py-0.5 rounded">{pkg.keyId}</span>
                        <h3 className="font-bold text-ink text-sm sm:text-base truncate">{packageTitle(allPackages, pkg.keyId)}</h3>
                      </div>
                      <p className="text-xs text-mute mt-1">主題 {pkg.theme} · {pkg.themeName} · {pkg.teachers} 位教師 · {pkg.schools} 所學校</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-earth">{pkg.submissions}</div>
                      <div className="text-[11px] text-mute">件</div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-earth/30 p-6 text-center text-mute text-sm">
                等待第一筆試教／回饋上傳
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-warm border border-earth/10 p-5">
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">🌐 主題分布</h2>
              <span className="text-sm text-mute">6 大主題</span>
            </div>
            <div className="space-y-3">
              {themeRows.map((row) => (
                <div key={row.theme}>
                  <div className="flex items-center justify-between gap-2 text-xs mb-1">
                    <span className="text-ink truncate">{row.theme}. {row.name}</span>
                    <span className="text-earth font-bold">{row.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-sand overflow-hidden">
                    <div className="h-full rounded-full bg-forest" style={{ width: `${Math.max(4, (row.count / maxThemeCount) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8 grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-warm border border-earth/10 p-5">
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">🏅 教師回饋徽章</h2>
              <span className="text-sm text-mute">件數、主題與徽章</span>
            </div>
            {stats.byTeacher.length > 0 ? (
              <div className="space-y-2.5">
                {stats.byTeacher.slice(0, 6).map((teacher, index) => (
                  <article key={`${teacher.name}-${teacher.school}`} className="flex items-center gap-3 rounded-xl border border-earth/10 p-3">
                    <div className="w-8 text-center text-xl">{medal(index)}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-ink text-sm truncate">{teacher.name}</h3>
                      <p className="text-xs text-mute truncate">{teacher.school} · 涵蓋 {teacher.themes.length} 個主題</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-forest">{teacher.badge}</div>
                      <div className="text-xs text-mute">{teacher.submissions} 件</div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-earth/30 p-6 text-center text-mute text-sm">
                還沒有教師回饋資料
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-warm border border-earth/10 p-5">
            <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">🏫 學校上傳件數排行</h2>
              <span className="text-sm text-mute">依件數與主題覆蓋排序</span>
            </div>
            {stats.bySchool.length > 0 ? (
              <div className="space-y-2.5">
                {stats.bySchool.slice(0, 6).map((school, index) => (
                  <article key={school.school} className="flex items-center gap-3 rounded-xl border border-earth/10 p-3">
                    <div className="w-8 text-center text-xl">{medal(index)}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-ink text-sm truncate">{school.school}</h3>
                      <p className="text-xs text-mute">{school.teachers} 位教師 · 涵蓋 {school.themes.length} 個主題</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-earth">{school.submissions}</div>
                      <div className="text-[11px] text-mute">件</div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-earth/30 p-6 text-center text-mute text-sm">
                還沒有學校上傳資料
              </div>
            )}
          </div>
        </section>

        <HomeBrowser packages={allPackages} />

        {/* TOP SCHOOLS */}
        <section className="mb-8">
          <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">🏫 活躍試教學校</h2>
            <span className="text-sm text-mute">依上傳件數與主題覆蓋數排名</span>
          </div>
          {stats.bySchool && stats.bySchool.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.bySchool.slice(0, 4).map((s, i: number) => (
                <article
                  key={s.school}
                  className="rounded-2xl p-5 shadow-warm border border-earth/10 transition hover:-translate-y-1.5 hover:shadow-warm-lg cursor-default"
                  style={{ background: "linear-gradient(135deg, #FFF7E5 0%, #FFE8CC 100%)" }}
                >
                  <div className="text-4xl mb-3">{["🥇","🥈","🥉","🏫"][i] ?? "🏫"}</div>
                  <h3 className="font-bold text-ink text-base mb-1">{s.school}</h3>
                  <p className="text-xs text-mute mb-3">已涵蓋 {s.themes.length} 個主題</p>
                  <div className="flex items-center justify-between text-xs text-earth pt-3 border-t border-earth/15">
                    <span>👩‍🏫 {s.teachers} 位老師</span>
                    <span>📋 {s.submissions} 件</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-earth/30 p-8 text-center text-mute text-sm">
              等待第一筆試教／回饋上傳 🌱
            </div>
          )}
        </section>
      </main>
    </>
  );
}
