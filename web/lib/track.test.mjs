import test, {beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {track,setConsent,hasConsent,consentChoice,CONSENT_EVENT} from './track.ts';
const keys=['window','localStorage','sessionStorage','document','navigator','fetch'];
let descriptors, previousURL, beacon, requests, local;
beforeEach(()=>{
  descriptors=new Map(keys.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  previousURL=process.env.NEXT_PUBLIC_TRACK_URL;
  process.env.NEXT_PUBLIC_TRACK_URL='https://example.invalid/collector';
  local=new Map();const session=new Map();beacon=[];requests=[];
  const storage=map=>({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)});
  const window=new EventTarget();window.screen={width:390};
  for(const [key,value] of Object.entries({window,localStorage:storage(local),sessionStorage:storage(session),
    document:{referrer:'https://example.invalid/source?do-not-send=yes'},
    navigator:{userAgent:'test-agent',sendBeacon:(url,body)=>{beacon.push({url,body});return true;}},
    fetch:(...args)=>{requests.push(args);return Promise.resolve({});}}))
    Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
});
afterEach(()=>{
  for(const [key,descriptor] of descriptors) {if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  if(previousURL===undefined)delete process.env.NEXT_PUBLIC_TRACK_URL;else process.env.NEXT_PUBLIC_TRACK_URL=previousURL;
});
test('no consent means no transport and no UUID; opt-out stays respected',()=>{
  assert.equal(consentChoice(),null);track({event:'game_view'});assert.equal(local.size,0);
  setConsent(false);track({event:'game_view'});assert.equal(hasConsent(),false);
  assert.equal(local.has('cce_uuid_v1'),false);assert.equal(beacon.length+requests.length,0);
});
test('shared consent event fires only on change and payload retains existing sheet schema',async()=>{
  let changes=0;window.addEventListener(CONSENT_EVENT,()=>changes++);
  setConsent(true);setConsent(true);assert.equal(changes,1);
  track({event:'game_complete',resource:'6.6-III',meta:{game:'pizza',environment:'production',score:87}});
  const payload=JSON.parse(await beacon[0].body.text());
  assert.deepEqual(Object.keys(payload).sort(),['event','meta','resource','userAgent','uuid']);
  assert.equal(payload.resource,'6.6-III');assert.equal(payload.meta.score,87);
  assert.equal(payload.meta.ref,'example.invalid');assert.equal(payload.meta.sw,390);assert.ok(payload.meta.sid);
  assert.equal(beacon[0].body.type,'text/plain;charset=utf-8');assert.equal(requests.length,0);
});
test('beacon queue rejection falls back to fetch; asynchronous failure is swallowed',async()=>{
  setConsent(true);navigator.sendBeacon=()=>false;
  globalThis.fetch=(...args)=>{requests.push(args);return Promise.reject(Error('offline'));};
  assert.doesNotThrow(()=>track({event:'game_start'}));await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests.length,1);assert.equal(requests[0][1].keepalive,true);assert.equal(requests[0][1].mode,'no-cors');
});
test('blocked storage and absent endpoint do not break the page or send events',()=>{
  localStorage.getItem=()=>{throw Error('blocked');};localStorage.setItem=()=>{throw Error('blocked');};
  assert.doesNotThrow(()=>{setConsent(true);track({event:'game_view'});});assert.equal(hasConsent(),false);
  localStorage.getItem=()=> '1';delete process.env.NEXT_PUBLIC_TRACK_URL;
  track({event:'game_view'});assert.equal(beacon.length+requests.length,0);
});
