import type { Metadata } from 'next';
import MovedGame from '@/components/MovedGame';
import { ANIMALS_GAME_URL } from '@/lib/teaching-games';
// Moved to yjesdlab/game-animals; components/group-games is kept for now and no longer rendered here.
export const metadata: Metadata = { title: '幫動物，接回一條路｜已搬到研究計畫網站', description: '動物通道實驗室已搬到獨立的研究計畫網站。', robots: { index: false } };
export default function Page(){return <MovedGame title="幫動物，接回一條路" url={ANIMALS_GAME_URL}/>;}
