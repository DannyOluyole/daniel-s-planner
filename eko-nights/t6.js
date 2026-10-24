// The story: all seven chapters played through, from the first posting to the ending screen.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html'});r.end(fs.readFileSync(f));}).listen(8096,'127.0.0.1');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const pg=await b.newPage({viewport:{width:1100,height:700}});
  await pg.route('https://fonts.**',r=>r.abort());
  const errs=[];pg.on('pageerror',e=>errs.push('PAGEERR '+e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' | ')));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  const ev=(f,a)=>pg.evaluate(f,a);const wait=ms=>pg.waitForTimeout(ms);const step=n=>ev(n=>_step(n),n);
  const log=(...a)=>console.log(...a);
  // raids: suspects fight back now, so taser each one before cuffing (as in t19); rescue the child; leave civilians alone
  const clearRaid=async()=>{
    for(let k=0;k<20;k++){const r=await ev(()=>{if(!raidS)return 'none';const a=raidS.actors.find(a=>a.kind!=='civ'&&a.state!=='cuffed'&&a.state!=='escaped'&&a.state!=='rescued');if(!a)return 'done';
      if(a.kind==='sus'&&a.state==='fight'){pl.x=a.x+1.2;pl.z=a.z;pl.h=Math.atan2(a.x-pl.x,a.z-pl.z);cbSelect(2);CB.cd=0;cbUse();}
      a.t=99;pl.x=a.x+.8;pl.z=a.z;raidInteract();let i=0;while(CUFF&&i++<40)cuffStep(.25);return a.kind+':'+a.state;});
      if(r==='none'||r==='done')break;}
    await ev(()=>{if(raidS&&raidS.done)raidS.outT=.1;});for(let i=0;i<15&&await ev(()=>!!raidS);i++)await step(10);
  };
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
  await pg.goto('http://127.0.0.1:8096/');await wait(500);
  await pg.fill('#cFirst','tunde');await pg.fill('#cLast','bakare');await pg.click('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:60000});await wait(1500);await ev(()=>{PERF.off=true;CB.incT=1e9;});
  await ev(()=>{window._step=(n)=>{const r=renderer.render;renderer.render=()=>{};clock3.getDelta=()=>.05;for(let i=0;i<n;i++)frame();renderer.render=r;};clock3.getDelta=()=>.05;});
  await hideChap();ok(await ev(()=>ST().ch===1&&ST().i===0),'the story starts at chapter 1');
  // ---- chapter 1
  log('n',await talkNPC('bisi'));ok((await state())[2]==='duty','Sgt Bisi sends you on traffic duty');
  await ev(()=>{shift.stops+=3;});for(let i=0;i<30&&await ev(()=>ST().i<2);i++){await step(4);await wait(100);}ok((await state())[1]===2,'three stops complete traffic duty');
  log('n',await talkNPC('bisi'));log(await state());
  log('n',await talkNPC('grace',0,'h_grace.png'));ok((await state())[3]==='romance','Mrs. Eze\'s romance scam becomes the case');
  await mdtLead('chats');await flagFile('chats',true);await pg.screenshot({path:'h_chats.png'});await pg.click('#fDone');
  await mdtLead('KYC');ok(await ev(()=>curCase.evidence.some(e=>e.id==='kyc')),'the chats and KYC lookup name the account holder');
  await ev(()=>{curCase.fleeChance[curCase.M.id]=0;});await mdtLead('Arrest');await ev(()=>{const d=curCase.M.door;pl.x=d.x+.8;pl.z=d.z+.6;inCar=false;_step(3);});log('near',await near());
  await E();await wait(400);await talkThrough(0);await wait(200);await pg.screenshot({path:'h_mama.png'});await talkThrough(0);
  await ev(()=>{let i=0;while(CUFF&&i++<40)cuffStep(.25);});  // finish the cuffing scene before booking
  ok(await ev(()=>!!prisoner),'the scammer is arrested');
  await ev(()=>{book();_step(2);});await goTo(await ev(()=>LOC.interview));log('near',await near());await E();await wait(200);await pg.click('[data-q]');await wait(900);
  const kyc=await ev(()=>curCase.evidence.findIndex(e=>e.id==='kyc'));await pg.click(`[data-e="${kyc}"]`);await wait(700);await pg.screenshot({path:'h_crack.png'});await pg.click('#ivDone');await wait(200);
  ok(await ev(()=>ST().flags.hkLead),'the interview gives up the Hustle Kingdom lead');await closeCase();log('after case',await state());
  log('n',await talkNPC('bisi'));await wait(500);await hideChap();ok((await state())[0]===2,'chapter 2 begins');
  // ---- chapter 2
  log('n',await talkNPC('coker'));await ev(()=>{curCase.custody.push(curCase.C.id);});await closeCase();
  log('n',await talkNPC('coker'));log('n',await talkNPC('ogidi',0));log('sweep step',await state());await step(4);
  await goTo(await npcAt('bulus'));await step(3);log('near',await near());await pg.screenshot({path:'h_checkpoint.png'});
  await E();await wait(400);await talkThrough(0);await wait(300);await pg.screenshot({path:'h_sweep.png'});await talkThrough(0);await wait(300);await talkThrough(0);await wait(300);
  ok(await ev(()=>!!ST().flags.sweep),'Operation Sweep plays out at the checkpoint');
  log('n',await talkNPC('bisi'));await wait(500);await hideChap();ok((await state())[0]===3,'chapter 3 begins');
  // ---- chapter 3
  log('n',await talkNPC('bisi'));log('yahoo ev',await ev(()=>curCase.evidence.map(e=>e.id)));
  await mdtLead('Interpol');await flagFile('emails');await pg.screenshot({path:'h_emails.png'});await pg.click('#fDone');
  await mdtLead('group');await flagFile('group');await pg.click('#fDone');
  await mdtLead('268');await flagFile('bank');await pg.screenshot({path:'h_ybank.png'});await pg.click('#fDone');
  ok(await ev(()=>curCase.flags.hkKnown&&curCase.flags.hideout&&!!curCase.named[curCase.C.id]),'emails, group chat and bank records find Hustle Kingdom and its boss');
  await goTo(await ev(()=>curCase.landlordAt));log('near',await near());await E();await wait(400);await talkThrough();
  await ev(()=>{const m=HK_DOOR;pl.x=m.x+m.nx*6;pl.z=m.z+m.nz*6;pl.h=Math.atan2(-m.nx,-m.nz);camPos.init=false;_step(4);});await wait(300);await pg.screenshot({path:'h_hk.png'});
  await ev(()=>{const m=HK_DOOR;pl.x=m.x+m.nx*2.6;pl.z=m.z+m.nz*2.6;_step(3);});log('near',await near());
  await E();await wait(400);await talkThrough(1);await wait(500);ok(await ev(()=>!!raidS),'the Hustle Kingdom raid starts');
  await clearRaid();
  ok(await ev(()=>curCase.custody.includes(curCase.C.id)),'the raid puts the Yahoo boss in custody');await step(6);await wait(1000);await step(2);
  await pg.screenshot({path:'h_offer.png'});log('offer',await ev(()=>DLG&&DLG.lines[0].name));await talkThrough(0);await wait(300);
  await goTo(await ev(()=>LOC.interview));await E();await wait(200);await pg.click('[data-q]');await wait(900);
  const ip=await ev(()=>curCase.evidence.findIndex(e=>e.id==='ip'));await pg.click(`[data-e="${ip}"]`);await wait(600);await pg.click('#ivDone');await wait(200);
  ok(await ev(()=>ST().flags.honLink),'the interview links the chairman to the Honourable');await closeCase();
  log('n',await talkNPC('bisi'));await wait(500);await hideChap();ok((await state())[0]===4,'chapter 4 begins');
  // ---- chapter 4
  log('n',await talkNPC('bisi'));log('n',await talkNPC('coker',1));await talkThrough(0);await wait(300);ok((await state())[3]==='contract','the ghost contract becomes the case');
  await goTo(await ev(()=>LOC.site));log('near',await near());await E();await wait(500);await pg.screenshot({path:'h_site.png'});await talkThrough();
  await goTo(await ev(()=>LOC.iyaloja));log('near',await near());await E();await wait(400);await pg.screenshot({path:'h_iyaloja.png'});await talkThrough();
  await mdtLead('contract file');await flagFile('docs');await pg.screenshot({path:'h_docs.png'});await pg.click('#fDone');
  await mdtLead('850');await flagFile('bank');await pg.click('#fDone');await step(4);
  ok(await ev(()=>!!curCase.flags.warrant),'site, Iyaloja, contract file and payments get a warrant');
  await ev(()=>{const m=MANSION;pl.x=m.x+m.nx*7;pl.z=m.z+m.nz*7;pl.h=Math.atan2(-m.nx,-m.nz);camPos.init=false;_step(4);});await wait(300);await pg.screenshot({path:'h_mansion.png'});
  await ev(()=>{const m=MANSION;pl.x=m.x+m.nx*1;pl.z=m.z+m.nz*1;_step(3);});log('near',await near());await E();await wait(400);
  await ev(()=>{DLG.i=DLG.lines.length-1;DLG.ch=999;renderDlg();});await pg.screenshot({path:'h_hon.png'});await talkThrough(0);await wait(900);await step(2);
  ok(await ev(()=>!!chase&&/Lawal/.test(chase.p.name)),'the Honourable flees in his car');
  await ev(()=>{const c=chase.car;endChase();removeAICar(c);spawnAICar();curCase.custody.push('hon');});await closeCase();
  log('n',await talkNPC('bisi'));await wait(500);await hideChap();ok((await state())[0]===5,'chapter 5 begins');
  // ---- chapters 5 to 7, fast
  log('n',await talkNPC('coker'));await ev(()=>{curCase.flags.rescued=true;});await closeCase();
  log('n',await talkNPC('bisi'));await wait(500);await hideChap();
  log('n',await talkNPC('bisi'));await ev(()=>{curCase.flags.confronted=true;ST().flags.cokerArrested=true;curCase.custody.push(curCase.C.id);});await waitReport();
  log('n',await talkNPC('bisi'));await wait(500);await hideChap();ok((await state())[0]===7,'chapter 7 begins');
  log('n',await talkNPC('bisi'));await ev(()=>{curCase.custody.push(curCase.C.id);});await waitReport();await wait(600);
  await pg.screenshot({path:'h_ending.png'});ok(await ev(()=>ST().step==='done'&&/ENDING/.test($('#modal').innerText)),'the story ends with an ending screen: '+await ev(()=>($('#modal').innerText.split('\n')[1]||'')));
  ok(errs.filter(e=>!/status of 404/.test(e)).length===0,'no page errors: '+JSON.stringify(errs.filter(e=>!/status of 404/.test(e))));await b.close();srv.close();
})();
