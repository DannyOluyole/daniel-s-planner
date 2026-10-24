// ================= cinematic scenes: conversations, traffic stops, CCTV replays, interview room, raids
let cine=null,DLG=null,raidS=null,cctv=null;
function startCine(o){cine=Object.assign({t:0,fov:40},o);document.body.classList.add('cine');for(const k in keys)keys[k]=0;SFX.horn(false);}
function endCine(){const c=cine;cine=null;DLG=null;renderDlg();document.body.classList.remove('cine');if(c&&c.cleanup)c.cleanup();}

// ---------- dialogue box
function dialog(lines,choices,cb){DLG={lines,choices:choices&&choices.length?choices:[{label:'Continue'}],cb,i:0,ch:0};renderDlg();}
function renderDlg(){
  const d=$('#dlg');if(!DLG){d.hidden=true;d.className='';return;}
  d.hidden=false;d.className='';const L=DLG.lines[DLG.i];const full=DLG.ch>=L.text.length;const last=DLG.i===DLG.lines.length-1;
  d.innerHTML=`<div class="who ${L.side==='you'?'you':''}">${esc(L.name)}</div><div class="txt" id="dlgTxt">${esc(L.text.slice(0,Math.floor(DLG.ch)))}</div>`+
    (full&&last?`<div class="choices">${DLG.choices.map((c,i)=>`<button class="btn ${c.cls||''}" data-ch="${i}">${esc(c.label)}</button>`).join('')}</div>`:`<div class="next">${document.body.classList.contains('touchmode')?'Tap to continue':'E · Space · click to continue'}</div>`);
  $$('[data-ch]',d).forEach(b=>b.onclick=e=>{e.stopPropagation();choose(+b.dataset.ch);});
}
function choose(i){if(!DLG)return;const c=DLG.choices[i];const cb=DLG.cb;DLG=null;renderDlg();SFX.blip('click');cb&&cb(c);}
function dlgTick(dt){
  if(!DLG)return;const L=DLG.lines[DLG.i];
  if(DLG.ch<L.text.length){DLG.ch=Math.min(L.text.length,DLG.ch+dt*60);const t=$('#dlgTxt');if(t)t.textContent=L.text.slice(0,Math.floor(DLG.ch));if(DLG.ch>=L.text.length)renderDlg();}
}
function dlgAdvance(){
  if(!DLG)return;const L=DLG.lines[DLG.i];
  if(DLG.ch<L.text.length){DLG.ch=L.text.length;renderDlg();return;}
  if(DLG.i<DLG.lines.length-1){DLG.i++;DLG.ch=0;renderDlg();SFX.blip('click');return;}
  if(DLG.choices.length===1)choose(0);
}
$('#dlg').addEventListener('click',e=>{if(!e.target.closest('button'))dlgAdvance();});

// ---------- face-to-face conversations
function faceOff(npc,dist=1.25){
  let vx=npc.position.x-pl.x,vz=npc.position.z-pl.z,d=Math.hypot(vx,vz);if(d<.01){vx=0;vz=1;d=1;}vx/=d;vz/=d;
  pl.x=npc.position.x-vx*dist;pl.z=npc.position.z-vz*dist;pl.h=Math.atan2(vx,vz);
  pl.mesh.position.set(pl.x,.2,pl.z);pl.mesh.rotation.y=pl.h;npc.rotation.y=Math.atan2(-vx,-vz);
  return {vx,vz};
}
function talkTo(npc,lines,choices,cb,o={}){
  const {vx,vz}=faceOff(npc);const rx=-vz,rz=vx;const body=npc.userData.j?npc:npc.children.find(k=>k.userData&&k.userData.j);const s=body?body.scale.y:1;
  startCine({fov:36,pos:V3(pl.x-vx*1.05+rx*.52,1.84,pl.z-vz*1.05+rz*.52),look:V3(npc.position.x,.2+1.62*s,npc.position.z),
    update(){const L=DLG&&DLG.lines[DLG.i];const you=L&&L.side==='you';if(body)pose(body,o.npcPose||(you?'idle':'talk'),this.t);pose(pl.mesh,you?'talk':'idle',this.t+1);}});
  dialog(lines,choices,ch=>{const keep=cb&&cb(ch);if(!keep)endCine();});
}
const you=t=>({name:'You',side:'you',text:t});

// ---------- traffic stop at the driver's window
const GREET=['Afternoon. Do you know why I stopped you?','License and registration, please.','Do you know how fast you were going back there?','Officer with Precinct 9. Engine off, please.'];
function stopScene(s){
  const fled=!!s.fled;const d=genDriver(s,fled);
  const f=fwdOf(s.h),L={x:f.z,z:-f.x};
  pl.x=s.rx+L.x*1.5-f.x*.1;pl.z=s.rz+L.z*1.5-f.z*.1;pl.h=Math.atan2(-L.x,-L.z);pl.mesh.position.set(pl.x,.2,pl.z);pl.mesh.rotation.y=pl.h;pl.mesh.visible=true;
  const P=s.mesh.userData.P;const tallCab=P.roof>1.6;
  if(!s.drv){s.drv=makePersonMesh(lookOf(d));s.drv.position.set(.4,-.14+(tallCab?.2:0),-.15);s.mesh.userData.body.add(s.drv);if(s.mesh.userData.sil)s.mesh.userData.sil.visible=false;}
  const head=V3(s.rx+L.x*.4,1.05+(tallCab?.2:0),s.rz+L.z*.4);
  startCine({fov:40,pos:V3(pl.x+L.x*.55+f.x*1.25,1.78,pl.z+L.z*.55+f.z*1.25),look:head,
    update(){const j=s.drv.userData.j;pose(s.drv,fled?['sit','handsUp']:['sit','drive']);j.head.rotation.y=.9+Math.sin(this.t*1.4)*.12;pose(pl.mesh,'idle',this.t);}});
  const over=s.clocked-LIMIT;
  const excuse=fled?pick(EXCUSES.fled):s.seenViol&&over<=0?pick(['The light was yellow, I swear!','I thought I could make it.']):pick(over>0?EXCUSES.fast:EXCUSES.slow);
  dialog([you(fled?'Hands where I can see them! Engine off, keys on the dash.':pick(GREET)),{name:d.name,text:excuse}],[{label:fled?'Book the driver':'Write it up'}],()=>{
    trafficStop(s,fled,arrested=>{
      if(s.drv){s.drv.parent.remove(s.drv);s.drv=null;}
      if(fled||arrested){s.mode='parked';if(chase&&chase.car===s)endChase();suspect=null;setLights(false);if(s.mesh.userData.sil)s.mesh.userData.sil.visible=false;}
      else{if(s.mesh.userData.sil)s.mesh.userData.sil.visible=true;s.mode='drive';suspect=null;setLights(false);const g=fwdOf(s.h);if((s.wp.x-s.x)*g.x+(s.wp.z-s.z)*g.z<0)advance(s);}
      endCine();
    });
  });
}

// ---------- CCTV: replay the event with actors in the real 3D city, viewed from the security camera
function W(d,u,v){return {x:d.x+d.tx*u+d.nx*v,z:d.z+d.tz*u+d.nz*v};}
function replayDef(cs){
  const A=cs.A;
  if(cs.type==='robbery'){
    const d=LOC.bank;
    return {d,min:21*60+40,stamp:'21:4',stampBase:40,dur:22,
      cams:[{name:'CAM 01 · Bank entrance',pos:[3.6,-1.1,4.4],look:[-1.2,7,1],sharp:[0,1.6,4.2],lamp:[0,.4,3.5]},
            {name:'CAM 02 · Street corner',pos:[-10,12,6.4],look:[-34,25,.6],sharp:[-33,23.6,7.5]}],
      actors:[
        {kind:'p',look:randLook(),keys:[[0,30,17],[14,-30,17]],msg:'A passer-by on the sidewalk. Not involved.'},
        {kind:'p',look:{shirt:'#2d2d33',pants:'#1b1c20',masked:true,gloves:'#111'},keys:[[6,0,-.5],[8.6,-1,10],[11,-2.6,21.4]],msg:'Masked robber, average height, gloves on. Nothing identifying.'},
        {kind:'p',look:{shirt:'#3a2a24',pants:'#1b1c20',masked:true,tall:1.12,gloves:'#111'},keys:[[7,0,-.5],[9.5,-.4,10],[11.5,-3.4,21.4]],clue:['tall','CCTV: one robber is very tall','Measured against the door frame, the second robber stands about 192 cm (6\'4").']},
        {kind:'p',look:{shirt:'#23314a',pants:'#1b1c20',masked:true,backpack:'#202020'},keys:[[8.2,0,-.5],[10.5,-1.6,10],[11.7,-5,21.4]],msg:'Masked robber with the cash bag. Nothing identifying.'},
        {kind:'c',color:A.car.color.h,model:A.car.model,plate:cs.pattern,face:-1,keys:[[0,-4,23.6],[12,-4,23.6],[13.2,-13,23.6],[17.2,-130,23.6]],clue:['plate','CCTV: getaway vehicle',`${A.car.color.n} ${A.car.model}, partial plate ${cs.pattern}. Leaving at 21:41.`],blur:'Too dark to read the plate here. Find the frame where the car is under the streetlight on CAM 02.'},
        {kind:'c',color:'#a8b0ba',model:'Sedan',face:1,keys:[[2,-130,32],[7.5,130,32]],msg:'A silver sedan heading the other way, before the robbery.'}]};
  }
  const d=LOC.school;
  return {d,min:15*60+2,stamp:'15:0',stampBase:2*60,dur:20,
    cams:[{name:'CAM 01 · School gate',pos:[-5,1.2,4.2],look:[3,9,.8],sharp:[0,3,5.5]},
          {name:'CAM 02 · Traffic camera',pos:[24,14,6.4],look:[44,25,.6],sharp:[40,24.4,7.5]}],
    actors:[
      {kind:'p',look:{shirt:'#c9a227',skin:SKIN[1],hair:'#5a3a22',kid:true,backpack:'#3a5a8a'},keys:[[2.5,0,0],[5,1.5,3],[9,5,14],[12.2,7.5,22.6]],msg:`That's ${cs.victim.first}, leaving through the gate.`},
      {kind:'p',look:{shirt:'#b0302f',pants:'#2a2e38',skin:A.skin,hood:true},keys:[[4.5,-12,3],[7,-1,3],[9.2,4,14.5],[12.4,6.6,22.8]],clue:['abductor','CCTV: man in a red hoodie',`Walks ${cs.victim.first} to the van. About ${A.height} cm, ${A.hair.h?lower(A.hair.n)+' hair':'shaved head'}.`],blur:'Too far from the camera to make out. Find a frame where he is close to the gate.'},
      {kind:'c',color:A.car.color.h,model:'Van',plate:cs.pattern,face:1,keys:[[0,8,24],[13,8,24],[14,20,24],[18.5,150,24]],clue:['plate','CCTV: kidnapper\'s van',`${A.car.color.n} van, partial plate ${cs.pattern}. Passed the traffic camera at 15:02.`],blur:'Too far away to read the plate. The traffic camera on CAM 02 has a closer view.'},
      {kind:'p',look:randLook(),keys:[[1,25,15],[18,-25,15]],msg:'A jogger. Not involved.'},
      {kind:'c',color:'#2f5fb8',model:'Hatchback',face:-1,keys:[[3,150,31],[8,-40,31]],msg:'A blue hatchback. Not the van.'}]};
}
function actorAt(a,t){
  const K=a.keys;if(t<K[0][0]||t>K[K.length-1][0])return null;
  for(let i=0;i<K.length-1;i++){const [t0,u0,v0]=K[i],[t1,u1,v1]=K[i+1];if(t>=t0&&t<=t1){const k=t1===t0?0:(t-t0)/(t1-t0);return {u:u0+(u1-u0)*k,v:v0+(v1-v0)*k,du:u1-u0,dv:v1-v0,moving:(u1!==u0||v1!==v0)};}}
  const L=K[K.length-1];return {u:L[1],v:L[2],du:0,dv:0,moving:false};
}
function openCCTV3D(cs){
  const R=replayDef(cs);const d=R.d;
  const hidden=[];const hide=o=>{if(o&&o.visible){o.visible=false;hidden.push(o);}};
  aiCars.forEach(c=>hide(c.mesh));peds.forEach(p=>hide(p.mesh));hide(pc.mesh);hide(pl.mesh);hide(beacon);hide(tArrow);
  if(prisoner&&prisoner.mesh)hide(prisoner.mesh);if(runner)hide(runner.mesh);for(const [,v] of iMeshes)hide(v.g);
  R.actors.forEach(a=>{
    if(a.kind==='p'){a.mesh=makePersonMesh(a.look);}
    else{a.mesh=makeCarMesh(a.color,a.model);if(a.plate){const pm=plateMesh(a.plate);const zr=Math.min(...a.mesh.userData.P.body.map(p=>p[0]));pm.position.set(0,.55,zr-.03);pm.rotation.y=Math.PI;a.mesh.userData.body.add(pm);const pf=plateMesh(a.plate);pf.position.set(0,.5,carGeo(a.model).len+.04);a.mesh.userData.body.add(pf);}}
    a.mesh.traverse(o=>{o.userData.actor=a;});a.mesh.visible=false;scene.add(a.mesh);
  });
  timeOverride=R.min;applyTime(R.min);
  cctv={cs,R,ci:0,t:0,playing:false,hidden};
  document.body.classList.add('cctv');$('#cctvui').hidden=false;
  $('#cTabs').innerHTML=R.cams.map((c,i)=>`<button data-c="${i}" aria-pressed="${i===0}">${c.name}</button>`).join('');
  $$('#cTabs button').forEach(b=>b.onclick=()=>cctvCam(+b.dataset.c));
  $('#cScrub').max=R.dur;cctvMsg('Play the footage, pause on a good frame, then tap a person or vehicle on screen to enhance it.','');
  cctvCam(0);
}
function cctvCam(i){
  const c=cctv;c.ci=i;c.t=0;cctvPlay(false);$('#cScrub').value=0;$$('#cTabs button').forEach((b,j)=>b.setAttribute('aria-pressed',j===i));
  const cam=c.R.cams[i];const L=intLights[0];
  if(cam.lamp){const p=W(c.R.d,cam.lamp[0],cam.lamp[1]);L.position.set(p.x,cam.lamp[2],p.z);L.intensity=4;L.distance=11;}else L.intensity=0;
  $('#cCam').textContent=cam.name.split(' · ')[0];
}
function cctvPlay(p){if(!cctv)return;cctv.playing=p;$('#cPlay').textContent=p?'Pause':'Play';if(p&&cctv.t>=cctv.R.dur-.05)cctv.t=0;}
function cctvMsg(h,k){const m=$('#cMsg');m.innerHTML=h;m.className='cmsg '+(k||'');}
function updateCCTV(dt){
  const c=cctv,R=c.R,d=R.d;
  if(c.playing){c.t+=dt;if(c.t>=R.dur){c.t=R.dur;cctvPlay(false);}$('#cScrub').value=c.t;}
  for(const a of R.actors){
    const s=actorAt(a,c.t);if(!s){a.mesh.visible=false;continue;}
    a.mesh.visible=true;const p=W(d,s.u,s.v);a.mesh.position.set(p.x,a.kind==='p'?.2:0,p.z);
    if(s.moving){const dx=d.tx*s.du+d.nx*s.dv,dz=d.tz*s.du+d.nz*s.dv;a.mesh.rotation.y=Math.atan2(dx,dz);}
    else if(a.kind==='c')a.mesh.rotation.y=Math.atan2(d.tx*a.face,d.tz*a.face);
    if(a.kind==='p'){if(s.moving)animWalk(a.mesh,c.t*7,.5);else pose(a.mesh,'idle',c.t);}
    else{const u=a.mesh.userData;u.wheels.forEach(w=>w.rotation.x=c.t*(s.moving?20:0));}
  }
  const cam=R.cams[c.ci];const p=W(d,cam.pos[0],cam.pos[1]),l=W(d,cam.look[0],cam.look[1]);
  camera.position.set(p.x,cam.pos[2],p.z);camera.lookAt(l.x,cam.look[2],l.z);camera.fov=64;camera.updateProjectionMatrix();
  const sec=Math.floor(c.t)+R.stampBase%60,mm=R.stampBase>=60?Math.floor(R.stampBase/60):0;
  $('#cStamp').textContent=`${R.min<16*60?'TODAY':'YESTERDAY'} ${R.stamp}${Math.floor(sec/60)+mm}:${String(sec%60).padStart(2,'0')}.${Math.floor((c.t%1)*10)}`;
  $('#cRec').style.visibility=c.playing&&(c.t*2%1)<.5?'visible':c.playing?'hidden':'visible';$('#cRec').textContent=c.playing?'● REC':'❚❚ PAUSED';
}
function cctvClick(e){
  if(!cctv)return;const r=$('#gl').getBoundingClientRect();
  const ndc=new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
  const rc=new THREE.Raycaster();rc.setFromCamera(ndc,camera);
  const vis=cctv.R.actors.filter(a=>a.mesh.visible).map(a=>a.mesh);
  const hit=rc.intersectObjects(vis,true)[0];
  if(!hit){cctvMsg('Nothing there to enhance. Tap directly on a person or vehicle.','');return;}
  const a=hit.object.userData.actor;const cam=cctv.R.cams[cctv.ci];const sp=W(cctv.R.d,cam.sharp[0],cam.sharp[1]);
  const sharp=Math.hypot(a.mesh.position.x-sp.x,a.mesh.position.z-sp.z)<cam.sharp[2];
  SFX.blip('click');
  if(a.clue){
    if(!sharp){cctvMsg(`<b>Too blurry.</b> ${esc(a.blur||'Scrub to a frame where they are in the clearest part of this camera\'s view, then tap again.')}`,'miss');return;}
    const isNew=addEv(cctv.cs,a.clue[0],a.clue[1],a.clue[2],'CCTV');if(isNew)SFX.blip('good');
    cctvMsg(`<b>ENHANCED.</b> ${esc(a.clue[2])} ${isNew?'<span class="chip ok">Logged</span>':'<span class="chip">Already logged</span>'}`,'hit');
  }else cctvMsg(esc(a.msg||'Nothing useful.'),'');
}
function cctvExit(){
  if(!cctv)return;const c=cctv;cctv=null;
  c.R.actors.forEach(a=>scene.remove(a.mesh));c.hidden.forEach(o=>o.visible=true);
  intLights[0].intensity=0;timeOverride=null;applyTime(curMin());
  document.body.classList.remove('cctv');$('#cctvui').hidden=true;camPos.init=false;
}

// ---------- interview room at the station
const IR={x:-460,z:-460,g:null};
function buildIRoom(){
  if(IR.g)return;const g=new THREE.Group();g.position.set(IR.x,0,IR.z);scene.add(g);
  const [tc,tg]=mkC(128,128);tg.fillStyle='#8d9290';tg.fillRect(0,0,128,128);tg.fillStyle='#7d8280';for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2)tg.fillRect(i*32,j*32,32,32);
  const ft=ctex(tc,true);ft.repeat.set(4,4);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(8,7),new THREE.MeshLambertMaterial({map:ft}));fl.rotation.x=-Math.PI/2;g.add(fl);
  const wm=lam('#6f7d76');
  [[0,1.6,-3.5,8,3.2,.2],[0,1.6,3.5,8,3.2,.2],[-4,1.6,0,.2,3.2,7],[4,1.6,0,.2,3.2,7]].forEach(([x,y,z,w,h,d])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wm);m.position.set(x,y,z);g.add(m);});
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(8,7),lam('#3a3f45'));ceil.rotation.x=Math.PI/2;ceil.position.y=3.2;g.add(ceil);
  const mir=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.4),std('#0b1118',.05,.95));mir.position.set(3.88,1.65,0);mir.rotation.y=-Math.PI/2;g.add(mir);
  const door=new THREE.Mesh(new THREE.PlaneGeometry(1.1,2.2),lam('#3d4651'));door.position.set(-2.2,1.1,-3.38);g.add(door);
  const tm=lam('#5b5e63');const top=new THREE.Mesh(new THREE.BoxGeometry(1.9,.07,1.05),tm);top.position.y=.76;g.add(top);
  for(const [x,z] of [[-.85,-.45],[.85,-.45],[-.85,.45],[.85,.45]]){const l=new THREE.Mesh(new THREE.BoxGeometry(.06,.74,.06),tm);l.position.set(x,.37,z);g.add(l);}
  for(const s of [-1,1]){const seat=new THREE.Mesh(new THREE.BoxGeometry(.5,.06,.48),lam('#2d3036'));seat.position.set(0,.47,s*.98);g.add(seat);const back=new THREE.Mesh(new THREE.BoxGeometry(.5,.6,.05),lam('#2d3036'));back.position.set(0,.8,s*1.22);g.add(back);}
  const file=new THREE.Mesh(new THREE.BoxGeometry(.32,.02,.42),lam('#d8c690'));file.position.set(.35,.8,-.2);file.rotation.y=.2;g.add(file);
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.045,.04,.11,10),lam('#e8e4da'));cup.position.set(-.55,.85,-.25);g.add(cup);
  const shade=new THREE.Mesh(new THREE.ConeGeometry(.36,.28,18,1,true),new THREE.MeshLambertMaterial({color:col('#2a2d33'),side:THREE.DoubleSide}));shade.position.y=2.45;g.add(shade);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),new THREE.MeshBasicMaterial({color:0xffffff}));bulb.position.y=2.33;g.add(bulb);
  const cord=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,.6,4),lam('#111'));cord.position.y=2.9;g.add(cord);
  IR.g=g;
}
function interviewRoom(cs){
  const ids=cs.custody.filter(id=>!cs.cracked[id]&&!cs.lawyered[id]&&cs.scripts[id]);
  if(!ids.length){toast('Nobody in custody needs questioning right now.');return;}
  const el=openModal(`<header><div><div class="eyebrow">Precinct 9 · Interview room 2</div><h2>Who do you want to question?</h2></div><button class="x" aria-label="Close">✕</button></header>
    <div class="choices">${ids.map(id=>{const p=person(cs,id);return `<button class="choice" data-q="${id}"><b>${esc(p.name)}</b><span>${esc(cs.roles.find(r=>r[0]===p)[1])} · 20 min</span></button>`;}).join('')}</div>`);
  $('.x',el).onclick=closeModal;
  $$('[data-q]',el).forEach(b=>b.onclick=()=>{closeModal();if(!spend(cs,20))return;interrogate3D(cs,person(cs,b.dataset.q));});
}
function interrogate3D(cs,p){
  buildIRoom();const S2=cs.scripts[p.id];
  const sus=makePersonMesh(lookOf(p));sus.position.set(IR.x,0,IR.z+.98);sus.rotation.y=Math.PI;scene.add(sus);
  const off=makePersonMesh(OFFICER_LOOK);off.position.set(IR.x,0,IR.z-.98);scene.add(off);
  const L=intLights[0];L.position.set(IR.x,2.25,IR.z);L.intensity=3.2;L.distance=10;
  const st={mood:'smug',patience:3,over:false,log:[['them',p.name,S2.alibi]],gesture:0};
  const CAMS={wide:{pos:V3(IR.x-.62,1.5,IR.z-1.85),look:V3(IR.x,1.12,IR.z+.98),fov:44},close:{pos:V3(IR.x-.25,1.35,IR.z-.55),look:V3(IR.x,1.22,IR.z+.98),fov:30}};
  startCine(Object.assign({snap:true},CAMS.wide,{update(dt){
    const m=st.mood;st.gesture=Math.max(0,st.gesture-dt);
    pose(sus,m==='crack'?['sit','slump']:m==='angry'?['sit','lean']:m==='talk'?['sit','table','talk']:['sit','crossed'],this.t);
    sus.userData.j.head.rotation.y=Math.sin(this.t*.7)*(m==='smug'?.25:.08);
    pose(off,st.gesture>0?['sit','table','point']:['sit','table'],this.t);
  },cleanup(){scene.remove(sus,off);L.intensity=0;$('#dlg').className='';}}));
  const shot=k=>{Object.assign(cine,{pos:CAMS[k].pos.clone(),look:CAMS[k].look.clone(),fov:CAMS[k].fov});};
  const render=()=>{
    const d=$('#dlg');d.hidden=false;d.className='iv';
    d.innerHTML=`<div class="who">Interview room 2 · ${esc(p.name)} <span class="patience" aria-label="Patience">${[0,1,2].map(i=>`<i class="${i<st.patience?'':'off'}"></i>`).join('')}</span></div>
      <div class="ivlog" id="ivlog">${st.log.map(([w,n,t])=>w==='sys'?`<div class="l sys">${esc(t)}</div>`:`<div class="l ${w}"><b>${esc(n)}</b>${esc(t)}</div>`).join('')}</div>
      ${st.over?`<div class="row end"><button class="btn" id="ivDone">Leave the room</button></div>`:`<div class="eyebrow" style="margin-bottom:6px">Present evidence</div>
      <div class="evbtns">${cs.evidence.length?cs.evidence.map((e,i)=>`<button class="btn ghost sm" data-e="${i}">${esc(e.title)}</button>`).join(''):'<span class="muted">You have no evidence yet.</span>'}</div>
      <div class="row" style="margin-top:10px"><button class="btn ghost sm" id="ivDeal">Offer a deal</button><button class="btn ghost sm" id="ivLeave">End the interview</button></div>`}`;
    const lg=$('#ivlog');lg.scrollTop=lg.scrollHeight;
    if(st.over){$('#ivDone').onclick=endCine;return;}
    $$('[data-e]',d).forEach(b=>b.onclick=()=>present(cs.evidence[+b.dataset.e]));
    $('#ivDeal').onclick=deal;$('#ivLeave').onclick=endCine;
  };
  const crack=()=>{st.mood='crack';shot('close');S2.crack.forEach(l=>st.log.push(['them',p.name,l]));st.log.push(['sys','','They cracked. New evidence logged.']);cs.cracked[p.id]=true;S2.onCrack();gainXP(30);SFX.blip('good');st.over=true;setTimeout(()=>{if(cine){st.mood='talk';shot('wide');}},1800);render();};
  const lose=()=>{st.patience--;st.mood='angry';shot('close');setTimeout(()=>{if(cine&&!st.over){st.mood='smug';shot('wide');}},1400);
    if(st.patience<=0){st.log.push(['them',p.name,'I\'m done talking. I want my lawyer.']);st.log.push(['sys','','Interview over. You\'ll have to find the rest another way.']);cs.lawyered[p.id]=true;st.over=true;SFX.blip('bad');}render();};
  const present=e=>{st.gesture=1.2;st.log.push(['you','You',`(slides it across the table) ${e.title}. ${e.detail}`]);if(S2.correct.includes(e.id))crack();else{st.log.push(['them',p.name,pick(DENY)]);lose();}};
  const deal=()=>{st.log.push(['you','You','Help yourself. Tell me about the others and I\'ll tell the DA you cooperated.']);
    const partner=cs.custody.some(id=>id!==p.id&&cs.cracked[id]);
    if(partner&&Math.random()<.6){st.log.push(['them',p.name,'...Your partner already talked, didn\'t they? Fine.']);crack();}
    else{st.log.push(['them',p.name,partner?'Nice try. I\'m not saying a word.':'Deal? You\'ve got nothing on anyone. Why would I deal?']);lose();}};
  render();
}
const DENY=['So what? That doesn\'t put me anywhere.','Is that supposed to scare me?','Never seen that before in my life.','You\'ve got nothing, officer.','That proves nothing and you know it.'];

// ---------- raids: clear a 3D building room by room
const RB={x:-460,z:300};
function raidBrief(cs){
  const kid=cs.type==='kidnap',intel=!!cs.flags.backIntel;const place=kid?cs.safe.address:cs.hide.place;
  const door=kid?cs.safe.door:LOC.motels[cs.hide.place];
  const sg=makePersonMesh(SWAT_LOOK);sg.position.set(door.x+door.nx*3.2+(door.nz||0)*1.5,.2,door.z+door.nz*3.2-(door.nx||0)*1.5);scene.add(sg);
  const lines=[{name:'Sgt. Okoye · SWAT',text:`Team's stacked up at ${place}. ${kid?cs.victim.first+' is inside, plus whoever is guarding them.':'"'+cs.C.nick+'" is inside with at least two of his crew.'} Your call: front or back?`}];
  if(intel)lines.push(you(kid?'Our informant says they watch the street. The back door is never locked.':'He always sits facing the front door. We go in the back.'));
  talkTo(sg,lines,[{label:'Breach the front'},{label:'Go round the back'},{label:'Not yet',cls:'ghost'}],ch=>{
    scene.remove(sg);if(ch.label==='Not yet')return;raidEnter(cs,ch.label==='Go round the back'?'back':'front');
  });
}
function buildRaidLevel(){
  const g=new THREE.Group();scene.add(g);const B=[];const ox=RB.x,oz=RB.z,H=2.7,T=.2;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,50),lam('#55575c'));ground.rotation.x=-Math.PI/2;ground.position.set(ox+10.5,.01,oz+6);g.add(ground);
  const floors=['#8a6a4c','#6f7f8f','#9b8f7a','#7a5c55','#8b8f7c','#6c5f78'];
  for(let c=0;c<3;c++)for(let r=0;r<2;r++){const f=new THREE.Mesh(new THREE.PlaneGeometry(7,6),lam(floors[c*2+r]));f.rotation.x=-Math.PI/2;f.position.set(ox+c*7+3.5,.03,oz+r*6+3);f.receiveShadow=QUAL.shadows;g.add(f);}
  const wm=lam('#d8d0c0');
  const seg=(x0,z0,x1,z1)=>{const w=Math.abs(x1-x0),d=Math.abs(z1-z0);const m=sh(new THREE.Mesh(new THREE.BoxGeometry(Math.max(w,T),H,Math.max(d,T)),wm));m.position.set((x0+x1)/2,H/2,(z0+z1)/2);g.add(m);
    B.push({x0:Math.min(x0,x1)-T/2,x1:Math.max(x0,x1)+T/2,z0:Math.min(z0,z1)-T/2,z1:Math.max(z0,z1)+T/2});};
  const wall=(x0,z0,x1,z1,gaps)=>{const horiz=z0===z1;const a0=horiz?x0:z0,a1=horiz?x1:z1;let cur=a0;
    gaps.slice().sort((a,b)=>a-b).forEach(gp=>{if(gp-.8>cur){horiz?seg(cur,z0,gp-.8,z0):seg(x0,cur,x0,gp-.8);}cur=gp+.8;});
    if(cur<a1)horiz?seg(cur,z0,a1,z0):seg(x0,cur,x0,a1);};
  const front={x:ox+10.5,z:oz},back={x:ox+17.5,z:oz+12};
  wall(ox,oz,ox+21,oz,[front.x]);wall(ox,oz+12,ox+21,oz+12,[back.x]);wall(ox,oz,ox,oz+12,[]);wall(ox+21,oz,ox+21,oz+12,[]);
  wall(ox+7,oz,ox+7,oz+12,[oz+3,oz+9]);wall(ox+14,oz,ox+14,oz+12,[oz+3,oz+9]);wall(ox,oz+6,ox+21,oz+6,[ox+3.5,ox+17.5]);
  const FURN=[[2,.55,1.4,'#e8e4dc'],[2,.85,.9,'#5a4a6e'],[1.2,.75,1.2,'#7a5a3a'],[1.2,1,.5,'#4a3a2a'],[2,.95,.6,'#9a9a96'],[1.4,1.8,.45,'#3f4a5a']];
  for(let c=0;c<3;c++)for(let r=0;r<2;r++){
    const corners=shuffle([[1,1],[-1,1],[1,-1],[-1,-1]]).slice(0,2);
    corners.forEach(([sx,sz])=>{const [w,h,d,cl]=pick(FURN);const x=ox+c*7+3.5+sx*(3.5-.25-w/2),z=oz+r*6+3+sz*(3-.25-d/2);
      const m=sh(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),lam(cl)));m.position.set(x,h/2,z);g.add(m);B.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});});
  }
  const ext=sh(new THREE.Mesh(new THREE.BoxGeometry(21.6,.25,12.6),lam('#3c3f45')),false,false);ext.position.set(ox+10.5,H+.12,oz+6);ext.visible=false;g.add(ext);
  const roomOf=(x,z)=>{const c=Math.floor((x-ox)/7),r=Math.floor((z-oz)/6);return (c<0||c>2||r<0||r>1)?null:[c,r];};
  const links=[];for(let r=0;r<2;r++)for(let c=0;c<2;c++)links.push([[c,r],[c+1,r],{x:ox+7*(c+1),z:oz+3+6*r}]);
  for(const c of [0,2])links.push([[c,0],[c,1],{x:ox+3.5+7*c,z:oz+6}]);
  return {g,B,front,back,roomOf,links,ox,oz,exits:{front:{room:[1,0],pt:front,out:{x:front.x,z:oz-3}},back:{room:[2,1],pt:back,out:{x:back.x,z:oz+15}}}};
}
function raidPath(L,from,exit){
  const key=r=>r.join(',');const start=L.roomOf(from.x,from.z);if(!start)return [L.exits[exit].out];
  const goal=key(L.exits[exit].room);const prev={[key(start)]:null};const q=[start];
  while(q.length){const r=q.shift();if(key(r)===goal)break;for(const [a,b,pt] of L.links){let n=null;if(key(a)===key(r))n=b;else if(key(b)===key(r))n=a;if(n&&!(key(n) in prev)){prev[key(n)]={r,pt};q.push(n);}}}
  const pts=[];let k=goal;while(prev[k]){pts.unshift(prev[k].pt);k=key(prev[k].r);}
  pts.push(L.exits[exit].pt,L.exits[exit].out);return pts;
}
function raidEnter(cs,entry){
  const kid=cs.type==='kidnap',intel=!!cs.flags.backIntel;let note,alert=false;
  if(entry==='back'&&!intel){entry='front';alert=true;note='The back door is barricaded! The team swings round to the front, and they heard you coming.';}
  else if(entry==='back')note='Back door unlocked. You\'re inside before they notice.';
  else{alert=true;note='Front door breached! Go, go, go!';}
  const L=buildRaidLevel();
  const rooms=[];for(let c=0;c<3;c++)for(let r=0;r<2;r++)rooms.push([c,r]);
  const entryRoom=entry==='front'?'1,0':'2,1';
  const far=rooms.filter(r=>r.join(',')!==entryRoom).sort((a,b)=>{const e=entry==='front'?L.front:L.back;const ca={x:L.ox+a[0]*7+3.5,z:L.oz+a[1]*6+3},cb={x:L.ox+b[0]*7+3.5,z:L.oz+b[1]*6+3};return Math.hypot(cb.x-e.x,cb.z-e.z)-Math.hypot(ca.x-e.x,ca.z-e.z);});
  const spot=r=>({x:L.ox+r[0]*7+3.5+rnd(-1.2,1.2),z:L.oz+r[1]*6+3+rnd(-1,1)});
  const actors=[];const add=(kind,look,room,extra={})=>{const p=spot(room);const m=makePersonMesh(look);m.position.set(p.x,.03,p.z);m.rotation.y=rnd(0,6.28);scene.add(m);
    const mk=new THREE.Mesh(GEO.arrow,new THREE.MeshBasicMaterial({color:0xff4d5e}));mk.scale.setScalar(.45);mk.visible=false;scene.add(mk);
    const a=Object.assign({kind,mesh:m,mk,x:p.x,z:p.z,h:m.rotation.y,state:kind==='kid'?'hostage':'idle',ph:0,path:null},extra);actors.push(a);return a;};
  const boss=add('sus',Object.assign(lookOf(cs.C),{}),far[0],{boss:true,p:cs.C});
  const henchLook=()=>({shirt:pick(['#2a2a30','#3a2a24','#23314a']),pants:'#1b1c20',masked:true,skin:pick(SKIN)});
  add('sus',henchLook(),far[1]);if(!kid)add('sus',henchLook(),far[2]);
  if(kid){const k=add('kid',{shirt:'#c9a227',skin:SKIN[1],hair:'#5a3a22',kid:true},far[1]);k.mesh.scale.setScalar(.62);}
  else add('civ',randLook(),far[3]);
  const swat=[0,1].map(i=>{const m=makePersonMesh(SWAT_LOOK);scene.add(m);return m;});
  const spawn=entry==='front'?{x:L.front.x,z:L.oz-1.4,h:0}:{x:L.back.x,z:L.oz+13.4,h:Math.PI};
  swat.forEach((m,i)=>{m.position.set(spawn.x+(i?1.3:-1.3),.03,spawn.z+(entry==='front'?-1:1));m.rotation.y=spawn.h;pose(m,'point');});
  raidS={cs,kid,L,actors,swat,boss,time:80,mistakes:0,alert,entry,t:0,saved:{x:pl.x,z:pl.z,h:pl.h},done:false};
  // who is armed: the finale boss always is
  actors.filter(a=>a.kind==='sus').forEach(a=>cbArm(a,a.boss?(cs.type==='finale'?'gun':pick(['gun','knife','none'])):pick(['none','none','knife','knife','gun'])));
  inCar=false;pc.vx=pc.vz=0;pl.x=spawn.x;pl.z=spawn.z;pl.h=spawn.h;pl.mesh.visible=true;camPos.init=false;
  document.body.classList.add('raid');$('#raidhud').hidden=false;SFX.blip('breach');toast(note,alert?'bad':'good');
}
function raidNearest(){
  const R=raidS;let best=null,bd=1.8;
  for(const a of R.actors){if(a.state==='cuffed'||a.state==='cuffing'||a.state==='escaped'||a.state==='rescued')continue;const d=Math.hypot(a.x-pl.x,a.z-pl.z);if(d<bd){bd=d;best=a;}}
  return best;
}
function raidInteract(){
  const R=raidS;if(!R||R.done)return;const a=raidNearest();if(!a)return;
  if(a.kind==='sus'&&a.state==='fight'){toast('Subdue them first: baton, spray or taser (Space). Or shout (G).','bad');return;}
  if(a.kind==='sus'){const w=a.wounded,kn=a.state==='down'||a.state==='wounded'||a.state==='stunned';a.state='cuffing';cbNoLaser(a);cbHandItem(a.mesh,null);a.mk.visible=false;
    cuffScene(a.mesh,a.x,a.z,{quick:true,kneel:kn},()=>{a.state='cuffed';toast((a.boss?`${a.p.name} is in cuffs.`:'Suspect restrained.')+(w?' Paramedics are on the way.':''),'good');gainXP(a.boss?0:15);if(raidS)raidCheck();});return;}
  else if(a.kind==='civ'){R.mistakes++;SFX.blip('bad');toast(`That's a civilian! Hands off. Mistakes ${R.mistakes}/3.`,'bad');a.state='rescued';}
  else if(a.kind==='kid'){a.state='rescued';SFX.blip('good');toast(`${R.cs.victim.first}: "Are you a real police officer?" You've got the child. Clear the rest.`,'good');}
  raidCheck();
}
function updateRaid(dt){
  const R=raidS,L=R.L;R.t+=dt;if(!R.done)R.time-=dt;
  // player: screen-relative movement with a cutaway camera
  const P=padScreen();
  if(P){const sp=(P.run?7.2:4.2)*P.m;pl.x+=P.mx*sp*dt;pl.z+=P.mz*sp*dt;pl.h=Math.atan2(P.mx,P.mz);pl.phase+=dt*sp*1.9;animWalk(pl.mesh,pl.phase,P.run?.75:.45,P.run);}
  else pose(pl.mesh,'point',R.t);
  pushOut(pl,.4,L.B);pl.mesh.position.set(pl.x,.03,pl.z);pl.mesh.rotation.y=pl.h;
  for(const a of R.actors){
    const d=Math.hypot(a.x-pl.x,a.z-pl.z);
    if(a.kind==='sus'&&(FIGHT_ST.has(a.state)||a.state==='comply'&&a.wasFight)){
      if(!R.done)cbFoe(a,dt,L.B);else{cbNoLaser(a);pose(a.mesh,a.state==='down'||a.state==='wounded'?'down':'idle');}
      if(a.state==='comply')a.wasFight=true;
      const cuffMe=a.state==='down'||a.state==='stunned'||a.state==='wounded'||a.state==='comply';a.mk.visible=cuffMe||a.state==='fight';
      if(a.mk.visible){a.mk.position.set(a.x,(a.state==='down'||a.state==='wounded'?1.1:2.5)+Math.sin(R.t*4)*.1,a.z);a.mk.material.color.set(a.state==='fight'?'#ff4d5e':'#f4b740');a.mk.rotation.y=R.t*2;}
      continue;
    }
    if(a.state==='idle'){
      const sameRoom=String(L.roomOf(a.x,a.z))===String(L.roomOf(pl.x,pl.z));
      if((sameRoom&&d<7)||d<3.5||(R.alert&&R.t>4&&d<11)){
        if(a.kind==='sus'){const pc2=a.boss?(R.entry==='back'?.4:.2):(R.entry==='back'?.75:.45);
          if(Math.random()<pc2){a.state='comply';a.arm='none';cbHandItem(a.mesh,null);toast(a.boss?`"Okay, okay!" ${a.p.first} puts his hands up.`:'"Don\'t shoot!" A suspect gives up.');}
          else if(a.arm!=='none'||Math.random()<.4){cbStartFight(a);toast(a.arm==='gun'?(a.boss?`${a.p.first} has a gun! Break line of sight and stop him.`:'Gun! Get behind a wall, watch for the red laser.'):a.arm==='knife'?'He has a knife! Spray or taser, keep your distance.':'A suspect squares up to fight!','bad');}
          else{raidFlee(a);toast(a.boss?`${a.p.first} is running for the ${a.exit} door!`:'A suspect is running!','bad');}}
        else if(a.kind==='civ')a.state='scared';
      }
      if(a.kind==='kid')pose(a.mesh,'floor',R.t);else pose(a.mesh,a.state==='idle'?'idle':'handsUp',R.t+a.x);
    }
    if(a.state==='hostage')pose(a.mesh,'floor',R.t);
    if(a.state==='comply'||a.state==='scared'){pose(a.mesh,'handsUp');a.mesh.rotation.y=Math.atan2(pl.x-a.x,pl.z-a.z);}
    if(a.state==='flee'&&a.path){
      const tp=a.path[0];const dx=tp.x-a.x,dz=tp.z-a.z,dd=Math.hypot(dx,dz);
      if(dd<.35){a.path.shift();if(!a.path.length){a.state='escaped';a.mesh.visible=false;a.mk.visible=false;toast(a.boss?`${a.p.first} got out of the building!`:'A suspect escaped.','bad');raidCheck();continue;}}
      else{const sp=4.7;a.x+=dx/dd*sp*dt;a.z+=dz/dd*sp*dt;a.h=Math.atan2(dx,dz);a.ph+=dt*sp*1.9;animWalk(a.mesh,a.ph,.8,true);a.mesh.rotation.y=a.h;}
    }
    if(a.state==='cuffed'){pose(a.mesh,'cuffed');}
    if(a.state==='rescued'&&a.kind==='kid'){const tx=pl.x-Math.sin(pl.h)*1.1,tz=pl.z-Math.cos(pl.h)*1.1,dx=tx-a.x,dz=tz-a.z,dd=Math.hypot(dx,dz);if(dd>.4){a.x+=dx/dd*Math.min(dd*2.5,7)*dt;a.z+=dz/dd*Math.min(dd*2.5,7)*dt;a.ph+=dt*8;animWalk(a.mesh,a.ph,.5);a.mesh.rotation.y=Math.atan2(dx,dz);}else pose(a.mesh,'idle',R.t);}
    if(a.state==='rescued'&&a.kind==='civ')pose(a.mesh,'handsUp');
    a.mesh.position.set(a.x,.03,a.z);
    const showMk=a.state==='flee'||a.state==='comply'||a.state==='hostage';
    a.mk.visible=showMk;if(showMk){a.mk.position.set(a.x,(a.kind==='kid'?1.6:2.5)+Math.sin(R.t*4)*.1,a.z);a.mk.material.color.set(a.state==='flee'?'#ff4d5e':a.state==='hostage'?'#47cf8b':'#f4b740');a.mk.rotation.y=R.t*2;}
  }
  const susL=R.actors.filter(a=>a.kind==='sus');const cuffedN=susL.filter(a=>a.state==='cuffed').length;
  const kidA=R.actors.find(a=>a.kind==='kid');
  $('#raidhud').innerHTML=`<span>TIME <b>${Math.max(0,Math.ceil(R.time))}s</b></span><span>SUSPECTS <b>${cuffedN}/${susL.length}</b> cuffed</span>${kidA?`<span>CHILD <b>${kidA.state==='rescued'?'SAFE':'NOT FOUND'}</b></span>`:''}<span>MISTAKES <b>${R.mistakes}/3</b></span><span>HEALTH <b>${Math.round(CB.hp)}</b></span>`;
  const n=raidNearest();const pr=$('#prompt');
  if(n&&!R.done){pr.hidden=false;pr.innerHTML=n.kind==='sus'&&n.state==='fight'?'<kbd>Space</kbd>Subdue them first':`<kbd>E</kbd>${n.kind==='sus'?(n.state==='flee'?'Tackle and cuff':n.state==='wounded'?'Cuff and call paramedics':'Cuff the suspect'):n.kind==='kid'?'Get the child':'Restrain this person'}`;}else pr.hidden=true;
  if(!R.done&&(R.time<=0||R.mistakes>=3))raidFinish(false);
  if(R.done){R.outT-=dt;if(R.outT<=0)raidLeave();}
}
function raidFlee(a){const L=raidS.L;a.state='flee';a.exit=Math.hypot(L.front.x-pl.x,L.front.z-pl.z)>Math.hypot(L.back.x-pl.x,L.back.z-pl.z)?'front':'back';a.path=raidPath(L,a,a.exit);}
function raidCheck(){
  const R=raidS;if(R.done)return;
  const susL=R.actors.filter(a=>a.kind==='sus');const resolved=susL.every(a=>a.state==='cuffed'||a.state==='escaped');
  const kidA=R.actors.find(a=>a.kind==='kid');
  if(resolved&&(!kidA||kidA.state==='rescued'))raidFinish(true);
}
function raidFinish(ok){const R=raidS;R.done=true;R.ok=ok;R.outT=1.8;$('#prompt').hidden=true;toast(ok?'Building clear!':R.mistakes>=3?'Too many mistakes. The commander pulls the team out.':'Out of time. The team pulls back.',ok?'good':'bad');}
function raidCleanup(){
  const R=raidS;if(!R)return;raidS=null;
  scene.remove(R.L.g);R.actors.forEach(a=>{scene.remove(a.mesh);scene.remove(a.mk);if(a.laser)scene.remove(a.laser);});R.swat.forEach(m=>scene.remove(m));
  document.body.classList.remove('raid');$('#raidhud').hidden=true;$('#prompt').hidden=true;camPos.init=false;
  pl.x=R.saved.x;pl.z=R.saved.z;pl.h=R.saved.h;pl.mesh.position.set(pl.x,.2,pl.z);
}
function raidLeave(){
  const R=raidS,cs=R.cs,kid=R.kid;raidCleanup();if(cs.ended)return;
  const place=kid?cs.safe.address:cs.hide.place;
  const henchmen=R.actors.filter(a=>a.kind==='sus'&&!a.boss&&a.state==='cuffed').length;
  if(henchmen)clog(cs,`${henchmen} accomplice${henchmen>1?'s':''} arrested in the raid.`);
  const bossCuffed=R.boss.state==='cuffed';const kidA=R.actors.find(a=>a.kind==='kid');
  if(bossCuffed){cs.custody.push(cs.C.id);cs.named[cs.C.id]=true;career.arrests++;gainXP(40);}
  if(kid){
    if(kidA&&kidA.state==='rescued'){cs.flags.rescued=true;clog(cs,`${cs.victim.first} rescued from ${place}.${bossCuffed?` ${cs.C.name} arrested.`:''}`);addEv(cs,'rescued',`${cs.victim.first} rescued`,`Found in ${place}. ${bossCuffed?cs.C.name+' was arrested at the scene.':'The guard got away.'}`,'Raid');toast(`${cs.victim.first} is safe and on the way home! Close the case from the MDT, or keep hunting the crew.`,'good');SFX.blip('good');gps=null;}
    else{clog(cs,'The raid stalled. A negotiator spent 90 minutes talking the guard down.');toast('The raid stalled. 90 minutes lost. Try again.','bad');spend(cs,90);}
  }else{
    if(bossCuffed){cs.flags.loot=true;clog(cs,`${cs.C.name} ("${cs.C.nick}") arrested at the ${place}. $27,900 recovered.`);addEv(cs,'loot','Cash recovered','$27,900 of the stolen cash was in a gym bag under the motel bed.','Raid');toast(`"${cs.C.nick}" is in custody. Close the case from the MDT when ready.`,'good');SFX.blip('good');gps=null;}
    else{clog(cs,`${cs.C.name} escaped the raid and ran for the ${lower(cs.C.car.color.n)} ${lower(cs.C.car.model)}.`);
      startCarChase(cs,cs.C,LOC.motels[cs.hide.place],()=>{cs.flags.hideout=false;clog(cs,`"${cs.C.nick}" escaped. The ${place} is burned. Monitor the bank card again.`);toast('They escaped. Track them again from the MDT.','bad');});}
  }
}
function raidCam(dt){
  const t={x:pl.x,y:10.5,z:pl.z-7};const k=camPos.init?1-Math.exp(-dt*6):1;camPos.init=true;
  camPos.x+=(t.x-camPos.x)*k;camPos.y+=(t.y-camPos.y)*k;camPos.z+=(t.z-camPos.z)*k;
  camera.position.set(camPos.x,camPos.y,camPos.z);camera.lookAt(pl.x,0,pl.z+1);camera.fov=52;camera.updateProjectionMatrix();
}
