'use client';
import { useMemo, useState } from 'react';
import GameCard from '@/components/GameCard';
import { sourceLabels, teachingGames, themeNames, type GameSource } from '@/lib/teaching-games';
import type { Level } from '@/lib/types';

const levelOptions: { value: Level | 'all'; label: string }[] = [
  { value: 'all', label: '全部' }, { value: 'II', label: 'Level II · 5-8歲' }, { value: 'III', label: 'Level III · 9-12歲' },
  { value: 'IV', label: 'Level IV · 13-15歲' }, { value: 'V', label: 'Level V · 高中' },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick}
    className={`rounded-full px-3 py-1.5 text-sm border transition ${active ? 'bg-forest text-white border-forest' : 'bg-white text-ink/80 border-earth/20 hover:border-forest/40'}`}>{children}</button>;
}

/** Filterable list of every game (lab + teacher-shared). Filters only use the fixed catalog fields. */
export default function GamesBrowser() {
  const [theme, setTheme] = useState<number | 'all'>('all');
  const [level, setLevel] = useState<Level | 'all'>('all');
  const [source, setSource] = useState<GameSource | 'all'>('all');
  const usedThemes = useMemo(() => [...new Set(teachingGames.map(g => g.themeNumber))].sort((a, b) => (a || 9) - (b || 9)), []);
  const usedLevels = useMemo(() => new Set(teachingGames.flatMap(g => g.levels)), []);
  const games = useMemo(() => teachingGames
    .filter(g => (theme === 'all' || g.themeNumber === theme) && (level === 'all' || g.levels.includes(level)) && (source === 'all' || g.source === source))
    .sort((a, b) => (a.source === b.source ? 0 : a.source === 'lab' ? -1 : 1) || (a.themeNumber || 9) - (b.themeNumber || 9) || b.addedAt.localeCompare(a.addedAt)),
  [theme, level, source]);
  return <>
    <div className="rounded-2xl bg-white border border-earth/10 p-4 sm:p-5 mb-6 space-y-3" role="group" aria-label="篩選遊戲">
      <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-ink w-12">主題</span>
        <Chip active={theme === 'all'} onClick={() => setTheme('all')}>全部</Chip>
        {usedThemes.map(t => <Chip key={t} active={theme === t} onClick={() => setTheme(t)}>{t ? `${t} ${themeNames[t]}` : themeNames[0]}</Chip>)}
      </div>
      <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-ink w-12">年段</span>
        {levelOptions.filter(o => o.value === 'all' || usedLevels.has(o.value)).map(o => <Chip key={o.value} active={level === o.value} onClick={() => setLevel(o.value)}>{o.label}</Chip>)}
      </div>
      <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-ink w-12">來源</span>
        <Chip active={source === 'all'} onClick={() => setSource('all')}>全部</Chip>
        {(Object.keys(sourceLabels) as GameSource[]).map(s => <Chip key={s} active={source === s} onClick={() => setSource(s)}>{sourceLabels[s]}</Chip>)}
      </div>
    </div>
    <p className="text-sm text-mute mb-4" role="status">共 {games.length} 款</p>
    {games.length
      ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{games.map(g => <GameCard key={g.id} game={g}/>)}</div>
      : <p className="rounded-2xl bg-white border border-earth/10 p-8 text-center text-ink/70">這個條件目前還沒有遊戲，換個篩選看看，或來分享你的遊戲！</p>}
  </>;
}
