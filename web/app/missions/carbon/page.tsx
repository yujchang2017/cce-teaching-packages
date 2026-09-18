import type {Metadata} from 'next';
import CarbonMatch from '@/components/carbon-match/CarbonMatch';
export const metadata:Metadata={title:'校園碳排偵探｜3D 配對任務',description:'從立體物件堆找出符合排放主題的相同一對，辨認固定燃燒、逸散與外購電力，留下混入的玩具。'};
export default function Page(){return <CarbonMatch/>;}
