// ================= audio: everything is synthesised live with WebAudio (no sound files)
const SFX={ctx:null,on:true,rpm:850,sph:0,
  init(){
    if(this.ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    let c;try{c=this.ctx=new AC();}catch(e){return;}
    this.master=c.createGain();this.master.gain.value=this.on?.75:0;
    const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=4;
    this.master.connect(comp);comp.connect(c.destination);
    const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const nd=nb.getChannelData(0);
    for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;this.noise=nb;
    const loopNoise=()=>{const s=c.createBufferSource();s.buffer=nb;s.loop=true;s.start(0,Math.random()*1.5);return s;};
    // engine: stacked harmonics through a resonant low-pass, pitch follows rpm
    this.ef=c.createBiquadFilter();this.ef.type='lowpass';this.ef.frequency.value=500;this.ef.Q.value=3.5;
    this.eg=c.createGain();this.eg.gain.value=0;
    this.eo=[['sawtooth',1,.32],['square',.5,.26],['sine',.25,.7],['sawtooth',2.01,.07],['triangle',.75,.18]].map(([t,m,g])=>{
      const o=c.createOscillator();o.type=t;const gg=c.createGain();gg.gain.value=g;o.connect(gg).connect(this.ef);o.start();o.m=m;return o;});
    // a little roughness on the engine note
    const rough=loopNoise();const rf2=c.createBiquadFilter();rf2.type='lowpass';rf2.frequency.value=180;const rg2=c.createGain();rg2.gain.value=.25;rough.connect(rf2).connect(rg2).connect(this.ef);
    this.ef.connect(this.eg).connect(this.master);
    // road and wind
    const rs=loopNoise();this.rf=c.createBiquadFilter();this.rf.type='bandpass';this.rf.frequency.value=400;this.rf.Q.value=.6;
    this.rg=c.createGain();this.rg.gain.value=0;rs.connect(this.rf).connect(this.rg).connect(this.master);
    // tyre squeal
    const ts=loopNoise();const tf=c.createBiquadFilter();tf.type='bandpass';tf.frequency.value=1700;tf.Q.value=6;
    this.tq=c.createOscillator();this.tq.type='triangle';this.tq.frequency.value=950;const tqg=c.createGain();tqg.gain.value=.3;this.tq.connect(tqg).connect(tf);this.tq.start();
    this.tg=c.createGain();this.tg.gain.value=0;ts.connect(tf);tf.connect(this.tg).connect(this.master);
    // siren: two detuned oscillators, soft clipped like a horn speaker
    this.sf=c.createBiquadFilter();this.sf.type='lowpass';this.sf.frequency.value=2800;
    this.sg=c.createGain();this.sg.gain.value=0;
    this.so=[0,1].map(i=>{const o=c.createOscillator();o.type=i?'square':'sawtooth';const g=c.createGain();g.gain.value=i?.3:.5;o.connect(g).connect(this.sf);o.start();return o;});
    const sh=c.createWaveShaper();const cur=new Float32Array(512);for(let i=0;i<512;i++){const x=i/256-1;cur[i]=Math.tanh(x*2.4);}sh.curve=cur;
    this.sf.connect(sh).connect(this.sg).connect(this.master);
    // horn
    this.hg=c.createGain();this.hg.gain.value=0;const hf=c.createBiquadFilter();hf.type='lowpass';hf.frequency.value=1900;
    [370,466].forEach(f=>{const o=c.createOscillator();o.type='square';o.frequency.value=f;o.connect(hf);o.start();});hf.connect(this.hg).connect(this.master);
    // city ambience
    const as=loopNoise();const af=c.createBiquadFilter();af.type='lowpass';af.frequency.value=260;this.ag=c.createGain();this.ag.gain.value=0;as.connect(af).connect(this.ag).connect(this.master);
  },
  resume(){if(this.ctx&&this.ctx.state!=='running')this.ctx.resume();},
  setOn(v){this.on=v;if(this.master)this.master.gain.setTargetAtTime(v?.75:0,this.ctx.currentTime,.05);},
  update(dt,s){
    if(!this.ctx)return;const t=this.ctx.currentTime;
    const mph=Math.abs(s.speed)*2.237;
    const G=[0,17,33,51,73,999];let g=0;while(mph>G[g+1])g++;
    const frac=clamp((mph-G[g])/((g<4?G[g+1]:125)-G[g]),0,1);
    const target=s.mute?0:850+(g===0?frac*2700:1500+frac*3000)+s.throttle*450;
    this.rpm+=(target-this.rpm)*Math.min(1,dt*(target>this.rpm?5:8));
    const f=Math.max(18,this.rpm/60*2);
    this.eo.forEach(o=>o.frequency.setTargetAtTime(f*o.m,t,.05));
    this.ef.frequency.setTargetAtTime(220+s.throttle*900+this.rpm*.17,t,.06);
    const near=s.mute?0:s.inCar?1:clamp(1-s.dist/45,0,1)*.7;
    this.eg.gain.setTargetAtTime((.045+s.throttle*.075+mph/130*.05)*near,t,.08);
    this.rg.gain.setTargetAtTime(clamp(mph/70,0,1)*.1*near,t,.1);this.rf.frequency.setTargetAtTime(250+mph*14,t,.1);
    this.tg.gain.setTargetAtTime(s.slip>2&&mph>14?Math.min(.13,(s.slip-2)*.05)*near:0,t,.05);
    if(s.siren&&!s.mute){
      const rate=s.siren==='wail'?.21:3.2;this.sph+=dt*rate;
      const x=s.siren==='wail'?(1-Math.cos(this.sph*Math.PI*2))/2:(this.sph%1);
      const fr=s.siren==='wail'?600+x*850:680+x*760;
      this.so[0].frequency.setTargetAtTime(fr,t,.006);this.so[1].frequency.setTargetAtTime(fr*1.004,t,.006);
      const sn=s.inCar?.85:clamp(1.05-s.dist/150,.15,1);
      this.sg.gain.setTargetAtTime(.1*sn,t,.03);
    }else this.sg.gain.setTargetAtTime(0,t,.05);
    this.ag.gain.setTargetAtTime(s.mute?.015:.035,t,.5);
  },
  horn(on){if(this.ctx)this.hg.gain.setTargetAtTime(on?.11:0,this.ctx.currentTime,.015);},
  blip(kind){
    if(!this.ctx||!this.on)return;const c=this.ctx,t=c.currentTime;
    const tone=(f,st,d,type='sine',vol=.12,f2)=>{const o=c.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t+st);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+st+d);const g=c.createGain();g.gain.setValueAtTime(0,t+st);g.gain.linearRampToValueAtTime(vol,t+st+.01);g.gain.exponentialRampToValueAtTime(.0001,t+st+d);o.connect(g).connect(this.master);o.start(t+st);o.stop(t+st+d+.05);};
    const burst=(st,d,ft,ff,vol)=>{const s=c.createBufferSource();s.buffer=this.noise;const f=c.createBiquadFilter();f.type=ft;f.frequency.value=ff;const g=c.createGain();g.gain.setValueAtTime(vol,t+st);g.gain.exponentialRampToValueAtTime(.0001,t+st+d);s.connect(f).connect(g).connect(this.master);s.start(t+st,Math.random());s.stop(t+st+d+.05);};
    if(kind==='radio'){burst(0,.14,'bandpass',1900,.07);tone(1250,.03,.07,'square',.045);tone(950,.11,.08,'square',.045);burst(.2,.08,'bandpass',2200,.05);}
    else if(kind==='good'){tone(660,0,.12);tone(990,.09,.2);}
    else if(kind==='bad'){tone(320,0,.28,'sawtooth',.05,170);}
    else if(kind==='crash'){burst(0,.55,'lowpass',520,.55);burst(0,.18,'highpass',2600,.22);tone(85,0,.3,'sine',.3,40);}
    else if(kind==='cuff'){burst(0,.04,'highpass',3200,.28);burst(.07,.04,'highpass',3600,.22);burst(.16,.05,'highpass',3000,.18);}
    else if(kind==='door'){burst(0,.2,'lowpass',240,.4);tone(95,0,.16,'sine',.22,55);}
    else if(kind==='click'){tone(1700,0,.035,'square',.035);}
    else if(kind==='breach'){burst(0,.7,'lowpass',380,.75);burst(0,.22,'bandpass',1300,.35);tone(60,0,.4,'sine',.35,35);}
    else if(kind==='zap'){burst(0,.32,'highpass',3800,.22);for(let i=0;i<7;i++)tone(2200+i*130,i*.04,.03,'square',.03);}
    else if(kind==='thwack'){burst(0,.07,'bandpass',900,.5);tone(140,0,.09,'sine',.25,70);}
    else if(kind==='whoosh'){burst(0,.16,'bandpass',600,.12);}
    else if(kind==='spray'){burst(0,.45,'highpass',5200,.18);burst(.05,.35,'bandpass',2600,.08);}
    else if(kind==='shot'){burst(0,.32,'lowpass',1400,.9);burst(0,.06,'highpass',3000,.5);tone(110,0,.18,'sine',.4,45);}
    else if(kind==='punch'){burst(0,.06,'lowpass',420,.45);tone(90,0,.08,'sine',.22,55);}
    else if(kind==='shout'){tone(240,0,.22,'sawtooth',.05,200);tone(300,.05,.2,'sawtooth',.04,260);burst(0,.25,'bandpass',1100,.05);}
    else if(kind==='alpr'){tone(880,0,.09,'square',.05);tone(880,.13,.09,'square',.05);tone(1320,.26,.16,'square',.05);}
  }
};
