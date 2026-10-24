const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
  const pg=await b.newPage({viewport:{width:1100,height:700}});
  await pg.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('three/package/build/three.min.js'),contentType:'application/javascript'}));
  await pg.route('https://fonts.**',r=>r.abort());
  const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' | ')));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  const ev=f=>pg.evaluate(f);const wait=ms=>pg.waitForTimeout(ms);
  await pg.goto('file://'+process.cwd()+'/wrapped.html');await wait(400);await ev(()=>localStorage.setItem('p9-quality','high'));await pg.reload();await wait(600);
  await pg.screenshot({path:'e_title.png'});
  await pg.click('#startBtn');await wait(4000);await ev(()=>{window._step=(n)=>{const r=renderer.render;renderer.render=()=>{};clock3.getDelta=()=>.05;for(let i=0;i<n;i++)frame();renderer.render=r;};clock3.getDelta=()=>.05;});
  console.log('started',await ev(()=>started), errs.slice(0,3));
  await pg.keyboard.down('KeyW');await wait(2500);await pg.keyboard.up('KeyW');
  await pg.screenshot({path:'e_drive.png'});
  // night look
  await ev(()=>{worldMin=22*60;});await wait(800);await pg.screenshot({path:'e_night.png'});await ev(()=>{worldMin=10*60;});
  // traffic stop
  await ev(()=>{const c=aiCars.find(c=>c.seg==='edge'&&c.mode==='drive');window._c=c;c.cruise=c.speed=22;c.speeding=true;c.runsRed=false;pc.x=c.x-Math.sin(c.h)*15;pc.z=c.z-Math.cos(c.h)*15;pc.h=c.h;pc.vx=Math.sin(c.h)*c.speed;pc.vz=Math.cos(c.h)*c.speed;});
  await ev(()=>_step(3));console.log('target',await ev(()=>target===_c));
  await pg.keyboard.press('Space');await ev(()=>{if(suspect)suspect.willFlee=false;});
  for(let i=0;i<70;i++){await ev(()=>{const s=suspect;if(s&&s.mode==='drive'){pc.x=s.x-Math.sin(s.h)*14;pc.z=s.z-Math.cos(s.h)*14;pc.h=s.h;pc.vx=Math.sin(s.h)*s.speed;pc.vz=Math.cos(s.h)*s.speed;}else{pc.vx*=.5;pc.vz*=.5;}});await ev(()=>_step(4));if(await ev(()=>suspect&&suspect.mode==='stopped'))break;}
  console.log('stop mode',await ev(()=>suspect&&suspect.mode));
  await pg.screenshot({path:'e_pulled.png'});
  await ev(()=>{pc.vx=pc.vz=0;const s=suspect;pc.x=s.x-Math.sin(s.h)*9;pc.z=s.z-Math.cos(s.h)*9;});
  await pg.keyboard.press('KeyF');await ev(()=>{const s=suspect;pl.x=s.rx+Math.cos(s.h)*1.8;pl.z=s.rz-Math.sin(s.h)*1.8;});await ev(()=>_step(3));
  console.log('near',await ev(()=>nearest&&nearest.label));
  await pg.keyboard.press('KeyE');await wait(1500);
  await pg.screenshot({path:'e_window.png'});
  for(let i=0;i<6&&!(await pg.$('#stopForm'));i++){await pg.keyboard.press('KeyE');await wait(500);}
  console.log('form',!!await pg.$('#stopForm'));
  await pg.click('#chkLic');await pg.click('#chkPlate');await pg.click('#tier-t1');await pg.click('#stopSubmit');await wait(300);
  await pg.screenshot({path:'e_ticket.png'});await pg.click('#stopSubmit');await wait(300);
  console.log('after stop',await ev(()=>[_c.mode,!!cine,!!suspect]));
  // robbery case
  await pg.keyboard.press('KeyF');await wait(100);
  await pg.keyboard.press('Tab');await wait(300);await pg.screenshot({path:'e_mdt.png'});await pg.click('[data-take="robbery"]');await wait(300);
  await ev(()=>{inCar=false;pl.mesh.visible=true;pl.x=LOC.bankGuard.x+1.5;pl.z=LOC.bankGuard.z;});await ev(()=>_step(3));
  console.log('near2',await ev(()=>nearest&&nearest.label));
  await pg.keyboard.press('KeyE');await wait(1200);await pg.screenshot({path:'e_talk.png'});
  for(let i=0;i<8&&await ev(()=>!!DLG);i++){await pg.keyboard.press('KeyE');await wait(250);}
  console.log('ev',await ev(()=>curCase.evidence.map(e=>e.id)));
  // CCTV
  await ev(()=>{pl.x=LOC.bankCam.x+1.2;pl.z=LOC.bankCam.z;});await ev(()=>_step(3));
  await pg.keyboard.press('KeyE');await wait(800);
  await ev(()=>{cctvCam(1);cctv.t=13.7;_step(1);});
  await pg.screenshot({path:'e_cctv.png'});
  // click on car: project its position
  const pt=await ev(()=>{const a=cctv.R.actors.find(a=>a.clue&&a.clue[0]==='plate');camera.updateMatrixWorld();camera.matrixWorldInverse.copy(camera.matrixWorld).invert();const v=a.mesh.position.clone();v.y=.8;v.project(camera);return {x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight,vis:a.mesh.visible};});
  console.log('pt',pt);console.log('dbg',await ev(()=>{const a=cctv.R.actors.find(a=>a.clue&&a.clue[0]==='plate');camera.updateMatrixWorld();scene.updateMatrixWorld();const rc=new THREE.Raycaster();const v=a.mesh.position.clone();v.y=.8;const dir=v.clone().sub(camera.position).normalize();rc.set(camera.position,dir);const h=rc.intersectObjects([a.mesh],true);const r=$('#gl').getBoundingClientRect();return {hits:h.length,rect:[r.left,r.top,r.width,r.height],inner:[innerWidth,innerHeight],cam:camera.position.toArray().map(x=>x.toFixed(1)),car:a.mesh.position.toArray().map(x=>x.toFixed(1))};}));await pg.mouse.click(pt.x,pt.y);await wait(200);console.log('cmsg',(await pg.innerText('#cMsg')).slice(0,120));
  await ev(()=>{cctvCam(0);cctv.t=7.6;_step(1);});await pg.screenshot({path:'e_cctv1.png'});
  await pg.click('#cDone');await wait(300);
  console.log('state',await ev(()=>({cine:!!cine,cctv:!!cctv,modal:modalOpen(),dlg:!!DLG,tab:mdtTab})));
  // bank flag via MDT
  await pg.keyboard.press('Tab');await wait(200);const lt=await pg.$$eval('.lead b',x=>x.map(y=>y.textContent));
  await pg.click(`[data-l="${lt.findIndex(t=>t.includes('flagged'))}"]`);await wait(200);
  const rows=await pg.$$eval('tbody tr',trs=>trs.map(t=>t.innerText));await pg.click(`[data-r="${rows.findIndex(r=>r.includes('9,800'))}"]`);await pg.click('#bDone');
  // arrest A at door
  await ev(()=>{const A=curCase.A;curCase.fleeChance[A.id]=0;setGPS(A.door.x,A.door.z,'x',A.id);pl.x=A.door.x+A.door.nx*2;pl.z=A.door.z+A.door.nz*2;});await ev(()=>_step(3));
  console.log('near3',await ev(()=>nearest&&nearest.label));
  await pg.keyboard.press('KeyE');await wait(900);await pg.screenshot({path:'e_door.png'});
  for(let i=0;i<4;i++){await pg.keyboard.press('KeyE');await wait(250);}
  await pg.click('#dlg [data-ch="0"]');await wait(400);
  console.log('prisoner',await ev(()=>prisoner&&[prisoner.p.name,prisoner.state]));
  await ev(()=>{pl.x+=3;});await ev(()=>_step(15));await pg.screenshot({path:'e_escort.png'});
  // walk to car + seat
  await ev(()=>{pc.x=pl.x+3;pc.z=pl.z;pc.vx=pc.vz=0;prisoner.x=pl.x;prisoner.z=pl.z+1;});await wait(200);
  await pg.keyboard.press('KeyF');await ev(()=>_step(2));console.log('seated',await ev(()=>prisoner&&prisoner.state),await ev(()=>inCar));
  await ev(()=>{pc.x=LOC.book.x;pc.z=LOC.book.z;pc.vx=pc.vz=0;});await ev(()=>_step(3));
  console.log('walkin',await ev(()=>prisoner&&prisoner.state));await pg.screenshot({path:'e_walkin.png'});
  for(let i=0;i<30&&await ev(()=>!!prisoner);i++)await ev(()=>_step(10));
  console.log('custody',await ev(()=>curCase.custody.length));
  // interrogation
  await ev(()=>{addEv(curCase,'plate','CCTV: getaway vehicle','x','CCTV');});
  await pg.keyboard.press('KeyF');await ev(()=>{pl.x=LOC.interview.x+1;pl.z=LOC.interview.z;});await ev(()=>_step(3));
  await pg.keyboard.press('KeyE');await wait(200);await pg.click('[data-q]');await wait(1500);
  await pg.screenshot({path:'e_interview.png'});
  await ev(()=>{addEv(curCase,'plate','CCTV: getaway vehicle','x','CCTV');});
  const evs=await pg.$$eval('[data-e]',b=>b.map(x=>x.innerText));await pg.click(`[data-e="${evs.findIndex(e=>e.includes('getaway'))}"]`);await wait(1200);
  await pg.screenshot({path:'e_crack.png'});
  console.log('cracked',await ev(()=>Object.keys(curCase.cracked).length));await pg.click('#ivDone');await wait(300);
  // raid
  await ev(()=>{curCase.flags.hideout=true;curCase.flags.backIntel=true;const m=LOC.motels[curCase.hide.place];pl.x=m.x+m.nx*3;pl.z=m.z+m.nz*3;});await ev(()=>_step(3));
  console.log('near4',await ev(()=>nearest&&nearest.label));
  await pg.keyboard.press('KeyE');await wait(800);for(let i=0;i<4;i++){await pg.keyboard.press('KeyE');await wait(200);}
  await pg.screenshot({path:'e_brief.png'});
  await pg.click('#dlg [data-ch="1"]');await wait(800);
  console.log('raid',await ev(()=>!!raidS));await pg.screenshot({path:'e_raid.png'});
  // auto-play raid: teleport to each actor and cuff
  for(let k=0;k<20;k++){const r=await ev(()=>{if(!raidS)return 'none';const a=raidS.actors.find(a=>a.state!=='cuffed'&&a.state!=='escaped'&&a.state!=='rescued'&&a.kind!=='civ');if(!a)return 'done';pl.x=a.x+.6;pl.z=a.z;return a.kind+':'+a.state;});if(r==='none'||r==='done')break;await wait(250);await pg.keyboard.press('KeyE');await ev(()=>_step(2));}
  await pg.screenshot({path:'e_raid2.png'});
  for(let i=0;i<15&&await ev(()=>!!raidS);i++)await ev(()=>_step(10));
  console.log('after raid',await ev(()=>[!!raidS,curCase&&curCase.custody.includes(curCase.C.id),!!chase]));
  // chase test
  await ev(()=>{const B=curCase.B;inCar=true;pl.mesh.visible=false;startCarChase(curCase,B,B.door,()=>{});});
  for(let i=0;i<60;i++){await ev(()=>{const c=chase&&chase.car;if(c&&c.mode==='flee'){pc.x=c.x-Math.sin(c.h)*9;pc.z=c.z-Math.cos(c.h)*9;pc.h=c.h;pc.vx=Math.sin(c.h)*c.speed;pc.vz=Math.cos(c.h)*c.speed;}else{pc.vx=pc.vz=0;}});await ev(()=>_step(4));if(await ev(()=>chase&&chase.car.mode==='caught'))break;}
  await pg.screenshot({path:'e_chase.png'});console.log('chase',await ev(()=>chase&&chase.car.mode));
  await pg.keyboard.press('KeyF');await ev(()=>{const s=suspect;pl.x=s.rx+Math.cos(s.h)*1.8;pl.z=s.rz-Math.sin(s.h)*1.8;_step(2);});await pg.keyboard.press('KeyE');await wait(200);
  console.log('prisoner2',await ev(()=>prisoner&&prisoner.p.name));
  // foot chase
  await ev(()=>{dropPrisoner();const p=curCase.people[6];startFootChase(curCase,p,{x:pl.x+5,z:pl.z,nx:1,nz:0});});await wait(400);
  await ev(()=>{pl.x=runner.x+.5;pl.z=runner.z;_step(1);pl.x=runner?runner.x+.5:pl.x;pl.z=runner?runner.z:pl.z;_step(1);});console.log('foot',await ev(()=>!!runner),await ev(()=>prisoner&&prisoner.p.name));
  await pg.keyboard.press('Tab');await wait(200);const cc=await pg.$('#closeCase');if(cc){await cc.click();await wait(300);await pg.screenshot({path:'e_report.png'});await pg.click('#rOk');}
  // kidnap: CCTV school + trace + raid
  await pg.keyboard.press('Tab');await wait(200);await pg.click('[data-t="dispatch"]');await pg.click('[data-take="kidnap"]');await wait(300);
  await ev(()=>{inCar=false;pl.mesh.visible=true;pl.x=LOC.schoolCam.x+1.2;pl.z=LOC.schoolCam.z;});await ev(()=>_step(3));await pg.keyboard.press('KeyE');await wait(700);
  await ev(()=>{cctv.t=6.5;_step(1);});await pg.screenshot({path:'e_cctv_school.png'});
  await ev(()=>{cctvCam(1);cctv.t=14.55;_step(1);});await pg.screenshot({path:'e_cctv_traffic.png'});
  await pg.click('#cDone');
  await ev(()=>{curCase.flags.safehouse=true;const d=curCase.safe.door;pl.x=d.x+d.nx*3;pl.z=d.z+d.nz*3;});await ev(()=>_step(3));
  await pg.keyboard.press('KeyE');await wait(600);for(let i=0;i<4;i++){await pg.keyboard.press('KeyE');await wait(200);}await pg.click('#dlg [data-ch="0"]');await wait(600);
  for(let k=0;k<20;k++){const r=await ev(()=>{if(!raidS)return 'none';const a=raidS.actors.find(a=>a.state!=='cuffed'&&a.state!=='escaped'&&a.state!=='rescued'&&a.kind!=='civ');if(!a)return 'done';pl.x=a.x+.6;pl.z=a.z;return a.kind;});if(r==='none'||r==='done')break;await wait(250);await pg.keyboard.press('KeyE');await ev(()=>_step(2));}
  for(let i=0;i<15&&await ev(()=>!!raidS);i++)await ev(()=>_step(10));
  console.log('rescued',await ev(()=>curCase&&curCase.flags.rescued));
  // mobile
  const m=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await m.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('three/package/build/three.min.js'),contentType:'application/javascript'}));
  m.on('pageerror',e=>errs.push('M '+e.message));
  await m.goto('file://'+process.cwd()+'/wrapped.html');await m.waitForTimeout(800);await m.screenshot({path:'f_title.png'});
  await m.click('#startBtn');await m.waitForTimeout(3500);await m.screenshot({path:'f_play.png'});
  console.log('ERRORS',errs);await b.close();
})();
