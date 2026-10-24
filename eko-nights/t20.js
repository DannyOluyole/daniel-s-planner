const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':'text/html'});r.end(fs.readFileSync(f));}).listen(8086,'127.0.0.1');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await b.newContext({viewport:{width:740,height:360},deviceScaleFactor:2,isMobile:true,hasTouch:true});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('https://fonts.**',r=>r.abort());await pg.goto('http://127.0.0.1:8086/');await pg.waitForTimeout(600);
 await pg.fill('#cFirst','ade');await pg.fill('#cLast','ola');await pg.tap('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:60000});
 await pg.evaluate(()=>{PERF.off=true;$('#chap').hidden=true;ST().step='done';$('#toasts').innerHTML='';inCar=false;pl.mesh.visible=true;const q=pedPos({b:[2,2],u:3,dir:1});pl.x=q.x;pl.z=q.z;pl.h=q.h;camPos.init=false;
   for(const [arm,d,o] of [['knife',4,.5],['gun',9,-.4]]){const m=makePersonMesh({shirt:'#2a2a30',pants:'#1b1c20',masked:true,skin:SKIN[3]});scene.add(m);const a={x:pl.x+Math.sin(pl.h+o)*d,z:pl.z+Math.cos(pl.h+o)*d,h:0,mesh:m,state:'fight',ph:0,street:true};cbArm(a,arm);a.atkCd=arm==='gun'?0:99;CB.foes.push(a);}
   CB.hp=64;CB.hurtT=0;});
 await pg.waitForTimeout(1600);await pg.evaluate(()=>{$('#toasts').innerHTML='';});await pg.screenshot({path:'cb_phone.png'});
 await pg.tap('#atkBtn');await pg.waitForTimeout(150);await pg.screenshot({path:'cb_phone_tase.png'});
 console.log('state',await pg.evaluate(()=>CB.foes.map(a=>a.state)),'errs',errs);
 await b.close();srv.close();})();
