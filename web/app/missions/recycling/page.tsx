import type { Metadata } from 'next';
import MovedGame from '@/components/MovedGame';
import { RECYCLING_GAME_URL } from '@/lib/teaching-games';
// Moved to yjesdlab/game-recycling; components/recycling-lab is kept for now and no longer rendered here.
export const metadata: Metadata = { title: '產品回家之後｜已搬到研究計畫網站', description: '為回收而設計遊戲已搬到獨立的研究計畫網站。', robots: { index: false } };
export default function Page(){return <MovedGame title="產品回家之後" url={RECYCLING_GAME_URL}/>;}
