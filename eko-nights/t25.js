// Model pipeline: make test GLBs in the browser, drop them in models/, check cars use them.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':f.endsWith('.glb')?'model/gltf-binary':'text/html'});r.end(fs.readFileSync(f));}).listen(8091,'127.0.0.1');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await b.newContext({viewport:{width:1000,height:600}});
 // 1. no models: game runs as before
 let pg=await ctx.newPage();let errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.route('https://fonts.**',r=>r.abort());
 // set the shipped models aside for this test; they are put back at the end
 const KEEP=ROOT+'/../models.keep';fs.rmSync(KEEP,{recursive:true,force:true});if(fs.existsSync(ROOT+'/models'))fs.renameSync(ROOT+'/models',KEEP);
 await pg.goto('http://127.0.0.1:8091/');await pg.waitForTimeout(800);
 ok(await pg.evaluate(()=>ART.loaded&&artStatus().length===0&&ART.cars.size===0),'no models folder: built-in look, nothing pending');
 // 2. make two test models (a long orange box car facing +X, a white box cruiser) with the GLTF exporter
 await pg.addScriptTag({path:path.join(__dirname,'three/package/examples/js/exporters/GLTFExporter.js')});
 const glbs=await pg.evaluate(async()=>{const mk=(c,w,h,l)=>{const g=new THREE.Group();const m=new THREE.Mesh(new THREE.BoxGeometry(l,h,w),new THREE.MeshStandardMaterial({color:c}));m.position.y=h/2+3;g.add(m);const cab=new THREE.Mesh(new THREE.BoxGeometry(l*.5,h*.6,w*.9),new THREE.MeshStandardMaterial({color:'#222'}));cab.position.y=h+3+h*.3;g.add(cab);return g;};
   const ex=new THREE.GLTFExporter();const out={};
   for(const [k,c] of [['sedan','#ff7a00'],['cruiser','#f2f2f2']])out[k]=await new Promise(r=>ex.parse(mk(c,180,140,460),b=>r(Array.from(new Uint8Array(b))),{binary:true}));return out;});
 fs.mkdirSync(ROOT+'/models',{recursive:true});
 for(const k in glbs)fs.writeFileSync(`${ROOT}/models/${k}.glb`,Buffer.from(glbs[k]));
 fs.writeFileSync(ROOT+'/models/manifest.json',JSON.stringify({sedan:{file:'sedan.glb',len:4.5},cruiser:{file:'cruiser.glb',len:4.8},missing:{file:'nope.glb'}}));
 await pg.close();
 // 3. with models
 pg=await ctx.newPage();errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.route('https://fonts.**',r=>r.abort());
 await pg.goto('http://127.0.0.1:8091/');await pg.waitForFunction(()=>ART.loaded,null,{timeout:30000});
 ok((await pg.evaluate(()=>artStatus())).join()==='sedan,cruiser','models loaded; a missing file is skipped');
 const sz=await pg.evaluate(()=>{const s=new THREE.Box3().setFromObject(ART.ready.sedan).getSize(new THREE.Vector3());const mn=new THREE.Box3().setFromObject(ART.ready.sedan).min.y;return [s.x,s.y,s.z,mn].map(v=>+v.toFixed(2));});
 ok(Math.abs(sz[2]-4.5)<.05&&sz[0]<2.5&&Math.abs(sz[3])<.01,'scaled to 4.5 m, long side along the road, sitting on the ground ('+sz+')');
 await pg.fill('#cFirst','ade');await pg.fill('#cLast','ola');await pg.click('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:90000});
 await pg.evaluate(()=>{PERF.off=true;$('#chap').hidden=true;});await pg.waitForTimeout(1500);
 const r=await pg.evaluate(()=>({cruiser:!!pc.mesh.userData.art,lens:pc.mesh.userData.mr&&pc.mesh.userData.body.children.some(c=>c.material===pc.mesh.userData.mr&&c.visible),
   sedans:aiCars.filter(c=>['Corolla','Camry'].includes(c.mesh.userData.model)).map(c=>!!c.mesh.userData.art),others:aiCars.filter(c=>!ART.ready[artKeyForCar(c.mesh.userData.model,c.mesh.userData.police)]).map(c=>!!c.mesh.userData.art),models:[...new Set(aiCars.map(c=>c.mesh.userData.model))]}));console.log(r.models.join());
 ok(r.cruiser&&r.lens,'your cruiser uses the model, light bar still on top');
 ok(r.sedans.length&&r.sedans.every(Boolean),'every Corolla/Camry on the road uses the sedan model ('+r.sedans.length+')');
 ok(r.others.every(x=>!x),'cars with no model keep the built-in look ('+r.others.length+')');
 await pg.evaluate(()=>{setLights(true);});await pg.waitForTimeout(800);await pg.screenshot({path:'art_test.png'});
 console.log('errors',errs);ok(!errs.length,'no page errors');
 fs.rmSync(ROOT+'/models',{recursive:true,force:true});if(fs.existsSync(KEEP))fs.renameSync(KEEP,ROOT+'/models');await b.close();srv.close();})();
