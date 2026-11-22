/* Mist Creek: original procedural score and regional ambience synthesized in-browser.
   No recordings, third-party tunes or off-page assets are required. */
(() => {
  'use strict';
  const SR=22050, TWO=Math.PI*2, ROOT=440;
  const midi=n=>ROOT*Math.pow(2,(n-69)/12);
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const sin=Math.sin, exp=Math.exp;
  const ramp=(t,length)=>clamp(t/length);
  const ease=(t,length)=>{const s=ramp(t,length);return s*s*(3-2*s);};
  const ring=(f,t,k)=>sin(TWO*f*t)*exp(-k*t);
  const chirp=(a,b,t,d)=>t<=0||t>=d?0:sin(TWO*(a*t+(b-a)*t*t/(2*d)))*Math.pow(sin(Math.PI*t/d),1.7);
  const note=(n,t,d)=>t<=0||t>=d?0:ease(t,.009)*ease(d-t,.032)*(.84*ring(midi(n),t,d>.5?3.8:6.2)+.15*ring(midi(n)*2.001,t,16)+.06*ring(midi(n)*3.009,t,27));
  const lengths={felt:1.12,nylon:.85,bass:1.17,flute:1.29,celeste:1.24,brush:.16,landscape:2.45,shore:3.35,village:2.7,woodland:3.05,hearth:2.15,shop:2.9,straw:2.72,summerAir:2.4,fallAir:2.55,winterAir:2.86,rain:4.6,
    hoe:.34,water:.69,plant:.24,harvest:.60,catch:.65,miss:.38,newDay:1.72,repairDone:1.38,
    buy:.31,ship:.84,order:1.07,open:.17,cast:.48,sail:.84,gather:.38,ferryRepaired:1.58,errand:.90,travel:.54,process:.43,take:.35,seasonChange:1.29,
    buildBarn:1.30,feed:.43,pet:.51,animalCollect:.50,upgrade:1.10};
  const cues=new Set(['hoe','water','plant','harvest','catch','miss','newDay','repairDone','buy','ship','order','open','cast','sail','gather','ferryRepaired','errand','travel','process','take','seasonChange','buildBarn','feed','pet','animalCollect','upgrade']);
  const notable=new Set(['newDay','repairDone','order','ship','ferryRepaired','errand','seasonChange','buildBarn','upgrade']);
  const panned=new Set(['water','cast','catch','sail']);
  const pitches=new Set(['harvest','catch','newDay','repairDone','buy','ship','order','ferryRepaired','errand','travel','take','seasonChange','buildBarn','animalCollect','upgrade']);
  const quiet=new Set(['feed','pet','animalCollect']);

  const tune=[
    [74,0,76,78,0,76], [73,0,0,76,71,0], [74,0,78,81,0,78], [76,0,74,73,0,0],
    [71,0,74,76,0,74], [73,0,0,69,71,0], [69,0,73,76,0,78], [76,0,73,0,74,0],
    [78,0,81,83,0,81], [76,0,0,78,76,0], [74,0,76,73,0,71], [69,0,73,76,0,0]
  ];
  // D major / B minor with soft modal passing chords, in 6/8.
  const chords=[
    [50,57,62,66,69],[45,52,57,61,64],[47,54,59,62,66],[43,50,62,66,71],
    [47,54,59,62,66],[42,49,57,61,64],[40,47,55,59,64],[45,52,57,61,67],
    [50,57,62,66,69],[54,57,61,64,69],[43,50,59,62,66],[45,52,57,61,64]
  ];

  // Shoal: a related 6/8 sway, but a more open G-major phrase for the ferry.
  const shoalTune=[
    [79,0,83,81,0,74],[76,0,0,79,76,0],[74,0,76,78,0,81],[83,0,81,79,0,0],
    [83,0,86,84,0,79],[76,0,0,79,81,0],[81,0,79,78,0,74],[76,0,74,0,79,0]
  ];
  const shoalChords=[
    [43,50,59,62,67],[48,55,60,64,69],[45,52,57,60,66],[47,54,59,62,67],
    [48,55,60,64,67],[40,47,55,59,67],[38,45,54,57,64],[43,50,59,62,69]
  ];

  const townTune=[
    [76,0,79,81,0,79],[77,0,74,72,0,74],[76,0,79,84,0,81],[79,0,0,74,0,0],
    [77,0,81,84,0,81],[76,0,79,76,0,74],[72,0,74,77,0,76],[74,0,71,72,0,0]
  ];
  const townChords=[
    [48,55,60,64,67],[43,50,59,62,65],[45,52,57,60,64],[43,50,55,60,62],
    [41,48,57,60,65],[48,55,60,64,67],[41,48,57,60,64],[43,50,59,62,65]
  ];
  const groveTune=[
    [76,0,0,72,0,74],[76,0,79,0,76,0],[74,0,72,69,0,0],[71,0,74,72,0,0],
    [81,0,0,79,0,76],[74,0,77,76,0,74],[72,0,76,0,74,0],[71,0,69,0,0,0]
  ];
  const groveChords=[
    [45,52,57,60,64],[48,55,60,64,67],[43,50,55,60,62],[40,47,59,62,64],
    [45,52,57,60,64],[41,48,57,60,65],[43,50,55,60,64],[40,47,59,62,64]
  ];
  // Barn: a softly thumbed, spacious variation in C and A minor.
  const barnTune=[
    [72,0,76,0,79,0],[77,0,0,74,0,0],[72,0,74,76,0,72],[69,0,0,72,0,0],
    [76,0,79,0,81,0],[79,0,0,76,0,0],[74,0,77,76,0,74],[72,0,0,0,0,0]
  ];
  const barnChords=[
    [48,55,60,64,67],[43,50,59,62,65],[45,52,57,60,64],[41,48,57,60,64],
    [48,55,60,64,69],[40,47,55,59,64],[43,50,59,62,65],[48,55,60,64,67]
  ];
  const scenes={
    valley:{tune,chords,lead:'felt',back:'nylon',texture:'landscape',level:.061,second:7,brush:.031},
    shoal:{tune:shoalTune,chords:shoalChords,lead:'nylon',back:'felt',texture:'shore',level:.080,second:5,brush:.024},
    town:{tune:townTune,chords:townChords,lead:'nylon',back:'felt',texture:'village',level:.060,second:5,brush:.018},
    grove:{tune:groveTune,chords:groveChords,lead:'flute',back:'nylon',texture:'woodland',level:.090,second:4,brush:0},
    house:{tune,chords,lead:'felt',back:'nylon',texture:'hearth',level:.065,second:7,brush:0,inside:true},
    store:{tune:townTune,chords:townChords,lead:'felt',back:'nylon',texture:'shop',level:.058,second:5,brush:0,inside:true},
    barn:{tune:barnTune,chords:barnChords,lead:'nylon',back:'felt',texture:'straw',level:.066,second:5,brush:0,inside:true}
  };

  const seasons=new Set(['spring','summer','autumn','winter']);
  const skies=new Set(['clear','rain','snow','fog']);

  function synth(name){
    const d=lengths[name];
    if(!d)return null;
    const sampleCount=Math.ceil(SR*d), extra=name==='rain'?Math.floor(SR*.25):0, samples=new Float32Array(sampleCount+extra);
    let rand=(0x1dbaec3f^name.split('').reduce((acc,s)=>acc*31+s.charCodeAt(0),0))>>>0;
    let slow=0, low=0,mid=0,high=0;
    for(let i=0;i<samples.length;i++){
      rand=(Math.imul(rand,1664525)+1013904223)>>>0;
      const w=rand/2147483648-1, t=i/SR, ph=TWO*ROOT*t;
      slow+=.012*(w-slow);low+=.075*(w-low);mid+=.21*(w-mid);high+=.67*(w-high);
      const grit=high-mid, brush=mid-low;
      let y=0, envelope=d>=2?.06:.03;
      switch(name){
      case 'felt':
        y=.7*ring(ROOT,t,4.2)+.23*ring(ROOT*2.001,t,9)+.13*ring(ROOT*3.008,t,16)+.06*ring(ROOT*4.034,t,30)+.05*brush*exp(-36*t);
        break;
      case 'nylon': {
        const color=.7+.3*sin(TWO*t*1.17+.48);
        y=color*(.74*ring(ROOT,t,6.1)+.26*ring(ROOT*2.003,t,10)+.15*ring(ROOT*3.009,t,18)+.10*ring(ROOT*4.017,t,22))+.07*grit*exp(-65*t);
        break;
      }
      case 'bass':
        y=.76*ring(ROOT,t,4.8)+.16*ring(ROOT*2.002,t,11)+.08*ring(ROOT*3,t,23);
        break;
      case 'flute': {
        const vibrato=.36*sin(TWO*4.8*t)*ramp(t,.27);
        y=ease(t,.05)*exp(-t*3.1)*(.73*sin(ph+vibrato)+.17*sin(ph*2+vibrato*.8)+.06*sin(ph*3)+.062*grit);
        break;
      }
      case 'celeste':
        y=.73*ring(ROOT,t,4.3)+.21*ring(ROOT*2.001,t,8.4)+.09*ring(ROOT*2.761,t,12)
          +.12*ring(ROOT*4.027,t,25)+.024*grit*exp(-44*t);
        break;
      case 'brush': y=(.55*grit+.27*brush)*exp(-32*t);break;
      case 'landscape':
        y=ease(t,.27)*ease(d-t,.44)*((1.42*slow+.68*low+.55*brush)*(.83+.17*sin(TWO*.83*t))+
            .12*chirp(1455,2110,t-.54,.13)+.083*chirp(1931,1300,t-.73,.10)+.085*chirp(1618,2245,t-1.4,.18));break;
      case 'shore': {
        const swell=ease(t,.46)*ease(1.84-t,.65), retreat=ease(t-1.19,.49)*ease(d-t,.69);
        y=(2.35*slow+1.14*low+.49*brush)*(swell*.9+retreat*.56)*(1+.12*sin(TWO*1.57*t));
        y+=.071*chirp(1328,978,t-2.08,.155)+.044*chirp(1451,1110,t-2.34,.139);
        break;
      }
      case 'village': {
        // A cloth awning, a few far-off footfalls and a soft wooden knock.
        y=(1.38*slow+.62*brush)*ease(t,.44)*ease(d-t,.44)*(.72+.21*sin(TWO*.79*t));
        for(let k=0;k<3;k++){
          const z=t-.51-k*.324;
          if(z>0)y+=(.10*ring(144+k*14,z,32)+.099*brush*exp(-30*z))*ease(z,.008);
        }
        const knock=t-1.98;
        if(knock>0)y+=.066*ring(258,knock,29);
        break;
      }
      case 'woodland':
        y=(1.7*slow+.49*low+.63*brush)*ease(t,.4)*ease(d-t,.55)*(.80+.16*sin(TWO*1.16*t));
        y+=.087*chirp(1754,2412,t-.74,.135)+.078*chirp(2290,1686,t-.92,.135)
          +.064*chirp(1594,2510,t-1.68,.164)+.044*chirp(2190,1501,t-2.08,.113);
        break;
      case 'hearth': {
        y=(1.1*slow+.22*low)*ease(t,.35)*ease(d-t,.4);
        for(const x of [.38,.56,1.38]){
          const z=t-x;
          if(z>0)y+=(.14*grit*exp(-37*z)+.09*ring(202,z,25))*ease(z,.005);
        }
        break;
      }
      case 'shop': {
        const z=t-1.16;
        y=(1.55*slow+.15*brush)*ease(t,.35)*ease(d-t,.5);
        if(z>0)y+=(.098*brush+.068*grit)*ease(z,.031)*exp(-13*z);
        y+=.057*note(69,t-1.44,.44);
        break;
      }
      case 'straw': {
        // Short room breaths, not a continuous animal loop. The distant
        // paired cluck is almost buried in straw and a settling joist.
        const rustle=t-.44, creak=t-1.66;
        y=(1.23*slow+.12*low)*ease(t,.42)*ease(d-t,.59);
        if(rustle>0)y+=(.36*brush+.17*grit)*ease(rustle,.15)*exp(-4.4*rustle);
        if(creak>0)y+=(.10*ring(116,creak,13)+.033*ring(261,creak,21))*ease(creak,.025);
        y+=.047*chirp(480,308,t-1.21,.10)+.027*chirp(664,387,t-1.22,.068)
          +.036*chirp(556,387,t-1.36,.077);
        break;
      }
      case 'summerAir': {
        const cric=.56+.44*sin(TWO*5.7*t), envelope=ease(t,.46)*ease(d-t,.42);
        y=envelope*((.31*brush+.84*low)+cric*cric*(.045*sin(TWO*2917*t)+.028*sin(TWO*3405*t)));
        break;
      }
      case 'fallAir':
        y=ease(t,.42)*ease(d-t,.57)*(1.64*slow+.67*brush+.48*grit)*(.77+.21*sin(TWO*1.21*t)+.19*sin(TWO*2.78*t));
        break;
      case 'winterAir':
        y=ease(t,.53)*ease(d-t,.58)*(2.09*slow+.28*low+.14*brush)*(.70+.26*sin(TWO*.67*t+.31));
        break;
      case 'rain':
        y=(.49*grit+.78*mid+.83*low+.8*slow)*(.76+.13*sin(TWO*.32*t)+.1*sin(TWO*.81*t+.7));break;
      case 'hoe': {
        const b=t-.076;
        y=.33*ring(113,t,15)+.30*low*exp(-14*t)+.62*brush*exp(-42*t)+.17*grit*exp(-59*t);
        if(b>0)y+=.18*brush*exp(-19*b)+.07*ring(446,b,34);
        break;
      }
      case 'water':
        y=(.52*mid+.22*grit+.34*low)*ease(t,.042)*exp(-5.7*t)*(.78+.22*sin(TWO*21*t));
        y+=.096*chirp(642,319,t-.076,.127)+.093*chirp(877,498,t-.184,.092)+.066*chirp(717,256,t-.31,.15);
        break;
      case 'plant':
        y=.23*ring(303,t,26)+.22*brush*exp(-25*t)+.12*ring(623,t,51)+.11*grit*exp(-68*t);
        y+=.13*chirp(430,658,t-.056,.074);
        break;
      case 'harvest':
        y=.41*brush*ease(t,.015)*exp(-15*t)+.27*grit*exp(-25*t);
        y+=.24*note(74,t-.06,.29)+.20*note(78,t-.134,.31)+.24*note(81,t-.22,.36);
        break;
      case 'cast':
        y=(.42*brush+.22*grit)*ease(t,.044)*exp(-8*t)+.11*chirp(321,884,t-.036,.12);
        y+=.16*chirp(529,246,t-.222,.123);
        if(t>.225)y+=.28*mid*exp(-15*(t-.225));
        break;
      case 'catch':
        y=.25*chirp(812,340,t-.023,.14)+.25*note(76,t-.11,.32)+.25*note(81,t-.20,.43)+.14*note(86,t-.29,.29)+.14*grit*exp(-9*t);
        break;
      case 'miss':
        y=.20*chirp(459,161,t-.021,.2)+.29*mid*ease(t,.028)*exp(-15*t)+.1*ring(126,t,27);break;
      case 'newDay':
        y=.18*note(62,t,.81)+.13*note(69,t-.04,.82)+.14*note(78,t-.114,.86)+.18*note(81,t-.32,.78)+
          .15*note(83,t-.54,.54)+.18*note(86,t-.71,.86)+.08*chirp(1500,2720,t-.985,.15);break;
      case 'repairDone': {
        [0,.083,.16].forEach((delay,i)=>{const v=t-delay;if(v>=0)y+=(.22-i*.041)*ring(138+i*12,v,32)+.23*brush*exp(-33*v);});
        y+=.2*note(74,t-.23,.39)+.22*note(78,t-.39,.44)+.20*note(81,t-.56,.64)+.11*note(66,t-.54,.67);break;
      }
      case 'buy':
        y=.21*note(81,t,.20)+.22*note(86,t-.098,.203)+.19*grit*exp(-40*t);break;
      case 'ship':
        y=.2*ring(176,t,18)+.34*low*exp(-13*t)+.28*brush*exp(-38*t)+
          .19*note(66,t-.09,.34)+.23*note(74,t-.23,.37)+.21*note(81,t-.39,.44);break;
      case 'order':
        y=.18*note(74,t,.29)+.18*note(78,t-.103,.3)+.20*note(81,t-.218,.34)+.24*note(86,t-.39,.625)+.09*note(62,t-.38,.60);break;
      case 'sail': {
        const swell=t-.13, tail=t-.39;
        y=.19*ring(177,t,14)+.13*ring(512,t,22)+.27*brush*exp(-21*t);
        if(swell>0)y+=(.59*mid+.36*low+.09*grit)*ease(swell,.059)*exp(-5.4*swell);
        if(tail>0)y+=(.29*low+.16*brush)*ease(tail,.08)*exp(-7.1*tail);
        y+=.10*chirp(612,324,t-.19,.13)+.073*chirp(465,287,t-.43,.14);
        break;
      }
      case 'gather': {
        const tap=t-.075, tail=t-.145;
        y=(.30*brush+.31*grit)*ease(t,.009)*exp(-18*t);
        if(tap>0)y+=(.32*ring(176,tap,23)+.14*ring(397,tap,37)+.17*brush*exp(-37*tap))*ease(tap,.004);
        if(tail>0)y+=.24*grit*ease(tail,.012)*exp(-31*tail);
        break;
      }
      case 'ferryRepaired': {
        for(let i=0;i<3;i++){
          const hit=t-[0,.112,.208][i];
          if(hit>0)y+=(.32*ring(167+i*13,hit,32)+.14*ring(491+i*23,hit,36)+.27*brush*exp(-42*hit))*ease(hit,.006);
        }
        y+=.17*note(67,t-.32,.51)+.19*note(74,t-.41,.54)+.24*note(79,t-.54,.70)+.14*note(83,t-.65,.81)
          +.09*note(55,t-.51,.98);
        break;
      }
      case 'errand':
        y=.19*note(71,t,.30)+.21*note(74,t-.10,.37)+.22*note(79,t-.22,.45)+.20*note(81,t-.33,.53)
          +.10*note(62,t-.21,.57)+.03*grit*ease(t,.019)*exp(-10*t);
        break;
      case 'travel':
        y=(.53*low+.22*brush)*ease(t,.03)*exp(-8.8*t)+.15*chirp(300,461,t-.036,.17)+
          .092*note(74,t-.156,.32)+.07*note(78,t-.226,.27);
        break;
      case 'process': {
        // Latch + short turn of a mill/crank, distinct from a purchase.
        y=.26*ring(205,t,25)+.16*ring(484,t,34)+.28*brush*exp(-40*t);
        for(const x of [.082,.146,.207]){
          const z=t-x;
          if(z>0)y+=(.16*ring(294+x*230,z,42)+.13*brush*exp(-38*z))*ease(z,.005);
        }
        y+=.104*chirp(429,544,t-.24,.112);
        break;
      }
      case 'take':
        y=.20*note(74,t,.19)+.23*note(81,t-.088,.256)+.084*grit*exp(-23*t);
        break;
      case 'buildBarn': {
        // Two mallet hits, a beam settling, then a brief completion chord.
        for(let k=0;k<3;k++){
          const z=t-[0,.13,.30][k];
          if(z>=0)y+=(.24*ring(128+k*16,z,19)+.12*ring(365+k*22,z,39)
            +.24*brush*exp(-33*z))*ease(z,.005);
        }
        y+=.17*note(60,t-.36,.62)+.21*note(67,t-.43,.47)+.18*note(72,t-.53,.58)
          +.14*note(76,t-.64,.62);
        break;
      }
      case 'feed': {
        // A fine seed pour with individual grains rolling into a trough.
        y=(.49*brush+.32*grit)*ease(t,.035)*exp(-8.8*t)*(.76+.24*sin(TWO*24*t));
        for(let k=0;k<5;k++){
          const z=t-[.052,.094,.139,.216,.27][k];
          if(z>0)y+=(.13*ring(418+k*37,z,48)+.12*grit*exp(-70*z))*ease(z,.004);
        }
        break;
      }
      case 'pet':
        y=(.44*brush+.17*low)*ease(t,.048)*exp(-7.1*t)
          +.21*chirp(415,558,t-.052,.139)+.137*chirp(559,371,t-.183,.16)
          +.079*chirp(827,744,t-.066,.094);
        break;
      case 'animalCollect':
        y=(.43*brush+.21*grit)*ease(t,.018)*exp(-23*t)
          +.18*ring(203,t,31)+.22*note(72,t-.05,.22)+.23*note(76,t-.14,.34);
        break;
      case 'upgrade':
        y=.20*ring(350,t,35)+.17*ring(516,t,46)+.28*brush*exp(-42*t)
          +.15*note(64,t-.079,.44)+.18*note(69,t-.18,.49)+.2*note(74,t-.31,.55)
          +.18*note(78,t-.43,.64)+.09*note(50,t-.31,.68);
        break;
      case 'seasonChange':
        // Four soft glass pitches and a small root chord: no borrowed theme.
        y=.16*note(69,t,.46)+.19*note(74,t-.13,.52)+.22*note(78,t-.27,.57)+.22*note(81,t-.39,.77)
          +.08*note(50,t-.41,.82)+.10*note(57,t-.43,.79)+.09*note(62,t-.46,.76);
        break;
      case 'open':
        y=.19*ring(377,t,32)+.14*ring(562,t,44)+.19*brush*exp(-37*t);break;
      }
      samples[i]=name==='rain'?clamp(y,-1,1):clamp(y*ease(t,.003)*ease(d-t,envelope),-1,1);
    }
    if(extra) {
      // At each loop boundary walk through adjacent synthesized samples; the
      // crossfade removes DC/slope discontinuities without a pulsing edge.
      for(let k=0;k<extra;k++) {
        const weight=.5-.5*Math.cos(Math.PI*k/extra);
        samples[k]=samples[sampleCount+k]*(1-weight)+samples[k]*weight;
      }
    }
    return samples.subarray(0,sampleCount);
  }

  let enabled=false, chapterPosition=0, next=0, timer=null, ctx=null, graph=null;
  let hidden=typeof document!=='undefined'&&!!document.hidden;
  let season='spring', sky='clear', minute=480, region='valley', bed=null;
  const musicVoices=new Set(), fxVoices=new Set(), buffers=new Map(), lastCue=Object.create(null);
  function gain(level=1){const node=ctx.createGain();node.gain.value=level;return node;}
  function easeGain(node,to,fade=.06,when=ctx.currentTime){
    const value=node.gain;
    if(typeof value.cancelAndHoldAtTime==='function'){
      try{value.cancelAndHoldAtTime(when);}catch{value.cancelScheduledValues(when);}
    }else value.cancelScheduledValues(when);
    value.setTargetAtTime(to,when,fade);
  }

  function open(){
    if(ctx)return true;
    const Ctor=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Ctor)return false;
    try{
      ctx=new Ctor();
      const master=gain(0), music=gain(.56), fx=gain(.70), weather=gain(0);
      // Each bus is independent internally, while the single user toggle
      // fades the entire mix and stops the background scheduler.
      music.connect(master);fx.connect(master);
      let weatherFilter=null;
      if(typeof ctx.createBiquadFilter==='function'){
        weatherFilter=ctx.createBiquadFilter();weatherFilter.type='lowpass';weatherFilter.frequency.value=6500;
        weather.connect(weatherFilter);weatherFilter.connect(master);
      }else weather.connect(master);
      if(typeof ctx.createDynamicsCompressor==='function'){
        const c=ctx.createDynamicsCompressor();
        c.threshold.value=-16;c.knee.value=16;c.ratio.value=2.8;c.attack.value=.012;c.release.value=.18;
        master.connect(c);c.connect(ctx.destination);
      }else master.connect(ctx.destination);
      graph={master,music,fx,weather,weatherFilter};
    }catch{
      try{ctx?.close?.()?.catch?.(()=>{});}catch{}
      ctx=null;graph=null;return false;
    }
    return true;
  }

  function resumeFromInput(){
    if(!enabled||hidden||!ctx||ctx.state==='running')return;
    try{ctx.resume()?.then?.(()=>{if(enabled&&!hidden){if(timer===null)timeMusic();else schedule();weather();}})?.catch?.(()=>{});}catch{}
  }
  function toBuffer(name){
    if(!buffers.has(name)){
      const data=synth(name);
      if(!data)return null;
      const b=ctx.createBuffer(1,data.length,SR);
      if(typeof b.copyToChannel==='function')b.copyToChannel(data,0);
      else b.getChannelData(0).set(data);
      buffers.set(name,b);
    }
    return buffers.get(name);
  }

  function voice(name,bus,at,level,speed=1,pan=0,active=musicVoices){
    if(active.size>=24)return;
    const item=toBuffer(name);
    if(!item)return;
    const source=ctx.createBufferSource(), vol=gain(level);
    source.buffer=item;source.playbackRate.setValueAtTime(speed,at);source.connect(vol);
    let pos=null;
    if(pan&&typeof ctx.createStereoPanner==='function'){
      pos=ctx.createStereoPanner();pos.pan.value=pan;vol.connect(pos);pos.connect(bus);
    }else vol.connect(bus);
    active.add(source);
    source.onended=()=>{active.delete(source);try{source.disconnect();vol.disconnect();pos?.disconnect();}catch{}};
    source.start(at);return true;
  }

  function weather(){
    if(!ctx||!graph)return;
    if(enabled&&!hidden&&sky==='rain'&&ctx.state==='running'){
      if(!bed){
        bed=ctx.createBufferSource();bed.buffer=toBuffer('rain');bed.loop=true;
        bed.connect(graph.weather);bed.start();
      }
      const inside=!!scenes[region].inside;
      graph.weatherFilter?.frequency.setTargetAtTime(inside?850:6500,ctx.currentTime,.16);
      easeGain(graph.weather,inside?.047:.10,.21);
      return;
    }
    easeGain(graph.weather,0,.13);
    if(bed){
      const old=bed; bed=null;
      old.onended=()=>old.disconnect();
      try{old.stop(ctx.currentTime+.36);}catch{}
    }
  }

  const rate=n=>midi(n)/ROOT, BEAT=60/78/3;
  function score(step,at){
    const profile=scenes[region], {inside}=profile, bar=Math.floor(step/6), part=step%6;
    const n=profile.tune[bar][part], [low,fifth,a,b,c]=profile.chords[bar];
    const night=minute>=1140||minute<360, bus=graph.music, dim=(inside?.57:1)*(sky==='fog'?.88:1);
    const winter=season==='winter', autumn=season==='autumn', summer=season==='summer';
    const lead=inside?profile.lead:night?'flute':profile.lead;
    if(n){
      voice(lead,bus,at,(part===0?.123:.102)*(night?.86:1)*(autumn?.89:1)*dim,rate(n),-.09*dim);
      if(!night&&!inside&&(region==='shoal'?bar===4&&part===2:region==='valley'&&bar===8&&part===2))
        voice(region==='shoal'?'felt':'nylon',bus,at+.023,.051,rate(n-12),.23);
    }
    if(part===0||part===3&&!inside)
      voice('bass',bus,at,(part===0?.145:.088)*dim,rate((part===0?low:fifth)+6));
    if(inside?(part===2||part===5):(part===1||part===2||part===4||part===5)){
      const color=[a,c,a,b,c,b][part], seasonalColor=autumn&&part===2?color-12:color;
      const inst=night?'felt':profile.back;
      voice(inst,bus,at+.016,(night?.053:.068)*dim,rate(seasonalColor),dim*(part%2?.23:-.23));
    }
    // Seasonal slots complement rather than replace the melody and night colors.
    if(part===4&&bar%4===1) {
      if(summer&&!night)voice('nylon',bus,at+.029,.043*dim,rate(c+12),.14*dim);
      if(winter)voice('celeste',bus,at+.039,(night?.049:.059)*dim,rate(b+12),.14*dim);
    }
    if(!night&&!winter&&profile.brush&&(part===2||part===5))voice('brush',bus,at+.026,profile.brush,1,.16);
    if((sky!=='rain'||inside)&&part===0&&(bar===0||bar===profile.second))
      voice(profile.texture,bus,at,profile.level*(winter||sky==='fog'?.65:1)*(region==='barn'&&night?.66:1),night?.81:1,dim*(bar===0?.30:-.29));
    if(!inside&&sky!=='rain'&&part===0&&bar===Math.max(2,profile.second-2)){
      const air=sky==='snow'||winter?'winterAir':sky==='fog'?null:summer?'summerAir':autumn?'fallAir':null;
      if(air)voice(air,bus,at,sky==='snow'?.077:night?.053:.066,1,.22);
    }
  }

  function schedule(){
    if(!enabled||hidden||!ctx||ctx.state!=='running')return;
    const now=ctx.currentTime;
    if(next<now-.035)next=now+.036;
    let count=0;
    while(next<now+.125&&++count<9){
      score(chapterPosition,next);
      chapterPosition=(chapterPosition+1)%(scenes[region].tune.length*6);
      next+=BEAT;
    }
  }
  function timeMusic(){
    if(timer!==null){clearInterval(timer);timer=null;}
    if(enabled&&!hidden&&ctx){
      next=ctx.currentTime+.043;timer=setInterval(schedule,52);schedule();
    }
  }
  function set(on){
    if(!!on&&!open())return false;
    const changed=enabled!==!!on;
    enabled=!!on;
    if(!ctx)return false;
    if(enabled)resumeFromInput();
    easeGain(graph.master,enabled&&!hidden?.82:0,.035);
    if(changed||timer===null)timeMusic();
    weather();
    return enabled;
  }
  function setScene(scene={}){
    if(!scene)return;
    if(Number.isFinite(scene.minute))minute=((scene.minute%1440)+1440)%1440;
    // Begin the next phrase at the next scheduled beat; existing tails ring out.
    let changed=false;
    if(typeof scene.region==='string'&&Object.prototype.hasOwnProperty.call(scenes,scene.region)&&scene.region!==region){
      region=scene.region;chapterPosition=0;changed=true;
    }
    if(seasons.has(scene.season)&&season!==scene.season){
      season=scene.season;chapterPosition=0;
    }
    const nextSky=skies.has(scene.weather)?scene.weather:typeof scene.rain==='boolean'?scene.rain?'rain':'clear':sky;
    if(nextSky!==sky){sky=nextSky;changed=true;}
    if(changed)weather();
  }
  function play(name){
    if(!enabled||hidden||!ctx||!cues.has(name))return false;
    if(ctx.state!=='running'){
      resumeFromInput();
      if(ctx.state!=='running')return false;
    }
    const now=ctx.currentTime;
    if(now-(lastCue[name]??-1)<(name==='open'?.095:.12))return false;
    lastCue[name]=now;
    const fixed=pitches.has(name), vol=notable.has(name)?.79:name==='open'?.5:quiet.has(name)?.59:.71;
    if(notable.has(name)){
      easeGain(graph.music,.26,.06,now);
      graph.music.gain.setTargetAtTime(.56,now+.61,.25);
    }
    return !!voice(name,graph.fx,now+.006,vol,fixed?1:.94+Math.random()*.115,panned.has(name)?.12:0,fxVoices);
  }
  if(typeof document!=='undefined'&&document.addEventListener){
    document.addEventListener('visibilitychange',()=>{
      hidden=!!document.hidden;
      if(!ctx)return;
      if(!hidden)resumeFromInput();
      easeGain(graph.master,enabled&&!hidden?.82:0,.058);
      timeMusic();weather();
    });
    // Touch activation normally arrives at pointerup, not at touch pointerdown.
    for(const event of ['pointerup','touchend','click','keydown'])document.addEventListener(event,e=>{
      if(e.isTrusted)resumeFromInput();
    },{passive:true,capture:true});
  }
  globalThis.MistSound=Object.freeze({set,play,setScene});
})();
