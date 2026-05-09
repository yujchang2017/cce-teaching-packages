import Link from 'next/link';

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
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <Link href="/" className="hidden md:inline text-sm text-ink hover:text-sun transition">
            瀏覽教案
          </Link>
        </div>
      </div>
    </header>
  );
}
