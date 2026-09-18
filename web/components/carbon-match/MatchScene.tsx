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
