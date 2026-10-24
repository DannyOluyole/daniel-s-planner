const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html'});r.end(fs.readFileSync(f));}).listen(8083,'127.0.0.1');
const tag=process.argv[2]||'o';
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const [w,h] of [[740,360],[915,412]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:true,hasTouch:true});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('https://fonts.**',r=>r.abort());await pg.goto('http://127.0.0.1:8083/');await pg.waitForTimeout(800);await pg.screenshot({path:`p_${tag}_${w}_title.png`});
  await pg.fill('#cFirst','ade');await pg.fill('#cLast','ola');await pg.tap('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:60000});
  await pg.evaluate(()=>{PERF.off=true;$('#chap').hidden=true;});await pg.waitForTimeout(1500);await pg.screenshot({path:`p_${tag}_${w}_drive.png`});
  await pg.evaluate(()=>{const n=NPCS.bisi.pos;inCar=false;pl.mesh.visible=true;pl.x=n.x+1;pl.z=n.z+.5;camPos.init=false;});await pg.waitForTimeout(800);await pg.evaluate(()=>{interact();});await pg.waitForTimeout(1500);await pg.screenshot({path:`p_${tag}_${w}_talk.png`});
  await pg.evaluate(()=>{DLG&&choose(0);endCine&&cine&&endCine();openMDT('dispatch');});await pg.waitForTimeout(600);await pg.screenshot({path:`p_${tag}_${w}_mdt.png`});
  await pg.evaluate(()=>{closeModal();startCase(makeCase('homicide',4242,{free:true}));enterInterior(curCase,'scene');});await pg.waitForTimeout(1200);await pg.screenshot({path:`p_${tag}_${w}_scene.png`});
  console.log(w,h,'errors',errs);await ctx.close();}
 await b.close();srv.close();})();
