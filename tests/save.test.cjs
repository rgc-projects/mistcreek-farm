const test=require('node:test'), assert=require('node:assert/strict');
const e=require('../dist/engine.js'), s=require('../dist/save.js');
function disk(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),clear:()=>m.clear()};}
test('first migration retains the original browser save and preserves crops and gold',()=>{
 const d=disk(), base=e.create();base.version=1;delete base.region;delete base.spring;base.gold=137;base.plots['9,10']={tilled:true,crop:'turnip',growth:1,watered:true};
 const original=JSON.stringify({state:base});d.setItem('mistcreek-farm-v1',original);
 const r=s.load(d,e.restore);assert.equal(r.source,'legacy');assert.equal(r.state.version,5);assert.equal(r.state.gold,137);assert.equal(r.state.plots['9,10'].growth,1);
 assert.equal(s.write(d,r.state,e.restore),true);assert.equal(s.load(d,e.restore).source,'current');assert.equal(d.getItem('mistcreek-farm-v1'),original);
});
test('invalid imports cannot decode; corrupt primary falls back to previous dawn',()=>{
 const d=disk(), state=e.create();s.write(d,state,e.restore);state.day=3;s.write(d,state,e.restore,{checkpoint:true});
 d.setItem('mistcreek-farm-v5','{broken');const r=s.load(d,e.restore);assert.equal(r.source,'backup');assert.equal(r.state.day,1);assert.equal(r.bad,true);
 assert.equal(s.write(d,r.state,e.restore),true);assert.equal(s.damaged(d),'{broken');
 assert.equal(s.decode('{',e.restore),null);assert.equal(s.decode(JSON.stringify({format:'other',state}),e.restore),null);
});
test('explicit swap retains previous for undo; unavailable store is handled',()=>{
 const d=disk(), a=e.create();a.day=4;assert.equal(s.write(d,a,e.restore),true);
 const b=e.create();assert.equal(s.write(d,b,e.restore,{previousState:a}),true);assert.equal(s.backup(d,e.restore).day,4);assert.equal(s.load(d,e.restore).state.day,1);
 assert.equal(s.write(null,b,e.restore),false);assert.equal(s.load(null,e.restore).unavailable,true);
});
