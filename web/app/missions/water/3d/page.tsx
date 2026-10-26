import type { Metadata } from 'next';
import MovedGame from '@/components/MovedGame';
import { WATER_GAME_URL } from '@/lib/teaching-games';
// The 3D view now lives inside the standalone game (yjesdlab/game-water).
export const metadata: Metadata = { title: '一場雨，兩條路｜已搬到研究計畫網站', description: '流域實驗室（含全 3D 檢視）已搬到獨立的研究計畫網站。', robots: { index: false } };
export default function Page(){return <MovedGame title="一場雨，兩條路" url={WATER_GAME_URL}/>;}
