export type Topic='combustion'|'fugitive'|'electricity';
export type Shape='stove'|'generator'|'boiler'|'ac'|'fridge'|'tank'|'extinguisher'|'fan'|'lamp'|'laptop'|'bear'|'blocks'|'ball'|'car'|'duck';
export interface Item {key:string;name:string;activity:string;category:Topic|'toy';shape:Shape;color:number;label:string;reason:string;source:string}
export const topics:Record<Topic,{name:string;short:string;task:string;clue:string}>={
 combustion:{name:'範疇一・固定燃燒',short:'自己燒燃料',task:'找出學校燃燒燃料的固定設備',clue:'想一想：這台設備是在學校燃燒瓦斯或柴油，還是使用買來的電？'},
 fugitive:{name:'範疇一・逸散排放',short:'氣體逸散',task:'找出直接逸散氣體的設備與設施',clue:'觀察的活動是冷媒、甲烷或二氧化碳逸散，不是設備用電。'},
 electricity:{name:'範疇二・外購電力',short:'使用買來的電',task:'找出使用學校外購電力的設備',clue:'這筆排放來自供電端發電；用電設備本身不必冒煙。'},
};
export const items:Item[]=[
 {key:'stove',name:'瓦斯爐',activity:'學校廚房燃燒瓦斯',category:'combustion',shape:'stove',color:0x718f95,label:'GAS',reason:'學校廚房燃燒瓦斯，是範疇一的固定燃燒排放。',source:'2-1 固定式排放源 B5、B12'},
 {key:'generator',name:'柴油發電機',activity:'校內設備燃燒柴油發電',category:'combustion',shape:'generator',color:0xe2a841,label:'DIESEL',reason:'柴油在學校的發電機裡燃燒，屬範疇一，不是外購電力。',source:'2-1 固定式排放源 B5、B20'},
 {key:'boiler',name:'燃氣熱水鍋爐',activity:'學校鍋爐燃燒天然氣',category:'combustion',shape:'boiler',color:0xc9d7de,label:'GAS',reason:'鍋爐自己燃燒天然氣加熱水，屬範疇一固定燃燒。',source:'2-1 固定式排放源 B5、B17'},
 {key:'ac-leak',name:'冷氣・冷媒逸散',activity:'校有冷氣的 R-32 冷媒逸散',category:'fugitive',shape:'ac',color:0xcbdedb,label:'R-32',reason:'這張活動卡看的是冷媒逸散，屬範疇一；冷氣用電要另看範疇二。',source:'2-3(3) 逸散性排放源 (填充冷媒) B5、D17'},
 {key:'fridge-leak',name:'冰箱・冷媒逸散',activity:'校有冰箱的 R-134a 冷媒逸散',category:'fugitive',shape:'fridge',color:0x98bacb,label:'R-134a',reason:'本題指定冰箱中的 R-134a 冷媒逸散，屬範疇一。不是所有冷媒都相同。',source:'2-3(3) 逸散性排放源 (填充冷媒) B5、D20'},
 {key:'septic',name:'校內化糞池',activity:'校內化糞池的甲烷逸散',category:'fugitive',shape:'tank',color:0xa3afa8,label:'CH4',reason:'本題是學校控制的校內化糞池，污水處理產生甲烷逸散，屬範疇一。',source:'2-3(1) 逸散性排放源(污水排放-化糞池使用) B5、B11、B31'},
 {key:'extinguisher',name:'CO₂ 滅火器',activity:'校有 CO₂ 滅火器使用時釋放氣體',category:'fugitive',shape:'extinguisher',color:0xc76b58,label:'CO2',reason:'本題指定 CO₂ 滅火器使用時釋放二氧化碳，依參考表列入範疇一逸散項目。',source:'2-3(2) 逸散性排放源 (滅火器、實驗室氣體鋼瓶) B15、B33'},
 {key:'ac-power',name:'冷氣・外購用電',activity:'校有冷氣使用外購電力',category:'electricity',shape:'ac',color:0xcbdedb,label:'POWER',reason:'這張活動卡看的是外購電力，屬範疇二；同一台冷氣的冷媒逸散另算範疇一。',source:'2-4 外購電力 B10:B11；設備為教學情境'},
 {key:'fan',name:'電風扇',activity:'校內風扇使用外購電力',category:'electricity',shape:'fan',color:0x89b5a8,label:'POWER',reason:'風扇使用學校外購電力，相關發電排放屬範疇二。',source:'2-4 外購電力 B10:B11；設備為教學情境'},
 {key:'lamp',name:'教室電燈',activity:'教室照明使用外購電力',category:'electricity',shape:'lamp',color:0xe3b977,label:'POWER',reason:'照明使用學校買來的電，相關發電排放屬範疇二。',source:'2-4 外購電力 B10:B11；設備為教學情境'},
 {key:'laptop',name:'筆記型電腦',activity:'學校電腦使用外購電力',category:'electricity',shape:'laptop',color:0x7595bb,label:'POWER',reason:'本題看學校電腦的外購用電，屬範疇二；不在本局計算製造電腦的排放。',source:'2-4 外購電力 B10:B11；設備為教學情境'},
 {key:'bear',name:'布偶熊',activity:'一般無動力玩具',category:'toy',shape:'bear',color:0xc79c78,label:'TOY',reason:'布偶沒有本局的燃燒、逸散或用電活動。製造、運輸與廢棄仍可能有碳排放。',source:'教學干擾物'},
 {key:'blocks',name:'木積木',activity:'一般無動力玩具',category:'toy',shape:'blocks',color:0xddae7b,label:'TOY',reason:'木積木不是本局要登錄的排放活動；不是宣稱其生命週期零碳。',source:'教學干擾物'},
 {key:'ball',name:'皮球',activity:'一般無動力玩具',category:'toy',shape:'ball',color:0xc87977,label:'TOY',reason:'這顆皮球沒有本局要找的運作排放；製造與運輸仍可能產生碳排放。',source:'教學干擾物'},
 {key:'car',name:'無動力玩具車',activity:'沒有馬達、電池或燃油的玩具',category:'toy',shape:'car',color:0xe5b64b,label:'TOY',reason:'這是無動力玩具車，不是真正燃燒燃油的車輛，也不使用電力。',source:'教學干擾物'},
 {key:'duck',name:'玩具小鴨',activity:'一般無動力玩具',category:'toy',shape:'duck',color:0xefc952,label:'TOY',reason:'這是無動力玩具，不是本局要登錄的排放活動。',source:'教學干擾物'},
];
export const itemByKey=Object.fromEntries(items.map(i=>[i.key,i])) as Record<string,Item>;
export interface Piece {id:string;key:string;slot:number;angle:number}
export interface Round {topic:Topic;seed:number;pieces:Piece[];totalPairs:number}
export type Verdict='correct'|'toy'|'category'|'different';
export interface Attempt {kind:Verdict;keys:string[];text:string}
export interface Game {round:Round;selected:string|null;removed:string[];parked:string[];history:Attempt[];locked:boolean;flash:string[];message:string;kind:'neutral'|Verdict}
function rng(seed:number){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function shuffle<T>(values:T[],random:()=>number){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeRound(topic:Topic,seed:number,tutorial=false):Round{
 const random=rng(seed),pool=shuffle(items.filter(i=>i.category===topic),random);
 const targets=tutorial?pool.slice(0,2):[...pool.slice(0,3),pool[Math.floor(random()*pool.length)]];
 const toys=shuffle(items.filter(i=>i.category==='toy'),random).slice(0,tutorial?1:3);
 const others=shuffle(items.filter(i=>i.category!=='toy'&&i.category!==topic),random).slice(0,tutorial?0:2);
 const keys=shuffle([...targets,...toys,...others].flatMap(i=>[i.key,i.key]),random);
 return {topic,seed,totalPairs:targets.length,pieces:keys.map((key,slot)=>({id:`p${slot+1}`,key,slot,angle:(random()-.5)*Math.PI*1.7}))};
}
export const fresh=(round:Round):Game=>({round,selected:null,removed:[],parked:[],history:[],locked:false,flash:[],message:'先看上方題目，點一件物品，再找相同的一件。',kind:'neutral'});
export function found(s:Game){return s.removed.length/2;}
export function finished(s:Game){return found(s)===s.round.totalPairs;}
export function judge(topic:Topic,a:Item,b:Item):Attempt{
 if(a.key!==b.key)return {kind:'different',keys:[a.key,b.key],text:a.shape===b.shape?'外觀相同，但活動不同。請讀「用電」或「逸散」後再配對。':'這兩件不是同一種物件與活動，再觀察一下。'};
 if(a.category==='toy')return {kind:'toy',keys:[a.key,b.key],text:`找到了相同的玩具，但本關不能消除它。${a.reason}`};
 if(a.category!==topic)return {kind:'category',keys:[a.key,b.key],text:`這對屬於「${topics[a.category].name}」，不是本局目標。${a.reason}`};
 return {kind:'correct',keys:[a.key,b.key],text:a.reason};
}
export type Action={type:'pick';id:string}|{type:'park'}|{type:'cancel'}|{type:'unlock'}|{type:'return';id:string};
export function act(s:Game,a:Action):Game{
 if(a.type==='unlock')return {...s,locked:false,flash:[]};
 if(s.locked||finished(s))return s;
 if(a.type==='cancel')return {...s,selected:null};
 if(a.type==='return')return {...s,parked:s.parked.filter(id=>id!==a.id),message:'已放回桌上。也可以直接配對暫放區裡的物件。'};
 if(a.type==='park')return !s.selected?s:{...s,parked:[...new Set([...s.parked,s.selected])],selected:null,message:'已暫放在旁邊，不扣分。可直接點暫放物件繼續配對。',kind:'neutral'};
 const p=s.round.pieces.find(p=>p.id===a.id);if(!p||s.removed.includes(a.id))return s;
 if(s.selected===a.id)return {...s,selected:null,message:'已取消選取，不扣分。',kind:'neutral'};
 if(!s.selected)return {...s,selected:a.id,kind:'neutral',message:`${itemByKey[p.key].activity}。再找相同物件與相同活動的一件。`};
 const first=s.round.pieces.find(p=>p.id===s.selected)!;
 const attempt=judge(s.round.topic,itemByKey[first.key],itemByKey[p.key]);
 const pair=[first.id,p.id];
 return {...s,selected:null,locked:true,flash:pair,history:[...s.history,attempt],message:attempt.text,kind:attempt.kind,removed:attempt.kind==='correct'?[...s.removed,...pair]:s.removed,parked:attempt.kind==='correct'?s.parked.filter(id=>!pair.includes(id)):s.parked};
}
