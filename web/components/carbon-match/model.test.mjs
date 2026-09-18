import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRound,fresh,act,found,finished,judge,itemByKey,items} from './model.ts';
test('random rounds have complete targets and paired distractors, all targets remain solvable',()=>{
 for(const topic of ['combustion','fugitive','electricity'])for(let seed=0;seed<80;seed++)for(const tutorial of [false,true]){
  const r=makeRound(topic,seed,tutorial),counts={};assert.equal(r.pieces.length,tutorial?6:18);assert.deepEqual(r,makeRound(topic,seed,tutorial));
  for(const p of r.pieces)counts[p.key]=(counts[p.key]||0)+1;
  assert.ok(Object.values(counts).every(v=>v%2===0));let s=fresh(r);
  for(const key of Object.keys(counts).filter(k=>itemByKey[k].category===topic)){
   const group=r.pieces.filter(p=>p.key===key);
   for(let j=0;j<group.length;j+=2){s=act(s,{type:'pick',id:group[j].id});s=act(s,{type:'park'});s=act(s,{type:'pick',id:group[j].id});s=act(s,{type:'pick',id:group[j+1].id});s=act(s,{type:'unlock'});}
  }
  assert.ok(finished(s));assert.equal(found(s),r.totalPairs);assert.ok(r.pieces.length>s.removed.length);
 }
});
test('all toys and wrong categories stay, same appliance with different activity is not a pair',()=>{
 for(const i of items)for(const topic of ['combustion','fugitive','electricity'])assert.equal(judge(topic,i,i).kind,i.category==='toy'?'toy':i.category===topic?'correct':'category');
 assert.equal(judge('electricity',itemByKey['ac-leak'],itemByKey['ac-power']).kind,'different');
});
test('repeat clicks, animation clicks, removed objects cannot create duplicate credit',()=>{
 let s=fresh(makeRound('combustion',11));const p=s.round.pieces.find(p=>itemByKey[p.key].category==='combustion');const q=s.round.pieces.find(q=>q.id!==p.id&&q.key===p.key);
 s=act(s,{type:'pick',id:p.id});s=act(s,{type:'pick',id:p.id});assert.equal(s.history.length,0);
 s=act(s,{type:'pick',id:p.id});s=act(s,{type:'pick',id:q.id});assert.equal(found(s),1);assert.equal(act(s,{type:'pick',id:q.id}),s);
 s=act(s,{type:'unlock'});assert.equal(act(s,{type:'pick',id:p.id}),s);assert.equal(s.history.length,1);
});
test('wrong matches do not remove pieces; parking and cancel do not count as attempts',()=>{
 let s=fresh(makeRound('fugitive',1));const toy=s.round.pieces.find(p=>itemByKey[p.key].category==='toy');const pair=s.round.pieces.find(p=>p.id!==toy.id&&p.key===toy.key);
 s=act(s,{type:'pick',id:toy.id});s=act(s,{type:'park'});s=act(s,{type:'return',id:toy.id});assert.equal(s.history.length,0);assert.equal(s.parked.length,0);
 s=act(s,{type:'pick',id:toy.id});s=act(s,{type:'pick',id:pair.id});assert.equal(s.history[0].kind,'toy');assert.equal(found(s),0);assert.equal(s.removed.length,0);
});
