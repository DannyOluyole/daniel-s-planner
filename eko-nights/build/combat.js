// ================= combat: arrest-first use of force
// Four tools, from least to most force. Suspects who fight must be subdued (down or stunned) before they can be cuffed.
// Shouting a warning first often ends it without force. The sidearm wounds, never kills, and every shot is reviewed:
// firing at someone who is not a deadly threat costs public trust and opens an inquiry.
const TOOLS=[
  {id:'baton',name:'BATON',range:1.9,cone:1.2,cd:.55},
  {id:'spray',name:'SPRAY',range:4.2,cone:.62,cd:1.4},
  {id:'taser',name:'TASER',range:9,cone:.55,cd:2.4},
  {id:'gun',name:'SIDEARM',range:24,cone:.4,cd:.45},
];
const CB={tool:2,cd:0,hp:100,hurtT:99,foes:[],fx:[],shoutCd:0,inc:null,incT:90,swingT:0,swing:'',ring:null,hand:null,ui:{}};
const FIGHT_ST=new Set(['fight','stunned','down','wounded','run']);
// LOS: does the segment a→b cross any box?
function cbClear(ax,az,bx,bz,B){
  for(const b of B){
    let t0=0,t1=1;const dx=bx-ax,dz=bz-az;let ok=true;
    for(const [p,d,lo,hi] of [[ax,dx,b.x0,b.x1],[az,dz,b.z0,b.z1]]){
      if(Math.abs(d)<1e-9){if(p<lo||p>hi){ok=false;break;}continue;}
      let u0=(lo-p)/d,u1=(hi-p)/d;if(u0>u1)[u0,u1]=[u1,u0];t0=Math.max(t0,u0);t1=Math.min(t1,u1);if(t0>t1){ok=false;break;}
    }
    if(ok&&t1>.02&&t0<.98)return false;
  }
  return true;
}
function cbBoxes(){return raidS?raidS.L.B:BOXES.filter(b=>Math.abs((b.x0+b.x1)/2-pl.x)<60&&Math.abs((b.z0+b.z1)/2-pl.z)<60);}
function cbFoes(){return raidS?raidS.actors.filter(a=>a.kind==='sus'):CB.foes;}
function cbY(){return raidS||insideS?.03:.2;}
// a weapon in the right hand
function cbHandItem(g,kind){
  const el=g.userData.j.arms[1].el;if(g.userData.item){el.remove(g.userData.item);g.userData.item=null;}
  if(!kind||kind==='none'||kind==='spray')return;
  const M={knife:['#c9ccd2',.035,.03,.26],gun:['#16171a',.05,.12,.17],baton:['#111214',.04,.04,.5],taser:['#e2c21c',.05,.1,.15]}[kind];if(!M)return;
  const m=new THREE.Mesh(new THREE.BoxGeometry(M[1],M[2],M[3]),lam(M[0]));m.position.set(0,-.33,.08+M[3]/2-.05);el.add(m);g.userData.item=m;
}
function cbArm(a,arm){a.arm=arm;a.resist=a.boss?4:3;a.atkCd=rnd(.6,1.4);a.aimT=0;a.stag=0;cbHandItem(a.mesh,arm);}
function cbStartFight(a){a.state='fight';a.atkCd=Math.max(a.atkCd||0,.7);}
function cbPlayerItem(){const id=TOOLS[CB.tool].id;if(CB.hand!==id){CB.hand=id;cbHandItem(pl.mesh,id);}}

// ---------- the player's tools
function cbCan(){return started&&!inCar&&!cine&&!DLG&&!cctv&&!insideS&&!blockingModal();}
function cbSelect(i){CB.tool=clamp(i,0,TOOLS.length-1);CB.ui.tool=null;SFX.blip('click');cbPlayerItem();}
function cbCycle(){cbSelect((CB.tool+1)%TOOLS.length);}
function cbTarget(T){
  const B=cbBoxes();let best=null,bs=1e9;
  for(const a of cbFoes()){
    if(!['fight','flee','run','stunned'].includes(a.state))continue;
    if(T.id==='gun'&&a.state==='stunned')continue;
    const dx=a.x-pl.x,dz=a.z-pl.z,d=Math.hypot(dx,dz);if(d>T.range)continue;
    const off=Math.abs(angDiff(Math.atan2(dx,dz),pl.h));
    // phones: anyone close enough counts, the officer turns to face them
    if(off>T.cone&&d>T.range*.75)continue;
    if(d>1.5&&!cbClear(pl.x,pl.z,a.x,a.z,B))continue;
    const sc=d+off*3;if(sc<bs){bs=sc;best=a;}
  }
  return best;
}
function cbUse(){
  if(!cbCan()||CB.cd>0)return;
  const T=TOOLS[CB.tool];cbPlayerItem();CB.cd=T.cd;
  const a=cbTarget(T);
  if(a)pl.h=Math.atan2(a.x-pl.x,a.z-pl.z);
  if(T.id==='baton'){
    CB.swing='strike';CB.swingT=.28;
    if(!a){SFX.blip('whoosh');return;}
    SFX.blip('thwack');a.resist--;a.stag=.55;CB.force=true;
    if(a.resist<=0||a.state==='stunned'||a.state==='flee'||a.state==='run')cbDown(a,3.6,'The suspect goes down.');
  }else if(T.id==='spray'){
    CB.swing='aim';CB.swingT=.45;SFX.blip('spray');cbPuff();
    let n=0;for(const f of cbFoes()){if(!['fight','flee','run'].includes(f.state))continue;const dx=f.x-pl.x,dz=f.z-pl.z,d=Math.hypot(dx,dz);
      if(d<T.range&&Math.abs(angDiff(Math.atan2(dx,dz),pl.h))<T.cone){f.prev=f.state==='run'?'run':'fight';f.state='stunned';f.t=3.6;n++;}}
    if(n)CB.force=true;
  }else if(T.id==='taser'){
    CB.swing='aim';CB.swingT=.45;
    if(!a){SFX.blip('click');toast('Taser: no one in range. Get within 9 m and face them.');CB.cd=.4;return;}
    SFX.blip('zap');cbWire(a);CB.force=true;cbDown(a,4.5,'Taser hit! The suspect drops.');
  }else{
    if(!a){CB.cd=.3;toast('No clear target. Hold your fire.');return;}
    CB.swing='aim';CB.swingT=.5;SFX.blip('shot');cbFlash();flashT=.08;shake=.25;CB.force=true;CB.shot=true;
    const d=Math.hypot(a.x-pl.x,a.z-pl.z);
    const justified=a.state==='fight'&&(a.arm==='gun'||(a.arm==='knife'&&d<6));
    a.state='wounded';a.wounded=true;a.aimT=0;cbHandItem(a.mesh,null);
    if(justified)toast('Suspect wounded. Paramedics called. The shooting will be reviewed, but they were armed and attacking.','bad');
    else{career.inquiries=(career.inquiries||0)+1;trustDelta(-12,'Unjustified shooting: they were no deadly threat. An inquiry has been opened.');if(raidS)raidS.mistakes++;CB.bad=true;}
  }
}
function cbDown(a,t,msg){a.state='down';a.t=t;a.aimT=0;a.stag=0;if(msg&&!a.toldDown){a.toldDown=true;toast(msg+' Cuff them now (E).','good');}}
// shout a warning: many give up without any force at all
function cbShout(){
  if(!cbCan()||CB.shoutCd>0)return;CB.shoutCd=2.5;SFX.blip('shout');
  toast('"Police! Drop it and get on the ground!"');
  const gun=TOOLS[CB.tool].id==='gun';let gave=0;
  for(const a of cbFoes()){
    if(!['fight','flee','run','idle'].includes(a.state)||a.kind!=='sus'&&!a.street)continue;
    if(Math.hypot(a.x-pl.x,a.z-pl.z)>14||(a.shoutAt&&tAcc-a.shoutAt<4))continue;a.shoutAt=tAcc;
    let p={none:.42,knife:.28,gun:.16}[a.arm||'none']+(gun?.2:0)+(a.resist<=1?.25:0)-(a.boss?.15:0);
    if(Math.random()<p){a.state='comply';a.arm='none';cbHandItem(a.mesh,null);gave++;}
    else if(a.state==='idle'&&raidS){if(a.arm!=='none'||Math.random()<.5)cbStartFight(a);else raidFlee(a);}
  }
  if(gave)toast(gave>1?`${gave} suspects drop to their knees.`:'"Okay! Okay!" The suspect gives up.','good');
}
// ---------- getting hurt
function cbHurt(n,why){
  CB.hp=Math.max(0,CB.hp-n);CB.hurtT=0;flashT=.35;shake=Math.max(shake,.3);SFX.blip('punch');
  if(why&&!CB.toldHurt){CB.toldHurt=true;toast(why,'bad');}
  if(CB.hp<=0)cbOfficerDown();
}
function cbOfficerDown(){
  CB.hp=55;
  if(raidS){toast('Officer down! The team drags you out of the building.','bad');for(const a of cbFoes())if(a.state==='fight')a.state='idle';if(!raidS.done)raidFinish(false);return;}
  toast('You were knocked down. By the time you get up, they are gone.','bad');
  for(const a of CB.foes.slice())if(a.state!=='cuffed'&&a.state!=='comply')cbEscape(a);
  if(CB.inc)cbIncidentEnd();
}
// ---------- effects
function cbFx(obj,life,upd){scene.add(obj);CB.fx.push({obj,life,t:0,upd});}
function cbWire(a){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(pl.x+Math.sin(pl.h)*.4,1.25+cbY(),pl.z+Math.cos(pl.h)*.4),new THREE.Vector3(a.x,1.1+cbY(),a.z)]);
  cbFx(new THREE.Line(g,new THREE.LineBasicMaterial({color:0xf4e04a,transparent:true})),.4,(f,k)=>f.obj.material.opacity=1-k);}
function cbFlash(){const m=new THREE.Mesh(new THREE.SphereGeometry(.13,6,5),new THREE.MeshBasicMaterial({color:0xffe08a}));m.position.set(pl.x+Math.sin(pl.h)*.75,1.35+cbY(),pl.z+Math.cos(pl.h)*.75);cbFx(m,.07);}
function cbPuff(){const m=new THREE.Mesh(new THREE.ConeGeometry(1.5,4,10,1,true),new THREE.MeshBasicMaterial({color:0xffa23a,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide}));
  m.rotation.order='YXZ';m.rotation.set(-Math.PI/2,pl.h,0);m.position.set(pl.x+Math.sin(pl.h)*2.3,1.3+cbY(),pl.z+Math.cos(pl.h)*2.3);cbFx(m,.45,(f,k)=>{f.obj.material.opacity=.35*(1-k);f.obj.scale.setScalar(.6+k*.6);});}
function cbLaser(a){
  if(!a.laser){a.laser=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0xff3344,transparent:true}));scene.add(a.laser);}
  const p=a.laser.geometry.attributes.position;p.setXYZ(0,a.x+Math.sin(a.h)*.5,1.35+cbY(),a.z+Math.cos(a.h)*.5);p.setXYZ(1,pl.x,1.25+cbY(),pl.z);p.needsUpdate=true;
  a.laser.visible=true;a.laser.material.opacity=.35+.65*Math.abs(Math.sin(tAcc*14));
}
function cbNoLaser(a){if(a.laser)a.laser.visible=false;}

// ---------- suspects who fight
function cbFoe(a,dt,B){
  const dx=pl.x-a.x,dz=pl.z-a.z,d=Math.hypot(dx,dz),face=Math.atan2(dx,dz);const Y=cbY();
  a.atkCd-=dt;
  const move=(h,sp)=>{const ox=a.x,oz=a.z;a.x+=Math.sin(h)*sp*dt;a.z+=Math.cos(h)*sp*dt;if(pushOut(a,.4,B)&&Math.hypot(a.x-ox,a.z-oz)<sp*dt*.3){a.x+=Math.sin(h+1.6)*sp*dt;a.z+=Math.cos(h+1.6)*sp*dt;pushOut(a,.4,B);}a.h=h;a.ph+=dt*sp*1.9;animWalk(a.mesh,a.ph,sp>4.5?.8:.45,sp>4.5);};
  if(a.state!=='fight')cbNoLaser(a);
  if(a.state==='stunned'){a.t-=dt;pose(a.mesh,'cough',tAcc);a.x+=Math.sin(tAcc*2+a.ph)*.4*dt;a.z+=Math.cos(tAcc*1.7)*.4*dt;pushOut(a,.4,B);if(a.t<=0)a.state=a.prev||'fight';}
  else if(a.state==='down'){a.t-=dt;pose(a.mesh,'down');if(a.t<=0){a.state=Math.random()<.35?(raidS?'flee':'run'):'fight';a.resist=Math.max(1,a.resist);a.toldDown=false;if(a.state==='flee')raidFlee(a);}}
  else if(a.state==='wounded'){pose(a.mesh,'down');}
  else if(a.state==='comply'){pose(a.mesh,'handsUp');a.h=face;}
  else if(a.state==='cuffed'){pose(a.mesh,'cuffed');}
  else if(a.state==='run'){
    // running away in the street; a tackle at arm's length takes them down
    const h=Math.atan2(-dx,-dz)+Math.sin(tAcc*1.3+a.ph*.01)*.5;move(h,5.6);
    if(!inCar&&d<1.4){SFX.blip('punch');cbDown(a,2.6,'Tackled!');}
    a.far=d>45?(a.far||0)+dt:0;if(a.far>4)cbEscape(a);
  }
  else if(a.state==='fight'){
    if(a.stag>0){a.stag-=dt;pose(a.mesh,'stagger');cbNoLaser(a);}
    else if(inCar){pose(a.mesh,'brawl');a.h=face;cbNoLaser(a);a.aimT=0;}
    else if(a.arm==='gun'){
      const see=cbClear(a.x,a.z,pl.x,pl.z,B);
      if(!see||d>13)move(face,3.6);else if(d<4)move(face+Math.PI,3);else{a.h=face;pose(a.mesh,'aim');}
      if(see&&d<16&&a.atkCd<=0){a.aimT+=dt;a.h=face;pose(a.mesh,'aim');cbLaser(a);
        if(a.aimT>=1.05){a.aimT=0;a.atkCd=rnd(2,2.8);cbNoLaser(a);SFX.blip('shot');
          if(cbClear(a.x,a.z,pl.x,pl.z,B))cbHurt(22,'You\'re hit! Watch for the red laser and break line of sight behind a wall or car.');}}
      else{a.aimT=0;cbNoLaser(a);}
    }else{
      const reach=a.arm==='knife'?1.45:1.3;
      if(a.wind>0){a.wind-=dt;a.h=face;pose(a.mesh,'windup');if(a.wind<=0){pose(a.mesh,'punch');if(d<reach+.35)cbHurt(a.arm==='knife'?16:9,a.arm==='knife'?'Knife! Keep your distance: spray or taser them.':'You took a punch. Subdue them!');else SFX.blip('whoosh');a.atkCd=rnd(1,1.5);}}
      else if(d>reach)move(face,a.arm==='knife'?4.9:4.6);
      else{a.h=face;pose(a.mesh,'brawl',tAcc);if(a.atkCd<=0)a.wind=.38;}
    }
    // a beaten suspect may give up or run
    a.mor=(a.mor||0)+dt;if(a.mor>1){a.mor=0;if(a.resist<=1&&Math.random()<.18){if(Math.random()<.5){a.state='comply';a.arm='none';cbHandItem(a.mesh,null);toast('"I give up! I give up!"','good');}else if(raidS)raidFlee(a);else a.state='run';}}
  }
  a.mesh.rotation.y=a.h;a.mesh.position.set(a.x,Y,a.z);
}
function cbEscape(a){a.state='escaped';cbNoLaser(a);if(a.laser)scene.remove(a.laser);scene.remove(a.mesh);CB.foes=CB.foes.filter(f=>f!==a);if(a.onEscape)a.onEscape(a);if(a.inc)cbIncidentCheck();}
// street suspects: who can be cuffed right here
function cbCuffable(){let best=null,bd=1.9;for(const a of CB.foes){if(!['down','stunned','comply','wounded'].includes(a.state))continue;const d=Math.hypot(a.x-pl.x,a.z-pl.z);if(d<bd){bd=d;best=a;}}return best;}
function cbFighterNear(){return CB.foes.find(a=>a.state==='fight'&&Math.hypot(a.x-pl.x,a.z-pl.z)<1.9);}
function cbInteract(){
  if(inCar||insideS||raidS)return false;
  const a=cbCuffable();
  if(!a){if(cbFighterNear()){toast('Subdue them first: baton, spray or taser (Space).','bad');return true;}return false;}
  const kn=a.state==='down'||a.state==='wounded'||a.state==='stunned';a.state='cuffing';cbHandItem(a.mesh,null);cbNoLaser(a);
  cuffScene(a.mesh,a.x,a.z,{kneel:kn},()=>{a.state='cuffed';gainXP(15);
  toast(a.wounded?'Cuffed. Paramedics take over.':(a.p?`${a.p.name} is in cuffs.`:'Suspect in cuffs.'),'good');
  CB.foes=CB.foes.filter(f=>f!==a);if(a.laser)scene.remove(a.laser);
  // street arrests wait on their knees for the van
  if(a.onCuff)a.onCuff(a);else{pose(a.mesh,['kneel','cuffed']);setTimeout(()=>scene.remove(a.mesh),9000);}
  if(a.inc)cbIncidentCheck();});
  return true;
}
function cbPromptText(){
  if(inCar||insideS||raidS)return '';const a=cbCuffable();
  if(a)return `<kbd>E</kbd>${a.state==='wounded'?'Cuff and call paramedics':'Cuff the suspect'}`;
  if(cbFighterNear())return '<kbd>Space</kbd>Subdue them first';
  return '';
}
// a fleeing suspect who turns to fight when you catch them
function cbRunnerTurns(r){
  const a={x:r.x,z:r.z,h:r.h,mesh:r.mesh,state:'fight',ph:0,street:true,cs:r.cs,p:r.p,
    onCuff:f=>{scene.remove(f.mesh);makePrisoner(f.cs,f.p,f.x,f.z);cuffed(f.cs,f.p);},
    onEscape:f=>{toast(`${f.p.first} got away. They'll turn up at home again later.`,'bad');if(!f.cs.ended)spend(f.cs,45);}};
  cbArm(a,Math.random()<.3?'knife':'none');CB.foes.push(a);
  toast(a.arm==='knife'?`${r.p.first} pulls a knife! Back off and use spray or the taser.`:`${r.p.first} turns to fight! Subdue them, then cuff.`,'bad');
}

// ---------- street crimes: dispatch calls while you patrol
const INC_TYPES=[
  {k:'mug',title:'Robbery in progress',call:'a man is robbing a woman at knifepoint',n:1,arms:['knife','none']},
  {k:'fight',title:'Street fight',call:'a fight has broken out at the bus stop',n:2,arms:['none','none']},
  {k:'shop',title:'Armed robbery at a shop',call:'two masked men are robbing a provision store',n:2,arms:['knife','gun'],masked:true},
];
function cbIncidentStart(){
  const typ=pick(INC_TYPES);let spot=null;
  for(let i=0;i<30&&!spot;i++){const q=pedPos({b:[ri(0,NB-1),ri(0,NB-1)],u:rnd(0,8*PR),dir:1});const d=Math.hypot(q.x-pl.x,q.z-pl.z);if(d>90&&d<280)spot=q;}
  if(!spot)return;
  const I={typ,x:spot.x,z:spot.z,t:0,engaged:false,foes:[],victim:null,force:false};
  const vm=makePersonMesh(randLook());vm.position.set(spot.x+1.2,.2,spot.z+1.2);scene.add(vm);I.victim=vm;
  for(let i=0;i<typ.n;i++){
    const look=typ.masked?{shirt:pick(['#2a2a30','#3a2a24','#23314a']),pants:'#1b1c20',masked:true,skin:pick(SKIN)}:randLook();
    const m=makePersonMesh(look);scene.add(m);
    const a={x:spot.x-.6+i*1.4,z:spot.z-.4-i*.6,h:0,mesh:m,state:'pre',ph:rnd(0,6),street:true,inc:I};cbArm(a,typ.arms[i%typ.arms.length]);
    I.foes.push(a);CB.foes.push(a);
  }
  CB.inc=I;CB.force=false;CB.shot=false;CB.bad=false;
  gps={x:spot.x,z:spot.z,label:typ.title};SFX.blip('radio');
  toast(`Dispatch: ${typ.call}. Respond Code 3. Shout a warning first, then subdue and cuff.`,'bad');
}
function cbIncidentTick(dt){
  const I=CB.inc;
  if(!I){
    if(curCase||gps||chase||runner||prisoner||raidS||insideS||cine||CB.foes.length)return;
    {const s=ST();if(s.ch<2&&s.step!=='done')return;}
    CB.incT-=dt;if(CB.incT<=0){CB.incT=rnd(160,280);cbIncidentStart();}return;
  }
  I.t+=dt;const d=Math.hypot(pl.x-I.x,pl.z-I.z);
  if(!I.engaged){
    // before you arrive: the robbery or fight is playing out
    I.foes.forEach((a,i)=>{const tx=I.typ.k==='fight'&&i===1?I.foes[0]:null;a.h=tx?Math.atan2(tx.x-a.x,tx.z-a.z):Math.atan2(I.x+1.2-a.x,I.z+1.2-a.z);
      pose(a.mesh,I.typ.k==='fight'?(Math.sin(tAcc*5+i)>0?'punch':'brawl'):a.arm==='gun'?'aim':'windup',tAcc);a.mesh.rotation.y=a.h;a.mesh.position.set(a.x,.2,a.z);});
    pose(I.victim,I.typ.k==='fight'?'brawl':'handsUp');I.victim.rotation.y=Math.atan2(I.foes[0].x-I.victim.position.x,I.foes[0].z-I.victim.position.z);
    if(d<24){I.engaged=true;
      I.foes.forEach(a=>{if(inCar||Math.random()<.35)a.state='run';else cbStartFight(a);});
      const f=I.foes.filter(a=>a.state==='fight').length;toast(f?(I.typ.k==='shop'?'They\'ve seen you! Armed suspects, use cover.':'They turn on you!'):'They scatter! Catch them on foot.','bad');}
    else if(I.t>150){toast('Dispatch: another unit took that call.');cbIncidentEnd(true);}
    return;
  }
  pose(I.victim,'idle',tAcc);
}
function cbIncidentCheck(){
  const I=CB.inc;if(!I||I.foes.some(a=>CB.foes.includes(a)))return;
  const got=I.foes.filter(a=>a.state==='cuffed').length,all=got===I.foes.length;
  gainXP(10+got*10);
  if(all&&!CB.force){trustDelta(3,`${I.typ.title}: everyone arrested without force. The crowd claps.`);}
  else if(all&&!CB.bad){trustDelta(2,`${I.typ.title}: all suspects in custody.`);}
  else if(got)toast(`${I.typ.title}: ${got} of ${I.foes.length} arrested. The van takes them to Division 9.`,'good');
  else toast(`${I.typ.title}: they all got away.`,'bad');
  career.arrests+=got;cbIncidentEnd();
}
function cbIncidentEnd(quiet){
  const I=CB.inc;if(!I)return;CB.inc=null;
  if(gps&&gps.label===I.typ.title)gps=null;
  setTimeout(()=>{scene.remove(I.victim);I.foes.forEach(a=>{scene.remove(a.mesh);if(a.laser)scene.remove(a.laser);});},quiet?0:4000);
  CB.foes=CB.foes.filter(a=>!I.foes.includes(a));
}
function cbObjective(){
  const f=CB.foes.find(a=>a.state==='fight');
  if(f&&f.p)return {e:'Use of force',b:`Subdue ${f.p.name}`,p:'Spray or taser them (Space), baton up close. Then cuff (E). Shout (G) and they may give up.'};
  if(CB.inc)return {e:'Dispatch · Code 3',b:CB.inc.typ.title,p:CB.inc.engaged?'Shout a warning (G). If they fight, subdue them (Space, R to switch tool), then cuff (E).':'Get there fast. Follow the GPS.'};
  return null;
}
function cbDots(dot,W2){for(const a of CB.foes)if(a.state!=='cuffed')dot(a.x,a.z,a.state==='fight'?'#ff4d5e':'#f4b740',W2/55);}

// ---------- every frame
function cbFrame(dt){
  CB.cd=Math.max(0,CB.cd-dt);CB.shoutCd=Math.max(0,CB.shoutCd-dt);CB.hurtT+=dt;
  if(CB.hurtT>5&&CB.hp<100)CB.hp=Math.min(100,CB.hp+6*dt);if(CB.hurtT>8)CB.toldHurt=false;
  for(const f of CB.fx.slice()){f.t+=dt;const k=f.t/f.life;if(k>=1){scene.remove(f.obj);CB.fx.splice(CB.fx.indexOf(f),1);continue;}if(f.upd)f.upd(f,k);}
  const busy=blockingModal()||cine||DLG||cctv;
  if(!busy){
    cbIncidentTick(dt);
    if(!raidS){const B=cbBoxes();for(const a of CB.foes.slice())if(a.state!=='pre')cbFoe(a,dt,B);}
    // the officer's own swing, drawn over the walk cycle
    if(CB.swingT>0&&!inCar){CB.swingT-=dt;pose(pl.mesh,CB.swing);}
  }
  cbPlayerItem();if(pl.mesh.userData.item)pl.mesh.userData.item.visible=!inCar;
  // target ring under whoever the current tool would hit
  if(!CB.ring){CB.ring=new THREE.Mesh(new THREE.RingGeometry(.55,.72,28),new THREE.MeshBasicMaterial({color:0xff4d5e,transparent:true,opacity:.85,depthWrite:false}));CB.ring.rotation.x=-Math.PI/2;scene.add(CB.ring);}
  const T=TOOLS[CB.tool],tg=!busy&&!inCar&&!insideS?cbTarget(T):null;
  CB.ring.visible=!!tg;if(tg){CB.ring.position.set(tg.x,cbY()+.05,tg.z);CB.ring.material.color.set(T.id==='gun'?'#ff4d5e':'#f4b740');}
  // HUD
  const near=!inCar&&!insideS&&(raidS||cbFoes().some(a=>FIGHT_ST.has(a.state)&&Math.hypot(a.x-pl.x,a.z-pl.z)<35)||(runner&&Math.hypot(runner.x-pl.x,runner.z-pl.z)<35));
  const show=near||(!inCar&&CB.hp<100);
  if(CB.ui.near!==near){CB.ui.near=near;document.body.classList.toggle('combat',!!near);}
  const h=$('#cbhud');if(!h)return;
  if(show!==CB.ui.show){CB.ui.show=show;h.hidden=!show;}
  if(show){const hp=Math.round(CB.hp),key=hp+'|'+CB.tool+'|'+(CB.cd>0?1:0);
    if(CB.ui.key!==key){CB.ui.key=key;h.innerHTML=`<div class="hp"><i style="width:${hp}%;background:${hp<35?'#ff4d5e':hp<65?'#f4b740':'#47cf8b'}"></i></div><div class="row"><b>${T.name}</b><span>${document.body.classList.contains('touchmode')?'':'Space use · R switch · G shout'}</span></div>`;}}
  if(CB.ui.tool!==CB.tool+'|'+(CB.cd>0)){CB.ui.tool=CB.tool+'|'+(CB.cd>0);const b=$('#atkBtn');if(b){b.querySelector('.bl').textContent=T.name;b.classList.toggle('cool',CB.cd>0);b.classList.toggle('gun',T.id==='gun');}}
}
function bindCombat(){
  const b=$('#atkBtn');if(!b)return;
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.classList.add('on');buzz();cbUse();});
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>b.classList.remove('on')));
  b.addEventListener('contextmenu',e=>e.preventDefault());
}
