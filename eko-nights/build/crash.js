// ================= collisions: vehicles that touch where their bodywork meets, crashes with momentum, and people who
// jump aside or get knocked down
// Every vehicle is three overlapping circles down its length, sized from its real length and width: close to its
// outline, so cars meet bumper to bumper and door to door with no gap. A crash trades momentum by mass (a danfo shoves
// a keke, not the other way round) and an off-centre hit spins the car it hits.

function vehShape(o){
  if(o._shape)return o._shape;
  const P=o.mesh&&o.mesh.userData.P;const xs=P?P.body.map(p=>p[0]):[-2.25,2.3];
  const L=Math.max(...xs)-Math.min(...xs),W=P?P.W:1.84,mid=(Math.max(...xs)+Math.min(...xs))/2;
  return o._shape={L,W,mid,r:W/2,m:Math.max(.25,L*W/8.3)};   // a sedan weighs 1
}
function vehCircles(o,x,z,h){
  const s=vehShape(o),f=fwdOf(h),d=Math.max(0,s.L/2-s.W/2);
  return [-d,0,d].map(k=>({x:x+f.x*(k+s.mid),z:z+f.z*(k+s.mid)}));
}
// the deepest overlap between two vehicles: how far, along which direction (from b to a) and where they touch
function vehContact(a,ax,az,ah,b,bx,bz,bh){
  const A=vehCircles(a,ax,az,ah),B=vehCircles(b,bx,bz,bh),R=vehShape(a).r+vehShape(b).r;let best=null;
  for(const p of A)for(const q of B){const dx=p.x-q.x,dz=p.z-q.z,d=Math.hypot(dx,dz);
    if(d<R&&(!best||R-d>best.pen)){const n=d>1e-4?{x:dx/d,z:dz/d}:{x:1,z:0};best={pen:R-d,n,cx:(p.x+q.x)/2,cz:(p.z+q.z)/2};}}
  return best;
}
const cross2=(rx,rz,ix,iz)=>rx*iz-rz*ix;

// ---------- the player's cruiser, every frame while driving
function carCollide(dt){
  const S=vehShape(pc);pc.kspin=(pc.kspin||0)*Math.exp(-dt*4);pc.h+=pc.kspin*dt;
  // buildings and walls: each circle is pushed out on its own, the car moves by the biggest push
  let mx=0,mz=0,hit=false,hc=null;
  for(const c of vehCircles(pc,pc.x,pc.z,pc.h)){const o={x:c.x,z:c.z};if(pushOut(o,S.r+.04)){hit=true;const dx=o.x-c.x,dz=o.z-c.z;if(!hc||dx*dx+dz*dz>hc.d)hc={c,d:dx*dx+dz*dz};if(Math.abs(dx)>Math.abs(mx))mx=dx;if(Math.abs(dz)>Math.abs(mz))mz=dz;}}
  if(hit){
    pc.x+=mx;pc.z+=mz;const d=Math.hypot(mx,mz)||1,nx=mx/d,nz=mz/d,vn=pc.vx*nx+pc.vz*nz;
    if(vn<0){pc.vx-=1.25*vn*nx;pc.vz-=1.25*vn*nz;pc.vx*=.85;pc.vz*=.85;   // bounce a little off the wall, scrape along it
      if(-vn>4&&hc)dentVehicle(pc,hc.c.x-nx*S.r,hc.c.z-nz*S.r,nx,nz,Math.min(.42,(-vn-3.5)*.04));
      if(-vn>7){damageCar(-vn*1.1);flashT=.3;shake=.5;SFX.blip('crash');}else if(-vn>2.5)SFX.blip('punch');}
  }
  carHitsSuspects(Math.hypot(pc.vx,pc.vz),dt);
  // other vehicles
  for(const c of aiCars){
    if(c._hitCd>0)c._hitCd-=dt;
    if(Math.abs(c.rx-pc.x)>9||Math.abs(c.rz-pc.z)>9)continue;
    const k=vehContact(pc,pc.x,pc.z,pc.h,c,c.rx,c.rz,c.h);if(!k)continue;
    const A=S,B=vehShape(c),inv=1/A.m+1/B.m;
    // separate them so they just touch, shared by weight
    pc.x+=k.n.x*k.pen*(1/A.m)/inv;pc.z+=k.n.z*k.pen*(1/A.m)/inv;c.x-=k.n.x*k.pen*(1/B.m)/inv;c.z-=k.n.z*k.pen*(1/B.m)/inv;
    const cf=fwdOf(c.h),cvx=cf.x*c.speed+(c.kvx||0),cvz=cf.z*c.speed+(c.kvz||0);
    const vn=(pc.vx-cvx)*k.n.x+(pc.vz-cvz)*k.n.z;if(vn>=0)continue;
    const j=-1.2*vn/inv,ix=j*k.n.x,iz=j*k.n.z;   // a fairly dead impact: metal crumples, cars don't bounce
    pc.vx+=ix/A.m;pc.vz+=iz/A.m;
    c.kvx=(c.kvx||0)-ix/B.m;c.kvz=(c.kvz||0)-iz/B.m;
    // where it was hit decides the spin: a clip on the rear end swings the car round
    c.kspin=(c.kspin||0)-cross2(k.cx-c.rx,k.cz-c.rz,ix,iz)/(B.m*B.L*B.L/10);
    pc.kspin+=cross2(k.cx-pc.x,k.cz-pc.z,ix,iz)/(A.m*A.L*A.L/10);
    const hard=-vn;c.speed*=hard>3?.15:.7;if(hard>3)c.stunT=1.6+hard*.06;
    if(hard>3.5){const dep=Math.min(.42,(hard-3)*.04);dentVehicle(pc,k.cx,k.cz,k.n.x,k.n.z,dep*(B.m/(A.m+B.m))*2);dentVehicle(c,k.cx,k.cz,-k.n.x,-k.n.z,dep*(A.m/(A.m+B.m))*2);}
    if(hard>2.5&&!(c._hitCd>0)){c._hitCd=1;
      if(hard>5){SFX.blip('crash');shake=Math.min(.6,hard*.05);flashT=.25;}else SFX.blip('punch');
      if(chase&&c===chase.car&&c.mode==='flee')chase.meter+=Math.min(.3,hard*.03);
      else if(hard>5){damageCar(hard*.9);addRep(-1);toast('Collision with a civilian vehicle. Reputation −1.','bad');}}
  }
}
// a knocked vehicle drifts and spins, waits a moment, then its driver steers back into the lane
function carKnock(c,dt){
  if(c.stunT>0){c.stunT-=dt;c.speed=Math.min(c.speed,.6);}
  if(!c.kvx&&!c.kvz&&!c.kspin)return;
  c.x+=(c.kvx||0)*dt;c.z+=(c.kvz||0)*dt;c.h+=(c.kspin||0)*dt;
  const o={x:c.x,z:c.z};if(pushOut(o,vehShape(c).r)){c.x=o.x;c.z=o.z;c.kvx*=.3;c.kvz*=.3;}
  const k=Math.exp(-dt*2.6);c.kvx*=k;c.kvz*=k;c.kspin*=Math.exp(-dt*3);
  if(Math.hypot(c.kvx,c.kvz)<.05)c.kvx=c.kvz=0;if(Math.abs(c.kspin)<.02)c.kspin=0;
}

// ---------- pedestrians: most jump out of the way; hit one at speed and they go down, then get up
function pedCar(p,x,z,dt){
  if(!inCar)return;const sp=Math.hypot(pc.vx,pc.vz);
  const f=fwdOf(pc.h),rx=x-pc.x,rz=z-pc.z,al=rx*f.x+rz*f.z,lat=rx*f.z-rz*f.x;
  // they see the cruiser coming and jump aside (some don't look up in time)
  if(!p.dodge&&sp>4&&al>0&&al<sp*1.1+3&&Math.abs(lat)<2.4){
    if(p.alert==null)p.alert=Math.random()<.8;
    // they jump away from the car's path, on their side of it
    if(p.alert){const side=lat>=0?1:-1;p.dodge={t:.55,vx:f.z*side*5.5,vz:-f.x*side*5.5};}
  }
  if(p.dodge){p.ox+=p.dodge.vx*dt;p.oz+=p.dodge.vz*dt;p.dodge.t-=dt;if(p.dodge.t<=0){p.dodge=null;p.alert=null;}}
  // contact with the bodywork
  const S=vehShape(pc),px=x+(p.dodge?p.dodge.vx*dt:0),pz=z+(p.dodge?p.dodge.vz*dt:0);
  for(const c of vehCircles(pc,pc.x,pc.z,pc.h)){const dx=px-c.x,dz=pz-c.z,d=Math.hypot(dx,dz)||.01,R=S.r+.28;
    if(d>=R)continue;
    if(sp>3.5){pedKnock(p,x,z,sp);return true;}
    p.ox+=dx/d*(R-d);p.oz+=dz/d*(R-d);   // a nudge at walking pace: they step back to the bumper, no gap
    return false;}
  return false;
}
function pedKnock(p,x,z,sp){
  const f=fwdOf(pc.h);const v=Math.min(sp*.75,14);
  p.hit={t:0,x,z,vx:pc.vx*.75+(Math.random()-.5)*2,vz:pc.vz*.75+(Math.random()-.5)*2,h:Math.atan2(-f.x,-f.z),lie:rnd(3.5,5),v};
  p.dodge=null;p.mesh.rotation.order='YXZ';resetPose(p.mesh);
  pc.vx*=.88;pc.vz*=.88;shake=Math.min(.5,sp*.03);SFX.blip('punch');damageCar(Math.min(8,sp*.4));
  if(typeof RUSH!=='undefined'&&RUSH)rushEvent('Hit a pedestrian',-300,false);
  trustDelta(-6,sp>12?'You hit a pedestrian at speed. Paramedics are on the way.':'You knocked a pedestrian down.');
}
// thrown, sliding, lying still, then getting up and walking on
function pedHit(p,dt){
  const H=p.hit;H.t+=dt;const m=p.mesh;m.visible=true;
  if(H.t<1.1){const k=Math.exp(-dt*3.2);H.vx*=k;H.vz*=k;H.x+=H.vx*dt;H.z+=H.vz*dt;const o={x:H.x,z:H.z};pushOut(o,.35);H.x=o.x;H.z=o.z;}
  const fall=clamp(H.t/.45,0,1),up=H.t>H.lie?clamp((H.t-H.lie)/.7,0,1):0,tilt=(1-up)*fall;
  const air=H.t<.45?Math.sin(H.t/.45*Math.PI)*Math.min(.8,H.v*.06):0;
  m.position.set(H.x,.2+air+tilt*.05,H.z);m.rotation.set(-tilt*Math.PI/2,H.h,tilt*.25);
  if(H.t>H.lie+.7){
    // back on their feet: carry on from here, easing back onto the pavement
    const q=pedPos(p);p.ox=H.x-q.x;p.oz=H.z-q.z;p.hit=null;m.rotation.set(0,q.h,0);m.rotation.order='XYZ';
  }
}

// ---------- visible damage: impacts push the bodywork in where they hit
// A damaged vehicle gets its own copy of its shapes (other cars of the same model share theirs) and the vertices
// near the impact are pushed in along it, deepest at the point of contact. A wrecked cruiser comes back repaired.
function vehBox(o){
  if(o._box)return o._box;const m=o.mesh,r=m.rotation.y,p=m.position.clone();m.rotation.y=0;m.position.set(0,0,0);m.updateMatrixWorld(true);
  const b=new THREE.Box3();m.traverseVisible(k=>{if(k.isMesh&&!(o.scuffs||[]).includes(k)&&k.geometry){k.geometry.computeBoundingBox();b.union(k.geometry.boundingBox.clone().applyMatrix4(k.matrixWorld));}});
  m.rotation.y=r;m.position.copy(p);m.updateMatrixWorld(true);return o._box=b;
}
function dentVehicle(o,wx,wz,dx,dz,depth){
  if(!o||!o.mesh||depth<=.005)return;
  o.dentSum=(o.dentSum||0)+depth;if(o.dentSum>1.2)return;           // past this it is about as crumpled as it gets
  o.mesh.updateMatrixWorld(true);
  // the impact as found is between the cars' collision circles, inside the body: move it out to the bodywork, on the
  // panel the hit came through, and push in square to that panel
  const B=vehBox(o),lp=o.mesh.worldToLocal(new THREE.Vector3(wx,0,wz)),cz=(B.min.z+B.max.z)/2,hx=(B.max.x-B.min.x)/2,hz=(B.max.z-B.min.z)/2;
  let x=lp.x,z=lp.z-cz;const side=Math.abs(x)/hx>=Math.abs(z)/hz;
  if(side){x=Math.sign(x||1)*hx;z=clamp(z,-hz*.9,hz*.9);}else{z=Math.sign(z||1)*hz;x=clamp(x,-hx*.85,hx*.85);}
  const y=B.min.y+(B.max.y-B.min.y)*(side?.42:.32),nl=side?new THREE.Vector3(Math.sign(x),0,0):new THREE.Vector3(0,0,Math.sign(z));
  const P=o.mesh.localToWorld(new THREE.Vector3(x,y,z+cz)),D=nl.clone().transformDirection(o.mesh.matrixWorld).negate(),inv=new THREE.Matrix4(),ws=new THREE.Vector3();
  o.lastDent={x:P.x,z:P.z,nx:-D.x,nz:-D.z};
  dentScuff(o,P,D,depth,side);
  o.mesh.traverseVisible(m=>{
    if(!m.isMesh||!m.geometry||!m.geometry.attributes.position||m.isSprite)return;
    m.getWorldScale(ws);const sc=(ws.x+ws.y+ws.z)/3||1;
    inv.copy(m.matrixWorld).invert();const lp=P.clone().applyMatrix4(inv),ld=D.clone().transformDirection(inv);
    const g=m.geometry;if(!g.boundingSphere)g.computeBoundingSphere();
    const R=.9/sc;if(g.boundingSphere.center.distanceTo(lp)>g.boundingSphere.radius+R)return;
    if(!m.userData.dentGeo){m.userData.geo0=g;m.geometry=g.clone();m.userData.dentGeo=true;}
    // no panel goes in further than 14 cm however often it is hit: a dent, not a hole through to the chassis
    const pos=m.geometry.attributes.position,a=pos.array,a0=m.userData.geo0.attributes.position.array,dl=depth/sc,cap=.14/sc;const moved=[];
    for(let i=0;i<a.length;i+=3){const ex=a[i]-lp.x,ey=(a[i+1]-lp.y)*1.6,ez=a[i+2]-lp.z,d2=ex*ex+ey*ey+ez*ez;
      if(d2>=R*R)continue;const f=1-d2/(R*R),k=f*f*dl;a[i]+=ld.x*k;a[i+1]+=ld.y*k;a[i+2]+=ld.z*k;
      const ux=a[i]-a0[i],uy=a[i+1]-a0[i+1],uz=a[i+2]-a0[i+2],u=Math.hypot(ux,uy,uz);
      if(u>cap){const q=cap/u;a[i]=a0[i]+ux*q;a[i+1]=a0[i+1]+uy*q;a[i+2]=a0[i+2]+uz*q;}
      moved.push(i);}
    if(moved.length){pos.needsUpdate=true;dentNormals(m.geometry,moved);}
  });
}
// new normals for the dented vertices only, shared between the triangles that meet at a point so the dent shades as one
// smooth hollow; the rest of the body keeps the normals it was modelled with
function dentNormals(g,moved){
  const pos=g.attributes.position,nor=g.attributes.normal;if(!nor)return;
  const a=pos.array,n=nor.array,ix=g.index?g.index.array:null,cnt=ix?ix.length:a.length/3,acc=new Map(),key=i=>Math.round(a[i]*500)+','+Math.round(a[i+1]*500)+','+Math.round(a[i+2]*500);
  const hit=new Set(moved);
  for(let t=0;t<cnt;t+=3){const i0=(ix?ix[t]:t)*3,i1=(ix?ix[t+1]:t+1)*3,i2=(ix?ix[t+2]:t+2)*3;
    if(!hit.has(i0)&&!hit.has(i1)&&!hit.has(i2))continue;
    const ux=a[i1]-a[i0],uy=a[i1+1]-a[i0+1],uz=a[i1+2]-a[i0+2],vx=a[i2]-a[i0],vy=a[i2+1]-a[i0+1],vz=a[i2+2]-a[i0+2];
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    for(const i of [i0,i1,i2]){if(!hit.has(i))continue;const k=key(i);let e=acc.get(k);if(!e){e=[0,0,0];acc.set(k,e);}e[0]+=nx;e[1]+=ny;e[2]+=nz;}}
  for(const i of moved){const e=acc.get(key(i));if(!e)continue;const l=Math.hypot(e[0],e[1],e[2])||1;n[i]=e[0]/l;n[i+1]=e[1]/l;n[i+2]=e[2]/l;}
  nor.needsUpdate=true;
}
// scraped, creased metal where the hit landed: a mark on the bodywork that moves with the car (up to four a car)
let SCUFF=null;
function dentScuff(o,P,D,depth,side){
  if(depth<.05)return;o.scuffs=o.scuffs||[];if(o.scuffs.length>=4)return;
  if(!SCUFF){
    // a shallow dent: an irregular hollow shaded dark below and lit along its top lip, a couple of creases, and short scrapes to bare metal
    const [c,g]=mkC(256,128);g.clearRect(0,0,256,128);
    for(let i=0;i<9;i++){const x=128+rnd(-34,34),y=64+rnd(-14,14),rx=rnd(40,70),ry=rnd(22,34);
      const gr=g.createRadialGradient(x,y+6,2,x,y,rx);gr.addColorStop(0,'rgba(18,18,22,.16)');gr.addColorStop(.7,'rgba(30,30,36,.08)');gr.addColorStop(1,'rgba(30,30,36,0)');
      g.fillStyle=gr;g.beginPath();g.ellipse(x,y,rx,ry,rnd(-.2,.2),0,Math.PI*2);g.fill();}
    g.strokeStyle='rgba(255,255,255,.28)';g.lineWidth=3;g.beginPath();g.moveTo(62,46);g.bezierCurveTo(100,30,160,30,196,48);g.stroke();
    for(let i=0;i<3;i++){const y=rnd(56,82),x0=rnd(74,100),x1=rnd(156,182),cy=y+rnd(-10,10);
      g.strokeStyle='rgba(10,10,14,.35)';g.lineWidth=rnd(1.5,2.5);g.beginPath();g.moveTo(x0,y);g.quadraticCurveTo(128,cy,x1,y+rnd(-5,5));g.stroke();
      g.strokeStyle='rgba(255,255,255,.22)';g.lineWidth=1;g.beginPath();g.moveTo(x0,y-2.5);g.quadraticCurveTo(128,cy-2.5,x1,y-2.5);g.stroke();}
    for(let i=0;i<14;i++){const y=rnd(48,90),x=rnd(60,150);g.strokeStyle=`rgba(200,202,208,${rnd(.35,.7)})`;g.lineWidth=rnd(.6,1.2);
      g.beginPath();g.moveTo(x,y);g.lineTo(x+rnd(25,55),y+rnd(-2,2));g.stroke();}
    SCUFF=new THREE.MeshLambertMaterial({map:ctex(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4});}
  const lp=o.mesh.worldToLocal(P.clone());if(o.scuffs.some(q=>q.position.distanceTo(lp)<.6/o.mesh.scale.x))return;   // the same spot hit again: the dent deepens, not the decal
  const w=Math.min(1.25,.6+depth*1.8),m=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.5),SCUFF);
  o.mesh.add(m);m.position.copy(o.mesh.worldToLocal(P.clone().addScaledVector(D,Math.min(.14,depth)*.3-.012)));m.lookAt(P.clone().addScaledVector(D,-1));m.rotateZ(rnd(-.15,.15));
  o.scuffs.push(m);
}
function repairVehicle(o){
  if(!o||!o.mesh)return;o.dentSum=0;
  (o.scuffs||[]).forEach(m=>{o.mesh.remove(m);m.geometry.dispose();});o.scuffs=[];
  o.mesh.traverse(m=>{if(m.userData&&m.userData.dentGeo){m.geometry.dispose();m.geometry=m.userData.geo0;m.userData.dentGeo=false;m.userData.geo0=null;}});
}
// a wreck is towed and replaced: the new cruiser has no dents; traffic that leaves the city frees its dented copies
damageCar=(base=>function(n){const before=pc.damage;base(n);if(pc.damage<before)repairVehicle(pc);})(damageCar);
removeAICar=(base=>function(c){if(c&&c.dentSum)repairVehicle(c);return base(c);})(removeAICar);

// ---------- engine smoke once the cruiser is badly damaged
const SMOKE={puffs:[],t:0,mat:null};
function smokeFrame(dt){
  if(!SMOKE.mat){const [c,g]=mkC(64,64);const gr=g.createRadialGradient(32,32,2,32,32,30);gr.addColorStop(0,'rgba(70,70,74,.9)');gr.addColorStop(1,'rgba(70,70,74,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
    SMOKE.mat=new THREE.SpriteMaterial({map:ctex(c),transparent:true,depthWrite:false});}
  const dmg=pc.damage||0;SMOKE.t-=dt;
  if(dmg>55&&SMOKE.t<=0&&SMOKE.puffs.length<16&&pc.mesh.visible){
    SMOKE.t=dmg>80?.08:.2;const f=fwdOf(pc.h),S=vehShape(pc),s=new THREE.Sprite(SMOKE.mat.clone());
    s.position.set(pc.x+f.x*(S.L/2-.7)+rnd(-.2,.2),1.05,pc.z+f.z*(S.L/2-.7)+rnd(-.2,.2));s.scale.setScalar(.5);scene.add(s);
    SMOKE.puffs.push({s,t:0,life:rnd(1.4,2.2),vx:-pc.vx*.15+rnd(-.2,.2),vz:-pc.vz*.15+rnd(-.2,.2),dark:dmg>80});}
  for(const p of SMOKE.puffs){p.t+=dt;const k=p.t/p.life;p.s.position.x+=p.vx*dt;p.s.position.z+=p.vz*dt;p.s.position.y+=dt*(.9+k);
    p.s.scale.setScalar(.5+k*2.2);p.s.material.opacity=(p.dark?.85:.55)*(1-k);}
  SMOKE.puffs=SMOKE.puffs.filter(p=>{if(p.t<p.life)return true;scene.remove(p.s);p.s.material.dispose();return false;});
}

// ---------- suspects on foot: the cruiser doesn't pass through them; hit at speed, they go down (and it's reviewed)
function carHitsSuspects(sp,dt){
  const S=vehShape(pc),C=vehCircles(pc,pc.x,pc.z,pc.h);
  const touch=(x,z)=>{for(const c of C){const dx=x-c.x,dz=z-c.z,d=Math.hypot(dx,dz)||.01,R=S.r+.3;if(d<R)return {dx:dx/d,dz:dz/d,pen:R-d};}return null;};
  // a runner on a foot chase
  if(runner){const r=runner,k=touch(r.x,r.z);
    if(k&&sp>3.5){runner=null;const t=toast;toast=()=>{};try{cbRunnerTurns(r);}finally{toast=t;}   // becomes a suspect on the ground, without the "turns to fight" call-out
      const a=CB.foes[CB.foes.length-1];vehicleStrike(a,sp);}
    else if(k){r.x+=k.dx*k.pen;r.z+=k.dz*k.pen;}}
  for(const a of CB.foes){
    if(['cuffed','cuffing','comply','escaped'].includes(a.state)||a.carT>0)continue;
    const k=touch(a.x,a.z);if(!k)continue;
    if(sp>3.5&&a.state!=='down')vehicleStrike(a,sp);else{a.x+=k.dx*k.pen;a.z+=k.dz*k.pen;}
  }
  for(const a of CB.foes){if(a.carT>0)a.carT-=dt;if(a.slide){a.x+=a.slide.vx*dt;a.z+=a.slide.vz*dt;const k=Math.exp(-dt*4.4);a.slide.vx*=k;a.slide.vz*=k;
    const o={x:a.x,z:a.z};pushOut(o,.35);a.x=o.x;a.z=o.z;if(Math.hypot(a.slide.vx,a.slide.vz)<.2)a.slide=null;}}
}
function vehicleStrike(a,sp){
  a.slide={vx:pc.vx*.7,vz:pc.vz*.7};a.carT=1;pc.vx*=.85;pc.vz*=.85;shake=Math.min(.5,sp*.03);SFX.blip('punch');
  cbDown(a,6+Math.min(6,sp*.3),'Hit by your cruiser. They are down.');CB.force=true;
  trustDelta(sp>12?-5:-3,'Vehicle strike on a suspect: it goes to the use-of-force review.');
}
frame=(base=>function(){const t0=tAcc;base();if(started)smokeFrame(tAcc-t0);})(frame);
