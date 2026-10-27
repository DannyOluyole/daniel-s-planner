// Names: no character in the game may share or echo a real politician's name, and players can't register as one.
// Generates 50 cases of every type, checks every person in them, the name pools, the story cast and every titled name
// in the page against build/politicians.js, then tries politician names on the title screen.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http=require('http'),fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'site/public');
const srv=http.createServer((q,r)=>{let f=path.join(ROOT,q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':f.endsWith('.js')?'application/javascript':f.endsWith('.json')?'application/json':'text/html'});r.end(fs.readFileSync(f));}).listen(8101,'127.0.0.1');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1;};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:1100,height:700}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.route('https://fonts.**',r=>r.abort());
  await pg.goto('http://127.0.0.1:8101/');await pg.waitForTimeout(800);
  const ev=(f,a)=>pg.evaluate(f,a);
  // 1. the checker itself catches the names it must
  let r=await ev(()=>[nameRisk('Hon. Adekunle Oyetola'),nameRisk('Honourable Babatunde Lawal'),nameRisk('Tunde Bakare'),nameRisk('Hon. Femi Wyke'),nameRisk('Kelechi Okafor'),nameRisk('Ngozi Nwosu')]);
  ok(r[0]&&r[1]&&r[2]&&r[3]&&!r[4]&&!r[5],'the checker flags politician names and sound-alikes (Oyetola, Lawal, Wyke), not ordinary ones');
  // 2. name pools
  r=await ev(()=>[...FIRST.map(n=>[n,nameRisk(n)]),...LAST.map(n=>[n,nameRisk('Ade '+n)]),...HON_FIRST.map(n=>[n,nameRisk(n)]),...HON_LAST.map(n=>[n,nameRisk('Ade '+n)])].filter(x=>x[1]));
  ok(!r.length,'every first name and surname in the pools is clear'+(r.length?': '+JSON.stringify(r):''));
  // 3. the story cast
  r=await ev(()=>Object.values(NPCS).map(n=>[n.name,nameRisk(n.name)]).filter(x=>x[1]));
  ok(!r.length,'the story cast is clear'+(r.length?': '+JSON.stringify(r):''));
  // 4. every person in 50 generated cases of each type, story versions included
  r=await ev(()=>{const seen=new Map();const add=n=>{if(typeof n==='string'&&/[A-Z]/.test(n)&&n.length<60)seen.set(n,nameRisk(n));};
    const walk=(o,d=0)=>{if(!o||typeof o!=='object'||d>4)return;if(Array.isArray(o)){o.forEach(x=>walk(x,d+1));return;}
      for(const [k,v] of Object.entries(o)){if(['name','pol','landlord','who','wife'].includes(k))add(v);else if(k==='first'&&typeof o.last==='string')add(v+' '+o.last);else if(v&&typeof v==='object'&&!v.isObject3D&&k!=='mesh'&&k!=='door')walk(v,d+1);}};
    let n=0;for(const t of ['robbery','romance','kidnap','homicide','yahoo','contract','leak','finale'])for(let i=1;i<=50;i++){for(const story of [false,true]){try{walk(makeCase(t,i*7919,{free:true,story}));n++;}catch(e){}}}
    return {n,names:seen.size,bad:[...seen].filter(x=>x[1])};});
  ok(r.n>=600&&r.names>200&&!r.bad.length,`all ${r.names} names in ${r.n} generated cases are clear`+(r.bad.length?': '+JSON.stringify(r.bad.slice(0,10)):''));
  // 5. every titled name written anywhere in the game
  r=await ev(()=>{const src=document.documentElement.innerHTML;const found=new Set(src.match(/(?:Hon\.|Honourable|Alhaji|Chief|Barr\.|Engr\.|Mrs\.|Mr\.|Mama|Iya|CSP|Insp\.|Sgt|Senator|Governor)\s+[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)?/g)||[]);
    return {n:found.size,bad:[...found].map(n=>[n,nameRisk(n)]).filter(x=>x[1])};});
  ok(r.n>20&&!r.bad.length,`all ${r.n} titled names in the game are clear`+(r.bad.length?': '+JSON.stringify(r.bad):''));
  // 6. players: politician names are refused on the title screen, ordinary names that share a common surname are fine
  const tryName=async(f,l)=>{await pg.fill('#cFirst',f);await pg.fill('#cLast',l);await pg.click('#startBtn');await pg.waitForTimeout(300);return {msg:await pg.innerText('#loadMsg'),started:await ev(()=>started)};};
  for(const [f,l] of [['Bola','Tinubu'],['Peter','Obi'],['Gboyega','Oyetola'],['Nyesom','Adeyemi'],['Femi','Wikke']]){r=await tryName(f,l);ok(!r.started&&/real politician/.test(r.msg),`"${f} ${l}" is refused`);}
  r=await tryName('Musa','Bello');ok(!/real politician/.test(r.msg),'"Musa Bello" is allowed: common names alone are fine');
  ok(!errs.length,'no page errors: '+JSON.stringify(errs));
  await b.close();srv.close();})();
