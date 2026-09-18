'use client';
import {useEffect,useRef,useState} from 'react';
import type * as Three from 'three';
import {foodById,normal,diskPolygon,lineEndpoints,cutFromPoints,type Cut,type Round} from './model';
interface Props {round:Round;cut:Cut;separated:boolean;orbit:boolean;top:boolean;viewNonce:number;onCut:(c:Cut)=>void;onInspect:(id:string)=>void}
export default function PizzaScene(props:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;
 const [status,setStatus]=useState('loading');
 useEffect(()=>{const el=host.current;if(!el)return;let stopped=false,cleanup=()=>{};
 (async()=>{let renderer:Three.WebGLRenderer|undefined;try{
  const T=await import('three'),{OrbitControls}=await import('three/addons/controls/OrbitControls.js'),{RoundedBoxGeometry}=await import('three/addons/geometries/RoundedBoxGeometry.js'),{RoomEnvironment}=await import('three/addons/environments/RoomEnvironment.js');if(stopped)return;
  const r=renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});r.setPixelRatio(Math.min(devicePixelRatio,1.6));r.shadowMap.enabled=true;r.shadowMap.type=T.PCFShadowMap;r.localClippingEnabled=true;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=.9;el.appendChild(r.domElement);r.domElement.setAttribute('aria-label','立體披薩：在餅面拖出切線，或用下方角度及位置控制；點配料可查看資料');
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,70),controls=new OrbitControls(camera,r.domElement);controls.target.set(0,.25,0);controls.enablePan=false;controls.enableDamping=true;controls.minDistance=7;controls.maxDistance=20;controls.minPolarAngle=.04;controls.maxPolarAngle=1.25;
  const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(r),env=pmrem.fromScene(room);scene.environment=env.texture;room.dispose();pmrem.dispose();scene.add(new T.HemisphereLight(0xfff8e9,0x7a5747,.8));const sun=new T.DirectionalLight(0xffedd3,2.5);sun.position.set(-4,9,5);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7});sun.shadow.normalBias=.02;scene.add(sun);
  const mat=(color:number,roughness=.65,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const mesh=(g:Three.Object3D,geo:Three.BufferGeometry,color:number,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
  const box=(g:Three.Object3D,size:[number,number,number],color:number,pos:[number,number,number]=[0,0,0],radius=.04)=>mesh(g,new RoundedBoxGeometry(...size,3,Math.min(radius,...size.map(v=>v/3))),color,...pos);
  const sphere=(g:Three.Object3D,radius:number,color:number,x=0,y=0,z=0)=>mesh(g,new T.SphereGeometry(radius,18,12),color,x,y,z);
  const cylinder=(g:Three.Object3D,rt:number,rb:number,h:number,color:number,x=0,y=0,z=0)=>mesh(g,new T.CylinderGeometry(rt,rb,h,64),color,x,y,z);
  function texture(type:'wood'|'crust'|'cheese'){const cv=document.createElement('canvas');cv.width=cv.height=512;const c=cv.getContext('2d')!;c.fillStyle=type==='wood'?'#a87043':type==='crust'?'#dfaa5a':'#eed797';c.fillRect(0,0,512,512);let seed=41;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
   if(type==='wood'){for(let i=0;i<160;i++){c.strokeStyle=`rgba(79,43,19,${.03+rand()*.12})`;c.beginPath();for(let x=0;x<=512;x+=8){const y=i*4+Math.sin(x/80+i)*3;c.lineTo(x,y);}c.stroke();}}
   else for(let i=0;i<1800;i++){const size=type==='crust'?1+rand()*9:2+rand()*15;c.fillStyle=type==='crust'?`rgba(112,52,16,${rand()*.28})`:`rgba(164,79,24,${rand()*.22})`;c.beginPath();c.ellipse(rand()*512,rand()*512,size,size*.7,rand()*3,0,Math.PI*2);c.fill();}
   const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;if(type==='wood')tex.repeat.set(2,2);return tex;
  }
  const wood=texture('wood'),crustTexture=texture('crust'),cheeseTexture=texture('cheese');
  const table=box(scene,[22,.25,18],0x8c6246,[0,-.43,0],.08);(table.material as Three.MeshStandardMaterial).map=wood;
  const board=cylinder(scene,3.82,3.9,.18,0xd5a56d,0,-.17,0);(board.material as Three.MeshStandardMaterial).map=wood;
  const plate=cylinder(scene,3.48,3.5,.12,0xf1e8d6,0,-.02,0);const plateRim=mesh(scene,new T.TorusGeometry(3.39,.065,10,100),0xe9dbc4,0,.065,0);plateRim.rotation.x=Math.PI/2;
  // Quiet kitchen details stay outside the interactive pizza.
  const cloth=box(scene,[2.1,.035,4.2],0x426b62,[-4.7,-.26,-.4],.015);cloth.rotation.y=.17;for(let i=0;i<8;i++){const stripe=box(scene,[.025,.008,4.15],0xb5b9a0,[-5.6+i*.23,-.233,-.4],.002);stripe.rotation.y=.17;}
  const herb=new T.Group();scene.add(herb);herb.position.set(4.55,-.22,-2.6);cylinder(herb,.45,.33,.63,0xa46e4d,0,.3,0);cylinder(herb,.4,.4,.02,0x4f3c2a,0,.63,0);for(let i=0;i<11;i++){const a=i*2.4;const leaf=sphere(herb,.23,0x4d7441,Math.sin(a)*.28,.7+(i%3)*.13,Math.cos(a)*.28);leaf.scale.set(.6,1.5,.35);leaf.rotation.z=a;}
  const halves=[new T.Group(),new T.Group()];halves.forEach(g=>scene.add(g));const bases:Three.Mesh[][]=[[],[]],planes=[new T.Plane(),new T.Plane()],pickables:Three.Mesh[]=[];
  const makeFood=(g:Three.Group,key:string,angle:number)=>{
   const f=foodById[key],body=new T.Group();body.rotation.y=angle;body.scale.set(1.7,1.5,1.7);g.add(body);
   if(key==='tomato'){cylinder(body,.245,.25,.072,0xb92312,0,.04,0);cylinder(body,.215,.215,.013,0xe44219,0,.083,0);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;const gel=sphere(body,.06,0xb8452c,Math.sin(a)*.125,.092,Math.cos(a)*.125);gel.scale.set(.7,.14,1.3);const seed=sphere(body,.021,0xf3c26c,Math.sin(a+.2)*.14,.101,Math.cos(a+.2)*.14);seed.scale.y=.2;}}
   if(key==='pepper'){const pts=Array.from({length:49},(_,i)=>{const a=i*Math.PI/24,radius=.19+.035*Math.cos(a*3);return new T.Vector3(Math.cos(a)*radius,.055,Math.sin(a)*radius);});const curve=new T.CatmullRomCurve3(pts,true);mesh(body,new T.TubeGeometry(curve,60,.05,8,true),0x24771a);for(let i=0;i<3;i++){const a=i*2.094;const vein=box(body,[.09,.025,.035],0x9da747,[Math.cos(a)*.15,.095,Math.sin(a)*.15],.01);vein.rotation.y=-a;}}
   if(key==='mushroom'){const stem=box(body,[.11,.1,.26],0xe6d6b9,[0,.06,.09],.04);const cap=sphere(body,.24,0x855232,0,.09,-.04);cap.scale.set(1,.32,.68);const inner=sphere(body,.18,0x795d49,0,.06,-.04);inner.scale.set(1,.15,.6);for(let j=0;j<7;j++){const slit=box(body,[.018,.012,.21],0x967251,[(j-3)*.045,.15,-.07],.002);slit.rotation.y=(j-3)*.15;}}
   if(key==='pineapple'){const p=box(body,[.39,.15,.28],0xf6a900,[0,.09,0],.05);p.rotation.y=.2;for(let j=0;j<5;j++)box(body,[.017,.015,.24],0xf6d570,[-.14+j*.065,.174,0],.003);}
   if(key==='feta'){box(body,[.36,.19,.32],0xeee3c7,[0,.11,0],.028);for(let j=0;j<7;j++){const hole=sphere(body,.021,0xd4c7a7,Math.sin(j*4)*.12,.21,Math.cos(j*3)*.1);hole.scale.y=.15;}}
   if(key==='shrimp'){const pts=Array.from({length:24},(_,j)=>{const a=-.3+j/23*4.6;return new T.Vector3(Math.cos(a)*.16,.09,Math.sin(a)*.16);});mesh(body,new T.TubeGeometry(new T.CatmullRomCurve3(pts),36,.075,10,false),0xeb7040);for(let j=0;j<7;j++){const a=.1+j*.53;const band=sphere(body,.079,0xb83c1e,Math.cos(a)*.16,.091,Math.sin(a)*.16);band.scale.set(.3,.85,1);band.rotation.y=-a;}const tail=box(body,[.12,.035,.15],0xdf4825,[.14,.045,-.09],.025);tail.rotation.y=.6;}
   if(key==='chicken'||key==='beef'){const chunk=box(body,[.45,.14,.31],key==='chicken'?0xc48738:0x763424,[0,.09,0],.09);chunk.rotation.y=.15;for(let j=0;j<4;j++){const mark=box(body,[.024,.014,.26],key==='chicken'?0x613218:0x5e382a,[-.14+j*.09,.168,0],.006);mark.rotation.y=.3;}if(key==='beef'){const fat=box(body,[.34,.012,.024],0xd0a780,[0,.175,-.07],.008);fat.rotation.y=-.3;}}
   body.traverse(o=>{if(o instanceof T.Mesh){o.userData.food=key;(o.material as Three.MeshStandardMaterial).envMapIntensity=.35;(o.material as Three.MeshStandardMaterial).roughness=.5;pickables.push(o);}});return body;
  };
  halves.forEach((g,index)=>{
   for(const [height,color] of [[.22,0xe2b779],[.028,0xb64b2f],[.065,0xeace87]]){const m=mesh(g,new T.BufferGeometry(),color,0,height===.22?.06:height===.028?.28:.307,0);bases[index].push(m);if(height===.065)(m.material as Three.MeshStandardMaterial).map=cheeseTexture;m.userData.depth=height;}
   const crust=mesh(g,new T.TorusGeometry(2.91,.155,16,128),0xe0ab61,0,.265,0);crust.rotation.x=Math.PI/2;(crust.material as Three.MeshStandardMaterial).map=crustTexture;
   for(let j=0;j<38;j++){const a=j*2.399,radius=.5+((j*71)%220)/100;const leaf=sphere(g,.018,j%3?0x577341:0x8c4b2c,Math.cos(a)*radius,.393,Math.sin(a)*radius);leaf.scale.set(1.3,.2,2);}
   for(const p of latest.current.round.toppings){const food=makeFood(g,p.food,p.rotation);food.position.set(p.x,.383,p.z);}
   g.traverse(o=>{if(o instanceof T.Mesh){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.clippingPlanes=[planes[index]];m.clipShadows=true;}}});
  });
  const labels=['A','B'].map((letter,i)=>{const cv=document.createElement('canvas');cv.width=cv.height=128;const ctx=cv.getContext('2d')!;ctx.fillStyle=i===0?'#416c5d':'#bb715b';ctx.beginPath();ctx.arc(64,64,54,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff7e7';ctx.lineWidth=5;ctx.stroke();ctx.fillStyle='#fff7e7';ctx.font='bold 68px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(letter,64,68);const texture=new T.CanvasTexture(cv);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(.47,.47,1);sprite.renderOrder=4;scene.add(sprite);return sprite;});
  const cutLine=mesh(scene,new T.CylinderGeometry(.018,.018,1,8),0xf9f0d3);const lineMat=cutLine.material as Three.MeshStandardMaterial;lineMat.emissive.setHex(0xe8b65f);lineMat.emissiveIntensity=.4;
  const knife=new T.Group();scene.add(knife);const wheel=cylinder(knife,.29,.29,.045,0xb9c2c3,0,.1,0);(wheel.material as Three.MeshStandardMaterial).metalness=.9;(wheel.material as Three.MeshStandardMaterial).roughness=.25;wheel.rotation.x=Math.PI/2;box(knife,[.07,.48,.065],0x9ca7a3,[0,.39,0],.02);box(knife,[.14,.38,.13],0x79503b,[0,.68,0],.05);knife.visible=false;
  // A travelling warm blade glow and brief crumbs mark the cut without a full-screen flash.
  const bladeGlow=new T.Mesh(new T.CylinderGeometry(.085,.085,1,12),new T.MeshBasicMaterial({color:0xffbf39,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));scene.add(bladeGlow);
  const sparks=Array.from({length:30},(_,i)=>{const m=new T.Mesh(new T.OctahedronGeometry(.025+(i%3)*.012),new T.MeshBasicMaterial({color:i%3?0xffc451:0xfff5bb,transparent:true,depthWrite:false}));scene.add(m);return m;});
  const ray=new T.Raycaster(),pointer=new T.Vector2(),workPlane=new T.Plane(new T.Vector3(0,1,0),-.4);let start:Three.Vector3|null=null,startScreen=[0,0],held=-1;
  function project(e:PointerEvent){const rect=r.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);return ray.ray.intersectPlane(workPlane,new T.Vector3());}
  const down=(e:PointerEvent)=>{if(latest.current.orbit||latest.current.separated)return;start=project(e);startScreen=[e.clientX,e.clientY];held=e.pointerId;r.domElement.setPointerCapture(e.pointerId);};
  const move=(e:PointerEvent)=>{if(!start||held!==e.pointerId||latest.current.orbit||latest.current.separated)return;const end=project(e);if(end){const c=cutFromPoints(start,end);if(c)latest.current.onCut(c);}};
  const up=(e:PointerEvent)=>{if(held!==e.pointerId)return;if(start&&Math.hypot(e.clientX-startScreen[0],e.clientY-startScreen[1])<7){project(e);const hit=ray.intersectObjects(pickables,false).find(h=>h.object.userData.food);if(hit)latest.current.onInspect(hit.object.userData.food);}start=null;held=-1;if(r.domElement.hasPointerCapture(e.pointerId))r.domElement.releasePointerCapture(e.pointerId);};
  const cancel=()=>{start=null;held=-1;};r.domElement.addEventListener('pointerdown',down);r.domElement.addEventListener('pointermove',move);r.domElement.addEventListener('pointerup',up);r.domElement.addEventListener('pointercancel',cancel);
  function view(){const width=el!.clientWidth,height=el!.clientHeight,aspect=width/height;const distance=Math.max(9.6,12.2/aspect);camera.position.copy(latest.current.top?new T.Vector3(.001,1,.001):new T.Vector3(0,1,.67).normalize()).multiplyScalar(distance).add(controls.target);controls.update();}
  function resize(){r.setSize(el!.clientWidth,el!.clientHeight);camera.aspect=el!.clientWidth/el!.clientHeight;camera.updateProjectionMatrix();view();}
  const observer=new ResizeObserver(resize);observer.observe(el);resize();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let frame=0,signature='',viewKey='',separateSince=0,wasSeparated=false;
  function animate(now:number){frame=requestAnimationFrame(animate);const p=latest.current,n=normal(p.cut),key=`${p.cut.angle}/${p.cut.offset}`;controls.enabled=p.orbit;
   if(viewKey!==`${p.top}/${p.viewNonce}`){viewKey=`${p.top}/${p.viewNonce}`;view();}
   if(signature!==key){signature=key;halves.forEach((g,index)=>{const pts=diskPolygon(p.cut,index===0?1:-1),shape=new T.Shape();shape.moveTo(pts[0].x,-pts[0].z);pts.slice(1).forEach(v=>shape.lineTo(v.x,-v.z));shape.closePath();for(const m of bases[index]){m.geometry.dispose();m.geometry=new T.ExtrudeGeometry(shape,{depth:m.userData.depth,bevelEnabled:false,steps:1});m.geometry.rotateX(-Math.PI/2);}});}
   if(p.separated&&!wasSeparated)separateSince=now;wasSeparated=p.separated;const time=(now-separateSince)/1000,amount=p.separated?(reduced?1:Math.min(1,Math.max(0,(time-.65)/.7))):0,ease=amount*amount*(3-2*amount);
   halves.forEach((g,index)=>{const side=index===0?1:-1;g.position.set(n.x*.48*ease*side,.07*ease,n.z*.48*ease*side);planes[index].normal.set(n.x*side,0,n.z*side);planes[index].constant=-p.cut.offset*side-.48*ease;labels[index].position.set(n.x*(side*(2.65+.48*ease)),.76,n.z*(side*(2.65+.48*ease)));});
   const [a,b]=lineEndpoints(p.cut),from=new T.Vector3(a.x,.8,a.z),to=new T.Vector3(b.x,.8,b.z);cutLine.visible=!p.separated;cutLine.position.copy(from).add(to).multiplyScalar(.5);cutLine.scale.y=from.distanceTo(to);cutLine.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),to.clone().sub(from).normalize());
   knife.visible=p.separated&&!reduced&&time<.7;if(knife.visible){knife.position.copy(from).lerp(to,Math.min(1,time/.65));knife.position.y=.7;knife.rotation.y=-p.cut.angle*Math.PI/180;wheel.rotation.z=-time*15;}
   const lit=p.separated&&!reduced&&time<1.3;bladeGlow.visible=lit;
   if(lit){const head=from.clone().lerp(to,Math.min(1,time/.65));bladeGlow.position.copy(from).add(head).multiplyScalar(.5);bladeGlow.scale.y=Math.max(.001,from.distanceTo(head));bladeGlow.quaternion.copy(cutLine.quaternion);bladeGlow.material.opacity=.72*Math.max(0,1-Math.max(0,time-.65)/.65);}
   sparks.forEach((spark,i)=>{const age=time-i/30*.65;spark.visible=lit&&age>=0&&age<.55;if(spark.visible){const origin=from.clone().lerp(to,i/30),angle=i*2.399; spark.position.set(origin.x+Math.cos(angle)*age*.9,origin.y+age*1.5-age*age*3,origin.z+Math.sin(angle)*age*.9);spark.rotation.set(age*6,i,age*9);spark.material.opacity=1-age/.55;}});
   controls.update();r.render(scene,camera);
  }frame=requestAnimationFrame(animate);setStatus('ready');
  cleanup=()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();for(const [name,fn] of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancel]] as const)r.domElement.removeEventListener(name,fn);scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});labels.forEach(s=>{s.material.map?.dispose();s.material.dispose();});wood.dispose();crustTexture.dispose();cheeseTexture.dispose();env.dispose();r.dispose();r.domElement.remove();};if(stopped)cleanup();
 }catch{renderer?.dispose();renderer?.domElement.remove();if(!stopped)setStatus('failed');}})();return()=>{stopped=true;cleanup();};
 },[props.round]);
 return <div className="pz-scene-wrap"><div ref={host} className="pz-scene"/>{status!=='ready'&&<div className="pz-load">{status==='loading'?'披薩即將出爐…':'3D 無法顯示；仍可使用角度、位置與配料座標表完成分配。'}</div>}<span className="pz-scene-tip">{props.separated?'切開完成後，可轉動觀察切面':props.orbit?'拖曳轉動披薩 · 切回「畫切線」開始分配':'在餅面拖出一條切線 · 點配料查看名稱'}</span></div>;
}
