'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {parts,bins,upgrades,directions,screwLabel,obstacle,guidedRemove,nextAccessible,fresh,budget,validDesign,issue,release,remove,identify,sort,complete,comparison,results,restore,standardRun,type Upgrade,type Id,type Direction,type Tool,type State} from './model';
import './recycling.css';
const Scene=dynamic(()=>import('./RecyclingScene'),{ssr:false,loading:()=> <div className="rc-scene">工作桌準備中…</div>});
const EMPTY:Upgrade[]=[];
const stepNames=['接收與安全','拆開產品','辨識與分類','改良設計','比較回收成本'];
const SAVE='cce-recycling-design-v1';
export default function RecyclingLab(){
 const [step,setStep]=useState(0),[state,setState]=useState<State>(fresh),[design,setDesign]=useState<Upgrade[]>([]),[trialDesign,setTrialDesign]=useState<Upgrade[]>([]),[revised,setRevised]=useState(false);
 const [selected,setSelected]=useState<Id>('cap'),[tool,setTool]=useState<Tool>('PH1'),[direction,setDirection]=useState<Direction>('up');
 const [view,setView]=useState<'orbit'|'front'|'back'|'top'>('orbit'),[viewNonce,setViewNonce]=useState(0),[cutaway,setCutaway]=useState(false);
 const [message,setMessage]=useState('先讀情境，完成電池安全分流。'),[error,setError]=useState(false),[safety,setSafety]=useState(false),[reflection,setReflection]=useState(''),[loaded,setLoaded]=useState(false),[saved,setSaved]=useState(true),[resetConfirm,setResetConfirm]=useState(false);
 const [replay,setReplay]=useState<number|null>(null),[busy,setBusy]=useState(false);
 const actionTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(actionTimer.current)clearTimeout(actionTimer.current);},[]);
 const task=useRef<HTMLDivElement>(null),bench=useRef<HTMLElement>(null);
 useEffect(()=>{try{const s=restore(localStorage.getItem(SAVE));setDesign(s.design);setReflection(s.reflection);}catch{setSaved(false);}setLoaded(true);},[]);
 useEffect(()=>{if(!loaded)return;try{localStorage.setItem(SAVE,JSON.stringify({design,reflection}));setSaved(true);}catch{setSaved(false);}},[design,reflection,loaded]);
 const working=step>=3?design:trialDesign;
 const all=useMemo(()=>parts(working),[working]),part=all.find(p=>p.id===selected)!;
 const compare=useMemo(()=>comparison(design),[design]);
 const record=results(trialDesign,state),classified=parts(trialDesign).filter(p=>state.bins[p.id]===p.bin).length;
 const events=useMemo(()=>{
  // Build replay from a deterministic worker, never from the learner's reading speed.
  return compare.after;
 },[compare]);
 const [replayRemoved,setReplayRemoved]=useState<Id[]>([]);
 useEffect(()=>{if(replay===null)return;const removals=standardRun(design).events.filter(e=>e.kind==='remove');if(replay>=removals.length){setReplay(null);return;}const timer=setTimeout(()=>{setReplayRemoved(removals.slice(0,replay+1).map(e=>e.id!));setSelected(removals[replay].id!);setDirection(parts(design).find(p=>p.id===removals[replay].id)!.direction);setReplay(replay+1);},650);return()=>clearTimeout(timer);},[replay,design]);
 function tell(text:string,bad=false){setMessage(text);setError(bad);}
 function go(n:number){if(actionTimer.current)clearTimeout(actionTimer.current);setBusy(false);setStep(n);setReplay(null);setReplayRemoved([]);tell(n===3?'選擇改版項目，最多使用 3 點。':'照操作卡完成目前步驟。');requestAnimationFrame(()=>(n===1?bench.current:task.current)?.scrollIntoView({behavior:'instant',block:'start'}));}
 function pick(id:Id){if(busy)return;setSelected(id);const p=parts(working).find(p=>p.id===id)!;setDirection(p.direction);setView(p.direction==='back'?'back':p.direction==='front'?'front':'orbit');setViewNonce(n=>n+1);if(step===2)setState(s=>identify(working,s,id));tell(p.note);}
 function dismantle(){if(busy)return;const result=guidedRemove(working,state,selected);if(result.error){tell(result.error,true);return;}setState(result.state);setBusy(true);tell('正在解除固定並移出'+part.name.slice(3)+'…');actionTimer.current=setTimeout(()=>{setBusy(false);const next=nextAccessible(working,result.state);if(next){setSelected(next);const p=parts(working).find(p=>p.id===next)!;setDirection(p.direction);setView(p.direction==='back'?'back':p.direction==='front'?'front':'orbit');setViewNonce(n=>n+1);tell('已拆下'+part.name.slice(3)+'。接下來：'+p.name.slice(3)+'。');}else tell('全部拆好了！下一步辨識材質並分類。');},matchMedia('(prefers-reduced-motion: reduce)').matches?120:1250);}
 function beginSorting(){setSelected('cap');setState(s=>identify(working,s,'cap'));go(2);}
 function apply(result:{state:State;error?:string},success:string){if(result.error){tell(result.error,true);return;}setState(result.state);tell(success);}
 function doRemove(){const result=remove(working,state,selected,direction);apply(result,'零件已移到桌邊。選下一個零件，或進入分類。');}
 function toggle(id:Upgrade){const next=design.includes(id)?design.filter(x=>x!==id):[...design,id];if(!validDesign(next)){tell(next.includes('plastic')&&next.includes('separate')?'統一 PC 與獨立 PP 是兩種替代方案，請擇一。':'改版點數不足。先取消一項，再選新的設計。',true);return;}setDesign(next);setReplayRemoved([]);tell('設計已更新。可用剖視查看構造，再測試成本。');}
 function startTrial(){const initial={...fresh(),safe:true};const first=nextAccessible(design,initial)!;const p=parts(design).find(p=>p.id===first)!;setTrialDesign([...design]);setState(initial);setSelected(first);setTool(p.tool);setDirection(p.direction);setView(p.direction==='front'?'front':'orbit');setViewNonce(n=>n+1);setRevised(true);go(1);}
 const activeIssue=step===1?issue(working,state,selected,part.direction):null;
 const blockedBy=step===1?obstacle(working,state,selected,part.direction):undefined;
 const nextPart=nextAccessible(working,state);
 const removed=step>=3?replayRemoved:state.removed;
 const report=`為回收而設計｜5.2-III\n改版：${design.map(id=>upgrades.find(u=>u.id===id)!.name).join('、')||'原版'}\n標準作業：${compare.before.seconds} → ${compare.after.seconds} 秒／台\n回收淨成本：${compare.before.cost} → ${compare.after.cost} 點／台\n100 台扣除改版及新增製造費後節省：${compare.batchSavings} 點\n專業處理待後續：${compare.after.professional} g／台（不視為已再生）\n我的解釋：${reflection}\n所有秒數、質量、成本與材料接收條件為教學模型；不代表實際作業指示或報價。`;
 return <main className={`rc-lab rc-v2 rc-step-${step}`} >
  <nav className="rc-top"><Link href="/package/5.2-III/">← 返回教案</Link><span>主題五 · 後碳經濟</span><span>約 15–20 分鐘</span></nav>
  <header className="rc-header"><div><p className="rc-eyebrow">CIRCULAR DESIGN LAB / 05</p><h1>產品回家之後<span>為回收而設計</span></h1><p>拆一盞露營燈，看看哪些設計讓回收更困難。</p></div><div className="rc-batch"><b>100<span> 台</span></b><small>同批回收・比較設計</small></div></header>
  <ol className="rc-steps" aria-label="遊戲操作順序">{stepNames.map((s,i)=><li key={s} aria-current={step===i?'step':undefined} className={step>i?'done':''}><span>{step>i?'✓':`0${i+1}`}</span><b>{s}</b></li>)}</ol>
  {step===0&&<section className="rc-story"><p className="rc-eyebrow">你的任務</p><h2>回收帳單，寄回了你的公司。</h2><p>一批已無法繼續使用的小燈回到回收中心。多種螺絲要換工具，黏合塑膠難分類，藏在裡面的電池也需要安全處理。<strong>你有 3 點改版資源，要讓下次回收更容易。</strong></p><div><span>① 拆一台，看見困難</span><span>② 改設計，保留功能</span><span>③ 算一批，比較成本</span></div></section>}
  <div className="rc-layout">
   <section className="rc-workbench" aria-label="立體拆解工作桌" ref={bench}>
    <div className="rc-bench-head"><span><i/>{step>=3?'改版預覽':revised?'新版・親手驗證':'原版・回收工作桌'}</span><span>{step>=3?`${budget(design)} / 3 改版點`:`${state.removed.length} / 8 已移出`}</span></div>

    <div className="rc-views" role="group" aria-label="視角">{([['orbit','立體'],['front','正面'],['back','背面'],['top','俯視']] as const).map(([v,label])=><button key={v} aria-pressed={view===v} onClick={()=>{setView(v);setViewNonce(n=>n+1);}}>{label}</button>)}<button aria-pressed={cutaway} onClick={()=>setCutaway(!cutaway)}>透視外殼 {cutaway?'開':'關'}</button></div>
    <Scene design={working} selected={selected} removed={removed} direction={direction} view={view} viewNonce={viewNonce} cutaway={cutaway} onPick={pick} busy={busy} inspection={step===2}/>
    {step===1?<div className="rc-direct-action">
     <div className="rc-action-heading"><span className="rc-step-bubble">{Math.min(8,state.removed.length+(busy?0:1))}</span><div><small>{busy?'正在拆卸':state.removed.length===8?'拆解完成':'目前拆卸部位'}</small><h2>{state.removed.length===8?'八個模組都拆好了':part.name.slice(3)}</h2></div><span className="rc-counter">{state.removed.length} / 8</span></div>
     <p>{state.removed.length===8?'接下來分清楚材質，看看哪些材料可以一起回收。':busy?'觀察螺絲與零件如何離開產品。':activeIssue&&!state.removed.includes(selected)?activeIssue:part.note}</p>
     {state.removed.length<8&&<div className="rc-auto-tool" style={{visibility:busy?'hidden':'visible'}}><span>工具：{part.tool}</span>{screwLabel(selected,working)&&<span>{screwLabel(selected,working)}</span>}<span>{directions[part.direction]}</span></div>}
     {state.removed.length===8?<button className="rc-primary" disabled={busy} onClick={beginSorting}>拆好了，開始分類 →</button>:busy?<button className="rc-primary" disabled>正在拆出零件…</button>:state.removed.includes(selected)?<button className="rc-primary" onClick={()=>nextPart&&pick(nextPart)}>繼續拆下一個部位 →</button>:blockedBy?<button className="rc-primary" onClick={()=>pick(blockedBy.id)}>先查看擋住的{blockedBy.name.slice(3)} →</button>:<button className="rc-primary" onClick={dismantle}>{selected==='battery'?'交專業工位移出完整模組':part.screws?'卸下螺絲，拆出'+part.name.slice(3):'拆出'+part.name.slice(3)} →</button>}
     <small className="rc-direct-note">工具與方向自動對準；你可以點產品，選擇其他部位。</small>
    </div>:<div className="rc-selected-caption"><span>正在查看</span><b>{part.name}</b><p>{part.note}</p></div>}
    {step>0&&<details className="rc-parts-drawer"><summary>零件清單 · {removed.length} / 8 已拆下（可改選部位）</summary><div className="rc-part-grid" aria-label="用按鈕選取零件">{all.map(p=><button key={p.id} disabled={busy} aria-pressed={selected===p.id} onClick={()=>pick(p.id)}><span className="rc-part-dot" style={{background:`#${p.color.toString(16).padStart(6,'0')}`}}/><span>{p.name}<small>{step>=3?'設計預覽':state.bins[p.id]===p.bin?'✓ 已分類':state.removed.includes(p.id)?'✓ 已拆下':issue(working,{...state,safe:true},p.id,p.direction)?'被其他零件擋住':'可拆卸'}</small></span></button>)}</div></details>}
   </section>
   <aside className="rc-panel" ref={task}>
    <p className="rc-eyebrow">目前步驟 0{step+1} / 05</p>
    <h2>{step===0?'先把安全放在前面':step===1?'先看產品，再拆零件':step===2?'看材質，再選去向':step===3?'讓下次回收容易一點':'設計改變了哪些成本？'}</h2>
    {step>1&&<button className="rc-mobile-jump" onClick={()=>bench.current?.scrollIntoView({behavior:'instant',block:'start'})}>查看 3D・遮擋與移出方向 ↓</button>}
    {step===2&&<label className="rc-part-select">先選一個零件<select aria-label="選擇操作零件" value={selected} onChange={e=>pick(e.target.value as Id)}>{all.map(p=><option key={p.id} value={p.id}>{p.name}{step===2&&state.bins[p.id]===p.bin?' ✓ 已分類':state.removed.includes(p.id)?' · 已移出':''}</option>)}</select></label>}
    {step===0?<>
     <p>這批有一台外殼鼓起、疑似電池異常。你會怎麼做？</p><div className="rc-choices"><button onClick={()=>tell('疑似異常不能繼續拆卸，也不能混入一般材料。請重新選擇。',true)}>先打開，拆快一點</button><button className={safety?'chosen':''} onClick={()=>{setSafety(true);tell('正確。異常整機已交由專業單位；接下來使用另一台已完成專業安全檢查的虛擬樣品。');}}>停止拆卸，交專業處理</button><button onClick={()=>tell('含電池產品不能直接投入一般材料回收。請重新選擇。',true)}>整台丟入塑膠回收</button></div>
     <p className="rc-note">本遊戲只模擬完整模組的分離與交接，不拆電芯。實體課堂請使用無電池教具。</p>
     <button className="rc-primary" disabled={!safety||!loaded} onClick={()=>{setState({...fresh(),safe:true});setTrialDesign(EMPTY);go(1);}}>開始拆解安全樣品 →</button>
    </>:step===1?<>
     <p>在模型下方按一次，即可完成該零件的拆卸。系統接著帶你看下一個能拆的部位。</p>
     <ol className="rc-simple-guide"><li><b>看</b><span>目前部位會亮起，模型自動轉到可操作角度。</span></li><li><b>拆</b><span>按「拆出」，觀察固定點與移出順序。</span></li><li><b>想</b><span>為了取出電池，得先移開哪些零件？</span></li></ol>
     <p className="rc-note">這輪先體驗拆解的難處；下一輪再用有限資源改良設計。工具切換仍列入成本，不需要重複點選。</p>
     <div className="rc-progress"><span>拆解進度</span><b>{state.removed.length} / 8</b><progress max={8} value={state.removed.length}/></div>
    </>:step===2?<>
     <p>分類依照材質與處理需求，不能只看外觀。錯放的材料可重新選桶，但會增加分選工時。</p>
     <div className="rc-part-card"><h3>{part.name}</h3>{state.identified.includes(selected)?<><b className="rc-material">{part.material}</b><p>{part.mass} g · {bins.find(b=>b.id===part.bin)!.detail}</p></>:<><p>先送鑑別台，確認材質。</p><button className="rc-secondary" onClick={()=>{setState(identify(working,state,selected));tell('材質卡已展開，請選合適的處理途徑。');}}>查看材質卡</button></>}</div>
     <div className="rc-bin-grid">{bins.map(b=><button key={b.id} disabled={!state.identified.includes(selected)} aria-pressed={state.bins[selected]===b.id} onClick={()=>{const result=sort(working,state,selected,b.id);apply(result,b.id===part.bin?'分類正確。選下一個尚未完成的零件。':'這批材料不符合此桶接收條件，請依材質卡重新分選。');if(!result.error&&b.id!==part.bin)setError(true);if(!result.error&&b.id===part.bin){const next=all.find(p=>result.state.bins[p.id]!==p.bin);if(next){setState(identify(working,result.state,next.id));setSelected(next.id);}};}}>{b.name}{state.bins[selected]===b.id?' ✓':''}</button>)}</div>
     <div className="rc-progress"><span>正確分流</span><b>{classified} / 8</b><progress max={8} value={classified}/></div>
     <button className="rc-primary" disabled={!complete(working,state)} onClick={()=>go(revised?4:3)}>{revised?'完成驗證，回到比較':'看回收帳單，改良設計'} →</button>
    </>:step===3?<>
     <p>公司要支付這些回收費用。你能改 3 點；先找最值得改善的瓶頸。</p><div className="rc-baseline"><span>原版標準作業</span><b>{compare.before.seconds} 秒 / 台</b><span>回收淨成本</span><b>{compare.before.cost} 點 / 台</b></div>
     <div className="rc-budget">剩餘改版點數 <b>{3-budget(design)} / 3</b></div>
     <div className="rc-upgrades">{upgrades.map(u=><button key={u.id} aria-pressed={design.includes(u.id)} onClick={()=>toggle(u.id)}><span>{design.includes(u.id)?'✓':'＋'}</span><div><b>{u.name}</b><small>{u.detail}</small></div><em>{u.cost} 點</em></button>)}</div>
     <p className="rc-note">所有候選方案已預設通過功能與固定要求。「統一 PC」與「獨立 PP」擇一；不能任意少鎖螺絲。</p>
     <button className="rc-primary" disabled={!design.length} onClick={()=>go(4)}>測試同一批 100 台 →</button>
    </>:<>
     <p>兩版採相同作業策略、費率與回收數量。你的閱讀與思考時間都不計費。</p>
     <div className="rc-score"><small>每台回收淨成本</small><div><span>{compare.before.cost}</span><i>→</i><b>{compare.after.cost}</b></div><p>成本點 / 台 · 節省 {(compare.before.cost-compare.after.cost).toFixed(2)} 點</p></div>
     <dl className="rc-stats"><div><dt>模擬作業時間</dt><dd>{compare.before.seconds} → {events.seconds} 秒</dd></div><div><dt>工具準備次數</dt><dd>{compare.before.changes} → {events.changes}</dd></div><div><dt>分流規格確認次數</dt><dd>{compare.before.stations} → {events.stations}</dd></div><div><dt>符合規格的單一材料</dt><dd>{compare.before.pure} → {events.pure} g</dd></div><div><dt>複合材料處理</dt><dd>{compare.before.mixed} → {events.mixed} g</dd></div><div><dt>專業處理交接，待後續</dt><dd>{events.professional} g / 台</dd></div></dl>
     <button className="rc-secondary" disabled={replay!==null} onClick={()=>{setReplayRemoved([]);setReplay(0);}}>{replay!==null?'正在重播標準拆解…':'▶ 看新版的標準拆解順序'}</button>
     <button className="rc-secondary" onClick={startTrial}>親手拆新版，驗證空間差異</button>
     <button className="rc-primary" onClick={()=>go(3)}>調整設計，再比一次 ↺</button>
    </>}
    <div className={`rc-feedback ${error?'error':''}`} role={error?'alert':'status'}>{message}</div>
    {step===1||step===2?<details className="rc-log"><summary>本次作業紀錄 · {record.seconds} 模擬秒</summary><ul>{state.events.map((e,i)=><li key={i}><span>{e.label}</span><b>＋{e.seconds}s</b></li>)}</ul><p>思考時間不計費；作業次序和重新分類會影響此紀錄。最終設計比較另用一致的標準作業。</p></details>:null}
   </aside>
  </div>
  {step===4&&<section className="rc-result-section"><div><p className="rc-eyebrow">THE RETURN BILL</p><h2>省在回收，也要算進設計。</h2><p>100 台回收的情境假設，不代表法定回收率。所有數值都是教學示意。</p></div><div className="rc-bill"><div><span>100 台回收費用減少</span><b>{((compare.before.cost-compare.after.cost)*100).toFixed(2)}</b></div><div><span>減：新增製造費用</span><b>−{(compare.manufacturing*100).toFixed(2)}</b></div><div><span>減：一次性改版費用</span><b>−{compare.development.toFixed(2)}</b></div><div className="rc-bill-total"><span>本批淨節省</span><b>{compare.batchSavings.toFixed(2)} 點</b></div></div><details><summary>展開每台回收帳單與材料去向</summary><div className="rc-table-scroll"><table><thead><tr><th>成本項目（點／台）</th><th>原版</th><th>新版</th></tr></thead><tbody>{([['logistics','分攤收運'],['labor','作業工時'],['processing','專業與複合材料處理'],['income','扣除材料收入'],['cost','回收淨成本']] as const).map(([key,title])=><tr key={key}><th>{title}</th><td>{compare.before[key]}</td><td>{compare.after[key]}</td></tr>)}</tbody></table></div><p>新版材料帳：單一材料 {events.pure} g ＋ 複合材料 {events.mixed} g ＋ 專業交接 {events.professional} g ＋ 未完成分流 {events.unresolved} g ＝ {events.total} g。這是分流質量，並非全部已完成再生；固定件質量未另估。</p></details><label className="rc-reflection"><b>用一項證據說明你的改版</b><textarea value={reflection} onChange={e=>setReflection(e.target.value)} maxLength={1000} rows={3} placeholder="我把＿＿改成＿＿，少了＿＿步／減少混料。每台成本從＿＿變成＿＿，但仍需保留＿＿安全條件。"/></label><a className={`rc-primary rc-download ${reflection.trim().length<15?'disabled':''}`} aria-disabled={reflection.trim().length<15} href={reflection.trim().length>=15?'data:text/plain;charset=utf-8,'+encodeURIComponent('\ufeff'+report):undefined} download="為回收而設計-我的設計紀錄.txt">下載設計紀錄（說明至少 15 字）↓</a></section>}
  <details className="rc-teacher"><summary>教師備註 · 模型、來源與學習重點</summary><p>5.2-III 循環經濟延伸活動。透過螺絲標準化、材質分離及安全可拆性，理解生命終期成本與生產者責任。EPR 是生產者承擔消費後管理的財務及／或實體責任；依制度也可由共同組織履行，不等於每家原廠親自逐件拆解。</p><p>這是簡化 3D 結構模型：包圍盒掃掠判斷移出空間，固定工具與依賴順序決定作業。未模擬真實電路、電池拆卸程序、樹脂化學或工廠報價。外觀為虛構攜帶燈，細節化模型與簡化碰撞界線共用拆卸位置；每台 760 g 示意材料；單一材質只代表符合本場設定的接收規格。所有方案預設維持產品功能。電池及電路交接不直接算為已再生材料。模型只比較回收作業，不提供完整生命週期環境評估。</p><p><a href="https://publications.jrc.ec.europa.eu/repository/handle/JRC101479" target="_blank" rel="noreferrer">JRC 拆解難易度研究 ↗</a> · <a href="https://www.epa.gov/recycle/used-lithium-ion-batteries" target="_blank" rel="noreferrer">EPA 電池處理 ↗</a> · <a href="https://www.oecd.org/en/publications/global-plastics-outlook_de747aef-en/full-report/component-11.html" target="_blank" rel="noreferrer">OECD 生產者責任 ↗</a></p></details>
  <footer className="rc-footer"><span>{saved?'本機僅保存改版選擇與文字說明；重新整理會從安全引導開始。':'本機儲存不可用，離開前請下載設計紀錄。'}</span><button onClick={()=>setResetConfirm(true)}>重新開始</button></footer>
  {resetConfirm&&<div className="rc-reset" role="group" aria-label="重新開始確認"><p>清除這款遊戲的設計與說明，重新開始？</p><button onClick={()=>setResetConfirm(false)}>保留</button><button onClick={()=>{setState(fresh());setDesign([]);setTrialDesign([]);setRevised(false);setSafety(false);setReflection('');setSelected('cap');setResetConfirm(false);go(0);}}>清除並開始</button></div>}
 </main>;
}
