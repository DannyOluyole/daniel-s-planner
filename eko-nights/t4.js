const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const pg=await b.newPage({viewport:{width:1100,height:700}});
  await pg.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('three/package/build/three.min.js'),contentType:'application/javascript'}));
  await pg.route('https://fonts.**',r=>r.abort());
  const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' | ')));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  const ev=(f,a)=>pg.evaluate(f,a);const wait=ms=>pg.waitForTimeout(ms);
  const step=n=>ev(n=>_step(n),n);
  const talkThrough=async(choice=0)=>{for(let i=0;i<14;i++){const st=await ev(()=>DLG?{last:DLG.i===DLG.lines.length-1&&DLG.ch>=DLG.lines[DLG.i].text.length,n:DLG.choices.length}:null);if(!st)return;if(st.last){await pg.click(`#dlg [data-ch="${choice}"]`);await wait(150);return;}await pg.keyboard.press('KeyE');await wait(80);}};
  const goTo=async(loc)=>{await ev(l=>{const p=LOC[l]||l;inCar=false;pl.mesh.visible=true;pl.x=p.x+1;pl.z=p.z+.5;_step(3);},loc);};
  const E=async()=>{await pg.keyboard.press('KeyE');await wait(250);};
  await pg.goto('file://'+process.cwd()+'/wrapped.html');await wait(500);
  await pg.screenshot({path:'g_title.png'});
  await pg.click('#startBtn');await wait(200);console.log('msg',await pg.innerText('#loadMsg'));
  await pg.fill('#cFirst','ngozi');await pg.fill('#cLast','adebayo');await pg.click('[data-g="f"]');await pg.click('.sw >> nth=3');
  await pg.click('#startBtn');await wait(4500);
  await ev(()=>{window._step=(n)=>{const r=renderer.render;renderer.render=()=>{};clock3.getDelta=()=>.05;for(let i=0;i<n;i++)frame();renderer.render=r;};clock3.getDelta=()=>.05;});
  await pg.screenshot({path:'g_chap1.png'});
  console.log('officer',await ev(()=>JSON.stringify(career.officer)),await ev(()=>ST().step));
  await ev(()=>{$('#chap').hidden=true;});await step(10);await pg.screenshot({path:'g_street.png'});
  // ch1
  await goTo('bisi');console.log('near',await ev(()=>nearest&&nearest.label));await E();await wait(600);await pg.screenshot({path:'g_bisi.png'});await talkThrough();
  console.log('step',await ev(()=>ST().step));
  // forced bribe stop
  const doStop=async(choice)=>{
    await ev(()=>{inCar=true;pl.mesh.visible=false;const c=aiCars.find(c=>c.seg==='edge'&&c.mode==='drive'&&!c.small);window._c=c;c.cruise=c.speed=20;c.speeding=true;c.runsRed=false;c.willFlee=false;pc.x=c.x-Math.sin(c.h)*15;pc.z=c.z-Math.cos(c.h)*15;pc.h=c.h;pc.vx=Math.sin(c.h)*c.speed;pc.vz=Math.cos(c.h)*c.speed;_step(2);});
    await pg.keyboard.press('Space');await ev(()=>{if(suspect)suspect.willFlee=false;});
    for(let i=0;i<70;i++){await ev(()=>{const s=suspect;if(s&&s.mode==='drive'){pc.x=s.x-Math.sin(s.h)*14;pc.z=s.z-Math.cos(s.h)*14;pc.h=s.h;pc.vx=Math.sin(s.h)*s.speed;pc.vz=Math.cos(s.h)*s.speed;}else{pc.vx*=.5;pc.vz*=.5;}_step(4);});if(await ev(()=>suspect&&suspect.mode==='stopped'))break;}
    await ev(()=>{pc.vx=pc.vz=0;const s=suspect;pc.x=s.x-Math.sin(s.h)*9;pc.z=s.z-Math.cos(s.h)*9;_step(1);});await pg.keyboard.press('KeyF');
    await ev(()=>{const s=suspect;pl.x=s.rx+Math.cos(s.h)*1.8;pl.z=s.rz-Math.sin(s.h)*1.8;_step(2);});await E();await wait(500);
    const lines=await ev(()=>DLG&&DLG.lines.map(l=>l.text).join(' | '));console.log('stop:',lines);
    await pg.screenshot({path:'g_stop.png'});
    await talkThrough(choice);await wait(300);
    if(await pg.$('#stopForm')){await pg.click('#chkLic');await pg.click('#chkPlate');await pg.click('#tier-t2');await pg.click('#stopSubmit');await wait(200);await pg.screenshot({path:'g_ticket.png'});await pg.click('#stopSubmit');}
    await wait(200);
  };
  await doStop(0);console.log('after stop1',await ev(()=>[ST().refused,ST().taken,career.rep,shift.stops]));
  await ev(()=>{ST().flags.forceBribe=true;});await doStop(1);console.log('after stop2',await ev(()=>[ST().refused,ST().taken,career.rep,shift.stops]));
  await doStop(0);await step(12);console.log('after stop3 step',await ev(()=>ST().step));
  await goTo('bisi');await E();await wait(400);await talkThrough();await wait(500);console.log('ch',await ev(()=>[ST().ch,ST().step]));
  await ev(()=>{$('#chap').hidden=true;});
  // ch2
  await goTo('coker');console.log('near',await ev(()=>nearest&&nearest.label));await E();await wait(500);await pg.screenshot({path:'g_coker.png'});await talkThrough();
  console.log('case',await ev(()=>curCase&&curCase.title),await ev(()=>ST().step));
  await ev(()=>{curCase.custody.push(curCase.C.id);_step(15);});
  await pg.keyboard.press('Tab');await wait(200);await pg.screenshot({path:'g_mdt.png'});await pg.click('#closeCase');await wait(200);await pg.click('#rOk');await wait(200);
  console.log('step',await ev(()=>ST().step));
  await goTo('coker');await E();await wait(300);await talkThrough();await wait(600);await pg.screenshot({path:'g_lawyer.png'});await talkThrough(0);await wait(1600);
  console.log('ch3',await ev(()=>[ST().ch,ST().step,ST().refused]));await ev(()=>{$('#chap').hidden=true;});
  // ch3
  await goTo('coker');await E();await wait(300);await talkThrough();
  await ev(()=>{curCase.flags.rescued=true;_step(15);});await pg.keyboard.press('Tab');await wait(200);await pg.click('#closeCase');await wait(200);await pg.click('#rOk');await wait(200);
  await goTo('bisi');await E();await wait(300);await talkThrough();await wait(500);console.log('ch4',await ev(()=>[ST().ch,ST().step]));await ev(()=>{$('#chap').hidden=true;});
  // ch4
  await goTo('bisi');await E();await wait(300);await talkThrough();console.log('leak',await ev(()=>curCase&&curCase.type));
  await goTo('logTerm');console.log('near',await ev(()=>nearest&&nearest.label));await E();await wait(300);await pg.screenshot({path:'g_log.png'});await pg.click('#lgOk');
  await goTo('carpark');await E();await wait(600);
  await ev(()=>{cctv.t=9;_step(1);});await wait(300);await pg.screenshot({path:'g_cctv_leak.png'});
  const pt=await ev(()=>{const a=cctv.R.actors.find(a=>a.clue&&a.clue[0]==='tallOfficer');camera.updateMatrixWorld();camera.matrixWorldInverse.copy(camera.matrixWorld).invert();const v=a.mesh.position.clone();v.y=1.2;v.project(camera);return {x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight};});
  await pg.mouse.click(pt.x,pt.y);await wait(200);console.log('cmsg',(await pg.innerText('#cMsg')).slice(0,100));await pg.click('#cDone');
  await pg.keyboard.press('Tab');await wait(200);const lt=await pg.$$eval('.lead b',x=>x.map(y=>y.textContent));console.log(lt);
  await pg.click(`[data-l="${lt.findIndex(t=>t.includes('payments'))}"]`);await wait(200);await pg.screenshot({path:'g_bank.png'});
  const rows=await pg.$$eval('tbody tr',trs=>trs.map(t=>t.innerText));await pg.click(`[data-r="${rows.findIndex(r=>r.includes('Coker'))}"]`);await pg.click('#bDone');
  console.log('ev',await ev(()=>curCase.evidence.map(e=>e.id)));
  await goTo('interview');console.log('near',await ev(()=>nearest&&nearest.label));await E();await wait(200);
  await pg.click('[data-o="o_Coker"]');await wait(1200);await pg.screenshot({path:'g_confront.png'});await talkThrough(0);await wait(300);await talkThrough(0);await wait(300);
  await step(30);await wait(1500);console.log('modal',await ev(()=>modalOpen()&&$('#modal').innerText.slice(0,80)));
  if(await pg.$('#rOk'))await pg.click('#rOk');await wait(200);
  console.log('after leak',await ev(()=>[ST().step,ST().flags.cokerArrested]));
  await goTo('bisi');await E();await wait(300);await talkThrough();await wait(500);await ev(()=>{$('#chap').hidden=true;});
  // ch5
  await goTo('bisi');await E();await wait(300);await talkThrough();console.log('finale',await ev(()=>curCase&&[curCase.type,curCase.flags.informant,career.rep]));
  if(await ev(()=>curCase.flags.informant)){await goTo('informant');await E();await wait(300);await pg.screenshot({path:'g_informant.png'});await talkThrough();}
  await ev(()=>{const m=LOC.motels['Wharf Warehouse 7'];pl.x=m.x+m.nx*3;pl.z=m.z+m.nz*3;_step(3);});console.log('near',await ev(()=>nearest&&nearest.label));
  await E();await wait(400);await talkThrough(1);await wait(500);console.log('raid',await ev(()=>!!raidS));
  for(let k=0;k<20;k++){const r=await ev(()=>{if(!raidS)return 'none';const a=raidS.actors.find(a=>a.state!=='cuffed'&&a.state!=='escaped'&&a.state!=='rescued'&&a.kind!=='civ');if(!a)return 'done';pl.x=a.x+.6;pl.z=a.z;return a.kind;});if(r==='none'||r==='done')break;await step(2);await pg.keyboard.press('KeyE');await step(2);}
  for(let i=0;i<15&&await ev(()=>!!raidS);i++)await step(10);
  await step(30);await wait(1500);if(await pg.$('#rOk'))await pg.click('#rOk');await wait(800);
  await pg.screenshot({path:'g_ending.png'});console.log('end',await ev(()=>[ST().step,modalOpen()&&$('#modal').innerText.slice(0,60)]));
  // traffic visuals
  if(await pg.$('#eOk'))await pg.click('#eOk');
  await ev(()=>{const c=aiCars.find(c=>c.model==='Danfo');if(c){inCar=true;pl.mesh.visible=false;pc.x=c.x-Math.sin(c.h)*12;pc.z=c.z-Math.cos(c.h)*12;pc.h=c.h;pc.vx=pc.vz=0;camPos.init=false;}});await wait(1200);await pg.screenshot({path:'g_danfo.png'});
  await ev(()=>{const c=aiCars.find(c=>c.model==='Okada')||aiCars.find(c=>c.model==='Keke');if(c){pc.x=c.x-Math.sin(c.h)*9;pc.z=c.z-Math.cos(c.h)*9;pc.h=c.h;camPos.init=false;}});await wait(1200);await pg.screenshot({path:'g_okada.png'});
  console.log('ERRORS',errs);await b.close();
})();
