// The Daily Case in verified mode (Firebase emulators, ./emulators.sh): the server checks it is today's case, allows one ranked
// attempt a day, scores it itself and writes the leaderboard fields, which players can't write themselves.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':'text/html'});r.end(fs.readFileSync(f));}).listen(8100,'127.0.0.1');
const CFG=`window.EKO_FIREBASE={apiKey:"demo-key",authDomain:"demo-eko.firebaseapp.com",projectId:"demo-eko",databaseURL:"https://demo-eko-default-rtdb.firebaseio.com",appId:"1:1:web:1",emulators:true,verified:true};`;
const FS='http://127.0.0.1:8085/v1/projects/demo-eko/databases/(default)/documents';
const getDoc=async p=>{const r=await fetch(`${FS}/${p}`,{headers:{'Authorization':'Bearer owner'}});const j=await r.json();const o={};for(const [k,v] of Object.entries(j.fields||{}))o[k]=v.integerValue!=null?+v.integerValue:v.stringValue!=null?v.stringValue:v.booleanValue!=null?v.booleanValue:v.doubleValue!=null?v.doubleValue:v.nullValue!==undefined?null:'…';return o;};
// the server times a case from caseStartedAt: move both clocks back so a quick test solve isn't refused as too fast
const backdate=async(id,min)=>{const t=String(Date.now()-min*60000);const r=await fetch(`${FS}/tickets/${id}?updateMask.fieldPaths=startedAt&updateMask.fieldPaths=caseStartedAt`,{method:'PATCH',headers:{'Authorization':'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({fields:{startedAt:{integerValue:t},caseStartedAt:{integerValue:t}}})});return r.status;};
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const errs=[];
  const mk=async(tag,first,last)=>{const ctx=await b.newContext({viewport:{width:1100,height:700}});const pg=await ctx.newPage();
    await pg.route('**/firebase-config.js',r=>r.fulfill({body:CFG,contentType:'application/javascript'}));await pg.route('https://fonts.**',r=>r.abort());
    pg.on('pageerror',e=>errs.push(tag+' PAGEERR '+e.message));pg.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_FAILED|permission|PERMISSION|Missing or insufficient|status of 404/i.test(m.text()))errs.push(tag+' '+m.text().slice(0,160));});
    await pg.goto('http://127.0.0.1:8100/');await pg.waitForSelector('#obGuest',{timeout:20000});await pg.click('#obGuest');
    await pg.waitForFunction(()=>/Guest officer/.test(document.querySelector('#onlineBox').textContent),null,{timeout:20000});await pg.waitForTimeout(800);
    await pg.fill('#cFirst',first);await pg.fill('#cLast',last);await pg.click('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:60000});
    await pg.evaluate(()=>{PERF.off=true;CB.incT=1e9;$('#chap').hidden=true;ST().step='done';});await pg.waitForFunction(()=>NET.me&&NET.me.code,null,{timeout:90000});return pg;};
  const A=await mk('A','ada','obi'),B=await mk('B','tunde','bakare');
  const ev=(pg,f,a)=>pg.evaluate(f,a);
  // start a case, wait for its server ticket, then move the ticket's clock back
  const ticketed=async(pg,start)=>{await ev(pg,start);await pg.waitForFunction(()=>curCase&&curCase.ticket,null,{timeout:20000});const id=await ev(pg,()=>curCase.ticket);await backdate(id,30);return id;};
  const solve=(pg,share,evn)=>ev(pg,([share,evn])=>{const cs=curCase;cs.gang.forEach(id=>{if(!cs.custody.includes(id))cs.custody.push(id);cs.named[id]=true;});Object.assign(cs.flags,{rescued:true,confronted:true,warrant:true});
    for(let i=0;i<evn;i++)addEv(cs,'t'+i,'Test clue '+i,'x','Test');cs.used=Math.round((isFinite(cs.limit)?cs.limit:360)*share);endCase(cs,'closed');},[share,evn]);
  const waitDaily=(pg,n)=>pg.waitForFunction(n=>$$('.toast').some(t=>/Daily Case (verified|: you already)/.test(t.textContent))&&$$('.toast').filter(t=>/Daily Case (verified|: you already)/.test(t.textContent)).length>=n,n,{timeout:20000}).then(()=>true,()=>false);

  // 1. A's first daily case: ranked, scored by the server
  let id=await ticketed(A,()=>takeDaily());
  let t=await getDoc('tickets/'+id);
  ok(t.ranked===true,'the server records the first Daily Case today as the ranked attempt');
  await solve(A,.2,10);
  ok(await waitDaily(A,1),'the server confirms the daily score');
  let o=await getDoc('officers/'+await ev(A,()=>NET.uid));
  const local=await ev(A,()=>curCase===null&&career.daily);
  ok(o.dailyDay===await ev(A,()=>dailyDay())&&typeof o.dailyScore==='number'&&o.dailyScore===local.score&&o.dailyGrade===local.grade,'the server writes the score to the officer profile, matching the game ('+o.dailyScore+' '+o.dailyGrade+')');
  await ev(A,()=>$('#rOk')&&$('#rOk').click());
  // 2. players can't write their own daily score
  ok(await ev(A,async()=>{try{await firebase.firestore().doc('officers/'+NET.uid).update({dailyScore:1000});return false;}catch(e){return /permission/i.test(e.code);}}),'a player cannot edit their own daily score');
  // 3. a second attempt is practice, even if it scores higher
  id=await ticketed(A,()=>takeDaily());t=await getDoc('tickets/'+id);
  ok(t.ranked===false,'a second Daily Case today is practice on the server too');
  await solve(A,0,20);await waitDaily(A,2);
  o=await getDoc('officers/'+await ev(A,()=>NET.uid));
  ok(o.dailyScore===local.score,'the practice run does not change the ranked score');
  await ev(A,()=>$('#rOk')&&$('#rOk').click());
  // 4. a fake daily case (wrong seed) is just a normal case
  id=await ticketed(A,()=>{const d=dailyFor(dailyDay());startCase(makeCase(d.type,d.seed+1,{free:true,daily:dailyDay(),ranked:true}));});
  t=await getDoc('tickets/'+id);
  ok(t.ranked===false,'a case that is not today\'s real Daily Case is never ranked');
  await ev(A,()=>endCase(curCase,'abandoned'));await ev(A,()=>$('#rOk')&&$('#rOk').click());
  // 5. B plays: the leaderboard comes from the server's scores
  await ticketed(B,()=>takeDaily());await solve(B,.7,2);await waitDaily(B,1);await ev(B,()=>$('#rOk')&&$('#rOk').click());
  await ev(A,()=>{fetchDaily(true);openMDT('daily');});await A.waitForTimeout(2500);
  const rows=await ev(A,()=>$$('.dboard tbody tr').map(r=>r.innerText.replace(/\s+/g,' ').trim()));
  ok(rows.length===2&&/Ada Obi/.test(rows[0])&&/Tunde Bakare/.test(rows[1]),'the daily leaderboard lists both officers, best first');
  ok(errs.length===0,'no page errors: '+JSON.stringify(errs));
  await b.close();srv.close();
})();
