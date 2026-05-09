import type { TeachingPackage } from '@/lib/types';

export default function Hero({ pkg }: { pkg: TeachingPackage }) {
  return (
    <section className="grid lg:grid-cols-[1fr_380px] gap-8 mb-10">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-forest bg-forest/10 px-3 py-1 rounded-full mb-4">
          <span>✅</span> 官方原作 · 計畫團隊編撰
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-tight mb-2">
          天氣、氣候與<span className="text-sun">氣候變遷</span>
        </h1>
        <p className="text-lg text-mute mb-5 font-light">{pkg.topicEn}</p>
        <p className="text-ink/80 leading-relaxed mb-5 max-w-2xl">
          以臺灣在地氣溫資料切入，帶領學生分辨「天氣」與「氣候」、理解全球增溫的長期趨勢，並引導從情緒連結到家庭行動。4 節 × 40 分鐘的完整教學包。
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs bg-white border border-earth/20 px-3 py-1.5 rounded-full text-ink">
            🎒 Level {pkg.level} <span className="text-mute">· {pkg.ageBand}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-white border border-earth/20 px-3 py-1.5 rounded-full text-ink">
            🌍 主題 {pkg.themeNumber}：{pkg.themeName}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-white border border-earth/20 px-3 py-1.5 rounded-full text-ink">
            ⭐ 收藏 <b className="text-earth">{pkg.stars}</b>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-white border border-earth/20 px-3 py-1.5 rounded-full text-ink">
            🔀 改編 <b className="text-earth">{pkg.forks}</b>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-forest/10 border border-forest/30 px-3 py-1.5 rounded-full text-forest font-medium">
            ✅ 官方原作
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs bg-white border border-earth/20 px-3 py-1.5 rounded-full text-ink">
            📅 {pkg.publishedAt}
          </span>
        </div>
      </div>

      {/* Preview card (fake worksheet thumbnail) */}
      <div className="hero-preview rounded-2xl p-5 shadow-warm-lg relative overflow-hidden">
        <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wider bg-ink/70 text-white px-2 py-0.5 rounded">
          Preview
        </div>
        <div className="text-4xl mb-3">🌡️📈</div>
        <div className="space-y-2 mb-4">
          <div className="line" style={{ width: '85%' }} />
          <div className="line" style={{ width: '60%' }} />
          <div className="line" style={{ width: '75%' }} />
        </div>
        <div className="flex gap-2 mb-4">
          <div className="chip rounded px-2 py-1 text-xs text-white">台北</div>
          <div className="chip rounded px-2 py-1 text-xs text-white" style={{ background: '#8B5A3C' }}>台中</div>
          <div className="chip rounded px-2 py-1 text-xs text-white" style={{ background: '#E8884F' }}>高雄</div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="line" style={{ width: '90%' }} />
          <div className="line" style={{ width: '50%' }} />
        </div>
        <div className="text-[10px] text-mute mt-4 pt-3 border-t border-earth/15 flex justify-between">
          <span>worksheet.html · §1</span>
          <span>第 1/4 頁</span>
        </div>
      </div>
    </section>
  );
}
