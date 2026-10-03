'use client';
import {useEffect,useRef,useState} from 'react';
import type * as Three from 'three';
import {itemByKey,type Game} from './model';
interface Props {game:Game;spread:boolean;layout:number;onPick:(id:string)=>void}
export default function MatchScene(props:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;
 const [status,setStatus]=useState('loading');
 useEffect(()=>{
  const el=host.current;if(!el)return;let gone=false,dispose=()=>{};
  (async()=>{let renderer:Three.WebGLRenderer|undefined;try{
   const T=await import('three'),{OrbitControls}=await import('three/addons/controls/OrbitControls.js'),{RoundedBoxGeometry}=await import('three/addons/geometries/RoundedBoxGeometry.js');if(gone)return;
   const r=renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});r.setPixelRatio(Math.min(devicePixelRatio,1.5));r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.2;r.shadowMap.enabled=true;r.shadowMap.type=T.PCFShadowMap;el.appendChild(r.domElement);r.domElement.setAttribute('aria-label','轉動觀察物件堆，點選模型；也可以使用下方具名物件清單');
   const scene=new T.Scene(),camera=new T.PerspectiveCamera(37,1,.1,60);camera.position.set(4,5.5,6.5);
   const controls=new OrbitControls(camera,r.domElement);controls.target.set(0,.8,0);controls.enablePan=false;controls.enableDamping=true;controls.minDistance=9;controls.maxDistance=24;controls.minPolarAngle=.2;controls.maxPolarAngle=1.28;
   scene.add(new T.HemisphereLight(0xfff9eb,0x748293,2.8));const light=new T.DirectionalLight(0xfff3da,4);light.position.set(-4,11,6);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-7,right:7,top:7,bottom:-7});light.shadow.normalBias=.05;scene.add(light);const fill=new T.DirectionalLight(0xe5efff,2);fill.position.set(6,5,-5);scene.add(fill);
   const meshes:Three.Mesh[]=[];
   const material=(c:number,metal=.02)=>new T.MeshStandardMaterial({color:c,roughness:metal>.3?.32:.68,metalness:metal});
   const mesh=(geometry:Three.BufferGeometry,color:number,g:Three.Object3D,x=0,y=0,z=0,metal=0)=>{const m=new T.Mesh(geometry,material(color,metal));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
   const box=(g:Three.Object3D,w:number,h:number,d:number,c:number,x=0,y=0,z=0,radius=.05)=>mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(radius,w/3,h/3,d/3)),c,g,x,y,z);
   const ball=(g:Three.Object3D,radius:number,c:number,x=0,y=0,z=0)=>mesh(new T.SphereGeometry(radius,20,14),c,g,x,y,z);
   const cyl=(g:Three.Object3D,ra:number,rb:number,h:number,c:number,x=0,y=0,z=0)=>mesh(new T.CylinderGeometry(ra,rb,h,24),c,g,x,y,z);
   function label(g:Three.Object3D,text:string,x:number,y:number,z:number,width=.75){const cv=document.createElement('canvas');cv.width=256;cv.height=80;const ctx=cv.getContext('2d')!;ctx.fillStyle='#f7f2e9';ctx.fillRect(0,0,256,80);ctx.fillStyle='#23394c';ctx.font='bold 40px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,128,42);const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(width,width*80/256),new T.MeshStandardMaterial({map:tex,roughness:.9}));m.position.set(x,y,z);g.add(m);}
   const ico=(g:Three.Object3D,radius:number,c:number,x=0,y=0,z=0)=>mesh(new T.IcosahedronGeometry(radius,1),c,g,x,y,z);
   const bar=(g:Three.Object3D,x1:number,y1:number,x2:number,y2:number,t:number,c:number,z=0)=>{const m=box(g,Math.hypot(x2-x1,y2-y1),t,t,c,(x1+x2)/2,(y1+y2)/2,z,.01);m.rotation.z=Math.atan2(y2-y1,x2-x1);return m;};
   const wheel=(g:Three.Object3D,r:number,x:number,y:number,z:number,w=.14)=>{const t=cyl(g,r,r,w,0x2c414b,x,y,z);t.rotation.x=Math.PI/2;const hub=cyl(g,r*.45,r*.45,w+.02,0xc9cdd0,x,y,z);hub.rotation.x=Math.PI/2;};
   const glass=0x8fb3c4;
   function walkSign(g:Three.Object3D,x:number,y:number,z:number,r:number){const cv=document.createElement('canvas');cv.width=cv.height=128;const ctx=cv.getContext('2d')!;ctx.fillStyle='#2f6db5';ctx.beginPath();ctx.arc(64,64,62,0,Math.PI*2);ctx.fill();ctx.strokeStyle=ctx.fillStyle='#ffffff';ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath();ctx.arc(68,28,11,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(66,44);ctx.lineTo(60,74);ctx.lineTo(44,104);ctx.moveTo(60,74);ctx.lineTo(78,102);ctx.moveTo(64,50);ctx.lineTo(44,66);ctx.moveTo(64,50);ctx.lineTo(84,68);ctx.stroke();const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.CircleGeometry(r,32),new T.MeshStandardMaterial({map:tex,roughness:.8}));m.position.set(x,y,z);g.add(m);}
   const floor=box(scene,10,.22,7.4,0xd9c7a4,0,-.16,0,.1);floor.receiveShadow=true;
   box(scene,10.2,.32,.18,0xb99a76,0,-.05,-3.75);box(scene,.18,.32,7.6,0xb99a76,-5.1,-.05,0);box(scene,.18,.32,7.6,0xb99a76,5.1,-.05,0);box(scene,10.2,.18,.18,0xb99a76,0,-.12,3.75);
   const bodies=new Map<string,Three.Group>(),timing=new Map<string,number>(),initial=new Map<string,number>();
   for(const p of latest.current.game.round.pieces){
    const item=itemByKey[p.key],root=new T.Group(),g=new T.Group();root.add(g);scene.add(root);bodies.set(p.id,root);const c=item.color,dark=0x2c414b,white=0xf2ede0;
    switch(item.shape){
     case 'stove':{
      box(g,1.7,.4,1.25,c,0,.23,0);box(g,1.65,.06,1.2,0xc7cacc,0,.46,0);
      for(const x of [-.45,.45]){cyl(g,.25,.25,.06,dark,x,.52,0);box(g,.66,.04,.05,dark,x,.58,0);box(g,.05,.04,.65,dark,x,.58,0);const knob=cyl(g,.075,.075,.06,dark,x,.22,.65);knob.rotation.x=Math.PI/2;}
      label(g,item.label,0,.3,.642,.45);break;
     }
     case 'generator':{
      box(g,1.65,.9,1.05,c,0,.5,0);for(const x of [-.83,.83]){box(g,.09,1.1,.09,dark,x,.58,.53);box(g,.09,1.1,.09,dark,x,.58,-.53);box(g,.09,.08,1.15,dark,x,1.12,0);}
      for(let i=0;i<5;i++)box(g,.58,.045,.025,dark,-.38,.3+i*.11,.54);label(g,item.label,.41,.65,.54,.63);cyl(g,.11,.11,.28,dark,.5,1.07,-.2);break;
     }
     case 'boiler':{
      cyl(g,.53,.53,1.5,c,0,.85,0);cyl(g,.48,.53,.16,white,0,1.66,0);cyl(g,.14,.14,.35,dark,0,1.9,0);box(g,.28,.36,.07,dark,0,.47,.52);label(g,'GAS',0,1.1,.535,.5);for(const x of [-.5,.5])cyl(g,.045,.045,.6,0xb88155,x,.3,0);break;
     }
     case 'ac':{
      box(g,1.65,.85,.58,c,0,.5,0,.12);box(g,1.4,.26,.03,dark,0,.28,.3);for(let j=0;j<3;j++)box(g,1.35,.025,.06,0xa4b8b7,0,.21+j*.065,.33);label(g,item.label,0,.68,.297,.7);ball(g,.025,0x4f9c8d,.65,.7,.32);break;
     }
     case 'fridge':{
      box(g,.95,1.65,.92,c,0,.85,0,.1);box(g,.9,.51,.05,0xb5cdd7,0,1.39,.485);box(g,.9,1.02,.05,0xb5cdd7,0,.59,.485);box(g,.065,.27,.08,dark,.32,1.35,.54);box(g,.065,.37,.08,dark,.32,.77,.54);label(g,item.label,0,.4,.52,.64);break;
     }
     case 'tank':{
      box(g,1.65,.78,1,c,0,.44,0,.15);for(const x of [-.42,.42])cyl(g,.24,.24,.1,dark,x,.88,0);label(g,'CH4',0,.47,.51,.65);for(const x of [-.95,.95]){const pipe=cyl(g,.12,.12,.4,0xb98254,x,.5,0);pipe.rotation.z=Math.PI/2;}break;
     }
     case 'extinguisher':{
      cyl(g,.32,.32,1.08,c,0,.62,0);ball(g,.32,c,0,1.15,0);cyl(g,.1,.1,.22,dark,0,1.43,0);box(g,.49,.065,.1,dark,.12,1.57,0);label(g,'CO2',0,.75,.324,.48);box(g,.055,.75,.055,dark,.43,1.03,0);const horn=cyl(g,.09,.2,.35,dark,.43,.54,0);horn.rotation.z=.2;break;
     }
     case 'fan':{
      cyl(g,.44,.47,.12,c,0,.09,0);cyl(g,.055,.06,.78,dark,0,.48,0);const cage=new T.Group();cage.position.set(0,1.12,0);g.add(cage);const rim=mesh(new T.TorusGeometry(.49,.035,8,32),dark,cage);rim.position.z=.045;
      for(let i=0;i<3;i++){const blade=ball(cage,.23,c,Math.sin(i*2.094)*.23,Math.cos(i*2.094)*.23,0);blade.scale.set(.65,1.3,.16);blade.rotation.z=-i*2.094;}
      for(let i=0;i<8;i++){const guard=box(cage,.016,.96,.015,0x99a7a9);guard.rotation.z=i*Math.PI/8;guard.position.z=.075;}ball(cage,.075,white,0,0,.1);break;
     }
     case 'lamp':{
      cyl(g,.43,.47,.12,c,0,.08,0);cyl(g,.045,.045,1.0,dark,0,.6,0);cyl(g,.27,.58,.5,c,0,1.33,0);cyl(g,.53,.53,.025,white,0,1.08,0);break;
     }
     case 'laptop':{
      box(g,1.5,.1,1,c,0,.07,.12);for(let j=0;j<3;j++)for(let i=0;i<7;i++)box(g,.12,.012,.1,dark,-.52+i*.17,.13,-.05+j*.14,.01);box(g,.4,.01,.17,0xadc1d0,0,.13,.46);
      const screen=new T.Group();screen.position.set(0,.12,-.35);screen.rotation.x=-.15;g.add(screen);box(screen,1.48,1,.07,dark,0,.5,0);box(screen,1.32,.82,.015,0x74a2b0,0,.53,.046);label(screen,'SCHOOL',0,.54,.058,.85);break;
     }
     case 'bear':{
      const body=ball(g,.44,c,0,.54,0);body.scale.set(.85,1.1,.7);ball(g,.35,c,0,1.12,0);for(const x of [-.26,.26]){ball(g,.14,c,x,1.39,0);ball(g,.11,0xe1b993,x,1.4,.08);ball(g,.18,c,x,.14,.13);ball(g,.16,c,x*1.65,.65,0);ball(g,.032,dark,x*.48,1.16,.3);}ball(g,.13,0xe8c5a2,0,1.05,.29);ball(g,.048,dark,0,1.1,.4);box(g,.32,.08,.07,0x7baba0,0,.82,.34);break;
     }
     case 'blocks':{
      box(g,.62,.62,.62,c,-.34,.34,.15);box(g,.62,.62,.62,0x96b8b0,.34,.34,.15);box(g,.62,.62,.62,0xc68472,0,.98,.13);label(g,'A',0,1,.453,.43);label(g,'B',-.34,.35,.474,.43);label(g,'C',.34,.35,.474,.43);break;
     }
     case 'ball':{
      ball(g,.62,c,0,.64,0);for(let i=0;i<3;i++){const stripe=mesh(new T.TorusGeometry(.625,.021,8,48),white,g,0,.64,0);stripe.rotation.y=i*Math.PI/3;}break;
     }
     case 'car':{
      box(g,1.5,.32,.78,c,0,.37,0);box(g,.75,.37,.68,c,-.1,.7,0);box(g,.53,.23,.025,0x72919b,-.1,.74,.352);for(const x of [-.5,.5])for(const z of [-.43,.43]){const wheel=cyl(g,.22,.22,.14,dark,x,.23,z);wheel.rotation.x=Math.PI/2;}label(g,'TOY',.48,.43,.398,.35);break;
     }
     case 'duck':{
      const body=ball(g,.5,c,0,.5,0);body.scale.set(1.2,.85,.85);ball(g,.3,c,.3,.98,.03);const bill=ball(g,.2,0xe68b46,.56,.95,.09);bill.scale.set(1,.35,.8);ball(g,.035,dark,.38,1.06,.29);const wing=ball(g,.27,0xe1b546,-.12,.57,.33);wing.scale.set(1,.7,.25);break;
     }
     case 'sedan':{
      box(g,1.8,.36,.82,c,0,.4,0,.12);box(g,1.0,.36,.76,c,-.1,.74,0,.14);
      for(const z of [.381,-.381]){box(g,.4,.24,.02,glass,-.36,.77,z);box(g,.4,.24,.02,glass,.14,.77,z);}
      box(g,.03,.27,.64,glass,.41,.77,0);box(g,.03,.25,.62,glass,-.61,.77,0);
      for(const z of [-.27,.27]){ball(g,.065,0xfff1b0,.9,.45,z);box(g,.04,.06,.14,0xc0473b,-.91,.48,z);}
      for(const x of [-.56,.56])for(const z of [-.4,.4])wheel(g,.21,x,.22,z);
      label(g,item.label,.1,.42,.415,.5);break;
     }
     case 'scooter':{
      box(g,.95,.1,.34,dark,0,.3,0);box(g,.62,.4,.42,c,-.33,.52,0,.14);box(g,.55,.1,.36,0x2b3236,-.33,.78,0,.05);
      const shield=box(g,.14,.66,.4,c,.42,.6,0,.06);shield.rotation.z=-.22;
      cyl(g,.04,.04,.42,dark,.55,1.02,0);box(g,.06,.06,.62,dark,.57,1.22,0);ball(g,.075,0xfff1b0,.62,1.1,0);box(g,.08,.04,.38,dark,-.1,.88,0);
      wheel(g,.21,.5,.21,0,.13);wheel(g,.21,-.48,.21,0,.13);
      label(g,item.label,-.33,.52,.215,.48);break;
     }
     case 'mower':{
      box(g,1.0,.28,.86,c,0,.32,0,.1);cyl(g,.25,.28,.3,dark,.05,.6,0);cyl(g,.17,.17,.1,0xa4a9ab,.05,.8,0);box(g,.12,.08,.05,0xd8d8d0,.05,.88,0);
      for(const x of [-.38,.38])for(const z of [-.46,.46])wheel(g,.17,x,.17,z,.1);
      for(const z of [-.3,.3])bar(g,-.45,.45,-1.05,1.22,.05,dark,z);box(g,.06,.06,.66,dark,-1.05,1.22,0);
      const bag=box(g,.38,.4,.55,0x6c7a55,-.68,.5,0,.12);bag.rotation.z=.25;
      label(g,item.label,.05,.32,.435,.45);break;
     }
     case 'van':{
      box(g,2.05,.12,.72,dark,.1,.22,0);box(g,.62,.72,.82,c,.78,.6,0,.1);box(g,.03,.3,.66,glass,1.09,.74,0);
      for(const z of [.411,-.411])box(g,.32,.24,.02,glass,.82,.76,z);
      box(g,1.35,1.0,.88,white,-.25,.75,0,.05);for(const z of [-.25,.25])ball(g,.06,0xfff1b0,1.09,.38,z);
      for(const x of [.78,-.55])for(const z of [-.4,.4])wheel(g,.2,x,.2,z);
      label(g,item.label,-.25,.75,.445,.7);break;
     }
     case 'bus':{
      box(g,2.5,.88,.86,c,0,.66,0,.12);box(g,2.48,.12,.87,white,0,1.06,0);box(g,2.48,.08,.87,0xe9c05a,0,.35,0);
      for(let i=0;i<5;i++)for(const z of [.431,-.431])box(g,.34,.3,.02,glass,-.95+i*.42,.82,z);
      box(g,.03,.48,.74,glass,1.25,.8,0);box(g,.03,.14,.6,0x23394c,1.255,1.08,0);box(g,.26,.56,.02,0x3d6f5a,1.0,.58,.432);
      for(const z of [-.28,.28])ball(g,.07,0xfff1b0,1.25,.4,z);
      for(const x of [-.78,.78])for(const z of [-.42,.42])wheel(g,.21,x,.22,z);
      label(g,item.label,-.3,.52,.435,.62);break;
     }
     case 'metro':{
      for(const z of [-.3,.3])box(g,2.7,.06,.07,0x8d9296,0,.07,z);for(let i=0;i<7;i++)box(g,.14,.05,.85,0x8a6a4a,-1.2+i*.4,.03,0);
      for(const x of [-.75,.75])box(g,.55,.16,.62,dark,x,.18,0);
      box(g,2.4,.82,.82,c,0,.66,0,.16);box(g,2.42,.09,.84,0x2f6db5,0,.31,0);box(g,2.42,.05,.84,0x2f6db5,0,1.0,0);
      for(let i=0;i<4;i++)for(const z of [.411,-.411])box(g,.32,.26,.02,0x55788c,-.78+i*.52,.8,z);
      for(const x of [-.52,0,.52])box(g,.2,.6,.02,0xaeb8bd,x,.6,.412);
      box(g,.03,.36,.6,0x55788c,1.2,.78,0);
      label(g,item.label,-.78,.49,.415,.42);break;
     }
     case 'bicycle':{
      for(const x of [-.55,.55]){mesh(new T.TorusGeometry(.34,.035,8,28),dark,g,x,.38,0);for(let i=0;i<4;i++){const sp=box(g,.66,.012,.012,0xb5bcc0,x,.38,0,.004);sp.rotation.z=i*Math.PI/4;}}
      bar(g,-.55,.38,-.05,.38,.05,c);bar(g,-.55,.38,-.18,.86,.05,c);bar(g,-.05,.38,-.18,.9,.055,c);bar(g,-.05,.38,.4,.84,.055,c);bar(g,-.16,.82,.4,.84,.05,c);bar(g,.55,.38,.4,.98,.05,c);
      box(g,.3,.07,.14,0x2b3236,-.22,.94,0);box(g,.07,.05,.5,dark,.42,1.02,0);cyl(g,.07,.07,.08,dark,-.05,.38,0).rotation.x=Math.PI/2;
      box(g,.04,.2,.04,dark,-.05,.3,.07);box(g,.14,.03,.08,dark,-.05,.2,.1);
      box(g,.48,.18,.025,white,.05,.62,.035);label(g,item.label,.05,.62,.05,.44);break;
     }
     case 'shoes':{
      for(const [x,z] of [[.12,.2],[-.06,-.22]] as const){box(g,.78,.1,.32,white,x,.06,z,.04);box(g,.52,.27,.3,c,x-.1,.24,z,.1);const toe=ball(g,.17,c,x+.18,.18,z);toe.scale.set(1.1,.75,.9);for(let i=0;i<3;i++)box(g,.04,.025,.2,white,x+.02-i*.1,.38,z,.01);box(g,.18,.34,.3,c,x-.3,.28,z,.08);}
      cyl(g,.035,.035,1.25,0x9aa3a8,-.6,.62,-.25);cyl(g,.3,.3,.04,0xe8e8e2,-.6,1.2,-.25).rotation.x=Math.PI/2;walkSign(g,-.6,1.2,-.225,.28);
      box(g,.46,.16,.03,white,-.6,.75,-.22);label(g,item.label,-.6,.75,-.203,.42);break;
     }
     case 'faucet':{
      box(g,1.3,.55,.8,white,0,.28,0,.06);cyl(g,.36,.3,.06,0x9fb6c0,0,.56,.07);
      cyl(g,.06,.07,.42,c,0,.75,-.27);box(g,.09,.09,.42,c,0,.95,-.1);cyl(g,.05,.05,.12,c,0,.87,.1);box(g,.34,.05,.07,c,0,1.0,-.28);ball(g,.05,0xc0473b,.17,1.0,-.28);
      cyl(g,.035,.035,.24,0x5fb0e4,0,.69,.1);
      label(g,item.label,0,.28,.405,.55);break;
     }
     case 'toilet':{
      cyl(g,.24,.3,.12,c,.12,.06,0);const bowl=cyl(g,.38,.25,.42,c,.12,.32,0);bowl.scale.z=.82;
      const seat=mesh(new T.TorusGeometry(.32,.06,8,24),0xdedbd2,g,.12,.56,0);seat.rotation.x=Math.PI/2;seat.scale.y=.82;
      box(g,.38,.66,.76,c,-.42,.8,0,.08);box(g,.42,.06,.8,0xdedbd2,-.42,1.15,0);cyl(g,.07,.07,.04,0xa4a9ab,-.42,1.19,0);
      const lid=box(g,.06,.6,.6,0xdedbd2,-.18,.86,0);lid.rotation.z=.12;
      label(g,item.label,-.42,.72,.385,.36);break;
     }
     case 'dispenser':{
      box(g,.72,1.12,.62,c,0,.56,0,.06);box(g,.52,.38,.02,0x7f97a3,0,.84,.315);
      box(g,.08,.11,.09,0xd0473b,-.13,.92,.35);box(g,.08,.11,.09,0x3b78c4,.13,.92,.35);box(g,.48,.04,.17,dark,0,.66,.38);
      cyl(g,.1,.12,.12,0x8ac4e8,0,1.18,0);cyl(g,.29,.29,.55,0x8ac4e8,0,1.52,0);cyl(g,.29,.24,.08,0x8ac4e8,0,1.83,0);
      label(g,item.label,0,.36,.315,.5);break;
     }
     case 'trashbin':{
      cyl(g,.42,.34,.95,c,0,.48,0);mesh(new T.TorusGeometry(.43,.035,8,32),dark,g,0,.96,0).rotation.x=Math.PI/2;
      const lid=cyl(g,.45,.45,.06,0x46705a,0,1.02,0);lid.rotation.z=.12;box(g,.26,.06,.08,dark,0,1.09,0);
      ico(g,.13,white,.13,1.0,.24);ico(g,.1,0xe3d2b0,-.15,1.0,.22);
      label(g,item.label,0,.5,.39,.5);break;
     }
     case 'dumpster':{
      box(g,1.4,.76,.86,c,0,.56,0,.05);box(g,1.45,.09,.9,0x2c5363,0,.9,0);const lid=box(g,1.46,.05,.9,0x2c5363,0,1.0,-.03);lid.rotation.x=-.12;
      for(const x of [-.53,.53])for(const z of [-.32,.32]){box(g,.06,.12,.06,dark,x,.13,z);wheel(g,.07,x,.07,z,.06);}
      bar(g,-.72,.6,-.72,.95,.04,dark,.3);bar(g,-.72,.6,-.72,.95,.04,dark,-.3);box(g,.05,.05,.65,dark,-.75,.95,0);
      label(g,item.label,0,.56,.433,.62);break;
     }
     case 'garbagetruck':{
      box(g,2.35,.12,.74,dark,0,.22,0);box(g,.6,.72,.84,white,.84,.6,0,.1);box(g,.03,.3,.66,glass,1.15,.74,0);for(const z of [.421,-.421])box(g,.32,.24,.02,glass,.88,.76,z);
      box(g,1.45,1.0,.88,c,-.2,.78,0,.2);box(g,1.46,.1,.89,0x3a8f5a,-.2,.5,0);
      const hopper=box(g,.38,.8,.86,0x6e7478,-1.03,.66,0,.08);hopper.rotation.z=-.22;
      for(const z of [-.25,.25])ball(g,.06,0xfff1b0,1.15,.38,z);
      for(const x of [.84,-.5])for(const z of [-.41,.41])wheel(g,.21,x,.21,z);
      label(g,item.label,-.2,.82,.445,.7);break;
     }
     case 'solar':{
      box(g,1.7,.08,1.0,0xa4a9ab,0,.04,0);
      for(const x of [-.7,.7]){box(g,.06,.42,.06,dark,x,.29,.36);box(g,.06,1.0,.06,dark,x,.56,-.36);}
      const panel=new T.Group();panel.position.set(0,.76,0);panel.rotation.x=.6;g.add(panel);box(panel,1.62,.06,1.02,0xd5d8da,0,0,0,.02);
      for(let i=0;i<4;i++)for(let j=0;j<3;j++)box(panel,.37,.02,.3,c,-.585+i*.39,.04,-.32+j*.32,.01);
      box(g,.52,.18,.03,white,0,.2,.52);label(g,item.label,0,.2,.537,.48);break;
     }
     case 'turbine':{
      cyl(g,.42,.46,.1,0x8bb36a,0,.05,0);cyl(g,.09,.15,1.3,c,0,.75,0);box(g,.26,.26,.5,c,0,1.45,-.04,.08);const nose=ball(g,.13,0xc0473b,0,1.45,.24);nose.scale.z=1.3;
      const rotor=new T.Group();rotor.position.set(0,1.45,.28);rotor.rotation.z=.3;g.add(rotor);
      for(let i=0;i<3;i++){const arm=new T.Group();arm.rotation.z=i*Math.PI*2/3;rotor.add(arm);box(arm,.2,.8,.04,c,0,.46,0,.03);box(arm,.2,.12,.045,0xc0473b,0,.82,0,.02);}
      box(g,.44,.16,.03,0x2f6db5,0,.42,.15);label(g,item.label,0,.42,.167,.4);break;
     }
     case 'tree':{
      cyl(g,.5,.55,.08,0x8bb36a,0,.04,0);cyl(g,.11,.17,.95,0x8a5a3a,0,.5,0);
      ico(g,.56,c,0,1.25,0);ico(g,.42,0x5ea455,.38,1.08,.15);ico(g,.42,0x447f40,-.34,1.12,-.1);ico(g,.38,0x6aaf5c,0,1.62,.05);
      box(g,.04,.42,.04,0x8a6a4a,.42,.22,.38);box(g,.42,.15,.03,white,.42,.4,.4);label(g,item.label,.42,.4,.417,.38);break;
     }
     case 'hedge':{
      box(g,1.7,.26,.62,0x9b7a5a,0,.13,0);box(g,1.74,.05,.66,0x7d5f45,0,.27,0);
      for(let i=0;i<4;i++){const b=ico(g,.3,i%2?c:0x4f8a42,-.6+i*.4,.5,0);b.scale.set(1.05,.95,1);}
      for(let i=0;i<3;i++)ico(g,.22,0x6aaf5c,-.4+i*.4,.7,.05);
      label(g,item.label,0,.13,.312,.46);break;
     }
    }
    const bounds=new T.Box3().setFromObject(g),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());g.position.set(-center.x,-bounds.min.y,-center.z);const scale=1.42/Math.max(size.x,size.y,size.z);g.scale.setScalar(scale);g.position.multiplyScalar(scale);root.userData.height=size.y*scale;
    g.traverse(o=>{if(o instanceof T.Mesh){o.userData.id=p.id;meshes.push(o);}});
    const ring=new T.Mesh(new T.TorusGeometry(.81,.025,8,40),new T.MeshBasicMaterial({color:0xf2ae3e}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;ring.visible=false;root.add(ring);root.userData.ring=ring;root.rotation.y=p.angle;
   }
   const ray=new T.Raycaster(),mouse=new T.Vector2();let start=[0,0],pointerId=-1;
   const down=(e:PointerEvent)=>{start=[e.clientX,e.clientY];pointerId=e.pointerId;};
   const up=(e:PointerEvent)=>{if(e.pointerId!==pointerId||Math.hypot(e.clientX-start[0],e.clientY-start[1])>7||latest.current.game.locked)return;const rect=r.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);const active=meshes.filter(m=>{const id=m.userData.id;return !latest.current.game.removed.includes(id)&&!latest.current.game.parked.includes(id);});const hit=ray.intersectObjects(active,false)[0];if(hit)latest.current.onPick(hit.object.userData.id);};
   r.domElement.addEventListener('pointerdown',down);r.domElement.addEventListener('pointerup',up);
   function resize(){const w=el!.clientWidth,h=el!.clientHeight;r.setSize(w,h);camera.aspect=w/h;camera.position.sub(controls.target).normalize().multiplyScalar(Math.max(latest.current.game.round.pieces.length>6?11.4:9.5,15/camera.aspect)).add(controls.target);camera.updateProjectionMatrix();}
   const observer=new ResizeObserver(resize);observer.observe(el);resize();
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let frame=0,last=0;
   const render=(now:number)=>{frame=requestAnimationFrame(render);if(now-last<30)return;last=now;const {game,spread,layout}=latest.current;const n=game.round.pieces.length;const order=[...game.round.pieces].sort((a,b)=>((a.slot*7+layout*5)%n)-((b.slot*7+layout*5)%n));
    order.forEach((p,index)=>{const root=bodies.get(p.id)!;const removed=game.removed.includes(p.id),parked=game.parked.includes(p.id),sel=game.selected===p.id;const col=index%9;const lower=order.slice(0,index).filter((q,j)=>j%9===col&&!game.removed.includes(q.id)&&!game.parked.includes(q.id)).reduce((sum,q)=>sum+(bodies.get(q.id)!.userData.height as number)+.015,0);
     const columns=n===6?3:6;const tx=spread?(index%columns-(columns-1)/2)*(n===6?2.1:1.58):(col%3-1)*2.4, tz=spread?(Math.floor(index/columns)-(Math.ceil(n/columns)-1)/2)*2.1:(Math.floor(col/3)-1)*2.05,ty=spread?.04:lower+.04;
     if(!initial.has(p.id)){root.position.set(tx,ty,tz);initial.set(p.id,1);}else root.position.lerp(new T.Vector3(tx,ty+(sel?.28:0),tz),reduced?1:.16);
     if(removed&&!timing.has(p.id))timing.set(p.id,now);const elapsed=removed?(reduced?1:(now-timing.get(p.id)!)/420):0;root.scale.setScalar(removed?Math.max(.001,1-elapsed):1);root.visible=!parked&&(!removed||elapsed<1);if(removed)root.position.y+=elapsed*.18;
     (root.userData.ring as Three.Mesh).visible=sel;root.rotation.y=p.angle+layout*.37;
     root.traverse(o=>{if(o instanceof T.Mesh&&o.material instanceof T.MeshStandardMaterial){o.material.emissive.setHex(game.flash.includes(p.id)&&game.kind!=='correct'?0xa43519:sel?0x644516:0);o.material.emissiveIntensity=.16;}});
    });controls.update();r.render(scene,camera);
   };frame=requestAnimationFrame(render);setStatus('ready');
   dispose=()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();r.domElement.removeEventListener('pointerdown',down);r.domElement.removeEventListener('pointerup',up);scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){(m as Three.MeshStandardMaterial).map?.dispose();m.dispose();}}});r.dispose();r.domElement.remove();};
   if(gone)dispose();
  }catch{renderer?.dispose();renderer?.domElement.remove();if(!gone)setStatus('failed');}})();
  return()=>{gone=true;dispose();};
 },[props.game.round]);
 return <div className="cm-canvas-wrap"><div ref={host} className="cm-canvas"/>{status!=='ready'&&<div className="cm-scene-status">{status==='loading'?'正在把物件放上桌…':'3D 暫時無法顯示，請使用下方「物件清單」繼續配對。'}</div>}<span className="cm-canvas-tip">拖曳空白處轉動 · 點物件選取 · 滾輪縮放</span></div>;
}
