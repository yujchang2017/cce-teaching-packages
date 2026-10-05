export type Topic='combustion'|'mobile'|'fugitive'|'scope1'|'electricity'|'commute'|'water'|'waste'|'reduction';
/** An item's own emission (or reduction) activity. 'toy' and 'exempt' never clear. */
export type Category=Exclude<Topic,'scope1'>|'toy'|'exempt';
export type Shape='stove'|'generator'|'boiler'|'ac'|'fridge'|'tank'|'extinguisher'|'fan'|'lamp'|'laptop'|'bear'|'blocks'|'ball'|'car'|'duck'
 |'sedan'|'scooter'|'mower'|'van'|'bus'|'metro'|'bicycle'|'shoes'|'faucet'|'toilet'|'dispenser'|'trashbin'|'dumpster'|'garbagetruck'|'solar'|'turbine'|'tree'|'hedge';
export interface Item {key:string;name:string;activity:string;category:Category;shape:Shape;color:number;label:string;reason:string;source:string}
/** targets: categories that clear in this topic. near: item keys preferred as look-alike distractors. */
export interface TopicInfo {name:string;short:string;task:string;clue:string;targets:Category[];near?:string[]}
export const topics:Record<Topic,TopicInfo>={
 combustion:{name:'範疇一・固定燃燒',short:'自己燒燃料',task:'找出學校燃燒燃料的固定設備',clue:'想一想：這台設備是在學校燃燒瓦斯或柴油，還是使用買來的電？',targets:['combustion']},
 mobile:{name:'範疇一・移動燃燒',short:'車輛燒燃料',task:'找出學校自己的車輛與機具燃燒燃料',clue:'看活動卡：這輛車是學校自己的公務車，還是老師自己的車？玩具車沒有引擎。',targets:['mobile'],near:['teacher-car','commute-scooter']},
 fugitive:{name:'範疇一・逸散排放',short:'氣體逸散',task:'找出直接逸散氣體的設備與設施',clue:'觀察的活動是冷媒、甲烷或二氧化碳逸散，不是設備用電。',targets:['fugitive']},
 scope1:{name:'範疇一・學校直接排放大集合',short:'綜合大集合',task:'找出學校自己直接排放的來源：燒燃料、開公務車、氣體逸散都算',clue:'固定燃燒、移動燃燒、逸散都是學校直接排放；買來的電、老師通勤、用水和垃圾不在這一局。',targets:['combustion','mobile','fugitive'],near:['ac-power','teacher-car']},
 electricity:{name:'範疇二・外購電力',short:'使用買來的電',task:'找出使用學校外購電力的設備',clue:'這筆排放來自供電端發電；用電設備本身不必冒煙。',targets:['electricity']},
 commute:{name:'間接排放・員工通勤',short:'老師上班交通',task:'找出老師上下班會造成排放的交通方式',clue:'看活動卡：是「上下班通勤」還是「學校公務」？表格註明走路、騎腳踏車不必計入。',targets:['commute'],near:['walk','bike','official-car']},
 water:{name:'間接排放・外購水力',short:'使用自來水',task:'找出使用學校買來的自來水的設備',clue:'自來水要抽水、淨水、送水才到學校，過程會用到能源。看清楚活動卡是「用水」還是「用電」。',targets:['water'],near:['dispenser-power']},
 waste:{name:'間接排放・廢棄物處置',short:'垃圾送去燒',task:'找出學校垃圾送去焚化與清運的環節',clue:'表格計算的是一般垃圾送到焚化廠燒掉，以及垃圾車載過去的路程。',targets:['waste']},
 reduction:{name:'加分關・減碳與吸碳',short:'減碳與吸碳',task:'這次反過來：找出幫學校減少或吸收二氧化碳的設施',clue:'這一關的目標不是排放源！太陽能、風力發電可以少買電（減碳）；樹木和灌木會吸收二氧化碳（碳匯）。',targets:['reduction'],near:['generator','lamp']},
};
export const categoryNames:Record<Category,string>={
 combustion:topics.combustion.name,mobile:topics.mobile.name,fugitive:topics.fugitive.name,electricity:topics.electricity.name,
 commute:topics.commute.name,water:topics.water.name,waste:topics.waste.name,reduction:topics.reduction.name,
 toy:'一般玩具',exempt:'不必計入的通勤方式',
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
 // 2-2 移動式排放源（範疇一）
 {key:'official-car',name:'學校公務車（汽油）',activity:'學校自有公務車燃燒汽油',category:'mobile',shape:'sedan',color:0x4d7fa8,label:'FUEL',reason:'公務車是學校自己的車，開動時在車上燃燒汽油，屬範疇一的移動燃燒。',source:'2-2 移動式排放源 B5、B12、B17'},
 {key:'official-scooter',name:'公務機車',activity:'學校自有公務機車燃燒汽油',category:'mobile',shape:'scooter',color:0xc8584a,label:'FUEL',reason:'學校自己的機車燒汽油跑公務，屬範疇一的移動燃燒。',source:'2-2 移動式排放源 B5、B12、B17'},
 {key:'mower',name:'除草機',activity:'學校除草機燃燒汽油割草',category:'mobile',shape:'mower',color:0xd9733a,label:'FUEL',reason:'表格把除草機列為移動式排放源的例子；它燃燒汽油，屬範疇一。（表格另把肩背式除草機列在固定式，兩者都是範疇一。）',source:'2-2 移動式排放源 B5、B12；另見 2-1 固定式排放源 B5'},
 {key:'delivery-van',name:'學校自有配送車（柴油）',activity:'學校自有配送車燃燒柴油',category:'mobile',shape:'van',color:0x5a8fc8,label:'DIESEL',reason:'表格例子有「自有之物流配送車輛」；學校自己的貨車燃燒柴油，屬範疇一的移動燃燒。',source:'2-2 移動式排放源 B5、B12、B18'},
 // 2-5 員工通勤（學校間接造成的排放）
 {key:'teacher-car',name:'老師開自己的車上班',activity:'老師開自己的汽車上下班',category:'commute',shape:'sedan',color:0x4d7fa8,label:'COMMUTE',reason:'車子是老師自己的，上下班通勤不是學校公務，屬於學校間接造成的排放（員工通勤）。',source:'2-5 員工通勤 B11、B16'},
 {key:'commute-scooter',name:'騎機車上班',activity:'老師騎自己的機車上下班',category:'commute',shape:'scooter',color:0xc8584a,label:'COMMUTE',reason:'老師騎自己的機車上下班，屬於員工通勤；和學校公務機車要分開看。',source:'2-5 員工通勤 B11、B19'},
 {key:'bus',name:'搭公車／客運上班',activity:'老師搭公車或客運上下班',category:'commute',shape:'bus',color:0x58a07c,label:'COMMUTE',reason:'公車不是學校的，但老師為了上班搭乘，表格把它算進員工通勤。',source:'2-5 員工通勤 B11、B21'},
 {key:'metro',name:'搭捷運上班',activity:'老師搭捷運上下班',category:'commute',shape:'metro',color:0xd9dfe2,label:'COMMUTE',reason:'捷運用電行駛、不會冒煙，但發電仍有排放，表格把搭捷運通勤也列入統計。',source:'2-5 員工通勤 B11、B22'},
 {key:'walk',name:'走路上班',activity:'老師走路上下班',category:'exempt',shape:'shoes',color:0x5f86b8,label:'WALK',reason:'走路上班不燒燃料，也不用電。',source:'2-5 員工通勤 B30'},
 {key:'bike',name:'騎腳踏車上班',activity:'老師騎腳踏車上下班',category:'exempt',shape:'bicycle',color:0x3f9a8c,label:'BIKE',reason:'腳踏車靠人力踩動，不燒燃料，也不用電。',source:'2-5 員工通勤 B30'},
 // 2-6 外購水力（學校間接造成的排放）；設備為教學情境
 {key:'faucet',name:'水龍頭・自來水',activity:'洗手台使用學校買來的自來水',category:'water',shape:'faucet',color:0xb9c6cc,label:'WATER',reason:'自來水要抽水、淨水、送水才到學校，這些過程會用到能源，所以學校用水算在學校間接造成的排放。',source:'2-6 外購水力 B11、B14；設備為教學情境'},
 {key:'toilet',name:'沖水馬桶',activity:'廁所沖水使用自來水',category:'water',shape:'toilet',color:0xeeeeea,label:'WATER',reason:'每沖一次水都用掉買來的自來水，屬於學校間接造成的排放（外購水力）。',source:'2-6 外購水力 B11、B14；設備為教學情境'},
 {key:'dispenser-water',name:'飲水機・用水',activity:'飲水機使用自來水',category:'water',shape:'dispenser',color:0xc5d6df,label:'WATER',reason:'這張活動卡看的是飲水機用掉的自來水；同一台飲水機加熱用電要另看範疇二。',source:'2-6 外購水力 B11、B14；設備為教學情境'},
 {key:'dispenser-power',name:'飲水機・用電',activity:'飲水機加熱、冰水使用外購電力',category:'electricity',shape:'dispenser',color:0xc5d6df,label:'POWER',reason:'這張活動卡看的是飲水機用電，屬範疇二；同一台飲水機用掉的自來水另算在用水。',source:'2-4 外購電力 B10:B11；設備為教學情境'},
 // 2-7 廢棄物處置與運輸（學校間接造成的排放）
 {key:'trash-bin',name:'教室垃圾桶',activity:'一般垃圾送到焚化廠燒掉',category:'waste',shape:'trashbin',color:0x5f8d6b,label:'WASTE',reason:'教室的一般垃圾最後送到焚化廠燒掉，燒的時候產生二氧化碳，屬於學校間接造成的排放。',source:'2-7 廢棄物處置與運輸 B11、B12、E17'},
 {key:'collection-bin',name:'垃圾集中場子車',activity:'集中後秤重、交給清運的一般垃圾',category:'waste',shape:'dumpster',color:0x3f7a92,label:'WASTE',reason:'全校垃圾集中到子車後交給清運；表格用「清運廢棄物重量」估算焚化與運輸的排放。',source:'2-7 廢棄物處置與運輸 B12、B15、B23'},
 {key:'garbage-truck',name:'垃圾車清運',activity:'垃圾車把學校垃圾載到焚化廠',category:'waste',shape:'garbagetruck',color:0xe6b440,label:'WASTE',reason:'垃圾車燒柴油把垃圾載去焚化廠；車子通常不是學校的，這段運輸算在學校間接造成的排放。',source:'2-7 廢棄物處置與運輸 B12、J17、B24'},
 // 3-1 再生能源、3-2 樹木碳匯（減碳與吸碳，不是排放源）
 {key:'solar',name:'太陽能板（自發自用）',activity:'屋頂太陽能板發電給學校自己用',category:'reduction',shape:'solar',color:0x2f4f7a,label:'SOLAR',reason:'太陽能板發電不燒燃料；學校自己用這些電就能少買電，這是「減碳」，不是排放源。',source:'3-1 再生能源 B11、B16、D5、B21'},
 {key:'wind',name:'風力發電機',activity:'校園風力發電機靠風發電',category:'reduction',shape:'turbine',color:0xdfe5e8,label:'WIND',reason:'風力發電靠風轉動，不燒燃料；發的電可以少買外面的電，屬於減碳。',source:'3-1 再生能源 B11、B15'},
 {key:'tree',name:'校園大樹',activity:'大樹行光合作用吸收二氧化碳',category:'reduction',shape:'tree',color:0x4f8f4a,label:'TREE',reason:'大樹把空氣中的二氧化碳存進樹幹和葉子，這叫「碳匯」（吸碳），不是排放源。',source:'3-2 樹木碳匯 B12、K18、L18'},
 {key:'hedge',name:'灌木綠籬',activity:'密植的灌木吸收二氧化碳',category:'reduction',shape:'hedge',color:0x5f9a4f,label:'HEDGE',reason:'密植的灌木也能吸收二氧化碳；表格把灌木列為植物固碳的一類，屬於碳匯。',source:'3-2 樹木碳匯 B12、K21'},
];
export const itemByKey=Object.fromEntries(items.map(i=>[i.key,i])) as Record<string,Item>;
export interface Piece {id:string;key:string;slot:number;angle:number}
export interface Round {topic:Topic;seed:number;pieces:Piece[];totalPairs:number}
export type Verdict='correct'|'toy'|'exempt'|'category'|'different';
export interface Attempt {kind:Verdict;keys:string[];text:string}
export interface Game {round:Round;selected:string|null;removed:string[];parked:string[];history:Attempt[];locked:boolean;flash:string[];message:string;kind:'neutral'|Verdict}
function rng(seed:number){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function shuffle<T>(values:T[],random:()=>number){const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export const isTarget=(topic:Topic,i:Item)=>topics[topic].targets.includes(i.category);
export function makeRound(topic:Topic,seed:number,tutorial=false):Round{
 const random=rng(seed),near=topics[topic].near??[],pool=shuffle(items.filter(i=>isTarget(topic,i)),random);
 const targets=tutorial?pool.slice(0,2):[...pool.slice(0,3),pool[Math.floor(random()*pool.length)]];
 const toys=shuffle(items.filter(i=>i.category==='toy'),random).slice(0,tutorial?1:3);
 // Look-alike distractors first (same shape, different activity), then any other non-target category. 'exempt' only appears via near.
 const alike=shuffle(items.filter(i=>near.includes(i.key)&&!isTarget(topic,i)),random);
 const rest=shuffle(items.filter(i=>i.category!=='toy'&&i.category!=='exempt'&&!isTarget(topic,i)&&!near.includes(i.key)),random);
 const others=[...alike,...rest].slice(0,tutorial?0:2);
 const keys=shuffle([...targets,...toys,...others].flatMap(i=>[i.key,i.key]),random);
 return {topic,seed,totalPairs:targets.length,pieces:keys.map((key,slot)=>({id:`p${slot+1}`,key,slot,angle:(random()-.5)*Math.PI*1.7}))};
}
export const fresh=(round:Round):Game=>({round,selected:null,removed:[],parked:[],history:[],locked:false,flash:[],message:'先看上方題目，點一件物品，再找相同的一件。',kind:'neutral'});
export function found(s:Game){return s.removed.length/2;}
export function finished(s:Game){return found(s)===s.round.totalPairs;}
export function judge(topic:Topic,a:Item,b:Item):Attempt{
 if(a.key!==b.key)return {kind:'different',keys:[a.key,b.key],text:a.shape!==b.shape?'這兩件不是同一種物件與活動，再觀察一下。':a.shape==='ac'?'外觀相同，但活動不同。請讀「用電」或「逸散」後再配對。':`外觀相同，但活動不同：「${a.activity}」和「${b.activity}」。請讀活動說明再配對。`};
 if(a.category==='toy')return {kind:'toy',keys:[a.key,b.key],text:`找到了相同的玩具，但本關不能消除它。${a.reason}`};
 if(a.category==='exempt')return {kind:'exempt',keys:[a.key,b.key],text:`找到相同的一對，但表格註明走路、騎腳踏車上下班不必計入，本關不能消除。${a.reason}`};
 if(!isTarget(topic,a))return {kind:'category',keys:[a.key,b.key],text:`這對屬於「${categoryNames[a.category]}」，不是本局目標。${a.reason}`};
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
