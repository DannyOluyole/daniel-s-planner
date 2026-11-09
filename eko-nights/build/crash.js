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
  let mx=0,mz=0,hit=false;
  for(const c of vehCircles(pc,pc.x,pc.z,pc.h)){const o={x:c.x,z:c.z};if(pushOut(o,S.r+.04)){hit=true;const dx=o.x-c.x,dz=o.z-c.z;if(Math.abs(dx)>Math.abs(mx))mx=dx;if(Math.abs(dz)>Math.abs(mz))mz=dz;}}
  if(hit){
    pc.x+=mx;pc.z+=mz;const d=Math.hypot(mx,mz)||1,nx=mx/d,nz=mz/d,vn=pc.vx*nx+pc.vz*nz;
    if(vn<0){pc.vx-=1.25*vn*nx;pc.vz-=1.25*vn*nz;pc.vx*=.85;pc.vz*=.85;   // bounce a little off the wall, scrape along it
      if(-vn>7){damageCar(-vn*1.1);flashT=.3;shake=.5;SFX.blip('crash');}else if(-vn>2.5)SFX.blip('punch');}
  }
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
