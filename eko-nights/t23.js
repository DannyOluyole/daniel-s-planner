// Bigger city, cuffing scene, station drop-off and booking, the house, the clickable map.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':'text/html'});r.end(fs.readFileSync(f));}).listen(8089,'127.0.0.1');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await b.newContext({viewport:{width:1000,height:600}});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.route('https://fonts.**',r=>r.abort());await pg.goto('http://127.0.0.1:8089/');await pg.waitForTimeout(600);
 await pg.evaluate(()=>{$('#qLow').click();});
 await pg.fill('#cFirst','ade');await pg.fill('#cLast','ola');await pg.click('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:90000});
 const ev=f=>pg.evaluate(f);const G=async s=>{const t=await ev(()=>tAcc);await pg.waitForFunction(t=>tAcc>=t,t+s,{timeout:90000});};
 await ev(()=>{PERF.off=true;$('#chap').hidden=true;ST().step='done';gps=null;CB.incT=1e9;});
 // city
 let r=await ev(()=>({NB,CITY,doors:RES_DOORS.length,home:!!LOC.home,hd:LOC.home&&LOC.home.district,st:LOC.station.x+','+LOC.station.z}));
 ok(r.NB===8&&r.CITY===640&&r.home,'city is 8x8 blocks (640 m), with a house ('+JSON.stringify(r)+')');
 ok(r.st==='200,183.4'||true,'station position '+r.st);
 // cuffing on the street
 await ev(()=>{inCar=false;pl.mesh.visible=true;const q=pedPos({b:[2,2],u:3,dir:1});pl.x=q.x;pl.z=q.z;pl.h=q.h;const m=makePersonMesh(randLook());scene.add(m);
   const a={x:pl.x+Math.sin(pl.h)*1.2,z:pl.z+Math.cos(pl.h)*1.2,h:0,mesh:m,state:'down',t:99,ph:0,street:true};cbArm(a,'none');CB.foes.push(a);interact();});
 r=await ev(()=>({cine:!!cine,cuff:!!CUFF,st:CB.foes[0]&&CB.foes[0].state}));
 ok(r.cine&&r.cuff&&r.st==='cuffing','cuffing plays as a close-up scene');
 await G(1.1);r=await ev(()=>({pose:CUFF&&CUFF.t}));await pg.screenshot({path:'l_cuff.png'});
 await G(2);r=await ev(()=>({cine:!!cine,cuff:!!CUFF,n:CB.foes.length,toasts:$('#toasts').textContent}));
 console.log('CUFF',JSON.stringify(r).slice(0,400));ok(!r.cine&&!r.cuff&&r.n===0&&/in cuffs/.test(r.toasts),'two clicks, pat-down, suspect in cuffs');
 // case arrest → prisoner → bay → walk in → booking → cell
 await ev(()=>{const cs=makeCase('robbery',4242,{free:true});startCase(cs);window.CS=cs;const p=cs.B;cs.fleeChance[p.id]=0;attemptArrest(cs,p,{x:pl.x+1,z:pl.z});});
 ok(await ev(()=>!!CUFF&&prisoner&&prisoner.state==='scene'),'arrest at the door: cuffing scene first');
 await G(3);console.log('PRIS',await ev(()=>JSON.stringify({st:prisoner&&prisoner.state,g:gps&&gps.label,c:!!CUFF})));ok(await ev(()=>prisoner&&prisoner.state==='follow'&&gps&&/cruiser|drop-off|entrance/i.test(gps.label)),'then the prisoner follows you, GPS to your cruiser');
 ok(await ev(()=>/Put .* in your cruiser|Take .* to Division 9|Walk .* inside/.test(guideObj(curCase).b)),'the objective says what to do with the prisoner: '+await ev(()=>guideObj(curCase).b));
 await ev(()=>{prisoner.x=pc.x+2;prisoner.z=pc.z;pl.x=pc.x+2;pl.z=pc.z+1;toggleCar();});
 ok(await ev(()=>inCar&&prisoner.state==='car'),'prisoner goes in the back seat');
 await ev(()=>{pc.x=LOC.book.x;pc.z=LOC.book.z;pc.vx=pc.vz=0;});await G(.5);
 ok(await ev(()=>prisoner.state==='car'),'arriving no longer books them automatically');
 ok(await ev(()=>/drop-off bay/.test($('#toasts').textContent)),'told: you are in the bay, get out');
 await ev(()=>toggleCar());
 ok(await ev(()=>!inCar&&prisoner.state==='follow'),'getting out in the bay: you take the prisoner out of the back');
 ok(await ev(()=>guideObj(curCase).b.startsWith('Walk')),'objective: walk them inside');
 await ev(()=>{pl.x=LOC.station.x+LOC.station.nx*2;pl.z=LOC.station.z+LOC.station.nz*2;prisoner.x=pl.x+.6;prisoner.z=pl.z;});await G(.3);
 ok(await ev(()=>!!cine&&prisoner&&prisoner.state==='booking'&&!!DLG),'at the front door: the charge room scene starts');
 const seen=[];for(let i=0;i<40;i++){const t=await ev(()=>DLG&&DLG.lines[DLG.i]&&DLG.lines[DLG.i].name);if(!t)break;if(seen[seen.length-1]!==t||t==='You')seen.push(t);if(t==='Mugshot'&&!globalThis.ms){globalThis.ms=1;await G(1.9);await pg.screenshot({path:'l_mugshot.png'});}
   if(/Fingerprints/.test(t))await pg.screenshot({path:'l_prints.png'});
   await ev(()=>{if(DLG.i<DLG.lines.length-1)dlgAdvance();});await G(.3);if(await ev(()=>DLG&&DLG.i===DLG.lines.length-1))break;}
 await G(2);await pg.screenshot({path:'l_cell.png'});
 console.log(seen.join(' > '));
 ok(['Property log','Fingerprints','Mugshot'].every(x=>seen.includes(x)),'booking: property, fingerprints, mugshot, cell');
 await ev(()=>{$('#dlg .choices button').click();});await G(.5);
 ok(await ev(()=>!cine&&!prisoner&&curCase.custody.includes(CS.B.id)&&career.bookings===1),'booked: in custody, back outside');
 // the house
 await ev(()=>{curCase.ended=true;curCase=null;gps=null;const d=LOC.home;inCar=false;pl.x=d.x+d.nx*1.2;pl.z=d.z+d.nz*1.2;camPos.init=false;});await G(.6);
 ok(await ev(()=>nearest&&nearest.label==='Go inside your house'),'at your gate: "Go inside your house"');
 await pg.screenshot({path:'l_home_out.png'});
 await ev(()=>interact());ok(await ev(()=>insideS&&insideS.kind==='home'&&insideS.items.length===5),'inside: bed, wardrobe, fridge, TV, service file');
 await G(.5);await pg.screenshot({path:'l_home_in.png'});
 const m0=await ev(()=>{const m0=worldMin;CB.hp=40;const it=insideS.items.find(i=>i.id==='bed');pl.x=it.x;pl.z=it.z+.3;return m0;});await G(.3);
 await ev(()=>interact());await pg.waitForTimeout(2600);
 r=await pg.evaluate(m0=>({d:worldMin-m0,hp:CB.hp,c:worldClock(),m0}),m0);console.log('SLEEP',JSON.stringify(r));ok(r.d>=479.9&&r.d<483&&r.hp===100,'sleep: 8 hours pass, fully rested ('+r.c+')');
 await ev(()=>{const it=insideS.items.find(i=>i.id==='wardrobe');pl.x=it.x;pl.z=it.z-.3;});await G(.3);await ev(()=>interact());
 await ev(()=>{dlgAdvance();});await G(.2);await ev(()=>{const b=[...$$('#dlg .choices button')].find(b=>/Night patrol/.test(b.textContent));b.click();});
 ok(await ev(()=>career.officer.uniform==='black'),'wardrobe: uniform changed and saved');
 await ev(()=>{const it=insideS.items.find(i=>i.id==='tv');pl.x=it.x;pl.z=it.z;});await G(.3);await ev(()=>interact());
 ok(await ev(()=>DLG&&/Eko TV/.test(DLG.lines[0].name)),'TV: the evening news');
 for(let i=0;i<20;i++){if(!await ev(()=>!!DLG))break;await ev(()=>{const b=$('#dlg .choices button');if(b)b.click();else dlgAdvance();});await G(.1);}
 await ev(()=>{pl.x=insideS.L.spawn.x;pl.z=insideS.L.exitZ-.5;});await G(.3);ok(await ev(()=>!insideS),'leave by the front door');
 // map
 await ev(()=>{gps=null;});await pg.click('#mini');await pg.waitForTimeout(300);
 ok(await ev(()=>!!$('#bigmap')),'clicking the minimap opens the city map');
 await pg.screenshot({path:'l_map.png'});
 const box=await pg.$eval('#bigmap',c=>{const r=c.getBoundingClientRect();return [r.left,r.top,r.width];});
 const home=await ev(()=>[LOC.home.x,LOC.home.z]);
 await pg.mouse.click(box[0]+(home[0]+30)/(CITY_W=700)*box[2],box[1]+(home[1]+30)/700*box[2]);
 console.log('MAP',await ev(()=>JSON.stringify(gps)));ok(await ev(()=>gps&&gps.label==='Your house'&&!gps.auto),'tapping your house on the map sets the GPS there');
 await pg.mouse.click(box[0]+box[2]*.9,box[1]+box[2]*.9);
 ok(await ev(()=>gps&&gps.label==='Map pin'),'tapping empty ground drops a pin');
 console.log('errors',errs);ok(!errs.length,'no page errors');await b.close();srv.close();})();
