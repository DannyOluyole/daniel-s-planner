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
  const pg=await (async()=>{const ctx=await b.newContext({viewport:{width:1100,height:700}});const p=await ctx.newPage();
    await p.route('**/firebase-config.js',r=>r.fulfill({body:CFG,contentType:'application/javascript'}));await p.route('https://fonts.**',r=>r.abort());
    p.on('console',m=>{if(m.type()!=='log'||/online|NET/.test(m.text()))console.log('CONSOLE',m.type(),m.text().slice(0,300));});p.on('pageerror',e=>console.log('PAGEERR',e.message));
    await p.goto('http://127.0.0.1:8080/');await p.waitForSelector('#obGuest');await p.click('#obGuest');
    await p.waitForFunction(()=>/Guest officer/.test(document.querySelector('#onlineBox').textContent));await p.waitForTimeout(800);
    await p.fill('#cFirst','ada');await p.fill('#cLast','obi');await p.click('#startBtn');await p.waitForTimeout(5000);
    await p.evaluate(()=>{PERF.off=true;$('#chap').hidden=true;ST().step='done';});return p;})();
  for(let i=0;i<4;i++){await pg.waitForTimeout(5000);console.log('state',JSON.stringify(await pg.evaluate(()=>({srv:!!NET.srv,ver:NET.verified,db:!!NET.db,uid:NET.uid,me:!!NET.me,can:NET.canWrite,st:NET.status,busy:NET.busy,regFor:NET.regFor,started,off:!!career.officer}))));}
  console.log('ERRORS',errs);await b.close();srv.close();
})();
