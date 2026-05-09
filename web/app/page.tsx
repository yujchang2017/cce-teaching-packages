// 首頁 — 從 build-time JSON 讀取 136 包
// 與舊版 app_sample/app/page.tsx 視覺 100% 一致

import { wsaSchools } from "@/lib/mock-data";
import { fetchAllPackages } from "@/lib/github-api";
import HomeBrowser from "@/components/HomeBrowser";

export default async function Home() {
  const allPackages = await fetchAllPackages();

  return (
    <>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: "🎒", n: allPackages.length, label: "教學組合包", border: "border-sun" },
            { icon: "👩‍🏫", n: 0, label: "位貢獻老師（等首位）", border: "border-forest" },
            { icon: "🔀", n: 0, label: "次改編（等首位）", border: "border-earth" },
            { icon: "🏫", n: 4, label: "所 WSA 實踐校", border: "border-sunDeep" },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-xl p-4 sm:p-5 shadow-warm border-t-4 ${s.border} text-center`}>
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="text-3xl sm:text-4xl font-bold text-ink">{s.n}</div>
              <div className="text-xs sm:text-sm text-mute mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <HomeBrowser packages={allPackages} />

        {/* WSA SCHOOLS */}
        <section className="mb-8">
          <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">🏫 WSA 氣候整備學校</h2>
            <span className="text-sm text-mute">Whole School Approach · 全校推動示範校</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {wsaSchools.map((s) => (
              <article
                key={s.name}
                className="rounded-2xl p-5 shadow-warm border border-earth/10 transition hover:-translate-y-1.5 hover:shadow-warm-lg cursor-default"
                style={{ background: "linear-gradient(135deg, #FFF7E5 0%, #FFE8CC 100%)" }}
              >
                <div className="text-4xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-ink text-base mb-1">{s.name}</h3>
                <p className="text-xs text-mute mb-3">{s.focus}</p>
                <div className="flex items-center justify-between text-xs text-earth pt-3 border-t border-earth/15">
                  <span>👩‍🏫 {s.teachers} 位老師</span>
                  <span>🔀 {s.remixes} 次改編</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
