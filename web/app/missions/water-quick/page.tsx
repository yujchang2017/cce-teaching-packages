import type { Metadata } from 'next';
import WaterQuick from '@/components/watershed-lab/WaterQuick';
export const metadata: Metadata = { title: '雨水去哪裡｜活動簡單版', description: '在山坡上放 2 個雨水設施，馬上看到流進學校的水有沒有變少。' };
export default function Page(){return <WaterQuick/>;}
