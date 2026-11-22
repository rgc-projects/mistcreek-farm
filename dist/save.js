(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MistSave=api;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const current='mistcreek-farm-v5', previous=current+'-backup', corrupted=current+'-damaged', legacy='mistcreek-farm-v1';
 function decode(data,restore){
  if(typeof data!=='string'||!data||data.length>600000)return null;
  try{const row=JSON.parse(data);if(row?.format&&row.format!=='mistcreek-farm')return null;return restore(row?.state??row);}catch{return null;}
 }
 function encode(state){return JSON.stringify({format:'mistcreek-farm',state});}
 function load(store,restore){
  try{
   let bad=false;
   for(const [key,source] of [[current,'current'],[previous,'backup'],['mistcreek-farm-v4','legacy'],['mistcreek-farm-v4-backup','legacy'],['mistcreek-farm-v3','legacy'],['mistcreek-farm-v3-backup','legacy'],['mistcreek-farm-v2','legacy'],['mistcreek-farm-v2-backup','legacy'],[legacy,'legacy']]){
    const raw=store.getItem(key);
    if(!raw)continue;
    const state=decode(raw,restore);
    if(state)return {state,source,bad};
    bad=true;
   }
   return {state:null,source:null,bad};
  }catch{return {state:null,source:null,bad:false,unavailable:true};}
 }
 function write(store,state,restore,{checkpoint=false,previousState=null}={}){
  try{
   const next=encode(state), old=store.getItem(current);
   if(old===next && !previousState)return true;
   if(old&&!decode(old,restore)&&!store.getItem(corrupted))store.setItem(corrupted,old);
   if(previousState)store.setItem(previous,encode(previousState));
   else if(checkpoint&&old&&decode(old,restore))store.setItem(previous,old);
   store.setItem(current,next);
   return true;
  }catch{return false;}
 }
 function damaged(store){try{return store.getItem(corrupted);}catch{return null;}}
 function backup(store,restore){try{return decode(store.getItem(previous),restore);}catch{return null;}}
 return Object.freeze({decode,encode,load,write,backup,damaged});
});
