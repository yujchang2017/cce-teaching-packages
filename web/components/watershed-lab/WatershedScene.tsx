'use client';
import { useEffect,useRef,useState } from 'react';
import type * as Three from 'three';
import { elevation,EXTENT,facilityInfo,type Facility,type Run } from './hydrology';

export type Tool='inspect'|'garden'|'tank'|'move';
export type View='orbit'|'top'|'section';
interface Props {facilities:Facility[];run:Run|null;time:number;paths:boolean;section:boolean;tool:Tool;selected:string|null;view:View;viewNonce:number;locked:boolean;reduced:boolean;onPlace:(x:number,z:number)=>void;onSelect:(id:string)=>void;}
type API={facilities:(items:Facility[])=>void;run:(r:Run|null)=>void;view:(v:View)=>void;};

export default function WatershedScene(props:Props){
  const host=useRef<HTMLDivElement>(null),latest=useRef(props),api=useRef<API|null>(null);
  latest.current=props;
  const labels=useRef<Record<string,HTMLDivElement|null>>({});
  const [status,setStatus]=useState<'loading'|'ready'|'fallback'>('loading');
  useEffect(()=>{
    const el=host.current;if(!el)return;let disposed=false;let cleanup=()=>{};
    (async()=>{
      let renderer:Three.WebGLRenderer|undefined;
      try{
        const T=await import('three');const {OrbitControls}=await import('three/addons/controls/OrbitControls.js');
        if(disposed)return;
        const scene=new T.Scene();renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});const r=renderer;
        r.setPixelRatio(Math.min(devicePixelRatio||1,1.5));r.shadowMap.enabled=true;r.shadowMap.type=T.PCFShadowMap;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.25;
        r.domElement.setAttribute('aria-label','可旋轉的雙流域地形；也可使用下方位置按鈕布設。');el.appendChild(r.domElement);
        const camera=new T.PerspectiveCamera(39,1,.1,100);camera.position.set(12,12,15);
        const controls=new OrbitControls(camera,r.domElement);controls.target.set(0,1,0);controls.enableDamping=true;controls.dampingFactor=.09;controls.enablePan=false;controls.minDistance=12;controls.maxDistance=28;controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.03;
        const amb=new T.HemisphereLight(0xe5f7ff,0x847659,2.8);scene.add(amb);
        const sun=new T.DirectionalLight(0xfff0ce,3);sun.position.set(-5,12,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8});sun.shadow.normalBias=.06;scene.add(sun);
        const terrain=new T.Group(),soil=new T.Group(),facilities=new T.Group(),flows=new T.Group(),weather=new T.Group();scene.add(terrain,soil,facilities,flows,weather);
        const material=(color:number,extra:Three.MeshStandardMaterialParameters={})=>new T.MeshStandardMaterial({color,roughness:.85,...extra});
        const add=(g:Three.BufferGeometry,m:Three.Material,parent:Three.Object3D,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
        const box=(w:number,h:number,d:number,color:number,parent:Three.Object3D,x:number,y:number,z:number)=>add(new T.BoxGeometry(w,h,d),material(color),parent,x,y,z);
        function clear(group:Three.Group){group.traverse(o=>{const m=o as Three.Mesh;m.geometry?.dispose();if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(v=>v.dispose());});group.clear();}
        // A real height field: the rendered surface and flow solver share elevation().
        const vertices:number[]=[],colors:number[]=[],indices:number[]=[];
        for(let iz=0;iz<=48;iz++)for(let ix=0;ix<=48;ix++){
          const x=-EXTENT+ix*.2,z=-EXTENT+iz*.2,y=elevation(x,z);vertices.push(x,y,z);
          const color=new T.Color(0xb1be87).lerp(new T.Color(0xe0d6aa),Math.min(1,(y-.6)/4));
          colors.push(color.r,color.g,color.b);
        }
        for(let z=0;z<48;z++)for(let x=0;x<48;x++){const a=z*49+x;indices.push(a,a+49,a+1,a+1,a+49,a+50);}
        const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
        const topMat=material(0xffffff,{vertexColors:true,side:T.DoubleSide});const top=add(geo,topMat,terrain);
        const grid=new T.LineSegments(new T.WireframeGeometry(geo),new T.LineBasicMaterial({color:0x617665,transparent:true,opacity:.045}));terrain.add(grid);
        const wallMaterials:Three.MeshStandardMaterial[]=[];
        for(let edge=0;edge<4;edge++){
          const p:number[]=[],idx:number[]=[];
          for(let i=0;i<=48;i++){
            const t=-EXTENT+i*.2,x=edge===0||edge===2?t:edge===1?EXTENT:-EXTENT,z=edge===1||edge===3?t:edge===0?-EXTENT:EXTENT;
            p.push(x,elevation(x,z),z,x,-1.5,z);
            if(i<48){const a=i*2;idx.push(a,a+1,a+2,a+2,a+1,a+3);}
          }
          const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();const m=material(0xac9470,{side:T.DoubleSide});wallMaterials.push(m);add(g,m,soil);
        }
        box(9.65,.28,9.65,0x547f84,soil,0,-1.62,0);
        const groundWater=add(new T.PlaneGeometry(9.45,9.45),material(0x57bcc0,{transparent:true,opacity:.6,side:T.DoubleSide}),soil,0,-1.1,0);groundWater.rotation.x=-Math.PI/2;
        const strata=new T.Group();soil.add(strata);
        for(let i=0;i<2;i++){const slab=box(9.5,.12,9.5,i?0xc1b18b:0xcbbd98,strata,0,-.4-i*.45,0);(slab.material as Three.MeshStandardMaterial).transparent=true;(slab.material as Three.MeshStandardMaterial).opacity=.28;}
        // Crest markers show the divide without telling the player where to build.
        const crest=[];for(let z=-4.6;z<=4.6;z+=.2){const x=.28*Math.sin(z*.65);crest.push(new T.Vector3(x,elevation(x,z)+.025,z));}
        const ridgeLine=new T.Line(new T.BufferGeometry().setFromPoints(crest),new T.LineDashedMaterial({color:0x9b7346,dashSize:.13,gapSize:.13}));ridgeLine.computeLineDistances();terrain.add(ridgeLine);
        function tree(x:number,z:number){const y=elevation(x,z);box(.07,.35,.07,0x8b7654,terrain,x,y+.17,z);add(new T.ConeGeometry(.22,.58,7),material(0x6c9165),terrain,x,y+.56,z);}
        [[-4,1.6],[-3.8,.4],[-3.5,2.8],[-4,-2],[3.9,-1],[3.7,.5]].forEach(([x,z])=>tree(x,z));
        // Both outlets lie below the terrain, making direction observable from side view.
        const school=new T.Group();scene.add(school);const sy=elevation(2.1,4.7);school.position.set(2.1,sy,5.15);
        box(1.45,.52,.62,0xf3e4bc,school,0,.26,0);const roof=add(new T.ConeGeometry(.99,.3,4),material(0xc68458),school,0,.66,0);roof.scale.z=.55;roof.rotation.y=Math.PI/4;
        for(let x=-.45;x<=.5;x+=.3)box(.15,.17,.025,0x6e9997,school,x,.3,.325);
        box(2.7,.13,1.5,0xe1d8bf,school,0,-.09,0);
        const stream=add(new T.PlaneGeometry(2.8,1.5),material(0x73bbc7,{side:T.DoubleSide}),scene,-2.1,.4,5.25);stream.rotation.x=-Math.PI/2;
        const flood=add(new T.PlaneGeometry(2.5,1.3),material(0x6aaac4,{transparent:true,opacity:.6,side:T.DoubleSide}),scene,2.1,sy+.035,5.15);flood.rotation.x=-Math.PI/2;flood.visible=false;
        for(const x of [-2.8,-2,-1.2])for(const z of [4.7,5.1]){const reed=box(.03,.34,.03,0x6b9470,scene,x,.57,z);reed.rotation.z=.2;}
        for(const x of [-2.8,2.8]){const cloud=new T.Group();cloud.position.set(x,6.5,-2.8);weather.add(cloud);for(let i=0;i<3;i++)add(new T.SphereGeometry(i===1?.58:.4,12,10),material(0xf5ffff,{transparent:true,opacity:.65}),cloud,(i-1)*.55,i===1?.15:0,0);}
        const constructionRing=add(new T.RingGeometry(.75,.8,40),new T.MeshBasicMaterial({color:0xf7a152,side:T.DoubleSide,transparent:true,opacity:.9}),scene);constructionRing.rotation.x=-Math.PI/2;constructionRing.visible=false;
        const ghost=add(new T.CylinderGeometry(.72,.72,.04,32),material(0xffd48f,{transparent:true,opacity:.45}),scene);ghost.visible=false;
        const markers:Record<string,Three.Vector3>={ridge:new T.Vector3(0,elevation(0,-3.8)+.3,-3.8),school:new T.Vector3(2.1,sy+.95,5.15),stream:new T.Vector3(-2.1,.95,5.1),ground:new T.Vector3(0,-.4,4.85)};
        let clickable:Three.Object3D[]=[],droplets:Three.Mesh[]=[],routeLines:Three.Line[]=[];
        let storedMeshes:Record<string,Three.Mesh>={};
        function updateFacilities(items:Facility[]){
          clear(facilities);clickable=[];storedMeshes={};
          for(const [i,f] of items.entries()){
            const y=elevation(f.x,f.z),info=facilityInfo[f.kind],g=new T.Group();g.position.set(f.x,y+.03,f.z);facilities.add(g);
            const pad=add(new T.CylinderGeometry(info.radius,info.radius,.1,32),material(f.kind==='garden'?0x527c4e:0xbaa271),g);pad.userData.facility=f.id;clickable.push(pad);
            if(f.kind==='garden'){
              const inner=add(new T.CylinderGeometry(.7,.7,.08,32),material(0x759c65),g,0,.08,0);inner.userData.facility=f.id;clickable.push(inner);
              for(let j=0;j<5;j++){const ang=j*1.3;add(new T.ConeGeometry(.11,.25,6),material(0xb7c978),g,Math.cos(ang)*.42,.23,Math.sin(ang)*.42);}
              const shaft=add(new T.CylinderGeometry(.38,.38,y+1.04,24),material(0x5cbeb9,{transparent:true,opacity:.25}),g,0,-(y+1.04)/2,0);shaft.name='shaft';
            }else{
              const rim=add(new T.TorusGeometry(.54,.1,8,32),material(0xe5c681),g,0,.05,0);rim.rotation.x=Math.PI/2;rim.userData.facility=f.id;clickable.push(rim);
              const water=add(new T.CylinderGeometry(.46,.46,.07,32),material(0x56aebf,{transparent:true,opacity:.8}),g,0,.035,0);storedMeshes[f.id]=water;
              const label=box(.08,.75,.08,0x896d48,g,.55,.38,.25);label.userData.facility=f.id;clickable.push(label);
              box(.38,.22,.08,0xf4d489,g,.55,.8,.25);
            }
          }
        }
        const colorBy={school:0xe78756,stream:0x5eb4d3,ground:0x3ea6a0,tank:0x5085ce,pooled:0xa5b5b9};
        function updateRun(run:Run|null){
          clear(flows);droplets=[];routeLines=[];if(!run)return;
          run.parcels.forEach(p=>{
            const points=p.path.map(v=>new T.Vector3(v.x,v.y+.07,v.z));
            const line=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:colorBy[p.destination],transparent:true,opacity:.58}));flows.add(line);routeLines.push(line);
            droplets.push(add(new T.SphereGeometry(.07,7,6),new T.MeshBasicMaterial({color:0x2086bf}),flows,points[0].x,points[0].y+3,points[0].z));
          });
        }
        function setView(view:View){
          camera.position.set(...(view==='top'?[.01,23,.01]:view==='section'?[10,4,15]:[12,12,15]) as [number,number,number]);
          controls.target.set(0,view==='section'?.4:1,0);controls.update();
        }
        api.current={facilities:updateFacilities,run:updateRun,view:setView};
        updateFacilities(latest.current.facilities);updateRun(latest.current.run);setView(latest.current.view);
        const ray=new T.Raycaster(),pointer=new T.Vector2();let down={x:0,y:0};
        const intersections=(e:PointerEvent)=>{const rect=r.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObject(top)[0];};
        const pointerDown=(e:PointerEvent)=>{down={x:e.clientX,y:e.clientY};};
        const pointerMove=(e:PointerEvent)=>{const hit=intersections(e);const p=latest.current;ghost.visible=!!hit&&!p.locked&&p.tool!=='inspect';if(hit){ghost.position.set(hit.point.x,hit.point.y+.035,hit.point.z);}};
        const pointerUp=(e:PointerEvent)=>{
          if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6||latest.current.locked)return;
          const hit=intersections(e);const found=ray.intersectObjects(clickable)[0];
          if(found&&latest.current.tool==='inspect'){latest.current.onSelect(found.object.userData.facility);return;}
          if(hit&&latest.current.tool!=='inspect')latest.current.onPlace(hit.point.x,hit.point.z);
        };
        const leave=()=>{ghost.visible=false;};const lost=(e:Event)=>{e.preventDefault();setStatus('fallback');};
        r.domElement.addEventListener('pointerdown',pointerDown);r.domElement.addEventListener('pointermove',pointerMove);r.domElement.addEventListener('pointerup',pointerUp);r.domElement.addEventListener('pointerleave',leave);r.domElement.addEventListener('webglcontextlost',lost);
        let raf=0,visible=true,last=0;
        function render(time:number){
          const p=latest.current;controls.enableDamping=!p.reduced;controls.update();
          topMat.transparent=p.section;topMat.opacity=p.section?.22:1;topMat.depthWrite=!p.section;
          wallMaterials.forEach(m=>{m.transparent=p.section;m.opacity=p.section?.14:1;m.depthWrite=!p.section;});strata.visible=p.section;groundWater.visible=p.section;
          facilities.traverse(o=>{if(o.name==='shaft')o.visible=p.section;});
          const selected=p.facilities.find(f=>f.id===p.selected);constructionRing.visible=!!selected;if(selected)constructionRing.position.set(selected.x,elevation(selected.x,selected.z)+.15,selected.z);
          routeLines.forEach(line=>{line.visible=p.paths||p.time<100;});
          const received:Record<string,number>={};let schoolCount=0;
          p.run?.parcels.forEach((parcel,i)=>{
            const d=droplets[i];if(!d)return;
            const phase=Math.max(0,Math.min(1,(p.time/100-(i/72)*.34)/.66));
            const points=parcel.path,first=points[0];
            if(phase<.17){d.position.set(first.x,first.y+.1+3*(1-phase/.17),first.z);}
            else {const t=(phase-.17)/.83*(points.length-1),idx=Math.min(points.length-2,Math.floor(t)),a=points[Math.max(0,idx)],b=points[Math.min(points.length-1,idx+1)],mix=t-idx;d.position.set(a.x+(b.x-a.x)*mix,a.y+(b.y-a.y)*mix+.08,a.z+(b.z-a.z)*mix);}
            const arrived=phase>=.999;
            (d.material as Three.MeshBasicMaterial).color.set(arrived?colorBy[parcel.destination]:0x258bbb);
            d.visible=p.time>0&&(!arrived||parcel.destination==='ground'&&p.section);
            if(arrived&&parcel.facilityId)received[parcel.facilityId]=(received[parcel.facilityId]??0)+1;
            if(arrived&&parcel.destination==='school')schoolCount++;
          });
          for(const [id,water]of Object.entries(storedMeshes)){const fraction=(received[id]??0)/14;water.scale.set(Math.max(.04,fraction),1,Math.max(.04,fraction));}
          flood.visible=schoolCount>0;flood.scale.setScalar(Math.max(.02,schoolCount/36));
          weather.visible=p.time>0&&p.time<65;
          r.domElement.style.cursor=p.tool==='inspect'?'grab':'crosshair';
          r.render(scene,camera);
          for(const [id,point]of Object.entries(markers)){
            const label=labels.current[id];if(!label)continue;const q=point.clone().project(camera);label.style.left=`${(q.x+1)*el!.clientWidth/2}px`;label.style.top=`${(-q.y+1)*el!.clientHeight/2}px`;label.style.display=id==='ground'&&!p.section?'none':'';
          }
        }
        const resize=()=>{if(!el.clientWidth||!el.clientHeight)return;camera.aspect=el.clientWidth/el.clientHeight;camera.zoom=Math.min(1,camera.aspect/1.1);camera.updateProjectionMatrix();r.setSize(el.clientWidth,el.clientHeight);render(0);};
        const ro=new ResizeObserver(resize);ro.observe(el);const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;});io.observe(el);
        function tick(t:number){if(disposed)return;if(visible&&!document.hidden&&t-last>32){render(t);last=t;}raf=requestAnimationFrame(tick);}
        cleanup=()=>{cancelAnimationFrame(raf);ro.disconnect();io.disconnect();controls.dispose();api.current=null;r.domElement.removeEventListener('pointerdown',pointerDown);r.domElement.removeEventListener('pointermove',pointerMove);r.domElement.removeEventListener('pointerup',pointerUp);r.domElement.removeEventListener('pointerleave',leave);r.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(o=>{const m=o as Three.Mesh;m.geometry?.dispose();if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(v=>v.dispose());});r.dispose();r.domElement.remove();};
        resize();raf=requestAnimationFrame(tick);setStatus('ready');
      }catch{renderer?.dispose();renderer?.domElement.remove();if(!disposed)setStatus('fallback');}
    })();return()=>{disposed=true;cleanup();};
  },[]);
  useEffect(()=>{api.current?.facilities(props.facilities);},[props.facilities,status]);
  useEffect(()=>{api.current?.run(props.run);},[props.run,status]);
  useEffect(()=>{api.current?.view(props.view);},[props.view,props.viewNonce,status]);
  return <div className="wl-scene">
    <div className="wl-canvas" ref={host}/>
    {status==='loading'&&<div className="wl-canvas-message" role="status">正在建立可以實驗的地形…</div>}
    {status==='fallback'&&<div className="wl-canvas-message"><b>此裝置暫時無法顯示 3D</b><p>仍可用「位置布設」與水量紀錄進行實驗。地形中央最高，東西兩側各向下游傾斜。</p></div>}
    {status==='ready'&&<><div className="wl-scene-label ridge" ref={el=>{labels.current.ridge=el;}}>分水嶺 <small>雨水往兩側流</small></div><div className="wl-scene-label school" ref={el=>{labels.current.school=el;}}>東側學校</div><div className="wl-scene-label stream" ref={el=>{labels.current.stream=el;}}>西側溪流</div><div className="wl-scene-label ground" ref={el=>{labels.current.ground=el;}}>土層與地下水 <small>剖面示意</small></div></>}
    <div className="wl-compass" aria-hidden="true">上游：降雨起點</div><div className="wl-scene-tip">{props.locked?'實驗中：可以旋轉、暫停或切換剖面。':props.tool==='inspect'?'拖曳旋轉 · 滾輪縮放':props.tool==='move'?'點選地形，移動選中的設施。':`點選地形，放置${facilityInfo[props.tool].title}。`}</div>
  </div>;
}
