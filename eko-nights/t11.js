const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':'text/html'});r.end(fs.readFileSync(f));}).listen(8081,'127.0.0.1');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await b.newPage({viewport:{width:390,height:844}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_FAILED/.test(m.text()))errs.push(m.text())});
 await pg.route('https://fonts.**',r=>r.abort());await pg.goto('http://127.0.0.1:8081/');await pg.waitForTimeout(800);
 console.log('online box',await pg.$('#onlineBox')!==null);await pg.fill('#cFirst','ade');await pg.fill('#cLast','ola');await pg.click('#startBtn');await pg.waitForTimeout(6000);
 console.log('state',await pg.evaluate(()=>[started,NET.status,!!career.officer]));await pg.screenshot({path:'k_offline_phone.png'});
 console.log('ERRORS',errs);await b.close();srv.close();})();
