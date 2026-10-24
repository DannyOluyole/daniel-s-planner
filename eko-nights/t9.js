// Squads on the claude.ai artifact build (wrapped.html), with the artifact storage API mocked: directory, joining, shared evidence, presence, closing, backup, invites.
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
    const pg=await ctx.newPage();await pg.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('three/package/build/three.min.js'),contentType:'application/javascript'}));await pg.route('https://fonts.**',r=>r.abort());
    pg.on('pageerror',e=>errs.push(uid+' PAGEERR '+e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' | ')));pg.on('console',m=>{if(m.type()==='error')errs.push(uid+' '+m.text())});
    await pg.goto('file://'+process.cwd()+'/wrapped.html');await pg.waitForTimeout(1200);await pg.fill('#cFirst',first);await pg.fill('#cLast',last);await pg.click('#startBtn');await pg.waitForTimeout(4500);
    await pg.evaluate(()=>{window._step=(n)=>{const r=renderer.render;renderer.render=()=>{};clock3.getDelta=()=>.05;for(let i=0;i<n;i++)frame();renderer.render=r;};clock3.getDelta=()=>.05;$('#chap').hidden=true;ST().step='done';});return pg;};
  const A=await mkPage('u_alpha','ada','obi'),Bp=await mkPage('u_bravo','tunde','bakare');
  const evA=(f,a)=>A.evaluate(f,a),evB=(f,a)=>Bp.evaluate(f,a),wait=ms=>A.waitForTimeout(ms),log=(...a)=>console.log(...a);
  await evA(()=>{career.xp=900;career.cases=9;career.failed=1;career.byType={homicide:4,robbery:5};saveCareer();publishProfile(true);});
  await evB(()=>{career.xp=420;career.cases=3;career.failed=2;saveCareer();publishProfile(true);});
  await wait(1500);
  // A opens a squad case
  await evA(()=>{startCase(makeCase('homicide',777,{free:true}));openSquad();});await wait(1800);
  ok(STORE.has('officers/u_alpha')&&STORE.has('officers/u_bravo')&&STORE.has('squadstate/u_alpha'),'both officers publish profiles and A opens a squad');
  // B finds A in the Officers tab and joins
  await Bp.keyboard.press('Tab');await wait(300);await Bp.click('[data-t="officers"]');await wait(1500);await evB(()=>redrawOfficers(true));await wait(300);
  await Bp.screenshot({path:'j_officers.png'});ok((await Bp.$$eval('.ocard .oname',x=>x.map(y=>y.textContent))).some(t=>/Ada Obi/.test(t)),'B sees A in the officer directory');
  await Bp.fill('#oQ',await evA(()=>myCode()));await Bp.click('#oFind');await wait(1200);ok(/Ada Obi/.test((await Bp.$$eval('#mdtBody .ocard:not(.me) .oname',x=>x.map(y=>y.textContent)))[0]||''),'searching A\'s friend code finds A');
  await Bp.click('[data-join]');await wait(1500);
  {const a=await evA(()=>[curCase.title,curCase.K.name,curCase.seed]),bb=await evB(()=>curCase&&[curCase.title,curCase.K.name,curCase.seed,curCase.squad]);ok(bb&&a[0]===bb[0]&&a[1]===bb[1]&&a[2]===bb[2]&&bb[3]==='u_alpha','B joins A\'s case: same case, same killer');}
  // A examines the body; B should get the clue
  await evA(()=>{enterInterior(curCase,'scene');const it=insideS.items.find(i=>i.id==='body');pl.x=it.x+.5;pl.z=it.z-.6;_step(2);interiorInteract();});await wait(300);
  for(let i=0;i<4;i++){await A.keyboard.press('KeyE');await wait(120);}await A.click('#dlg [data-ch="0"]').catch(()=>{});await wait(300);
  await wait(3500);ok(await evB(()=>curCase.evidence.some(e=>e.id==='tod')),'evidence A finds shows up for B');
  // presence: B should see A in the crime scene, then out on the street
  await evA(()=>{leaveInterior();pl.x=LOC.station.x+3;pl.z=LOC.station.z+6;_step(3);});
  await evB(()=>{inCar=false;pl.mesh.visible=true;pl.x=LOC.station.x+3;pl.z=LOC.station.z+12;pl.h=Math.PI;camPos.init=false;_step(3);});await wait(2500);await evB(()=>_step(6));await wait(800);
  ok(await evB(()=>NET.pm.size>=1&&[...NET.sqMembers.values()].some(m=>m.live)),'B sees A live on the street');
  await Bp.screenshot({path:'j_partner.png'});
  // B arrests the killer; A's board updates and B closes; A gets the close too
  await evB(()=>{curCase.custody.push(curCase.K.id);});await wait(3500);
  ok(await evA(()=>curCase.custody.includes(curCase.K.id)),'B\'s arrest updates A\'s case');
  await evB(()=>{endCase(curCase,'closed');});await wait(3500);
  ok(await evA(()=>!curCase&&career.cases===10&&/CASE CLOSED/.test($('#modal').innerText)),'B closing the case closes it for A too');
  await A.screenshot({path:'j_closed.png'});
  // backup: B (free) brings offline officer "A" along as AI backup on a new case
  await evA(()=>{closeModal();});await evB(()=>{closeModal();startCase(makeCase('robbery',99,{free:true}));const o=NET.cache.get('u_alpha');takeBackup(o);_step(10);});
  ok(await evB(()=>curCase.backup&&curCase.backup.name==='Ada Obi'&&backupCut(curCase)>0),'B can bring offline A along as backup');
  // invite
  await evB(()=>{openSquad();});await wait(1500);await evB(()=>sendInvite('u_alpha'));await wait(2000);
  ok(await evA(()=>NET.invites.some(i=>/Tunde Bakare/.test(i.name))),'A receives B\'s squad invite');
  await A.keyboard.press('Tab');await wait(300);await A.click('[data-t="dispatch"]');await wait(300);await A.screenshot({path:'j_invite.png'});
  const xp0=await evA(()=>career.xp);await evB(()=>{curCase.custody.push(curCase.C.id);endCase(curCase,'closed');});await wait(4000);
  ok(await evA(()=>(career.claimed||[]).length===1)&&(await evA(()=>career.xp))>xp0,'A gets XP for backing B up');
  // models/manifest.json is optional, and file:// pages can't fetch it
  const real=errs.filter(e=>!/models\/manifest\.json|ERR_FAILED/.test(e));ok(real.length===0,'no page errors: '+JSON.stringify(real));await b.close();
})();
