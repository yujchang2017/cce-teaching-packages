import type {Metadata} from 'next';
import WatershedLab from '@/components/watershed-lab/WatershedLab';
export const metadata:Metadata={title:'一場雨，兩條路｜全 3D 檢視',description:'旋轉流域地形、剖開土層、布設雨水設施，透過同雨量實驗理解坡度、分水嶺與入滲。'};
export default function Page(){return <WatershedLab/>;}
