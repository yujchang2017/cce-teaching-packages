'use client';

// Client-side browser for teaching packages.
// Handles search + level/theme filter + sort interactively.
// Receives full 136-package list as prop from server-side page.tsx.

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { PackageSummary, Level } from '@/lib/types';

const themeGrad: Record<number, string> = {
  1: 'bg-gradient-to-br from-[#6EB5FF] to-[#3C6EA5]',
  2: 'bg-gradient-to-br from-[#8BC88B] to-[#3C6E47]',
  3: 'bg-gradient-to-br from-[#FFB27A] to-[#C96E34]',
  4: 'bg-gradient-to-br from-[#E8A7D1] to-[#A04C88]',
  5: 'bg-gradient-to-br from-[#F0CD6E] to-[#B8862B]',
  6: 'bg-gradient-to-br from-[#98D8C8] to-[#3D7F72]',
};

const levelTagClass: Record<string, string> = {
  II: 'bg-[#FFE8CC] text-[#C96E34]',
  III: 'bg-[#D9EBD4] text-[#3C6E47]',
  IV: 'bg-[#E2D6F5] text-[#6A4CA4]',
  V: 'bg-[#D4E4F0] text-[#2D6A9F]',
};

const LEVEL_OPTIONS: { value: Level | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'II', label: 'Level II · 幼兒園低年級' },
  { value: 'III', label: 'Level III · 國小中高' },
  { value: 'IV', label: 'Level IV · 國中' },
  // { value: 'V', label: 'Level V · 高中' }, // 暫時隱藏,待教案完善後再開放
];

const THEME_OPTIONS: { value: number | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 1, label: '1️⃣ 氣候科學' },
  { value: 2, label: '2️⃣ 生態系與生物多樣性' },
  { value: 3, label: '3️⃣ 氣候正義' },
  { value: 4, label: '4️⃣ 韌性建構' },
  { value: 5, label: '5️⃣ 後碳經濟' },
  { value: 6, label: '6️⃣ 永續生活形態' },
];

type SortKey = 'default' | 'keyid' | 'level' | 'theme';
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'default', label: '🔢 預設（key_id 升冪）' },
  { value: 'keyid', label: '🔠 Key ID' },
  { value: 'level', label: '🎒 年段' },
  { value: 'theme', label: '🌐 主題' },
];

function PackageCard({ pkg }: { pkg: PackageSummary }) {
  return (
    <Link
      href={`/package/${pkg.keyId}`}
      className={`group relative block bg-white rounded-2xl shadow-warm overflow-hidden transition hover:-translate-y-1.5 hover:shadow-warm-lg ${
        pkg.isOfficial ? 'ring-2 ring-sun/40' : ''
      }`}
    >
      <div className={`${themeGrad[pkg.themeNumber]} h-36 flex items-center justify-center text-5xl relative`}>
        <span className="drop-shadow-lg">{pkg.emojis}</span>
        <div className="absolute inset-0 flex items-center justify-center bg-ink/55 text-white font-semibold opacity-0 group-hover:opacity-100 transition">
          點擊查看 →
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs bg-sand/80 text-earth font-mono font-bold px-2 py-0.5 rounded">
            {pkg.keyId}
          </span>
          <span className="text-[10px] text-mute">
            主題 {pkg.themeNumber} · {pkg.themeName}
          </span>
        </div>
        <h3 className="font-bold text-ink text-base leading-snug mb-2">{pkg.topic}</h3>
        <p className="text-xs text-ink/70 mb-3 line-clamp-2">{pkg.summary}</p>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${levelTagClass[pkg.level]}`}>
            {pkg.levelLabel}
          </span>
        </div>
        {pkg.mascot && (
          <div className="text-xs text-ink/70 pt-3 border-t border-earth/10">
            🎭 {pkg.mascot}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function HomeBrowser({
  packages,
}: {
  packages: PackageSummary[];
}) {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<Level | 'all'>('all');
  const [theme, setTheme] = useState<number | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('default');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = packages.filter((p) => {
      if (level !== 'all' && p.level !== level) return false;
      if (theme !== 'all' && p.themeNumber !== theme) return false;
      if (q) {
        const hay = `${p.keyId} ${p.topic} ${p.themeName} ${p.mascot ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sort === 'keyid' || sort === 'default') {
      // Natural sort by keyId (e.g., 1.1-II, 1.2-II, ..., 6.7-V)
      result = [...result].sort((a, b) => {
        const pa = parseKeyId(a.keyId);
        const pb = parseKeyId(b.keyId);
        return (
          pa.theme - pb.theme ||
          pa.sub - pb.sub ||
          LEVEL_ORDER[pa.level] - LEVEL_ORDER[pb.level]
        );
      });
    } else if (sort === 'level') {
      result = [...result].sort(
        (a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.keyId.localeCompare(b.keyId)
      );
    } else if (sort === 'theme') {
      result = [...result].sort(
        (a, b) => a.themeNumber - b.themeNumber || a.keyId.localeCompare(b.keyId)
      );
    }
    return result;
  }, [packages, query, level, theme, sort]);

  const filterPillActive = 'bg-[#8B5A3C] border-[#8B5A3C] text-white';
  const filterPillBase =
    'inline-flex items-center gap-1 text-xs sm:text-[13px] px-3 py-1.5 rounded-full border border-earth/25 bg-white text-ink cursor-pointer transition whitespace-nowrap hover:border-sun hover:text-sunDeep hover:bg-[#FFF7E5]';

  return (
    <>
      {/* FILTERS (interactive) */}
      <section className="bg-cream/95 backdrop-blur -mx-4 sm:-mx-6 px-4 sm:px-6 py-5 mb-8 border-y border-earth/15">
        <div className="relative mb-4 max-w-3xl">
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-mute" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="搜尋關鍵字… 例：氣候變遷、天氣、永續、Key ID (如 1.1-III)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border-2 border-earth/15 text-base focus:outline-none focus:ring-2 focus:ring-sun focus:border-sun transition shadow-sm"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 flex-wrap">
            <span className="text-xs text-mute font-medium shrink-0 pt-1.5 w-14">年段</span>
            <div className="flex items-center gap-2 flex-wrap">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLevel(opt.value)}
                  className={`${filterPillBase} ${level === opt.value ? filterPillActive : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-3 flex-wrap">
            <span className="text-xs text-mute font-medium shrink-0 pt-1.5 w-14">主題</span>
            <div className="flex items-center gap-2 flex-wrap">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={`${filterPillBase} ${theme === opt.value ? filterPillActive : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-start justify-between gap-3 flex-wrap pt-2 border-t border-earth/10">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-mute font-medium shrink-0 pt-1.5 w-14">排序</span>
              <div className="flex items-center gap-2 flex-wrap">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSort(opt.value)}
                    className={`${filterPillBase} ${sort === opt.value ? filterPillActive : ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm text-mute pt-1.5">
              結果 <b className="text-earth text-base">{filtered.length}</b> 筆
              {(level !== 'all' || theme !== 'all' || query) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setLevel('all');
                    setTheme('all');
                  }}
                  className="ml-3 text-xs underline text-sun hover:text-sunDeep"
                >
                  清除篩選
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CARD GRID */}
      <section className="mb-14">
        <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            📚 {filtered.length === packages.length ? '所有教案' : '篩選結果'}
          </h2>
          <span className="text-sm text-mute">點卡片進入詳情頁</span>
        </div>
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-mute border border-earth/10">
            沒有符合條件的教案。試著放寬篩選條件？
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filtered.map((p) => (
              <PackageCard key={p.keyId} pkg={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// --- helpers ---

const LEVEL_ORDER: Record<Level, number> = { II: 0, III: 1, IV: 2, V: 3 };

function parseKeyId(keyId: string): { theme: number; sub: number; level: Level } {
  // e.g. "1.1-III" → { theme: 1, sub: 1, level: 'III' }
  const [head, level] = keyId.split('-');
  const [themeS, subS] = head.split('.');
  return {
    theme: Number(themeS) || 0,
    sub: Number(subS) || 0,
    level: (level as Level) ?? 'II',
  };
}
