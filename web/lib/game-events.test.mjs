import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameEvents, cleanSummary, gameEnvironment, games } from './game-events.ts';

function fixture(game='pizza') {
  let consent=true, environment='production', time=1000, serial=0;
  const sent=[];
  const api=createGameEvents({game,enabled:()=>consent,environment:()=>environment,send:e=>sent.push(e),now:()=>time,id:()=>`id-${++serial}`});
  return {api,sent,consent:v=>{consent=v;api.consentChanged();},environment:v=>{environment=v;},tick:v=>{time+=v;}};
}
test('all six games map view/start/complete to their teaching resource',()=>{
  for(const [game,key] of Object.entries(games)) {
    const f=fixture(game);f.api.view();f.api.start({phase:'challenge'});f.tick(2540);f.api.complete({score:61,passed:false});
    assert.deepEqual(f.sent.map(e=>e.event),['game_view','game_start','game_complete']);
    assert.ok(f.sent.every(e=>e.resource===key&&e.meta.keyId===key&&e.meta.game===game));
    assert.equal(f.sent[2].meta.durationMs,2540);
    assert.equal(f.sent[2].meta.passed,false);
    assert.equal(f.sent[2].meta.attemptId,f.sent[1].meta.attemptId);
  }
});
test('effect re-execution, result revisits and restored results cannot duplicate completion',()=>{
  const {api,sent}=fixture();api.complete({score:99});api.view();api.view();
  api.start({level:1});api.ensureStart({level:1});api.complete({score:64});api.complete({score:64});
  assert.deepEqual(sent.map(e=>e.event),['game_view','game_start','game_complete']);
});
test('retry links new attempt to previous attempt; new level and baseline are not retries',()=>{
  const {api,sent}=fixture();api.start({phase:'baseline'});api.complete();api.start({phase:'challenge',level:1});api.complete();
  const previous=sent.at(-1).meta.attemptId;
  api.start({phase:'challenge',level:1});api.complete();api.start({phase:'challenge',level:2});
  const retries=sent.filter(e=>e.event==='game_retry');assert.equal(retries.length,1);
  assert.equal(retries[0].meta.previousAttemptId,previous);
  assert.equal(retries[0].meta.attemptId,sent.find(e=>e.event==='game_start'&&e.meta.attempt===3).meta.attemptId);
});
test('cancelled runs cannot finish; starting after reset still registers a retry',()=>{
  const {api,sent}=fixture();api.start({phase:'challenge'});api.cancel();api.complete();api.start({phase:'challenge'});
  assert.equal(sent.filter(e=>e.event==='game_complete').length,0);
  assert.equal(sent.filter(e=>e.event==='game_retry').length,1);
});
test('consent opt-in does not backfill a run started without consent',()=>{
  const f=fixture();f.consent(false);f.api.view();f.api.start();f.api.complete();assert.equal(f.sent.length,0);
  f.api.start();f.consent(true);f.api.complete();assert.deepEqual(f.sent.map(e=>e.event),['game_view']);
  f.api.start();f.api.complete();assert.equal(f.sent.at(-1).event,'game_complete');
});
test('revocation during a run suppresses completion even after opting in again',()=>{
  const f=fixture();f.api.start();f.consent(false);f.consent(true);f.api.complete();
  assert.equal(f.sent.filter(e=>e.event==='game_complete').length,0);
  f.api.start();f.api.complete();assert.equal(f.sent.filter(e=>e.event==='game_complete').length,1);
});
test('local or LAN play emits nothing and preview cannot count as production',()=>{
  for(const host of ['localhost','127.0.0.1','192.168.1.4','10.0.0.4','172.16.1.2','[::1]','demo.localhost']) assert.equal(gameEnvironment(host,'production'),'local');
  assert.equal(gameEnvironment('community.cce.tw'),'production');
  assert.equal(gameEnvironment('community.cce.tw','preview'),'preview');
  assert.equal(gameEnvironment('branch.pages.dev','production'),'preview');
  const f=fixture();f.environment('local');f.api.view();f.api.start();f.api.complete();assert.equal(f.sent.length,0);
  f.environment('preview');f.api.start();f.api.complete();assert.ok(f.sent.every(e=>e.meta.environment==='preview'));
});
test('whitelist excludes free text, nested data and nonfinite or spoofed metrics',()=>{
  assert.deepEqual(cleanSummary({score:87.123456,reflection:'student text',prediction:'private',name:'person',
    treePositions:[1,2],phase:'a name',topic:'free text',environment:'production',keyId:'override',durationMs:123,
    pure:Infinity,seconds:NaN,passed:true,tutorial:false}),{score:87.123,passed:true,tutorial:false});
});
test('blocked consent storage and transport failures do not break play',()=>{
  const blocked=createGameEvents({game:'heat',environment:()=> 'production',enabled:()=>{throw Error('storage');},send:()=>{throw Error('send');}});
  assert.doesNotThrow(()=>{blocked.view();blocked.start();blocked.complete();});
  const broken=createGameEvents({game:'heat',environment:()=> 'production',enabled:()=>true,id:()=> 'id',send:()=>{throw Error('send');}});
  assert.doesNotThrow(()=>{broken.view();broken.start();broken.complete();});
});
