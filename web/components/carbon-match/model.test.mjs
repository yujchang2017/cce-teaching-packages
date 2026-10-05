import test from 'node:test';
import assert from 'node:assert/strict';
import {makeRound,fresh,act,found,finished,judge,itemByKey,items,topics,isTarget,categoryNames} from './model.ts';
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
 for(const i of items)for(const topic of ['combustion','fugitive','electricity'])assert.equal(judge(topic,i,i).kind,i.category==='toy'?'toy':i.category==='exempt'?'exempt':i.category===topic?'correct':'category');
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
const allTopics=Object.keys(topics);
test('every topic has at least 3 target items; every item cites a reason and a spreadsheet source',()=>{
 for(const t of allTopics)assert.ok(items.filter(i=>isTarget(t,i)).length>=3,t);
 for(const i of items){assert.ok(i.reason.length>5,i.key);assert.ok(i.source.length>3,i.key);assert.ok(categoryNames[i.category],i.key);}
 assert.equal(new Set(items.map(i=>i.key)).size,items.length);
 for(const i of items.filter(i=>!['toy'].includes(i.category)&&!i.source.includes('教學干擾物')))assert.match(i.source,/^[23]-\d/,i.key);
});
test('no on-screen text uses the term 範疇三',()=>{
 for(const t of allTopics)assert.ok(!JSON.stringify(topics[t]).includes('範疇三'));
 for(const i of items)assert.ok(![i.name,i.activity,i.reason].join().includes('範疇三'),i.key);
});
test('random boards for every topic: all target pairs present and solvable, no impossible board',()=>{
 for(const topic of allTopics)for(let seed=0;seed<300;seed++)for(const tutorial of [false,true]){
  const r=makeRound(topic,seed,tutorial),counts={};assert.equal(r.pieces.length,tutorial?6:18);
  for(const p of r.pieces)counts[p.key]=(counts[p.key]||0)+1;
  assert.ok(Object.values(counts).every(v=>v%2===0));
  const targetPieces=r.pieces.filter(p=>isTarget(topic,itemByKey[p.key]));
  assert.equal(targetPieces.length/2,r.totalPairs);assert.equal(r.totalPairs,tutorial?2:4);
  assert.ok(r.pieces.some(p=>!isTarget(topic,itemByKey[p.key])),'needs distractors');
  let s=fresh(r);
  for(const key of new Set(targetPieces.map(p=>p.key))){const group=r.pieces.filter(p=>p.key===key);
   for(let j=0;j<group.length;j+=2){s=act(s,{type:'pick',id:group[j].id});s=act(s,{type:'pick',id:group[j+1].id});assert.equal(s.kind,'correct');s=act(s,{type:'unlock'});}}
  assert.ok(finished(s));
  for(const key of Object.keys(counts).filter(k=>!isTarget(topic,itemByKey[k])))assert.notEqual(judge(topic,itemByKey[key],itemByKey[key]).kind,'correct');
 }
});
test('scope1 mixed topic accepts fixed combustion, mobile combustion and fugitive; rejects electricity and indirect',()=>{
 for(const k of ['stove','official-car','mower','ac-leak'])assert.equal(judge('scope1',itemByKey[k],itemByKey[k]).kind,'correct',k);
 for(const k of ['ac-power','teacher-car','faucet','trash-bin','solar'])assert.equal(judge('scope1',itemByKey[k],itemByKey[k]).kind,'category',k);
 const seen=new Set();for(let seed=0;seed<200;seed++)for(const p of makeRound('scope1',seed).pieces){const c=itemByKey[p.key].category;if(isTarget('scope1',itemByKey[p.key]))seen.add(c);}
 assert.deepEqual([...seen].sort(),['combustion','fugitive','mobile']);
});
test('exempt commute (walk / bike) never clears in any topic, and commute boards always include one',()=>{
 for(const t of allTopics)for(const k of ['walk','bike']){const a=judge(t,itemByKey[k],itemByKey[k]);assert.equal(a.kind,'exempt');assert.match(a.text,/不必計入/);assert.doesNotMatch(a.text,/玩具/);}
 for(let seed=0;seed<200;seed++){const r=makeRound('commute',seed);assert.ok(r.pieces.some(p=>itemByKey[p.key].category==='exempt'));
  let s=fresh(r);const w=r.pieces.find(p=>itemByKey[p.key].category==='exempt'),w2=r.pieces.find(p=>p.id!==w.id&&p.key===w.key);
  s=act(s,{type:'pick',id:w.id});s=act(s,{type:'pick',id:w2.id});assert.equal(s.kind,'exempt');assert.equal(s.removed.length,0);}
 for(const t of allTopics.filter(t=>t!=='commute'))for(let seed=0;seed<100;seed++)assert.ok(makeRound(t,seed).pieces.every(p=>itemByKey[p.key].category!=='exempt'),t);
});
test('same shape, different activity never pairs: school car vs teacher car, dispenser water vs power',()=>{
 for(const [a,b] of [['official-car','teacher-car'],['official-scooter','commute-scooter'],['dispenser-water','dispenser-power']]){
  assert.equal(itemByKey[a].shape,itemByKey[b].shape);for(const t of allTopics)assert.equal(judge(t,itemByKey[a],itemByKey[b]).kind,'different');}
 assert.equal(judge('mobile',itemByKey['official-car'],itemByKey['official-car']).kind,'correct');
 assert.equal(judge('commute',itemByKey['official-car'],itemByKey['official-car']).kind,'category');
 assert.equal(judge('water',itemByKey['dispenser-power'],itemByKey['dispenser-power']).kind,'category');
 assert.equal(judge('electricity',itemByKey['dispenser-power'],itemByKey['dispenser-power']).kind,'correct');
});
test('reduction topic targets reducers, and its wording says they are not emission sources',()=>{
 assert.match(topics.reduction.task+topics.reduction.clue,/不是排放源|減少或吸收/);
 for(const i of items.filter(i=>i.category==='reduction'))assert.match(i.reason,/減碳|碳匯|吸收/);
 assert.equal(judge('reduction',itemByKey.generator,itemByKey.generator).kind,'category');
});
