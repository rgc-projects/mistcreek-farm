'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../dist/engine.js');
const {WORLD:W}=E;
const steps=[[1,0],[-1,0],[0,1],[0,-1]];
const dist=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
const same=(a,b)=>a.x===b.x&&a.y===b.y;
const at=(x,y)=>({x,y});
function walk(state,goal,adjacent=false) {
  const queue=[{x:state.player.x,y:state.player.y,path:[]}], seen=new Set();
  for(let i=0;i<queue.length;i++){
    const {x,y,path}=queue[i], p={x,y};
    if(adjacent?dist(p,goal)<=1:same(p,goal)){
      for(const [dx,dy] of path)assert(E.move(state,dx,dy));
      return path.length;
    }
    for(const [dx,dy] of steps){
      const nx=x+dx,ny=y+dy,key=nx+','+ny;
      const autoPortal=E.PORTALS.some(p=>p.region===state.region&&p.x===nx&&p.y===ny&&E.portalEnabled(state,p));
      if(!seen.has(key)&&E.isWalkable(nx,ny,state.region,state)&&(!autoPortal||!adjacent&&same({x:nx,y:ny},goal))){
        seen.add(key);queue.push({x:nx,y:ny,path:[...path,[dx,dy]]});
      }
    }
  }
  throw Error('unreachable '+JSON.stringify(goal));
}
function action(state,id,where,power){
  if(where)walk(state,where,true);
  const a=E.act(state,id,where,power);
  assert(a.ok,id+': '+a.msg);
  return a;
}
function overnight(state){return action(state,'sleep',W.house);}
function plant(state,location,crop){
  assert.equal(action(state,'hoe',location).event,'till');
  assert.equal(action(state,crop,location).event,'plant');
  assert.equal(action(state,'water',location).event,'water');
}

test('world has two walkable bridge lanes, impassable water/buildings, working map reachability',()=>{
  const s=E.create('map');
  assert.deepEqual(s.player,{x:9,y:9,dir:'down'});
  assert.equal(E.getContext(s), '用锄头翻土');
  assert.equal(Object.keys(s.plots).length,45);
  walk(s,at(16,7));assert(!E.move(s,1,0));assert.equal(s.player.dir,'right');
  walk(s,at(16,8));assert(E.move(s,1,0));assert(E.move(s,1,0));assert(E.move(s,1,0));assert(E.move(s,1,0));
  assert.equal(s.player.x,20);
  assert(!E.isWalkable(8,4));assert(!E.isWalkable(24,5));assert(!E.isWalkable(10,8));
  assert(E.isWalkable(25,12));assert(!E.isWalkable(25,13));assert(!E.isWalkable(30,2));
  for(const place of ['house','shop','orders','lantern','crate','shopkeeper','farmer'])walk(s,W[place],true);
});
test('watering, misses, growth caps, and rain',()=>{
  const s=E.create();const a=at(9,10),b=at(10,10);
  assert(!E.act(s,'turnipSeed',a).ok);
  assert(!E.act(s,'hoe',at(5,14)).ok);
  assert(!E.act(s,'hoe',at(9,8)).ok);
  plant(s,a,'turnipSeed');
  action(s,'hoe',b);action(s,'beanSeed',b);
  assert.equal(s.inventory.turnipSeed,4);
  assert.equal(s.inventory.beanSeed,2);
  assert.equal(s.energy,88);
  assert(!E.act(s,'water',a).ok);
  overnight(s);
  assert.equal(s.plots['9,10'].growth,1);assert.equal(s.plots['10,10'].growth,0);
  assert.equal(s.rain,false);
  action(s,'water',a);action(s,'water',b);
  overnight(s);assert.equal(s.day,3);assert.equal(s.rain,true);
  walk(s,a,true);assert.equal(E.getContext(s,a),'收获萝卜');
  assert.equal(action(s,'interact',a).event,'harvest');
  assert.equal(s.plots['9,10'].tilled,true);assert.equal(s.plots['9,10'].crop,null);
  assert.equal(s.plots['10,10'].growth,1);assert(!E.act(s,'water',b).ok);
  overnight(s);assert.equal(s.plots['10,10'].growth,2);
});
test('walk even when energy empty and time capped; free sleep resets both and protects zero-cash seed stock',()=>{
  const s=E.create();
  Object.assign(s,{energy:0,minute:1319,gold:0,movementSteps:2});
  for(const crop of Object.values(E.CROPS))s.inventory[crop.seed]=0;
  assert(!E.act(s,'hoe',at(9,10)).ok);
  assert(!E.act(s,'sleep').ok);
  walk(s,W.house,true);
  assert.equal(s.minute,1320);
  const r=E.act(s,'sleep');
  assert.equal(r.event,'newDay');assert.equal(r.seedGift,2);
  assert.equal(s.energy,100);assert.equal(s.minute,360);assert.equal(s.day,2);
  assert.deepEqual(s.player,{x:7,y:8,dir:'down'});
  assert.equal(s.inventory.turnipSeed,2);
});
test('fishing verifies location, timing, energy, tutorial band and later normal band',()=>{
  const s=E.create();
  assert(!E.act(s,'fish',at(9,10),.5).ok);
  walk(s,at(16,7));
  assert.equal(E.act(s,'fish',at(17,7)).event,'fish');
  assert.equal(E.act(s,'fish',at(17,7),.08).event,'miss');
  assert.equal(E.act(s,'fish',at(17,7),.28).event,'catch','first catch forgiving');
  assert.equal(E.act(s,'fish',at(17,7),.28).event,'miss','later hits require narrower band');
  assert.equal(E.act(s,'fish',at(17,7),.76).event,'catch');
  assert.equal(s.inventory.fish,1);assert.equal(s.inventory.silverDace,1);assert.equal(s.energy,72);
  walk(s,at(24,12));
  assert.equal(E.act(s,'fish',at(24,13),.58).event,'catch');
});
test('full objective from spawn, including seed shopping and shipped income',()=>{
  const s=E.create('full progression');
  const turnips=[at(8,10),at(9,10),at(10,10)],beans=[at(8,11),at(9,11)];
  assert.equal(action(s,'interact',W.farmer).event,'dialogue');
  for(const p of turnips)plant(s,p,'turnipSeed');
  for(const p of beans)plant(s,p,'beanSeed');
  overnight(s);
  for(const p of [...turnips,...beans])action(s,'water',p);
  overnight(s);
  for(const p of turnips)assert.equal(action(s,'interact',p).event,'harvest');
  assert.equal(s.inventory.turnip,3);
  overnight(s);
  for(const p of beans)assert.equal(action(s,'interact',p).event,'harvest');
  assert.equal(s.inventory.bean,2);
  walk(s,at(16,7));
  for(let i=0;i<3;i++)assert.equal(E.act(s,'fish',at(17,7),.5).event,'catch');
  assert.equal(action(s,'interact',W.shop).event,'shop');
  assert.equal(action(s,'buyBean',W.shop).event,'buy');
  assert.equal(s.gold,56);
  assert.equal(action(s,'interact',W.orders).event,'order');
  assert.equal(action(s,'interact',W.lantern).canRepair,false);
  assert(!E.act(s,'repair',W.lantern).ok);
  assert.equal(s.repaired,false);
  assert.equal(action(s,'order',W.orders).event,'orderDone');
  assert.equal(action(s,'order',W.orders).event,'orderDone');
  assert.equal(s.orders,2);
  assert.equal(s.gold,138);
  assert(!E.act(s,'repair',W.lantern).ok,'cannot repair remotely');
  const preview=action(s,'interact',W.lantern);
  assert.equal(preview.event,'repair');assert(preview.canRepair);
  assert(!s.repaired);assert.equal(s.gold,138,'opening panel never spends gold');
  assert.equal(action(s,'repair',W.lantern).event,'repairDone');
  assert(s.repaired);assert.equal(s.gold,53);
  assert.equal(action(s,'interact',W.lantern).event,'repair');
  assert(!E.act(s,'repair',W.lantern).ok);
  assert.equal(s.gold,53,'repair only once');
  assert.equal(action(s,'interact',W.crate).event,'ship');
  action(s,'ship',W.crate,'turnip');
  action(s,'ship',W.crate,'fish');
  assert.deepEqual([s.shipped.turnip,s.shipped.bean,s.shipped.fish],[1,0,1]);
  assert.equal(s.gold,53);
  overnight(s);
  assert.equal(s.lastNight.payout,37);assert.equal(s.gold,90);
  assert(Object.values(s.shipped).every(n=>n===0));
  assert.deepEqual(E.restore(JSON.parse(JSON.stringify(s))),s);
});
test('checkpoint restores only valid schemas and makes independent clones',()=>{
  const s=E.create(123);plant(s,at(9,10),'turnipSeed');
  const parsed=JSON.parse(JSON.stringify(s));
  const accepted=E.restore(parsed);assert.deepEqual(accepted,s);
  parsed.plots['9,10'].watered=false;
  assert.equal(accepted.plots['9,10'].watered,true);
  for(const change of [
    v=>delete v.plots['10,10'],v=>v.version++,
    v=>v.gold=-1,v=>v.energy=101,v=>v.minute=0,
    v=>v.inventory.fish=1.5,v=>v.shipped.bean=-1,
    v=>Object.assign(v.player,{x:19,y:7}),v=>v.plots['9,10'].growth=98,
    v=>v.plots['9,10'].crop='bogus',v=>v.repaired=true,
    v=>v.lastNight={day:2,payout:9}
  ]){
    const v=JSON.parse(JSON.stringify(s));change(v);assert.equal(E.restore(v),null);
  }
  assert.equal(E.restore(null),null);assert.equal(E.restore([]),null);
});

test('spring expansion: six independently seeded crops, row watering and generic shipping',()=>{
  const s=E.create('garden'),ids=Object.keys(E.CROPS).filter(id=>E.inSeason(id,'spring'));
  assert.equal(ids.length,6);
  for(const id of ids.slice(2)){
    const before=s.gold;
    assert.equal(action(s,'buySeed',W.shop,id).item,E.CROPS[id].seed);
    assert.equal(s.gold,before-E.CROPS[id].seedPrice);
  }
  for(const [i,id] of ids.entries()){
    const loc=at(6+i,10);
    action(s,'hoe',loc);
    assert.equal(action(s,'plant',loc,id).item,id);
  }
  const p=at(7,10);
  walk(s,p,true);const energy=s.energy,minute=s.minute;
  assert.equal(E.act(s,'waterRow',p).qty,3);
  assert.equal(s.energy,energy-6);
  assert.equal(s.minute,minute+18);
  assert(!E.act(s,'waterRow',p).ok);
  action(s,'waterRow',at(10,10));
  for(let day=1;day<=4;day++){
    overnight(s);
    if(day===4)break;
    if(!s.rain){
      for(const mid of [7,10]){
        walk(s,at(mid,10),true);
        E.act(s,'waterRow',at(mid,10));
      }
    }
  }
  for(const [i,id] of ids.entries())assert.equal(action(s,'interact',at(6+i,10)).item,id);
  assert(!E.act(s,'ship',W.crate,'lettuceSeed').ok);
  assert.equal(action(s,'ship',W.crate,'all').qty,6);
  const expected=ids.reduce((n,id)=>n+E.CROPS[id].sell,0);
  assert.equal(overnight(s).payout,expected);
});
test('ferry material route, shoal trip returning safely, species log, daily gathering reset',()=>{
  const s=E.create('ferry materials');
  const {SPRING:S}=E;
  assert(!E.ferryStatus(s).canMaterials);assert(!E.act(s,'sail',S.dock).ok);
  for(const source of S.gather.filter(row=>row.region==='valley')){
    const preview=action(s,'interact',source);
    assert.equal(preview.event,'gather');
    assert(preview.available);assert.equal(preview.source.id,source.id);
    assert.equal(action(s,'gather',source).qty,3);
    assert.equal(s.spring.gathered[source.id],1);
    assert(!E.act(s,'gather',source).ok);
  }
  assert.equal(s.spring.wood,6);
  assert(!E.ferryStatus(s).canMaterials);
  assert(!E.act(s,'repairFerry',W.orders,'materials').ok);
  overnight(s);overnight(s);
  assert(E.ferryStatus(s).canMaterials);
  assert.equal(action(s,'repairFerry',W.orders,'materials').event,'ferryRepaired');
  assert.equal(s.spring.wood,0);assert.equal(s.gold,50);
  assert.equal(action(s,'interact',S.dock).event,'ferry');
  assert.equal(action(s,'sail',S.dock).region,'shoal');
  assert(s.spring.visited);assert.equal(s.region,'shoal');
  assert.deepEqual(s.player,{x:6,y:9,dir:'right'});
  assert(E.isWalkable(5,9,'shoal'));assert(!E.isWalkable(2,9,'shoal'));
  assert(!E.act(s,'buySeed',W.shop,'bean').ok);assert(!E.act(s,'sleep',W.house).ok);
  const source=S.gather.find(row=>row.region==='shoal');
  assert.equal(action(s,'gather',source).qty,4);
  walk(s,at(3,9));
  assert.equal(E.act(s,'fish',at(2,9),.65).item,'shoalPerch');
  assert.equal(s.spring.fishCaught.shoalPerch,1);
  assert.deepEqual(E.restore(JSON.parse(JSON.stringify(s))),s);
  assert.equal(action(s,'sail',S.shoalDock).region,'valley');
  assert.equal(s.region,'valley');
  assert.equal(action(s,'ship',W.crate,'shoalPerch').qty,1);
  assert.equal(overnight(s).payout,E.FISH.shoalPerch.sell);
  const cedar=S.gather.find(row=>row.id==='cedar');
  assert(action(s,'interact',cedar).available);
  assert.equal(action(s,'gather',cedar).qty,3);
  assert.equal(s.spring.gathered.cedar,4);
});
test('ferry errand route, schedule windows, repeat talk and optional clock',()=>{
  const s=E.create('errands');
  const who=(id)=>E.npcs(s).find(n=>n.id===id);
  assert.deepEqual([who('farmer').x,who('farmer').y],[13,7]);
  assert.equal(E.act(s,'tick',null,99).minutes,30);
  for(let i=0;i<4;i++)assert.equal(E.act(s,'wait').minutes,60);
  assert.equal(s.minute,630);
  assert.deepEqual([who('farmer').x,who('farmer').y],[14,11]);
  assert(!E.isWalkable(14,11,s.region,s));
  action(s,'interact',who('farmer'));assert(!s.spring.errands[0]);
  const first=s.spring.relationships.farmer;
  action(s,'interact',who('farmer'));assert.equal(s.spring.relationships.farmer,first);
  overnight(s);overnight(s);
  assert(s.rain);
  assert.deepEqual([who('farmer').x,who('farmer').y],[10,7]);
  for(const id of ['farmer','shopkeeper']){
    const r=action(s,'interact',who(id));
    assert.equal(r.event,'dialogue');assert.equal(r.npc.id,id);assert(r.errand);
  }
  assert.deepEqual(s.spring.errands,[true,true]);
  assert(E.ferryStatus(s).canErrands);
  assert(!E.ferryStatus(s).canMaterials);
  assert.equal(action(s,'repairFerry',W.orders,'errands').route,'errands');
  assert.equal(s.gold,40);assert.equal(s.spring.wood,0);
  assert(!E.act(s,'repairFerry',W.orders,'errands').ok);
  s.minute=1319;
  assert.equal(E.act(s,'wait').minutes,1);assert.equal(s.minute,1320);
  assert.equal(E.act(s,'tick',null,1).minutes,0);
});
test('species depend on habitat, power, rain and time; milestone leaves day 8+ playable',()=>{
  const s=E.create('wet and dry');
  assert.equal(Object.keys(E.FISH).length,6);
  walk(s,at(16,7));
  assert.equal(E.act(s,'fish',at(17,7),.5).item,'fish');
  assert.equal(E.act(s,'fish',at(17,7),.69).item,'silverDace');
  assert.equal(E.act(s,'fish',at(17,7),.9).event,'miss');
  s.minute=690;
  assert.equal(E.act(s,'fish',at(17,7),.69).item,'fish');
  walk(s,at(24,12));
  assert.equal(E.act(s,'fish',at(24,13),.69).item,'pondCarp');
  overnight(s);overnight(s);assert(s.rain);
  walk(s,at(24,12));
  assert.equal(E.act(s,'fish',at(24,13),.69).item,'rainLoach');
  for(let d=4;d<=14;d++){
    const r=overnight(s);
    assert.equal(r.diary,d===7);
    assert.equal(E.calendar(s).firstWeekComplete,d>=7);
    assert.equal(E.calendar(s).day,d);
  }
  assert.equal(E.calendar(s).week,2);
  assert.equal(E.calendar(s).dayOfWeek,7);
  assert.equal(s.day,14);
  assert.deepEqual(E.restore(JSON.parse(JSON.stringify(s))),s);
});
test('v1 migration preserves a complete legacy checkpoint and starts new systems empty',()=>{
  const original=E.create('legacy migration'),clone=()=>JSON.parse(JSON.stringify(original));
  const old=clone();old.version=1;delete old.region;delete old.spring;
  old.day=6;old.minute=804;old.player={x:24,y:7,dir:'right'};old.rain=true;old.energy=41;old.gold=384;old.orders=1;
  for(const id of Object.keys(old.inventory))if(!['turnipSeed','beanSeed','turnip','bean','fish'].includes(id))delete old.inventory[id];
  for(const id of Object.keys(old.shipped))if(!['turnip','bean','fish'].includes(id))delete old.shipped[id];
  old.inventory.turnip=5;old.inventory.fish=3;old.shipped.bean=2;
  old.plots['12,11']={tilled:true,watered:true,crop:'bean',growth:2};
  old.journal.metFarmer=true;old.journal.fished=true;
  old.lastNight={day:6,payout:15,sold:{turnip:1,bean:0,fish:0},seedGift:0};
  const m=E.restore(old);
  assert(m);assert.equal(m.version,5);assert.equal(m.region,'valley');
  for(const k of ['seed','day','minute','rain','repaired','gold','energy','orders','player','plots','journal','movementSteps'])assert.deepEqual(m[k],old[k],k);
  for(const [id,qty] of Object.entries(old.inventory))assert.equal(m.inventory[id],qty);
  for(const [id,qty] of Object.entries(old.shipped))assert.equal(m.shipped[id],qty);
  assert.equal(m.inventory.mistberrySeed,0);
  assert.equal(m.spring.fishCaught.fish,3);
  assert(m.spring.met.farmer);assert(!m.spring.visited);assert(!m.spring.repaired);
  assert.equal(m.lastNight.payout,15);assert.equal(m.lastNight.sold.turnip,1);assert.equal(m.lastNight.sold.pondCarp,0);
  assert.equal(old.version,1,'do not mutate the source checkpoint');
  assert.deepEqual(E.restore(JSON.parse(JSON.stringify(m))),m);
  delete old.plots['10,10'];assert.equal(E.restore(old),null);
});

test('world expansion: linked doors are reachable and indoor actions preserve valley exits',()=>{
  const s=E.create('portals');
  const P=id=>E.PORTALS.find(p=>p.id===id);
  for(const p of E.PORTALS){
    assert(E.isWalkable(p.x,p.y,p.region));
    assert(E.isWalkable(p.spawn.x,p.spawn.y,p.to));
    assert(!E.PORTALS.some(q=>q.region===p.to&&same(q,p.spawn)),'arrival not on another auto-portal');
  }
  assert.deepEqual([E.REGIONS.town.width,E.REGIONS.town.height],[42,24]);
  assert.deepEqual([E.REGIONS.grove.width,E.REGIONS.grove.height],[44,26]);
  assert(E.isWalkable(41,23,'town'));assert(!E.isWalkable(42,23,'town'));
  assert(!E.isWalkable(8,4,'town'));assert(!E.isWalkable(23,10,'town'));
  assert(E.isWater(29,10,'grove'));assert(E.isWater(38,16,'grove'));assert(!E.isWater(39,16,'grove'));
  walk(s,at(28,8));assert(E.move(s,1,0));
  assert.equal(s.region,'town');assert.deepEqual(s.player,P('valleyTown').spawn);
  assert.equal(action(s,'travel',P('townGrove')).portal,'townGrove');assert.equal(s.region,'grove');
  assert.equal(action(s,'travel',P('groveTown')).portal,'groveTown');assert.deepEqual(s.player,P('groveTown').spawn);
  assert.equal(action(s,'travel',P('townValley')).portal,'townValley');assert.deepEqual(s.player,P('townValley').spawn);
  assert.equal(action(s,'interact',W.shop).event,'shop','valley interaction remains available');
  assert.equal(action(s,'travel',P('valleyStore')).portal,'valleyStore');
  assert.equal(action(s,'interact',E.OUTWORLD.counter).event,'shop');
  assert.equal(action(s,'buySeed',E.OUTWORLD.counter,'mistberry').item,'mistberrySeed');
  assert.equal(action(s,'travel',P('storeValley')).portal,'storeValley');assert.deepEqual(s.player,P('storeValley').spawn);
  assert.equal(action(s,'interact',W.house).event,'sleep','valley house can still open sleep menu');
  assert.equal(action(s,'travel',P('valleyHouse')).portal,'valleyHouse');
  assert.equal(action(s,'interact',E.OUTWORLD.bed).event,'sleep');
  assert.equal(action(s,'sleep',E.OUTWORLD.bed).event,'newDay');
  assert.equal(s.region,'house');assert.deepEqual(s.player,{x:9,y:8,dir:'down'});
  assert.equal(action(s,'travel',P('houseValley')).portal,'houseValley');assert.deepEqual(s.player,P('houseValley').spawn);
  for(const k of ['valley','town','grove','house','store'])assert(s.outworld.visited[k]);
  assert(!s.outworld.visited.shoal);
});
test('town workshop consumes ingredients once, matures overnight and makes sellable output',()=>{
  const s=E.create('workshop');
  s.inventory.turnip=3;s.inventory.fish=2;
  const P=id=>E.PORTALS.find(p=>p.id===id),shop=E.WORKSHOP;
  assert(!E.act(s,'workshopStart',shop,'driedTurnip').ok,'cannot start remotely from the valley');
  action(s,'travel',P('valleyTown'));
  assert.equal(action(s,'interact',shop).event,'workshop');
  assert(!E.act(s,'workshopStart',shop,'beanCake').ok,'ingredients needed');
  assert.equal(action(s,'workshopStart',shop,'driedTurnip').readyDay,2);
  assert.equal(s.inventory.turnip,1);
  assert(!E.act(s,'workshopStart',shop,'smokedFish').ok,'single shared slot');
  assert(!E.act(s,'workshopCollect',shop).ok,'not ready today');
  assert.deepEqual(E.restore(JSON.parse(JSON.stringify(s))),s);
  action(s,'travel',P('townValley'));overnight(s);
  action(s,'travel',P('valleyTown'));
  assert.equal(E.workshopStatus(s).ready,true);
  assert.equal(action(s,'workshopCollect',shop).item,'driedTurnip');
  assert.equal(s.inventory.driedTurnip,1);
  assert(!E.act(s,'workshopCollect',shop).ok,'no duplicated collection');
  action(s,'travel',P('townValley'));
  action(s,'ship',W.crate,'driedTurnip');
  assert.equal(overnight(s).payout,E.ITEMS.driedTurnip.sell);
});
test('grove destinations support unique fishing and four independent daily gathering points',()=>{
  const s=E.create('grove');
  const P=id=>E.PORTALS.find(p=>p.id===id);
  action(s,'travel',P('valleyTown'));action(s,'travel',P('townGrove'));
  for(const g of E.GROVE_GATHER){
    const r=action(s,'interact',g);assert.equal(r.source.id,g.id);assert(r.available);
    const collected=action(s,'gather',g);assert.equal(collected.item,g.item);assert.equal(collected.qty,g.qty);
    assert.equal(s.outworld.gathered[g.id],s.day);
    assert(!E.act(s,'gather',g).ok);
  }
  assert.equal(s.spring.wood,4);
  for(const g of E.GROVE_GATHER.filter(g=>g.item!=='wood'))assert.equal(s.inventory[g.item],1);
  walk(s,at(28,13));
  assert(!E.move(s,1,0));
  assert.equal(E.act(s,'fish',at(29,13),.7).item,'groveCrucian');
  assert.equal(s.spring.fishCaught.groveCrucian,1);
  assert.deepEqual(E.restore(JSON.parse(JSON.stringify(s))),s);
  action(s,'travel',P('groveTown'));action(s,'travel',P('townValley'));
  action(s,'ship',W.crate,'all');
  assert.equal(overnight(s).payout,E.ITEMS.groveCrucian.sell+
    E.ITEMS.wildHerb.sell+E.ITEMS.groveMushroom.sell+E.ITEMS.honeyFlower.sell);
});
test('v2 upgrade keeps inventory, spring and unlocked shoal checkpoint',()=>{
  const original=E.create('v2');
  original.day=8;original.gold=471;original.region='shoal';original.player={x:6,y:9,dir:'right'};
  Object.assign(original.spring,{repaired:true,visited:true,diary:true,wood:11,repairRoute:'materials',errands:[true,false]});
  original.spring.gathered.shoalwood=7;original.spring.relationships.ferryman=3;
  original.spring.fishCaught.shoalPerch=4;original.outworld.visited.shoal=true;
  original.inventory.shoalPerch=2;original.inventory.mistberrySeed=4;original.shipped.rainLoach=2;
  original.lastNight={day:8,payout:46,sold:{...original.shipped,shoalPerch:1},seedGift:0};
  original.plots['9,10']={tilled:true,watered:true,crop:'mistberry',growth:2};
  const v=JSON.parse(JSON.stringify(original));v.version=2;delete v.outworld;
  for(const id of ['groveCrucian','wildHerb','groveMushroom','honeyFlower','driedTurnip','beanCake','smokedFish']){
    delete v.inventory[id];delete v.shipped[id];delete v.lastNight.sold[id];
  }
  delete v.spring.fishCaught.groveCrucian;
  const m=E.restore(v);assert(m);
  assert.equal(m.version,5);assert.equal(m.region,'shoal');
  assert.deepEqual(m.player,v.player);
  assert.equal(m.gold,v.gold);
  assert.equal(m.inventory.shoalPerch,2);assert.equal(m.inventory.mistberrySeed,4);
  assert.equal(m.shipped.rainLoach,2);assert.equal(m.lastNight.sold.shoalPerch,1);
  assert.equal(m.plots['9,10'].crop,'mistberry');assert.equal(m.plots['9,10'].growth,2);
  assert.equal(m.spring.fishCaught.shoalPerch,4);assert.equal(m.spring.fishCaught.groveCrucian,0);
  assert.equal(m.spring.wood,11);assert.equal(m.spring.repairRoute,'materials');
  assert.deepEqual(m.outworld.workshop,{recipe:null,readyDay:null});
  assert(m.outworld.visited.shoal);assert(!m.outworld.visited.grove);
  assert.equal(E.restore({...v,region:'grove'}),null,'v2 never had a grove');
  assert.deepEqual(E.restore(JSON.parse(JSON.stringify(m))),m);
});

test('gifts use NPC taste, consume only eligible items, reset daily, and restore old saves',()=>{
  const s=E.create('gifts'),npc=id=>E.npcs(s).find(n=>n.id===id);
  s.inventory.turnip=2;s.inventory.bean=2;
  assert(E.GIFT_TASTES.farmer.includes('turnip'));assert(E.GIFT_ITEMS.includes('turnip'));
  assert(!E.act(s,'gift',npc('farmer'),'turnip').ok,'no remote gifting');
  walk(s,npc('farmer'),true);
  assert(!E.act(s,'gift',npc('farmer'),'turnipSeed').ok);
  const first=action(s,'gift',npc('farmer'),'turnip');
  assert.equal(first.event,'gift');assert.equal(first.points,3);assert(first.preferred);
  assert.equal(s.inventory.turnip,1);assert.equal(s.spring.relationships.farmer,3);
  assert(!E.act(s,'gift',npc('farmer'),'turnip').ok);
  assert.equal(s.inventory.turnip,1);
  const saved=E.restore(JSON.parse(JSON.stringify(s)));
  assert(saved);assert.equal(saved.outworld.gifted.farmer,1);
  assert(!E.act(saved,'gift',npc('farmer'),'bean').ok);
  overnight(s);
  const common=action(s,'gift',npc('farmer'),'bean');
  assert.equal(common.points,1);assert(!common.preferred);
  assert.equal(s.spring.relationships.farmer,4);
  const preview=JSON.parse(JSON.stringify(s));delete preview.outworld.gifted;
  assert.deepEqual(E.restore(preview).outworld.gifted,{});
});

test('all seasons follow deterministic 14-day periods and a full year rolls after day 56',()=>{
  const s=E.create('calendar and weather'),years=[],weatherTypes=new Set(),transitions=[];
  assert.equal(Object.keys(E.CROPS).length,12);
  assert.deepEqual(E.SEASONS,['spring','summer','autumn','winter']);
  assert.equal(E.SEASON_LENGTH,14);
  assert.equal(s.inventory.lettuceSeed,1);assert.equal(s.inventory.scallionSeed,1);
  function check(){
    const c=E.calendar(s);
    assert.equal(c.season,E.seasonForDay(s.day));
    assert.equal(c.seasonDay,1+(s.day-1)%14);
    assert.equal(c.daysLeft,14-c.seasonDay);
    assert.equal(c.seasonLength,14);
    assert.equal(c.week,Math.ceil(s.day/7));
    assert.equal(c.day,s.day);
    assert.equal(c.year,1+Math.floor((s.day-1)/56));
    const weather=E.weatherFor(s.seed,s.day);
    assert.equal(s.weather,weather);
    assert.equal(s.rain,weather==='rain');
    assert.equal(E.rainFor(s.seed,s.day),s.rain);
    if(weather==='snow')assert.equal(c.season,'winter');
    years.push(c.year);weatherTypes.add(weather);
  }
  check();
  for(let day=2;day<=71;day++){
    const r=overnight(s);check();
    if(r.seasonChange)transitions.push([day,r.seasonChange,Object.keys(r.seasonGift).length]);
  }
  assert.deepEqual(transitions,[[15,'summer',2],[29,'autumn',2],[43,'winter',2],[57,'spring',0],[71,'summer',0]]);
  assert.deepEqual([...new Set(weatherTypes)].sort(),['clear','fog','rain','snow']);
  assert.equal(years[55],1);assert.equal(years[56],2);
  for(const id of ['sunMelonSeed','riverPepperSeed','chestnutRootSeed','amberPumpkinSeed','frostCabbageSeed','snowLeekSeed'])
    assert.equal(s.inventory[id],1,'only one starter sample per season');
  assert.deepEqual(E.restore(JSON.parse(JSON.stringify(s))),s);
});
test('seasonal shop/plant checks, late planting, rollover preserves ripe crops and refunds immature seeds',()=>{
  let seed=0;
  while([12,13,14].some(day=>E.weatherFor(seed,day)==='rain'))seed++;
  const s=E.create(seed),plots=[at(8,10),at(9,10),at(10,10)];
  // Prepare lower-cost sample stock without changing clock/day.
  s.inventory.lettuceSeed=2;s.inventory.peaSeed=1;s.inventory.sunMelonSeed=1;
  walk(s,W.shop,true);
  assert(!E.act(s,'buySeed',W.shop,'sunMelon').ok);
  assert(E.act(s,'buyTurnip',W.shop).ok,'legacy default still available');
  while(s.day<12)overnight(s);
  for(const p of plots)action(s,'hoe',p);
  walk(s,plots[0],true);
  assert(!E.act(s,'plant',plots[0],'sunMelon').ok,'wrong season');
  assert(!E.act(s,'plant',plots[0],'pea').ok,'too few nights');
  assert.equal(s.inventory.peaSeed,1,'rejected planting never consumes a seed');
  action(s,'plant',plots[0],'lettuce');action(s,'plant',plots[1],'lettuce');action(s,'plant',plots[2],'bean');
  action(s,'water',plots[0]);overnight(s);action(s,'water',plots[0]);action(s,'water',plots[2]);overnight(s);
  assert.equal(s.day,14);
  assert.equal(s.plots['8,10'].growth,E.CROPS.lettuce.days);
  const r=overnight(s);assert.equal(s.day,15);assert.equal(r.seasonChange,'summer');
  assert.equal(s.plots['8,10'].crop,'lettuce','unharvested ripe crop survives');
  assert.equal(s.plots['9,10'].crop,null,'unripe seasonal crop withers');
  assert.equal(s.plots['9,10'].tilled,true);
  assert.equal(s.plots['10,10'].crop,'bean','all-season crop persists');
  assert.equal(s.inventory.lettuceSeed,1);assert.equal(r.returnedSeeds.lettuceSeed,1);
  assert.equal(action(s,'interact',plots[0]).item,'lettuce','ripe old crop remains harvestable');
  assert.equal(action(s,'plant',plots[1],'sunMelon').item,'sunMelon');
  walk(s,W.shop,true);assert(!E.act(s,'buySeed',W.shop,'lettuce').ok);
  assert.equal(action(s,'buySeed',W.shop,'riverPepper').item,'riverPepperSeed');
  while(s.day<56)overnight(s);
  assert(E.inSeason('turnip','winter'));assert(E.inSeason('bean','winter'));
  assert.equal(action(s,'plant',plots[0],'turnip').item,'turnip','old quest crops plant on last winter day');
});
test('v3 world checkpoint migrates stock, weather flag, and an incompatible old live crop without destruction',()=>{
  const orig=E.create('legacy late-season farm'),v=JSON.parse(JSON.stringify(orig));
  v.version=3;v.region='town';v.player={x:2,y:11,dir:'right'};
  v.day=43;v.rain=true;v.gold=312;delete v.weather;delete v.seasonGifts;
  v.outworld.visited.town=true;v.outworld.workshop={recipe:'driedTurnip',readyDay:44};
  v.outworld.gifted.farmer=42;v.spring.fishCaught.groveCrucian=2;
  v.inventory.groveCrucian=2;v.inventory.mistberrySeed=9;v.inventory.lettuce=3;v.shipped.beanCake=1;
  v.plots['9,10']={tilled:true,crop:'mistberry',growth:2,watered:true};
  const newCropIds=['sunMelon','riverPepper','amberPumpkin','chestnutRoot','frostCabbage','snowLeek'];
  for(const id of newCropIds){delete v.inventory[id];delete v.inventory[id+'Seed'];delete v.shipped[id];}
  const lastSpring=E.restore({...v,day:14,outworld:{...v.outworld,gifted:{},workshop:{recipe:null,readyDay:null}}});
  assert(lastSpring?.plots['9,10']?.legacy,'even still in season, previous rules let crops survive an arbitrary number of nights');
  action(lastSpring,'travel',E.PORTALS.find(p=>p.id==='townValley'));
  overnight(lastSpring);
  assert.equal(lastSpring.day,15);assert.equal(lastSpring.plots['9,10'].crop,'mistberry');
  assert.equal(lastSpring.plots['9,10'].growth,3,'old plant advances, but is not revoked at rollover');
  const s=E.restore(v);assert(s);
  assert.equal(s.version,5);assert.equal(s.day,43);assert.equal(s.weather,'rain');
  assert.equal(s.region,'town');assert.deepEqual(s.player,v.player);
  assert.equal(s.gold,312);assert.equal(s.inventory.mistberrySeed,9);assert.equal(s.inventory.lettuce,3);
  assert.equal(s.inventory.groveCrucian,2);assert.equal(s.inventory.snowLeekSeed,0);
  assert.equal(s.shipped.beanCake,1);assert.equal(s.spring.fishCaught.groveCrucian,2);
  assert.deepEqual(s.outworld,v.outworld);
  assert.equal(s.plots['9,10'].growth,2);assert(s.plots['9,10'].legacy);
  action(s,'travel',E.PORTALS.find(p=>p.id==='townValley'));
  overnight(s);assert.equal(s.plots['9,10'].growth,3);
  if(!s.rain)action(s,'water',at(9,10));
  overnight(s);
  assert.equal(action(s,'interact',at(9,10)).item,'mistberry');
  assert(!Object.hasOwn(s.plots['9,10'],'legacy'));
  assert.deepEqual(E.restore(JSON.parse(JSON.stringify(s))),s);
});

function ranchPortal(id){return E.PORTALS.find(p=>p.id===id);}
function ranchVisit(s){return action(s,'travel',ranchPortal('valleyBarn'));}
function ranchLeave(s){return action(s,'travel',ranchPortal('barnValley'));}
function gatherBuild(s){
  for(const source of E.SPRING.gather.filter(g=>g.region==='valley'))action(s,'gather',source);
  return action(s,'barnBuild',E.RANCH.site);
}
test('ranch gate is a walkable construction site until paid and then links both directions',()=>{
  const s=E.create('barn'),gate=ranchPortal('valleyBarn'),site=E.RANCH.site;
  assert.equal(E.portalEnabled(s,gate),false);
  assert.equal(E.isWalkable(site.x,site.y,'valley',s),true);
  walk(s,at(4,8));assert(E.move(s,-1,0));assert.equal(s.region,'valley');
  assert.deepEqual([s.player.x,s.player.y],[3,8]);
  assert.equal(E.act(s,'interact',site).event,'barnSite');
  assert(!E.act(s,'travel',gate).ok);
  assert(!E.act(s,'barnBuild',site).ok);
  assert.equal(gatherBuild(s).event,'barnBuilt');
  assert.equal(s.gold,15);assert.equal(s.spring.wood,0);
  assert.equal(s.ranch.hay,3);assert.equal(s.ranch.animals[0].species,'duck');
  assert.equal(s.ranch.level,1);assert.equal(E.ranchStatus(s).capacity,2);
  assert(!E.act(s,'barnBuild',site).ok);
  walk(s,at(4,8));assert(E.move(s,-1,0));assert.equal(s.region,'barn');
  assert.deepEqual(s.player,gate.spawn);
  assert.equal(action(s,'interact',E.RANCH.trough).event,'ranch');
  assert(!E.isWalkable(13,8,'barn'));assert(E.isWalkable(26,14,'barn'));
  assert.equal(ranchLeave(s).region,'valley');
  assert.deepEqual(s.player,ranchPortal('barnValley').spawn);
});
test('fed nights produce rewards, missed days pause, and animal goods process and sell',()=>{
  const s=E.create('animals'),t=E.RANCH.trough;
  gatherBuild(s);s.gold=200;ranchVisit(s);
  assert.equal(action(s,'animalBuy',t,'sheep').event,'animalBought');
  assert(!E.act(s,'animalBuy',t,'duck').ok,'base capacity is two');
  const [duck,sheep]=s.ranch.animals;
  assert.equal(action(s,'animalPet',t,duck.id).event,'animalPetted');
  assert.equal(duck.affection,2);assert(!E.act(s,'animalPet',t,duck.id).ok);
  for(const a of [duck,sheep])assert.equal(action(s,'animalFeed',t,a.id).event,'animalFed');
  assert(!E.act(s,'animalFeed',t,duck.id).ok);
  assert(!E.act(s,'animalCollect',t,duck.id).ok);
  assert.equal(s.ranch.hay,1);
  ranchLeave(s);overnight(s);ranchVisit(s);
  assert(duck.ready);assert(!sheep.ready);assert.equal(sheep.fedCycles,1);
  assert.equal(action(s,'animalCollect',t,duck.id).item,'duckEgg');
  assert(!E.act(s,'animalCollect',t,duck.id).ok);
  action(s,'animalFeed',t,duck.id);assert.equal(s.ranch.hay,0);
  ranchLeave(s);overnight(s);ranchVisit(s);walk(s,t,true);
  assert.equal(sheep.fedCycles,1,'missed day neither erases progress nor harms animal');
  assert.equal(sheep.affection,0);assert(!sheep.ready);assert(!E.act(s,'animalFeed',t,sheep.id).ok);
  assert(!E.act(s,'hayBuy',t,0).ok);assert(!E.act(s,'hayBuy',t,21).ok);
  const gold=s.gold;assert.equal(action(s,'hayBuy',t,3).qty,3);assert.equal(s.gold,gold-12);
  action(s,'animalFeed',t,sheep.id);
  assert.equal(action(s,'animalCollect',t,duck.id).item,'duckEgg');
  s.spring.wood=8;
  assert.equal(action(s,'barnUpgrade',t).event,'barnUpgraded');
  assert.equal(E.ranchStatus(s).capacity,5);assert.equal(s.spring.wood,0);
  assert(!E.act(s,'barnUpgrade',t).ok);
  ranchLeave(s);overnight(s);ranchVisit(s);walk(s,t,true);
  assert(sheep.ready);
  assert.equal(action(s,'animalCollect',t,sheep.id).item,'wool');
  assert.equal(s.inventory.wool,1);assert.equal(s.inventory.duckEgg,2);
  assert.deepEqual(E.restore(JSON.parse(JSON.stringify(s))),s);
  ranchLeave(s);action(s,'travel',ranchPortal('valleyTown'));
  action(s,'workshopStart',E.WORKSHOP,'saltedEgg');
  assert.equal(s.inventory.duckEgg,0);
  action(s,'travel',ranchPortal('townValley'));overnight(s);
  action(s,'travel',ranchPortal('valleyTown'));
  assert.equal(action(s,'workshopCollect',E.WORKSHOP).item,'saltedEgg');
  action(s,'travel',ranchPortal('townValley'));action(s,'ship',W.crate,'all');
  assert.equal(overnight(s).payout,E.ITEMS.saltedEgg.sell+E.ITEMS.wool.sell);
});
test('workshop water-tool upgrade is permanent and enlarges the row without excess energy cost',()=>{
  const s=E.create('watering'),center=at(9,10);
  assert(!E.act(s,'toolUpgrade',E.WORKSHOP).ok);
  s.spring.wood=4;
  action(s,'travel',ranchPortal('valleyTown'));
  assert.equal(action(s,'toolUpgrade',E.WORKSHOP).event,'toolUpgraded');
  assert.equal(s.gold,5);assert.equal(s.ranch.toolLevel,2);assert.equal(s.spring.wood,0);
  assert(!E.act(s,'toolUpgrade',E.WORKSHOP).ok);
  action(s,'travel',ranchPortal('townValley'));
  for(let x=7;x<=11;x++)action(s,'hoe',at(x,10));
  walk(s,center,true);const before=s.energy;
  assert.equal(E.act(s,'waterRow',center).qty,5);
  assert.equal(s.energy,before-5);
  assert(!E.act(s,'waterRow',center).ok);
  assert(Object.values(s.plots).filter(p=>p.watered).length===5);
  assert.equal(E.restore(JSON.parse(JSON.stringify(s))).ranch.toolLevel,2);
});
test('v4 migration preserves legacy assets; v5 save rejects inconsistent animal state',()=>{
  const s=E.create('season v4');s.day=31;s.gold=325;s.weather='fog';s.inventory.amberPumpkin=3;
  s.seasonGifts.autumn=true;s.region='grove';s.player={x:2,y:10,dir:'right'};s.outworld.visited.grove=true;
  s.outworld.workshop={recipe:'beanCake',readyDay:32};
  const old=JSON.parse(JSON.stringify(s));old.version=4;
  delete old.ranch;delete old.outworld.visited.barn;
  for(const k of ['duckEgg','wool','saltedEgg','woolYarn']){delete old.inventory[k];delete old.shipped[k];}
  const migrated=E.restore(old);
  assert(migrated);assert.equal(migrated.version,5);assert.equal(migrated.region,'grove');
  assert.equal(migrated.inventory.amberPumpkin,3);assert.equal(migrated.weather,'fog');assert.equal(migrated.gold,325);
  assert.deepEqual(migrated.outworld.workshop,old.outworld.workshop);
  assert.equal(migrated.inventory.duckEgg,0);assert.equal(migrated.ranch.built,false);assert.equal(migrated.ranch.toolLevel,1);
  assert.equal(migrated.outworld.visited.barn,false);
  assert.deepEqual(E.restore(migrated),migrated);
  const barn=E.create('invalid');gatherBuild(barn);ranchVisit(barn);
  const good=JSON.parse(JSON.stringify(barn));
  for(const mutate of [
    v=>v.ranch.built=false,v=>v.ranch.level=3,v=>v.ranch.hay=-1,
    v=>v.ranch.animals[0].fedDay=99,v=>v.ranch.animals[0].ready='true',
    v=>v.ranch.animals.push({...v.ranch.animals[0]})
  ]) {
    const v=JSON.parse(JSON.stringify(good));mutate(v);assert.equal(E.restore(v),null);
  }
});
