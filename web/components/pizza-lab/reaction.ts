// How the two waiting diners react to a cut (pure logic, unit-tested in model.test.mjs).
import type {evaluate} from './model';

export type Mood='wait'|'happy'|'pout'|'angry'|'shock';
type Result=ReturnType<typeof evaluate>;
export interface Reaction {a:Mood;b:Mood;bubbleA:string|null;bubbleB:string|null;loser:'a'|'b'|null;tier:'wait'|'happy'|'pout'|'angry';reason:string|null}

const nutrientName:Record<string,string>={energy:'熱量',protein:'蛋白質',fat:'脂肪',carb:'碳水化合物'};

/** Decide how the two diners react. The side that got less of the lowest-scoring item is the one who complains. */
export function react(result:Result,showing:boolean):Reaction{
 if(!showing)return {a:'wait',b:'wait',bubbleA:null,bubbleB:null,loser:null,tier:'wait',reason:null};
 const score=result.score;
 if(score>=85)return {a:'happy',b:'happy',bubbleA:'好公平！開動囉喵～',bubbleB:'五顆星的一刀！',loser:null,tier:'happy',reason:null};
 // Lowest of the three scored items decides what the complaint is about.
 const items:[string,number][]=[['carbon',result.scores.carbon],['nutrition',result.nutrition],['area',result.areaScore]];
 const [worst]=items.reduce((m,x)=>x[1]<m[1]?x:m);
 let loser:'a'|'b',what:string;
 if(worst==='area'){loser=result.area<.5?'a':'b';what='餅皮';}
 else if(worst==='carbon'){loser=result.a.carbon<result.b.carbon?'a':'b';what='碳足跡';}
 else{const nutrient=(['energy','protein','fat','carb'] as const).reduce((m,k)=>result.scores[k]<result.scores[m]?k:m,'energy' as 'energy'|'protein'|'fat'|'carb');loser=result.a[nutrient]<result.b[nutrient]?'a':'b';what=nutrientName[nutrient];}
 const angry=score<60,cat=loser==='a';
 const lines:Record<string,[string,string]>={
  餅皮:['怎麼我的餅皮比較小塊？','我的餅皮小這麼多！'],
  碳足跡:['配料碳足跡怎麼差這麼多？','碳足跡差太多了啦！'],
 };
 const [pout,mad]=lines[what]??[`怎麼我的${what}比較少？`,`我的${what}少一大截！`];
 const base=angry?mad:pout,line=cat?base.replace(/([？！])$/,'喵$1'):base;
 const other=angry?'哇！別丟！':null;
 return {a:cat?(angry?'angry':'pout'):(angry?'shock':'wait'),b:cat?(angry?'shock':'wait'):(angry?'angry':'pout'),bubbleA:cat?line:other,bubbleB:cat?other:line,loser,tier:angry?'angry':'pout',reason:what};
}
