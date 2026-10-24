const { chromium, devices } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':'text/html'});r.end(fs.readFileSync(f));}).listen(8082,'127.0.0.1');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const run=async(rate)=>{
    const ctx=await b.newContext({viewport:{width:360,height:740},deviceScaleFactor:2,isMobile:true,hasTouch:true});const pg=await ctx.newPage();
    const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.route('https://fonts.**',r=>r.abort());
    const cdp=await ctx.newCDPSession(pg);await cdp.send('Emulation.setCPUThrottlingRate',{rate});
    let t=Date.now();await pg.goto('http://127.0.0.1:8082/');await pg.waitForSelector('#startBtn');const load=Date.now()-t;
    await pg.fill('#cFirst','ade');await pg.fill('#cLast','ola');t=Date.now();await pg.tap('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:120000});const build=Date.now()-t;
    const q=await pg.evaluate(()=>[QUAL.name,QUAL.pr,QUAL.shadows,QUAL.cars,QUAL.peds]);
    await pg.evaluate(()=>{PERF.off=true;$('#chap').hidden=true;});await pg.waitForTimeout(1500);
    // game logic per frame (rendering skipped)
    const logic=await pg.evaluate(()=>{const r=renderer.render;renderer.render=()=>{};const t0=performance.now();for(let i=0;i<60;i++)frame();const ms=(performance.now()-t0)/60;renderer.render=r;return ms;});
    // a full frame including rendering
    const full=await pg.evaluate(()=>{const t0=performance.now();for(let i=0;i<10;i++)frame();return (performance.now()-t0)/10;});
    // let the automatic quality run for 14 s of real play
    await pg.evaluate(()=>{PERF.off=false;PERF.acc=0;PERF.frames=0;PERF.last=performance.now();});await pg.waitForTimeout(14000);
    const auto=await pg.evaluate(()=>[PERF.step,Math.round(PERF.fps),QUAL.pr,QUAL.shadows,aiCars.length,peds.length]);
    if(rate===6)await pg.screenshot({path:'m_phone.png'});
    console.log(`CPU ${rate}x · page load ${load} ms · build city ${build} ms · start quality ${JSON.stringify(q)}`);
    console.log(`   game logic ${logic.toFixed(1)} ms/frame · full frame (software GPU) ${full.toFixed(0)} ms · after 14 s auto: step ${auto[0]}, ${auto[1]} fps, pr ${auto[2]}, shadows ${auto[3]}, cars ${auto[4]}, people ${auto[5]} · errors ${errs.length}`);
    await ctx.close();
  };
  await run(1);await run(6);
  await b.close();srv.close();
})();
