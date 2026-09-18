import type {Metadata} from 'next';
import PizzaLab from '@/components/pizza-lab/PizzaLab';
export const metadata:Metadata={title:'一人一半，怎麼切？｜3D 披薩分配實驗室',description:'畫出一刀，觀察 3D 披薩分離，同時比較兩份的配料碳足跡、熱量與主要營養素分配。'};
export default function Page(){return <PizzaLab/>;}
