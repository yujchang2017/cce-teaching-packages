import type {Metadata} from 'next';
import RecyclingLab from '@/components/recycling-lab/RecyclingLab';
export const metadata:Metadata={title:'產品回家之後｜為回收而設計',description:'拆解、分類並改良產品，使用 3D 空間推理比較螺絲規格、塑膠材質與電池模組設計如何影響回收成本。'};
export default function Page(){return <RecyclingLab/>;}
