'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const J=require('../dist/joystick.js');

function fixture(options={}){
  const events=[],listeners=new Map(),styles=new Map(),capture=[],released=[];
  let enabled=options.enabled!==false;
  const element={
    style:{setProperty(name,value){styles.set(name,value);}},
    addEventListener(name,fn){assert(!listeners.has(name));listeners.set(name,fn);},
    getBoundingClientRect(){return {left:20,top:50,width:100,height:80};},
    setPointerCapture(id){if(options.captureFails)throw Error('pointer is gone');capture.push(id);},
    releasePointerCapture(id){released.push(id);listeners.get('lostpointercapture')({pointerId:id});}
  };
  const stick=J.create(element,d=>events.push(d),{isEnabled:()=>enabled});
  function fire(name,id,x=0,y=0,extra={}){
    let prevented=false;
    const e={pointerId:id,pointerType:'touch',button:0,clientX:70+x,clientY:90+y,
      isPrimary:false,preventDefault(){prevented=true;},...extra};
    listeners.get(name)(e);
    return prevented;
  }
  const knob=()=>[styles.get('--stick-x'),styles.get('--stick-y')].map(parseFloat);
  return {stick,events,fire,knob,capture,released,setEnabled(value){enabled=value;}};
}

test('non-primary touch captures; edge gives instant cardinal direction while center stays neutral',()=>{
  const f=fixture();
  assert.deepEqual(f.knob(),[0,0]);
  assert(f.fire('pointerdown',7,0,0));
  assert.deepEqual(f.capture,[7]);assert.deepEqual(f.events,[]);
  f.fire('pointermove',7,-8,0);assert.deepEqual(f.events,[]);
  f.fire('pointerup',7);assert.deepEqual(f.released,[7]);assert.deepEqual(f.events,[]);
  f.fire('pointerdown',8,37,0);assert.deepEqual(f.events,['right']);
  f.fire('pointerup',8);assert.deepEqual(f.events,['right',null]);assert.deepEqual(f.knob(),[0,0]);
});
test('dominant axis is stable near diagonals; stop radius is lower than the start radius',()=>{
  const f=fixture();
  f.fire('pointerdown',1,22,15);
  f.fire('pointermove',1,21,23);
  f.fire('pointermove',1,20,26);
  f.fire('pointermove',1,24,22);
  f.fire('pointermove',1,-20,0);
  f.fire('pointermove',1,-8,0);
  assert.deepEqual(f.events,['right','down','left']);
  f.fire('pointermove',1,-5,0);
  f.fire('pointermove',1,-8,0);
  f.fire('pointermove',1,-10,0);
  assert.deepEqual(f.events,['right','down','left',null,'left']);
});
test('knob clamps radially and a captured pointer moving outside remains active',()=>{
  const f=fixture();
  f.fire('pointerdown',3,31,0);
  f.fire('pointerleave',3,103,81);
  f.fire('pointermove',3,300,400);
  const [x,y]=f.knob();
  assert(Math.abs(Math.hypot(x,y)-24.8)<1e-9);
  assert(Math.abs(x/y-.75)<1e-9);
  assert.deepEqual(f.events,['right','down']);
});
test('second pointer cannot move, release, or replace the stick; lost capture safely clears once',()=>{
  const f=fixture();
  f.fire('pointerdown',4,0,-25);
  assert.equal(f.fire('pointerdown',9,25,0),false);
  f.fire('pointermove',9,25,0);
  f.fire('pointerup',9);
  f.fire('lostpointercapture',9);
  assert.deepEqual(f.capture,[4]);assert.deepEqual(f.events,['up']);
  f.fire('lostpointercapture',4);
  f.fire('pointerup',4);
  assert.deepEqual(f.released,[]);assert.deepEqual(f.events,['up',null]);assert.deepEqual(f.knob(),[0,0]);
  f.fire('pointerdown',9,25,0);
  f.fire('pointercancel',9);
  assert.deepEqual(f.released,[9]);assert.deepEqual(f.events,['up',null,'right',null]);
});
test('mouse accepts only a left press; controller disabling and explicit reset clear input',()=>{
  const f=fixture({enabled:false});
  assert.equal(f.fire('pointerdown',11,25,0,{pointerType:'mouse',button:0}),false);
  f.setEnabled(true);
  assert.equal(f.fire('pointerdown',11,25,0,{pointerType:'mouse',button:2}),false);
  assert(f.fire('pointerdown',11,25,0,{pointerType:'mouse',button:0}));
  f.setEnabled(false);f.fire('pointermove',11,0,-40);
  assert.deepEqual(f.events,['right',null]);assert.deepEqual(f.released,[11]);
  f.setEnabled(true);f.fire('pointerdown',12,0,-28);f.stick.reset();f.stick.reset();
  assert.deepEqual(f.released,[11,12]);assert.deepEqual(f.events,['right',null,'up',null]);assert.deepEqual(f.knob(),[0,0]);
});
test('failed capture does not latch the stick beyond its own element',()=>{
  const f=fixture({captureFails:true});
  f.fire('pointerdown',6,0,35);
  f.fire('pointerleave',6,0,70);
  assert.deepEqual(f.events,['down',null]);assert.deepEqual(f.knob(),[0,0]);
  assert.deepEqual(f.released,[]);
});
