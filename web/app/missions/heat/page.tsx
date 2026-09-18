import type { Metadata } from 'next';
import GroupGame from '@/components/group-games/GroupGame';
export const metadata: Metadata = { title: '都市降溫實驗室｜3D 教案遊戲', description: '用三棵樹改善居民辦事與返家的路，讓更多人保有體力回家。' };
export default function Page(){return <GroupGame mode="heat"/>;}
