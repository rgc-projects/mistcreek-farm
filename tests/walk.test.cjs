'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Walk=require('../dist/walk.js'), E=require('../dist/engine.js');

test('one logical tile shows intermediate pixel positions at 60 Hz and 30 Hz without modifying the save',()=>{
 for(const period of [1000/60,1000/30])for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const s=E.create(), a={...s.player}, w=Walk.create(), x=a.x+dx,y=a.y+dy;
  assert.equal(E.move(s,dx,dy),true);
  const snapshot=JSON.stringify(s);
  const duration=Walk.keyboard;
  w.start(a,s.player,0,duration);
  let prev=0;
  for(let t=period;t<duration;t+=period){
   const p=w.sample(s.player,t), progress=(p.x-a.x)*dx+(p.y-a.y)*dy;
   assert(progress>prev&&progress<1&&Number.isFinite(p.phase));
   assert((progress-prev)*Walk.tile<7);prev=progress;
  }
  assert.deepEqual(w.sample(s.player,duration),{x,y,dir:s.player.dir,phase:null});
  assert.equal(JSON.stringify(s),snapshot);
 }
});
test('continuous route alternates legs and starts the turn from the common tile center',()=>{
 const w=Walk.create(), a={x:0,y:0,dir:'right'}, b={x:1,y:0,dir:'right'}, c={x:1,y:1,dir:'down'};
 w.start(a,b,0,Walk.route);
 assert(Math.sin(w.sample(b,Walk.route/2).phase)>.99);
 w.start(b,c,Walk.route,Walk.route);
 assert.deepEqual(w.sample(c,Walk.route),{x:1,y:0,dir:'down',phase:Math.PI});
 assert(Math.sin(w.sample(c,Walk.route*1.5).phase)<-.99);
 assert.deepEqual(w.sample(c,Walk.route*2),{x:1,y:1,dir:'down',phase:null});
});
test('reset, jump to a destination map, and reduced motion do not interpolate',()=>{
 const w=Walk.create(), a={x:0,y:0,dir:'right'}, b={x:1,y:0,dir:'right'}, c={x:21,y:4,dir:'up'};
 w.start(a,b,0,Walk.keyboard);
 assert.deepEqual(w.sample(b,20,true),{...b,phase:null});
 assert.deepEqual(w.reset(c),{...c,phase:null});
 assert.equal(w.active(20),false);
 w.start(b,c,500,Walk.route);
 assert.deepEqual(w.sample(c,510),{...c,phase:null});
});
