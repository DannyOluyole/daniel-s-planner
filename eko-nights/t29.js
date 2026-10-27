// Patrol Rush: start from the MDT, a real traffic stop scores, street calls and pursuits score, the combo grows and breaks,
// no cases mid-run, time up ends it, the weekly best rides on the profile and the weekly leaderboard ranks officers
// (claude.ai artifact build with its storage mocked).
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
  const A=await mkPage('u_alpha','ada','obi'),B=await mkPage('u_bravo','tunde','okeke');
  const ev=(pg,f,a)=>pg.evaluate(f,a),wait=ms=>A.waitForTimeout(ms);
  await ev(A,()=>{window._step=n=>{const r=renderer.render;renderer.render=()=>{};clock3.getDelta=()=>.05;for(let i=0;i<n;i++)frame();renderer.render=r;};clock3.getDelta=()=>.05;});
  // 1. start from the Patrol Rush tab
  await A.keyboard.press('Tab');await wait(300);await A.click('[data-t="rush"]');await wait(300);
  ok(await ev(A,()=>/Five minutes on the streets/.test($('#mdtBody').textContent)&&!!$('#rGo')),'the Patrol Rush tab explains the mode and offers a start');
  const before=await ev(A,()=>aiCars.filter(c=>c.speeding&&!c.small).length);
  await A.click('#rGo');await wait(500);
  let r=await ev(A,()=>({on:!!RUSH,t:RUSH&&RUSH.t,inCar,hud:!!$('#rushHud')&&!$('#rushHud').hidden,speeders:aiCars.filter(c=>c.speeding&&!c.small).length}));
  ok(r.on&&r.t>295&&r.inCar&&r.hud,'the run starts in the cruiser with a five-minute clock on screen');
  ok(r.speeders>before,'more speeders take to the streets ('+before+' before, '+r.speeders+' now)');
  await ev(A,()=>{RUSH.incT=1e9;});
  // 2. a real traffic stop, start to finish
  r=await ev(A,()=>{const cs=aiCars.filter(c=>c.seg==='edge'&&c.mode==='drive'&&!c.small);for(const c of cs){c.cruise=c.speed=22;c.speeding=true;c.runsRed=false;c.willFlee=false;pc.x=c.x-Math.sin(c.h)*15;pc.z=c.z-Math.cos(c.h)*15;pc.h=c.h;pc.vx=Math.sin(c.h)*c.speed;pc.vz=Math.cos(c.h)*c.speed;_step(3);if(target){Object.assign(target,{cruise:22,speed:22,speeding:true,runsRed:false,willFlee:false});return true;}}return false;});
  await A.keyboard.press('Space');await ev(A,()=>{if(suspect)suspect.willFlee=false;});
  for(let i=0;i<70;i++){await ev(A,()=>{const s=suspect;if(s&&s.mode==='drive'){pc.x=s.x-Math.sin(s.h)*14;pc.z=s.z-Math.cos(s.h)*14;pc.h=s.h;pc.vx=Math.sin(s.h)*s.speed;pc.vz=Math.cos(s.h)*s.speed;}else{pc.vx*=.5;pc.vz*=.5;}_step(4);});if(await ev(A,()=>suspect&&suspect.mode==='stopped'))break;}
  await ev(A,()=>{pc.vx=pc.vz=0;const s=suspect;pc.x=s.x-Math.sin(s.h)*9;pc.z=s.z-Math.cos(s.h)*9;inCar=false;pl.mesh.visible=true;pl.x=s.rx+Math.cos(s.h)*1.8;pl.z=s.rz-Math.sin(s.h)*1.8;_step(2);});
  await A.keyboard.press('KeyE');await wait(800);
  for(let i=0;i<25&&!(await A.$('#stopForm'));i++){if(await ev(A,()=>DLG&&DLG.choices.length&&DLG.i===DLG.lines.length-1&&DLG.ch>=DLG.lines[DLG.i].text.length))await A.click('#dlg [data-ch="0"]');else await A.keyboard.press('KeyE');await wait(400);}
  // fill the form correctly from the driver's real record
  // run the checks, pick a ticket and submit: the form grades it, then "Back on patrol" returns to the run
  await A.click('#chkLic');await A.click('#chkPlate');await A.click('#tier-t1');await A.click('#stopSubmit');await wait(300);
  await A.click('#stopSubmit');await wait(400);
  r=await ev(A,()=>[RUSH.n.stops,RUSH.score,RUSH.last]);
  ok(r[0]===1,'a completed traffic stop counts in the run ('+r[2]+')');
  // 3. street call and pursuit build the combo, an escape breaks it
  await ev(A,()=>{RUSH.combo=0;RUSH.score=0;cbIncidentStart();const I=CB.inc;I.foes.forEach(a=>{a.state='cuffed';});CB.force=false;CB.bad=false;CB.foes=CB.foes.filter(a=>!I.foes.includes(a));cbIncidentCheck();});
  r=await ev(A,()=>[RUSH.score,RUSH.combo]);const callPts=r[0];
  ok(callPts>=550&&r[1]===1,'a street call with every suspect cuffed and no force scores ('+callPts+')');
  await ev(A,()=>{const c=aiCars.find(c=>!c.small&&c.mode==='drive');chase={car:c,meter:0,esc:0,traffic:true};c.mode='flee';_step(1);c.mode='caught';_step(1);endChase();_step(1);});
  await ev(A,()=>{const c=aiCars.find(c=>!c.small&&c.mode==='drive');chase={car:c,meter:0,esc:0,traffic:true};c.mode='flee';_step(1);c.mode='caught';_step(1);endChase();_step(1);});
  r=await ev(A,()=>[RUSH.score,RUSH.combo,RUSH.n.pursuits]);
  ok(r[1]===3&&r[2]===2&&r[0]===callPts+300+450,'pursuits chain into the combo: the third success in a row scores x1.5 ('+r[0]+')');
  await ev(A,()=>{const c=aiCars.find(c=>!c.small&&c.mode==='drive');chase={car:c,meter:0,esc:0,traffic:true};c.mode='flee';_step(1);endChase();_step(1);});
  ok(await ev(A,()=>RUSH.combo===0&&/combo lost/.test(RUSH.last)),'a runner who gets away breaks the combo');
  await ev(A,()=>{career.inquiries=(career.inquiries||0)+1;_step(1);});
  ok(await ev(A,()=>/Unjustified shooting/.test(RUSH.last)),'an unjustified shooting costs points');
  // 4. no cases or Daily Case during the run
  r=await ev(A,()=>{startCase(makeCase('robbery',99,{free:true}));const a=curCase;takeDaily();return [a,curCase,career.dailyStarted||null];});
  ok(!r[0]&&!r[1]&&!r[2],'cases and the Daily Case wait until the run is over');
  // 5. time up: results, weekly best on the profile
  const runScore=await ev(A,()=>RUSH.score);
  await ev(A,()=>{RUSH.t=.2;_step(8);});await wait(400);
  r=await ev(A,()=>({on:!!RUSH,txt:$('#modal .report')&&$('#modal .report').textContent,rush:career.rush,prof:profileDoc().rushScore}));
  ok(!r.on&&/Time!/.test(r.txt)&&r.rush&&r.rush.score===runScore&&r.prof===runScore,'when time is up the results show and the weekly best is recorded ('+runScore+')');
  await A.screenshot({path:'r_results.png'});
  await ev(A,()=>{$('#rOk').click();publishProfile(true);});await wait(1200);
  // 6. a worse run doesn't replace the weekly best; quitting doesn't count
  await ev(A,()=>{rushStart();RUSH.incT=1e9;RUSH.score=5;RUSH.t=.1;_step(5);});await wait(300);
  ok(await ev(A,s=>career.rush.score===s,runScore),'a lower score does not replace the weekly best');
  await ev(A,()=>$('#rOk').click());
  await ev(A,()=>{rushStart();RUSH.incT=1e9;RUSH.score=99999;rushQuit();_step(3);});await wait(300);
  ok(await ev(A,s=>career.rush.score===s&&/abandoned/i.test($('#modal .report').innerText),runScore),'a run ended early is not counted');
  await ev(A,()=>$('#rOk').click());
  // 7. the weekly leaderboard: B's run is better
  await ev(B,()=>{rushStart();RUSH.incT=1e9;RUSH.score=4321;RUSH.t=.1;});await ev(B,()=>{window._s=()=>{clock3.getDelta=()=>.05;for(let i=0;i<5;i++)frame();};_s();});await wait(300);
  await ev(B,()=>{$('#rOk').click();publishProfile(true);});await wait(1500);
  await ev(A,()=>{fetchRush(true);openMDT('rush');});await wait(1500);
  r=await ev(A,()=>$$('.dboard tbody tr').map(t=>t.innerText.replace(/\s+/g,' ').trim()));
  ok(r.length===2&&/Tunde Okeke/.test(r[0])&&/4,321/.test(r[0])&&/Ada Obi/.test(r[1]),'the weekly leaderboard ranks both officers, best run first');
  await A.screenshot({path:'r_board.png'});
  const real=errs.filter(e=>!/models\/manifest\.json|ERR_FAILED/.test(e));ok(real.length===0,'no page errors: '+JSON.stringify(real));
  await b.close();
})();
