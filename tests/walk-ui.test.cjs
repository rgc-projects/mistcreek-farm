'use strict';

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const E=require('../dist/engine.js');
const Save=require('../dist/save.js');
const Walk=require('../dist/walk.js');

const read=file=>fs.readFileSync(path.join(__dirname,'../dist',file),'utf8');
const html=read('index.html');
const scripts=Object.fromEntries(['walk.js','art.js','world-art.js','game.js'].map(file=>[file,read(file)]));
const xy=({x,y})=>[x,y];

function eventTarget(){
 const handlers={};
 return {
  addEventListener(type,fn){(handlers[type]??=[]).push(fn);},
  dispatch(type,event={}){
   let prevented=false;
   const e={target:this,preventDefault(){prevented=true;},...event};
   for(const fn of handlers[type]||[])fn(e);
   this['on'+type]?.(e);
   return prevented;
  }
 };
}

function rig({player,region='valley',controls='guided',reduced=false}={}){
 let now=0,raf,live,last,shadows=[],nextTimer=0;
 const timers=new Map(), rows=new Map(), media={matches:reduced};
 const disk={getItem:key=>rows.get(key)??null,setItem:(key,value)=>rows.set(key,value)};
 if(controls==='classic')disk.setItem('mistcreek-controls',controls);
 if(player||region!=='valley'){
  const s=E.create(123);s.region=region;s.outworld.visited[region]=true;
  if(player)s.player={...s.player,...player};
  Save.write(disk,s,E.restore);
 }
 const classList={add(){},remove(){},toggle(){}};
 const ctx=main=>new Proxy({
  measureText:s=>({width:s.length*10}),
  fillRect(x,y,w,h){
   if(main&&w===18&&h===3&&['#607c59','#866c5d','#657f63'].includes(this.fillStyle))shadows.push([x,y]);
  }
 },{get:(o,k)=>o[k]??(()=>{})});
 function element(tag){
  const e={...eventTarget(),tag,children:[],dataset:{},attrs:{},classList,style:{setProperty(){}},
   textContent:'',innerHTML:'',open:false,
   append(...items){this.children.push(...items);},
   replaceChildren(...items){this.children=items;},
   setAttribute(k,v){this.attrs[k]=v;},
   showModal(){this.open=true;},close(){this.open=false;this.dispatch('close');},
   focus(){},
   getBoundingClientRect(){return {left:0,top:0,right:720,bottom:432,width:720,height:432};}
  };
  if(tag==='canvas'){const canvasContext=ctx(false);e.getContext=()=>canvasContext;}
  return e;
 }
 const ids=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element(id)]));
 // These four spans are created by the real toolbar innerHTML.
 for(const id of ['hoe','water','seed','fish'])ids['qty-'+id]=element('small');
 const world=ids.world, main=ctx(true);
 world.getContext=()=>main;world.parentElement=element('div');
 const doc={...eventTarget(),body:element('body'),getElementById:id=>ids[id]??null,createElement:element};
 const win={...eventTarget(),MistEngine:E,MistSave:Save,localStorage:disk,matchMedia:()=>media,
  MistSound:{setScene(){},play(){},set(){}}};
 const globals=vm.createContext({document:doc,window:win,
  performance:{now:()=>now},requestAnimationFrame:fn=>{raf=fn;},
  setTimeout(fn,delay){const id=++nextTimer;timers.set(id,{fn,at:now+delay});return id;},
  clearTimeout:id=>timers.delete(id)
 });
 for(const f of ['walk.js','art.js','world-art.js'])vm.runInContext(scripts[f],globals,{filename:f});
 win.MistWalk=globals.MistWalk;
 for(const name of ['MistArt','MistWorldArt']){
  const draw=win[name].draw;
  win[name].draw=(c,state,t,target,fx,cam)=>{
   live=state;last={name,time:t,target:{...target},pose:{...fx.player},camera:cam?{...cam}:null};
   return draw(c,state,t,target,fx,cam);
  };
 }
 vm.runInContext(scripts['game.js'],globals,{filename:'game.js'});
 function clock(t){
  assert(t>=now,'mock monotonic time must not go backwards');
  now=t;
  for(const [id,timer] of timers)if(timer.at<=t){timers.delete(id);timer.fn();}
 }
 function frame(t){
  clock(t);shadows=[];const fn=raf;raf=null;
  assert.equal(typeof fn,'function','game must keep its frame callback scheduled');
  fn(t);assert.equal(typeof raf,'function');
  return {...last,shadows:[...shadows]};
 }
 frame(0);
 const key=(type,key,opts={})=>doc.dispatch(type,{target:world,key,...opts});
 function click(x,y,opts={}){
  return world.dispatch('pointerdown',{button:0,pointerType:'mouse',clientX:(x+.5)*24,clientY:(y+.5)*24,...opts});
 }
 return {frame,clock,click,media,ids,win,world,
  down:(k,opts)=>key('keydown',k,opts),up:k=>key('keyup',k),
  get state(){return live;},
  saved(){win.dispatch('pagehide');return Save.load(disk,E.restore).state;}
 };
}

function shadowAt(f,x,y){
 const cam=f.camera||{x:0,y:0};
 const left=Math.round((x-cam.x)*24+12)-9,top=Math.round((y-cam.y)*24+11)+8;
 assert(f.shadows.some(([a,b])=>a===left&&b===top),'actual player shadow should be drawn at interpolated position');
}

test('held keyboard steps paint fractional positions, stop on keyup and persist integer game tiles',()=>{
 const g=rig();
 assert(g.down('d'));assert.deepEqual(xy(g.state.player),[10,9]);
 const first=g.frame(Walk.keyboard/2);
 assert.equal(first.name,'MistArt');
 assert.deepEqual(xy(first.pose),[9.5,9]);shadowAt(first,9.5,9);
 assert(Number.isFinite(first.pose.phase));
 assert.deepEqual(xy(g.saved().player),[10,9]);
 g.frame(Walk.keyboard);
 assert.deepEqual(xy(g.state.player),[11,9]);
 g.frame(Walk.keyboard*2);
 assert.deepEqual(xy(g.state.player),[12,9]);
 g.up('d');
 const idle=g.frame(Walk.keyboard*4);
 assert.deepEqual(xy(g.state.player),[12,9]);
 assert.deepEqual(xy(idle.pose),[12,9]);assert.equal(idle.pose.phase,null);
});

test('a short perpendicular tap during a step is buffered and executed once at the corner',()=>{
 const g=rig();
 g.down('d');g.clock(20);g.up('d');
 g.clock(30);g.down('s');g.clock(45);g.up('s');
 const part=g.frame(75);
 assert.equal(part.pose.y,9);assert(part.pose.x>9&&part.pose.x<10);
 assert.deepEqual(xy(g.state.player),[10,9]);
 g.frame(Walk.keyboard);
 assert.deepEqual(xy(g.state.player),[10,10]);
 const turn=g.frame(Walk.keyboard*1.5);
 assert.deepEqual(xy(turn.pose),[10,9.5]);assert.equal(turn.pose.dir,'down');
 g.frame(Walk.keyboard*3);
 assert.deepEqual(xy(g.state.player),[10,10]);
});

test('guided click commits adjacent tiles in turn and its last pose settles at the destination',()=>{
 const g=rig();
 g.click(13,9);
 const first=g.frame(1);
 assert.deepEqual(xy(g.state.player),[10,9]);assert.deepEqual(xy(first.pose),[9,9]);
 const between=g.frame(1+Walk.route/2);
 assert.deepEqual(xy(between.pose),[9.5,9]);shadowAt(between,9.5,9);
 for(let n=1;n<=4;n++)g.frame(1+n*Walk.route);
 assert.deepEqual(xy(g.state.player),[13,9]);
 assert.deepEqual(xy(g.frame(1+5*Walk.route).pose),[13,9]);
});

test('entering a portal snaps to indoor spawn; indoor renderer also consumes fractional movement',()=>{
 const g=rig({player:{x:7,y:8}});
 g.down('w');g.up('w');
 const entered=g.frame(1);
 assert.equal(entered.name,'MistWorldArt');assert.equal(g.state.region,'house');
 assert.deepEqual(xy(g.state.player),[14,13]);
 assert.deepEqual(xy(entered.pose),[14,13]);assert.equal(entered.pose.phase,null);
 shadowAt(entered,14,13);
 g.down('d');g.up('d');
 const indoor=g.frame(1+Walk.keyboard/2);
 assert.equal(indoor.name,'MistWorldArt');
 assert.deepEqual(xy(indoor.pose),[14.5,13]);shadowAt(indoor,14.5,13);
 assert.deepEqual(xy(g.saved().player),[15,13]);
});

test('classic left click/tools and right click/interact remain separate from movement; touch still walks',()=>{
 const g=rig({controls:'classic'});
 assert(g.click(9,10));assert(g.state.plots['9,10'].tilled);
 assert(g.world.dispatch('wheel',{deltaY:20}));
 assert(g.click(9,10));assert(g.state.plots['9,10'].watered);
 assert.deepEqual(xy(g.state.player),[9,9]);
 assert(g.click(10,8,{button:2}));assert.equal(g.ids.panelTitle.textContent,'农场出货箱');
 g.ids.panel.close();
 g.click(12,9,{pointerType:'touch'});
 assert.deepEqual(xy(g.frame(1).pose),[9,9]);assert.deepEqual(xy(g.state.player),[10,9]);
});

test('blocked, blurred and reduced-motion steps cannot leave a walking pose in the wrong tile',()=>{
 const blocked=rig({player:{x:16,y:7}});
 blocked.down('d');
 const still=blocked.frame(Walk.keyboard/2);
 assert.deepEqual(xy(still.pose),[16,7]);assert.equal(still.pose.phase,null);
 assert.deepEqual(xy(blocked.state.player),[16,7]);

 const g=rig({reduced:true});
 g.down('d');g.clock(10);g.down('s');
 const snapped=g.frame(20);assert.deepEqual(xy(snapped.pose),[10,9]);assert.equal(snapped.pose.phase,null);
 g.win.dispatch('blur');g.frame(Walk.keyboard*4);
 assert.deepEqual(xy(g.state.player),[10,9],'blur clears both held input and the buffered tap');
});
