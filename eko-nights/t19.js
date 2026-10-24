// Combat: tools, shouting, the use-of-force review, getting hurt, raids, foot chases and street calls.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html'});r.end(fs.readFileSync(f));}).listen(8085,'127.0.0.1');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const ctx=await b.newContext({viewport:{width:1100,height:640}});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('https://fonts.**',r=>r.abort());await pg.goto('http://127.0.0.1:8085/');await W(600);
  await pg.fill('#cFirst','ade');await pg.fill('#cLast','ola');await pg.click('#startBtn');await pg.waitForFunction(()=>started,null,{timeout:60000});
  const ev=f=>pg.evaluate(f);
  const G=async sec=>{const t=await ev(()=>tAcc);await pg.waitForFunction(t=>tAcc>=t,t+sec,{timeout:60000});};
  await ev(()=>{PERF.off=true;$('#chap').hidden=true;ST().step='done';gps=null;inCar=false;pl.mesh.visible=true;pl.x=pc.x+4;pl.z=pc.z;camPos.init=false;});await W(500);
  await pg.click('body',{position:{x:900,y:300}});await pg.keyboard.press('Escape');
  // a helper that puts one street suspect in front of the officer
  await ev(()=>{window.mkFoe=(arm,dist,st)=>{const m=makePersonMesh(randLook());scene.add(m);const a={x:pl.x+Math.sin(pl.h)*dist,z:pl.z+Math.cos(pl.h)*dist,h:pl.h+Math.PI,mesh:m,state:st||'fight',ph:0,street:true};cbArm(a,arm);a.atkCd=99;CB.foes.push(a);return a;};
    window.fc=()=>{let i=0;while(CUFF&&i++<40)cuffStep(.25);};window.clearFoes=()=>{CB.foes.forEach(a=>{scene.remove(a.mesh);if(a.laser)scene.remove(a.laser);});CB.foes=[];};
    // stand in an open street spot
    const q=pedPos({b:[2,2],u:3,dir:1});pl.x=q.x;pl.z=q.z;pl.h=q.h;});
  await W(300);
  // 1. taser
  let r=await ev(()=>{const a=mkFoe('none',6);cbSelect(2);CB.cd=0;cbUse();return a.state;});
  ok(r==='down','taser drops a suspect at 6 m');
  r=await ev(()=>{const a=CB.foes[0];pl.x=a.x+.8;pl.z=a.z;const x=career.xp;interact();fc();return [a.state,career.xp>x,CB.foes.length];});
  ok(r[0]==='cuffed'&&r[1]&&r[2]===0,'E cuffs a downed suspect and gives XP');
  // 2. cannot cuff someone still fighting
  r=await ev(()=>{clearFoes();const a=mkFoe('none',1.2);interact();fc();return a.state;});
  ok(r==='fight','a suspect who is still fighting cannot be cuffed');
  ok(await ev(()=>$('#toasts').textContent.includes('Subdue them first')),'player is told to subdue them first');
  // 3. baton: three hits put an unarmed suspect down
  r=await ev(()=>{clearFoes();const a=mkFoe('none',1.4);cbSelect(0);for(let i=0;i<3;i++){CB.cd=0;a.stag=0;cbUse();}return [a.state,a.resist];});
  ok(r[0]==='down','three baton strikes put a resisting suspect down');
  // 4. spray stuns everyone in the cone
  r=await ev(()=>{clearFoes();const a=mkFoe('knife',3),c=mkFoe('none',3.4);cbSelect(1);CB.cd=0;cbUse();return [a.state,c.state];});
  ok(r[0]==='stunned'&&r[1]==='stunned','pepper spray stuns everyone in front, knife or not');
  // 5. shouting: forced success makes them give up and drop the weapon
  r=await ev(()=>{clearFoes();const a=mkFoe('knife',5);const R=Math.random;Math.random=()=>0;CB.shoutCd=0;cbShout();Math.random=R;return [a.state,a.arm];});
  ok(r[0]==='comply'&&r[1]==='none','a shouted warning can end it: suspect complies and drops the knife');
  // 6. unjustified shooting: unarmed suspect
  r=await ev(()=>{clearFoes();const t0=career.rep,i0=career.inquiries||0;const a=mkFoe('none',7);cbSelect(3);CB.cd=0;cbUse();return [a.state,t0-career.rep,(career.inquiries||0)-i0];});
  ok(r[0]==='wounded'&&r[1]===12&&r[2]===1,'shooting an unarmed suspect costs 12 trust and opens an inquiry');
  // 7. justified: armed with a gun and fighting
  r=await ev(()=>{clearFoes();const t0=career.rep,i0=career.inquiries||0;const a=mkFoe('gun',9);CB.cd=0;cbUse();return [a.state,t0-career.rep,(career.inquiries||0)-i0];});
  ok(r[0]==='wounded'&&r[1]===0&&r[2]===0,'shooting an armed attacker is justified: no penalty');
  // the gun never fires without a target
  r=await ev(()=>{clearFoes();const a=mkFoe('none',4,'comply');CB.cd=0;const t0=career.rep;cbUse();return [a.state,career.rep===t0];});
  ok(r[0]==='comply'&&r[1],'no auto-aim at people who have surrendered; no shot fired');
  r=await ev(()=>{const a=CB.foes[0];pl.x=a.x+.8;pl.z=a.z;interact();fc();return a.state;});
  ok(r==='cuffed','a surrendered suspect can be cuffed');
  // 8. an armed suspect shoots after a visible aim
  r=await ev(()=>{clearFoes();CB.hp=100;const a=mkFoe('gun',8);a.atkCd=0;return 1;});
  await G(.3);const mid=await ev(()=>({laser:!!(CB.foes[0].laser&&CB.foes[0].laser.visible),hp:CB.hp}));
  await G(2.4);const hp=await ev(()=>CB.hp);
  ok(mid.laser&&mid.hp===100,'a red laser warns before an armed suspect fires');
  ok(hp<100,'the shot hurts the officer (health '+Math.round(hp)+')');
  // 9. a wall blocks the shot
  r=await ev(()=>{clearFoes();const B=BOXES[0];return cbClear(B.x0-2,(B.z0+B.z1)/2,B.x1+2,(B.z0+B.z1)/2,BOXES)===false&&cbClear(B.x0-2,B.z0-3,B.x1+2,B.z0-3,[B])===true;});
  ok(r,'line of sight: buildings block shots, open ground does not');
  // 10. melee suspect closes in and punches
  r=await ev(()=>{clearFoes();CB.hp=100;CB.hurtT=0;const a=mkFoe('none',4);a.atkCd=0;return 1;});
  await G(2.5);r=await ev(()=>({hp:CB.hp,st:CB.foes[0]&&CB.foes[0].state}));
  ok(r.hp<100,'an unarmed attacker closes in and lands punches (health '+Math.round(r.hp)+')');
  // 11. officer down: suspects get away, health resets
  r=await ev(()=>{CB.hp=3;cbHurt(10);return [CB.hp,CB.foes.length];});
  ok(r[0]===55&&r[1]===0,'officer down: the suspects escape and you get back up');
  // 12. a street call from dispatch
  r=await ev(()=>{clearFoes();gps=null;CB.inc=null;CB.incT=0;cbFrame(.016);return CB.inc&&{n:CB.inc.foes.length,t:CB.inc.typ.k,gps:!!gps,d:Math.hypot(CB.inc.x-pl.x,CB.inc.z-pl.z)};});
  ok(r&&r.n>=1&&r.gps&&r.d>80,'dispatch sends a street crime with GPS ('+(r&&r.t)+', '+(r&&Math.round(r.d))+' m away)');
  await ev(()=>{const I=CB.inc;pl.x=I.x+12;pl.z=I.z;pl.h=Math.atan2(I.x-pl.x,I.z-pl.z);});await W(800);
  r=await ev(()=>CB.inc&&CB.inc.engaged&&CB.inc.foes.map(a=>a.state));
  ok(r&&r.every(s=>['fight','run'].includes(s)),'arriving on foot: they fight or run ('+r+')');
  ok(await ev(()=>!$('#cbhud').hidden&&/Space use/.test($('#cbhud').textContent)),'combat HUD shows health, tool and keys');
  ok(await ev(()=>$('#obj').textContent.includes(CB.inc.typ.title)),'objective panel shows the call');
  // resolve: put them all down and cuff them
  r=await ev(()=>{const I=CB.inc;const x0=career.xp;I.foes.forEach(a=>{if(CB.foes.includes(a)){a.state='down';a.t=99;}});for(const a of I.foes){pl.x=a.x+.7;pl.z=a.z;interact();fc();}return [CB.inc===null,career.xp>x0,I.foes.every(a=>a.state==='cuffed')];});
  ok(r[0]&&r[1]&&r[2],'cuffing everyone closes the call with XP');
  // 13. foot chase: the runner turns to fight
  r=await ev(()=>{const cs=makeCase('robbery',555,{free:true});startCase(cs);const p=cs.C;startFootChase(cs,p,{x:pl.x+1,z:pl.z,nx:1,nz:0});const R=Math.random;Math.random=()=>.1;runner.x=pl.x+1;runner.z=pl.z;updateRunner(.016);Math.random=R;return [runner===null,CB.foes.length,CB.foes[0]&&!!CB.foes[0].p];});
  ok(r[0]&&r[1]===1&&r[2],'a caught runner can turn and fight');
  r=await ev(()=>{const a=CB.foes[0];a.state='down';a.t=99;pl.x=a.x+.7;pl.z=a.z;interact();fc();return [CB.foes.length,!!prisoner];});
  ok(r[0]===0&&r[1],'subdue and cuff the runner: they become your prisoner as before');
  await ev(()=>{if(prisoner){scene.remove(prisoner.mesh);prisoner=null;}curCase&&endCase(curCase,'abandon');});
  // 14. raid: armed suspects fight; cuffing needs them subdued
  r=await ev(()=>{const cs=makeCase('robbery',777,{free:true});startCase(cs);raidEnter(cs,'front');const S=raidS.actors.filter(a=>a.kind==='sus');S.forEach(a=>{cbStartFight(a);a.atkCd=99;});return [S.length,S.every(a=>a.arm!==undefined),raidS.time];});
  ok(r[0]>=2&&r[1]&&r[2]>=110,'raid: suspects armed, longer timer ('+r[2]+'s)');
  await W(400);
  r=await ev(()=>{const a=raidS.boss;pl.x=a.x+.8;pl.z=a.z;raidInteract();return a.state;});
  ok(r==='fight','raid: a fighting suspect cannot be cuffed');
  r=await ev(()=>{const S=raidS.actors.filter(a=>a.kind==='sus');for(const a of S){pl.x=a.x+1.2;pl.z=a.z;pl.h=Math.atan2(a.x-pl.x,a.z-pl.z);cbSelect(2);CB.cd=0;cbUse();}return S.map(a=>a.state);});
  ok(r.every(s=>s==='down'),'raid: taser each suspect ('+r+')');
  await ev(()=>raidS.actors.forEach(a=>{if(a.state==='down')a.t=99;}));
  for(let i=0;i<4;i++){await ev(()=>{if(!raidS)return;const a=raidS.actors.find(a=>a.kind==='sus'&&a.state==='down');if(a&&!CUFF){a.t=99;pl.x=a.x+.8;pl.z=a.z;raidInteract();}});await G(1.7);await ev(()=>{if(raidS&&raidS.done&&raidS.outT<99)raidS.outT=999;});}
  r=await ev(()=>{const S=raidS.actors.filter(a=>a.kind==='sus');const k=raidS.actors.find(a=>a.kind==='civ');return [S.every(a=>a.state==='cuffed'),raidS.done,raidS.ok];});
  ok(r[0]&&r[1]&&r[2],'raid: all suspects cuffed, building clear');
  await pg.screenshot({path:'cb_raid.png'});
  await ev(()=>{if(raidS)raidS.outT=.1;});await G(1);ok(await ev(()=>!raidS),'raid ends normally');
  console.log('errors',errs);ok(errs.length===0,'no page errors');
  await b.close();srv.close();})();
