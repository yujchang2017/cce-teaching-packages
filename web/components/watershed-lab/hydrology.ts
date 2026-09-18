/** Deliberately small, deterministic teaching model, not a flood forecast.
 * Each parcel is one equal unit of water. Surface flow follows the steepest
 * downhill neighbouring terrain vertex. A facility intercepts only parcels
 * crossing its footprint; finite capacity passes excess water downstream.
 */
export type FacilityKind = 'garden' | 'tank';
export interface Facility { id: string; kind: FacilityKind; x: number; z: number; }
export interface Point { x: number; y: number; z: number; }
export type Destination = 'school' | 'stream' | 'ground' | 'tank' | 'pooled';
export interface Parcel { id: number; path: Point[]; destination: Destination; facilityId?: string; }
export interface Run { parcels: Parcel[]; totals: Record<Destination, number>; captured: Record<string, number>; }
export const EXTENT = 4.8;
export const CELL = .4;
export const RAIN_COUNT = 72;
export const BUDGET = 5;
export const MAX_FACILITIES = 2;
export const facilityInfo = {
  garden: { title: '雨水花園', cost: 2, capacity: 16, radius: .86, detail: '讓流經的水進入土層。容量滿後，剩下的水繼續往低處流。' },
  tank: { title: '地表集水槽', cost: 3, capacity: 14, radius: .72, detail: '收住流經的地表水，留待非飲用用途。沒有接到水流，就收不到水。' },
} as const;
export function elevation(x: number, z: number) {
  const ridge = .28 * Math.sin(z * .65);
  return .65 + .2 * (EXTENT - z) + 1.75 * Math.exp(-((x-ridge)**2)/.5) + .043*x*x;
}
export function snap(n:number) { return Math.round(n/CELL)*CELL; }
export function placementIssue(facilities: Facility[], next: Facility, replacing?: string): string | null {
  const rest=facilities.filter(f=>f.id!==replacing);
  if(!Number.isFinite(next.x)||!Number.isFinite(next.z)||Math.abs(next.x)>4||Math.abs(next.z)>3.6) return '請放在地形內部，避開出口和邊界。';
  if(!['garden','tank'].includes(next.kind))return '請先選擇設施。';
  if(rest.length>=MAX_FACILITIES)return '最多放置兩座設施；可移動或移除現有設施。';
  if(rest.reduce((n,f)=>n+facilityInfo[f.kind].cost,0)+facilityInfo[next.kind].cost>BUDGET)return '材料不夠了。試試不同的設施組合。';
  if(rest.some(f=>Math.hypot(f.x-next.x,f.z-next.z)<1.2))return '兩座設施太近，請留出空間。';
  return null;
}
function downhill(point:Point):Point|null {
  let best:Point|null=null, steepest=0;
  for(const dx of [-CELL,0,CELL])for(const dz of [-CELL,0,CELL]) {
    if(dx===0&&dz===0)continue;
    const x=snap(point.x+dx),z=snap(point.z+dz);
    if(Math.abs(x)>EXTENT+.001||Math.abs(z)>EXTENT+.001)continue;
    const y=elevation(x,z),slope=(point.y-y)/Math.hypot(dx,dz);
    if(slope>steepest+.000001){steepest=slope;best={x,y,z};}
  }
  return best;
}
export function simulate(facilities:Facility[], count=RAIN_COUNT):Run {
  const totals:Run['totals']={school:0,stream:0,ground:0,tank:0,pooled:0};
  const captured:Record<string,number>=Object.fromEntries(facilities.map(f=>[f.id,0]));
  const parcels:Parcel[]=[];
  for(let id=0;id<count;id++) {
    // Equal rainfall on both sides; interleaved rows are identical on each run.
    const x=snap(((id%12)-5.5)*.56),z=snap(-3.6+Math.floor((id%72)/12)*.4);
    let point={x,y:elevation(x,z),z};
    const path=[point];let destination:Destination='pooled',facilityId:string|undefined;
    for(let step=0;step<140;step++) {
      const target=facilities.find(f=>Math.hypot(f.x-point.x,f.z-point.z)<=facilityInfo[f.kind].radius&&elevation(f.x,f.z)<=point.y+.001&&captured[f.id]<facilityInfo[f.kind].capacity);
      if(target){
        captured[target.id]++;facilityId=target.id;destination=target.kind==='garden'?'ground':'tank';
        // The final vertical segment makes infiltration vs storage inspectable.
        path.push({x:target.x,y:elevation(target.x,target.z),z:target.z});
        path.push({x:target.x,y:target.kind==='garden'?-1.05:elevation(target.x,target.z)-.18,z:target.z});
        break;
      }
      if(point.z>=EXTENT-.01){destination=point.x>0?'school':'stream';break;}
      const next=downhill(point);if(!next)break;path.push(next);point=next;
    }
    totals[destination]++;parcels.push({id,path,destination,facilityId});
  }
  return {parcels,totals,captured};
}
export function signature(facilities:Facility[]) {return facilities.map(f=>`${f.id}:${f.kind}:${f.x.toFixed(2)}:${f.z.toFixed(2)}`).sort().join('|');}
export function meetsChallenge(run:Run) {return run.totals.school<=12&&run.totals.ground>=12&&run.totals.stream>=24;}
export const sites=[
  {label:'西側上坡',x:-2.4,z:-2.4},{label:'分水嶺上段',x:0,z:-2.4},{label:'東側上坡',x:2.4,z:-2.4},
  {label:'西側中坡',x:-1.6,z:0},{label:'分水嶺中段',x:0,z:0},{label:'東側中坡',x:1.6,z:0},
  {label:'西側下坡',x:-1.6,z:2.4},{label:'分水嶺下段',x:0,z:2.4},{label:'東側下坡',x:1.6,z:2.4},
] as const;
export interface Experiment { facilities:Facility[]; prediction:string; }
export function restoreLab(raw:string|null):{facilities:Facility[];history:Experiment[];reflection:string} {
  const empty={facilities:[] as Facility[],history:[] as Experiment[],reflection:''};
  if(!raw)return empty;
  try{
    const v=JSON.parse(raw);if(v?.version!==2)return empty;
    function validList(value:unknown):Facility[]{
      if(!Array.isArray(value))return[];const result:Facility[]=[];
      for(const f of value.slice(0,2)){
        if(!f||!['garden','tank'].includes(f.kind)||typeof f.id!=='string'||f.id.length>60||result.some(r=>r.id===f.id))continue;
        const next={id:f.id,kind:f.kind as FacilityKind,x:f.x,z:f.z};if(!placementIssue(result,next))result.push(next);
      }
      return result;
    }
    const history:Experiment[]=Array.isArray(v.history)?v.history.slice(-6).filter((e:unknown)=>e&&typeof e==='object').map((e:Experiment)=>({facilities:validList(e.facilities),prediction:typeof e.prediction==='string'?e.prediction.slice(0,300):''})):[];
    return{facilities:validList(v.facilities),history,reflection:typeof v.reflection==='string'?v.reflection.slice(0,1500):''};
  }catch{return empty;}
}
