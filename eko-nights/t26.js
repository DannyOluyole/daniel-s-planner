// Case scores and the Daily Case: the score formula, the same daily case on every device, one ranked attempt a day,
// practice replays, the daily leaderboard (claude.ai artifact build with its storage mocked, three officers) and solo-only rules.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
// One shared store and room server in Node, bridged into two separate browser contexts.
const STORE=new Map(),ROOMS=new Map();
const match=(d,f)=>f.every(([k,op,v])=>op==='=='?d[k]===v:op==='array-contains'?Array.isArray(d[k])&&d[k].includes(v):true);
function bridge(op,a){
  if(op==='get')return STORE.has(a.path)?JSON.parse(STORE.get(a.path)):null;
  if(op==='set'){STORE.set(a.path,JSON.stringify(a.data));return true;}
  if(op==='del'){STORE.delete(a.path);return true;}
  if(op==='query'){const n=a.col.split('/').length+1;let out=[...STORE.entries()].filter(([p])=>p.startsWith(a.col+'/')&&p.split('/').length===n).map(([p,d])=>({id:p.split('/').pop(),d:JSON.parse(d)})).filter(x=>match(x.d,a.f));
    if(a.o)out.sort((x,y)=>((x.d[a.o[0]]>y.d[a.o[0]])?1:-1)*(a.o[1]==='desc'?-1:1));return out.slice(0,a.l||1000);}
  if(op==='pres'){const r=ROOMS.get(a.room)||new Map();ROOMS.set(a.room,r);r.set(a.peer,{peer:a.peer,by:a.uid,presence:a.presence,at:Date.now()});return true;}
  if(op==='leave'){const r=ROOMS.get(a.room);if(r)r.delete(a.peer);return true;}
  if(op==='peers'){const r=ROOMS.get(a.room)||new Map();return [...r.values()].filter(p=>Date.now()-p.at<4000);}
}
const MOCK=uid=>`(()=>{const uid=${JSON.stringify(uid)};const B=(op,a)=>window.__bridge(op,a);
const snap=(id,d)=>({id,exists:d!=null,data:()=>d==null?undefined:d,metadata:{fromCache:false,hasPendingWrites:false}});
function query(col,f=[],o=null,l=1000){const run=async()=>{const r=await B('query',{col,f,o,l});const docs=r.map(x=>snap(x.id,x.d));return {docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:{}};};
  return {where:(k,op,v)=>query(col,[...f,[k,op,v]],o,l),orderBy:(k,d='asc')=>query(col,f,[k,d],l),limit:n=>query(col,f,o,n),get:run,
    onSnapshot:(next)=>{let last='';let on=true;const tick=async()=>{if(!on)return;const s=await run();const k=JSON.stringify(s.docs.map(d=>[d.id,d.data()]));if(k!==last){last=k;next(s);}setTimeout(tick,400);};tick();return()=>{on=false;};}};}
const doc=path=>({path,id:path.split('/').pop(),get:async()=>snap(path.split('/').pop(),await B('get',{path})),set:async d=>{await B('set',{path,data:d});},
  update:async d=>{const c=await B('get',{path});await B('set',{path,data:Object.assign(c||{},d)});},delete:async()=>{await B('del',{path});},
  onSnapshot:next=>{let last='';let on=true;const t=async()=>{if(!on)return;const d=await B('get',{path});const k=JSON.stringify(d);if(k!==last){last=k;next(snap(path.split('/').pop(),d));}setTimeout(t,400);};t();return()=>{on=false;};},collection:c=>col(path+'/'+c)});
const col=path=>Object.assign(query(path),{path,doc:id=>doc(path+'/'+(id||Math.random().toString(36).slice(2))),add:async d=>{const r=doc(path+'/'+Math.random().toString(36).slice(2));await r.set(d);return r;}});
function room(name){const peer=uid+'-'+Math.random().toString(36).slice(2,8);let pres={};let list=[];const hs=new Set();let alive=true;
  const mk=p=>({peer:p.peer,by:p.by,isMe:p.peer===peer,sameTab:p.peer===peer,kind:'viewer',guest:false,presence:p.presence,updatedAt:p.at});
  const poll=async()=>{if(!alive)return;await B('pres',{room:name,peer,uid,presence:pres});const ps=(await B('peers',{room:name})).map(mk);const old=new Set(list.map(p=>p.peer));const joined=ps.filter(p=>!old.has(p.peer));list=ps;hs.forEach(h=>h({peers:list,joined,left:[],updated:ps}));setTimeout(poll,250);};poll();
  return {name,presence:async p=>{Object.assign(pres,p);},peers:()=>list,onPeers:h=>{hs.add(h);return()=>hs.delete(h);},emit:async()=>{},on:()=>()=>{},connected:()=>true,onConnection:h=>{h(true);return()=>{};},leave:async()=>{alive=false;await B('leave',{room:name,peer});}};}
const lobby=room('lobby');lobby.join=async n=>room(n);
window.claude={use:async n=>n==='db'?{doc,collection:col}:n==='user'?{id:async()=>uid,can:async()=>true,me:async()=>({id:uid})}:n==='room'?lobby:null};})();`;
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const errs=[];const mkPage=async(uid,first,last)=>{const ctx=await b.newContext({viewport:{width:1100,height:700}});await ctx.exposeFunction('__bridge',bridge);await ctx.addInitScript(MOCK(uid));
    const pg=await ctx.newPage();await pg.route('https://fonts.**',r=>r.abort());
    pg.on('pageerror',e=>errs.push(uid+' PAGEERR '+e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' | ')));pg.on('console',m=>{if(m.type()==='error')errs.push(uid+' '+m.text())});
    await pg.goto('file://'+process.cwd()+'/wrapped.html');await pg.waitForFunction(()=>NET.ready,null,{timeout:20000});await pg.fill('#cFirst',first);await pg.fill('#cLast',last);await pg.click('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:60000});
    await pg.evaluate(()=>{PERF.off=true;CB.incT=1e9;$('#chap').hidden=true;ST().step='done';});return pg;};
  // solve the current case on the spot: arrest the whole gang, add evidence and use part of the deadline
  const solve=(pg,share,extra={})=>pg.evaluate(([share,extra])=>{const cs=curCase;cs.gang.forEach(id=>{if(!cs.custody.includes(id))cs.custody.push(id);cs.named[id]=true;});Object.assign(cs.flags,{rescued:true,confronted:true,warrant:true},extra.flags||{});
    for(let i=0;i<(extra.ev||4);i++)addEv(cs,'t'+i,'Test clue '+i,'x','Test');cs.used=Math.round((isFinite(cs.limit)?cs.limit:360)*share);if(extra.false)cs.falseArrests=extra.false;endCase(cs,'closed');return curCase===null;},[share,extra]);
  const A=await mkPage('u_alpha','ada','obi'),B=await mkPage('u_bravo','tunde','bakare'),C=await mkPage('u_charlie','ngozi','eze');
  const ev=(pg,f,a)=>pg.evaluate(f,a),wait=ms=>A.waitForTimeout(ms);

  // 1. the score formula
  let r=await ev(A,()=>[caseScore({success:true,caught:3,gang:3,falseArrests:0,evidence:20,paid:false,badShots:0,timeFrac:1}),
    caseScore({success:false,caught:0,gang:3,falseArrests:0,evidence:2,paid:false,badShots:0,timeFrac:0}),
    caseScore({success:true,caught:3,gang:3,falseArrests:1,evidence:10,paid:true,badShots:1,timeFrac:.5})]);
  ok(r[0].score===1000&&r[0].grade==='S','a perfect case scores 1000, grade S');
  ok(r[1].score===16&&r[1].grade==='D','an unsolved case with nothing to show is a D ('+r[1].score+')');
  ok(r[2].score===280&&r[2].parts.some(p=>p[0]==='Took a bribe'&&p[1]===-300),'bribes, false arrests and bad shootings cost points ('+r[2].score+')');

  // 2. the Daily Case is the same everywhere and changes each day
  const dA=await ev(A,()=>{const d=dailyPreview();return [d.day,d.type,d.seed,d.cs.title];}),dB=await ev(B,()=>{const d=dailyPreview();return [d.day,d.type,d.seed,d.cs.title];});
  ok(JSON.stringify(dA)===JSON.stringify(dB),'every officer gets the same Daily Case: '+dA[3]+' ('+dA[1]+')');
  r=await ev(A,()=>{const days=['2026-01-01','2026-01-02','2026-01-03','2026-01-04','2026-01-05','2026-01-06'].map(dailyFor);return [new Set(days.map(d=>d.type)).size,new Set(days.map(d=>d.seed)).size,dailyDay(Date.parse('2026-10-27T23:30:00Z'))];});
  ok(r[0]===6&&r[1]===6,'six days in a row bring six different case types and seeds');
  ok(r[2]==='2026-10-28','the day turns over at midnight in Port Eko (UTC+1)');

  // 3. A plays it: ranked first attempt, scored report, on the profile
  await A.keyboard.press('Tab');await wait(300);await A.click('[data-t="dispatch"]');await wait(300);
  ok(await ev(A,()=>!!$('.offer.daily [data-daily]')),'Dispatch leads with the Daily Case');
  await A.click('.offer.daily [data-daily]');await wait(400);
  ok(await ev(A,()=>mdtTab==='daily'&&/first attempt today is ranked/.test($('#mdtBody').innerText)),'the Daily tab says the first attempt is ranked');
  await A.click('#dTake');await wait(300);
  ok(await ev(A,()=>isDaily(curCase)&&curCase.opt.ranked&&career.dailyStarted===dailyDay()),'taking it starts the ranked attempt');
  r=await ev(A,()=>{openSquad();const a=curCase.squad;takeBackup({uid:'u_x',name:'X',rating:50});return [a,curCase.backup];});
  ok(!r[0]&&!r[1],'the Daily Case is solo: no squad, no backup');
  await solve(A,.2,{ev:10});await wait(400);
  r=await ev(A,()=>({card:!!$('#modal .scorecard'),grade:$('#modal .scorecard .grade').textContent,txt:$('#modal .scorecard').innerText,d:career.daily}));
  ok(r.card&&/ranked/.test(r.txt)&&r.d&&r.d.score>=900&&r.d.grade===r.grade,'the report shows the score and grade, and it is recorded ('+(r.d&&r.d.score)+' '+r.grade+')');
  await ev(A,()=>{$('#rOk').click();publishProfile(true);});await wait(1500);
  ok(STORE.has('officers/u_alpha')&&JSON.parse(STORE.get('officers/u_alpha')).dailyScore===r.d.score,'the daily score is published on the officer profile');
  const aScore=r.d.score;

  // 4. a replay is practice and doesn't change the ranked score
  await ev(A,()=>takeDaily());await wait(200);
  ok(await ev(A,()=>isDaily(curCase)&&!curCase.opt.ranked),'a second attempt is a practice replay');
  await solve(A,.9,{ev:1});await wait(300);
  ok(await ev(A,(s)=>career.daily.score===s&&/practice/.test($('#modal .scorecard').innerText),aScore),'the practice score does not replace the ranked one');
  await ev(A,()=>$('#rOk').click());

  // 5. B and C play: B worse, C hands it back (which still uses the ranked attempt)
  await ev(B,()=>takeDaily());await solve(B,.6,{ev:3,false:1});await wait(300);await ev(B,()=>{$('#rOk').click();publishProfile(true);});
  await ev(C,()=>{takeDaily();endCase(curCase,'abandoned');});await wait(300);
  r=await ev(C,()=>[career.daily&&career.daily.score,dailyRankedLeft(dailyDay())]);
  ok(r[0]!=null&&r[1]===false,'handing the case back still uses the ranked attempt ('+r[0]+')');
  await ev(C,()=>{$('#rOk').click();publishProfile(true);});await wait(1500);

  // 6. the leaderboard, best first, everyone and friends
  await ev(B,()=>{fetchDaily(true);openMDT('daily');});await wait(1500);
  r=await ev(B,()=>$$('.dboard tbody tr').map(t=>t.innerText.replace(/\s+/g,' ').trim()));
  ok(r.length===3&&/Ada Obi/.test(r[0])&&/Tunde Bakare/.test(r[1])&&/Ngozi Eze/.test(r[2]),'the leaderboard ranks all three, best score first');
  ok(await ev(B,()=>$('.dboard tr.me').innerText.includes('Tunde')),'your own row is highlighted');
  await B.screenshot({path:'d_board.png'});
  await ev(B,()=>{setFriend('u_charlie',true);DLB.view='friends';redrawDaily();});await wait(200);
  r=await ev(B,()=>$$('.dboard tbody tr').map(t=>t.innerText));
  ok(r.length===2&&r.some(t=>/Ngozi/.test(t))&&!r.some(t=>/Ada/.test(t)),'the Friends view shows only you and your friends');

  // 7. normal cases get a score and a personal best too
  r=await ev(A,()=>{const cs=makeCase('robbery',4242,{free:true});startCase(cs);return 1;});
  await solve(A,.5,{ev:2});await wait(300);
  r=await ev(A,()=>[!!$('#modal .scorecard'),/personal best/i.test($('#modal .scorecard').innerText),career.best.robbery&&career.best.robbery.score]);
  ok(r[0]&&r[1]&&r[2]>0,'any case ends with a score and records a personal best ('+r[2]+')');
  await A.screenshot({path:'d_report.png'});

  const real=errs.filter(e=>!/models\/manifest\.json|ERR_FAILED/.test(e));ok(real.length===0,'no page errors: '+JSON.stringify(real));
  await b.close();
})();
