import type {Metadata} from 'next';
import CarbonMatch from '@/components/carbon-match/CarbonMatch';
export const metadata:Metadata={title:'校園碳排偵探｜3D 配對任務',description:'從立體物件堆找出符合排放主題的相同一對，辨認固定與移動燃燒、逸散、外購電力、通勤、用水與垃圾等排放來源，以及減碳與吸碳設施，留下混入的玩具。'};
export default function Page(){return <CarbonMatch/>;}
