import type { TeachingPackage } from '@/lib/types';

export default function KeyIdeaCard({ pkg }: { pkg: TeachingPackage }) {
  return (
    <section className="grid lg:grid-cols-[380px_1fr] gap-6 mb-10">
      {/* Key Idea card */}
      <div className="bg-white rounded-2xl p-6 shadow-warm border-l-4 border-sun">
        <div className="text-xs text-sun font-bold tracking-wider uppercase mb-2">Key Idea</div>
        <blockquote className="text-lg leading-relaxed text-ink font-medium">
          「{pkg.keyIdea}」
        </blockquote>
        <div className="mt-4 pt-4 border-t border-earth/10 text-xs text-mute space-y-1">
          <div>
            建議節數：<b className="text-ink">4 節 × 40 分鐘</b>（160 min）
          </div>
          <div>授課語言：繁中為主，部分英文關鍵詞</div>
        </div>
      </div>

      {/* Learning objectives */}
      <div className="bg-white rounded-2xl p-6 shadow-warm">
        <h3 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
          <span>🎯</span> 學習目標（對應 UNESCO ESD 三領域）
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs font-bold text-forest mb-2 flex items-center gap-1">
              🧠 認知 Cognitive <span className="text-mute font-normal">({pkg.learningOutcomes.cognitive.length})</span>
            </div>
            <ul className="text-xs text-ink/85 space-y-1.5">
              {pkg.learningOutcomes.cognitive.map((lo) => {
                const [code, ...rest] = lo.split(' ');
                return (
                  <li key={code}>
                    <b className="text-forest">{code}</b> {rest.join(' ')}
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold text-earth mb-2 flex items-center gap-1">
              💛 社會情緒 Social <span className="text-mute font-normal">({pkg.learningOutcomes.social.length})</span>
            </div>
            <ul className="text-xs text-ink/85 space-y-1.5">
              {pkg.learningOutcomes.social.map((lo) => {
                const [code, ...rest] = lo.split(' ');
                return (
                  <li key={code}>
                    <b className="text-earth">{code}</b> {rest.join(' ')}
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold text-sun mb-2 flex items-center gap-1">
              🌱 行為 Behavioural <span className="text-mute font-normal">({pkg.learningOutcomes.behavioural.length})</span>
            </div>
            <ul className="text-xs text-ink/85 space-y-1.5">
              {pkg.learningOutcomes.behavioural.map((lo) => {
                const [code, ...rest] = lo.split(' ');
                return (
                  <li key={code}>
                    <b className="text-sun">{code}</b> {rest.join(' ')}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
