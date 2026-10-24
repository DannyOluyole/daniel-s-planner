// Phone controls: real multi-touch through the browser's touch pipeline.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html'});r.end(fs.readFileSync(f));}).listen(8084,'127.0.0.1');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const ctx=await b.newContext({viewport:{width:740,height:360},deviceScaleFactor:1,isMobile:true,hasTouch:true});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('https://fonts.**',r=>r.abort());await pg.goto('http://127.0.0.1:8084/');await pg.waitForTimeout(600);
  await pg.fill('#cFirst','ade');await pg.fill('#cLast','ola');await pg.tap('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:60000});
  await pg.evaluate(()=>{PERF.off=true;$('#chap').hidden=true;});await pg.waitForTimeout(800);
  const cdp=await ctx.newCDPSession(pg);
  const T=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(([x,y],i)=>({x,y,id:i+1}))});
  const box=async s=>pg.evaluate(s=>{const r=$(s).getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];},s);
  const st=()=>pg.evaluate(()=>({inCar,v:pc.v,h:pc.h,steer:pc.steer,x:pl.x,z:pl.z,ph:pl.h,stick:{...STICK},up:keys.up}));

  ok(await pg.evaluate(()=>document.body.classList.contains('touchmode')&&document.body.classList.contains('incar')),'touch mode on, car layout shown');
  // 1. stick up = gas, analog
  let s0=await st();
  await T('touchStart',[[120,260]]);for(let i=1;i<=6;i++){await T('touchMove',[[120,260-i*12]]);await pg.waitForTimeout(16);}
  await pg.waitForTimeout(1200);let s1=await st();
  ok(s1.stick.on&&s1.stick.y>.9,'stick registers full push up (y='+s1.stick.y.toFixed(2)+')');
  ok(s1.v>3,'stick up drives the cruiser forward (v='+s1.v.toFixed(1)+')');
  // 2. slide right while holding: steers right (heading decreases)
  for(let i=1;i<=6;i++){await T('touchMove',[[120+i*10,200]]);await pg.waitForTimeout(16);}
  await pg.waitForTimeout(150);let s2=await st();
  ok(s2.steer<-.1,'pushing the stick right steers right (steer='+s2.steer.toFixed(2)+')');
  await T('touchEnd',[]);await pg.waitForTimeout(200);let s3=await st();
  ok(!s3.stick.on&&s3.stick.m===0,'stick releases and recentres');
  // 3. two thumbs: GAS pedal held + stick steering left at the same time
  await pg.evaluate(()=>{pc.vx=pc.vz=0;});
  const gas=await box('#touch .gas');
  await T('touchStart',[gas]);await pg.waitForTimeout(500);
  ok(await pg.evaluate(()=>keys.up===1),'GAS pedal held');
  await T('touchStart',[gas,[120,260]]);for(let i=1;i<=6;i++){await T('touchMove',[gas,[120-i*10,260]]);await pg.waitForTimeout(16);}
  await pg.waitForTimeout(300);let s4=await st();
  ok(s4.up===1&&s4.steer>.1,'gas and steering work together with two thumbs (steer='+s4.steer.toFixed(2)+')');
  // the pedal keeps its touch if the thumb slides off it
  await T('touchMove',[[gas[0]-70,gas[1]-40],[60,260]]);await pg.waitForTimeout(100);
  ok(await pg.evaluate(()=>keys.up===1),'pedal stays pressed when the thumb slides off it');
  await T('touchEnd',[]);await pg.waitForTimeout(150);
  ok(await pg.evaluate(()=>keys.up===0&&!STICK.on),'lifting both thumbs releases everything');
  // 4. CAR button gets out; on-foot layout
  await pg.evaluate(()=>{pc.vx=pc.vz=0;pc.v=0;});await pg.waitForTimeout(300);
  await pg.tap('#touch .car');await pg.waitForTimeout(400);
  ok(await pg.evaluate(()=>!inCar&&!document.body.classList.contains('incar')),'CAR button gets out and switches to the on-foot buttons');
  ok(await pg.evaluate(()=>getComputedStyle($('#touch .gas')).display==='none'),'pedals hidden on foot');
  // 5. on foot: push the stick screen-right, the officer walks to the camera's right
  await pg.evaluate(()=>{pc.x+=30;pc.mesh.position.x=pc.x;});await pg.waitForTimeout(1500);
  const f0=await pg.evaluate(()=>{const cy=Math.atan2(pl.x-camPos.x,pl.z-camPos.z);return {x:pl.x,z:pl.z,cy,h:pl.h};});
  await T('touchStart',[[120,250]]);for(let i=1;i<=5;i++){await T('touchMove',[[120+i*14,250]]);await pg.waitForTimeout(16);}
  await pg.waitForTimeout(150);const fm=await pg.evaluate(()=>({x:pl.x,z:pl.z,walking:$('#dash').textContent,st:{...STICK},h:pl.h}));
  await pg.waitForTimeout(500);
  const f1=await pg.evaluate(()=>({x:pl.x,z:pl.z,walking:fm_w=$('#dash').textContent}));console.log('dbg',JSON.stringify({f0,fm,f1}));f1.walking=fm.walking;
  const dx=f1.x-f0.x,dz=f1.z-f0.z,moved=Math.hypot(dx,dz);
  const ang=Math.atan2(dx,dz),rel=Math.atan2(Math.sin(ang-f0.cy),Math.cos(ang-f0.cy));
  ok(moved>1,'on foot the stick walks the officer (moved '+moved.toFixed(1)+' m)');
  ok(rel<-.6&&rel>-2.6,'stick right walks to the screen right (angle '+(rel*57.3).toFixed(0)+'°)');
  ok(/Running/.test(f1.walking),'full push runs');
  await T('touchEnd',[]);await pg.waitForTimeout(100);
  // 6. walk to Bisi: USE lights up, tapping the prompt talks
  await pg.evaluate(()=>{const n=NPCS.bisi.pos;pl.x=n.x+1;pl.z=n.z+.5;camPos.init=false;});{const t=await pg.evaluate(()=>tAcc);await pg.waitForFunction(t=>tAcc>=t,t+.8,{timeout:60000});}
  ok(await pg.evaluate(()=>$('#useBtn').classList.contains('show')),'USE button lights up next to someone to talk to');
  await pg.tap('#prompt');await pg.waitForTimeout(900);
  ok(await pg.evaluate(()=>!!DLG||!!cine),'tapping the prompt starts the conversation');
  ok(await pg.evaluate(()=>$('#useBtn').textContent==='NEXT'),'USE becomes NEXT in a conversation');
  await pg.evaluate(()=>{for(let i=0;i<40&&(DLG||cine);i++){if(DLG){const c=$('#dlg .choices button');if(c)c.click();else dlgAdvance();}else if(cine)endCine();}});await pg.waitForTimeout(200);console.log('dlg after',await pg.evaluate(()=>!!DLG));await pg.waitForTimeout(300);
  // 7. inside a building the stick moves on screen axes
  await pg.evaluate(()=>{closeModal&&closeModal();while(DLG){try{dlgAdvance();}catch(e){break;}}if(cine)endCine();startCase(makeCase('homicide',4242,{free:true}));enterInterior(curCase,'scene');});await pg.waitForTimeout(1000);
  ok(await pg.evaluate(()=>getComputedStyle($('#touch .car')).display==='none'),'CAR button hidden inside buildings');
  const i0=await pg.evaluate(()=>({x:pl.x,z:pl.z}));
  await T('touchStart',[[120,250]]);for(let i=1;i<=5;i++){await T('touchMove',[[120+i*14,250]]);await pg.waitForTimeout(16);}
  await pg.waitForTimeout(500);const i1=await pg.evaluate(()=>({x:pl.x,z:pl.z,st:{...STICK},ins:!!insideS,dlg:!!DLG,modal:blockingModal(),cine:!!cine,raid:!!raidS}));console.log('in',JSON.stringify(i1));await pg.keyboard.down('KeyW');await pg.waitForTimeout(500);await pg.keyboard.up('KeyW');console.log('kbd',JSON.stringify(await pg.evaluate(()=>({x:pl.x,z:pl.z,p:padScreen()}))));
  console.log('t',await pg.evaluate(()=>[insideS.t,tAcc]));await pg.waitForTimeout(300);console.log('t2',await pg.evaluate(()=>[insideS.t,tAcc,typeof updateInterior,!!DLG,started]));
  console.log('box',JSON.stringify(await pg.evaluate(()=>insideS.L.B.filter(b=>pl.x>b.x0-.5&&pl.x<b.x1+.5&&pl.z>b.z0-.5&&pl.z<b.z1+.5))),await pg.evaluate(()=>insideS.L.name||insideS.kind||Object.keys(insideS)));
  for(const k of ['KeyS','KeyA','KeyD']){await pg.keyboard.down(k);await pg.waitForTimeout(400);await pg.keyboard.up(k);console.log(k,JSON.stringify(await pg.evaluate(()=>({x:pl.x,z:pl.z,sp:insideS.L.spawn,ex:insideS.L.exitZ}))));}
  ok(Math.hypot(i1.x-i0.x,i1.z-i0.z)>.8,'stick walks the officer inside a building');
  await pg.screenshot({path:'u_inside.png'});
  console.log('errors',errs);ok(errs.length===0,'no page errors');
  await b.close();srv.close();})();
