(() => {
'use strict';
const T=24,W=720,H=432, cache=new Map();
const R=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x|0,y|0,w|0,h|0);};
const rng=(seed)=>()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
const P=(c,color,pts)=>{c.fillStyle=color;c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fill();};
const rr=(c,x,y,w,h,d,color)=>P(c,color,[[x+d,y],[x+w-d,y],[x+w-d,y+d],[x+w,y+d],[x+w,y+h-d],[x+w-d,y+h-d],[x+w-d,y+h],[x+d,y+h],[x+d,y+h-d],[x,y+h-d],[x,y+d],[x+d,y+d]]);
const pick=(a,i)=>a[(i%a.length+a.length)%a.length];
const px=(t)=>t*T;
function leaf(c,x,y,w,h,k){
 R(c,x+w*.18,y,w*.64,h,k);R(c,x+w*.07,y+h*.15,w*.86,h*.69,k);R(c,x,y+h*.32,w,h*.35,k);
}
const townTree=['#7f8d67','#547456','#68895f','#85a26a','#a1b779','#babf7e'];
const lilac=['#657861','#4c6e68','#627e74','#7b9891','#a1a99b','#bcb5ac'];
const groveTree=['#637f66','#345d57','#47786a','#63917a','#85a585','#afbb98'];
const amberTree=['#808263','#73684f','#967c56','#b19a63','#cdb274','#e1c186'];
const theme={
 spring:{},
 summer:{
  town:['#8f9f70','#97a772','#9aa874','#8d9f6e','#99ab76','#8ba16d','#93a36e'],
  grove:['#729681','#789b81','#7da087','#719786','#80a38b','#6f9482','#83a18a'],
  tree:[['#738961','#3e6c4d','#5b8051','#79a064','#9db471','#b3bc76'],['#638367','#386f66','#507e70','#6b9a89','#97b2a0','#a8baa8'],['#5a7b64','#2f6155','#437864','#589078','#77a484','#a6b99a']],
  flowers:['#e6a9b5','#f4d78f','#edd19f','#e9b1ab','#bdb3d1','#afc37d']},
 autumn:{
  town:['#b7a475','#bba777','#baa978','#b4a073','#c0ab77','#b4a375','#b6a275'],
  grove:['#a4a382','#aaa883','#acaa86','#a2a389','#b1a983','#a2a585','#aaa888'],
  tree:[['#9b936e','#775941','#99724a','#b88d54','#d0a968','#e2be80'],['#999375','#70584f','#996a56','#b78367','#cfa381','#dfb48e'],['#8d9077','#526b5a','#667b5b','#829168','#a8a379','#c7b084']],
  flowers:['#d39168','#d6a76e','#e4b67a','#e6b989','#c78d78','#bfa87d']},
 winter:{
  town:['#c1cfd0','#c6d4d3','#cbd8d7','#beccd0','#c7d6d8','#c1d0d5','#c8d6d6'],
  grove:['#bacfd0','#bdd2d1','#c4d7d5','#b7ccce','#c3d5d4','#b7cccf','#c3d4d5'],
  tree:[['#a6bcc2','#577371','#7b9290','#9db2ab','#cbdcd4','#e2ece1'],['#abc0c3','#667f82','#859c9f','#aebfbe','#cfded9','#e4ebe5'],['#a2b9bf','#406763','#5b7d78','#789795','#b6cec9','#dce9e0']],
  flowers:['#c8adaa','#d3bb99','#beafc3','#c1c5b7','#b0b9c3','#acbab6']},
};
function seasonalTree(k,season){
 return theme[season].tree?.[k===lilac?1:k===groveTree?2:0]||k;
}
function drift(c,x,y,w,h){
 R(c,x+2,y+2,w-4,h-1,'#a8bcc1');R(c,x+3,y,w-6,h,'#d5e2dc');R(c,x+5,y-1,w-10,2,'#e8efe7');
}
function tree(c,x,y,s,k,style=0,shadowOnly=false,season='spring'){
 c.save();c.translate(x|0,y|0);c.scale(s,s);
 if(shadowOnly){leaf(c,-23,-3,52,14,k[0]);c.restore();return;}
 R(c,-4,-21,10,27,'#655e51');R(c,-2,-27,5,29,'#8d7555');R(c,-2,-13,2,13,'#aa8964');
 R(c,-9,4,13,3,'#746952');R(c,4,4,4,2,'#7a6f55');R(c,-8,-15,7,2,'#7a644f');R(c,5,-13,4,2,'#786953');
 let groups=style===2?[[-24,-47,49,28],[-18,-58,42,21],[-31,-39,38,24],[0,-42,32,28],[-16,-35,44,29]]:style===1?[[-22,-53,38,27],[-31,-43,42,27],[-8,-40,38,27],[-15,-27,37,21],[-19,-60,29,23]]:[[-28,-39,44,27],[-15,-53,37,32],[-38,-32,43,26],[0,-44,37,31],[-12,-31,42,30]];
 for(const [i,g] of groups.entries())leaf(c,g[0],g[1],g[2],g[3],k[1+i%2]);
 for(const [i,g] of groups.entries())leaf(c,g[0]+3,g[1]+2,g[2]-9,g[3]-8,k[2+i%2]);
 const a=rng(Math.floor(x*19+y*71));
 for(let i=0;i<36;i++){
  const g=groups[i%groups.length],xx=g[0]+8+a()*(g[2]-15),yy=g[1]+3+a()*(g[3]-13);
  if(i%3) R(c,xx,yy,1+(i%4),1+(i%2),k[2+i%3]);else{R(c,xx,yy,1,3,k[5]);R(c,xx-1,yy+1,3,1,k[4]);}
 }
 if(season==='winter'){
  for(const [gx,gy,gw,gh] of groups){drift(c,gx+5,gy+4,gw-10,4);if(gw>41)drift(c,gx+14,gy+gh*.53,gw*.46,3);}
 }else if(style===2)for(const [xx,yy] of [[-6,-37],[5,-39],[11,-22],[-11,-22],[24,-26],[-22,-28]]){
  R(c,xx,yy,3,2,'#f2d2af');R(c,xx+1,yy-1,1,4,'#ce948e');
 }
 c.restore();
}
function sprig(c,x,y,col,k='#587d64',size=1){
 R(c,x,y-3*size,size,5*size,k);R(c,x-2*size,y,2*size,size,k);R(c,x+size,y-size,2*size,size,k);
 R(c,x-size,y-4*size,3*size,size,col);R(c,x,y-5*size,size,3*size,col);
}
function rock(c,x,y,s=1,k=['#667968','#929b83','#bac3a5']){
 R(c,x-5*s,y+2*s,13*s,3*s,k[0]);P(c,k[0],[[x-6*s,y+2*s],[x-4*s,y-3*s],[x+2*s,y-5*s],[x+6*s,y-2*s],[x+7*s,y+3*s],[x-4*s,y+4*s]]);
 P(c,k[1],[[x-5*s,y+2*s],[x-3*s,y-3*s],[x+2*s,y-4*s],[x+5*s,y-2*s],[x+5*s,y+2*s]]);
 R(c,x-2*s,y-3*s,5*s,s,k[2]);R(c,x-4*s,y-s,3*s,s,k[2]);
}
function bush(c,x,y,k,flowers=false){
 leaf(c,x-14,y-1,29,7,k[0]);leaf(c,x-14,y-10,29,13,k[1]);leaf(c,x-9,y-14,21,13,k[2]);leaf(c,x-12,y-9,19,8,k[3]);
 for(const [xx,yy] of [[-8,-9],[1,-10],[10,-7],[4,-4],[-4,-3]])R(c,x+xx,y+yy,2,1,k[4]);
 if(flowers)for(const [xx,yy] of [[-10,-7],[1,-8],[5,-11],[9,-5],[-4,-5]])sprig(c,x+xx,y+yy+4,pick(['#e4b7a2','#f4d7a6','#d3b2b8'],xx),k[3]);
}
function grass(c,cols,w,h,seed){
 const a=rng(seed);R(c,0,0,w,h,cols[0]);
 for(let i=0;i<260;i++){const x=a()*w,y=a()*h,sw=18+a()*84,sh=8+a()*64;leaf(c,x,y,sw,sh,pick(cols,i));}
 for(let i=0;i<w*h/155;i++){
  let x=4+a()*(w-8),y=4+a()*(h-8),k=pick(cols,i+1);
  if(i%5===0){R(c,x,y,1,3,k);R(c,x-2,y-1,1,2,k);R(c,x+1,y-1,1,2,k);}
  else {R(c,x,y,i%4+1,1,k);if(i%9===0)R(c,x+3,y+1,1,1,k);}
 }
}
function path(c,x,y,w,h,town=true,seed=101,season='spring'){
 const a=rng(seed),k=season==='winter'?['#aebbc0','#a9b2b3','#9fa7a8','#b7bfc0','#c1c7c5','#919fa4','#a5b0ae']:town?['#aaa67c','#bdb890','#d0c597','#d8cfa3','#e1d2a7','#c2b18c','#aa9d7f']:['#9da784','#a9ad88','#b3ae8e','#b9b394','#c7bb9c','#a5a98a','#9da385'];
 R(c,x,y,w,h,k[0]);R(c,x+1,y+2,w-2,h-4,k[1]);R(c,x+2,y+5,w-4,h-10,k[2]);
 for(let i=0;i<w*h/150;i++){
  let xx=x+3+a()*(w-7),yy=y+3+a()*(h-7);
  R(c,xx,yy,1+i%4,(i%16===0?2:1),k[3+i%4]);
 }
}
function bricks(c,x,y,w,h,scheme=['#b7a185','#c0ae8f','#d4c5a7','#c7b899','#b8a688','#cfbba2']){
 const a=rng(x*13+y*11);R(c,x,y,w,h,scheme[0]);
 for(let row=0;row<h/9;row++){
  const shift=(row%2)*8;
  for(let at=0;at<w;at+=15){
   const n=(at+shift)%w,l=Math.min(14,w-n),tt=Math.min(8,h-row*9);
   R(c,x+n,y+row*9,l,tt,pick(scheme,1+(a()*5|0)));
   R(c,x+n+1,y+row*9,Math.max(1,l-2),1,scheme[2]);
   if(a()<.11)R(c,x+n+4,y+row*9+4,3,1,scheme[0]);
  }
 }
}
function board(c,x,y,k=['#6b6050','#ab8b64','#dfc090']){
 R(c,x-10,y+3,21,3,'#8c9772');R(c,x-7,y-11,3,17,k[0]);R(c,x+5,y-11,3,17,k[0]);
 R(c,x-11,y-16,23,13,k[0]);R(c,x-10,y-16,21,11,k[1]);R(c,x-8,y-15,17,2,k[2]);R(c,x-7,y-11,13,1,k[2]);R(c,x-4,y-8,9,1,k[2]);
}
function planter(c,x,y,w=30,k=townTree){
 R(c,x,y+8,w,5,'#8f9871');R(c,x,y,w,10,'#796654');R(c,x+1,y,w-2,8,'#a88963');R(c,x+1,y,w-2,2,'#caad78');R(c,x+3,y-1,w-6,2,'#7f7958');
 for(let i=0;i<w-7;i+=5)sprig(c,x+3+i,y-2-i%3,pick(['#ddaa9e','#f2d095','#bc9aae'],i),k[2]);
}
function roof(c,x,y,w,h,p,season='spring'){
 const [dark,low,mid,lit,flash]=p;
 P(c,dark,[[x,y+h],[x+w*.18,y+4],[x+w*.30,y],[x+w*.73,y],[x+w*.82,y+4],[x+w,y+h],[x+w-3,y+h+4],[x+3,y+h+4]]);
 const a=rng(x*31+y);
 for(let i=0;i<h;i+=5){
  const l=(x+w*.23*(1-i/h))|0, r=(x+w-w*.24*(1-i/h))|0;
  R(c,l,y+i+2,r-l,4,i>h*.69?low:mid);R(c,l+1,y+i+2,r-l-2,1,lit);
  for(let j=l+4+(i%3)*2;j<r-2;j+=9){R(c,j,y+i+3,1,2,low);if(a()>.7)R(c,j+2,y+i+2,3,1,flash);}
 }
 R(c,x+2,y+h-1,w-4,2,lit);R(c,x+3,y+h+2,w-6,2,dark);
 if(season==='winter'){
  drift(c,x+w*.28,y+1,w*.47,5);drift(c,x+w*.20,y+5,w*.58,5);drift(c,x+w*.24,y+10,w*.34,5);
  drift(c,x+w*.62,y+9,w*.23,6);drift(c,x+w*.13,y+15,w*.23,5);drift(c,x+w*.51,y+h-6,w*.28,4);
  for(let j=0;j<6;j++)R(c,x+w*.18+j*4,y+16+j%4,1,2+j%3,'#bbd0d1');
 }
}
function windowPane(c,x,y,w=23,h=18,open=false){
 R(c,x-2,y-2,w+4,h+5,'#937f66');R(c,x,y,w,h,open?'#806b58':'#536960');
 R(c,x+1,y+1,w-2,h-2,open?'#edc58a':'#8ca99c');R(c,x+1,y+1,w-2,2,open?'#f8dda5':'#a6b5a3');
 R(c,x+4,y+3,2,h-6,open?'#f6d699':'#b7c0a4');R(c,x+(w>>1),y,2,h,'#77745c');R(c,x,y+7,w,2,'#77745c');
 R(c,x-3,y+h,w+6,3,'#b99b72');R(c,x-2,y+h,w+4,1,'#dec193');
}
function door(c,x,y,w=19,h=30,teal=false){
 R(c,x-3,y-4,w+6,h+5,'#786154');R(c,x,y,w,h,teal?'#567c73':'#836753');
 R(c,x+1,y+1,w-3,2,teal?'#87a497':'#d0a47a');
 for(let i=2;i<w;i+=4)R(c,x+i,y+3,1,h-4,teal?'#4c6e68':'#775c4f');
 R(c,x+4,y+5,w-8,6,'#56635b');R(c,x+5,y+6,w-10,4,'#d5c38d');R(c,x+w-5,y+h-10,2,2,'#eace8c');
 R(c,x-3,y+h,w+6,3,'#a9967a');
}
const terra=['#6d514d','#8e5c55','#b57661','#c88b6b','#dba778'];
const slate=['#4d6665','#536e70','#739293','#8aa6a1','#a8bab0'];
const jade=['#4e6c61','#5c8174','#779a86','#93b19a','#b3c59f'];
function building(c,box,kind,ex,season){
 const x=px(box[0]),y=px(box[1]),w=px(box[2]),h=px(box[3]), b=y+h, roofK=kind%3===0?terra:kind%3===1?slate:jade;
 leaf(c,x+5,b-9,w+5,13,'#87946c');R(c,x+5,y+h*.32,w-10,h*.68-7,'#88735d');
 R(c,x+7,y+h*.37,w-14,h*.63-11,kind===1?'#ccb99b':'#d5c0a0');
 R(c,x+7,y+h*.72,w-14,h*.28-11,'#c5ac8a');
 R(c,x+8,b-15,w-16,8,'#a59477');R(c,x+8,b-15,w-16,2,'#bba886');
 for(let j=0;j<w/15;j++)R(c,x+8+j*15,b-12,1,6,'#948569');
 R(c,x+8,y+h*.4,4,h*.57-5,'#937a5c');R(c,x+w-12,y+h*.4,4,h*.57-5,'#937a5c');
 roof(c,x,y+3,w,Math.floor(h*.42),roofK,season);
 if(kind!==3){
   const ch=x+w-28,cy=y+2; R(c,ch,cy,13,22,'#937868');R(c,ch+2,cy+3,8,18,'#b1937b');
   R(c,ch-1,cy-3,15,4,'#9b8371');R(c,ch-1,cy-3,15,1,'#d7b797');R(c,ch+2,cy+6,7,1,'#d1af94');R(c,ch+4,cy+13,7,1,'#d1af94');
 }
 const dx=ex===undefined?x+w/2:ex, dy=b-11;
 const ww=w>=135?23:18;windowPane(c,x+18,b-39,ww,18,kind===2);windowPane(c,x+w-ww-18,b-39,ww,18,kind===1);
 if(w>=120){planter(c,x+15,b-17,ww+5);planter(c,x+w-ww-21,b-17,ww+5);}
 door(c,dx-9,dy-26,18,26,kind>=1);
 if(kind===0){
  // Long ochre plate with hand-carved crossed tools and two hanging hooks.
  R(c,dx-19,dy-42,38,11,'#775e4e');R(c,dx-17,dy-41,34,8,'#bd9969');R(c,dx-16,dy-40,31,1,'#e0c292');
  for(let j=0;j<8;j++){R(c,dx-4+j,dy-39+j*.47,2,1,'#6b6155');R(c,dx+3-j,dy-39+j*.47,2,1,'#6b6155');}
  R(c,dx-6,dy-39,5,2,'#6b6155');R(c,dx+4,dy-40,2,3,'#6b6155');
 }else{
  R(c,dx-7,dy-39,14,6,'#8d7e62');R(c,dx-5,dy-38,10,1,'#c5ae82');R(c,dx-4,dy-35,8,1,'#b09b72');
 }
 for(const xx of [dx-18,dx+17]){R(c,xx,b-37,2,9,'#816f54');R(c,xx-2,b-32,6,5,'#9b835c');R(c,xx-1,b-31,4,3,'#e0b87a');}
 R(c,dx-11,b-10,22,4,'#a79572');R(c,dx-10,b-10,20,1,'#cebb94');
}
function stall(c,x,y){
 R(c,x-23,y+4,47,7,'#9b9f78');
 for(const xx of [x-22,x+18]){R(c,xx,y-28,4,37,'#836954');R(c,xx+1,y-25,1,32,'#b2946c');}
 R(c,x-22,y-7,44,14,'#75614f');R(c,x-21,y-8,42,12,'#b28a62');R(c,x-20,y-8,40,2,'#d2ad7c');
 for(let i=0;i<4;i++){R(c,x-20+i*10,y-16,7,7,'#8b785f');R(c,x-19+i*10,y-16,5,4,pick(['#db9d89','#b8bf7e','#e2c170'],i));}
 P(c,'#80655b',[[x-28,y-24],[x-21,y-34],[x+20,y-34],[x+27,y-24],[x+27,y-20],[x-28,y-20]]);
 for(let i=0;i<7;i++){
  const xx=x-27+i*8,kk=i%2?'#c99a82':'#efcf9b';
  P(c,kk,[[xx,y-22],[xx+6,y-22],[xx+4+(7-i)*.32,y-33],[xx+(7-i)*.32+2,y-33]]);
  R(c,xx,y-23,7,3,i%2?'#b88875':'#d9b780');
 }
}
function bollard(c,x,y){
 R(c,x-6,y+5,14,2,'#92956c');R(c,x-2,y-18,4,25,'#786954');R(c,x-2,y-18,2,24,'#a08c65');
 R(c,x-5,y-22,10,4,'#665e52');R(c,x-4,y-18,8,7,'#897151');R(c,x-3,y-17,6,5,'#ebbd7f');R(c,x-2,y-17,2,4,'#f8dca3');R(c,x-5,y-12,10,2,'#756853');
}
function bench(c,x,y){
 R(c,x-15,y+5,34,3,'#929476');
 for(const xx of [x-13,x+11]){R(c,xx,y-11,3,17,'#796758');R(c,xx,y-11,1,16,'#ab916e');}
 R(c,x-16,y-9,32,6,'#aa8967');R(c,x-15,y-9,29,1,'#d8b78c');R(c,x-16,y-3,32,5,'#987b61');R(c,x-15,y-3,29,1,'#c9a57c');
}
const dict={
 town:{w:42,h:24,portal:[{x:0,y:11},{x:39,y:22}]},
 grove:{w:44,h:26,portal:[{x:0,y:10}],gather:[{id:'deadwood',x:8,y:17},{id:'wildHerb',x:17,y:7},{id:'groveMushroom',x:24,y:19},{id:'honeyFlower',x:39,y:19}]},
 house:{w:30,h:18,portal:[{x:14,y:14}]},store:{w:30,h:18,portal:[{x:14,y:14}]},barn:{w:30,h:18,portal:[{x:14,y:14}]}
};
const overlaps=(x,y,b,d=0)=>x>b[0]-d&&x<b[0]+b[2]+d&&y>b[1]-d&&y<b[1]+b[3]+d;
function flora(c,w,h,a,excluded,florals,k,g,season){
 for(let i=0;i<(g?490:360);i++){
  let x=3+a()*(w-6),y=3+a()*(h-6);
  if(excluded.some(b=>overlaps(x/T,y/T,b,.25)))continue;
  if(season==='winter'){
   if(i%9===0)rock(c,x,y,.40+(i%7)/8,['#9bb1b8','#b0c4c8','#e0e9e4']);
   else if(i%3===0)drift(c,x-5,y,11+i%8,3+(i%2));
   else if(i%4===0)sprig(c,x,y,pick(florals,i),k[2]);
   continue;
  }
  if(season==='autumn'&&i%5===0){R(c,x,y,3,2,florals[i%6]);R(c,x+1,y+2,1,1,'#b58761');continue;}
  if(i%7===0)rock(c,x,y,.38+(i%9)/8,g?['#70867b','#8fa598','#a9b9a0']:['#8b9672','#a6ab83','#c2c398']);
  else {let color=pick(florals,(x+y)|0);sprig(c,x,y,color,k[i%5],i%9===0?2:1);
   if(i%(season==='summer'?2:4)===0)sprig(c,x+4,y+3,color,k[(i+1)%5]);}
 }
}
function addTree(c,front,x,y,s,k,type=0,season='spring'){
 const shade=seasonalTree(k,season);
 tree(c,x,y,s,shade,type,true,season);
 front.push({y:y+5,x,w:s*78,paint:(c)=>tree(c,x,y,s,shade,type,false,season)});
}
function town(c,w,h,front,season){
 const a=rng(184),boxes=[[8,3,9,5],[20,4,8,5],[29,8,8,5],[7,15,8,6]];
 grass(c,theme[season].town||['#a2ab7a','#a6ae7d','#aab181','#9fa975','#a9b180','#a1ac79','#a6ac78'],w,h,23);
 const roads=[[0,10,27,3],[16,9,9,8],[18,13,11,5],[25,13,15,3],[37,15,3,8],
  [11,8,2,2],[22,8,3,2],[31,13,3,2],[10,13,3,2],[8,21,8,2]];
 for(let i=0;i<roads.length;i++){const [x,y,ww,hh]=roads[i];path(c,px(x),px(y),px(ww),px(hh),true,i*18+4,season);}
 const tile=season==='winter'?['#8c999b','#a0a9a8','#b2b9b5','#a9b3b1','#a0a8a6','#a5b2b0']:undefined;
 bricks(c,px(16),px(10)+4,px(9),px(3)-8,tile);bricks(c,px(17)+4,px(13),px(10),px(4)-8,tile);
 bricks(c,px(28),px(14)+4,px(10),px(2)-8,tile);
 for(const [x,y,ww,hh] of [[16,10,9,3],[17,13,10,4],[28,14,10,2]]){
  R(c,px(x)+2,px(y)+2,px(ww)-4,2,'#ded0ab');R(c,px(x)+2,px(y+hh)-4,px(ww)-4,2,'#b1a382');
 }
 flora(c,w,h,a,[...roads,...boxes],theme[season].flowers||['#d7b294','#e3bf94','#dcb0ad','#bec68d','#a5b67b'],seasonalTree(townTree,season),false,season);
 for(const [x,y,s,k] of [[1.5,4.5,1.18,townTree],[5,5.9,1.1,lilac],[4,8.6,.85,townTree],[18.4,3.9,.95,amberTree],
  [29,4.5,1.05,townTree],[32,5.4,1.06,lilac],[37.1,5.1,1.18,townTree],[41.2,8.3,1.02,amberTree],[2.9,17.2,1.04,townTree],
  [4.8,20.8,.88,lilac],[16,20.4,.9,amberTree],[19.9,20.4,.91,townTree],[23.6,22.7,1.14,lilac],[29.4,22.1,1.04,townTree],
  [41.3,18.2,1.08,townTree],[34.6,20.2,1.02,amberTree],[27.7,18,.79,townTree],[6.1,14.6,.55,townTree],[1.5,23.3,.95,townTree]])addTree(c,front,px(x),px(y),s,k,k===lilac?2:0,season);
 for(const [x,y] of [[7,4],[17,5],[21,2.7],[27.8,7],[30.4,7],[41,4],[28,12],[37.8,12],[15,20],[7,21.6],[36,19],[40,21.1],[15,14],[4,16]])
  bush(c,px(x),px(y),seasonalTree(townTree,season),season!=='winter');
 // The four village buildings occupy the exact blocked engine footprints.
 for(const [i,box] of boxes.entries()){
  let k=[1,0,2,3][i],dx=i===1?px(23)+12:undefined;
  building(c,box,k,dx,season);
 }
 stall(c,px(12)+12,px(9)+10);
 for(const [x,y] of [[6,10],[14,10],[20,9.1],[25,10],[16,14],[27,15.9],[36,14],[39.4,19.7]])bollard(c,px(x),px(y));
 for(const [x,y] of [[16.9,9.9],[26.8,12],[25.8,17.7],[35,16.3],[10,13.8]])bench(c,px(x),px(y));
 for(const [x,y] of [[1,10],[37.4,21.7]])board(c,px(x),px(y));
 for(const [x,y] of [[18,13.8],[24.8,14.5],[35.4,13.6],[12.9,8.8]])planter(c,px(x),px(y),28);
 // Mosaic town crest is a flat plaza decoration and intentionally walkable.
 const cx=px(21),cy=px(15);
 rr(c,cx-24,cy-16,48,32,5,'#ad9b7e');rr(c,cx-22,cy-14,44,28,4,'#d1bd9c');
 P(c,'#8e9c8c',[[cx-13,cy],[cx,cy-10],[cx+13,cy],[cx,cy+10]]);
 P(c,'#e6cd9e',[[cx-9,cy],[cx,cy-7],[cx+9,cy],[cx,cy+7]]);
 for(let i=0;i<9;i++){R(c,cx+i-4,cy,1,1,'#8e9c8c');if(i%3===0)R(c,cx+i-4,cy-2,1,5,'#8e9c8c');}
 // The gateway is decorative above the southbound destination tile.
 const gx=px(39)+12,gy=px(22)-5;
 for(const x of [gx-24,gx+20]){
  R(c,x,gy-32,5,39,'#776e58');R(c,x,gy-32,2,39,'#ab9370');R(c,x-2,gy+6,9,3,'#91856a');
 }
 R(c,gx-27,gy-34,54,6,'#725f54');R(c,gx-26,gy-34,52,2,'#ad8f6a');R(c,gx-14,gy-27,28,8,'#9a805e');
 R(c,gx-11,gy-26,22,1,'#dec293');for(let i=0;i<7;i++)R(c,gx-9+i*3,gy-23,2,1,'#e1cca0');
}
function pond(c,season){
 const x=px(29),y=px(10),w=px(10),h=px(7),a=rng(1971);
 const [outer,inner]=season==='winter'?['#b2c7ca','#d1dfd8']:season==='autumn'?['#aaa68a','#c3b492']:['#9baf8d','#b2b59a'];
 R(c,x-8,y-5,w+16,h+10,outer);R(c,x-4,y-4,w+8,h+8,inner);
 R(c,x,y,w,h,'#7e9f91');R(c,x+5,y+5,w-10,h-10,'#799d97');R(c,x+10,y+13,w-20,h-24,'#71989b');
 R(c,x+20,y+28,w-40,h-48,'#6e9599');R(c,x+35,y+36,w-60,h-70,'#70949c');
 for(let i=0;i<80;i++){
  const xx=x+3+a()*(w-6),yy=y+4+a()*(h-9);
  R(c,xx,yy,3+(i%8),1,pick(['#83a6a2','#8aaea3','#7da3a0','#709597'],i));
 }
 for(let i=0;i<53;i++){
  const side=i%4,u=a(),xx=side<2?x+u*w:side===2?x:x+w,yy=side>=2?y+u*h:side===0?y:y+h;
  if(i%5===1){rock(c,xx,yy,.53+(i%10)/10,season==='winter'?['#7d989e','#9fb7bc','#d2e2df']:['#718b80','#9aab97','#c1c9a9']);continue;}
  if(season==='winter'&&i%2===0){drift(c,xx-5,yy-1,13+i%8,3);continue;}
  if(i%3!==0) for(let j=0;j<3;j++){
   const k=5+((i*9+j*5)%9);R(c,xx+j*2,yy-k,1,k,'#5f8d7e');
   if((i+j)%3===0)R(c,xx+j*2,yy-k,2,4,'#857961');
  }
 }
 for(const [dx,dy,d] of [[23,21,1],[43,35,0],[205,140,0],[191,131,1],[218,122,0],[154,21,1],[166,26,0],[33,120,1],[44,125,0]]){
  leaf(c,x+dx,y+dy,13,6,'#77917e');leaf(c,x+dx,y+dy-1,10,5,'#a2b386');R(c,x+dx+2,y+dy+4,6,1,'#8ca892');
  if(d)sprig(c,x+dx+5,y+dy,'#e3bab3','#83a382',1);
 }
}
function grove(c,w,h,front,season){
 const a=rng(519), roads=[[0,9,15,3],[13,10,12,2],[23,11,5,3],[26,13,3,6],[12,12,2,6],[9,17,4,2],[15,8,6,2],[22,19,6,2],[28,17,12,2]];
 grass(c,theme[season].grove||['#8ba990','#8eac91','#91ae94','#89a590','#96ad92','#83a58c','#93ab8d'],w,h,531);
 for(const [x,y,ww,hh] of roads)path(c,px(x),px(y),px(ww),px(hh),false,x*13+y,season);
 pond(c,season);
 flora(c,w,h,a,[...roads,[29,10,10,7]],theme[season].flowers||['#bac1a1','#c8bec1','#d6c0c5','#d0c491','#acba95','#a1b3a5'],seasonalTree(groveTree,season),true,season);
 let treeLocations=[
  [2,2,1.3],[5,3,1.12],[7.4,5.2,1.04],[3.8,7,.85],[12,4.5,.9],[14.8,6.3,1.17],[23.3,5.4,1.52],[26,4.7,1.03],[29,7.2,1.2],[32.8,6,1.02],[38,5,1.12],[42,5.7,1.24],
  [42,10.8,1.09],[40.8,15.9,.91],[42.6,19,1.16],[35.3,20,.79],[31.2,22.3,1],[40,24.6,1.21],[36.8,24.3,.93],[28,24.1,1.12],[23.8,24.6,.84],[19,22.3,1.07],[16,24,1.14],[12.7,22.7,.91],
  [8.5,22.2,1.21],[4.2,20,1.17],[2.3,22.8,1.05],[1.2,15.3,.97],[4.1,13.6,.83],[7.4,13.1,.98],[10.7,15.8,.75],[19.2,14.7,.8],[20.6,16,.82],[16.3,15.5,.95],[15.4,19,.78],[23.2,17,.98],
  [29,20,1.04],[19.4,7.2,.83],[33.9,1.2,1.05],[36.4,1.2,.93],[10.7,1.2,1.12],[20.8,1.7,1.12],[0,4,.94],[25.4,1.0,.96]
 ];
 for(const [i,[x,y,s]] of treeLocations.entries())addTree(c,front,px(x),px(y),s,i%6===2?lilac:groveTree,i%6===2?2:i%3===1?1:0,season);
 // Ancient elder: large original silhouette with a bed of roots and luminous lichen.
 const ex=px(23.4),ey=px(5.4);
 for(let i=0;i<7;i++){
  const a=i*1.08,b=Math.cos(a)*25, d=Math.sin(a)*8;
  P(c,i%2?'#788679':'#66796c',[[ex,ey-3],[ex+b*.63,ey+d*.61],[ex+b,ey+d],[ex+b*.53,ey+d+3],[ex+3,ey+5]]);
  if(i%2)rock(c,ex+b,ey+d,1.24,['#687e73','#94a796','#b3b899']);
 }
 for(let i=0;i<35;i++){
  const a1=i*Math.PI/17.5, u=15+i%6*4;
  if(i%4===0)sprig(c,ex+Math.cos(a1)*u,ey+Math.sin(a1)*u*.57+8,'#d3c3b7','#88a68e',1);
 }
 // Walking trails cross a tiny dappled stepping-stone clearing around the southern bank.
 for(const [x,y] of [[26.2,17.8],[27.1,18],[27.8,17.9],[28.5,18],[29.7,18.4],[31.1,18.5],[32.1,18.5],[33.1,18.5]])
  rock(c,px(x),px(y),1.2,['#7e9481','#a0af96','#b8c4a4']);
 for(const [x,y] of [[12,8.1],[14.3,13],[20,10],[25,13],[40,18.7],[8.3,18.1],[22,19.9],[3.8,16.1],[30,8.8],[41,8.5]])
  bush(c,px(x),px(y),seasonalTree(groveTree,season),season!=='winter');
 board(c,px(.9),px(8.95),['#62766a','#958c6b','#c9be94']);
}
function wool(c,x,y,w,h,k){
 rr(c,x-3,y+1,w+6,h+2,3,'#806c5e');R(c,x-4,y+5,4,h-9,'#d0b28e');R(c,x+w,y+5,4,h-9,'#d0b28e');
 R(c,x,y,w,h,k[0]);R(c,x+3,y+3,w-6,h-6,k[1]);R(c,x+9,y+8,w-18,h-16,k[2]);
 R(c,x+11,y+10,w-22,h-20,k[0]);R(c,x+12,y+11,w-24,h-22,k[2]);
 const a=rng(x+y);
 for(let i=0;i<w*h/100;i++){const xx=x+5+a()*(w-10),yy=y+5+a()*(h-10);R(c,xx,yy,3,1,k[(i+2)%k.length]);}
 for(let i=10;i<w-5;i+=13)for(const iy of [y+5,y+h-6]){
  R(c,x+i,iy,1,3,k[2]);R(c,x+i-1,iy+1,3,1,k[2]);
 }
 const cx=x+w/2,cy=y+h/2;
 for(let j=0;j<4;j++){
  const d=16-3*j;
  P(c,k[j%3],[[cx-d*1.35,cy],[cx,cy-d*.5],[cx+d*1.35,cy],[cx,cy+d*.5]]);
 }
}
function shelf(c,x,y,w,s=0){
 R(c,x+3,y+36,w+2,6,'#947861');R(c,x,y,w,37,'#6f554b');R(c,x+2,y+1,w-4,32,'#876b55');
 const a=rng(x+y);
 for(let row=0;row<2;row++) {
  const top=y+14+row*14;
  for(let i=4;i<w-6;){
   const width=3+Math.floor(a()*4),hh=4+Math.floor(a()*6),k=pick(s?['#739387','#b28876','#d2ad7b','#a7a175','#bc9d97']:['#a9895b','#b28e83','#98a18a','#d0aa7d','#879889'],Math.floor(a()*5));
   R(c,x+i,top-hh,width,hh,k);R(c,x+i+1,top-hh+1,width-2,1,'#e0c29a');i+=width+1;
  }
  R(c,x,top,w,3,'#ac8967');R(c,x+1,top,w-2,1,'#cba882');
 }
 R(c,x-1,y,w+2,4,'#9e7b60');R(c,x,y,w,1,'#c4a27f');R(c,x+2,y+32,3,8,'#7c5d4c');R(c,x+w-5,y+32,3,8,'#7c5d4c');
}
function jar(c,x,y,k){
 R(c,x-4,y+2,9,2,'#856f5d');R(c,x-3,y-7,7,9,k);R(c,x-2,y-8,5,2,'#d3b288');R(c,x-2,y-5,5,4,'#d6bc92');R(c,x-1,y-4,3,1,'#edd0a1');
}
function bed(c,x,y){
 R(c,x+7,y+52,103,10,'#997c67');rr(c,x+8,y+2,102,58,4,'#76574d');
 R(c,x+9,y+1,100,14,'#8e6e59');R(c,x+12,y+1,94,2,'#c29f7c');
 for(let i=11;i<105;i+=9)R(c,x+i,y+4,1,9,'#a18065');
 rr(c,x+14,y+13,90,41,5,'#b99b7d');rr(c,x+16,y+14,86,37,5,'#e8c9a1');rr(c,x+31,y+15,55,14,3,'#ddcfad');rr(c,x+32,y+15,53,10,3,'#f1dcbc');
 R(c,x+34,y+16,46,2,'#f6e6c5');
 R(c,x+16,y+30,86,23,'#799580');R(c,x+18,y+30,82,17,'#93aa90');R(c,x+19,y+31,80,2,'#afbb9b');R(c,x+19,y+48,80,2,'#697f70');
 for(let i=24;i<99;i+=10){R(c,x+i,y+33,1,14,'#829c86');R(c,x+i-3,y+38,7,1,'#b1bd99');R(c,x+i,y+35,1,7,'#b1bd99');}
 R(c,x+9,y+53,100,5,'#9d7a5e');R(c,x+9,y+53,100,1,'#c6a281');R(c,x+10,y+57,5,5,'#7d5f51');R(c,x+103,y+57,5,5,'#7d5f51');
}
function counter(c,x,y){
 R(c,x+5,y+53,137,8,'#977e68');rr(c,x,y+34,144,23,3,'#795c50');R(c,x+3,y+39,138,14,'#af8664');
 for(let i=4;i<136;i+=18){R(c,x+i,y+42,16,11,'#a48264');R(c,x+i+1,y+42,14,1,'#c09872');R(c,x+i+6,y+46,4,2,'#7d6957');}
 rr(c,x-1,y+16,146,27,3,'#68564c');rr(c,x,y+16,144,20,3,'#b69470');R(c,x+2,y+17,140,2,'#d7b791');R(c,x+2,y+34,139,2,'#a58263');
 for(const [i,k] of [[86,'#92a687'],[104,'#bb9279'],[120,'#d0a46f']])jar(c,x+i,y+28,k);
 rr(c,x+19,y+22,27,10,2,'#837f68');R(c,x+21,y+22,23,5,'#a6a68d');R(c,x+22,y+22,20,1,'#b9bd9f');
 R(c,x+53,y+20,16,9,'#c9b08d');R(c,x+55,y+21,13,2,'#e8d0a8');R(c,x+55,y+25,10,1,'#9f9275');
}
function interior(c,w,h,isStore){
 const a=rng(isStore?181:141);
 const x=72,y=72,b=360,r=648,colors=isStore?['#ae9070','#b39776','#bc9c7a','#b99a77','#aa896a']:['#b88f73','#bb9477','#c09a7b','#c29a7b','#b38d72'];
 R(c,0,0,w,h,isStore?'#485655':'#454f50');
 // Fade-like nested flooring shadows keep the room silhouette distinct.
 rr(c,x-16,30,r-x+32,348,9,isStore?'#4d5b59':'#4c5655');rr(c,x-10,34,r-x+20,338,7,isStore?'#5c6460':'#5c6057');
 R(c,x-6,39,r-x+12,328,'#6b6055');R(c,x-4,48,r-x+8,318,'#806b5a');
 R(c,x,y,r-x,b-y,colors[0]);
 for(let row=0;row<(b-y)/12;row++){
  for(let xx=-a()*55;xx<r-x;){
   const length=34+(a()*44|0),cur=Math.max(0,xx),wd=Math.min(r-x-xx,length)-(cur-xx);
   if(wd>0){const by=y+row*12,k=pick(colors,(a()*6)|0);
    R(c,x+cur,by,wd-1,11,k);R(c,x+cur,by,wd-1,1,'#caab87');
    if(wd>19){R(c,x+cur+4,by+4,wd*.41,1,'#c19d7f');R(c,x+cur+wd*.66,by+7,wd*.21,1,'#a7846b');}
    if(a()<.14){R(c,x+cur+wd*.57,by+5,5,1,'#9f7e65');R(c,x+cur+wd*.57+1,by+4,3,1,'#b38c71');}
   }xx+=length;
  }
 }
 R(c,x,40,r-x,32,isStore?'#92a08b':'#b4a185');
 R(c,x,39,r-x,4,'#8b7763');R(c,x,40,r-x,1,'#c6ad8d');
 for(let j=0;j<(r-x)/12;j++){
  const xx=x+j*12;R(c,xx+2,43,1,24,isStore?'#a4ad95':'#c6b195');R(c,xx+8,43,1,24,isStore?'#869680':'#a8947b');
 }
 R(c,x,64,r-x,8,'#8d725d');R(c,x,65,r-x,2,'#c29e7b');
 R(c,x,72,r-x,5,'#9d7f65');R(c,x,73,r-x,1,'#be9d7a');
 R(c,x-3,72,4,b-y,'#8d715d');R(c,r-1,72,4,b-y,'#8d715d');
 R(c,x-4,b,346-x,6,'#876d56');R(c,350,b,r-344,6,'#876d56');R(c,x,b+5,346-x,1,'#64594d');R(c,350,b+5,r-345,1,'#64594d');
 R(c,x,b,r-x,2,'#c49772');
 for(const [xx,ww] of (isStore?[[129,67],[566,54]]:[[107,55],[345,83],[539,57]])){
  windowPane(c,xx,44,ww,17,true);
  c.globalAlpha=.10;
  P(c,'#ffe8b9',[[xx+2,73],[xx+ww-3,73],[xx+ww+52,134],[xx+34,134]]);
  c.globalAlpha=1;
 }
 if(isStore){
  wool(c,245,223,237,99,['#77695c','#93a18a','#b6b495','#a1997c']);
  shelf(c,221,78,81,1);shelf(c,320,78,138,1);shelf(c,489,78,85,1);
  counter(c,360,120);
  wool(c,107,110,83,80,['#876b5e','#ae8773','#bc9d85','#aa8675']);
  for(const [xx,yy,k] of [[121,128,'#b48a74'],[152,132,'#7d9980'],[117,161,'#aa9d73'],[157,160,'#bc956c'],[561,124,'#c39d77'],[600,124,'#a3aa85']]){
   R(c,xx,yy+19,28,4,'#947960');R(c,xx,yy,28,20,'#846858');R(c,xx+1,yy+1,26,16,'#ac8867');
   R(c,xx+3,yy+2,22,8,k);R(c,xx+2,yy+11,24,2,'#c7a282');
   for(let j=0;j<4;j++)R(c,xx+5+j*5,yy+4-(j%2),3,2,'#d5b98e');
  }
 }else{
  wool(c,308,178,229,129,['#946f66','#a9857a','#d3ad91','#ac8978']);
  wool(c,134,107,139,91,['#8c7364','#a48971','#bd9b82','#c6a58a']);
  bed(c,144,120);
  shelf(c,439,83,85);shelf(c,544,88,48);
  // Hearth and its brass kettle, backed against the northern wall.
  const fx=281,fy=78;
  for(let z=0;z<6;z++){
   R(c,fx+(z%2)*2,fy+z*7,44-(z%2)*4,7,z%2?'#a38a72':'#9c8471');R(c,fx+3,fy+z*7,38,1,'#b49a81');
   R(c,fx+12+(z%3)*5,fy+z*7+1,1,6,'#8a7668');
  }
  R(c,fx-4,fy+41,52,5,'#ad9078');R(c,fx+9,fy+20,26,19,'#65534d');R(c,fx+11,fy+20,22,18,'#534d49');
  R(c,fx+11,fy+33,22,4,'#725c52');R(c,fx+15,fy+32,13,2,'#a78061');
  R(c,fx+14,fy-9,14,7,'#7a6b60');R(c,fx+17,fy-11,8,3,'#a38c70');R(c,fx+16,fy-8,7,2,'#b29874');R(c,fx+27,fy-7,4,2,'#8e7966');
  const xx=458,yy=235;
  leaf(c,xx-30,yy+3,64,13,'#ad8b73');R(c,xx-21,yy-1,5,19,'#7d6051');R(c,xx+17,yy-1,5,19,'#7d6051');
  rr(c,xx-30,yy-17,60,23,5,'#8f6d56');rr(c,xx-29,yy-18,58,20,5,'#b48d6b');R(c,xx-23,yy-17,46,1,'#d2aa84');
  R(c,xx-10,yy-15,21,11,'#b89c80');R(c,xx-7,yy-14,15,7,'#d4ba98');R(c,xx-3,yy-13,9,1,'#ac987e');jar(c,xx+18,yy-9,'#879783');
 }
 for(const [xx,yy] of [[89,88],[627,99],[96,307],[626,315]]) {
  R(c,xx-6,yy+3,18,6,'#9d8066');R(c,xx-7,yy-6,15,11,'#a77a62');R(c,xx-7,yy-7,15,3,'#cc9977');
  for(let k=0;k<6;k++){R(c,xx-3+k,yy-15-k%3,2,8+k%4,pick(['#738d75','#859d81','#a3aa89'],k));if(k%2===0)R(c,xx-5+k,yy-15-k%3,2,2,'#c4bf92');}
 }
 // Entrance mat occupies (14,14), with a wooden threshold marking the exit.
 wool(c,px(14)-11,px(14)+3,45,20,isStore?['#796b5d','#9f9d82','#c1b291']:['#79665b','#a88477','#d0a68c']);
 R(c,px(14)-12,360,49,5,'#a5866c');R(c,px(14)-12,360,49,1,'#cfa985');R(c,px(14)-3,365,31,3,'#706054');
}
function bale(c,x,y,w=32,h=17){
 R(c,x-2,y+h-1,w+5,6,'#a88761');
 rr(c,x,y,w,h,3,'#987a53');R(c,x+1,y+2,w-2,h-4,'#c7a36c');R(c,x+3,y+1,w-6,4,'#d9b67c');
 R(c,x+3,y+h-5,w-6,3,'#b69463');R(c,x+w-5,y+3,3,h-5,'#b5905d');
 const a=rng(x*17+y);
 for(let j=0;j<w*h/27;j++){let xx=x+3+a()*(w-7),yy=y+3+a()*(h-6);R(c,xx,yy,2+(j%2),1,j%3===0?'#dfbe82':'#b99560');}
 for(const k of [.27,.72]){R(c,x+w*k,y+1,1,h-2,'#96785c');R(c,x+w*k+1,y+2,1,4,'#eed09b');}
}
function bucket(c,x,y,water=true){
 leaf(c,x-8,y+1,19,4,'#a28866');
 rr(c,x-7,y-8,16,11,2,'#8d7966');R(c,x-5,y-5,12,8,'#a58360');R(c,x-4,y-4,2,7,'#c39d72');
 R(c,x-6,y-7,14,1,'#d5ac7d');R(c,x-5,y-6,11,2,water?'#729a91':'#b8a06d');
 R(c,x-5,y-2,12,1,'#87715c');R(c,x+1,y-6,4,1,water?'#adc2a5':'#d1b77c');
 R(c,x-6,y-11,1,4,'#81745e');R(c,x+6,y-11,1,4,'#81745e');R(c,x-5,y-12,11,1,'#95866c');
}
function strawBed(c,x,y,w,h){
 rr(c,x-4,y+3,w+8,h,5,'#a68c68');rr(c,x,y,w,h,6,'#bfa376');
 rr(c,x+2,y+2,w-4,h-4,5,'#ccb281');rr(c,x+6,y+6,w-12,h-12,5,'#d6bc88');
 const a=rng(y*37+x);
 for(let j=0;j<w*h/68;j++){
  const xx=x+6+a()*(w-12),yy=y+4+a()*(h-8);R(c,xx,yy,2+j%5,1,j%4===0?'#ebce94':j%4===3?'#bfa577':'#dec390');
  if(j%6===0)R(c,xx+2,yy-1,3,1,'#c4a77a');
 }
}
function wallRail(c,x,y,w){
 R(c,x-4,y+3,w+8,5,'#8f735e');R(c,x-2,y,w+4,4,'#997558');R(c,x-1,y,w+2,1,'#d3aa80');
 for(let i=0;i<=w;i+=20){R(c,x+i,y+4,3,20,'#8e6e56');R(c,x+i,y+5,1,16,'#bd9872');}
 R(c,x-2,y+18,w+4,3,'#a88361');R(c,x-2,y+18,w+4,1,'#c19974');
}
function barnBackdrop(c,w,h){
 R(c,0,0,w,h,'#465350');rr(c,54,28,612,355,10,'#505c53');rr(c,61,33,598,343,7,'#656359');
 const x=72,y=72,end=648,bottom=360,a=rng(18991);
 R(c,x-5,y-24,586,318,'#6f594b');R(c,x-3,y-21,582,310,'#7d6656');R(c,x,y,end-x,bottom-y,'#b99875');
 for(let row=0;row<24;row++){
  const yy=y+row*12;
  for(let i=-Math.floor(a()*45);i<576;){
   const len=24+Math.floor(a()*58),u=Math.max(0,i),d=Math.min(i+len,576)-u;
   if(d>0){
    const tone=pick(['#b59672','#bc9a77','#c0a07b','#b49171','#b99977','#bd9a76'],Math.floor(a()*6));
    R(c,x+u,yy,d-1,11,tone);R(c,x+u,yy,d-1,1,'#d0ad86');
    if(d>14){R(c,x+u+5,yy+4,d*.38,1,'#c5a17b');R(c,x+u+d*.70,yy+8,d*.23,1,'#a58267');}
    if(d>27&&a()>.8){R(c,x+u+12,yy+7,6,1,'#aa876b');R(c,x+u+13,yy+6,3,1,'#b18a69');}
   }
   i+=len;
  }
 }
 // Sun-faded vertical wall boards and a low stone kick plate.
 R(c,x,37,576,48,'#9c795d');
 for(let i=0;i<48;i++){
  const xx=x+i*12;R(c,xx+1,38,11,38,pick(['#a48262','#aa8866','#a48362','#ab8966','#9f7f61'],i));
  R(c,xx+1,39,1,34,'#ba9875');R(c,xx+8,42,1,32,'#9b7b5c');
 }
 R(c,x-3,36,582,5,'#816653');R(c,x,36,576,1,'#c2a17b');
 R(c,x,75,576,11,'#a3917a');R(c,x,76,576,1,'#b6a286');R(c,x,81,576,1,'#887967');
 for(let i=0;i<44;i++){const xx=x+i*13;R(c,xx,77,1,4,'#8c7a67');R(c,xx+5,82,1,3,'#8c7a67');}
 for(const bx of [74,176,286,430,542,641]){
  R(c,bx-8,38,12,47,'#745c4d');R(c,bx-6,39,7,46,'#907257');R(c,bx-6,39,2,45,'#a88966');
  R(c,bx-8,60,12,4,'#7d6b5b');R(c,bx-5,61,2,2,'#ba9d78');
 }
 R(c,x-3,86,5,273,'#8b7159');R(c,x,87,2,272,'#c7a780');
 R(c,end-2,86,5,274,'#8d725b');R(c,end-3,87,2,272,'#c3a380');
 // Loft, lintels, and warm light slanting through the upper windows.
 const windows=[[102,55],[205,60],[323,74],[464,57],[571,54]];
 for(const [xx,ww] of windows)windowPane(c,xx,48,ww,22,true);
 c.globalAlpha=.13;
 for(const [xx,ww] of windows)P(c,'#fff0b4',[[xx+2,78],[xx+ww-3,78],[xx+ww+46,147],[xx+34,147]]);
 c.globalAlpha=1;
 // Straw sleeping spots and low colored walk-through stall edging.
 for(const [xx,yy,ww,hh] of [[117,111,145,113],[456,111,145,113]]){
  strawBed(c,xx,yy,ww,hh);wallRail(c,xx-2,yy-1,ww+6);
  R(c,xx,yy+hh,ww,2,'#9b8061');R(c,xx+1,yy+hh,ww-2,1,'#ddbb88');
 }
 for(const [xx,yy] of [[83,111],[90,283],[596,282],[609,114]]){
  bale(c,xx,yy,28,15);bale(c,xx+7,yy-12,24,14);
 }
 for(const [xx,yy] of [[131,194],[245,194],[475,195],[581,184],[610,316]])bucket(c,xx,yy,xx!==610);
 // Tiny channel and pebble pool where the ducks can paddle.
 const sx=111,sy=254;
 rr(c,sx-5,sy-5,119,66,8,'#a29172');rr(c,sx-4,sy-4,117,63,7,'#8c806c');rr(c,sx,sy,110,54,7,'#668d83');
 rr(c,sx+3,sy+3,104,48,6,'#82a69a');rr(c,sx+12,sy+11,77,30,5,'#79a09a');
 for(let j=0;j<29;j++){
  const xx=sx+7+a()*96,yy=sy+6+a()*41;R(c,xx,yy,3+j%7,1,j%3===0?'#9bb6a2':'#789e95');
 }
 for(const [xx,yy] of [[sx+1,sy+2],[sx+6,sy+49],[sx+97,sy+2],[sx+108,sy+42]])
  rock(c,xx,yy,.68,['#83786a','#a3a089','#b7b396']);
 // Far grooming paddock and folded rugs, keeping middle aisle open.
 wool(c,474,245,104,70,['#8a725d','#ad9b77','#bead86','#b6a680']);
 for(const [xx,yy] of [[473,262],[549,260]]){R(c,xx-1,yy,31,15,'#a78767');R(c,xx,yy-1,29,13,'#b68f65');R(c,xx+1,yy-1,27,2,'#d4ad7e');}
 for(const [xx,yy] of [[605,181],[89,317],[94,154],[610,229]]){R(c,xx,yy,2,14,'#785f51');R(c,xx+1,yy,1,10,'#c4a27a');R(c,xx-3,yy+12,8,2,'#816b56');}
 const ey=347,cx=348;
 for(const x of [cx-27,cx+23]){R(c,x,ey-10,5,13,'#806855');R(c,x+1,ey-10,2,11,'#bd9876');}
 R(c,72,360,251,6,'#957657');R(c,374,360,274,6,'#957657');R(c,73,360,248,1,'#b58e68');R(c,375,360,272,1,'#b58e68');
 wool(c,cx-25,339,50,19,['#7f6556','#a78a6b','#c9a77c','#ac896b']);
 R(c,cx-27,360,54,4,'#b48e68');R(c,cx-26,360,52,1,'#d4ad83');R(c,cx-22,364,44,3,'#8f765e');
}
function barnTrough(c,point,state,t){
 const x=px(point.x)+12,y=px(point.y)+15,feed=state.ranch?.hay||0;
 R(c,x-13,y+3,27,4,'#a38565');
 rr(c,x-13,y-10,26,15,2,'#765d4d');rr(c,x-12,y-10,24,12,2,'#9e7959');
 R(c,x-11,y-9,22,2,'#d3aa7b');R(c,x-10,y-5,20,5,'#806b51');
 if(feed){
  R(c,x-8,y-5,16,3,'#ba9b64');R(c,x-6,y-6,12,3,'#ccaf77');
  for(let j=0;j<6;j++)R(c,x-7+j*2,y-3-(j%3),3,1,j%2?'#deb87b':'#ecd19a');
 }
 R(c,x-10,y-1,20,3,'#b18b65');R(c,x-9,y-1,18,1,'#d9b183');
 R(c,x-10,y+2,3,3,'#7f6952');R(c,x+8,y+2,3,3,'#7f6952');
 const ready=state.ranch?.animals?.some(a=>a.ready);
 marker(c,point,t,ready?'ready':'feed');
}
function barnPool(c,t){
 for(let j=0;j<11;j++){
  const xx=117+(j*27)%94+Math.round(Math.sin(t/800+j)*4),yy=261+(j*23)%38;
  c.globalAlpha=.20+.21*(.54+.46*Math.sin(t/860+j*1.57));R(c,xx,yy,4+j%6,1,'#c1d6bd');
 }
 c.globalAlpha=1;
}
function duck(c,x,y,t,dir,bo,active,paddling){
 const k=Math.round(Math.sin(t/220+bo)),wink=(Math.floor(t+bo*217)%4090)<100;
 c.save();c.translate(x,y);c.scale(dir,1);
 leaf(c,-11,6,23,5,paddling?'#72968e':'#a8906d');
 if(paddling){R(c,-12,8,12,1,'#aac7af');R(c,1,10,9,1,'#9fbdad');}
 else{R(c,-6,6+(active?k:0),4,2,'#be8c5c');R(c,1,6-(active?k:0),4,2,'#d19362');}
 if(active)R(c,-8,-3,4,2,'#d5c7a6');
 leaf(c,-10,-4-k,20,11,'#9e9d87');leaf(c,-9,-5-k,18,11,'#e0d4ad');leaf(c,-8,-5-k,14,8,'#f3e5ba');
 leaf(c,-5,-2-k,10,6,'#c9b897');R(c,-3,-2-k,6,1,'#e7d8ad');R(c,0,2-k,4,1,'#e7d6ad');
 leaf(c,1,-13-k,10,11,'#cabc9c');leaf(c,2,-13-k,9,9,'#f2e5be');R(c,4,-12-k,4,1,'#f6edce');
 R(c,10,-8-k,5,2,'#d89a5f');R(c,11,-8-k,4,1,'#ecc081');R(c,8,-10-k,1,wink?1:2,'#6f6254');
 R(c,8,-6-k,2,1,'#efc4a0');
 c.restore();
}
function sheep(c,x,y,t,dir,bo,active,isPet){
 const q=Math.round(Math.sin(t/305+bo)),wink=(Math.floor(t+bo*357)%4400)<95;
 c.save();c.translate(x,y);c.scale(dir,1);
 leaf(c,-16,7,34,6,'#a58b68');
 for(const [dx,dy] of [[-9,active?q:0],[-5,0],[5,0],[9,active?-q:0]]){
  R(c,dx,2+dy,3,8,'#877262');R(c,dx,8+dy,4,2,'#5f5d57');R(c,dx,4+dy,1,3,'#a28c75');
 }
 for(const [dx,dy,w,h] of [[-13,-9,28,15],[-13,-8,9,11],[-6,-13,11,12],[0,-11,11,10],[6,-9,9,10]]){
  leaf(c,dx,dy-q,w,h,'#b6ac98');leaf(c,dx+1,dy-1-q,w-2,h-2,'#e3d9ba');
 }
 for(const [dx,dy,w] of [[-11,-8,6],[-6,-10,7],[0,-8,6],[5,-9,5],[-7,-4,6],[1,-5,5],[-12,-3,6]])
  R(c,dx,dy-q,w,2,'#f0e5c7');
 leaf(c,7,-7-q,13,11,'#9d8a77');leaf(c,8,-7-q,11,10,'#c7ab8f');R(c,10,-6-q,6,2,'#dfbda0');
 leaf(c,6,-10-q,11,6,'#e2d5b2');R(c,9,-9-q,5,2,'#f4e6c6');R(c,9,-5-q,2,2,'#a79175');
 R(c,17,-5-q,5,3,'#a98c73');R(c,18,-5-q,3,1,'#dcb596');
 R(c,15,-3-q,1,wink?1:2,'#5d574e');R(c,17,0-q,2,1,'#927561');
 if(isPet)R(c,16,-1-q,2,1,'#e3ad98');
 c.restore();
}
const duckSpots=[[158,272],[195,292],[141,220],[223,152],[181,157],[238,187]];
const sheepSpots=[[485,164],[536,156],[571,183],[488,271],[531,293],[563,239]];
function ranchAnimals(all,state,t){
 const animals=state.ranch?.animals;if(!Array.isArray(animals))return;
 const used={duck:0,sheep:0};
 for(let i=0;i<Math.min(animals.length,16);i++){
  const animal=animals[i],kind=animal?.species;if(kind!=='duck'&&kind!=='sheep')continue;
  const id=String(animal.id??i),seed=[...id].reduce((acc,k)=>(acc*31+k.charCodeAt(0))%65519,109),n=used[kind]++;
  const spots=kind==='duck'?duckSpots:sheepSpots,[xx,yy]=spots[n%spots.length];
  const phase=t/(kind==='duck'?1950:2300)+seed*.003,walking=t>0&&Math.cos(phase)>.20;
  const x=xx+Math.round(Math.sin(phase)*(kind==='duck'?9:12))+(n>=6?15:0),y=yy+Math.round(Math.sin(phase*.65)*5),dir=Math.cos(phase)>=0?1:-1;
  all.push({x,y:y+7,paint:c=>{
   const pet=animal.petDay===state.day,fed=animal.fedDay===state.day;
   if(kind==='duck')duck(c,x,y,t,dir,seed%13,walking,n<2);
   else sheep(c,x,y,t,dir,seed%13,walking,pet);
   if(animal.ready){
    const b=Math.round(Math.sin(t/359+i)*2), k=kind==='duck'?'#fff1b9':'#d2daca';
    diamond(c,x,y-17+b,4,'#716e58');diamond(c,x,y-17+b,3,k);R(c,x,y-18+b,1,2,'#ffefd7');
   }else if(pet&&(t===0||((t+seed*64)%3200)<1050)){
    const b=Math.round(Math.sin(t/404+i)*2);R(c,x-3,y-18+b,2,2,'#d8948c');R(c,x+1,y-18+b,2,2,'#d8948c');
    R(c,x-3,y-17+b,6,2,'#d8948c');R(c,x-2,y-15+b,4,1,'#d8948c');R(c,x-1,y-14+b,2,1,'#d8948c');
   }else if(fed&&i%2===0&&(t===0||((t+seed*57)%3900)<580)){R(c,x-1,y-16,2,2,'#f9dd9a');}
  }});
 }
}
const playerColors=['#5e8e86','#82ada0','#3e554d','#735645','#a47b58','#4c6257','#dab38c','#f2c8a0','#d8b070','#947454'];
const actors={
 farmer:['#ba8b57','#d0a96f','#5e644b','#6b5741','#927653','#68734f','#d3a77e','#ebc893','#bca66c','#80734f'],
 shopkeeper:['#95758b','#ad8b99','#5f5361','#674f49','#977263','#685e65','#c99c81','#e5bda0','#b27977','#7b5359'],
 ferryman:['#527a92','#89a0ac','#3a5a6b','#615343','#927653','#4e6064','#d6ad84','#f0c59d','#8d9da5','#516b7b']
};
function sprite(c,x,y,p,t,dir='down',phase=null,inside=false){
 x=Math.round(x);y=Math.round(y);
 const [body,trim,edge,hair,hair2,pants,skin,light,hat,band]=p;
 const {side,behind,upper,legs}=window.MistArt?.walkPose?.(dir,phase)||{
  side:/^(left|west|a)$/.test(dir)?-1:/^(right|east|d)$/.test(dir)?1:0,
  behind:/^(up|north|w)$/.test(dir),upper:0,legs:[{x:-5,y:0,armX:0,armY:0},{x:1,y:0,armX:0,armY:0}]
 };
 const a=(xx,yy,w,h,k)=>R(c,x+xx,y+yy-upper,w,h,k);
 const shadow=inside?'#866c5d':'#657f63';R(c,x-9,y+8,18,3,shadow);R(c,x-6,y+11,12,1,shadow);
 for(const [i,{x:lx,y:ly}] of legs.entries()){
  const hip=i===0?-5:1;
  R(c,x+hip,y+4-upper,4,4,pants);R(c,x+lx,y+6+ly,4,4,pants);R(c,x+lx,y+8+ly,5,2,edge);
 }
 const blink=(Math.floor(t+x*27)%3900)<100;
 a(-7,-3,14,9,edge);a(-5,-3,10,7,body);a(-4,-2,6,2,trim);a(-4,3,8,1,trim);
 for(const [i,{armX,armY}] of legs.entries()){
  const ax=(i===0?-7:4)+armX;
  a(ax,-2+armY,3,5,body);a(ax+(i===1?1:0),2+armY,2,2,skin);
 }
 a(-6,-11,12,9,hair);a(-5,-12,10,6,hair2);
 if(!behind){
  a(-4-(side===-1?1:0),-9,9,6,skin);a(-3-(side===-1?1:0),-8,5,3,light);
  if(side){a(2*side,-7,1,blink?1:2,edge);a(4*side,-5,2,2,light);}
  else{a(-3,-7,1,blink?1:2,edge);a(2,-7,1,blink?1:2,edge);a(-2,-4,3,1,skin);}
 }else{a(-5,-10,9,7,hair);a(-4,-8,3,4,hair2);}
 a(-7,-12,14,2,band);a(-4,-15,8,3,hat);a(-3,-15,6,1,'#e5c283');a(-7,-12,14,1,hat);
 if(!behind&&!side){a(-3,-1,1,4,trim);a(2,-1,1,4,trim);}
}
function diamond(c,x,y,s,k){P(c,k,[[x-s,y],[x,y-s],[x+s,y],[x,y+s]]);}
function marker(c,p,t,kind){
 const x=px(p.x)+12,y=px(p.y)-7+Math.round(Math.sin(t/300));
 const k=kind==='ready'?'#d9e5ae':(kind==='sleep'||kind==='store')?'#e8d4ac':'#f1d89b';
 rr(c,x-7,y-7,14,12,2,'#74685a');rr(c,x-6,y-6,12,10,2,k);
 R(c,x-4,y-6,8,1,'#f9e8b4');R(c,x-2,y+4,4,2,'#9e845f');
 if(kind==='left'||kind==='right'){
  const s=kind==='left'?-1:1;
  for(let j=0;j<4;j++){R(c,x+s*(j-1),y-5+j,2,1,'#716956');R(c,x+s*(2-j),y-2+j,2,1,'#716956');}
 }else if(kind==='door'){
  R(c,x-3,y-5,6,2,'#7b705d');R(c,x-2,y-3,4,1,'#7b705d');R(c,x-1,y-2,2,2,'#7b705d');
 }else if(kind==='sleep'){
  R(c,x-3,y-4,6,1,'#7b705d');R(c,x+1,y-3,2,1,'#7b705d');R(c,x-1,y-2,2,1,'#7b705d');R(c,x-3,y-1,6,1,'#7b705d');
 }else if(kind==='store'){
  R(c,x-3,y-3,6,3,'#7b705d');R(c,x-2,y-4,4,1,'#7b705d');R(c,x-1,y-5,2,1,'#7b705d');R(c,x-1,y-2,2,1,k);
 }else if(kind==='feed'){
  R(c,x-3,y-4,6,3,'#806f5b');R(c,x-4,y-6,8,2,'#806f5b');R(c,x-2,y-5,4,1,'#b89b6a');
 }else if(kind==='ready'){
  R(c,x-3,y-2,2,2,'#6a7d61');R(c,x-2,y-1,2,2,'#6a7d61');R(c,x,y-3,2,3,'#6a7d61');R(c,x+2,y-4,2,2,'#6a7d61');
 }else {R(c,x-1,y-5,2,4,'#7b705d');R(c,x-1,y,2,1,'#7b705d');}
}
function forage(c,p,state,t){
 const {x,y}=p, xx=px(x)+12,yy=px(y)+14,k=p.item||p.id;
 const gathered=state.outworld?.gathered?.[p.id]===state.day;
 leaf(c,xx-11,yy-3,23,8,'#859a83');
 if(k==='wood'||k==='deadwood'||k==='groveDeadwood'){
  const rows=gathered?[[-5,2,11]]:[[-10,0,12],[1,1,11],[-6,-5,13]];
  for(const [dx,dy,w] of rows){R(c,xx+dx,yy+dy,w,5,'#746b59');R(c,xx+dx+1,yy+dy,w-2,2,'#a4896b');R(c,xx+dx+w-3,yy+dy,3,4,'#c0a584');}
 }else if(k==='groveMushroom'){
  for(const [dx,dy,z] of (gathered?[[0,2,4]]:[[-6,1,7],[0,-1,9],[7,0,5]])){
   R(c,xx+dx,yy+dy-2,3,5,'#d0c4a5');leaf(c,xx+dx-z/2,yy+dy-6,z,4,'#aa8080');R(c,xx+dx,yy+dy-5,1,1,'#e0b7a0');
  }
 }else{
  for(const [dx,dy] of (gathered?[[-5,2],[1,3]]:[[-7,-1],[-2,2],[4,-4],[8,0]])){
   if(k==='honeyFlower')sprig(c,xx+dx,yy+dy,gathered?'#beb388':'#e9cc8d','#749473',gathered?1:2);
   else{sprig(c,xx+dx,yy+dy,gathered?'#a4b298':'#bfafc4','#648d77',gathered?1:2);R(c,xx+dx-3,yy+dy-1,3,1,'#7d9e80');}
  }
 }
 if(!gathered)marker(c,p,t,'bang');
}
function workbench(c,p,state,t){
 const x=px(p.x)+12,y=px(p.y)+16,s=state.outworld?.workshop;
 leaf(c,x-12,y-2,26,7,'#a39477');
 R(c,x-10,y-9,3,12,'#76604e');R(c,x+8,y-9,3,12,'#76604e');R(c,x-12,y-12,25,8,'#896b51');
 R(c,x-11,y-12,23,3,'#c5a075');R(c,x-7,y-5,14,2,'#ad805d');
 R(c,x-6,y-15,13,3,'#778077');R(c,x-4,y-13,9,2,'#677368');R(c,x-2,y-11,5,1,'#56675e');
 if(s?.recipe){R(c,x+6,y-14,4,3,'#d1ac72');if(state.day>=s.readyDay)diamond(c,x+9,y-18,2,'#f8db98');}
 marker(c,p,t,s?.recipe&&state.day>=s.readyDay?'ready':'bang');
}
function focus(c,p,t,season){
 const x=px(p.x)+1,y=px(p.y)+1;
 c.globalAlpha=.72+.17*Math.sin(t/190);
 if(season==='winter'){
  for(const [u,v] of [[0,0],[16,0],[0,17],[16,17]])R(c,x+u,y+v+1,6,3,'#536d71');
  for(const [u,v] of [[0,0],[18,0],[0,15],[18,15]])R(c,x+u+1,y+v,3,6,'#536d71');
 }
 for(const [u,v] of [[0,0],[16,0],[0,19],[16,19]])R(c,x+u,y+v,6,2,'#fff5c8');
 for(const [u,v] of [[0,0],[20,0],[0,15],[20,15]])R(c,x+u,y+v,2,6,'#fff5c8');
 c.globalAlpha=1;
}
function ripples(c,t){
 const a=rng(77),ox=px(29),oy=px(10);
 for(let i=0;i<43;i++){
  const x=ox+12+a()*206,y=oy+6+a()*153,d=Math.sin(t*.00091+i)*5,len=4+i%8;
  c.globalAlpha=.15+.15*(1+Math.sin(t*.0012+i*.6));
  R(c,x+d,y,len,1,'#bfd3be');if(i%3===0)R(c,x+2+d,y+2,Math.max(2,len-4),1,'#a0c4b9');
 }
 c.globalAlpha=1;
 if(t>0){
  for(const [i,yy] of [[0,oy+48],[1,oy+126]]){
   const x=ox+31+(t*.011+i*113)%181,y=yy+Math.sin(t*.002+i)*9;
   c.globalAlpha=.43;R(c,x,y,5,1,'#5d8c90');R(c,x+3,y-1,3,1,'#63949a');R(c,x,y-1,2,1,'#adc4b5');
  }c.globalAlpha=1;
 }
}
function sky(c,region,t,state,season){
 const indoor=region==='house'||region==='store'||region==='barn',minute=state.minute||420;
 if(indoor){
  if(season==='winter'||season==='autumn'){
   c.globalAlpha=season==='winter'?.10:.06;R(c,72,40,576,320,'#e5ad79');c.globalAlpha=1;
  }
  return;
 }
 if(minute<450||minute>1020){
  c.globalAlpha=minute<450?.09:Math.min(.26,.067+(minute-1020)/850);
  R(c,0,0,W,H,minute<450?'#fbd18b':minute>1070?'#34486d':'#b47461');
 }
 const weather=state.weather||(state.rain?'rain':'clear');
 if(weather==='rain'){
  c.globalAlpha=.12;R(c,0,0,W,H,'#2c5a70');
  const a=rng(840);c.globalAlpha=.26;
  for(let i=0;i<54;i++){
   const x=(a()*W+t*.046)%W,y=(a()*H+t*.168)%H;
   R(c,x,y,1,5,'#d0e3d4');R(c,x-1,y+4,1,3,'#c3dbd0');
   if(i%4===0)R(c,x-3,y+9,6,1,'#d1ded1');
  }
 }else if(weather==='snow'||weather==='fog'||season==='autumn'){
  window.MistSeasonArt?.flurries(c,t,weather,season);
 }else if(region==='grove'||season==='summer'){
  const a=rng(592);
  for(let i=0;i<24;i++){
   const x=a()*W+Math.cos(t*.00064+i*1.54)*17,y=a()*H+Math.sin(t*.00041+i)*11;
   c.globalAlpha=.08+.29*(.5+.5*Math.sin(t*.0012+i));
   R(c,x,y,2,i%5===0?2:1,minute>1000?'#e8d98f':'#edf3c6');
  }
 }
 c.globalAlpha=1;
}
function actionFX(c,state,t,fx){
 const ev=fx?.event;if(!ev||!Number.isFinite(ev.x+ev.y+ev.at)||(ev.region&&ev.region!==state.region))return;
 const f=(t-ev.at)/(ev.kind==='fish'?910:590);if(f<0||f>1)return;
 const x=px(ev.x)+12,y=px(ev.y)+11;
 c.globalAlpha=1-f*.94;
 if(ev.kind==='fish'||ev.kind==='water'){
  const s=4+15*f, k='#c8e2cc';
  R(c,x-s,y-2,s*2,1,k);R(c,x-s-2,y,s*.32,1,k);R(c,x+s-2,y,s*.32,1,k);R(c,x-s+2,y+3,s*2-4,1,k);
 }
 for(let i=0;i<8;i++){
  const f2=f*13,ang=i*6.283/8;
  const xx=x+Math.sin(ang)*(4+f2+i%3),yy=y+Math.cos(ang)*(4+f2)*.55-19*f*(1-f);
  if(i%3===0)diamond(c,xx,yy,2,i%2?'#f8dda0':'#ecf0b7');
  else R(c,xx,yy,2,1,i%2?'#d6c599':'#e8d5a9');
 }
 c.globalAlpha=1;
}
function build(region,season){
 const {w,h}=dict[region],el=document.createElement('canvas'),front=[];
 el.width=px(w);el.height=px(h);
 const c=el.getContext('2d');c.imageSmoothingEnabled=false;
 if(region==='town')town(c,el.width,el.height,front,season);
 else if(region==='grove')grove(c,el.width,el.height,front,season);
 else if(region==='barn')barnBackdrop(c,el.width,el.height);
 else interior(c,el.width,el.height,region==='store');
 // Rasterize each tree once; render at depth without hammering the main canvas per frame.
 for(const f of front){
  const src=document.createElement('canvas'),sw=Math.ceil(f.w/2)+8,sh=Math.ceil(f.w*.86)+14;
  src.width=2*sw;src.height=sh+10;const cc=src.getContext('2d');
  cc.imageSmoothingEnabled=false;cc.translate(-f.x+sw,-f.y+sh);
  f.paint(cc);f.paint=c=>c.drawImage(src,f.x-sw,f.y-sh);
 }
 const result={el,front,season};cache.set(region,result);return result;
}
const noMotion=typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
function draw(c,state,t=0,target=null,fx={},cam={}){
 const region=state.region;if(!dict[region])return false;
 const inside=region==='house'||region==='store'||region==='barn', engine=window.MistEngine, definition=dict[region];
 const season=window.MistSeasonArt?.seasonOf(state,engine)||engine?.calendar?.(state)?.season||state.season||'spring';
 const artSeason=inside||!Object.hasOwn(theme,season)?'spring':season;
 const entry=cache.get(region),world=entry?.season===artSeason?entry:build(region,artSeason);
 const ox=Math.max(0,Math.min(world.el.width-W,Math.round((cam?.x||0)*T)));
 const oy=Math.max(0,Math.min(world.el.height-H,Math.round((cam?.y||0)*T)));
 const reduce=fx?.reducedMotion||noMotion?.matches;
 const at=reduce?0:t;
 const visible=(x,y)=>x>=ox-72&&x<=ox+W+72&&y>=oy-62&&y<=oy+H+105;
 c.save();c.imageSmoothingEnabled=false;c.globalAlpha=1;
 c.drawImage(world.el,ox,oy,W,H,0,0,W,H);
 c.translate(-ox,-oy);
 if(region==='grove'){
  ripples(c,at);
  for(const p of (engine?.GROVE_GATHER||definition.gather))if(visible(px(p.x),px(p.y)))forage(c,p,state,at);
 }else if(region==='town'){
  workbench(c,engine?.WORKSHOP||{x:23,y:10},state,at);
  marker(c,engine?.OUTWORLD?.stall||{x:12,y:9},at,'store');
 }else if(region==='house'){
  const k=Math.floor(at/120)%4;R(c,296,111,12,3,'#bd7b5c');
  R(c,298,106-k%2,5,7+k%2,'#ecad71');R(c,303,108,3,5,'#e69a69');R(c,299,109,3,4,'#f5d291');
  if(k===2)R(c,301,103,1,2,'#edb983');
  marker(c,engine?.OUTWORLD?.bed||{x:8,y:7},at,'sleep');
 }else if(region==='barn'){
  barnPool(c,at);barnTrough(c,engine?.RANCH?.trough||{x:13,y:8},state,at);
 }else marker(c,engine?.OUTWORLD?.counter||{x:16,y:7},at,'store');
 const portals=engine?.PORTALS?.filter(p=>p.region===region);
 const targets=portals?.length?portals:definition.portal;
 for(const p of targets)if(visible(px(p.x),px(p.y)))marker(c,p,at,p.x===0?'left':'door');
 const all=world.front.filter(f=>visible(f.x,f.y));
 if(region==='barn')ranchAnimals(all,state,at);
 for(const p of engine?.npcs?.(state)||[])if(p.region===region&&visible(px(p.x),px(p.y))){
  const x=px(p.x)+12,y=px(p.y)+11;
  all.push({x,y:y+9,paint:c=>sprite(c,x,y,actors[p.id]||actors.shopkeeper,at,p.dir,null,inside)});
 }
 const player=(!reduce&&fx?.player)||state.player;
 if(player){
  const x=px(player.x)+12,y=px(player.y)+11;
  all.push({x,y:y+10,paint:c=>sprite(c,x,y,playerColors,at,player.dir,reduce?null:player.phase,inside)});
 }
 all.sort((a,b)=>a.y-b.y);
 for(const obj of all)obj.paint(c);
 if(target&&Number.isFinite(target.x+target.y)&&visible(px(target.x),px(target.y)))focus(c,target,at,season);
 if(!fx?.reducedMotion&&!noMotion?.matches)actionFX(c,state,t,fx);
 c.translate(ox,oy);sky(c,region,at,state,season);
 c.restore();
 return true;
}
window.MistWorldArt={draw};
})();
