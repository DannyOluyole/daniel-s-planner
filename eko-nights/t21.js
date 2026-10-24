// Case guidance and the High default.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':'text/html'});r.end(fs.readFileSync(f));}).listen(8087,'127.0.0.1');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  // a phone that saved "low" under the old default
  const ctx=await b.newContext({viewport:{width:740,height:360},deviceScaleFactor:2,isMobile:true,hasTouch:true});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.addInitScript(()=>{if(!sessionStorage.getItem('x')){sessionStorage.setItem('x','1');localStorage.setItem('p9-quality','low');localStorage.setItem('eko-perf','3');}});
  await pg.route('https://fonts.**',r=>r.abort());await pg.goto('http://127.0.0.1:8087/');await pg.waitForTimeout(600);
  ok(await pg.evaluate(()=>QUAL.name==='high'&&$('#qHigh').getAttribute('aria-pressed')==='true'),'phone starts on High graphics, even with the old saved "low"');
  await pg.fill('#cFirst','ade');await pg.fill('#cLast','ola');await pg.tap('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:60000});
  ok(await pg.evaluate(()=>QUAL.shadows===true&&PERF.step===0),'shadows on, no automatic lowering carried over');
  await pg.evaluate(()=>{PERF.off=true;$('#chap').hidden=true;ST().step='done';gps=null;CB.incT=1e9;});
  const G=async sec=>{const t=await pg.evaluate(()=>tAcc);await pg.waitForFunction(t=>tAcc>=t,t+sec,{timeout:60000});};
  for(const type of ['robbery','kidnap','homicide','romance','yahoo','contract']){
    const r0=await pg.evaluate(t=>{if(curCase){curCase.ended=true;curCase=null;}gps=null;gpsPerson=null;$('#modal')&&closeModal&&modalOpen()&&closeModal();startCase(makeCase(t,4321,{free:true}));return curCase.title;},type);
    await G(1.2);
    const r=await pg.evaluate(()=>{const L=leads(curCase),l=guideLead(L);const o=$('#obj');const st=getComputedStyle(o.querySelector('b'));
      return {lead:l&&l.t,at:!!(l&&l.at),gps:gps&&gps.label,auto:!!(gps&&gps.auto),beam:GUIDE.beam.visible,b:o.querySelector('b').textContent,how:(o.querySelector('.how')||{}).textContent||'',gpsLine:(o.querySelector('.gps')||{}).textContent||'',
        howVis:o.querySelector('.how')?getComputedStyle(o.querySelector('.how')).display!=='none':false,gpsVis:o.querySelector('.gps')?getComputedStyle(o.querySelector('.gps')).display!=='none':false};});
    const clear=r.at?(r.auto&&r.beam&&r.gpsVis&&/GO TO/.test(r.gpsLine)):(r.howVis&&/MDT/.test(r.how));
    if(!clear)console.log(JSON.stringify(r));
    ok(r.b&&clear,`${type}: "${r.b}" → ${r.at?r.gpsLine+' (auto GPS, beam on)':r.how}`);
  }
  // walk the robbery through: each finished lead hands over to the next, GPS follows
  await pg.evaluate(()=>{curCase.ended=true;curCase=null;gps=null;startCase(makeCase('robbery',99,{free:true}));});await G(1);
  const steps=[];
  for(let i=0;i<4;i++){const r=await pg.evaluate(()=>{const l=guideLead(leads(curCase));const s={t:l.t,gps:gps&&gps.label};
      // finish the step the quick way
      const k=Object.keys(curCase.done||{});if(l.at){const key=({'Review the bank cameras':'cctv','Talk to the bank security man':'w1','Talk to the branch manager':'w3','Talk to the akara seller':'w2'})[l.t];if(key)curCase.done[key]=true;else curCase.done['x'+Math.random()]=1;}
      else if(l.run&&/deposit|cash/i.test(l.t))curCase.done.bank=true;return s;});
    steps.push(r);await G(.8);}
  console.log(JSON.stringify(steps));
  ok(steps.filter(s=>s.gps).length>=2&&new Set(steps.map(s=>s.t)).size>=3,'robbery: the next step and GPS move on as each lead is done');
  // manual GPS from the MDT is respected
  const man=await pg.evaluate(async()=>{setGPS(10,10,'My own pick',null,true);await new Promise(r=>setTimeout(r,1500));return gps&&gps.label;});
  ok(man==='My own pick','a GPS the player picked is not overwritten');
  // tapping the objective opens the case board with the next lead highlighted
  await pg.evaluate(()=>{gps=null;});await pg.tap('#obj');await pg.waitForTimeout(400);
  const mdt=await pg.evaluate(()=>({open:modalOpen(),next:$$('.lead.next').length,badge:($('.lead.next .nx')||{}).textContent}));
  ok(mdt.open&&mdt.next===1&&mdt.badge==='NEXT','tapping the objective opens the case board, next lead marked NEXT');
  await pg.evaluate(()=>closeModal());await G(.6);
  await pg.screenshot({path:'g_phone.png'});
  // closing: main suspect in custody and only the records search left
  const cl=await pg.evaluate(()=>{const cs=curCase;cs.custody.push(cs.C.id);cs.done.cctv=cs.done.w1=cs.done.w2=cs.done.w3=cs.done.bank=true;const o=guideObj(cs);return o.b+' | '+o.w;});
  ok(/Close the case/.test(cl),'when the job is done it says to close the case ('+cl+')');
  console.log('errors',errs);ok(errs.length===0,'no page errors');
  await b.close();srv.close();})();
