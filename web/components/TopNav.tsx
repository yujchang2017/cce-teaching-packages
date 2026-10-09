import Link from 'next/link';

// 測試期間右上角有「TEST / 測試中」斜緞帶（SiteStatusNotice），選單往左讓出位置以免被遮住。
const testing = (process.env.NEXT_PUBLIC_SITE_STATUS || 'testing').toLowerCase() === 'testing';

export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-earth/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🌍</span>
          <span className="font-bold text-xl text-earth tracking-tight">
            cce<span className="text-sun">.tw</span>
          </span>
          <span className="hidden md:inline text-xs text-mute ml-1 pt-1">氣候變遷教案社群</span>
        </Link>

        {/* Right nav */}
        <div className={`flex items-center gap-3 shrink-0 ml-auto ${testing ? 'pr-24 sm:pr-28' : ''}`}>
          <Link href="/" className="hidden md:inline text-sm text-ink hover:text-sun transition">
            瀏覽教案
          </Link>
          <Link href="/games/" className="text-sm text-ink hover:text-sun transition">
            🎮 遊戲區
          </Link>
        </div>
      </div>
    </header>
  );
}
