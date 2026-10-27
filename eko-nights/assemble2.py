import re
v2=open('v2.html').read().split('\n')
def sec(a,b): return '\n'.join(v2[a-1:b-1])
A,B,C,E,F=sec(298,380),sec(393,545),sec(558,678),sec(926,1019),sec(1019,1043)
def rep(s,a,b,n=1):
    assert a in s,('MISSING',a[:80]); return s.replace(a,b) if n==0 else s.replace(a,b,n)
def rrep(s,pat,b):
    s2,k=re.subn(pat,lambda m:b,s,count=1,flags=re.S); assert k==1,('RMISS',pat); return s2
# ---- seeded randomness (cases and the city must match on every device)
A='''const _mr=Math.random;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function withSeed(seed,fn){const prev=Math.random;Math.random=mulberry(seed);try{return fn();}finally{Math.random=prev;}}
'''+A
# ---- A: data pools
A=rrep(A,r"const FIRST=\[.*?\];","const FIRST=['Tunde','Chiamaka','Emeka','Aisha','Femi','Ngozi','Ibrahim','Funke','Chinedu','Halima','Segun','Blessing','Uche','Zainab','Kunle','Amaka','Musa','Yetunde','Obinna','Hauwa','Dapo','Ifeoma','Bayo','Nneka','Sani','Folake','Ikenna','Bisola','Kelechi','Rukayat'];")
A=rrep(A,r"const LAST=\[.*?\];","const LAST=['Okeke','Okafor','Ogunbiyi','Eze','Ogunleye','Nwosu','Onwuka','Balogun','Okonkwo','Ogundipe','Olaniyan','Chukwu','Ibekwe','Ugochukwu','Afolabi','Ndukwe','Usman','Adeniran','Igwe','Okolie','Ezeh','Ajayi','Onyeka','Onuoha'];")
A=rrep(A,r"const NICKS=\[.*?\];","const NICKS=['Shadow','Spider','Tall Boy','Senior Man','Pablo','Sharp Sharp','Long Leg','Biggie','Captain','Scatter','Lion King','Small Pikin','Ghost','Fire Man','Agbero','Cash Madam','Professor','Oga Pikin','Smoke','Kokoro','Razor','Bullet'];")
A=rrep(A,r"const MODELS=\[.*?\];","const MODELS=['Corolla','Camry','Sienna','Hilux','Highlander','Golf'];")
A=rrep(A,r"const TATTOOS=\[.*?\];","const TATTOOS=['Scar on left cheek','Snake tattoo on neck','Rose tattoo on hand','Skull tattoo on forearm','Burn mark on arm','Star tattoo under eye','Gold tooth','Missing finger'];")
A=rrep(A,r"const HAIR=\[.*?\];","const HAIR=[{n:'Black',h:'#1a1410'},{n:'Low cut',h:'#141010'},{n:'Dreadlocks',h:'#2a1c12'},{n:'Grey',h:'#9a9a9a'},{n:'Bald',h:null},{n:'Dyed blond',h:'#c9a35a'}];")
A=rrep(A,r"const SKIN=\[.*?\];","const SKIN=['#a06a45','#8a5a3c','#6e4429','#5a3620','#4a2e1c','#3d2516'];")
A=rrep(A,r"const SHIRTS=\[.*?\];","const SHIRTS=['#1f4fa0','#c1361f','#2f8a4f','#e0a21b','#6b2d5a','#e8e2d4','#2b2b33','#d06a1f','#1a8a8a'];")
A=rrep(A,r"const DISTRICTS=\[.*?\];","const DISTRICTS=['Marina Point','Oja Market','Ebute','Allen Estate','Orile Hills','Wharf End'];")
A=rrep(A,r"const JOBS=\[.*?\];","const JOBS=['Mechanic','Trader','Barber','Danfo driver','Okada rider','Unemployed','Electrician','Security guard','Bartender','POS agent','Dispatch rider','Plumber','Phone repairer'];")
A=rrep(A,r"const BANKS=\[.*?\];","const BANKS=['Unity Trust Bank','Coastline Bank','Eko Heritage Bank','Firststone Bank'];")
A=rrep(A,r"const RANKS=\[.*?\];","const RANKS=[[0,'Constable'],[150,'Corporal'],[400,'Sergeant'],[800,'Inspector'],[1400,'ASP'],[2200,'DSP'],[3200,'SP'],[4500,'CSP']];")
A=rep(A,"const LIMIT=35;","const LIMIT=50;")
A=rrep(A,r"function makePlate\(\)\{.*?\}","function makePlate(){const L='ABCDEFGHJKLMNPRSTUVWXYZ',c=()=>L[ri(0,22)];return pick(['KJA','LND','EKY','APP','FST','SMK','AGL','BDG','KTU','LSR'])+'-'+ri(100,999)+c()+c();}")
A=rep(A,"const randLook=()=>({shirt:pick(SHIRTS),","const randLook=()=>({ankara:Math.random()<.45?ri(0,5):null,shirt:pick(SHIRTS),")
A=rep(A,"return {badge:ri(1100,9899),xp:0,rep:60,","return {badge:ri(1100,9899),xp:0,rep:40,")
# ---- B: city + cases
B=rep(B,"const S=80,NB=6,CITY=S*NB,","const S=80,NB=8,CITY=S*NB,")
B=rep(B,"function districtAt(x,z){const bi=clamp(Math.floor(x/S),0,NB-1),bj=clamp(Math.floor(z/S),0,NB-1);return DISTRICTS[","const NEW_DISTRICTS=['Palm Grove','Lagoon Side','New Eko'];\nfunction districtAt(x,z){const bi=clamp(Math.floor(x/S),0,NB-1),bj=clamp(Math.floor(z/S),0,NB-1);if(bi>=6)return NEW_DISTRICTS[bj<4?0:1];if(bj>=6)return NEW_DISTRICTS[2];return DISTRICTS[")
B=rep(B,"function planCity(){\n  for(let bi=0;bi<NB;bi++)for(let bj=0;bj<NB;bj++){\n","function planCity(){\n  const order=[];for(let bi=0;bi<6;bi++)for(let bj=0;bj<6;bj++)order.push([bi,bj]);for(let bi=0;bi<NB;bi++)for(let bj=0;bj<NB;bj++)if(bi>=6||bj>=6)order.push([bi,bj]);\n  for(const [bi,bj] of order){\n")
B=rep(B,"      if(sp.kind==='school')LOC.school=door;","      if(sp.kind==='school')LOC.school=door;\n      if(sp.kind==='home')LOC.home={...door,district:districtAt(cx,cz)};")
B=rep(B,"const down=(bi>=2&&bi<=3&&bj>=1&&bj<=3);","const down=(bi>=2&&bi<=3&&bj>=1&&bj<=3)||(bi===7&&bj>=5&&bj<=6);")
B=rep(B,"const MOTELS=","SPECIAL['6,2']={kind:'home',side:[-1,0],W:16,D:12,H:5.5,color:'#e2d3b4'};SPECIAL['6,6']={kind:'park'};SPECIAL['3,7']={kind:'park'};\nconst MOTELS=")

B=rep(B,"was robbed at 18:05 last night","was robbed at 21:40 last night")
B=rep(B,"z1:b.z+b.d/2}));","z1:b.z+b.d/2,h:b.h+.2}));")
B=rrep(B,r"const AVES=\[.*?\];","const AVES=['Adeola Way','Bello Road','Nnamdi Avenue','Ajose Street','Okonkwo Close','Ibrahim Taiwo Road','Akintola Way','Lagoon Drive','Palm Avenue'];")
B=rrep(B,r"const STS=\[.*?\];","const STS=['Marina Road','Market Street','Ebute Road','Allen Avenue','Orile Street','Wharf Road','Creek Road','Unity Close','Freedom Way'];")
B=rep(B,"sign:'POLICE · PRECINCT 9'","sign:'EKO METRO POLICE · DIVISION 9'")
for a,b in [("Bluebird Motel","Royal Palm Hotel"),("Starlite Motor Inn","Ocean View Guest House"),("Harbor View Lodge","De Lux Inn")]: B=B.replace(a,b)
B=rep(B,"color:'#9fb59a'},\n};","color:'#9fb59a'},\n  '5,5':{kind:'motel',name:'Wharf Warehouse 7',side:[-1,0],W:46,D:20,H:10,color:'#7d8590'},\n};")
B=rep(B,"shuffle([0,1,2,4,5,6,7]).slice(0,4)","shuffle([0,1,2,4,5,6,7,8]).slice(0,5)")
B=rep(B,"pick(['Van','SUV','Sedan','Pickup'])","pick(['Sienna','Highlander','Corolla','Hilux'])")
B=rep(B,"plantVehicle(P,A,'Van')","plantVehicle(P,A,'Sienna')")
B=rep(B,"I was home watching the game.","I was home watching football.")
B=rep(B,"I sold that van months ago.","I sold that Sienna months ago.")
B=rrep(B,r"pick\(\['Maya','Leo'.*?\]\)","pick(['Kemi','Amaka','Zainab','Tolu','Chidi','Ayo','Nnenna','Sadiq','Ebuka','Fatima'])")
B=rrep(B,r"pick\(\['Northfield Elementary'.*?\]\)","pick(['Royal Crest Academy','Unity Nursery & Primary','Command Children School','Bright Stars College'])")
B=rep(B,"const parent={name:pick(","const parent={name:'Chief '+pick(")
B=rep(B,"victim.last=parent.name.split(' ')[1];","victim.last=parent.name.split(' ')[2];")
B=rep(B,"planCity();\nconst faceOf","withSeed(90210,planCity);\nconst faceOf")
# ---- C: MDT + case end
C=rep(C,"{wide:true});\n  el.dataset.mdt='1';","{wide:true,tablet:true});\n  el.dataset.mdt='1';")
C=rep(C,"curCase=cs;nextCases=null;cs.startMin=worldMin;","curCase=cs;nextCases=null;cs.startMin=worldMin;if(cs.bank)setBankSign(cs.bank);if(cs.safe)ST().flags.safeAddr=cs.safe.address;SFX.blip('radio');")
C=rep(C,"if(cs.ended)return;cs.ended=true;\n  closeModal();","if(cs.ended)return;cs.ended=true;\n  if(raidS)raidCleanup();if(cctv)cctvExit();if(cine)endCine();\n  closeModal();")
C=rep(C,"if(prisoner&&prisoner.cs===cs)prisoner=null;","if(prisoner&&prisoner.cs===cs)dropPrisoner();")
C=rep(C,"const canClose=cs.type==='robbery'?cs.custody.includes(cs.C.id):cs.flags.rescued;","const canClose=caseCanClose(cs);")
C=rep(C,"const success=how!=='abandoned'&&(cs.type==='robbery'?cs.custody.includes(cs.C.id):!!cs.flags.rescued);","const success=how!=='abandoned'&&caseCanClose(cs);")
C=rep(C,"const sub=success?","const sub=cs.sub?cs.sub(success):success?")
C=rep(C,"${caught}/3 in custody${cs.falseArrests","${caught}/${cs.gang.length} in custody${cs.falseArrests")
C=rep(C,"<dd>${caught}/3</dd>","<dd>${caught}/${cs.gang.length}</dd>")
C=rep(C,"$('#rOk',el).onclick=closeModal;","$('#rOk',el).onclick=()=>{closeModal();storyCaseEnded(cs,success);};")
C=rep(C,'<div class="offers">','<div class="offers">${storyDispatchCard()}')
C=rep(C,"<div><dt>Reputation</dt><dd>${career.rep}</dd></div>","<div><dt>Public trust</dt><dd>${career.rep}</dd></div><div><dt>Bribes refused</dt><dd>${ST().refused}</dd></div><div><dt>Bribes taken</dt><dd>${ST().taken}</dd></div>")
i=C.index('body.innerHTML=`<div class="keys" style="margin-top:0">');j=C.index('`;',i)+2
C=C[:i]+'''body.innerHTML=`<div class="keys" style="margin-top:0">
      <kbd>W A S D / arrows</kbd><span>Drive or walk. A and D steer or turn.</span><kbd>Shift</kbd><span>Run on foot. In the car, hold it while turning to drift.</span><kbd>F</kbd><span>Get in or out of the cruiser (stop first)</span>
      <kbd>E</kbd><span>Talk, inspect, arrest, continue a conversation</span><kbd>Space</kbd><span>In the car: lights and siren, or a traffic stop with a radar lock. On foot: use your tool.</span><kbd>R / 1-4</kbd><span>Switch tool: baton, pepper spray, taser, sidearm</span><kbd>G</kbd><span>Shout a warning</span><kbd>Q</kbd><span>Siren tone: wail, yelp, lights only</span><kbd>H</kbd><span>Horn</span><kbd>N</kbd><span>Sound on or off</span><kbd>Tab / M</kbd><span>Open or close this MDT</span><kbd>Drag</kbd><span>Look around</span></div>
      <p class="muted">Rank up to unlock more case types: kidnappings at Corporal, homicides at Sergeant, fraud rings at Inspector, corruption at ASP. Some cases have a deadline and a timeline of events. Others give you all the time you need.</p>
      <p class="muted">You can walk into crime scenes and suspect homes: go to the door and press E, examine the yellow markers, and leave by the front door. The Officers tab shows every officer and their record. Join their case, invite them to yours with your friend code, or bring an offline officer along as backup.</p>
      <p class="muted">Use of force: shout first (G). If they fight, subdue them with the baton, pepper spray or taser, then cuff them (E). The sidearm is for armed attackers only. Every shot is reviewed, and shooting someone who is not a deadly threat costs public trust and opens an inquiry. Watch for a red laser: an armed suspect is aiming, so break line of sight.</p>
      <p class="muted">Public trust is everything in Port Eko. Refusing bribes, fair tickets and correct arrests raise it. Taking money, false arrests and stopping drivers without a reason lower it. Witnesses talk more readily to an officer they trust, and your trust decides how the story ends.</p>
      <p class="muted">Traffic stops: the radar locks on the car ahead in your lane and the plate reader checks it. Valid reasons to stop: over ${LIMIT} km/h, running a red light in front of you, or a plate-reader hit. Hit Space, follow until they pull over, get out and walk to the driver's window.</p>`;'''+C[j:]
# ---- F: records
F=rep(F,"<label>Tattoo<select id=\"fT\">${opts(TATTOOS,'tattoo')}</select></label>","<label>Distinguishing mark<select id=\"fT\">${opts(TATTOOS,'mark')}</select></label>")
F=rep(F,'placeholder="e.g. K?7-?4?2"','placeholder="e.g. KJA-4??XY"')
F=rep(F,"<dt>Tattoo</dt>","<dt>Mark</dt>")
# ---- build modules
head=open('build/head.html').read()
head=rep(head,"<title>Precinct 9</title>","<title>Eko Nights</title>")
i=head.index('<div class="title" id="title">');j=head.index('<div id="modal"')
head=head[:i]+'''<div class="title" id="title">
  <div class="in">
    <div class="eyebrow">Eko Metropolitan Police · Division 9</div>
    <h1>Eko Nights</h1>
    <div class="bar"></div>
    <p>Port Eko never sleeps, and it does not trust the police. You are a new constable at Division 9. Yahoo boys, ghost contracts, kidnappings and bank robberies all trace back to one name nobody will say out loud: Harmattan. Bring the syndicate down, and decide what kind of officer you will be when somebody offers to "settle" you.</p>
    <div id="charBox"></div>
    <div class="opts">
      <div class="grp"><span>Graphics</span><button class="btn ghost sm" id="qHigh">High</button><button class="btn ghost sm" id="qLow">Performance</button></div>
      <div class="grp"><span>Sound</span><button class="btn ghost sm" id="sOn">On</button><button class="btn ghost sm" id="sOff">Off</button></div>
    </div>
    <div class="row"><button class="btn" id="startBtn">Start shift</button><span class="muted" id="loadMsg" style="font-size:13px"></span></div>
    <details class="ctl"><summary>Controls</summary><div class="keys">
      <kbd>W A S D</kbd><span>Drive or walk (arrow keys work too)</span>
      <kbd>Shift</kbd><span>Run on foot</span>
      <kbd>F</kbd><span>Get in or out of the cruiser</span>
      <kbd>E</kbd><span>Talk, inspect, arrest, continue dialogue</span>
      <kbd>Space</kbd><span>In the car: lights and siren, pulls over the car your radar is locked on. On foot: use your tool</span>
      <kbd>R · 1-4</kbd><span>Switch tool: baton, pepper spray, taser, sidearm</span>
      <kbd>G</kbd><span>Shout a warning. Many suspects give up without force</span>
      <kbd>Q · H</kbd><span>Change siren tone · horn</span>
      <kbd>Tab</kbd><span>MDT tablet: story, dispatch, case board, records</span>
      <kbd>Drag</kbd><span>Look around</span>
    </div></details>
  </div>
</div>
<div id="chap" hidden></div>
<div id="rotate" role="alert"><div><svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true"><rect x="27" y="8" width="30" height="68" rx="6" fill="none" stroke="#f4b740" stroke-width="4"/><circle cx="42" cy="66" r="3" fill="#f4b740"/></svg><h2>Turn your phone sideways</h2><p>Eko Nights plays in landscape. Rotate your phone to start your shift.</p></div></div>
'''+head[j:]
head=rep(head,"</style>",""".charform{display:grid;grid-template-columns:1fr 1fr;gap:10px 12px;margin:16px 0;padding:14px;border:1px solid var(--line);border-radius:8px;background:rgba(18,28,47,.6)}
.charform label{display:grid;gap:4px;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
.charform input{background:var(--panel2);border:1px solid var(--line);border-radius:4px;padding:8px 10px;font-size:15px;text-transform:none;letter-spacing:0;min-width:0}
.charform .grp{grid-column:1/-1;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.charform .grp span{font-family:var(--f-mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-right:4px}
.sw{width:30px;height:30px;border-radius:50%;border:2px solid var(--line);padding:0}
.sw[aria-pressed="true"]{border-color:var(--amber);box-shadow:0 0 0 2px var(--amber)}
.contcard{display:flex;gap:12px;align-items:center;justify-content:space-between;margin:16px 0;padding:12px 14px;border:1px solid var(--line);border-radius:8px;background:rgba(18,28,47,.6);flex-wrap:wrap}
.contcard b{display:block;font-family:var(--f-disp);font-size:22px;text-transform:uppercase;letter-spacing:.04em}
.contcard span{font-size:13px}
details.ctl{margin-top:16px;color:var(--muted);font-size:14px}
details.ctl summary{cursor:pointer;font-family:var(--f-mono);font-size:12px;letter-spacing:.1em;text-transform:uppercase}
#chap{position:fixed;inset:0;z-index:16;display:grid;place-items:center;text-align:center;background:radial-gradient(ellipse at center,rgba(11,18,32,.84),rgba(11,18,32,.97));padding:24px max(16px,env(safe-area-inset-right,0px)) 24px max(16px,env(safe-area-inset-left,0px));transition:opacity .6s;cursor:pointer}
#chap.out{opacity:0}
#chap h1{font-size:clamp(48px,11vw,104px);font-weight:800;line-height:.9;margin:8px 0 14px}
#chap p{color:var(--muted);max-width:46ch;margin:0 auto;font-size:17px}
.limit{border-radius:50%;border:5px solid #d3202f;outline:2px solid #fff;background:#fff;width:50px;height:50px;padding:0;align-items:center}
.limit b{font-size:19px}
@media (max-width:760px){.charform{grid-template-columns:1fr}}
@media (max-width:480px){.tl{width:calc(100% - 144px);gap:6px}.trbtns{flex-direction:column;align-items:stretch;width:118px}.mdtbtn{font-size:12.5px;padding:5px 6px;text-align:center}
  .card{padding:6px 9px}.obj b{font-size:15px}.obj .gps{font-size:11px}.status .rank{font-size:15px}.status .clk{font-size:12px}}
/* ---- phones in landscape: the game's home layout */
@media (max-height:500px) and (orientation:landscape){
  .tl{width:min(290px,38vw);gap:5px;top:calc(6px + env(safe-area-inset-top,0px))}
  .tr{top:calc(6px + env(safe-area-inset-top,0px));gap:5px}
  #mini{width:92px;height:92px}
  .trbtns{gap:4px;flex-direction:row;width:auto}.mdtbtn{font-size:11.5px;padding:4px 7px}
  .card{padding:5px 9px}
  .status{gap:8px}.status .rank{font-size:14px}.status .clk{font-size:11.5px}.status .clk small{font-size:10px}.status .xpbar{display:none}
  .obj .eyebrow{font-size:9.5px}.obj b{font-size:14px}.obj p{display:none}.obj .gps{font-size:10.5px;margin-top:2px}.obj .how{font-size:10.5px;margin-top:2px}
  .dash{gap:5px;bottom:calc(8px + env(safe-area-inset-bottom,0px))}.dash .cell{min-width:46px;padding:2px 6px}.dash .lbl{font-size:8.5px}.dash b{font-size:15px}.dash .radar{min-width:92px}
  .limit{width:38px;height:38px;border-width:4px}.limit b{font-size:15px}
  body.touchmode .dash{left:max(236px,32%);transform:none;bottom:calc(8px + env(safe-area-inset-bottom,0px));flex-wrap:nowrap;max-width:none}
  .prompt,body.touchmode .prompt{bottom:calc(62px + env(safe-area-inset-bottom,0px));font-size:13px;padding:5px 10px}
  .toasts,body.touchmode .toasts{top:calc(6px + env(safe-area-inset-top,0px));bottom:auto;left:calc(min(290px,38vw) + 22px);right:112px;padding:0;gap:5px}
  .toast{font-size:12px;padding:5px 9px;max-width:100%}
  body.cine .lb{height:5vh}
  #dlg{bottom:calc(5vh + 6px + env(safe-area-inset-bottom,0px));width:min(720px,calc(100% - 24px));padding:8px 14px;max-height:calc(100% - 12vh)}
  #dlg .who{font-size:10.5px;margin-bottom:2px}#dlg .txt{font-size:14px;line-height:1.4;min-height:2.6em}#dlg .next{font-size:10px;margin-top:2px}
  #dlg .choices{gap:6px;margin-top:6px}#dlg .choices .btn{padding:6px 10px;font-size:13px}#dlg .ivlog{max-height:38vh}#dlg .ivlog .l{font-size:13px}
  #raidhud{top:calc(6px + env(safe-area-inset-top,0px));font-size:11.5px;padding:4px 10px;gap:10px}
  .modal{padding:6px max(6px,env(safe-area-inset-right,0px)) 6px max(6px,env(safe-area-inset-left,0px))}
  .sheet{padding:10px 12px;margin-block:0}.sheet.wide{max-width:none}.tablet{border-width:4px;border-radius:10px}
  .sheet > header{margin-bottom:8px}.sheet h2{font-size:19px}.sheet .eyebrow{font-size:10px}
  .tabs{gap:4px}.tabs button{padding:4px 9px;font-size:11px}
  .offer{grid-template-columns:76px minmax(0,1fr) auto;gap:10px;padding:8px 10px}.offer .code b{display:block;font-size:20px;margin:0}.offer h3{font-size:16px}.offer p{font-size:12.5px;margin:2px 0 4px}
  .board{grid-template-columns:1fr 1fr}
  .modal.side{justify-content:flex-end;align-items:stretch;padding:6px;padding-bottom:6px}
  .modal.side .sheet{max-width:min(390px,52vw);max-height:none;height:100%}
  .title{place-items:start center;overflow:auto;padding:10px max(16px,env(safe-area-inset-right,0px)) 10px max(16px,env(safe-area-inset-left,0px))}
  .title .in{max-width:760px;width:100%}
  .title h1{font-size:46px}.title .bar{margin:6px 0;height:4px}.title p{font-size:13px;margin:4px 0;max-width:none}.title .eyebrow{font-size:10px}
  .charform{grid-template-columns:1fr 1fr;margin:8px 0;padding:10px;gap:6px 10px}.charform input{padding:6px 8px;font-size:14px}
  .contcard{margin:8px 0;padding:8px 12px}.contcard b{font-size:18px}
  #chap h1{font-size:44px;margin:4px 0 8px}#chap p{font-size:14px}
  body.raid .tl{display:none}
  body.raid .toasts{top:auto;bottom:calc(14px + env(safe-area-inset-bottom,0px));left:180px;right:180px}
  .title{place-items:center}
  .title .in{column-count:2;column-gap:24px}
  .title .in > *{break-inside:avoid}
  .title .in > p{break-after:column}
  .title .in > #onlineBox,.title .in > #charBox{margin-top:0}
  .title .opts{margin:4px 0}.title .row{margin-top:4px}
}
/* ---- phones held upright: ask to turn sideways */
#rotate{display:none;position:fixed;inset:0;z-index:100;background:#0b1220;place-items:center;text-align:center;padding:24px;color:var(--ink)}
#rotate h2{font-size:30px;margin:18px 0 8px}#rotate p{color:var(--muted);margin:0 auto;max-width:28ch}
#rotate svg{animation:tilt 2.2s ease-in-out infinite}
@keyframes tilt{0%,30%{transform:rotate(0)}55%,85%{transform:rotate(-90deg)}100%{transform:rotate(0)}}
@media (orientation:portrait) and (pointer:coarse) and (max-width:900px){#rotate{display:grid}}
@media (prefers-reduced-motion:reduce){#rotate svg{animation:none;transform:rotate(-90deg)}}
@media (max-width:400px){.dash .cell{min-width:50px;padding:3px 6px}.dash .radar{min-width:104px}.dash b{font-size:16px}}
.chatlog{display:grid;gap:8px;max-height:56vh;overflow:auto;padding:12px;background:#0b141a;border-radius:8px;border:1px solid var(--line)}
.bub{max-width:82%;justify-self:start;padding:8px 10px 6px;border-radius:10px 10px 10px 2px;background:#1f2c34;display:grid;gap:4px;border:2px solid transparent}
.bub.me{justify-self:end;background:#0f4a3f;border-radius:10px 10px 2px 10px}
.bub.sys{justify-self:center;max-width:94%;background:#1a2230;font-family:var(--f-mono);font-size:13px;border-radius:6px}
.bub small{color:var(--muted);font-size:11px;font-family:var(--f-mono)}
.bub .btn{justify-self:end;padding:2px 10px;font-size:12px}
.bub.flag-hit{border-color:var(--ok)}.bub.flag-miss{opacity:.5}
.tline{margin:0 0 14px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:rgba(18,28,47,.5)}
.tline.none{color:var(--muted);font-size:14px}
.tline .bar{position:relative;height:8px;border-radius:4px;background:var(--panel2);margin:6px 4px 10px}
.tline .bar i{position:absolute;inset:0 auto 0 0;border-radius:4px;background:var(--amber)}
.tline .bar .ms{position:absolute;top:-4px;width:4px;height:16px;margin-left:-2px;background:var(--muted);border-radius:2px}
.tline .bar .ms.hit{background:var(--red)}.tline .bar .end{position:absolute;right:-2px;top:-5px;width:4px;height:18px;background:var(--red);border-radius:2px}
.tline ol{list-style:none;margin:0;padding:0;display:grid;gap:3px;font-size:13px;color:var(--muted)}
.tline li{display:flex;gap:10px}.tline li .mono{min-width:108px;color:var(--text)}.tline li.hit{color:var(--red)}.tline li.dl{color:var(--red)}
.offer.locked{opacity:.65}
.ocard{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:8px;background:rgba(18,28,47,.5);margin-bottom:8px}
.ocard.me{border-color:var(--amber)}
.oname{font-family:var(--f-disp);font-size:20px;text-transform:uppercase;letter-spacing:.03em}
.ostats{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:13px;color:var(--muted);margin:6px 0}.ostats b{color:var(--text)}
.rbar{height:5px;border-radius:3px;background:var(--panel2);margin-bottom:6px;max-width:260px}.rbar i{display:block;height:100%;border-radius:3px;background:var(--ok)}
.oacts{display:grid;gap:6px}
.sqbox{padding:12px;border:1px dashed var(--amber);border-radius:8px;margin:10px 0}.sqbox p{margin:6px 0}
.roster{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.chkl{display:flex!important;flex-direction:row!important;align-items:center;gap:8px;align-self:end}
.contcard .resume{display:block;color:var(--amber)}
@media (max-width:640px){.ocard{grid-template-columns:auto 1fr}.oacts{grid-column:1/-1;grid-auto-flow:column}}
</style>""")
world=open('build/world.js').read()
world=rep(world,"const P=CAR_PROF[model]||CAR_PROF.Sedan,G=carGeo(model);","if(model==='Keke'||model==='Okada')return makeSmallVehicle(color,model);\n  const shape=SHAPE[model]||model;const P=CAR_PROF[shape]||CAR_PROF.Sedan,G=carGeo(shape);")
world=rep(world,"body.add(new THREE.Mesh(G.glass,std('#0b1118',.08,.85)));","body.add(new THREE.Mesh(G.glass,std('#0b1118',.08,.85)));\n  if(model==='Danfo'){const sm=lam('#111111');[-1,1].forEach(s=>{for(const y of [.62,1.0]){const st=new THREE.Mesh(new THREE.PlaneGeometry(4.7,.16),sm);st.position.set(s*(P.W/2+.04),y,0);st.rotation.y=s*Math.PI/2;body.add(st);}});}")
world=rep(world,"shirt=lam(o.shirt||'#3d4f6e')","shirt=o.ankara!=null?ankaraMat(o.ankara):lam(o.shirt||'#3d4f6e')")
world=rep(world,"  if(o.hat){M(GEO.hat,lam(o.hatColor||'#141c30'),0,.31,0,head);M(GEO.brim,lam('#0f1524'),0,.265,.03,head).scale.z=1.15;}","  if(o.hat){M(GEO.hat,lam(o.hatColor||'#141c30'),0,.31,0,head);M(GEO.brim,lam('#0f1524'),0,.265,.03,head).scale.z=1.15;}\n  if(o.bun){const b=M(GEO.head,lam('#141010'),0,.21,-.12,head);b.scale.set(.6,.55,.55);}")
world=rep(world,"x.fillText('PRECINCT 9 · DIAL 911',256,116);","x.fillText('EKO METRO POLICE · CALL 112',256,116);")
world=rep(world,"signMat('POLICE · PRECINCT 9','#13285a','#f4f1e6',true)","signMat('EKO METRO POLICE · DIVISION 9','#13285a','#f4f1e6',true,640,96,46)")
world=rrep(world,r"fg\.fillStyle='#1d3a7a';fg\.fillRect\(0,0,128,80\);.*?fg\.fill\(\);","fg.fillStyle='#0b8a3c';fg.fillRect(0,0,128,80);fg.fillStyle='#ffffff';fg.fillRect(43,0,42,80);")
world=rep(world,"db:new THREE.Color('#cfdbe7')","db:new THREE.Color('#ddd3bd')")
world=rep(world,"dt:new THREE.Color('#3b74c0')","dt:new THREE.Color('#5a8cc4')")
sim=open('build/sim.js').read()
sim=rep(sim,"model:pick(['Sedan','Sedan','SUV','Hatchback','Coupe','Pickup','Van','SUV'])","model:pick(TRAFFIC_MODELS)")
sim=rep(sim,"cruise:(speeder?rnd(45,62):rnd(24,35))/2.237","cruise:(speeder?rnd(64,95):rnd(36,50))/3.6")
sim=rep(sim,"  c.speed=c.cruise;c.speeding=c.cruise*2.237>LIMIT+.5;","  if(c.model==='Danfo')c.color='#e8b417';if(c.model==='Keke'){c.color=pick(['#e8b417','#2f8a4f']);c.cruise=rnd(25,40)/3.6;}c.small=c.model==='Keke'||c.model==='Okada';\n  c.speed=c.cruise;c.speeding=c.cruise*2.237>LIMIT+.5;")
sim=rep(sim,"for(const c of aiCars){if(c.mode!=='drive')continue;const rx=c.rx-pc.x","for(const c of aiCars){if(c.mode!=='drive'||c.small)continue;const rx=c.rx-pc.x")
sim=rep(sim,"f.push('OWNER WARRANT');if(d.reg!=='Valid')f.push('REG EXPIRED');","f.push('OWNER WANTED');if(d.reg!=='Valid')f.push('PARTICULARS EXPIRED');")
sim=sim.replace("c.mesh.userData.body.add(Object.assign(plateMesh(p.car.plate),{}));","")
cine=open('build/cine.js').read()
cine=rep(cine,"carGeo(a.model).len","carGeo(SHAPE[a.model]||a.model).len")
cine=rep(cine,"${R.min<16*60?'TODAY':'YESTERDAY'}","${R.day||(R.min<16*60?'TODAY':'YESTERDAY')}")
cine=rep(cine,"let note,alert=false;","let note,alert=!!cs.flags.tipped;")
cine=rep(cine,"$27,900 recovered.","${cs.lootText||'₦5.6 million recovered'}.")
cine=rep(cine,"'$27,900 of the stolen cash was in a gym bag under the motel bed.'","cs.lootDetail||'₦5.6 million of the stolen cash was in a Ghana-must-go bag under the bed.'")
game=open('build/game.js').read()
game=rep(game,"    }else{\n      I.push({key:'schoolcam'","    }else if(cs.type==='kidnap'){\n      I.push({key:'schoolcam'")
game=rep(game,'<div class="rank">${r.name}</div>','<div class="rank">${r.name} ${esc(OFF().last)}</div>')
game=rep(game,"REP ${career.rep}","TRUST ${career.rep}")
game=rep(game,"  else if(cs)ob=guideObj(cs);","  else if(!cs&&storyObj())ob=storyObj();\n  else if(cs)ob=guideObj(cs);")
game=rep(game,"  return I;\n}\nfunction driverWindow","  storyInteractables(I);\n  return I;\n}\nfunction driverWindow")
game=rep(game,"if(gpsPerson){const p=person(cs,gpsPerson);","if(gpsPerson&&cs.type!=='leak'&&cs.type!=='finale'){const p=person(cs,gpsPerson);")
for a,b in [("Talk to Hal Brennan, security guard","Talk to Mr. Sunday Etim, bank security"),("Talk to Gloria Haynes, branch manager","Talk to Mrs. Funmi Odukoya, branch manager"),("Talk to Rina Patel at the coffee cart","Talk to Mama Nkechi at her akara stand"),("Talk to Earl Simms, crossing guard","Talk to Mallam Garba, the school gateman")]: game=rep(game,a,b)
game=rep(game,"${lower(cs.A.car.color.n)} van pulled up","${lower(cs.A.car.color.n)} ${cs.A.car.model} pulled up")
game=rep(game,"${lower(cs.A.car.color.n)} van unload","${lower(cs.A.car.color.n)} ${cs.A.car.model} unload")
game=rep(game,"$('#startBtn').onclick=()=>{\n    $('#startBtn').disabled=true;","$('#startBtn').onclick=()=>{\n    if(!storyPrepare())return;goLandscape();\n    $('#startBtn').disabled=true;")
game=rep(game,"        buildWorld();\n","        buildWorld();buildLocalProps();\n")
game=rrep(game,r"SFX\.blip\('radio'\);toast\('Dispatch: 9-Adam.*?\);","perfStart();resumeGame();storyBegin();publishProfile(true);")
game=rep(game,'<div class="limit" aria-label="Speed limit ${LIMIT}"><span>SPEED<br>LIMIT</span><b>${LIMIT}</b></div>','<div class="limit" aria-label="Speed limit ${LIMIT} km/h"><b>${LIMIT}</b></div>')
for mod in ('sim','game','cine'):
    s=locals()[mod].replace('2.237','3.6').replace(' MPH',' KM/H').replace('} mph','} km/h').replace('0 mph','0 km/h')
    locals()[mod]  # noop
    if mod=='sim': sim=s
    elif mod=='game': game=s
    else: cine=s
C=C.replace('} mph','} km/h')
i=C.index("if(mdtTab==='dispatch'){");j=C.index("}else if(mdtTab==='case'){")
C=C[:i]+"if(mdtTab==='dispatch'){\n    drawDispatch(body,cs);\n  }else if(mdtTab==='officers'){\n    drawOfficers(body);\n  "+C[j:]
C=rep(C,"['dispatch','Dispatch'],","['dispatch','Dispatch'],['daily','Daily'],['officers','Officers'],")
C=rep(C,"<span style=\"color:${left<cs.limit*.25?'var(--red)':'var(--amber)'}\">${fmtMin(left)} left</span>","${deadlineHTML(cs)}")
C=rep(C,'<div class="board"><div class="col"><h3>Leads</h3>','${timelineHTML(cs)}<div class="board"><div class="col"><h3>Leads</h3>')
C=rep(C,"Math.round(left/4)","Math.round((isFinite(left)?left:240)/4)")
C=rep(C,"const success=how!=='abandoned'&&caseCanClose(cs);","const success=how!=='abandoned'&&caseCanClose(cs);onCaseEnd(cs,how,success);")
C=rep(C,"if(raidS)raidCleanup();","if(raidS)raidCleanup();if(insideS)leaveInterior(true);")
C=rep(C,"curCase=cs;nextCases=null;cs.startMin=worldMin;","curCase=cs;nextCases=null;if(!cs.squad)cs.startMin=worldMin;if(cs.type==='contract')drawSiteBoard(cs);setTimeout(()=>publishProfile(),300);setTimeout(()=>ticketStart(cs),100);")
C=rep(C,"<div><dt>Public trust</dt>","<div><dt>Rating</dt><dd>${rating()}</dd></div><div><dt>Friend code</dt><dd class=\"mono\" style=\"font-size:18px\">${myCode()}</dd></div><div><dt>Public trust</dt>")
C=rep(C,"rep=8+(caught===3?4:0);","rep=(cs.flags.paid||cs.flags.honPaid)?0:8+(caught===3?4:0);")
C=rep(C,"if(l.at){setGPS(l.at.x,l.at.z,l.at.label);","if(l.at){setGPS(l.at.x,l.at.z,l.at.label,l.pid||null,true);")
F=rep(F,"setGPS(p.door.x,p.door.z,p.name+\"'s home\",p.id);","setGPS(p.door.x,p.door.z,p.name+\"'s home\",p.id,true);")
C=rep(C,"${cs.type==='robbery'?'Armed robbery':'Kidnapping'}","${({robbery:'Armed robbery',kidnap:'Kidnapping',leak:'Internal affairs',finale:'Organised crime',romance:'Romance fraud',yahoo:'Cyber fraud',contract:'Public corruption',homicide:'Homicide'})[cs.type]}")
C=rep(C,"const L=leads(cs);const left=cs.limit-cs.used;","const L=leads(cs);const NX=guideLead(L);const left=cs.limit-cs.used;")
C=rep(C,'<div class="lead${l.hot?\' hot\':\'\'}"><b>${esc(l.t)}</b>','<div class="lead${l.hot?\' hot\':\'\'}${l===NX?\' next\':\'\'}"><b>${l===NX?\'<span class="nx">NEXT</span>\':\'\'}${esc(l.t)}</b>')
story=open('build/story.js').read()
story=rep(story,"function leads(cs){","function leadsBase(cs){")
story=rep(story,"\nrenderCharBox();\n","\n")
story=rep(story,"{ch:1,step:'brief',taken:0,refused:0,cash:0,flags:{}}","{ch:1,i:0,v:2,step:'active',taken:0,refused:0,cash:0,flags:{}}",0)
story+='\n'+open('build/story2.js').read()+'\n'+open('build/cases2.js').read()+'\n'+open('build/online.js').read()+'\n'+open('build/perf.js').read()+'\n'+open('build/touch.js').read()+'\n'+open('build/guide.js').read()+'\n'+open('build/life.js').read()+'\n'+open('build/politicians.js').read()+'\n'+open('build/score.js').read()
story=rep(story,"saveCareer();CHAR.newMode=false;return true;","saveCareer();CHAR.newMode=false;RESUME=null;try{localStorage.removeItem('eko-save');}catch(e){}return true;")
story=rep(story,"`Chapter ${s.ch}: ${CH[s.ch].t}`} · trust ${career.rep}</span>","`Chapter ${s.ch}: ${CH[s.ch].t}`} · trust ${career.rep}</span>${resumeLine()}")
game=rep(game,"cs.used+=min;","cs.used+=Math.round(min*(1-backupCut(cs)));")
game=rep(game,"${cs?`<small style=\"color:${cs.limit-cs.used<cs.limit*.25?'var(--red)':'var(--amber)'}\">${fmtMin(cs.limit-cs.used)} left</small>`:","${cs?deadlineHTML(cs):")
game=rep(game,"  if(raidS){if(!modal)updateRaid(dt);}","  if(insideS){if(!modal)updateInterior(dt);}\n  else if(raidS){if(!modal)updateRaid(dt);}")
game=rep(game,"if(raidS)raidCam(dt);else","if(raidS||insideS)raidCam(dt);else")
game=rep(game,"const fx=raidS?pl.x:camera.position.x,fz=raidS?pl.z:camera.position.z;","const fx=(raidS||insideS)?pl.x:camera.position.x,fz=(raidS||insideS)?pl.z:camera.position.z;")
game=rep(game,"if(started&&!cctv)syncInteractables(tAcc);","if(started&&!cctv&&!insideS)syncInteractables(tAcc);\n  if(started){netFrame(dt);updateBackup(dt);perfFrame();touchFrame(dt);cbFrame(dt);guideTick(dt);lifeFrame(dt);}")
game=rep(game,"if(gps&&!cctv&&!raidS){beacon","if(gps&&!cctv&&!raidS&&!insideS){beacon")
game=rep(game,"  if(raidS){raidInteract();return;}","  if(raidS){raidInteract();return;}\n  if(insideS){interiorInteract();return;}")
game=rep(game,"else if(e.code==='KeyF')toggleCar();","else if(e.code==='KeyF'){if(!insideS&&!raidS)toggleCar();}")
cine=rep(cine,"raidS={cs,kid,L,actors,swat,boss,time:80,","raidS={cs,kid,L,actors,swat,boss,time:110+(cs.backup?20:0),")
cine=rep(cine,"if(bossCuffed){cs.custody.push(cs.C.id);","if(bossCuffed){career.raids=(career.raids||0)+1;cs.flags.raidWin=true;cs.custody.push(cs.C.id);")
game=rep(game,"function doorTalk(cs,p){","function doorTalkBase(cs,p){")
game=rep(game,"buildWorld();buildLocalProps();","buildWorld();withSeed(77,buildLocalProps);buildStoryProps();")
cine=rep(cine,"if(intel)lines.push(you(kid?","if(intel)lines.push(you(cs.intelLine||(kid?")
cine=rep(cine,"We go in the back.'));","We go in the back.')));")
out='\n'.join([head,'<script>',A,B,C,E,F,open('build/audio.js').read(),open('build/art.js').read(),world,sim,cine,open('build/combat.js').read(),game,story,'</script>'])
out=out.replace("body.cine .hud,","body.cine .hud,body.cctv .hud,").replace("body.cine .lb{height:7vh}","body.cine .lb{height:7vh}\nbody.cctv .lb{height:0}")
out=out.replace("  }else if(started&&modal&&prisoner&&prisoner.state==='walkin'){}\n","  }\n").replace("  if(started&&!raidS&&!cctv)updatePrisoner(cine?0:0);\n","")
out=out.replace('makePersonMesh(OFFICER_LOOK)','makePersonMesh(playerLook())')
for a,b in [('Precinct 9','Division 9'),('PRECINCT 9','DIVISION 9'),('Reputation','Trust'),('reputation','trust')]: out=out.replace(a,b)
out=out.replace('<title>Eko Nights</title>','<title>Eko Nights</title>')
open('precinct/precinct-9.html','w').write(out)
print('ok',len(out))
