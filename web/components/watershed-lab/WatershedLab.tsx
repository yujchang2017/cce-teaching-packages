'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {BUDGET,RAIN_COUNT,facilityInfo,placementIssue,simulate,signature,meetsChallenge,restoreLab,sites,snap,type Facility,type FacilityKind,type Run,type Experiment} from './hydrology';
import type {Tool,View} from './WatershedScene';
import './watershed-lab.css';
const Scene=dynamic(()=>import('./WatershedScene'),{ssr:false,loading:()=> <div className="wl-scene wl-loading">展開流域實驗台…</div>});
type Step='observe'|'build'|'predict'|'review'|'explain';
const steps:Step[]=['observe','build','predict','review','explain'];
const stepNames=['觀察水路','放置設施','預測・降雨','比較・修正','說明發現'];
const SAVE_KEY='cce-watershed-lab-v2';
const metricLabels={school:'流向學校',stream:'流向溪流',ground:'進入地下',tank:'收進水槽',pooled:'地表停留'} as const;
export default function WatershedLab(){
  const [facilities,setFacilities]=useState<Facility[]>([]),[history,setHistory]=useState<Experiment[]>([]),[reflection,setReflection]=useState('');
  const [loaded,setLoaded]=useState(false),[saved,setSaved]=useState(true),[tool,setTool]=useState<Tool>('inspect'),[selected,setSelected]=useState<string|null>(null);
  const [run,setRun]=useState<Run|null>(null),[snapshot,setSnapshot]=useState<Experiment|null>(null),[playing,setPlaying]=useState(false),[paused,setPaused]=useState(false),[time,setTime]=useState(0);
  const replaying=useRef(false);
  const [step,setStep]=useState<Step>('observe');
  const taskPanel=useRef<HTMLDivElement>(null),stage=useRef<HTMLElement>(null);
  function go(next:Step){setStep(next);setTool('inspect');setError(false);requestAnimationFrame(()=>taskPanel.current?.scrollIntoView({behavior:'instant',block:'start'}));}
  const [paths,setPaths]=useState(true),[section,setSection]=useState(false),[view,setView]=useState<View>('orbit'),[viewNonce,setViewNonce]=useState(0),[reduced,setReduced]=useState(false);
  const [prediction,setPrediction]=useState(''),[message,setMessage]=useState('先觀察原始地形：按「下一場雨」，看看水往哪裡走。'),[error,setError]=useState(false),[resetting,setResetting]=useState(false);
  const [sound,setSound]=useState(false);const audio=useRef<AudioContext|null>(null);
  const baseline=useMemo(()=>simulate([]),[]);
  useEffect(()=>{
    try{const s=restoreLab(localStorage.getItem(SAVE_KEY));setFacilities(s.facilities);setHistory(s.history);setReflection(s.reflection);const last=s.history.at(-1);if(last){setRun(simulate(last.facilities));setSnapshot(last);setTime(100);setStep(signature(last.facilities)!==signature(s.facilities)?'build':last.facilities.length?'review':'observe');setMessage('已恢復你的實驗紀錄。可以移動設施，繼續比較。');}}catch{setSaved(false);}
    const mq=matchMedia('(prefers-reduced-motion: reduce)');setReduced(mq.matches);const changed=()=>setReduced(mq.matches);mq.addEventListener('change',changed);setLoaded(true);
    return()=>{mq.removeEventListener('change',changed);void audio.current?.close();};
  },[]);
  useEffect(()=>{if(!loaded)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({version:2,facilities,history,reflection}));setSaved(true);}catch{setSaved(false);}},[loaded,facilities,history,reflection]);
  useEffect(()=>{
    if(!playing||paused)return;let raf=0,last=performance.now();
    const tick=(now:number)=>{const delta=Math.min(80,now-last);last=now;setTime(t=>Math.min(100,t+delta/75));raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
  },[playing,paused]);
  useEffect(()=>{
    if(!playing||time<100)return;setPlaying(false);setPaused(false);
    if(snapshot&&!replaying.current){setHistory(old=>[...old,snapshot].slice(-6));const result=simulate(snapshot.facilities);setStep(snapshot.facilities.length?'review':'observe');if(matchMedia('(max-width:800px)').matches)requestAnimationFrame(()=>taskPanel.current?.scrollIntoView({behavior:'instant',block:'start'}));setError(false);setMessage(snapshot.facilities.length===0?'這是原始水路。旋轉看看分水嶺，再選設施、放進地形。':meetsChallenge(result)?'三個目標都達成了！請用水量變化與空間位置解釋原因。':'實驗完成。比較水量與水路，試著移動設施再驗證。');}
  },[playing,time,snapshot]);
  const hasBaseline=history.length>0;
  const used=facilities.reduce((n,f)=>n+facilityInfo[f.kind].cost,0);
  const current=snapshot&&signature(snapshot.facilities)===signature(facilities);
  const success=!!run&&!playing&&!!current&&meetsChallenge(run);
  const complete=success&&reflection.trim().length>=20;
  const selectedFacility=facilities.find(f=>f.id===selected);
  function tell(text:string,isError=false){setMessage(text);setError(isError);}
  function chooseView(next:View){setView(next);setViewNonce(n=>n+1);setSection(next==='section');}
  function selectTool(next:Tool){if(!hasBaseline){tell('先觀察一次沒有設施的降雨，再進行改造。');return;}setTool(next);if(next!=='inspect'&&matchMedia('(max-width:800px)').matches)requestAnimationFrame(()=>stage.current?.scrollIntoView({behavior:'instant',block:'start'}));tell(next==='inspect'?'拖曳旋轉地形，點選已放置的設施可以移動。':next==='move'?'在地形點選新位置；水只能往低處流。':`在地形點一下，放置${facilityInfo[next].title}。`);}
  function place(x:number,z:number){
    if(playing||step!=='build'||!hasBaseline||tool==='inspect')return;
    if(tool==='move'&&!selectedFacility){tell('先選一座已放置的設施。',true);return;}
    const next:Facility=tool==='move'?{...selectedFacility!,x:snap(x),z:snap(z)}:{id:`f-${Date.now()}`,kind:tool as FacilityKind,x:snap(x),z:snap(z)};
    const issue=placementIssue(facilities,next,tool==='move'?selected??undefined:undefined);
    if(issue){tell(issue,true);return;}
    setFacilities(old=>tool==='move'?old.map(f=>f.id===selected?next:f):[...old,next]);setSelected(next.id);setTool('inspect');setPrediction('');
    tell(`已${tool==='move'?'移動':'放置'}${facilityInfo[next.kind].title}。先預測，再用同一場雨測試。`);
  }
  function move(){if(selectedFacility)selectTool('move');}
  function remove(){if(playing||!selected)return;setFacilities(old=>old.filter(f=>f.id!==selected));setSelected(null);setTool('inspect');setPrediction('');tell('設施已移除；可重新選位置。');}
  function start(replay=false){
    if(playing)return;
    if(!replay&&hasBaseline&&(!prediction||!facilities.length)){tell('先放置設施，並選擇你的預測。',true);return;}
    const record=replay&&snapshot?snapshot:{facilities:hasBaseline?facilities.map(f=>({...f})):[],prediction:hasBaseline?prediction:'觀察原始地形'};
    replaying.current=replay;if(matchMedia('(max-width:800px)').matches)requestAnimationFrame(()=>stage.current?.scrollIntoView({behavior:'instant',block:'start'}));setSnapshot(record);setRun(simulate(record.facilities));setTime(reduced?100:0);setPaused(false);setPlaying(true);setTool('inspect');tell('正在降雨。試著轉到側面，或剖開土層追蹤水滴。');
    if(sound){try{const a=audio.current??new AudioContext();audio.current=a;void a.resume();const o=a.createOscillator(),g=a.createGain();o.frequency.value=520;g.gain.setValueAtTime(.035,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.3);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.32);o.onended=()=>{o.disconnect();g.disconnect();};}catch{setSound(false);}}
  }
  function selectFacility(id:string){if(step!=='build'||playing)return;setSelected(id);setTool('move');tell('已選中設施。在地形上點新位置，或使用下方位置按鈕。');}
  function reset(){go('observe');setFacilities([]);setHistory([]);setReflection('');setRun(null);setSnapshot(null);setTime(0);setPlaying(false);setPaused(false);setPrediction('');setSelected(null);setTool('inspect');setResetting(false);tell('新的實驗開始了。先觀察沒有設施的水路。');}
  const report=['流域實驗室｜一場雨，兩條路','4.2-III 安全與復原力策略：水路空間實驗補充活動','',...history.flatMap((h,i)=>{const r=simulate(h.facilities);return[`實驗 ${i+1}：${h.prediction}`,`布設：${h.facilities.map(f=>`${facilityInfo[f.kind].title}（${f.x}, ${f.z}）`).join('；')||'無設施'}`,`示意水量：${Object.entries(r.totals).map(([k,v])=>`${metricLabels[k as keyof typeof metricLabels]} ${v}`).join('；')}`,''];}),`我的解釋：${reflection}`,'','每次相同 72 份示意雨水；不代表真實水文預測。文字論證由師生討論。','教材內容 CC BY-SA 4.0 · 115 年中小學氣候變遷教育推動計畫'].join('\n');

  return <main className="watershed-lab">
    <div className="wl-top"><Link href="/package/4.2-III/">← 返回教案</Link><span>4.2-III / 韌性建構・水路實驗</span><div><button type="button" aria-pressed={sound} onClick={()=>setSound(!sound)}>{sound?'♪ 音效開':'♪ 音效關'}</button><button type="button" aria-pressed={reduced} onClick={()=>setReduced(!reduced)}>{reduced?'直接呈現結果':'減少動畫'}</button></div></div>
    <header className="wl-header"><div><p className="wl-kicker">流域實驗室 · 4.2-III</p><h1>一場雨，<em>兩條路。</em></h1><p>跟著 5 個步驟，用兩座設施替雨水找出路。</p></div><span className="wl-duration">約 10–15 分鐘</span></header>
    <ol className="wl-steps" aria-label="實驗操作順序">{steps.map((s,i)=><li key={s} aria-current={step===s?'step':undefined} className={steps.indexOf(step)>i?'past':''}><span>{steps.indexOf(step)>i?'✓':i+1}</span><b>{stepNames[i]}</b></li>)}</ol>
    <div className="wl-game-grid">
      <section className="wl-stage" aria-label="流域空間實驗台" ref={stage}>
        <div className="wl-stage-bar"><span><i className="wl-dot"/>拖曳地形可旋轉</span><div role="group" aria-label="觀察視角"><button type="button" aria-pressed={view==='orbit'} onClick={()=>chooseView('orbit')}>立體</button><button type="button" aria-pressed={view==='top'} onClick={()=>chooseView('top')}>俯視</button><button type="button" aria-pressed={section} onClick={()=>chooseView(section?'orbit':'section')}>地下剖面</button></div></div>
        <div className="wl-scene-guide" role="status">{playing?<><b>{paused?'已暫停':'正在降雨'} · {Math.round(time)}%</b><span>追蹤水滴；可切換視角或暫停。</span></>:step==='build'?<><b>{tool==='inspect'?(facilities.length?'✓ 位置已放好':'2A · 先選一種設施'):tool==='move'?'2B · 點地形上的新位置':`2B · 點地形，放置${facilityInfo[tool].title}`}</b><span>{tool==='inspect'?(facilities.length?'按「做預測」繼續；也可回操作卡增加或移動設施。':'在操作卡選擇設施，接著點地形。'):'短按放置；按住拖曳會旋轉，不會放置。'}</span>{facilities.length>0&&tool==='inspect'&&<button type="button" onClick={()=>go('predict')}>放好了，做預測 →</button>}</>:step==='observe'?<><b>{hasBaseline?'✓ 已看見原始水路':'1 · 先看水往哪裡走'}</b><span>{hasBaseline?'水沿山脊兩側流向不同出口。':'按「開始第一次降雨」，先觀察，不放設施。'}</span></>:<><b>{step==='predict'?'3 · 先選一個預測':step==='review'?'4 · 對照結果，決定下一步':'5 · 用位置與水量解釋'}</b><span>可旋轉地形，或切換地下剖面找證據。</span></>}</div>
        <Scene facilities={facilities} run={current?run:null} time={time} paths={paths} section={section} tool={step==='build'?tool:'inspect'} selected={selected} view={view} viewNonce={viewNonce} locked={playing} reduced={reduced} onPlace={place} onSelect={selectFacility}/>
        {!!run&&<div className="wl-playback"><div><button type="button" className="wl-mini" disabled={!current} onClick={()=>playing?setPaused(!paused):start(true)}>{playing?(paused?'▶ 繼續':'Ⅱ 暫停'):'↻ 重播水流'}</button><label className="wl-path-toggle"><input type="checkbox" checked={paths} onChange={e=>setPaths(e.target.checked)}/>顯示水路</label></div><label className="wl-time"><span>追蹤水滴</span><input aria-label="水滴播放進度" type="range" min={0} max={100} value={Math.round(time)} disabled={!current} onChange={e=>{setPaused(true);setTime(Number(e.target.value));}}/><span>{Math.round(time)}%</span></label></div>}
        <div className="wl-legend"><span><i className="school"/>流向學校</span><span><i className="stream"/>流向溪流</span><span><i className="ground"/>進入地下</span><span><i className="tank"/>收進水槽</span></div>
        {error&&<div className="wl-instruction error" role="alert">{message}</div>}
      </section>
      <aside className="wl-control" aria-label="目前步驟">
        <div className="wl-task" ref={taskPanel}>
          <p className="wl-task-number">目前步驟 {steps.indexOf(step)+1} / 5</p>
          <h2>{step==='observe'?(hasBaseline?'水路看清楚了嗎？':'先下一場雨，觀察水路'):step==='build'?(facilities.length?'位置已放好，準備做預測':'選設施，再點地形'):step==='predict'?'你覺得水會怎麼變？':step==='review'?(success?'三個目標都達成了！':'看看哪裡需要調整'):'用證據說明你的發現'}</h2>
          {playing?<div className="wl-playing"><p>{paused?'已暫停。繼續播放或直接查看結果。':'正在播放水流。試著切換「地下剖面」，觀察水的去向。'}</p><progress max={100} value={time} aria-label="降雨進度"/><button className="wl-primary" type="button" onClick={()=>setPaused(!paused)}>{paused?'繼續觀察水流 ▶':'暫停，仔細觀察 Ⅱ'}</button><button className="wl-secondary" type="button" onClick={()=>setTime(100)}>直接看結果 →</button></div>:
          step==='observe'?<><p>中央山脊把地形分成兩邊。觀察雨水分別流向哪裡，留下改造前的紀錄。</p>{hasBaseline?<><div className="wl-discovery"><b>第一次觀察</b><span>學校 36 份 · 溪流 36 份</span><small>轉動地形，找出水路中間的分水嶺。</small></div><button className="wl-primary" type="button" onClick={()=>go('build')}>下一步：放置設施 →</button></>:<><div className="wl-gesture"><span>① 按下方按鈕</span><span>② 看藍色水滴往哪裡流</span><span>③ 拖曳地形，換角度觀察</span></div><button className="wl-primary" type="button" disabled={!loaded} onClick={()=>start()}>開始第一次降雨 ↓</button><small className="wl-next">觀察完成後，才會開啟設施工具。</small></>}</>:
          step==='build'?<><p>{facilities.length?'可直接按下方「下一步」做預測；若要更換位置，先選已放置的設施。':'先選一種設施，再點地形上的位置。至少放一座，就能進入預測。'}</p><div className="wl-budget">材料剩餘 <b>{BUDGET-used} / {BUDGET}</b><span>已放 {facilities.length} / 2 座</span></div><div className="wl-tools">{(['garden','tank'] as const).map(kind=><button type="button" key={kind} className={tool===kind?'selected':''} aria-pressed={tool===kind} onClick={()=>selectTool(kind)} disabled={facilities.length>=2||BUDGET-used<facilityInfo[kind].cost}><span className="wl-tool-symbol">{kind==='garden'?'↧':'▱'}</span><span><b>{facilityInfo[kind].title}</b><small>{kind==='garden'?'引導水入滲':'留住地表水'} · 花費 {facilityInfo[kind].cost} 材料</small></span></button>)}</div>
          <div className={`wl-placement-prompt ${tool!=='inspect'?'active':''}`} role="status">{tool==='inspect'?(facilities.length?(facilities.length>=2?'✓ 已達兩座上限。可調整位置，或進入下一步。':'✓ 已放好。可以加一座，或進入下一步。'):'↑ 先選上方一種設施'):<><b>{tool==='move'?'正在移動設施':'已選好設施'}</b> → 現在點地形放置<button type="button" onClick={()=>setTool('inspect')}>取消</button></>}</div>
          {facilities.length>0&&<div className="wl-installed"><span>要換位置？先選已放置的設施：</span><div>{facilities.map((f,i)=><button type="button" key={f.id} aria-pressed={selected===f.id} onClick={()=>{setSelected(f.id);setTool('inspect');}}>{i+1} {facilityInfo[f.kind].title}</button>)}</div>{selectedFacility&&<div className="wl-edit"><button type="button" onClick={move}>移動這一座 ↗</button><button type="button" onClick={remove}>移除</button></div>}</div>}
          <details className="wl-keyboard"><summary>不好點地形？改用位置按鈕</summary><p>先選設施，再選一個位置。</p><div className="wl-site-grid">{sites.map(s=><button type="button" key={s.label} onClick={()=>place(s.x,s.z)} disabled={tool==='inspect'}>{s.label}</button>)}</div></details>
          {error&&<p className="wl-inline-error" role="alert">{message}</p>}<button className="wl-primary" type="button" disabled={!facilities.length} onClick={()=>go('predict')}>放好了，下一步：做預測 →</button>{!facilities.length&&<small className="wl-next">完成一座設施的放置後，才能繼續。</small>}</>:
          step==='predict'?<><p>位置已放好。選一個你認為會發生的變化，再用相同的雨量驗證。</p><fieldset className="wl-predictions"><legend>我的預測</legend>{['更多水會進入地下','更多水會收進水槽','流向學校的水會減少','這個位置可能接不到水'].map(value=><label key={value}><input type="radio" name="prediction" value={value} checked={prediction===value} onChange={()=>setPrediction(value)}/>{value}</label>)}</fieldset><button className="wl-primary" type="button" disabled={!prediction} onClick={()=>start()}>開始降雨，驗證我的預測 ↓</button>{!prediction&&<small className="wl-next">先選上方一個預測，按鈕就會開啟。</small>}<button className="wl-secondary" type="button" onClick={()=>go('build')}>← 返回調整設施</button></>:
          step==='review'?<><p>{success?'比較改造前後的水量。接著說明：設施的位置為什麼有效？':'先找出未達成的目標，再移動或更換設施，重新預測、降雨。'}</p><div className="wl-review-totals">{(['school','ground','stream','tank'] as const).map(key=><div key={key}><span>{metricLabels[key]}</span><b>{baseline.totals[key]} → {run?.totals[key]}</b></div>)}</div><small className="wl-next">左：沒有設施　右：這次實驗</small><button className="wl-primary" type="button" onClick={()=>go(success?'explain':'build')}>{success?'下一步：寫下我的解釋 →':'調整位置，再試一次 →'}</button>{success&&<button className="wl-secondary" type="button" onClick={()=>go('build')}>再試另一種布設</button>}</>:
          <><p>描述設施的位置，引用前後水量，再解釋兩者的關係。</p><label className="wl-answer"><span>我的空間推理</span><textarea value={reflection} onChange={e=>setReflection(e.target.value)} rows={5} maxLength={1500} placeholder="我把＿＿放在＿＿，因為水會＿＿。水量從＿＿變成＿＿，支持了我的想法。"/><small>{reflection.trim().length} / 至少 20 字 · 理由請和同學討論</small></label>{complete?<div className="wl-done" role="status">✓ 實驗與說明已完成</div>:<small className="wl-next">完成 20 字說明後，即可下載成果。</small>}<a className={`wl-primary ${!complete?'disabled':''}`} aria-disabled={!complete} href={complete?'data:text/plain;charset=utf-8,'+encodeURIComponent('\ufeff'+report):undefined} download="流域實驗室-我的實驗紀錄.txt">下載我的實驗紀錄 ↓</a><button className="wl-secondary" type="button" onClick={()=>go('review')}>← 返回比較結果</button></>}
        </div>
        <div className="wl-mission"><h3>這次要完成的 3 個目標</h3><ul className="wl-goals"><li className={!!run&&!playing&&current&&run.totals.school<=12?'met':''}><span>①</span>流向學校 <b>≤ 12</b></li><li className={!!run&&!playing&&current&&run.totals.ground>=12?'met':''}><span>②</span>進入地下 <b>≥ 12</b></li><li className={!!run&&!playing&&current&&run.totals.stream>=24?'met':''}><span>③</span>保留溪流 <b>≥ 24</b></li></ul><small>每次 72 份示意雨水；最多 2 座設施。</small></div>
      </aside>
    </div>

    {history.length>0&&(step==='review'||step==='explain')&&<section className="wl-results" aria-label="實驗水量比較"><div className="wl-results-heading"><div><p className="wl-kicker">FOLLOW THE EVIDENCE</p><h2>{success?'你留住了水，也留出了路。':'看結果，修正你的想法。'}</h2></div><span className={`wl-result-status ${success?'success':''}`}>{playing?'觀察水滴移動中':!current?'設施已更動，請重新驗證':success?'三個目標達成':'繼續實驗'}</span></div>
      <div className="wl-metrics">{(['school','ground','stream','tank'] as const).map(key=><div className={`wl-metric ${key}`} key={key}><span><i/>{metricLabels[key]}</span><div><small>{baseline.totals[key]}</small><em>→</em><b>{run&&!playing?run.totals[key]:'—'}</b></div><p>原始地形 → {playing?'本次結果待觀察':'上次實驗'}</p></div>)}</div>
      <p className="wl-evidence-note">{playing?'觀察水滴經過哪些設施，以及裝滿後繼續往哪裡流；暫停後可切換視角追蹤。':!current?'設施位置已改變。選擇你的預測，再下一場相同的雨，檢查新的水路。':snapshot?.facilities.length===0?'這是沒有設施的對照結果。先辨認兩側的水路，再選擇你要改造的位置。':success?'想一想：為什麼設施放在這一側有效？如果移到分水嶺另一側，水還會經過嗎？':run&&run.totals.tank+run.totals.ground===0?'接不到水？先從側面看設施是否比水路高，再從俯視圖找流經的位置。':run&&run.totals.stream<24?'西側溪流的水變少了。設施是不是放在另一個集水區？試著從俯視圖追蹤水路。':'若設施已裝滿，剩下的水會繼續往下。試試改變位置，或在同一條水路上搭配不同設施。'}</p>
      <details className="wl-history"><summary>打開實驗筆記 · 最近 {history.length} 次</summary><div className="wl-table-wrap"><table><thead><tr><th>實驗／預測</th><th>學校</th><th>地下</th><th>溪流</th><th>水槽</th></tr></thead><tbody>{history.map((h,i)=>{const r=simulate(h.facilities);return<tr key={i}><th>{i+1}. {h.prediction}<small>{h.facilities.map(f=>`${facilityInfo[f.kind].title}・${f.x>0?'東側':f.x<0?'西側':'山脊'}`).join('、')||'沒有設施'}</small></th><td>{r.totals.school}</td><td>{r.totals.ground}</td><td>{r.totals.stream}</td><td>{r.totals.tank}</td></tr>;})}</tbody></table></div></details>
    </section>}
    <details className="wl-teacher"><summary>教師備註：3D 學什麼、模型假設與教學來源</summary><div><h3>學習重點</h3><p>透過可旋轉的高低地形辨識坡向和分水嶺；透過土層剖面區分地表逕流、儲存與入滲；透過同雨量的重複實驗，連結布設位置與水量去向。這是 4.2-III「應對氣候影響：安全與復原力策略」的水路觀察補充活動，協助討論社區雨水調適。此原型只比較水量去向，尚未模擬洪峰、水位或完整防洪設施；不取代原教案的防災準備活動。</p><h3>本模型如何運作</h3><p>每滴代表同量的一份示意雨水，每次共 72 份。假設地表壓實，不考慮自然入滲與蒸散；雨水花園才提供有限容量的入滲。水沿地形的較陡下降方向逐格移動，只有流經設施且不需向上爬升時才會被收集；滿載後繼續下流。地下水層的位置為剖面示意，未模擬真實地下水流動、土壤飽和或洪水風險。水槽用水不可直接視為飲用水。</p><p>教師可問：「同一座設施為什麼換個位置就失效？」「學校水量減少，水究竟去了哪裡？」「這個簡化模型少考慮了什麼？」文字長度只作完整性檢核，不代表論證正確。</p><a href="https://www.usgs.gov/water-science-school/science/surface-runoff-and-water-cycle" target="_blank" rel="noreferrer">USGS：地表逕流與水循環 ↗</a></div></details>
    <footer className="wl-footer"><span>{saved?'進度只保存在這台裝置。':'這個瀏覽器無法保存進度，離開前請下載紀錄。'} 素材與數值皆為教學示意。</span><button type="button" onClick={()=>setResetting(true)} disabled={playing}>重新開始</button></footer>
    {resetting&&<div className="wl-reset" role="group" aria-label="重設實驗確認"><p>要清除本機的布設、實驗筆記和文字紀錄嗎？</p><a href={'data:text/plain;charset=utf-8,'+encodeURIComponent('\ufeff'+report)} download="流域實驗室-我的實驗紀錄.txt">先下載紀錄</a><button type="button" onClick={()=>setResetting(false)}>保留</button><button type="button" onClick={reset}>清除並重新開始</button></div>}
  </main>;
}
