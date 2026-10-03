import type { Metadata } from 'next';
import HeatQuick from '@/components/group-games/HeatQuick';
export const metadata: Metadata = { title: '都市降溫實驗室｜種 3 棵樹送大家回家', description: '點地圖種 3 棵樹，馬上看到多少居民能平安回家。' };
export default function Page(){return <HeatQuick/>;}
