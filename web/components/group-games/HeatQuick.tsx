'use client';
// 都市熱島「活動簡單版」：一個畫面、點地圖種樹、立即看結果。模型全部來自 heat.ts，不另行計算。
import {useEffect,useMemo,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useGameEvents} from '@/lib/useGameEvents';
import {simulateHeat,heatWorld,temperature,isRoad,sites,naturalTrees,homes,destinations,SIZE,TREE_LIMIT,HEAT_THRESHOLD,RESIDENTS,PER_HOME,type Tree} from './heat';
import {emptyAnimals} from './animals';
import './heat-quick.css';

// 3D 場景只在按「看大家怎麼走」時才下載。
const Scene=dynamic(()=>import('./GroupScene'),{ssr:false,loading:()=> <div className="hq-anim-loading">正在準備立體場景…</div>});

const CELL=80,PAD=90,VB=PAD*2+CELL*SIZE;
const cx=(x:number)=>PAD+x*CELL+CELL/2;
const SUCCESS='安全返家';
const GROUP_COLOR=['#347ea3','#b86d47'];
const same=(a:Tree,b:Tree)=>a.x===b.x&&a.z===b.z;

function Pill({x,y,text,anchor='middle',font,color='#4a3a2b',tap=false}:{x:number;y:number;text:string;anchor?:'start'|'middle'|'end';font:number;color?:string;tap?:boolean}){
  const w=text.length*font+font*.7,h=font*1.45,x0=anchor==='start'?x:anchor==='end'?x-w:x-w/2;
  return <g className={`hq-pill${tap?' tap':''}`} aria-hidden="true"><rect x={x0} y={y-h/2} width={w} height={h} rx={h/2} fill="#fffdf6" fillOpacity={.94} stroke="#d8c8ad" strokeWidth={1.5}/><text x={x0+w/2} y={y+font*.36} fontSize={font} textAnchor="middle" fill={color} fontWeight="bold">{text}</text></g>;
}
function House({x,y,roof}:{x:number;y:number;roof:string}){
  return <g aria-hidden="true"><ellipse cx={x} cy={y+30} rx={38} ry={7} fill="#00000018"/><rect x={x-30} y={y-16} width={60} height={44} rx={3} fill="#f8f1e2" stroke="#7a644c" strokeWidth={3}/><polygon points={`${x-40},${y-14} ${x},${y-46} ${x+40},${y-14}`} fill={roof} stroke="#5e4a37" strokeWidth={3} strokeLinejoin="round"/><rect x={x-8} y={y+6} width={16} height={22} rx={2} fill="#7a644c"/><rect x={x+12} y={y-6} width={12} height={11} fill="#bfe0f2" stroke="#7a644c" strokeWidth={2}/><rect x={x-24} y={y-6} width={12} height={11} fill="#bfe0f2" stroke="#7a644c" strokeWidth={2}/></g>;
}
function School({x,y}:{x:number;y:number}){
  return <g aria-hidden="true"><ellipse cx={x} cy={y+30} rx={60} ry={7} fill="#00000018"/><line x1={x+40} y1={y-22} x2={x+40} y2={y-46} stroke="#5d5d5d" strokeWidth={3}/><path d={`M${x+40} ${y-46} l22 6 l-22 6z`} fill="#d9534f"/><rect x={x-52} y={y-22} width={104} height={50} rx={4} fill="#dbe9f3" stroke="#4f7590" strokeWidth={3}/><rect x={x-58} y={y-28} width={116} height={9} rx={3} fill="#4f7590"/>{[-38,-20,14,32].map(d=><rect key={d} x={x+d} y={y-10} width={10} height={10} fill="#fff" stroke="#4f7590" strokeWidth={2}/>)}<rect x={x-8} y={y+6} width={16} height={22} fill="#4f7590"/></g>;
}
function Market({x,y}:{x:number;y:number}){
  return <g aria-hidden="true"><ellipse cx={x} cy={y+30} rx={58} ry={7} fill="#00000018"/><rect x={x-48} y={y-6} width={96} height={34} rx={3} fill="#f7ecd9" stroke="#8a6438" strokeWidth={3}/>{[0,1,2,3,4,5].map(i=><rect key={i} x={x-54+i*18} y={y-30} width={18} height={24} fill={i%2?'#fff7e8':'#d3a262'} stroke="#8a6438" strokeWidth={1.5}/>)}<path d={`M${x-54} ${y-6} ${Array(6).fill('q9 10 18 0').join(' ')}`} fill="#d3a262" stroke="#8a6438" strokeWidth={2}/><circle cx={x-24} cy={y+14} r={7} fill="#e7713e"/><circle cx={x-8} cy={y+16} r={6} fill="#8bbf4f"/><circle cx={x+20} cy={y+14} r={7} fill="#f2c14e"/></g>;
}
function TreeIcon({x,y,planted}:{x:number;y:number;planted:boolean}){
  const c=planted?['#2d8864','#4fae80']:['#5f8a62','#7ea77f'];
  return <g aria-hidden="true"><ellipse cx={x+4} cy={y+26} rx={30} ry={9} fill="#00000022"/><rect x={x-4} y={y+6} width={8} height={20} rx={2} fill="#7b5a3c"/><circle cx={x} cy={y-4} r={30} fill={c[0]}/><circle cx={x-12} cy={y+2} r={16} fill={c[0]}/><circle cx={x+12} cy={y+2} r={16} fill={c[0]}/><circle cx={x-8} cy={y-14} r={12} fill={c[1]}/></g>;
}
function Face({ok,color}:{ok:boolean;color:string}){
  return <svg className={`hq-face ${ok?'ok':'tired'}`} viewBox="0 0 40 44" aria-hidden="true">
    <path d="M5 44 Q5 30 20 30 Q35 30 35 44Z" fill={color} opacity={ok?1:.55}/>
    <circle cx={20} cy={17} r={12.5} fill={ok?'#f6d3ac':'#eadbc9'} stroke="#8a6a4d" strokeWidth={1.6}/>
    {ok?<><circle cx={15.5} cy={15} r={1.9} fill="#3b2a1f"/><circle cx={24.5} cy={15} r={1.9} fill="#3b2a1f"/><path d="M14 20 Q20 26.5 26 20" fill="none" stroke="#3b2a1f" strokeWidth={2} strokeLinecap="round"/></>:
      <><path d="M12.5 14.5 l5 1.6 M27.5 14.5 l-5 1.6" stroke="#3b2a1f" strokeWidth={2} strokeLinecap="round"/><path d="M14 23 q3 -3 6 0 t6 0" fill="none" stroke="#3b2a1f" strokeWidth={2} strokeLinecap="round"/><path d="M32 4 q4.5 6.5 0 9 q-4.5 -2.5 0 -9z" fill="#5aa9e6"/></>}
  </svg>;
}

// Hand the current trees to the full 3D game (GroupGame heat restores this key); keep its history and reflection.
const FULL_KEY='cce-group-heat-simple-v2';
function carryTo3D(trees:Tree[]){
  try{const raw=localStorage.getItem(FULL_KEY);const s=raw?JSON.parse(raw):null;const base=s&&s.version===1?s:{version:1,animals:emptyAnimals(),scenario:0,history:[],reflection:''};
    localStorage.setItem(FULL_KEY,JSON.stringify({...base,trees}));}catch{/* 3D view simply starts empty */}
}

export default function HeatQuick(){
  const telemetry=useGameEvents('heat');
  const [trees,setTrees]=useState<Tree[]>([]),[message,setMessage]=useState(''),[compact,setCompact]=useState(false);
  const [anim,setAnim]=useState(false),[time,setTime]=useState(0),[reduced,setReduced]=useState(false);
  const mapRef=useRef<HTMLDivElement>(null),closeRef=useRef<HTMLButtonElement>(null);
  const baseline=useMemo(()=>simulateHeat([]),[]);
  const run=useMemo(()=>simulateHeat(trees),[trees]);
  const world=useMemo(()=>heatWorld(trees),[trees]);
  const passed=run.success>baseline.success,more=run.success-baseline.success;

  useEffect(()=>{setReduced(matchMedia('(prefers-reduced-motion: reduce)').matches);},[]);
  // 「最多 3 棵」提示：幾秒後自動收起（手機上它浮在畫面底部）。
  useEffect(()=>{if(!message.startsWith('最多'))return;const id=setTimeout(()=>setMessage(''),4000);return()=>clearTimeout(id);},[message]);
  // 地圖畫得小時（手機），地圖上只留字母與建築名稱，地點全名看下方按鈕。
  useEffect(()=>{const el=mapRef.current;if(!el)return;const ro=new ResizeObserver(()=>setCompact(el.clientWidth<450));ro.observe(el);return()=>ro.disconnect();},[]);

  function change(next:Tree[]){
    telemetry.ensureStart({phase:'quick'});
    setTrees(next);
    if(next.length===TREE_LIMIT){const r=simulateHeat(next);telemetry.complete({phase:'quick',success:r.success,total:RESIDENTS,successRate:Math.round(r.score*100),trees:TREE_LIMIT,baselineSuccess:baseline.success,passed:r.success>baseline.success});}
  }
  function toggle(at:Tree){
    const site=sites.find(s=>same(s,at));if(!site)return;
    if(trees.some(t=>same(t,at))){setMessage(`已拿掉 ${site.id} 的樹`);change(trees.filter(t=>!same(t,at)));return;}
    if(trees.length>=TREE_LIMIT){setMessage('最多 3 棵，先點一棵樹拿掉');return;}
    setMessage(`已在 ${site.id}（${site.name}）種樹`);change([...trees,{x:at.x,z:at.z}]);
  }
  function reset(){telemetry.cancel();setTrees([]);setMessage('');setAnim(false);}
  function openAnim(){setTime(reduced?run.duration:0);setAnim(true);}

  // 動畫：沿用完整版的時間推進（每秒 3 個模擬時間單位），到 run.duration 停。
  useEffect(()=>{if(!anim||time>=run.duration)return;let raf=0,last=performance.now();const tick=(now:number)=>{const dt=Math.min(100,now-last)/1000;last=now;setTime(t=>Math.min(run.duration,t+dt*3));raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[anim,run,time>=run.duration]);
  useEffect(()=>{if(!anim)return;closeRef.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setAnim(false);};window.addEventListener('keydown',key);const prev=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{window.removeEventListener('keydown',key);document.body.style.overflow=prev;};},[anim]);
  const finished=time>=run.duration;
  const homeNow=run.travelers.filter(p=>time>=p.samples.at(-1)!.t&&p.outcome===SUCCESS).length;
  const stuckNow=run.travelers.filter(p=>time>=p.samples.at(-1)!.t&&p.outcome!==SUCCESS).length;

  const font=compact?36:27,nameFont=27;
  const status=trees.length===0?'點地圖上白色的 A–F 開始種樹':passed?`過關！比原本多 ${more} 人`:trees.length<TREE_LIMIT?'還沒有比原本多，再種一棵看看':'還沒比原本多，換個位置試試';

  const map=<svg className="hq-svg" viewBox={`0 0 ${VB} ${VB}`} role="group" aria-label="社區地圖：點白色 A–F 種樹或拿掉樹">
    <rect x={0} y={0} width={VB} height={VB} rx={28} fill="#efe5cf"/>
    <rect x={PAD-6} y={PAD-6} width={CELL*SIZE+12} height={CELL*SIZE+12} rx={10} fill="#d9c9a8"/>
    {Array.from({length:SIZE*SIZE},(_,i)=>{const x=i%SIZE,z=Math.floor(i/SIZE),road=isRoad(x,z),cool=temperature(x,z,trees)<HEAT_THRESHOLD,x0=PAD+x*CELL,y0=PAD+z*CELL;
      return <g key={i}><rect className="hq-tile" x={x0} y={y0} width={CELL} height={CELL} fill={road?(cool?'#5fae86':'#ea8f55'):(cool?'#cfe8c5':'#f5e3c3')} stroke="#fffaf0" strokeOpacity={.7} strokeWidth={2}/>
        {road&&!cool&&<path d={`M${x0+18} ${y0+26} q7 -8 14 0 t14 0 t14 0 M${x0+18} ${y0+58} q7 -8 14 0 t14 0 t14 0`} fill="none" stroke="#fff3e6" strokeOpacity={.75} strokeWidth={3} strokeLinecap="round" aria-hidden="true"/>}</g>;})}
    <line x1={PAD} y1={cx(4)} x2={PAD+CELL*SIZE} y2={cx(4)} stroke="#fff" strokeOpacity={.8} strokeWidth={3} strokeDasharray="16 14" aria-hidden="true"/>
    <line x1={cx(4)} y1={PAD} x2={cx(4)} y2={PAD+CELL*SIZE} stroke="#fff" strokeOpacity={.8} strokeWidth={3} strokeDasharray="16 14" aria-hidden="true"/>
    {/* 住家、學校、市場：畫在十字路的四個盡頭 */}
    <House x={48} y={cx(homes[0].z)} roof={GROUP_COLOR[0]}/><House x={VB-48} y={cx(homes[1].z)} roof={GROUP_COLOR[1]}/>
    <School x={cx(destinations[0].x)} y={44}/><Market x={cx(destinations[1].x)} y={VB-50}/>
    <Pill x={6} y={cx(4)+76} text={homes[0].name} anchor="start" font={font} color={GROUP_COLOR[0]}/>
    <Pill x={VB-6} y={cx(4)+76} text={homes[1].name} anchor="end" font={font} color={GROUP_COLOR[1]}/>
    <Pill x={cx(4)+66} y={46} text={destinations[0].name} anchor="start" font={font}/>
    <Pill x={cx(4)+66} y={VB-46} text={destinations[1].name} anchor="start" font={font}/>
    {naturalTrees.map(t=><g key={`n${t.x}`}><TreeIcon x={cx(t.x)} y={cx(t.z)} planted={false}/><Pill x={cx(t.x)-38} y={cx(t.z)} text="既有老樹" anchor="end" font={font} color="#42634b"/></g>)}
    {sites.map(s=>{const planted=trees.some(t=>same(t,s)),x=cx(s.x),y=cx(s.z);
      const name=s.id==='B'?{x:x-40,y,anchor:'end' as const}:s.id==='C'?{x:x+40,y,anchor:'start' as const}:{x:s.id==='A'?x-24:x,y:y+58,anchor:'middle' as const};
      return <g key={s.id} className={`hq-spot${planted?' planted':''}`} role="button" tabIndex={0} aria-pressed={planted} aria-label={`${s.id} ${s.name}：${planted?'已種樹，點一下拿掉':'可以種樹'}`} onClick={()=>toggle(s)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(s);}}}>
        <rect x={x-60} y={y-60} width={120} height={120} fill="#000" fillOpacity={0}/>
        <rect className="hq-spot-ring" x={x-46} y={y-46} width={92} height={92} rx={18} fill="none"/>
        {planted?<><TreeIcon x={x} y={y} planted/><circle cx={x+30} cy={y-30} r={17} fill="#fff" stroke="#2d6e4f" strokeWidth={3}/><text x={x+30} y={y-22} fontSize={23} fontWeight="bold" textAnchor="middle" fill="#2d6e4f">{s.id}</text></>:
          <><rect x={x-31} y={y-31} width={62} height={62} rx={12} fill="#fffdf4" stroke="#a8946c" strokeWidth={3.5} strokeDasharray="9 6"/><text x={x} y={y+15} fontSize={42} fontWeight="bold" textAnchor="middle" fill="#6d572a">{s.id}</text></>}
        {!compact&&<Pill x={name.x} y={name.y} text={s.name} anchor={name.anchor} font={nameFont} color={planted?'#2d6e4f':'#6d572a'} tap/>}
      </g>;})}
  </svg>;

  return <main className={`hq${reduced?' hq-reduced':''}`}>
    <div className="hq-top">
      <p className="hq-intro"><b>熱浪來了！</b>點地圖上的 A–F 種 3 棵樹。樹蔭讓路變涼，走涼的路才有力氣回家。</p>
      <Link className="hq-full" href="/missions/heat/3d/" onClick={()=>carryTo3D(trees)}>全 3D 檢視 ▶</Link>
    </div>
    <div className="hq-body">
      <section className={`hq-result${passed?' pass':''}`} aria-live="polite">
        <p className="hq-line">現在 {RESIDENTS} 人中 <b className="hq-big">{run.success}</b> 人能平安回家</p>
        <p className="hq-sub"><span className="hq-base">原本 {baseline.success} 人</span><span className={`hq-status${passed?' pass':''}`}>{status}</span></p>
        <div className="hq-people">{homes.map((h,g)=>{const group=run.travelers.slice(g*PER_HOME,(g+1)*PER_HOME),ok=group.filter(p=>p.outcome===SUCCESS).length;
          return <div key={h.name} className="hq-group" role="img" aria-label={`${h.name}：${PER_HOME} 人中 ${ok} 人平安回家`}><span style={{color:GROUP_COLOR[g]}}>{h.name} {ok}/{PER_HOME}</span><div>{group.map(p=><Face key={p.id} ok={p.outcome===SUCCESS} color={GROUP_COLOR[g]}/>)}</div></div>;})}</div>
        <p className="hq-legend"><span><i className="hot"/>熱的路：走了會累</span><span><i className="cool"/>涼的路：恢復力氣</span><span className="hq-key"><Face ok color="#8a8a8a"/>平安回家</span><span className="hq-key"><Face ok={false} color="#8a8a8a"/>沒回到家</span></p>
      </section>
      <div className="hq-map" ref={mapRef}>{map}</div>
      <div className="hq-sites" role="group" aria-label="植樹點按鈕">
        <p className="hq-count">已種 <b>{trees.length}</b> / {TREE_LIMIT} 棵<span aria-hidden="true">{Array.from({length:TREE_LIMIT},(_,i)=><i key={i} className={i<trees.length?'on':''}/>)}</span></p>
        <div className="hq-site-buttons">{sites.map(s=>{const planted=trees.some(t=>same(t,s));return <button key={s.id} type="button" aria-pressed={planted} className={planted?'planted':''} onClick={()=>toggle(s)}><b>{s.id}</b><span>{s.name}</span><small>{planted?'已種樹 ✓':'可以種'}</small></button>;})}</div>
      </div>
      <div className="hq-actions">
        {message&&<p className={`hq-msg${message.startsWith('最多')?' warn':''}`} role="status">{message}</p>}
        <div className="hq-buttons"><button type="button" className="hq-primary" onClick={openAnim}>看大家怎麼走 ▶</button><button type="button" className="hq-secondary" onClick={reset} disabled={trees.length===0&&!message}>全部重來</button></div>
      </div>
    </div>
    {anim&&<div className="hq-anim" role="dialog" aria-modal="true" aria-label="看大家怎麼走">
      <div className="hq-anim-card">
        <div className="hq-anim-head"><b>{finished?`走完了：${RESIDENTS} 人中 ${run.success} 人平安回家`:'大家出門辦事，再走回家…'}</b><span>已平安回家 {homeNow} 人 · 走不動 {stuckNow} 人{finished?`（原本 ${baseline.success} 人）`:''}</span></div>
        <div className="hq-anim-scene"><Scene mode="heat" world={world} run={run} time={time} selected={null} view="orbit" viewNonce={0} cutaway={false} paths={false} scenario={0} onPick={()=>{}}/></div>
        <div className="hq-anim-foot">{finished?(!reduced&&<button type="button" className="hq-secondary" onClick={()=>setTime(0)}>再看一次 ↻</button>):<button type="button" className="hq-secondary" onClick={()=>setTime(run.duration)}>略過，看結果</button>}<button type="button" ref={closeRef} className="hq-primary" onClick={()=>setAnim(false)}>關閉</button></div>
      </div>
    </div>}
  </main>;
}
