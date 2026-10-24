// Street work end to end: traffic stop, robbery case (witness, CCTV, bank records, arrest, interview, raid), car and foot chases, kidnap rescue, phone layout.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html'});r.end(fs.readFileSync(f));}).listen(8094,'127.0.0.1');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
  const pg=await b.newPage({viewport:{width:1100,height:700}});
  await pg.route('https://fonts.**',r=>r.abort());
  const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' | ')));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  const ev=f=>pg.evaluate(f);const wait=ms=>pg.waitForTimeout(ms);
  // advance a conversation to its last line, then pick a choice (conversations vary in length: low trust adds lines)
  const toChoice=async()=>{for(let i=0;i<30;i++){const st=await ev(()=>DLG?{last:DLG.i===DLG.lines.length-1&&DLG.ch>=DLG.lines[DLG.i].text.length,n:DLG.choices.length}:null);if(!st||(st.last&&st.n))return;await pg.keyboard.press('KeyE');await wait(120);}};
  const talkThrough=async(choice=0)=>{await toChoice();if(await ev(()=>!!DLG)){await pg.click(`#dlg [data-ch="${choice}"]`);await wait(150);}};
  // raids: suspects fight back now, so taser each one before cuffing (as in t19); rescue the child; leave civilians alone
  const clearRaid=async()=>{
    for(let k=0;k<20;k++){const r=await ev(()=>{if(!raidS)return 'none';const a=raidS.actors.find(a=>a.kind!=='civ'&&a.state!=='cuffed'&&a.state!=='escaped'&&a.state!=='rescued');if(!a)return 'done';
      if(a.kind==='sus'&&a.state==='fight'){pl.x=a.x+1.2;pl.z=a.z;pl.h=Math.atan2(a.x-pl.x,a.z-pl.z);cbSelect(2);CB.cd=0;cbUse();}
      a.t=99;pl.x=a.x+.8;pl.z=a.z;raidInteract();let i=0;while(CUFF&&i++<40)cuffStep(.25);return a.kind+':'+a.state;});
      if(r==='none'||r==='done')break;}
    await ev(()=>{if(raidS&&raidS.done)raidS.outT=.1;});for(let i=0;i<15&&await ev(()=>!!raidS);i++)await ev(()=>_step(10));
  };
  await pg.goto('http://127.0.0.1:8094/');await wait(400);await ev(()=>localStorage.setItem('p9-quality','high'));await pg.reload();await wait(600);
  await pg.screenshot({path:'e_title.png'});
  await pg.fill('#cFirst','ade');await pg.fill('#cLast','ola');await pg.click('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:60000});
  await ev(()=>{PERF.off=true;$('#chap').hidden=true;ST().step='done';gps=null;CB.incT=1e9;});await ev(()=>{window._step=(n)=>{const r=renderer.render;renderer.render=()=>{};clock3.getDelta=()=>.05;for(let i=0;i<n;i++)frame();renderer.render=r;};clock3.getDelta=()=>.05;});
  ok(await ev(()=>started),'the shift starts');
  await pg.keyboard.down('KeyW');await wait(2500);await pg.keyboard.up('KeyW');
  await pg.screenshot({path:'e_drive.png'});
  // night look
  await ev(()=>{worldMin=22*60;});await wait(800);await pg.screenshot({path:'e_night.png'});await ev(()=>{worldMin=10*60;});
  // traffic stop: put a speeding car 15 m ahead and let the radar lock it (placing and stepping in one
  // call so the live render loop can't move things in between; try another car if the lock fails)
  ok(await ev(()=>{const cs=aiCars.filter(c=>c.seg==='edge'&&c.mode==='drive');for(const c of cs){c.cruise=c.speed=22;c.speeding=true;c.runsRed=false;pc.x=c.x-Math.sin(c.h)*15;pc.z=c.z-Math.cos(c.h)*15;pc.h=c.h;pc.vx=Math.sin(c.h)*c.speed;pc.vz=Math.cos(c.h)*c.speed;_step(3);if(target){window._c=target;Object.assign(target,{cruise:22,speed:22,speeding:true,runsRed:false});return true;}}return false;}),'the radar locks a speeding car');
  await pg.keyboard.press('Space');await ev(()=>{if(suspect)suspect.willFlee=false;});
  for(let i=0;i<70;i++){await ev(()=>{const s=suspect;if(s&&s.mode==='drive'){pc.x=s.x-Math.sin(s.h)*14;pc.z=s.z-Math.cos(s.h)*14;pc.h=s.h;pc.vx=Math.sin(s.h)*s.speed;pc.vz=Math.cos(s.h)*s.speed;}else{pc.vx*=.5;pc.vz*=.5;}});await ev(()=>_step(4));if(await ev(()=>suspect&&suspect.mode==='stopped'))break;}
  ok((await ev(()=>suspect&&suspect.mode))==='stopped','the driver pulls over');
  await pg.screenshot({path:'e_pulled.png'});
  await ev(()=>{pc.vx=pc.vz=0;const s=suspect;pc.x=s.x-Math.sin(s.h)*9;pc.z=s.z-Math.cos(s.h)*9;});
  await pg.keyboard.press('KeyF');await ev(()=>{const s=suspect;pl.x=s.rx+Math.cos(s.h)*1.8;pl.z=s.rz-Math.sin(s.h)*1.8;});await ev(()=>_step(3));
  ok(/driver/.test(await ev(()=>nearest&&nearest.label)),'walking up offers to talk to the driver');
  await pg.keyboard.press('KeyE');await wait(1500);
  await pg.screenshot({path:'e_window.png'});
  // some drivers now offer a bribe and the dialogue waits for a choice: refuse it ("I'm writing you up")
  for(let i=0;i<20&&!(await pg.$('#stopForm'));i++){if(await ev(()=>DLG&&DLG.choices.length&&DLG.i===DLG.lines.length-1&&DLG.ch>=DLG.lines[DLG.i].text.length))await pg.click('#dlg [data-ch="0"]');else await pg.keyboard.press('KeyE');await wait(500);}
  ok(!!await pg.$('#stopForm'),'the traffic stop form opens');
  await pg.click('#chkLic');await pg.click('#chkPlate');await pg.click('#tier-t1');await pg.click('#stopSubmit');await wait(300);
  await pg.screenshot({path:'e_ticket.png'});await pg.click('#stopSubmit');await wait(300);
  ok((r=>r[0]==='drive'&&!r[1]&&!r[2])(await ev(()=>[_c.mode,!!cine,!!suspect])),'the driver drives off after the stop');
  // robbery case
  await pg.keyboard.press('KeyF');await wait(100);
  await pg.keyboard.press('Tab');await wait(300);await pg.screenshot({path:'e_mdt.png'});await ev(()=>startCase(makeCase('robbery',99,{free:true})));await wait(300);
  await ev(()=>{inCar=false;pl.mesh.visible=true;pl.x=LOC.bankGuard.x+1.5;pl.z=LOC.bankGuard.z;});await ev(()=>_step(3));
  ok(/bank security/.test(await ev(()=>nearest&&nearest.label)),'the bank security man can be questioned');
  await pg.keyboard.press('KeyE');await wait(1200);await pg.screenshot({path:'e_talk.png'});
  await talkThrough();
  ok((await ev(()=>curCase.evidence.map(e=>e.id))).includes('tattoo'),'his statement goes in the case file');
  // CCTV
  await ev(()=>{pl.x=LOC.bankCam.x+1.2;pl.z=LOC.bankCam.z;});await ev(()=>_step(3));
  await pg.keyboard.press('KeyE');await wait(800);
  await ev(()=>{cctvCam(1);cctv.t=13.7;_step(1);});
  await pg.screenshot({path:'e_cctv.png'});
  // click on car: project its position
  const pt=await ev(()=>{const a=cctv.R.actors.find(a=>a.clue&&a.clue[0]==='plate');camera.updateMatrixWorld();camera.matrixWorldInverse.copy(camera.matrixWorld).invert();const v=a.mesh.position.clone();v.y=.8;v.project(camera);return {x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight,vis:a.mesh.visible};});
  await pg.mouse.click(pt.x,pt.y);await wait(200);ok(/ENHANCED/.test((await pg.innerText('#cMsg')).slice(0,120)),'clicking the getaway car on CCTV enhances the plate');
  await ev(()=>{cctvCam(0);cctv.t=7.6;_step(1);});await pg.screenshot({path:'e_cctv1.png'});
  await pg.click('#cDone');await wait(300);
  ok((r=>!r.cine&&!r.cctv&&!r.modal&&!r.dlg)(await ev(()=>({cine:!!cine,cctv:!!cctv,modal:modalOpen(),dlg:!!DLG,tab:mdtTab}))),'closing the CCTV returns to the street');
  // bank flag via MDT
  await pg.keyboard.press('Tab');await wait(200);await pg.click('[data-t="case"]');await wait(200);const lt=await pg.$$eval('.lead b',x=>x.map(y=>y.textContent));
  await pg.click(`[data-l="${lt.findIndex(t=>t.includes('flagged'))}"]`);await wait(200);
  await wait(200);await pg.click(`[data-r="${await ev(()=>curCase.bankRows.findIndex(r=>r[5]==='hit'))}"]`);await pg.click('#bDone');
  // arrest A at door
  await ev(()=>{const A=curCase.A;curCase.fleeChance[A.id]=0;setGPS(A.door.x,A.door.z,'x',A.id);pl.x=A.door.x+A.door.nx*2;pl.z=A.door.z+A.door.nz*2;});await ev(()=>_step(3));
  ok(!!(await ev(()=>nearest&&nearest.label)),'the first suspect can be approached at home');
  await pg.keyboard.press('KeyE');await wait(900);await pg.screenshot({path:'e_door.png'});
  await toChoice();
  await pg.click('#dlg [data-ch="0"]');await wait(400);
  ok((r=>!!r&&r[1]==='scene')(await ev(()=>prisoner&&[prisoner.p.name,prisoner.state])),'arresting them plays the cuffing scene');
  // the cuffing scene plays first, then the prisoner follows; the walk to the cruiser and the
  // charge room are covered by t23, so book them straight in here
  await ev(()=>{let i=0;while(CUFF&&i++<40)cuffStep(.25);});
  ok((await ev(()=>prisoner&&prisoner.state))==='follow','then the prisoner follows you');await ev(()=>{pl.x+=3;_step(15);});await pg.screenshot({path:'e_escort.png'});
  await ev(()=>{book();_step(2);});
  ok((await ev(()=>curCase.custody.length))>=1,'booked into custody');
  // interrogation
  await ev(()=>{addEv(curCase,'plate','CCTV: getaway vehicle','x','CCTV');});
  await ev(()=>{inCar=false;pl.mesh.visible=true;pl.x=LOC.interview.x+1;pl.z=LOC.interview.z;});await ev(()=>_step(3));
  await pg.keyboard.press('KeyE');await wait(200);await pg.click('[data-q]');await wait(1500);
  await pg.screenshot({path:'e_interview.png'});
  await ev(()=>{addEv(curCase,'plate','CCTV: getaway vehicle','x','CCTV');});
  const evs=await pg.$$eval('[data-e]',b=>b.map(x=>x.innerText));await pg.click(`[data-e="${evs.findIndex(e=>e.includes('getaway'))}"]`);await wait(1200);
  await pg.screenshot({path:'e_crack.png'});
  ok((await ev(()=>Object.keys(curCase.cracked).length))>=1,'CCTV evidence cracks the interview');await pg.click('#ivDone');await wait(300);
  // raid
  await ev(()=>{curCase.flags.hideout=true;curCase.flags.backIntel=true;const m=LOC.motels[curCase.hide.place];pl.x=m.x+m.nx*3;pl.z=m.z+m.nz*3;});await ev(()=>_step(3));
  ok(/raid/i.test(await ev(()=>nearest&&nearest.label)),'the hideout offers a SWAT raid');
  await pg.keyboard.press('KeyE');await wait(800);await toChoice();
  await pg.screenshot({path:'e_brief.png'});
  await pg.click('#dlg [data-ch="1"]');await wait(800);
  ok(await ev(()=>!!raidS),'the raid starts');await pg.screenshot({path:'e_raid.png'});
  // auto-play raid: teleport to each actor and cuff
  await clearRaid();
  await pg.screenshot({path:'e_raid2.png'});
  ok((r=>!r[0]&&r[1])(await ev(()=>[!!raidS,curCase&&curCase.custody.includes(curCase.C.id),!!chase])),'raid cleared and the ringleader is in custody');
  // chase test
  await ev(()=>{const B=curCase.B;inCar=true;pl.mesh.visible=false;startCarChase(curCase,B,B.door,()=>{});});
  for(let i=0;i<60;i++){await ev(()=>{const c=chase&&chase.car;if(c&&c.mode==='flee'){pc.x=c.x-Math.sin(c.h)*9;pc.z=c.z-Math.cos(c.h)*9;pc.h=c.h;pc.vx=Math.sin(c.h)*c.speed;pc.vz=Math.cos(c.h)*c.speed;}else{pc.vx=pc.vz=0;}});await ev(()=>_step(4));if(await ev(()=>chase&&chase.car.mode==='caught'))break;}
  await pg.screenshot({path:'e_chase.png'});ok((await ev(()=>chase&&chase.car.mode))==='caught','staying close boxes in a fleeing car');
  await ev(()=>{const s=suspect;pc.vx=pc.vz=0;inCar=false;pl.mesh.visible=true;pl.x=s.rx+Math.cos(s.h)*1.8;pl.z=s.rz-Math.sin(s.h)*1.8;_step(2);});ok(/Arrest/.test(await ev(()=>nearest&&nearest.label)),'the boxed-in driver can be arrested');
  await pg.keyboard.press('KeyE');await wait(200);await ev(()=>{let i=0;while(CUFF&&i++<40)cuffStep(.25);});
  ok(!!(await ev(()=>prisoner&&prisoner.p.name)),'the driver becomes your prisoner');
  // foot chase
  await ev(()=>{dropPrisoner();const p=curCase.people[6];startFootChase(curCase,p,{x:pl.x+5,z:pl.z,nx:1,nz:0});});await wait(400);
  await ev(()=>{pl.x=runner.x+.5;pl.z=runner.z;_step(1);pl.x=runner?runner.x+.5:pl.x;pl.z=runner?runner.z:pl.z;_step(1);});
  // a caught runner may turn and fight (45%): put them down and cuff them, as in t19
  await ev(()=>{const a=CB.foes.find(f=>f.p);if(a){a.state='down';a.t=99;pl.x=a.x+.7;pl.z=a.z;interact();let i=0;while(CUFF&&i++<40)cuffStep(.25);}});
  ok(!(await ev(()=>!!runner))&&!!(await ev(()=>prisoner&&prisoner.p.name)),'a runner caught on foot ends up in cuffs');
  await pg.keyboard.press('Tab');await wait(200);const cc=await pg.$('#closeCase');if(cc){await cc.click();await wait(300);await pg.screenshot({path:'e_report.png'});await pg.click('#rOk');}
  // kidnap: CCTV school + trace + raid
  await pg.keyboard.press('Tab');await wait(200);await ev(()=>startCase(makeCase('kidnap',77,{free:true})));await wait(300);
  await ev(()=>{inCar=false;pl.mesh.visible=true;pl.x=LOC.schoolCam.x+1.2;pl.z=LOC.schoolCam.z;});await ev(()=>_step(3));await pg.keyboard.press('KeyE');await wait(700);
  await ev(()=>{cctv.t=6.5;_step(1);});await pg.screenshot({path:'e_cctv_school.png'});
  await ev(()=>{cctvCam(1);cctv.t=14.55;_step(1);});await pg.screenshot({path:'e_cctv_traffic.png'});
  await pg.click('#cDone');
  await ev(()=>{curCase.flags.safehouse=true;const d=curCase.safe.door;pl.x=d.x+d.nx*3;pl.z=d.z+d.nz*3;});await ev(()=>_step(3));
  await pg.keyboard.press('KeyE');await wait(600);await toChoice();await pg.click('#dlg [data-ch="0"]');await wait(600);
  await clearRaid();
  ok(await ev(()=>curCase&&curCase.flags.rescued),'the kidnap raid rescues the child');
  // mobile: portrait shows the "turn your phone" prompt, the game itself runs in landscape
  const m=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  m.on('pageerror',e=>errs.push('M '+e.message));await m.route('https://fonts.**',r=>r.abort());
  await m.goto('http://127.0.0.1:8094/');await m.waitForTimeout(800);await m.screenshot({path:'f_title.png'});
  ok(await m.evaluate(()=>!!$('#rotate')&&getComputedStyle($('#rotate')).display!=='none'),'portrait phones are asked to turn to landscape');
  await m.setViewportSize({width:844,height:390});await m.waitForTimeout(500);
  await m.fill('#cFirst','ade');await m.fill('#cLast','ola');await m.click('#startBtn');await m.waitForFunction(()=>started,null,{timeout:60000});await m.waitForTimeout(1500);await m.screenshot({path:'f_play.png'});
  // the optional models/manifest.json is not in the build, so its 404 is expected
  ok(errs.filter(e=>!/status of 404/.test(e)).length===0,'no page errors: '+JSON.stringify(errs.filter(e=>!/status of 404/.test(e))));await b.close();srv.close();
})();
