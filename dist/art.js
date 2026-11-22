(() => {
'use strict';
const W=720,H=432,T=24;
const G=['#6e9460','#769b65','#739660','#719961','#789d67'];
const SEASON={
 spring:{},
 summer:{grass:['#598c58','#60955c','#63995f','#5b9057','#669b60'],field:['#719f62','#598751','#598753','#82aa70'],dirt:['#8c9768','#b5a679','#b5a579','#cfb886','#9d9069','#82a272','#8e9e68'],flower:['#f6c970','#ffdc8a','#d58bb1','#f0a383'],bank:['#5f987b','#71a589'],plot:['#648850','#8e925a','#8d915b','#a1a168','#7e8a54','#a29f6e']},
 autumn:{grass:['#ab935f','#b09a65','#b29965','#a8905c','#b79f69'],field:['#c2aa70','#ad935d','#ac915a','#d2b57d'],dirt:['#a69165','#c8ab7b','#c2a576','#d7b98a','#aa9169','#b59b64','#b39862'],flower:['#e5ad68','#f2bc80','#ca866e','#dc955c'],bank:['#9f9c71','#b0ab7c'],plot:['#8e8058','#a69265','#a39265','#b29a6c','#8f865d','#b19a6e']},
 winter:{grass:['#bacbd0','#c3d2d4','#bfd0d3','#b7cad0','#c9d8d7'],field:['#dae4e0','#aabbc2','#a6bbc0','#dee9e3'],dirt:['#b4c4c6','#a5a5a3','#abaaa6','#c4c9c3','#939c9f','#dce5df','#d1dfdb'],flower:['#e4c1a4','#e2daca','#c5cbdb','#d8c0a6'],bank:['#b1c9c5','#d6e4d9'],plot:['#96a9a9','#a49b88','#9e9887','#b1aa98','#8d9485','#b5b2a2']}
};
const grassShadow='#608354',darkGrass='#587e54',water='#3a7775';
const amber='#ffd084', board='#af8055', wood='#513a33', rim='#544747';
const R=(c,x,y,w,h,k)=>{c.fillStyle=k;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function poly(c,k,pts){c.fillStyle=k;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fill();}
function rng(a){return()=>{a=(a*1664525+1013904223)>>>0;return a/4294967296;};}
const dirtCells=new Set();
const route=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)dirtCells.add(x+','+y);};
route(0,8,16,9);route(20,8,29,9);route(7,7,7,7);route(24,7,24,7);
route(23,10,24,11);route(4,10,4,14);route(14,10,14,14);route(5,15,13,15);route(10,16,10,17);
const seasonMemo=new WeakMap();
function seasonOf(state,engine=window.MistEngine){
 const prior=seasonMemo.get(state);
 if(prior?.engine===engine&&prior?.day===state.day&&prior?.alt===state.season)return prior.season;
 const value=engine?.calendar?.(state)?.season??state.season;
 const season=Object.hasOwn(SEASON,value)?value:'spring';
 seasonMemo.set(state,{engine,day:state.day,alt:state.season,season});
 return season;
}
function flurries(c,t,weather,season){
 if(weather==='snow'){
  const a=rng(1525);
  for(let i=0;i<66;i++){
   const speed=.018+(i%9)*.0028;
   const x=(a()*W+t*(.008+i%5*.001)+Math.sin(t/630+i)*7+W)%W;
   const y=(a()*H+t*speed)%H, n=i%9===0?3:i%4===0?2:1;
   c.globalAlpha=.30+(i%6)*.095;R(c,x,y,n,n,i%3===0?'#dcebee':'#fcfff6');
   if(i%9===0){R(c,x-1,y+1,5,1,'#f2fbf6');R(c,x+1,y-1,1,5,'#f2fbf6');}
  }
 }else if(weather==='fog'){
  const a=rng(458);
  c.globalAlpha=.12;R(c,0,0,W,H,'#d7e1d7');
  for(let i=0;i<19;i++){
   const x=(a()*W+t*(.004+i%3*.001)+W)%W,y=a()*H,s=36+a()*149;
   c.globalAlpha=.048+(i%4)*.012;
   R(c,x-93,y,s,4+i%7,'#e8eddf');R(c,x-74,y-3,s*.73,3,'#edf6e9');R(c,x-81,y+4,s*.85,6,'#e6f3e6');
  }
 }else if(season==='autumn'){
  const a=rng(3562);
  for(let i=0;i<16;i++){
   const x=(a()*W+t*(.009+i%4*.0014)+Math.sin(t/701+i)*8+W)%W;
   const y=(a()*H+t*(.008+i%4*.003))%H,b=Math.floor(t/161+i)%3;
   c.globalAlpha=.44+(i%4)*.10;R(c,x,y,2+b,2,i%4===0?'#edc27e':'#c97950');
   R(c,x+1,y+2,1,1,'#bc744c');
  }
 }
 c.globalAlpha=1;
}
function drift(c,x,y,w,h){
 const k=['#afc4c9','#dde8e2','#eaf0e8'];
 R(c,x+2,y+2,w-4,h-1,k[0]);R(c,x+3,y,w-6,h-1,k[1]);R(c,x+5,y-2,w-10,h-1,k[1]);
 if(w>12)R(c,x+6,y-2,w-12,1,k[2]);R(c,x+4,y+1,4,1,k[2]);
}
function isWater(x,y){return x>=17&&x<=19||x>=23&&x<=27&&y>=12&&y<=15;}
function tuft(c,x,y,k,l){R(c,x,y,2,3,k);R(c,x+2,y+2,2,4,k);R(c,x+4,y+1,2,4,k);if(l)R(c,x+1,y+3,2,2,l);}
function flower(c,x,y,k){R(c,x+2,y+4,1,4,'#3f6950');R(c,x,y+1,5,3,k);R(c,x+1,y,3,5,k);R(c,x+2,y+2,1,1,'#ffe1a0');}
function stone(c,x,y,s=1,tones=['#506960','#6c8173','#a3a38b']){
 R(c,x+2*s,y+6*s,12*s,2*s,'#567759');
 R(c,x+s,y+3*s,13*s,5*s,tones[0]);R(c,x+4*s,y+s,8*s,6*s,tones[1]);R(c,x+4*s,y+s,6*s,2*s,tones[2]);R(c,x+9*s,y+5*s,4*s,2*s,tones[0]);
}
function tree(c,x,y,size=1,type=0,season='spring'){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(size,size);
 const autumn=type===2?['#476344','#627847','#819055','#aaa363']:type?
 ['#765445','#9f614b','#c57951','#dfa46a']:['#745d43','#a4764b','#bd914e','#d7aa61'];
 const shade=season==='autumn'?autumn:season==='winter'?type===2?['#3b6260','#567976','#7e9a95','#bdd2cc']:['#5c7978','#7d9a99','#b4c9c5','#deebe2']:
  season==='summer'?type===2?['#2c573f','#3b724b','#548853','#79a76d']:['#305e45','#42804c','#62a05c','#83af71']:
  type?['#385c4c','#4e7653','#72915e','#8aa66a']:['#365f4c','#497853','#638e59','#8da66a'];
 const shadow={summer:'#4c7b4e',autumn:'#9f8556',winter:'#a5bbc2'}[season];
 R(c,-21,1,46,4,shadow||'#628558');R(c,-30,-2,54,4,shadow||'#638657');R(c,-13,5,31,2,shadow||'#628558');
 R(c,-7,-12,13,18,'#554b37');R(c,-6,-8,4,12,'#94724a');R(c,3,-3,3,8,'#6c5c40');
 if(type===2){
  poly(c,shade[0],[[-1,-55],[-8,-45],[-6,-45],[-16,-34],[-11,-34],[-22,-20],[-13,-20],[-26,-8],[26,-8],[16,-20],[21,-20],[12,-34],[16,-34],[7,-45],[9,-45],[2,-55]]);
  poly(c,shade[1],[[-1,-53],[-10,-37],[-4,-37],[-16,-25],[-8,-24],[-23,-11],[11,-11],[4,-17],[17,-17],[6,-28],[11,-28],[3,-41],[5,-41],[1,-53]]);
  poly(c,shade[2],[[-1,-50],[-8,-37],[-4,-37],[-15,-25],[-8,-25],[-17,-16],[-4,-18],[1,-23],[9,-23],[0,-31],[5,-33]]);
  R(c,-8,-34,3,2,shade[3]);R(c,-14,-21,5,2,shade[3]);
  if(season==='winter'){
   for(const [dx,dy,ww] of [[-3,-50,7],[-9,-39,11],[3,-35,9],[-16,-28,11],[5,-23,12],[-21,-16,13],[-5,-15,17]]){R(c,dx,dy,ww,2,'#c9dbd6');R(c,dx+2,dy-1,ww-4,1,'#e5efe5');}
  }
 }else {
  const rows=[[-8,-60,20,5],[-21,-55,43,6],[-27,-49,56,9],[-31,-40,62,13],[-28,-27,57,10],[-22,-17,48,7],[-13,-10,30,4]];
  for(const [xx,yy,w,h] of rows)R(c,xx,yy,w,h,shade[0]);
  for(const [xx,yy,w,h] of [[-8,-58,17,8],[-19,-53,38,8],[-25,-45,49,14],[-28,-33,49,12],[-21,-23,42,6],[-12,-17,31,4]])R(c,xx,yy,w,h,shade[1]);
  for(const [xx,yy,w,h] of [[-11,-56,20,6],[-17,-51,33,5],[-23,-45,37,7],[-25,-38,36,6],[-19,-31,17,5],[0,-31,13,5]])R(c,xx,yy,w,h,shade[2]);
  for(const [xx,yy,w,h] of [[-13,-53,10,3],[-20,-46,12,3],[-16,-39,7,3],[2,-49,8,3],[12,-35,7,3],[-23,-27,6,3],[-6,-25,6,2]])R(c,xx,yy,w,h,shade[3]);
  if(season==='winter')for(const [l,yy,w] of [[-7,-57,14],[-18,-50,26],[-24,-42,16],[4,-46,16],[-18,-32,13],[4,-31,16],[-9,-23,12]]){R(c,l,yy,w,3,'#d5e3dc');R(c,l+2,yy-1,w-4,1,'#e9f0e9');}
  if(type===1&&season!=='winter')for(const [xx,yy] of [[-14,-35],[8,-45],[4,-29],[17,-31]]){R(c,xx,yy,4,3,'#c47854');R(c,xx,yy,2,1,'#ebad74');}
 }
 c.restore();
}
function riverShape(c,season){
 const [edge,cap]=SEASON[season].bank||['#729e86','#79a58a'];
 for(let y=0;y<H;y+=4){
  const dx=Math.round(Math.sin(y*.031)*3)+Math.round(Math.sin(y*.077)*2);
  R(c,408,y,72,4,'#4e8064');R(c,410+Math.max(0,dx),y,68-Math.abs(dx),4,'#65947b');
  R(c,414+dx*.27,y,60-dx*.5,4,water);
  R(c,423+dx*.5,y,41-dx,4,'#38716e');
  if(y%20<5)R(c,414+dx,y,7,2,edge);
  if(y%24<5)R(c,467+dx,y+2,6,2,cap);
 }
 for(let y=288;y<384;y+=4){
  const d=y<296?8:y>=376?7:2;
  R(c,552+d,y,120-2*d,4,'#527e63');R(c,554+d,y,116-2*d,4,'#6c9c81');
  R(c,560+d,y,104-2*d,4,water);
  if(y%20===0)R(c,579+d,y+2,67-2*d,1,'#407773');
  if(y%24===0)R(c,559+d,y,10,2,season==='winter'?cap:'#9ab095');
 }
}
function streamBits(c,seed){
 const a=rng(seed);
 for(let i=0;i<72;i++){
  const y=Math.floor(a()*H),x=419+Math.floor(a()*43),l=3+a()*8;
  R(c,x,y,l,1,a()<.35?'#518981':'#43837a');
 }
 for(let i=0;i<31;i++){
  const x=564+Math.floor(a()*94),y=302+Math.floor(a()*72);
  R(c,x,y,2+a()*7,1,a()<.4?'#548981':'#468278');
 }
 for(const [x,y] of [[419,30],[469,63],[423,335],[430,408],[471,371],[649,352],[571,357],[652,321]]) {
  R(c,x,y,8,4,'#4d7d64');R(c,x+2,y,5,2,'#86ae6b');R(c,x+5,y,3,1,'#659259');
  if(x===649||x===423){R(c,x+3,y-1,2,2,'#edb4a0');R(c,x+4,y,2,1,'#f5d8cb');}
 }
 for(const [x,y] of [[408,54],[479,105],[409,279],[480,352],[553,361],[558,378],[664,369],[670,331]]){
  for(let j=0;j<5;j++){const dx=Math.floor(a()*11)-4,h=4+Math.floor(a()*10);R(c,x+dx,y-h,1,h,'#5a7b4f');if(j%2===0)R(c,x+dx-1,y-h,3,3,'#96734f');}
 }
}
function footbridge(c){
 const x=408,y=192;
 R(c,x-4,y+6,83,41,'#4b6150');R(c,x-4,y+4,81,40,'#4c4d3b');R(c,x-2,y+5,77,36,'#a4754d');
 for(let i=0;i<10;i++){let p=x+i*8;R(c,p,y+7,6,32,i%2?'#bc8b5a':'#c89763');R(c,p,y+7,1,31,'#e3b780');R(c,p+4,y+14+i%4*4,2,8,i%2?'#a17250':'#a6845b');}
 R(c,x-3,y+3,79,3,'#e4b27b');R(c,x-3,y+41,79,3,'#84583f');
 for(const i of [0,36,72])for(const j of [2,38]){
  R(c,x+i-2,y+j-2,5,8,'#644833');R(c,x+i-2,y+j-4,5,3,'#ccaa78');R(c,x+i-1,y+j-4,2,1,'#e3c495');
 }
}
function dock(c){
 const x=552,y=294;R(c,x-3,y+1,76,20,'#41685f');R(c,x-2,y,74,16,'#7b5c4a');
 for(let i=0;i<9;i++){R(c,x+i*8,y,6,14,'#bc9361');R(c,x+i*8,y,1,13,'#e1bb83');}
 for(const i of [0,33,68]){R(c,x+i,y-2,4,18,'#6c533e');R(c,x+i,y-2,4,2,'#eaca92');}
 R(c,x+69,y+14,3,9,'#4f5141');R(c,x+66,y+23,6,2,'#6fa694');
}
function pathGround(c,season){
 const a=rng(307),p=SEASON[season],g=p.grass||G;
 const [speck,shade,sprout,sun]=p.field||['#83a26b','#6f925d','#6d905b','#8ca678'];
 const d=p.dirt||['#9e9d70','#b6a77f','#b5a77d','#c5b28a','#a69772','#91a274','#9fa675'];
 for(let gy=0;gy<18;gy++)for(let gx=0;gx<30;gx++){
  const x=gx*T,y=gy*T;
  R(c,x,y,T,T,g[Math.floor(a()*g.length)]);
  for(let i=0;i<4;i++){
   const xx=x+Math.floor(a()*22),yy=y+Math.floor(a()*22),z=a();
   R(c,xx,yy,z>.82?4:2,z>.72?2:1,z>.63?speck:shade);
  }
  if(a()>.47){const xx=x+Math.floor(a()*15),yy=y+Math.floor(a()*14);if(season==='winter')drift(c,xx-3,yy,11,3);else tuft(c,xx,yy,sprout,sun);}
 }
 for(const key of dirtCells){
  const [gx,gy]=key.split(',').map(Number),x=gx*T,y=gy*T;
  R(c,x,y,T,T,d[0]);
  const L=dirtCells.has(`${gx-1},${gy}`), B=dirtCells.has(`${gx},${gy+1}`), U=dirtCells.has(`${gx},${gy-1}`),D=dirtCells.has(`${gx+1},${gy}`);
  R(c,x+(L?0:2),y+(U?0:2),T-(L?0:2)-(D?0:2),T-(U?0:2)-(B?0:2),a()<.45?d[1]:d[2]);
  for(let i=0;i<6;i++){
   const xx=x+Math.floor(a()*20)+1,yy=y+Math.floor(a()*20)+1;
   R(c,xx,yy,a()<.53?2:3,1,a()<.53?d[3]:d[4]);
  }
  if(!U)R(c,x+4,y,7,2,d[5]);
  if(!L)R(c,x,y+8,2,5,d[5]);
  if(!B)R(c,x+14,y+22,5,2,d[6]);
 }
}
function windowBox(c,x,y,w=20,h=18,lit=false){
 R(c,x-3,y-2,w+6,h+7,'#644d3e');R(c,x-1,y-1,w+2,h+3,'#e5ba8b');
 R(c,x+2,y+2,w-4,h-3,lit?'#eab562':'#546d65');
 R(c,x+3,y+3,w-8,3,lit?'#ffdb87':'#8fa995');
 R(c,x+w/2-1,y+1,2,h-1,'#e6c397');R(c,x+1,y+h/2, w-2,2,'#cba678');R(c,x-4,y+h+2,w+8,3,'#e7c28a');
}
function shingles(c,x,y,w,h,red,season){
 const base=red?['#6b493d','#98705c','#ac7759','#b88767','#795244']:['#3f6057','#59786a','#648578','#759184','#4d6d5e'];
 R(c,x-4,y+h-3,w+8,9,base[0]);
 for(let row=0;row<Math.ceil(h/6);row++){
  const yy=y+row*6, off=Math.max(0,12-row*3);
  R(c,x+off,yy,w-2*off,6,base[row<2?3:1]);
  for(let j=0;j<=(w-2*off)/13;j++){
   let xx=x+off+j*13-(row%2?5:0),n=Math.min(xx+11,x+w-off)-Math.max(xx,x+off);
   xx=Math.max(xx,x+off);
   if(n>1){R(c,xx,yy,n,1,row%3===0?base[3]:base[2]);R(c,xx,yy+5,n,1,base[4]);}
  }
 }
 R(c,x-3,y+h,w+6,4,base[0]);R(c,x-1,y+h,w+2,1,base[3]);
 if(season==='winter'){
  for(const [dx,dy,ww,hh] of [[13,0,w-26,5],[11,4,w-23,4],[6,8,w*.53,4],[31,11,w*.31,3],[w*.72,6,w*.18,6],[w*.79,13,w*.16,4],[19,h-5,w*.24,2]])drift(c,x+dx,y+dy,ww,hh);
  for(let j=0;j<5;j++)R(c,x+14+j*5,y+8+(j%3),1,3+(j%4),'#a7c5cb');
 }
}
function farmhouse(c,season){
 const x=96,y=75,w=144;
 R(c,x+7,y+89,w+8,9,'#5f8358');R(c,x+17,y+93,w-2,4,'#688457');
 R(c,x+1,y+43,w-2,49,'#775540');R(c,x+4,y+43,w-8,45,'#d6b184');R(c,x+6,y+44,w-12,39,'#c49b72');
 for(let i=0;i<6;i++){R(c,x+7,y+47+i*7,w-14,1,'#a77d5e');R(c,x+7,y+48+i*7,w-14,1,'#dbb48a');}
 R(c,x+9,y+43,4,47,'#936b4c');R(c,x+w-13,y+43,4,47,'#936b4c');R(c,x+6,y+85,w-12,5,'#765747');
 windowBox(c,x+18,y+56,22,17); windowBox(c,x+108,y+56,21,17);
 R(c,165,128,30,40,'#7a5b48');R(c,168,131,24,36,'#684d3d');R(c,171,134,18,33,'#936b48');R(c,171,134,1,31,'#bb9060');R(c,185,151,2,2,'#e0b878');
 R(c,163,166,35,6,'#a48d6e');R(c,164,166,33,2,'#ccad82');R(c,165,172,29,3,'#b29c72');
 R(c,x+24,y-9,17,26,'#7d5a49');R(c,x+22,y-10,22,4,'#aa7e60');R(c,x+27,y-4,11,2,'#b17862');R(c,x+31,y+2,7,2,'#b17862');
 shingles(c,x-1,y,w+2,48,true,season);
 // small gabled cap framing the door, pale plaster and sight window
 poly(c,'#63493e',[[154,119],[154,108],[179,86],[205,108],[205,119]]);
 poly(c,'#d7ac77',[[159,116],[159,109],[179,92],[201,109],[201,116]]);
 poly(c,'#8b614f',[[152,109],[179,84],[208,109],[205,111],[179,89],[156,112]]);
 R(c,175,100,9,10,'#704d42');R(c,177,102,5,6,'#8fa78c');R(c,176,104,7,1,'#d5b386');
 for(const vx of [129,216]){R(c,vx-5,153,12,4,'#7e644e');R(c,vx-5,152,12,1,'#deab74');flower(c,vx-1,143,'#e3a890');}
}
function shop(c,season){
 const x=528,y=84,w=120;
 R(c,x+3,y+78,w+8,8,'#5c8058');R(c,x+7,y+34,w-13,49,'#4e6253');R(c,x+10,y+39,w-19,41,'#d0b995');
 for(let i=0;i<5;i++)R(c,x+10,y+44+i*7,w-19,1,'#b59a78');
 R(c,x+12,y+42,4,38,'#7d7459');R(c,x+103,y+42,4,38,'#7d7459');
 R(c,571,125,34,42,'#686551');R(c,574,126,28,39,'#535c51');R(c,579,131,19,35,'#74816b');R(c,592,150,2,2,'#ead1a0');
 R(c,568,166,40,5,'#a7906f');R(c,570,166,37,2,'#d1ae7d');
 windowBox(c,x+18,y+53,17,15);windowBox(c,x+83,y+53,17,15);
 shingles(c,x-1,y,w+2,38,false,season);
 R(c,x+8,y+44,w-15,6,'#87664e');for(let j=0;j<13;j++)R(c,x+9+j*8,y+44,7,7,j%2?'#d4aa7a':'#f0d6a1');
 const sx=581,sy=108;
 R(c,sx-15,sy-3,30,17,'#543f3a');R(c,sx-14,sy-2,28,14,'#c6a77e');R(c,sx-12,sy,24,11,'#987750');
 R(c,sx-5,sy+3,10,5,'#ebcb88');R(c,sx-4,sy+2,8,3,'#f2d6a1');R(c,sx-3,sy+1,6,3,'#ae945e');R(c,sx-1,sy+1,2,1,'#d4bf75');
}
function crate(c,x,y){
 R(c,x-11,y+5,23,5,'#687f55');R(c,x-11,y-6,22,15,'#664b3b');R(c,x-9,y-5,18,12,'#b78353');
 R(c,x-10,y-8,20,5,'#dbad71');R(c,x-4,y-7,9,2,'#74513a');
 R(c,x-8,y-3,2,9,'#dba670');R(c,x+6,y-3,2,9,'#dba670');R(c,x-6,y+3,11,2,'#956340');
}
function notice(c,x,y){
 R(c,x-10,y+6,22,4,'#77865a');R(c,x-7,y-6,3,15,'#78543f');R(c,x+5,y-6,3,15,'#78543f');
 R(c,x-10,y-10,22,13,'#65503e');R(c,x-8,y-8,18,10,'#ad8b5e');
 R(c,x-4,y-7,10,8,'#e9d0a0');R(c,x-2,y-5,6,1,'#977e5a');R(c,x-2,y-3,4,1,'#977e5a');R(c,x-2,y-1,5,1,'#977e5a');R(c,x-10,y-10,22,2,'#d7b176');
}
function lamp(c,x,y,on,t){
 R(c,x-8,y+7,17,4,'#678057');R(c,x-7,y+3,14,6,'#536b5d');R(c,x-5,y+2,10,4,'#8da088');
 R(c,x-2,y-7,5,12,'#5a6555');R(c,x-6,y-12,13,9,'#4e6258');
 R(c,x-4,y-11,9,6,on?'#ffce75':'#8a9a7d');R(c,x-2,y-10,5,5,on?'#ffedb2':'#718672');
 R(c,x-8,y-13,17,2,'#829682');R(c,x-4,y-15,9,2,'#abac8e');
 if(on){c.save();c.globalAlpha=.08+.025*(1+Math.sin(t/390));R(c,x-13,y-17,27,25,'#ffd785');R(c,x-9,y-15,19,19,'#f8db89');c.restore();}
}
function fence(c,x,y,len){
 R(c,x-3,y+4,len+7,4,'#678857');R(c,x,y+1,len,3,'#957f59');R(c,x,y,len,2,'#c0a371');
 for(let xx=x;xx<=x+len;xx+=12){R(c,xx,y-4,4,12,'#8e7853');R(c,xx,y-5,4,3,'#c7ab77');}
}
function ranchBuilt(state){
 const r=state.ranch;
 return !!(r?.built ?? r?.barnBuilt ?? r?.unlocked ?? r?.barn);
}
function ranchSign(c,x,y,season){
 const edge=season==='winter'?'#869ca0':season==='autumn'?'#9e865d':'#829363';
 R(c,x-16,y+4,30,3,edge);R(c,x-19,y+6,38,2,edge);
 for(const [dx,dy] of [[-12,-4],[10,-4]]){
  R(c,x+dx,y+dy,4,14,'#775e47');R(c,x+dx+1,y+dy,1,11,'#a89266');
 }
 R(c,x-16,y-13,32,11,'#6d5748');R(c,x-15,y-14,30,10,'#ac895d');R(c,x-15,y-14,29,1,'#d6b484');
 R(c,x-13,y-12,26,7,'#c7a676');R(c,x-12,y-11,24,1,'#dbbd8a');
 // A tiny shed blueprint is readable without letterforms.
 const col='#7d6a56';
 for(let i=0;i<4;i++){R(c,x-6+i,y-9-i*.66,2,1,col);R(c,x+4-i,y-9-i*.66,2,1,col);}
 R(c,x-4,y-8,1,3,col);R(c,x+3,y-8,1,3,col);R(c,x-4,y-5,8,1,col);R(c,x-1,y-7,2,2,col);
 R(c,x-9,y-11,1,1,'#eee0a4');R(c,x+8,y-11,1,1,'#eee0a4');
 for(const [dx,w] of [[-23,13],[-21,9],[11,14]]){
  R(c,x+dx,y+2,w,4,'#98754f');R(c,x+dx+1,y+2,w-2,1,'#c7a06c');R(c,x+dx+w-3,y+2,3,3,'#d1af7d');
 }
 if(season==='winter'){drift(c,x-22,y-1,12,3);drift(c,x+11,y-1,13,3);}
}
function ranchShed(c,x,y,season){
 const l=x-56,w=68,wall=y-43,base=y-10,shadow=season==='winter'?'#9baeb0':'#8e8968';
 R(c,l-4,base,w+10,5,shadow);R(c,l-2,base-3,w+5,4,'#81705c');
 R(c,l,wall,w,33,'#83654f');R(c,l+2,wall+1,w-4,28,'#ba9269');
 for(let j=0;j<11;j++){
  const xx=l+3+j*6;R(c,xx,wall+2,5,27,j%3===0?'#b28b67':j%3===2?'#c09a72':'#b9936b');R(c,xx,wall+2,1,27,'#d4ae7d');
 }
 R(c,l+2,base-4,w-4,4,'#8f8170');R(c,l+2,base-4,w-4,1,'#b09e85');
 for(let j=0;j<7;j++)R(c,l+4+9*j,base-3,1,2,'#766b5f');
 // Barn roof and gable, each with original stepped tile edges.
 poly(c,'#624e48',[[l-6,wall+4],[l+5,wall-15],[l+17,wall-24],[l+53,wall-24],[l+66,wall-12],[l+75,wall+4],[l+71,wall+7],[l-3,wall+7]]);
 const a=rng(42);
 for(let j=0;j<7;j++){
  const yy=wall-23+j*4,indent=14-j*3,xx=l+indent,len=w-2*indent;
  R(c,xx,yy,len,4,j%2?'#a76d59':'#b17760');R(c,xx+1,yy,len-2,1,'#c69373');
  for(let k=5+j%3;k<len-1;k+=9){R(c,xx+k,yy+1,1,2,'#925d54');if(a()>.7)R(c,xx+k+2,yy,3,1,'#d6a17e');}
 }
 R(c,l-3,wall+3,w+8,2,'#c2896b');R(c,l-2,wall+6,w+6,2,'#706050');
 if(season==='winter'){
  drift(c,l+15,wall-22,38,4);drift(c,l+9,wall-17,29,3);drift(c,l+41,wall-13,21,4);drift(c,l+4,wall-8,18,3);
 }
 // Window, hanging tin hardware and contrasting stable door on interaction tile.
 windowBox(c,l+15,wall+12,15,11,true);
 R(c,x-15,wall+6,29,27,'#745a4c');R(c,x-13,wall+7,25,24,'#936956');
 for(let j=1;j<25;j+=4)R(c,x-13+j,wall+9,1,21,'#aa785d');
 R(c,x-13,wall+10,25,2,'#bd936a');R(c,x-13,wall+27,25,2,'#be936a');R(c,x-1,wall+9,2,20,'#694e49');
 for(let j=0;j<9;j++){R(c,x-10+j,wall+13+j*1.2,2,1,'#d0a274');R(c,x+8-j,wall+13+j*1.2,2,1,'#c99c70');}
 R(c,x+1,wall+19,2,2,'#ecc98f');R(c,x-4,wall+19,2,2,'#e2bb7d');
 R(c,x-13,base,24,6,'#a08c74');R(c,x-13,base,25,1,'#ddbe9e');R(c,x-10,base+6,20,3,'#b3a17f');
 for(const [xx,yy] of [[x-24,base-4],[l+3,base-3]]){
  R(c,xx,yy,8,5,'#9b8052');R(c,xx+1,yy-1,6,4,'#bea46f');R(c,xx+1,yy-1,5,1,'#e0c17e');R(c,xx+3,yy,2,4,'#ab8759');
 }
}
let ranchLayer;
function drawRanch(c,state,t,engine,season){
 if(!state.ranch)return;
 const p=engine?.RANCH?.site||engine?.RANCH?.sign||engine?.RANCH?.build||engine?.PORTALS?.find(p=>p.region==='valley'&&p.to==='barn')||{x:3,y:8};
 const x=(p.x??3)*T+12,y=(p.y??8)*T+13;
 const built=ranchBuilt(state);
 if(ranchLayer?.built!==built||ranchLayer.season!==season){
  // Only the interaction marker moves; the roof and boards do not need repainting.
  const image=document.createElement('canvas');image.width=104;image.height=84;
  const ctx=image.getContext('2d');ctx.imageSmoothingEnabled=false;
  if(built)ranchShed(ctx,64,72,season);else ranchSign(ctx,64,72,season);
  ranchLayer={image,built,season};
 }
 c.drawImage(ranchLayer.image,x-64,y-72);
 if(built)pinMark(c,x,y-39,'#eed399',t,'chevron');
 else pinMark(c,x,y-25,'#f0d59b',t,'bang');
}
function cacheMap(season){
 const el=document.createElement('canvas');el.width=W;el.height=H;
 const c=el.getContext('2d');c.imageSmoothingEnabled=false;
 pathGround(c,season);riverShape(c,season);streamBits(c,1081);footbridge(c);dock(c);
 const trees=[[9,41,.85,2],[36,44,.8,2],[62,39,.75,2],[86,39,.85,2],[125,25,.77,2],[158,22,.66,2],[193,28,.88,2],[221,24,.65,2],[264,32,.83,0],[296,39,.64,0],[331,24,.81,2],[371,40,.84,2],[396,49,.64,2],[498,40,.82,2],[528,36,.77,2],[558,34,.62,2],[590,26,.8,2],[615,41,.85,2],[653,38,.77,0],[683,32,.66,2],[712,48,.88,2],[16,136,.61,0],[41,119,.51,2],[32,173,.58,0],[66,152,.43,0],[385,143,.61,2],[399,121,.43,2],[493,148,.47,0],[696,149,.66,1],[718,132,.6,2],[22,294,.62,1],[22,377,.68,0],[45,368,.5,0],[65,413,.61,2],[17,436,.64,2],[350,405,.64,0],[380,390,.61,2],[394,419,.67,2],[499,379,.53,0],[505,421,.66,0],[526,422,.49,1],[555,432,.53,2],[686,422,.58,0],[713,398,.67,2],[719,421,.63,2]];
 for(const [x,y,s,k] of trees)tree(c,x,y,s,k,season);
 fence(c,40,277,42);fence(c,338,271,45);fence(c,483,266,62);
 farmhouse(c,season);shop(c,season);crate(c,252,204);notice(c,564,228);
 const a=rng(901);const blossoms=SEASON[season].flower||['#ead69c','#eee0aa','#dbc0c3','#dfa490'];
 const zones=[[9,63,76,100],[278,53,118,86],[337,283,61,106],[17,236,76,126],[150,383,173,37],[483,246,61,132],[658,172,53,108],[521,385,151,38]];
 for(const [x,y,w,h] of zones){for(let i=0;i<14;i++){
  let xx=x+Math.floor(a()*w),yy=y+Math.floor(a()*h);
  if(season==='winter'){
   const n=a();if(n<.31)stone(c,xx,yy,.56,['#a1b5bb','#c8d6d6','#e6eee6']);else if(n<.70)drift(c,xx,yy,13+i%8,4);else if(i%3===0)flower(c,xx,yy,blossoms[i%4]);
  }else if(a()<.33)stone(c,xx,yy,.55);else if(a()<(season==='summer'?.7:.5))flower(c,xx,yy,blossoms[Math.floor(a()*blossoms.length)]);else tuft(c,xx,yy,SEASON[season].field?.[2]||darkGrass,SEASON[season].field?.[3]||'#9eb680');
 }}
 for(const [x,y] of [[65,87],[43,141],[375,113],[364,161],[500,113],[687,79],[99,400],[322,412],[380,386],[539,290],[683,383]])stone(c,x,y,.72);
 initialPlots(c,season);
 return el;
}
const backgrounds=new Map();
const shoalShallows='#568f89', shoalDeep='#3d7479';
const shoalGrass='#9faf73', shoalSand='#c9b687';
function shoalGround(season){
 const el=document.createElement('canvas');el.width=W;el.height=H;
 const c=el.getContext('2d'),a=rng(44179);
 const islands=({summer:['#b5b779','#76a66d','#8eaf70','#bab889','#8eae73'],autumn:['#c9ad7d','#be9d63','#c6a972','#d1b88a','#bfab78'],winter:['#cfdbd1','#b8c9c6','#ccd8d0','#b3bbaf','#cfddd2']})[season]||[shoalSand,'#a2ab74','#aeb47d','#c7b989','#b2b781'];
 c.imageSmoothingEnabled=false;
 // Broad shallow water. Each island ledge silhouette is aligned to collision.
 R(c,0,0,W,H,'#427d80');
 for(let y=0;y<H;y+=3){
  const wisp=Math.round(Math.sin(y*.028)*14+Math.sin(y*.085)*6);
  R(c,23+wisp,y,670-wisp,3,shoalShallows);
  R(c,61+wisp,y,602-wisp,3,'#5a9790');
  if(y<57||y>375) R(c,0,y,720,3,y%7<4?'#477f84':'#467f82');
 }
 for(let i=0;i<252;i++){
  const x=Math.floor(a()*W),y=Math.floor(a()*H),len=2+Math.floor(a()*22);
  R(c,x,y,len,i%9===0?2:1,a()<.45?'#619c93':'#4d8887');
 }
 const hull=(color,delta)=>poly(c,color,[
  [61-delta,107-delta],[73-delta,107-delta],[73-delta,91-delta],[115-delta,91-delta],
  [115-delta,80-delta],[196-delta,80-delta],[196-delta,74-delta],[336,74-delta],
  [336,80-delta],[513+delta,80-delta],[513+delta,88-delta],[603+delta,88-delta],
  [603+delta,95-delta],[625+delta,95-delta],[625+delta,121-delta],[638+delta,121-delta],
  [638+delta,307+delta],[629+delta,307+delta],[629+delta,359+delta],[610+delta,359+delta],
  [610+delta,371+delta],[524+delta,371+delta],[524+delta,380+delta],[356,380+delta],
  [356,374+delta],[228-delta,374+delta],[228-delta,369+delta],[121-delta,369+delta],
  [121-delta,361+delta],[72-delta,361+delta],[72-delta,325+delta],[58-delta,325+delta],
  [58-delta,242],[65-delta,242],[65-delta,161-delta],[61-delta,161-delta]
 ]);
 hull('#72a694',21);hull('#8caf95',12);hull('#a8b598',6);hull('#b5ad80',1);hull(islands[0],0);
 // Tiny stepped dune rises, mossy silt and sunlit beach paths, not tile-grid overlays.
 poly(c,islands[1],[[72,128],[88,128],[88,101],[155,101],[155,94],[312,94],[312,101],[395,101],[395,94],[566,94],[566,107],[618,107],[618,131],[626,131],[626,221],[617,221],[617,259],[594,259],[594,276],[523,276],[523,286],[371,286],[371,278],[269,278],[269,288],[152,288],[152,278],[76,278],[76,235],[68,235],[68,193],[76,193],[76,157],[72,157]]);
 poly(c,islands[2],[[73,139],[100,139],[100,123],[177,123],[177,108],[329,108],[329,115],[458,115],[458,111],[573,111],[573,125],[616,125],[616,214],[607,214],[607,239],[568,239],[568,265],[523,265],[523,278],[432,278],[432,265],[352,265],[352,258],[228,258],[228,269],[126,269],[126,261],[85,261],[85,236],[74,236]]);
 poly(c,islands[3],[[90,213],[158,213],[158,200],[224,200],[224,192],[355,192],[355,197],[424,197],[424,209],[488,209],[488,226],[601,226],[601,239],[590,239],[590,246],[482,246],[482,235],[415,235],[415,225],[344,225],[344,218],[227,218],[227,225],[164,225],[164,238],[104,238],[104,244],[73,244],[73,224],[90,224]]);
 poly(c,islands[4],[[130,295],[229,295],[229,302],[345,302],[345,298],[399,298],[399,313],[496,313],[496,302],[587,302],[587,310],[622,310],[622,347],[604,347],[604,356],[523,356],[523,367],[370,367],[370,356],[295,356],[295,362],[184,362],[184,357],[89,357],[89,341],[79,341],[79,321],[100,321],[100,307],[130,307]]);
 for(let i=0;i<260;i++){
  const x=77+Math.floor(a()*540),y=99+Math.floor(a()*245),g=a(),len=g>.78?4:g>.5?3:2;
  R(c,x,y,len,1,g>.66?'#d5c394':g>.38?'#a6ae75':'#b2b37d');
  if(g>.86){if(season==='winter')drift(c,x,y,12+i%7,4);else tuft(c,x,y,SEASON[season].field?.[2]||'#a5ad75',SEASON[season].field?.[3]||'#c6be88');}
 }
 // Reflective pools along the playable sand edge.
 for(const [x,y,w,h] of [[160,326,47,13],[378,318,55,12],[504,343,58,14],[266,352,41,8],[110,286,31,6],[598,285,23,11],[282,136,65,12],[108,161,43,10]]){
  R(c,x,y+3,w,h-4,'#a4ae82');R(c,x+4,y,w-8,h,'#adb68d');
  R(c,x+7,y+3,w-14,h-5,'#91ad96');R(c,x+9,y+4,w-18,2,'#a0b79a');
  for(let j=0;j<3;j++)R(c,x+9+j*Math.floor((w-14)/4),y+3+(j%2),3+j*2,1,'#d3d5a5');
 }
 // Several pale sandstone ledges and the wind-worn heron gate above the field.
 for(const [x,y,s] of [[89,97,1.3],[128,104,1.15],[222,94,1.5],[489,92,1.36],[558,89,1.4],[598,107,1.13],
                         [89,290,.9],[124,338,.72],[236,365,1.14],[402,368,1.6],[602,334,.79],[594,278,.79],[537,126,.72]]){
  stone(c,x,y,s,['#8a906d','#ada888','#cec3a1']);
 }
 R(c,267,93,159,6,'#98a47a');R(c,281,90,131,6,'#919b76');
 // World anchor: ancient stepped frame sheltered by emerald tuft and pink reeds.
 R(c,300,81,19,16,'#727e6e');R(c,307,67,17,24,'#798477');R(c,312,56,15,19,'#8b9686');
 R(c,318,49,38,15,'#9da08b');R(c,324,44,44,16,'#acb19a');R(c,354,51,27,16,'#a3a790');
 R(c,367,61,19,17,'#939e91');R(c,375,75,18,19,'#879787');R(c,373,86,21,11,'#7c896f');
 R(c,327,44,40,3,'#d5d0a8');R(c,324,47,24,3,'#c8c5a1');R(c,318,51,12,3,'#bcbea2');
 R(c,313,58,8,3,'#bac09e');R(c,310,67,8,2,'#adba97');R(c,306,78,7,3,'#a1af92');
 R(c,369,61,10,3,'#c7c7a2');R(c,376,71,9,3,'#b1b99d');R(c,383,82,8,2,'#a4b192');
 R(c,322,57,46,4,'#82907e');R(c,320,63,9,7,'#758473');R(c,365,62,13,6,'#7f8d7b');
 R(c,329,47,2,9,'#89977e');R(c,352,52,2,8,'#87997d');R(c,322,73,2,9,'#708372');
 R(c,302,89,10,6,'#91ad79');R(c,385,77,7,3,'#a7b780');
 for(const [x,y] of [[293,86],[302,96],[348,95],[380,95],[392,94],[403,89],[279,91]])tuft(c,x,y,'#7f9a6c','#b6bd84');
 for(const [x,y,w] of [[8,70,30],[36,89,25],[42,281,29]]){
  R(c,x-4,y+3,w+11,8,'#7ba490');R(c,x,y,w,8,'#a1ad7e');R(c,x+3,y+1,w-6,4,'#aeb586');R(c,x+2,y+8,w-4,2,'#8aa58a');
 }
 for(const [x,y,s] of [[22,77,.58],[49,93,.58],[93,133,.46],[121,120,.52],[185,104,.48],[534,102,.55],[563,106,.66],[622,122,.49],
                         [52,280,.45],[626,312,.55],[81,347,.54],[219,351,.46],[595,360,.48]])tree(c,x,y,s,1,season);
 for(const [cx,cy,r] of [[97,154,15],[175,142,21],[247,121,25],[430,120,20],[505,146,23],[586,184,22],[293,285,23],[105,307,22],[530,296,19],[600,314,16]]){
  for(let i=0;i<15;i++){let x=cx+Math.round((a()-.5)*r*2),y=cy+Math.round((a()-.5)*r);
   if(i%3===1) tuftsForShoal(c,x,y,2+(i%4));else if(season==='winter'){if(i%2===0)drift(c,x,y,12+i%5,3);}else flower(c,x,y,(SEASON[season].flower||['#ebc29d','#dcc5c7','#f0dba3','#ebd5b0'])[i%4]);
  }
 }
 for(const [x,y] of [[51,92],[39,144],[45,196],[39,285],[58,348],[171,388],[229,397],[479,397],[553,395],[646,359],[660,309],[659,274],[660,141],[651,103],[610,82],[524,55],[192,55]])waterReed(c,x,y);
 // Return ferry landing; all planks lead up toward the dry starting tile.
 R(c,70,214,68,20,'#6c9a83');R(c,65,210,74,23,'#777356');
 for(let i=0;i<9;i++){R(c,66+i*8,210,7,19,'#b89264');R(c,66+i*8,210,7,1,'#d5b784');R(c,66+i*8,216,1,11,'#d0a975');}
 for(const x of [68,101,132])for(const y of [207,226]) {R(c,x,y,4,8,'#7a6247');R(c,x,y,4,2,'#c4a979');}
 fence(c,100,198,30);
 return el;
}
function tuftsForShoal(c,x,y,n){for(let j=0;j<n;j++){let q=3+((x+y+j)%5);R(c,x+j*2,y-q,1,q,iColorShoal(j));}}
function iColorShoal(j){return j%3===0?'#91a870':'#9eaf77';}
function waterReed(c,x,y){
 R(c,x-8,y+1,19,2,'#629990');R(c,x-4,y,10,1,'#8aa98d');
 for(let i=0;i<5;i++){let h=5+((x+y+i*11)%7),xx=x+(i-2)*2;
  R(c,xx,y-h,1,h+1,i%2?'#80a27d':'#719779');if(i%3===0)R(c,xx-1,y-h,3,4,'#989067');
 }
}
function shoalRipples(c,t){
 const a=rng(671);
 for(let i=0;i<45;i++){
  const side=i%4;
  let x=Math.floor(a()*W),y=Math.floor(a()*H),dx=Math.sin(t/1600+i)*6;
  if(side===0)y=5+Math.floor(y*.107);else if(side===1)y=390+Math.floor(y*.09);else if(side===2)x=6+Math.floor(x*.05);else x=673+Math.floor(x*.051);
  c.globalAlpha=.31+.20*Math.sin(t/900+i);
  const k=i%3===0?'#d4dfb4':'#9bc6b0';
  R(c,x+dx,y,4+i%8,1,k);
  if(i%5===0)R(c,x+dx+2,y+2,2+i%6,1,k);
 }
 c.globalAlpha=1;
}
function pinMark(c,x,y,k,t,mark){
 const bob=Math.round(Math.sin(t/380));y+=bob;
 R(c,x-4,y+5,9,2,'#647468');R(c,x-5,y-7,11,12,'#6e6653');
 R(c,x-4,y-7,9,10,k);R(c,x-3,y-7,7,1,'#fff0b5');R(c,x-2,y+3,5,2,'#a78659');
 if(mark==='chevron'){R(c,x-2,y-4,2,1,'#656c53');R(c,x+1,y-4,2,1,'#656c53');R(c,x-1,y-3,3,1,'#656c53');R(c,x,y-2,1,2,'#656c53');}
 else {R(c,x,y-5,1,4,'#656c53');R(c,x,y,1,1,'#656c53');}
}
function ferry(c,x,y,state,t,local=false){
 const fix=!!state.spring?.repaired||local,yb=Math.round(Math.sin(t/550)), dim=fix?'#815f4a':'#746957';
 c.save();c.translate(x,y+yb);
 if(local)c.scale(-1,1);
 // Distinct color and silhouette when restored; cast small ripples on the surface.
 const straight='#526757';
 R(c,-23,3,46,5,'#4b7872');R(c,-26,8,50,1,'#80aaa0');R(c,-20,10,31,1,'#83a79f');
 poly(c,'#4a5d58',[[-25,-8],[-20,-8],[-15,-15],[13,-15],[22,-11],[25,-7],[21,1],[16,5],[-12,7],[-20,2]]);
 poly(c,dim,[[-23,-7],[-16,-12],[12,-12],[22,-9],[22,-4],[17,2],[-13,4],[-19,0]]);
 poly(c,fix?'#b68456':'#a3825c',[[-20,-8],[-15,-12],[13,-12],[20,-8],[17,-5],[-14,-4]]);
 R(c,-12,-10,27,4,fix?'#786c51':'#796c56');R(c,-11,-6,24,2,fix?'#d9b982':'#baa37a');
 if(fix){
  R(c,-9,-11,2,7,'#d5b784');R(c,6,-11,2,7,'#d5b784');R(c,-18,-2,35,2,'#d7a26d');
  R(c,-11,-18,3,11,'#8f754e');R(c,-9,-18,12,5,local?'#9fad72':'#b98b57');R(c,-8,-18,9,1,'#ead298');
  R(c,15,-13,3,6,'#c9a970');R(c,15,-16,3,4,'#f4d791');
  R(c,-8,-4,21,2,'#87664b');
 }else{
  poly(c,'#6f694f',[[-12,-6],[4,-17],[6,-16],[-9,-5]]);R(c,-9,-9,5,2,'#504f46');
  R(c,7,-9,3,2,'#575449');R(c,6,-7,2,4,'#575449');R(c,13,-4,3,2,'#514d40');
  R(c,-16,-16,2,10,'#9c8765');R(c,-17,-17,3,2,'#b7a079');
 }
 c.restore();
}
function woodpile(c,x,y,stock,t){
 const ry=stock?0:2;
 R(c,x-10,y+5,22,4,'#a0a675');R(c,x-12,y+6,22,2,'#a8ac7d');
 for(const [dx,dy] of [[-9,1],[1,2],[-3,-3]]) {
  if(!stock&&dy===-3)continue;
  R(c,x+dx,y+dy+ry,12,4,'#806953');R(c,x+dx,y+dy+ry,11,2,'#af8b62');R(c,x+dx+9,y+dy+ry,3,4,'#c7ab79');
 }
 if(stock)pinMark(c,x+1,y-16,'#f3d48d',t,'bang');
}
function flora(c,points,t){
 for(const [i,p] of (points||[]).entries()){
  if(!p||!Number.isFinite(p.x+p.y))continue;
  const x=p.x*T+12,y=p.y*T+13,fl=i%2?'#e6b0bc':'#f6d2a0';
  R(c,x-9,y+5,19,3,'#a0a873');R(c,x-3,y-3,2,10,'#79976a');
  flower(c,x-7,y-5,fl);flower(c,x+2,y-7,fl);tuft(c,x-8,y+2,'#8ba16f','#b8bc81');
 }
}

function ripples(c,t){
 const a=rng(7632);
 for(let i=0;i<22;i++){
  let x=420+Math.floor(a()*40), y=Math.floor(a()*433), len=4+Math.floor(a()*9);
  let drift=Math.sin(t/1300+i*.81)*4,yy=(y+t*.008)%H;
  if(yy>=192&&yy<239)continue;
  const blend=.2+.18*Math.sin(t/620+i*.43);
  c.globalAlpha=blend;R(c,x+drift,yy,len,1,'#bbd3a1');R(c,x+1+drift,yy+1,Math.max(2,len-3),1,'#aed2b2');
 }
 for(let i=0;i<6;i++){
  const x=570+i*15,y=320+Math.sin(t/1100+i*3)*17+i*5, l=6+i%3*3;
  c.globalAlpha=.4+.2*Math.sin(i*2+t/1100);R(c,x,y,l,1,'#a7c5a2');R(c,x+2,y+1,l-3,1,'#b8cfaa');
 }
 c.globalAlpha=1;
}
const springCropKinds={
 lettuce:{edge:'#446e4a',mid:'#75a75c',shine:'#b0c67d',bud:'#d5d8a0',days:1,shape:'head'},
 pea:{edge:'#456b50',mid:'#6e9c55',shine:'#a6be71',bud:'#cadb82',days:2,shape:'vines'},
 mistberry:{edge:'#4f6c54',mid:'#71935c',shine:'#9eab79',bud:'#947d98',days:3,shape:'berry'},
 scallion:{edge:'#3b6b58',mid:'#629a70',shine:'#add4a1',bud:'#eee3b9',days:1,shape:'fans'},
 sunMelon:{edge:'#4d734e',mid:'#74964e',shine:'#acc36a',bud:'#e5bf70',light:'#f6d88c',dark:'#9c9056',days:4,shape:'gourd'},
 riverPepper:{edge:'#35684d',mid:'#548e52',shine:'#9dc66f',bud:'#dc795a',light:'#f5ad71',dark:'#a85448',days:3,shape:'pepper'},
 amberPumpkin:{edge:'#526b40',mid:'#82914c',shine:'#a8ad64',bud:'#e89b55',light:'#ffbc70',dark:'#ad6c40',days:5,shape:'gourd'},
 chestnutRoot:{edge:'#536a47',mid:'#82945b',shine:'#b0bc77',bud:'#c7815e',light:'#e8a77f',dark:'#98624e',days:3,shape:'root'},
 frostCabbage:{edge:'#4e7675',mid:'#80a9a1',shine:'#b3d0bf',bud:'#e2e4c9',light:'#f3f0d4',dark:'#5e8a84',days:4,shape:'frost'},
 snowLeek:{edge:'#426b66',mid:'#6d9383',shine:'#a8c4ad',bud:'#e9e9cb',light:'#f4f2d6',dark:'#829c8c',days:3,shape:'leek'}
};
function cropDays(id){return window.MistEngine?.CROPS?.[id]?.days??(id==='turnip'?2:id==='bean'?3:springCropKinds[id]?.days??2);}
function springCrop(c,x,y,k,g,t){
 const p=springCropKinds[k]||springCropKinds.lettuce, max=cropDays(k),mature=g>=max;
 const phase=Math.sin(t/950+x*.13+y*.21)>0?1:0;
 if(p.shape==='gourd'){
  const pumpkin=k==='amberPumpkin';
  R(c,x-9,y+1,18,2,p.edge);R(c,x-8,y-3,5,4,p.mid);R(c,x-7+phase,y-4,4,2,p.shine);
  R(c,x+4,y-4,5,4,p.mid);R(c,x+5,y-5,4,2,p.shine);
  R(c,x-2,y-5,3,8,p.edge);
  if(mature){
   const ww=pumpkin?14:12;
   R(c,x-(ww>>1)+1,y-6,ww-2,10,p.dark);R(c,x-(ww>>1),y-4,ww,6,p.dark);
   R(c,x-(ww>>1)+1,y-5,ww-2,7,p.bud);R(c,x-(ww>>1)+2,y-5,ww-5,2,p.light);
   R(c,x,y-9,2,4,p.edge);R(c,x+1,y-9,3,1,p.shine);
   R(c,x-4,y-3,1,5,pumpkin?'#ce8148':p.dark);R(c,x+3,y-2,1,5,pumpkin?'#cb8149':p.dark);
   R(c,x-1,y-2,1,5,p.light);
  }
 }else if(p.shape==='pepper'){
  R(c,x,y-10-(mature?2:0),2,14+(mature?2:0),p.edge);
  R(c,x-5+phase,y-7,6,3,p.mid);R(c,x+1,y-10,5,3,p.mid);R(c,x-5+phase,y-8,4,1,p.shine);
  R(c,x+2,y-10,3,1,p.shine);R(c,x+4,y-5,4,2,p.shine);R(c,x-3,y-2,4,2,p.mid);
  if(mature)for(const [dx,dy,l] of [[-6,-6,6],[4,-7,7],[-2,-9,4]]){
   R(c,x+dx,y+dy,3,l,p.dark);R(c,x+dx,y+dy,2,l-1,p.bud);R(c,x+dx,y+dy+1,1,3,p.light);
  }
 }else if(p.shape==='root'){
  for(const [dx,dy,w] of [[-6,-7,4],[0,-9,2],[3,-6,5]]){
   R(c,x+dx+phase,y+dy,w,3,p.mid);R(c,x+dx+phase,y+dy,w-1,1,p.shine);
  }
  R(c,x-1+phase,y-7,2,10,p.edge);
  if(mature){
   R(c,x-5,y,10,4,p.dark);R(c,x-4,y-1,8,4,p.bud);R(c,x-4,y,5,1,p.light);
   R(c,x-3,y+3,6,2,p.bud);R(c,x-1,y+5,3,1,p.dark);R(c,x,y+6,1,2,p.dark);
  }
 }else if(p.shape==='frost'){
  R(c,x-6,y-2,12,6,p.edge);R(c,x-5,y-5,10,6,p.mid);R(c,x-4,y-5,7,2,p.shine);
  if(mature){
   R(c,x-5,y-6,10,8,p.mid);R(c,x-3,y-8,6,8,p.shine);R(c,x-2,y-8,5,7,p.bud);
   R(c,x-1,y-7,3,2,p.light);R(c,x+2,y-3,4,1,p.shine);R(c,x-5,y-2,4,1,p.dark);
  }
 }else if(p.shape==='leek'){
  R(c,x-3,y-7,2,10,p.mid);R(c,x-4+phase,y-10,2,7,p.shine);
  R(c,x+1,y-10,2,14,p.edge);R(c,x+3,y-12,2,8,p.mid);R(c,x+3,y-12,1,4,p.shine);
  if(mature){R(c,x-2,y-5,5,9,p.bud);R(c,x-2,y-4,2,7,p.light);R(c,x+2,y-2,1,6,p.dark);R(c,x-1,y+4,3,2,p.bud);}
 }else if(p.shape==='vines'){
  R(c,x+3,y-12,2,17,'#ab8361');R(c,x+3,y-13,3,2,'#ceb478');
  R(c,x-2+phase,y-7-(mature?4:0),2,11+(mature?4:0),p.edge);
  R(c,x-5+phase,y-4,5,2,p.shine);R(c,x+phase,y-6,4,2,p.mid);
  if(mature){
   R(c,x-4,y-10,8,2,p.mid);R(c,x-5,y-9,4,2,p.shine);
   R(c,x-4,y-6,2,6,p.bud);R(c,x+1,y-4,2,5,p.bud);R(c,x-4,y-6,1,3,'#e1e19b');
  }
 }else if(p.shape==='berry'){
  R(c,x-5,y-4,10,8,p.edge);R(c,x-4+phase,y-7-(mature?2:0),8,7+(mature?2:0),p.mid);
  R(c,x-5,y-5,5,3,p.shine);R(c,x+phase,y-6,5,2,p.shine);
  if(mature){
   for(const [dx,dy] of [[-5,-5],[-1,-7],[3,-3],[-2,0]]){R(c,x+dx,y+dy,3,3,p.bud);R(c,x+dx,y+dy,1,1,'#dcb5cd');}
  }
 }else if(p.shape==='fans'){
  R(c,x-1,y-6-(mature?2:0),2,10+(mature?2:0),p.edge);R(c,x-4,y-4,2,8,p.mid);R(c,x+2,y-6,2,10,p.mid);
  R(c,x-5+phase,y-5,2,4,p.shine);R(c,x+2+phase,y-8,2,5,p.shine);
  if(mature){R(c,x-4,y+1,8,4,p.bud);R(c,x-3,y+4,2,2,'#d4bb8e');R(c,x+2,y+4,2,2,'#d4bb8e');}
 }else{
  R(c,x-5,y-3,10,7,p.edge);R(c,x-4+phase,y-5,8,8,p.mid);R(c,x-3,y-5,6,4,p.shine);
  if(mature){R(c,x-6,y-2,13,6,p.mid);R(c,x-5,y-3,10,5,p.shine);R(c,x-3,y-4,6,3,p.bud);R(c,x-4,y+2,8,2,p.edge);R(c,x-3,y-1,7,2,p.mid);}
 }
}
function crop(c,x,y,data,t){
 const g=Number(data.growth)||0;
 const sway=Math.sin(t/920+x*.11+y*.19)>0?1:0;
 if(g<1){R(c,x-1,y+1,3,2,'#d3b16d');R(c,x-2,y+2,4,1,'#754e3e');return;}
 const kd=data.crop;
 if(kd!=='turnip'&&kd!=='bean'){springCrop(c,x,y,kd,g,t);return;}
 const leafy=kd==='bean'?['#315d49','#4d884e','#82ad5d','#b0cd73']:['#446848','#55924f','#86b866','#b2cf7c'];
 if(g<2){R(c,x+sway,y-4,2,7,leafy[0]);R(c,x-4+sway,y-4,5,2,leafy[2]);R(c,x+sway,y-6,5,2,leafy[1]);R(c,x+3+sway,y-7,2,2,leafy[3]);return;}
 if(kd==='bean'){
  R(c,x+3,y-12,2,17,'#ac855d');R(c,x+2,y-12,3,2,'#cfa76f');
  R(c,x-1+sway,y-10,2,14,leafy[0]);R(c,x-4+sway,y-9,5,3,leafy[2]);R(c,x-4+sway,y-3,4,2,leafy[2]);R(c,x+sway,y-8,4,2,leafy[1]);R(c,x+sway,y-4,4,2,leafy[2]);R(c,x-2+sway,y-11,2,2,leafy[3]);
  if(g>=3){R(c,x-5+sway,y-6,2,6,'#d69a68');R(c,x+1+sway,y-3,2,6,'#f0c987');R(c,x-5+sway,y-6,1,4,'#f1d08b');}
 } else {
  R(c,x+sway,y-6,2,7,leafy[0]);R(c,x-4+sway,y-6,6,2,leafy[2]);R(c,x+2+sway,y-8,4,2,leafy[2]);R(c,x-5+sway,y-8,2,2,leafy[3]);R(c,x+2+sway,y-6,4,2,leafy[1]);
  if(g>=2){R(c,x-5,y,11,5,'#e3c49d');R(c,x-4,y-2,9,3,'#d5a5b3');R(c,x-2,y+4,5,3,'#c99e93');R(c,x-3,y+1,4,2,'#ffe2b7');}
 }
}
function plots(c,state,t){
 const q=state.plots||{};const active=q instanceof Map?Array.from(q):Object.entries(q);
 if(!active.length)return;
 for(const [key,d] of active){
  if(!d||!d.tilled&&!d.crop)continue;
  const [gx,gy]=String(key).split(',').map(Number);if(!Number.isFinite(gx+gy))continue;
  const x=gx*T,y=gy*T;const wet=d.watered||state.rain;
  R(c,x+2,y+3,21,20,wet?'#5b6657':'#6a7453');
  R(c,x+2,y+2,20,19,wet?'#7b6854':'#9d7954');R(c,x+3,y+3,18,17,wet?'#887258':'#a9825a');
  for(let n=0;n<3;n++){
   R(c,x+4,y+5+n*5,16,2,wet?'#6b5c50':'#8b684e');
   R(c,x+4,y+7+n*5,12,1,wet?'#a18765':'#bd9465');
  }
  if(wet)R(c,x+7,y+9,5,1,'#a19779');
  if(d.crop){
   crop(c,x+12,y+12,d,t);
   if(d.growth>=cropDays(d.crop)&&Math.sin(t/480+x*.3+y)>0.75){
    R(c,x+18,y+4,1,5,'#ffda91');R(c,x+16,y+6,5,1,'#ffda91');
   }
  }
 }
}
function initialPlots(c,season){
 const p=SEASON[season].plot||['#7d8f5c','#9b9b67','#969966','#a3a276','#879062','#a8a174'];
 for(let y=10;y<=14;y++)for(let x=5;x<=13;x++){
  const xx=x*T,yy=y*T;
  R(c,xx+1,yy+2,22,21,p[0]);
  R(c,xx+2,yy+2,20,19,(x+y)%3===0?p[1]:p[2]);
  R(c,xx+3,yy+3,18,2,p[3]);
  for(let i=0;i<3;i++){R(c,xx+4+i*6,yy+9+i%2*5,3,1,p[4]);R(c,xx+5+i*5,yy+13+i%2*3,2,1,p[5]);}
 }
}
const c1={body:'#5e8e86',body2:'#82ada0',edge:'#3e554d',hair:'#735645',hair2:'#a47b58',pants:'#4c6257',skin:'#dab38c',light:'#f2c8a0',hat:'#d8b070',band:'#947454'};
const c2={body:'#ba8b57',body2:'#d0a96f',edge:'#5e644b',hair:'#6b5741',hair2:'#927653',pants:'#68734f',skin:'#d3a77e',light:'#ebc893',hat:'#bca66c',band:'#80734f'};
const c3={body:'#95758b',body2:'#ad8b99',edge:'#5f5361',hair:'#674f49',hair2:'#977263',pants:'#685e65',skin:'#c99c81',light:'#e5bda0',hat:'#b27977',band:'#7b5359'};
const c4={body:'#527a92',body2:'#89a0ac',edge:'#3a5a6b',hair:'#615343',hair2:'#927653',pants:'#4e6064',skin:'#d6ad84',light:'#f0c59d',hat:'#8d9da5',band:'#516b7b'};
// Walk poses use cumulative travel, not wall time. Logical tiles never enter
// this calculation, so a blocked move cannot trigger a footfall.
function walkPose(dir,phase){
 const side=/^(left|west|a)$/.test(dir)?-1:/^(right|east|d)$/.test(dir)?1:0;
 const behind=/^(up|north|w)$/.test(dir), moving=Number.isFinite(phase);
 const wave=moving?Math.sin(phase):0, lift=moving?Math.cos(phase):0;
 const stride=Math.round(wave*2), arm=Math.round(wave*1.25), upper=Math.abs(wave)>.76?1:0;
 const forward=behind?-1:1;
 const legs=[-1,1].map((leg,i)=>{
  const travel=-leg*stride;
  return {
   x:(i===0?-5:1)+side*travel,
   y:(side?0:forward*travel)-(lift*-leg>.52?1:0),
   armX:side*leg*arm,
   armY:side?0:forward*leg*arm
  };
 });
 return {side,behind,upper,legs};
}
function sprite(c,x,y,p,t,dir='down',phase=null){
 x=Math.round(x);y=Math.round(y);
 const {side,behind,upper,legs}=walkPose(dir,phase);
 const a=(r,k)=>R(c,x+r[0],y+r[1]-upper,r[2],r[3],k);
 const shadow='#607c59';R(c,x-9,y+8,18,3,shadow);R(c,x-6,y+11,12,1,shadow);
 for(const [i,{x:lx,y:ly}] of legs.entries()){
  const hip=i===0?-5:1;
  R(c,x+hip,y+4-upper,4,4,p.pants);R(c,x+lx,y+6+ly,4,4,p.pants);
  R(c,x+lx,y+8+ly,i===0?5:4,2,p.edge);
 }
 const blink=((Math.floor(t+x*27)%3900)<100);
 a([-7,-3,14,9],p.edge);a([-5,-3,10,7],p.body);a([-4,-2,6,2],p.body2);a([-4,3,8,1],p.body2);
 for(const [i,{armX,armY}] of legs.entries()){
  const ax=(i===0?-7:4)+armX;
  a([ax,-2+armY,3,5],p.body);a([ax+(i===1?1:0),2+armY,2,2],p.skin);
 }
 a([-6,-11,12,9],p.hair);a([-5,-12,10,6],p.hair2);
 if(!behind){
  a([-4+(side===-1?-1:0),-9,9,6],p.skin);a([-3+(side===-1?-1:0),-8,5,3],p.light);
  if(side){a([2*side,-7,1,blink?1:2],p.edge);a([4*side,-5,2,2],p.light);}
  else{a([-3,-7,1,blink?1:2],p.edge);a([2,-7,1,blink?1:2],p.edge);a([-2,-4,3,1],p.skin);}
 }else{a([-5,-10,9,7],p.hair);a([-4,-8,3,4],p.hair2);}
 a([-7,-12,14,2],p.band);a([-4,-15,8,3],p.hat);a([-3,-15,6,1],amber);a([-7,-12,14,1],p.hat);
 if(!behind&&!side){a([-3,-1,1,4],p.body2);a([2,-1,1,4],p.body2);}
}
function tileTarget(c,target,t,season){
 const {x,y}=target;if(!Number.isFinite(x+y))return;
 const l=x*T,top=y*T, b=2, ll=l+23,bt=top+23;
 c.globalAlpha=.35+.24*(1+Math.sin(t/270));
 for(const [cx,cy,mx,my] of [[l,top,1,1],[ll,top,-1,1],[l,bt,1,-1],[ll,bt,-1,-1]]){
  if(season==='winter'){
   R(c,cx+(mx===-1?-5:0),cy+(my===-1?-1:0)+my,6,b+1,'#536d71');R(c,cx+(mx===-1?-1:0)+mx,cy+(my===-1?-5:0),b+1,6,'#536d71');
  }
  R(c,cx+(mx===-1?-5:0),cy+(my===-1?-1:0),6,b,'#fff4b4');R(c,cx+(mx===-1?-1:0),cy+(my===-1?-5:0),b,6,'#fff4b4');
 }
 c.globalAlpha=1;
}
function haze(c,t,state,season){
 const m=state.minute||480,tint=m<450?'#ffce93':m>1060?'#243852':m>1000?'#b37a5f':null;
 if(tint){const n=m<450?.12:(m>1060?Math.min(.34,(m-1060)/760+.10):.08);
   c.globalAlpha=n;R(c,0,0,W,H,tint);c.globalAlpha=1;}
 const weather=state.weather|| (state.rain?'rain':'clear');
 if(weather==='rain'){
  c.globalAlpha=.13;R(c,0,0,W,H,'#385b72');
  c.globalAlpha=.34;const a=rng(782);
  for(let i=0;i<65;i++){
   const x=(Math.floor(a()*W)+Math.floor(t*.036))%W,y=(Math.floor(a()*H)+Math.floor(t*.103))%H;
   R(c,x,y,1,6,'#b3c7bc');R(c,x-1,y+5,1,3,'#a0b8b4');
   if(i%5===0&&y>5){R(c,x-4,y+9,6,1,'#99b2a2');}
  }
  c.globalAlpha=1;
 }else if(weather==='snow'||weather==='fog'||season==='autumn'){flurries(c,t,weather,season);}
 else{
  const a=rng(247);
  for(let i=0;i<10;i++){
   const ax=a()*W,ay=a()*H, phase=i*.77+t*.00049;
   const x=ax+Math.sin(phase)*9,y=ay+Math.cos(phase*.73)*6;
   c.globalAlpha=.18+.13*Math.sin(phase*2);R(c,x,y,2,2,m>1060?'#f6dd8c':'#e7e5b3');
  }
  c.globalAlpha=1;
 }
}
const npcColors={farmer:c2,shopkeeper:c3,ferryman:c4};
const oldNpcs=[{id:'farmer',x:13,y:7,dir:'right',region:'valley'},{id:'shopkeeper',x:25,y:8,dir:'down',region:'valley'}];
const fallbackSpring={
 dock:{x:23,y:12},shoalDock:{x:5,y:9},
 gather:[{id:'cedar',x:3,y:12,region:'valley'},{id:'driftwood',x:15,y:14,region:'valley'},{id:'shoalwood',x:20,y:10,region:'shoal'}]
};
function stillGatherable(state,id){
 const g=state.spring?.gathered??state.spring?.gatherings??state.spring?.woodSources;
 if(Array.isArray(g))return !g.includes(id);
 if(g&&typeof g==='object')return g[id]!==state.day;
 return true;
}
function drawSpring(c,state,t,region,engine){
 if(!state.spring)return;
 const S=engine?.SPRING||fallbackSpring;
 const s=state.spring;
 if(region==='shoal'){
  const d=S.shoalDock||fallbackSpring.shoalDock;
  ferry(c,51,d.y*T+19,state,t,true);
  pinMark(c,d.x*T+11,d.y*T-17,'#e3cd8d',t,'chevron');
  flora(c,[{x:7,y:6},{x:22,y:6},{x:19,y:13}],t);
 } else{
  const d=S.dock||fallbackSpring.dock;
  ferry(c,d.x*T+78,d.y*T+29,state,t);
  pinMark(c,d.x*T+11,d.y*T-14,s.repaired?'#e6d598':'#c4b48c',t,s.repaired?'chevron':'bang');
 }
 const gathering=Array.isArray(S.gather)?S.gather:fallbackSpring.gather;
 for(const g of gathering){
  if(g.region!==region)continue;
  woodpile(c,g.x*T+12,g.y*T+12,stillGatherable(state,g.id),t);
 }
}
function effect(c,fx,t){
 const e=fx?.event;if(!e||!Number.isFinite(e.x+e.y+e.at))return;
 const phase=(t-e.at)/(e.kind==='fish'?920:550);
 if(phase<0||phase>1)return;
 const colors={
  hoe:['#d2aa75','#af8661','#dfb67e'],water:['#c1e3c5','#88c5b2','#85aeaa'],
  plant:['#f2d48b','#b8c97e','#91b76e'],harvest:['#ffdf97','#ffe6b5','#aacc92'],
  fish:['#b7d6c8','#b6dfcb','#8cbec0'],repair:['#ffe49b','#efd0a0','#a7c396'],
  gather:['#efc88d','#d2b180','#b7c287']
 };
 const set=colors[e.kind]||colors.harvest, x=e.x*T+12,y=e.y*T+12;
 const a=rng(Math.floor(e.at*13));
 c.globalAlpha=1-phase*.93;
 if(e.kind==='fish'||e.kind==='water'){
  const n=7+phase*19,yy=e.kind==='fish'?y+1:y+6;
  R(c,x-n/2,yy-2-phase*2,n,1,set[0]);R(c,x-n*.4,yy+3+phase*2,n*.8,1,set[1]);
  R(c,x-n*.6,yy,n*.17,1,set[0]);R(c,x+n*.49,yy,n*.17,1,set[0]);
 }
 for(let i=0;i<9;i++){
  const rotation=i*Math.PI*2/9+a()*.22, travel=4+(12+a()*9)*phase;
  const dx=Math.sin(rotation)*travel,dy=Math.cos(rotation)*travel*.57-15*phase*(1-phase)*2;
  const size=i%3===0?3:2;
  const col=set[i%3];
  R(c,x+dx,y+dy,size,2,col);
  if(e.kind==='harvest'&&i%3===0)R(c,x+dx+1,y+dy-1,1,4,col);
 }
 c.globalAlpha=1;
}
function draw(ctx,state,t=0,target=null,fx={}){
 const engine=window.MistEngine,region=state.region==='shoal'?'shoal':'valley',season=seasonOf(state,engine);
 const reduce=fx?.reducedMotion||motion?.matches;
 const at=reduce?0:t;
 const entry=backgrounds.get(region);
 const bg=entry?.season===season?entry.bg:region==='shoal'?shoalGround(season):cacheMap(season);
 if(entry?.season!==season)backgrounds.set(region,{season,bg});
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;
 ctx.drawImage(bg,0,0);
 if(region==='shoal')shoalRipples(ctx,at);
 else{
  ripples(ctx,at);plots(ctx,state,at);lamp(ctx,660,133,state.repaired,at);drawRanch(ctx,state,at,engine,season);
 }
 drawSpring(ctx,state,at,region,engine);
 const actors=engine?.npcs?.(state);
 const npcs=Array.isArray(actors)?actors:oldNpcs;
 const z=npcs.filter(a=>(a.region||'valley')===region).map(a=>({
   x:a.x,y:a.y,p:npcColors[a.id]||c2,dir:a.dir||(a.id==='farmer'?'right':a.id==='ferryman'?'left':'down'),phase:null
 }));
 const player=(!reduce&&fx?.player)||state.player||{x:7,y:8,dir:'down'};
 z.push({x:player.x,y:player.y,p:c1,dir:player.dir||'down',phase:reduce?null:player.phase});
 z.sort((a,b)=>a.y-b.y);
 if(target)tileTarget(ctx,target,at,season);
 for(const a of z)sprite(ctx,a.x*T+12,a.y*T+11,a.p,at,a.dir,a.phase);
 if(at>0)effect(ctx,fx,t);
 haze(ctx,at,state,season);
 ctx.restore();
}
const motion=typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
window.MistSeasonArt={seasonOf,flurries,drift};
window.MistArt={draw,walkPose};
})();
