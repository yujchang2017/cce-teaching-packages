import Link from 'next/link';
import { teachingGames } from '@/lib/teaching-games';

const themes = ['氣候科學','生態系與生物多樣性','氣候正義','韌性建構','後碳經濟','永續生活型態'];
const titles: Record<string,string> = {carbon:'校園碳排偵探',animals:'幫動物，接回一條路',heat:'涼爽的路',watershed:'一場雨，兩條路',recycling:'產品回家之後',pizza:'一人一半，怎麼切？'};
const missions: Record<string,string> = {
  carbon:'從設備與玩具中，找出符合題目的排放來源。',
  animals:'配置橋梁、坡道與護欄，讓整群動物安全抵達。',
  heat:'用三棵樹改善遮蔭，讓居民辦完事還能安全回家。',
  watershed:'觀察地形、配置花園與水槽，再降雨驗證水的去向。',
  recycling:'拆解、分類、改設計，看看怎樣降低回收成本。',
  pizza:'畫一刀，同時兼顧兩份配料的碳足跡與營養。',
};

export default function GameShowcase() {
  // Images are static; the six Three.js scenes load only on their game pages.
  const explicit=process.env.NEXT_PUBLIC_BASE_PATH?.trim();
  const basePath=explicit!==undefined?(explicit==='/'?'':explicit):process.env.CUSTOM_DOMAIN?.trim()?'':'/cce-teaching-packages';
  return <section id="games" aria-labelledby="games-title" className="scroll-mt-24 mb-12 rounded-3xl border border-forest/20 bg-[#edf2e7] p-5 sm:p-8">
    <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
      <div><p className="text-xs font-bold tracking-widest text-forest mb-2">PLAY · EXPLORE · LEARN</p><h2 id="games-title" className="text-2xl sm:text-3xl font-bold text-ink">六大主題，從遊戲開始</h2><p className="text-sm text-ink/75 mt-3 leading-relaxed">先玩一個任務，再回到教案討論。每款都附操作引導，歡迎老師試玩與試教。</p></div>
      <span className="rounded-full bg-forest text-white px-4 py-2 text-xs font-bold">新增 {teachingGames.length} 款 · 試玩版</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...teachingGames].sort((a,b)=>a.themeNumber-b.themeNumber).map(game=><article key={game.id} className="rounded-2xl overflow-hidden bg-white border border-forest/10 shadow-sm flex flex-col">
        <Link href={game.href} prefetch={false} aria-label={`試玩：${titles[game.id]}`} className="block relative overflow-hidden bg-[#e6eadf] focus-visible:outline-4 focus-visible:outline-sun">
          <img src={`${basePath}/games/${game.id}.png`} alt={`${titles[game.id]}實際遊戲畫面`} width={960} height={540} loading="lazy" className="w-full aspect-video object-cover transition duration-300 motion-safe:hover:scale-105"/>
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-forest">主題 {game.themeNumber}</span>
          {game.id==='watershed'&&<span className="absolute right-3 bottom-3 rounded-md bg-ink/80 px-2 py-1 text-xs text-white">水路觀察原型</span>}
        </Link>
        <div className="p-5 flex flex-col flex-1">
          <p className="text-xs text-forest mb-2">{themes[game.themeNumber-1]} · 約 {game.minutes} 分鐘</p>
          <h3 className="font-bold text-lg text-ink mb-2">{titles[game.id]}</h3>
          <p className="text-sm text-ink/75 leading-relaxed flex-1">{missions[game.id]}</p>
          <div className="flex gap-3 mt-5 items-center"><Link href={game.href} prefetch={false} className="flex-1 text-center rounded-xl bg-forest text-white font-bold py-3 text-sm hover:bg-forest/90 focus-visible:outline-4 focus-visible:outline-sun" aria-label={`開始遊戲：${titles[game.id]}`}>開始遊戲 →</Link><Link href={`/package/${game.keyId}/`} prefetch={false} className="text-sm font-semibold text-forest px-2 py-3 underline underline-offset-4" aria-label={`查看教案：${game.keyId}`}>查看教案</Link></div>
        </div>
      </article>)}
    </div>
    <p className="text-xs text-ink/65 mt-5 leading-relaxed">目前對應 Level III 教案；遊戲使用簡化教學模型。主題四為水路觀察原型，完整暴雨調適設計仍在開發中。</p>
  </section>;
}
