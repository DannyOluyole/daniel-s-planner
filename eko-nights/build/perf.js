// ================= adaptive quality: keep the game smooth on low-end phones
// Measures real frame rate while you play. Under about 22 fps for 6 seconds, it steps quality down one level.
// The level is remembered on the device, so the next visit starts smooth.
const PERF_STEPS=[
  {pr:1.25},
  {pr:1,shadows:false},
  {pr:.8,cars:14,peds:10},
  {pr:.65,cars:10,peds:6},
];
const PERF={step:0,acc:0,frames:0,last:performance.now(),fps:0,warned:false};
try{PERF.saved=Math.min(PERF_STEPS.length,+localStorage.getItem('eko-perf2')||0);}catch(e){PERF.saved=0;}
function applyPerfStep(s){
  if(s.pr!=null&&s.pr<QUAL.pr){QUAL.pr=s.pr;renderer.setPixelRatio(Math.min(QUAL.pr,window.devicePixelRatio||1));resize();}
  if(s.shadows===false&&QUAL.shadows){
    QUAL.shadows=false;renderer.shadowMap.enabled=false;sun.castShadow=false;
    scene.traverse(o=>{if(o.isMesh||o.isInstancedMesh){o.castShadow=false;o.receiveShadow=false;const m=o.material;(Array.isArray(m)?m:[m]).forEach(x=>{if(x)x.needsUpdate=true;});}});
  }
  if(s.cars!=null){QUAL.cars=Math.min(QUAL.cars,s.cars);
    aiCars.filter(c=>c!==suspect&&!(chase&&chase.car===c)&&c.mode==='drive').sort((a,b)=>Math.hypot(b.x-pc.x,b.z-pc.z)-Math.hypot(a.x-pc.x,a.z-pc.z))
      .slice(0,Math.max(0,aiCars.length-QUAL.cars)).forEach(removeAICar);}
  if(s.peds!=null){QUAL.peds=Math.min(QUAL.peds,s.peds);while(peds.length>QUAL.peds){const p=peds.pop();scene.remove(p.mesh);}}
}
function perfStepDown(){
  if(PERF.step>=PERF_STEPS.length)return;applyPerfStep(PERF_STEPS[PERF.step++]);
  try{localStorage.setItem('eko-perf2',PERF.step);}catch(e){}
  if(!PERF.warned){PERF.warned=true;toast('Graphics lowered a little to keep the game smooth. Pick High on the title screen to reset.');}
}
// Called once the world is built: start at the level this device needed last time.
function perfStart(){PERF.last=performance.now();while(PERF.step<PERF.saved)applyPerfStep(PERF_STEPS[PERF.step++]);}
function perfFrame(){
  const now=performance.now(),dt=Math.min(1,(now-PERF.last)/1000);PERF.last=now;
  if(PERF.off||!started||cine||cctv||raidS||insideS||blockingModal()||document.hidden)return;
  PERF.acc+=dt;PERF.frames++;if(PERF.acc<6)return;
  PERF.fps=PERF.frames/PERF.acc;PERF.acc=0;PERF.frames=0;
  if(PERF.fps<22)perfStepDown();
}
// A player who picks quality on the title screen resets the automatic level.
document.addEventListener('click',e=>{if(e.target&&(e.target.id==='qHigh'||e.target.id==='qLow')){PERF.saved=0;try{localStorage.setItem('eko-perf2','0');}catch(err){}}},true);

// ---------- phones: full screen and landscape when the shift starts (Android; iPhone uses the rotate prompt)
function goLandscape(){
  if(!matchMedia('(pointer:coarse)').matches)return;
  const el=document.documentElement;
  try{const p=el.requestFullscreen?el.requestFullscreen({navigationUI:'hide'}):el.webkitRequestFullscreen?el.webkitRequestFullscreen():null;
    Promise.resolve(p).then(()=>screen.orientation&&screen.orientation.lock?screen.orientation.lock('landscape'):null).catch(()=>{});}catch(e){}
}
