// Arresting at the door and putting the prisoner in the cruiser, the way a player does it: choose "Arrest" in the
// conversation, let the cuffing scene play out on its own, walk to the cruiser and press F. Also a fight arrest.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html'});r.end(fs.readFileSync(f));}).listen(8103,'127.0.0.1');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:1000,height:600}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.route('https://fonts.**',r=>r.abort());
  await pg.goto('http://127.0.0.1:8103/');await pg.waitForTimeout(600);
  await pg.fill('#cFirst','ade');await pg.fill('#cLast','ola');await pg.click('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:60000});
  const ev=(f,a)=>pg.evaluate(f,a),wait=ms=>pg.waitForTimeout(ms);
  await ev(()=>{PERF.off=true;CB.incT=1e9;$('#chap').hidden=true;ST().step='done';gps=null;
    window._step=n=>{const r=renderer.render;renderer.render=()=>{};clock3.getDelta=()=>.05;for(let i=0;i<n;i++)frame();renderer.render=r;};});
  const toChoice=async()=>{for(let i=0;i<30;i++){const st=await ev(()=>DLG?{last:DLG.i===DLG.lines.length-1&&DLG.ch>=DLG.lines[DLG.i].text.length,n:DLG.choices.length}:null);if(!st||(st.last&&st.n))return;await pg.keyboard.press('KeyE');await wait(120);}};
  // 1. a robbery suspect at home: walk up, talk, choose Arrest
  await ev(()=>{startCase(makeCase('robbery',99,{free:true}));const A=curCase.A;curCase.named[A.id]=true;curCase.fleeChance[A.id]=0;setGPS(A.door.x,A.door.z,'x',A.id,true);
    // park the cruiser across the street from the door
    pc.x=A.door.x+A.door.nx*9;pc.z=A.door.z+A.door.nz*9;pc.vx=pc.vz=0;pc.mesh.position.set(pc.x,0,pc.z);
    inCar=false;pl.mesh.visible=true;pl.x=A.door.x+A.door.nx*2;pl.z=A.door.z+A.door.nz*2;_step(3);});
  ok(/Talk to/.test(await ev(()=>nearest&&nearest.label)),'the suspect can be approached at home');
  await pg.keyboard.press('KeyE');await wait(400);await toChoice();
  await pg.click('#dlg [data-ch="0"]');await wait(200);
  let r=await ev(()=>({cuff:!!CUFF,cine:!!cine,own:!!CUFF&&cine===CUFF.cine,state:prisoner&&prisoner.state}));
  ok(r.cuff&&r.cine&&r.own&&r.state==='scene','choosing Arrest plays the cuffing scene as a close-up');
  // 2. let the game run: the scene must finish by itself
  await ev(()=>_step(80));
  r=await ev(()=>({cuff:!!CUFF,cine:!!cine,state:prisoner&&prisoner.state}));
  ok(!r.cuff&&!r.cine&&r.state==='follow','the cuffing scene finishes on its own and the prisoner follows you ('+JSON.stringify(r)+')');
  // 3. walk to the cruiser (the prisoner follows), press F
  for(let i=0;i<40;i++){const d=await ev(()=>{const dx=pc.x-pl.x,dz=pc.z-pl.z,d=Math.hypot(dx,dz);if(d>2.5){pl.x+=dx/d*.6;pl.z+=dz/d*.6;}_step(2);return d;});if(d<=3)break;}
  r=await ev(()=>[Math.hypot(prisoner.x-pc.x,prisoner.z-pc.z).toFixed(1),prisoner.state]);
  ok(r[1]==='follow'&&+r[0]<14,'the prisoner walked behind you to the cruiser ('+r[0]+' m away)');
  await pg.keyboard.press('KeyF');await wait(300);
  r=await ev(()=>({inCar,state:prisoner&&prisoner.state,inBack:!!prisoner&&prisoner.mesh.parent===pc.mesh}));
  ok(r.inCar&&r.state==='car'&&r.inBack,'pressing F puts the prisoner in the back seat and you behind the wheel');
  await pg.screenshot({path:'a_backseat.png'});
  // 4. a street fight: subdue, cuff (no conversation involved), still finishes
  await ev(()=>{dropPrisoner();inCar=false;pl.mesh.visible=true;const m=makePersonMesh(randLook());scene.add(m);const a={x:pl.x+1.2,z:pl.z,h:0,mesh:m,state:'fight',ph:0,street:true};cbArm(a,'none');a.atkCd=99;CB.foes.push(a);a.state='down';a.t=99;window._a=a;interact();});
  await ev(()=>_step(80));
  ok(await ev(()=>!CUFF&&_a.state==='cuffed'),'a street arrest finishes its cuffing scene on its own too');
  ok(!errs.length,'no page errors: '+JSON.stringify(errs));
  await b.close();srv.close();})();
