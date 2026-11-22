(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.MistJoystick=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';

  const START_RADIUS=9,STOP_RADIUS=6,AXIS_MARGIN=1.22;
  const horizontal=direction=>direction==='left'||direction==='right';
  function getDirection(x,y,current){
    const length=Math.hypot(x,y),ax=Math.abs(x),ay=Math.abs(y);
    if(length<=(current?STOP_RADIUS:START_RADIUS))return null;
    const h=x>=0?'right':'left',v=y>=0?'down':'up';
    if(current&&horizontal(current)&&h===current&&ax>0&&ay<=ax*AXIS_MARGIN)return current;
    if(current&&!horizontal(current)&&v===current&&ay>0&&ax<=ay*AXIS_MARGIN)return current;
    return ax>=ay?h:v;
  }

  function create(element,onDirection,{isEnabled=()=>true}={}){
    if(!element||typeof element.addEventListener!=='function')throw new TypeError('Expected a joystick element.');
    if(typeof onDirection!=='function')throw new TypeError('Expected a joystick direction callback.');
    let active=null,captured=false,direction=null;

    function draw(x=0,y=0){
      element.style.setProperty('--stick-x',x+'px');
      element.style.setProperty('--stick-y',y+'px');
    }
    function emit(next){
      if(next===direction)return;
      direction=next;
      onDirection(next);
    }
    function finish(release){
      const pointer=active,hadCapture=captured;
      // Clear active state first: releasing may synchronously report lost capture.
      active=null;captured=false;draw();
      if(release&&pointer!==null&&hadCapture){
        try {element.releasePointerCapture?.(pointer);} catch(_){}
      }
      emit(null);
    }
    function moveTo(event){
      const box=element.getBoundingClientRect();
      if(!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY)||!(box.width>0)||!(box.height>0)){
        draw();emit(null);return;
      }
      const x=event.clientX-box.left-box.width/2,y=event.clientY-box.top-box.height/2;
      const radius=Math.max(0,Math.min(27,Math.min(box.width,box.height)*.31));
      const distance=Math.hypot(x,y),scale=distance>radius?radius/distance:1;
      draw(x*scale,y*scale);
      emit(getDirection(x,y,direction));
    }
    function down(event){
      if(active!==null||event.pointerId==null||!isEnabled())return;
      if(event.pointerType!=='touch'&&event.button!==0)return;
      event.preventDefault?.();
      active=event.pointerId;
      try {
        if(typeof element.setPointerCapture==='function'){
          element.setPointerCapture(active);
          captured=true;
        }
      } catch(_){}
      moveTo(event);
    }
    function move(event){
      if(active===null||event.pointerId!==active)return;
      if(!isEnabled()){finish(true);return;}
      event.preventDefault?.();
      moveTo(event);
    }
    function release(event){
      if(active!==null&&event.pointerId===active){
        event.preventDefault?.();
        finish(true);
      }
    }
    function lost(event){
      if(active!==null&&event.pointerId===active)finish(false);
    }
    function leave(event){
      if(active!==null&&event.pointerId===active&&!captured)finish(false);
    }
    element.addEventListener('pointerdown',down);
    element.addEventListener('pointermove',move);
    element.addEventListener('pointerup',release);
    element.addEventListener('pointercancel',release);
    element.addEventListener('lostpointercapture',lost);
    element.addEventListener('pointerleave',leave);
    draw();
    return {reset:()=>finish(true)};
  }

  return Object.freeze({create});
});
