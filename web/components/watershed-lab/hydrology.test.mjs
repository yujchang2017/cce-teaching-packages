import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate,elevation,meetsChallenge,placementIssue,restoreLab } from './hydrology.ts';
const good=[{id:'g',kind:'garden',x:1.6,z:0},{id:'t',kind:'tank',x:1.6,z:2.4}];
test('every water parcel is accounted for, including after storage saturates',()=>{
  for(const n of [72,144])for(const f of [[],good]){const r=simulate(f,n);assert.equal(Object.values(r.totals).reduce((a,b)=>a+b),n);assert.equal(r.parcels.length,n);assert.ok((r.captured.g??0)<=16);assert.ok((r.captured.t??0)<=14);}
});
test('surface paths and facility entries never flow uphill',()=>{
  for(const p of simulate(good).parcels)for(let i=1;i<p.path.length;i++)assert.ok(p.path[i].y<=p.path[i-1].y+.001);
});
test('the same structures across the watershed divide cannot protect the school',()=>{
  const right=simulate(good),left=simulate(good.map(f=>({...f,x:-f.x})));
  assert.ok(meetsChallenge(right));assert.equal(left.totals.school,36);assert.ok(!meetsChallenge(left));assert.equal(right.totals.stream,36);
});
test('a high ridge placement intercepts no low valley flow',()=>{
  const r=simulate([{id:'ridge',kind:'tank',x:0,z:0}]);assert.equal(r.totals.tank,0);assert.ok(elevation(0,0)>elevation(1.6,0));
});
test('a saturated facility passes excess parcels downstream',()=>{
  const r=simulate([{id:'g',kind:'garden',x:1.6,z:0}]);assert.equal(r.captured.g,16);assert.equal(r.totals.school,20);
});
test('repeated rainfall is deterministic for a controlled comparison',()=>{assert.deepEqual(simulate(good),simulate(good));});
test('construction respects footprint, budget, maximum count and bounds',()=>{
  assert.ok(placementIssue(good,{id:'x',kind:'garden',x:-2,z:2}));
  assert.ok(placementIssue([good[1]],{id:'x',kind:'tank',x:-2,z:2}));
  assert.ok(placementIssue([good[0]],{id:'x',kind:'tank',x:1.7,z:.1}));
  assert.ok(placementIssue([],{id:'x',kind:'garden',x:NaN,z:2}));
  assert.equal(placementIssue(good,{...good[0],x:2.4,z:-2.4},'g'),null);
});
test('restored experiments validate facilities and never trust stored outcome numbers',()=>{
  assert.deepEqual(restoreLab('{').history,[]);
  const p=restoreLab(JSON.stringify({version:2,facilities:[...good,{id:'bad',kind:'tank',x:90,z:90}],history:[{facilities:good,prediction:'more groundwater',totals:{school:0}}],reflection:'觀察與推論'}));
  assert.equal(p.facilities.length,2);assert.equal(p.history[0].totals,undefined);assert.equal(p.reflection,'觀察與推論');
});
