// Smoke test of the claude.ai artifact build (wrapped.html): it loads without errors and the story is wired up.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:900,height:600}});
  const errs=[];pg.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
  await pg.goto('file://'+process.cwd()+'/wrapped.html');await pg.waitForTimeout(500);
  const r=await pg.evaluate(()=>[!!LOC.bisi,!!LOC.logTerm,typeof storyBegin,typeof THREE]);
  ok(r[0]&&r[1],'story locations are placed in the city');
  ok(r[2]==='function','the story module is loaded');
  ok(r[3]==='object','three.js is loaded');
  ok(errs.length===0,'no page errors: '+JSON.stringify(errs));
  await b.close();
})();
