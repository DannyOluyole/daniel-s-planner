// ================= simulation: traffic, signals, pedestrians, player, pursuits, prisoners
let pc,pl,inCar=true,aiCars=[],peds=[],target=null,suspect=null,chase=null,runner=null;
let camYawOff=0,flashT=0,shake=0,lightsOn=false,siren='off',sirenTone='wail',blinkT=0,tAcc=0;
const fwdOf=h=>({x:Math.sin(h),z:Math.cos(h)});
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const validDirs=n=>DIRS.filter(d=>{const i=n[0]+d[0],j=n[1]+d[1];return i>=0&&i<=NB&&j>=0&&j<=NB;});
const laneOff=d=>[-d[1]*LANE,d[0]*LANE];
const edgeStart=(n,d)=>{const [ox,oz]=laneOff(d);return {x:n[0]*S+d[0]*10+ox,z:n[1]*S+d[1]*10+oz};};
const edgeEnd=(n,d)=>{const [ox,oz]=laneOff(d);return {x:(n[0]+d[0])*S-d[0]*10+ox,z:(n[1]+d[1])*S-d[1]*10+oz};};
const isSig=n=>n[0]>0&&n[0]<NB&&n[1]>0&&n[1]<NB;
const axisOf=d=>d[0]!==0?0:1;
function sigState(n,ax){const t=(tAcc+((n[0]*5+n[1]*3)%24))%24;if(ax===1)return t<9?'g':t<11.5?'y':'r';return t>=12&&t<21?'g':t>=21&&t<23.5?'y':'r';}

// ---------- traffic
function spawnAICar(over={},nearPoint=null){
  let node,d,tries=0;
  do{node=nearPoint?[clamp(Math.round(nearPoint.x/S),0,NB),clamp(Math.round(nearPoint.z/S),0,NB)]:[ri(0,NB),ri(0,NB)];d=pick(validDirs(node));tries++;}
  while(!nearPoint&&tries<40&&pc&&Math.hypot(node[0]*S-pc.x,node[1]*S-pc.z)<90);
  const st=edgeStart(node,d),en=edgeEnd(node,d);const k=nearPoint?0:Math.random();
  const speeder=Math.random()<.28;
  const c=Object.assign({x:st.x+(en.x-st.x)*k,z:st.z+(en.z-st.z)*k,h:Math.atan2(d[0],d[1]),node,dir:d,wp:en,seg:'edge',
    color:pick(COLORS).h,model:pick(['Sedan','Sedan','SUV','Hatchback','Coupe','Pickup','Van','SUV']),plate:makePlate(),
    cruise:(speeder?rnd(45,62):rnd(24,35))/2.237,speed:0,mode:'drive',stuck:0,ghost:0,latOff:0,yieldT:0,runsRed:Math.random()<.07,spin:0},over);
  c.speed=c.cruise;c.speeding=c.cruise*2.237>LIMIT+.5;c.rx=c.x;c.rz=c.z;
  c.mesh=makeCarMesh(c.color,c.model,false);c.mesh.position.set(c.x,0,c.z);c.mesh.rotation.y=c.h;scene.add(c.mesh);
  aiCars.push(c);return c;
}
function removeAICar(c){scene.remove(c.mesh);aiCars=aiCars.filter(x=>x!==c);if(target===c)target=null;}
function advance(c){
  if(c.seg==='edge'){
    const n=[c.node[0]+c.dir[0],c.node[1]+c.dir[1]];
    if(c.mode==='drive'&&isSig(n)&&sigState(n,axisOf(c.dir))==='r'&&!c.violation){
      c.violation='red';
      if(inCar&&Math.hypot(c.x-pc.x,c.z-pc.z)<85){c.seenViol=true;toast(`You saw ${c.plate} run a red light. Pull them over.`,'bad');SFX.blip('radio');}
    }
    let opts=validDirs(n).filter(d=>!(d[0]===-c.dir[0]&&d[1]===-c.dir[1]));if(!opts.length)opts=validDirs(n);
    const d2=pick(opts);c.node=n;c.dir=d2;c.wp=edgeStart(n,d2);c.seg='turn';
  }else{c.wp=edgeEnd(c.node,c.dir);c.seg='edge';}
}
function updateAI(dt){
  const pf=fwdOf(pc.h);
  for(const c of aiCars){
    let fx=Math.sin(c.h),fz=Math.cos(c.h);c.queued=false;
    if(c.mode==='drive'||c.mode==='flee'){
      let dx=c.wp.x-c.x,dz=c.wp.z-c.z,d=Math.hypot(dx,dz);
      if(d<3||(d<9&&dx*fx+dz*fz<0)){advance(c);dx=c.wp.x-c.x;dz=c.wp.z-c.z;d=Math.hypot(dx,dz);}
      const da=angDiff(Math.atan2(dx,dz),c.h);c.h+=clamp(da,-2.4*dt,2.4*dt);c.steerVis=clamp(da*1.4,-.5,.5);
      let ds=c.cruise;
      if(c.seg==='turn'&&Math.abs(da)>.25)ds=Math.min(ds,c.mode==='flee'?13:8);
      if(c.seg==='edge'&&d<12)ds=Math.min(ds,c.mode==='flee'?16:11);
      if(c.mode==='drive'&&!c.runsRed&&c.seg==='edge'){const n=[c.node[0]+c.dir[0],c.node[1]+c.dir[1]];
        if(isSig(n)&&d<45){const st=sigState(n,axisOf(c.dir));if(st==='r'||(st==='y'&&d>10)){ds=Math.min(ds,Math.max(0,(d-.6)*.85));c.queued=true;}}}
      if(c.ghost>0)c.ghost-=dt;else{
        let block=1e9,bc=null;
        const chk=(ox,oz,o)=>{const rx=ox-c.x,rz=oz-c.z;const al=rx*fx+rz*fz;const lat=Math.abs(rx*fz-rz*fx);if(al>0&&al<16&&lat<2.4&&al<block){block=al;bc=o;}};
        for(const o of aiCars)if(o!==c)chk(o.x,o.z,o);
        chk(pc.x,pc.z,null);if(!inCar)chk(pl.x,pl.z,null);
        if(block<16){ds=Math.min(ds,Math.max(0,(block-6)*1.4));if(bc&&bc.queued)c.queued=true;}
        if(ds<1&&!c.queued){c.stuck+=dt;if(c.stuck>(c.mode==='flee'?.8:4)){c.ghost=2;c.stuck=0;}}else c.stuck=0;
      }
      if(c.mode==='drive'&&lightsOn&&siren!=='off'&&inCar&&c!==suspect){const rx=c.x-pc.x,rz=c.z-pc.z;const al=rx*pf.x+rz*pf.z,lat=Math.abs(rx*pf.z-rz*pf.x);if(al>3&&al<42&&lat<4)c.yieldT=2.2;}
      if(c.yieldT>0){c.yieldT-=dt;ds=Math.min(ds,4);c.latOff=Math.min(2.7,c.latOff+dt*2.2);}else c.latOff=Math.max(0,c.latOff-dt*1.4);
      c.speed+=clamp(ds-c.speed,-14*dt,(c.mode==='flee'?9:4)*dt);
    }else if(c.mode==='pull'){
      const dx=c.pull.x-c.x,dz=c.pull.z-c.z,d=Math.hypot(dx,dz);
      c.h+=clamp(angDiff(Math.atan2(dx,dz),c.h),-1.5*dt,1.5*dt);c.latOff=Math.max(0,c.latOff-dt*2);
      c.speed=Math.max(0,Math.min(c.speed,d*.7)-3*dt);
      if(d<2||c.speed<.3){c.mode='stopped';c.speed=0;}
    }else{c.speed=Math.max(0,c.speed-12*dt);if(c.mode==='caught')c.spin+=dt*c.speed*.22;}
    fx=Math.sin(c.h);fz=Math.cos(c.h);
    c.x+=fx*c.speed*dt;c.z+=fz*c.speed*dt;
    c.rx=c.x-fz*c.latOff;c.rz=c.z+fx*c.latOff;
    c.mesh.position.set(c.rx,0,c.rz);c.mesh.rotation.y=c.h+c.spin;
    const u=c.mesh.userData;const sp=c.speed*dt/.36;u.wheels.forEach(w=>w.rotation.x+=sp);u.steer.forEach(s=>s.rotation.y=c.steerVis||0);
  }
  for(const c of aiCars.slice())if(c.mode==='parked'&&c!==suspect&&Math.hypot(c.x-pl.x,c.z-pl.z)>240){removeAICar(c);spawnAICar();}
}
function genDriver(c,fled){
  if(c.driver)return c.driver;
  const d=makePeople(1)[0];d.lic=Math.random()<.1?'Suspended':Math.random()<.12?'Expired':'Valid';d.reg=Math.random()<.12?'Expired':'Valid';
  d.warrant=Math.random()<(fled?.45:.05);d.stolen=!d.warrant&&Math.random()<(fled?.3:.04);c.driver=d;return d;
}
function alprFlags(c){const d=genDriver(c,false);const f=[];if(d.stolen)f.push('STOLEN VEHICLE');if(d.warrant)f.push('OWNER WARRANT');if(d.reg!=='Valid')f.push('REG EXPIRED');return f;}

// ---------- pedestrians
const PR=30.6;
function pedPos(p){const u=((p.u%(8*PR))+8*PR)%(8*PR);let x,z,h;const cx=(p.b[0]+.5)*S,cz=(p.b[1]+.5)*S;
  if(u<2*PR){x=cx-PR+u;z=cz-PR;h=Math.PI/2;}else if(u<4*PR){x=cx+PR;z=cz-PR+(u-2*PR);h=0;}else if(u<6*PR){x=cx+PR-(u-4*PR);z=cz+PR;h=-Math.PI/2;}else{x=cx-PR;z=cz+PR-(u-6*PR);h=Math.PI;}
  if(p.dir<0)h+=Math.PI;return {x,z,h};}
function spawnPed(){const p={b:[ri(0,NB-1),ri(0,NB-1)],u:rnd(0,8*PR),dir:Math.random()<.5?1:-1,sp:rnd(1.1,1.6),phase:rnd(0,6),ox:0,oz:0};
  const L=randLook();if(Math.random()<.2)L.backpack=pick(['#3a5a8a','#8a3a3a','#e0b52b']);p.mesh=makePersonMesh(L);scene.add(p.mesh);peds.push(p);}
function updatePeds(dt){
  for(const p of peds){
    p.u+=p.dir*p.sp*dt;p.phase+=dt*p.sp*4.2;
    const q=pedPos(p);p.ox*=Math.max(0,1-dt*.8);p.oz*=Math.max(0,1-dt*.8);
    const x=q.x+p.ox,z=q.z+p.oz;
    if(inCar&&Math.abs(pc.v)>2){const dx=x-pc.x,dz=z-pc.z,d=Math.hypot(dx,dz)||1;if(d<3.4){p.ox+=dx/d*(3.6-d);p.oz+=dz/d*(3.6-d);}}
    if(Math.hypot(x-camera.position.x,z-camera.position.z)>140){p.mesh.visible=false;continue;}
    p.mesh.visible=true;p.mesh.position.set(x,.2,z);p.mesh.rotation.y=q.h;animWalk(p.mesh,p.phase,.42);
  }
}

// ---------- collisions
function pushOut(o,r,list=BOXES){
  let hit=false;
  for(const b of list){
    if(o.x<b.x0-r||o.x>b.x1+r||o.z<b.z0-r||o.z>b.z1+r)continue;
    const cx=clamp(o.x,b.x0,b.x1),cz=clamp(o.z,b.z0,b.z1);const dx=o.x-cx,dz=o.z-cz;const d2=dx*dx+dz*dz;
    if(d2<r*r){hit=true;if(d2>1e-6){const d=Math.sqrt(d2);o.x=cx+dx/d*r;o.z=cz+dz/d*r;}
      else{const m=[o.x-b.x0,b.x1-o.x,o.z-b.z0,b.z1-o.z];const i=m.indexOf(Math.min(...m));if(i===0)o.x=b.x0-r;else if(i===1)o.x=b.x1+r;else if(i===2)o.z=b.z0-r;else o.z=b.z1+r;}}
  }
  if(list===BOXES){o.x=clamp(o.x,-40,CITY+40);o.z=clamp(o.z,-40,CITY+40);}
  return hit;
}

// ---------- player
function updatePlayer(dt){
  const T=padDrive();const turn=T.turn;
  if(inCar){
    let f=fwdOf(pc.h),r={x:-f.z,z:f.x};
    let vl=pc.vx*f.x+pc.vz*f.z,vlat=pc.vx*r.x+pc.vz*r.z;const v0=vl;
    pc.throttle=T.up?T.up:T.dn&&vl<.5?.6*T.dn:0;
    if(T.up)vl+=(vl<-.5?18:10*(1-Math.max(0,vl)/47))*T.up*dt;
    if(T.dn)vl-=(vl>.5?19:6)*T.dn*dt;
    if(!T.up&&!T.dn)vl-=Math.sign(vl)*Math.min(Math.abs(vl),(1+Math.abs(vl)*.1)*dt);
    vl=clamp(vl,-8,44);
    const maxSt=.62/(1+Math.abs(vl)*.05);
    pc.steer+=(turn*maxSt-pc.steer)*Math.min(1,dt*7);
    pc.vx=f.x*vl+r.x*vlat;pc.vz=f.z*vl+r.z*vlat;
    pc.h+=vl*Math.tan(pc.steer)/2.7*dt;
    f=fwdOf(pc.h);r={x:-f.z,z:f.x};
    vl=pc.vx*f.x+pc.vz*f.z;vlat=pc.vx*r.x+pc.vz*r.z;
    const grip=T.dn>.5&&Math.abs(vl)>16?1.6:keys.sprint&&Math.abs(vl)>10?1.1:6.5;
    vlat*=Math.exp(-dt*grip);pc.slip=Math.abs(vlat);
    pc.vx=f.x*vl+r.x*vlat;pc.vz=f.z*vl+r.z*vlat;
    pc.x+=pc.vx*dt;pc.z+=pc.vz*dt;pc.v=vl;pc.acc=(vl-v0)/Math.max(dt,1e-3);
    if(pushOut(pc,2.1)){const sp=Math.hypot(pc.vx,pc.vz);if(sp>7){damageCar(sp*1.1);flashT=.3;shake=.5;SFX.blip('crash');}pc.vx*=-.25;pc.vz*=-.25;}
    for(const c of aiCars){if(c._hitCd>0)c._hitCd-=dt;const dx=pc.x-c.rx,dz=pc.z-c.rz,d=Math.hypot(dx,dz)||.01;
      if(d<4.1){const push=(4.1-d)/2;pc.x+=dx/d*push;pc.z+=dz/d*push;c.x-=dx/d*push;c.z-=dz/d*push;
        if(Math.hypot(pc.vx,pc.vz)>5&&!(c._hitCd>0)){c._hitCd=1;SFX.blip('crash');shake=.4;
          if(chase&&c===chase.car&&c.mode==='flee'){chase.meter+=.22;}else{damageCar(6);addRep(-1);toast('Collision with a civilian vehicle. Reputation −1.','bad');}
          flashT=.25;pc.vx*=.55;pc.vz*=.55;}}}
    const u=pc.mesh.userData;
    pc.mesh.position.set(pc.x,0,pc.z);pc.mesh.rotation.y=pc.h;
    u.body.rotation.z=clamp(-pc.steer*vl*.012-vlat*.02,-.07,.07);u.body.rotation.x=clamp(-pc.acc*.004,-.04,.04);
    u.wheels.forEach(w=>w.rotation.x+=vl*dt/.36);u.steer.forEach(s=>s.rotation.y=pc.steer);
    u.tail.emissiveIntensity=T.dn&&vl>.5?2.6:.35+nightF*.6;
    pl.x=pc.x;pl.z=pc.z;pl.h=pc.h;
  }else{
    const F=padFoot(dt);const sp=F.run?7.4:4.2;
    if(F.stick)pl.h=F.h;else pl.h+=turn*2.8*dt;
    const mv=F.stick?sp*F.m:(keys.up?sp:0)-(keys.down?2.2:0);
    pl.x+=Math.sin(pl.h)*mv*dt;pl.z+=Math.cos(pl.h)*mv*dt;
    pushOut(pl,.45);
    const dc=Math.hypot(pl.x-pc.x,pl.z-pc.z)||.01;if(dc<2.3){pl.x=pc.x+(pl.x-pc.x)/dc*2.3;pl.z=pc.z+(pl.z-pc.z)/dc*2.3;}
    pl.phase+=dt*Math.abs(mv)*1.9;
    pl.mesh.position.set(pl.x,.2,pl.z);pl.mesh.rotation.y=pl.h;
    if(mv)animWalk(pl.mesh,pl.phase,F.run?.75:.45,F.run&&mv>0);else pose(pl.mesh,'idle',tAcc);
    pc.vx*=.9;pc.vz*=.9;pc.v=0;pc.throttle=0;pc.slip=0;
  }
}
function damageCar(n){
  pc.damage+=n;
  if(pc.damage>=100){pc.damage=0;addRep(-5);toast('Your cruiser was wrecked and towed. A fresh one is waiting at Precinct 9. Reputation −5.','bad');
    pc.x=LOC.spawnCar.x;pc.z=LOC.spawnCar.z;pc.h=LOC.spawnCar.h;pc.vx=pc.vz=0;if(!inCar){inCar=true;pl.mesh.visible=false;}}
}
function toggleCar(){
  if(modalOpen()||cine||raidS||cctv)return;
  if(inCar){
    if(Math.hypot(pc.vx,pc.vz)>2.5){toast('Stop the cruiser before getting out.');return;}
    inCar=false;pc.vx=pc.vz=0;
    pl.x=pc.x+Math.cos(pc.h)*2.4;pl.z=pc.z-Math.sin(pc.h)*2.4;pl.h=pc.h;pushOut(pl,.45);pl.mesh.visible=true;SFX.blip('door');
    unloadPrisoner();
  }else{
    if(Math.hypot(pl.x-pc.x,pl.z-pc.z)>4.5){toast('Walk over to your cruiser to get in.');return;}
    if(prisoner&&prisoner.state==='follow'){
      if(Math.hypot(prisoner.x-pc.x,prisoner.z-pc.z)<14){seatPrisoner();}
      else{toast(`${prisoner.p.first} is still back there. Bring them with you.`);return;}
    }
    inCar=true;pl.mesh.visible=false;SFX.blip('door');
  }
}

// ---------- prisoners: cuffed suspects walk behind you, ride in the back, and walk into the station
function makePrisoner(cs,p,x,z){
  dropPrisoner();
  const m=makePersonMesh(lookOf(p));scene.add(m);pose(m,'cuffed');
  prisoner={cs,p,mesh:m,state:'follow',x,z,h:0,ph:0};m.position.set(x,.2,z);
}
function dropPrisoner(){if(prisoner&&prisoner.mesh){prisoner.mesh.parent&&prisoner.mesh.parent.remove(prisoner.mesh);}prisoner=null;}
function seatPrisoner(){
  const P=prisoner;scene.remove(P.mesh);P.state='car';pc.mesh.add(P.mesh);P.mesh.position.set(-.42,.04,-.75);P.mesh.rotation.set(0,0,0);pose(P.mesh,['sit','cuffed']);SFX.blip('door');
  toast(`${P.p.name} is in the back seat. Drive to Precinct 9 to book them.`);
}
function updatePrisoner(dt){
  const P=prisoner;if(!P||!P.mesh)return;const m=P.mesh;
  if(P.state==='follow'){
    const tx=pl.x-Math.sin(pl.h)*.45-Math.cos(pl.h)*.75,tz=pl.z-Math.cos(pl.h)*.45+Math.sin(pl.h)*.75;const dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz);
    if(d>28){P.x=tx;P.z=tz;}
    if(d>.35){const sp=Math.min(d*2.4,7.2);P.x+=dx/d*sp*dt;P.z+=dz/d*sp*dt;P.h=Math.atan2(dx,dz);P.ph+=dt*sp*1.9;animWalk(m,P.ph,.4);
      m.userData.j.arms.forEach(a=>{a.sh.rotation.set(.42,0,a.s*.3);a.el.rotation.x=-1.05;});}
    else pose(m,'cuffed');
    m.position.set(P.x,.2,P.z);m.rotation.y=P.h;
  }else if(P.state==='walkin'){
    const st=LOC.station;const dx=st.x-st.nx*1.2-P.x,dz=st.z-st.nz*1.2-P.z,d=Math.hypot(dx,dz);
    if(d<.6){scene.remove(m);book();return;}
    P.h=Math.atan2(dx,dz);P.x+=dx/d*2.2*dt;P.z+=dz/d*2.2*dt;P.ph+=dt*4.2;animWalk(m,P.ph,.4);
    m.userData.j.arms.forEach(a=>{a.sh.rotation.set(.42,0,a.s*.3);a.el.rotation.x=-1.05;});
    m.position.set(P.x,.2,P.z);m.rotation.y=P.h;
  }
}
function startWalkin(){
  const P=prisoner;if(P.state==='car'){pc.mesh.remove(P.mesh);scene.add(P.mesh);P.x=pc.x-Math.cos(pc.h)*1.8;P.z=pc.z+Math.sin(pc.h)*1.8;}
  P.state='walkin';toast(`An officer walks ${P.p.first} inside for booking.`);
}

// ---------- lights, siren, radar, ALPR, traffic stops, chases
function setLights(on){
  lightsOn=on;siren=on?sirenTone:'off';
  if(!on){const u=pc.mesh.userData;u.pl.intensity=0;u.mr.emissiveIntensity=0;u.mb.emissiveIntensity=0;u.gr.visible=u.gb.visible=false;}
}
function sirenBtn(){
  if(!inCar||cine||raidS)return;
  const order=['wail','yelp','off'];sirenTone=order[(order.indexOf(sirenTone)+1)%3];
  if(lightsOn)siren=sirenTone;toast(`Siren: ${sirenTone==='off'?'lights only':sirenTone}.`);
}
function lightsBtn(){
  if(modalOpen()||cine||raidS||cctv)return;
  if(!inCar){toast('Get in your cruiser first (F).');return;}
  if(chase){toast('You\'re in pursuit. Box them in!');return;}
  if(suspect){if(suspect.mode==='drive'){suspect=null;setLights(false);toast('Lights off. Stop cancelled.');}return;}
  if(lightsOn&&!target){setLights(false);return;}
  if(!target){setLights(true);toast('Code 3. Traffic will pull over for you. Lock the radar on a car to make a stop.');return;}
  suspect=target;suspect.clocked=Math.round(target.speed*2.237);suspect.follow=0;
  const flagged=alprFlags(suspect).length>0;
  suspect.willFlee=Math.random()<(flagged?.4:suspect.speeding?.18:.05);
  setLights(true);toast(`Lights on. Radar ${suspect.clocked} mph. Stay right behind them.`);
}
function updateRadar(){
  const prev=target;target=null;
  if(!inCar||suspect||chase)return;
  const f=fwdOf(pc.h);let best=80;
  for(const c of aiCars){if(c.mode!=='drive')continue;const rx=c.rx-pc.x,rz=c.rz-pc.z;const al=rx*f.x+rz*f.z;const lat=Math.abs(rx*f.z-rz*f.x);if(al>4&&al<best&&lat<3.2+al*.06){best=al;target=c;}}
  if(target&&target!==prev&&!target.alprDone){target.alprDone=true;const fl=alprFlags(target);if(fl.length){toast(`ALPR hit on ${target.plate}: ${fl.join(', ')}.`,'bad');SFX.blip('alpr');}}
}
function laneSide(c){const f=fwdOf(c.h);const off=CURB-LANE;return [-f.z*off,f.x*off];}
function updateSuspect(dt){
  if(!suspect||chase)return;
  const s=suspect;const d=Math.hypot(s.x-pc.x,s.z-pc.z);
  if(s.mode==='drive'){
    const f=fwdOf(s.h);const behind=(pc.x-s.x)*f.x+(pc.z-s.z)*f.z<0;
    if(inCar&&d<32&&behind){s.follow+=dt;if(s.follow>1.6){
      if(s.willFlee){s.mode='flee';s.cruise=rnd(23,27);s.fled=true;chase={car:s,meter:0,esc:0,traffic:true};toast('They\'re running! Stay close to box them in.','bad');SFX.blip('radio');}
      else{s.mode='pull';const [ox,oz]=laneSide(s);s.pull={x:s.x+f.x*16+ox,z:s.z+f.z*16+oz};toast('The car is pulling over. Stop behind it, get out (F) and walk to the driver\'s door.');}
    }}else s.follow=Math.max(0,s.follow-dt*.4);
    if(d>140){suspect=null;setLights(false);toast('Lost the vehicle in traffic.');}
  }else if(s.mode==='stopped'||s.mode==='pull'){
    if(d>140){s.mode='drive';suspect=null;setLights(false);toast('You left the stop. The driver drove off.','bad');}
  }
}
function updateChase(dt){
  if(!chase)return;const c=chase.car;
  if(c.mode==='caught'||c.mode==='parked')return;
  const d=Math.hypot(c.x-pc.x,c.z-pc.z);
  if(inCar&&d<15)chase.meter+=dt/3.6;else chase.meter=Math.max(0,chase.meter-dt*.06);
  if(d>170)chase.esc+=dt;else chase.esc=Math.max(0,chase.esc-dt*2);
  if(chase.meter>=1){c.mode='caught';SFX.blip('good');toast(c.person?`${c.person.name} is boxed in! Get out and make the arrest.`:'Suspect boxed in! Get out and walk to the driver\'s door.','good');}
  else if(chase.esc>8){
    const ch=chase;endChase();removeAICar(c);spawnAICar();
    if(ch.traffic){addRep(-3);toast('The driver got away. Reputation −3.','bad');}else if(ch.onEscape)ch.onEscape();
  }
}
function endChase(){if(chase&&suspect===chase.car)suspect=null;if(gps&&gps.follow)gps=null;chase=null;setLights(false);}
function startCarChase(cs,p,from,onEscape){
  const c=spawnAICar({color:p.car.color.h,model:p.car.model,plate:p.car.plate,mode:'flee'},from);
  c.cruise=rnd(23,26);c.speed=12;c.person=p;c.mesh.userData.body.add(Object.assign(plateMesh(p.car.plate),{}));
  chase={car:c,meter:0,esc:0,cs,p,onEscape};suspect=c;
  if(inCar)setLights(true);
  gps={x:c.x,z:c.z,label:'Fleeing suspect',follow:c};SFX.blip('radio');
  toast(`${p.name} is fleeing in a ${lower(p.car.color.n)} ${lower(p.car.model)}! Get in your cruiser and box them in.`,'bad');
}
function startFootChase(cs,p,from){
  const m=makePersonMesh(lookOf(p));scene.add(m);
  runner={cs,p,mesh:m,x:from.x,z:from.z,h:Math.atan2(from.nx||0,from.nz||1),esc:0,phase:0,turnT:0,jit:0};SFX.blip('radio');
  toast(`${p.name} is running! Chase them on foot (hold Shift to sprint) and get close.`,'bad');
}
function updateRunner(dt){
  if(!runner)return;const r=runner;
  const dx=r.x-pl.x,dz=r.z-pl.z,d=Math.hypot(dx,dz);
  r.turnT-=dt;if(r.turnT<=0){r.turnT=rnd(.8,1.6);r.jit=rnd(-.7,.7);}
  r.h+=clamp(angDiff(Math.atan2(dx,dz)+r.jit,r.h),-3*dt,3*dt);
  const sp=6.3;const ox=r.x,oz=r.z;r.x+=Math.sin(r.h)*sp*dt;r.z+=Math.cos(r.h)*sp*dt;
  if(pushOut(r,.45)&&Math.hypot(r.x-ox,r.z-oz)<sp*dt*.4)r.h+=rnd(1.2,2)*(Math.random()<.5?1:-1);
  r.phase+=dt*sp*1.9;r.mesh.position.set(r.x,.2,r.z);r.mesh.rotation.y=r.h;animWalk(r.mesh,r.phase,.8,true);
  if(!inCar&&d<1.6&&!r.fought&&Math.random()<.45){runner=null;cbRunnerTurns(r);return;}
  if(!inCar&&d<1.6){scene.remove(r.mesh);runner=null;SFX.blip('cuff');toast(`Tackled! ${r.p.name} is in cuffs. Walk them to your cruiser.`,'good');makePrisoner(r.cs,r.p,r.x,r.z);cuffed(r.cs,r.p);return;}
  if(d>70)r.esc+=dt;else r.esc=Math.max(0,r.esc-dt);
  if(r.esc>6){scene.remove(r.mesh);runner=null;toast(`${r.p.first} got away on foot. They'll turn up at home again later.`,'bad');if(!r.cs.ended)spend(r.cs,45);}
}
