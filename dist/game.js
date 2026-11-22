(() => {
'use strict';
const E=window.MistEngine,A=window.MistArt,W=window.MistWorldArt,S=window.MistSound,storage=window.MistSave,Walk=window.MistWalk;
const $=id=>document.getElementById(id), canvas=$('world'),ctx=canvas.getContext('2d');
const disk=(()=>{try{return window.localStorage;}catch{return null;}})();
const startup=storage.load(disk,E.restore);
let state=startup.state||E.create(), sound=false, tool='hoe', seed='turnip', selected=null, fishing=null, route=[], saveTimer=0, zoom=false;
let lastList='', arrivalTimer=0, hovered=null, controls='guided';
let touchTarget=false, touchGesture=null, touchFeedback='', routeStop=null;
try{if(disk?.getItem('mistcreek-controls')==='classic')controls='classic';}catch{}
function setControls(mode){controls=mode==='classic'?'classic':'guided';hovered=null;clearTouchTarget();try{disk?.setItem('mistcreek-controls',controls);}catch{}update();if(panel.open)renderPanel();}

const cam={x:0,y:0};
const walker=Walk.create(), reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
let pendingMove=null, retryMoveAt=0, anchorX, anchorY;
let waymarkRects=[];
const keys=new Set(), toolNames={hoe:'锄头',water:'水壶',seed:'种子袋',fish:'鱼竿'};
const stageFX={player:null,reducedMotion:false,event:null,stopTile:null};
const itemName=id=>E.ITEMS[id]?.name || ({wood:'浮木',fish:'溪鱼'})[id] || id;
const crops=()=>Object.entries(E.CROPS);
const seasons=['spring','summer','autumn','winter'];
const seasonNames={spring:'春季',summer:'夏季',autumn:'秋季',winter:'冬季'};
const forecastNames={clear:'晴',rain:'雨',snow:'雪',fog:'雾'};
const seasonTips={
 spring:'新芽适合湿润的春天。杂货铺有莴苣、豌豆、雾莓和香葱。',
 summer:'夏天可以种金日甜瓜和溪红椒。逛镇前记得先给地里浇水。',
 autumn:'秋天可以种琥珀南瓜和栗香根。收成多时可以去镇上加工。',
 winter:'霜心卷心菜和雪脊葱能在冬季生长。下雪不是下雨，田地仍需要照顾。'
};
const dateOf=()=>E.calendar(state);
const weatherOf=()=>state.weather||E.weatherFor(state.seed,state.day);
const nextSeason=s=>seasons[(seasons.indexOf(s)+1)%4];
const isNative=(cropId,season)=>E.inSeason(cropId,season);
const canFinish=(crop,day)=>crop.seasons.includes(nextSeason(day.season))||crop.days<=day.daysLeft;
const cropSeasonText=crop=>crop.seasons.length===4?'四季可种':crop.seasons.map(s=>seasonNames[s]).join('、')+'可种';
let calendarFocus=null;

const products=()=>Object.keys(state.shipped);
const asTile=(val)=>typeof val==='string'?{x:+val.split(',')[0],y:+val.split(',')[1]}:val;
const region=()=>state.region||'valley';
const worldTiles={valley:{title:'河畔农场',desc:'耕种、出货、旧水灯和渡船'},town:{title:'雾溪镇',desc:'集市和松木加工坊'},grove:{title:'苔影林',desc:'野生植物、浮木与深潭'},house:{title:'农舍',desc:'在床边休息、结算出货款'},store:{title:'杂货铺',desc:'柜台按季节出售种子'},barn:{title:'河畔畜棚',desc:'喂养鸭子和绵羊、收蛋和剪羊毛'},shoal:{title:'芦苇浅滩',desc:'乘渡船去找浅滩独有的鱼'}};
const portal=(p)=>{const v=E.portalAt(state,p);return v&&E.portalEnabled(state,v)?v:null;};
const ranchSite=()=>E.RANCH.site;
const trough=()=>E.RANCH.trough;
const size=()=>E.REGIONS[region()]||{width:30,height:18};
const view=(p)=>{
 const {width,height}=size();
 // Pixel-aligned camera and pointer hit testing share the same origin.
 const bound=(v,max)=>Math.round(Math.max(0,Math.min(max,v))*Walk.tile)/Walk.tile;
 cam.x=bound(p.x-14.5,width-30);cam.y=bound(p.y-8.5,height-18);
 if(zoom){
  const stage=canvas.parentElement, x=Math.round((p.x-cam.x+.5)*Walk.tile),y=Math.round((p.y-cam.y+.5)*Walk.tile);
  if(x!==anchorX){stage.style.setProperty('--anchor-x',x/720*100+'%');anchorX=x;}
  if(y!==anchorY){stage.style.setProperty('--anchor-y',y/432*100+'%');anchorY=y;}
 }
};
const resetWalk=()=>{pendingMove=null;retryMoveAt=0;view(walker.reset(state.player));};
const waypoints={farm:{x:9,y:9,region:'valley'},house:{x:7,y:7,region:'valley'},shop:{x:24,y:7,region:'valley'},board:{x:23,y:9,region:'valley'},dock:{x:23,y:12,region:'valley'},shore:{x:16,y:11,region:'valley'},shoalDock:{x:5,y:9,region:'shoal'}};
const sprites={
 hoe:'<path fill="#855638" d="M3 12h2v2H3zm2-2h2v2H5zm2-2h2v2H7zm2-2h2v2H9z"/><path fill="#d1a574" d="M4 11h2v2H4zm2-2h2v2H6zm2-2h2v2H8z"/><path fill="#b6cbca" d="M7 4h6v2H7z"/><path fill="#779a98" d="M10 6h4v2h-4z"/>',
 water:'<path fill="#4b9d9d" d="M4 7h8v6H4zm8-3h2v2h-2zM2 7h2v3H2zM12 6h2v4h-2z"/><path fill="#91d1cb" d="M5 8h2v4H5zm-4-1h2v2H1zm7-3h3v2H8z"/>',
 turnipSeed:'<path fill="#c99460" d="M4 3h8v2H4zm-1 2h10v8H3z"/><path fill="#ecc389" d="M4 6h8v6H4z"/><path fill="#936549" d="M6 8h2v2H6zm2 2h2v1H8z"/>',
 beanSeed:'<path fill="#96ab65" d="M4 3h8v2H4zm-1 2h10v8H3z"/><path fill="#c5cd8d" d="M4 6h8v6H4z"/><path fill="#637a46" d="M6 9h2v2H6zm2-2h2v2H8z"/>',
 turnip:'<path fill="#82b465" d="M7 2h2v5H7zM4 3h2v3H4zm6 0h2v3h-2z"/><path fill="#e8c0a1" d="M4 7h8v5H4zm2 5h4v2H6z"/><path fill="#cf8784" d="M4 7h8v2H4z"/>',
 bean:'<path fill="#669750" d="M3 10h3v3H3zm3-2h3v4H6zm3-2h3v4H9zm3-2h2v4h-2z"/><path fill="#b7cb78" d="M4 10h2v1H4zm3-2h2v1H7zm3-2h2v1h-2z"/>',
 fish:'<path fill="#98cdd6" d="M4 6h7v1h2v4h-2v1H4v-1H3V7h1zm9 1h2v1h-1v2h1v1h-2z"/><path fill="#496b8f" d="M5 7h2v2H5z"/><path fill="#5da0b6" d="M5 10h6v2H5z"/>',
 rod:'<path fill="#c59258" d="M3 12h2v2H3zm2-2h2v2H5zm2-2h2v2H7zm2-2h2v2H9zm2-2h2v2h-2z"/><path fill="#b8ccd1" d="M12 5h1v5h-1z"/><path fill="#ed9375" d="M11 10h3v2h-3z"/>'
};
sprites.forage='<path fill="#b6c87c" d="M2 8h3V5h2v2h2V3h3v3h2v3h-3v2H8v2H6v2H4v-3H2z"/><path fill="#78975d" d="M3 10h3v1h2V8h2V6h2v3h-2v2H8v2H6v2H4v-2h2v-2H3z"/>';
sprites.processed='<path fill="#87634f" d="M4 3h8v3h1v7H3V6h1z"/><path fill="#d6a474" d="M4 4h8v2H4zm0 3h8v5H4z"/><path fill="#a26b54" d="M5 8h6v3H5z"/><path fill="#ebcb8b" d="M7 8h2v2H7z"/>';
const icon=(id)=>'<svg viewBox="0 0 16 16" aria-hidden="true" shape-rendering="crispEdges">'+(sprites[id]||(id.endsWith('Seed')?sprites.turnipSeed:E.FISH[id]?sprites.fish:E.WORKSHOP.recipes[id]?sprites.processed:sprites.forage))+'</svg>';
const locations={'7,7':'sleep','10,8':'ship','24,7':'shop','23,9':'order','27,5':'repair','23,12':'ferry'};
const dir={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const movekeys={arrowup:dir.up,w:dir.up,arrowdown:dir.down,s:dir.down,arrowleft:dir.left,a:dir.left,arrowright:dir.right,d:dir.right};
const panel=$('panel'); let modalMode=null, modalTile=null, modalStarter='', modalData=null, pendingImport=null;
function pos(p){return p.x+','+p.y;}
function adjacent(a,b){return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y))<=1;}
function inside(x,y){const {width,height}=size();return x>=0&&x<width&&y>=0&&y<height;}
const waterAt=(x,y)=>E.isWater(x,y,region());
const passable=(x,y)=>E.isWalkable(x,y,region(),state);
function plotAt(p){return region()==='valley'&&p&&p.x>=5&&p.x<=13&&p.y>=10&&p.y<=14;}
function clearTouchTarget(){touchTarget=false;touchFeedback='';routeStop=null;}
function touchPlotAction(p){
 if(!touchTarget||!selected||!plotAt(p))return null;
 const plot=state.plots[pos(p)],crop=E.CROPS[plot?.crop];
 if(!plot)return null;
 if(crop){
  if(plot.growth>=crop.days)return {name:'interact',label:'收获'};
  return plot.watered||state.rain?{name:'interact',label:'查看作物'}:{name:'water',label:'浇水'};
 }
 if(!plot.tilled)return {name:'hoe',label:'翻土'};
 return tool==='water'&&!plot.watered&&!state.rain?{name:'water',label:'浇水'}:{name:'plant',label:'播种'};
}
function facing(){const [dx,dy]=dir[state.player.dir]||dir.down;return {x:state.player.x+dx,y:state.player.y+dy};}
function target(){return selected||(controls==='classic'&&hovered&&adjacent(state.player,hovered)?hovered:null)||facing();}
function save(options){clearTimeout(saveTimer);const ok=storage.write(disk,state,E.restore,options);$('saveStatus').textContent=ok?'进度保存在此浏览器':'未能保存，请手动导出';return ok;}
function deferredSave(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>save(),350);}
function tell(message,good=false){if(!message)return;const n=$('notice');n.textContent=message;n.classList.toggle('good',good);}
function formatTime(minute){return String(Math.floor(minute/60)).padStart(2,'0')+':'+String(Math.floor(minute%60)).padStart(2,'0');}
function createTools(){
 const toolKeys={hoe:'1',water:'2',seed:'3 / 4',fish:'5'};
 for(const [id,name] of Object.entries(toolNames)){
  const b=document.createElement('button');b.className='slot'+(id==='seed'?' slot-seed':'');b.dataset.tool=id;b.type='button';
  b.innerHTML='<kbd>'+toolKeys[id]+'</kbd>'+icon(id==='fish'?'rod':id==='seed'?'turnipSeed':id)+'<span>'+name+'<small id="qty-'+id+'"></small></span>';
  b.addEventListener('click',()=>{if(id==='seed')showPanel('seeds',null);else{setTool(id);canvas.focus({preventScroll:true});}});
  $('tools').append(b);
 }
}
function setTool(id){if(!toolNames[id]||panel.open)return;tool=id;touchFeedback='';update();}
function pickSeed(id){if(!E.CROPS[id])return;seed=id;tool='seed';touchFeedback='';if(panel.open)panel.close();update();}
function journal(){
 const plots=Object.values(state.plots),j=state.journal||{}, sp=state.spring, day=dateOf();
 if(region()==='valley'&&day.daysLeft<=2&&state.day>7)return [8,'换季前收一收',(day.daysLeft?'还有 '+(day.daysLeft+1)+' 晚就换季。':'今晚换季。')+'不适应下一季的未成熟作物会退回种子。'];
 if(region()==='barn'){
  const n=state.ranch.animals.filter(a=>a.ready).length;
  return [8,n?'来收今天的产物':'照顾新伙伴',n?'有 '+n+' 只动物的产物可以收取，到食槽旁查看。':'走到食槽边喂食、摸摸动物，睡醒后来领产物。'];
 }
 if(region()==='town')return [8,'逛逛雾溪镇','路边加工坊可以把收成加工后再卖。走到镇东南的步道就能进苔影林。'];
 if(region()==='grove')return [8,'在林里逛一逛','采集沿途的野菜与花，或到东边的林间深潭钓鱼。'];
 if(region()==='house')return [8,'在农舍歇歇脚','走到左侧的床边休息，浇过水的作物会在夜里长大。'];
 if(region()==='store')return [8,'去柜台买种子','柜台可以买种子。试着比较收成速度和价格，选适合自己的作物。'];
 if(sp?.visited&&!state.ranch.built)return [8,'给农场添一间畜棚','在农舍西边的工地用 '+E.RANCH.build.wood+' 份木料和 '+E.RANCH.build.gold+' G 盖畜棚。'];
 if(day.season!=='spring'&&sp?.visited)return [8,day.seasonName+'农事',seasonTips[day.season]];
 if(sp?.visited)return [8,'春日渡船已启航',state.day>=7?'早春七天小结已解锁。你仍可以自由种田、补旧水灯委托、收集浅滩鱼种。':'往返已开放。可去浅滩钓鱼或继续照顾农场，第 7 天到日历看小结。'];
 if(sp?.repaired)return [7,'登上修好的渡船','回到东岸池塘边的渡口，选择「乘船去浅滩」。'];
 if(state.day>=3)return [5,'修好春日渡船','去东岸委托板或池塘旁的木码头，选备材料或帮村民跑腿。'];
 if(plots.some(p=>p.crop))return [3,'把春天种进地里','给未成熟作物浇水，回西岸木屋休息。农场的第 3 天开放渡口委托。'];
 if(plots.some(p=>p.tilled))return [1,'种下第一批萝卜','点种子袋挑选种子。在翻过的田上播种，接着浇水。'];
 return [0,'从一畦土地开始','面前就是田地。用锄头翻一格土，再从种子袋选种子。'];
}
function updateVillagers(){
 const list=E.npcs(state).filter(n=>n.region===region());
 const signature=region()+dateOf().season+JSON.stringify(list.map(n=>[n.id,n.x,n.y,n.name,n.place,n.role]));
 if(lastList===signature)return;lastList=signature;$('npcList').replaceChildren();
 if(list.length===0){
  const specials={shoal:[['回程栈桥',waypoints.shoalDock,true]],town:[['松木加工坊',E.WORKSHOP,true]],grove:[['探访林间深潭',{x:28,y:12},false]],house:[['休息的床',{x:8,y:7},true]],store:[['购种柜台',{x:16,y:7},true]],barn:[['前往食槽',trough(),true]]};
  for(const [label,tile,near] of specials[region()]||[]){const b=qButton(label,()=>goTo(tile,near));b.className='text-button';$('npcList').append(b);}
  return;
 }
 for(const n of list){
  const line=document.createElement('div');line.className='npc-line';
  const b=qButton(n.name,()=>goTo(n,true));b.className='text-button';b.title='前往 '+n.name;
  const t=document.createElement('small');t.textContent=n.place||n.location||({farmer:n.x>=14?'田埂东边':'西岸农舍旁',shopkeeper:n.y===10?'杂货铺南边':'杂货铺门外',ferryman:n.y===11?'在渡口备船':'在木码头旁'})[n.id]||'在村里';
  line.append(b,t);$('npcList').append(line);
 }
}
const lastMarkup=new Map();
function markup(id,html){if(lastMarkup.get(id)!==html){$(id).innerHTML=html;lastMarkup.set(id,html);}}
function update(){
 const cal=dateOf(), weather=weatherOf();
 $('game').dataset.season=cal.season;
 markup('controlsLegend',controls==='classic'?'<kbd>WASD</kbd> 移动 <kbd>C</kbd> 工具 <kbd>X</kbd> 互动':'<kbd>WASD</kbd> 移动 <kbd>空格</kbd> 使用 <kbd>E</kbd> 互动');
 canvas.setAttribute('aria-label',controls==='classic'?'雾溪农场地图，WASD 移动，C 用工具，X 互动':'雾溪农场地图，方向键移动，空格用工具，E 互动');
 const link=$('ranchLink');link.hidden=region()!=='valley';link.textContent=state.ranch.built?'前往畜棚':'查看畜棚工地';
 $('weather').textContent='第 '+cal.year+' 年 · '+forecastNames[weather];
 $('day').textContent=cal.seasonName.slice(0,1)+' '+cal.seasonDay+' 日';$('day').setAttribute('aria-label',cal.label);
 $('time').textContent=formatTime(state.minute);
 $('energy').textContent=state.energy;$('energyFill').style.width=Math.max(0,Math.min(100,state.energy))+'%';$('gold').textContent=state.gold+' G';
 $('zone').textContent=region()!=='valley'?worldTiles[region()].title:state.player.x<=16?'西岸 · 河畔农场':state.player.x<=19?'雾溪 · 木桥':'东岸 · 渡口村路';
 const [phase,title,body]=journal();$('objective').textContent=title;$('questBody').textContent=body;
 markup('steps',Array.from({length:8},(_,i)=>'<span class="'+(i<phase?'done':i===phase?'current':'')+'"></span>').join(''));
 const stock=Object.entries(state.inventory).filter(([i,n])=>n>0&&!i.endsWith('Seed')).slice(0,4);
 const items=[[E.CROPS[seed].seed,state.inventory[E.CROPS[seed].seed]||0],...stock];
 markup('stock',items.map(([id,n])=>'<div class="stock-row"><span>'+icon(id)+itemName(id)+'</span><strong>'+n+'</strong></div>').join('')+'<p class="stock-note">备料浮木：'+(state.spring?.wood||0)+'</p>');
 for(const b of $('tools').children){const id=b.dataset.tool;b.setAttribute('aria-pressed',String(id===tool));$('qty-'+id).textContent=id==='seed'?E.CROPS[seed].seedName+' ×'+(state.inventory[E.CROPS[seed].seed]||0):'';}
 const p=target(), door=portal(p), close=adjacent(state.player,p), field=touchPlotAction(p);
 const hint=door&&close?door.label:E.getContext(state,p), moving=!!route.length;
 $('contextText').textContent=fishing?'等光标进入金色区域，再收线。':moving?(field?'走到标出的田边…':'正在前往选中的位置…'):
  (touchTarget&&touchFeedback||hint||(field&&!close?'走到相邻田格再操作。':controls==='classic'&&!touchTarget?'左键用工具，右键互动；WASD 移动。':'点地图选位置，也可用方向键移动。'));
 const useButton=$('use');useButton.textContent=fishing?'收线':field?.label||(tool==='seed'?'播种':tool==='water'?'浇水':'用'+toolNames[tool]);useButton.disabled=!fishing&&(moving||!!field&&!close);
 const inter=$('interact');inter.textContent=door&&close?'前往':'互动';inter.disabled=moving||!!fishing;inter.hidden=!!field&&!fishing;
 const showBatch=field?field.name==='water':tool==='water';
 $('waterWide').hidden=!showBatch||!!fishing; $('waterWide').disabled=moving||!!field&&!close;
 $('waterWide').textContent=state.ranch.toolLevel===2?'浇五格':'浇一排';
 const stage=canvas.parentElement;stage.style.setProperty('--zoom',zoom?'1.75':'1');

 updateVillagers();
 S?.setScene({rain:state.rain,weather,season:cal.season,minute:state.minute,region:region()});
}
function arrival(){
 route=[];selected=null;hovered=null;clearTouchTarget();resetWalk();
 const a=$('arrival'), stage=canvas.parentElement;
 a.hidden=true;a.textContent=worldTiles[region()].title;void a.offsetHeight;a.hidden=false;
 stage.classList.remove('sailing');void stage.offsetHeight;stage.classList.add('sailing');
 clearTimeout(arrivalTimer);arrivalTimer=setTimeout(()=>{a.hidden=true;stage.classList.remove('sailing');},1750);
}
function move(dx,dy,manual=true,now=performance.now()){
 if(panel.open||fishing)return false;
 if(manual){route=[];selected=null;clearTouchTarget();}
 const before=region(), from={x:state.player.x,y:state.player.y};
 const moved=E.move(state,dx,dy);
 if(region()!==before){arrival();S?.play('travel');save();}
 else if(moved){walker.start(from,state.player,now,manual?Walk.keyboard:Walk.route);deferredSave();}
 if(!moved)retryMoveAt=now+Walk.keyboard;
 return moved;
}
function pathTo(targetTile,interact){
 const start=state.player;
 if(interact&&adjacent(start,targetTile)||!interact&&pos(start)===pos(targetTile))return [];
 const queue=[{x:start.x,y:start.y,path:[]}],seen=new Set([pos(start)]);
 while(queue.length){
  const node=queue.shift();
  for(const [dx,dy] of Object.values(dir)){
   const x=node.x+dx,y=node.y+dy,id=x+','+y;
   if(seen.has(id)||!passable(x,y)||portal({x,y})&&id!==pos(targetTile))continue;
   seen.add(id); const next=node.path.concat([[dx,dy]]);
   if(interact?adjacent({x,y},targetTile):x===targetTile.x&&y===targetTile.y)return next;
   queue.push({x,y,path:next});
  }
 }
 return [];
}
function after(r,action,p){
 if(!r)return;
 tell(r.msg,r.ok);
 if(touchTarget)touchFeedback=r.msg;
 let cue=({hoe:'hoe',water:'water',waterRow:'water',plant:'plant',ship:'ship',order:'order',buySeed:'buy',sleep:'newDay',gather:'gather',sail:'sail',repairFerry:'ferryRepaired',travel:'travel',workshopStart:'process',workshopCollect:'take',gift:'errand',barnBuild:'buildBarn',barnUpgrade:'upgrade',toolUpgrade:'upgrade',animalBuy:'buy',hayBuy:'buy',animalFeed:'feed',animalPet:'pet',animalCollect:'animalCollect'})[action];
 if(['harvest','catch','miss','newDay','repairDone','errand'].includes(r.event))cue=r.event;
 if(r.errand)cue='errand';
 if(r.seasonChange)cue='seasonChange';
 const kind=({hoe:'hoe',water:'water',waterRow:'water',plant:'plant',sail:'repair',gather:'gather',repairFerry:'repair'})[action]||({harvest:'harvest',catch:'fish'})[r.event];
 if(r.ok&&p&&kind&&action!=='sail')stageFX.event={kind,x:p.x,y:p.y,at:performance.now()};
 if(r.ok&&['sail','travel'].includes(action)){stageFX.event=null;arrival();}
 if(r.event==='newDay')resetWalk();
 if(r.seasonChange){
  const a=$('arrival');
  a.hidden=true;a.textContent='第 '+dateOf().year+' 年 · '+seasonNames[r.seasonChange];void a.offsetHeight;a.hidden=false;
  clearTimeout(arrivalTimer);arrivalTimer=setTimeout(()=>{a.hidden=true;},1750);
 }
 if(r.event==='miss'||r.ok&&cue)S?.play(cue);
 if(r.ok||r.event==='miss')save({checkpoint:r.event==='newDay'});
 update();
}
function action(actionName,p,power){
 const result=E.act(state,actionName,p,power);
 after(result,actionName,p);
 return result;
}
function use(wide=false){
 if(panel.open)return;
 if(fishing){const {tile,start}=fishing;stopFishing();action('fish',tile,reelPower(performance.now()-start));return;}
 if(route.length)return;
 const p=target();
 if(tool==='fish'){
  const candidates=[p,...[-1,0,1].flatMap(dy=>[-1,0,1].map(dx=>({x:state.player.x+dx,y:state.player.y+dy})))];
  const t=candidates.find(v=>adjacent(state.player,v)&&waterAt(v.x,v.y));
  if(!t){tell('靠近河岸或走到池塘木码头，再用鱼竿。');return;}
  if(state.energy<7){tell('体力用完了。回木屋休息，明天再钓吧。');return;}
  route=[];fishing={tile:t,start:performance.now()};$('fishMeter').hidden=false;
  const [lo,hi]=E.FISHING_BANDS[state.journal.fished?'normal':'first'];
  const band=$('fishBand');band.style.left=(lo*100)+'%';band.style.width=((hi-lo)*100)+'%';
  S?.play('cast');update();return;
 }
 if(tool==='seed')action('plant',p,seed);
 else if(tool==='water'&&wide)action('waterRow',p);
 else action(tool,p);
}
function tapAction(wide=false){
 const p=target(), field=touchPlotAction(p);
 if(fishing||!field)return use(wide);
 if(panel.open||route.length||!adjacent(state.player,p))return;
 if(wide&&field.name!=='water')return;
 if(field.name==='interact')return interact();
 action(wide?'waterRow':field.name,p,field.name==='plant'?seed:undefined);
}
function reelPower(elapsed){const phase=(elapsed%2000)/1000;return phase<=1?phase:2-phase;}
function stopFishing(){fishing=null;$('fishMeter').hidden=true;update();}
function interact(){
 if(panel.open||fishing||route.length)return;
 const p=target();if(portal(p)){action('travel',p);return;}
 const r=action('interact',p);
 if(r?.ok&&['shop','ship','sleep','dialogue','order','repair','ferry','gather','workshop','ranch','barnSite'].includes(r.event))showPanel(r.event,p,r.msg,r);
 if(r?.ok&&r.event==='fish'){tool='fish';use();}
}
function qButton(label,fn,accent=false){
 const b=document.createElement('button');b.type='button';b.className=accent?'accent':'quiet';b.textContent=label;b.addEventListener('click',fn);return b;
}
function paragraph(parent,txt){const p=document.createElement('p');p.textContent=txt;parent.append(p);}
function showPanel(mode,p,msg,detail=null){
 modalMode=mode;modalTile=p;modalStarter=msg||'';modalData=detail;keys.clear();pendingMove=null;route=[];routeStop=null;touchGesture=null;if(fishing)stopFishing();
 renderPanel();
 if(!panel.open){panel.showModal();S?.play('open');}
}
function hop(destination){
 const from=region();if(from===destination)return null;
 const q=[[from,null]],seen=new Set([from]);
 while(q.length){
  const [r,first]=q.shift();
  const next=E.PORTALS.filter(p=>p.region===r&&E.portalEnabled(state,p));
  if(state.spring.repaired&&r==='valley')next.push({...waypoints.dock,region:r,to:'shoal',boat:true});
  if(state.spring.repaired&&r==='shoal')next.push({...waypoints.shoalDock,region:r,to:'valley',boat:true});
  for(const p of next){
   if(seen.has(p.to))continue;seen.add(p.to);
   if(p.to===destination)return first||p;
   q.push([p.to,first||p]);
  }
 }
 return null;
}
function goTo(place,forceNear=false,fromTouch=false){
 const p=asTile(place);
 if(!p)return;
 if(place.region&&place.region!==region()){
  const step=hop(place.region);
  if(!step){tell(place.region==='barn'?'先建好农场畜棚，再进去看看。':'这条路暂时未开放。');return;}
  goTo(step,!!step.boat,fromTouch);if(step.boat)tell('先走到码头，再和渡船互动。');return;
 }
 if(!inside(p.x,p.y))return;
 if(panel.open)panel.close();
 clearTouchTarget();touchTarget=fromTouch;hovered=null;selected={x:p.x,y:p.y};
 const works=region()==='town'&&pos(p)===pos(E.WORKSHOP)||region()==='house'&&pos(p)==='8,7'||region()==='store'&&pos(p)==='16,7'||region()==='barn'&&pos(p)===pos(trough())||region()==='valley'&&pos(p)===pos(ranchSite());
 const near=!portal(p)&&(works||forceNear||plotAt(p)||waterAt(p.x,p.y)||!!(region()==='valley'?locations[pos(p)]:region()==='shoal'&&pos(p)===pos(waypoints.shoalDock))||E.npcs(state).some(n=>n.region===region()&&pos(n)===pos(p))||[...E.SPRING.gather,...E.GROVE_GATHER].some(n=>n.region===region()&&pos(n)===pos(p))||!passable(p.x,p.y));
 route=pathTo(p,near);
 if(fromTouch&&route.length&&plotAt(p))routeStop=route.reduce(({x,y},[dx,dy])=>({x:x+dx,y:y+dy}),{x:state.player.x,y:state.player.y});
 if(fromTouch&&!route.length&&!(near?adjacent(state.player,p):pos(state.player)===pos(p)))touchFeedback='这里暂时走不到，试试旁边的道路。';
 pendingMove=null;retryMoveAt=0;update();
}
function saveFile(raw){
 const damaged=typeof raw==='string';
 const a=document.createElement('a'),url=URL.createObjectURL(new Blob([damaged?raw:storage.encode(state)],{type:'application/json'}));
 a.href=url;a.download=damaged?'雾溪农场-损坏备份.json':'雾溪农场-第'+state.day+'天.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),8000);
}
function chooseFile(){
 const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
 input.onchange=async()=>{const f=input.files?.[0];if(!f)return;
  try{pendingImport=f.size<=600000?storage.decode(await f.text(),E.restore):null;}catch{pendingImport=null;}
  renderPanel(pendingImport?'已读取：第 '+pendingImport.day+' 天，'+pendingImport.gold+' G。确认后才会换档。':'这个文件不是有效的雾溪存档，当前进度未改动。');
 };input.click();
}
function swapSave(next){
 if(!next)return;
 if(!storage.write(disk,next,E.restore,{previousState:state})){renderPanel('浏览器未许可写入存档，当前进度未改动。');return;}
 state=next;pendingImport=null;route=[];selected=null;hovered=null;clearTouchTarget();resetWalk();tool='hoe';seed='turnip';lastList='';update();panel.close();tell('已切换存档，上一份保留为备份。',true);
}
function addGroup(parent,cls){const el=document.createElement('div');el.className=cls;parent.append(el);return el;}
function cardButton(label,detail,fn,accent=false){
 const b=qButton(label,fn,accent);const sub=document.createElement('small');sub.textContent=detail;b.append(sub);return b;
}
function ferryInfo(){
 const sp=state.spring, base=E.ferryStatus(state);
 return {sp,base,errands:base.errandRoute.met,wood:base.wood,canMaterials:state.day>=E.SPRING.errandsDay&&base.canMaterials,canErrands:base.canErrands};
}
function ferryPanel(body,row,orderMode=false){
 const f=ferryInfo();const sp=f.sp;
 if(state.day<3){paragraph(body,'春日第 3 天开放修船委托。那之前可以种菜，以及在溪岸捡浮木。');return;}
 if(sp?.repaired){
  if(orderMode){paragraph(body,'渡船已经修好。去东岸池塘旁的木码头乘船。');row.append(qButton('前往渡口',()=>goTo(waypoints.dock,true)));return;}
  paragraph(body,region()==='shoal'?'浅滩与村庄之间随时可往返。':'陆舟摇向下游，那里有不一样的水域和资源。');
  row.append(qButton(region()==='shoal'?'乘船回溪谷村':'乘船去芦苇浅滩',()=>doPanel('sail'),true));return;
 }
 paragraph(body,'两条路线任选一条。修好后可以乘船去浅滩。');
 const grid=addGroup(body,'ferry-paths');
 const a=cardButton('备料修船','浮木 '+f.wood+' / '+f.base.materials.wood+' · 工费 '+f.base.materials.gold+' G',()=>doPanel('repairFerry','materials'));a.disabled=!f.canMaterials;
 const b=cardButton('帮村民跑腿','村民委托 '+f.errands+' / 2 · 工费 '+f.base.errandRoute.gold+' G',()=>doPanel('repairFerry','errands'));b.disabled=!f.canErrands;grid.append(a,b);
 paragraph(body,'浮木每天会被溪水带来。跑腿请从第 3 天起，分别去找农夫和店主。');
}
function renderPanel(feedback=''){
 const body=$('panelBody');body.replaceChildren();
 const mode=modalMode, title={shop:'溪口杂货铺',ship:'农场出货箱',sleep:'回木屋休息',dialogue:modalData?.npc?.name||modalData?.name||'和村民聊一聊',order:'河畔委托板',repair:'雾溪的旧水灯',help:'从今天开始种田',calendar:'雾溪农事历',saves:'农场存档',map:'溪谷地图',workshop:'松木加工坊',ranch:'河畔畜棚',barnSite:'畜棚工地',newSave:'开始新农场',seeds:'选择种子',bag:'帆布背包',ferry:'芦苇渡口',gather:'沿溪采集'}[mode];
 $('panelTitle').textContent=title;$('panelLabel').textContent=['help','saves','newSave'].includes(mode)?'雾溪指南':'四季手记';
 const row=document.createElement('div');row.className='modal-row';
 if(mode==='shop'){
  const day=dateOf(), available=crops().filter(([id])=>isNative(id,day.season));
  paragraph(body,day.seasonName+'种子上架了。你有 '+state.gold+' G，买回去后从种子袋挑选。');
  const grid=addGroup(body,'seed-grid');
  for(const [id,o] of available){
   const late=!canFinish(o,day);
   const b=cardButton(o.seedName,o.seedPrice+' G · '+o.days+' 天成熟 · '+(late?'本季来不及收':'持有 '+(state.inventory[o.seed]||0)),()=>doPanel('buySeed',id));
   b.disabled=state.gold<o.seedPrice;grid.append(b);
  }
  paragraph(body,'萝卜和豆子全年供应，其余种子随季节轮换。');
 }else if(mode==='seeds'){
  const day=dateOf(), seedRows=crops().filter(([id,o])=>isNative(id,day.season)||(state.inventory[o.seed]||0)>0);
  paragraph(body,'选好种子，再点翻过的地播种。现在是'+day.seasonName+'第 '+day.seasonDay+' 日。');
  const grid=addGroup(body,'seed-grid');
  for(const [id,o] of seedRows){
   const n=state.inventory[o.seed]||0,on=isNative(id,day.season),late=on&&!canFinish(o,day);
   const b=cardButton(o.seedName,'持有 '+n+' · '+(on?(late?'本季来不及成熟':o.days+' 天成熟'):cropSeasonText(o)),()=>pickSeed(id),seed===id&&n>0&&on&&!late);
   b.disabled=!n||!on||late;grid.append(b);
  }
 }else if(mode==='ship'){
  paragraph(body,'睡过一晚再收货款。留些常见溪鱼和作物给旧水灯委托。');
  const stock=products().filter(id=>state.shipped[id]>0).map(i=>itemName(i)+' '+state.shipped[i]);
  paragraph(body,'待出货：'+(stock.join(' · ')||'还没有'));
  for(const type of products()){const n=state.inventory[type]||0;if(n)row.append(qButton('寄出 '+itemName(type)+' · '+n,()=>doPanel('ship',type)));}
  const all=qButton('全部寄出',()=>doPanel('ship','all'),true);all.disabled=row.children.length===0;row.append(all);
 }else if(mode==='sleep'){
  paragraph(body,'睡一晚会回满体力，浇过水的作物会长大，出货的钱也会到账。');
  const cal=dateOf(), morning=E.calendar({...state,day:state.day+1}), weather=forecastNames[E.weatherFor(state.seed,state.day+1)];
  const changing=cal.season!==morning.season;
  if(changing)paragraph(body,'明天进入'+morning.seasonName+'，天气：'+weather+'。不适应下一季、还未成熟的作物会退回种子；成熟的仍可收获。');
  else paragraph(body,'明日天气：'+weather+'。');
  row.append(qButton('睡到'+morning.seasonName+' '+morning.seasonDay+' 日',()=>doPanel('sleep'),true));
 }else if(mode==='dialogue'){
  paragraph(body,modalStarter||'风从溪上吹过来。');
  const npc=modalData?.npc;
  if(npc?.id){
   const n=state.spring.relationships[npc.id]||0;const kin=n>=8?'熟朋友':n>=3?'渐渐熟悉':'初次相识';paragraph(body,'关系：'+kin+' · 默契 '+n);
   if(E.GIFT_TASTES){
    const gifts=Object.entries(state.inventory).filter(([id,qty])=>qty>0&&!id.endsWith('Seed')&&E.GIFT_ITEMS.includes(id));
    if(state.outworld.gifted?.[npc.id]===state.day)paragraph(body,'今天已经送过礼了。');
    else if(gifts.length){
     const h=document.createElement('h3');h.textContent='送一份礼物';body.append(h);
     const box=addGroup(body,'seed-grid');
     for(const [id,qty] of gifts){const b=cardButton(itemName(id),'持有 '+qty+' · 送出 1 份',()=>doPanel('gift',id));box.append(b);}
    }
   }
  }
  if(npc?.id==='ferryman'||npc==='ferryman')row.append(qButton('前往渡口',()=>goTo(waypoints.dock,true)));
 }else if(mode==='order'){
  ferryPanel(body,row,true);
  const h=document.createElement('h3');h.textContent='旧水灯委托';body.append(h);
  const n=state.orders||0;
  if(n>=E.ORDERS.length)paragraph(body,'两张委托已完成。去杂货铺右边看看旧水灯。');
  else {const o=E.ORDERS[n];paragraph(body,'「'+o.title+'」：'+Object.entries(o.need).map(([item,qty])=>qty+' 份'+itemName(item)).join('、')+'。报酬 '+o.reward+' G。');row.append(qButton('提交旧灯委托',()=>doPanel('order')));}
 }else if(mode==='repair'){
  paragraph(body,modalStarter||'旧水灯已经很久没有亮了。试着完成村民的两张委托。');
  if(!state.repaired){const b=qButton('修复水灯 · '+E.REPAIR_COST+' G',()=>doPanel('repair'),true);b.disabled=state.orders<E.ORDERS.length||state.gold<E.REPAIR_COST;row.append(b);}
 }else if(mode==='ferry'){
  ferryPanel(body,row);
 }else if(mode==='map'){
  paragraph(body,'你在'+worldTiles[region()].title+'。选择一个地点，角色会走向下一段路的入口。走到标牌或门口可切换区域。');
  const grid=addGroup(body,'atlas');
  for(const [r,o] of Object.entries(worldTiles)){
   const current=r===region(), closed=r==='shoal'&&!state.spring.repaired, unbuilt=r==='barn'&&!state.ranch.built;
   const dest={valley:{x:9,y:9},town:{x:23,y:10},grove:{x:28,y:12},house:{x:8,y:7},store:{x:16,y:7},barn:unbuilt?ranchSite():trough(),shoal:{x:8,y:9}}[r];
   const b=cardButton(o.title,closed?'修好渡船后解锁':unbuilt?'前往农场工地，看看建造条件':(current?'你在这里 · ':'')+o.desc,()=>goTo({...dest,region:unbuilt?'valley':r}),current);
   if(current)b.setAttribute('aria-current','location');b.disabled=closed;grid.append(b);
  }
  const q=addGroup(body,'world-board');
  if(region()==='valley'){q.append(qButton('前往渡口',()=>goTo(waypoints.dock,true)),qButton('前往委托板',()=>goTo(waypoints.board,true)));}
 }else if(mode==='barnSite'){
  const b=E.RANCH.build;
  if(state.ranch.built){paragraph(body,'围栏和食槽都准备好了，还送来了一只鸭子。屋里可以喂食、买动物。');row.append(qButton('走进畜棚',()=>goTo(ranchSite()),true));}
  else {
   paragraph(body,'在农舍西边建一间畜棚。完工送一只小鸭和 3 份干草。');
   paragraph(body,'需要 '+b.gold+' G 和 '+b.wood+' 份木料。你有 '+state.gold+' G、'+state.spring.wood+' 份木料。可以在溪岸或苔影林采集木料。');
   const build=qButton('建造畜棚',()=>doPanel('barnBuild'),true);build.disabled=state.gold<b.gold||state.spring.wood<b.wood;row.append(build);
  }
 }else if(mode==='ranch'){
  const r=state.ranch, capacity=E.RANCH.capacity[r.level]||0;
  paragraph(body,'动物 '+r.animals.length+' / '+capacity+' · 干草 '+r.hay+' 份。喂过食的鸭子隔夜下蛋，绵羊每喂满两天能收一次羊毛。漏喂只会暂停产出。');
  const stack=addGroup(body,'ranch-list');
  for(const a of r.animals){
   const spec=E.ANIMALS[a.species], card=addGroup(stack,'ranch-animal');
   const title=document.createElement('strong');title.textContent=(a.name||spec.name)+(a.ready?' · 可以收取':'');card.append(title);
   const flags=[];
   flags.push(a.fedDay===state.day?'已喂食':'未喂食',a.petDay===state.day?'已抚摸':'可抚摸','亲密 '+a.affection);
   paragraph(card,flags.join(' · '));
   const care=addGroup(card,'ranch-care');
   const feed=qButton('喂干草',()=>doPanel('animalFeed',a.id)), pet=qButton('摸摸',()=>doPanel('animalPet',a.id)), collect=qButton('收取 '+itemName(spec.product),()=>doPanel('animalCollect',a.id),true);
   feed.disabled=!r.hay||a.fedDay===state.day;pet.disabled=a.petDay===state.day;collect.disabled=!a.ready;
   care.append(feed,pet,collect);
  }
  const store=addGroup(body,'seed-grid');
  for(const qty of [1,5]){
   const buy=cardButton('买 '+qty+' 份干草',qty*E.RANCH.hayPrice+' G',()=>doPanel('hayBuy',qty));buy.disabled=state.gold<qty*E.RANCH.hayPrice;store.append(buy);
  }
  for(const [id,o] of Object.entries(E.ANIMALS)){
   const buy=cardButton('领养'+o.name,o.price+' G',()=>doPanel('animalBuy',id));buy.disabled=r.animals.length>=capacity||state.gold<o.price;store.append(buy);
  }
  if(r.level<2){const d=E.RANCH.upgrade,b=cardButton('扩建畜棚',d.gold+' G · '+d.wood+' 份木料',()=>doPanel('barnUpgrade'),true);b.disabled=state.gold<d.gold||state.spring.wood<d.wood;row.append(b);}
 }else if(mode==='workshop'){
  const upgrade=addGroup(body,'workbench-upgrade'), u=E.RANCH.toolUpgrade;
  if(state.ranch.toolLevel===2)paragraph(upgrade,'强化水壶已就绪：省体力，一次可浇五格。');
  else {
   paragraph(upgrade,'铁匠能强化水壶。浇水更省力，批量浇水从三格增到五格。');
   const b=cardButton('强化水壶',u.gold+' G · '+u.wood+' 份木料',()=>doPanel('toolUpgrade'));b.disabled=state.gold<u.gold||state.spring.wood<u.wood;upgrade.append(b);
  }
  const st=E.workshopStatus(state);
  if(st.recipe){
   paragraph(body,itemName(typeof st.recipe==='string'?st.recipe:st.recipe.id)+'：'+(st.ready?'已加工完毕。':'预计第 '+st.readyDay+' 天可以取出。'));
   const b=qButton('取出成品',()=>doPanel('workshopCollect'),true);b.disabled=!st.ready;row.append(b);
  }else{
   paragraph(body,'把两份原料放进去，睡过一晚就能取成品，寄出后收款。');
   const grid=addGroup(body,'seed-grid');
   for(const [id,recipe] of Object.entries(E.WORKSHOP.recipes)){
    const need=Object.entries(recipe.need);
    const b=cardButton(itemName(id),need.map(([input,qty])=>itemName(input)+' × '+qty).join(' · ')+' · '+recipe.days+' 晚',()=>doPanel('workshopStart',id));
    b.disabled=need.some(([input,qty])=>(state.inventory[input]||0)<qty);grid.append(b);
   }
  }
 }else if(mode==='gather'){
  paragraph(body,modalStarter||'溪水留下了一些浮木。');
  const gather=qButton('采集',()=>doPanel('gather'),true);gather.disabled=modalData?.available===false;row.append(gather);
 }else if(mode==='bag'){
  const inv=Object.entries(state.inventory).filter(([,v])=>v>0);
  paragraph(body,'备料浮木：'+(state.spring?.wood||0)+'。'+(inv.length?'':'背包里还没有物品。'));
  for(const [id,n] of inv){const node=document.createElement('div');node.className='stock-row';node.textContent=itemName(id)+' × '+n;body.append(node);}
  const h=document.createElement('h3');h.textContent='溪谷鱼谱';body.append(h);
  for(const [id,fish] of Object.entries(E.FISH)){
   const n=state.spring.fishCaught[id]||0;
   paragraph(body,(n?fish.name+' · 已钓获 '+n:'尚未收录')+'　｜　'+fish.habitat);
  }
 }else if(mode==='calendar'){
  const cal=dateOf(), sp=state.spring, shown=calendarFocus||cal.season, active=shown===cal.season;
  paragraph(body,cal.label+' · '+cal.weekday);
  const weather=addGroup(body,'forecast');
  for(const v of ['今天 · '+forecastNames[weatherOf()],'明天 · '+forecastNames[E.weatherFor(state.seed,state.day+1)],cal.daysLeft?'距换季 '+(cal.daysLeft+1)+' 晚':'今晚换季']){
   const n=document.createElement('span');n.textContent=v;weather.append(n);
  }
  const tabs=addGroup(body,'season-planner');
  for(const key of seasons){
   const b=qButton(seasonNames[key],()=>{calendarFocus=key;renderPanel();});
   b.setAttribute('aria-pressed',String(key===shown));tabs.append(b);
  }
  const grid=addGroup(body,'calendar-grid');
  const special=shown==='spring'&&cal.year===1?{1:'返乡',3:'修船委托',7:'早春小结',14:'换季'}:{1:'本季开始',14:'换季'};
  for(let d=1;d<=14;d++){
   const n=document.createElement('span');n.textContent=d;const current=active&&d===cal.seasonDay;
   n.className=(current?'today ':active&&d<cal.seasonDay?'past ':'')+(special[d]?'event-day ':'')+(d===14?'last-day':'');
   n.title=special[d]||seasonNames[shown];if(current)n.setAttribute('aria-current','date');grid.append(n);
  }
  paragraph(body,seasonTips[shown]);
  paragraph(body,'可种：'+crops().filter(([id])=>isNative(id,shown)).map(([,c])=>c.name).join('、')+'。');
  if(shown==='spring'&&cal.firstWeekComplete&&cal.year===1)paragraph(body,'早春小结：'+(sp?.visited?'渡船已启航，也踏上了芦苇浅滩。':sp?.repaired?'渡船已修好，下次去东岸搭船吧。':'两条修船路线仍然开放。'));
  row.append(qButton(region()==='shoal'?'前往回程栈桥':'前往渡口',()=>goTo(region()==='shoal'?waypoints.shoalDock:waypoints.dock,true)));
  const wait=qButton('等一小时',()=>doPanel('wait'));wait.disabled=state.minute>=1320;row.append(wait);
 }else if(mode==='saves'){
  paragraph(body,'游戏自动保存到此浏览器。换设备或清理浏览器之前，先导出一份。');
  row.append(qButton('导出存档',saveFile,true),qButton('打开存档文件',chooseFile));
  const old=storage.backup(disk,E.restore);
  const damaged=storage.damaged(disk);
  if(damaged){const keep=qButton('导出损坏档（供排查）',()=>saveFile(damaged));row.append(keep);}
  if(old)row.append(qButton('查看上一份备份',()=>{pendingImport=old;renderPanel('备份：第 '+old.day+' 天，'+old.gold+' G。确认后才会换档。');}));
  if(pendingImport)row.append(qButton('确认换成这份存档',()=>swapSave(pendingImport),true));
  else row.append(qButton('新建农场',()=>showPanel('newSave',null)));
 }else if(mode==='newSave'){
  paragraph(body,'从春季第 1 日开始。当前进度会先保留为上一份备份。建议也导出一份，以便之后恢复。');
  row.append(qButton('先导出当前存档',saveFile),qButton('确认开启新农场',()=>swapSave(E.create()),true));
 }else {
  paragraph(body,'把溪边的小农场打理起来。等到春日第 3 天，和村民一起修好渡船，去看看下游。');
  const l=document.createElement('ul');
  for(const item of ['方向键或 WASD 移动，也可以点地图自动走过去。地图右上角可放大。','数字键 1、2、3、4、5 分别选锄头、水壶、萝卜种、豆种、鱼竿。其他种子从种子袋选。','批量浇水可按 Shift 加用工具键，或直接点「浇一排」。','钓鱼时等光标进金色区再按空格。按 M 或点右上的「地图」，看看道路和房门通到哪儿。']){const li=document.createElement('li');li.textContent=item;l.append(li);}body.append(l);
  const h=document.createElement('h3');h.textContent='电脑操作模式';body.append(h);
  const settings=addGroup(body,'modal-row settings');
  for(const [id,name] of [['guided','点地图'],['classic','经典键鼠']]){
   const b=qButton(name,()=>setControls(id));b.setAttribute('aria-pressed',String(id===controls));settings.append(b);
  }
  paragraph(body,controls==='classic'?'方向键或 WASD 移动，左键 / C 用工具，右键 / X 互动，E 开背包，滚轮换工具。手机仍用点地图。':'点地图走近目标，空格用工具，E 互动。也可以在上方切换经典键鼠。');
  row.append(qButton('继续游戏',()=>panel.close(),true));
 }
 if(row.children.length)body.append(row);
 if(feedback){const n=document.createElement('div');n.className='modal-status';n.setAttribute('role','status');n.textContent=feedback;body.append(n);}
}
function doPanel(name,param){
 const r=action(name,modalTile,param);
 if(!r)return;
 if(r.ok&&['sleep','repair','sail','gather'].includes(name)){selected=null;panel.close();update();return;}
 renderPanel(r.msg);
}
$('close').onclick=()=>panel.close();
panel.addEventListener('click',ev=>{if(ev.target!==panel)return;const b=panel.getBoundingClientRect();if(ev.clientX<b.left||ev.clientX>b.right||ev.clientY<b.top||ev.clientY>b.bottom)panel.close();});
panel.addEventListener('close',()=>{modalMode=null;canvas.focus({preventScroll:true});});
$('help').onclick=()=>showPanel('help',null,'');
$('ranchLink').onclick=()=>goTo(region()==='barn'?trough():ranchSite(),!state.ranch.built||region()==='barn');
$('map').onclick=()=>showPanel('map',null);
$('calendar').onclick=()=>{calendarFocus=null;showPanel('calendar',null);};
$('bagOpen').onclick=()=>showPanel('bag',null);
$('saves').onclick=()=>{pendingImport=null;showPanel('saves',null);};
$('zoom').onclick=()=>{zoom=!zoom;$('zoom').textContent=zoom?'−':'＋';$('zoom').setAttribute('aria-pressed',String(zoom));$('zoom').setAttribute('aria-label',zoom?'缩小地图':'放大地图');update();};
$('sound').onclick=()=>{sound=!sound;S?.set(sound);$('sound').setAttribute('aria-pressed',String(sound));$('sound').textContent=sound?'♪ 声音开':'♪ 声音关';};
$('use').onclick=()=>tapAction(false);$('waterWide').onclick=()=>tapAction(true);$('interact').onclick=interact;
function pointerTile(ev){
 const b=canvas.getBoundingClientRect(), vx=(ev.clientX-b.left)*720/b.width,vy=(ev.clientY-b.top)*432/b.height;
 const p={x:Math.floor(vx/24+cam.x),y:Math.floor(vy/24+cam.y)};
 // Prefer the actual opening; the inset label also works as a touch shortcut.
 if(portal(p)?.cells)return p;
 const pad=Math.min(12,ev.pointerType==='touch'?720*4/b.width:0);
 const contains=(r,gap)=>vx>=r.x-gap&&vx<=r.x+r.w+gap&&vy>=r.y-gap&&vy<=r.y+14+gap;
 const active=waymarkRects.filter(r=>r.destination.region===region());
 const sign=active.find(r=>contains(r,0))||active.find(r=>r.destination.cells&&contains(r,pad));
 return sign?.destination||(inside(p.x,p.y)?p:null);
}
canvas.addEventListener('pointerdown',ev=>{
 if(panel.open||ev.button!==0&&ev.button!==2)return;
 if(ev.pointerType==='touch'){
  if(ev.isPrimary===false||ev.button!==0||fishing){touchGesture=null;return;}
  touchGesture={id:ev.pointerId,x:ev.clientX,y:ev.clientY,region:region()};return;
 }
 const mouse=controls==='classic';
 if(fishing){if(mouse&&ev.button===0){ev.preventDefault();use(false);}return;}
 const p=pointerTile(ev);if(!p)return;
 canvas.focus({preventScroll:true});
 if(!mouse){if(ev.button===0)goTo(p);return;}
 ev.preventDefault();route=[];clearTouchTarget();selected=p;hovered=p;update();
 if(ev.button===2){interact();return;}
 if(ev.button===0)use(ev.shiftKey);
});
function movedFinger(ev,g){return Math.hypot(ev.clientX-g.x,ev.clientY-g.y)>10;}
canvas.addEventListener('pointerup',ev=>{
 const g=touchGesture;
 if(ev.pointerType!=='touch'||!g||ev.pointerId!==g.id)return;
 touchGesture=null;
 if(panel.open||fishing||region()!==g.region||movedFinger(ev,g))return;
 const p=pointerTile(ev);
 if(p){canvas.focus({preventScroll:true});goTo(p,false,true);}
});
canvas.addEventListener('pointercancel',ev=>{if(ev.pointerId===touchGesture?.id)touchGesture=null;});
canvas.addEventListener('pointermove',ev=>{
 if(ev.pointerType==='touch'){
  const g=touchGesture;if(g&&ev.pointerId===g.id&&movedFinger(ev,g))touchGesture=null;
  return;
 }
 if(controls!=='classic'||fishing||route.length||panel.open)return;
 const p=pointerTile(ev);if(p&&(!hovered||pos(hovered)!==pos(p))){hovered=p;selected=null;clearTouchTarget();update();}
});
canvas.addEventListener('pointerleave',()=>{hovered=null;});
canvas.addEventListener('contextmenu',ev=>{if(controls==='classic')ev.preventDefault();});
canvas.addEventListener('wheel',ev=>{
 if(controls!=='classic'||panel.open||!ev.deltaY)return;ev.preventDefault();
 const tools=Object.keys(toolNames),i=tools.indexOf(tool);setTool(tools[(i+(ev.deltaY>0?1:tools.length-1))%tools.length]);
},{passive:false});
document.addEventListener('keydown',ev=>{
 if(ev.ctrlKey||ev.altKey||ev.metaKey)return;
 const k=ev.key.toLowerCase();
 if(panel.open)return;
 if(k==='escape'&&fishing){stopFishing();return;}
 if(movekeys[k]){
  ev.preventDefault();
  if(!keys.has(k)&&!fishing){
   keys.add(k);route=[];selected=null;clearTouchTarget();retryMoveAt=0;
   const now=performance.now();
   if(walker.active(now))pendingMove=k;
   else {pendingMove=null;move(...movekeys[k],true,now);update();}
  }
  return;
 }
 if((k===' '&&!(ev.target instanceof HTMLButtonElement)||k==='c'&&controls==='classic')){ev.preventDefault();if(!ev.repeat)use(ev.shiftKey);return;}
 if(k==='m'){ev.preventDefault();if(!ev.repeat)showPanel('map',null);return;}
 if(k==='x'&&controls==='classic'||k==='e'&&controls!=='classic'){ev.preventDefault();if(!ev.repeat)interact();return;}
 if((k==='e'||k==='escape')&&controls==='classic'){ev.preventDefault();if(!ev.repeat)showPanel('bag',null);return;}
 if(/^[1-5]$/.test(k)){ev.preventDefault();if(k==='3'||k==='4')pickSeed(k==='3'?'turnip':'bean');else setTool({1:'hoe',2:'water',5:'fish'}[k]);}
});
document.addEventListener('keyup',ev=>keys.delete(ev.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();pendingMove=null;touchGesture=null;});window.addEventListener('pagehide',save);
function drawWaymarks(t){
 waymarkRects=[];ctx.save();ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 for(const p of E.PORTALS.filter(p=>p.region===region()&&E.portalEnabled(state,p))){
  const x=(p.x-cam.x+.5)*24, y=(p.y-cam.y)*24;
  if(x<-20||x>740||y<-20||y>450)continue;
  const label=p.label;
  const x1=Math.max(50,Math.min(670,x)), yy=Math.max(28,y-5);
  const w=Math.min(112,ctx.measureText(label).width+13), lit=portal(selected)===p;
  waymarkRects.push({x:x1-w/2,y:yy-15,w,destination:p});
  ctx.fillStyle=lit?'#735d32':'#19322be9';ctx.fillRect(Math.round(x1-w/2),Math.round(yy-15),Math.ceil(w),14);
  ctx.strokeStyle='#eacb86';ctx.strokeRect(Math.round(x1-w/2)+.5,Math.round(yy-15)+.5,Math.ceil(w)-1,13);
  ctx.fillStyle='#ffedb8';ctx.fillText(label,x1,yy-7.5,w-6);
  if(!p.cells){ctx.fillStyle='#f4d087';ctx.fillRect(Math.round(x-2),Math.round(y+9+Math.sin(t/220)*2),4,5);}
 }
 ctx.restore();
}
function frame(t){
 if(!panel.open&&!fishing&&!walker.active(t)&&t>=retryMoveAt){
  let held;
  for(const k of keys)held=k;
  const k=pendingMove||held;
  if(k){pendingMove=null;move(...movekeys[k],true,t);update();}
  else if(route.length){
   const step=route.shift();if(!move(...step,false,t)){route=[];routeStop=null;if(touchTarget)touchFeedback='路被挡住了，再点一次目标。';}update();
  }
 }
 if(fishing)$('fishNeedle').style.left=(reelPower(t-fishing.start)*100)+'%';
 stageFX.reducedMotion=!!reducedMotion?.matches;
 stageFX.player=walker.sample(state.player,t,stageFX.reducedMotion);
 if(!route.length&&!walker.active(t))routeStop=null;
 stageFX.stopTile=routeStop;
 view(stageFX.player);
 if(region()==='valley'||region()==='shoal')A.draw(ctx,state,t,target(),stageFX);
 else W.draw(ctx,state,t,target(),stageFX,cam);
 drawWaymarks(t);
 requestAnimationFrame(frame);
}
resetWalk();createTools();update();
if(startup.source==='legacy'){save();tell('旧存档已迁移到养殖版，原存档仍保留。',true);}
else if(startup.source==='backup'){save();tell('主存档读不到，已恢复上一份备份。',true);}
else if(startup.bad)tell('原存档读不到。你可以到「存档」尝试导入之前导出的备份。');
else tell(startup.state?'欢迎回到雾溪。':'欢迎来到雾溪！先拿面前这块地练练手。');
requestAnimationFrame(frame);
})();
