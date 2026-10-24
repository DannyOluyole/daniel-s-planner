// ================= modal (MDT tablet, citation book, case screens)
const keys={up:0,down:0,left:0,right:0,sprint:0,horn:0};
function openModal(html,{wide=false,dismiss=true,side=false,tablet=false}={}){
  const m=$('#modal');if(m._cleanup){m._cleanup();m._cleanup=null;}
  m.className='modal'+(side?' side':'');
  m.innerHTML=`<div class="sheet${wide?' wide':''}${tablet?' tablet':''}" role="dialog" aria-modal="true">${html}</div>`;m.hidden=false;
  m.onclick=e=>{if(dismiss&&e.target===m)closeModal();};
  m._dismiss=dismiss;
  for(const k in keys)keys[k]=0;SFX.horn(false);
  return m.firstElementChild;
}
function closeModal(){const m=$('#modal');m.hidden=true;m.innerHTML='';m.className='modal';if(m._cleanup){m._cleanup();m._cleanup=null;}}
const modalOpen=()=>!$('#modal').hidden;
const blockingModal=()=>modalOpen()&&!$('#modal').classList.contains('side');

// ================= game state
let curCase=null,nextCases=null,worldMin=8*60+30,gps=null,gpsPerson=null,prisoner=null,started=false;
const shift={stops:0,tickets:0,warnings:0,arrests:0,xp:0};
function freshCases(){nextCases={robbery:genRobbery(),kidnap:genKidnap()};}
function clockStr(cs,m=cs.used){const t=cs.startMin+m;const day=1+Math.floor(t/1440);const hh=Math.floor(t%1440/60),mm=Math.floor(t%60);return `Day ${day} · ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;}
const curMin=()=>curCase?curCase.startMin+curCase.used:worldMin;
function worldClock(){const t=curMin();const day=1+Math.floor(t/1440);return `Day ${day} · ${String(Math.floor(t%1440/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;}
function spend(cs,min){
  cs.used+=min;
  if(cs.used>=cs.limit){cs.used=cs.limit;closeModal();endCase(cs,'timeout');return false;}
  return true;
}
// the game's own routes are "auto" and follow the case; a route the player picks in the MDT stays until they get there
function setGPS(x,z,label,pid=null,manual=false){gps={x,z,label,auto:!manual};gpsPerson=pid;routeT=0;}

// ================= witnesses
function witnessData(cs,id){
  const {A}=cs;
  if(id==='w1')return {who:'Hal Brennan · security guard',lines:['There were three of them, all masked. They had me on the floor in seconds.',`The tallest one was huge, six-four easy. When he grabbed the bag his sleeve rode up and I saw a tattoo: ${lower(cs.tat)}.`],after:()=>addEv(cs,'tattoo',`Tall robber's tattoo: ${cs.tat}`,'Seen by the guard on the tallest robber, who stood about six-four.','Witness')};
  if(id==='w2')return {who:'Rina Patel · coffee cart',lines:['I heard the alarm bell, then three people ran out with bags.',`They jumped into a ${lower(A.car.color.n)} ${lower(A.car.model)} and floored it. I didn't get the plate, sorry.`],after:()=>addEv(cs,'vehicle',`Getaway: ${A.car.color.n} ${A.car.model}`,'Coffee cart owner saw the robbers drive off. No plate.','Witness')};
  if(id==='w3')return {who:'Gloria Haynes · branch manager',lines:['The silent alarm never went off. It has a staff override with a delay code.','Only tellers and managers know that code. Somebody on my staff helped them. I\'d bet my job on it.'],after:()=>{cs.flags.insider=true;addEv(cs,'insider','Alarm disabled from inside','The silent alarm was switched off with a staff code. An employee is likely involved.','Witness');}};
  if(id==='parent')return {who:`${cs.parent.name} · parent`,lines:[`${cs.victim.first} always walks out of this gate at three. Today, nothing.`,'Then my phone rang. A distorted voice wanted $250,000 wired to an account. I paid it. The bank has every detail. Please, find my child.'],after:()=>{cs.flags.parent=true;addEv(cs,'ransom','Ransom: $250,000 wired','Paid into an account the kidnappers named. The call came from a mobile phone. Trace and bank leads are now on the MDT.','Witness');}};
  if(id==='guard')return {who:'Earl Simms · crossing guard',lines:[`A ${lower(A.car.color.n)} van was idling on the corner with the engine running. I nearly told them to move.`,'A man in a red hoodie walked right up to the kid, said something, and they got in the van. It happened so fast.'],after:()=>addEv(cs,'vehicle',`Van: ${A.car.color.n}`,'Crossing guard saw a man in a red hoodie walk the child to a van.','Witness')};
}
const OPEN_Q=['Officer with Precinct 9. Can I ask you a few questions about what happened?','I\'m working this case. Tell me what you saw.','Take your time. Start from the beginning.'];
function witnessTalk(cs,id){
  const v=iMeshes.get(id);if(!v)return;if(!spend(cs,10))return;
  const W2=witnessData(cs,id);
  talkTo(v.g,[you(pick(OPEN_Q)),...W2.lines.map(t=>({name:W2.who,text:t}))],[{label:'Add to the case file'}],()=>{cs.done[id]=true;W2.after();SFX.blip('good');toast('Statement added to the case file.','good');});
}
function monitorCard(cs){
  cs.flags.hideout=true;closeModal();
  addEv(cs,'hideout',`Card used: ${cs.hide.place}`,`${cs.C.name}'s card paid for a room at the ${cs.hide.place}, ${cs.hide.district}.`,'Bank');
  const m=LOC.motels[cs.hide.place];setGPS(m.x,m.z,cs.hide.place);SFX.blip('radio');
  toast(`Card hit: ${cs.C.first} is at the ${cs.hide.place}. GPS set.`,'good');
}
function canvassTalk(cs){
  const v=iMeshes.get('neighbor');if(!v)return;
  talkTo(v.g,[you('You called in about a van?'),{name:'Neighbour',text:`I did! A ${lower(cs.A.car.color.n)} van pulled up at ${cs.safe.address} this afternoon. Two men carried a kid inside. Nobody's come out since.`}],[{label:'Set GPS to the safehouse'}],()=>{
    cs.flags.safehouse=true;addEv(cs,'safehouse',`Safehouse: ${cs.safe.address}`,`A neighbour saw a ${lower(cs.A.car.color.n)} van unload a child into ${cs.safe.address} this afternoon.`,'Canvass');setGPS(cs.safe.door.x,cs.safe.door.z,'Safehouse');SFX.blip('good');});
}

// ================= arrests
function doorTalk(cs,p){
  const v=iMeshes.get('home'+p.id);if(!v)return;
  talkTo(v.g,[you(`${p.first} ${p.last}? Officer with Precinct 9. I need a word.`),{name:p.name,text:pick(['Can I help you, officer?','What\'s this about?','I haven\'t done anything.','Do you have a warrant?'])}],
    [{label:`Arrest ${p.first}`,cls:'red'},{label:'Walk away',cls:'ghost'}],ch=>{if(ch.label.startsWith('Arrest'))attemptArrest(cs,p,v.g.position);});
}
function attemptArrest(cs,p,at){
  if(prisoner){toast('Book the prisoner you already have at the station first.','bad');return;}
  if(!cs.gang.includes(p.id)){
    cs.falseArrests++;career.falseArrests++;addRep(-8);SFX.blip('bad');
    clog(cs,`Arrested ${p.name}. Solid alibi, released with an apology. Complaint filed.`);
    toast(`${p.name} had a solid alibi. False arrest: reputation −8, 30 min of paperwork.`,'bad');spend(cs,30);return;
  }
  if(Math.random()<(cs.fleeChance[p.id]||0)){
    if(Math.random()<.5){clog(cs,`${p.name} bolted for the ${lower(p.car.color.n)} ${lower(p.car.model)}.`);startCarChase(cs,p,p.door,()=>{toast(`${p.first} got away. They'll turn up at home again later.`,'bad');spend(cs,45);});}
    else{clog(cs,`${p.name} ran for it.`);startFootChase(cs,p,{x:at.x+p.door.nx*1.5,z:at.z+p.door.nz*1.5,nx:p.door.nx,nz:p.door.nz});}
    return;
  }
  makePrisoner(cs,p,at.x,at.z);prisoner.state='scene';cuffScene(prisoner.mesh,at.x,at.z,{},()=>{if(prisoner)prisoner.state='follow';cuffed(cs,p);});
}
function cuffed(cs,p){
  clog(cs,`${p.name} cuffed.`);setGPS(LOC.book.x,LOC.book.z,'Prisoner drop-off bay');
  toast(`${p.name} is in cuffs. Walk them to your cruiser, drive to Division 9 and park in the yellow drop-off bay.`,'good');
}
function book(){
  const {cs,p}=prisoner;prisoner=null;gps=null;
  if(cs.ended)return;
  cs.custody.push(p.id);cs.named[p.id]=true;career.arrests++;saveCareer();gainXP(20);SFX.blip('good');
  clog(cs,`${p.name} booked at Precinct 9.`);toast(`${p.name} booked. Question them in the interview room.`,'good');
  setGPS(LOC.interview.x,LOC.interview.z,'Interview room');
}

// ================= citation book (opens beside the 3D traffic stop)
const EXCUSES={fast:['I\'m late for my sister\'s wedding, officer!','My speedometer must be broken.','Everyone else was going this fast.','I really need a bathroom.','I didn\'t see a sign.','My boss will fire me if I\'m late again.'],slow:['Was I doing something wrong? I had the cruise on 35.','I was going the limit, I promise.','Is there a problem, officer?'],fled:['I panicked, okay? I panicked.','I didn\'t see your lights!','...I want a lawyer.']};
const TIERS=[['none','No speeding citation','warning'],['t1','1–10 mph over','$150'],['t2','11–20 mph over','$250'],['t3','21–30 mph over','$400'],['t4','31+ mph over','$600 + court']];
function trafficStop(car,fled,done){
  const d=genDriver(car,fled);
  const colName=(COLORS.find(c=>c.h===car.color)||{n:''}).n;
  const over=car.clocked-LIMIT;
  const correct=over<=0?'none':over<=10?'t1':over<=20?'t2':over<=30?'t3':'t4';
  const ran=!!(car.violation&&car.seenViol);
  const el=openModal(`
    <header><div class="driver">${avatar(d,56)}<div><div class="eyebrow">${fled?'Felony stop':'Citation book'}</div><h2>${esc(d.name)}</h2><div class="muted" style="font-size:13px">${esc(colName+' '+car.model)} · <span class="mono">${car.plate}</span></div></div></div></header>
    <div class="slip"><span>RADAR ${car.clocked} MPH</span><span>POSTED ${LIMIT}</span><span>${over>0?'+'+over+' OVER':'AT/UNDER LIMIT'}</span>${ran?'<span>RAN RED LIGHT</span>':''}${fled?'<span>FLED</span>':''}</div>
    <div class="checks">
      <button class="btn ghost sm" id="chkLic">Check license</button><output id="licOut" class="muted">Not checked</output>
      <button class="btn ghost sm" id="chkPlate">Run plate</button><output id="plateOut" class="muted">Not checked</output>
    </div>
    <form id="stopForm">
      <fieldset><legend>Speeding</legend>
        ${TIERS.map(([v,l,f])=>`<label class="opt"><input type="radio" name="tier" value="${v}" id="tier-${v}"><span>${l}</span><span class="fine">${f}</span></label>`).join('')}
      </fieldset>
      <fieldset><legend>Other violations</legend>
        <label class="opt"><input type="checkbox" id="vRed"><span>Ran a red light</span><span class="fine">$250</span></label>
        <label class="opt"><input type="checkbox" id="vLic"><span>Suspended or expired license</span><span class="fine">$200</span></label>
        <label class="opt"><input type="checkbox" id="vReg"><span>Expired registration</span><span class="fine">$100</span></label>
        <label class="opt"><input type="checkbox" id="vEvade"><span>Evading a police officer</span><span class="fine">felony</span></label>
        <label class="opt"><input type="checkbox" id="vArrest"><span>Take the driver into custody</span><span class="fine">arrest</span></label>
      </fieldset>
      <div id="stopRes"></div>
      <div class="row end"><button class="btn" type="submit" id="stopSubmit">Issue citation</button></div>
    </form>`,{dismiss:false,side:true});
  $('#chkLic',el).onclick=()=>{SFX.blip('click');const o=$('#licOut',el);o.textContent=`License ${d.lic.toUpperCase()} · age ${d.age}`;o.style.color=d.lic==='Valid'?'var(--ok)':'var(--red)';};
  $('#chkPlate',el).onclick=()=>{SFX.blip('radio');const o=$('#plateOut',el);const bad=[];if(d.reg!=='Valid')bad.push('REG EXPIRED');if(d.stolen)bad.push('STOLEN');if(d.warrant)bad.push('WARRANT');o.textContent=bad.length?bad.join(' · '):'VALID · NO FLAGS';o.style.color=bad.length?'var(--red)':'var(--ok)';};
  $('#stopForm',el).onsubmit=e=>{
    e.preventDefault();
    const tierEl=el.querySelector('input[name="tier"]:checked');
    if(!tierEl){$('#stopRes',el).innerHTML='<p class="muted">Pick a speeding option first. Choose "No speeding citation" if they weren\'t over the limit.</p>';return;}
    const tier=tierEl.value;const res=[];let xp=0,rep=0;
    const lbl=v=>TIERS.find(t=>t[0]===v)[1];
    const cause=over>0||ran||fled||alprFlags(car).length>0;
    if(!cause){rep-=3;res.push(['bad','There was no reason to stop this car: no speeding, no violation, no plate-reader hit. A complaint has been filed.']);}
    if(tier===correct){xp+=20;rep+=1;res.push(['good',tier==='none'?'Correct: no speeding ticket for a driver at the limit.':`Correct bracket: ${over} over is "${lbl(correct)}".`]);}
    else if(correct==='none'){xp-=10;rep-=4;res.push(['bad','You wrote a speeding ticket for a driver doing the limit.']);}
    else{xp-=8;res.push(['bad',`Wrong bracket. ${over} mph over is "${lbl(correct)}".`]);}
    const grade=(checked,actual,goodT,falseT,missT,pts)=>{
      if(checked&&actual){xp+=pts;res.push(['good',goodT]);}
      else if(checked&&!actual){xp-=10;rep-=3;res.push(['bad',falseT]);}
      else if(!checked&&actual){xp-=5;res.push(['bad',missT]);}
    };
    const mustArrest=fled||d.warrant||d.stolen;
    grade($('#vRed',el).checked,ran,'Red-light violation cited.','You never saw them run a light.','Missed it: you watched them run a red light.',15);
    grade($('#vLic',el).checked,d.lic!=='Valid','License violation cited.','Their license was valid. That citation will be thrown out.',`Missed it: the license was ${lower(d.lic)}. Always check papers.`,10);
    grade($('#vReg',el).checked,d.reg!=='Valid','Expired registration cited.','The registration was valid.','Missed the expired registration. Run every plate.',10);
    grade($('#vEvade',el).checked,fled,'Evading charge filed.','They never ran from you.','They fled from you. That\'s an evading charge.',15);
    grade($('#vArrest',el).checked,mustArrest,`Driver booked${d.warrant?' on an outstanding warrant':d.stolen?' for a stolen vehicle':' for evading'}. Backup is transporting.`,'No grounds for an arrest. The driver was released and complained.',`You let them go, but ${d.warrant?'there was an outstanding warrant':d.stolen?'the car was stolen':'they fled from police'}.`,30);
    const cited=tier!=='none'||['vRed','vLic','vReg'].some(k=>$('#'+k,el).checked);
    shift.stops++;
    if(cited){shift.tickets++;career.tickets++;}else{shift.warnings++;career.warnings++;}
    const arrested=$('#vArrest',el).checked&&mustArrest;
    if(arrested){shift.arrests++;career.arrests++;SFX.blip('cuff');}
    shift.xp+=xp;gainXP(xp);if(rep)addRep(rep);SFX.blip(xp>=0?'good':'bad');
    $('#stopRes',el).innerHTML=`<ul class="results">${res.map(([k,t])=>`<li class="${k}">${esc(t)}</li>`).join('')}</ul><p class="mono" style="color:${xp>=0?'var(--ok)':'var(--red)'}">${xp>=0?'+':''}${xp} XP${rep?` · reputation ${rep>0?'+':''}${rep}`:''}</p>`;
    $$('input,#chkLic,#chkPlate',el).forEach(i=>i.disabled=true);
    const b=$('#stopSubmit',el);b.textContent='Back on patrol';b.type='button';
    b.onclick=()=>{closeModal();done(arrested);};
    $('#stopRes',el).scrollIntoView({block:'nearest'});
  };
}

// ================= interactables
const iMeshes=new Map();let nearest=null;
function interactables(){
  const I=[];const cs=curCase;
  if(cs){
    const inC=id=>cs.custody.includes(id);
    const wit=(loc,label,id,look)=>{if(!cs.done[id])I.push({key:id,x:loc.x,z:loc.z,kind:'npc',look,label,act:()=>witnessTalk(cs,id)});};
    if(cs.type==='robbery'){
      I.push({key:'bankcam',x:LOC.bankCam.x,z:LOC.bankCam.z,kind:'terminal',face:faceOf(LOC.bank),label:'Review the bank security footage',act:()=>{if(!cs.done.cctv){if(!spend(cs,15))return;cs.done.cctv=true;}openCCTV3D(cs);}});
      wit(LOC.bankGuard,'Talk to Hal Brennan, security guard','w1',{shirt:'#2b3a55',pants:'#1c2230',skin:SKIN[3],hat:true,hatColor:'#2b3a55'});
      wit(LOC.bankManager,'Talk to Gloria Haynes, branch manager','w3',{shirt:'#6e3d5a',pants:'#2a2a33',skin:SKIN[1],hair:'#9a9a9a'});
      wit(LOC.bankVendor,'Talk to Rina Patel at the coffee cart','w2',{shirt:'#8a5a2b',skin:SKIN[3],hair:'#1a1410'});
      if(cs.flags.hideout&&!inC(cs.C.id)&&!(chase&&chase.p===cs.C)){const m=LOC.motels[cs.hide.place];I.push({key:'raid',x:m.x+m.nx*2,z:m.z+m.nz*2,kind:'door',label:`Brief SWAT and raid the ${cs.hide.place}`,act:()=>raidBrief(cs)});}
    }else{
      I.push({key:'schoolcam',x:LOC.schoolCam.x,z:LOC.schoolCam.z,kind:'terminal',face:faceOf(LOC.school),label:'Check the school gate camera',act:()=>{if(!cs.done.cctv){if(!spend(cs,15))return;cs.done.cctv=true;}openCCTV3D(cs);}});
      wit(LOC.schoolParent,`Talk to ${cs.parent.name}, ${cs.victim.first}'s parent`,'parent',cs.parent.look);
      wit(LOC.schoolGuard,'Talk to Earl Simms, crossing guard','guard',{shirt:'#e0d23a',vest:true,vestColor:'#ff8a2a',skin:SKIN[4],hair:'#9a9a9a'});
      if(cs.flags.district&&!cs.flags.safehouse)I.push({key:'neighbor',x:cs.neighbor.x,z:cs.neighbor.z,kind:'npc',look:{shirt:'#4b3d6e',skin:SKIN[0],hair:'#d8b56a'},face:faceOf(cs.neighbor),label:'Talk to the neighbour who called it in',act:()=>canvassTalk(cs)});
      if(cs.flags.safehouse&&!cs.flags.rescued){const d=cs.safe.door;I.push({key:'raid',x:d.x+d.nx*2,z:d.z+d.nz*2,kind:'door',label:`Brief SWAT and raid ${cs.safe.address}`,act:()=>raidBrief(cs)});}
    }
    if(gpsPerson){const p=person(cs,gpsPerson);
      if(p&&!inC(p.id)&&!(prisoner&&prisoner.p===p)&&!(runner&&runner.p===p)&&!(chase&&chase.p===p)){
        if(cs.type==='robbery'&&p===cs.C)I.push({key:'knock'+p.id,x:p.door.x,z:p.door.z,kind:'door',label:`Knock on ${p.name}'s door`,act:()=>{SFX.blip('door');if(!cs.flags.bossKnown){markBossKnown(cs);clog(cs,`${p.name} isn't home. Neighbours haven't seen them since yesterday.`);}toast(`Nobody home. Neighbours say ${p.first} hasn't been back since last night. Track their bank card from the MDT.`);}});
        else I.push({key:'home'+p.id,x:p.door.x,z:p.door.z,kind:'npc',look:lookOf(p),face:faceOf(p.door),label:`Talk to ${p.name}`,act:()=>doorTalk(cs,p)});
      }}
    if(cs.custody.some(id=>!cs.cracked[id]&&!cs.lawyered[id]&&cs.scripts[id]))I.push({key:'interview',x:LOC.interview.x,z:LOC.interview.z,kind:'terminal',face:faceOf(LOC.station),label:'Interview room: question a suspect',act:()=>interviewRoom(cs)});
  }
  if(suspect&&(suspect.mode==='stopped'||suspect.mode==='caught')){
    const s=suspect;
    I.push({key:'drv'+s.plate,x:s.rx+Math.cos(s.h)*1.8,z:s.rz-Math.sin(s.h)*1.8,kind:'spot',label:s.person?`Arrest ${s.person.name}`:s.mode==='caught'?'Arrest the driver':'Talk to the driver',act:()=>driverWindow(s)});
  }
  homeInteractable(I);
  return I;
}
function driverWindow(s){
  if(s.person){const ch=chase;const p=s.person;endChase();s.mode='parked';if(s.mesh.userData.sil)s.mesh.userData.sil.visible=false;
    const x=s.rx+Math.cos(s.h)*1.6,z=s.rz-Math.sin(s.h)*1.6;makePrisoner(ch.cs,p,x,z);prisoner.state='scene';cuffScene(prisoner.mesh,x,z,{kneel:true},()=>{if(prisoner)prisoner.state='follow';cuffed(ch.cs,p);});return;}
  stopScene(s);
}
function syncInteractables(t){
  const list=interactables();const seen=new Set();
  nearest=null;let best=inCar?6:2.8;
  for(const it of list){
    seen.add(it.key);
    let v=iMeshes.get(it.key);
    if(!v){const g=new THREE.Group();
      if(it.kind==='npc')g.add(makePersonMesh(it.look));
      if(it.kind==='terminal'){const k=sh(new THREE.Mesh(GEO.kiosk,lam('#2a3550')));k.position.y=.7;const sc=new THREE.Mesh(GEO.screen,new THREE.MeshBasicMaterial({color:col('#5aa0ff')}));sc.position.set(0,1.1,.23);sc.rotation.x=-.3;g.add(k,sc);}
      const mk=new THREE.Mesh(GEO.marker,new THREE.MeshBasicMaterial({color:col('#f4b740')}));g.add(mk);
      v={g,mk,base:it.kind==='npc'?2.55:it.kind==='terminal'?2.1:2.3,npc:it.kind==='npc'?g.children[0]:null};scene.add(g);iMeshes.set(it.key,v);}
    v.g.position.set(it.x,.2,it.z);
    if(!cine){
      if(it.kind==='npc'&&!inCar&&Math.hypot(pl.x-it.x,pl.z-it.z)<9)v.g.rotation.y=Math.atan2(pl.x-it.x,pl.z-it.z);
      else if(it.face!=null)v.g.rotation.y=it.face;
      if(v.npc)pose(v.npc,'idle',t+it.x);
    }
    v.mk.visible=!cine;v.mk.rotation.y=t*2;v.mk.position.y=v.base+Math.sin(t*3)*.12;
    const d=Math.hypot(pl.x-it.x,pl.z-it.z);
    if(d<best){best=d;nearest=it;}
  }
  for(const [k,v] of iMeshes)if(!seen.has(k)){scene.remove(v.g);iMeshes.delete(k);}
}
// conversations rotate the whole group, so talkTo gets the group; keep its child person aligned
function interact(){
  if(blockingModal()||!started||cine||cctv||CUFF)return;
  if(raidS){raidInteract();return;}
  if(cbInteract())return;
  if(!nearest){if(!inCar&&Math.hypot(pl.x-pc.x,pl.z-pc.z)<4.5)toggleCar();return;}
  if(inCar){toast('Get out of the cruiser first (F).');return;}
  nearest.act();
}

// ================= camera
const camPos={x:0,y:20,z:0,init:false};const camLook=V3();const drag={on:false,x:0};
function followCam(dt){
  const tg=inCar?pc:pl;const spd=Math.hypot(pc.vx,pc.vz);
  const h=(TCAM.use&&!inCar?TCAM.h:tg.h)+camYawOff;
  const dist=inCar?10.5+spd*.05:5.2,hgt=inCar?4.2:2.6;
  const want={x:tg.x-Math.sin(h)*dist,y:hgt,z:tg.z-Math.cos(h)*dist};
  const k=camPos.init?1-Math.exp(-dt*(inCar?4.5:7)):1;camPos.init=true;
  camPos.x+=(want.x-camPos.x)*k;camPos.y+=(want.y-camPos.y)*k;camPos.z+=(want.z-camPos.z)*k;
  // keep the camera out of buildings: pull it in toward the player until it is clear
  const ty=inCar?1.6:1.5;let fx2=camPos.x,fz2=camPos.z;
  const blocked=(x,z)=>BOXES.some(b=>x>b.x0-.4&&x<b.x1+.4&&z>b.z0-.4&&z<b.z1+.4&&camPos.y<(b.h||2));
  if(blocked(fx2,fz2)){let lo=0,hi=1;for(let i=0;i<8;i++){const m=(lo+hi)/2;const x=tg.x+(camPos.x-tg.x)*m,z=tg.z+(camPos.z-tg.z)*m;if(blocked(x,z))hi=m;else lo=m;}fx2=tg.x+(camPos.x-tg.x)*lo;fz2=tg.z+(camPos.z-tg.z)*lo;}
  const sx=shake>0?(Math.random()-.5)*shake*.6:0,sy=shake>0?(Math.random()-.5)*shake*.4:0;
  camera.position.set(fx2+sx,camPos.y+sy,fz2);
  camera.lookAt(tg.x+Math.sin(tg.h)*2,inCar?1.4:1.6,tg.z+Math.cos(tg.h)*2);
  const fov=camBaseFov+(inCar?Math.min(14,spd*.35):0);camera.fov+=(fov-camera.fov)*Math.min(1,dt*3);camera.updateProjectionMatrix();
  if(!drag.on&&(keys.up||keys.down||STICK.on||spd>2))camYawOff*=Math.max(0,1-dt*2.5);
}
function cineCam(dt){
  const k=1-Math.exp(-dt*3.2);
  if(!cine._init){if(cine.snap)camera.position.copy(cine.pos);else camera.position.lerp(cine.pos,.35);camLook.copy(cine.look);cine._init=true;if(cine.snap){camera.lookAt(camLook);camera.fov=cine.fov;camera.updateProjectionMatrix();return;}}
  camera.position.lerp(cine.pos,k);camLook.lerp(cine.look,k);camera.lookAt(camLook);
  camera.fov+=(cine.fov-camera.fov)*k;camera.updateProjectionMatrix();
}

// ================= HUD + minimap
function hudUpdate(){
  const r=rankOf(career.xp);const pct=r.next?((career.xp-r.floor)/(r.next[0]-r.floor))*100:100;const cs=curCase;
  $('#status').innerHTML=`<div><div class="rank">${r.name}</div><div class="xpbar"><i style="width:${pct}%"></i></div></div><div class="mono" style="font-size:12px;color:var(--muted)">REP ${career.rep}</div><div class="clk">${worldClock()}${cs?`<small style="color:${cs.limit-cs.used<cs.limit*.25?'var(--red)':'var(--amber)'}">${fmtMin(cs.limit-cs.used)} left</small>`:`<small>${nightF>.5?'Night shift':'On patrol'}</small>`}</div>`;
  let ob;
  if(chase&&chase.car.mode==='flee')ob={e:'Code 3 · pursuit',b:chase.p?`Stop ${chase.p.name}`:'Stop the fleeing car',p:'Stay within a few car lengths to fill the box-in meter. Bumping them helps.'};
  else if(chase)ob={e:'Code 3 · pursuit',b:'Make the arrest',p:'Get out (F), walk to the driver\'s door and press E.'};
  else if(cbObjective())ob=cbObjective();
  else if(runner)ob={e:'Foot pursuit',b:`Catch ${runner.p.name}`,p:'Hold Shift to sprint and get right up to them.'};
  else if(prisoner&&prisoner.state==='follow')ob={e:'Prisoner',b:`Walk ${prisoner.p.first} to your cruiser`,p:'They follow you in cuffs. Press F at the car to put them in the back.'};
  else if(prisoner&&prisoner.state==='car')ob={e:'Transport',b:'Drive to Precinct 9',p:`${prisoner.p.name} is in the back. Pull up at the station entrance.`};
  else if(suspect&&suspect.mode==='stopped')ob={e:'10-38 · traffic stop',b:'Walk to the driver\'s door',p:'Get out (F), walk up to the driver window and press E.'};
  else if(suspect&&suspect.mode==='drive')ob={e:'10-38 · traffic stop',b:'Stay behind the car',p:'Keep close behind until it pulls over.'};
  else if(cs)ob=guideObj(cs);
  else ob={e:'10-8 · on patrol',b:'Enforce traffic',p:`Speeders over ${LIMIT} mph, red-light runners and plate-reader hits. Press Tab for the MDT to take a case.`};
  const gd=gps?Math.round(Math.hypot(gps.x-pl.x,gps.z-pl.z)):0;
  $('#obj').innerHTML=`<div class="eyebrow">${esc(ob.e)}</div><b>${esc(ob.b)}</b><p>${esc(ob.p)}</p>${ob.w?`<div class="how">${esc(ob.w)}</div>`:''}${gps?`<div class="gps">GO TO · ${esc(gps.label)} · ${gd} m</div>`:''}`;
  const mph=Math.round(Math.abs(pc.v)*2.237);
  let rad='---',fast=false,sub='No target',hit=false;
  const tg=suspect||target;
  if(tg){const s=tg.clocked||Math.round(tg.speed*2.237);rad=`${s} MPH${suspect?' · LOCK':''}`;fast=s>LIMIT;const fl=alprFlags(tg);
    sub=`${tg.plate}${tg.seenViol?' · RAN RED':''}${fl.length?' · '+fl.join(' · '):' · ALPR clear'}`;hit=fl.length>0||!!tg.seenViol;}
  $('#dash').innerHTML=inCar?`<div class="cell"><span class="lbl">Speed</span><b>${mph}</b><div class="dmg" title="Damage"><i style="width:${pc.damage}%"></i></div></div><div class="limit" aria-label="Speed limit ${LIMIT}"><span>SPEED<br>LIMIT</span><b>${LIMIT}</b></div><div class="cell radar"><span class="lbl">Radar · ALPR</span><b class="${fast?'fast':''}">${rad}</b><small class="${hit?'hit':''}">${esc(sub)}</small></div><div class="cell siren"><span class="lbl">Lights · siren</span><b class="${lightsOn?'on':''}">${lightsOn?(siren==='off'?'LIGHTS':siren.toUpperCase()):'OFF'}</b></div>`
    :`<div class="cell"><span class="lbl">On foot</span><b style="font-size:15px;line-height:1.5">${keys.sprint||STICK.m>.92?'Running':'Walking'}</b></div>`;
}
function promptUpdate(){
  const pr=$('#prompt');
  if(raidS)return;
  if(blockingModal()||!started||cine||cctv){pr.hidden=true;return;}
  if(nearest){pr.hidden=false;pr.innerHTML=inCar?'<kbd>F</kbd>Get out to interact':`<kbd>E</kbd>${esc(nearest.label)}`;}
  else if(!inCar&&Math.hypot(pl.x-pc.x,pl.z-pc.z)<4.5){pr.hidden=false;pr.innerHTML=prisoner&&prisoner.state==='follow'?'<kbd>F</kbd>Put the prisoner in the back and get in':'<kbd>F</kbd>Get in the cruiser';}
  else pr.hidden=true;
  const ct=cbPromptText();if(ct){pr.hidden=false;pr.innerHTML=ct;}
  const mt=$('#meter');mt.hidden=!(chase&&chase.car.mode==='flee');if(chase)mt.firstElementChild.style.width=Math.min(100,chase.meter*100)+'%';
}
let route=[],routeT=0;
function nodeNear(x,z){return [clamp(Math.round(x/S),0,NB),clamp(Math.round(z/S),0,NB)];}
function buildRoute(){
  route=[];if(!gps)return;const a=nodeNear(pl.x,pl.z),b=nodeNear(gps.x,gps.z);const k=n=>n[0]+','+n[1];
  const prev={[k(a)]:null};const q=[a];
  while(q.length){const n=q.shift();if(k(n)===k(b))break;for(const d of validDirs(n)){const m=[n[0]+d[0],n[1]+d[1]];if(!(k(m) in prev)){prev[k(m)]=n;q.push(m);}}}
  let c=b;const pts=[];while(c){pts.unshift({x:c[0]*S,z:c[1]*S});c=prev[k(c)];}
  route=[{x:pl.x,z:pl.z},...pts,{x:gps.x,z:gps.z}];
}
function drawMini(){
  const c=$('#mini'),g=c.getContext('2d'),W2=c.width,R=W2/2;const p=inCar?pc:pl;const sc=R/150;
  const th=Math.PI+p.h,cs=Math.cos(th),sn=Math.sin(th);
  const T=(x,z)=>{const dx=(x-p.x)*sc,dz=(z-p.z)*sc;return [R+dx*cs-dz*sn,R+dx*sn+dz*cs];};
  g.save();g.clearRect(0,0,W2,W2);g.beginPath();g.arc(R,R,R,0,7);g.clip();
  g.fillStyle='#26303f';g.fillRect(0,0,W2,W2);
  const poly=(pts,fill)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();};
  for(let bi=0;bi<NB;bi++)for(let bj=0;bj<NB;bj++){const sp=SPECIAL[bi+','+bj];const x0=bi*S+8,z0=bj*S+8,x1=x0+S-16,z1=z0+S-16;
    poly([T(x0,z0),T(x1,z0),T(x1,z1),T(x0,z1)],sp?(sp.kind==='park'?'#24452f':sp.kind==='station'?'#1e3570':sp.kind==='bank'?'#4a3d1c':sp.kind==='school'?'#4a2620':sp.kind==='home'?'#2c4a6a':'#3a1f35'):'#141c2b');}
  if(gps&&route.length>1){g.strokeStyle='#f4b740';g.lineWidth=W2/40;g.lineJoin='round';g.beginPath();route.forEach((q,i)=>{const [x,y]=T(q.x,q.z);i?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();}
  g.font=`700 ${Math.round(W2/15)}px IBM Plex Mono, monospace`;g.textAlign='center';g.textBaseline='middle';g.fillStyle='#e6ecf6';
  for(const k in SPECIAL){const sp=SPECIAL[k];if(sp.kind==='park')continue;const [bi,bj]=k.split(',').map(Number);const [x,y]=T((bi+.5)*S,(bj+.5)*S);g.fillText(sp.kind==='station'?'P9':sp.kind==='bank'?'$':sp.kind==='school'?'S':sp.kind==='home'?'H':'M',x,y);}
  const dot=(x,z,colr,r)=>{const [a,b]=T(x,z);g.fillStyle=colr;g.beginPath();g.arc(a,b,r,0,7);g.fill();};
  for(const [,v] of iMeshes)dot(v.g.position.x,v.g.position.z,'#f4b740',W2/70);
  aiCars.forEach(cr=>{if(cr.seenViol&&cr.mode==='drive')dot(cr.x,cr.z,'#ff9a3c',W2/70);});
  if(target)dot(target.rx,target.rz,'#f4b740',W2/55);
  if(suspect)dot(suspect.rx,suspect.rz,'#ff4d5e',W2/40);
  if(runner)dot(runner.x,runner.z,'#ff4d5e',W2/45);
  cbDots(dot,W2);
  if(gps){let [x,y]=T(gps.x,gps.z);const dx=x-R,dy=y-R,dd=Math.hypot(dx,dy);if(dd>R-12){x=R+dx/dd*(R-12);y=R+dy/dd*(R-12);}
    g.save();g.translate(x,y);g.rotate(Math.PI/4);const s=W2/22;g.fillStyle='#f4b740';g.strokeStyle='#1d1406';g.lineWidth=3;g.fillRect(-s/2,-s/2,s,s);g.strokeRect(-s/2,-s/2,s,s);g.restore();}
  g.fillStyle='#4b8dff';g.strokeStyle='#fff';g.lineWidth=2.5;g.beginPath();const a=W2/18;g.moveTo(R,R-a);g.lineTo(R+a*.65,R+a*.6);g.lineTo(R,R+a*.25);g.lineTo(R-a*.65,R+a*.6);g.closePath();g.fill();g.stroke();
  const [nx,ny]=T(p.x,p.z-1000);const nd=Math.hypot(nx-R,ny-R);const ax=R+(nx-R)/nd*(R-14),ay=R+(ny-R)/nd*(R-14);
  g.fillStyle='rgba(8,12,22,.85)';g.beginPath();g.arc(ax,ay,W2/24,0,7);g.fill();g.fillStyle='#f4b740';g.font=`700 ${Math.round(W2/18)}px IBM Plex Mono, monospace`;g.fillText('N',ax,ay+1);
  g.restore();
}

// ================= main loop
let envT=0,sigT=0,hudT=0;
function frame(){
  const dt=Math.min(.05,clock3.getDelta());tAcc+=dt;
  const modal=blockingModal();
  if(raidS){if(!modal)updateRaid(dt);}
  else if(cctv){updateCCTV(dt);}
  else if(cine){cine.t+=dt;cine.update&&cine.update.call(cine,dt);dlgTick(dt);}
  else if(started&&!modal){
    updatePlayer(dt);updateAI(dt);updatePeds(dt);updateRadar();updateSuspect(dt);updateChase(dt);updateRunner(dt);updatePrisoner(dt);
    if(prisoner&&prisoner.state==='car'&&inCar)bayCheck();
    if(prisoner&&prisoner.state==='follow'&&!inCar&&Math.hypot(pl.x-LOC.station.x,pl.z-LOC.station.z)<3.5)startBooking();
    if(gps&&gps.follow){gps.x=gps.follow.rx;gps.z=gps.follow.rz;}
    if(gps&&!inCar&&!gps.follow&&!gpsPerson&&!gps.auto&&Math.hypot(pl.x-gps.x,pl.z-gps.z)<3)gps=null;
    if(curCase){curCase.used+=dt;if(curCase.used>=curCase.limit){curCase.used=curCase.limit;endCase(curCase,'timeout');}}else worldMin+=dt;
    if(flashT>0)flashT-=dt;if(shake>0)shake=Math.max(0,shake-dt*1.5);
  }else if(started&&modal&&prisoner&&prisoner.state==='walkin'){}
  if(started&&!raidS&&!cctv)updatePrisoner(cine?0:0);
  if(started&&!cctv)syncInteractables(tAcc);
  // lightbar
  const u=pc&&pc.mesh.userData;
  if(u&&lightsOn){blinkT+=dt;const on=(blinkT%.36)<.18;u.mr.emissiveIntensity=on?3.2:.1;u.mb.emissiveIntensity=on?.1:3.2;u.gr.visible=on;u.gb.visible=!on;u.pl.color.set(on?0xff3347:0x3b82ff);u.pl.intensity=2.2;
    if(!cine&&!cctv&&!raidS){$('#flash').className='flash'+(on?'':' blue');$('#flash').style.opacity=inCar?.45:.25;}}
  else $('#flash').style.opacity=flashT>0?1:0;
  if(u)u.spots.forEach(s=>s.intensity=nightF>.3&&!cctv?nightF*3.2:0);
  envT-=dt;if(envT<=0){envT=.5;applyTime(timeOverride!=null?timeOverride:curMin());updateLampPool(camera.position.x,camera.position.z);}
  sigT-=dt;if(sigT<=0){sigT=.25;updateSignals();}
  if(gps&&!cctv&&!raidS){beacon.visible=true;beacon.position.x=gps.x;beacon.position.z=gps.z;beacon.material.opacity=.18+Math.sin(tAcc*3)*.06;}else beacon.visible=false;
  const tg=suspect||target;
  if(tg&&inCar&&!cine&&!cctv&&!raidS){tArrow.visible=true;tArrow.position.set(tg.rx,(tg.mesh.userData.P.roof+1.5)+Math.sin(tAcc*4)*.15,tg.rz);tArrow.material.color.set(suspect?'#ff4d5e':tg.seenViol||alprFlags(tg).length?'#ff9a3c':'#f4b740');tArrow.rotation.y=tAcc*2;}else tArrow.visible=false;
  if(raidS)raidCam(dt);else if(cctv){}else if(cine)cineCam(dt);else followCam(dt);
  const fx=raidS?pl.x:camera.position.x,fz=raidS?pl.z:camera.position.z;
  sun.target.position.set(fx,0,fz);sun.position.set(fx+sunDirV.x*220,sunDirV.y*220,fz+sunDirV.z*220);sun.target.updateMatrixWorld();
  sky.position.copy(camera.position);stars.position.copy(camera.position);
  if(started)SFX.update(dt,{speed:pc.v,throttle:pc.throttle||0,inCar:inCar&&!raidS,dist:Math.hypot(pl.x-pc.x,pl.z-pc.z),siren:lightsOn&&siren!=='off'&&!cctv&&!raidS?siren:null,slip:inCar?pc.slip||0:0,mute:!!(cctv||raidS||(cine&&!inCar&&false))});
  promptUpdate();
  routeT-=dt;if(routeT<=0){routeT=.6;buildRoute();}
  hudT-=dt;if(hudT<=0&&started){hudT=.1;if(!cine&&!cctv)hudUpdate();drawMini();}
  renderer.render(scene,camera);
}

// ================= input
const KEYMAP={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',ShiftLeft:'sprint',ShiftRight:'sprint'};
addEventListener('keydown',e=>{
  if(!started)return;
  const typing=e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement;
  if((e.code==='Tab'||e.code==='KeyM')&&!typing){e.preventDefault();if(modalOpen()){if($('#modal').firstElementChild.dataset.mdt)closeModal();}else if(!cine&&!raidS&&!cctv)openMDT();return;}
  if(e.code==='Escape'){if(modalOpen()&&$('#modal')._dismiss!==false){closeModal();return;}if(cctv){cctvExit();return;}return;}
  if(blockingModal()||typing)return;
  if(DLG&&(e.code==='KeyE'||e.code==='Space'||e.code==='Enter')){e.preventDefault();if(!e.repeat)dlgAdvance();return;}
  if(modalOpen())return;
  if(cctv){if(e.code==='Space'){e.preventDefault();cctvPlay(!cctv.playing);}else if(e.code==='ArrowLeft'||e.code==='ArrowRight'){e.preventDefault();cctvPlay(false);cctv.t=clamp(cctv.t+(e.code==='ArrowLeft'?-.2:.2),0,cctv.R.dur);$('#cScrub').value=cctv.t;}return;}
  if(cine)return;
  if(KEYMAP[e.code]){keys[KEYMAP[e.code]]=1;e.preventDefault();return;}
  if(e.code==='KeyH'){keys.horn=1;if(inCar)SFX.horn(true);return;}
  if(e.repeat)return;
  if(e.code==='KeyE')interact();
  else if(e.code==='KeyF')toggleCar();
  else if(e.code==='Space'){e.preventDefault();if(inCar)lightsBtn();else cbUse();}
  else if(e.code==='KeyR')cbCycle();
  else if(e.code==='KeyG')cbShout();
  else if(/^Digit[1-4]$/.test(e.code))cbSelect(+e.code.slice(5)-1);
  else if(e.code==='KeyQ')sirenBtn();
  else if(e.code==='KeyN')toggleSound();
});
addEventListener('keyup',e=>{if(KEYMAP[e.code])keys[KEYMAP[e.code]]=0;if(e.code==='KeyH'){keys.horn=0;SFX.horn(false);}});
addEventListener('blur',()=>{for(const k in keys)keys[k]=0;SFX.horn(false);});
function bindTouch(){
  $$('#touch [data-k]').forEach(b=>{const k=b.dataset.k;
    // the button keeps the touch even if the thumb slides off it, so a pedal never cuts out mid-corner
    const on=e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(_){}keys[k]=1;b.classList.add('on');buzz();if(k==='horn'&&inCar)SFX.horn(true);};const off=()=>{keys[k]=0;b.classList.remove('on');if(k==='horn')SFX.horn(false);};
    b.addEventListener('pointerdown',on);['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,off));b.addEventListener('contextmenu',e=>e.preventDefault());});
  $$('#touch [data-act]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.classList.add('on');buzz();});['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>b.classList.remove('on')));b.addEventListener('contextmenu',e=>e.preventDefault());});
  $$('#touch [data-act]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.act;if(DLG&&a==='e'){dlgAdvance();return;}if(a==='e')interact();else if(a==='f')toggleCar();else if(a==='siren')sirenBtn();else if(a==='tool')cbCycle();else if(a==='shout')cbShout();else lightsBtn();}));
  const cv=$('#gl');
  cv.addEventListener('pointerdown',e=>{if(cctv){cctvClick(e);return;}drag.on=true;drag.x=e.clientX;try{cv.setPointerCapture(e.pointerId);}catch(_){}});
  cv.addEventListener('pointermove',e=>{if(!drag.on)return;camYawOff-=(e.clientX-drag.x)*.008;drag.x=e.clientX;});
  ['pointerup','pointercancel'].forEach(ev=>cv.addEventListener(ev,()=>drag.on=false));
  $('#cPlay').onclick=()=>cctvPlay(!cctv.playing);
  $('#cBack').onclick=()=>{cctvPlay(false);cctv.t=Math.max(0,cctv.t-.2);$('#cScrub').value=cctv.t;};
  $('#cFwd').onclick=()=>{cctvPlay(false);cctv.t=Math.min(cctv.R.dur,cctv.t+.2);$('#cScrub').value=cctv.t;};
  $('#cScrub').oninput=()=>{cctvPlay(false);cctv.t=+$('#cScrub').value;};
  $('#cDone').onclick=cctvExit;
}
function toggleSound(){SFX.setOn(!SFX.on);try{localStorage.setItem('p9-sound',SFX.on?'1':'0');}catch(e){}$('#sndBtn').textContent=SFX.on?'SOUND ON':'SOUND OFF';$('#sndBtn').classList.toggle('mute',!SFX.on);}

// ================= boot
(function boot(){
  artLoad();
  try{const s=localStorage.getItem('p9-sound');if(s==='0')SFX.on=false;const q=localStorage.getItem('eko-quality');QUAL.name=q==='low'?'low':'high';}catch(e){QUAL.name='high';}
  // High is the default everywhere; only a player who picks Performance keeps it
  const setQ=(n,save)=>{QUAL.name=n;$('#qHigh').setAttribute('aria-pressed',n==='high');$('#qLow').setAttribute('aria-pressed',n==='low');if(save)try{localStorage.setItem('eko-quality',n);}catch(e){}};
  const setS=v=>{SFX.on=v;$('#sOn').setAttribute('aria-pressed',v);$('#sOff').setAttribute('aria-pressed',!v);};
  setQ(QUAL.name);setS(SFX.on);
  $('#qHigh').onclick=()=>setQ('high',true);$('#qLow').onclick=()=>setQ('low',true);$('#sOn').onclick=()=>setS(true);$('#sOff').onclick=()=>setS(false);
  const [nc,ng]=mkC(128,128);const id=ng.createImageData(128,128);for(let i=0;i<id.data.length;i+=4){const v=Math.random()*255;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255;}ng.putImageData(id,0,0);
  $('#noise').style.backgroundImage=`url(${nc.toDataURL()})`;
  if(matchMedia('(pointer:coarse)').matches){$('#touch').hidden=false;document.body.classList.add('touchmode');}
  bindTouch();bindStick();bindCombat();bindGuide();bindLife();
  if(typeof THREE==='undefined'){$('#loadMsg').innerHTML='<span class="loaderr">The 3D engine could not load. Check your connection and reload.</span>';$('#startBtn').disabled=true;return;}
  $('#mdtBtn').onclick=()=>{if(started&&!modalOpen()&&!cine&&!raidS&&!cctv)openMDT();};
  $('#sndBtn').onclick=toggleSound;
  $('#startBtn').onclick=()=>{
    $('#startBtn').disabled=true;$('#loadMsg').textContent='Building the city…';
    setTimeout(()=>{
      try{
        const low=QUAL.name==='low';QUAL=Object.assign(QUAL,{shadows:!low,pr:low?1:1.5,peds:low?20:38,cars:low?22:34});
        buildWorld();
        pc={x:LOC.spawnCar.x,z:LOC.spawnCar.z,h:LOC.spawnCar.h,vx:0,vz:0,v:0,steer:0,damage:0,slip:0,throttle:0,acc:0,mesh:makeCarMesh('#15171c','Sedan',true,true)};
        pc.mesh.traverse(o=>{if(o.isMesh&&o.geometry!==GEO.screen)o.castShadow=QUAL.shadows;});scene.add(pc.mesh);pc.mesh.position.set(pc.x,0,pc.z);pc.mesh.rotation.y=pc.h;
        pl={x:pc.x,z:pc.z,h:pc.h,phase:0,mesh:makePersonMesh(OFFICER_LOOK)};pl.mesh.visible=false;scene.add(pl.mesh);
        beacon=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,90,16,1,true),new THREE.MeshBasicMaterial({color:0xf4b740,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide,fog:false}));beacon.position.y=45;beacon.visible=false;scene.add(beacon);
        tArrow=new THREE.Mesh(GEO.arrow,new THREE.MeshBasicMaterial({color:0xf4b740}));tArrow.visible=false;scene.add(tArrow);
        for(let i=0;i<QUAL.cars;i++)spawnAICar();
        for(let i=0;i<QUAL.peds;i++)spawnPed();
        applyTime(worldMin);updateSignals();updateLampPool(pc.x,pc.z);
        SFX.init();SFX.resume();
        renderer.setAnimationLoop(frame);
        started=true;$('#title').hidden=true;freshCases();
        $('#sndBtn').textContent=SFX.on?'SOUND ON':'SOUND OFF';$('#sndBtn').classList.toggle('mute',!SFX.on);
        SFX.blip('radio');toast('Dispatch: 9-Adam, you\'re 10-8. Press Tab for the MDT to take a case, or hunt speeders.');
      }catch(err){console.error(err);$('#loadMsg').innerHTML='<span class="loaderr">3D graphics are not available in this browser.</span>';}
    },30);
  };
})();
let beacon,tArrow;
