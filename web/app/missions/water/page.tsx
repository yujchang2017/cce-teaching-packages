import type { Metadata } from 'next';
import MovedGame from '@/components/MovedGame';
import { WATER_GAME_URL } from '@/lib/teaching-games';
// Moved to yjesdlab/game-water; components/watershed-lab is kept for now and no longer rendered here.
export const metadata: Metadata = { title: '一場雨，兩條路｜已搬到研究計畫網站', description: '流域實驗室已搬到獨立的研究計畫網站。', robots: { index: false } };
export default function Page(){return <MovedGame title="一場雨，兩條路" url={WATER_GAME_URL}/>;}
