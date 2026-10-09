import type { Metadata } from 'next';
import Link from 'next/link';
import GamesBrowser from '@/components/GamesBrowser';
import { externalDisclaimer } from '@/components/GameCard';
import { GAME_SHARE_CONTACT } from '@/lib/teaching-games';

export const metadata: Metadata = {
  title: '遊戲區｜氣候變遷教育教學資源',
  description: '本計畫的研究遊戲與老師分享的氣候變遷教學遊戲，可依主題、年段與來源篩選。',
};

export default function GamesPage() {
  return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
    <nav className="text-sm text-mute mb-6 flex flex-wrap items-center gap-1.5">
      <Link href="/" className="hover:text-sun transition">首頁</Link><span className="text-earth/40">›</span><span className="text-ink font-medium">遊戲區</span>
    </nav>
    <header className="mb-6">
      <p className="text-xs font-bold tracking-widest text-forest mb-2">PLAY · EXPLORE · LEARN</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-ink">遊戲區</h1>
      <p className="text-sm text-ink/75 mt-3 leading-relaxed max-w-3xl">先玩一個任務，再回到教案討論。這裡收錄本計畫的研究遊戲，以及老師們分享的教學遊戲；歡迎試玩、試教，也歡迎分享你的作品。</p>
    </header>
    <GamesBrowser/>
    <p className="text-xs text-ink/65 mt-6 leading-relaxed">{externalDisclaimer}</p>

    <section aria-labelledby="share-title" className="mt-10 rounded-2xl bg-white border border-forest/20 p-6 sm:p-8">
      <h2 id="share-title" className="text-xl font-bold text-ink mb-3">我也想分享遊戲</h2>
      <p className="text-sm text-ink/80 leading-relaxed mb-4">
        {GAME_SHARE_CONTACT
          ? <>請來信 <a className="text-forest underline" href={`mailto:${GAME_SHARE_CONTACT}?subject=${encodeURIComponent('遊戲區分享')}`}>{GAME_SHARE_CONTACT}</a>，</>
          : <>請透過頁面最下方的聯絡方式來信，</>}
        附上下列資料。計畫團隊審核後會加入遊戲區（不需要會寫程式或使用 GitHub）。
      </p>
      <div className="grid gap-6 sm:grid-cols-2 text-sm text-ink/80 leading-relaxed">
        <div>
          <h3 className="font-semibold text-ink mb-2">請提供</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>遊戲名稱、一句話介紹（60 字內）</li>
            <li>遊戲網址（需為 https 開頭）</li>
            <li>對應的主題與年段、大約遊玩時間</li>
            <li>相關教案編號（選填，例如 1.2-III）</li>
            <li>希望顯示的稱呼（例如「王老師」），以及是否顯示學校</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-ink mb-2">審核原則</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>你有權分享這個遊戲，且可免費遊玩</li>
            <li>沒有廣告、賭博或不適合學生的內容</li>
            <li>若遊戲會蒐集學生資料，請說明蒐集什麼、如何取得同意</li>
            <li>遊戲放在你自己的網站，本站只放連結，不代管檔案</li>
            <li>連結失效或想下架時，隨時來信即可</li>
          </ul>
        </div>
      </div>
    </section>
  </main>;
}
