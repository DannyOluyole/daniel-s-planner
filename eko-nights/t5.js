const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:900,height:600}});
  await pg.route('**/three.min.js',r=>r.fulfill({body:fs.readFileSync('three/package/build/three.min.js'),contentType:'application/javascript'}));
  pg.on('pageerror',e=>console.log('PAGEERR',e.message,(e.stack||'').split('\n')[1]));
  await pg.goto('file://'+process.cwd()+'/wrapped.html');await pg.waitForTimeout(500);
  console.log(await pg.evaluate(()=>JSON.stringify([LOC.bisi,LOC.logTerm,typeof storyBegin])));
  await b.close();
})();
