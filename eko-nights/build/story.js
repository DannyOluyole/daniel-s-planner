// ================= Eko Nights: story, officer, trust and bribes, Nigerian setting
// Functions declared here intentionally replace earlier versions of the same name (traffic stop, witnesses, leads, bank, CCTV).
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const naira=n=>'₦'+Math.round(n).toLocaleString('en-NG');
const OFF=()=>career.officer||{first:'Officer',last:'',gender:'m',skin:SKIN[1]};
const ST=()=>career.story||(career.story={ch:1,step:'brief',taken:0,refused:0,cash:0,flags:{}});
function playerLook(){const o=OFF();const u=(typeof UNIFORMS!=='undefined'&&UNIFORMS[o.uniform])||{shirt:'#1f2b45',vest:true};return {shirt:u.shirt,pants:'#141922',skin:o.skin,hat:true,vest:u.vest,vestColor:u.vestColor,shoes:'#0b0b0b',bun:o.gender==='f'};}
const SHAPE={Corolla:'Sedan',Camry:'Sedan',Golf:'Hatchback',Sienna:'Van',Highlander:'SUV',Hilux:'Pickup',Danfo:'Van'};
const TRAFFIC_MODELS=['Corolla','Corolla','Camry','Sienna','Highlander','Golf','Hilux','Danfo','Danfo','Keke','Keke','Okada','Okada'];

// ---------- people and places at Division 9
const _sd=LOC.station;
LOC.bisi={x:_sd.x-_sd.tx*2.4+_sd.nx*1.6,z:_sd.z-_sd.tz*2.4+_sd.nz*1.6};
LOC.coker={x:_sd.x+_sd.tx*2.4+_sd.nx*1.6,z:_sd.z+_sd.tz*2.4+_sd.nz*1.6};
LOC.logTerm={x:_sd.x-_sd.tx*5,z:_sd.z-_sd.tz*5};
LOC.carpark={x:_sd.x+_sd.tx*7.5+_sd.nx*2,z:_sd.z+_sd.tz*7.5+_sd.nz*2};
LOC.informant={x:(1+.5)*S+6,z:(2+.5)*S+4};
const NPCS={
  bisi:{name:'Sgt Bisi Okafor',look:{shirt:'#1f2b45',pants:'#141922',skin:'#6e4429',hat:true,vest:true,bun:true},pos:LOC.bisi},
  coker:{name:'CSP Adeyemi Coker',look:{shirt:'#2a2f3a',pants:'#141922',skin:'#5a3620',hat:true,hatColor:'#101010',vest:true,vestColor:'#3a3f4a',tall:1.07},pos:LOC.coker},
};
const CH={1:{t:'First Posting',sub:'Your first day at Division 9. Nobody in Port Eko trusts the uniform. Yet.',brief:'bisi',debrief:'bisi'},
  2:{t:'Cash Run',sub:'A bank is robbed in the night. Three men, one car, and a name nobody wants to say out loud.',brief:'coker',debrief:'coker'},
  3:{t:'Ransom',sub:'A child is taken outside school. The ransom is paid. The child is still missing.',brief:'coker',debrief:'bisi'},
  4:{t:'Inside Man',sub:'Someone in Division 9 is selling raid plans. Find them before they find you.',brief:'bisi',debrief:'bisi'},
  5:{t:'Harmattan',sub:'Wharf Warehouse 7. Felix "Harmattan" Amadi. End it.',brief:'bisi',debrief:null}};

// ---------- title screen: create your officer
const CHAR={g:'m',s:SKIN[1],newMode:false};
const SKIN_PICK=['#a06a45','#8a5a3c','#6e4429','#5a3620','#4a2e1c','#3d2516'];
function renderCharBox(){
  const box=$('#charBox');if(!box)return;const o=career.officer;
  if(o&&!CHAR.newMode){
    const s=ST();box.innerHTML=`<div class="contcard"><div><div class="eyebrow">Saved officer</div><b>${esc(rankOf(career.xp).name)} ${esc(o.first)} ${esc(o.last)}</b><span class="muted">${s.step==='done'?'Story complete · free patrol':`Chapter ${s.ch}: ${CH[s.ch].t}`} · trust ${career.rep}</span></div><button class="btn ghost sm" id="newOff">New officer</button></div>`;
    $('#newOff').onclick=()=>{CHAR.newMode=true;renderCharBox();};return;
  }
  box.innerHTML=`<div class="charform">
    <div class="eyebrow" style="grid-column:1/-1">Create your officer${o?' · this replaces your saved career':''}</div>
    <label>First name<input id="cFirst" maxlength="16" autocomplete="off" placeholder="e.g. Tunde"></label>
    <label>Surname<input id="cLast" maxlength="18" autocomplete="off" placeholder="e.g. Bakare"></label>
    <div class="grp"><span>Officer</span><button class="btn ghost sm" data-g="m" aria-pressed="${CHAR.g==='m'}">Male</button><button class="btn ghost sm" data-g="f" aria-pressed="${CHAR.g==='f'}">Female</button></div>
    <div class="grp"><span>Skin tone</span>${SKIN_PICK.map(c=>`<button class="sw" data-s="${c}" style="background:${c}" aria-label="Skin tone" aria-pressed="${CHAR.s===c}"></button>`).join('')}</div>
    ${o?'<button class="btn ghost sm" id="keepOff" style="grid-column:1/-1;justify-self:start">Keep my saved officer</button>':''}</div>`;
  $$('[data-g]',box).forEach(b=>b.onclick=()=>{CHAR.g=b.dataset.g;$$('[data-g]',box).forEach(x=>x.setAttribute('aria-pressed',x===b));});
  $$('[data-s]',box).forEach(b=>b.onclick=()=>{CHAR.s=b.dataset.s;$$('[data-s]',box).forEach(x=>x.setAttribute('aria-pressed',x===b));});
  const k=$('#keepOff');if(k)k.onclick=()=>{CHAR.newMode=false;renderCharBox();};
}
CHAR.s=SKIN_PICK[2];
function storyPrepare(){
  if(career.officer&&!CHAR.newMode)return true;
  const f=($('#cFirst')||{}).value||'',l=($('#cLast')||{}).value||'';
  if(!f.trim()||!l.trim()){$('#loadMsg').innerHTML='<span class="loaderr">Enter your officer\'s first name and surname.</span>';$('#startBtn').disabled=false;return false;}
  career={badge:ri(1100,9899),xp:0,rep:40,tickets:0,warnings:0,arrests:0,cases:0,failed:0,falseArrests:0,log:[],
    officer:{first:cap(f.trim()),last:cap(l.trim()),gender:CHAR.g,skin:CHAR.s},story:{ch:1,step:'brief',taken:0,refused:0,cash:0,flags:{}}};
  saveCareer();CHAR.newMode=false;return true;
}

// ---------- chapter cards, objectives, GPS
function showChapter(n){
  const c=$('#chap');c.innerHTML=`<div><div class="eyebrow">Chapter ${n}</div><h1>${esc(CH[n].t)}</h1><p>${esc(CH[n].sub)}</p></div>`;c.hidden=false;c.classList.remove('out');
  SFX.blip('radio');clearTimeout(c._t);c._t=setTimeout(()=>{c.classList.add('out');setTimeout(()=>c.hidden=true,600);},3800);c.onclick=()=>{c.hidden=true;};
}
function storyObj(){
  const s=ST();if(!career.officer||s.step==='done'||s.step==='case')return null;const T=CH[s.ch];
  if(s.step==='duty')return {e:`Chapter 1 · ${T.t}`,b:`Traffic duty: ${Math.min(3,shift.stops-s.stopsAt)}/3 stops`,p:`Lock the radar on a speeder (over ${LIMIT} km/h), a red-light runner or a plate-reader hit. Hit Space, follow until they stop, then walk to the window.`};
  const who=NPCS[T[s.step]];if(!who)return null;
  return {e:`Chapter ${s.ch} · ${T.t}`,b:`${s.step==='brief'?'Talk to':'Report back to'} ${who.name}`,p:'At the entrance of Division 9. Follow the GPS.'};
}
function storyGPST(){const s=ST();if(curCase||gps||!career.officer)return;if(s.step==='brief'||s.step==='debrief'){const w=NPCS[CH[s.ch][s.step]];if(w)setGPS(w.pos.x,w.pos.z,w.name);}}
function storyDispatchCard(){
  const s=ST();if(!career.officer)return '';
  if(s.step==='done')return `<article class="offer"><div class="code"><b>EKO</b>Story</div><div><h3>Harmattan is finished</h3><p>The story is complete. Port Eko still needs patrolling: take any case below.</p><span class="chip ok">Trust ${career.rep}</span></div><span></span></article>`;
  const o=storyObj();const T=CH[s.ch];
  return `<article class="offer urgent"><div class="code"><b>CH ${s.ch}</b>Story</div><div><h3>${esc(T.t)}</h3><p>${esc(o?o.b+'. '+o.p:'Your story case is active. Open the Case tab for leads.')}</p><span class="chip amber">Trust ${career.rep}</span> <span class="chip">${s.refused} bribes refused · ${s.taken} taken</span></div><span></span></article>`;
}
function storyInteractables(I){
  const s=ST();if(!career.officer)return;const cs=curCase;
  const npc=(who,label,act)=>{const n=NPCS[who];I.push({key:'story_'+who,x:n.pos.x,z:n.pos.z,kind:'npc',look:n.look,face:faceOf(LOC.station),label:label||`Talk to ${n.name}`,act:act||(()=>storyTalk(who))});};
  if(!cs&&(s.step==='brief'||s.step==='debrief')){const w=CH[s.ch][s.step];if(w)npc(w);}
  if(cs&&cs.type==='leak'){
    I.push({key:'logterm',x:LOC.logTerm.x,z:LOC.logTerm.z,kind:'terminal',face:faceOf(LOC.station),label:'Check the evidence-room log',act:()=>leakLog(cs)});
    I.push({key:'carcam',x:LOC.carpark.x,z:LOC.carpark.z,kind:'terminal',face:faceOf(LOC.station),label:'Review the car park camera',act:()=>{if(!cs.done.cctv){if(!spend(cs,15))return;cs.done.cctv=true;}openCCTV3D(cs);}});
    if(leakEvidence(cs)>=2&&!cs.flags.confronted)I.push({key:'confront',x:LOC.interview.x,z:LOC.interview.z,kind:'terminal',face:faceOf(LOC.station),label:'Interview room: confront the leak',act:()=>confrontPick(cs)});
  }
  if(cs&&cs.type==='finale'&&!cs.custody.includes(cs.C.id)&&!(chase&&chase.p===cs.C)){const m=LOC.motels['Wharf Warehouse 7'];I.push({key:'raid',x:m.x+m.nx*2,z:m.z+m.nz*2,kind:'door',label:'Brief SWAT and raid Wharf Warehouse 7',act:()=>raidBrief(cs)});}
  if(cs&&cs.type==='finale'&&cs.flags.informant&&!cs.done.informant)I.push({key:'informant',x:LOC.informant.x,z:LOC.informant.z,kind:'npc',look:{shirt:'#d9a227',ankara:1,skin:'#5a3620',hair:'#141010',pants:'#6b2d5a'},label:'Talk to Iya Risi',act:()=>informantTalk(cs)});
}
function storyTick(){
  if(!started||!career.officer)return;const s=ST();const cs=curCase;
  if(s.step==='case'&&!cs){s.step='brief';saveCareer();}
  if(s.step==='duty'&&shift.stops-s.stopsAt>=3){s.step='debrief';saveCareer();SFX.blip('radio');toast('Radio: "Constable, that\'s enough for today. Report back to Sergeant Okafor."','good');}
  if(cs&&cs.story&&!cs.ended&&caseCanClose(cs)){
    if(cs.type==='leak'||cs.type==='finale'){if(!raidS&&!cine&&!cctv&&!modalOpen()&&!cs._closing){cs._closing=true;setTimeout(()=>endCase(cs,'closed'),900);}}
    else if(!cs._hint){cs._hint=true;toast(`Case solved. Close it from the MDT (Tab), then report back to ${NPCS[CH[cs.story].debrief].name}.`,'good');}
  }
  if(!cine&&!raidS&&!cctv)storyGPST();
}
function storyBegin(){
  const s=ST();if(!career.officer)return;
  if(s.step==='case')s.step='brief';
  if(s.step==='duty')s.stopsAt=shift.stops;
  saveCareer();
  if(s.step==='done'){toast(`Welcome back, ${OFF().first}. Port Eko still needs you. Press Tab for cases.`);}
  else if(s.ch===1&&s.step==='brief'&&!s.flags.started){s.flags.started=true;saveCareer();showChapter(1);}
  else toast(`Chapter ${s.ch}: ${CH[s.ch].t}. ${storyObj()?storyObj().b+'.':''}`);
  storyGPST();setInterval(storyTick,500);
}
function caseCanClose(cs){
  if(cs.type==='robbery'||cs.type==='finale')return cs.custody.includes(cs.C.id);
  if(cs.type==='leak')return !!cs.flags.confronted;
  return !!cs.flags.rescued;
}
function storyCaseEnded(cs,success){
  if(!cs.story)return;const s=ST();
  if(success){if(cs.story===5){s.step='done';saveCareer();setTimeout(showEnding,300);return;}
    if(cs.story===3)s.flags.victim=cs.victim.first;
    s.step='debrief';saveCareer();toast(`Report back to ${NPCS[CH[cs.story].debrief].name} at Division 9.`);}
  else{s.step='brief';saveCareer();toast(`The case slipped away. Talk to ${NPCS[CH[cs.story].brief].name} to try again.`,'bad');}
  gps=null;
}
function advanceChapter(){const s=ST();s.ch++;s.step='brief';saveCareer();gps=null;setTimeout(()=>showChapter(s.ch),300);}
function trustDelta(n,why){addRep(n);if(why)toast(`${why} Trust ${n>0?'+':''}${n}.`,n>0?'good':'bad');}
function takeBribe(amount,trust){const s=ST();s.taken++;s.cash+=amount;saveCareer();trustDelta(-trust,`You took ${naira(amount)}.`);SFX.blip('bad');}
function refuseBribe(trust){const s=ST();s.refused++;saveCareer();trustDelta(trust,'You refused the money. Word travels in Port Eko.');SFX.blip('good');}

// ---------- story conversations
const bisi=t=>({name:'Sgt Bisi Okafor',text:t}),coker=t=>({name:'CSP Adeyemi Coker',text:t});
function storyTalk(who){
  const s=ST();const v=iMeshes.get('story_'+who);if(!v)return;const npc=v.g;const first=OFF().first,last=OFF().last;
  if(s.ch===1&&s.step==='brief')talkTo(npc,[
    bisi(`So you be the new constable. ${first} ${last}, abi? Welcome to Division 9.`),
    bisi('Let me tell you the truth before anybody else does. This city no trust police. When people see this uniform, they hold their pocket.'),
    you('I came here to do the job properly, Sergeant.'),
    bisi(`Good talk. Today na traffic duty. Anybody wey pass ${LIMIT} km/h, jump red light, or the plate reader flag, stop them and check their papers. Three stops, then come back.`),
    bisi(`And ${first}... somebody go try settle you today. What you do for that moment, na who you be.`)],
    [{label:'Yes, Sergeant.'}],()=>{s.step='duty';s.stopsAt=shift.stops;s.flags.forceBribe=true;saveCareer();gps=null;toast('Get in your cruiser (F) and find a speeder.');});
  else if(s.ch===1&&s.step==='debrief')talkTo(npc,[
    bisi(s.taken>0?'I hear say you collect for that junction. Hmm. E dey start small, my dear. E always dey start small.':'One driver dey tell everybody for that junction say one officer no gree collect. Na so trust dey start.'),
    bisi('But hear me well. Bad things dey happen for this city. Kidnapping, bank robbery, fraud. And everybody dey whisper one name: Harmattan.'),
    bisi('Nobody don see am. Nobody fit prove anything. Go rest small. Tomorrow, the DPO wants to see you.')],
    [{label:'Continue'}],()=>advanceChapter());
  else if(s.ch===2&&s.step==='brief'){const cs=genRobbery();cs.story=2;talkTo(npc,[
    coker(`Constable ${last}. Stand at ease. This will not take long.`),
    coker(`${cs.bank} was robbed last night. Fourteen point eight million naira. Three men, one getaway car.`),
    coker('My senior officers are busy with a VIP visit, so the case is yours. Do not embarrass this division.'),
    coker('And Constable: every file, every lead, you bring it to me first. To me. Personally.')],
    [{label:'Yes, sir.'}],()=>{startCase(cs);s.step='case';saveCareer();});}
  else if(s.ch===2&&s.step==='debrief')talkTo(npc,[
    coker('Good work, Constable. The press is happy, the bank is happy. I am happy.'),
    coker('There is a gentleman waiting for you by the car park. A lawyer. Be polite to him.')],
    [{label:'Go and see him'}],()=>{lawyerScene();return true;});
  else if(s.ch===3&&s.step==='brief'){const cs=genKidnap();cs.story=3;talkTo(npc,[
    coker(`A child was taken outside ${cs.school}. ${cs.victim.first} ${cs.victim.last}, ${cs.victim.age} years old.`),
    coker('The family has already paid a ransom and the kidnappers are still holding the child. This is Harmattan\'s style.'),
    coker('Find the child. And Constable: raid plans come to my desk before anybody moves.')],
    [{label:'Yes, sir.'}],()=>{startCase(cs);s.step='case';saveCareer();});}
  else if(s.ch===3&&s.step==='debrief')talkTo(npc,[
    bisi(`${s.flags.victim||'The child'} is home. You did well, ${first}.`),
    bisi('But the SWAT commander told me something. The kidnappers were already packing to move, like somebody called them just before you arrived.'),
    bisi('Only people inside this station knew that raid was happening.'),
    you('Someone in Division 9 is selling us out.'),
    bisi('Somebody for this station dey sell us. I want you to find out who. Quietly. Trust nobody... except maybe me.')],
    [{label:'Continue'}],()=>advanceChapter());
  else if(s.ch===4&&s.step==='brief'){const cs=genLeak();cs.story=4;talkTo(npc,[
    bisi('Three people had access to that raid file: CSP Coker, Desk Sergeant Musa Danladi and Inspector Ifeoma Nwosu.'),
    bisi('Check the evidence-room log. Pull the car park camera from the night before the raid. Follow the money.'),
    bisi('When you are sure, bring the person to the interview room. If you accuse the wrong officer, this whole station go turn against you.')],
    [{label:'I\'ll find them.'}],()=>{startCase(cs);s.step='case';saveCareer();});}
  else if(s.ch===4&&s.step==='debrief')talkTo(npc,s.flags.cokerArrested?[
    bisi('CSP Adeyemi Coker. Twenty-two years in uniform. Hmm. This one pain me.'),
    bisi('He gave us everything. Harmattan runs it all from Wharf Warehouse 7. Real name: Felix Amadi.'),
    bisi(`People for the market dey talk about you, ${first}. Some of them want to help.`)]:[
    bisi('Coker dey walk free, and you dey count money. I no fit pretend say I no know.'),
    bisi('The address na Wharf Warehouse 7. Felix Amadi. Go finish am. But don\'t expect the market to talk to you.')],
    [{label:'Continue'}],()=>advanceChapter());
  else if(s.ch===5&&s.step==='brief'){const help=career.rep>=55&&!s.flags.tipped;const cs=genFinale();cs.story=5;cs.flags.informant=help;talkTo(npc,[
    bisi('This is it. Harmattan. Felix Amadi. SWAT is ready when you are.'),
    ...(help?[bisi('One market woman, Iya Risi, sent word. She says she knows how dem dey guard that warehouse. See her first.')]:[bisi('Nobody for the market wan talk to us. We go in blind.')]),
    you('Let\'s finish it.')],[{label:'Move out'}],()=>{startCase(cs);s.step='case';saveCareer();});}
}
function lawyerScene(){
  const s=ST();const d=LOC.station;
  const m=makePersonMesh({shirt:'#2a2a33',pants:'#2a2a33',skin:'#4a2e1c',hair:null});m.position.set(LOC.carpark.x+d.nx*2,.2,LOC.carpark.z+d.nz*2);scene.add(m);
  talkTo(m,[{name:'Barr. Chuks Ogidi',text:'Officer! Good evening. Barrister Chuks Ogidi. I represent the interests of... let us say, a businessman.'},
    {name:'Barr. Chuks Ogidi',text:'That plate number from the bank camera, eh? Cameras make mistakes. Evidence gets lost. It happens every day in this country.'},
    {name:'Barr. Chuks Ogidi',text:'Two million naira. Cash. Tonight. Nobody needs to know.'}],
    [{label:'No. Leave my station.'},{label:'Take the ₦2,000,000',cls:'red'}],ch=>{
      scene.remove(m);
      if(ch.label.startsWith('Take')){takeBribe(2000000,25);s.flags.lawyerBribe=true;toast('The next morning the ringleader walks out on bail. "Missing evidence."','bad');}
      else{refuseBribe(10);toast('Barrister Ogidi smiles. "Harmattan does not forget faces, Officer."');}
      setTimeout(advanceChapter,1200);
    });
}

// ---------- chapter 4: the leak
function genLeak(){
  const harm=harmPerson();const st=LOC.station;
  const mk=(first,last,role,height,look,acct)=>({id:'o_'+last,first,last,name:`${role} ${first} ${last}`,nick:'—',age:ri(36,56),height,hair:{n:'Low cut',h:'#141010'},skin:look.skin,shirt:look.shirt,tattoo:'None',
    car:{color:COLORS[ri(0,2)],model:pick(['Corolla','Camry']),plate:makePlate()},address:'Division 9 barracks',district:districtAt(st.x,st.z),job:role==='CSP'?'Divisional Police Officer':role==='Sgt'?'Desk sergeant':'Inspector, operations',prior:'None',acct,door:st,look});
  const C=mk('Adeyemi','Coker','CSP',188,NPCS.coker.look,'7710');const musa=mk('Musa','Danladi','Sgt',170,{shirt:'#1f2b45',skin:'#4a2e1c'},'3302');const ife=mk('Ifeoma','Nwosu','Insp.',174,{shirt:'#1f2b45',skin:'#6e4429',bun:true},'5521');
  const reveal=shuffle([0,1,2,4,5,6,7,8]).slice(0,5);const hpattern=harm.car.plate.split('').map((c,i)=>i===3||reveal.includes(i)?c:'?').join('');
  const cs=baseCase({type:'leak',title:'Inside Man',code:'IA',people:[C,musa,ife],db:[C,musa,ife],gang:[C.id],C,musa,ifeoma:ife,harm,hpattern,limit:600,fleeChance:{},scripts:{},
    roles:[[C,'DPO'],[musa,'Desk sergeant'],[ife,'Inspector']]});
  [C,musa,ife].forEach(p=>cs.named[p.id]=true);
  cs.sub=ok=>ok?(ST().flags.cokerArrested?'CSP Coker is in custody and the leak is closed.':'You know who the leak is. So does your bank account.'):'The leak is still out there.';
  cs.logs.push('Assigned by Sgt Okafor: find out who leaked the kidnapping raid plan.');
  return cs;
}
function leakEvidence(cs){return ['log','tallOfficer','payments'].filter(id=>cs.evidence.some(e=>e.id===id)).length;}
function leakLog(cs){
  if(!cs.done.log){if(!spend(cs,15))return;cs.done.log=true;}
  const addr=ST().flags.safeAddr||'the safehouse';
  const el=openModal(`<header><div><div class="eyebrow">Division 9 · evidence-room terminal</div><h2>Access log · raid file</h2></div><button class="x" aria-label="Close">✕</button></header>
    <div class="tablewrap"><table><thead><tr><th>Time</th><th>Action</th><th>Login</th></tr></thead><tbody>
    <tr><td class="mono">Mon 18:40</td><td class="memo">Raid file created: ${esc(addr)}</td><td>Const. ${esc(OFF().last)}</td></tr>
    <tr><td class="mono">Mon 22:10</td><td class="memo">Desk terminal sign-out, end of shift</td><td>Sgt M. Danladi</td></tr>
    <tr class="flag-hit"><td class="mono">Tue 02:05</td><td class="memo">Raid file opened from the DPO's office</td><td>CSP A. Coker</td></tr>
    <tr class="flag-hit"><td class="mono">Tue 02:09</td><td class="memo">Raid file printed, 4 pages</td><td>CSP A. Coker</td></tr>
    <tr><td class="mono">Tue 08:00</td><td class="memo">Logbook signed, morning shift</td><td>Sgt M. Danladi</td></tr>
    <tr><td class="mono">Tue 09:10</td><td class="memo">Raid file viewed during team briefing</td><td>Insp. I. Nwosu</td></tr></tbody></table></div>
    <p class="muted" style="margin-bottom:0">A login can be borrowed. You'll want more than this before you accuse anyone.</p>
    <div class="row end" style="margin-top:12px"><button class="btn" id="lgOk">Log it</button></div>`);
  $('.x',el).onclick=$('#lgOk',el).onclick=()=>{closeModal();if(addEv(cs,'log','Raid file opened at 02:05','The raid file was opened and printed at 02:05–02:09 with CSP Coker\'s login, the night before the raid.','Evidence log'))SFX.blip('good');};
}
function sitDown(look,lines,choices,cb){
  buildIRoom();const sus=makePersonMesh(look);sus.position.set(IR.x,0,IR.z+.98);sus.rotation.y=Math.PI;scene.add(sus);
  const off=makePersonMesh(playerLook());off.position.set(IR.x,0,IR.z-.98);scene.add(off);
  const L=intLights[0];L.position.set(IR.x,2.25,IR.z);L.intensity=3.2;L.distance=10;
  startCine({snap:true,pos:V3(IR.x-.62,1.5,IR.z-1.85),look:V3(IR.x,1.12,IR.z+.98),fov:42,
    update(){const D=DLG&&DLG.lines[DLG.i];pose(sus,D&&D.side!=='you'?['sit','table','talk']:['sit','crossed'],this.t);pose(off,['sit','table'],this.t);},
    cleanup(){scene.remove(sus,off);L.intensity=0;}});
  dialog(lines,choices,ch=>{const keep=cb&&cb(ch);if(!keep)endCine();});
}
function confrontPick(cs){
  const el=openModal(`<header><div><div class="eyebrow">Interview room 2 · internal affairs</div><h2>Who leaked the raid plan?</h2></div><button class="x" aria-label="Close">✕</button></header>
    <p class="muted" style="margin-top:0">Accusing the wrong officer costs you trust and time. Your evidence: ${cs.evidence.map(e=>esc(e.title)).join(' · ')||'none'}.</p>
    <div class="choices">${cs.roles.map(([p,r])=>`<button class="choice" data-o="${p.id}"><b>${esc(p.name)}</b><span>${esc(r)} · ${p.height} cm</span></button>`).join('')}</div>`);
  $('.x',el).onclick=closeModal;
  $$('[data-o]',el).forEach(b=>b.onclick=()=>{closeModal();const p=person(cs,b.dataset.o);
    if(p!==cs.C){spend(cs,45);sitDown(p.look,[you(`${p.name}, I believe you leaked the raid plan for ${ST().flags.safeAddr||'the safehouse'}.`),{name:p.name,text:pick(['Me? Twenty years at this desk and you come to accuse me? Bring your evidence or leave my sight.','Constable, check your facts. I was at home with my family that night, and my husband will swear to it.'])},{name:p.name,text:'This conversation will be reported to the DPO.'}],[{label:'Leave the room'}],()=>{trustDelta(-8,'Word spreads that you accused an innocent officer.');});return;}
    cokerConfront(cs);});
}
function cokerConfront(cs){
  const s=ST();const ev=id=>cs.evidence.some(e=>e.id===id);
  const lines=[you(`CSP Coker. The raid file was opened with your login at two in the morning, the night before the raid.`)];
  lines.push(coker('Constable, be very careful. You are accusing your own DPO.'));
  if(ev('tallOfficer'))lines.push(you(`The car park camera shows a tall senior officer taking an envelope from a black Highlander at 02:13.`));
  if(ev('payments'))lines.push(you('And Wharf Holdings paid three point five million naira into Coker & Sons Ventures at 02:31.'));
  lines.push(coker(`...Sit down, ${OFF().first}. Let us talk like adults.`),coker('Five million naira. Tonight. And I will recommend you for promotion by December. Harmattan does not need to know your name.'));
  sitDown(NPCS.coker.look,lines,[{label:'You\'re under arrest, sir.',cls:'red'},{label:'Take the ₦5,000,000'}],ch=>{
    if(ch.label.startsWith('Take')){takeBribe(5000000,35);s.flags.tipped=true;
      dialog([coker('Good. Sensible. The address is Wharf Warehouse 7, by the port. Go and collect your glory.'),coker('I will make sure... everybody stays safe.')],[{label:'Leave the room'}],()=>{cs.flags.confronted=true;clog(cs,'You took CSP Coker\'s money. He gave you the warehouse address.');endCine();});}
    else{refuseBribe(12);s.flags.cokerArrested=true;cs.custody.push(cs.C.id);career.arrests++;saveCareer();gainXP(60);SFX.blip('cuff');
      dialog([coker('...You have no idea what you have done, Constable.'),coker('Wharf Warehouse 7. He keeps everything there: the money, the guns, the ledgers. Felix Amadi. They call him Harmattan.'),coker('Now you have killed both of us.')],[{label:'Book him'}],()=>{cs.flags.confronted=true;clog(cs,'CSP Adeyemi Coker arrested. He named Wharf Warehouse 7.');addEv(cs,'warehouse','Harmattan: Wharf Warehouse 7','CSP Coker confessed. Felix "Harmattan" Amadi runs the syndicate from Wharf Warehouse 7.','Confession');endCine();});}
    return true;
  });
}

// ---------- chapter 5: Harmattan
function harmPerson(){
  const s=ST();if(!s.flags.harmPlate)s.flags.harmPlate=makePlate();saveCareer();
  const w=LOC.motels['Wharf Warehouse 7'];
  return {id:'harm',first:'Felix',last:'Amadi',name:'Felix Amadi',nick:'Harmattan',age:51,height:183,hair:{n:'Bald',h:null},skin:'#3d2516',shirt:'#e8e2d4',tattoo:'Scar on left cheek',
    car:{color:COLORS[0],model:'Highlander',plate:s.flags.harmPlate},address:'Wharf Warehouse 7',district:w.district,job:'Importer, Wharf Holdings Ltd',prior:'None (never convicted)',acct:'0007',door:w};
}
function genFinale(){
  const C=harmPerson();const s=ST();
  const cs=baseCase({type:'finale',title:'Harmattan',code:'OP-H',people:[C],db:[C],gang:[C.id],C,limit:420,fleeChance:{},scripts:{},roles:[[C,'Syndicate boss']],
    hide:{place:'Wharf Warehouse 7',district:C.district}});
  cs.named[C.id]=true;cs.flags.hideout=true;cs.flags.tipped=!!s.flags.tipped;
  cs.lootText='Rifles, ₦40 million in cash and the syndicate ledgers recovered';cs.lootDetail='Rifles, ₦40 million in cash and ledgers naming Harmattan\'s partners were in a container behind the warehouse.';
  cs.sub=ok=>ok?'Felix "Harmattan" Amadi is in custody. The syndicate is finished.':'Harmattan slipped out of Port Eko.';
  cs.logs.push(s.flags.tipped?'Operation Harmattan. Someone may have warned them.':'Operation Harmattan. SWAT is on standby.');
  return cs;
}
function informantTalk(cs){
  const v=iMeshes.get('informant');if(!v)return;
  talkTo(v.g,[{name:'Iya Risi',text:`Ah, na you be the officer wey no dey collect? My pikin, everybody for this market don hear your name.`},
    {name:'Iya Risi',text:'Those Harmattan boys dey watch the front of Warehouse 7 day and night. But the back gate, by the containers? Na there their own boys dey use. E no dey locked.'},
    {name:'Iya Risi',text:'Go well. And come back alive, you hear?'}],[{label:'Thank you, ma.'}],()=>{cs.done.informant=true;cs.flags.backIntel=true;addEv(cs,'backgate','Back gate is unlocked','Iya Risi says the back gate by the containers is never locked. They watch the front.','Informant');SFX.blip('good');});
}
function showEnding(){
  $("#toasts").innerHTML="";const s=ST();const t=career.rep;let title,body;
  if(t>=70&&s.taken===0){title='The People\'s Officer';body=`Harmattan is in a cell, and his ledgers are bringing down the people who protected him. At the commendation parade, Sergeant Bisi Okafor pins the medal on you herself. Market women wave when your cruiser passes. In Port Eko, that is rarer than any medal.`;}
  else if(t>=45){title='A Good Officer';body=`The syndicate is finished. You made mistakes and some compromises, but Port Eko noticed the constable who kept going when it would have been easier to stop. Bisi says you'll make Inspector one day. She means it.`;}
  else{title='Part of the System';body=`Harmattan is in custody and the newspapers love you. You also have ${naira(s.cash)} you can't explain. Bisi stops returning your calls. Somewhere in Port Eko, a new name is already being whispered.`;}
  logEntry(`Story complete: "${title}". Trust ${t}, ${s.refused} bribes refused, ${s.taken} taken.`);
  const el=openModal(`<div class="report"><div class="eyebrow">Eko Nights · ending</div><h1>${esc(title)}</h1><p class="muted" style="max-width:60ch">${esc(body)}</p>
    <dl class="stats" style="grid-template-columns:repeat(4,1fr);margin:16px 0"><div><dt>Public trust</dt><dd>${t}</dd></div><div><dt>Bribes refused</dt><dd>${s.refused}</dd></div><div><dt>Bribes taken</dt><dd>${s.taken}</dd></div><div><dt>Money taken</dt><dd>${naira(s.cash)}</dd></div></dl>
    <div class="row end"><button class="btn" id="eOk">Keep patrolling Port Eko</button></div></div>`,{dismiss:false});
  $('#eOk',el).onclick=closeModal;
}

// ---------- traffic stops: Naira fines, km/h, seatbelts, and drivers who try to "settle" you
const EXC_NG={fast:['Oga officer, abeg, I dey rush go hospital!','My brother, na small speed now. Everybody dey go like this.','I no see any sign, I swear to God.','Officer, my madam dey wait for me for airport.','Abeg no vex, I dey late for work. My oga go sack me.'],
  slow:['Officer, wetin I do? I dey drive normal.','I was within the limit, sir.','Good afternoon, officer. Is there a problem?'],
  fled:['I panic, officer! I panic!','I no see your light at all!','...I want my lawyer.'],red:['The light was amber, I swear!','Officer, the light just change now now.']};
const BRIBE_LINES=['Oga, make we settle am. {a} for your fuel. Make I dey go.','Officer, no vex. Take {a}, buy pure water. We fit understand ourselves.','Abeg, see {a} here. Nobody go know.'];
const TIERS_NG=[['none','No speeding citation','warning'],['t1','1–15 km/h over','₦5,000'],['t2','16–30 km/h over','₦10,000'],['t3','31–45 km/h over','₦20,000'],['t4','46+ km/h over','₦50,000 + court']];
function stopScene(s){
  const fled=!!s.fled;const d=genDriver(s,fled);if(d.belt===undefined)d.belt=Math.random()>.22;
  const f=fwdOf(s.h),L={x:f.z,z:-f.x};
  pl.x=s.rx+L.x*1.5-f.x*.1;pl.z=s.rz+L.z*1.5-f.z*.1;pl.h=Math.atan2(-L.x,-L.z);pl.mesh.position.set(pl.x,.2,pl.z);pl.mesh.rotation.y=pl.h;pl.mesh.visible=true;
  const P=s.mesh.userData.P;const tallCab=P.roof>1.6;
  if(!s.drv){s.drv=makePersonMesh(lookOf(d));s.drv.position.set(.4,-.14+(tallCab?.2:0),-.15);s.mesh.userData.body.add(s.drv);if(s.mesh.userData.sil)s.mesh.userData.sil.visible=false;}
  const head=V3(s.rx+L.x*.4,1.05+(tallCab?.2:0),s.rz+L.z*.4);
  startCine({fov:40,pos:V3(pl.x+L.x*.55+f.x*1.25,1.78,pl.z+L.z*.55+f.z*1.25),look:head,
    update(){const j=s.drv.userData.j;pose(s.drv,fled?['sit','handsUp']:['sit','drive']);j.head.rotation.y=.9+Math.sin(this.t*1.4)*.12;pose(pl.mesh,'idle',this.t);}});
  const over=s.clocked-LIMIT;const st=ST();
  const reason=over>0||s.seenViol||alprFlags(s).length>0;
  const excuse=fled?pick(EXC_NG.fled):s.seenViol&&over<=0?pick(EXC_NG.red):pick(over>0?EXC_NG.fast:EXC_NG.slow);
  const lines=[you(fled?'Hands where I can see them! Engine off, keys on the dashboard.':pick(['Good day. Licence and vehicle particulars, please.','Do you know how fast you were going?','Officer with Division 9. Switch off the engine, please.'])),{name:d.name,text:excuse}];
  if(!d.belt&&!fled)lines.push(you('I can also see you\'re not wearing your seatbelt.'));
  const offer=!fled&&reason&&(st.flags.forceBribe||Math.random()<.4);
  const finish=arrested=>{
    if(s.drv){s.drv.parent.remove(s.drv);s.drv=null;}
    if(fled||arrested){s.mode='parked';if(chase&&chase.car===s)endChase();suspect=null;setLights(false);if(s.mesh.userData.sil)s.mesh.userData.sil.visible=false;}
    else{if(s.mesh.userData.sil)s.mesh.userData.sil.visible=true;s.mode='drive';suspect=null;setLights(false);const g=fwdOf(s.h);if((s.wp.x-s.x)*g.x+(s.wp.z-s.z)*g.z<0)advance(s);}
    endCine();
  };
  const paperwork=()=>{trafficStop(s,fled,finish);return true;};
  if(offer){
    const amt=st.flags.forceBribe?5000:pick([2000,5000,5000,10000,20000]);st.flags.forceBribe=false;saveCareer();
    lines.push({name:d.name,text:pick(BRIBE_LINES).replace('{a}',naira(amt))});
    dialog(lines,[{label:'Put that away. I\'m writing you up.'},{label:`Take the ${naira(amt)}`,cls:'red'}],ch=>{
      if(ch.label.startsWith('Take')){takeBribe(amt,6);shift.stops++;finish(false);}
      else{refuseBribe(3);paperwork();}
    });
  }else dialog(lines,[{label:fled?'Book the driver':'Write it up'}],paperwork);
}
function trafficStop(car,fled,done){
  const d=genDriver(car,fled);if(d.belt===undefined)d.belt=Math.random()>.22;
  const colName=(COLORS.find(c=>c.h===car.color)||{n:''}).n;
  const over=car.clocked-LIMIT;
  const correct=over<=0?'none':over<=15?'t1':over<=30?'t2':over<=45?'t3':'t4';
  const ran=!!(car.violation&&car.seenViol);
  const el=openModal(`
    <header><div class="driver">${avatar(d,56)}<div><div class="eyebrow">${fled?'Felony stop':'Citation book · EMP'}</div><h2>${esc(d.name)}</h2><div class="muted" style="font-size:13px">${esc(colName+' '+car.model)} · <span class="mono">${car.plate}</span></div></div></div></header>
    <div class="slip"><span>RADAR ${car.clocked} KM/H</span><span>LIMIT ${LIMIT}</span><span>${over>0?'+'+over+' OVER':'AT/UNDER LIMIT'}</span>${ran?'<span>RAN RED LIGHT</span>':''}${fled?'<span>FLED</span>':''}${!d.belt&&!fled?'<span>NO SEATBELT</span>':''}</div>
    <div class="checks">
      <button class="btn ghost sm" id="chkLic">Check licence</button><output id="licOut" class="muted">Not checked</output>
      <button class="btn ghost sm" id="chkPlate">Run plate</button><output id="plateOut" class="muted">Not checked</output>
    </div>
    <form id="stopForm">
      <fieldset><legend>Speeding</legend>
        ${TIERS_NG.map(([v,l,f])=>`<label class="opt"><input type="radio" name="tier" value="${v}" id="tier-${v}"><span>${l}</span><span class="fine">${f}</span></label>`).join('')}
      </fieldset>
      <fieldset><legend>Other offences</legend>
        <label class="opt"><input type="checkbox" id="vRed"><span>Traffic light violation</span><span class="fine">₦10,000</span></label>
        <label class="opt"><input type="checkbox" id="vBelt"><span>Seatbelt violation</span><span class="fine">₦2,000</span></label>
        <label class="opt"><input type="checkbox" id="vLic"><span>No valid driver's licence</span><span class="fine">₦10,000</span></label>
        <label class="opt"><input type="checkbox" id="vReg"><span>Expired vehicle particulars</span><span class="fine">₦5,000</span></label>
        <label class="opt"><input type="checkbox" id="vEvade"><span>Evading a police officer</span><span class="fine">felony</span></label>
        <label class="opt"><input type="checkbox" id="vArrest"><span>Take the driver into custody</span><span class="fine">arrest</span></label>
      </fieldset>
      <div id="stopRes"></div>
      <div class="row end"><button class="btn" type="submit" id="stopSubmit">Issue citation</button></div>
    </form>`,{dismiss:false,side:true});
  $('#chkLic',el).onclick=()=>{SFX.blip('click');const o=$('#licOut',el);o.textContent=`Licence ${d.lic.toUpperCase()} · age ${d.age}`;o.style.color=d.lic==='Valid'?'var(--ok)':'var(--red)';};
  $('#chkPlate',el).onclick=()=>{SFX.blip('radio');const o=$('#plateOut',el);const bad=[];if(d.reg!=='Valid')bad.push('PARTICULARS EXPIRED');if(d.stolen)bad.push('STOLEN');if(d.warrant)bad.push('WANTED');o.textContent=bad.length?bad.join(' · '):'VALID · NO FLAGS';o.style.color=bad.length?'var(--red)':'var(--ok)';};
  $('#stopForm',el).onsubmit=e=>{
    e.preventDefault();
    const tierEl=el.querySelector('input[name="tier"]:checked');
    if(!tierEl){$('#stopRes',el).innerHTML='<p class="muted">Pick a speeding option first. Choose "No speeding citation" if they weren\'t over the limit.</p>';return;}
    const tier=tierEl.value;const res=[];let xp=0,rep=0;
    const lbl=v=>TIERS_NG.find(t=>t[0]===v)[1];
    const cause=over>0||ran||fled||alprFlags(car).length>0;
    if(!cause){rep-=3;res.push(['bad','There was no reason to stop this car. In Port Eko, that looks like extortion. A complaint has been filed.']);}
    if(tier===correct){xp+=20;rep+=1;res.push(['good',tier==='none'?'Correct: no speeding ticket for a driver within the limit.':`Correct: ${over} km/h over is "${lbl(correct)}".`]);}
    else if(correct==='none'){xp-=10;rep-=4;res.push(['bad','You wrote a speeding ticket for a driver within the limit.']);}
    else{xp-=8;res.push(['bad',`Wrong bracket. ${over} km/h over is "${lbl(correct)}".`]);}
    const grade=(checked,actual,goodT,falseT,missT,pts)=>{
      if(checked&&actual){xp+=pts;res.push(['good',goodT]);}
      else if(checked&&!actual){xp-=10;rep-=3;res.push(['bad',falseT]);}
      else if(!checked&&actual){xp-=5;res.push(['bad',missT]);}
    };
    const mustArrest=fled||d.warrant||d.stolen;
    grade($('#vRed',el).checked,ran,'Traffic light violation cited.','You never saw them run a light.','Missed it: you watched them run a red light.',15);
    grade($('#vBelt',el).checked,!d.belt&&!fled,'Seatbelt violation cited.','They were wearing their seatbelt.','Missed it: no seatbelt.',5);
    grade($('#vLic',el).checked,d.lic!=='Valid','Licence offence cited.','Their licence was valid. That citation will be thrown out.',`Missed it: the licence was ${lower(d.lic)}. Always check papers.`,10);
    grade($('#vReg',el).checked,d.reg!=='Valid','Expired particulars cited.','The vehicle particulars were valid.','Missed the expired vehicle particulars. Run every plate.',10);
    grade($('#vEvade',el).checked,fled,'Evading charge filed.','They never ran from you.','They fled from you. That\'s an evading charge.',15);
    grade($('#vArrest',el).checked,mustArrest,`Driver arrested${d.warrant?' on an outstanding warrant':d.stolen?' for a stolen vehicle':' for evading'}. A patrol van is taking them in.`,'No grounds for an arrest. The driver was released and complained.',`You let them go, but ${d.warrant?'they were wanted':d.stolen?'the car was stolen':'they fled from police'}.`,30);
    const cited=tier!=='none'||['vRed','vBelt','vLic','vReg'].some(k=>$('#'+k,el).checked);
    shift.stops++;
    if(cited){shift.tickets++;career.tickets++;}else{shift.warnings++;career.warnings++;}
    const arrested=$('#vArrest',el).checked&&mustArrest;
    if(arrested){shift.arrests++;career.arrests++;SFX.blip('cuff');}
    shift.xp+=xp;gainXP(xp);if(rep)addRep(rep);SFX.blip(xp>=0?'good':'bad');
    $('#stopRes',el).innerHTML=`<ul class="results">${res.map(([k,t])=>`<li class="${k}">${esc(t)}</li>`).join('')}</ul><p class="mono" style="color:${xp>=0?'var(--ok)':'var(--red)'}">${xp>=0?'+':''}${xp} XP${rep?` · trust ${rep>0?'+':''}${rep}`:''}</p>`;
    $$('input,#chkLic,#chkPlate',el).forEach(i=>i.disabled=true);
    const b=$('#stopSubmit',el);b.textContent='Back on patrol';b.type='button';
    b.onclick=()=>{closeModal();done(arrested);};
    $('#stopRes',el).scrollIntoView({block:'nearest'});
  };
}

// ---------- witnesses (Nigerian English and Pidgin)
function witnessData(cs,id){
  const {A}=cs;
  if(id==='w1')return {who:'Mr. Sunday Ekpo · bank security',lines:['Officer, they were three. All of them cover their face. Before I fit reach my baton, they don put me for ground.',`The tall one, e too tall. Six-four like that. When he grab the bag, I see the mark on him: ${lower(cs.tat)}.`],after:()=>addEv(cs,'tattoo',`Tall robber's mark: ${cs.tat}`,'Seen by the bank security man on the tallest robber, about six-four.','Witness')};
  if(id==='w2')return {who:'Mama Nkechi · akara seller',lines:['I dey fry my akara when the alarm start to ring. Three of them run comot with bags.',`Dem enter one ${lower(A.car.color.n)} ${A.car.model} and zoom off like say dem dey fly. I no see the plate number, my pikin. Sorry.`],after:()=>addEv(cs,'vehicle',`Getaway: ${A.car.color.n} ${A.car.model}`,'Mama Nkechi saw the robbers drive off. No plate.','Witness')};
  if(id==='w3')return {who:'Mrs. Funmi Adeyinka · branch manager',lines:['The silent alarm never went off. It has a staff override with a delay code.','Only tellers and managers know that code. Somebody inside this branch helped them. I would stake my job on it.'],after:()=>{cs.flags.insider=true;addEv(cs,'insider','Alarm disabled from inside','The silent alarm was switched off with a staff code. An employee is likely involved.','Witness');}};
  if(id==='parent')return {who:`${cs.parent.name} · parent`,lines:[`${cs.victim.first} always comes out of this gate by two o'clock. Today, nothing.`,'Then my phone rang. A man with a strange voice said fifty million naira, or I would never see my child again. I paid it. The bank has everything. Officer, please. Bring my child back.'],after:()=>{cs.flags.parent=true;addEv(cs,'ransom','Ransom: ₦50,000,000 paid','Paid by bank transfer to an account the kidnappers named. The call came from a mobile phone. Trace and bank leads are now on the MDT.','Witness');}};
  if(id==='guard')return {who:'Mallam Garba · school gateman',lines:[`One ${lower(A.car.color.n)} ${A.car.model} park for that corner, engine dey run. I wan tell am make e move.`,'One man wear red hoodie waka come meet the pikin, talk small, and dem enter the motor together. E fast well well.'],after:()=>addEv(cs,'vehicle',`Kidnap car: ${A.car.color.n} ${A.car.model}`,'The gateman saw a man in a red hoodie walk the child to the car.','Witness')};
}
function witnessTalk(cs,id){
  const v=iMeshes.get(id);if(!v)return;const low=career.rep<30;if(!spend(cs,low?25:10))return;
  const W2=witnessData(cs,id);
  const lines=[you(pick(['Good afternoon. I\'m with Division 9. Can you tell me what you saw?','Please, take your time. Start from the beginning.']))];
  if(low)lines.push({name:W2.who,text:'Hmm. Police. Una go take my statement, then nothing go happen. Like always.'},you('This time will be different. Please.'));
  talkTo(v.g,[...lines,...W2.lines.map(t=>({name:W2.who,text:t}))],[{label:'Add to the case file'}],()=>{cs.done[id]=true;W2.after();SFX.blip('good');toast('Statement added to the case file.','good');});
}

// ---------- leads for every case type
function leads(cs){
  const L=[];const {C}=cs;const inC=id=>cs.custody.includes(id);
  const at=(p,label)=>({x:p.x,z:p.z,label});
  if(prisoner)L.push(prisonerLead(at));
  cs.custody.forEach(id=>{if(!cs.cracked[id]&&!cs.lawyered[id]&&cs.scripts&&cs.scripts[id]){const p=person(cs,id);L.push({t:`Interrogate ${p.name}`,d:'Interview room at the station entrance.',c:20,at:at(LOC.interview,'Interview room'),hot:true});}});
  if(cs.type==='robbery'){
    if(cs.flags.hideout&&!inC(C.id))L.push({t:`Raid the ${cs.hide.place}`,d:`Arrest "${C.nick}" in ${cs.hide.district}.`,at:at(LOC.motels[cs.hide.place],cs.hide.place),hot:true});
    L.push({t:'Review the bank cameras',d:`Security terminal outside ${cs.bank}.`,c:cs.done.cctv?0:15,at:at(LOC.bankCam,cs.bank+' cameras')});
    if(!cs.done.w1)L.push({t:'Talk to the bank security man',d:'Mr. Sunday Ekpo is by the bank door.',c:10,at:at(LOC.bankGuard,'Bank security')});
    if(!cs.done.w3)L.push({t:'Talk to the branch manager',d:'Mrs. Funmi Adeyinka is at the bank entrance.',c:10,at:at(LOC.bankManager,'Branch manager')});
    if(!cs.done.w2)L.push({t:'Talk to the akara seller',d:'Mama Nkechi fries akara across the road from the bank.',c:10,at:at(LOC.bankVendor,'Akara stand')});
    if(!cs.done.bank)L.push({t:'Review flagged cash deposits',d:cs.flags.insider?'The alarm was disabled from inside. Someone on staff may have been paid.':'The bank\'s compliance unit sent this morning\'s flagged cash deposits.',c:cs.done.bankOpen?0:30,run:()=>openBank(cs),onRun:()=>{cs.done.bankOpen=true;}});
    if(cs.flags.bossKnown&&!cs.flags.hideout&&!inC(C.id))L.push({t:`Monitor ${C.name}'s ATM card`,d:'The bank alerts us the next time the card is used.',c:90,run:()=>monitorCard(cs)});
  }else if(cs.type==='kidnap'){
    if(cs.flags.safehouse&&!cs.flags.rescued)L.push({t:`Raid ${cs.safe.address}`,d:`Bring ${cs.victim.first} home.`,at:at(cs.safe.door,'Safehouse'),hot:true});
    L.push({t:'Check the school gate camera',d:`Terminal at the gate of ${cs.school}. Includes a traffic camera feed.`,c:cs.done.cctv?0:15,at:at(LOC.schoolCam,cs.school)});
    if(!cs.done.parent)L.push({t:`Talk to ${cs.parent.name}`,d:`${cs.victim.first}'s parent is waiting at the school gate.`,c:10,at:at(LOC.schoolParent,cs.parent.name)});
    if(!cs.done.guard)L.push({t:'Talk to the school gateman',d:'Mallam Garba was at the gate at closing time.',c:10,at:at(LOC.schoolGuard,'Gateman')});
    if(cs.flags.parent&&!cs.done.trace)L.push({t:'Trace the ransom call',d:'Signal readings from three cell towers.',c:20,run:()=>openTrace(cs)});
    if(cs.flags.parent&&!cs.done.bank)L.push({t:'Follow the ransom money',d:'The bank froze the receiving account.',c:cs.done.bankOpen?0:30,run:()=>openBank(cs),onRun:()=>{cs.done.bankOpen=true;}});
    if(cs.flags.district&&!cs.flags.safehouse)L.push({t:`Canvass ${cs.safe.district}`,d:`A neighbour on ${cs.neighbor.address.replace(/^\d+ /,'')} called in about a ${cs.A.car.model}.`,at:at(cs.neighbor,'Neighbour')});
  }else if(cs.type==='leak'){
    if(!cs.done.log)L.push({t:'Check the evidence-room log',d:'The terminal records who opened the raid file, and when.',c:15,at:at(LOC.logTerm,'Evidence-room log')});
    L.push({t:'Review the car park camera',d:'The night before the kidnapping raid.',c:cs.done.cctv?0:15,at:at(LOC.carpark,'Car park camera')});
    if(!cs.done.bank)L.push({t:'Trace the payments',d:'Financial intelligence sent transfers out of a company linked to the wharf.',c:cs.done.bankOpen?0:30,run:()=>openBank(cs),onRun:()=>{cs.done.bankOpen=true;}});
    if(leakEvidence(cs)>=2&&!cs.flags.confronted)L.push({t:'Confront the leak',d:'Interview room. Choose who to confront.',at:at(LOC.interview,'Interview room'),hot:true});
  }else if(cs.type==='finale'){
    if(cs.flags.informant&&!cs.done.informant)L.push({t:'Meet the market informant',d:'Iya Risi says she knows how they guard the warehouse.',at:at(LOC.informant,'Iya Risi')});
    if(!inC(C.id))L.push({t:'Raid Wharf Warehouse 7',d:cs.flags.tipped?'Someone may have warned them you\'re coming.':'Take down Harmattan.',at:at(LOC.motels['Wharf Warehouse 7'],'Wharf Warehouse 7'),hot:true});
  }
  L.push({t:cs.type==='leak'?'Check the duty roster':'Search the records database',d:cs.type==='leak'?'Heights and posts of every officer with access to the raid file.':'Match clues to a person, set GPS to their home and arrest them there.',db:true});
  return L;
}

// ---------- bank records in Naira
function bankRows(cs){
  const fake=()=>'****'+ri(1000,9999);
  if(cs.type==='robbery'){const b='****'+cs.B.acct,br=shuffle(DISTRICTS.slice());return [
    ['07:12',fake(),'Salary credit',185000,'Salary · Lekki Logistics Ltd','normal','Monthly salary. Same amount every month.'],
    ['07:30',fake(),'Transfer in',12000000,'Land purchase · escrow release','normal','The land documents and escrow letter check out.'],
    ['07:55',fake(),'Cash deposit',7500000,'Business takings · Iya Basira Foods','normal','Above ₦5 million, so the bank already filed a cash report. A busy restaurant banking its weekly sales.'],
    ['08:02',b,'Cash deposit',4950000,`${br[0]} branch · counter`,'hit'],
    ['08:20',fake(),'POS purchase',640000,'Electronics store · TV and inverter','normal','A big purchase, but the card owner shops like this regularly.'],
    ['08:41',b,'Cash deposit',4900000,`${br[1]} branch · counter`,'hit'],
    ['08:50',fake(),'Cheque deposit',2000000,'Insurance claim · Coastline Assurance','normal','Insurance payout for a car accident. Verified.'],
    ['09:05',fake(),'ATM withdrawal',40000,`${br[2]} · ATM 4`,'normal','Ordinary cash withdrawal.'],
    ['09:15',b,'Cash deposit',4980000,`${br[3]} branch · counter`,'hit'],
    ['09:22',fake(),'Transfer',500000,'To own savings account','normal','Moving money between their own accounts.']];}
  if(cs.type==='kidnap'){const m='****'+ri(1000,9999),b='****'+cs.B.acct;return [
    ['15:41',m,'Transfer in',50000000,`From ${cs.parent.name}`,'normal','That\'s the ransom itself. We already know about it.'],
    ['15:58',m,'Transfer out',20000000,'P2P crypto merchant · USDT','normal','The crypto merchant\'s account was opened with a fake BVN. A dead end.'],
    ['16:04',m,'Transfer out',15000000,'Lakeside Ventures Ltd','normal','A shell company with no staff and a virtual office. A dead end for now.'],
    ['16:10',m,'Transfer out',8000000,`Personal account ${b} · ref "rent"`,'hit'],
    ['16:22',m,'POS withdrawal',100000,'POS agent · Oja Market','normal','The POS agent remembers a man in a face cap. Not identifiable.'],
    ['16:31',m,'Card purchase',45000,`Fuel · Wharf Road filling station, ${cs.safe.district}`,'side'],
    ['16:40',m,'POS withdrawal',100000,'POS agent · Ebute','normal','Face covered again. Not identifiable.']];}
  const w='****'+ri(1000,9999);return [
    ['Mon 10:02',w,'Transfer out',1200000,'Clearing agent · container fees','normal','A normal port clearing fee.'],
    ['Mon 16:40',w,'Transfer out',250000,`${cs.musa.name} · ref "school fees refund"`,'normal','The school confirms it refunded a cancelled deposit through this company\'s account. Odd, but documented.'],
    ['Tue 02:31',w,'Transfer out',3500000,'Coker & Sons Ventures · ref "consultancy"','hit'],
    ['Tue 11:15',w,'Transfer out',600000,'Bureau de change · USD purchase','normal','A currency purchase for an import. Documented.'],
    ['Wed 09:50',w,'Transfer out',900000,`${cs.ifeoma.name} · ref "car"`,'normal','Inspector Nwosu sold her old car to the company\'s driver. The sale agreement checks out.']];
}
function openBank(cs){
  const rows=cs.bankRows||(cs.bankRows=bankRows(cs));cs.flagged=cs.flagged||{};
  const T={robbery:['Bank compliance unit','Flagged cash deposits · this morning','The robbers took ₦14,830,000 in cash. Flag the transaction that looks like stolen money going back into the system.','Banks must report cash deposits above ₦5 million for individuals. Criminals split cash into deposits just under that line, at different branches.'],
    kidnap:['Financial intelligence unit','Ransom account activity','This account received the ransom. Flag the transaction that can lead you to a real person.','Kidnappers move ransom through dead-end accounts and crypto, but somebody always pays themselves. Look for money going into a personal account.'],
    leak:['Financial intelligence unit','Wharf Holdings Ltd · outgoing transfers','Wharf Holdings is the company behind Harmattan\'s port business. Flag the payment that looks like someone in Division 9 is being paid.','Bribes are rarely paid to the officer directly. Look for a company with an officer behind it, paid in the middle of the night.']}[cs.type];
  const el=openModal(`<header><div><div class="eyebrow">${T[0]}</div><h2>${T[1]}</h2></div><button class="x" aria-label="Close">✕</button></header>
    <p class="muted" style="margin-top:0">${esc(T[2])} Each wrong flag costs 15 minutes of checking.</p>
    <div class="tablewrap"><table><thead><tr><th>Time</th><th>Account</th><th>Type</th><th style="text-align:right">Amount</th><th>Details</th><th></th></tr></thead><tbody>
    ${rows.map((r,i)=>`<tr class="${cs.flagged[i]?(r[5]==='normal'?'flag-miss':'flag-hit'):''}"><td class="mono">${r[0]}</td><td class="mono">${r[1]}</td><td>${r[2]}</td><td class="amt">${naira(r[3])}</td><td class="memo">${esc(r[4])}</td><td><button class="btn ghost sm" data-r="${i}" ${cs.flagged[i]||cs.done.bank?'disabled':''}>Flag</button></td></tr>`).join('')}
    </tbody></table></div>
    <div class="cmsg" id="bMsg" style="margin-top:10px">Read each row and flag the one that doesn't fit.</div>
    <div class="row end" style="margin-top:10px"><button class="btn ghost" id="bHint">Ask an analyst (15 min)</button><button class="btn" id="bDone">Done</button></div>`,{wide:true,tablet:true});
  const msg=(h,k)=>{const m=$('#bMsg',el);m.innerHTML=h;m.className='cmsg '+(k||'');};
  $$('[data-r]',el).forEach(b=>b.onclick=()=>{
    const i=+b.dataset.r,r=rows[i];cs.flagged[i]=true;
    if(r[5]==='hit'){
      cs.done.bank=true;
      if(cs.type==='robbery'){cs.named[cs.B.id]=true;addEv(cs,'deposits','Structured deposits',`Three cash deposits of just under ₦5 million at three branches into ${r[1]}. Holder: ${cs.B.name}, a teller at ${cs.bank}. Lives at ${cs.B.address}.`,'Bank');
        msg(`<b>Match.</b> Three deposits just under ₦5 million into ${r[1]} at different branches, the morning after the robbery. Account holder: <b>${esc(cs.B.name)}</b>, a teller at ${esc(cs.bank)}, ${esc(cs.B.address)}.`,'hit');}
      else if(cs.type==='kidnap'){cs.named[cs.B.id]=true;addEv(cs,'transfer','₦8m to a personal account',`Ransom money moved to ${r[1]}, held by ${cs.B.name} (${cs.B.address}, ${cs.B.district}).`,'Bank');
        msg(`<b>Match.</b> ₦8,000,000 went into a personal account owned by <b>${esc(cs.B.name)}</b>, ${esc(cs.B.address)}, ${esc(cs.B.district)}.`,'hit');}
      else{addEv(cs,'payments','₦3.5m to Coker & Sons Ventures','Wharf Holdings paid ₦3,500,000 at 02:31 on the night before the raid to Coker & Sons Ventures. Company registry: sole director Adeyemi Coker.','Bank');
        msg('<b>Match.</b> ₦3,500,000 at 02:31 to <b>Coker & Sons Ventures</b>. The company registry lists one director: Adeyemi Coker.','hit');}
      b.closest('tr').className='flag-hit';$$('[data-r]',el).forEach(x=>x.disabled=true);SFX.blip('good');
    }else if(r[5]==='side'){
      addEv(cs,'fuel',`Ransom card used in ${cs.safe.district}`,`A fuel purchase on the ransom account's card in ${cs.safe.district}. The crew may be based nearby.`,'Bank');
      cs.flags.district=true;
      msg(`<b>Useful.</b> The card linked to this account bought fuel in ${esc(cs.safe.district)}. The crew may be based nearby. Keep looking for a real name.`,'hit');b.closest('tr').className='flag-hit';b.disabled=true;
    }else{
      if(!spend(cs,15))return;
      msg(`<b>Checked out.</b> ${esc(r[6])} (−15 min)`,'miss');b.closest('tr').className='flag-miss';b.disabled=true;
    }
  });
  $('#bHint',el).onclick=()=>{if(!spend(cs,15))return;msg('<b>Analyst:</b> '+esc(T[3]),'');$('#bHint',el).disabled=true;};
  $('.x',el).onclick=$('#bDone',el).onclick=closeModal;
}

// ---------- CCTV replays (adds the station car park for chapter 4)
function replayDef(cs){
  const A=cs.A;
  if(cs.type==='robbery'){
    const d=LOC.bank;
    return {d,min:21*60+40,stamp:'21:4',stampBase:40,dur:22,
      cams:[{name:'CAM 01 · Bank entrance',pos:[3.6,-1.1,4.4],look:[-1.2,7,1],sharp:[0,1.6,4.2],lamp:[0,.4,3.5]},
            {name:'CAM 02 · Street corner',pos:[-10,12,6.4],look:[-34,25,.6],sharp:[-33,23.6,7.5]}],
      actors:[
        {kind:'p',look:randLook(),keys:[[0,30,17],[14,-30,17]],msg:'A passer-by on the walkway. Not involved.'},
        {kind:'p',look:{shirt:'#2d2d33',pants:'#1b1c20',masked:true,gloves:'#111'},keys:[[6,0,-.5],[8.6,-1,10],[11,-2.6,21.4]],msg:'Masked robber, average height, gloves on. Nothing identifying.'},
        {kind:'p',look:{shirt:'#3a2a24',pants:'#1b1c20',masked:true,tall:1.12,gloves:'#111'},keys:[[7,0,-.5],[9.5,-.4,10],[11.5,-3.4,21.4]],clue:['tall','CCTV: one robber is very tall','Measured against the door frame, the second robber stands about 192 cm (6\'4").']},
        {kind:'p',look:{shirt:'#23314a',pants:'#1b1c20',masked:true,backpack:'#3a5a8a'},keys:[[8.2,0,-.5],[10.5,-1.6,10],[11.7,-5,21.4]],msg:'Masked robber with a Ghana-must-go bag. Nothing identifying.'},
        {kind:'c',color:A.car.color.h,model:A.car.model,plate:cs.pattern,face:-1,keys:[[0,-4,23.6],[12,-4,23.6],[13.2,-13,23.6],[17.2,-130,23.6]],clue:['plate','CCTV: getaway vehicle',`${A.car.color.n} ${A.car.model}, partial plate ${cs.pattern}. Leaving at 21:41.`],blur:'Too dark to read the plate here. Find the frame where the car is under the streetlight on CAM 02.'},
        {kind:'c',color:'#e8b417',model:'Danfo',face:1,keys:[[2,-130,32],[7.5,130,32]],msg:'A danfo heading the other way, before the robbery.'}]};
  }
  if(cs.type==='leak'){
    const d=LOC.station;
    return {d,min:2*60+13,day:'TUE',stamp:'02:1',stampBase:3*60,dur:18,
      cams:[{name:'CAM 03 · Station car park',pos:[-6,-1.1,5],look:[8,18,.8],sharp:[8,19.8,5.5],lamp:[8,19,4.5]}],
      actors:[
        {kind:'c',color:'#16181d',model:'Highlander',plate:cs.hpattern,face:1,keys:[[0,8,22],[13,8,22],[14,20,22],[18,140,22]],clue:['hplate','CCTV: black Highlander',`Black Highlander, partial plate ${cs.hpattern}. Its driver handed over an envelope at 02:13.`],blur:'Too far to read the plate. Wait for a frame where it is closer to the camera.'},
        {kind:'p',look:{shirt:'#3a2a1e',pants:'#3a2a1e',skin:SKIN[3],hair:'#141010'},keys:[[0,9.6,20],[8,9.6,20],[8.6,9,21.2],[12.4,9,21.2]],msg:'The Highlander\'s driver, in a long kaftan. His face is turned away from the camera.'},
        {kind:'p',look:{shirt:'#2a2f3a',pants:'#141922',skin:cs.C.skin,hat:true,hatColor:'#101010',vest:true,vestColor:'#3a3f4a',tall:1.09},keys:[[2,0,-.5],[7,7.6,19.6],[11,7.6,19.6],[16,0,-.5]],clue:['tallOfficer','CCTV: senior officer at 02:13','A tall officer, about 188 cm, in a senior officer\'s peaked cap, takes an envelope from the Highlander\'s driver.'],blur:'Too dark to make him out. Wait for the frame where he is under the car park light.'}]};
  }
  const d=LOC.school;
  return {d,min:14*60+2,stamp:'14:0',stampBase:2*60,dur:20,
    cams:[{name:'CAM 01 · School gate',pos:[-5,1.2,4.2],look:[3,9,.8],sharp:[0,3,5.5]},
          {name:'CAM 02 · Traffic camera',pos:[24,14,6.4],look:[44,25,.6],sharp:[40,24.4,7.5]}],
    actors:[
      {kind:'p',look:{shirt:'#7a3d6e',skin:SKIN[2],hair:'#141010',kid:true,backpack:'#3a5a8a'},keys:[[2.5,0,0],[5,1.5,3],[9,5,14],[12.2,7.5,22.6]],msg:`That's ${cs.victim.first}, in school uniform, leaving through the gate.`},
      {kind:'p',look:{shirt:'#b0302f',pants:'#2a2e38',skin:A.skin,hood:true},keys:[[4.5,-12,3],[7,-1,3],[9.2,4,14.5],[12.4,6.6,22.8]],clue:['abductor','CCTV: man in a red hoodie',`Walks ${cs.victim.first} to the car. About ${A.height} cm, ${A.hair.h?lower(A.hair.n)+' hair':'bald'}.`],blur:'Too far from the camera to make out. Find a frame where he is close to the gate.'},
      {kind:'c',color:A.car.color.h,model:A.car.model,plate:cs.pattern,face:1,keys:[[0,8,24],[13,8,24],[14,20,24],[18.5,150,24]],clue:['plate','CCTV: kidnappers\' car',`${A.car.color.n} ${A.car.model}, partial plate ${cs.pattern}. Passed the traffic camera at 14:02.`],blur:'Too far away to read the plate. The traffic camera on CAM 02 has a closer view.'},
      {kind:'p',look:randLook(),keys:[[1,25,15],[18,-25,15]],msg:'A woman selling pure water. Not involved.'},
      {kind:'c',color:'#e8b417',model:'Danfo',face:-1,keys:[[3,150,31],[8,-40,31]],msg:'A danfo. Not the kidnappers.'}]};
}

// ---------- Port Eko look: ankara prints, kekes, okadas, kiosks, market umbrellas
const ANKARA=[];
function ankaraMat(i){
  if(ANKARA[i])return ANKARA[i];
  const pal=[['#e0a21b','#1a5e8a','#c1361f'],['#d9a227','#6b2d5a','#1f7a5a'],['#1f4fa0','#f2c230','#e8e2d4'],['#c1361f','#1b1b1b','#f2c230'],['#2f8a4f','#f28c28','#2b2b6e'],['#7a1f4a','#e0b52b','#1a8a8a']][i%6];
  const [c,g]=mkC(64,64);g.fillStyle=pal[0];g.fillRect(0,0,64,64);
  for(let y=0;y<64;y+=16)for(let x=0;x<64;x+=16){g.fillStyle=pal[1];g.beginPath();g.arc(x+8,y+8,6,0,7);g.fill();g.fillStyle=pal[2];g.beginPath();if(i%2){g.moveTo(x+8,y+3);g.lineTo(x+13,y+8);g.lineTo(x+8,y+13);g.lineTo(x+3,y+8);}else g.arc(x+8,y+8,2.5,0,7);g.fill();}
  const t=ctex(c,true);t.repeat.set(2,2);return ANKARA[i]=new THREE.MeshLambertMaterial({map:t});
}
function makeSmallVehicle(color,model){
  const g=new THREE.Group(),body=new THREE.Group();g.add(body);const wheels=[],steer=[];
  const wheel=(x,z,r)=>{const piv=new THREE.Group();piv.position.set(x,r,z);const sp=new THREE.Group();piv.add(sp);const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.14,12),lam('#121316'));t.rotation.z=Math.PI/2;sp.add(t);g.add(piv);wheels.push(sp);return piv;};
  let P;
  if(model==='Keke'){
    const paint=std(color,.4,.3);
    const b=sh(new THREE.Mesh(new THREE.BoxGeometry(1.25,.75,2.3),paint),true,false);b.position.set(0,.75,-.1);body.add(b);
    const nose=sh(new THREE.Mesh(new THREE.BoxGeometry(.7,.9,.6),paint));nose.position.set(0,.9,1.2);body.add(nose);
    const roof=sh(new THREE.Mesh(new THREE.BoxGeometry(1.32,.07,2.4),lam('#151515')));roof.position.set(0,1.85,-.1);body.add(roof);
    [[-.6,.95],[.6,.95],[-.6,-1.2],[.6,-1.2]].forEach(([x,z])=>{const p=new THREE.Mesh(new THREE.BoxGeometry(.05,.95,.05),lam('#151515'));p.position.set(x,1.38,z);body.add(p);});
    const hd=new THREE.Mesh(GEO.silHead,lam('#3a2418'));hd.position.set(0,1.45,.75);body.add(hd);
    const hl=new THREE.Mesh(GEO.hl,matLF);hl.position.set(0,1.1,1.51);body.add(hl);
    steer.push(wheel(0,1.25,.28));wheel(-.6,-.85,.3);wheel(.6,-.85,.3);
    P={W:1.3,roof:1.85,body:[[-1.3,0],[1.5,0]],wz:1};
  }else{
    const fr=sh(new THREE.Mesh(new THREE.BoxGeometry(.22,.32,1.3),std(color,.35,.5)),true,false);fr.position.set(0,.62,0);body.add(fr);
    const seat=new THREE.Mesh(new THREE.BoxGeometry(.3,.1,.75),lam('#141414'));seat.position.set(0,.84,-.2);body.add(seat);
    const bar=new THREE.Mesh(new THREE.BoxGeometry(.7,.05,.05),lam('#222'));bar.position.set(0,1.05,.55);body.add(bar);
    const hl=new THREE.Mesh(new THREE.BoxGeometry(.18,.12,.05),matLF);hl.position.set(0,.9,.68);body.add(hl);
    steer.push(wheel(0,.62,.32));wheel(0,-.62,.32);
    const rider=makePersonMesh(randLook());pose(rider,['sit','drive']);rider.position.set(0,-.02,-.25);body.add(rider);
    if(Math.random()<.4){const pass=makePersonMesh(randLook());pose(pass,['sit']);pass.position.set(0,0,-.65);body.add(pass);}
    P={W:.7,roof:1.6,body:[[-.9,0],[.9,0]],wz:.6};
  }
  g.userData={wheels,steer,body,P,tail:matLR,model,color};if(model==='Keke')artDressCar(g);return g;
}
function buildLocalProps(){
  const dm=new THREE.Object3D();
  // POS kiosks on street corners
  const n=14,kiosk=new THREE.InstancedMesh(new THREE.BoxGeometry(1.3,2,1.1),lam('#f2f2f0'),n),awn=new THREE.InstancedMesh(new THREE.BoxGeometry(1.6,.12,1.5),new THREE.MeshLambertMaterial({color:0xffffff}),n);
  const [c,gx]=mkC(128,48);gx.fillStyle='#1f7a3a';gx.fillRect(0,0,128,48);gx.fillStyle='#fff';gx.font='800 30px Saira Condensed, Arial Narrow, sans-serif';gx.textAlign='center';gx.textBaseline='middle';gx.fillText('POS · TRANSFER',64,25);
  const signM=new THREE.MeshLambertMaterial({map:ctex(c),emissive:col('#ffffff'),emissiveMap:ctex(c),emissiveIntensity:.25});NEON_MATS.push(signM);
  for(let i=0;i<n;i++){const bi=ri(0,NB-1),bj=ri(0,NB-1);const cx=(bi+.5)*S,cz=(bj+.5)*S;const side=ri(0,3),u=rnd(-18,18);
    const p=side===0?[cx+u,cz-28.6,0]:side===1?[cx+u,cz+28.6,Math.PI]:side===2?[cx-28.6,cz+u,Math.PI/2]:[cx+28.6,cz+u,-Math.PI/2];
    dm.rotation.set(0,p[2],0);dm.position.set(p[0],1.2,p[1]);dm.updateMatrix();kiosk.setMatrixAt(i,dm.matrix);
    dm.position.set(p[0],2.28,p[1]);dm.updateMatrix();awn.setMatrixAt(i,dm.matrix);awn.setColorAt(i,col(pick(['#1f7a3a','#c1361f','#e0a21b','#1f4fa0'])));
    const s2=new THREE.Mesh(new THREE.PlaneGeometry(1.25,.47),signM);s2.position.set(p[0]+Math.sin(p[2])*.56,1.85,p[1]+Math.cos(p[2])*.56);s2.rotation.y=p[2];scene.add(s2);
    BOXES.push({x0:p[0]-.75,x1:p[0]+.75,z0:p[1]-.75,z1:p[1]+.75,h:2.3});}
  kiosk.castShadow=QUAL.shadows;scene.add(kiosk,awn);
  // market umbrellas and tables in the Marina Point park
  const m=20,pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.04,.04,2.3,6),lam('#3a3a3a'),m),umb=new THREE.InstancedMesh(new THREE.ConeGeometry(1.4,.6,8),new THREE.MeshLambertMaterial({color:0xffffff}),m),tab=new THREE.InstancedMesh(new THREE.BoxGeometry(1.4,.7,.9),lam('#7a5a3a'),m);
  for(let i=0;i<m;i++){const x=(1+.5)*S+rnd(-22,22),z=(2+.5)*S+rnd(-22,22);dm.rotation.set(0,rnd(0,3),0);
    dm.position.set(x,1.4,z);dm.updateMatrix();pole.setMatrixAt(i,dm.matrix);dm.position.set(x,2.6,z);dm.updateMatrix();umb.setMatrixAt(i,dm.matrix);umb.setColorAt(i,col(pick(['#c1361f','#1f4fa0','#e0a21b','#1f7a3a','#7a1f4a'])));
    dm.position.set(x+.6,.6,z);dm.updateMatrix();tab.setMatrixAt(i,dm.matrix);}
  umb.castShadow=QUAL.shadows;scene.add(pole,umb,tab);
}

renderCharBox();
