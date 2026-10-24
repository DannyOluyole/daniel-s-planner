// Creating an officer and chapter 1's traffic duty: refusing and taking bribes, reporting back. Traffic visuals.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html'});r.end(fs.readFileSync(f));}).listen(8095,'127.0.0.1');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const pg=await b.newPage({viewport:{width:1100,height:700}});
  await pg.route('https://fonts.**',r=>r.abort());
  const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' | ')));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  const ev=(f,a)=>pg.evaluate(f,a);const wait=ms=>pg.waitForTimeout(ms);
  const step=n=>ev(n=>_step(n),n);
  const talkThrough=async(choice=0)=>{for(let i=0;i<14;i++){const st=await ev(()=>DLG?{last:DLG.i===DLG.lines.length-1&&DLG.ch>=DLG.lines[DLG.i].text.length,n:DLG.choices.length}:null);if(!st)return;if(st.last){await pg.click(`#dlg [data-ch="${choice}"]`);await wait(150);return;}await pg.keyboard.press('KeyE');await wait(80);}};
  const goTo=async(loc)=>{await ev(l=>{const p=LOC[l]||l;inCar=false;pl.mesh.visible=true;pl.x=p.x+1;pl.z=p.z+.5;_step(3);},loc);};
  const E=async()=>{await pg.keyboard.press('KeyE');await wait(250);};
  await pg.goto('http://127.0.0.1:8095/');await wait(500);
  await pg.screenshot({path:'g_title.png'});
  await pg.click('#startBtn');await wait(200);ok(/first name and surname/.test(await pg.innerText('#loadMsg')),'starting without a name asks for one');
  await pg.fill('#cFirst','ngozi');await pg.fill('#cLast','adebayo');await pg.click('[data-g="f"]');await pg.click('.sw >> nth=3');
  await pg.click('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:60000});await wait(1500);await ev(()=>{PERF.off=true;CB.incT=1e9;});
  await ev(()=>{window._step=(n)=>{const r=renderer.render;renderer.render=()=>{};clock3.getDelta=()=>.05;for(let i=0;i<n;i++)frame();renderer.render=r;};clock3.getDelta=()=>.05;});
  await pg.screenshot({path:'g_chap1.png'});
  ok(await ev(()=>{const o=career.officer;return o.first==='Ngozi'&&o.last==='Adebayo'&&o.gender==='f'&&o.skin===SKIN[3];}),'the officer is created as entered: name, female, skin tone');
  await ev(()=>{$('#chap').hidden=true;});await step(10);await pg.screenshot({path:'g_street.png'});
  // ch1
  await goTo('bisi');ok(/Bisi Okafor/.test(await ev(()=>nearest&&nearest.label)),'chapter 1 starts with Sgt Bisi Okafor');await E();await wait(600);await pg.screenshot({path:'g_bisi.png'});await talkThrough();
  ok(await ev(()=>CH[1].steps[ST().i].k==='duty'),'her briefing sends you on traffic duty');
  // forced bribe stop
  const doStop=async(choice)=>{
    await ev(()=>{inCar=true;pl.mesh.visible=false;const c=aiCars.find(c=>c.seg==='edge'&&c.mode==='drive'&&!c.small);window._c=c;c.cruise=c.speed=20;c.speeding=true;c.runsRed=false;c.willFlee=false;pc.x=c.x-Math.sin(c.h)*15;pc.z=c.z-Math.cos(c.h)*15;pc.h=c.h;pc.vx=Math.sin(c.h)*c.speed;pc.vz=Math.cos(c.h)*c.speed;_step(2);});
    await pg.keyboard.press('Space');await ev(()=>{if(suspect)suspect.willFlee=false;});
    for(let i=0;i<70;i++){await ev(()=>{const s=suspect;if(s&&s.mode==='drive'){pc.x=s.x-Math.sin(s.h)*14;pc.z=s.z-Math.cos(s.h)*14;pc.h=s.h;pc.vx=Math.sin(s.h)*s.speed;pc.vz=Math.cos(s.h)*s.speed;}else{pc.vx*=.5;pc.vz*=.5;}_step(4);});if(await ev(()=>suspect&&suspect.mode==='stopped'))break;}
    await ev(()=>{pc.vx=pc.vz=0;const s=suspect;pc.x=s.x-Math.sin(s.h)*9;pc.z=s.z-Math.cos(s.h)*9;_step(1);});await pg.keyboard.press('KeyF');
    await ev(()=>{const s=suspect;pl.x=s.rx+Math.cos(s.h)*1.8;pl.z=s.rz-Math.sin(s.h)*1.8;_step(2);});await E();await wait(500);
    
    await pg.screenshot({path:'g_stop.png'});
    await talkThrough(choice);await wait(300);
    if(await pg.$('#stopForm')){await pg.click('#chkLic');await pg.click('#chkPlate');await pg.click('#tier-t2');await pg.click('#stopSubmit');await wait(200);await pg.screenshot({path:'g_ticket.png'});await pg.click('#stopSubmit');}
    await wait(200);
  };
  await doStop(0);const s1=await ev(()=>[ST().refused,ST().taken,career.rep,shift.stops]);ok(s1[0]===1&&s1[1]===0&&s1[3]===1,'first stop: the driver offers a bribe and you refuse it');
  await ev(()=>{ST().flags.forceBribe=true;});await doStop(1);const s2=await ev(()=>[ST().refused,ST().taken,career.rep,shift.stops]);ok(s2[1]===1&&s2[2]<s1[2]&&s2[3]===2,'second stop: taking the bribe costs public trust');
  await doStop(0);for(let i=0;i<30&&await ev(()=>ST().i<2);i++){await step(4);await wait(100);}
  ok(await ev(()=>ST().i===2),'three stops finish traffic duty');
  await goTo('bisi');await E();await wait(400);await talkThrough();await wait(500);
  ok(await ev(()=>{const st=CH[1].steps[ST().i];return st.k==='talk'&&st.who==='grace';}),'reporting back to Bisi leads on to Mrs. Grace Eze');
  // the rest of the story is played through in t6
  await ev(()=>{$('#chap').hidden=true;});
  // traffic visuals
  if(await pg.$('#eOk'))await pg.click('#eOk');
  await ev(()=>{const c=aiCars.find(c=>c.model==='Danfo');if(c){inCar=true;pl.mesh.visible=false;pc.x=c.x-Math.sin(c.h)*12;pc.z=c.z-Math.cos(c.h)*12;pc.h=c.h;pc.vx=pc.vz=0;camPos.init=false;}});await wait(1200);await pg.screenshot({path:'g_danfo.png'});ok(await ev(()=>aiCars.some(c=>c.model==='Danfo')),'danfo buses are in traffic');
  await ev(()=>{const c=aiCars.find(c=>c.model==='Okada')||aiCars.find(c=>c.model==='Keke');if(c){pc.x=c.x-Math.sin(c.h)*9;pc.z=c.z-Math.cos(c.h)*9;pc.h=c.h;camPos.init=false;}});await wait(1200);await pg.screenshot({path:'g_okada.png'});ok(await ev(()=>aiCars.some(c=>c.model==='Okada'||c.model==='Keke')),'okadas or kekes are in traffic');
  ok(errs.filter(e=>!/status of 404/.test(e)).length===0,'no page errors: '+JSON.stringify(errs.filter(e=>!/status of 404/.test(e))));await b.close();srv.close();
})();
