'use client';
import {useEffect,useRef,useState} from 'react';
import type * as Three from 'three';
import {parts,type Upgrade,type Id,type Direction,type Vec} from './model';
interface Props{design:Upgrade[];removed:Id[];selected:Id;direction:Direction;cutaway:boolean;view:'orbit'|'front'|'back'|'top';viewNonce:number;onPick:(id:Id)=>void;busy?:boolean;inspection?:boolean}
export default function RecyclingScene(props:Props){
 const host=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;
 const api=useRef<{rebuild:()=>void;view:()=>void}|null>(null),[status,setStatus]=useState('loading');
 useEffect(()=>{let cancelled=false,cleanup=()=>{};const el=host.current;if(!el)return;
 (async()=>{let renderer:Three.WebGLRenderer|undefined;try{
  const T=await import('three'),{OrbitControls}=await import('three/addons/controls/OrbitControls.js'),{RoundedBoxGeometry}=await import('three/addons/geometries/RoundedBoxGeometry.js'),{RoomEnvironment}=await import('three/addons/environments/RoomEnvironment.js');if(cancelled)return;
  const r=renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});r.setPixelRatio(Math.min(devicePixelRatio,1.6));r.shadowMap.enabled=true;r.shadowMap.type=T.PCFShadowMap;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.1;el.appendChild(r.domElement);r.domElement.setAttribute('aria-label','攜帶式露營燈：燈罩、提把、外殼及內部模組');
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,80),controls=new OrbitControls(camera,r.domElement);controls.enablePan=false;controls.enableDamping=true;controls.minDistance=5;controls.maxDistance=17;controls.maxPolarAngle=Math.PI*.48;
  const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(r),env=pmrem.fromScene(room);scene.environment=env.texture;room.dispose();pmrem.dispose();scene.add(new T.HemisphereLight(0xffffff,0x657280,1.3));const sun=new T.DirectionalLight(0xfff6e9,3.5);sun.position.set(-3,8,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7});sun.shadow.normalBias=.03;scene.add(sun);
  const mat=(color:number,roughness=.5,metalness=.05)=>new T.MeshStandardMaterial({color,roughness,metalness});
  const table=new T.Mesh(new T.CylinderGeometry(6.5,6.5,.12,80),mat(0xe8e6df,.9));table.position.y=-.09;table.receiveShadow=true;scene.add(table);
  const group=new T.Group();scene.add(group);const bodies=new Map<Id,Three.Group>(),pickables:Three.Object3D[]=[];let cached=parts(latest.current.design);
  const dispose=(obj:Three.Object3D)=>obj.traverse(o=>{const m=o as Three.Mesh;m.geometry?.dispose();if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(a=>{(a as Three.MeshStandardMaterial).map?.dispose();a.dispose();});});
  const mesh=(g:Three.BufferGeometry,m:Three.Material,parent:Three.Object3D,pos:Vec)=>{const o=new T.Mesh(g,m);o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
  const rounded=(size:Vec,pos:Vec,color:number,parent:Three.Object3D,radius=.08,metalness=.03)=>mesh(new RoundedBoxGeometry(...size,3,radius),mat(color,metalness>.3?.3:.55,metalness),parent,pos);
  function decal(text:string,pos:Vec,size:[number,number],g:Three.Group,top=false,color='#dfe6e8'){const cv=document.createElement('canvas');cv.width=512;cv.height=160;const ctx=cv.getContext('2d')!;ctx.clearRect(0,0,512,160);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 54px Arial';ctx.fillText(text,256,80);const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;const o=mesh(new T.PlaneGeometry(...size),new T.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,roughness:1}),g,pos);o.userData.decal=true;if(top)o.rotation.x=-Math.PI/2;}
  function wire(points:Vec[],color:number,g:Three.Group,radius=.025){const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));return mesh(new T.TubeGeometry(curve,24,radius,8,false),mat(color,.65),g,[0,0,0]);}
  function screw(pos:Vec,dir:Direction,g:Three.Group,torx=false){const s=new T.Group();s.position.set(...pos);if(dir==='front')s.rotation.x=Math.PI/2;else if(dir==='back')s.rotation.x=-Math.PI/2;g.add(s);s.userData.screw=true;mesh(new T.CylinderGeometry(.072,.062,.035,20),mat(0xaeb6bf,.24,.9),s,[0,0,0]);rounded([.085,.006,.018],[0,.022,0],0x29343b,s,.001);rounded([.018,.006,.085],[0,.022,0],0x29343b,s,.001);if(torx){const slot=rounded([.018,.008,.085],[0,.024,0],0x29343b,s,.001);slot.rotation.y=Math.PI/3;}return s;}
  function rebuild(){dispose(group);group.clear();bodies.clear();pickables.length=0;cached=parts(latest.current.design);
   cached.forEach(p=>{const g=new T.Group();group.add(g);bodies.set(p.id,g);
    if(p.id==='shell'){
     p.solids.forEach(b=>rounded(b.size,b.center,0x334e60,g,.08));
     rounded([3.35,.22,2.34],[0,.25,0],0x1e303e,g,.1);
     for(const x of [-1.2,1.2])for(const z of [-.8,.8]){mesh(new T.CylinderGeometry(.13,.13,.28,16),mat(0x354855),g,[x,.46,z]);mesh(new T.CylinderGeometry(.052,.052,.29,12),mat(0xb1ac95,.3,.7),g,[x,.47,z]);}
     for(let i=0;i<7;i++)rounded([.022,.055,.085],[1.707,.8+i*.09,.35],0x112634,g,.02);
     rounded([.035,.15,.34],[1.708,.65,-.35],0x182731,g,.04);rounded([.045,.04,.22],[1.725,.65,-.35],0x96a1a9,g,.01,.8);
     for(const x of [-1.3,1.3])for(const z of [-.88,.88])rounded([.35,.1,.35],[x,.03,z],0x263039,g,.07);
     decal('FIELD / 05',[0,.49,1.215],[1.1,.16],g,false);decal('USB-C',[1.712,.44,-.35],[.3,.1],g,false);
    }else if(p.id==='cap'){
     rounded([3.38,.16,2.38],[0,1.72,0],0x263c4a,g,.1);
     const diffuser=rounded([3.2,.78,2.2],[0,2.16,0],0xf0f1e8,g,.27);const dm=diffuser.material as Three.MeshStandardMaterial;dm.roughness=.27;dm.emissive.setHex(0xffe1a0);dm.emissiveIntensity=.1;diffuser.userData.diffuser=true;
     rounded([2.1,.018,1.25],[0,2.55,0],0xfff7df,g,.1);
     for(const x of [-1.48,1.48])screw([x,1.81,.83],'up',g);
    }else if(p.id==='brace'){
     p.solids.forEach(b=>rounded(b.size,b.center,0x969da0,g,.025,.82));for(const x of [-1.3,1.3]){rounded([.2,.14,.43],[x,1.47,0],0x737d80,g,.018,.8);screw([x,1.66,0],'up',g,!latest.current.design.includes('screws'));}
     decal('RETAINING BRACKET',[0,1.635,0],[1.3,.17],g,true,'#3a4549');
    }else if(p.id==='battery'){
     rounded(p.box.size,p.box.center,0x253b3d,g,.12);rounded([.85,.012,.62],[-.72,1.274,.08],0xe4d8b2,g,.02);decal('Li-ion MODULE',[-.72,1.285,.08],[.76,.2],g,true,'#394944');
     rounded([.13,.18,.25],[-.12,.95,.1],0xf0eee0,g,.03);wire([[-.15,1,.1],[.0,1.07,.1],[.1,.9,.22]],0xbd5948,g);wire([[-.15,1,-.03],[.0,1.06,-.05],[.1,.88,.08]],0x283438,g);
    }else if(p.id==='board'){
     rounded(p.box.size,p.box.center,0x286256,g,.025);for(let j=0;j<3;j++){rounded([.24,.12,.23],[.82,.79,-.4+j*.4],0x263239,g,.015);wire([[.51,.732,-.57+j*.35],[.6,.732,-.57+j*.35],[.6,.732,-.48+j*.35],[1.2,.732,-.48+j*.35]],0xbea264,g,.012);}
     for(const z of [-.54,.54])screw([1.18,.765,z],'up',g);rounded([.25,.18,.18],[.64,.81,.5],0xe9e3c9,g,.02);decal('LED DRIVER',[.88,.732,0],[.53,.1],g,true,'#ebdfab');
    }else if(p.id==='handle'){
     wire([[-1.1,1.43,-1.42],[-1.1,2.8,-1.42],[-.9,3.23,-1.42],[0,3.28,-1.42],[.9,3.23,-1.42],[1.1,2.8,-1.42],[1.1,1.43,-1.42]],0x899296,g,.09);
     rounded([1.25,.21,.25],[0,3.25,-1.42],0x24353d,g,.08);
     for(const x of [-1.1,1.1])screw([x,1.46,-1.59],'back',g,!latest.current.design.includes('screws'));
    }else if(p.id==='trim'){
     rounded(p.box.size,p.box.center,0x1c3038,g,.12);for(let i=0;i<4;i++)rounded([.39,.023,.025],[1.05,.63+i*.11,1.405],0x45606a,g,.005);
    }else if(p.id==='hatch'){
     rounded(p.box.size,p.box.center,0x2c4453,g,.06);rounded([1.32,.75,.015],[-.72,.95,1.371],0x3e5c6b,g,.055);for(const x of [-1.28,-.16])screw([x,.95,1.39],'front',g);decal(latest.current.design.includes('battery')?'BATTERY ACCESS':'FIELD LIGHT',[-.72,1.1,1.387],[.8,.15],g);
    }
    g.traverse(o=>{if(o instanceof T.Mesh){o.userData.id=p.id;pickables.push(o);}});
   });
  }
  let wanted:Three.Vector3|null=null;function view(){const v=latest.current.view;wanted=new T.Vector3(...(v==='front'?[0,4.3,10]:v==='back'?[0,4.4,-10]:v==='top'?[.01,11,.01]:[4.8,4,6.5]) as Vec);controls.target.set(0,1.2,0);}
  api.current={rebuild,view};rebuild();view();camera.position.copy(wanted!);wanted=null;controls.update();
  let down=[0,0];const ray=new T.Raycaster(),pointer=new T.Vector2();
  const onDown=(e:PointerEvent)=>{down=[e.clientX,e.clientY];wanted=null;};const onUp=(e:PointerEvent)=>{if(latest.current.busy||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const rect=r.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(pickables,false).filter(hit=>!latest.current.removed.includes(hit.object.userData.id));if(hits[0])latest.current.onPick(hits[0].object.userData.id);};
  r.domElement.addEventListener('pointerdown',onDown);r.domElement.addEventListener('pointerup',onUp);const lost=(e:Event)=>{e.preventDefault();setStatus('fallback');};r.domElement.addEventListener('webglcontextlost',lost);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let raf=0,last=0;
  function render(){const p=latest.current;if(wanted){camera.position.lerp(wanted,reduced.matches?1:.14);if(camera.position.distanceTo(wanted)<.015)wanted=null;}controls.update();
   bodies.forEach((g,id)=>{const part=cached.find(x=>x.id===id)!,removed=p.removed.includes(id);if(removed&&!g.userData.at)g.userData.at=performance.now();if(!removed)g.userData.at=0;const elapsed=reduced.matches?3:(performance.now()-(g.userData.at||performance.now()))/1000;
    const outward=Math.min(1,Math.max(0,(elapsed-.28)/.6));g.position.set(...(part.direction==='up'?[0,outward*4,0]:part.direction==='front'?[0,0,outward*4]:[0,0,-outward*4]) as Vec);if(!removed)g.position.set(0,0,0);g.visible=!removed||elapsed<1.1;
    const inspecting=p.inspection&&id===p.selected;if(p.inspection){g.visible=id===p.selected;g.position.set(-part.box.center[0],1.2-part.box.center[1],-part.box.center[2]);}
    g.traverse(o=>{if(o.userData.screw){o.rotation.y=removed?Math.min(elapsed/.28,1)*Math.PI*4:0;o.visible=inspecting||!removed||elapsed<.28;}if(o instanceof T.Mesh){const m=o.material as Three.MeshStandardMaterial;const faded=p.cutaway&&!removed&&id!==p.selected&&(id==='shell'||id==='cap');m.transparent=!!o.userData.decal||(!inspecting&&(faded||removed));m.opacity=inspecting?1:faded?.12:removed?Math.max(0,1-(elapsed-.75)/.35):1;m.depthWrite=!faded&&!o.userData.decal;m.emissive.setHex(id===p.selected?0x266c87:o.userData.diffuser?0xffe2ae:0);m.emissiveIntensity=id===p.selected?.18:o.userData.diffuser?.12:0;}});
   });r.render(scene,camera);
  }
  const resize=()=>{if(!el.clientWidth)return;camera.aspect=el.clientWidth/el.clientHeight;camera.zoom=camera.aspect<.9?.94:1.12;camera.updateProjectionMatrix();r.setSize(el.clientWidth,el.clientHeight);render();};const ro=new ResizeObserver(resize);ro.observe(el);resize();
  const tick=(t:number)=>{if(cancelled)return;if(!document.hidden&&t-last>32){render();last=t;}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);setStatus('ready');
  cleanup=()=>{cancelAnimationFrame(raf);ro.disconnect();controls.dispose();dispose(scene);env.dispose();r.domElement.removeEventListener('pointerdown',onDown);r.domElement.removeEventListener('pointerup',onUp);r.domElement.removeEventListener('webglcontextlost',lost);r.dispose();r.domElement.remove();api.current=null;};
 }catch{renderer?.dispose();renderer?.domElement.remove();if(!cancelled)setStatus('fallback');}})();return()=>{cancelled=true;cleanup();};
 },[]);
 useEffect(()=>{api.current?.rebuild();},[props.design]);useEffect(()=>{api.current?.view();},[props.view,props.viewNonce]);
 return <div className="rc-scene-wrap"><div className="rc-model-badge">FIELD 05 <span>充電露營燈</span></div><div className="rc-scene" ref={host}/>{status!=='ready'&&<div className="rc-scene-status">{status==='loading'?'正在放上工作桌…':'此裝置無法顯示 3D，仍可使用零件清單完成活動。'}</div>}<span className="rc-scene-tip">拖曳轉動產品 · 點選部位 · 下方按鈕開始拆卸</span></div>;
}
