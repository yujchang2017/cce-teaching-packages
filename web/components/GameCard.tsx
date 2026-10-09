import Link from 'next/link';
import { gameLinkProps, isExternalGame, sourceLabels, themeNames, type TeachingGame } from '@/lib/teaching-games';

// Theme colours match the package cards (HomeBrowser themeGrad); 0 = 其他.
const themeGrad: Record<number, string> = {
  0: 'bg-gradient-to-br from-[#C9C2B2] to-[#7D7466]',
  1: 'bg-gradient-to-br from-[#6EB5FF] to-[#3C6EA5]',
  2: 'bg-gradient-to-br from-[#8BC88B] to-[#3C6E47]',
  3: 'bg-gradient-to-br from-[#FFB27A] to-[#C96E34]',
  4: 'bg-gradient-to-br from-[#E8A7D1] to-[#A04C88]',
  5: 'bg-gradient-to-br from-[#F0CD6E] to-[#B8862B]',
  6: 'bg-gradient-to-br from-[#98D8C8] to-[#3D7F72]',
};

function basePath() {
  const explicit = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
  return explicit !== undefined ? (explicit === '/' ? '' : explicit) : process.env.CUSTOM_DOMAIN?.trim() ? '' : '/cce-teaching-packages';
}

/** One game card, shared by the homepage showcase and the /games/ page. */
export default function GameCard({ game }: { game: TeachingGame }) {
  const external = isExternalGame(game), link = gameLinkProps(game);
  const note = external ? (game.source === 'teacher' ? '（另開外部網站，由分享者提供）' : '（另開外部網站）') : '';
  const theme = game.themeNumber ? `主題 ${game.themeNumber}` : '其他主題';
  return <article className="rounded-2xl overflow-hidden bg-white border border-forest/10 shadow-sm flex flex-col">
    <Link href={game.href} prefetch={false} {...link} aria-label={`試玩：${game.shortTitle}${note}`} className="block relative overflow-hidden bg-[#e6eadf] focus-visible:outline-4 focus-visible:outline-sun">
      {game.image
        ? <img src={`${basePath()}${game.image}`} alt={`${game.shortTitle}實際遊戲畫面`} width={960} height={540} loading="lazy" className="w-full aspect-video object-cover transition duration-300 motion-safe:hover:scale-105"/>
        // Shared games get a theme-coloured tile instead of a remote image (no third-party images on this site).
        : <div className={`w-full aspect-video ${themeGrad[game.themeNumber] ?? themeGrad[0]} flex flex-col items-center justify-center text-white`} aria-hidden="true">
            <span className="text-5xl drop-shadow">🎮</span>
            <span className="mt-2 text-sm font-semibold drop-shadow">{themeNames[game.themeNumber] ?? themeNames[0]}</span>
          </div>}
      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-forest">{theme}</span>
      {external && <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white ${game.source === 'teacher' ? 'bg-sky-700' : 'bg-sunDeep'}`}>{game.source === 'teacher' ? '教師分享・外部網站' : '研究計畫・外部網站'}</span>}
      {game.badge && <span className="absolute right-3 bottom-3 rounded-md bg-ink/80 px-2 py-1 text-xs text-white">{game.badge}</span>}
    </Link>
    <div className="p-5 flex flex-col flex-1">
      <p className="text-xs text-forest mb-2">{themeNames[game.themeNumber] ?? themeNames[0]} · Level {game.levels.join('／')} · 約 {game.minutes} 分鐘</p>
      <h3 className="font-bold text-lg text-ink mb-2">{game.shortTitle}</h3>
      <p className="text-sm text-ink/75 leading-relaxed flex-1">{game.mission}</p>
      {game.source === 'teacher' && <p className="text-xs text-ink/65 mt-2">分享：{game.author}{game.school ? `（${game.school}）` : ''}</p>}
      {game.coldStartNote && <p className="text-xs text-ink/60 mt-2">{game.coldStartNote}，上課前建議先開一次。</p>}
      <div className="flex gap-3 mt-5 items-center">
        <Link href={game.href} prefetch={false} {...link} className="flex-1 text-center rounded-xl bg-forest text-white font-bold py-3 text-sm hover:bg-forest/90 focus-visible:outline-4 focus-visible:outline-sun" aria-label={`開始遊戲：${game.shortTitle}${note}`}>{external ? '開始遊戲 ↗' : '開始遊戲 →'}</Link>
        {game.keyIds[0] && <Link href={`/package/${game.keyIds[0]}/`} prefetch={false} className="text-sm font-semibold text-forest px-2 py-3 underline underline-offset-4" aria-label={`查看教案：${game.keyIds[0]}`}>查看教案</Link>}
      </div>
    </div>
  </article>;
}

export const externalDisclaimer = '外部網站由提供者自行維護；本站審核連結後才列出，但不保證其內容與資料蒐集方式。老師分享的遊戲標示「教師分享」。';
export { sourceLabels };
