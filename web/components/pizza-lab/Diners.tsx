'use client';
import type {Mood} from './reaction';

function Eyes({mood,cx,cy,gap,color}:{mood:Mood;cx:number;cy:number;gap:number;color:string}){
 const xs=[cx-gap,cx+gap];
 if(mood==='happy')return <g stroke={color} strokeWidth="3.4" fill="none" strokeLinecap="round">{xs.map(x=><path key={x} d={`M${x-6} ${cy+2} Q${x} ${cy-6} ${x+6} ${cy+2}`}/>)}</g>;
 if(mood==='pout')return <g>{xs.map(x=><g key={x}><ellipse cx={x} cy={cy+1} rx="5" ry="4.5" fill={color}/><path d={`M${x-7} ${cy-2} H${x+7}`} stroke={color} strokeWidth="3" strokeLinecap="round"/></g>)}</g>;
 if(mood==='angry')return <g>{xs.map((x,i)=><g key={x}><ellipse cx={x} cy={cy+2} rx="4.5" ry="5" fill={color}/><path d={i===0?`M${x-8} ${cy-9} L${x+6} ${cy-3}`:`M${x+8} ${cy-9} L${x-6} ${cy-3}`} stroke={color} strokeWidth="3.4" strokeLinecap="round"/></g>)}</g>;
 if(mood==='shock')return <g>{xs.map(x=><g key={x}><circle cx={x} cy={cy} r="7" fill="#fff" stroke={color} strokeWidth="2"/><circle cx={x} cy={cy} r="2.6" fill={color}/></g>)}</g>;
 return <g>{xs.map(x=><g key={x}><ellipse cx={x} cy={cy} rx="5.5" ry="7" fill={color}/><circle cx={x+1.8} cy={cy-2.6} r="2.2" fill="#fff"/></g>)}</g>;
}

function Cat({mood}:{mood:Mood}){
 const mouth={wait:'M62 79 Q70 86 78 79',happy:'M58 77 Q70 96 82 77 Z',pout:'M64 84 Q67 79 70 84 Q73 79 76 84',angry:'M60 84 L80 84',shock:'M70 80 m-6 0 a6 7 0 1 0 12 0 a6 7 0 1 0 -12 0'}[mood];
 const armUp=mood==='happy'||mood==='angry';
 return <svg viewBox="0 0 140 172" className="pz-diner-svg" aria-hidden="true">
  <ellipse cx="70" cy="166" rx="46" ry="6" fill="#5b3b22" opacity=".18"/>
  {/* Tail */}<path d="M112 140 Q138 128 128 98" stroke="#e98a2c" strokeWidth="11" fill="none" strokeLinecap="round"/>
  {/* Body */}<ellipse cx="70" cy="124" rx="50" ry="44" fill="#f39a3d" stroke="#c76a1d" strokeWidth="2.5"/>
  {/* Bib */}<path d="M38 104 Q70 96 102 104 L96 150 Q70 162 44 150 Z" fill="#fffaf0" stroke="#e1d3bd" strokeWidth="2"/>
  <path d="M60 116 L80 116 L70 138 Z" fill="#f2c25a" stroke="#d48b2c" strokeWidth="1.5"/><circle cx="66" cy="121" r="2.4" fill="#c4452d"/><circle cx="74" cy="124" r="2.2" fill="#c4452d"/>
  {/* Arms with fork and knife */}
  <g className={armUp?'pz-arm-up-l':''}><rect x="14" y="66" width="4" height="40" rx="2" fill="#9aa4a6"/><path d="M10 58 v12 M16 58 v12 M22 58 v12 M10 70 h12" stroke="#9aa4a6" strokeWidth="3" strokeLinecap="round"/><ellipse cx="18" cy="106" rx="11" ry="10" fill="#f39a3d" stroke="#c76a1d" strokeWidth="2"/></g>
  <g className={armUp?'pz-arm-up-r':''}><path d="M122 58 Q130 70 124 92 L120 92 Z" fill="#c8cfd0" stroke="#9aa4a6" strokeWidth="1.5"/><rect x="119" y="90" width="5" height="16" rx="2" fill="#7b5a3c"/><ellipse cx="122" cy="108" rx="11" ry="10" fill="#f39a3d" stroke="#c76a1d" strokeWidth="2"/></g>
  {/* Head */}
  <path d="M34 46 L38 10 L60 32 Z" fill="#f39a3d" stroke="#c76a1d" strokeWidth="2.5" strokeLinejoin="round"/><path d="M40 38 L42 20 L53 32 Z" fill="#f5b8b0"/>
  <path d="M106 46 L102 10 L80 32 Z" fill="#f39a3d" stroke="#c76a1d" strokeWidth="2.5" strokeLinejoin="round"/><path d="M100 38 L98 20 L87 32 Z" fill="#f5b8b0"/>
  <ellipse cx="70" cy="62" rx="42" ry="36" fill={mood==='angry'?'#f0823a':'#f39a3d'} stroke="#c76a1d" strokeWidth="2.5"/>
  <path d="M60 30 Q62 38 60 42 M70 28 V40 M80 30 Q78 38 80 42" stroke="#d2701f" strokeWidth="3" strokeLinecap="round" fill="none"/>
  <ellipse cx="70" cy="78" rx="18" ry="12" fill="#fff3e2"/>
  <circle cx="44" cy="72" r={mood==='pout'?8:6} fill="#f6a39a" opacity=".75"/><circle cx="96" cy="72" r={mood==='pout'?8:6} fill="#f6a39a" opacity=".75"/>
  <Eyes mood={mood} cx={70} cy={58} gap={17} color="#3a2a1d"/>
  <path d="M66 70 L74 70 L70 75 Z" fill="#e2716a"/>
  <path d={mouth} stroke="#3a2a1d" strokeWidth="2.6" fill={mood==='happy'?'#c9473f':mood==='shock'?'#5a2a22':'none'} strokeLinecap="round" strokeLinejoin="round"/>
  {mood==='wait'&&<path d="M76 82 q3 6 -1 9" stroke="#e2716a" strokeWidth="4" fill="none" strokeLinecap="round"/>}
  <path d="M30 70 L48 74 M30 80 L48 78 M110 70 L92 74 M110 80 L92 78" stroke="#7b5133" strokeWidth="1.6" strokeLinecap="round"/>
 </svg>;
}

function Critic({mood}:{mood:Mood}){
 const mouth={wait:'M62 84 Q70 88 78 84',happy:'M58 81 Q70 98 82 81 Z',pout:'M63 89 Q70 83 77 89',angry:'M60 88 L80 88',shock:'M70 86 m-5 0 a5 6 0 1 0 10 0 a5 6 0 1 0 -10 0'}[mood];
 const stars=mood==='happy'?5:mood==='wait'?3:mood==='pout'?2:1;
 const armUp=mood==='happy'||mood==='angry';
 return <svg viewBox="0 0 140 172" className="pz-diner-svg" aria-hidden="true">
  <ellipse cx="70" cy="166" rx="44" ry="6" fill="#5b3b22" opacity=".18"/>
  {/* Body: plain turtleneck sweater */}
  <path d="M28 166 Q26 118 46 104 L94 104 Q114 118 112 166 Z" fill="#3f8a87" stroke="#2c6461" strokeWidth="2.5"/>
  <rect x="56" y="96" width="28" height="14" rx="6" fill="#56a19d" stroke="#2c6461" strokeWidth="2"/>
  {/* Notebook with star rating */}
  <g className={armUp?'pz-arm-up-l':''}><rect x="4" y="96" width="40" height="48" rx="4" fill="#fffaf0" stroke="#8c7c62" strokeWidth="2"/><path d="M10 106 h28 M10 113 h22" stroke="#c8bba4" strokeWidth="2"/>
   {Array.from({length:5},(_,i)=><text key={i} x={10+i*6.4} y="132" fontSize="8" fill={i<stars?'#e2a31b':'#d8cfbf'}>★</text>)}
   <circle cx="40" cy="140" r="8" fill="#f2c9a0" stroke="#b98a62" strokeWidth="1.5"/></g>
  {/* Magnifying glass */}
  <g className={armUp?'pz-arm-up-r':''}><circle cx="118" cy="82" r="14" fill="#d9f0f2" fillOpacity=".7" stroke="#6d5a43" strokeWidth="4"/><rect x="114" y="95" width="7" height="22" rx="3" fill="#6d5a43"/><circle cx="117" cy="120" r="8" fill="#f2c9a0" stroke="#b98a62" strokeWidth="1.5"/></g>
  {/* Head with short neutral hair */}
  <ellipse cx="70" cy="62" rx="34" ry="36" fill={mood==='angry'?'#f0b08c':'#f2c9a0'} stroke="#b98a62" strokeWidth="2.5"/>
  <path d="M36 60 Q34 22 70 22 Q106 22 104 60 Q98 42 84 40 Q70 48 52 40 Q40 46 36 60 Z" fill="#4a3a33"/>
  <circle cx="44" cy="76" r="5" fill="#f2a08d" opacity=".55"/><circle cx="96" cy="76" r="5" fill="#f2a08d" opacity=".55"/>
  <Eyes mood={mood} cx={70} cy={64} gap={15} color="#2f2622"/>
  {/* Round glasses */}
  <g fill="none" stroke="#5a4636" strokeWidth="2.4"><circle cx="55" cy="64" r="11"/><circle cx="85" cy="64" r="11"/><path d="M66 64 h8"/></g>
  {mood==='wait'&&<path d="M76 47 q8 -5 15 -1" stroke="#4a3a33" strokeWidth="3" fill="none" strokeLinecap="round"/>}
  <path d={mouth} stroke="#3a2a22" strokeWidth="2.6" fill={mood==='happy'?'#c9473f':mood==='shock'?'#5a2a22':'none'} strokeLinecap="round" strokeLinejoin="round"/>
 </svg>;
}

export function Diner({side,mood,bubble}:{side:'a'|'b';mood:Mood;bubble:string|null}){
 const name=side==='a'?'貪吃的胖貓老闆':'挑剔的美食評論家';
 return <figure className={`pz-diner pz-diner-${side} mood-${mood}`} aria-label={`${name}（${side==='a'?'A':'B'} 份）`}>
  {bubble&&<p className="pz-bubble" role="status">{bubble}</p>}
  <div className="pz-diner-body">{side==='a'?<Cat mood={mood}/>:<Critic mood={mood}/>}</div>
  <figcaption><i className={side==='a'?'pz-a':'pz-b'}/>{side==='a'?'A':'B'} 份 · {name}</figcaption>
 </figure>;
}

/** Cartoon projectile thrown by the unhappy diner towards the pizza (hidden by CSS under reduced motion). */
export function Throw({from}:{from:'a'|'b'}){
 return <div className={`pz-throw pz-throw-${from}`} aria-hidden="true">
  <div className="pz-throw-arc">{from==='a'
   ?<svg viewBox="0 0 40 40" width="44" height="44"><circle cx="20" cy="22" r="15" fill="#d8402b" stroke="#9e2a1b" strokeWidth="2"/><path d="M20 8 l-6 -4 M20 8 l6 -4 M20 8 v-5" stroke="#3f7d33" strokeWidth="3" strokeLinecap="round"/><ellipse cx="14" cy="17" rx="4" ry="2.5" fill="#fff" opacity=".5"/></svg>
   :<svg viewBox="0 0 60 34" width="60" height="34"><path d="M6 20 Q4 6 20 6 Q40 6 54 16 Q58 26 46 28 L14 30 Q6 30 6 20 Z" fill="#4c86c6" stroke="#2c5a8c" strokeWidth="2"/><path d="M18 9 Q26 20 36 10" stroke="#f3d34a" strokeWidth="5" fill="none" strokeLinecap="round"/></svg>}
  </div>
  {from==='a'&&<div className="pz-splat"><svg viewBox="0 0 80 60" width="86" height="64"><path d="M40 8 Q48 20 58 10 Q60 26 74 26 Q62 34 70 48 Q54 42 46 54 Q40 42 26 52 Q28 38 8 36 Q22 28 14 14 Q30 20 40 8 Z" fill="#d8402b" opacity=".92"/><circle cx="40" cy="32" r="3" fill="#f3c26c"/><circle cx="48" cy="28" r="2.6" fill="#f3c26c"/></svg></div>}
  {from==='b'&&<div className="pz-splat pz-boing">咚！</div>}
 </div>;
}
