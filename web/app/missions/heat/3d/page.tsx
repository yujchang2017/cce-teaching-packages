import type { Metadata } from 'next';
import MovedGame from '@/components/MovedGame';
import { HEAT_GAME_URL } from '@/lib/teaching-games';
// The 3D view now lives inside the standalone game (yjesdlab/game-heat).
export const metadata: Metadata = { title: '涼爽的路｜已搬到研究計畫網站', description: '都市降溫實驗室（含全 3D 檢視）已搬到獨立的研究計畫網站。', robots: { index: false } };
export default function Page(){return <MovedGame title="涼爽的路" url={HEAT_GAME_URL}/>;}
