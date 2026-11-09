// Collisions: cars meet bodywork to bodywork (no gap) side-on, head-on and against walls; an off-centre hit spins the
// other car; a pedestrian who doesn't see you is knocked down and gets up later, one who does jumps aside, and a slow
// nudge leaves them at the bumper.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html'});r.end(fs.readFileSync(f));}).listen(8104,'127.0.0.1');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:1000,height:600}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.route('https://fonts.**',r=>r.abort());
  await pg.goto('http://127.0.0.1:8104/');await pg.waitForTimeout(600);
  await pg.fill('#cFirst','ade');await pg.fill('#cLast','ola');await pg.click('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:60000});
  const ev=(f,a)=>pg.evaluate(f,a);
  await ev(()=>{PERF.off=true;CB.incT=1e9;$('#chap').hidden=true;ST().step='done';gps=null;
    window._step=n=>{const r=renderer.render;renderer.render=()=>{};clock3.getDelta=()=>.05;for(let i=0;i<n;i++)frame();renderer.render=r;};
    // the true outline of a vehicle and the gap between two outlines (negative when they overlap)
    window.rect=(o,x,z,h)=>{const s=vehShape(o),f=fwdOf(h),r={x:f.z,z:-f.x},L=s.L/2,W=s.W/2,cx=x+f.x*s.mid,cz=z+f.z*s.mid;return [[L,W],[L,-W],[-L,-W],[-L,W]].map(([a,b])=>({x:cx+f.x*a+r.x*b,z:cz+f.z*a+r.z*b}));};
    const segD=(p,a,b)=>{const vx=b.x-a.x,vz=b.z-a.z,t=clamp(((p.x-a.x)*vx+(p.z-a.z)*vz)/(vx*vx+vz*vz),0,1);return Math.hypot(p.x-a.x-vx*t,p.z-a.z-vz*t);};
    const inside=(p,R)=>{let s=0;for(let i=0;i<4;i++){const a=R[i],b=R[(i+1)%4];const c=(b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x);s+=c>0?1:-1;}return Math.abs(s)===4;};
    window.gap=(A,B)=>{let d=1e9;for(let i=0;i<4;i++)for(let j=0;j<4;j++){d=Math.min(d,segD(A[i],B[j],B[(j+1)%4]),segD(B[j],A[i],A[(i+1)%4]));}return A.some(p=>inside(p,B))||B.some(p=>inside(p,A))?-d:d;};
    // a quiet stretch of road away from traffic and buildings: the middle of a road edge
    window.spot=()=>{const q=pedPos({b:[2,2],u:3,dir:1});return q;};
    aiCars.slice().forEach(removeAICar);peds.forEach(p=>{p.mesh.visible=false;p.u=1e6;});});
  // place the cruiser and a parked sedan, drive the cruiser at them, report the outline gap afterwards
  const crash=(ang,off,speed,steps=40)=>ev(([ang,off,speed,steps])=>{
    aiCars.slice().forEach(removeAICar);const c=spawnAICar({model:'Corolla',mode:'parked'});c.mode='parked';c.speed=c.cruise=0;c._shape=null;
    inCar=true;pl.mesh.visible=false;pc.h=0;pc.x=520;pc.z=300;pc.kspin=0;
    c.h=ang;c.x=c.rx=pc.x+off;c.z=c.rz=pc.z+7;c.latOff=0;c.kvx=c.kvz=c.kspin=0;c.mesh.position.set(c.x,0,c.z);
    const h0=c.h,x0=c.x;pc.vx=0;pc.vz=speed;keys.up=0;
    for(let i=0;i<steps;i++){_step(1);keys.up=1;}keys.up=0;_step(1);
    return {gap:+gap(rect(pc,pc.x,pc.z,pc.h),rect(c,c.rx,c.rz,c.h)).toFixed(2),spin:+(c.h-h0).toFixed(2),moved:+Math.hypot(c.x-x0,c.z-(pc.z)).toFixed(1),dmg:pc.damage};},[ang,off,speed,steps]);
  let r=await crash(Math.PI/2,0,8);
  ok(r.gap<.25&&r.gap>-.35,'driving into the side of a car: the cars touch, no gap ('+r.gap+' m between outlines)');
  r=await crash(Math.PI,0,8);
  ok(r.gap<.25&&r.gap>-.35,'head-on: bumper to bumper ('+r.gap+' m)');
  r=await crash(0,1.3,12);
  ok(Math.abs(r.spin)>.15,'clipping the rear corner of a car spins it ('+r.spin+' rad)');
  // walls: drive the cruiser's side into a building
  r=await ev(()=>{aiCars.slice().forEach(removeAICar);const B=BOXES.find(b=>b.x1-b.x0>12&&b.z1-b.z0>12);pc.h=Math.PI/2;pc.x=B.x0-4;pc.z=(B.z0+B.z1)/2;pc.kspin=0;
    // slide sideways into it at 6 m/s
    pc.vx=0;pc.vz=0;for(let i=0;i<30;i++){pc.vx=6;pc.vz=0;_step(1);}
    const R=rect(pc,pc.x,pc.z,pc.h);return +(B.x0-Math.max(...R.map(p=>p.x))).toFixed(2);});
  ok(r<.25&&r>-.3,'sliding into a building: the car stops against the wall ('+r+' m)');
  // pedestrians
  const ped=(alert,speed)=>ev(([alert,speed])=>{aiCars.slice().forEach(removeAICar);const p=peds[0];p.u=0;p.hit=null;p.dodge=null;p.alert=alert;
    const q=pedPos(p);p.ox=p.oz=0;const t0=career.rep;
    // the cruiser lined up on the pedestrian, 14 m back
    const f={x:Math.sin(1.1),z:Math.cos(1.1)};pc.h=1.1;pc.x=q.x-f.x*14;pc.z=q.z-f.z*14;pc.kspin=0;p.sp=0;
    let clear=99;for(let i=0;i<40&&!p.hit;i++){pc.vx=f.x*speed;pc.vz=f.z*speed;_step(1);const pq=pedPos(p),x=pq.x+p.ox,z=pq.z+p.oz;
      clear=Math.min(clear,Math.min(...vehCircles(pc,pc.x,pc.z,pc.h).map(c=>Math.hypot(x-c.x,z-c.z)))-vehShape(pc).r-.28);}
    return {hit:!!p.hit,trust:career.rep-t0,clear:+clear.toFixed(2)};},[alert,speed]);
  r=await ped(false,13);
  ok(r.hit&&r.trust<0,'a pedestrian who doesn\'t see you coming is knocked down, and it costs trust ('+r.trust+')');
  r=await ev(()=>{const p=peds[0];pc.vx=pc.vz=0;_step(14);const lying=Math.abs(p.mesh.rotation.x)>1.3;for(let i=0;i<140&&p.hit;i++)_step(1);return [lying,!p.hit,Math.abs(p.mesh.rotation.x)<.05];});
  ok(r[0],'they fall and lie on the ground');ok(r[1]&&r[2],'a few seconds later they get up and walk on');
  r=await ped(true,13);
  ok(!r.hit&&r.clear>0,'a pedestrian who sees you jumps out of the way (the car passes '+r.clear+' m clear)');
  r=await ev(()=>{const p=peds[0];p.hit=null;p.dodge=null;p.alert=false;const q=pedPos(p);p.ox=p.oz=0;p.sp=0;const f={x:Math.sin(1.1),z:Math.cos(1.1)};pc.h=1.1;pc.x=q.x-f.x*4;pc.z=q.z-f.z*4;
    for(let i=0;i<30;i++){pc.vx=f.x*2;pc.vz=f.z*2;_step(1);}const pq=pedPos(p),x=pq.x+p.ox,z=pq.z+p.oz;
    const d=Math.min(...vehCircles(pc,pc.x,pc.z,pc.h).map(c=>Math.hypot(x-c.x,z-c.z)))-vehShape(pc).r-.28;return [!!p.hit,+d.toFixed(2)];});
  ok(!r[0]&&Math.abs(r[1])<.15,'nudging someone at walking pace: no knock-down, they stay right at the bumper ('+r[1]+' m)');
  // visible damage: the car hit at speed is dented where it was hit; another car of the same model is not
  const dents=o=>{let n=0;o.mesh.traverse(m=>{if(m.userData&&m.userData.dentGeo)n++;});return n;};
  r=await ev(()=>{peds.forEach(p=>{p.hit=null;p.mesh.visible=false;p.u=1e6;});pc.damage=0;repairVehicle(pc);return 1;});
  r=await crash(Math.PI/2,0,14);
  r=await ev(()=>{const c=aiCars[0];const other=spawnAICar({model:'Corolla',mode:'parked'});
    // measure how far the struck car's bodywork moved, compared with its untouched shape
    let maxMove=0;c.mesh.traverse(m=>{if(m.userData&&m.userData.dentGeo){const a=m.geometry.attributes.position.array,b=m.userData.geo0.attributes.position.array;for(let i=0;i<a.length;i++)maxMove=Math.max(maxMove,Math.abs(a[i]-b[i]));}});
    let n=0;c.mesh.traverse(m=>{if(m.userData&&m.userData.dentGeo)n++;});let o=0;other.mesh.traverse(m=>{if(m.userData&&m.userData.dentGeo)o++;});let p=0;pc.mesh.traverse(m=>{if(m.userData&&m.userData.dentGeo)p++;});
    removeAICar(other);return {n,o,p,maxMove:+maxMove.toFixed(3)};});
  ok(r.n>0&&r.maxMove>.02,'a car hit at 50 km/h is dented where it was hit ('+r.n+' parts, up to '+r.maxMove+' model units)');
  ok(r.p>0,'the cruiser is dented too');
  ok(r.o===0,'another car of the same model stays undamaged');
  r=await ev(()=>{pc.damage=70;_step(30);return SMOKE.puffs.length;});
  ok(r>2,'a badly damaged cruiser smokes ('+r+' puffs)');
  r=await ev(()=>{damageCar(40);let n=0;pc.mesh.traverse(m=>{if(m.userData&&m.userData.dentGeo)n++;});return [pc.damage,n];});
  ok(r[0]<100&&r[1]===0,'a wrecked cruiser is towed and comes back repaired, no dents');
  // suspects on foot
  const suspect=(speed,state)=>ev(([speed,state])=>{aiCars.slice().forEach(removeAICar);CB.foes.forEach(a=>scene.remove(a.mesh));CB.foes=[];
    pc.h=0;pc.x=520;pc.z=300;pc.kspin=0;inCar=true;const m=makePersonMesh(randLook());scene.add(m);
    const a={x:pc.x,z:pc.z+6,h:Math.PI,mesh:m,state,ph:0,street:true};cbArm(a,'none');a.atkCd=99;CB.foes.push(a);const t0=career.rep;
    let minGap=9;for(let i=0;i<30;i++){pc.vx=0;pc.vz=speed;_step(1);minGap=Math.min(minGap,Math.min(...vehCircles(pc,pc.x,pc.z,pc.h).map(c=>Math.hypot(a.x-c.x,a.z-c.z)))-vehShape(pc).r-.3);}
    return {state:a.state,trust:career.rep-t0,minGap:+minGap.toFixed(2)};},[speed,state]);
  r=await suspect(12,'fight');
  ok(r.state==='down'&&r.trust<0,'a suspect hit at speed goes down, and the vehicle strike costs trust ('+r.trust+')');
  r=await suspect(2,'fight');
  ok(r.state==='fight'&&r.minGap>-.12,'at walking pace the cruiser only nudges a suspect, and doesn\'t pass through them ('+r.minGap+' m)');
  r=await ev(()=>{CB.foes.forEach(a=>scene.remove(a.mesh));CB.foes=[];const cs=makeCase('robbery',555,{free:true});startCase(cs);pc.h=0;pc.x=520;pc.z=300;inCar=true;
    startFootChase(cs,cs.C,{x:pc.x,z:pc.z+6,nx:0,nz:1});runner.x=pc.x;runner.z=pc.z+6;
    // steer at the runner, as a player would: they jink as they run
    for(let i=0;i<40&&runner;i++){pc.h=Math.atan2(runner.x-pc.x,runner.z-pc.z);pc.vx=Math.sin(pc.h)*12;pc.vz=Math.cos(pc.h)*12;_step(1);}const a=CB.foes.find(f=>f.p===cs.C);return [runner===null,a&&a.state];});
  ok(r[0]&&r[1]==='down','hitting a runner on a foot chase puts them on the ground, ready to cuff');
  ok(!errs.length,'no page errors: '+JSON.stringify(errs));
  await b.close();srv.close();})();
