'use client';
import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useGameEvents} from '@/lib/useGameEvents';

import type {Mode,Simulation} from './types';
import {animalCost,animalWorld,cleanAnimals,emptyAnimals,emptyCrossing,simulateAnimals,ANIMAL_BUDGET,type AnimalDesign,type Crossing} from './animals';
import {heatWorld,cleanTrees,simulateHeat,temperature,plantable,homes,sites,PER_HOME,RESIDENTS,TREE_LIMIT,HEAT_THRESHOLD,ENERGY_MAX,type Tree} from './heat';
import {sampleAt} from './GroupScene';
import {Explain,PlantDemo} from './heat-help';
import './group-games.css';
const Scene=dynamic(()=>import('./GroupScene'),{ssr:false,loading:()=> <div className="gg-canvas-wrap gg-loading">正在準備立體場景…</div>});
interface Trial {animals:AnimalDesign;trees:Tree[];scenario:number;prediction:string}
const names=['觀察現況','配置設施','預測・模擬','比較・改善','解釋發現'];
const copy={animals:{title:'幫動物，接回一條路。',short:'動物通道',key:'2.5-III',eyebrow:'WILDLIFE CROSSING LAB',intro:'橋接起來了，整群動物都走得過嗎？',unit:'隻',kpi:'抵達另一棲地',hint:'工程先接得上，再讓整群走得過。'},heat:{title:'涼爽的路，能送大家回家嗎？',short:'都市降溫',key:'3.2-III',eyebrow:'COOL STREETS LAB',intro:'熱浪來了。用三棵樹，讓出門辦事的鄰居有力氣回家。',unit:'人',kpi:'辦完事並安全返家',hint:'熱格 −1，涼格 ＋1；到目的地還不算完成。'}};
const fingerprint=(v:Trial)=>JSON.stringify([v.animals,v.trees,v.scenario]);
export default function GroupGame({mode}:{mode:Mode}){
  const telemetry=useGameEvents(mode);
  const c=copy[mode],storageKey=mode==='heat'?'cce-group-heat-simple-v2':`cce-group-${mode}-v1`;
  const [animals,setAnimals]=useState<AnimalDesign>(emptyAnimals),[trees,setTrees]=useState<Tree[]>([]),[scenario,setScenario]=useState(0);
  const [step,setStep]=useState(0),[history,setHistory]=useState<Trial[]>([]),[record,setRecord]=useState<Trial|null>(null),[prediction,setPrediction]=useState(''),[reflection,setReflection]=useState('');
  const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),[paused,setPaused]=useState(false),[speed,setSpeed]=useState(1),[reduced,setReduced]=useState(false);
  const [loaded,setLoaded]=useState(false),[saved,setSaved]=useState(true),[message,setMessage]=useState(''),[resetting,setResetting]=useState(false);
  const [lane,setLane]=useState(0),[tool,setTool]=useState<'inspect'|'plant'|'remove'>('inspect'),[cell,setCell]=useState<Tree>({x:1,z:5}),[selected,setSelected]=useState<number|null>(null);
  const [view,setView]=useState<'orbit'|'top'|'side'>('orbit'),[viewNonce,setViewNonce]=useState(0),[cutaway,setCutaway]=useState(false),[paths,setPaths]=useState(false);
  const [demo,setDemo]=useState<'intro'|'plant'|null>(null),[hintOpen,setHintOpen]=useState(false),plantDemoShown=useRef(false);
  const purpose=useRef<'baseline'|'trial'|'replay'>('baseline'),panel=useRef<HTMLDivElement>(null),stage=useRef<HTMLElement>(null);
  const simulate=(r:Trial):Simulation=>mode==='animals'?simulateAnimals(r.animals,r.scenario):simulateHeat(r.trees);
  const baseline=useMemo(()=>mode==='animals'?simulateAnimals(emptyAnimals(),scenario):simulateHeat([]),[mode,scenario]);
  const run=useMemo(()=>record?simulate(record):baseline,[record,baseline]);
  const results=useMemo(()=>history.map(r=>({record:r,run:simulate(r)})),[history,mode]);
  const draft:Trial={animals,trees,scenario,prediction};
  const current=record!==null&&fingerprint(record)===fingerprint(draft);
  const displayTime=current?time:0,progress=Math.min(100,displayTime/run.duration*100),hasBaseline=history.length>0;
  const world=useMemo(()=>mode==='animals'?animalWorld(animals):heatWorld(trees,step===1?cell:null,cell),[animals,trees,mode,step,tool,cell]);
  const selectedPerson=selected===null?null:run.travelers[selected];
  const point=selectedPerson?sampleAt(selectedPerson.samples,displayTime):null;
  const personFinished=!!selectedPerson&&displayTime>=selectedPerson.samples.at(-1)!.t;
  const done=step===4&&reflection.trim().length>=20;
  useEffect(()=>{if(done)telemetry.reflect(reflection.trim().length);},[done]);
  const focusPanel=()=>{requestAnimationFrame(()=>panel.current?.scrollIntoView({behavior:'instant',block:'start'}));};
  const focusScene=()=>{if(mode==='heat'||matchMedia('(max-width:850px)').matches)requestAnimationFrame(()=>stage.current?.scrollIntoView({behavior:'instant',block:'start'}));};
  function go(n:number){setStep(n);setTool('inspect');setMessage('');setHintOpen(false);if(mode==='heat'&&n===1&&!plantDemoShown.current&&trees.length===0){plantDemoShown.current=true;setDemo('plant');}focusPanel();}
  // 示範動畫：第一次互動（點、按鍵）就收起；不攔截該次點擊。
  useEffect(()=>{if(!demo)return;const close=()=>setDemo(null);window.addEventListener('pointerdown',close,{once:true});window.addEventListener('keydown',close,{once:true});return()=>{window.removeEventListener('pointerdown',close);window.removeEventListener('keydown',close);};},[demo]);
  useEffect(()=>{
    try{const raw=localStorage.getItem(storageKey);if(raw){const s=JSON.parse(raw);if(s.version===1){const a=cleanAnimals(s.animals),t=cleanTrees(s.trees),sc=s.scenario===1?1:0;setAnimals(a);setTrees(t);setScenario(sc);setReflection(typeof s.reflection==='string'?s.reflection.slice(0,1500):'');const h:Trial[]=Array.isArray(s.history)?s.history.slice(-6).filter((r:unknown)=>r&&typeof r==='object').map((r:Trial)=>({animals:cleanAnimals(r.animals),trees:cleanTrees(r.trees),scenario:r.scenario===1?1:0,prediction:typeof r.prediction==='string'?r.prediction.slice(0,120):''})):[];setHistory(h);const last=h.at(-1);if(last){setRecord(last);setTime(simulate(last).duration);setStep(fingerprint(last)===fingerprint({animals:a,trees:t,scenario:sc,prediction:''})?(h.length===1?0:3):1);}}}}catch{setSaved(false);}
    setReduced(matchMedia('(prefers-reduced-motion: reduce)').matches);setLoaded(true);if(mode==='heat')setDemo('intro');
  },[]);
  useEffect(()=>{if(!loaded)return;try{localStorage.setItem(storageKey,JSON.stringify({version:1,animals,trees,scenario,history,reflection}));setSaved(true);}catch{setSaved(false);}},[loaded,animals,trees,scenario,history,reflection]);
  useEffect(()=>{if(!playing||paused)return;let raf=0,last=performance.now();const tick=(now:number)=>{const dt=Math.min(100,now-last)/1000;last=now;setTime(t=>Math.min(run.duration,t+dt*3*speed));raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[playing,paused,speed,run]);
  useEffect(()=>{if(!playing||time<run.duration||!record)return;setPlaying(false);setPaused(false);if(purpose.current!=='replay'){telemetry.complete({success:run.success,total:run.total,successRate:Math.round(run.score*100),cost:mode==='animals'?animalCost(record.animals):record.trees.length,trees:record.trees.length,baselineSuccess:baseline.success,passed:purpose.current==='trial'&&run.success>baseline.success});setHistory(h=>[...h,record].slice(-6));setStep(purpose.current==='baseline'?0:3);if(matchMedia('(max-width:850px)').matches)focusPanel();}},[playing,time,run,record]);
  function edited(){setPrediction('');setTime(0);setSelected(null);setMessage('配置已更動。下一步先預測，再重新模擬。');}
  function updateCrossing(patch:Partial<Crossing>){if(playing)return;const d=animals.map((v,i)=>i===lane?{...v,...patch}:v) as AnimalDesign;if(d[lane].kind==='none')d[lane]=emptyCrossing();if(d[lane].kind==='tunnel'){d[lane].entry=false;d[lane].exit=false;d[lane].guard=false;}if(animalCost(d)>ANIMAL_BUDGET){setMessage('材料不夠。先移除其他工程或改用較省材料的配置。');return;}setAnimals(d);edited();}
  function plant(at:Tree){setCell(at);if(!plantable(at.x,at.z)){setMessage('請選 A–F 六個白色植樹點；道路與老樹保留。');return;}if(trees.some(t=>t.x===at.x&&t.z===at.z)){setMessage('這格已種樹。可切換「移除」取回樹木。');return;}if(trees.length>=TREE_LIMIT){setMessage('三棵樹已用完。先移除或搬移一棵，再調整位置。');return;}setTrees(old=>[...old,{x:at.x,z:at.z}]);setTool('inspect');edited();setMessage(`已在第 ${at.x+1} 欄、第 ${at.z+1} 列種樹。附近降溫區已更新。`);}
  function removeTree(at:Tree){if(!trees.some(t=>t.x===at.x&&t.z===at.z)){setMessage('此格沒有本次種的樹；既有樹木不可移除。');return;}setTrees(old=>old.filter(t=>t.x!==at.x||t.z!==at.z));edited();setMessage('已取回一棵樹，可以換位置種植。');}
  function onPick(value:string){if(value.startsWith('agent:')){setSelected(Number(value.split(':')[1]));setPaths(true);return;}if(value.startsWith('lane:')){setLane(Number(value.split(':')[1]));if(step===1)focusPanel();return;}if(value.startsWith('tile:')){const [,x,z]=value.split(':');const at={x:Number(x),z:Number(z)};setCell(at);if(step===1&&!playing){if(mode==='heat'){setTool('inspect');return;}if(tool==='plant')plant(at);if(tool==='remove')removeTree(at);}}}
  function start(kind:'baseline'|'trial'|'replay'){
    if(playing||!loaded)return;if(kind==='trial'&&!prediction){setMessage('先選一個預測。');return;}
    const r=kind==='replay'&&record?record:kind==='baseline'?{animals:emptyAnimals(),trees:[],scenario,prediction:'觀察原始環境'}:{animals:cleanAnimals(animals),trees:cleanTrees(trees),scenario,prediction};
    if(kind!=='replay')telemetry.start({phase:kind==='baseline'?'baseline':'challenge',scenario:r.scenario});purpose.current=kind;setRecord(r);setTime(reduced?simulate(r).duration:0);setPaused(false);setPlaying(true);setMessage('');setTool('inspect');setHintOpen(false);focusScene();
  }
  function reset(){telemetry.cancel();setAnimals(emptyAnimals());setTrees([]);setHistory([]);setRecord(null);setScenario(0);setReflection('');setPrediction('');setPlaying(false);setPaused(false);setTime(0);setSelected(null);setResetting(false);go(0);}
  const textReport=useMemo(()=>[`${c.short}｜我的實驗紀錄`,...results.flatMap(({record:r,run:v},i)=>[`\n實驗 ${i+1}：${r.prediction}`,`配置：${mode==='animals'?JSON.stringify(r.animals):r.trees.map(t=>`(${t.x+1},${t.z+1})`).join('、')||'未種樹'}`,`成功 ${v.success}/${v.total}（${Math.round(v.score*100)}%）`,...v.travelers.map(p=>`${p.label}｜${p.origin}｜${p.itinerary.join(' → ')}｜${p.outcome}｜${p.detail}`)]),`\n我的解釋：${reflection}`,'\n數值是固定條件的教學模擬，不代表真實動物行為或人體耐熱能力。'].join('\n'),[c.short,results,mode,reflection]);
  const link='data:text/plain;charset=utf-8,'+encodeURIComponent('\ufeff'+textReport);
  // ── 底部固定操作列：每一步只有一個主要按鈕 ──
  const site=sites.find(p=>p.x===cell.x&&p.z===cell.z),sitePlanted=trees.some(t=>t.x===cell.x&&t.z===cell.z),treesLeft=TREE_LIMIT-trees.length;
  const passed=run.success>baseline.success;
  const resultLine=`這次 ${run.total} 人中 ${run.success} 人平安回家（原本 ${baseline.success} 人）`;
  const bar=(label:string,onClick:()=>void,disabled=false)=><button className="gg-bar-primary" disabled={disabled} onClick={onClick}>{label}</button>;
  const heat=mode==='heat';
  const [now,action,hintText]:[string,ReactNode,string]=playing?[
      `正在模擬：看看大家怎麼走（${Math.round(progress)}%）`,bar(paused?'繼續播放 ▶':'暫停 Ⅱ',()=>setPaused(!paused)),'可以暫停、拖曳畫面換角度，或在操作卡按「直接看結果」。']:
    step===0?(hasBaseline?[
      heat?`原本只有 ${baseline.success} 人平安回家。換你種樹幫忙！`:'看完原始環境了，換你配置工程。',bar(heat?'換你種樹 →':'下一步：配置設施 →',()=>go(1)),heat?'下一步你要選 3 個位置種樹，讓更多人有力氣回家。':c.hint]:[
      heat?'先看看：不種新樹時，12 人中有幾人能平安回家':'先看沒有工程時，動物怎麼過路',bar(heat?'先看：不種樹會怎樣 ▶':'開始觀察原始環境 ▶',()=>start('baseline'),!loaded),heat?'按下按鈕後，居民會自己出門辦事再回家。橘色的路很熱，走越久越累。':c.hint]):
    step===1?(heat?(treesLeft<=0?[
      '3 棵樹都種好了，進入下一步做預測',bar('種好了，下一步：做預測 →',()=>go(2)),'想換位置：先點一棵已種的樹，在操作卡按「取回」。']:site&&!sitePlanted?[
      `已選 ${site.id}（${site.name}）。按「種在這裡」，還能種 ${treesLeft} 棵`,bar(`種在這裡（${site.id}）`,()=>plant(cell)),'也可以先點其他白色 A–F 點比較：綠色預覽就是這棵樹能變涼的路。']:[
      site?`${site.id} 已經種了。點另一個白色 A–F 點（還能種 ${treesLeft} 棵）`:`先點一個白色 A–F 植樹點（還能種 ${treesLeft} 棵）`,bar('種在這裡',()=>{},true),'點操作卡上的 A–F 按鈕，或點地圖上的白色方塊。']):[
      '選工程與配件，好了就做預測',bar('配置好了，下一步：做預測 →',()=>go(2)),c.hint]):
    step===2?[
      prediction?'按「開始模擬」，看看猜得對不對':'先選一個你猜的結果（預測）',bar('開始模擬 ▶',()=>start('trial'),!prediction),'在操作卡的「我的預測」選一個，再開始。']:
    step===3?(heat?[
      passed?`過關！比原本多 ${run.success-baseline.success} 人平安回家。寫下你的發現吧`:`還沒比原本多（${run.success} 人）。換個位置種樹，再試一次`,passed?bar('過關！寫下我的發現 →',()=>go(4)):bar('換位置，再試一次 →',()=>go(1)),'比原本多人平安回家就過關。點居民可以看他在哪裡累倒。']:[
      '看結果，找出成功或失敗的原因',bar('調整配置，再試一次 →',()=>go(1)),c.hint]):
    [done?'寫好了！按「下載」保存紀錄':`寫下你的發現（還差 ${Math.max(0,20-reflection.trim().length)} 字）`,<a key="dl" className={`gg-bar-primary ${done?'':'disabled'}`} aria-disabled={!done} href={done?link:undefined} download={`${c.short}-實驗紀錄.txt`}>下載我的設計紀錄 ↓</a>,'寫下你改了什麼、結果怎麼變（至少 20 字），就能下載。'];
  return <main className={`group-game ${mode}${reduced?' gg-reduced':''}`}>
    <div className="gg-top"><Link href={`/package/${c.key}/`}>← 返回教案</Link><span>{c.key} · 3D 遊戲試作</span>{mode==='heat'&&<Link href="/missions/heat/">← 回到地圖版</Link>}<button aria-pressed={reduced} onClick={()=>setReduced(!reduced)}>{reduced?'直接顯示結果':'減少動畫'}</button></div>
    <header className="gg-header"><p>{c.eyebrow}</p><h1>{c.title}</h1><span>{c.intro}</span></header>
    {mode==='heat'&&step===0&&<section className="gg-brief" aria-label="這次要解決的問題"><div><b>發生什麼事？</b><p>連續高溫，柏油路曬得燙腳。兩側各住 6 位居民，每天仍要出門：接孩子或買食物。</p></div><div><b>為什麼需要你？</b><p>西側有一棵老樹，東側缺少遮蔭。居民走熱路會耗體力，有人辦完事卻走不回家。</p></div><div><b>你的任務</b><p>你是社區的綠化小隊。把 <strong>3 棵樹</strong>放在 A–F 植樹點，讓更多人<strong>辦完事，再安全回家</strong>。</p></div></section>}
    <ol className="gg-steps" aria-label="五步操作順序">{names.map((name,i)=><li key={name} aria-current={step===i?'step':undefined} className={i<step?'past':''}><b>{i<step?'✓':i+1}</b><span>{name}</span></li>)}</ol>
    <div className="gg-layout">
      <section className="gg-stage" ref={stage} aria-label="立體實驗台">
        {heat&&<div className={`gg-goal${step>=3&&!playing&&hasBaseline?passed?' pass':' retry':''}`} role="status">{step>=3&&!playing&&hasBaseline?<><b>{resultLine}</b><span className="gg-goal-badge">{passed?'過關 ✓':'還沒比原本好，再調整看看'}</span></>:<b>目標：種 {TREE_LIMIT} 棵樹，讓平安回家的人比原本多（{hasBaseline?`原本 ${baseline.success} / ${RESIDENTS} 人`:'先看看原本有幾人'}）</b>}</div>}
        <div className="gg-stage-toolbar"><span>{mode==='animals'?'高低差會改變通行':'橘色：高溫 · 綠色：涼爽'}</span><div>{(['orbit','top','side'] as const).map((v,i)=><button key={v} aria-pressed={view===v} onClick={()=>{setView(v);setViewNonce(n=>n+1);}}>{['立體','俯視','側視'][i]}</button>)}</div></div>
        <div className="gg-scene-guide" role="status"><b>{playing?`正在模擬 ${Math.round(progress)}%`:step===0?'1 · 先觀察沒有改造的環境':step===1?(mode==='animals'?`2 · 調整${lane===0?'北':'南'}側工程，再看銜接`:'2 · 選 A–F 位置，看降溫範圍，再種樹'):step===2?'3 · 先選預測，再啟動模擬':step===3?'4 · 點選個體，找出成功或失敗原因':'5 · 用位置與成功率說明你的發現'}</b><span>{playing?'可以暫停、慢放和切換視角；配置暫時鎖定。':c.hint}</span></div>
        <div className="gg-scene-holder"><Scene mode={mode} world={world} run={run} time={displayTime} selected={selected} view={view} viewNonce={viewNonce} cutaway={cutaway} paths={paths&&current} scenario={record?.scenario??scenario} onPick={onPick}/>{heat&&demo&&!playing&&<PlantDemo intro={demo==='intro'}/>}</div>
        {mode==='heat'&&<div className="gg-cell-info"><b>第 {cell.x+1} 欄・第 {cell.z+1} 列</b><span>{temperature(cell.x,cell.z,trees)}°C · {temperature(cell.x,cell.z,trees)>=HEAT_THRESHOLD?'高溫 −1 體力':'涼爽 ＋1 體力'}</span><Explain item="threshold"/></div>}
        {record&&<div className="gg-playback"><button disabled={!current} onClick={()=>playing?setPaused(!paused):start('replay')}>{playing?(paused?'▶ 繼續':'Ⅱ 暫停'):'↻ 重播'}</button><label>進度<input aria-label="模擬播放進度" type="range" min={0} max={100} value={Math.round(progress)} disabled={!current} onChange={e=>{setPaused(true);setTime(Number(e.target.value)/100*run.duration);}}/></label><select aria-label="播放速度" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={.5}>慢放</option><option value={1}>正常</option><option value={2}>快轉</option></select></div>}
        <div className="gg-view-options"><label><input type="checkbox" checked={paths} disabled={!current} onChange={e=>setPaths(e.target.checked)}/>顯示移動路線</label>{mode==='animals'&&<label><input type="checkbox" checked={cutaway} onChange={e=>setCutaway(e.target.checked)}/>透視道路／涵洞</label>}</div>
        {message&&<div className="gg-notice" role="status">{message}</div>}
        <div className="gg-tracker"><label>追蹤{mode==='animals'?'動物':'居民'}<select aria-label="追蹤個體" value={selected??''} onChange={e=>{setSelected(e.target.value===''?null:Number(e.target.value));setPaths(true);}}><option value="">選一位，查看路徑與狀態</option>{run.travelers.map(p=><option key={p.id} value={p.id}>{p.label} · {p.origin}</option>)}</select></label>{selectedPerson&&<><h3>{selectedPerson.label} <span>{!current?'待模擬':personFinished?selectedPerson.outcome:'移動中'}</span></h3><p>{selectedPerson.origin} → {selectedPerson.itinerary.join(' → ')}</p>{point?.energy!==undefined&&<p>目前體力 <b>{point.energy} / {ENERGY_MAX}</b></p>}<p>{personFinished?selectedPerson.detail:point?.note}</p>{personFinished&&mode==='heat'&&<p>已辦完 {selectedPerson.completed} / {selectedPerson.required} 件事</p>}</>}</div>
      </section>
      <aside className="gg-panel" ref={panel} aria-label="目前操作步驟">
        <div className="gg-panel-content"><p className="gg-step-label">目前步驟 {step+1} / 5</p><h2>{playing?'觀察他們自己怎麼走':step===0?(hasBaseline?'這是改造前的結果':'先跑一次原始環境'):step===1?(mode==='animals'?'選工程，檢查前後銜接':'三棵樹，放在哪一段路？'):step===2?'預測這次配置的效果':step===3?'結果變好了嗎？':'說出你的設計理由'}</h2>
        {playing?<><p>觀察每個角色的路徑。結束後會顯示完整成功率與未完成原因。</p><progress max={100} value={progress}/><button className="gg-secondary" onClick={()=>setTime(run.duration)}>直接看結果 →</button></>:
        step===0?<><p>{mode==='animals'?'24 隻動物準備出發。先看沒有工程時，牠們如何過路、走散或抵達。':'12 位居民各辦一件事：一半去學校接孩子，一半去市場買食物。他們都會沿十字路原路返家。先看看，沒有新樹時誰會累倒。'}</p>{mode==='heat'&&<div className="gg-errand-map"><span>家 → 學校接孩子 → 家</span><span>家 → 市場買食物 → 家</span></div>}<div className="gg-rules">{mode==='animals'?<>① 看道路與兩側高差<br/>② 啟動動物自主移動<br/>③ 點動物，追蹤發生的事情</>:<>每進入熱格，體力 −1<br/>每進入涼格，體力 ＋1，上限 10<br/>體力歸零停止；辦完全部事情並返家才成功</>}</div>{heat&&<div className="gg-whats"><Explain item="cells"/><Explain item="energy"/><Explain item="threshold"/></div>}{hasBaseline&&<><div className="gg-score"><b>{baseline.success}<small> / {baseline.total}</small></b><span>原始環境的成功數 · {Math.round(baseline.score*100)}%</span></div>{mode==='heat'&&<p className="gg-baseline-reason">西側 {baseline.travelers.filter(p=>p.origin===homes[0].name&&p.outcome==='安全返家').length}/6 人返家；東側 {baseline.travelers.filter(p=>p.origin===homes[1].name&&p.outcome==='安全返家').length}/6 人返家。缺少遮蔭的路，是這次要改善的地方。</p>}</>}</>:
        step===1?<>
          {mode==='animals'?<><div className="gg-budget">材料剩餘 <b>{ANIMAL_BUDGET-animalCost(animals)} / {ANIMAL_BUDGET}</b></div><div className="gg-segment">{['北側工程區','南側工程區'].map((name,i)=><button key={name} aria-pressed={lane===i} onClick={()=>setLane(i)}>{name}</button>)}</div><p className="gg-small">每個工程區先選一種跨越方式，再增加需要的配件。</p><div className="gg-choices">{(['none','bridge','tunnel'] as const).map((kind,i)=><button key={kind} aria-pressed={animals[lane].kind===kind} onClick={()=>updateCrossing({kind})}><b>{['不建設','跨越橋','涵洞'][i]}</b><small>{['退還本區材料','4 材料 · 需要兩端坡道','3 材料 · 從道路下通過'][i]}</small></button>)}</div><fieldset className="gg-upgrades"><legend>工程配件</legend>{([{key:'entry',name:'上橋坡道',cost:1,bridge:true},{key:'exit',name:'下橋坡道',cost:1,bridge:true},{key:'guard',name:'橋面護欄',cost:1,bridge:true},{key:'guide',name:'入口導引圍籬',cost:1,bridge:false},{key:'wide',name:'加寬通道',cost:2,bridge:false}] as const).map(u=><label key={u.key}><input type="checkbox" checked={animals[lane][u.key]} disabled={animals[lane].kind==='none'||u.bridge&&animals[lane].kind!=='bridge'} onChange={e=>updateCrossing({[u.key]:e.target.checked})}/>{u.name}<small>{u.cost} 材料</small></label>)}</fieldset><div className="gg-rules">{animals[lane].kind==='bridge'?'側視檢查兩端坡道。沒有護欄的窄橋，個體偏移可能造成跌落。':animals[lane].kind==='tunnel'?'打開「透視道路／涵洞」檢查入口。窄口可能讓隊伍等待；導引圍籬能引導較遠的動物。':'可直接測試未建設，或在另一區安排工程。'}</div><label className="gg-field">驗證情境<select value={scenario} onChange={e=>{setScenario(Number(e.target.value));edited();}}><option value={0}>A · 固定車流時序</option><option value={1}>B · 改變車流抵達時間</option></select></label></>:
          <><p className="gg-sites-lead"><b>① 選一個植樹點</b>（綠色預覽＝這棵樹能變涼的路）</p><div className="gg-sites">{sites.map(p=>{const planted=trees.some(t=>t.x===p.x&&t.z===p.z);return <button key={p.id} className={planted?'planted':''} aria-pressed={cell.x===p.x&&cell.z===p.z} onClick={()=>{setCell(p);setTool('inspect');}}><b>{p.id}</b><span>{p.name}</span><small>{planted?'已種樹 ✓':'可以種'}</small></button>;})}</div><p className="gg-sites-lead"><b>② 按下方「種在這裡」</b></p><div className="gg-budget">還能種 <b>{TREE_LIMIT-trees.length} / {TREE_LIMIT} 棵</b></div>{sitePlanted&&<button className="gg-secondary" onClick={()=>removeTree(cell)}>取回 {site?.id} 這棵樹（換位置）</button>}<div className="gg-whats"><Explain item="sites"/><Explain item="cooling"/><Explain item="cells"/></div><div className="gg-rules">想想：居民能走到樹下嗎？回家時還會經過這裡嗎？</div></>}
          {message&&<p className="gg-inline-notice" role="status">{message}</p>}{heat&&treesLeft>0&&trees.length>0&&<button className="gg-secondary" onClick={()=>go(2)}>先這樣，下一步：做預測 →</button>}</>:
        step===2?<><p>選一個預測，再讓同一群角色、以相同初始條件重走一次。</p><fieldset className="gg-predictions"><legend>我的預測</legend>{(mode==='animals'?['更多動物會抵達另一棲地','路殺減少，但可能還會跌落或走散','通道可能塞住，部分動物來不及到達']:['更多居民能辦完事並安全返家','去程改善，但回程可能還是不夠','樹可能種得太晚，居民走不到涼爽處']).map(v=><label key={v}><input type="radio" name="prediction" checked={prediction===v} onChange={()=>setPrediction(v)}/>{v}</label>)}</fieldset><Explain item="prediction"/>{!prediction&&<small>先選一個預測，才能開始。</small>}<button className="gg-secondary" onClick={()=>go(1)}>← 返回調整配置</button></>:
        step===3?<>{heat&&<div className={`gg-result ${passed?'pass':'retry'}`} role="status"><p>{resultLine}</p><b>{passed?'過關 ✓':'還沒比原本好，再調整看看'}</b></div>}<p>{c.kpi}，才計入成功。分母包含每一位出發者。</p><div className="gg-score"><b>{run.success}<small> / {run.total} {c.unit}</small></b><span>{Math.round(run.score*100)}% · 原始環境 {Math.round(baseline.score*100)}%</span></div><div className="gg-outcomes">{Object.entries(run.counts).map(([name,n])=><div key={name}><span>{name}</span><b>{n}</b></div>)}</div>{mode==='heat'&&<div className="gg-districts"><h3>每個住宅區都有改善嗎？</h3>{homes.map(h=><p key={h.name}><span>{h.name}</span><b>{run.travelers.filter(p=>p.origin===h.name&&p.outcome==='安全返家').length} / {PER_HOME}</b></p>)}</div>}<p className="gg-small">點場景角色或下方個體紀錄，查看發生位置與原因。</p>{heat&&passed?<button className="gg-secondary" onClick={()=>go(1)}>再調整樹的位置，試試看 →</button>:<button className="gg-secondary" onClick={()=>go(4)}>用這次結果，寫下我的解釋 →</button>}</>:
        <><p>說明改了哪個位置或工程，引用前後成功率，再解釋原因。未全數成功也能記錄你的發現。</p><label className="gg-field">我的設計理由<textarea rows={6} maxLength={1500} value={reflection} onChange={e=>setReflection(e.target.value)} placeholder="我把＿＿改成＿＿，成功數從＿＿變成＿＿。追蹤＿＿後，我發現＿＿；下次想再改＿＿。"/></label><small>{reflection.trim().length} / 至少 20 字，與教師討論理由是否成立。</small>{done&&<p className="gg-complete">✓ 已完成本次設計紀錄，按下方「下載」保存</p>}<button className="gg-secondary" onClick={()=>go(3)}>← 返回結果</button></>}
        </div><div className="gg-kpi"><b>主要 KPI</b><p>{c.kpi}的比例</p><small>{mode==='animals'?'24 隻動物 · 最多 12 材料':'12 位居民 · 最多 3 棵樹'}</small></div>
      </aside>
    </div>
    {hasBaseline&&(step===3||step===4)&&<section className="gg-evidence"><h2>從個體紀錄找證據</h2><p>點一列追蹤該角色；結果不只是一個總分。</p><div className="gg-record-grid">{run.travelers.map(p=><button key={p.id} className={p.outcome==='抵達'||p.outcome==='安全返家'?'arrived':''} onClick={()=>{setSelected(p.id);setPaths(true);stage.current?.scrollIntoView({behavior:'instant',block:'start'});}}><b>{p.label}</b><span>{p.outcome}</span><small>{mode==='heat'?`${p.origin} · ${p.completed}/${p.required} 件事 · 體力 ${p.energy}`:p.detail}</small></button>)}</div><details><summary>最近 {history.length} 次實驗比較</summary><div className="gg-table"><table><thead><tr><th>預測</th><th>配置</th><th>成功率</th></tr></thead><tbody>{results.map(({record:r,run:v},i)=><tr key={i}><td>{i+1}. {r.prediction}</td><td>{mode==='animals'?`${animalCost(r.animals)} 材料 · 情境 ${r.scenario?'B':'A'}`:`${r.trees.length} 棵樹`}</td><td>{v.success}/{v.total} · {Math.round(v.score*100)}%</td></tr>)}</tbody></table></div></details></section>}
    <details className="gg-teacher"><summary>教師備註：模型假設與教學範圍</summary><p>{mode==='animals'?'固定 24 隻虛構動物，以簡化路徑、行走偏移、群體間距及車流接觸模擬。個體速度與出發時間不同，但同情境重試一致；模擬時限 42 秒。脫群是過程狀態，之後抵達仍算成功；結算每隻只有一個終態。工程材質與數值均為教學示意，不代表真實動物習性或工程安全規範。':'每格溫度固定，32°C 是本遊戲的高低溫分界，不是健康安全門檻。兩個住宅區共 12 位居民，每人辦一件事再原路返家。所有居民起始體力 10，上限 10；進入一格才加減一次，歸零停止，辦事不補體力。居民走固定最短可通行路線，不為刷體力繞圈。西側既有老樹提供原始陰涼，新增樹木兩格內降溫 6°C，重疊不加倍。未模擬真實熱疾病、氣流或太陽移動。'}</p><p>採「觀察 → 配置 → 預測 → 比較 → 解釋」。主要 KPI 依完整個體行程計算，文字長度只檢查紀錄完整性。尚需班級試教驗證難度與學習成效。</p></details>
    <footer className="gg-footer"><span>{saved?'配置與文字保存在此瀏覽器；同意統計時傳送結果摘要。':'無法自動保存，離開前請下載紀錄。'}</span><button disabled={playing} onClick={()=>setResetting(true)}>重新開始</button></footer>
    {resetting&&<div className="gg-reset" role="group" aria-label="確認重設"><p>清除本款遊戲的本機配置、實驗及解釋？</p><a href={link} download={`${c.short}-實驗紀錄.txt`}>先下載紀錄</a><button onClick={()=>setResetting(false)}>保留</button><button onClick={reset}>清除並重新開始</button></div>}
    <div className="gg-actionbar" role="region" aria-label="現在要做">
      {hintOpen&&<div className="gg-bar-hint" role="status"><p>{hintText}</p>{heat&&step<=1&&!playing&&<button onClick={()=>{setHintOpen(false);setDemo('plant');requestAnimationFrame(()=>stage.current?.scrollIntoView({behavior:'instant',block:'start'}));}}>再看一次示範動畫</button>}</div>}
      <div className="gg-bar-row"><p className="gg-now" aria-live="polite"><b>現在要做：</b>{now}</p><button className="gg-bar-hint-btn" aria-expanded={hintOpen} onClick={()=>setHintOpen(!hintOpen)}>{hintOpen?'收起提示':'？ 提示'}</button>{action}</div>
    </div>
  </main>;
}
