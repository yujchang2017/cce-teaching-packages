import type {Simulation,Traveler,Sample,World,Vec} from './types';
export type CrossingKind='none'|'bridge'|'tunnel';
export interface Crossing {kind:CrossingKind;entry:boolean;exit:boolean;guard:boolean;guide:boolean;wide:boolean}
export type AnimalDesign=[Crossing,Crossing];
export const ANIMAL_BUDGET=12;
export const lanes=[-2.3,2.3];
export const emptyCrossing=():Crossing=>({kind:'none',entry:false,exit:false,guard:false,guide:false,wide:false});
export const emptyAnimals=():AnimalDesign=>[emptyCrossing(),emptyCrossing()];
export function animalCost(d:AnimalDesign){return d.reduce((n,c)=>n+(c.kind==='bridge'?4:c.kind==='tunnel'?3:0)+(c.kind==='none'?0:Number(c.entry)+Number(c.exit)+Number(c.guard)+Number(c.guide)+Number(c.wide)*2),0)}
export function cleanAnimals(raw:unknown):AnimalDesign{
  if(!Array.isArray(raw))return emptyAnimals();
  const d=raw.slice(0,2).map(c=>({kind:['bridge','tunnel'].includes(c?.kind)?c.kind:'none',entry:c?.entry===true,exit:c?.exit===true,guard:c?.guard===true,guide:c?.guide===true,wide:c?.wide===true})) as AnimalDesign;
  if(d.length!==2||animalCost(d)>ANIMAL_BUDGET)return emptyAnimals();
  return d.map(c=>c.kind==='none'?emptyCrossing():c) as AnimalDesign;
}
export function carPosition(t:number,lane:number,scenario=0){return {x:lane===0?-.48:.48,y:.36,z:((t*(lane===0?2.25:-2.05)+lane*4.4+scenario*1.7)%14+14)%14-7};}
const dist=(a:Vec,b:Vec)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
/** Fixed-step, deterministic trajectories. Collision outcomes are computed from world positions. */
export function simulateAnimals(design:AnimalDesign,scenario=0):Simulation{
  const d=cleanAnimals(design),dt=.16,maxTime=42;
  const state=Array.from({length:24},(_,id)=>{
    const spawnZ=-3.9+(id%8)*1.11,spawn={x:-6.2-Math.floor(id/8)*.27,y:.16,z:spawnZ};
    const options=d.map((c,i)=>({c,i,distance:Math.abs(spawnZ-lanes[i])})).filter(o=>o.c.kind!=='none'&&o.distance<=(o.c.guide?4.6:1.25)).sort((a,b)=>a.distance-b.distance);
    const choice=options[0],lane=choice?.i??-1,c=choice?.c,z=lane<0?spawnZ:lanes[lane];
    const surface=c?.kind==='bridge'?2.15:c?.kind==='tunnel'?-.9:0;
    const route:Vec[]=lane<0?[{x:-1.6,y:.16,z:spawnZ},{x:1.8,y:.16,z:spawnZ},{x:6,y:.16,z:Math.abs(spawnZ)>3.5?Math.sign(spawnZ)*6.2:spawnZ*.4}]:[
      {x:-3.2,y:.16,z},{x:-2.6,y:.16,z},
      {x:-1.1,y:surface+.16,z},{x:1.1,y:surface+.16,z},{x:2.6,y:.16,z},{x:5.9,y:.16,z:z*.6}];
    const traveler:Traveler={id,label:`動物 ${String(id+1).padStart(2,'0')}`,origin:'棲地 A',itinerary:['棲地 B'],samples:[{...spawn,t:0,note:'等待出發'}],outcome:'途中',detail:'',completed:0,required:1};
    return {traveler,pos:spawn,route,target:0,lane,c,speed:.58+(id%5)*.055,depart:Math.floor(id/8)*1.5+(id%3)*.18,stuck:0,detachedTime:0,finished:false};
  });
  const finish=(a:typeof state[number],outcome:string,detail:string,t:number)=>{a.finished=true;a.traveler.outcome=outcome;a.traveler.detail=detail;a.traveler.completed=outcome==='抵達'?1:0;a.traveler.samples.push({...a.pos,t,note:detail});};
  for(let tick=1;tick<=Math.floor(maxTime/dt);tick++){
    const t=tick*dt,previous=state.map(a=>({...a.pos}));
    state.forEach((a,id)=>{
      if(a.finished)return;
      if(t<a.depart){a.traveler.samples.push({...a.pos,t,note:'等待出發'});return;}
      const target=a.route[a.target],before={...a.pos};
      let blocked=false;
      if(a.c?.kind==='bridge'&&a.target===2&&!a.c.entry&&a.pos.x>-2.65){blocked=true;a.stuck+=dt;}
      if(a.c?.kind==='bridge'&&a.target===4&&!a.c.exit){a.pos.y=Math.max(.16,a.pos.y-dt*5);if(a.pos.y<.6){finish(a,'跌落','橋尾沒有下坡接合，離開橋面後跌落。',t);return;}blocked=true;}
      const inCrossing=Math.abs(a.pos.x)<2.7;
      if(a.c&&inCrossing){
        const gap=a.c.wide?.34:.68;
        if(state.some((b,j)=>j!==id&&!b.finished&&b.lane===a.lane&&previous[j].x>before.x&&previous[j].x-before.x<gap&&Math.abs(previous[j].z-before.z)<(a.c?.wide?.27:.7)))blocked=true;
      }
      if(!blocked){
        const length=dist(a.pos,target),move=Math.min(length,a.speed*dt);
        if(length>0){a.pos.x+=(target.x-a.pos.x)/length*move;a.pos.y+=(target.y-a.pos.y)/length*move;a.pos.z+=(target.z-a.pos.z)/length*move;}
        if(a.c&&Math.abs(a.pos.x)<1.05){
          const deviation=Math.sin(a.pos.x*1.8+id*.92)*(.16+(id%4)*.055);
          const half=a.c.wide?.65:.24;
          if(a.c.kind==='bridge'&&!a.c.guard&&Math.abs(deviation)>half){a.pos.z=lanes[a.lane]+deviation;a.pos.y-=.8;finish(a,'跌落','窄橋沒有護欄，行走偏移超出橋面邊緣。',t);return;}
          a.pos.z=lanes[a.lane]+Math.max(-half+.09,Math.min(half-.09,deviation));
        }
        if(dist(a.pos,target)<.15){a.target++;if(a.target===a.route.length){if(Math.abs(a.pos.z)>5){finish(a,'失蹤','未進入工程導引，走入非目標的林地邊界。',t);}else{finish(a,'抵達','已進入棲地 B。',t);}return;}}
      }
      // Cars occupy the road surface; a bridge above or tunnel below cannot collide with them.
      if(a.pos.y>-.1&&a.pos.y<.65){for(let l=0;l<2;l++){const car=carPosition(t,l,scenario);if(Math.abs(car.x-a.pos.x)<.38&&Math.abs(car.z-a.pos.z)<.62){finish(a,'路殺','動物仍在平面道路上，與行進車輛接觸。',t);return;}}}
      const peers=state.filter((b,j)=>j!==id&&!b.finished&&Math.floor(j/8)===Math.floor(id/8));
      const nearest=peers.length?Math.min(...peers.map(b=>dist(a.pos,b.pos))):0;
      a.detachedTime=nearest>2.4?a.detachedTime+dt:0;
      if(a.detachedTime>2)a.traveler.detached=true;
      a.traveler.samples.push({...a.pos,t,note:blocked?(a.stuck?'橋頭缺少上坡接合，無法上橋':'在窄口等待前方動物'):a.detachedTime>2?'與同伴拉開距離，脫群中':'自行移動'});
    });
    if(state.every(a=>a.finished))break;
  }
  state.forEach(a=>{if(!a.finished)finish(a,a.detachedTime>2?'脫群未抵達':'受困／逾時',a.stuck?'橋頭高度不連續，無法上橋。':a.detachedTime>2?'與同伴拉開距離，時限內未抵達。':'通道等待或路徑太長，時限內未抵達。',maxTime);});
  const travelers=state.map(a=>a.traveler),counts:Record<string,number>={};travelers.forEach(a=>counts[a.outcome]=(counts[a.outcome]??0)+1);
  const success=counts['抵達']??0;
  return {travelers,duration:Math.max(...travelers.map(a=>a.samples.at(-1)!.t)),success,total:24,counts,score:success/24};
}
export function animalWorld(d:AnimalDesign):World{
  const shapes:World['shapes']=[{kind:'box',x:0,y:-1.4,z:0,w:14,h:.5,d:11,color:0xbaa589},{kind:'box',x:-4.9,y:-.5,z:0,w:4.2,h:1,d:11,color:0x8ca77a},{kind:'box',x:4.9,y:-.5,z:0,w:4.2,h:1,d:11,color:0xabc18a},{kind:'box',x:0,y:-.08,z:0,w:2,h:.16,d:11,color:0x616873}];
  // Cut actual openings into the ground at tunnel approaches, rather than covering ramps with grass.
  const gaps=d.flatMap((c,i)=>c.kind==='tunnel'?[[lanes[i]-(c.wide?.8:.4),lanes[i]+(c.wide?.8:.4)]]:[]);
  const edges=[-5.5,...gaps.flat(),5.5];
  for(let k=0;k<edges.length-1;k+=2)for(const side of [-1,1])shapes.push({kind:'box',x:side*2.05,y:-.5,z:(edges[k]+edges[k+1])/2,w:1.5,h:1,d:edges[k+1]-edges[k],color:side<0?0x8ca77a:0xabc18a});
  for(let z=-5;z<=5;z+=1.1)shapes.push({kind:'box',x:0,y:.012,z,w:.06,h:.01,d:.5,color:0xf4d696});
  // Unbuilt road crossings have level shoulders.
  for(let z=-4.5;z<=4.5;z+=.5)if(!lanes.some((v,i)=>d[i].kind==='tunnel'&&Math.abs(v-z)<.7))for(const x of [-1.13,1.13])shapes.push({kind:'box',x,y:-.2,z,w:.3,h:.4,d:.5,color:0xb5ae8a});
  lanes.forEach((z,i)=>{
    const c=d[i],pick=`lane:${i}`;
    shapes.push({kind:'box',x:-3,y:.04,z,w:1.3,h:.06,d:1.4,color:c.kind==='none'?0xd8bc76:0xe9d7a4,pick});
    if(c.kind==='none')return;
    const width=c.wide?1.3:.48;
    if(c.kind==='bridge'){
      shapes.push({kind:'box',x:0,y:2.06,z,w:2.25,h:.18,d:width,color:0xc3915e});
      for(const x of [-.9,.9])shapes.push({kind:'box',x,y:1,z,w:.12,h:2,d:.12,color:0x7d6855});
      for(const side of [-1,1])if(side<0?c.entry:c.exit)for(let j=0;j<10;j++){const x=side*(1.1+(j+.5)*.15),h=2.15*(1-(j+.5)/10);shapes.push({kind:'box',x,y:h/2,z,w:.17,h:Math.max(.04,h),d:width,color:0xb5a479});}
      if(c.guard)for(const side of [-1,1])shapes.push({kind:'box',x:0,y:2.45,z:z+side*width/2,w:2.3,h:.1,d:.07,color:0x57796b});
    }else{
      shapes.push({kind:'box',x:0,y:-.95,z,w:2.5,h:.1,d:width,color:0xd4cbb2});
      for(const side of [-1,1])shapes.push({kind:'box',x:0,y:-.48,z:z+side*(width/2+.05),w:2.5,h:.95,d:.1,color:0x98998c});
      for(const side of [-1,1])for(let j=0;j<8;j++)shapes.push({kind:'box',x:side*(1.1+(j+.5)*.19),y:-.9+(j+.5)*.1125,z,w:.22,h:.08,d:width,color:0xccbc98});
    }
    if(c.guide)for(const sign of [-1,1])for(let j=0;j<4;j++)shapes.push({kind:'box',x:-3.1+j*.28,y:.3,z:z+sign*(1.1-j*.2),w:.35,h:.6,d:.08,color:0x648271});
  });
  for(const x of [-6.5,6.5])for(const z of [-4.8,-1,1,4.8])shapes.push({kind:'tree',x,y:0,z,w:.6,h:1.3,d:.6,color:0x52774f});
  return {shapes,markers:[{x:-5.5,y:1.1,z:-4.6,text:'棲地 A · 出發'},{x:5.5,y:1.1,z:-4.6,text:'棲地 B · 抵達'},{x:-3,y:.9,z:-2.3,text:'北側工程區'},{x:-3,y:.9,z:2.3,text:'南側工程區'}]};
}
