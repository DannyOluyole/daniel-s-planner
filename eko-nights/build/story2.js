// ================= Eko Nights, part 2: seven long chapters, Yahoo boys and a ghost contract
// Each chapter is a list of steps (talk, traffic duty, case). Functions here replace the single-step versions in story.js.
SHAPE['G-Wagon']='SUV';
const SF=(cs,k,v=true)=>{if(cs.story){ST().flags[k]=v;saveCareer();}};

// ---------- fixed places for the new cases (taken out of the pool of random homes)
function takeDoor(dist){const i=RES_DOORS.findIndex(d=>d.district===dist);return RES_DOORS.splice(i<0?0:i,1)[0];}
const HK_DOOR=takeDoor('Allen Estate'),MANSION=takeDoor('Orile Hills');
const _tan=d=>({x:-d.nz,z:d.nx});
LOC.motels['Hustle Kingdom']={...HK_DOOR};
LOC.bluegate={x:HK_DOOR.x+HK_DOOR.nx*3,z:HK_DOOR.z+HK_DOOR.nz*3};
LOC.grace={x:_sd.x+_sd.nx*3.4-_sd.tx*.6,z:_sd.z+_sd.nz*3.4-_sd.tz*.6};
LOC.checkpoint={x:1.5*S+30.6,z:3.5*S-10};
LOC.site={x:4.5*S-30.5,z:4.5*S-6};
LOC.iyaloja={x:4.5*S-31,z:4.5*S+7};
for(let i=TREES.length-1;i>=0;i--){const [x,z]=TREES[i];if(x>4.5*S-34&&x<4.5*S-12&&z>4.5*S-12&&z<4.5*S+20)TREES.splice(i,1);}

Object.assign(NPCS,{
  grace:{name:'Mrs. Grace Eze',look:{shirt:'#6b2d5a',ankara:1,skin:'#5a3620',hair:'#2a2a2a',pants:'#6b2d5a'},pos:LOC.grace,where:'Waiting by the entrance of Division 9.'},
  ogidi:{name:'Barr. Chuks Ogidi',look:{shirt:'#2a2a33',pants:'#2a2a33',skin:'#4a2e1c',hair:'#141010'},pos:{x:LOC.carpark.x+_sd.nx*2,z:LOC.carpark.z+_sd.nz*2},where:'By the Division 9 car park.'},
  bulus:{name:'Insp. Gideon Bulus',look:{shirt:'#1a1d22',pants:'#1a1d22',skin:'#3d2516',hat:true,hatColor:'#7a1f1f',vest:true,vestColor:'#2a2f3a',tall:1.04},pos:LOC.checkpoint,face:Math.PI/2,where:'Police checkpoint on Allen Avenue, Allen Estate.'},
});
NPCS.bisi.where=NPCS.coker.where='At the entrance of Division 9.';

// names for the case's corrupt politicians: invented, and checked against build/politicians.js by t28
const HON_FIRST=['Oluwaseun','Chukwuma','Temitope','Olumide','Ikechukwu','Habeeb'],HON_LAST=['Olowokere','Akinwande','Okwudili','Bamgbala','Ezenwafor','Danmaraya'];
const T1='Talk to';
Object.assign(CH,{
  1:{t:'First Posting',sub:'Your first day at Division 9. Nobody in Port Eko trusts the uniform. Yet.',steps:[
    {k:'talk',who:'bisi',id:'c1_brief'},{k:'duty',n:3},{k:'talk',who:'bisi',id:'c1_after',obj:'Report back to Sgt Bisi Okafor'},
    {k:'talk',who:'grace',id:'c1_grace'},{k:'case'},{k:'talk',who:'bisi',id:'c1_end',obj:'Report back to Sgt Bisi Okafor'}]},
  2:{t:'Cash Run',sub:'A bank is robbed in the night. A lawyer comes calling. And the DPO wants every young man with a laptop searched.',steps:[
    {k:'talk',who:'coker',id:'c2_brief'},{k:'case'},{k:'talk',who:'coker',id:'c2_debrief',obj:'Report back to CSP Olatunde Coker'},
    {k:'talk',who:'ogidi',id:'c2_lawyer',obj:'Meet the lawyer in the car park'},
    {k:'talk',who:'bulus',id:'c2_sweep',obj:'Join Operation Sweep',radio:'Radio: "Constable, report to Inspector Bulus at the Allen Avenue checkpoint. Operation Sweep."'},
    {k:'talk',who:'bisi',id:'c2_end',obj:'Report back to Sgt Bisi Okafor'}]},
  3:{t:'Hustle Kingdom',sub:'A Canadian company loses $180,000 to a fake invoice. The trail leads to a house in Allen Estate where the generator never stops.',steps:[
    {k:'talk',who:'bisi',id:'c3_brief'},{k:'case'},{k:'talk',who:'bisi',id:'c3_end',obj:'Report back to Sgt Bisi Okafor'}]},
  4:{t:'Ghost Project',sub:'₦850 million for a health centre nobody can find, and a politician who says he is untouchable.',steps:[
    {k:'talk',who:'bisi',id:'c4_brief'},{k:'talk',who:'coker',id:'c4_coker',obj:'The DPO wants to see you'},{k:'case'},{k:'talk',who:'bisi',id:'c4_end',obj:'Report back to Sgt Bisi Okafor'}]},
  5:{t:'Ransom',sub:'A child is taken outside school. The ransom is paid. The child is still missing.',steps:[
    {k:'talk',who:'coker',id:'c5_brief'},{k:'case'},{k:'talk',who:'bisi',id:'c5_end',obj:'Report back to Sgt Bisi Okafor'}]},
  6:{t:'Inside Man',sub:'Someone in Division 9 is selling raid plans. Find them before they find you.',steps:[
    {k:'talk',who:'bisi',id:'c6_brief'},{k:'case'},{k:'talk',who:'bisi',id:'c6_end',obj:'Report back to Sgt Bisi Okafor'}]},
  7:{t:'Harmattan',sub:'Wharf Warehouse 7. Felix "Harmattan" Ugorji. End it.',steps:[{k:'talk',who:'bisi',id:'c7_brief'},{k:'case'}]},
});

// ---------- step engine
function storyMigrate(){
  const s=career.story;if(!s||s.v===2)return;
  s.ch={1:1,2:2,3:5,4:6,5:7}[s.ch]||1;s.i=0;if(s.step!=='done')s.step='active';s.v=2;saveCareer();
}
function curStep(){const s=ST();if(s.step==='done')return null;const C=CH[s.ch];return C&&C.steps[s.i]||null;}
function stepToast(){const st=curStep();if(!st)return;SFX.blip('radio');
  if(st.radio)toast(st.radio);else if(st.k==='talk')toast(`${st.obj||T1+' '+NPCS[st.who].name}. ${NPCS[st.who].where}`);}
function nextStep(){
  const s=ST();s.i++;gps=null;
  if(s.i>=CH[s.ch].steps.length){advanceChapter();return;}
  if(curStep().k==='duty')s.stopsAt=shift.stops;
  saveCareer();setTimeout(stepToast,700);
}
function advanceChapter(){const s=ST();s.ch++;s.i=0;saveCareer();gps=null;setTimeout(()=>showChapter(s.ch),300);setTimeout(stepToast,4400);}
function startStoryCase(cs){const s=ST();cs.story=true;startCase(cs);s.i++;cs.si=s.i;saveCareer();}
function storyObj(){
  const s=ST();if(!career.officer)return null;const st=curStep();if(!st||st.k==='case')return null;const e=`Chapter ${s.ch} · ${CH[s.ch].t}`;
  if(st.k==='duty')return {e,b:`Traffic duty: ${Math.min(st.n,shift.stops-s.stopsAt)}/${st.n} stops`,p:`Lock the radar on a speeder (over ${LIMIT} km/h), a red-light runner or a plate-reader hit. Hit Space, follow until they stop, then walk to the window.`};
  const w=NPCS[st.who];return {e,b:st.obj||`${T1} ${w.name}`,p:`${w.where} Follow the GPS.`};
}
function storyGPST(){const st=curStep();if(curCase||gps||!career.officer||!st||st.k!=='talk')return;const w=NPCS[st.who];setGPS(w.pos.x,w.pos.z,w.name);}
function storyBegin(){
  storyMigrate();const s=ST();if(!career.officer)return;
  let st=curStep();if(st&&st.k==='case'&&!curCase){s.i--;st=curStep();}
  if(st&&st.k==='duty')s.stopsAt=shift.stops;
  saveCareer();
  if(s.step==='done')toast(`Welcome back, ${OFF().first}. Port Eko still needs you. Press Tab for cases.`);
  else if(s.ch===1&&s.i===0&&!s.flags.started){s.flags.started=true;saveCareer();showChapter(1);setTimeout(stepToast,4400);}
  else toast(`Chapter ${s.ch}: ${CH[s.ch].t}. ${storyObj()?storyObj().b+'.':''}`);
  storyGPST();setInterval(storyTick,500);
}
let stepProps=null;
function syncStepProps(){
  const st=curStep();const want=st&&st.id==='c2_sweep'&&!curCase;
  if(want&&!stepProps){const c=LOC.checkpoint;stepProps=[{shirt:'#2f8a4f',skin:'#5a3620',hair:'#141010',backpack:'#2b2b33'},{shirt:'#e0a21b',skin:'#4a2e1c',hair:'#2a1c12',hood:false}].map((l,i)=>{const m=makePersonMesh(l);m.position.set(c.x-1.2,.2,c.z+2+i*1.3);m.rotation.y=Math.PI/2;scene.add(m);return m;});}
  if(!want&&stepProps){stepProps.forEach(m=>scene.remove(m));stepProps=null;}
}
function storyTick(){
  if(!started||!career.officer)return;const s=ST();const cs=curCase;const st=curStep();
  if(st&&st.k==='case'&&!cs&&!modalOpen()){s.i--;saveCareer();}
  if(st&&st.k==='duty'&&shift.stops-s.stopsAt>=st.n){SFX.blip('radio');toast('Radio: "Constable, that\'s enough for today. Report back to base."','good');nextStep();}
  if(cs&&cs.story&&!cs.ended){
    if(cs.type==='contract'&&!cs.flags.warrant&&['site','director','payments'].every(id=>cs.evidence.some(e=>e.id===id))){cs.flags.warrant=true;clog(cs,`A magistrate signed an arrest warrant for ${cs.H.name}.`);toast(`A magistrate has signed the warrant for ${cs.H.name}. ${cs.H.district}.`,'good');SFX.blip('radio');}
    if(cs.type==='yahoo'&&cs.custody.includes(cs.C.id)&&!cs.flags.offered&&!cine&&!raidS&&!cctv&&!modalOpen()&&!prisoner){cs.flags.offered=true;setTimeout(()=>chairmanOffer(cs),600);}
    if(caseCanClose(cs)){
      const auto=cs.type==='leak'||cs.type==='finale'||cs.flags.paid||cs.flags.honPaid;
      if(auto){if(!raidS&&!cine&&!cctv&&!modalOpen()&&!cs._closing){cs._closing=true;setTimeout(()=>endCase(cs,'closed'),900);}}
      else if(!cs._hint&&!(cs.type==='yahoo'&&!cs.flags.offerDone)){cs._hint=true;toast('Case solved. Close it from the MDT (Tab), then report back to base.','good');}
    }
  }
  syncStepProps();
  if(!cine&&!raidS&&!cctv)storyGPST();
}
function caseCanClose(cs){
  const inC=id=>cs.custody.includes(id);
  switch(cs.type){
    case 'robbery':case 'finale':case 'yahoo':case 'homicide':return inC(cs.C.id);
    case 'leak':return !!cs.flags.confronted;
    case 'romance':return inC(cs.M.id)||!!cs.flags.paid;
    case 'contract':return inC(cs.H.id)||!!cs.flags.honPaid;
  }
  return !!cs.flags.rescued;
}
function storyCaseEnded(cs,success){
  if(!cs.story)return;const s=ST();gps=null;
  if(success){
    if(cs.type==='finale'){s.step='done';saveCareer();setTimeout(showEnding,300);return;}
    if(cs.type==='kidnap')s.flags.victim=cs.victim.first;
    if(cs.type==='romance')s.flags.muleName=cs.M.name;
    s.i=cs.si;saveCareer();nextStep();
  }else{s.i=cs.si-1;saveCareer();toast(`The case slipped away. Talk to ${NPCS[curStep().who].name} to try again.`,'bad');}
}

// ---------- interactables for story NPCs and the new cases
function storyInteractables(I){
  if(!career.officer)return;const cs=curCase;const st=curStep();const inC=id=>cs.custody.includes(id);
  const npc=(who)=>{const n=NPCS[who];I.push({key:'story_'+who,x:n.pos.x,z:n.pos.z,kind:'npc',look:n.look,face:n.face!=null?n.face:faceOf(LOC.station),label:`Talk to ${n.name}`,act:()=>storyTalk(who)});};
  if(!cs&&st&&st.k==='talk')npc(st.who);
  if(!cs)return;
  if(cs.type==='leak'){
    I.push({key:'logterm',x:LOC.logTerm.x,z:LOC.logTerm.z,kind:'terminal',face:faceOf(LOC.station),label:'Check the evidence-room log',act:()=>leakLog(cs)});
    I.push({key:'carcam',x:LOC.carpark.x,z:LOC.carpark.z,kind:'terminal',face:faceOf(LOC.station),label:'Review the car park camera',act:()=>{if(!cs.done.cctv){if(!spend(cs,15))return;cs.done.cctv=true;}openCCTV3D(cs);}});
    if(leakEvidence(cs)>=2&&!cs.flags.confronted)I.push({key:'confront',x:LOC.interview.x,z:LOC.interview.z,kind:'terminal',face:faceOf(LOC.station),label:'Interview room: confront the leak',act:()=>confrontPick(cs)});
  }
  if(cs.type==='finale'&&!inC(cs.C.id)&&!(chase&&chase.p===cs.C)){const m=LOC.motels['Wharf Warehouse 7'];I.push({key:'raid',x:m.x+m.nx*2,z:m.z+m.nz*2,kind:'door',label:'Brief SWAT and raid Wharf Warehouse 7',act:()=>raidBrief(cs)});}
  if(cs.type==='finale'&&cs.flags.informant&&!cs.done.informant)I.push({key:'informant',x:LOC.informant.x,z:LOC.informant.z,kind:'npc',look:{shirt:'#d9a227',ankara:1,skin:'#5a3620',hair:'#141010',pants:'#6b2d5a'},label:'Talk to Iya Risi',act:()=>informantTalk(cs)});
  if(cs.type==='yahoo'&&!inC(cs.C.id)){
    if(cs.flags.hideout&&!(chase&&chase.p===cs.C)){const m=cs.hk;I.push({key:'raid',x:m.x+m.nx*2,z:m.z+m.nz*2,kind:'door',label:`Brief SWAT and raid ${cs.hide.place}`,act:()=>raidBrief(cs)});}
    if(cs.flags.hkKnown&&!cs.done.landlord)I.push({key:'landlord',x:cs.landlordAt.x,z:cs.landlordAt.z,kind:'npc',look:{shirt:'#e8e2d4',pants:'#e8e2d4',skin:'#4a2e1c',hat:true,hatColor:'#e8e2d4'},face:faceOf(cs.hk),label:`Talk to ${cs.landlord}, the landlord`,act:()=>landlordTalk(cs)});
    if(cs.evidence.some(e=>e.id==='tip')&&!cs.flags.hkKnown)I.push({key:'bluegate',x:LOC.bluegate.x,z:LOC.bluegate.z,kind:'spot',label:'Take a look at the blue-gate house',act:()=>blueGate(cs)});
  }
  if(cs.type==='contract'){
    if(!cs.done.site)I.push({key:'site',x:LOC.site.x,z:LOC.site.z,kind:'spot',label:'Inspect the project site',act:()=>siteInspect(cs)});
    if(!cs.done.iyaloja)I.push({key:'iyaloja',x:LOC.iyaloja.x,z:LOC.iyaloja.z,kind:'npc',look:{shirt:'#c1361f',ankara:3,skin:'#3d2516',hair:'#141010',pants:'#c1361f'},face:-Math.PI/2,label:'Talk to Mama Ronke, the Iyaloja',act:()=>iyalojaTalk(cs)});
    const H=cs.H;if(!inC(H.id)&&!cs.flags.honPaid&&!(chase&&chase.p===H)&&!(prisoner&&prisoner.p===H))I.push({key:'hon',x:cs.mansion.x,z:cs.mansion.z,kind:'npc',look:H.look,face:faceOf(cs.mansion),label:`Talk to ${H.name}`,act:()=>honDoor(cs)});
  }
  if(cs.type==='homicide')homicideInteractables(cs,I);
}

// ---------- doors: the picker's mother, the Chairman's empty flat
function doorTalk(cs,p){
  const v=iMeshes.get('home'+p.id);if(!v)return;
  if(cs.type==='romance'&&p===cs.M){
    talkTo(v.g,[you(`${p.first} ${p.last}? Division 9. We need to talk about Firststone account ****${p.acct}.`),{name:p.name,text:'Officer, wetin I do? I be student. I dey read for exam.'},
      {name:`Mama ${p.first}`,text:`Officer, abeg! Na my only son. E never do anything. See one hundred thousand naira here. Make una leave am, abeg. I beg you in God's name.`}],
      [{label:`Arrest ${p.first}`,cls:'red'},{label:'Take the ₦100,000 and leave'},{label:'Walk away',cls:'ghost'}],ch=>{
        if(ch.label.startsWith('Arrest')){if(!cs.flags.mamaRefused){cs.flags.mamaRefused=true;refuseBribe(4);}attemptArrest(cs,p,v.g.position);}
        else if(ch.label.startsWith('Take')){takeBribe(100000,8);cs.flags.paid=true;SF(cs,'mulePaid');clog(cs,`You took ₦100,000 from ${p.first}'s mother and walked away.`);}
      });
    return;
  }
  if(cs.type==='yahoo'&&p===cs.C){
    SFX.blip('door');talkTo(v.g,[you(`${p.name}? Division 9.`),{name:'Neighbour',text:`${p.first}? Ah, e don tey wey e sleep for here. E just dey come collect letter. People say e dey stay for one big house for ${cs.hk.district}.`}],[{label:'Thanks'}],()=>{
      addEv(cs,'notHome',`${p.nick} doesn't live at home`,`Neighbours say ${p.name} hasn't slept at his flat in months. He stays at a big house in ${cs.hk.district}.`,'Canvass');});
    return;
  }
  if(cs.type==='homicide'&&cs.sus.includes(p)){suspectDoor(cs,p,'home'+p.id);return;}
  doorTalkBase(cs,p);
}

// ---------- documents, chats and bank statements: flag what doesn't fit
function openFile(cs,key,cfg){
  const rows=cs['rows_'+key]||(cs['rows_'+key]=cfg.rows);const fl=cs['fl_'+key]||(cs['fl_'+key]={});
  const hits=rows.filter(r=>r.k==='hit');
  const left=()=>hits.filter(r=>!fl[rows.indexOf(r)]).length;
  const cls=i=>fl[i]?(rows[i].k==='normal'?'flag-miss':'flag-hit'):'';
  const btn=i=>`<button class="btn ghost sm" data-r="${i}" ${fl[i]?'disabled':''}>Flag</button>`;
  const body=cfg.style==='chat'?`<div class="chatlog">${rows.map((r,i)=>`<div class="bub ${r.me?'me':''} ${r.sys?'sys':''} ${cls(i)}"><small>${esc(r.who)} · ${esc(r.t)}</small><div>${esc(r.text)}</div>${btn(i)}</div>`).join('')}</div>`
    :`<div class="tablewrap"><table><thead><tr>${cfg.cols.map(c=>`<th${c==='Amount'?' style="text-align:right"':''}>${c}</th>`).join('')}<th></th></tr></thead><tbody>
      ${rows.map((r,i)=>`<tr class="${cls(i)}">${r.cells.map((c,j)=>cfg.cols[j]==='Amount'?`<td class="amt">${naira(c)}</td>`:`<td class="${j===r.cells.length-1?'memo':''}">${esc(c)}</td>`).join('')}<td>${btn(i)}</td></tr>`).join('')}</tbody></table></div>`;
  const el=openModal(`<header><div><div class="eyebrow">${esc(cfg.eyebrow)}</div><h2>${esc(cfg.title)}</h2></div><button class="x" aria-label="Close">✕</button></header>
    <p class="muted" style="margin-top:0">${esc(cfg.intro)} Each wrong flag costs 10 minutes.</p>${body}
    <div class="cmsg" id="fMsg" style="margin-top:10px">${left()?`${left()} important ${left()>1?'items':'item'} left to find.`:'You have everything this file can give you.'}</div>
    <div class="row end" style="margin-top:10px"><button class="btn ghost" id="fHint">Ask an analyst (15 min)</button><button class="btn" id="fDone">Done</button></div>`,{wide:true,tablet:true});
  const msg=(h,k)=>{const m=$('#fMsg',el);m.innerHTML=h;m.className='cmsg '+(k||'');};
  $$('[data-r]',el).forEach(b=>b.onclick=()=>{
    const i=+b.dataset.r,r=rows[i];
    if(r.k==='normal'){if(!spend(cs,10))return;fl[i]=true;msg(`<b>Nothing here.</b> ${esc(r.why)} (−10 min)`,'miss');}
    else{fl[i]=true;addEv(cs,r.ev[0],r.ev[1],r.ev[2],cfg.src);if(r.then)r.then();SFX.blip('good');
      const n=left();if(!n)cs.done[key]=true;
      msg(`<b>${r.k==='hit'?'Match.':'Useful.'}</b> ${esc(r.ev[2])}${n?` · ${n} left`:' · File complete.'}`,'hit');}
    const row=b.closest('tr')||b.closest('.bub');row.classList.add(r.k==='normal'?'flag-miss':'flag-hit');b.disabled=true;
  });
  $('#fHint',el).onclick=()=>{if(!spend(cs,15))return;msg('<b>Analyst:</b> '+esc(cfg.hint),'');$('#fHint',el).disabled=true;};
  $('.x',el).onclick=$('#fDone',el).onclick=closeModal;
}

// ---------- chapter 1: "Captain James Walker" (romance scam)
function genRomance(opt={}){
  const P=makePeople(12);assignHomes(P);const M=P[0];
  const mf=pick(['Chinedu','Emeka','Ikenna','Obinna','Kelechi','Somto','Ebuka','Tobenna']);Object.assign(M,{first:mf,name:mf+' '+M.last,age:ri(19,23),job:'Student, Port Eko Polytechnic',prior:'None',hair:HAIR[1]});
  const vic=opt.story?{name:'Mrs. Grace Eze',first:'Grace',amt:3200000,persona:{n:'Capt. James Walker',bio:'I am a US Army surgeon on a peacekeeping mission in Syria.',where:'Syria',job:'US Army surgeon'}}
    :(()=>{const f=pick(['Grace','Bose','Ngozi','Halima','Funke','Ifeoma','Mr. Samuel']);const l=pick(LAST);return {name:(f.startsWith('Mr.')?f:'Mrs. '+f)+' '+l,first:f.replace('Mr. ',''),amt:pick([1800000,2500000,4100000,6000000]),
      persona:pick([{n:'Capt. James Walker',bio:'I am a US Army surgeon on a peacekeeping mission in Syria.',where:'Syria',job:'US Army surgeon'},{n:'Engr. Michael Brandt',bio:'I am an engineer on an oil rig in the North Sea. My contract ends in three months.',where:'the North Sea',job:'oil-rig engineer'},{n:'Dr. Sarah Collins',bio:'I am a doctor with the UN in South Sudan. I lost my husband two years ago.',where:'South Sudan',job:'UN doctor'}])};})();
  const cs=baseCase({type:'romance',title:`"${vic.persona.n}"`,code:'419',people:P,db:P,gang:[M.id],M,C:M,vic,limit:600,fleeChance:{[M.id]:.5},roles:[[M,'Account holder']]});
  cs.scripts={[M.id]:{alibi:'Officer, I no know any captain. Somebody fit don use my account. People dey hack account every day.',correct:['kyc','voice'],
    crack:['Okay! Okay. Na my account, but I no be the one wey dey chat, I swear!','I sell the account to one guy for fifty thousand naira. Everybody dey call am Chairman. Him get one house for Allen Estate. Dem call am HK. Hustle Kingdom.','Ten boys dey work there day and night with laptops. If Chairman know say I talk, I don die.'],
    onCrack(){addEv(cs,'hk','The "Chairman" and Hustle Kingdom',`${M.name} sold his account to a man called "Chairman", who runs a fraud house in Allen Estate called HK, Hustle Kingdom.`,'Interrogation');SF(cs,'hkLead');}}};
  cs.sub=ok=>cs.flags.paid?`You let ${M.first} go for ₦100,000. ${vic.name} will never see the money again.`:ok?`${M.name} is in custody. The bank froze what was left in the account and part of it goes back to ${vic.name}.`:'The account holder slipped away.';
  cs.logs.push(`${vic.name} lost ${naira(vic.amt)} to "${vic.persona.n}", someone met on Facebook.`);
  return cs;
}
function romanceChats(cs){const M=cs.M,V=cs.vic,J=V.persona.n;return {eyebrow:`${V.name}'s phone · WhatsApp`,title:`Chat with "${J}"`,src:'Chat',style:'chat',
  intro:`Flag the messages that give the scammer away: who got the money, and where "${J}" really is.`,hint:`Scammers copy the same script, so the sweet talk proves nothing. Look for an account number, and for anything a ${V.persona.job} in ${V.persona.where} would never say or hear.`,rows:[
  {who:J,t:'Mon 21:14',text:'Good evening my Queen 🌹 How was your day? I can\'t stop thinking about you.',k:'normal',why:'Sweet talk. Every romance scam starts like this, but it proves nothing on its own.'},
  {who:J,t:'Mon 21:20',text:V.persona.bio,k:'normal',why:'The classic script: a professional far away, often widowed. A red flag, but not a lead.'},
  {who:J,t:'Thu 08:02',text:`My love, my retirement box is stuck at the airport. Customs want ${naira(V.amt)} before they release it. I will refund you double when I land.`,k:'normal',why:'The "consignment stuck at customs" story. A red flag, but it doesn\'t tell you who it is.'},
  {who:J,t:'Thu 08:05',text:`Pay to the customs agent: Firststone Bank, account ****${M.acct}. Account name ${M.first.toUpperCase()} ${M.last.toUpperCase()}.`,k:'hit',ev:['acct',`Payment account ****${M.acct}`,`${V.first} paid ${naira(V.amt)} into Firststone ****${M.acct}, in the name of ${M.name}. A real person opened this account.`]},
  {who:V.first,me:true,t:'Thu 09:40',text:`I have paid it. ${naira(V.amt)}. Please call me when you land, my dear.`,k:'normal',why:'The victim confirming the transfer. Already in the complaint.'},
  {who:J,t:'Thu 09:51',text:'[Voice note · 0:14] "Thank you my love, I will call you…" In the background, a bus conductor shouts: "Oja! Oja! Enter with your change!"',k:'hit',ev:['voice','Voice note recorded near Oja Market',`A danfo conductor is shouting "Oja! Oja!" behind "${J}". The voice note was recorded in Port Eko, not ${V.persona.where}.`]},
  {who:J,t:'Thu 10:30',text:'Abeg no vex, network no good for here. The customs people dey disturb me again. Dem want another ₦1.5m.',k:'side',ev:['pidgin',`"${J}" slips into Pidgin`,`A ${V.persona.job} writing in Nigerian Pidgin. The scammer is local.`]},
]};}
function kycLookup(cs){
  const M=cs.M;cs.done.kyc=true;cs.named[M.id]=true;SFX.blip('radio');
  addEv(cs,'kyc',`KYC: ${M.name}`,`Firststone's account opening file and BVN: ${M.name}, ${M.age}, ${lower(M.job)}. Selfie on file matches. Lives at ${M.address}, ${M.district}.`,'Bank');
  toast(`Firststone KYC: the account belongs to ${M.name}, ${M.address}. Find him in Records.`,'good');
}

// ---------- chapter 2: Operation Sweep at the checkpoint
function sweepScene(npc){
  const s=ST();const B=t=>({name:'Insp. Gideon Bulus',text:t}),T=t=>({name:'Tobi · software developer',text:t}),K=t=>({name:'Kachi · student',text:t});let good=0;
  talkTo(npc,[B(`Ehen, Constable ${OFF().last}. You don come. DPO's orders: Operation Sweep.`),
    B('Any young man wey carry laptop, iPhone or dreadlocks, na Yahoo boy until e prove otherwise. We check their phone. If e no fit explain, e go "bail" himself.'),
    B('Watch and learn. You! You with the laptop bag. Come here.'),T('Good evening, officer. I\'m just going home from work.'),B('Unlock your phone. Open that laptop. Now now.'),
    T('Officer, I\'m a software developer at a fintech in Marina Point. Here\'s my staff ID and my payslip.')],
    [{label:'His ID checks out. Let him go.'},{label:'Search his phone and laptop anyway.'},{label:'Make him "bail" himself: ₦50,000',cls:'red'}],ch=>{
      if(ch.label.startsWith('His')){good++;trustDelta(4,'You stood up for an innocent young man.');}
      else if(ch.label.startsWith('Search'))trustDelta(-4,'You searched an innocent man\'s phone. Somebody filmed it.');
      else takeBribe(50000,10);
      dialog([B('See this one. Dreadlocks and AirPods. Na Yahoo boy be this, I swear.'),K('Officer, I\'m a final-year student at Port Eko University. I make music. That\'s my school ID.'),B('Music? Na so all of them dey talk. Constable, put am for the van. E go settle us before morning.')],
        [{label:'No. He\'s done nothing. Go home, Kachi.'},{label:'Put him in the van.'},{label:'Take ₦20,000 and let him go',cls:'red'}],ch2=>{
          if(ch2.label.startsWith('No')){good++;trustDelta(4,'You sent an innocent student home.');}
          else if(ch2.label.startsWith('Put'))trustDelta(-6,'An innocent student spent the night in a cell.');
          else takeBribe(20000,8);
          s.flags.sweep=good;saveCareer();
          const end=good===2?[B('Constable, you dey spoil market for everybody. I go report you to the DPO.'),T('(catching up with you) Officer, thank you. Not every police officer is like that.'),
              T('If you want real Yahoo boys, go to Allen Estate. One house with a blue gate. Benz full the compound and the generator runs twenty-four hours. They call it HK.')]
            :good===1?[B('Hmm. Half-half officer. You go learn.'),K('(under his breath) This is why we marched.')]
            :[B('Now you dey learn how this job dey work. Small small, you go buy your own car.'),K('(quietly) This is exactly why we marched.')];
          if(good===2)s.flags.tobiTip=true;saveCareer();
          dialog(end,[{label:'Continue'}],()=>{endCine();nextStep();});
        });
      return true;
    });
}

// ---------- chapter 3: Hustle Kingdom (Yahoo boys)
function genYahoo(opt={}){
  const P=makePeople(14);const rest=assignHomes(P);const C=P[0];const s=ST();const story=!!opt.story;
  const nick=story?'Odogwu':pick(['Chairman','Ebube','Baba Dubai','Slim Money','Omo Baba','Kpakpando']);
  P.slice(1).forEach(p=>{if(p.nick===nick)p.nick='Senior Man';});
  if(story)Object.assign(C,{first:'Kelvin',last:'Okon',name:'Kelvin Okon'});
  Object.assign(C,{nick,age:ri(26,34),height:178,job:`CEO, ${nick} Autos & Logistics`,prior:'Arrested 2021, released without charge',tattoo:'Gold tooth',shirt:'#e8e2d4'});
  C.car={color:COLORS.find(c=>c.n==='White')||COLORS[1],model:'G-Wagon',plate:makePlate()};
  const reveal=shuffle([0,1,2,4,5,6,7,8]).slice(0,5);const gpattern=C.car.plate.split('').map((c,i)=>i===3||reveal.includes(i)?c:'?').join('');
  const hk=story?HK_DOOR:rest.find(d=>d.district==='Allen Estate')||rest[0];const place=story?'Hustle Kingdom':`${nick}'s house`;LOC.motels[place]={...hk};
  const t=_tan(hk);const vic=story?{co:'Northgate Fabrication',country:'Canada',contact:'Sarah Lim',usd:180000,supplier:'Halden Steel',dom:'haldensteel'}
    :pick([{co:'Brightwater Dental',country:'the UK',contact:'Helen Park',usd:96000,supplier:'Medline Supplies',dom:'medlinesupplies'},{co:'Kessler Logistik',country:'Germany',contact:'Jonas Weber',usd:240000,supplier:'Nordhafen Freight',dom:'nordhafenfreight'},{co:'Harbourline Foods',country:'Australia',contact:'Mia Grant',usd:132000,supplier:'Pacific Grains',dom:'pacificgrains'}]);
  const pol=story?'Honourable Kolawole Ajibade':'Honourable '+pick(HON_FIRST)+' '+pick(HON_LAST);
  const cs=baseCase({type:'yahoo',title:story?'Hustle Kingdom':`${nick} and the ${vic.supplier} invoice`,code:'EFC',people:P,db:P,gang:[C.id],C,gpattern,hk,vic,pol,landlord:story?'Alhaji Sule Maidoki':'Alhaji '+pick(['Musa','Sani','Ibrahim'])+' '+pick(['Maidoki','Gidado','Maigari','Usman']),
    landlordAt:{x:hk.x+hk.nx*2.5+t.x*6,z:hk.z+hk.nz*2.5+t.z*6},naira:Math.round(vic.usd*1490/1e6)*1e6,limit:900,fleeChance:{},roles:[[C,'The Chairman']],hide:{place,district:hk.district}});
  cs.lootText='42 laptops, 300 SIM cards and ₦18 million in cash seized';cs.lootDetail=`Forty-two laptops, 300 SIM cards, ₦18 million in cash and a notebook of "clients" in five countries were seized at ${place}.`;
  cs.intelLine='The landlord says the back gate by the gutter is never locked. They watch the front.';
  cs.scripts={[C.id]:{alibi:'Officer, I be businessman. I sell cars. Check my CAC. Those boys na my tenants, I no know wetin dem dey do.',correct:['ip','gwagon','rent'],
    crack:['...You think say na me get this game? I be small man for this thing.',`Every month, we pay ${pol}'s campaign. Twenty-five million. His boys bail us, and police no dey touch our house.`,'Who you think say dey protect Yahoo boys for this city? Na politics, my brother. Na politics.'],
    onCrack(){addEv(cs,'honLink',`Chairman: "We pay ${pol.replace('Honourable','Hon.')}"`,`${nick} says the fraud house pays ₦25 million a month to ${pol}'s campaign in exchange for protection.`,'Interrogation');SF(cs,'honLink');}}};
  cs.sub=ok=>cs.flags.paid?`${nick} walked out on "bail" the next morning. Forty-two laptops vanished from the exhibit room.`:ok?`"${nick}" and his boys are in custody. Interpol has the evidence it needs.`:`${nick} slipped away.`;
  cs.logs.push(`Interpol: ${vic.co} (${vic.country}) paid $${vic.usd.toLocaleString()} to a fake supplier account. The money was cashed out in Port Eko.`);
  if(story&&s.flags.hkLead)addEv(cs,'hkname','Picker: "Hustle Kingdom", Allen Estate',`${s.flags.muleName||'The picker'} said the "Chairman" runs a fraud house in Allen Estate called HK.`,'Chapter 1');
  if(story&&s.flags.tobiTip)addEv(cs,'tip','Tip: the blue-gate house','Tobi, the developer you let go at the checkpoint, says the Yahoo house in Allen Estate has a blue gate, Benz cars and a generator that never stops.','Informant');
  return cs;
}
function yahooEmails(cs){const v=cs.vic,good=`accounts@${v.dom}.com`,F=`accounts@${v.dom.replace('l','1').replace(/i/,'1')}.com`,usd='$'+v.usd.toLocaleString();return {eyebrow:`Interpol notice · ${v.co}, ${v.country}`,title:`Emails with "${v.supplier}"`,src:'Interpol',style:'chat',
  intro:`${v.co} paid its supplier, except the supplier never got the money. Flag what proves the emails were fake and where they came from.`,hint:'Compare the sender addresses letter by letter. Then look at the technical lines: the server headers say where an email was really sent from.',rows:[
  {who:good,t:'2 Sep 09:12',text:`Hi ${v.contact.split(' ')[0]}, attached is invoice ${v.supplier.slice(0,2).toUpperCase()}-2209 for last month's order. Payment terms as usual.`,k:'normal',why:'A genuine email from the real supplier. Their records match.'},
  {who:`${v.contact} · ${v.co}`,me:true,t:'2 Sep 10:03',text:`Thanks. Scheduling the ${usd} transfer for Friday.`,k:'normal',why:'The victim\'s reply. Nothing suspicious.'},
  {who:F,t:'4 Sep 06:47',text:`Hi ${v.contact.split(' ')[0]}, kindly note that due to an ongoing audit our bank details have changed. Kindly remit the ${usd} to our new account below. Kindly treat as urgent.`,k:'hit',ev:['spoof',`Spoofed address: ${F}`,`The "new bank details" email came from ${F}, with a number 1 in place of a letter. The real supplier never sent it.`]},
  {who:'Mail server · message headers',sys:true,t:'4 Sep 06:47',text:`Received: from [102.89.44.17] · ISP: Coastline Fibre · Location: ${cs.hk.district}, Port Eko`,k:'hit',ev:['ip',`Sent from ${cs.hk.district}, Port Eko`,`The fake email was sent through a Coastline Fibre connection in ${cs.hk.district}, Port Eko.`]},
  {who:F,t:'5 Sep 07:02',text:'Kindly confirm once payment is done so our team can proceed. God bless.',k:'normal',why:'"Kindly" and "God bless" are a local style, but you already know this account is fake.'},
  {who:'Moneyline P2P · compliance',sys:true,t:'6 Sep 14:20',text:`${v.usd.toLocaleString()} USDT sold for ${naira(cs.naira)} to buyers paying from 9 naira accounts. Statements attached.`,k:'hit',ev:['p2p',`${usd} sold for naira`,`The stolen dollars were turned into USDT and sold for ${naira(cs.naira)}. The naira statements are now on the MDT.`]},
]};}
function yahooGroup(cs){const N=cs.C.nick+' 👑';return {eyebrow:'Recovered phone · WhatsApp group',title:`"HK 👑 ${cs.C.nick} Boys"`,src:'Group chat',style:'chat',
  intro:'A picker\'s phone, seized last month, is still in this group. Flag what identifies the Chairman.',hint:'Ignore the celebrating. Look for who gives orders, what he calls himself, and anything that could be searched in Records.',rows:[
  {who:'Sharp Sharp',t:'6 Sep 15:01',text:`${cs.vic.country.replace('the ','').toUpperCase()} CLIENT DON PAY!!! 💰💰`,k:'normal',why:'The boys celebrating. It tells you who, not where.'},
  {who:N,t:'6 Sep 15:03',text:'Bring my 40% to HK tonight. Nobody use him own account, una hear? Use pickers.',k:'hit',ev:['nick',`The Chairman is "${cs.C.nick}"`,`The man who takes 40% of every scam goes by "${cs.C.nick}" and calls the house "HK".`]},
  {who:'Baba Fresh',t:'6 Sep 15:10',text:'Who dey follow me go club Friday? Na me dey pay 🍾',k:'normal',why:'Party talk. Nothing useful.'},
  {who:N,t:'6 Sep 18:44',text:`[Photo] My new G-Wagon 😎 Hustle no dey kill. (Plate visible: ${cs.gpattern})`,k:'hit',ev:['gwagon',`White G-Wagon, plate ${cs.gpattern}`,`${cs.C.nick} posted his new white G-Wagon. Partial plate ${cs.gpattern}. Search Records by nickname or plate.`]},
  {who:'Pablo',t:'7 Sep 09:12',text:'Landlord don come again o. Alhaji say rent dey due.',k:'normal',why:'The landlord wants rent. The bank statements will show who he is.'},
  {who:N,t:'7 Sep 09:15',text:'Tell Alhaji make e calm down. I don pay am two years 😂',k:'normal',why:'Two years\' rent, paid up front. Follow the money to find the house.'},
]};}
function yahooBank(cs){const a=cs.hk.address,n=cs.C.nick;return {eyebrow:'Financial intelligence unit',title:`Where the ${naira(cs.naira)} went`,src:'Bank',style:'table',cols:['Date','To','Type','Amount','Reference'],
  intro:'The nine accounts emptied into these payments within two days. Flag the one that finds the house.',hint:'Fraud houses are rented, and landlords like cash up front. Look for rent.',rows:[
  {cells:['6 Sep 14:22','9 picker accounts','P2P sale',cs.naira,'Moneyline P2P'],k:'normal',why:'The crypto sale itself. You already know about it.'},
  {cells:['6 Sep 16:40',`${n} Autos & Logistics`,'Transfer',95000000,'"Car purchase"'],k:'side',ev:['autos',`${n} Autos: ${cs.C.name}`,`₦95 million went to ${n} Autos & Logistics. Company registry: CEO ${cs.C.name}.`],then:()=>{cs.named[cs.C.id]=true;}},
  {cells:['6 Sep 17:05','Quilox Lounge','POS',4800000,'Bottle service'],k:'normal',why:'Champagne. A lot of it. Not a lead.'},
  {cells:['7 Sep 10:12',cs.landlord,'Transfer',12000000,`"2 yrs rent, ${a}"`],k:'hit',ev:['rent',`₦12m rent: ${a}`,`Two years' rent paid to ${cs.landlord} for ${a}, ${cs.hk.district}. That is the fraud house.`],then:()=>hkFound(cs)},
  {cells:['7 Sep 11:30',`${cs.pol.replace('Honourable ','')} Campaign Organisation`,'Transfer',25000000,'"Support"'],k:'side',ev:['campaign','₦25m to a politician\'s campaign',`₦25 million of fraud money went to the campaign of ${cs.pol}, a member of the State Assembly.`],then:()=>SF(cs,'campaign')},
  {cells:['7 Sep 13:00','Mama Ebuka Provisions','Transfer',350000,'Foodstuff'],k:'normal',why:'Groceries for the house.'},
  {cells:['8 Sep 08:10','12 POS agents','Cash out',6000000,'POS withdrawals'],k:'normal',why:'Cash pulled from POS agents across the city. Untraceable.'},
]};}
function hkFound(cs){if(cs.flags.hkKnown)return;cs.flags.hkKnown=true;cs.flags.hideout=true;setGPS(cs.hk.x,cs.hk.z,cs.hide.place);SFX.blip('radio');toast(`${cs.hide.place}: ${cs.hk.address}, ${cs.hk.district}. GPS set. SWAT is on standby.`,'good');}
function blueGate(cs){
  addEv(cs,'hkfound','Hustle Kingdom found',`${cs.hk.address}: a blue gate, a white G-Wagon and a generator running in the middle of the day.`,'Surveillance');hkFound(cs);
}
function landlordTalk(cs){
  const v=iMeshes.get('landlord');if(!v||!spend(cs,10))return;const A=cs.landlord;
  talkTo(v.g,[you('Alhaji, the boys in your house. Who are they?'),{name:A,text:'Officer, I no know anything o. Dem pay two years, cash. I no ask question. Na business.'},
    {name:A,text:'The front gate get camera, and one boy dey watch am all day. But the back gate by the gutter? Dem no dey lock am. Na there the boys dey pass go buy suya.'}],[{label:'Thank you, Alhaji.'}],()=>{
      cs.done.landlord=true;cs.flags.backIntel=true;addEv(cs,'backgate','Back gate is never locked','The landlord says the house watches the front gate on camera. The back gate by the gutter is never locked.','Witness');SFX.blip('good');});
}
function chairmanOffer(cs){
  const C=cs.C;const O=t=>({name:`${C.first} "${C.nick}" ${C.last}`,text:t});
  sitDown({shirt:'#e8e2d4',skin:cs.C.skin,hair:'#141010'},[O('Officer. You be sharp guy. I respect am.'),O('Make we talk like businessmen. Twenty thousand dollars, USDT. Give me any wallet address. In five minutes, e don land.'),O('Tomorrow my lawyer go bring bail paper. You no go see me again. Everybody happy.')],
    [{label:'It\'s all going on the record.',cls:'red'},{label:'Take the $20,000 (₦30 million)'}],ch=>{cs.flags.offerDone=true;
      if(ch.label.startsWith('Take')){takeBribe(30000000,25);cs.flags.paid=true;SF(cs,'yahooPaid');cs.lawyered[cs.C.id]=true;clog(cs,`You took $20,000 in USDT from ${C.nick}.`);}
      else{refuseBribe(10);addEv(cs,'bribeOffer','Attempted bribery, on record',`${C.nick} offered you $20,000 in USDT to let him walk. It is in your statement.`,'Interview');}
    });
}

// ---------- chapter 4: Ghost Project (politician and contract fraud)
const PROJECTS=[['Wharf End Primary Health Centre & Borehole',850000000,'health centre'],['Ebute Model Primary School',620000000,'school'],['Oja Market Stalls & Public Toilets',410000000,'market stalls'],['Allen Estate Youth Skills Centre',730000000,'skills centre'],['Orile Hills Solar Water Scheme',540000000,'water scheme']];
function genContract(opt={}){
  const P=makePeople(14);const rest=assignHomes(P);const D=P[0],H=P[1];const story=!!opt.story;
  const pj=story?PROJECTS[0]:pick(PROJECTS.slice(1));const proj={name:pj[0],sum:pj[1],what:pj[2]};
  const mansion=story?MANSION:rest[0];
  if(story)Object.assign(D,{first:'Sunday',last:'Okoro',name:'Sunday Okoro'});
  Object.assign(D,{age:ri(36,50),job:'Driver',prior:'None',tattoo:'None'});
  const hf=story?'Kolawole':pick(HON_FIRST),hl=story?'Ajibade':pick(HON_LAST);
  Object.assign(H,{id:'hon',first:hf,last:hl,name:`Hon. ${hf} ${hl}`,nick:'Owo',age:54,height:176,hair:HAIR[3],skin:'#4a2e1c',shirt:'#f2efe6',tattoo:'None',job:'Member, Port Eko House of Assembly',prior:'None',door:mansion,address:mansion.address,district:mansion.district});
  H.car={color:COLORS.find(c=>c.n==='Black')||COLORS[0],model:'Highlander',plate:'PEA-0'+ri(10,99)+'HL'};H.look={shirt:'#f2efe6',pants:'#f2efe6',skin:'#4a2e1c',hat:true,hatColor:pick(['#6b2d5a','#1f4fa0','#7a1f1f']),tall:1.02};
  const co=story?'Greenfield Dynamic Ventures Ltd':pick(['Bluepeak Integrated Services Ltd','Royal Mandate Ventures Ltd','Primecrest Global Concepts Ltd','Goldvine Allied Works Ltd']);
  const wife=story?'Bimpe Ajibade':`${pick(['Bimpe','Ngozi','Aisha','Tolani','Chioma'])} ${hl}`;
  const cs=baseCase({type:'contract',title:story?'Ghost Project':`The ${proj.name}`,code:'EFC',people:P,db:P.filter(p=>p!==H),gang:[D.id,H.id],D,H,C:H,proj,co,wife,mansion,limit:960,fleeChance:{[D.id]:.4},roles:[[D,'Company director'],[H,'Contract sponsor']]});
  cs.named[H.id]=true;
  cs.scripts={
    [D.id]:{alibi:'Me? Company director? Officer, I be driver. I no even get shoes wey reach director.',correct:['director','payments','shell'],
      crack:[`Na Oga ${hl}. Dem bring paper, I sign. Dem say na formality. Dem dash me two hundred thousand naira for my trouble.`,'Oga dey travel to Dubai on Friday. Him dey pack cash inside Ghana-must-go for the boys\' quarters.','Please, officer. I get four children.'],
      onCrack(){cs.flags.warrant=true;addEv(cs,'confession',`Director: "Oga ${hl} signed everything"`,`${D.name} says ${H.name} had him sign the company papers and is about to fly to Dubai with cash.`,'Interrogation');toast(`That's enough for a warrant. Arrest ${H.name} at home, ${H.district}.`,'good');}},
    [H.id]:{alibi:'This is political persecution! My opponents paid you. I will have your uniform by Monday.',correct:['payments','confession'],
      crack:['...Everybody does it. Everybody! You think I am the only one?','The Wharf Holdings money? That one no be for me. If you no pay the men at the port, nothing moves. Not one block.','Ask your own DPO who introduced me to them.'],
      onCrack(){addEv(cs,'dpoHint',`${hl}: "Ask your own DPO"`,`${H.name} says the payment to Wharf Holdings was protection money, and that your DPO introduced him to the people behind it.`,'Interrogation');}}};
  cs.sub=ok=>cs.flags.honPaid?`${H.name} flew to Dubai the next morning. The file was closed "for lack of evidence".`:ok?`${H.name} is in custody. Economic Crimes is seizing the Dubai apartment, and the ${proj.what} will finally be built.`:`${H.name} is still untouchable.`;
  cs.logs.push(`The ${naira(proj.sum)} ${proj.name}: "100% complete" on paper.`);
  return cs;
}
function contractDocs(cs){const D=cs.D,H=cs.H,P=cs.proj;return {eyebrow:'Ministry of Works · contract file',title:P.name,src:'Documents',style:'table',cols:['Document','What it says'],
  intro:'Compare the paperwork with what you know. Flag what proves the company is a front.',hint:'Check the dates against each other, and check who the company really is. Look at what each item is priced at.',rows:[
  {cells:['Contract award letter',`${naira(P.sum)}. Awarded 14 March. Approved by the committee chaired by ${H.name}.`],k:'normal',why:'The award itself is in order on paper.'},
  {cells:['Company registry (CAC)',`${cs.co}. Incorporated 10 March. Share capital ₦1,000,000.`],k:'hit',ev:['shell','Company formed 4 days before the award',`${cs.co} was registered on 10 March, four days before it won a ${naira(P.sum)} contract, with ₦1 million in share capital.`]},
  {cells:['Directors',`Sole director: ${D.name}. BVN occupation: "Driver, Office of ${H.name}".`],k:'hit',ev:['director',`Director: ${D.name}, ${H.last}'s driver`,`The sole director of ${cs.co} is ${D.name}, registered with his bank as a driver in ${H.name}'s office. Lives at ${D.address}, ${D.district}.`],then:()=>{cs.named[D.id]=true;}},
  {cells:['Bill of quantities',`Item 4: one solar borehole, ₦120,000,000.`],k:'side',ev:['inflated','Borehole priced at ₦120 million','A solar borehole costs ₦4–8 million. The bill of quantities inflates it at least fifteen times.']},
  {cells:['Completion certificate','"Project 100% complete." Signed 30 June by a Ministry of Works engineer.'],k:'normal',why:'The certificate says complete. Go and look at the site yourself.'},
  {cells:['Tax clearance','Valid tax clearance, 2023 to 2025.'],k:'normal',why:'Tax papers are in order. Front companies usually keep these clean.'},
]};}
function contractBank(cs){const H=cs.H,S=cs.proj.sum,pc=f=>Math.round(S*f/1e5)*1e5;return {eyebrow:'Financial intelligence unit',title:`${cs.co} · account activity`,src:'Bank',style:'table',cols:['Date','To','Type','Amount','Reference'],
  intro:'The government paid in full. Flag the payment that shows who the money was really for.',hint:`Ignore the campaign and the cash for now. Look for money going to a person close to ${H.name}.`,rows:[
  {cells:['15 Mar','From: Port Eko State Govt','Credit',S,'Full payment, up front'],k:'normal',why:'The contract payment. Paying 100% up front is unusual, but it\'s the government\'s mistake.'},
  {cells:['16 Mar','Aqua Drillers Ltd','Transfer',pc(.008),'Site works'],k:'normal',why:'The only payment for real work, under 1% of the contract. It was never finished.'},
  {cells:['16 Mar',cs.wife,'Transfer',pc(.36),'"Dubai apartment"'],k:'hit',ev:['payments',`${naira(pc(.36))} to ${H.last}'s wife`,`${cs.co} paid ${naira(pc(.36))} to ${cs.wife}, ${H.name}'s wife, for an apartment in Dubai.`]},
  {cells:['17 Mar','Wharf Holdings Ltd','Transfer',pc(.14),'"Logistics"'],k:'side',ev:['wharf',`${naira(pc(.14))} to Wharf Holdings`,`${naira(pc(.14))} went to Wharf Holdings Ltd, a port company with no part in the project. That name again.`],then:()=>SF(cs,'wharf')},
  {cells:['18 Mar',`${H.last} Campaign Organisation`,'Transfer',pc(.05),'"Mobilisation"'],k:'normal',why:'Campaign money. Ugly, but the bigger payment went somewhere personal.'},
  {cells:['20 Mar','Cash · 19 withdrawals','Cash',pc(.11),'Counter withdrawals'],k:'normal',why:'Cash. Suspicious, but you can\'t prove where it went.'},
]};}
function siteInspect(cs){
  if(!spend(cs,15))return;const x=LOC.site.x,z=LOC.site.z;pl.x=x-1.5;pl.z=z-8;pl.mesh.position.set(pl.x,.2,pl.z);
  startCine({snap:true,pos:V3(x-4,2.3,z-5),look:V3(x+8,1,z+9),fov:50});
  dialog([you(`"${cs.proj.name}. Commissioned 30 June."`),you(`A signboard. A cracked foundation slab with grass growing through it. Two goats. No walls, no ${cs.proj.what}, nothing.`),you(`${naira(cs.proj.sum)}.`)],[{label:'Photograph everything'}],()=>{
    endCine();cs.done.site=true;addEv(cs,'site','The site: nothing was built',`Photos of the "completed" ${cs.proj.what}: a signboard and an overgrown foundation slab. Nothing was built.`,'Site visit');SFX.blip('good');});
}
function iyalojaTalk(cs){
  const v=iMeshes.get('iyaloja');if(!v)return;const low=career.rep<30;if(!spend(cs,low?25:10))return;const R=t=>({name:'Mama Ronke · Iyaloja',text:t});
  const lines=[you('Good afternoon, ma. I\'m with Division 9. I want to ask about the health centre.')];
  if(low)lines.push(R('Police? Una don come collect your own share too?'),you('No, ma. I want to know where the money went.'));
  lines.push(R(`${cap(cs.proj.what)}? Which ${cs.proj.what}? You dey see am? Na grass and goat dey there.`),R('Dem come here with drummers and cameras. Honourable cut ribbon, dash everybody rice and five thousand naira. Since then, nothing.'),
    R(cs.proj.what==='health centre'?'Last month one woman born for that road, because the nearest clinic is in Ebute. The baby no survive. Write that one for your book.':'Our children still dey suffer. Na the same people go come beg for vote next year. Write that one for your book.'));
  talkTo(v.g,lines,[{label:'Add to the case file'}],()=>{cs.done.iyaloja=true;addEv(cs,'community','Iyaloja: "Nothing was ever built"','The market leader watched the ribbon-cutting. Nothing was built afterwards, and the community is still paying the price.','Witness');SFX.blip('good');});
}
function honDoor(cs){
  const v=iMeshes.get('hon');if(!v)return;const H=cs.H;const L=t=>({name:H.name,text:t});
  if(!cs.flags.warrant){talkTo(v.g,[you(`${H.name}. Division 9. I have some questions about the ${cs.proj.name}.`),L('Constable, you are standing on private property. Come back with a warrant, if anyone in this state will sign one for you.')],[{label:'Leave'}],()=>{
    toast('You need a warrant: the director\'s confession, or the site, his director and the money trail together.');});return;}
  talkTo(v.g,[you(`${H.name}, I have a warrant for your arrest for the theft of ${naira(cs.proj.sum)} meant for the ${cs.proj.name}.`),
    L('Do you know who I am? I have the Commissioner of Police on speed dial. Your DPO eats at my table.'),
    {name:'Radio · CSP Coker',text:`Constable ${OFF().last}, stand down. That is a direct order. Walk away from that house.`},
    L('You heard your oga. Look, let us not be enemies. Thirty million naira and a posting to any division you want. My PA will bring it tonight.')],
    [{label:'You\'re under arrest, sir.',cls:'red'},{label:'Take the ₦30,000,000'},{label:'Walk away for now',cls:'ghost'}],ch=>{
      if(ch.label.startsWith('Take')){takeBribe(30000000,30);cs.flags.honPaid=true;SF(cs,'honPaid');clog(cs,`You took ₦30 million from ${H.name}. He flew to Dubai the next morning.`);return;}
      if(ch.label.startsWith('Walk'))return;
      if(!cs.flags.honRefused){cs.flags.honRefused=true;refuseBribe(12);}
      clog(cs,`${H.name} ran for his car.`);
      setTimeout(()=>startCarChase(cs,H,cs.mansion,()=>{toast(`${H.last}'s driver lost you. His people say he will be back home tonight.`,'bad');spend(cs,60);}),500);
    });
}

// ---------- the leads board for every case type
function leads(cs){
  if(!['romance','yahoo','contract','homicide'].includes(cs.type))return leadsBase(cs);
  const L=[];const inC=id=>cs.custody.includes(id);const at=(p,label)=>({x:p.x,z:p.z,label});const ev=id=>cs.evidence.some(e=>e.id===id);
  const file=(key,t,d,c,cfg)=>{if(!cs.done[key])L.push({t,d,c:cs.done[key+'Open']?0:c,run:()=>openFile(cs,key,cfg()),onRun:()=>{cs.done[key+'Open']=true;}});};
  if(prisoner)L.push(prisonerLead(at));
  cs.custody.forEach(id=>{if(!cs.cracked[id]&&!cs.lawyered[id]&&cs.scripts[id]){const p=person(cs,id);L.push({t:`Interrogate ${p.name}`,d:'Interview room at the station entrance.',c:20,at:at(LOC.interview,'Interview room'),hot:true});}});
  if(cs.type==='romance'){const M=cs.M;
    file('chats','Read Grace\'s chats with "Captain James"','Flag the messages that give the scammer away.',15,()=>romanceChats(cs));
    if(ev('acct')&&!cs.done.kyc)L.push({t:'Request the account holder\'s KYC',d:'Firststone Bank has to tell us who opened the account.',c:20,run:()=>{closeModal();kycLookup(cs);}});
    if(cs.named[M.id]&&!inC(M.id)&&!cs.flags.paid)L.push({t:`Arrest ${M.name}`,d:`${M.address}, ${M.district}. He may run.`,at:at(M.door,M.name+'\'s home'),pid:M.id,hot:true});
  }else if(cs.type==='yahoo'){const C=cs.C;
    if(cs.flags.hideout&&!inC(C.id))L.push({t:`Raid ${cs.hide.place}`,d:`${cs.hk.address}, ${cs.hk.district}. Arrest "${C.nick}".`,at:at(cs.hk,cs.hide.place),hot:true});
    if(ev('tip')&&!cs.flags.hkKnown)L.push({t:'Find the blue-gate house',d:'Tobi\'s tip: Allen Estate, blue gate, generator running all day.',at:at(LOC.bluegate,'Blue-gate house, Allen Estate')});
    file('emails','Read the Interpol file','Emails between the Canadian firm and its "supplier".',15,()=>yahooEmails(cs));
    file('group','Read the fraud house group chat','From a picker\'s phone. Find the Chairman.',15,()=>yahooGroup(cs));
    if(ev('p2p'))file('bank',`Follow the ${naira(cs.naira)}`,'The naira side of the crypto sale.',30,()=>yahooBank(cs));
    if(cs.flags.hkKnown&&!cs.done.landlord&&!inC(C.id))L.push({t:'Talk to the landlord',d:`${cs.landlord} collected two years' rent in cash.`,c:10,at:at(cs.landlordAt,'Landlord')});
    if(cs.flags.hkKnown&&!cs.flags.hideout&&!inC(C.id))L.push({t:`Stake out ${cs.hide.place}`,d:`Wait for ${C.nick} to come back.`,c:60,run:()=>{closeModal();cs.flags.hideout=true;toast(`${C.nick}'s G-Wagon is back. SWAT is on standby.`,'good');}});
  }else if(cs.type==='homicide'){homicideLeads(cs,L,at,ev,inC);
  }else{const {D,H}=cs;
    if(!inC(H.id)&&!cs.flags.honPaid)L.push({t:cs.flags.warrant?`Arrest ${H.name}`:`${H.name}'s residence`,d:cs.flags.warrant?`You have a warrant. ${H.district}.`:'You need a warrant: the director\'s confession, or the site, the director and the money trail.',at:at(cs.mansion,H.last+' residence'),hot:!!cs.flags.warrant,info:!cs.flags.warrant});
    if(!cs.done.site)L.push({t:'Inspect the project site',d:'Wharf End, by the park. The records say "100% complete".',c:15,at:at(LOC.site,'Project site')});
    if(!cs.done.iyaloja)L.push({t:'Talk to the Iyaloja',d:'Mama Ronke leads the Wharf End market women.',c:10,at:at(LOC.iyaloja,'Iyaloja')});
    file('docs','Check the contract file','Award letter, company registry, bill of quantities, completion certificate.',20,()=>contractDocs(cs));
    if(cs.done.docs)file('bank',`Follow the ${naira(cs.proj.sum)}`,`${cs.co}'s bank statement.`,30,()=>contractBank(cs));
    if(cs.named[D.id]&&!inC(D.id))L.push({t:`Arrest ${D.name}`,d:`The "director" of ${cs.co}. ${D.address}, ${D.district}.`,at:at(D.door,D.name+'\'s home'),pid:D.id});
  }
  L.push({t:'Search the records database',d:'Match clues to a person, set GPS to their home and arrest them there.',db:true});
  return L;
}

// ---------- story conversations, chapter by chapter
function storyTalk(who){
  const s=ST();const v=iMeshes.get('story_'+who);const st=curStep();if(!v||!st)return;const npc=v.g;const first=OFF().first,last=OFF().last;
  const next=()=>nextStep();const G=t=>({name:'Mrs. Grace Eze',text:t}),O=t=>({name:'Barr. Chuks Ogidi',text:t});
  const SC={
    c1_brief:()=>talkTo(npc,[bisi(`So you be the new constable. ${first} ${last}, abi? Welcome to Division 9.`),
      bisi('Let me tell you the truth before anybody else does. This city no trust police. When people see this uniform, they hold their pocket.'),
      you('I came here to do the job properly, Sergeant.'),
      bisi(`Good talk. Today na traffic duty. Anybody wey pass ${LIMIT} km/h, jump red light, or the plate reader flag, stop them and check their papers. Three stops, then come back.`),
      bisi(`And ${first}... somebody go try settle you today. What you do for that moment, na who you be.`)],
      [{label:'Yes, Sergeant.'}],()=>{s.flags.forceBribe=true;nextStep();toast('Get in your cruiser (F) and find a speeder.');}),
    c1_after:()=>talkTo(npc,[bisi(s.taken>0?'I hear say you collect for that junction. Hmm. E dey start small, my dear. E always dey start small.':'One driver dey tell everybody for that junction say one officer no gree collect. Na so trust dey start.'),
      bisi('Before you rest: that woman by the entrance don dey cry since morning. Mrs. Grace Eze. Three counters don send her away. Go and hear her.')],[{label:'I\'ll talk to her.'}],next),
    c1_grace:()=>talkTo(npc,[G('Officer, thank God. Three counters don send me away today.'),
      G('I met a man on Facebook. Captain James Walker, an American army surgeon in Syria. Eight months, he called me every night. He said he would retire and marry me.'),
      G('Last week his gold box got stuck at customs. He begged me. I sent three point two million naira. My pension. All of it.'),
      G('Since then his line is off. My children say I\'m a foolish old woman. Officer, am I a fool?'),
      you('No, ma. You were targeted by professionals. Let me see the chats.'),G('Here. Take my phone. Please, just find the person.')],
      [{label:'Open a case'}],()=>startStoryCase(makeCase('romance',null,{story:1}))),
    c1_end:()=>talkTo(npc,[
      s.flags.mulePaid?bisi('That boy\'s mother paid you, abi? Grace Eze came back today. I no fit look her for eye.'):bisi(`${s.flags.muleName||'The account holder'} dey cell, and Firststone don freeze the account. Grace go get some of her money back. She say make I thank you.`),
      bisi('That account na small fish. Dem dey call them "pickers". The real Yahoo boys dey hide behind them.'),
      ...(s.flags.hkLead?[you('He talked about a "Chairman". A house in Allen Estate they call HK.'),bisi('Hustle Kingdom. I don hear that name before. Write am down.')]:[]),
      bisi('Bad things dey happen for this city. Kidnapping, bank robbery, fraud. And everybody dey whisper one name: Harmattan.'),
      bisi('Nobody don see am. Go rest. Tomorrow, the DPO wants to see you.')],[{label:'Continue'}],next),
    c2_brief:()=>{const cs=makeCase('robbery',null,{story:1});talkTo(npc,[coker(`Constable ${last}. Stand at ease. This will not take long.`),
      coker(`${cs.bank} was robbed last night. Fourteen point eight million naira. Three men, one getaway car.`),
      coker('My senior officers are busy with a VIP visit, so the case is yours. Do not embarrass this division.'),
      coker('And Constable: every file, every lead, you bring it to me first. To me. Personally.')],[{label:'Yes, sir.'}],()=>startStoryCase(cs));},
    c2_debrief:()=>talkTo(npc,[coker('Good work, Constable. The press is happy, the bank is happy. I am happy.'),
      coker('There is a gentleman waiting for you by the car park. A lawyer. Be polite to him.')],[{label:'Go and see him'}],next),
    c2_lawyer:()=>talkTo(npc,[O('Officer! Good evening. Barrister Chuks Ogidi. I represent the interests of... let us say, a businessman.'),
      O('That plate number from the bank camera, eh? Cameras make mistakes. Evidence gets lost. It happens every day in this country.'),
      O('Two million naira. Cash. Tonight. Nobody needs to know.')],
      [{label:'No. Leave my station.'},{label:'Take the ₦2,000,000',cls:'red'}],ch=>{
        if(ch.label.startsWith('Take')){takeBribe(2000000,25);s.flags.lawyerBribe=true;toast('The next morning the ringleader walks out on bail. "Missing evidence."','bad');}
        else{refuseBribe(10);toast('Barrister Ogidi smiles. "Harmattan does not forget faces, Officer."');}
        next();}),
    c2_sweep:()=>sweepScene(npc),
    c2_end:()=>talkTo(npc,s.flags.tobiTip?[bisi('I hear wetin you do for that checkpoint. Bulus dey shout for the DPO office since. Good. "Sweep" na extortion with a nice name.'),
        you('One of the boys told me about a house in Allen Estate. Blue gate. They call it HK.'),bisi('Hustle Kingdom again. Okay. Tomorrow we go after the real Yahoo boys, not boys with laptops.')]
      :[bisi('Operation Sweep. Hmm. Every year dem give extortion a new name.'),bisi(s.flags.sweep===0?'Those boys go remember your face. So go the whole street wey dey film.':'At least you no follow Bulus all the way.'),
        bisi('Tomorrow we go after real fraudsters, not boys with laptops.')],[{label:'Continue'}],next),
    c3_brief:()=>talkTo(npc,[bisi('Interpol sent us a file. A steel company in Canada paid one hundred and eighty thousand dollars to "their supplier". The supplier never got it.'),
      bisi('The money landed in Port Eko and vanished into nine accounts in one hour. Na Yahoo work, but this one no be small boys. This is organised.'),
      ...(s.flags.hkLead||s.flags.tobiTip?[bisi('And everything dey point to that house you heard about. Hustle Kingdom, Allen Estate.')]:[]),
      bisi('Economic Crimes is short of hands, so na you and me. Read the emails, follow the money, find the Chairman.')],[{label:'Let\'s go.'}],()=>startStoryCase(makeCase('yahoo',null,{story:1}))),
    c3_end:()=>talkTo(npc,[s.flags.yahooPaid?bisi('The Chairman don waka out on "bail". The laptops sef don disappear from the exhibit room. I wonder who settle who.'):bisi('Odogwu and his boys dey cell. Forty-two laptops for exhibit room. Interpol is very happy with us.'),
      ...(s.flags.honLink?[bisi('And wetin he talk for the interview room... Honourable Kolawole Ajibade? The Works Committee chairman? Ehn.'),you('He says the Yahoo money funds Ajibade\'s campaign, and Ajibade\'s people protect them.')]
        :[bisi('One payment from that money worry me: twenty-five million naira to the Ajibade Campaign Organisation. Honourable Kolawole Ajibade.')]),
      bisi('If we go near a politician, we need more than one payment. Rest. Tomorrow we look at what Ajibade does with government money.')],[{label:'Continue'}],next),
    c4_brief:()=>talkTo(npc,[bisi('I pulled Honourable Ajibade\'s contracts. Last year his committee paid eight hundred and fifty million naira for a health centre and borehole in Wharf End.'),
      bisi('Government records say completed, commissioned, one hundred percent. My sister lives in Wharf End. She still buys water from the mai ruwa.'),
      bisi('Go to the site. Talk to the market women. Pull the contract file. But first, the DPO wants you. Somebody don already talk.')],[{label:'On my way.'}],next),
    c4_coker:()=>talkTo(npc,[coker('Constable. I hear you are digging into Honourable Ajibade. He donated six patrol vans to this division. He is a friend of the police.'),
      coker('Elections are in four months. Nobody needs a scandal. Do you understand me?')],
      [{label:'Yes, sir. I understand.'},{label:'With respect, sir, I\'ll follow the evidence.'}],ch=>{
        if(ch.label.startsWith('Yes')){dialog([you('(to yourself) I understand perfectly.')],[{label:'Start the case quietly'}],()=>{endCine();startStoryCase(makeCase('contract',null,{story:1}));});}
        else{s.flags.cokerDefied=true;dialog([coker('Then follow it carefully, Constable. Evidence has a way of... getting lost.')],[{label:'Start the case'}],()=>{endCine();startStoryCase(makeCase('contract',null,{story:1}));});}
        return true;}),
    c4_end:()=>talkTo(npc,[s.flags.honPaid?bisi('Ajibade don fly to Dubai. Wharf End still dey buy water. And you... you get new phone, abi?'):bisi('Honourable Kolawole Ajibade in a cell. You should see Wharf End today. The market women dey dance for road.'),
      bisi(s.flags.wharf?'But look this one again. A hundred and twenty million naira from Greenfield to Wharf Holdings. Wharf Holdings again.':'Economic Crimes found one more payment: a hundred and twenty million naira to Wharf Holdings. Wharf Holdings again.'),
      bisi('Every road for this city dey lead back to that wharf. And now my people for the market say kidnapping season don start.')],[{label:'Continue'}],next),
    c5_brief:()=>{const cs=makeCase('kidnap',null,{story:1});talkTo(npc,[coker(`A child was taken outside ${cs.school}. ${cs.victim.first} ${cs.victim.last}, ${cs.victim.age} years old.`),
      coker('The family has already paid a ransom and the kidnappers are still holding the child. This is Harmattan\'s style.'),
      coker('Find the child. And Constable: raid plans come to my desk before anybody moves.')],[{label:'Yes, sir.'}],()=>startStoryCase(cs));},
    c5_end:()=>talkTo(npc,[bisi(`${s.flags.victim||'The child'} is home. You did well, ${first}.`),
      bisi('But the SWAT commander told me something. The kidnappers were already packing to move, like somebody called them just before you arrived.'),
      bisi('Only people inside this station knew that raid was happening.'),you('Someone in Division 9 is selling us out.'),
      bisi('Somebody for this station dey sell us. I want you to find out who. Quietly. Trust nobody... except maybe me.')],[{label:'Continue'}],next),
    c6_brief:()=>{const cs=makeCase('leak',null,{story:1});talkTo(npc,[bisi('Three people had access to that raid file: CSP Coker, Desk Sergeant Musa Danladi and Inspector Ifeoma Nwosu.'),
      bisi('Check the evidence-room log. Pull the car park camera from the night before the raid. Follow the money.'),
      bisi('When you are sure, bring the person to the interview room. If you accuse the wrong officer, this whole station go turn against you.')],[{label:'I\'ll find them.'}],()=>startStoryCase(cs));},
    c6_end:()=>talkTo(npc,s.flags.cokerArrested?[bisi('CSP Olatunde Coker. Twenty-two years in uniform. Hmm. This one pain me.'),
        bisi('He gave us everything. Harmattan runs it all from Wharf Warehouse 7: the kidnappings, the Yahoo money, Ajibade\'s "logistics". Real name: Felix Ugorji.'),
        bisi(`People for the market dey talk about you, ${first}. Some of them want to help.`)]
      :[bisi('Coker dey walk free, and you dey count money. I no fit pretend say I no know.'),bisi('The address na Wharf Warehouse 7. Felix Ugorji. Go finish am. But no expect the market to talk to you.')],[{label:'Continue'}],next),
    c7_brief:()=>{const help=career.rep>=55&&!s.flags.tipped;const cs=makeCase('finale',null,{story:1});cs.flags.informant=help;talkTo(npc,[bisi('This is it. Harmattan. Felix Ugorji. SWAT is ready when you are.'),
      ...(help?[bisi('One market woman, Iya Risi, sent word. She says she knows how dem dey guard that warehouse. See her first.')]:[bisi('Nobody for the market wan talk to us. We go in blind.')]),
      you('Let\'s finish it.')],[{label:'Move out'}],()=>startStoryCase(cs));},
  };
  (SC[st.id]||(()=>{}))();
}

// ---------- ending: every choice you made, chapter by chapter
function showEnding(){
  $('#toasts').innerHTML='';const s=ST(),f=s.flags,t=career.rep;let title,body;
  if(t>=70&&s.taken===0){title='The People\'s Officer';body='Harmattan is in a cell, and his ledgers are bringing down the people who protected him: a DPO, a lawmaker and a Yahoo chairman. At the commendation parade, Sergeant Bisi Okafor pins the medal on you herself. Market women wave when your cruiser passes. In Port Eko, that is rarer than any medal.';}
  else if(t>=45){title='A Good Officer';body='The syndicate is finished. You made mistakes and some compromises, but Port Eko noticed the constable who kept going when it would have been easier to stop. Bisi says you\'ll make Inspector one day. She means it.';}
  else{title='Part of the System';body=`Harmattan is in custody and the newspapers love you. You also have ${naira(s.cash)} you can't explain. Bisi stops returning your calls. Somewhere in Port Eko, a new name is already being whispered.`;}
  const rows=[['Captain James Walker',f.mulePaid?'You let the picker go for ₦100,000.':'The picker was arrested. Grace Eze got part of her pension back.'],
    ['Operation Sweep',f.sweep===2?'You protected two innocent young men.':f.sweep===1?'You protected one of the two young men.':'You went along with the sweep.'],
    ['Hustle Kingdom',f.yahooPaid?'Odogwu bought his way out.':'Odogwu and his boys were convicted.'],
    ['Ghost Project',f.honPaid?'Hon. Ajibade escaped to Dubai.':'Hon. Ajibade was charged. The health centre is finally being built.'],
    ['Inside Man',f.cokerArrested?'CSP Coker was arrested.':'CSP Coker paid you and kept his job.'],
    ['Harmattan','Felix Ugorji is in custody.']];
  logEntry(`Story complete: "${title}". Trust ${t}, ${s.refused} bribes refused, ${s.taken} taken.`);
  const el=openModal(`<div class="report"><div class="eyebrow">Eko Nights · ending</div><h1>${esc(title)}</h1><p class="muted" style="max-width:60ch">${esc(body)}</p>
    <dl class="stats" style="grid-template-columns:repeat(4,1fr);margin:16px 0"><div><dt>Public trust</dt><dd>${t}</dd></div><div><dt>Bribes refused</dt><dd>${s.refused}</dd></div><div><dt>Bribes taken</dt><dd>${s.taken}</dd></div><div><dt>Money taken</dt><dd>${naira(s.cash)}</dd></div></dl>
    <ul class="results">${rows.map(([k,v])=>`<li class="${/let|bought|escaped|went along|paid you/.test(v)?'bad':'good'}"><b>${esc(k)}:</b> ${esc(v)}</li>`).join('')}</ul>
    <div class="row end"><button class="btn" id="eOk">Keep patrolling Port Eko</button></div></div>`,{dismiss:false});
  $('#eOk',el).onclick=closeModal;
}

function makeGoat(c){
  const g=new THREE.Group(),m=lam(c),B=(w,h,d,x,y,z,mat=m)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);b.position.set(x,y,z);g.add(b);return b;};
  B(.36,.34,.8,0,.55,0);B(.2,.24,.32,0,.82,.48);B(.06,.14,.06,-.06,1,.42,lam('#2a2a2a'));B(.06,.14,.06,.06,1,.42,lam('#2a2a2a'));
  for(const [lx,lz] of [[-.12,.3],[.12,.3],[-.12,-.3],[.12,-.3]])B(.07,.4,.07,lx,.2,lz);
  g.traverse(o=>{if(o.isMesh)o.castShadow=QUAL.shadows;});return g;
}
// ---------- 3D dressing: the ghost project site, Hustle Kingdom, the Honourable's house, the checkpoint
const SITE_BOARD={};
function drawSiteBoard(cs){
  const g=SITE_BOARD.g;if(!g)return;const P=cs?cs.proj:{name:'Wharf End Primary Health Centre & Borehole',sum:850000000};const co=cs?cs.co:'Greenfield Dynamic Ventures Ltd',sp=cs?cs.H.name:'Hon. Kolawole Ajibade';
  g.fillStyle='#f4f1e6';g.fillRect(0,0,512,300);g.fillStyle='#0b8a3c';g.fillRect(0,0,512,56);g.fillRect(0,272,512,28);
  g.fillStyle='#fff';g.font='800 30px Saira Condensed, Arial Narrow, sans-serif';g.textAlign='center';g.fillText('PORT EKO STATE GOVERNMENT',256,40);
  const words=P.name.toUpperCase().split(' ');let l1='',l2='';words.forEach(w=>{if((l1+' '+w).length<26&&!l2)l1=(l1+' '+w).trim();else l2=(l2+' '+w).trim();});
  g.fillStyle='#13285a';g.font='800 34px Saira Condensed, Arial Narrow, sans-serif';g.fillText(l1,256,100);g.fillText(l2,256,138);
  g.fillStyle='#222';g.font='600 21px Arial, sans-serif';g.fillText('Contract sum: '+naira(P.sum),256,180);g.fillText('Contractor: '+co,256,210);g.fillText('Facilitated by '+sp,256,240);
  g.fillStyle='#c1361f';g.font='800 22px Arial, sans-serif';g.fillText('COMMISSIONED 30 JUNE',256,293);if(SITE_BOARD.tex)SITE_BOARD.tex.needsUpdate=true;
}
function buildStoryProps(){
  const x=LOC.site.x,z=LOC.site.z;
  const slab=sh(new THREE.Mesh(new THREE.BoxGeometry(13,.4,10),lam('#8f8f88')),true,true);slab.position.set(x+10,.2,z+8);scene.add(slab);
  const rebar=new THREE.InstancedMesh(new THREE.CylinderGeometry(.03,.03,1.4,4),lam('#6a3a22'),24);const dm=new THREE.Object3D();
  for(let i=0;i<24;i++){const e=i%4;const u=Math.floor(i/4)/5;dm.position.set(x+10+(e<2?(e?6.2:-6.2):(u-.5)*12),1.05,z+8+(e>=2?(e===2?4.7:-4.7):(u-.5)*9));dm.rotation.set(rnd(-.2,.2),0,rnd(-.2,.2));dm.updateMatrix();rebar.setMatrixAt(i,dm.matrix);}
  scene.add(rebar);
  const grass=new THREE.InstancedMesh(new THREE.ConeGeometry(.25,.6,5),lam('#5d7a3a'),30);
  for(let i=0;i<30;i++){dm.position.set(x+10+rnd(-6,6),.6,z+8+rnd(-4.5,4.5));dm.rotation.set(0,0,0);dm.updateMatrix();grass.setMatrixAt(i,dm.matrix);}scene.add(grass);
  for(const dz of [-1.8,1.8]){const p=new THREE.Mesh(new THREE.BoxGeometry(.14,3.4,.14),lam('#3a3a3a'));p.position.set(x+1,1.7,z+dz);scene.add(p);}
  const [c,g]=mkC(512,300);g.fillStyle='#f4f1e6';g.fillRect(0,0,512,300);g.fillStyle='#0b8a3c';g.fillRect(0,0,512,56);g.fillRect(0,272,512,28);
  g.fillStyle='#fff';g.font='800 30px Saira Condensed, Arial Narrow, sans-serif';g.textAlign='center';g.fillText('PORT EKO STATE GOVERNMENT',256,40);
  g.fillStyle='#13285a';g.font='800 34px Saira Condensed, Arial Narrow, sans-serif';g.fillText('WHARF END PRIMARY HEALTH',256,100);g.fillText('CENTRE & BOREHOLE',256,138);
  g.fillStyle='#222';g.font='600 21px Arial, sans-serif';g.fillText('Contract sum: ₦850,000,000',256,180);g.fillText('Contractor: Greenfield Dynamic Ventures Ltd',256,210);g.fillText('Facilitated by Hon. Kolawole Ajibade',256,240);
  g.fillStyle='#c1361f';g.font='800 22px Arial, sans-serif';g.fillText('COMMISSIONED 30 JUNE',256,293);
  SITE_BOARD.c=c;SITE_BOARD.g=g;SITE_BOARD.tex=ctex(c);
  const board=new THREE.Mesh(new THREE.PlaneGeometry(4.4,2.6),new THREE.MeshLambertMaterial({map:SITE_BOARD.tex}));board.position.set(x+.9,2.4,z);board.rotation.y=-Math.PI/2;scene.add(board);
  const back=new THREE.Mesh(new THREE.BoxGeometry(.06,2.6,4.4),lam('#2a2a2a'));back.position.set(x+.96,2.4,z);scene.add(back);
  for(let i=0;i<2;i++){const goat=makeGoat(i?'#3a2a1e':'#e8e2d4');goat.position.set(x+7+i*4,.4,z+13-i*6);goat.rotation.y=i*2.1+.4;scene.add(goat);}
  // Hustle Kingdom: blue gate, white G-Wagon, a generator that never stops
  const hk=HK_DOOR,ht=_tan(hk),hh=Math.atan2(ht.x,ht.z);
  const gate=new THREE.Mesh(new THREE.BoxGeometry(3.6,2.2,.12),lam('#1f4fa0'));gate.position.set(hk.x+hk.nx*.4+ht.x*3.6,1.1,hk.z+hk.nz*.4+ht.z*3.6);gate.rotation.y=Math.atan2(hk.nx,hk.nz);scene.add(gate);
  const gw=makeCarMesh('#f0f0f0','G-Wagon',false,false);gw.position.set(hk.x+hk.nx*5+ht.x*-3,0,hk.z+hk.nz*5+ht.z*-3);gw.rotation.y=hh;scene.add(gw);
  const gen=sh(new THREE.Mesh(new THREE.BoxGeometry(1.2,.9,.8),lam('#c9a227')),true,false);gen.position.set(hk.x+hk.nx*1.6-ht.x*6,.65,hk.z+hk.nz*1.6-ht.z*6);scene.add(gen);
  BOXES.push({x0:gw.position.x-2.6,x1:gw.position.x+2.6,z0:gw.position.z-2.6,z1:gw.position.z+2.6,h:2});
  // the Honourable's house: black SUV and a gold gate
  const m=MANSION,mt=_tan(m);
  const suv=makeCarMesh('#16181d','Highlander',false,false);suv.position.set(m.x+m.nx*5+mt.x*3.5,0,m.z+m.nz*5+mt.z*3.5);suv.rotation.y=Math.atan2(mt.x,mt.z);scene.add(suv);
  BOXES.push({x0:suv.position.x-2.6,x1:suv.position.x+2.6,z0:suv.position.z-2.6,z1:suv.position.z+2.6,h:2});
  const gg=new THREE.Mesh(new THREE.BoxGeometry(3.6,2.4,.12),std('#c9a227',.35,.6));gg.position.set(m.x+m.nx*.4-mt.x*3.6,1.2,m.z+m.nz*.4-mt.z*3.6);gg.rotation.y=Math.atan2(m.nx,m.nz);scene.add(gg);
  // checkpoint cones on Allen Avenue
  const cone=new THREE.InstancedMesh(new THREE.ConeGeometry(.22,.7,10),lam('#ff6a1a'),6);
  for(let i=0;i<6;i++){dm.position.set(LOC.checkpoint.x+2.6,.55,LOC.checkpoint.z-4+i*2.4);dm.rotation.set(0,0,0);dm.updateMatrix();cone.setMatrixAt(i,dm.matrix);}scene.add(cone);
}


