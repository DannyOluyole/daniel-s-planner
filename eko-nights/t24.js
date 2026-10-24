const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':'text/html'});r.end(fs.readFileSync(f));}).listen(8090,'127.0.0.1');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await b.newContext({viewport:{width:1000,height:600}});const pg=await ctx.newPage();
 await pg.route('https://fonts.**',r=>r.abort());await pg.goto('http://127.0.0.1:8090/');await pg.waitForTimeout(600);await pg.evaluate(()=>{$('#qLow').click();});
 await pg.fill('#cFirst','ade');await pg.fill('#cLast','ola');await pg.click('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:90000});
 await pg.evaluate(()=>{PERF.off=true;$('#chap').hidden=true;ST().step='done';const d=LOC.home;inCar=false;pl.mesh.visible=true;pl.x=d.x+d.nx*1.2;pl.z=d.z+d.nz*1.2;camPos.init=false;});await pg.waitForTimeout(3000);
 await pg.evaluate(()=>{window.R=buildBookingRoom();const ox=R.ox,oz=R.oz;startCine({fov:44,snap:true,pos:V3(ox+8.6,1.9,oz+1.8),look:V3(ox+11,1.2,oz+5.6)});});await pg.waitForTimeout(2500);
 await pg.screenshot({path:'dbg_cell.png'});
 const cands=await pg.evaluate(()=>{window.CANDS=[];scene.traverse(o=>{if(o.isMesh&&o.visible&&o.frustumCulled===false)CANDS.push(o);});return CANDS.length;});
 console.log('cands',cands);
 const px=async()=>{const buf=await pg.screenshot({clip:{x:240,y:150,width:20,height:20}});return buf.toString('base64').length;};
 const shotHas=async()=>{await pg.waitForTimeout(400);const img=await pg.screenshot();const {data}=await (async()=>({data:img}))();return img;};
 // bisect: hide half the candidates and look at the pixel colour at (250,170)
 const colorAt=async()=>pg.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>{const gl=renderer.getContext();const p=new Uint8Array(4);renderer.render(scene,camera);gl.readPixels(Math.round(250*renderer.getPixelRatio()),Math.round((600-170)*renderer.getPixelRatio()),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);r(Array.from(p));}))));
 console.log('base',await colorAt());
 let lo=0,hi=cands;
 for(let k=0;k<8&&hi-lo>1;k++){const mid=(lo+hi)>>1;await pg.evaluate(([lo,mid])=>{CANDS.forEach((o,i)=>o.visible=!(i>=lo&&i<mid));},[lo,mid]);const c=await colorAt();console.log(lo,mid,c);
   const tan=c[0]>150&&c[2]<150; if(!tan)hi=mid;else lo=mid;}
 console.log('suspect',await pg.evaluate(([lo])=>{const o=CANDS[lo];return [o.type,o.geometry.type,o.material.color&&o.material.color.getHexString(),o.count,o.parent&&o.parent.type,Object.keys(o.userData)].join(' ');},[lo]));
 await b.close();srv.close();})();
