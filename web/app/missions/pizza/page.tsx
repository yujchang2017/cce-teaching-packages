import type {Metadata} from 'next';
import {PIZZA_GAME_URL} from '@/lib/teaching-games';
// The pizza game moved to a standalone research site (yjesdlab/game-pizza); this static page forwards old links.
// components/pizza-lab is kept for now and no longer rendered here.
export const metadata:Metadata={title:'一人一半，怎麼切？｜已搬到研究計畫網站',description:'披薩分配遊戲已搬到獨立的研究計畫網站。',robots:{index:false}};
export default function Page(){
  return <main className="max-w-xl mx-auto px-4 py-16 text-center">
    <meta httpEquiv="refresh" content={`0;url=${PIZZA_GAME_URL}`}/>
    <h1 className="text-2xl font-bold text-ink mb-4">遊戲已搬家</h1>
    <p className="text-ink/75 leading-relaxed mb-6">「一人一半，怎麼切？」已搬到研究計畫網站，正在為您轉過去；首次載入約需 10 秒。</p>
    <a href={PIZZA_GAME_URL} className="inline-block rounded-xl bg-forest text-white font-bold px-6 py-3">沒有自動跳轉？點這裡前往 ↗</a>
  </main>;
}
