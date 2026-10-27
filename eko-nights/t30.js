// Patrol Rush in verified mode (Firebase emulators, ./emulators.sh): the server times each run, refuses runs under five
// minutes or scores the reported work can't earn, keeps the best run of the week, and players can't write it themselves.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':'text/html'});r.end(fs.readFileSync(f));}).listen(8102,'127.0.0.1');
const CFG=`window.EKO_FIREBASE={apiKey:"demo-key",authDomain:"demo-eko.firebaseapp.com",projectId:"demo-eko",databaseURL:"https://demo-eko-default-rtdb.firebaseio.com",appId:"1:1:web:1",emulators:true,verified:true};`;
const FS='http://127.0.0.1:8085/v1/projects/demo-eko/databases/(default)/documents';
const getDoc=async p=>{const r=await fetch(`${FS}/${p}`,{headers:{'Authorization':'Bearer owner'}});const j=await r.json();const o={};for(const [k,v] of Object.entries(j.fields||{}))o[k]=v.integerValue!=null?+v.integerValue:v.stringValue!=null?v.stringValue:v.booleanValue!=null?v.booleanValue:v.doubleValue!=null?v.doubleValue:v.nullValue!==undefined?null:'…';return o;};
// the server times a case from caseStartedAt: move both clocks back so a quick test solve isn't refused as too fast
const backdateRush=async(id,min)=>{const r=await fetch(`${FS}/rushes/${id}?updateMask.fieldPaths=startedAt`,{method:'PATCH',headers:{'Authorization':'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({fields:{startedAt:{integerValue:String(Date.now()-min*60000)}}})});return r.status;};
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const errs=[];
  const mk=async(tag,first,last)=>{const ctx=await b.newContext({viewport:{width:1100,height:700}});const pg=await ctx.newPage();
    await pg.route('**/firebase-config.js',r=>r.fulfill({body:CFG,contentType:'application/javascript'}));await pg.route('https://fonts.**',r=>r.abort());
    pg.on('pageerror',e=>errs.push(tag+' PAGEERR '+e.message));pg.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_FAILED|permission|PERMISSION|Missing or insufficient|status of 404/i.test(m.text()))errs.push(tag+' '+m.text().slice(0,160));});
    await pg.goto('http://127.0.0.1:8102/');await pg.waitForSelector('#obGuest',{timeout:20000});await pg.click('#obGuest');
    await pg.waitForFunction(()=>/Guest officer/.test(document.querySelector('#onlineBox').textContent),null,{timeout:20000});await pg.waitForTimeout(800);
    await pg.fill('#cFirst',first);await pg.fill('#cLast',last);await pg.click('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:60000});
    await pg.evaluate(()=>{PERF.off=true;CB.incT=1e9;$('#chap').hidden=true;ST().step='done';window._step=n=>{const r=renderer.render;renderer.render=()=>{};clock3.getDelta=()=>.05;for(let i=0;i<n;i++)frame();renderer.render=r;};});
    await pg.waitForFunction(()=>NET.me&&NET.me.code,null,{timeout:90000});return pg;};
  const A=await mk('A','ada','obi'),B=await mk('B','tunde','okeke');
  const ev=(pg,f,a)=>pg.evaluate(f,a);
  // start a run, wait for its server ticket; optionally move its clock back; then finish it with a given score and work
  const run=async(pg,backMin,score,n)=>{await ev(pg,()=>{rushStart();RUSH.incT=1e9;});await pg.waitForFunction(()=>RUSH&&RUSH.ticket,null,{timeout:20000});
    const id=await ev(pg,()=>RUSH.ticket);if(backMin)await backdateRush(id,backMin);
    await ev(pg,([score,n])=>{Object.assign(RUSH.n,n);RUSH.score=score;RUSH.t=.1;_step(4);},[score,n]);
    await pg.waitForFunction(()=>$$('.toast').some(t=>/Patrol Rush verified|not added to the weekly board/.test(t.textContent)),null,{timeout:20000}).catch(()=>{});
    const msg=await ev(pg,()=>$$('.toast').map(t=>t.textContent).filter(t=>/Patrol Rush verified|not added to the weekly board/.test(t)).pop()||'');
    await ev(pg,()=>{$$('.toast').forEach(t=>t.remove());$('#rOk')&&$('#rOk').click();});return {id,msg};};
  const work={stops:3,clean:3,pursuits:2,incidents:1,arrests:3,mistakes:0};
  // 1. too short
  let r=await run(A,0,2000,work);
  ok(/shorter than five minutes/.test(r.msg),'a run shorter than five minutes is refused: '+r.msg);
  let t=await getDoc('rushes/'+r.id);ok(t.status==='rejected','the server marks it rejected');
  // 2. a score the reported work can't earn
  r=await run(A,6,25000,{stops:1,clean:1,pursuits:0,incidents:0,arrests:0,mistakes:0});
  ok(/higher than the work reported/.test(r.msg),'a score too high for the work reported is refused: '+r.msg);
  // 3. a genuine five-minute run is the week's best
  r=await run(A,6,3200,work);
  let o=await getDoc('officers/'+await ev(A,()=>NET.uid));
  ok(/best this week/.test(r.msg)&&o.rushScore===3200&&o.rushWeek===await ev(A,()=>rushWeek()),'a genuine run goes on the weekly board ('+o.rushScore+')');
  // 4. a worse run is accepted but doesn't replace it
  r=await run(A,6,1200,work);o=await getDoc('officers/'+await ev(A,()=>NET.uid));
  ok(/verified/.test(r.msg)&&o.rushScore===3200,'a worse run is accepted but the weekly best stays');
  // 5. players can't write their own weekly score
  ok(await ev(A,async()=>{try{await firebase.firestore().doc('officers/'+NET.uid).update({rushScore:30000});return false;}catch(e){return /permission/i.test(e.code);}}),'a player cannot edit their own Patrol Rush score');
  // 6. leaderboard from the server's scores
  await run(B,6,4100,{stops:4,clean:4,pursuits:2,incidents:1,arrests:4,mistakes:0});
  await ev(A,()=>{fetchRush(true);openMDT('rush');});await A.waitForTimeout(2500);
  const rows=await ev(A,()=>$$('.dboard tbody tr').map(r=>r.innerText.replace(/\s+/g,' ').trim()));
  ok(rows.length===2&&/Tunde Okeke/.test(rows[0])&&/Ada Obi/.test(rows[1]),'the weekly leaderboard lists both officers, best first');
  ok(errs.length===0,'no page errors: '+JSON.stringify(errs));
  await b.close();srv.close();
})();
