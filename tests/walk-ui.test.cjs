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
const scripts=Object.fromEntries(['walk.js','joystick.js','art.js','world-art.js','game.js'].map(file=>[file,read(file)]));
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

function rig({player,region='valley',controls='guided',legacyClassic=false,reduced=false,mobile=false,mobileControls='tap',setup}={}){
 let now=0,raf,live,last,shadows=[],nextTimer=0;
 const timers=new Map(), rows=new Map(), media={matches:reduced};
 const disk={getItem:key=>rows.get(key)??null,setItem:(key,value)=>rows.set(key,value)};
 if(controls)disk.setItem('mistcreek-desktop-controls',controls);
 if(legacyClassic)disk.setItem('mistcreek-controls','classic');
 if(mobile)disk.setItem('mistcreek-mobile-controls',mobileControls);
 if(player||region!=='valley'||setup){
  const s=E.create(123);s.region=region;s.outworld.visited[region]=true;
  if(player)s.player={...s.player,...player};
  setup?.(s);
  assert(E.restore(s),'test fixture must be a valid game state');
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
   focus(){},setPointerCapture(){},releasePointerCapture(){},hasPointerCapture(){return true;},
   getBoundingClientRect(){
    if(tag==='mobileStick')return {left:24,top:230,right:104,bottom:310,width:80,height:80};
    const width=mobile?360:720,height=mobile?216:432;
    return {left:0,top:0,right:width,bottom:height,width,height};
   }
  };
  if(tag==='canvas'){const canvasContext=ctx(false);e.getContext=()=>canvasContext;}
  return e;
 }
 const ids=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,Object.assign(element(id),{id})]));
 // These four spans are created by the real toolbar innerHTML.
 for(const id of ['hoe','water','seed','fish'])ids['qty-'+id]=element('small');
 const world=ids.world, main=ctx(true);
 world.getContext=()=>main;world.parentElement=element('div');
 const doc={...eventTarget(),body:element('body'),getElementById:id=>ids[id]??null,createElement:element};
 const win={...eventTarget(),MistEngine:E,MistSave:Save,localStorage:disk,innerWidth:mobile?390:1280,
  matchMedia:q=>q.includes('reduced-motion')?media:{matches:mobile},
  MistSound:{setScene(){},play(){},set(){}}};
 const globals=vm.createContext({document:doc,window:win,
  performance:{now:()=>now},requestAnimationFrame:fn=>{raf=fn;},
  setTimeout(fn,delay){const id=++nextTimer;timers.set(id,{fn,at:now+delay});return id;},
  clearTimeout:id=>timers.delete(id)
 });
 for(const f of ['walk.js','joystick.js','art.js','world-art.js'])vm.runInContext(scripts[f],globals,{filename:f});
 win.MistWalk=globals.MistWalk;win.MistJoystick=globals.MistJoystick||win.MistJoystick;
 for(const name of ['MistArt','MistWorldArt']){
  const draw=win[name].draw;
  win[name].draw=(c,state,t,target,fx,cam)=>{
   live=state;last={name,time:t,target:target?{...target}:null,pose:{...fx.player},
    stopTile:fx.stopTile?{...fx.stopTile}:null,camera:cam?{...cam}:null};
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
 function pointer(type,x,y,opts={}){
  const bounds=world.getBoundingClientRect(),{x:cx,y:cy}=last.camera||{x:0,y:0};
  return world.dispatch(type,{button:0,pointerType:'mouse',pointerId:1,isPrimary:true,
   clientX:(x-cx+.5)*bounds.width/30,clientY:(y-cy+.5)*bounds.height/18,...opts});
 }
 const click=(x,y,opts)=>pointer('pointerdown',x,y,opts);
 const touch=(type,x,y,opts)=>pointer(type,x,y,{pointerType:'touch',...opts});
 function tap(x,y){touch('pointerdown',x,y);touch('pointerup',x,y);}
 function settle(steps=16){let result;for(let i=0;i<steps;i++)result=frame(now+Walk.route);return result;}
 function stick(type,dx=0,dy=0,opts={}){
  const pad=ids.mobileStick,b=pad.getBoundingClientRect();
  return pad.dispatch(type,{button:0,pointerType:'touch',pointerId:2,isPrimary:true,
   clientX:b.left+b.width/2+dx,clientY:b.top+b.height/2+dy,...opts});
 }
 function next(ms=16){return frame(now+ms);}
 function waitFor(check){
  for(let n=0;n<36;n++){const f=next();if(check())return f;}
  assert.fail('condition did not occur within 36 game frames');
 }
 return {frame,next,waitFor,clock,click,touch,tap,settle,stick,media,ids,win,world,
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
 assert.deepEqual(xy(g.state.player),[10,9]);
 g.frame(Walk.keyboard);
 assert.deepEqual(xy(g.state.player),[11,9]);
 g.frame(Walk.keyboard*2);
 assert.deepEqual(xy(g.state.player),[12,9]);
 g.up('d');
 const idle=g.frame(Walk.keyboard*4);
 assert.deepEqual(xy(g.state.player),[12,9]);
 assert.deepEqual(xy(idle.pose),[12,9]);assert.equal(idle.pose.phase,null);
 assert.deepEqual(xy(g.saved().player),[12,9]);
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
 g.tap(12,9);
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

test('touch waits for release and neither a drag nor pointer cancellation starts a walking route',()=>{
 const g=rig({mobile:true});
 g.touch('pointerdown',13,9);
 g.frame(20);
 assert.deepEqual(xy(g.state.player),[9,9]);
 g.touch('pointermove',11,9);
 g.touch('pointerup',11,9);
 g.settle(5);
 assert.deepEqual(xy(g.state.player),[9,9]);
 g.touch('pointerdown',13,9);
 g.touch('pointercancel',13,9);
 g.settle(5);
 assert.deepEqual(xy(g.state.player),[9,9]);
 g.tap(13,9);
 g.settle(6);
 assert.deepEqual(xy(g.state.player),[13,9]);
});

test('mobile touch walks through both widened road edges and snaps on each map change',()=>{
 const g=rig({mobile:true,player:{x:28,y:9}});
 g.tap(29,9);
 const entered=g.frame(1);
 assert.equal(entered.name,'MistWorldArt');
 assert.equal(g.state.region,'town');
 assert.deepEqual(xy(entered.pose),[2,11]);assert.equal(entered.pose.phase,null);
 // The town view has a nonzero camera offset here. The tap uses screen coordinates,
 // not hard-coded world pixels, and targets a secondary row of the west exit.
 g.tap(0,12);
 const returned=g.settle(8);
 assert.equal(returned.name,'MistArt');assert.equal(g.state.region,'valley');
 assert.deepEqual(xy(returned.pose),[28,8]);assert.equal(returned.pose.phase,null);
 assert.equal(g.saved().outworld.visited.town,true);
});

test('classic right-click can interact with a secondary town exit from its outer approach',()=>{
 const g=rig({controls:'classic',region:'town',player:{x:1,y:13}});
 assert(g.click(0,12,{button:2}));
 const returned=g.frame(1);
 assert.equal(returned.name,'MistArt');
 assert.equal(g.state.region,'valley');
 assert.deepEqual(xy(returned.pose),[28,8]);
 assert.equal(returned.pose.phase,null);
});

test('touch selects farm tile but walks to an adjacent working position; thumbs water only on explicit action',()=>{
 const g=rig({mobile:true,setup(s){
  for(let x=11;x<=13;x++)s.plots[x+',12'].tilled=true;
 }});
 const target=[12,12],row=[11,12,13].map(x=>g.state.plots[x+',12']);
 g.ids.tools.children.find(button=>button.dataset.tool==='water').dispatch('click');
 g.tap(...target);
 const walking=g.frame(1);
 assert.deepEqual(xy(walking.target),target);
 assert(walking.stopTile,'show the approach destination during the route');
 assert.notDeepEqual(xy(walking.stopTile),target);
 assert(row.every(p=>!p.watered));
 const arrived=g.settle();
 const stop=xy(g.state.player);
 assert.deepEqual(stop,xy(walking.stopTile));
 assert(Math.max(...stop.map((p,i)=>Math.abs(p-target[i])))===1);
 assert.deepEqual(xy(arrived.target),target);
 assert.equal(arrived.stopTile,null);
 assert(row.every(p=>!p.watered),'approach alone must not use a tool');
 assert.equal(g.ids.waterWide.hidden,false);
 assert.equal(g.ids.waterWide.disabled,false);
 g.ids.waterWide.dispatch('click');
 assert(row.every(p=>p.watered),'thumb watering action applies the actual engine row operation');
 assert.equal(g.state.energy,94);
});

test('tapping a ripe crop only selects it; the explicit thumb harvest button collects it',()=>{
 const g=rig({mobile:true,setup(s){
  Object.assign(s.plots['12,12'],{tilled:true,crop:'turnip',growth:E.CROPS.turnip.days});
 }});
 const plot=g.state.plots['12,12'];
 g.tap(12,12);
 g.settle();
 assert.equal(plot.crop,'turnip');assert.equal(g.state.inventory.turnip,0);
 assert.equal(g.ids.use.textContent,'收获');
 assert.equal(g.ids.use.disabled,false);
 g.ids.use.dispatch('click');
 assert.equal(plot.crop,null);
 assert.equal(g.state.inventory.turnip,1);
 assert.equal(g.saved().inventory.turnip,1);
});

test('one adjacent touch selection supports the explicit till, plant and water sequence',()=>{
 const g=rig({mobile:true});
 const plot=g.state.plots['9,10'];
 g.tap(9,10);g.frame(1);
 assert.equal(plot.tilled,false);
 g.ids.use.dispatch('click');
 assert.equal(plot.tilled,true);assert.equal(plot.crop,null);
 g.tap(9,10);g.frame(2);
 assert.equal(plot.crop,null);
 g.ids.use.dispatch('click');
 assert.equal(plot.crop,'turnip');assert.equal(plot.watered,false);
 g.tap(9,10);g.frame(3);
 assert.equal(plot.watered,false);
 g.ids.use.dispatch('click');
 assert.equal(plot.watered,true);
 assert.deepEqual(xy(g.state.player),[9,9]);
});

const joystickRig=(options={})=>rig({mobile:true,mobileControls:'stick',...options});
function pointStick(g,dx,dy){
 g.stick('pointerdown');
 g.stick('pointermove',dx,dy);
}

test('joystick hold walks, and release finishes the in-flight tile without taking another step',()=>{
 const g=joystickRig();
 pointStick(g,32,0);
 const last=g.waitFor(()=>g.state.player.x===12);
 assert.deepEqual(xy(g.state.player),[12,9]);
 assert(last.pose.x>=11&&last.pose.x<12,'an accepted step must still be interpolating');
 g.stick('pointerup',32,0);
 const stopped=g.settle(6);
 assert.deepEqual(xy(g.state.player),[12,9]);
 assert.deepEqual(xy(stopped.pose),[12,9]);assert.equal(stopped.pose.phase,null);
 assert.deepEqual(xy(g.saved().player),[12,9]);
});

test('joystick manual movement cancels a touch route rather than allowing it to resume on release',()=>{
 const g=joystickRig();
 g.tap(13,13);
 assert(g.next().stopTile);
 const [x,y]=xy(g.state.player);
 pointStick(g,-32,0);
 const taken=g.waitFor(()=>g.state.player.x===x-1);
 assert.equal(taken.stopTile,null,'clear the destination marker on takeover');
 g.stick('pointerup',-32,0);
 const stopped=g.settle(16);
 assert.deepEqual(xy(g.state.player),[x-1,y]);
 assert.deepEqual(xy(stopped.pose),[x-1,y]);
});

test('joystick crosses the widened east road on row 9 and can return west from town',()=>{
 const g=joystickRig({player:{x:28,y:9}});
 pointStick(g,32,0);
 const town=g.waitFor(()=>g.state.region==='town');
 assert.equal(town.name,'MistWorldArt');
 assert.deepEqual(xy(town.pose),[2,11]);assert.equal(town.pose.phase,null);
 g.stick('pointerup',32,0);g.settle(4);
 assert.deepEqual(xy(g.state.player),[2,11]);
 pointStick(g,-32,0);
 const valley=g.waitFor(()=>g.state.region==='valley');
 assert.equal(valley.name,'MistArt');assert.deepEqual(xy(valley.pose),[28,8]);
 g.stick('pointerup',-32,0);g.settle(4);
 assert.deepEqual(xy(g.state.player),[28,8]);
 assert.equal(g.saved().outworld.visited.town,true);
});

test('joystick facing supplies successive action targets, then an explicit tap overrides facing',()=>{
 const g=joystickRig({player:{x:7,y:10,dir:'right'},setup(s){
  for(const id of ['8,10','9,10','10,10','8,11'])s.plots[id].tilled=true;
 }});
 const waterButton=g.ids.tools.children.find(button=>button.dataset.tool==='water');
 waterButton.dispatch('click');
 const action=g.ids.use;
 for(let target=8;target<=10;target++){
  const before=g.state.energy;
  action.dispatch('click');
  assert(g.state.plots[target+',10'].watered,'action must water the cell in front of the player');
  assert.equal(g.state.energy,before-2);
  if(target<10){
   pointStick(g,32,0);g.waitFor(()=>g.state.player.x===target);
   g.stick('pointerup',32,0);g.settle(3);
   assert.deepEqual(xy(g.state.player),[target,10]);
  }
 }
 g.tap(8,11);
 const selected=g.next();
 assert.deepEqual(xy(selected.target),[8,11]);
 assert.equal(g.state.plots['8,11'].watered,false,'selection is not an action');
 action.dispatch('click');
 assert.equal(g.state.plots['8,11'].watered,true);
 assert.deepEqual(xy(g.state.player),[9,10],'adjacent explicit targeting does not move the player');
});

test('opening a modal, cancelling a pointer and losing focus each clear joystick input',()=>{
 for(const reset of ['modal','cancel','blur','pagehide']){
  const g=joystickRig();
  pointStick(g,32,0);
  g.waitFor(()=>g.state.player.x===10);
  if(reset==='modal'){
   g.ids.help.dispatch('click');
   assert(g.ids.panel.open);
   g.settle(3);
   g.ids.panel.close();
  }else if(reset==='cancel')g.stick('pointercancel',32,0);
  else if(reset==='pagehide')assert.deepEqual(xy(g.saved().player),[10,9]);
  else g.win.dispatch('blur');
  const stopped=g.settle(7);
  assert.deepEqual(xy(g.state.player),[10,9],reset);
  assert.deepEqual(xy(stopped.pose),[10,9],reset);
  assert.equal(stopped.pose.phase,null,reset);
 }
});

test('a thumb action is rejected when the facing target changes between press and click',()=>{
 const g=joystickRig({player:{x:7,y:10,dir:'right'},setup(s){
  for(const id of ['8,10','9,10'])s.plots[id].tilled=true;
 }});
 g.ids.tools.children.find(button=>button.dataset.tool==='water').dispatch('click');
 const action=g.ids.use, finger={button:0,pointerType:'touch',pointerId:3,clientX:280,clientY:260};
 const first=g.next();
 assert.deepEqual(xy(first.target),[8,10]);
 action.dispatch('pointerdown',finger);
 pointStick(g,32,0);
 const after=g.waitFor(()=>g.state.player.x===8);
 assert.deepEqual(xy(after.target),[9,10]);
 g.stick('pointerup',32,0);
 action.dispatch('pointerup',finger);action.dispatch('click',finger);
 assert.equal(g.state.plots['8,10'].watered,false);
 assert.equal(g.state.plots['9,10'].watered,false);
 assert.equal(g.state.energy,100);
 assert.match(g.ids.contextText.textContent,/目标变了/);
 g.settle(3);
 action.dispatch('pointerdown',finger);action.dispatch('pointerup',finger);action.dispatch('click',finger);
 assert.equal(g.state.plots['8,10'].watered,false);
 assert.equal(g.state.plots['9,10'].watered,true);
});

const contextualRig=(options={})=>rig({controls:'context',...options});

test('the previous desktop preference still selects classic controls when the new preference is absent',()=>{
 const g=rig({controls:null,legacyClassic:true,setup(s){s.plots['9,10'].tilled=true;}});
 g.click(9,10);
 assert.equal(g.state.plots['9,10'].crop,null,'classic left click uses the hoe, not contextual planting');
 g.down('2');g.up('2');
 g.click(9,10);
 assert.equal(g.state.plots['9,10'].watered,true);
});

test('fresh desktop mode performs the nearby contextual crop action on each deliberate left click',()=>{
 const g=rig({controls:null,setup(s){
  Object.assign(s.plots['8,10'],{tilled:true,crop:'turnip',growth:E.CROPS.turnip.days});
 }});
 const field=g.state.plots['9,10'];
 const seeds=g.state.inventory.beanSeed;
 g.click(9,10);
 assert.equal(field.tilled,true);assert.equal(field.crop,null);
 g.down('4');g.up('4');
 g.click(9,10);
 assert.equal(field.crop,'bean','contextual planting uses the currently picked seed');
 assert.equal(g.state.inventory.beanSeed,seeds-1);
 assert.equal(field.watered,false);
 g.click(9,10);
 assert.equal(field.watered,true,'contextual watering works with the seed tool still selected');
 g.click(8,10);
 assert.equal(g.state.plots['8,10'].crop,null);
 assert.equal(g.state.inventory.turnip,1);
 assert.deepEqual(xy(g.state.player),[9,9]);
});

test('a far contextual left click walks into range without using a tool; a second click is required',()=>{
 const g=contextualRig();
 const field=g.state.plots['12,12'];
 g.click(12,12);
 assert.equal(field.tilled,false);
 g.next();
 assert.equal(field.tilled,false);
 const arrived=g.settle();
 const player=xy(g.state.player);
 assert.equal(Math.max(Math.abs(player[0]-12),Math.abs(player[1]-12)),1);
 assert.deepEqual(xy(arrived.target),[12,12]);
 assert.equal(field.tilled,false);
 assert.equal(g.state.energy,100,'walking to the field does not use a tool');
 g.click(12,12);
 assert.equal(field.tilled,true);
 assert.equal(g.state.energy,97);
});

test('contextual left click opens a nearby chest, talks to a villager and enters a door',()=>{
 const chest=contextualRig();
 chest.click(10,8);
 assert.equal(chest.ids.panel.open,true);
 assert.equal(chest.ids.panelTitle.textContent,'农场出货箱');

 const npc=contextualRig({player:{x:12,y:8}});
 const farmer=E.npcs(npc.state).find(n=>n.id==='farmer');
 npc.click(farmer.x,farmer.y);
 assert.equal(npc.ids.panel.open,true);
 assert.equal(npc.ids.panelTitle.textContent,farmer.name);
 assert.equal(npc.state.spring.met.farmer,true);

 const door=contextualRig({player:{x:7,y:8}});
 door.click(7,7);
 const inside=door.next();
 assert.equal(door.state.region,'house');
 assert.deepEqual(xy(inside.pose),[14,13]);
 assert.equal(inside.pose.phase,null);
});

test('contextual right click and X interact; C still uses the selected tool explicitly',()=>{
 const g=contextualRig({setup(s){s.plots['9,10'].tilled=true;}});
 const plot=g.state.plots['9,10'];
 g.click(9,10,{button:2});
 assert.equal(plot.crop,null,'right click must not use the contextual plant action');
 g.down('2');g.up('2');g.down('c');g.up('c');
 assert.equal(plot.watered,true,'C uses the selected watering can on an empty tilled tile');
 assert.equal(plot.crop,null);
 g.click(10,8,{button:2});
 assert.equal(g.ids.panelTitle.textContent,'农场出货箱');

 const facing=contextualRig({player:{x:9,y:8,dir:'right'}});
 facing.down('x');facing.up('x');
 assert.equal(facing.ids.panelTitle.textContent,'农场出货箱');
});

test('Shift plus contextual left click water uses the real row operation, while empty ground has no action',()=>{
 const g=contextualRig({setup(s){
  for(let x=8;x<=10;x++)Object.assign(s.plots[x+',10'],{tilled:true,crop:'turnip',growth:0});
 }});
 const before={energy:g.state.energy,inventory:{...g.state.inventory},plots:JSON.stringify(g.state.plots)};
 g.click(9,8);
 g.settle(3);
 assert.equal(g.ids.panel.open,false);
 assert.equal(g.state.energy,before.energy);
 assert.deepEqual(g.state.inventory,before.inventory);
 assert.equal(JSON.stringify(g.state.plots),before.plots);
 // The empty-ground click may move the player. Get back within tool reach if so.
 if(g.state.player.y!==9){g.down('s');g.up('s');g.settle(3);}
 g.click(9,10,{shiftKey:true});
 for(let x=8;x<=10;x++)assert.equal(g.state.plots[x+',10'].watered,true);
 assert.equal(g.state.energy,94);
});

test('touch in contextual desktop mode still requires the explicit action button',()=>{
 const g=contextualRig({mobile:true,setup(s){
  Object.assign(s.plots['9,10'],{tilled:true,crop:'turnip',growth:E.CROPS.turnip.days});
 }});
 g.tap(9,10);g.next();
 assert.equal(g.state.plots['9,10'].crop,'turnip');
 assert.equal(g.state.inventory.turnip,0);
 assert.equal(g.ids.use.textContent,'收获');
 g.ids.use.dispatch('click');
 assert.equal(g.state.plots['9,10'].crop,null);
 assert.equal(g.state.inventory.turnip,1);
});
