export type Vec = [number, number, number];
export type Id = 'cap'|'brace'|'battery'|'board'|'shell'|'trim'|'handle'|'hatch';
export type Tool = 'PH1'|'T10'|'專業工位'|'免工具';
export type Direction = 'up'|'front'|'back';
export type Upgrade = 'screws'|'plastic'|'labels'|'battery'|'separate';
export type Bin = 'PC'|'ABS'|'PP'|'metal'|'mixed'|'electronics'|'battery';
export interface Box {center:Vec;size:Vec}
export interface Part {id:Id;name:string;material:string;bin:Bin;mass:number;color:number;box:Box;solids:Box[];tool:Tool;screws:number;direction:Direction;seconds:number;note:string}
export interface Event {label:string;seconds:number;kind:'tool'|'release'|'remove'|'identify'|'sort'|'rework'|'station';id?:Id}
export interface State {safe:boolean;released:Id[];removed:Id[];identified:Id[];bins:Partial<Record<Id,Bin>>;tool:Tool|null;events:Event[]}
export const upgrades:{id:Upgrade;name:string;cost:number;detail:string;manufacture:number}[]=[
 {id:'screws',name:'統一螺絲規格',cost:1,detail:'採同一 PH1 工具、適用位置統一尺寸；不減少必要固定點。',manufacture:.1},
 {id:'plastic',name:'外殼塑膠統一為 PC',cost:2,detail:'採通過本模型功能條件的同級 PC，取代 ABS 與黏合軟墊。',manufacture:.7},
 {id:'labels',name:'加上清楚的材質標示',cost:1,detail:'不用送鑑別台，縮短每個零件的辨識作業。',manufacture:.05},
 {id:'battery',name:'電池獨立維修口',cost:2,detail:'前飾板改為維修蓋；完整模組能沿前方通道移出。',manufacture:.6},
 {id:'separate',name:'軟墊改成可分離 PP',cost:1,detail:'取消 ABS 與 TPE 黏合，保留不同材質但可獨立分類。',manufacture:.2},
];
export const bins:{id:Bin;name:string;detail:string}[]=[
 {id:'PC',name:'PC 塑膠',detail:'本場接受的同級 PC'}, {id:'ABS',name:'ABS 塑膠',detail:'本場接受的 ABS'}, {id:'PP',name:'PP 塑膠',detail:'獨立 PP 零件'},
 {id:'metal',name:'金屬',detail:'鋼件與固定件'}, {id:'mixed',name:'複合材料處理',detail:'不可分離的 ABS＋TPE'}, {id:'electronics',name:'電子專業處理',detail:'電路模組待後續處理'}, {id:'battery',name:'電池專業處理',detail:'完整電池模組，獨立交接'},
];
export const directions:Record<Direction,string>={up:'向上 ↑',front:'向前 ↘',back:'向後 ↖'};
export function screwLabel(id:Id,d:Upgrade[]){const specs:Partial<Record<Id,string>>={cap:'M2 × 8',brace:'M2 × 6',board:'M2 × 4',handle:'M2.5 × 8',hatch:'M2 × 6'};return specs[id]?(d.includes('screws')?'M2 × 6（統一規格）':specs[id]):null;}
export const ids:Id[]=['cap','brace','battery','board','shell','trim','handle','hatch'];
export const fresh=():State=>({safe:false,released:[],removed:[],identified:[],bins:{},tool:null,events:[]});
const box=(center:Vec,size:Vec):Box=>({center,size});
export function validDesign(d:Upgrade[]){return new Set(d).size===d.length&&d.every(x=>upgrades.some(u=>u.id===x))&&budget(d)<=3&&!(d.includes('plastic')&&d.includes('separate'));}
export const budget=(d:Upgrade[])=>d.reduce((n,id)=>n+(upgrades.find(u=>u.id===id)?.cost??100),0);
export function parts(d:Upgrade[]):Part[]{
 const mono=d.includes('plastic'),service=d.includes('battery'),separate=d.includes('separate');
 const shellSolids=[box([0,.2,0],[3.4,.3,2.4]),box([-1.6,1,0],[.2,1.3,2.4]),box([1.6,1,0],[.2,1.3,2.4]),box([0,1,-1.1],[3.4,1.3,.2]),...(service?[box([.85,1,1.1],[1.5,1.3,.2]),box([-.8,.38,1.1],[1.6,.15,.2]),box([-.8,1.6,1.1],[1.6,.15,.2])]:[box([0,1,1.1],[3.4,1.3,.2])])];
 const p=(id:Id,name:string,material:string,bin:Bin,mass:number,color:number,b:Box,tool:Tool,screws:number,direction:Direction,seconds:number,note:string,solids:Box[]=[b]):Part=>({id,name,material,bin,mass,color,box:b,solids,tool:tool==='T10'&&d.includes('screws')?'PH1':tool,screws,direction,seconds,note});
 return [
 p('cap','01 燈罩上蓋','PC','PC',120,0xe7e9dc,box([0,2.15,0],[3.4,.94,2.4]),'PH1',2,'up',8,'移開燈罩，才能看見固定橫架與電路。'),
 p('brace','02 固定橫架','鋼','metal',90,0xa6b0b3,box([0,1.54,0],[2.9,.18,.5]),'T10',2,'up',8,'橫架位在電池上方，會擋住向上的移出路徑。'),
 p('battery','03 完整電池模組','完整電池模組','battery',110,0xdc9252,box([-.72,.94,.08],[1.15,.65,1.05]),'專業工位',0,service?'front':'up',service?12:35,service?'維修口提供前方通道，不必先拆上蓋與橫架。':'完整模組由專業工位處理；本版需先清出上方空間。'),
 p('board','04 電路模組','電子組件','electronics',80,0x43766b,box([.87,.65,0],[.85,.15,1.4]),'PH1',2,'up',10,'電路板也需要前往專業回收途徑。'),
 p('shell','05 主外殼',mono?'PC':'ABS',mono?'PC':'ABS',180,0xd9c5a1,box([0,1,0],[3.4,1.6,2.4]),'免工具',0,'up',5,'先把其餘零件分開，才有獨立的外殼材料。',shellSolids),
 p('trim','06 前方軟墊',mono?'PC':separate?'PP':'ABS＋TPE 黏合',mono?'PC':separate?'PP':'mixed',40,0x4b6260,box([1.05,.8,1.3],[.6,.6,.18]),'免工具',0,'front',mono||separate?4:15,'外觀相似不代表材質相同；查看材質卡再分類。'),
 p('handle','07 金屬提把','鋼','metal',100,0xb3babb,box([0,2.36,-1.42],[2.4,1.98,.3]),'T10',2,'back',8,'提把固定在背面；系統會轉到能看到固定點的角度。',[box([0,3.25,-1.42],[2.4,.2,.3]),box([-1.1,2.32,-1.42],[.2,1.86,.3]),box([1.1,2.32,-1.42],[.2,1.86,.3])]),
 p('hatch',service?'08 電池維修蓋':'08 前飾板',mono?'PC':'ABS',mono?'PC':'ABS',40,0xcab28e,box([-.72,.95,1.27],[1.5,.92,.18]),'PH1',2,'front',6,service?'打開這一片後，完整電池模組可以從前方移出。':'本版只是飾板，後方仍有封閉外殼；拆下也不會開出電池通道。'),
 ];
}
function intersects(a:Box,b:Box){return a.center.every((c,i)=>Math.abs(c-b.center[i])<(a.size[i]+b.size[i])/2-.025);}
export function sweep(p:Part,dir:Direction):Box{
 const axis=dir==='up'?1:2,sign=dir==='back'?-1:1,travel=4;
 const c=[...p.box.center] as Vec,s=[...p.box.size] as Vec;c[axis]+=sign*travel/2;s[axis]+=travel;return box(c,s);
}
export function obstacle(d:Upgrade[],s:State,id:Id,dir:Direction):Part|undefined{
 const all=parts(d),p=all.find(x=>x.id===id)!;
 if(id==='shell')return all.find(x=>x.id!=='shell'&&!s.removed.includes(x.id));
 return all.find(x=>x.id!==id&&!s.removed.includes(x.id)&&x.solids.some(b=>intersects(sweep(p,dir),b)));
}
export function issue(d:Upgrade[],s:State,id:Id,dir:Direction,removing=false):string|null{
 if(!s.safe)return '先完成安全分流與專業檢查。';
 if(s.removed.includes(id))return '這個零件已移出。';
 const p=parts(d).find(x=>x.id===id)!;
 if(dir!==p.direction)return `此零件要${directions[p.direction]}移出。換個方向檢查空間。`;
 const blocked=obstacle(d,s,id,dir);if(blocked)return `路徑被「${blocked.name.slice(3)}」擋住；先移開它，或在設計階段改變構造。`;
 if(removing&&!s.released.includes(id))return '先使用適合工具解除固定。';
 return null;
}
export function release(d:Upgrade[],s:State,id:Id,tool:Tool,dir:Direction):{state:State;error?:string}{
 const error=issue(d,s,id,dir);if(error)return {state:s,error};
 if(s.released.includes(id))return {state:s,error:'固定已解除，下一步移出零件。'};
 const p=parts(d).find(x=>x.id===id)!;if(tool!==p.tool)return {state:s,error:`需要${p.tool}。工具不合不會強行拆卸。`};
 const events:Event[]=[];if(s.tool!==tool)events.push({label:`準備 ${tool}`,seconds:6,kind:'tool',id});
 events.push({label:`${p.name.slice(3)}：定位與解除固定`,seconds:p.seconds+(p.screws?(d.includes('screws')?2:4):0),kind:'release',id});
 return {state:{...s,tool,released:[...s.released,id],events:[...s.events,...events]}};
}
export function remove(d:Upgrade[],s:State,id:Id,dir:Direction):{state:State;error?:string}{
 const error=issue(d,s,id,dir,true);if(error)return {state:s,error};
 return {state:{...s,removed:[...s.removed,id],events:[...s.events,{label:`移出${parts(d).find(p=>p.id===id)!.name.slice(3)}`,seconds:4,kind:'remove',id}]}};
}
export function guidedRemove(d:Upgrade[],s:State,id:Id):{state:State;error?:string}{
 const p=parts(d).find(p=>p.id===id)!;const unlocked=s.released.includes(id)?{state:s}:release(d,s,id,p.tool,p.direction);if(unlocked.error)return unlocked;return remove(d,unlocked.state,id,p.direction);
}
export function nextAccessible(d:Upgrade[],s:State):Id|undefined{
 const order:Id[]=d.includes('battery')?['battery','hatch','cap','brace','board','trim','handle','shell']:['cap','brace','battery','board','hatch','trim','handle','shell'];
 return order.find(id=>{const p=parts(d).find(p=>p.id===id)!;return !s.removed.includes(id)&&!issue(d,s,id,p.direction);});
}
export function identify(d:Upgrade[],s:State,id:Id):State{
 if(!s.removed.includes(id)||s.identified.includes(id))return s;
 return {...s,identified:[...s.identified,id],events:[...s.events,{label:`辨識${parts(d).find(p=>p.id===id)!.name.slice(3)}材質`,seconds:d.includes('labels')?2:8,kind:'identify',id}]};
}
export function sort(d:Upgrade[],s:State,id:Id,bin:Bin):{state:State;error?:string}{
 if(!s.identified.includes(id))return {state:s,error:'先查看材質卡，再決定處理途徑。'};
 if((id==='battery'&&bin!=='battery')||(id==='board'&&bin!=='electronics'))return {state:s,error:'此模組需獨立交接給專業處理，不可混入一般材料。'};
 if(s.bins[id]===bin)return {state:s};
 const prior=s.bins[id];const station:Event[]=Object.values(s.bins).includes(bin)?[]:[{label:`確認${bins.find(b=>b.id===bin)!.name}分流規格`,seconds:6,kind:'station',id}];return {state:{...s,bins:{...s.bins,[id]:bin},events:[...s.events,...station,{label:prior?'重新分選':'材料分流',seconds:prior?8:4,kind:prior?'rework':'sort',id}]}};
}
export function complete(d:Upgrade[],s:State){return s.safe&&parts(d).every(p=>s.removed.includes(p.id)&&s.bins[p.id]===p.bin);}
export function standardRun(d:Upgrade[]):State{
 if(!validDesign(d))throw new Error('Invalid design');
 let s={...fresh(),safe:true};
 // Identical policy for both designs: remove safely reachable battery first, then stable ID order.
 const order:Id[]=['battery','hatch','cap','brace','board','trim','handle','shell'];
 for(let loop=0;loop<8;loop++){
  const p=order.map(id=>parts(d).find(x=>x.id===id)!).find(p=>!s.removed.includes(p.id)&&!issue(d,s,p.id,p.direction));
  if(!p)throw new Error('No accessible part');
  s=release(d,s,p.id,p.tool,p.direction).state;s=remove(d,s,p.id,p.direction).state;s=identify(d,s,p.id);s=sort(d,s,p.id,p.bin).state;
 }
 return s;
}
const round=(n:number)=>Math.round(n*100)/100;
export function results(d:Upgrade[],s:State){
 const all=parts(d),seconds=s.events.reduce((n,e)=>n+e.seconds,0),changes=s.events.filter(e=>e.kind==='tool').length;
 const pure=all.filter(p=>s.bins[p.id]===p.bin&&!['battery','electronics','mixed'].includes(p.bin)).reduce((n,p)=>n+p.mass,0);
 const mixed=all.filter(p=>s.bins[p.id]==='mixed'&&p.bin==='mixed').reduce((n,p)=>n+p.mass,0);
 const professional=all.filter(p=>['battery','electronics'].includes(p.bin)&&s.bins[p.id]===p.bin).reduce((n,p)=>n+p.mass,0);
 const unresolved=all.reduce((n,p)=>n+p.mass,0)-pure-mixed-professional;
 const income=round(pure*.009+mixed*.001),labor=round(seconds*.08),processing=round(5+(mixed?3:0)+unresolved*.03),logistics=4;
 const cost=round(logistics+labor+processing-income);
 return {seconds,changes,stations:s.events.filter(e=>e.kind==='station').length,pure,mixed,professional,unresolved,income,labor,processing,logistics,cost,qualified:complete(d,s),total:all.reduce((n,p)=>n+p.mass,0)};
}
export function comparison(d:Upgrade[]){
 const before=results([],standardRun([])),after=results(d,standardRun(d));
 const manufacturing=round(d.reduce((n,id)=>n+upgrades.find(u=>u.id===id)!.manufacture,0)),development=budget(d)*18;
 return {before,after,manufacturing,development,batchSavings:round((before.cost-after.cost-manufacturing)*100-development)};
}
export function restore(raw:string|null):{design:Upgrade[];reflection:string}{
 try{const p=JSON.parse(raw??'{}');return {design:Array.isArray(p.design)&&validDesign(p.design)?p.design:[],reflection:typeof p.reflection==='string'?p.reflection.slice(0,1000):''};}catch{return {design:[],reflection:''};}
}
