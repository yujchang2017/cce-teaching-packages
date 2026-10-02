import test from 'node:test';
import assert from 'node:assert/strict';
import {foods,foodById,levelFoodCounts,values,fraction,balance,makeRound,evaluate,cutFromPoints,diskPolygon,lineEndpoints,RADIUS} from './model.ts';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('CSV units convert grams, kJ and kgCO2e consistently',()=>{const beef=values(foods.find(f=>f.id==='beef'),100);close(beef.carbon,6104);close(beef.energy,1332/4.184);close(beef.protein,16.4);});
test('circular cut splits ingredients continuously, conserves all quantities',()=>{close(fraction(0,.3),.5);close(fraction(.1,.3)+fraction(-.1,.3),1);assert.equal(fraction(1,.3),1);assert.equal(fraction(-1,.3),0);
 for(let seed=0;seed<50;seed++){const r=makeRound(seed,seed%3),base=evaluate(r,{angle:0,offset:0});for(const angle of [0,30,89,140,179])for(const offset of [-1.6,0,.5,1.6]){const v=evaluate(r,{angle,offset});for(const k of Object.keys(v.a))close(v.a[k]+v.b[k],base.a[k]+base.b[k]);assert.ok(v.score>=0&&v.score<=100);}}
});
test('all levels have a reachable balanced solution and non-overlapping complete toppings',()=>{for(let seed=0;seed<150;seed++)for(let level=0;level<3;level++){const r=makeRound(seed,level);assert.equal(r.toppings.length,[8,12,20][level]);assert.ok(evaluate(r,{angle:r.solution,offset:0}).passed);close(evaluate(r,{angle:r.solution,offset:0}).score,100);for(const a of r.toppings){assert.ok(Math.hypot(a.x,a.z)+a.radius<RADIUS-.1);for(const b of r.toppings)if(a.id!==b.id)assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=a.radius+b.radius);}assert.deepEqual(makeRound(seed,level),r);}});
test('balanced carbon cannot hide unequal nutrition or base area; empty nutrient totals are balanced',()=>{close(balance(0,0),100);close(balance(10,0),0);const r=makeRound(23,2);for(const angle of [10,40,85,110]){const v=evaluate(r,{angle,offset:1});assert.equal(v.score,Math.min(v.scores.carbon,v.nutrition,v.areaScore));assert.ok(!v.passed);}});
test('drag direction is equivalent, short taps ignored, slice geometry stays within cut',()=>{const a={x:-2,z:-1},b={x:2,z:1};assert.deepEqual(cutFromPoints(a,b),cutFromPoints(b,a));assert.equal(cutFromPoints(a,a),null);for(const angle of [0,60,120]){const c={angle,offset:.3};for(const p of lineEndpoints(c))close(Math.hypot(p.x,p.z),RADIUS);for(const side of [1,-1])assert.ok(diskPolygon(c,side).length>=3);}});
test('each round draws its foods from the 14-food pool, two pieces each, reproducibly by seed',()=>{
 assert.equal(foods.length,14);assert.equal(new Set(foods.map(f=>f.id)).size,14);assert.equal(new Set(foods.map(f=>f.sourceId)).size,14);assert.deepEqual(levelFoodCounts,[4,6,10]);
 for(const f of foods)assert.equal(f.grams,['beef','chicken','ham','salami'].includes(f.id)?12:['shrimp','tuna','octopus'].includes(f.id)?10:8);
 const seen=new Set();
 for(let seed=0;seed<150;seed++)for(let level=0;level<3;level++){const r=makeRound(seed,level),counts={};
  for(const t of r.toppings){assert.ok(foodById[t.food],`unknown food ${t.food}`);assert.equal(t.grams,foodById[t.food].grams);counts[t.food]=(counts[t.food]||0)+1;seen.add(t.food);}
  assert.equal(Object.keys(counts).length,levelFoodCounts[level]);for(const c of Object.values(counts))assert.equal(c,2);
  assert.deepEqual(makeRound(seed,level),r);}
 assert.equal(seen.size,14,'every pool food appears in some round');
 assert.notDeepEqual(makeRound(1,2).toppings.map(t=>t.food),makeRound(2,2).toppings.map(t=>t.food));
});
test('new CSV rows keep source values',()=>{const v=id=>foodById[id];
 assert.deepEqual([v('onion').sourceId,v('onion').co2,v('onion').energy],['Ra00264',.36,117]);
 assert.deepEqual([v('olive').sourceId,v('olive').co2,v('olive').energy,v('olive').fat],['Ra00139',1.84,703,17.2]);
 assert.deepEqual([v('ham').sourceId,v('ham').co2,v('ham').energy,v('ham').protein],['Ra00046',4.28,457,17.9]);
 assert.deepEqual([v('salami').sourceId,v('salami').co2,v('salami').energy,v('salami').fat],['Ra00045',5.9,2104,49.2]);
 assert.deepEqual([v('tuna').sourceId,v('tuna').co2,v('tuna').energy,v('tuna').protein],['Ra00098',4.5,451,23.9]);
 assert.deepEqual([v('octopus').sourceId,v('octopus').co2,v('octopus').energy,v('octopus').carb],['Ra00206',.38,324,.7]);
});
test('diner reactions follow score tiers and blame the side short on the lowest item',async()=>{const {react}=await import('./reaction.ts');
 const r=makeRound(431,0);assert.equal(react(evaluate(r,{angle:0,offset:0}),false).tier,'wait');
 assert.equal(react(evaluate(r,{angle:r.solution,offset:0}),true).tier,'happy');
 for(let angle=0;angle<180;angle+=7)for(const offset of [-1.2,-.6,-.2,.3,.9]){const v=evaluate(r,{angle,offset}),x=react(v,true);
  assert.equal(x.tier,v.score>=85?'happy':v.score>=60?'pout':'angry');
  if(x.loser){const worst=Math.min(v.scores.carbon,v.nutrition,v.areaScore);
   if(worst===v.areaScore)assert.equal(x.loser,v.area<.5?'a':'b');
   else if(worst===v.scores.carbon)assert.equal(x.loser,v.a.carbon<v.b.carbon?'a':'b');
   assert.ok((x.loser==='a'?x.bubbleA:x.bubbleB));}}
});
