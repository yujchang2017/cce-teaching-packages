import test from 'node:test';
import assert from 'node:assert/strict';
import {parts,ids,upgrades,fresh,validDesign,issue,release,remove,identify,sort,standardRun,results,comparison,restore,guidedRemove,nextAccessible} from './model.ts';
const safe=()=>({...fresh(),safe:true});
test('guided removal preserves blocking and completes every valid design without repeated charges',()=>{
 assert.ok(guidedRemove([],safe(),'battery').error);
 for(let mask=0;mask<32;mask++){const d=upgrades.filter((_,i)=>mask&(1<<i)).map(u=>u.id);if(!validDesign(d))continue;let s=safe();for(let i=0;i<8;i++){const id=nextAccessible(d,s);assert.ok(id);const next=guidedRemove(d,s,id);assert.equal(next.error,undefined);s=next.state;assert.equal(guidedRemove(d,s,id).state,s);}assert.equal(s.removed.length,8);assert.equal(nextAccessible(d,s),undefined);}
});
function take(d,s,id){const p=parts(d).find(p=>p.id===id);const a=release(d,s,id,p.tool,p.direction);assert.equal(a.error,undefined);const b=remove(d,a.state,id,p.direction);assert.equal(b.error,undefined);return b.state;}
test('all valid designs can be disassembled with identical policy and conserve material mass',()=>{
 let count=0;
 for(let mask=0;mask<32;mask++){const d=upgrades.filter((_,i)=>mask&(1<<i)).map(u=>u.id);if(!validDesign(d))continue;const s=standardRun(d),r=results(d,s);assert.equal(r.qualified,true);assert.equal(new Set(s.removed).size,8);assert.equal(r.total,760);assert.equal(r.pure+r.mixed+r.professional+r.unresolved,r.total);assert.equal(r.professional,190);assert.deepEqual(standardRun(d),s);count++;}
 assert.ok(count>=10);
});
test('battery cannot teleport through cover or crossbar, service opening changes real path',()=>{
 let original=safe();assert.ok(issue([],original,'battery','up'));
 original=take([],original,'hatch');assert.ok(issue([],original,'battery','front'));
 original=take([],original,'cap');assert.match(issue([],original,'battery','up'),/橫架/);
 original=take([],original,'brace');assert.equal(issue([],original,'battery','up'),null);
 let revised=safe();assert.match(issue(['battery'],revised,'battery','front'),/維修蓋/);
 revised=take(['battery'],revised,'hatch');assert.equal(issue(['battery'],revised,'battery','front'),null);assert.ok(!revised.removed.includes('cap'));assert.ok(!revised.removed.includes('brace'));
});
test('wrong tool, unapproved safety or missing release cannot advance',()=>{
 const s=fresh();assert.equal(release([],s,'cap','PH1','up').state,s);
 const a=safe();assert.equal(release([],a,'cap','T10','up').state,a);assert.equal(remove([],a,'cap','up').state,a);assert.equal(remove([],a,'cap','back').state,a);
});
test('materials must be identified; battery and electronics never enter ordinary bins',()=>{
 const done=standardRun([]);for(const [id,bin] of [['battery','PC'],['board','metal']]){const attempt=sort([],done,id,bin);assert.ok(attempt.error);assert.equal(attempt.state,done);}
 const s=take([],safe(),'cap');assert.ok(sort([],s,'cap','PC').error);const known=identify([],s,'cap');const wrong=sort([],known,'cap','ABS').state;assert.equal(results([],wrong).pure,0);const corrected=sort([],wrong,'cap','PC').state;assert.equal(results([],corrected).pure,120);assert.ok(corrected.events.some(e=>e.kind==='rework'));
});
test('more than one design improves costs; hybrid material separation differs from mono-material',()=>{
 for(const d of [['screws','battery'],['plastic','labels'],['screws','labels','separate']]){const c=comparison(d);assert.ok(c.after.cost<c.before.cost);assert.ok(c.batchSavings>0);}
 assert.equal(parts(['plastic']).find(p=>p.id==='trim').bin,'PC');assert.equal(parts(['separate']).find(p=>p.id==='trim').bin,'PP');assert.equal(parts([]).find(p=>p.id==='trim').bin,'mixed');
 assert.equal(comparison(['plastic']).after.mixed,0);assert.equal(comparison([]).after.mixed,40);
 assert.ok(comparison(['plastic']).after.stations<comparison(['separate']).after.stations);
});
test('budget, incompatible options and corrupted storage are rejected',()=>{
 for(const d of [['plastic','battery'],['plastic','separate'],['labels','labels'],['bogus']])assert.equal(validDesign(d),false);
 assert.deepEqual(restore('{'),{design:[],reflection:''});assert.deepEqual(restore('{"design":["battery","plastic"],"reflection":3}'),{design:[],reflection:''});
});
