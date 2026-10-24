// A homicide case end to end, with a reload in the middle: crime scene, alibis, warrant, search, arrest, confession.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html'});r.end(fs.readFileSync(f));}).listen(8097,'127.0.0.1');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const pg=await b.newPage({viewport:{width:1100,height:700}});
  await pg.route('https://fonts.**',r=>r.abort());
  const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' | ')));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  const ev=(f,a)=>pg.evaluate(f,a);const wait=ms=>pg.waitForTimeout(ms);const step=n=>ev(n=>_step(n),n);
  const log=(...a)=>console.log(...a);
  const talkThrough=async(choice=0)=>{for(let i=0;i<20;i++){const st=await ev(()=>DLG?{last:DLG.i===DLG.lines.length-1&&DLG.ch>=DLG.lines[DLG.i].text.length}:null);if(!st)return;if(st.last){await pg.click(`#dlg [data-ch="${choice}"]`);await wait(150);return;}await pg.keyboard.press('KeyE');await wait(60);}};
  const goTo=async(p)=>{await ev(p=>{inCar=false;pl.mesh.visible=true;pl.x=p.x+1;pl.z=p.z+.5;_step(3);},p);};
  const npcAt=w=>ev(w=>NPCS[w].pos,w);
  const E=async()=>{await pg.keyboard.press('KeyE');await wait(250);};
  const near=()=>ev(()=>nearest&&nearest.label);
  const talkNPC=async(w,choice=0,shot)=>{await wait(700);await goTo(await npcAt(w));const n=await near();await E();await wait(400);if(shot)await pg.screenshot({path:shot});await talkThrough(choice);await wait(300);return n;};
  const hideChap=()=>ev(()=>{$('#chap').hidden=true;});
  const state=()=>ev(()=>[ST().ch,ST().i,CH[ST().ch].steps[ST().i]&&CH[ST().ch].steps[ST().i].k,curCase&&curCase.type,career.rep]);
  const mdtLead=async(sub)=>{await pg.keyboard.press('Tab');await wait(200);const lt=await pg.$$eval('.lead b',x=>x.map(y=>y.textContent));const i=lt.findIndex(t=>t.includes(sub));if(i<0){log('NO LEAD',sub,lt);await pg.keyboard.press('Escape');return false;}await pg.click(`[data-l="${i}"]`);await wait(250);return true;};
  const flagFile=async(key,extraNormal)=>{const rows=await ev(k=>curCase['rows_'+k].map(r=>r.k),key);for(let i=0;i<rows.length;i++){if(rows[i]!=='normal'||(extraNormal&&i===rows.indexOf('normal'))){await pg.click(`[data-r="${i}"]`);await wait(80);}}};
  const closeCase=async()=>{await step(4);await pg.keyboard.press('Tab');await wait(200);await pg.click('#closeCase');await wait(200);await pg.click('#rOk');await wait(900);};
  const waitReport=async()=>{for(let i=0;i<20&&!(await pg.$('#rOk'));i++)await step(5);await pg.click('#rOk');await wait(900);};
  const boot=async(first)=>{await pg.goto('http://127.0.0.1:8097/');await wait(500);
    if(first){await ev(()=>localStorage.clear());await pg.reload();await wait(400);await pg.fill('#cFirst','ada');await pg.fill('#cLast','obi');}
    await pg.screenshot({path:first?'i_title.png':'i_title2.png'});await pg.click('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:60000});await wait(1500);
    await ev(()=>{PERF.off=true;CB.incT=1e9;});
    await ev(()=>{window._step=(n)=>{const r=renderer.render;renderer.render=()=>{};clock3.getDelta=()=>.05;for(let i=0;i<n;i++)frame();renderer.render=r;};clock3.getDelta=()=>.05;});await hideChap();};
  await boot(true);
  await ev(()=>{career.xp=520;saveCareer();ST().step='done';freshCases();});
  await pg.keyboard.press('Tab');await wait(200);await pg.click('[data-t="dispatch"]');await wait(200);await pg.screenshot({path:'i_dispatch.png'});
  ok((await pg.$$eval('.offer h3',x=>x.length))>=3,'dispatch offers a list of cases');
  await ev(()=>{closeModal();startCase(makeCase('homicide',4242,{free:true}));});
  ok(await ev(()=>/^Murder of /.test(curCase.title)&&curCase.sus.length===3&&curCase.sus.includes(curCase.K)),'a homicide has three suspects, one of them the killer');
  const sc=await ev(()=>({x:curCase.scene.x+curCase.scene.nx*1.2,z:curCase.scene.z+curCase.scene.nz*1.2}));await goTo(sc);ok(/crime scene/.test(await near()),'the crime scene can be entered');
  await E();await wait(300);await step(4);await wait(300);await pg.screenshot({path:'i_scene.png'});ok(await ev(()=>!!insideS),'inside the crime scene');
  const items=await ev(()=>insideS.items.map(i=>({id:i.id,x:i.x,z:i.z})));
  for(const it of items.slice(0,3)){await ev(it=>{pl.x=it.x+.5;pl.z=it.z-.6;_step(2);},it);await E();await wait(150);if(it.id==='body')await pg.screenshot({path:'i_body.png'});await talkThrough();}
  ok(await ev(()=>curCase.evidence.length>=3),'examining items adds evidence');
  // ---- reload mid-case: does everything come back?
  await step(10);const before=await ev(()=>[curCase.title,curCase.evidence.length,Math.round(curCase.used),worldMin|0,Math.round(pl.x),Math.round(pl.z),!!insideS]);
  await ev(()=>saveGame());
  await boot(false);
  const after=await ev(()=>curCase&&[curCase.title,curCase.evidence.length,Math.round(curCase.used),worldMin|0,Math.round(pl.x),Math.round(pl.z),!!insideS,curCase.K.name]);ok(after&&after[0]===before[0]&&after[1]===before[1]&&after[2]===before[2],'reloading mid-case brings back the case, its evidence and time used');
  await wait(1200);await pg.screenshot({path:'i_resumed.png'});
  // ---- finish the scene
  await ev(sc=>{pl.x=sc.x;pl.z=sc.z;_step(3);},sc);await E();await wait(300);
  for(const it of items.slice(3)){await ev(it=>{pl.x=it.x+.5;pl.z=it.z-.6;_step(2);},it);await E();await wait(150);await talkThrough();}
  await ev(()=>{pl.x=insideS.L.spawn.x;pl.z=insideS.L.exitZ-.5;_step(2);});ok(await ev(()=>!insideS&&!!curCase.done.scene),'the crime scene is done once every item is examined');
  // ---- interviews and alibis
  const sus=await ev(()=>curCase.sus.map(p=>({id:p.id,x:p.door.x,z:p.door.z})));
  for(const p of sus){await goTo(p);log('near',await near());await E();await wait(300);await talkThrough();}
  await pg.keyboard.press('Tab');await wait(200);await pg.click('[data-t="case"]');await wait(200);await pg.screenshot({path:'i_mdt.png',fullPage:true});
  const chk=await pg.$$eval('.lead b',x=>x.map(y=>y.textContent));log('leads',chk);
  for(let k=0;k<6;k++){const lt=await pg.$$eval('.lead b',x=>x.map(y=>y.textContent));const i=lt.findIndex(t=>t.startsWith('Check'));if(i<0)break;await pg.click(`[data-l="${i}"]`);await wait(200);await pg.keyboard.press('Tab');await wait(200);await pg.click('[data-t="case"]');await wait(150);}
  await pg.keyboard.press('Escape');await wait(100);
  ok(await ev(()=>!!curCase.flags['warrant_'+curCase.K.id]&&curCase.evidence.some(e=>e.id==='alibiBroken')),'checking alibis breaks the killer\'s alibi and gets a warrant');
  // ---- search the killer's home
  const K=await ev(()=>({x:curCase.K.door.x,z:curCase.K.door.z}));await goTo(K);log('near',await near());await E();await wait(300);await talkThrough(0);await wait(500);await step(3);
  ok(/Search/.test(await ev(()=>insideS&&insideS.title)),'the warrant lets you search the killer\'s home');await pg.screenshot({path:'i_search.png'});
  const its=await ev(()=>insideS.items.map(i=>({x:i.x,z:i.z})));for(const it of its){await ev(it=>{pl.x=it.x+.5;pl.z=it.z-.6;_step(2);},it);await E();await wait(150);await talkThrough();}
  await ev(()=>{pl.x=insideS.L.spawn.x;pl.z=insideS.L.exitZ-.5;_step(2);});
  // ---- arrest, book, interrogate, close
  await ev(()=>{curCase.fleeChance[curCase.K.id]=0;});await goTo(K);log('near',await near());await E();await wait(300);await talkThrough(0);await wait(300);
  await ev(()=>{let i=0;while(CUFF&&i++<40)cuffStep(.25);});  // finish the cuffing scene before booking
  ok(await ev(()=>prisoner&&prisoner.p===curCase.K),'the killer is arrested');await ev(()=>{book();_step(2);});
  await goTo(await ev(()=>LOC.interview));await E();await wait(200);await pg.click('[data-q]');await wait(800);
  const ab=await ev(()=>curCase.evidence.findIndex(e=>e.id==='alibiBroken'));await pg.click(`[data-e="${ab}"]`);await wait(600);await pg.screenshot({path:'i_confess.png'});await pg.click('#ivDone');
  await closeCase();ok(await ev(()=>career.cases===1&&career.byType.homicide===1&&!curCase),'the confession closes the case and counts on your record');
  ok(errs.filter(e=>!/status of 404/.test(e)).length===0,'no page errors: '+JSON.stringify(errs.filter(e=>!/status of 404/.test(e))));await b.close();srv.close();
})();
