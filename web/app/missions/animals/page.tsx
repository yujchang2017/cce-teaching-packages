import type { Metadata } from 'next';
import GroupGame from '@/components/group-games/GroupGame';
export const metadata: Metadata = { title: '動物通道實驗室｜3D 教案遊戲', description: '用有限工程材料，幫一群動物安全抵達另一棲地。' };
export default function Page(){return <GroupGame mode="animals"/>;}
