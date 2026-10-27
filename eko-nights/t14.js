const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':'text/html'});r.end(fs.readFileSync(f));}).listen(8080,'127.0.0.1');
const CFG=`window.EKO_FIREBASE={apiKey:"demo-key",authDomain:"demo-eko.firebaseapp.com",projectId:"demo-eko",databaseURL:"https://demo-eko-default-rtdb.firebaseio.com",appId:"1:1:web:1",emulators:true,verified:true};`;
const FS='http://127.0.0.1:8085/v1/projects/demo-eko/databases/(default)/documents';
const backdate=async(id,min)=>{const r=await fetch(`${FS}/tickets/${id}?updateMask.fieldPaths=startedAt`,{method:'PATCH',headers:{'Authorization':'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({fields:{startedAt:{integerValue:String(Date.now()-min*60000)}}})});return r.status;};
const getDoc=async p=>{const r=await fetch(`${FS}/${p}`,{headers:{'Authorization':'Bearer owner'}});const j=await r.json();const o={};for(const [k,v] of Object.entries(j.fields||{}))o[k]=v.integerValue!=null?+v.integerValue:v.stringValue!=null?v.stringValue:v.booleanValue!=null?v.booleanValue:v.doubleValue!=null?v.doubleValue:v.nullValue!==undefined?null:'…';return o;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const errs=[];const log=(...a)=>console.log(...a);
  const mk=async(tag,first,last)=>{const ctx=await b.newContext({viewport:{width:1100,height:700}});const pg=await ctx.newPage();
    await pg.route('**/firebase-config.js',r=>r.fulfill({body:CFG,contentType:'application/javascript'}));await pg.route('https://fonts.**',r=>r.abort());
    pg.on('pageerror',e=>errs.push(tag+' PAGEERR '+e.message));pg.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_FAILED|permission|PERMISSION|Missing or insufficient/i.test(m.text()))errs.push(tag+' '+m.text().slice(0,160));});
    await pg.goto('http://127.0.0.1:8080/');await pg.waitForSelector('#obGuest',{timeout:20000});await pg.click('#obGuest');
    await pg.waitForFunction(()=>/Guest officer/.test(document.querySelector('#onlineBox').textContent),null,{timeout:20000});await pg.waitForTimeout(800);
    await pg.fill('#cFirst',first);await pg.fill('#cLast',last);await pg.click('#startBtn');await pg.waitForTimeout(5000);
    await pg.evaluate(()=>{PERF.off=true;$('#chap').hidden=true;ST().step='done';});await pg.waitForFunction(()=>NET.me&&NET.me.code,null,{timeout:90000});return pg;};
  const call=(pg,n,d)=>pg.evaluate(async([n,d])=>{try{return await NET.srv.call(n,d);}catch(e){return {error:e.code,message:e.message};}},[n,d]);
  const A=await mk('A','ada','obi'),B=await mk('B','tunde','okeke'),C=await mk('C','ashawo','queen');
  const me=pg=>pg.evaluate(()=>NET.me&&{uid:NET.me.uid,name:NET.me.name,code:NET.me.code,xp:NET.me.xp,cases:NET.me.cases,rating:NET.me.rating,rank:NET.me.rank,flagged:NET.me.flagged,suspicious:NET.me.suspicious});
  log('A registered',await me(A));log('C (rude name) registered as',(await me(C)).name,await C.$$eval('.toast',x=>x.map(y=>y.textContent).filter(t=>/Online name/.test(t))));
  // 1. editing stats directly
  log('A edits own xp',await A.evaluate(async()=>{try{await firebase.firestore().doc('officers/'+NET.uid).update({xp:99999});return 'ALLOWED';}catch(e){return e.code;}}));
  log('A edits own rating+name',await A.evaluate(async()=>{try{await firebase.firestore().doc('officers/'+NET.uid).update({rating:100,name:'King'});return 'ALLOWED';}catch(e){return e.code;}}));
  log('A presence update',await A.evaluate(async()=>{try{await firebase.firestore().doc('officers/'+NET.uid).update({seen:Date.now(),onCase:null,open:false,squad:null,v:3});return 'ok';}catch(e){return e.code;}}));
  log('A writes a ticket',await A.evaluate(async()=>{try{await firebase.firestore().collection('tickets').add({uid:NET.uid,status:'solved'});return 'ALLOWED';}catch(e){return e.code;}}));
  // 2. honest case through the game: start (ticket), wait long enough (backdated), arrest, close
  await A.evaluate(()=>{startCase(makeCase('homicide',777,{free:true}));});await A.waitForFunction(()=>curCase.ticket,null,{timeout:15000});
  const tA=await A.evaluate(()=>curCase.ticket);log('A ticket',tA,(await getDoc('tickets/'+tA)).status);
  await backdate(tA,12);await A.evaluate(()=>{curCase.custody.push(curCase.K.id);endCase(curCase,'closed');});await A.waitForTimeout(3500);
  log('A honest close',(await getDoc('tickets/'+tA)),'→',await me(A),await A.$$eval('.toast',x=>x.map(y=>y.textContent).filter(t=>/Verified/.test(t))));
  // 3. instant win, inflated arrests, and closing twice
  await A.evaluate(()=>closeModal());
  const r1=await call(A,'startCase',{type:'robbery',seed:1111,opt:{free:true}});
  log('instant win',await call(A,'closeCase',{ticketId:r1.ticketId,outcome:'closed',claim:{success:true,caught:3}}));
  const r2=await call(A,'startCase',{type:'robbery',seed:2222,opt:{free:true}});await backdate(r2.ticketId,9);
  log('99 arrests claimed',await call(A,'closeCase',{ticketId:r2.ticketId,outcome:'closed',claim:{success:true,caught:99}}));
  log('close same case again',await call(A,'closeCase',{ticketId:r2.ticketId,outcome:'closed',claim:{success:true,caught:3}}));
  log('close someone else\'s case',await call(B,'closeCase',{ticketId:r2.ticketId,outcome:'closed',claim:{success:true,caught:3}}));
  log('unknown case type',await call(A,'startCase',{type:'jackpot',seed:5}));
  // 4. C fakes three instant wins and is flagged off the leaderboard
  for(let i=0;i<3;i++){const t=await call(C,'startCase',{type:'romance',seed:300+i,opt:{}});await call(C,'closeCase',{ticketId:t.ticketId,outcome:'closed',claim:{success:true,caught:1}});}
  log('C after fakes',await me(C));
  log('leaderboard',await A.evaluate(async()=>{const s=await NET.db.collection('officers').where('flagged','==',false).orderBy('rating','desc').limit(20).get();return s.docs.map(d=>d.data().name+' '+d.data().rating);}));
  // 5. squads: joining needs the host's real open case
  await A.evaluate(()=>{startCase(makeCase('kidnap',4444,{free:true}));});await A.waitForFunction(()=>curCase.ticket,null,{timeout:15000});await A.evaluate(()=>{openSquad();});await A.waitForTimeout(2500);
  const hostUid=(await me(A)).uid;
  log('B joins with wrong seed',await call(B,'startCase',{type:'kidnap',seed:9999,squadHost:hostUid}));
  log('B joins properly',await call(B,'startCase',{type:'kidnap',seed:4444,squadHost:hostUid}));
  // 6. invite spam (B must be online: its presence heartbeat ran at start)
  const bUid=(await me(B)).uid;const inv=[];for(let i=0;i<11;i++){const r=await call(A,'sendInvite',{to:bUid});inv.push(r.ok?'ok':r.error);}
  log('11 invites',inv.join(' '));await B.waitForTimeout(1500);log('B inbox invites',await B.evaluate(()=>NET.invites.length));
  // 7. backup farming: B closes four cases with A as backup; only three credit A today
  const xpBefore=(await getDoc('officers/'+hostUid)).xp;const credits=[];
  for(let i=0;i<4;i++){const t=await call(B,'startCase',{type:'romance',seed:500+i,opt:{}});await backdate(t.ticketId,8);const r=await call(B,'closeCase',{ticketId:t.ticketId,outcome:'closed',claim:{success:true,caught:1,backup:hostUid,title:'Test case '+i}});credits.push(r.backupXp);}
  await A.waitForTimeout(1500);
  log('backup credits',credits.join(','),'A xp',xpBefore,'→',(await getDoc('officers/'+hostUid)).xp,'A notices',await A.evaluate(()=>NET.credits.length));
  // 8. rename once a day
  log('rename now',await call(A,'registerOfficer',{first:'Adaeze',last:'Obi',gender:'f',skin:'#6e4429'}));
  log('rename again',await call(A,'registerOfficer',{first:'Ada',last:'Okeke',gender:'f',skin:'#6e4429'}));
  await A.keyboard.press('Tab');await A.waitForTimeout(300);await A.click('[data-t="officers"]');await A.waitForTimeout(2500);await A.screenshot({path:'n_verified.png'});
  console.log('ERRORS',errs);await b.close();srv.close();
})();
