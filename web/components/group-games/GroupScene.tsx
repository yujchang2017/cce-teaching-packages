'use client';
import {useEffect,useRef,useState} from 'react';
import type * as Three from 'three';
import type {Mode,World,Simulation,Sample} from './types';
import {carPosition} from './animals';
interface Props {mode:Mode;world:World;run:Simulation;time:number;selected:number|null;view:'orbit'|'top'|'side';viewNonce:number;cutaway:boolean;paths:boolean;scenario:number;onPick:(value:string)=>void}
export function sampleAt(samples:Sample[],t:number):Sample{
  if(t<=samples[0].t)return samples[0];
  let lo=0,hi=samples.length-1;while(lo<hi){const m=Math.ceil((lo+hi)/2);if(samples[m].t<=t)lo=m;else hi=m-1;}
  const a=samples[lo],b=samples[Math.min(lo+1,samples.length-1)],f=b.t>a.t?Math.max(0,Math.min(1,(t-a.t)/(b.t-a.t))):0;
  return{...a,x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,z:a.z+(b.z-a.z)*f};
}
export default function GroupScene(props:Props){
  const host=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;
  const api=useRef<{world:()=>void;agents:()=>void;view:()=>void}|null>(null);
  const [status,setStatus]=useState('loading');
  useEffect(()=>{
    let disposed=false,cleanup=()=>{};const el=host.current;if(!el)return;
    (async()=>{let renderer:Three.WebGLRenderer|undefined;try{
      const T=await import('three'),{OrbitControls}=await import('three/addons/controls/OrbitControls.js');if(disposed)return;
      const scene=new T.Scene();renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});const r=renderer;r.setPixelRatio(Math.min(devicePixelRatio,1.4));r.shadowMap.enabled=true;r.shadowMap.type=T.PCFShadowMap;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.05;el.appendChild(r.domElement);r.domElement.setAttribute('aria-label',props.mode==='animals'?'動物通道立體工程地形':'有溫度與生活機能的立體街區');
      const camera=new T.PerspectiveCamera(42,1,.1,120),controls=new OrbitControls(camera,r.domElement);controls.enablePan=false;controls.minDistance=12;controls.maxDistance=40;controls.maxPolarAngle=Math.PI*.47;controls.enableDamping=true;controls.dampingFactor=.09;
      scene.add(new T.HemisphereLight(0xf0faff,0x86765f,2.1));const sun=new T.DirectionalLight(0xfff1d6,2.2);sun.position.set(-7,17,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12});sun.shadow.normalBias=.04;scene.add(sun);
      const environment=new T.Group(),actors=new T.Group(),routes=new T.Group();scene.add(environment,actors,routes);
      const pickables:Three.Object3D[]=[];let bodies:Three.Group[]=[],cars:Three.Group[]=[],road:Three.Mesh[]=[];
      const mat=(color:number,opacity=1)=>new T.MeshStandardMaterial({color,roughness:.85,transparent:opacity<1,opacity});
      const mesh=(g:Three.BufferGeometry,m:Three.Material,parent:Three.Object3D,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
      function clear(g:Three.Group){g.traverse(o=>{const m=o as Three.Mesh;m.geometry?.dispose();if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(v=>{const map=(v as Three.MeshStandardMaterial).map;map?.dispose();v.dispose();});});g.clear();}
      function label(text:string,x:number,y:number,z:number,color:string){const canvas=document.createElement('canvas');canvas.width=320;canvas.height=80;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fffdf0';ctx.beginPath();ctx.roundRect(3,3,314,74,12);ctx.fill();ctx.fillStyle=color;ctx.font='bold 34px Microsoft JhengHei, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,160,40);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:false,toneMapped:false}));sprite.position.set(x,y,z);sprite.scale.set(props.mode==='heat'?1.8:3,props.mode==='heat'?.45:.75,1);environment.add(sprite);}
      function updateWorld(){
        clear(environment);for(let i=pickables.length-1;i>=0;i--)if(!String(pickables[i].userData.pick).startsWith('agent:'))pickables.splice(i,1);road=[];
        for(const s of latest.current.world.shapes){
          const group=new T.Group();group.position.set(s.x,s.y,s.z);environment.add(group);
          if(s.kind==='tree'){mesh(new T.CylinderGeometry(.08,.11,s.h*.6,7),mat(0x806146),group,0,s.h*.3,0);mesh(new T.ConeGeometry(s.w*.65,s.h*.85,9),mat(s.color),group,0,s.h*.86,0);}
          else{const o=mesh(new T.BoxGeometry(s.w,s.h,s.d),mat(s.color,s.opacity),group);if(props.mode==='animals'&&s.x===0&&s.w===2&&s.d===11)road.push(o);}
          group.traverse(o=>{if(o instanceof T.Mesh&&s.pick){o.userData.pick=s.pick;pickables.push(o);}});
        }
        latest.current.world.markers.forEach(m=>label(m.text,m.x,m.y,m.z,m.color??'#2c5554'));
      }
      function updateAgents(){
        clear(actors);clear(routes);bodies=[];cars=[];
        // Drop stale actor references, retain only environmental pick surfaces.
        for(let i=pickables.length-1;i>=0;i--)if(String(pickables[i].userData.pick).startsWith('agent:'))pickables.splice(i,1);
        latest.current.run.travelers.forEach((p,i)=>{
          const g=new T.Group();actors.add(g);bodies.push(g);const color=props.mode==='animals'?0xb67e4d:[0x347ea3,0xb86d47,0x7b68a1,0x3b9076][Math.floor(i/6)];
          if(props.mode==='animals'){
            const body=mesh(new T.SphereGeometry(.23,9,7),mat(color),g,0,.25,0);body.scale.set(1.3,.8,.75);
            mesh(new T.SphereGeometry(.14,8,6),mat(0xcc9c68),g,.24,.4,0);
            for(const z of [-.065,.065])mesh(new T.ConeGeometry(.052,.19,5),mat(0xa97144),g,.25,.58,z);
            for(const x of [-.14,.14])for(const z of [-.11,.11])mesh(new T.CylinderGeometry(.025,.03,.18,5),mat(0x6d5843),g,x,.1,z);
          }else{
            mesh(new T.CylinderGeometry(.09,.13,.28,7),mat(color),g,0,.19,0);mesh(new T.SphereGeometry(.095,8,7),mat(0xeac69e),g,0,.43,0);
          }
          g.traverse(o=>{if(o instanceof T.Mesh){o.userData.pick=`agent:${i}`;pickables.push(o);}});
          const line=new T.Line(new T.BufferGeometry().setFromPoints(p.samples.map(s=>new T.Vector3(s.x,s.y+.04,s.z))),new T.LineBasicMaterial({color,transparent:true,opacity:.5}));line.userData.id=i;routes.add(line);
        });
        if(props.mode==='animals')for(let i=0;i<2;i++){const car=new T.Group();actors.add(car);cars.push(car);mesh(new T.BoxGeometry(.48,.3,.85),mat(i?0xcc8a61:0x718a9d),car);mesh(new T.BoxGeometry(.38,.2,.44),mat(0xe8dfcc),car,0,.22,0);}
      }
      function view(){const p=latest.current;camera.position.set(...(p.view==='top'?(props.mode==='heat'?[0,17,.001]:[0,25,.001]):p.view==='side'?(props.mode==='heat'?[9,5,12]:[13,6,18]):props.mode==='heat'?[0,13,12]:[14,16,19]) as [number,number,number]);controls.target.set(0,.2,0);controls.update();}
      api.current={world:updateWorld,agents:updateAgents,view};updateWorld();updateAgents();view();
      const ray=new T.Raycaster(),pointer=new T.Vector2();let down=[0,0];
      const onDown=(e:PointerEvent)=>{down=[e.clientX,e.clientY];};
      const onUp=(e:PointerEvent)=>{if(Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const rect=r.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(pickables)[0];if(hit)latest.current.onPick(hit.object.userData.pick);};
      r.domElement.addEventListener('pointerdown',onDown);r.domElement.addEventListener('pointerup',onUp);
      const lost=(e:Event)=>{e.preventDefault();setStatus('fallback');};r.domElement.addEventListener('webglcontextlost',lost);
      function render(){const p=latest.current;controls.update();
        bodies.forEach((g,i)=>{const person=p.run.travelers[i];if(!person)return;const point=sampleAt(person.samples,p.time),next=sampleAt(person.samples,p.time+.15);g.position.set(point.x,point.y,point.z);
          if(Math.hypot(next.x-point.x,next.z-point.z)>.001)g.rotation.y=-Math.atan2(next.z-point.z,next.x-point.x);
          const ended=p.time>=person.samples.at(-1)!.t,success=person.outcome==='抵達'||person.outcome==='安全返家';g.scale.setScalar(p.selected===i?1.45:1);
          g.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as Three.MeshStandardMaterial;m.emissive.setHex(p.selected===i?0x775f20:ended?(success?0x173e22:0x65251c):0);}});
        });
        cars.forEach((g,i)=>{const pos=carPosition(p.time,i,p.scenario);g.position.set(pos.x,pos.y,pos.z);});
        routes.children.forEach(o=>{o.visible=p.paths&&(p.selected===null||o.userData.id===p.selected);});
        road.forEach(o=>{const m=o.material as Three.MeshStandardMaterial;m.transparent=p.cutaway;m.opacity=p.cutaway?.18:1;m.depthWrite=!p.cutaway;});
        r.render(scene,camera);
      }
      const resize=()=>{if(!el.clientWidth)return;camera.aspect=el.clientWidth/el.clientHeight;camera.zoom=Math.min(1,camera.aspect/1.15);camera.updateProjectionMatrix();r.setSize(el.clientWidth,el.clientHeight);render();};
      const ro=new ResizeObserver(resize);ro.observe(el);let raf=0,last=0,visible=true;const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;});io.observe(el);
      const tick=(t:number)=>{if(disposed)return;if(!document.hidden&&visible&&t-last>32){render();last=t;}raf=requestAnimationFrame(tick);};resize();raf=requestAnimationFrame(tick);setStatus('ready');
      cleanup=()=>{cancelAnimationFrame(raf);ro.disconnect();io.disconnect();controls.dispose();r.domElement.removeEventListener('pointerdown',onDown);r.domElement.removeEventListener('pointerup',onUp);r.domElement.removeEventListener('webglcontextlost',lost);clear(environment);clear(actors);clear(routes);r.dispose();r.domElement.remove();api.current=null;};
    }catch{renderer?.dispose();renderer?.domElement.remove();if(!disposed)setStatus('fallback');}})();return()=>{disposed=true;cleanup();};
  },[]);
  useEffect(()=>{api.current?.world();},[props.world,status]);
  useEffect(()=>{api.current?.agents();},[props.run,status]);
  useEffect(()=>{api.current?.view();},[props.view,props.viewNonce,status]);
  return <div className="gg-canvas-wrap"><div className="gg-canvas" ref={host}/>{status!=='ready'&&<div className="gg-canvas-message">{status==='loading'?'正在建立立體模擬…':'此裝置無法顯示 3D，仍可用操作卡配置、模擬及閱讀個體紀錄。'}</div>}<div className="gg-canvas-hint">拖曳旋轉 · 滾輪縮放 · 點角色追蹤{props.mode==='heat'?' · 點土地選格':''}</div></div>;
}
