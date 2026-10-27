const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
  if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':'text/html'});r.end(fs.readFileSync(f));}).listen(8080,'127.0.0.1');
const CFG=`window.EKO_FIREBASE={apiKey:"demo-key",authDomain:"demo-eko.firebaseapp.com",projectId:"demo-eko",databaseURL:"https://demo-eko-default-rtdb.firebaseio.com",appId:"1:1:web:1",emulators:true};`;
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const errs=[];const log=(...a)=>console.log(...a);
  const mk=async(tag)=>{const ctx=await b.newContext({viewport:{width:1100,height:700}});const pg=await ctx.newPage();
    await pg.route('**/firebase-config.js',r=>r.fulfill({body:CFG,contentType:'application/javascript'}));await pg.route('https://fonts.**',r=>r.abort());
    pg.on('pageerror',e=>errs.push(tag+' PAGEERR '+e.message));pg.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_FAILED/.test(m.text()))errs.push(tag+' '+m.text().slice(0,200));});return pg;};
  const steps=pg=>pg.evaluate(()=>{window._step=(n)=>{const r=renderer.render;renderer.render=()=>{};clock3.getDelta=()=>.05;for(let i=0;i<n;i++)frame();renderer.render=r;};clock3.getDelta=()=>.05;$('#chap').hidden=true;ST().step='done';});
  const join=async(pg,first,last,shot)=>{await pg.goto('http://127.0.0.1:8080/');await pg.waitForSelector('#obGuest',{timeout:20000});if(shot)await pg.screenshot({path:shot});
    await pg.click('#obGuest');await pg.waitForFunction(()=>/Guest officer/.test(document.querySelector('#onlineBox').textContent),null,{timeout:20000});
    await pg.waitForTimeout(800);await pg.fill('#cFirst',first);await pg.fill('#cLast',last);if(shot)await pg.screenshot({path:shot.replace('.png','_in.png')});
    await pg.click('#startBtn');await pg.waitForTimeout(5000);await steps(pg);};
  const A=await mk('A'),B=await mk('B');const wait=ms=>A.waitForTimeout(ms);
  await join(A,'ada','obi','k_title.png');await join(B,'tunde','okeke');
  const ua=await A.evaluate(()=>[NET.status,NET.uid]),ub=await B.evaluate(()=>[NET.status,NET.uid]);log('A',ua,'B',ub);
  await A.evaluate(()=>{career.xp=900;career.cases=9;career.failed=1;saveCareer();publishProfile(true);});await B.evaluate(()=>publishProfile(true));await wait(2000);
  await A.evaluate(()=>{startCase(makeCase('homicide',777,{free:true}));openSquad();});await wait(3000);
  await B.keyboard.press('Tab');await wait(300);await B.click('[data-t="officers"]');await wait(2500);await B.evaluate(()=>redrawOfficers());await wait(300);
  log('B directory',await B.$$eval('.ocard .oname',x=>x.map(y=>y.textContent)));await B.screenshot({path:'k_officers.png'});
  await B.click('[data-join]');await wait(3000);
  log('same case',await A.evaluate(()=>[curCase.title,curCase.K.name]),await B.evaluate(()=>curCase&&[curCase.title,curCase.K.name,curCase.squad===NET.uid]));
  await A.evaluate(()=>{enterInterior(curCase,'scene');const it=insideS.items.find(i=>i.id==='body');pl.x=it.x+.5;pl.z=it.z-.6;_step(2);interiorInteract();});await wait(300);
  for(let i=0;i<4;i++){await A.keyboard.press('KeyE');await wait(150);}await A.click('#dlg [data-ch="0"]').catch(()=>{});await wait(4000);
  log('A ev',await A.evaluate(()=>curCase.evidence.map(e=>e.id)),'B ev',await B.evaluate(()=>curCase.evidence.map(e=>e.id)));
  await A.evaluate(()=>{leaveInterior();pl.x=LOC.station.x+3;pl.z=LOC.station.z+6;_step(3);});
  await B.evaluate(()=>{inCar=false;pl.mesh.visible=true;pl.x=LOC.station.x+3;pl.z=LOC.station.z+12;pl.h=Math.PI;camPos.init=false;_step(3);});await wait(3000);await B.evaluate(()=>_step(6));await wait(800);
  log('B sees partner',await B.evaluate(()=>NET.pm.size),await B.evaluate(()=>[...NET.sqMembers.values()].map(m=>m.name+(m.live?' live':''))));await B.screenshot({path:'k_partner.png'});
  // security rules: B must not be able to write A's profile or read A's save
  log('B writes A profile',await B.evaluate(async a=>{try{await firebase.firestore().doc('officers/'+a).set({name:'hacked',rating:100,code:'X'});return 'ALLOWED';}catch(e){return e.code;}},ua[1]));
  log('B reads A save',await B.evaluate(async a=>{try{await firebase.firestore().doc('data/users/'+a+'/save').get();return 'ALLOWED';}catch(e){return e.code;}},ua[1]));
  log('B fakes presence as A',await B.evaluate(async a=>{try{await firebase.database().ref('rooms/lobby/'+a+'-x').set({uid:a,at:1});return 'ALLOWED';}catch(e){return e.code||e.message;}},ua[1]));
  // shared close
  await B.evaluate(()=>{curCase.custody.push(curCase.K.id);endCase(curCase,'closed');});await wait(5000);
  log('A closed too',await A.evaluate(()=>[!!curCase,career.cases]));
  // cloud save: wipe A's local storage, reload, sign-in persists, progress comes back from Firestore
  await A.evaluate(()=>{closeModal();startCase(makeCase('robbery',4321,{free:true}));});await wait(500);await A.evaluate(async()=>{saveGame();cloudKey='';await saveCloud();});
  const xpA=await A.evaluate(()=>career.xp);await A.evaluate(()=>localStorage.clear());await A.reload();await A.waitForTimeout(6000);
  log('after wipe+reload',await A.evaluate(()=>[career.xp,career.officer&&career.officer.first,RESUME&&RESUME.case&&RESUME.case.title,document.querySelector('#onlineBox').textContent.slice(0,60)]),'xp before',xpA);
  await A.screenshot({path:'k_reload.png'});
  console.log('ERRORS',errs);await b.close();srv.close();
})();
