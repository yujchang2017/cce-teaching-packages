import type {Simulation,Traveler,Sample,World} from './types';
export interface Tree {x:number;z:number}
export const SIZE=9,TREE_LIMIT=3,ENERGY_MAX=10,HEAT_THRESHOLD=32;
export const PER_HOME=6,RESIDENTS=12,CENTER=4;
export const homes=[{name:'西側住宅',x:0,z:4},{name:'東側住宅',x:8,z:4}];
export const destinations=[{name:'學校',x:4,z:0},{name:'市場',x:4,z:8}];
export const naturalTrees:Tree[]=[{x:2,z:3}];
export const sites=[{id:'A',x:1,z:5,name:'西側家門口'},{id:'B',x:3,z:1,name:'學校前路段'},{id:'C',x:5,z:3,name:'東側交叉口'},{id:'D',x:7,z:5,name:'東側家門口'},{id:'E',x:5,z:7,name:'市場前路段'},{id:'F',x:3,z:5,name:'西側交叉口'}];
export function isRoad(x:number,z:number){return x===4||z===4;}
export function isBuilding(){return false;}
export function plantable(x:number,z:number){return sites.some(s=>s.x===x&&s.z===z);}
export const plantingSites=Array.from({length:SIZE*SIZE},(_,i)=>({x:i%SIZE,z:Math.floor(i/SIZE)})).filter(t=>plantable(t.x,t.z));
const near=(a:Tree,b:Tree)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z)<=2;
export function temperature(x:number,z:number,trees:Tree[]){
  // Fixed noon map: the central arcade and existing trees provide some baseline shade.
  const base=35;
  const cooled=[...naturalTrees,...trees].some(t=>near(t,{x,z}));
  return base-(cooled?6:0);
}
export function cleanTrees(raw:unknown):Tree[]{
  if(!Array.isArray(raw))return[];const valid:Tree[]=[];
  for(const t of raw){if(valid.length>=TREE_LIMIT)break;if(t&&plantable(t.x,t.z)&&!valid.some(v=>v.x===t.x&&v.z===t.z))valid.push({x:t.x,z:t.z});}
  return valid;
}
export function route(start:Tree,end:Tree):Tree[]{
  const key=(p:Tree)=>`${p.x},${p.z}`,q=[start],parent=new Map<string,Tree|null>([[key(start),null]]);
  for(let i=0;i<q.length;i++){
    const p=q[i];if(key(p)===key(end)){const result:Tree[]=[];let item:Tree|null=p;while(item){result.unshift(item);item=parent.get(key(item))??null;}return result;}
    for(const [dx,dz]of [[1,0],[0,1],[-1,0],[0,-1]]){const n={x:p.x+dx,z:p.z+dz};if(n.x<0||n.z<0||n.x>=SIZE||n.z>=SIZE||!isRoad(n.x,n.z)||parent.has(key(n)))continue;parent.set(key(n),p);q.push(n);}
  }return[];
}
export function errands(id:number){return [id%PER_HOME<3?0:1];}

export function simulateHeat(input:Tree[]):Simulation{
  const trees=cleanTrees(input),travelers:Traveler[]=[];
  for(let id=0;id<RESIDENTS;id++){
    const district=Math.floor(id/PER_HOME),home=homes[district],jobs=errands(id),targets=[...jobs.map(j=>destinations[j]),home];
    let pos:Tree=home,energy=ENERGY_MAX,t=(id%PER_HOME)*.35,completed=0,outcome='途中',detail='',steps=0;
    const samples:Sample[]=[{x:home.x-CENTER,y:.1,z:home.z-CENTER,t:0,energy,note:'在家準備出發'},{x:home.x-CENTER,y:.1,z:home.z-CENTER,t,energy,note:'出發'}];
    for(let leg=0;leg<targets.length;leg++){
      const path=route(pos,targets[leg]);
      if(!path.length){outcome='路徑不通';detail='無法到達指定地點。';break;}
      let stopped=false;
      for(const next of path.slice(1)){
        t+=.65;steps++;const temp=temperature(next.x,next.z,trees),delta=temp>=HEAT_THRESHOLD?-1:1;energy=Math.min(ENERGY_MAX,energy+delta);pos=next;
        samples.push({x:pos.x-CENTER,y:.1,z:pos.z-CENTER,t,energy,note:`${leg===jobs.length?'返家':`前往${targets[leg].name}`} · (${pos.x+1},${pos.z+1}) ${temp}°C · 體力 ${delta>0?'+1':'−1'}`});
        if(energy<=0){outcome=leg===jobs.length?'回程耗盡':completed===0?'去程耗盡':'辦事途中耗盡';detail=`${outcome}：在第 ${steps} 格 (${pos.x+1},${pos.z+1}) 體力歸零，需協助。`;stopped=true;break;}
      }
      if(stopped)break;
      if(leg<jobs.length){completed++;t+=.65;samples.push({x:pos.x-CENTER,y:.1,z:pos.z-CENTER,t,energy,note:`辦完${targets[leg].name}，體力不自動補滿`});}
      else{outcome='安全返家';detail=`完成 ${jobs.length} 件事，返家剩餘體力 ${energy} / ${ENERGY_MAX}。`;}
    }
    travelers.push({id,label:`居民 ${String(id+1).padStart(2,'0')}`,origin:home.name,itinerary:targets.map(v=>v.name),samples,outcome,detail,energy,completed,required:jobs.length});
  }
  const counts:Record<string,number>={};travelers.forEach(p=>counts[p.outcome]=(counts[p.outcome]??0)+1);const success=counts['安全返家']??0;
  return{travelers,duration:Math.max(...travelers.map(p=>p.samples.at(-1)!.t)),success,total:RESIDENTS,counts,score:success/RESIDENTS};
}
export function heatWorld(trees:Tree[],preview?:Tree|null,selected?:Tree):World{
  const shapes:World['shapes']=[],markers:World['markers']=[];
  for(let z=0;z<SIZE;z++)for(let x=0;x<SIZE;x++){
    const road=isRoad(x,z),temp=temperature(x,z,trees);
    shapes.push({kind:'box',x:x-CENTER,y:-.13,z:z-CENTER,w:.97,h:.22,d:.97,color:road?(temp<HEAT_THRESHOLD?0x7cb59a:0xe69a64):0xe3e5d5,pick:`tile:${x}:${z}`});
    if(road&&preview&&near(preview,{x,z}))shapes.push({kind:'box',x:x-CENTER,y:.015,z:z-CENTER,w:.86,h:.035,d:.86,color:0x56bfaa,opacity:.65});
  }
  for(const p of sites){
    const planted=trees.some(t=>t.x===p.x&&t.z===p.z),chosen=selected?.x===p.x&&selected?.z===p.z;
    shapes.push({kind:'box',x:p.x-CENTER,y:.015,z:p.z-CENTER,w:.72,h:.09,d:.72,color:chosen?0xffce54:planted?0x65956b:0xfaf8e9,pick:`tile:${p.x}:${p.z}`});
    markers.push({x:p.x-CENTER,y:planted?1.65:.55,z:p.z-CENTER,text:p.id,color:'#6d572a'});
  }
  for(const t of [...naturalTrees,...trees])shapes.push({kind:'tree',x:t.x-CENTER,y:0,z:t.z-CENTER,w:.75,h:1.15,d:.75,color:trees.includes(t)?0x2d8864:0x668967,pick:`tile:${t.x}:${t.z}`});
  for(const [i,d]of destinations.entries()){
    shapes.push({kind:'box',x:d.x-CENTER+.3,y:.4,z:d.z-CENTER,w:.6,h:.8,d:.65,color:i?0xd3a262:0x7fa3bd,pick:`tile:${d.x}:${d.z}`});
    markers.push({x:d.x-CENTER,y:1.2,z:d.z-CENTER,text:d.name});
  }
  homes.forEach(h=>{shapes.push({kind:'box',x:h.x-CENTER,y:.32,z:h.z-CENTER-.4,w:.72,h:.65,d:.48,color:0xb9ad8e,pick:`tile:${h.x}:${h.z}`});markers.push({x:h.x-CENTER,y:1.1,z:h.z-CENTER,text:h.name});});
  markers.push({x:-2,y:1.6,z:-1,text:'既有老樹',color:'#42634b'});
  return{shapes,markers};
}
