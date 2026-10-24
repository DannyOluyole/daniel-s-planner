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
  const patch=async(path,fields)=>{const f={};for(const [k,v] of Object.entries(fields))f[k]={integerValue:String(v)};const r=await fetch(`${FS}/${path}?`+Object.keys(fields).map(k=>'updateMask.fieldPaths='+k).join('&'),{method:'PATCH',headers:{'Authorization':'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({fields:f})});return r.status;};
  const A=await mk('A','ada','obi'),B=await mk('B','tunde','bakare'),C=await mk('C','chioma','eze');
  const me=pg=>pg.evaluate(()=>NET.me&&{uid:NET.me.uid,xp:NET.me.xp,flagged:NET.me.flagged,suspicious:NET.me.suspicious});
  // squad-mate joins 10 minutes into the host's case and closes it at once
  const h=await call(A,'startCase',{type:'kidnap',seed:4444,opt:{free:true}});const ago=Date.now()-10*60000;
  await patch('tickets/'+h.ticketId,{startedAt:ago,caseStartedAt:ago});await A.evaluate(()=>{curCase=null;});
  await A.evaluate(()=>NET.db.doc('officers/'+NET.uid).update({open:true,seen:Date.now(),onCase:'Missing: test',squad:null,v:3}));
  const host=(await me(A)).uid;const j=await call(B,'startCase',{type:'kidnap',seed:4444,squadHost:host});
  log('late joiner closes',await call(B,'closeCase',{ticketId:j.ticketId,outcome:'closed',claim:{success:true,caught:1}}));
  log('solo instant win still refused',(await call(C,'closeCase',{ticketId:(await call(C,'startCase',{type:'robbery',seed:1,opt:{}})).ticketId,outcome:'closed',claim:{success:true,caught:3}})).reason);
  // C racks up three strikes, then a week passes
  for(let k=0;k<2;k++){const t=await call(C,'startCase',{type:'robbery',seed:10+k,opt:{}});await call(C,'closeCase',{ticketId:t.ticketId,outcome:'closed',claim:{success:true,caught:3}});}
  await C.waitForTimeout(800);log('C after 3 strikes',await me(C));
  await patch('officers/'+(await me(C)).uid,{suspiciousAt:Date.now()-8*24*3600e3});
  const t=await call(C,'startCase',{type:'robbery',seed:99,opt:{}});const ago2=Date.now()-9*60000;await patch('tickets/'+t.ticketId,{startedAt:ago2,caseStartedAt:ago2});
  log('C honest case a week later',(await call(C,'closeCase',{ticketId:t.ticketId,outcome:'closed',claim:{success:true,caught:2}})).accepted);await C.waitForTimeout(800);log('C now',await me(C));
  console.log('ERRORS',errs);await b.close();srv.close();
})();
