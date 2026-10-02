'use client';
// 雨水管理「活動簡單版」：一個畫面、點地圖放設施、立即看結果。水量全部來自 hydrology.ts，不另行計算。
import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useGameEvents} from '@/lib/useGameEvents';
import {simulate,meetsChallenge,placementIssue,elevation,sites,facilityInfo,EXTENT,BUDGET,MAX_FACILITIES,RAIN_COUNT,type Facility,type FacilityKind,type Run} from './hydrology';
import './water-quick.css';

// 3D 場景只在按「看雨水怎麼流」時才下載。
const Scene=dynamic(()=>import('./WatershedScene'),{ssr:false,loading:()=> <div className="wq-anim-loading">正在準備立體地形…</div>});

// 地圖座標：上方是上游（雨下的地方），下方是出口（左：溪流，右：學校）。
const S=62.5,PADX=30,PT=56,T=EXTENT*2*S,PB=104,VBW=PADX*2+T,VBH=PT+T+PB;
const X=(x:number)=>PADX+(x+EXTENT)*S,Y=(z:number)=>PT+(z+EXTENT)*S;
const LETTERS='ABCDEFGHI';
// 平易的地點名稱（完整版的 label 含「分水嶺」等詞，簡單版不顯示）。
const NAMES=['左坡高處','山脊高處','右坡高處','左坡中段','山脊中段','右坡中段','左坡低處','山脊低處','右坡低處'];
const KIND={garden:{name:'雨水花園',what:'讓水滲進土裡',color:'#5f9d4f'},tank:{name:'集水槽',what:'把水存起來',color:'#c2a466'}} as const;
const DEST_COLOR={school:'#e0804f',stream:'#4aa8d0',ground:'#3d9a72',tank:'#4f78c4',pooled:'#9aa9ad'} as const;
const BANDS=['#9fcf95','#b2d89c','#c4dfa2','#d4e4a8','#e0e2ad','#e7d9a8','#e5cc9b','#dcbd8b','#d0ad7c'];
const GOALS=[
  {key:'school',label:'流進學校',rule:'≤ 12',ok:(r:Run)=>r.totals.school<=12,color:DEST_COLOR.school},
  {key:'ground',label:'滲進土裡',rule:'≥ 12',ok:(r:Run)=>r.totals.ground>=12,color:DEST_COLOR.ground},
  {key:'stream',label:'溪裡留住的水',rule:'≥ 24',ok:(r:Run)=>r.totals.stream>=24,color:DEST_COLOR.stream},
] as const;
const id=(i:number)=>LETTERS[i];
const cost=(list:Facility[])=>list.reduce((n,f)=>n+facilityInfo[f.kind].cost,0);

// 等高色帶：用畫布畫成一張小圖，地形與水流模型共用 elevation()。
function useReliefImage(){
  const [url,setUrl]=useState('');
  useEffect(()=>{
    const N=240,c=document.createElement('canvas');c.width=N;c.height=N;const g=c.getContext('2d');if(!g)return;
    const img=g.createImageData(N,N),lo=.75,step=.45,band=(x:number,z:number)=>Math.max(0,Math.min(BANDS.length-1,Math.floor((elevation(x,z)-lo)/step)));
    const at=(i:number)=>-EXTENT+(i+.5)/N*EXTENT*2;
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){
      const b=band(at(i),at(j)),edge=i<N-1&&band(at(i+1),at(j))!==b||j<N-1&&band(at(i),at(j+1))!==b;
      const hex=BANDS[b],k=(j*N+i)*4,dark=edge?.8:1;
      img.data[k]=parseInt(hex.slice(1,3),16)*dark;img.data[k+1]=parseInt(hex.slice(3,5),16)*dark;img.data[k+2]=parseInt(hex.slice(5,7),16)*dark;img.data[k+3]=255;
    }
    g.putImageData(img,0,0);setUrl(c.toDataURL());
  },[]);
  return url;
}

function Pill({x,y,text,font=28,color='#2c4a4f',anchor='middle'}:{x:number;y:number;text:string;font?:number;color?:string;anchor?:'start'|'middle'|'end'}){
  const w=text.length*font+font*.8,h=font*1.45,x0=anchor==='start'?x:anchor==='end'?x-w:x-w/2;
  return <g className="wq-pill" aria-hidden="true"><rect x={x0} y={y-h/2} width={w} height={h} rx={h/2} fill="#fffef8" fillOpacity={.95} stroke="#c9d3c4" strokeWidth={1.5}/><text x={x0+w/2} y={y+font*.36} fontSize={font} textAnchor="middle" fill={color} fontWeight="bold">{text}</text></g>;
}
function Cloud({x,y,s=1}:{x:number;y:number;s?:number}){
  return <g aria-hidden="true" transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" stroke="#9fb9c4" strokeWidth={2.5}><path d="M-46 14 a18 18 0 0 1 6 -32 a26 26 0 0 1 48 -6 a20 20 0 0 1 34 12 a16 16 0 0 1 4 26z"/></g>;
}
function School({x,y}:{x:number;y:number}){
  return <g aria-hidden="true"><ellipse cx={x} cy={y+28} rx={64} ry={7} fill="#00000018"/><line x1={x+42} y1={y-22} x2={x+42} y2={y-48} stroke="#5d5d5d" strokeWidth={3}/><path d={`M${x+42} ${y-48} l22 6 l-22 6z`} fill="#d9534f"/><rect x={x-54} y={y-22} width={108} height={48} rx={4} fill="#f3e6c4" stroke="#8a6a45" strokeWidth={3}/><rect x={x-60} y={y-29} width={120} height={10} rx={3} fill="#c4774f"/>{[-40,-22,12,30].map(d=><rect key={d} x={x+d} y={y-10} width={11} height={11} fill="#d6eef2" stroke="#8a6a45" strokeWidth={2}/>)}<rect x={x-8} y={y+5} width={16} height={21} fill="#8a6a45"/></g>;
}

// Hand the current facilities to the full 3D lab (WatershedLab restores this key); keep its history and reflection.
const FULL_KEY='cce-watershed-lab-v2';
function carryTo3D(facilities:Facility[]){
  try{const raw=localStorage.getItem(FULL_KEY);const s=raw?JSON.parse(raw):null;const base=s&&s.version===2?s:{version:2,history:[],reflection:''};
    localStorage.setItem(FULL_KEY,JSON.stringify({...base,facilities}));}catch{/* 3D view simply starts empty */}
}

export default function WaterQuick(){
  const telemetry=useGameEvents('water');
  const [facilities,setFacilities]=useState<Facility[]>([]),[open,setOpen]=useState<number|null>(null);
  const [message,setMessage]=useState<{text:string;warn:boolean}|null>(null),[compact,setCompact]=useState(false);
  const [anim,setAnim]=useState(false),[time,setTime]=useState(0),[reduced,setReduced]=useState(false);
  const mapRef=useRef<HTMLDivElement>(null),closeRef=useRef<HTMLButtonElement>(null),popRef=useRef<HTMLDivElement>(null);
  const relief=useReliefImage();
  const baseline=useMemo(()=>simulate([]),[]);
  const run=useMemo(()=>simulate(facilities),[facilities]);
  const passed=meetsChallenge(run),used=cost(facilities),left=BUDGET-used;
  const at=(i:number)=>facilities.find(f=>f.id===id(i));

  useEffect(()=>{setReduced(matchMedia('(prefers-reduced-motion: reduce)').matches);},[]);
  // 警告訊息幾秒後自動收起（手機上它浮在畫面底部）。
  useEffect(()=>{if(!message?.warn)return;const t=setTimeout(()=>setMessage(null),4500);return()=>clearTimeout(t);},[message]);
  useEffect(()=>{const el=mapRef.current;if(!el)return;const ro=new ResizeObserver(()=>setCompact(el.clientWidth<450));ro.observe(el);return()=>ro.disconnect();},[]);
  // 小選單放在地點旁邊（左半邊的地點放右側、右半邊的放左側），並限制在地圖與畫面內。
  const [popAt,setPopAt]=useState<{left:number;top:number}|null>(null);
  useLayoutEffect(()=>{
    const map=mapRef.current,pop=popRef.current;if(open===null||!map||!pop){setPopAt(null);return;}
    const place=()=>{const mw=map.clientWidth,mh=map.clientHeight,w=pop.offsetWidth,h=pop.offsetHeight,k=mw/VBW,sx=X(sites[open].x)*k,sy=Y(sites[open].z)*k,gap=44*k+8,ml=map.getBoundingClientRect().left;
      let left=sites[open].x<=0?sx+gap:sx-gap-w;left=Math.max(4-ml,Math.min(document.documentElement.clientWidth-ml-w-4,left));
      setPopAt({left,top:Math.max(0,Math.min(mh-h,sy-h/2))});};
    place();const ro=new ResizeObserver(place);ro.observe(map);return()=>ro.disconnect();
  },[open,facilities]);
  useEffect(()=>{if(popAt)popRef.current?.scrollIntoView({block:'nearest',behavior:'instant'});},[popAt]);
  useEffect(()=>{if(open===null)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(null);};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[open]);

  // 「完成一次布置」＝放滿 2 個設施（預算 5 點最多只夠 2 個，所以 2 個就是放滿）。
  function change(next:Facility[]){
    telemetry.ensureStart({phase:'quick'});
    setFacilities(next);
    if(next.length===MAX_FACILITIES){const r=simulate(next);telemetry.complete({phase:'quick',facilities:next.length,...r.totals,passed:meetsChallenge(r)});}
  }
  function tapSite(i:number){
    if(open===i){setOpen(null);return;}
    if(!at(i)&&facilities.length>=MAX_FACILITIES){setOpen(null);setMessage({text:`最多 ${MAX_FACILITIES} 個設施，先點一個拿掉`,warn:true});return;}
    setOpen(i);
  }
  function choose(i:number,kind:FacilityKind){
    const current=at(i),rest=facilities.filter(f=>f.id!==id(i));
    if(current?.kind===kind){setOpen(null);return;}
    const need=facilityInfo[kind].cost,have=BUDGET-cost(rest);
    if(need>have){setMessage({text:`預算不夠：${KIND[kind].name}要 ${need} 點，只剩 ${have} 點。改放雨水花園，或先拿掉一個。`,warn:true});return;}
    const next:Facility={id:id(i),kind,x:sites[i].x,z:sites[i].z};
    const issue=placementIssue(facilities,next,current?id(i):undefined);
    if(issue){setMessage({text:issue,warn:true});return;}
    setOpen(null);setMessage({text:`已在 ${id(i)}（${NAMES[i]}）放${KIND[kind].name}`,warn:false});
    change(current?facilities.map(f=>f.id===id(i)?next:f):[...facilities,next]);
  }
  function remove(i:number){setOpen(null);setMessage({text:`已拿掉 ${id(i)} 的設施`,warn:false});change(facilities.filter(f=>f.id!==id(i)));}
  function reset(){telemetry.cancel();setFacilities([]);setOpen(null);setMessage(null);setAnim(false);}
  function openAnim(){setOpen(null);setTime(reduced?100:0);setAnim(true);}

  // 動畫：沿用完整版的時間推進（0→100，約 7.5 秒）。
  useEffect(()=>{if(!anim||time>=100)return;let raf=0,last=performance.now();const tick=(now:number)=>{const d=Math.min(80,now-last);last=now;setTime(t=>Math.min(100,t+d/75));raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[anim,time>=100]);
  useEffect(()=>{if(!anim)return;closeRef.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setAnim(false);};window.addEventListener('keydown',key);const prev=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{window.removeEventListener('keydown',key);document.body.style.overflow=prev;};},[anim]);
  const finished=time>=100;
  // 與 3D 場景相同的到達判定，讓上方數字跟著水滴一起跳。
  const arrived=run.parcels.filter((_,i)=>Math.max(0,Math.min(1,(time/100-(i/RAIN_COUNT)*.34)/.66))>=.999);
  const nowCount=(d:keyof Run['totals'])=>arrived.filter(p=>p.destination===d).length;

  // 地圖上的水路：把 72 份雨水走過的每一小段合併，線越粗代表越多水走這裡。
  const flows=useMemo(()=>{
    const segs=new Map<string,{a:{x:number;z:number};b:{x:number;z:number};n:number;by:Record<string,number>}>();
    for(const p of run.parcels)for(let k=1;k<p.path.length;k++){
      const a=p.path[k-1],b=p.path[k];if(a.x===b.x&&a.z===b.z)continue;
      const key=`${a.x.toFixed(2)},${a.z.toFixed(2)},${b.x.toFixed(2)},${b.z.toFixed(2)}`;
      const s=segs.get(key)??{a,b,n:0,by:{}};s.n++;s.by[p.destination]=(s.by[p.destination]??0)+1;segs.set(key,s);
    }
    return [...segs.values()].map(s=>({...s,dest:Object.entries(s.by).sort((p,q)=>q[1]-p[1])[0][0] as keyof typeof DEST_COLOR})).sort((p,q)=>p.n-q.n);
  },[run]);
  const ridge=useMemo(()=>Array.from({length:49},(_,k)=>{const z=-EXTENT+k*.2;return `${X(.28*Math.sin(z*.65)).toFixed(1)},${Y(z).toFixed(1)}`;}).join(' '),[]);
  const drops=useMemo(()=>baseline.parcels.map(p=>p.path[0]),[baseline]);

  const failing=GOALS.filter(g=>!g.ok(run));
  const dry=facilities.find(f=>!run.captured[f.id]);
  const status=facilities.length===0?'點地圖上白色的 A–I，放第一個設施':passed?'過關！三個目標都做到了':facilities.length<MAX_FACILITIES?'再放一個設施試試看':
    dry?`${dry.id} 沒接到水：放在藍色、橘色水路經過的地方`:failing[0].key==='school'?'學校的水還太多：流進學校的水是從哪邊來的？':failing[0].key==='stream'?'溪裡的水變太少了：別把溪流那邊的水都攔走':'滲進土裡的水不夠：多用雨水花園試試';
  const font=28;

  const map=<svg className="wq-svg" viewBox={`0 0 ${VBW} ${VBH}`} role="group" aria-label="山坡地圖：點白色 A–I 放設施或拿掉設施" onClick={e=>{if(e.target===e.currentTarget)setOpen(null);}}>
    <rect x={0} y={0} width={VBW} height={VBH} rx={26} fill="#e8efe3" onClick={()=>setOpen(null)}/>
    {relief?<image href={relief} x={PADX} y={PT} width={T} height={T} preserveAspectRatio="none" onClick={()=>setOpen(null)}/>:<rect x={PADX} y={PT} width={T} height={T} fill={BANDS[3]}/>}
    <rect x={PADX} y={PT} width={T} height={T} fill="none" stroke="#a8b79c" strokeWidth={3} rx={4} aria-hidden="true"/>
    {/* 雲與雨：雨點位置就是模型裡 72 份雨水的起點 */}
    <Cloud x={130} y={30} s={.9}/><Cloud x={VBW-130} y={30} s={.9}/>
    <g aria-hidden="true" stroke="#5a9fc6" strokeWidth={3} strokeLinecap="round" opacity={.55}>{drops.map((d,i)=><line key={i} x1={X(d.x)-3} y1={Y(d.z)-11} x2={X(d.x)+1} y2={Y(d.z)-1}/>)}</g>
    {/* 山脊：最高的一條線，雨水在這裡分成左右兩邊 */}
    <polyline points={ridge} fill="none" stroke="#9b7346" strokeWidth={3.5} strokeDasharray="12 9" aria-hidden="true"/>
    {/* 下方：左邊溪流、右邊學校 */}
    <path d={`M${PADX} ${PT+T+40} C ${X(-3.6)} ${PT+T+20}, ${X(-2.4)} ${PT+T+62}, ${X(-1.2)} ${PT+T+38} S ${X(-.2)} ${PT+T+30}, ${X(.1)} ${PT+T+44}`} fill="none" stroke="#7cc3dc" strokeWidth={34} strokeLinecap="round" aria-hidden="true"/>
    <path d={`M${X(-3.8)} ${PT+T+36} q12 -8 24 0 t24 0 M${X(-1.9)} ${PT+T+44} q12 -8 24 0 t24 0`} fill="none" stroke="#fff" strokeOpacity={.8} strokeWidth={3} strokeLinecap="round" aria-hidden="true"/>
    <rect x={X(.9)} y={PT+T+82} width={VBW-X(.9)} height={16} fill="#b9b2a5" aria-hidden="true"/>
    {run.totals.school>0&&<ellipse cx={X(1.6)+30} cy={PT+T+40} rx={30+run.totals.school*2.2} ry={10+run.totals.school*.5} fill="#6aaac4" opacity={.55} aria-hidden="true"/>}
    <School x={X(2.7)} y={PT+T+48}/>
    {/* 水路線 */}
    <g aria-hidden="true" strokeLinecap="round">{flows.map((s,k)=><line key={k} x1={X(s.a.x)} y1={Y(s.a.z)} x2={X(s.b.x)} y2={Y(s.b.z)} stroke={DEST_COLOR[s.dest]} strokeWidth={3+s.n*.32} strokeOpacity={.85}/>)}</g>
    <g aria-hidden="true">{flows.filter(s=>s.n>=6&&Math.abs(s.b.z/1.2-Math.round(s.b.z/1.2))<.01&&s.b.z>s.a.z).map((s,k)=>{const mx=(X(s.a.x)+X(s.b.x))/2,my=(Y(s.a.z)+Y(s.b.z))/2,ang=Math.atan2(Y(s.b.z)-Y(s.a.z),X(s.b.x)-X(s.a.x))*180/Math.PI;
      return <path key={k} d="M-7 -8 L5 0 L-7 8" transform={`translate(${mx} ${my}) rotate(${Math.round(ang)})`} fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"/>;})}</g>
    {/* 出口水量 */}
    <Pill x={X(-1.6)} y={PT+T+40} text={`溪流 ${run.totals.stream}`} font={font} color="#1f6a8c"/>
    <Pill x={X(1.6)-14} y={PT+T+82} text={`學校 ${run.totals.school}`} font={font} color="#a04a22"/>
    <Pill x={X(.28*Math.sin(-4.3*.65))} y={Y(-4.25)} text="山脊" font={font} color="#7a5631"/>
    {sites.map((s,i)=>{const f=at(i),x=X(s.x),y=Y(s.z),r=f?facilityInfo[f.kind].radius*S:0,got=f?run.captured[f.id]??0:0;
      return <g key={i} className={`wq-spot${f?' placed':''}${open===i?' open':''}`} role="button" tabIndex={0} aria-pressed={!!f} aria-label={`${id(i)} ${NAMES[i]}：${f?`已放${KIND[f.kind].name}，接到 ${got} 份水，點一下更換或拿掉`:'可以放設施'}`} onClick={()=>tapSite(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tapSite(i);}}}>
        <rect x={x-56} y={y-56} width={112} height={112} fill="#000" fillOpacity={0}/>
        <circle className="wq-spot-ring" cx={x} cy={y} r={f?r+6:40} fill="none"/>
        {f?<>{f.kind==='garden'?<><circle cx={x} cy={y} r={r} fill="#5f9d4f" fillOpacity={.88} stroke="#356b34" strokeWidth={3}/>{[0,1,2,3,4,5].map(j=><path key={j} d={`M${x+Math.cos(j*1.05)*r*.72} ${y+Math.sin(j*1.05)*r*.72+6} l-5 -12 m5 12 l0 -14 m0 14 l5 -12`} stroke="#c9e3a0" strokeWidth={3} strokeLinecap="round"/>)}</>:
            <><circle cx={x} cy={y} r={r} fill="#e8d6a6" stroke="#8d7444" strokeWidth={4}/><circle cx={x} cy={y} r={Math.max(4,(r-8)*Math.min(1,got/facilityInfo.tank.capacity))} fill="#4f9fc9"/></>}
          <rect x={x-26} y={y-21} width={52} height={40} rx={10} fill="#fffef8" stroke={got?'#356b34':'#b4462a'} strokeWidth={2.5}/><text x={x} y={y+11} fontSize={30} fontWeight="bold" textAnchor="middle" fill={got?'#24552a':'#b4462a'}>{got}</text>
          <circle cx={x+r*.72} cy={y-r*.72} r={17} fill="#fff" stroke="#2c4a4f" strokeWidth={2.5}/><text x={x+r*.72} y={y-r*.72+8} fontSize={23} fontWeight="bold" textAnchor="middle" fill="#2c4a4f">{id(i)}</text></>:
          <><circle cx={x} cy={y} r={29} fill="#fffef8" fillOpacity={.92} stroke="#6f8a83" strokeWidth={3.5} strokeDasharray="8 6"/><text x={x} y={y+13} fontSize={38} fontWeight="bold" textAnchor="middle" fill="#2f5753">{id(i)}</text></>}
      </g>;})}
    <Pill x={VBW/2} y={30} text="雨下在這一帶" font={font} color="#2e6d8e"/>
  </svg>;

  return <main className={`wq${reduced?' wq-reduced':''}`}>
    <div className="wq-top">
      <p className="wq-intro"><b>大雨來了！</b>在山坡上放 2 個設施，把雨水留住、讓它滲進土裡，別讓學校淹水。</p>
      <Link className="wq-full" href="/missions/water/3d/" onClick={()=>carryTo3D(facilities)}>全 3D 檢視 ▶</Link>
    </div>
    <div className="wq-body">
      <section className={`wq-result${passed?' pass':''}`} aria-live="polite">
        <p className="wq-line">流進學校的水：<b className="wq-big">{run.totals.school}</b> 份<span className="wq-base">原本 {baseline.totals.school} 份</span></p>
        <p className={`wq-status${passed?' pass':''}`}>{status}</p>
        <ul className="wq-goals" aria-label="三個目標">{GOALS.map(g=>{const v=run.totals[g.key],ok=g.ok(run);return <li key={g.key} className={ok?'ok':''}>
          <span className="wq-mark" aria-hidden="true">{ok?'✓':'✗'}</span><span className="wq-goal-name">{g.label}<small>{g.rule} 份</small></span>
          <span className="wq-bar" aria-hidden="true"><i style={{width:`${Math.min(100,v/36*100)}%`,background:g.color}}/><em style={{left:`${12/36*100}%`}}/></span>
          <b>{v}</b><span className="wq-sr">{ok?'做到了':'還沒做到'}</span></li>;})}</ul>
        <div className="wq-legend"><span><i style={{background:DEST_COLOR.school}}/>流向學校</span><span><i style={{background:DEST_COLOR.stream}}/>流向溪流</span><span><i style={{background:DEST_COLOR.ground}}/>滲進土裡</span><span><i style={{background:DEST_COLOR.tank}}/>存進集水槽{run.totals.tank>0?` ${run.totals.tank} 份`:''}</span>
          <details className="wq-what"><summary>山脊是什麼？</summary><span>山脊是山最高的那一條線（地圖上咖啡色虛線）。雨落在左邊，就往左流到溪裡；落在右邊，就往右流向學校。</span></details></div>
      </section>
      <div className="wq-map" ref={mapRef}>{map}
        {open!==null&&<div ref={popRef} className="wq-pop" style={popAt?{left:popAt.left,top:popAt.top}:{left:0,top:0,visibility:'hidden'}} role="dialog" aria-label={`${id(open)} ${NAMES[open]}：選擇設施`}>
          <div className="wq-pop-head"><b>{id(open)}・{NAMES[open]}</b><button type="button" className="wq-x" aria-label="關閉" onClick={()=>setOpen(null)}>×</button></div>
          {(['garden','tank'] as const).map(k=>{const cur=at(open)?.kind===k,have=BUDGET-cost(facilities.filter(f=>f.id!==id(open))),short=facilityInfo[k].cost>have;
            return <button key={k} type="button" className={`wq-pick ${k}${cur?' cur':''}${short?' short':''}`} aria-disabled={short} onClick={()=>choose(open,k)}><i aria-hidden="true"/><span><b>{KIND[k].name}</b><small>{KIND[k].what}</small></span><em>{cur?'已放 ✓':short?'預算不夠':`${facilityInfo[k].cost} 點`}</em></button>;})}
          {at(open)&&<button type="button" className="wq-remove" onClick={()=>remove(open)}>拿掉這個設施</button>}
        </div>}
      </div>
      <div className="wq-sites" role="group" aria-label="設施位置按鈕">
        <p className="wq-count"><span>預算 <b>{left}</b> / {BUDGET} 點<span className="wq-coins" aria-hidden="true">{Array.from({length:BUDGET},(_,k)=><i key={k} className={k<left?'on':''}/>)}</span></span><span>已放 <b>{facilities.length}</b> / {MAX_FACILITIES} 個</span><span className="wq-prices">雨水花園 {facilityInfo.garden.cost} 點・集水槽 {facilityInfo.tank.cost} 點</span></p>
        <div className="wq-site-buttons">{sites.map((_,i)=>{const f=at(i);return <button key={i} type="button" aria-pressed={!!f} aria-expanded={open===i} className={`${f?`placed ${f.kind}`:''}${open===i?' open':''}`} onClick={()=>tapSite(i)}><b>{id(i)}</b><span>{NAMES[i]}</span><small>{f?KIND[f.kind].name:'空地'}</small></button>;})}</div>
      </div>
      <div className="wq-actions">
        {message&&<p className={`wq-msg${message.warn?' warn':''}`} role="status">{message.text}</p>}
        <div className="wq-buttons"><button type="button" className="wq-primary" onClick={openAnim}>看雨水怎麼流 ▶</button><button type="button" className="wq-secondary" onClick={reset} disabled={facilities.length===0&&!message}>全部重來</button></div>
      </div>
    </div>
    {anim&&<div className="wq-anim" role="dialog" aria-modal="true" aria-label="看雨水怎麼流">
      <div className="wq-anim-card">
        <div className="wq-anim-head"><b>{finished?`雨停了：流進學校 ${run.totals.school} 份（原本 ${baseline.totals.school} 份）`:'下雨中，看水往哪裡流…'}</b><span>學校 {nowCount('school')} · 溪流 {nowCount('stream')} · 滲進土裡 {nowCount('ground')} · 集水槽 {nowCount('tank')}{finished&&passed?' · 過關！':''}</span></div>
        <div className="wq-anim-scene"><Scene facilities={facilities} run={run} time={time} paths={true} section={false} tool="inspect" selected={null} view="orbit" viewNonce={0} locked={true} reduced={reduced} onPlace={()=>{}} onSelect={()=>{}}/></div>
        <div className="wq-anim-foot">{finished?(!reduced&&<button type="button" className="wq-secondary" onClick={()=>setTime(0)}>再看一次 ↻</button>):<button type="button" className="wq-secondary" onClick={()=>setTime(100)}>略過，看結果</button>}<button type="button" ref={closeRef} className="wq-primary" onClick={()=>setAnim(false)}>關閉</button></div>
      </div>
    </div>}
  </main>;
}
