const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';
  if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':'text/html'});r.end(fs.readFileSync(f));}).listen(8080,'127.0.0.1');
const CFG=`window.EKO_FIREBASE={apiKey:"demo-key",authDomain:"demo-eko.firebaseapp.com",projectId:"demo-eko",databaseURL:"https://demo-eko-default-rtdb.firebaseio.com",databaseURLs:["https://demo-eko-default-rtdb.firebaseio.com","https://demo-eko-rooms-2.firebaseio.com"],appId:"1:1:web:1",emulators:true};`;
const setConfig=async fields=>{const f={};for(const [k,v] of Object.entries(fields))f[k]=typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{integerValue:String(v)}:{stringValue:v};
  const r=await fetch('http://127.0.0.1:8085/v1/projects/demo-eko/databases/(default)/documents/config/live',{method:'PATCH',headers:{'Authorization':'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({fields:f})});return r.status;};
const rooms=async ns=>{const r=await fetch(`http://127.0.0.1:9000/rooms.json?ns=${ns}&shallow=true`,{headers:{'Authorization':'Bearer owner'}});return Object.keys((await r.json())||{});};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const errs=[];const log=(...a)=>console.log(...a);
  const mk=async(tag)=>{const ctx=await b.newContext({viewport:{width:1100,height:700}});const pg=await ctx.newPage();
    await pg.route('**/firebase-config.js',r=>r.fulfill({body:CFG,contentType:'application/javascript'}));await pg.route('https://fonts.**',r=>r.abort());
    pg.on('pageerror',e=>errs.push(tag+' PAGEERR '+e.message));pg.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_FAILED/.test(m.text()))errs.push(tag+' '+m.text().slice(0,200));});return pg;};
  const join=async(pg,first,last)=>{await pg.goto('http://127.0.0.1:8080/');await pg.waitForSelector('#obGuest',{timeout:20000});await pg.click('#obGuest');
    await pg.waitForFunction(()=>/Guest officer/.test(document.querySelector('#onlineBox').textContent),null,{timeout:20000});await pg.waitForTimeout(800);
    await pg.fill('#cFirst',first);await pg.fill('#cLast',last);await pg.click('#startBtn');await pg.waitForTimeout(5000);
    await pg.evaluate(()=>{window._step=(n)=>{const r=renderer.render;renderer.render=()=>{};clock3.getDelta=()=>.05;for(let i=0;i<n;i++)frame();renderer.render=r;};clock3.getDelta=()=>.05;$('#chap').hidden=true;ST().step='done';
      window.__w={};const o=NET.db.doc;NET.db.doc=p=>{const r=o(p);const s=r.set;r.set=d=>{const k=p.split('/')[0];__w[k]=(__w[k]||0)+1;return s(d);};return r;};});};
  const A=await mk('A'),B=await mk('B'),C=await mk('C');const wait=ms=>A.waitForTimeout(ms);
  await join(A,'ada','obi');await join(B,'tunde','okeke');await join(C,'chioma','eze');const t0=Date.now();
  await A.evaluate(()=>{career.xp=900;career.cases=9;career.failed=1;saveCareer();publishProfile(true);});await wait(1500);
  await A.evaluate(()=>{startCase(makeCase('homicide',777,{free:true}));openSquad();});await wait(2500);
  log('rtdb rooms after squad open',await rooms('demo-eko-default-rtdb'),await rooms('demo-eko-rooms-2'));
  // B: Officers tab shows open squads and top officers, fetched on demand
  await B.keyboard.press('Tab');await wait(300);await B.click('[data-t="officers"]');await wait(2500);
  log('B sections',await B.$$eval('.osec',x=>x.map(y=>y.textContent)),await B.$$eval('.olist .oname, #mdtBody .oname',x=>x.map(y=>y.textContent)));
  await B.screenshot({path:'l_officers.png'});
  await B.click('[data-join]');await wait(2500);log('B joined',await B.evaluate(()=>curCase&&[curCase.title,curCase.squad===NET.uid,isFriend(curCase.squad)]));
  // C: find A by code, but the squad cap (lowered to 2 for the test) turns C away
  const code=await A.evaluate(()=>myCode());
  await C.evaluate(()=>{NET.squadMax=2;});await C.keyboard.press('Tab');await wait(300);await C.click('[data-t="officers"]');await wait(1500);
  await C.fill('#oQ',code.slice(4));await C.click('#oFind');await wait(1500);log('C found',await C.$$eval('#mdtBody .ocard:not(.me) .oname',x=>x.slice(0,1).map(y=>y.textContent)));
  await C.screenshot({path:'l_found.png'});
  await C.click('[data-join]');await wait(2000);log('C case after full squad',await C.evaluate(()=>!!curCase),await C.$$eval('.toast',x=>x.map(y=>y.textContent).filter(t=>/full/.test(t))));
  // clue sharing, presence
  await A.evaluate(()=>{closeModal();enterInterior(curCase,'scene');const it=insideS.items.find(i=>i.id==='body');pl.x=it.x+.5;pl.z=it.z-.6;_step(2);interiorInteract();});await wait(300);
  const saveBefore=await A.evaluate(()=>cloudAt);
  for(let i=0;i<4;i++){await A.keyboard.press('KeyE');await wait(150);}await A.click('#dlg [data-ch="0"]').catch(()=>{});await wait(3500);
  log('clue shared',await B.evaluate(()=>curCase.evidence.map(e=>e.id)));
  await A.evaluate(()=>{leaveInterior();pl.x=LOC.station.x+3;pl.z=LOC.station.z+6;_step(3);});
  await B.evaluate(()=>{closeModal();inCar=false;pl.mesh.visible=true;pl.x=LOC.station.x+3;pl.z=LOC.station.z+12;pl.h=Math.PI;camPos.init=false;_step(3);});await wait(3000);await B.evaluate(()=>_step(6));
  log('B sees A',await B.evaluate(()=>NET.pm.size),await B.evaluate(()=>[...NET.sqMembers.values()].map(m=>m.name+(m.live?' live':''))));
  log('rtdb rooms with squad',await rooms('demo-eko-default-rtdb'),await rooms('demo-eko-rooms-2'));
  // cloud save after an important event, not on a 30-second timer
  await wait(24000);log('A cloud save after new clue',await A.evaluate(b=>cloudAt>b,saveBefore));
  // kill switch and version check
  log('config set',await setConfig({online:false,message:'Back at 9pm'}));await A.evaluate(()=>loadLiveConfig());await wait(500);
  log('A after kill switch',await A.evaluate(()=>[NET.status,NET.canWrite,!!NET.sq]));
  await A.keyboard.press('Tab');await wait(300);await A.click('[data-t="officers"]');await wait(500);await A.screenshot({path:'l_paused.png'});await A.keyboard.press('Escape');
  await setConfig({online:true,minVersion:9});await A.evaluate(()=>loadLiveConfig());await wait(300);
  log('A after re-enable',await A.evaluate(()=>[NET.status,NET.canWrite]),await A.$$eval('.toast',x=>x.map(y=>y.textContent).filter(t=>/new version/.test(t))));
  const mins=((Date.now()-t0)/60000).toFixed(1);
  log('writes in',mins,'min: A',await A.evaluate(()=>__w),'B',await B.evaluate(()=>__w),'C',await C.evaluate(()=>__w));
  console.log('ERRORS',errs);await b.close();srv.close();
})();
