'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useGameEvents} from '@/lib/useGameEvents';

import {foods,foodById,makeRound,evaluate,metrics,values,sanitizeCut,type Cut} from './model';
import {Diner,Throw} from './Diners';
import {react} from './reaction';
import './pizza.css';
const Scene=dynamic(()=>import('./PizzaScene'),{ssr:false,loading:()=> <div className="pz-scene pz-load">準備烘焙工作桌…</div>});
const initial:Cut={angle:0,offset:0};
const hex=(c:number)=>`#${c.toString(16).padStart(6,'0')}`;

// Small line icons for the tool buttons (decorative; buttons carry text labels).
const icon={
 pen:<path d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3"/>,
 rotate:<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>,
 top:<><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/></>,
 cube:<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 0v18M4 7.5l8 4.5 8-4.5"/>,
 reset:<path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5"/>,
 bulb:<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>,
 knife:<><circle cx="9" cy="15" r="6"/><circle cx="9" cy="15" r="1.4"/><path d="M13.3 10.7L21 3"/></>,
 center:<path d="M12 4v16M4 12h16"/>,
 next:<path d="M5 12h14M13 6l6 6-6 6"/>,
};
const Icon=({name}:{name:keyof typeof icon})=><svg className="pz-icon" viewBox="0 0 24 24" aria-hidden="true">{icon[name]}</svg>;

const stepNames=['認識配料','畫切線','切開看看','看結果／重切'];

export default function PizzaLab(){
 const telemetry=useGameEvents('pizza');
 const [level,setLevel]=useState(0),[seed,setSeed]=useState(431),[cut,setCut]=useState<Cut>(initial),[phase,setPhase]=useState<'edit'|'cutting'|'result'>('edit'),[orbit,setOrbit]=useState(false),[top,setTop]=useState(false),[viewNonce,setViewNonce]=useState(0),[selected,setSelected]=useState<string|null>(null),[attempts,setAttempts]=useState<{score:number;cut:Cut}[]>([]),[best,setBest]=useState<number[]>([0,0,0]),[sound,setSound]=useState(true),[hint,setHint]=useState(false),[showInfo,setShowInfo]=useState(false),[done,setDone]=useState(false);
 // Guidance state: has the player looked at a topping, adjusted the cut, or ever dragged on the pizza?
 const [explored,setExplored]=useState(false),[drawn,setDrawn]=useState(false),[dragged,setDragged]=useState(false);
 const round=useMemo(()=>makeRound(seed,level),[seed,level]),result=useMemo(()=>evaluate(round,cut),[round,cut]);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),audio=useRef<AudioContext|null>(null),bench=useRef<HTMLElement>(null),report=useRef<HTMLElement>(null),lock=useRef(false),finale=useRef<HTMLElement>(null),soundMix=useRef<GainNode|null>(null),stage=useRef<HTMLDivElement>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);audio.current?.close();},[]);
 const menu=[...new Set(round.toppings.map(t=>t.food))];
 const food=selected?foodById[selected]:null,portion=selected?round.toppings.find(t=>t.food===selected)?.grams||0:0;
 const reaction=react(result,phase==='result');
 const step=phase==='result'?4:phase==='cutting'||drawn?3:explored?2:1;
 const instruction=[
  '點一點配料卡，看看每片的碳足跡和營養。看完就到披薩上畫切線。',
  '在披薩上按住拖曳，畫出一條切線；也可以用下方滑桿微調角度和位置。',
  phase==='cutting'?'正在切開披薩，看看配料分到哪一份…':'切線畫好了！按「切開看看」，看兩份分得公不公平。',
  result.passed?`總分 ${Math.round(result.score)}，三項都達標！可以換下一張，或再切一次。`:`總分 ${Math.round(result.score)}。找出分數最低的一項，按「合起來重切」再試一次。`,
 ][step-1];
 const shortInstruction=['① 先點配料卡認識配料','② 在披薩上拖出一條切線','③ 按「切開看看」',result.passed?'④ 達標！可換下一張':'④ 看結果，合起來重切'][step-1];
 function chime(){if(!sound)return;try{
  const ac=audio.current??(audio.current=new AudioContext());void ac.resume();
  const mix=ac.createGain();mix.gain.value=.55;mix.connect(ac.destination);soundMix.current=mix;
  // Filtered noise follows the rolling cutter; a short crunch and bell mark separation.
  const buffer=ac.createBuffer(1,Math.ceil(ac.sampleRate*.75),ac.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(.65+.35*Math.sin(i/ac.sampleRate*95));
  const noise=ac.createBufferSource(),filter=ac.createBiquadFilter(),gain=ac.createGain(),now=ac.currentTime;
  noise.buffer=buffer;filter.type='bandpass';filter.frequency.setValueAtTime(1800,now);filter.frequency.exponentialRampToValueAtTime(520,now+.65);filter.Q.value=.7;
  gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(.3,now+.06);gain.gain.setValueAtTime(.18,now+.5);gain.gain.exponentialRampToValueAtTime(.001,now+.74);
  noise.connect(filter).connect(gain).connect(mix);noise.start();noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect();};
  [740,988,1480].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain(),start=now+.72+i*.085;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.001,start);g.gain.linearRampToValueAtTime(.11,start+.012);g.gain.exponentialRampToValueAtTime(.001,start+.32);o.connect(g).connect(mix);o.start(start);o.stop(start+.34);o.onended=()=>{o.disconnect();g.disconnect();if(i===2)mix.disconnect();};});
 }catch{/* Sound is optional when the device blocks audio. */}}
 function adjust(c:Cut){if(lock.current||phase!=='edit')return;telemetry.ensureStart({phase:'challenge',level:level+1});setCut(sanitizeCut(c));setHint(false);setDrawn(true);setDragged(true);}
 function inspect(id:string|null){setSelected(id);if(id)setExplored(true);}
 function serve(){if(lock.current||phase!=='edit')return;telemetry.ensureStart({phase:'challenge',level:level+1});lock.current=true;setPhase('cutting');setOrbit(false);setHint(false);stage.current?.scrollIntoView({block:'start',behavior:'instant'});chime();const score=result.score,chosen={...cut};timer.current=setTimeout(()=>{telemetry.complete({score:result.score,carbonBalance:result.scores.carbon,nutritionBalance:result.nutrition,areaBalance:result.areaScore,passed:result.passed});setPhase('result');setOrbit(true);setAttempts(a=>[...a,{score,cut:chosen}]);setBest(b=>b.map((v,i)=>i===level?Math.max(v,score):v));lock.current=false;
  // Wide screens show the report beside the pizza; narrow screens keep the pizza and diners in view.
  if(matchMedia('(min-width: 1001px)').matches)requestAnimationFrame(()=>report.current?.scrollIntoView({block:'nearest',behavior:'smooth'}));},matchMedia('(prefers-reduced-motion: reduce)').matches?100:1500);}
 function retry(){telemetry.start({phase:'challenge',level:level+1});setPhase('edit');setOrbit(false);setHint(false);setDone(false);setDrawn(false);requestAnimationFrame(()=>bench.current?.scrollIntoView({block:'start',behavior:'instant'}));}
 function next(){if(level===2){setDone(true);requestAnimationFrame(()=>finale.current?.scrollIntoView({block:'start',behavior:'smooth'}));return;}telemetry.cancel();setLevel(l=>l+1);setSeed(s=>s+109);setCut(initial);setPhase('edit');setOrbit(false);setSelected(null);setHint(false);setAttempts([]);setExplored(false);setDrawn(false);requestAnimationFrame(()=>bench.current?.scrollIntoView({block:'start',behavior:'instant'}));}
 const display=(value:number,id:string)=>id==='carbon'||id==='energy'?value.toFixed(1):value.toFixed(2);
 const showDemo=phase==='edit'&&!dragged&&!orbit;
 return <main className="pz-page">
  <nav className="pz-nav"><Link href="/package/6.6-III/">← 返回教案</Link><span>主題六 · 永續飲食</span><label><input type="checkbox" checked={sound} onChange={e=>{setSound(e.target.checked);if(!e.target.checked&&soundMix.current)soundMix.current.gain.value=0;}}/> 音效</label></nav>
  <header className="pz-header"><div><h1>一人一半，怎麼切？</h1><p>同一張披薩，讓兩份的碳足跡與營養分配都接近。</p></div><button onClick={()=>setShowInfo(!showInfo)} aria-expanded={showInfo}>玩法與計分 {showInfo?'−':'＋'}</button></header>
  {showInfo&&<section className="pz-help"><h2>先觀察配料，再決定切線。</h2><p>你要把披薩分給兩位等著吃的角色：A 份是貪吃的胖貓老闆，B 份是挑剔的美食評論家。切成同樣大小，不一定分到相近的配料；碳足跡相近，也不一定熱量和蛋白質相近。試著找到兼顧兩者的一刀。</p><ol><li>先點配料卡，認識每種配料。</li><li>在披薩上拖出直線，或用角度、位置滑桿調整。</li><li>按「切開看看」，觀察兩份分離與兩位角色的反應。</li><li>比較 A、B 兩份的數值；合起來重切，保留本張最高分。</li></ol><p>平衡度 ＝ 100 ×（1 − 兩份差值 ÷ 兩份總和）。營養分配取熱量、蛋白質、脂肪、碳水四項中最低分；總分再取碳足跡、營養與餅皮面積三項最低分。三項都達 85 分即通關，閱讀與重試不扣分。</p></section>}
  <section className="pz-workbench" ref={bench}>
   <div className="pz-mission"><h2><span>第 {level+1} 張 / 共 3 張</span>{['先找公平的一刀','多一點配料，多一點取捨','最後挑戰：兼顧每一項'][level]}</h2><div className="pz-badge"><b>{round.toppings.length}</b><small>片配料 · {menu.length} 種</small></div></div>
   <div className="pz-guide" aria-live="polite">
    <ol className="pz-guide-steps" aria-label="遊戲步驟">{stepNames.map((name,i)=><li key={name} className={i+1===step?'current':i+1<step?'done':''} aria-current={i+1===step?'step':undefined}><b>{i+1<step?'✓':i+1}</b><span>{name}</span></li>)}</ol>
    <p className="pz-guide-now"><strong>現在要做：</strong>{instruction}</p>
   </div>
   <div className={`pz-layout${phase==='result'?' is-result':''}`}>
    <div className="pz-stage" ref={stage}>
     <div className="pz-toolbar">
      <div className="pz-mode" role="group" aria-label="操作模式（二選一）"><button aria-pressed={!orbit} disabled={phase!=='edit'} onClick={()=>setOrbit(false)}><Icon name="pen"/><span>畫切線</span></button><button aria-pressed={orbit} disabled={phase==='cutting'} onClick={()=>setOrbit(true)}><Icon name="rotate"/><span>轉動觀察</span></button></div>
      <div className="pz-view"><button aria-pressed={top} disabled={phase==='cutting'} onClick={()=>{setTop(!top);setViewNonce(n=>n+1);}}><Icon name={top?'cube':'top'}/><span>{top?'立體視角':<>俯視<span className="pz-long">看清楚</span></>}</span></button><button disabled={phase==='cutting'} onClick={()=>{setTop(false);setViewNonce(n=>n+1);}}><Icon name="reset"/><span>回正</span></button></div>
     </div>
     <div className={`pz-scene-frame${reaction.tier==='angry'?' pz-shake':''}`}>
      <Scene round={round} cut={cut} separated={phase!=='edit'} orbit={orbit} top={top} viewNonce={viewNonce} onCut={adjust} onInspect={inspect} onDragStart={()=>setDragged(true)}/>
      {showDemo&&<div className="pz-demo" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="30" y1="74" x2="70" y2="26" className="pz-demo-line" vectorEffect="non-scaling-stroke"/></svg><span className="pz-demo-finger"/><span className="pz-demo-label">按住披薩，拖出一條切線</span></div>}
      {orbit&&phase==='edit'&&<p className="pz-mode-note">轉動觀察中：拖曳可轉動披薩。要畫線請按「畫切線」。</p>}
      {reaction.tier==='angry'&&reaction.loser&&<Throw key={attempts.length} from={reaction.loser}/>}
      {reaction.tier==='happy'&&<div className="pz-confetti" aria-hidden="true">{Array.from({length:14},(_,i)=><i key={`${attempts.length}-${i}`} style={{left:`${6+i*6.5}%`,animationDelay:`${(i%5)*.12}s`,background:['#e2a31b','#416c5d','#bb715b','#f39a3d'][i%4]}}/>)}</div>}
      <div className="pz-diners"><Diner side="a" mood={reaction.a} bubble={reaction.bubbleA}/><Diner side="b" mood={reaction.b} bubble={reaction.bubbleB}/></div>
     </div>
     <div className="pz-adjust"><div className="pz-sliders"><label>切線角度 <strong>{Math.round(cut.angle)}°</strong><input type="range" aria-label="切線角度" min="0" max="179" step="1" value={cut.angle} disabled={phase!=='edit'} onChange={e=>adjust({...cut,angle:Number(e.target.value)})}/></label><label>切線位置 <strong>{Math.abs(cut.offset)<.025?'通過中心':`${cut.offset>0?'+':''}${cut.offset.toFixed(2)}`}</strong><input type="range" aria-label="切線位置" min="-1.65" max="1.65" step=".05" value={cut.offset} disabled={phase!=='edit'} onChange={e=>adjust({...cut,offset:Number(e.target.value)})}/></label></div></div>
    </div>
    <div className="pz-side">
     <section className="pz-pantry" aria-labelledby="pz-pantry-title"><div className="pz-pantry-head"><h2 id="pz-pantry-title"><span className={`pz-step-dot${step===1?' current':''}`}>1</span>先認識配料</h2><span>點卡片看資料 · 每種兩片</span></div>
      <div className="pz-foods">{menu.map(id=>{const f=foodById[id],g=round.toppings.find(t=>t.food===id)!.grams;return <button key={id} aria-pressed={selected===id} onClick={()=>inspect(selected===id?null:id)}><i style={{background:hex(f.color)}}/><span>{f.name}<small>{g} g/片 · 碳 {values(f,g).carbon.toFixed(1)} g</small></span></button>;})}</div>
      {food?<div className="pz-food-card"><b>{food.name} · 每片 {portion} g</b><span>碳足跡 {values(food,portion).carbon.toFixed(1)} g CO₂e</span><span>熱量 {values(food,portion).energy.toFixed(1)} kcal</span><span>蛋白質 {values(food,portion).protein.toFixed(2)} g</span><span>脂肪 {values(food,portion).fat.toFixed(2)} g</span><span>碳水 {values(food,portion).carb.toFixed(2)} g</span></div>:<p className="pz-food-tip">也可以直接點披薩上的配料。</p>}
     </section>
     <aside className="pz-report" ref={report}><h3>{phase==='result'?'這一刀的分配結果':'切開後揭曉分配'}</h3><div className="pz-score"><span>{phase==='result'?Math.round(result.score):'—'}</span><div><b>三項兼顧分數</b><small>取最低項，避免顧此失彼</small></div></div>
      <div className="pz-goals">{[['配料碳足跡',result.scores.carbon],['配料營養分配',result.nutrition],['餅皮面積',result.areaScore]].map(([label,value])=><div key={label}><span>{label}</span><b>{phase==='result'?`${Math.round(Number(value))} / 100`:'等待切開'}</b><progress max={100} value={phase==='result'?Number(value):0}/></div>)}</div>
      {phase==='result'?<><div className="pz-table-head"><span>每份配料估算</span><b>A 份</b><b>B 份</b></div>{metrics.map(m=>{const total=result.a[m.id]+result.b[m.id],a=total?result.a[m.id]/total:.5;return <div className="pz-metric" key={m.id}><div><span>{m.name}<small>{m.unit}</small></span><b>{display(result.a[m.id],m.id)}</b><b>{display(result.b[m.id],m.id)}</b></div><div className="pz-bar"><span style={{width:`${a*100}%`}}/><i/></div></div>;})}<p className={`pz-verdict ${result.passed?'success':''}`} role="status">{result.passed?'兩份的配料影響與餅皮面積都接近，可以換下一張挑戰。':'先找分數最低的一項，再看造成差距的配料在哪一側。試著旋轉切線或稍微移開中心。'}</p></>:<p className="pz-empty-result">目標是三項都達 85 分。同樣面積，不一定有同樣的碳足跡與營養。</p>}
      <p className="pz-session">本張試切 <b>{attempts.length}</b> 次 · 最佳 <b>{Math.round(best[level])}</b> 分</p>
      <p className="pz-scope-note">數值只計配料；餅皮、底醬與烘焙未納入。營養分配接近不等於完整健康餐，切法也不會降低整張披薩的總碳足跡。</p>
     </aside>
    </div>
   </div>
   <div className="pz-actionbar">
    {hint&&<div className="pz-hint" id="pz-hint"><b>不要只追求大小一樣。</b><p>先找成對、份量相同的配料，讓它們分到不同側。碳足跡較高的配料可能左右碳分數，起司、肉類也會影響脂肪與蛋白質。切過配料時，系統會依覆蓋面積分攤。</p><button disabled={phase!=='edit'} onClick={()=>adjust({angle:round.solution,offset:0})}>示範一條可兼顧的切線</button><small>示範後仍需按「切開看看」。可重試，不扣分。</small></div>}
    <p className="pz-actionbar-now">現在要做：<b>{shortInstruction}</b></p>
    <div className="pz-actionbar-row">
     <button className="pz-hint-toggle" disabled={phase==='cutting'} onClick={()=>setHint(!hint)} aria-expanded={hint} aria-controls="pz-hint"><Icon name="bulb"/><span>{hint?'收起提示':<><span className="pz-long">卡住了？看思考</span>提示</>}</span></button>
     {phase==='edit'?<><button className={`pz-primary${step===3?' pulse':''}`} onClick={serve}><Icon name="knife"/><span>切開看看</span></button><button className="pz-secondary" onClick={()=>adjust(initial)}><Icon name="center"/><span><span className="pz-long">切線</span>置中</span></button></>:phase==='cutting'?<button className="pz-primary" disabled>正在切開披薩…</button>:<><button className="pz-primary" onClick={retry}><Icon name="reset"/><span>合起來重切</span></button><button className="pz-secondary" onClick={next}><span>{level===2?'看三張成果':'換下一張'}</span><Icon name="next"/></button></>}
    </div>
   </div>
  </section>
  {attempts.length>0&&<details className="pz-history"><summary>這張的試切紀錄</summary><ol>{attempts.map((a,i)=><li key={i}>第 {i+1} 刀：{a.cut.angle.toFixed(0)}°、位置 {a.cut.offset.toFixed(2)} → {a.score.toFixed(0)} 分<button disabled={phase!=='edit'} onClick={()=>adjust(a.cut)}>套用這條切線</button></li>)}</ol></details>}
  {done&&<section className="pz-finale" ref={finale}><p className="pz-eyebrow">THE TABLE IS SET</p><h2>三張披薩，你怎麼兼顧？</h2><div>{best.map((s,i)=><p key={i}><span>第 {i+1} 張</span><b>{Math.round(s)}</b><small>{s>=85?'三項達標':'可以再試試'}</small></p>)}</div><p>想一想：兩份碳足跡一樣，為什麼不代表營養也一樣？如果想降低整張披薩的碳足跡，還需要改變哪些食材或份量？</p><button className="pz-primary" onClick={()=>{telemetry.cancel();setLevel(0);setSeed(s=>s+317);setBest([0,0,0]);setAttempts([]);setDone(false);setCut(initial);setPhase('edit');setOrbit(false);setSelected(null);setExplored(false);setDrawn(false);requestAnimationFrame(()=>bench.current?.scrollIntoView({block:'start',behavior:'instant'}));}}>再烤三張新的 →</button></section>}
  <details className="pz-teacher"><summary>教師備註・計算方式、來源與替代操作</summary><p>改編自使用者提供的 balance 專案披薩切分玩法，連結 6.6-III 永續飲食。學習重點是同時觀察配料碳足跡與營養素分配，並非提供個人飲食建議。遊戲假設兩位角色需要相近份量；真實需求會因人而異。角色（胖貓老闆、美食評論家）只依分數最低的一項做出反應，不代表任何族群。</p><p>來源為參考專案 pizzacut.csv 的固定資料快照（丹麥市場資料），不代表臺灣所有同名食材的現行數值。配料池共 {foods.length} 種，每張披薩依隨機種子抽出 4／6／10 種（各兩片），可重現。原碳係數 kg CO₂e/kg × 食材克數得到 g CO₂e；kJ/100 g 換成 kcal 時除以 4.184。其餘營養素依 g/100 g 換算。資料包含生、熟與加工品差異，名稱依 CSV 標示；模型外觀僅作教學辨識。每片克數：肉類（牛肉、雞胸肉、火腿、義式臘腸）12 g，海鮮（蝦仁、鮪魚、章魚）10 g，其餘 8 g。</p><p>餅皮、底醬與烘焙未計入數值，另用餅皮面積平衡防止切出極小份。配料以放大後的圓形足跡、均勻密度近似，切到配料時按圓面積比例分攤；實際模型切面只作視覺呈現。分成 A、B 後各項總量守恆，重新切分不減少總排放。擺放保留一條可達 100 分的切線，不把無解盤面交給學生。</p><div className="pz-source-table"><table><thead><tr><th>食材</th><th>CSV 列識別</th><th>kg CO₂e/kg</th><th>kJ/100 g</th><th>每片 g</th></tr></thead><tbody>{foods.map(f=><tr key={f.id}><td>{f.name}</td><td>{f.sourceId}</td><td>{f.co2}</td><td>{f.energy}</td><td>{f.grams}</td></tr>)}</tbody></table></div><p>可用滑桿或鍵盤調整角度及位置；支援減少動畫偏好（角色改為靜態表情與對話泡泡）。下表座標以餅心為原點，可在無 3D 時輔助判斷。分數在頁面顯示，不收集姓名；同意統計時傳送每次試切的結果摘要。</p><div className="pz-source-table"><table><thead><tr><th>配料</th><th>x</th><th>z</th><th>g</th></tr></thead><tbody>{round.toppings.map(t=><tr key={t.id}><td>{foodById[t.food].name}</td><td>{t.x.toFixed(2)}</td><td>{t.z.toFixed(2)}</td><td>{t.grams}</td></tr>)}</tbody></table></div></details>
 </main>;
}
