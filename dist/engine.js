(function (root,factory) {
  const engine=factory();
  if(typeof module==='object'&&module.exports)module.exports=engine;
  else root.MistEngine=engine;
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const WIDTH=30,HEIGHT=18,OPEN=360,CLOSE=1320,MAX_ENERGY=100,VERSION=5,REPAIR_COST=85;
  const freeze=Object.freeze;
  const WORLD=freeze({
    width:WIDTH,height:HEIGHT, farm:freeze({x1:5,x2:13,y1:10,y2:14}),
    house:freeze({x:7,y:7}), shop:freeze({x:24,y:7}), crate:freeze({x:10,y:8}),
    farmer:freeze({x:13,y:7}), shopkeeper:freeze({x:25,y:8}), orders:freeze({x:23,y:9}),
    lantern:freeze({x:27,y:5}), spawn:freeze({x:9,y:9}), bed:freeze({x:7,y:8})
  });
  const REGIONS=freeze({
    valley:freeze({name:'雾溪山谷',width:30,height:18}),
    shoal:freeze({name:'雾屿浅滩',width:30,height:18}),
    town:freeze({name:'雾溪镇',width:42,height:24}),
    grove:freeze({name:'苔影林',width:44,height:26}),
    house:freeze({name:'河畔农舍',width:30,height:18}),
    store:freeze({name:'溪口杂货铺',width:30,height:18}),
    barn:freeze({name:'河畔畜棚',width:30,height:18})
  });
  const portal=(id,region,x,y,to,sx,sy,dir,label,deckRows)=>
    freeze({id,region,x,y,to,spawn:freeze({x:sx,y:sy,dir}),label,
      ...(deckRows?{cells:freeze(deckRows.map(y=>freeze({x,y})))}:{})});
  const PORTALS=freeze([
    portal('valleyTown','valley',29,8,'town',2,11,'right','前往雾溪镇',[8,9]),
    portal('valleyHouse','valley',7,7,'house',14,13,'up','进入农舍'),
    portal('valleyStore','valley',24,7,'store',14,13,'up','进入杂货铺'),
    portal('townValley','town',0,11,'valley',28,8,'left','返回山谷',[10,11,12]),
    portal('townGrove','town',39,22,'grove',2,10,'right','前往苔影林'),
    portal('groveTown','grove',0,10,'town',39,21,'up','返回雾溪镇'),
    portal('houseValley','house',14,14,'valley',7,8,'down','离开农舍'),
    portal('storeValley','store',14,14,'valley',24,8,'down','离开杂货铺'),
    portal('valleyBarn','valley',3,8,'barn',14,13,'up','进入畜棚'),
    portal('barnValley','barn',14,14,'valley',3,9,'down','离开畜棚')
  ]);
  const TOWN_BLOCKS=freeze([[8,3,16,7],[20,4,27,8],[29,8,36,12],[7,15,14,20]].map(freeze));
  const OUTWORLD=freeze({
    bed:freeze({region:'house',x:8,y:7}),
    houseWake:freeze({region:'house',x:9,y:8}),
    counter:freeze({region:'store',x:16,y:7}),
    stall:freeze({region:'town',x:12,y:9}),
    grovePond:freeze({region:'grove',x1:29,y1:10,x2:38,y2:16})
  });
  const GROVE_GATHER=freeze([
    freeze({id:'groveDeadwood',name:'老枝木料',x:8,y:17,region:'grove',item:'wood',qty:4}),
    freeze({id:'wildHerb',name:'野雾香草',x:17,y:7,region:'grove',item:'wildHerb',qty:1}),
    freeze({id:'groveMushroom',name:'苔影蘑菇',x:24,y:19,region:'grove',item:'groveMushroom',qty:1}),
    freeze({id:'honeyFlower',name:'蜜露花',x:39,y:19,region:'grove',item:'honeyFlower',qty:1})
  ]);
  const FORAGE=freeze({
    wildHerb:freeze({name:'野雾香草',sell:19}),
    groveMushroom:freeze({name:'苔影蘑菇',sell:28}),
    honeyFlower:freeze({name:'蜜露花',sell:25})
  });
  const RANCH=freeze({
    site:freeze({region:'valley',x:3,y:8}),trough:freeze({region:'barn',x:13,y:8}),
    build:freeze({gold:55,wood:6}),upgrade:freeze({gold:75,wood:8}),toolUpgrade:freeze({gold:65,wood:4}),
    hayPrice:4,capacity:freeze({1:2,2:5}),maxHayPurchase:20
  });
  const ANIMALS=freeze({
    duck:freeze({id:'duck',name:'河鸭',price:45,product:'duckEgg',fedNights:1}),
    sheep:freeze({id:'sheep',name:'云绒羊',price:80,product:'wool',fedNights:2})
  });
  const RANCH_GOODS=freeze({
    duckEgg:freeze({name:'河鸭蛋',sell:17}),
    wool:freeze({name:'云绒羊毛',sell:39})
  });
  const PROCESSED=freeze({
    driedTurnip:freeze({name:'风干萝卜',sell:40}),
    beanCake:freeze({name:'豆香脆饼',sell:67}),
    smokedFish:freeze({name:'烟熏溪鱼',sell:56}),
    saltedEgg:freeze({name:'盐渍鸭蛋',sell:45}),
    woolYarn:freeze({name:'手捻毛线',sell:98})
  });
  const recipe=(id,input)=>freeze({id,name:PROCESSED[id].name,need:freeze({[input]:2}),output:id,qty:1,days:1});
  const WORKSHOP=freeze({region:'town',x:23,y:10,recipes:freeze({
    driedTurnip:recipe('driedTurnip','turnip'),beanCake:recipe('beanCake','bean'),smokedFish:recipe('smokedFish','fish'),
    saltedEgg:recipe('saltedEgg','duckEgg'),woolYarn:recipe('woolYarn','wool')
  })});
  const SEASON_LENGTH=14,SEASONS=freeze(['spring','summer','autumn','winter']);
  const SEASON_NAMES=freeze({spring:'春季',summer:'夏季',autumn:'秋季',winter:'冬季'});
  const WEATHERS=freeze(['clear','rain','snow','fog']);
  const SEASON_SAMPLES=freeze({
    spring:freeze({lettuceSeed:1,scallionSeed:1}),
    summer:freeze({sunMelonSeed:1,riverPepperSeed:1}),
    autumn:freeze({amberPumpkinSeed:1,chestnutRootSeed:1}),
    winter:freeze({frostCabbageSeed:1,snowLeekSeed:1})
  });
  const crop=(id,name,seedName,days,seedPrice,sell,seasons=['spring'])=>
    freeze({id,name,seed:id+'Seed',seedName,days,duration:days,seedPrice,sell,seasons:freeze([...seasons])});
  const CROPS=freeze({
    turnip:crop('turnip','萝卜','萝卜种子',2,8,15,SEASONS),
    bean:crop('bean','豆子','豆种',3,14,26,SEASONS),
    lettuce:crop('lettuce','露叶莴苣','莴苣种子',2,11,21),
    pea:crop('pea','翡翠豌豆','豌豆种子',3,17,34),
    mistberry:crop('mistberry','雾莓','雾莓种子',4,23,48),
    scallion:crop('scallion','青香葱','香葱种子',1,10,17),
    sunMelon:crop('sunMelon','金日甜瓜','甜瓜种子',4,26,60,['summer']),
    riverPepper:crop('riverPepper','溪红椒','红椒种子',2,15,31,['summer']),
    amberPumpkin:crop('amberPumpkin','琥珀南瓜','南瓜种子',4,28,64,['autumn']),
    chestnutRoot:crop('chestnutRoot','栗香根','栗香根种子',3,16,41,['autumn']),
    frostCabbage:crop('frostCabbage','霜心卷心菜','霜菜种子',3,18,43,['winter']),
    snowLeek:crop('snowLeek','雪脊葱','雪葱种子',2,13,27,['winter'])
  });
  const FISH=freeze({
    fish:freeze({name:'溪鱼',sell:22,habitat:'河流、池塘、浅滩'}),
    silverDace:freeze({name:'银鳞溪鲦',sell:31,habitat:'山谷溪流 · 10 点前'}),
    pondCarp:freeze({name:'赤尾池鲤',sell:36,habitat:'山谷池塘'}),
    rainLoach:freeze({name:'雨纹泥鳅',sell:39,habitat:'山谷水域 · 雨天'}),
    shoalPerch:freeze({name:'雾滩石鲈',sell:46,habitat:'雾屿浅滩'}),
    groveCrucian:freeze({name:'苔池金鲫',sell:42,habitat:'苔影林池塘'})
  });
  const ITEMS=freeze({
    ...Object.fromEntries(Object.values(CROPS).flatMap(c=>[
      [c.seed,freeze({name:c.seedName,buy:c.seedPrice,sell:0})],[c.id,freeze({name:c.name,sell:c.sell})]
    ])),
    ...FISH,...FORAGE,...PROCESSED,...RANCH_GOODS
  });
  const SPRING=freeze({
    dock:freeze({x:23,y:12,region:'valley'}), valleyArrival:freeze({x:22,y:11}),
    shoalDock:freeze({x:5,y:9,region:'shoal'}), shoalArrival:freeze({x:6,y:9}),
    gather:freeze([
      freeze({id:'cedar',name:'落枝堆',x:3,y:12,region:'valley',wood:3}),
      freeze({id:'driftwood',name:'溪边漂木',x:15,y:14,region:'valley',wood:3}),
      freeze({id:'shoalwood',name:'浅滩浮木',x:20,y:10,region:'shoal',wood:4})
    ]),
    materialsWood:6,materialsGold:20,errandsGold:30,errandsDay:3,
    diaryDay:7
  });
  const npcDefinitions=freeze({
    farmer:freeze({id:'farmer',name:'林禾',role:'farmer'}),
    shopkeeper:freeze({id:'shopkeeper',name:'苏芽',role:'shopkeeper'}),
    ferryman:freeze({id:'ferryman',name:'陆舟',role:'ferryman'})
  });
  const GIFT_TASTES=freeze({
    farmer:freeze(['turnip','lettuce','groveMushroom']),
    shopkeeper:freeze(['mistberry','honeyFlower','wildHerb']),
    ferryman:freeze(['fish','silverDace','pondCarp','rainLoach','shoalPerch','groveCrucian'])
  });
  const GIFT_ITEMS=freeze([...Object.keys(CROPS),...Object.keys(FISH),...Object.keys(FORAGE)]);
  const npcIds=Object.keys(npcDefinitions);
  const FISHING_BANDS=freeze({first:freeze([.27,.83]),normal:freeze([.36,.76])});
  const ORDERS=freeze([
    freeze({title:'农夫的午饭',description:'给农夫准备两根萝卜和一条溪鱼。',need:freeze({turnip:2,fish:1}),reward:30}),
    freeze({title:'溪灯的谢礼',description:'给修灯的人准备两份豆子和一条溪鱼。',need:freeze({bean:2,fish:1}),reward:52})
  ]);
  const inventoryKeys=Object.keys(ITEMS), productKeys=[...Object.keys(CROPS),...Object.keys(FISH),...Object.keys(FORAGE),...Object.keys(PROCESSED),...Object.keys(RANCH_GOODS)];
  const oldCropIds=['turnip','bean','lettuce','pea','mistberry','scallion'],
    oldSeeds=oldCropIds.map(id=>CROPS[id].seed),
    v2Fish=Object.keys(FISH).filter(id=>id!=='groveCrucian'),
    v2Products=[...oldCropIds,...v2Fish],v2Inventory=[...oldSeeds,...v2Products],
    v3Products=[...oldCropIds,...Object.keys(FISH),...Object.keys(FORAGE),'driedTurnip','beanCake','smokedFish'],
    v3Inventory=[...oldSeeds,...v3Products],
    v4Products=[...Object.keys(CROPS),...Object.keys(FISH),...Object.keys(FORAGE),'driedTurnip','beanCake','smokedFish'],
    v4Inventory=[...Object.values(CROPS).map(c=>c.seed),...v4Products];
  const legacyInventory=['turnipSeed','beanSeed','turnip','bean','fish'],legacyProducts=['turnip','bean','fish'];
  const journalKeys=['metFarmer','tilled','planted','watered','harvested','fished','shipped','bought','slept','ordered','visitedLantern'];
  const tiles=['house','shop','crate','orders','lantern'];
  const shopTiles=['shop','shopkeeper'];
  const directions=freeze({'0,-1':'up','0,1':'down','-1,0':'left','1,0':'right'});
  const targetKeys={house:'house',shop:'shop',crate:'crate',ship:'crate',farmer:'farmer',shopkeeper:'shopkeeper',orders:'orders',order:'orders',lantern:'lantern',repair:'lantern',sleep:'house'};
  const harvestedProducts=Object.fromEntries(productKeys.map(id=>[id,0]));
  const key=(x,y)=>x+','+y;
  const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
  function inBounds(x,y,region='valley'){
    const map=Object.prototype.hasOwnProperty.call(REGIONS,region)?REGIONS[region]:null;
    return !!map&&integer(x,0,map.width-1)&&integer(y,0,map.height-1);
  }
  function isWater(x,y,region='valley'){
    if(!inBounds(x,y,region))return false;
    if(region==='shoal')return x<=2||x>=26||y<=3||y>=15;
    if(region==='grove')return x>=29&&x<=38&&y>=10&&y<=16;
    if(region!=='valley')return false;
    return (x>=17&&x<=19&&y!==8&&y!==9)||(x>=23&&x<=27&&y>=12&&y<=15&&!(y===12&&x<=25));
  }
  const within=(x,y,a,b,c,d)=>x>=a&&x<=c&&y>=b&&y<=d;
  function isWalkable(x,y,region='valley',state=null) {
    if(!inBounds(x,y,region)||isWater(x,y,region))return false;
    if(resolvePortal(region,{x,y}))return true;
    if(region==='shoal'||region==='grove')return true;
    if(region==='town'){
      return !TOWN_BLOCKS.some(rect=>within(x,y,...rect))&&
        !(x===WORKSHOP.x&&y===WORKSHOP.y)&&!(x===OUTWORLD.stall.x&&y===OUTWORLD.stall.y);
    }
    if(region==='barn')return within(x,y,3,3,26,14)&&!same(RANCH.trough,{x,y});
    if(region==='house'||region==='store'){
      return within(x,y,3,3,26,14)&&!(region==='house'?within(x,y,6,5,10,7):within(x,y,15,5,20,7));
    }
    if(state&&npcAt(state,{x,y}))return false;
    if(y>=3&&y<=6&&((x>=4&&x<=9)||(x>=22&&x<=26)))return false;
    return !['crate','orders','lantern'].some(n=>x===WORLD[n].x&&y===WORLD[n].y);
  }
  function fishermanWater(x,y,region){
    if(!inBounds(x,y,region)||isWater(x,y,region))return false;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&isWater(x+dx,y+dy,region))return true;
    return false;
  }
  const near=(p,t)=>Math.max(Math.abs(p.x-t.x),Math.abs(p.y-t.y))<=1;
  function seedNumber(value){
    if(Number.isFinite(value))return value>>>0;
    if(typeof value!=='string')return 0x2f9b07ad;
    let code=2166136261;
    for(let i=0;i<value.length;i++)code=Math.imul(code^value.charCodeAt(i),16777619);
    return code>>>0;
  }
  function seasonForDay(day){
    return SEASONS[Math.floor(Math.max(0,(integer(day,1)?day:1)-1)/SEASON_LENGTH)%SEASONS.length];
  }
  function inSeason(id,season){return !!getCrop(id)?.seasons.includes(season);}
  function seasonRemaining(day){return SEASON_LENGTH-1-(day-1)%SEASON_LENGTH;}
  function hasPlantingTime(crop,day){return crop.seasons.length===SEASONS.length||seasonRemaining(day)>=crop.days;}
  function weatherRoll(seed,day){
    let x=Math.imul(seedNumber(seed)^Math.imul(day,0x9e3779b9),0x85ebca6b);
    x=Math.imul(x^x>>>13,0xc2b2ae35);
    return ((x^x>>>16)>>>0)%100;
  }
  function weatherFor(seed,day){
    if(day<=2)return 'clear';
    if(day===3)return 'rain';
    const roll=weatherRoll(seed,day);
    switch(seasonForDay(day)){
      case 'summer':return roll<33?'rain':roll<38?'fog':'clear';
      case 'autumn':return roll<22?'rain':roll<45?'fog':'clear';
      case 'winter':return roll<38?'snow':roll<53?'fog':roll<56?'rain':'clear';
      default:return roll<26?'rain':roll<34?'fog':'clear';
    }
  }
  function rainFor(seed,day){return weatherFor(seed,day)==='rain';}
  function emptyPlots(){
    const plots={};
    for(let y=WORLD.farm.y1;y<=WORLD.farm.y2;y++)for(let x=WORLD.farm.x1;x<=WORLD.farm.x2;x++){
      plots[key(x,y)]={tilled:false,crop:null,growth:0,watered:false};
    }
    return plots;
  }
  function emptyJournal(){return Object.fromEntries(journalKeys.map(k=>[k,false]));}
  function freshSpring(){
    return {wood:0,repaired:false,visited:false,errands:[false,false],
      relationships:Object.fromEntries(npcIds.map(id=>[id,0])),met:Object.fromEntries(npcIds.map(id=>[id,false])),
      gathered:{},lastTalk:{},diary:false,repairRoute:null,fishCaught:Object.fromEntries(Object.keys(FISH).map(id=>[id,0]))};
  }
  function freshOutworld(){
    return {visited:Object.fromEntries(Object.keys(REGIONS).map(id=>[id,id==='valley'])),gathered:{},gifted:{},workshop:{recipe:null,readyDay:null}};
  }
  function freshRanch(){return {built:false,level:0,hay:0,animals:[],toolLevel:1,nextAnimal:1};}
  function create(seed){
    return {
      version:VERSION,seed:seedNumber(seed),day:1,minute:OPEN,weather:'clear',rain:false,repaired:false,gold:70,energy:MAX_ENERGY,
      player:{...WORLD.spawn,dir:'down'},plots:emptyPlots(),
      inventory:{...Object.fromEntries(inventoryKeys.map(id=>[id,0])),turnipSeed:5,beanSeed:3,...SEASON_SAMPLES.spring},shipped:{...harvestedProducts},orders:0,
      region:'valley',spring:freshSpring(),outworld:freshOutworld(),ranch:freshRanch(),
      seasonGifts:{spring:true,summer:false,autumn:false,winter:false},
      journal:emptyJournal(),lastNight:null,movementSteps:0
    };
  }
  function same(a,b){return !!a&&!!b&&a.x===b.x&&a.y===b.y;}
  function npcs(state){
    const evening=state.minute>=1020,mid=state.minute>=630,season=seasonForDay(state.day);
    const farmMid=season==='summer'?{x:14,y:12}:season==='autumn'?{x:15,y:12}:{x:14,y:11};
    const sheltered=state.rain||state.weather==='snow'||season==='winter';
    return [
      {...npcDefinitions.farmer,region:'valley',...(sheltered||evening?{x:10,y:7}:mid?farmMid:WORLD.farmer)},
      {...npcDefinitions.shopkeeper,region:'valley',...(sheltered||evening||!mid?WORLD.shopkeeper:{x:25,y:10})},
      {...npcDefinitions.ferryman,region:'valley',...(sheltered||evening||!mid?{x:22,y:12}:{x:24,y:11})}
    ];
  }
  const npcAt=(state,p)=>npcs(state).find(n=>n.region===state.region&&same(n,p));
  const regionDock=state=>state.region==='shoal'?SPRING.shoalDock:state.region==='valley'?SPRING.dock:null;
  const allGather=[...SPRING.gather,...GROVE_GATHER];
  const gatherAt=(state,t)=>allGather.find(a=>a.region===state.region&&same(a,t));
  const gatherLog=(state,source)=>source.region==='grove'?state.outworld.gathered:state.spring.gathered;
  const portalCells=p=>p.cells||[p];
  function resolvePortal(region,tile){
    if(!tile||(tile.region&&tile.region!==region))return undefined;
    return PORTALS.find(p=>p.region===region&&portalCells(p).some(entry=>same(entry,tile)));
  }
  const portalAt=(state,tile)=>resolvePortal(state.region,tile);
  const nearPortal=(position,p)=>portalCells(p).some(entry=>near(position,entry));
  function targetNear(state,t){
    const p=portalAt(state,t);
    return p?nearPortal(state.player,p):near(state.player,t);
  }
  function portalEnabled(state,p){return !!p&&(p.id!=='valleyBarn'||!!state.ranch?.built);}
  function namedPlace(state,id){
    if(id==='dock'||id==='ferry')return regionDock(state);
    if(id==='workshop'&&state.region==='town')return WORKSHOP;
    if((id==='barnSite'||id==='barn')&&state.region==='valley')return RANCH.site;
    if((id==='trough'||id==='ranch')&&state.region==='barn')return RANCH.trough;
    if((id==='house'||id==='sleep'||id==='bed')&&state.region==='house')return OUTWORLD.bed;
    if((id==='shop'||id==='counter')&&state.region==='store')return OUTWORLD.counter;
    if((id==='shop'||id==='stall')&&state.region==='town')return OUTWORLD.stall;
    if(npcIds.includes(id))return npcs(state).find(n=>n.id===id&&n.region===state.region)||null;
    if(state.region==='valley'&&Object.prototype.hasOwnProperty.call(targetKeys,id))return WORLD[targetKeys[id]];
    return null;
  }
  function targetPoint(state,value,filter){
    if(typeof value==='string'){
      const special=namedPlace(state,value)||allGather.find(a=>a.id===value&&a.region===state.region)||
        PORTALS.find(p=>p.id===value&&p.region===state.region);
      if(special)return special;
      const matched=/^(\d{1,2}),(\d{1,2})$/.exec(value);
      if(matched){
        const x=Number(matched[1]),y=Number(matched[2]);
        return inBounds(x,y,state.region)?{x,y}:null;
      }
      return null;
    }
    if(Array.isArray(value)){
      const [x,y]=value;
      return inBounds(x,y,state.region)?{x,y}:null;
    }
    if(value&&typeof value==='object')return (!value.region||value.region===state.region)&&inBounds(value.x,value.y,state.region)?value:null;
    if(value!==undefined&&value!==null)return null;
    if(filter){
      const choices=filter.map(id=>namedPlace(state,id)).filter(t=>t&&near(state.player,t));
      choices.sort((a,b)=>Math.abs(a.x-state.player.x)+Math.abs(a.y-state.player.y)-Math.abs(b.x-state.player.x)-Math.abs(b.y-state.player.y));
      return choices[0]||null;
    }
    const d=state.player.dir,p=state.player;
    return {x:p.x+(d==='right'?1:d==='left'?-1:0),y:p.y+(d==='down'?1:d==='up'?-1:0)};
  }
  function objectAt(state,p){
    if(!p)return null;
    if(same(p,regionDock(state)))return 'dock';
    if(state.region==='valley'&&same(p,RANCH.site)&&!state.ranch.built)return 'barnSite';
    if(state.region==='barn'&&same(p,RANCH.trough))return 'trough';
    if(gatherAt(state,p))return 'gather';
    if(state.region==='house'&&same(p,OUTWORLD.bed))return 'house';
    if(state.region==='store'&&same(p,OUTWORLD.counter)||state.region==='town'&&same(p,OUTWORLD.stall))return 'shop';
    if(state.region==='town'&&same(p,WORKSHOP))return 'workshop';
    const npc=npcAt(state,p);
    if(npc)return npc.id;
    const legacy=state.region==='valley'&&tiles.find(id=>same(WORLD[id],p));
    return legacy||(portalAt(state,p)?'portal':null);
  }
  function contextObject(state,target,allowed){
    const t=targetPoint(state,target,allowed),obj=objectAt(state,t);
    return obj&&allowed.includes(obj)&&near(state.player,t)?obj:null;
  }
  function enterPortal(state,p){
    state.region=p.to;state.player={...p.spawn};state.movementSteps=0;
    state.outworld.visited[p.to]=true;advance(state,8);
    return yes(p.label+'。','travel',{region:p.to,portal:p.id});
  }
  function travel(state,target){
    const t=targetPoint(state,target);
    const p=portalAt(state,t)||(target==null?PORTALS.find(q=>q.region===state.region&&nearPortal(state.player,q)):null);
    if(!p||!nearPortal(state.player,p))return no('走到入口附近再前往。');
    if(!portalEnabled(state,p))return no('这里还没有畜棚，先动工建好再进去。','barnSite');
    return enterPortal(state,p);
  }
  function advance(state,minutes){state.minute=Math.min(CLOSE,state.minute+minutes);}
  function move(state,dx,dy){
    const dir=directions[key(dx,dy)];
    if(!dir||typeof dx!=='number'||typeof dy!=='number')return false;
    state.player.dir=dir;
    const x=state.player.x+dx,y=state.player.y+dy;
    if(!isWalkable(x,y,state.region,state))return false;
    state.player.x=x;state.player.y=y;
    state.movementSteps=(state.movementSteps+1)%3;
    if(state.movementSteps===0)advance(state,4);
    const entrance=portalAt(state,{x,y});
    if(portalEnabled(state,entrance))enterPortal(state,entrance);
    return true;
  }
  function result(ok,msg,event,extra){
    return Object.assign({ok,msg},event?{event}:null,extra||null);
  }
  const no=(msg,event,extra)=>result(false,msg,event,extra);
  const yes=(msg,event,extra)=>result(true,msg,event,extra);
  function work(state,energy,minute){
    if(state.energy<energy)return false;
    state.energy-=energy;advance(state,minute);
    return true;
  }
  const tired=()=>no('体力不够了。回农舍休息，明天就会恢复。');
  function calendar(state){
    const week=Math.floor((state.day-1)/7)+1,dayOfWeek=(state.day-1)%7+1,weekdays=['一','二','三','四','五','六','日'];
    const season=seasonForDay(state.day),seasonName=SEASON_NAMES[season],seasonDay=(state.day-1)%SEASON_LENGTH+1,
      year=Math.floor((state.day-1)/(SEASON_LENGTH*SEASONS.length))+1,daysLeft=seasonRemaining(state.day);
    return {season,seasonName,day:state.day,week,dayOfWeek,year,seasonDay,seasonLength:SEASON_LENGTH,daysLeft,
      weekday:'周'+weekdays[dayOfWeek-1],label:'第 '+year+' 年 · '+seasonName+'第 '+seasonDay+' 天',firstWeekComplete:state.spring.diary};
  }
  function ferryStatus(state){
    const sp=state.spring,materialWood=Math.max(0,SPRING.materialsWood-sp.wood),
      materialGold=Math.max(0,SPRING.materialsGold-state.gold),errandGold=Math.max(0,SPRING.errandsGold-state.gold);
    return {repaired:sp.repaired,visited:sp.visited,wood:sp.wood,gold:state.gold,errands:[...sp.errands],
      region:state.region,materialWood,materialGold,errandGold,
      canMaterials:!sp.repaired&&state.day>=SPRING.errandsDay&&!materialWood&&!materialGold,
      canErrands:!sp.repaired&&state.day>=SPRING.errandsDay&&sp.errands.every(Boolean)&&!errandGold,
      materials:{wood:SPRING.materialsWood,gold:SPRING.materialsGold,missingWood:materialWood,missingGold:materialGold},
      errandRoute:{gold:SPRING.errandsGold,startDay:SPRING.errandsDay,met:sp.errands.filter(Boolean).length}};
  }
  function talk(state,id){
    const npc=npcs(state).find(a=>a.id===id),sp=state.spring,first=!sp.met[id];
    sp.met[id]=true;
    if(id==='farmer')state.journal.metFarmer=true;
    if(sp.lastTalk[id]!==state.day){sp.lastTalk[id]=state.day;sp.relationships[id]++;}
    const errandIndex=id==='farmer'?0:id==='shopkeeper'?1:-1;
    const didErrand=errandIndex>=0&&state.day>=SPRING.errandsDay&&!sp.repaired&&!sp.errands[errandIndex];
    if(didErrand){
      sp.errands[errandIndex]=true;
      return yes(id==='farmer'?'把旧船的绳索清单交给你了。跟苏芽核对一下，就能凑齐修船的物件。':'仓里还留着旧船的船钉。和林禾核对过绳索后，就可以去修船。','dialogue',{npc,errand:true});
    }
    if(id==='ferryman'){
      return yes(sp.repaired?'船修好了。到码头就能出发，雾屿的岸边有山谷里少见的鱼。':
        '旧船缺木料。带六份木头和二十金，或者从第三天起分别去找林禾、苏芽帮忙。','dialogue',{npc});
    }
    if(id==='shopkeeper'){
      const cal=calendar(state);
      return yes('商店有'+cal.seasonName+'种子。萝卜和豆种全年都有；换季前记得算一算剩余的生长天数。','dialogue',{npc});
    }
    if(first)return yes('欢迎来雾溪！先翻土、播种，再浇水。河对岸的订单板上有我们需要的东西。','dialogue',{npc});
    if(state.repaired)return yes('这盏灯又照亮溪水了。谢谢你把这里照顾得这么好。','dialogue',{npc});
    const season=seasonForDay(state.day);
    if(season==='winter')return yes('冬天我在屋檐下，霜菜和雪葱耐冷，萝卜、豆子也照样能种。','dialogue',{npc});
    if(season==='summer')return yes('夏天的甜瓜需要四晚；临近换季，不妨改种长得快的溪红椒。','dialogue',{npc});
    if(season==='autumn')return yes('秋天到了。琥珀南瓜和栗香根成熟后，即使过季也能采收。','dialogue',{npc});
    return yes(state.rain?'下雨的时候不用浇水。到码头等一等，雨天偶尔会遇到泥鳅。':
      state.day<3?'浇过水的地，过一夜就长一截。':'记得留两根萝卜和两份豆子交订单。剩下的都能出货。','dialogue',{npc});
  }
  function gift(state,target,item){
    const id=contextObject(state,target,npcIds);
    if(!id)return no('靠近村民再送礼。');
    if(!GIFT_ITEMS.includes(item))return no('可以送作物、鱼或林中采到的野物。');
    if(state.outworld.gifted[id]===state.day)return no('今天已经送过一份礼物了。');
    if(state.inventory[item]<1)return no('背包里没有这件礼物。');
    const npc=npcs(state).find(n=>n.id===id),preferred=GIFT_TASTES[id].includes(item),points=preferred?3:1;
    state.inventory[item]--;state.outworld.gifted[id]=state.day;
    state.spring.met[id]=true;state.spring.relationships[id]+=points;
    if(id==='farmer')state.journal.metFarmer=true;
    advance(state,5);
    return yes(preferred?npc.name+'很喜欢这份礼物。':npc.name+'收下了礼物，谢谢你。','gift',{npc,item,points,preferred});
  }
  function repairFerry(state,target,method){
    if(state.region!=='valley'||!contextObject(state,target,['orders','dock','ferryman']))return no('在溪边码头、委托板或陆舟旁才能修船。');
    if(state.spring.repaired)return no('旧船已经修好了。');
    if(state.day<SPRING.errandsDay)return no('春日第 '+SPRING.errandsDay+' 天开放修船委托。');
    const status=ferryStatus(state);
    if(method==='materials'){
      if(!status.canMaterials)return no('修船要 '+SPRING.materialsWood+' 份木料和 '+SPRING.materialsGold+' 金。');
      state.spring.wood-=SPRING.materialsWood;state.gold-=SPRING.materialsGold;
    }else if(method==='errands'){
      if(!status.canErrands)return no('从第三天起各找林禾和苏芽聊一次，再准备 '+SPRING.errandsGold+' 金。');
      state.gold-=SPRING.errandsGold;
    }else return no('选一种修船办法：自己备料，或请村民帮忙。');
    state.spring.repaired=true;state.spring.repairRoute=method;advance(state,26);
    return yes('渡船修好了！从溪边码头就能去雾屿。','ferryRepaired',{route:method,status:ferryStatus(state)});
  }
  function sail(state,target){
    if(!contextObject(state,target,['dock']))return no('请走到码头再登船。');
    if(!state.spring.repaired)return no('渡船还没修好。');
    const next=state.region==='valley'?'shoal':'valley',arrival=next==='shoal'?SPRING.shoalArrival:SPRING.valleyArrival;
    advance(state,22);
    state.region=next;state.player={...arrival,dir:next==='shoal'?'right':'down'};state.movementSteps=0;
    state.outworld.visited[next]=true;
    if(next==='shoal')state.spring.visited=true;
    return yes(next==='shoal'?'抵达雾屿。岸边可以钓雾滩石鲈，草坡上能捡浮木。':'回到山谷渡口。','sail',{region:next});
  }
  function gather(state,target){
    let t=targetPoint(state,target);
    if(target===undefined||target===null){
      t=gatherAt(state,t)||allGather.find(a=>a.region===state.region&&near(state.player,a));
    }
    const source=gatherAt(state,t);
    if(!source||!near(state.player,source))return no('靠近资源点再采集。');
    const log=gatherLog(state,source);
    if(log[source.id]===state.day)return no('今天这一处已经采过了，明天再来。');
    if(!work(state,3,12))return tired();
    const item=source.item||'wood',qty=source.qty??source.wood;
    log[source.id]=state.day;
    if(item==='wood')state.spring.wood+=qty;
    else state.inventory[item]+=qty;
    return yes('捡到了 '+qty+' 份'+(item==='wood'?'木料':ITEMS[item].name)+'。','gathered',{item,qty,source:source.id});
  }
  function waterRow(state,target){
    const t=targetPoint(state,target);
    if(state.region!=='valley'||!t||!state.plots[key(t.x,t.y)]||!near(state.player,t))return no('在农田里选择一格相邻的田地。');
    if(state.rain)return no('今天有阵雨，不用浇灌。');
    const improved=state.ranch.toolLevel===2;
    const row=(improved?[-2,-1,0,1,2]:[-1,0,1]).map(dx=>state.plots[key(t.x+dx,t.y)]).filter(p=>p?.tilled&&!p.watered&&(!p.crop||p.growth<CROPS[p.crop].days));
    if(!row.length)return no('这一排没有还需要浇水的田格。');
    if(!work(state,(improved?1:2)*row.length,6+4*row.length))return tired();
    row.forEach(p=>{p.watered=true;});state.journal.watered=true;
    return yes('浇灌了 '+row.length+' 格田地。','water',{qty:row.length});
  }
  function workshopStatus(state){
    const w=state.outworld.workshop;
    return {recipe:w.recipe,readyDay:w.readyDay,ready:!!w.recipe&&state.day>=w.readyDay,recipes:WORKSHOP.recipes};
  }
  function workshopStart(state,target,id){
    if(!contextObject(state,target,['workshop']))return no('到雾溪镇的风干工坊再处理。');
    const recipes=WORKSHOP.recipes,r=typeof id==='string'&&Object.prototype.hasOwnProperty.call(recipes,id)?recipes[id]:null;
    if(!r)return no('请选择一种可以制作的加工品。');
    if(state.outworld.workshop.recipe)return no('加工台上已有一份东西。等它做好，再来取走。');
    if(Object.entries(r.need).some(([item,qty])=>state.inventory[item]<qty))return no('背包里的原料不够。每次需要两份。');
    for(const [item,qty] of Object.entries(r.need))state.inventory[item]-=qty;
    state.outworld.workshop={recipe:id,readyDay:state.day+r.days};
    advance(state,20);
    return yes('开始加工'+r.name+'。睡过一夜，明天就能来取。','workshopStarted',{recipe:id,readyDay:state.day+r.days});
  }
  function workshopCollect(state,target){
    if(!contextObject(state,target,['workshop']))return no('回到镇上的风干工坊领取。');
    const status=workshopStatus(state);
    if(!status.recipe)return no('加工台是空的。');
    if(!status.ready)return no('这份加工品明天才会完成。');
    const r=WORKSHOP.recipes[status.recipe];
    state.inventory[r.output]+=r.qty;state.outworld.workshop={recipe:null,readyDay:null};advance(state,8);
    return yes('领到了'+r.name+'。可以拿回农场出货。','workshopCollected',{item:r.output,qty:r.qty});
  }
  function ranchStatus(state){
    const {built,level,hay,animals,toolLevel}=state.ranch;
    const afford=cost=>state.gold>=cost.gold&&state.spring.wood>=cost.wood;
    return {built,level,hay,animals,toolLevel,capacity:RANCH.capacity[level]||0,
      canBuild:!built&&afford(RANCH.build),canUpgrade:built&&level===1&&afford(RANCH.upgrade),
      canToolUpgrade:toolLevel===1&&afford(RANCH.toolUpgrade)};
  }
  function ranchCharge(state,cost){
    if(state.gold<cost.gold||state.spring.wood<cost.wood)return false;
    state.gold-=cost.gold;state.spring.wood-=cost.wood;return true;
  }
  function addAnimal(state,species){
    const suffix=state.ranch.nextAnimal++,type=ANIMALS[species];
    const a={id:species+'-'+suffix,species,name:type.name+' '+suffix,fedDay:0,petDay:0,affection:0,ready:false,fedCycles:0};
    state.ranch.animals.push(a);return a;
  }
  function barnBuild(state,target){
    if(state.ranch.built)return no('畜棚已经建好了。');
    if(!contextObject(state,target,['barnSite']))return no('到西岸的畜棚工地再动工。');
    if(!ranchCharge(state,RANCH.build))return no('建畜棚需要 '+RANCH.build.gold+' 金和 '+RANCH.build.wood+' 份木料。');
    state.ranch.built=true;state.ranch.level=1;state.ranch.hay=3;
    const a=addAnimal(state,'duck');
    advance(state,28);
    return yes('畜棚建好了！领到一只河鸭和三份干草，可以进棚照料它。','barnBuilt',{animal:a.id});
  }
  function barnUpgrade(state,target){
    if(!state.ranch.built||!contextObject(state,target,['trough']))return no('进畜棚，到食槽旁再扩建。');
    if(state.ranch.level===2)return no('畜棚已经扩到最大。');
    if(!ranchCharge(state,RANCH.upgrade))return no('扩建需要 '+RANCH.upgrade.gold+' 金和 '+RANCH.upgrade.wood+' 份木料。');
    state.ranch.level=2;advance(state,22);
    return yes('畜棚扩建好了，现在能养 '+RANCH.capacity[2]+' 只牲畜。','barnUpgraded');
  }
  function toolUpgrade(state,target){
    if(!contextObject(state,target,['workshop']))return no('到镇上的加工坊升级水壶。');
    if(state.ranch.toolLevel===2)return no('水壶已经升级了。');
    if(!ranchCharge(state,RANCH.toolUpgrade))return no('水壶升级需要 '+RANCH.toolUpgrade.gold+' 金和 '+RANCH.toolUpgrade.wood+' 份木料。');
    state.ranch.toolLevel=2;advance(state,22);
    return yes('水壶升级好了！一次浇五格，每格只耗一点体力。','toolUpgraded');
  }
  function ranchAnimal(state,action,target,value){
    const r=state.ranch;
    if(!r.built||!contextObject(state,target,['trough']))return no('走到畜棚食槽旁再照料牲畜。');
    if(action==='animalBuy'){
      const def=typeof value==='string'&&Object.prototype.hasOwnProperty.call(ANIMALS,value)?ANIMALS[value]:null;
      if(!def)return no('可以领养河鸭或云绒羊。');
      if(r.animals.length>=RANCH.capacity[r.level])return no('畜棚没有空位，先扩建再领养。');
      if(state.gold<def.price)return no('领养'+def.name+'需要 '+def.price+' 金。');
      state.gold-=def.price;const a=addAnimal(state,value);advance(state,12);
      return yes(def.name+'搬进畜棚了。','animalBought',{animal:a.id});
    }
    if(action==='hayBuy'){
      const qty=value??1;
      if(!integer(qty,1,RANCH.maxHayPurchase))return no('一次购买 1 到 '+RANCH.maxHayPurchase+' 份干草。');
      if(state.gold<qty*RANCH.hayPrice)return no('买这些干草需要 '+qty*RANCH.hayPrice+' 金。');
      state.gold-=qty*RANCH.hayPrice;r.hay+=qty;advance(state,5);
      return yes('买到了 '+qty+' 份干草。','hayBought',{qty});
    }
    const a=r.animals.find(item=>item.id===value);
    if(!a)return no('请选择畜棚里的牲畜。');
    if(action==='animalFeed'){
      if(a.fedDay===state.day)return no(a.name+'今天已经吃过了。');
      if(r.hay<1)return no('干草用完了，买一份再来喂。');
      r.hay--;a.fedDay=state.day;advance(state,4);
      return yes(a.name+'吃了一份干草。','animalFed',{animal:a.id});
    }
    if(action==='animalPet'){
      if(a.petDay===state.day)return no('今天已经陪过'+a.name+'了。');
      a.petDay=state.day;a.affection=Math.min(100,a.affection+2);advance(state,3);
      return yes('摸了摸'+a.name+'，它很高兴。','animalPetted',{animal:a.id});
    }
    if(!a.ready)return no(a.name+'还没有可以收取的东西。');
    const product=ANIMALS[a.species].product;
    a.ready=false;state.inventory[product]++;advance(state,6);
    return yes('收取了'+ITEMS[product].name+'。','animalCollected',{animal:a.id,item:product,qty:1});
  }
  function ranchOvernight(state){
    for(const a of state.ranch.animals){
      if(a.fedDay!==state.day||a.ready)continue;
      a.fedCycles++;
      if(a.fedCycles>=ANIMALS[a.species].fedNights){a.ready=true;a.fedCycles=0;}
    }
  }
  function getContext(state,target){
    const t=targetPoint(state,target);
    if(!t||!targetNear(state,t))return '';
    const obj=objectAt(state,t);
    if(obj==='house')return '休息到明天';
    if(obj==='shop')return '打开商店';
    if(npcIds.includes(obj))return '和'+npcDefinitions[obj].name+'聊聊';
    if(obj==='dock')return state.spring.repaired?'登船':'查看渡船';
    if(obj==='gather')return '采集'+gatherAt(state,t).name;
    if(obj==='workshop')return '查看风干工坊';
    if(obj==='barnSite')return '查看畜棚工地';
    if(obj==='trough')return '照料牲畜';
    if(obj==='portal')return portalAt(state,t).label;
    if(obj==='crate')return '打开出货箱';
    if(obj==='orders')return '查看订单';
    if(obj==='lantern')return state.repaired?'看看修好的水灯':'修复水灯';
    const plot=state.region==='valley'?state.plots[key(t.x,t.y)]:null,crop=CROPS[plot?.crop];
    if(crop){
      if(plot.growth>=crop.days)return '收获'+crop.name;
      if(plot.watered||state.rain)return crop.name+'正在生长';
      return '给'+crop.name+'浇水';
    }
    if(plot)return plot.tilled?'种下种子':'用锄头翻土';
    if(isWater(t.x,t.y,state.region))return '钓鱼';
    return '';
  }
  function harvest(state,plot,crop){
    if(!work(state,2,14))return tired();
    state.inventory[crop.id]++;
    plot.crop=null;plot.growth=0;plot.watered=false;delete plot.legacy;
    const first=!state.journal.harvested;
    state.journal.harvested=true;
    return yes('收获了'+crop.name+'。'+(first?' 可以留着交订单，或放进出货箱。':''),'harvest',{item:crop.id});
  }
  function interact(state,target){
    const t=targetPoint(state,target);
    if(!t||!targetNear(state,t))return no('走近一些再互动。');
    const obj=objectAt(state,t);
    if(obj==='house')return yes('休息后作物会生长，出货也会结算。','sleep');
    if(obj==='shop')return yes('杂货铺供应当季种子，萝卜与豆种全年有售。','shop');
    if(npcIds.includes(obj))return talk(state,obj);
    if(obj==='dock')return yes(state.spring.repaired?'渡船已经备好，随时可以出发。':'旧渡船需要修好才能出发。','ferry',{status:ferryStatus(state)});
    if(obj==='gather'){
      const source=gatherAt(state,t),available=gatherLog(state,source)[source.id]!==state.day;
      return yes(available?source.name+'可以采集。':'今天这里已经采过了。','gather',{source,available});
    }
    if(obj==='barnSite')return yes('需要 '+RANCH.build.gold+' 金和 '+RANCH.build.wood+' 份木料建畜棚。建好后会领到一只河鸭和三份干草。','barnSite',{status:ranchStatus(state)});
    if(obj==='trough')return yes('在食槽旁可以喂食、抚摸和收取产物。','ranch',{status:ranchStatus(state)});
    if(obj==='workshop'){
      const status=workshopStatus(state);
      return yes(status.ready?'加工品已经能领取了。':status.recipe?'这一份还在加工，要等明天。':'把两份原料放在这里，睡过一夜就能领取加工品。','workshop',{status});
    }
    if(obj==='portal')return yes(portalAt(state,t).label+'。','travelPrompt',{portal:portalAt(state,t).id});
    if(obj==='crate')return yes('把收成放在这里，明早会收到货款。','ship');
    if(obj==='orders'){
      const next=ORDERS[state.orders];
      return yes(next?next.description+' 报酬 '+next.reward+' 金。':'两张订单都完成了。去看看东边的水灯。','order',{order:next||null});
    }
    if(obj==='lantern'){
      state.journal.visitedLantern=true;
      const status=repairStatus(state);
      return yes(status.msg,'repair',{canRepair:status.ready});
    }
    const plot=state.region==='valley'?state.plots[key(t.x,t.y)]:null,crop=CROPS[plot?.crop];
    if(crop){
      if(plot.growth>=crop.days)return harvest(state,plot,crop);
      return yes(crop.name+'还要生长 '+(crop.days-plot.growth)+' 天。'+(plot.watered||state.rain?' 今天的水够了。':' 今天还没浇水。'));
    }
    if(plot)return yes(plot.tilled?'这块地翻好了，可以播种。':'用锄头翻土，再种下种子。');
    if(isWater(t.x,t.y,state.region)||fishermanWater(t.x,t.y,state.region))return yes('选钓竿，等浮标进入合适的区域再收线。','fish');
    return no('这里没有可互动的东西。');
  }
  function plotWork(state,action,target,cropId){
    const t=targetPoint(state,target),plot=state.region==='valley'&&t&&state.plots[key(t.x,t.y)];
    if(!t||!near(state.player,t))return no('靠近要照顾的田格。');
    if(!plot)return no('这里只能行走。田地在农舍南边。');
    if(action==='hoe') {
      if(plot.tilled)return no('这里的土已经翻过了。');
      if(!work(state,3,10))return tired();
      plot.tilled=true;
      const first=!state.journal.tilled;state.journal.tilled=true;
      return yes(first?'土翻好了。接着选一种种子播下。':'翻好了一格土。','till');
    }
    if(action==='water') {
      if(!plot.tilled)return no('先翻土，或给已经种好的地方浇水。');
      if(state.rain)return no('今天有阵雨，不用再浇水。');
      if(plot.watered)return no('这格今天已经浇过水了。');
      if(!work(state,state.ranch.toolLevel===2?1:2,8))return tired();
      plot.watered=true;
      const first=!state.journal.watered;state.journal.watered=true;
      return yes(first?'浇好水了。每晚休息后，湿润的作物会长一截。':'浇好水了。','water');
    }
    const crop=action==='plant'?getCrop(cropId):Object.values(CROPS).find(item=>item.seed===action);
    if(!crop)return no('没有这种种子。');
    const cal=calendar(state);
    if(!inSeason(crop.id,cal.season))return no(crop.name+'不适合'+cal.seasonName+'播种。');
    if(!hasPlantingTime(crop,state.day))
      return no('换季前只剩 '+cal.daysLeft+' 晚，'+crop.name+'需要 '+crop.days+' 晚才能长成。换一种更快的作物吧。');
    if(!plot.tilled)return no('先用锄头翻土。');
    if(plot.crop)return no('这块地已有作物。成熟后用互动收获。');
    if(state.inventory[crop.seed]<1)return no('没有'+crop.seedName+'了。过桥就能到商店。');
    if(!work(state,2,8))return tired();
    state.inventory[crop.seed]--;plot.crop=crop.id;plot.growth=0;delete plot.legacy;
    const first=!state.journal.planted;state.journal.planted=true;
    return yes('种下了'+crop.name+'。'+(first?' 干燥的日子记得浇水。':''),'plant',{item:crop.id});
  }
  function getCrop(id){return typeof id==='string'&&Object.prototype.hasOwnProperty.call(CROPS,id)?CROPS[id]:null;}
  function fishSpecies(state,target,power){
    if(power<.63||power>.76)return 'fish';
    if(state.region==='shoal')return 'shoalPerch';
    if(state.region==='grove')return 'groveCrucian';
    if(state.rain)return 'rainLoach';
    if(target.x>=22&&target.y>=11)return 'pondCarp';
    if(state.minute<600)return 'silverDace';
    return 'fish';
  }
  function fishing(state,target,power){
    const t=targetPoint(state,target);
    const canCast=t&&(near(state.player,t)&&(isWater(t.x,t.y,state.region)||fishermanWater(t.x,t.y,state.region))&&fishermanWater(state.player.x,state.player.y,state.region));
    if(!canCast)return no('靠近溪岸、桥边或池塘码头再下竿。');
    if(typeof power!=='number'||!Number.isFinite(power)||power<0||power>1)return yes('在亮区收线。','fish');
    const item=fishSpecies(state,t,power);
    if(!work(state,7,34))return tired();
    const first=!state.journal.fished,[lo,hi]=FISHING_BANDS[first?'first':'normal'];
    if(power<lo||power>hi)return no('鱼跑了。等浮标进入亮区再收线。','miss');
    state.inventory[item]++;state.spring.fishCaught[item]++;state.journal.fished=true;
    return yes('钓到一条'+FISH[item].name+'。'+(first?(item==='fish'?' 可以交订单或出货。':' 订单要的是普通溪鱼，稍早一点收线就容易钓到。'):''),'catch',{item});
  }
  function buy(state,action,target,cropId){
    if(!contextObject(state,target,shopTiles))return no('到桥对岸的商店门口，或和店主交易。');
    const crop=action==='buySeed'?getCrop(cropId):action==='buyTurnip'?CROPS.turnip:CROPS.bean;
    if(!crop)return no('商店里没有这种种子。');
    const cal=calendar(state);
    if(!inSeason(crop.id,cal.season))return no(crop.name+'不是'+cal.seasonName+'出售的种子。');
    if(state.gold<crop.seedPrice)return no('金币不够。先卖点收成或钓到的鱼。');
    state.gold-=crop.seedPrice;state.inventory[crop.seed]++;advance(state,5);
    const first=!state.journal.bought;state.journal.bought=true;
    return yes('买了 1 份'+crop.seedName+'。'+(first?' 选种子便能播种。':''),'buy',{item:crop.seed});
  }
  function ship(state,target,wanted){
    if(!contextObject(state,target,['crate']))return no('走到农舍旁的出货箱。');
    const item=typeof wanted==='string'?wanted:typeof target?.item==='string'?target.item:'all';
    const keys=item==='all'?productKeys:productKeys.filter(k=>k===item);
    if(!keys.length)return no('出货箱只收作物和鱼，不收种子或木料。');
    let moved=0;
    for(const k of keys){
      const qty=item==='all'?state.inventory[k]:Math.min(1,state.inventory[k]);
      state.inventory[k]-=qty;state.shipped[k]+=qty;moved+=qty;
    }
    if(!moved)return no('没有可放入出货箱的货物。');
    const first=!state.journal.shipped;state.journal.shipped=true;advance(state,5);
    return yes('放入出货箱 '+moved+' 件。'+(first?' 明早结算，交订单要用的可以先留在背包里。':' 明早结算。'),'shipped',{qty:moved});
  }
  function order(state,target){
    if(!contextObject(state,target,['orders']))return no('到河对岸的订单板交货。');
    const recipe=ORDERS[state.orders];
    if(!recipe)return yes('两个订单都完成了，去修亮水灯吧。','orderDone');
    const need=Object.entries(recipe.need);
    if(need.some(([k,n])=>state.inventory[k]<n)){
      const missing=need.filter(([k,n])=>state.inventory[k]<n).map(([k,n])=>(n-state.inventory[k])+' 份'+ITEMS[k].name).join('、');
      return no('还缺 '+missing+'。');
    }
    for(const [k,n] of need)state.inventory[k]-=n;
    state.orders++;state.gold+=recipe.reward;advance(state,12);
    state.journal.ordered=true;
    return yes('交付「'+recipe.title+'」，收到 '+recipe.reward+' 金。'+(state.orders===ORDERS.length?' 现在可以检查东边的水灯。':''),'orderDone',{reward:recipe.reward});
  }
  function sleep(state,target){
    if(!contextObject(state,target,['house']))return no('回农舍门口才能休息。');
    const payout=productKeys.reduce((sum,k)=>sum+state.shipped[k]*ITEMS[k].sell,0);
    const sold={...state.shipped},first=!state.journal.slept;
    ranchOvernight(state);
    const nextDay=state.day+1,oldSeason=seasonForDay(state.day),nextSeason=seasonForDay(nextDay),
      seasonChange=nextSeason===oldSeason?null:nextSeason,returnedSeeds={};
    for(const p of Object.values(state.plots)){
      if(p.crop){
        const crop=CROPS[p.crop];
        if(p.watered||state.rain)p.growth=Math.min(crop.days,p.growth+1);
        if(seasonChange&&!p.legacy&&!inSeason(p.crop,nextSeason)&&p.growth<crop.days){
          returnedSeeds[crop.seed]=(returnedSeeds[crop.seed]||0)+1;
          state.inventory[crop.seed]++;p.crop=null;p.growth=0;
        }
      }
      p.watered=false;
    }
    state.gold+=payout;state.shipped={...harvestedProducts};
    state.day=nextDay;state.weather=weatherFor(state.seed,state.day);state.rain=state.weather==='rain';
    state.minute=OPEN;state.energy=MAX_ENERGY;
    const wake=state.region==='house'?OUTWORLD.houseWake:WORLD.bed;
    state.player={x:wake.x,y:wake.y,dir:'down'};state.movementSteps=0;state.journal.slept=true;
    const seasonGift={};
    if(!state.seasonGifts[nextSeason]){
      for(const [id,qty] of Object.entries(SEASON_SAMPLES[nextSeason])){
        seasonGift[id]=qty;state.inventory[id]+=qty;
      }
      state.seasonGifts[nextSeason]=true;
    }
    const hasPlant=Object.values(state.plots).some(p=>p.crop);
    let seedGift=0;
    if(state.gold<CROPS.turnip.seedPrice&&!Object.values(CROPS).some(c=>inSeason(c.id,nextSeason)&&state.inventory[c.seed]&&hasPlantingTime(c,state.day))&&!hasPlant){
      state.inventory.turnipSeed+=2;seedGift=2;
    }
    const diary=!state.spring.diary&&state.day>=SPRING.diaryDay;
    if(diary)state.spring.diary=true;
    state.lastNight={day:state.day,payout,sold,seedGift};
    const returned=Object.values(returnedSeeds).reduce((count,qty)=>count+qty,0);
    const cal=calendar(state),weatherText={clear:'天气晴朗。',rain:'下雨了，田里不用浇水。',snow:'今天飘雪，土里的作物仍要照料。',fog:'今天溪上有雾。'};
    return yes(cal.label+'。 '+weatherText[state.weather]+
      (payout?' 出货收入 '+payout+' 金。':'')+(seedGift?' 农夫留了两份萝卜种子给你。':'')+
      (Object.keys(seasonGift).length?' 收到了两份当季试种种子。':'')+
      (returned?' '+returned+' 株未成熟的过季作物变回了种子，已经放回背包。':'')+
      (first&&!state.rain?' 记得给还没成熟的作物浇水。':'')+
      (diary?' 春日手记记下了第七天；明天仍可以继续经营。':''),'newDay',{payout,seedGift,diary,seasonChange,seasonGift,returnedSeeds});
  }
  function repairStatus(state){
    if(state.repaired)return {ready:false,msg:'溪流照得亮亮的。水灯已经修好了。'};
    const left=ORDERS.length-state.orders, goldLeft=Math.max(0,REPAIR_COST-state.gold);
    if(left||goldLeft)return {ready:false,msg:'修灯要先完成两张订单，并准备 '+REPAIR_COST+' 金。'+
      (left?' 还差 '+left+' 张订单。':'')+(goldLeft?' 还差 '+goldLeft+' 金。':'')};
    return {ready:true,msg:'两张订单都完成了。花 '+REPAIR_COST+' 金就能修好水灯。'};
  }
  function repair(state,target){
    if(!contextObject(state,target,['lantern']))return no('走到水灯旁才能修复。');
    const status=repairStatus(state);
    if(!status.ready)return no(status.msg);
    state.journal.visitedLantern=true;
    state.gold-=REPAIR_COST;state.repaired=true;advance(state,22);
    return yes('水灯亮了！修好水灯以后，你仍可以继续种田和钓鱼。','repairDone');
  }
  function act(state,action,target,power){
    if(action==='interact')return interact(state,target);
    if(action==='travel')return travel(state,target);
    if(action==='barnBuild')return barnBuild(state,target);
    if(action==='barnUpgrade')return barnUpgrade(state,target);
    if(action==='toolUpgrade')return toolUpgrade(state,target);
    if(['animalBuy','hayBuy','animalFeed','animalPet','animalCollect'].includes(action))return ranchAnimal(state,action,target,power);

    if(action==='gift')return gift(state,target,power);
    if(action==='workshopStart')return workshopStart(state,target,power);
    if(action==='workshopCollect')return workshopCollect(state,target);
    if(action==='hoe'||action==='water'||action==='plant'||Object.values(CROPS).some(c=>c.seed===action))return plotWork(state,action,target,power);
    if(action==='waterRow')return waterRow(state,target);
    if(action==='gather')return gather(state,target);
    if(action==='repairFerry')return repairFerry(state,target,power);
    if(action==='sail')return sail(state,target);
    if(action==='calendar')return yes(calendar(state).label,'calendar',{calendar:calendar(state)});
    if(action==='tick'||action==='wait'){
      if(action==='tick'&&!Number.isFinite(power))return no('缺少有效的分钟数。');
      const minutes=action==='wait'?60:Math.min(30,Math.max(1,Math.floor(power)));
      const old=state.minute;advance(state,minutes);
      return yes(action==='wait'?'静静等了一会儿。':'',action==='wait'?'wait':null,{minutes:state.minute-old});
    }
    if(action==='fish')return fishing(state,target,power);
    if(action==='buyTurnip'||action==='buyBean'||action==='buySeed')return buy(state,action,target,power);
    if(action==='ship')return ship(state,target,power);
    if(action==='order')return order(state,target);
    if(action==='sleep')return sleep(state,target);
    if(action==='repair')return repair(state,target);
    return no('这个动作还不能使用。');
  }
  function restore(value){
    const v=value;
    const obj=o=>o&&typeof o==='object'&&!Array.isArray(o);
    const bag=(o,keys)=>obj(o)&&keys.every(k=>integer(o[k]));
    const legacy=v?.version===1,springV2=v?.version===2,worldV3=v?.version===3,seasonV4=v?.version===4,
      region=legacy?'valley':v?.region;
    const oldSave=legacy||springV2||worldV3,oldRanch=oldSave||seasonV4;
    const validInventory=legacy?legacyInventory:springV2?v2Inventory:worldV3?v3Inventory:seasonV4?v4Inventory:inventoryKeys,
      validProduct=legacy?legacyProducts:springV2?v2Products:worldV3?v3Products:seasonV4?v4Products:productKeys,
      validFish=springV2?v2Fish:Object.keys(FISH);
    const regions=springV2?['valley','shoal']:Object.keys(REGIONS).filter(id=>!oldRanch||id!=='barn');
    if(!obj(v)||!(oldRanch||v.version===VERSION)||!regions.includes(region)||
      !integer(v.seed,0,0xffffffff)||!integer(v.day,1)||!integer(v.minute,OPEN,CLOSE)||
      typeof v.rain!=='boolean'||typeof v.repaired!=='boolean'||
      !integer(v.gold)||!integer(v.energy,0,MAX_ENERGY)||!integer(v.orders,0,ORDERS.length)||
      !obj(v.player)||!isWalkable(v.player.x,v.player.y,region)||!Object.values(directions).includes(v.player.dir)||
      !bag(v.inventory,validInventory)||!bag(v.shipped,validProduct)||!obj(v.plots)||
      !obj(v.journal)||!journalKeys.every(k=>typeof v.journal[k]==='boolean')||!integer(v.movementSteps,0,2)||
      (v.repaired&&v.orders!==ORDERS.length)||
      (!oldSave&&(!WEATHERS.includes(v.weather)||v.rain!==(v.weather==='rain')||
        !obj(v.seasonGifts)||!SEASONS.every(id=>typeof v.seasonGifts[id]==='boolean'))))return null;
    const clean=create(v.seed);
    // An old save has no snow/fog field. Keep its original rain state exactly.
    Object.assign(clean,{day:v.day,minute:v.minute,weather:oldSave?(v.rain?'rain':'clear'):v.weather,rain:v.rain,repaired:v.repaired,gold:v.gold,energy:v.energy,
      orders:v.orders,movementSteps:v.movementSteps,region,player:{x:v.player.x,y:v.player.y,dir:v.player.dir}});
    if(oldSave){
      for(const k of inventoryKeys)clean.inventory[k]=0;
    }else{
      clean.seasonGifts=Object.fromEntries(SEASONS.map(id=>[id,v.seasonGifts[id]]));
    }
    for(const k of validInventory)clean.inventory[k]=v.inventory[k];
    for(const k of validProduct)clean.shipped[k]=v.shipped[k];
    for(const k of journalKeys)clean.journal[k]=v.journal[k];
    for(const k of Object.keys(clean.plots)){
      if(!Object.prototype.hasOwnProperty.call(v.plots,k))return null;
      const p=v.plots[k],crop=getCrop(p?.crop),
        validCrop=!!crop&&(legacy?['turnip','bean'].includes(p.crop):oldSave?oldCropIds.includes(p.crop):true);
      if(!obj(p)||typeof p.tilled!=='boolean'||typeof p.watered!=='boolean'||
        !(p.crop===null||validCrop)||!integer(p.growth,0,validCrop?crop.days:0)||
        (!p.tilled&&(p.crop!==null||p.watered))||
        (!oldSave&&p.legacy!==undefined&&(typeof p.legacy!=='boolean'||p.legacy&&!validCrop)))return null;
      const item={tilled:p.tilled,crop:p.crop,growth:p.growth,watered:p.watered};
      // Old rules never limited a planted crop by season; grandfather the whole
      // remaining growth cycle for any live non-perennial crop from that save.
      if(validCrop&&(oldSave?crop.seasons.length<SEASONS.length:p.legacy===true))item.legacy=true;
      clean.plots[k]=item;
    }
    if(v.lastNight!==null){
      const n=v.lastNight;
      if(!obj(n)||!integer(n.day,2,v.day)||!integer(n.payout)||!integer(n.seedGift,0,2)||!bag(n.sold,validProduct))return null;
      const sold={...harvestedProducts};
      for(const k of validProduct)sold[k]=n.sold[k];
      clean.lastNight={day:n.day,payout:n.payout,seedGift:n.seedGift,sold};
    }
    if(legacy){
      clean.spring.met.farmer=clean.journal.metFarmer;
      clean.spring.relationships.farmer=Number(clean.journal.metFarmer);
      const oldFish=Math.max(Number(clean.journal.fished),clean.inventory.fish+clean.shipped.fish);
      clean.spring.fishCaught.fish=oldFish;
      clean.spring.diary=v.day>=SPRING.diaryDay;
      return clean;
    }
    const sp=v.spring;
    if(!obj(sp)||!integer(sp.wood)||typeof sp.repaired!=='boolean'||typeof sp.visited!=='boolean'||
      typeof sp.diary!=='boolean'||!Array.isArray(sp.errands)||sp.errands.length!==2||
      !sp.errands.every(item=>typeof item==='boolean')||
      !bag(sp.relationships,npcIds)||!obj(sp.met)||!npcIds.every(id=>typeof sp.met[id]==='boolean')||
      !obj(sp.gathered)||!obj(sp.lastTalk)||!bag(sp.fishCaught,validFish)||
      !(sp.repaired?['errands','materials'].includes(sp.repairRoute):sp.repairRoute===null)||
      (region==='shoal'&&(!sp.repaired||!sp.visited)))return null;
    const dateMap=(o,ids)=>Object.keys(o).every(id=>ids.includes(id)&&integer(o[id],1,v.day));
    if(!dateMap(sp.gathered,SPRING.gather.map(row=>row.id))||!dateMap(sp.lastTalk,npcIds))return null;
    clean.spring={wood:sp.wood,repaired:sp.repaired,visited:sp.visited,diary:sp.diary,repairRoute:sp.repairRoute,
      errands:[...sp.errands],relationships:{...sp.relationships},met:{...sp.met},
      gathered:{...sp.gathered},lastTalk:{...sp.lastTalk},fishCaught:{...clean.spring.fishCaught}};
    for(const id of validFish)clean.spring.fishCaught[id]=sp.fishCaught[id];
    if(springV2){
      clean.outworld.visited.shoal=sp.visited;
      return clean;
    }
    const ow=v.outworld,knownRegions=Object.keys(REGIONS).filter(id=>!oldRanch||id!=='barn');
    if(!obj(ow)||!obj(ow.visited)||!knownRegions.every(id=>typeof ow.visited[id]==='boolean')||
      !ow.visited.valley||!ow.visited[region]||(ow.visited.shoal!==sp.visited)||
      !obj(ow.gathered)||!dateMap(ow.gathered,GROVE_GATHER.map(source=>source.id))||!obj(ow.workshop))return null;
    if(ow.gifted!==undefined&&(!obj(ow.gifted)||!dateMap(ow.gifted,npcIds)))return null;
    const {recipe,readyDay}=ow.workshop;
    if(recipe===null?readyDay!==null:
      typeof recipe!=='string'||!Object.prototype.hasOwnProperty.call(WORKSHOP.recipes,recipe)||!integer(readyDay,2,v.day+1))return null;
    clean.outworld={visited:{...clean.outworld.visited,...Object.fromEntries(knownRegions.map(id=>[id,ow.visited[id]]))},gathered:{...ow.gathered},gifted:{...(ow.gifted||{})},workshop:{recipe,readyDay}};
    if(oldRanch)return clean;
    const r=v.ranch;
    if(!obj(r)||typeof r.built!=='boolean'||!integer(r.level,0,2)||
      !integer(r.hay)||!integer(r.nextAnimal,1)||!integer(r.toolLevel,1,2)||
      !Array.isArray(r.animals)||r.animals.length>(RANCH.capacity[r.level]||0)||
      (!r.built&&(r.level!==0||r.hay!==0||r.animals.length!==0||region==='barn'))||
      (r.built&&(r.level===0||r.animals.length<1))||(ow.visited.barn&&!r.built))return null;
    const animals=[],ids=new Set(),serials=new Set();
    for(const a of r.animals){
      if(!obj(a)||!Object.prototype.hasOwnProperty.call(ANIMALS,a.species)||
        typeof a.name!=='string'||!a.name.trim()||a.name.length>40||
        !integer(a.fedDay,0,v.day)||!integer(a.petDay,0,v.day)||!integer(a.affection,0,100)||
        typeof a.ready!=='boolean'||!integer(a.fedCycles,0,ANIMALS[a.species].fedNights-1)||(a.ready&&a.fedCycles!==0))return null;
      const match=typeof a.id==='string'&&/^(duck|sheep)-([1-9]\d*)$/.exec(a.id);
      const serial=match?Number(match[2]):0;
      if(!match||match[1]!==a.species||!integer(serial,1,r.nextAnimal-1)||ids.has(a.id)||serials.has(serial))return null;
      ids.add(a.id);serials.add(serial);
      animals.push({id:a.id,species:a.species,name:a.name,fedDay:a.fedDay,petDay:a.petDay,affection:a.affection,ready:a.ready,fedCycles:a.fedCycles});
    }
    clean.ranch={built:r.built,level:r.level,hay:r.hay,animals,toolLevel:r.toolLevel,nextAnimal:r.nextAnimal};
    return clean;
  }
  return freeze({create,move,act,getContext,restore,CROPS,ITEMS,FISH,ORDERS,WORLD,SPRING,REGIONS,PORTALS,GROVE_GATHER,WORKSHOP,RANCH,ANIMALS,OUTWORLD,TOWN_BLOCKS,GIFT_TASTES,GIFT_ITEMS,FISHING_BANDS,REPAIR_COST,MAX_ENERGY,isWater,isWalkable,rainFor,weatherFor,seasonForDay,inSeason,SEASONS,SEASON_LENGTH,npcs,calendar,ferryStatus,workshopStatus,ranchStatus,portalAt,portalEnabled});
});
