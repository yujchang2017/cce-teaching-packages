import Link from 'next/link';
import GameCard, { externalDisclaimer } from '@/components/GameCard';
import { featuredGames, teachingGames } from '@/lib/teaching-games';

export default function GameShowcase() {
  // Images are static; the Three.js scenes load only on the game pages themselves.
  const games = featuredGames();
  const lab = teachingGames.filter(g => g.source === 'lab').length, shared = teachingGames.length - lab;
  return <section id="games" aria-labelledby="games-title" className="scroll-mt-24 mb-12 rounded-3xl border border-forest/20 bg-[#edf2e7] p-5 sm:p-8">
    <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
      <div><p className="text-xs font-bold tracking-widest text-forest mb-2">PLAY · EXPLORE · LEARN</p><h2 id="games-title" className="text-2xl sm:text-3xl font-bold text-ink">遊戲區：從遊戲開始</h2><p className="text-sm text-ink/75 mt-3 leading-relaxed">先玩一個任務，再回到教案討論。除了本計畫的研究遊戲，也收錄老師分享的教學遊戲。</p></div>
      <span className="rounded-full bg-forest text-white px-4 py-2 text-xs font-bold">共 {teachingGames.length} 款{shared ? ` · 本計畫 ${lab}、教師分享 ${shared}` : ' · 試玩版'}</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {games.map(game => <GameCard key={game.id} game={game}/>)}
    </div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-ink/65 leading-relaxed max-w-2xl">本計畫遊戲對應 Level III 教案，使用簡化教學模型。{externalDisclaimer}</p>
      <Link href="/games/" className="rounded-xl border border-forest/40 bg-white px-5 py-3 text-sm font-bold text-forest hover:bg-forest/5">看全部遊戲・我也想分享 →</Link>
    </div>
  </section>;
}
