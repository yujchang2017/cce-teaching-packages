export const RADIUS=3;
export interface Food {id:string;name:string;sourceId:string;co2:number;energy:number;protein:number;fat:number;carb:number;color:number}
// Snapshot from the user-supplied balance/pizzacut.csv. Carbon: kg CO2e/kg;
// energy: kJ/100 g; other nutrients: g/100 g. No live or Taiwan-specific factors.
export const foods:Food[]=[
 {id:'tomato',name:'番茄',sourceId:'Ra00002',co2:.46,energy:87,protein:.8,fat:.1,carb:3.3,color:0xc95235},
 {id:'pepper',name:'甜椒',sourceId:'Ra00001',co2:.96,energy:133,protein:.9,fat:.1,carb:5.9,color:0x54923b},
 {id:'mushroom',name:'洋菇',sourceId:'Ra00207',co2:.37,energy:97,protein:2.3,fat:.1,carb:2.7,color:0xb48b64},
 {id:'pineapple',name:'鳳梨（罐頭）',sourceId:'Ra00123',co2:1.1,energy:269,protein:.4,fat:.3,carb:14.1,color:0xeeb839},
 {id:'feta',name:'費塔起司',sourceId:'Ra00270',co2:2.24,energy:1071,protein:17.7,fat:20.8,carb:.4,color:0xf5e9c5},
 {id:'shrimp',name:'熟蝦仁',sourceId:'Ra00275',co2:8.8,energy:291,protein:15.3,fat:.8,carb:0,color:0xdf8d6b},
 {id:'chicken',name:'熟雞胸肉',sourceId:'Ra00052',co2:4.76,energy:475,protein:20.6,fat:3.2,carb:.4,color:0xd8ae76},
 {id:'beef',name:'牛肉',sourceId:'Ra00503',co2:61.04,energy:1332,protein:16.4,fat:28.4,carb:.2,color:0x8e4434},
];
export const foodById=Object.fromEntries(foods.map(f=>[f.id,f])) as Record<string,Food>;
export interface Topping {id:number;food:string;x:number;z:number;radius:number;grams:number;rotation:number}
export interface Round {seed:number;level:number;toppings:Topping[];solution:number}
export interface Cut {angle:number;offset:number}
export interface Totals {carbon:number;energy:number;protein:number;fat:number;carb:number;mass:number}
export type Metric=keyof Omit<Totals,'mass'>;
export const metrics:{id:Metric;name:string;unit:string}[]=[{id:'carbon',name:'配料碳足跡',unit:'g CO₂e'},{id:'energy',name:'熱量',unit:'kcal'},{id:'protein',name:'蛋白質',unit:'g'},{id:'fat',name:'脂肪',unit:'g'},{id:'carb',name:'碳水化合物',unit:'g'}];
const zero=():Totals=>({carbon:0,energy:0,protein:0,fat:0,carb:0,mass:0});
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export function normal(c:Cut){const a=c.angle*Math.PI/180;return {x:-Math.sin(a),z:Math.cos(a)};}
export function sanitizeCut(c:Cut):Cut{return {angle:Number.isFinite(c.angle)?((c.angle%180)+180)%180:0,offset:Number.isFinite(c.offset)?clamp(c.offset,-1.65,1.65):0};}
// Fraction of a uniform circular footprint on the positive side of the cut.
export function fraction(distance:number,radius:number){if(distance>=radius)return 1;if(distance<=-radius)return 0;const q=clamp(distance/radius,-1,1);return .5+(Math.asin(q)+q*Math.sqrt(1-q*q))/Math.PI;}
export function values(f:Food,grams:number):Totals{return {carbon:f.co2*grams,energy:f.energy*grams/100/4.184,protein:f.protein*grams/100,fat:f.fat*grams/100,carb:f.carb*grams/100,mass:grams};}
export function balance(a:number,b:number){return a+b<1e-10?100:clamp(100*(1-Math.abs(a-b)/(a+b)),0,100);}
export function evaluate(round:Round,cut:Cut){
 const c=sanitizeCut(cut),n=normal(c),a=zero(),b=zero();const portions=round.toppings.map(p=>{const share=fraction(n.x*p.x+n.z*p.z-c.offset,p.radius),v=values(foodById[p.food],p.grams);for(const k of Object.keys(a) as (keyof Totals)[]){a[k]+=v[k]*share;b[k]+=v[k]*(1-share);}return {...p,share};});
 const scores=Object.fromEntries(metrics.map(m=>[m.id,balance(a[m.id],b[m.id])])) as Record<Metric,number>;
 const area=fraction(-c.offset,RADIUS),areaScore=balance(area,1-area),nutrition=Math.min(scores.energy,scores.protein,scores.fat,scores.carb),score=Math.min(scores.carbon,nutrition,areaScore);
 return {a,b,scores,area,areaScore,nutrition,score,passed:score>=85,portions};
}
function random(seed:number){let x=seed>>>0;return()=>{x+=0x6d2b79f5;let t=Math.imul(x^x>>>15,1|x);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
export function makeRound(seed:number,level:number):Round{
 const rnd=random(seed),count=[4,6,8][clamp(level,0,2)],solution=20+Math.floor(rnd()*140),n=normal({angle:solution,offset:0}),t={x:n.z,z:-n.x};
 const selected=[...foods].sort((a,b)=>a.id.localeCompare(b.id));for(let i=selected.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[selected[i],selected[j]]=[selected[j],selected[i]];}
 const toppings:Topping[]=[];
 // Matched food amounts are placed independently in each half of a hidden cut.
 // A known 100-point solution exists, without a visually mirrored arrangement.
 const slots=[[.674,-2.073],[1.764,-1.281],[2.18,0],[1.764,1.281],[.674,2.073],[.5,-.866],[1,0],[.5,.866]];
 for(const sign of [1,-1]){const positions=[...slots];for(let j=positions.length-1;j>0;j--){const k=Math.floor(rnd()*(j+1));[positions[j],positions[k]]=[positions[k],positions[j]];}for(let i=0;i<count;i++){const [d,along]=positions[i];const food=selected[i],radius=.46;const x=n.x*d*sign+t.x*along,z=n.z*d*sign+t.z*along;toppings.push({id:toppings.length,food:food.id,x,z,radius,grams:food.id==='beef'||food.id==='chicken'?12:food.id==='shrimp'?10:8,rotation:rnd()*Math.PI*2});}}
 return {seed,level:clamp(level,0,2),toppings,solution};
}
export function lineEndpoints(cut:Cut){const c=sanitizeCut(cut),n=normal(c),half=Math.sqrt(RADIUS*RADIUS-c.offset*c.offset),t={x:n.z,z:-n.x};return [{x:n.x*c.offset-t.x*half,z:n.z*c.offset-t.z*half},{x:n.x*c.offset+t.x*half,z:n.z*c.offset+t.z*half}];}
export function cutFromPoints(a:{x:number;z:number},b:{x:number;z:number}):Cut|null{if(Math.hypot(a.x-b.x,a.z-b.z)<.35)return null;const angle=((Math.atan2(b.z-a.z,b.x-a.x)*180/Math.PI)%180+180)%180;const n=normal({angle,offset:0});return sanitizeCut({angle,offset:n.x*(a.x+b.x)/2+n.z*(a.z+b.z)/2});}
export function diskPolygon(cut:Cut,side:1|-1){const c=sanitizeCut(cut),n=normal(c),vertices=Array.from({length:128},(_,i)=>({x:RADIUS*Math.cos(i*Math.PI/64),z:RADIUS*Math.sin(i*Math.PI/64)}));const result:{x:number;z:number}[]=[];
 for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length],da=side*(n.x*a.x+n.z*a.z-c.offset),db=side*(n.x*b.x+n.z*b.z-c.offset);if(da>=0)result.push(a);if((da>=0)!==(db>=0)){const q=da/(da-db);result.push({x:a.x+q*(b.x-a.x),z:a.z+q*(b.z-a.z)});}}
 return result;
}
