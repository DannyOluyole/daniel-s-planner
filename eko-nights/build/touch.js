// ================= phone controls: a floating joystick for the left thumb, big context buttons for the right
// The stick is analog: push a little to walk or steer gently, all the way to run. In the cruiser it steers,
// and pushing it up or down also works as gas and brake (the pedals on the right do the same).
const STICK={on:false,id:null,ox:0,oy:0,x:0,y:0,m:0};
const TCAM={use:false,h:0};
const STICK_R=56;
function buzz(){try{if(navigator.vibrate)navigator.vibrate(8);}catch(e){}}
const wrapAng=a=>Math.atan2(Math.sin(a),Math.cos(a));
const ramp=(v,dz)=>v>dz?Math.min(1,(v-dz)/(.9-dz)):0;

// Cruiser: steering, gas and brake from the keyboard, the pedals or the stick.
function padDrive(){
  let turn=keys.left-keys.right,up=keys.up,dn=keys.down;
  if(STICK.on&&inCar){const x=Math.abs(STICK.x)<.08?0:STICK.x;turn=clamp(turn-x*1.25,-1,1);up=Math.max(up,ramp(STICK.y,.4));dn=Math.max(dn,ramp(-STICK.y,.4));}
  return {turn,up,dn};
}
// On foot in the street: the stick moves you the way it points on screen, relative to the camera.
function padFoot(dt){
  if(CUFF)return {stick:true,h:pl.h,m:0,run:false};
  if(!(STICK.on&&STICK.m>.12))return {stick:false,run:!!keys.sprint,m:1};
  const camYaw=Math.atan2(pl.x-camPos.x,pl.z-camPos.z);
  const want=camYaw-Math.atan2(STICK.x,STICK.y);
  const h=pl.h+wrapAng(want-pl.h)*Math.min(1,dt*12);
  const run=STICK.m>.92||!!keys.sprint;
  return {stick:true,h,m:run?1:Math.max(.35,STICK.m),run};
}
// Inside buildings and raids the camera is fixed, so the stick maps straight onto the screen.
function padScreen(){
  if(CUFF)return null;
  if(STICK.on&&STICK.m>.12){const m=Math.min(1,STICK.m);return {mx:-STICK.x/STICK.m,mz:STICK.y/STICK.m,m:STICK.m>.92?1:Math.max(.35,m),run:STICK.m>.92||!!keys.sprint};}
  let mx=(keys.left?1:0)-(keys.right?1:0),mz=(keys.up?1:0)-(keys.down?1:0);const m=Math.hypot(mx,mz);
  return m>0?{mx:mx/m,mz:mz/m,m:1,run:!!keys.sprint}:null;
}

function stickRest(){
  const z=$('#stickZone'),st=$('#stick');if(!z||!st)return;
  st.style.left=Math.max(92,z.clientWidth*.3)+'px';st.style.top=Math.max(80,z.clientHeight-96)+'px';st.firstElementChild.style.transform='';
}
function stickRelease(){
  STICK.on=false;STICK.id=null;STICK.x=STICK.y=STICK.m=0;
  const z=$('#stickZone');if(z)z.classList.remove('on');stickRest();
}
function bindStick(){
  const z=$('#stickZone'),st=$('#stick');if(!z)return;
  const local=e=>{const r=z.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];};
  z.addEventListener('pointerdown',e=>{
    if(STICK.on)return;e.preventDefault();
    const [x,y]=local(e);STICK.on=true;STICK.id=e.pointerId;STICK.ox=x;STICK.oy=y;STICK.x=STICK.y=STICK.m=0;
    try{z.setPointerCapture(e.pointerId);}catch(_){}
    z.classList.add('on');st.style.left=x+'px';st.style.top=y+'px';st.firstElementChild.style.transform='';
  });
  z.addEventListener('pointermove',e=>{
    if(!STICK.on||e.pointerId!==STICK.id)return;
    const [x,y]=local(e);let dx=x-STICK.ox,dy=y-STICK.oy;const d=Math.hypot(dx,dy);
    // the base follows a thumb that wanders too far, so it never "falls off" the stick
    if(d>STICK_R*1.35){const k=(d-STICK_R*1.35)/d;STICK.ox+=dx*k;STICK.oy+=dy*k;st.style.left=STICK.ox+'px';st.style.top=STICK.oy+'px';dx=x-STICK.ox;dy=y-STICK.oy;}
    const c=Math.min(1,STICK_R/Math.max(1,Math.hypot(dx,dy)));const kx=dx*c,ky=dy*c;
    STICK.x=kx/STICK_R;STICK.y=-ky/STICK_R;STICK.m=Math.hypot(STICK.x,STICK.y);
    st.firstElementChild.style.transform=`translate(${kx}px,${ky}px)`;
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>z.addEventListener(ev,e=>{if(e.pointerId===STICK.id)stickRelease();}));
  z.addEventListener('contextmenu',e=>e.preventDefault());
  // tapping the on-screen prompt does what it says
  $('#prompt').addEventListener('click',()=>{if(!document.body.classList.contains('touchmode'))return;if(raidS){raidInteract();return;}if(inCar)toggleCar();else interact();});
  addEventListener('resize',()=>{if(!STICK.on)stickRest();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stickRelease();});
  stickRest();
}

const TUI={incar:null,use:'',car:null,tip:false};
function touchFrame(dt){
  TCAM.use=document.body.classList.contains('touchmode');if(!TCAM.use)return;
  if(inCar||!camPos.init)TCAM.h=inCar?pc.h:pl.h;else TCAM.h+=wrapAng(pl.h-TCAM.h)*Math.min(1,dt*(STICK.on?1:2.5));
  if(STICK.on&&(blockingModal()||cine||cctv))stickRelease();
  if(TUI.incar!==inCar){TUI.incar=inCar;document.body.classList.toggle('incar',inCar);}
  // only the buttons that do something right now are on screen
  const pr=$('#prompt'),shown=!pr.hidden,carAct=shown&&(inCar||pr.innerHTML.includes('<kbd>F</kbd>'));
  const foot=!inCar,fight=foot&&document.body.classList.contains('combat');
  const nearCar=foot&&!raidS&&!insideS&&Math.hypot(pl.x-pc.x,pl.z-pc.z)<7;
  const sirenSt=suspect&&suspect.mode==='drive'?'cancel':target&&!suspect&&!chase?'stop':lightsOn?'on':'off';
  const st=[inCar,foot&&(DLG||shown&&!carAct),inCar||nearCar,carAct,fight,sirenSt,!!DLG].join('|');
  if(TUI.st!==st){TUI.st=st;
    const T=(sel,on,label)=>{const b=$('#touch '+sel);b.classList.toggle('show',!!on);if(label)b.querySelector('.bl').textContent=label;return b;};
    T('.gas',inCar);T('.brake',inCar);
    T('.lights',inCar,{cancel:'CANCEL',stop:'PULL OVER',on:'SIREN',off:'SIREN'}[sirenSt]).classList.toggle('lit',sirenSt==='on');
    $('#touch .lights').classList.toggle('stop',sirenSt==='stop');
    T('.car',inCar||nearCar,inCar?'EXIT':'ENTER').classList.toggle('ready',carAct);
    T('#useBtn',foot&&(DLG||shown&&!carAct),DLG?'NEXT':'USE');
    T('.atk',fight);T('.tool',fight);T('.shout',fight);
  }
  if(!TUI.tip&&started&&!cine){TUI.tip=true;let seen=false;try{seen=localStorage.getItem('eko-touchtip')==='1';localStorage.setItem('eko-touchtip','1');}catch(e){}
    if(!seen)toast('Left thumb: drag anywhere to drive or walk, push all the way to run. Right side: drag to look around. Buttons appear when you can use them.');}
}
