// ================= Eko Nights, part 3: rank-gated dispatch, homicide, walk-in buildings, case timelines
// Cases are built from a seed, so the same seed gives the same case on every device (saves and squads rely on this).
const GEN={robbery:o=>genRobbery(o),kidnap:o=>genKidnap(o),homicide:o=>genHomicide(o),romance:o=>genRomance(o),yahoo:o=>genYahoo(o),contract:o=>genContract(o),leak:o=>genLeak(o),finale:o=>genFinale(o)};
function makeCase(type,seed,opt){
  opt=opt||{};seed=seed||ri(1,2147483646);
  const cs=withSeed(seed,()=>GEN[type](opt));cs.seed=seed;cs.gen=type;cs.opt=opt;
  const t=TL[type]&&TL[type](cs);
  if(t){cs.limit=t.limit;cs.timeline=t.ms;cs.lateNote=t.late;}else{cs.limit=Infinity;cs.timeline=[];}
  return cs;
}

// ---------- what a case's state looks like on disk and between squad-mates
const STATE_MAPS=['flags','done','named','cracked','lawyered'];
function caseState(cs){
  const st={ev:cs.evidence.map(e=>[e.id,e.title,e.detail,e.src]),custody:cs.custody.slice(),used:Math.round(cs.used),fa:cs.falseArrests,logs:cs.logs.slice(-30),ended:cs.endedHow||null};
  STATE_MAPS.forEach(k=>st[k]=Object.assign({},cs[k]));
  if(cs.bankRows){st.bankRows=cs.bankRows;st.flagged=Object.assign({},cs.flagged||{});}
  Object.keys(cs).forEach(k=>{if(k.startsWith('fl_'))st[k]=Object.assign({},cs[k]);});
  return st;
}
function applyState(cs,st){
  if(!st)return;let changed=false;
  (st.ev||[]).forEach(([id,t,d,s])=>{if(!cs.evidence.some(e=>e.id===id)){cs.evidence.push({id,title:t,detail:d,src:s});changed=true;}});
  (st.custody||[]).forEach(id=>{if(!cs.custody.includes(id)){cs.custody.push(id);cs.named[id]=true;changed=true;}});
  STATE_MAPS.forEach(k=>{for(const [x,v] of Object.entries(st[k]||{}))if(v&&!cs[k][x]){cs[k][x]=v;changed=true;}});
  if(st.used>cs.used)cs.used=st.used;
  if(st.fa>cs.falseArrests)cs.falseArrests=st.fa;
  if(st.bankRows&&!cs.bankRows)cs.bankRows=st.bankRows;
  if(st.flagged){cs.flagged=cs.flagged||{};Object.assign(cs.flagged,st.flagged);}
  Object.keys(st).forEach(k=>{if(k.startsWith('fl_')){cs[k]=cs[k]||{};Object.assign(cs[k],st[k]);}});
  if(st.logs&&!cs.logs.length)cs.logs=st.logs.slice();
  return changed;
}

// ---------- timelines: some cases have a deadline and milestones, some don't
const TL={
  robbery:cs=>({limit:14*60,ms:[[5*60,'Informants say the crew is splitting the money tonight.'],[10*60,'Word on the street: the ringleader wants to leave Port Eko.']],late:'The crew split the money and left Port Eko.'}),
  kidnap:cs=>({limit:11*60,ms:[[4*60,'The kidnappers called the family again. They are getting nervous.'],[8*60,'An informant says they will move the child tonight.']],late:'The kidnappers moved the child.'}),
  homicide:cs=>({limit:(cs.hard?28:36)*60,ms:[[12*60,'Twelve hours gone. Witnesses are starting to forget.'],[(cs.hard?20:26)*60,`Word is that someone close to ${cs.V.first} has bought a bus ticket out of Port Eko.`]],late:'The trail went cold. The case goes to the cold-case unit.'}),
  contract:cs=>({limit:16*60,ms:[[6*60,`${cs.H.name}'s office has booked a flight to Dubai.`],[12*60,`${cs.H.name}'s convoy has been seen loading bags.`]],late:`${cs.H.name} flew to Dubai.`}),
  finale:cs=>({limit:7*60,ms:[[4*60,'Harmattan\'s ship is taking on fuel at the wharf. It sails at dawn.']],late:'Harmattan sailed at dawn.'}),
};
function caseLeft(cs){return isFinite(cs.limit)?cs.limit-cs.used:null;}
function deadlineHTML(cs){const l=caseLeft(cs);if(l==null)return '<small style="color:var(--muted)">No deadline</small>';return `<small style="color:${l<cs.limit*.25?'var(--red)':'var(--amber)'}">${fmtMin(l)} left</small>`;}
function timelineHTML(cs){
  if(!isFinite(cs.limit))return '<div class="tline none"><b>No deadline.</b> Take the time you need. Your time is still logged on the case file.</div>';
  const pct=m=>Math.min(100,m/cs.limit*100).toFixed(1);
  return `<div class="tline"><div class="bar"><i style="width:${pct(cs.used)}%"></i>${cs.timeline.map(([m],i)=>`<span class="ms${cs.flags['ms'+i]?' hit':''}" style="left:${pct(m)}%"></span>`).join('')}<span class="end"></span></div>
    <ol>${cs.timeline.map(([m,t],i)=>`<li class="${cs.flags['ms'+i]?'hit':''}"><span class="mono">${clockStr(cs,m)}</span>${esc(t)}</li>`).join('')}<li class="dl"><span class="mono">${clockStr(cs,cs.limit)}</span>Deadline: ${esc(cs.lateNote)}</li></ol></div>`;
}
function caseTick(){
  const cs=curCase;if(!started||!cs||cs.ended||!cs.timeline)return;
  cs.timeline.forEach(([m,t],i)=>{if(cs.used>=m&&!cs.flags['ms'+i]){cs.flags['ms'+i]=true;clog(cs,t);SFX.blip('radio');toast('Timeline: '+t,'bad');}});
}
setInterval(caseTick,700);

// ---------- dispatch: more case types unlock as you rise in rank
const DISPATCH=[
  {type:'robbery',rank:0,code:'10-31',label:'Armed robbery'},
  {type:'romance',rank:0,code:'419',label:'Romance fraud'},
  {type:'kidnap',rank:1,code:'10-57',label:'Kidnapping',urgent:true},
  {type:'homicide',rank:2,code:'HOM',label:'Homicide'},
  {type:'yahoo',rank:3,code:'EFC',label:'Cyber fraud ring'},
  {type:'contract',rank:4,code:'EFC',label:'Public corruption'},
  {type:'homicide',rank:5,code:'HOM',label:'High-profile murder',opt:{hard:true}},
];
const rankIdx=()=>{let i=0;RANKS.forEach((r,j)=>{if(career.xp>=r[0])i=j;});return i;};
function freshCases(){
  const r=rankIdx();const pool=DISPATCH.filter(d=>d.rank<=r);const n=Math.min(pool.length,2+Math.floor(r/2));
  const top=pool.filter(d=>d.rank===r);const pickd=shuffle(pool.filter(d=>!top.includes(d))).slice(0,Math.max(0,n-top.length));
  nextCases=[...top,...pickd].slice(0,n).map(d=>({d,cs:makeCase(d.type,null,Object.assign({free:true},d.opt||{}))}));
}
function caseBlurb(cs){
  switch(cs.type){
    case 'robbery':return `${cs.bank} was robbed. Three masked suspects, one getaway car. Work the scene, follow the money, and turn each arrest into the next.`;
    case 'romance':return `${cs.vic.name} lost ${naira(cs.vic.amt)} to "${cs.vic.persona.n}". Find the account holder behind the fake lover.`;
    case 'kidnap':return `${cs.victim.first}, ${cs.victim.age}, was taken outside ${cs.school}. A ransom was paid. Find the safehouse.`;
    case 'homicide':return `${cs.V.name}, ${lower(cs.V.job)}, was found dead at ${cs.scene.address}. ${cs.sus.length} people had reasons. Walk the scene, break the alibis, find the killer.`;
    case 'yahoo':return `${cs.vic.co} in ${cs.vic.country} lost $${cs.vic.usd.toLocaleString()} to a fake invoice. Find the fraud house and its chairman.`;
    case 'contract':return `${naira(cs.proj.sum)} was paid for the ${cs.proj.name}. Nothing was built. Follow the paperwork to the politician.`;
  }
  return '';
}
function drawDispatch(body,cs){
  if(!nextCases||!Array.isArray(nextCases))freshCases();
  const r=rankIdx();const locked=DISPATCH.filter(d=>d.rank>r);
  const tchip=c=>isFinite(c.limit)?`<span class="chip ${c.limit<=12*60?'red':'amber'}">${Math.round(c.limit/60)} h deadline</span>`:'<span class="chip">No deadline</span>';
  body.innerHTML=`${cs?`<div class="empty" style="margin-bottom:12px">You're on <b>${esc(cs.title)}</b>. Close it or hand it back before taking another case.</div>`:''}
    <div class="offers">${dailyDispatchCard()}${rushDispatchCard()}${storyDispatchCard()}${typeof inviteCards==='function'?inviteCards():''}
    <article class="offer"><div class="code"><b>10-8</b>Traffic</div><div><h3>Speed enforcement, citywide</h3><p>Always on while you patrol. The limit is ${LIMIT} km/h. Lock the radar on a car ahead, hit Space, follow until it pulls over, then walk to the driver's window.</p><span class="chip">This shift: ${shift.stops} stops · ${shift.tickets} tickets</span></div><span></span></article>
    ${nextCases.map((o,i)=>`<article class="offer${o.d.urgent?' urgent':''}"><div class="code"><b>${o.d.code}</b>${esc(o.d.label)}</div><div><h3>${esc(o.cs.title)}</h3><p>${esc(caseBlurb(o.cs))}</p>${tchip(o.cs)} <span class="chip">${RANKS[o.d.rank][1]}+</span></div><button class="btn${o.d.urgent?' red':''}" data-take="${i}" ${cs?'disabled':''}>Take the case</button></article>`).join('')}
    ${locked.length?`<article class="offer locked"><div class="code"><b>🔒</b>Locked</div><div><h3>More cases as you rise</h3><p>${locked.map(d=>`${esc(d.label)} at ${RANKS[d.rank][1]}`).join(' · ')}. You are ${rankOf(career.xp).name}${rankOf(career.xp).next?`, ${rankOf(career.xp).next[0]-career.xp} XP from ${rankOf(career.xp).next[1]}`:''}.</p></div><span></span></article>`:''}
    </div>`;
  $$('[data-take]',body).forEach(b=>b.onclick=()=>startCase(nextCases[+b.dataset.take].cs));
  $$('[data-daily]',body).forEach(b=>b.onclick=()=>openMDT('daily'));
  $$('[data-rush]',body).forEach(b=>b.onclick=()=>openMDT('rush'));
  $$('[data-inv]',body).forEach(b=>b.onclick=()=>joinSquadByHost(b.dataset.inv));
}

// ---------- homicide
const H_ROLES=[['Business partner','He wanted out of the business, and he wanted his money back.'],['Tenant in arrears','He was going to throw me out of the flat on Monday.'],['Former driver','He sacked me without paying my last three months.'],['Younger sibling','Our father\'s land. He sold it without telling anybody.'],['Rival trader','He reported my shop to the task force and they sealed it.'],['Debtor','I owed him money. That is all. Owing money is not a crime.']];
const H_ALIBI=[['at a football viewing centre in Ebute','The viewing centre owner and two regulars confirm {n} was there from 8 pm until after 1 am.'],
  ['at a night vigil at church in Oja Market','The pastor and the vigil register confirm {n} was in church until 4 am.'],
  ['at a bar on Allen Avenue','The bar\'s CCTV shows {n} at the same table from 9 pm until closing.'],
  ['working a night shift at the port','The port gate log shows {n} clocked in at 8 pm and out at 6 am.'],
  ['at a wedding reception in Marina Point','Wedding photos timestamped from 10 pm to midnight show {n} on the dance floor.'],
  ['at home with family','A neighbour and a POS receipt at 10:40 pm two streets away back {n} up.']];
const H_WEAPON=['a heavy brass pestle','a claw hammer','an iron rod'];
function genHomicide(opt={}){
  const hard=!!opt.hard;const P=makePeople(hard?16:14);const rest=assignHomes(P);
  const V=P[0],n=hard?4:3,sus=P.slice(1,1+n),K=pick(sus);const scene=rest[0];
  const vf=pick(['Obinna','Emeka','Tunde','Femi','Ibrahim','Segun','Kunle','Musa','Ikenna','Dapo']);Object.assign(V,{first:vf,name:vf+' '+V.last});V.door=scene;V.address=scene.address;V.district=scene.district;V.job=pick(['Landlord','Importer','POS business owner','Pharmacist','Car dealer','Event planner']);V.age=ri(44,66);
  const roles=shuffle(H_ROLES.slice()).slice(0,n),alibis=shuffle(H_ALIBI.slice()).slice(0,n);
  sus.forEach((p,i)=>{p.hrole=roles[i][0];p.motive=roles[i][1];p.alibi=alibis[i];p.height=p===K?ri(186,192):ri(160,178);p.tattoo='None';});
  const tod=ri(21*60+30,22*60+30),todTxt=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const debtor=pick(sus.filter(p=>p!==K));
  const cs=baseCase({type:'homicide',hard,title:`Murder of ${V.name}`,code:'HOM',people:P,db:P.slice(1),gang:[K.id],V,K,C:K,sus,scene,weapon:pick(H_WEAPON),
    tod:[todTxt(tod),todTxt(tod+80)],todMin:tod,fleeChance:{[K.id]:.45},roles:sus.map(p=>[p,'Person of interest · '+p.hrole]),debtor});
  sus.forEach(p=>cs.named[p.id]=true);
  cs.scripts={[K.id]:{alibi:`I told you. I was ${K.alibi[0]}. Ask anybody. Why would I hurt ${V.first}?`,correct:['alibiBroken','weapon'],
    crack:[`...I only went to beg him. ${K.motive}`,`He laughed at me. He said he would finish me in this city. I picked up the ${cs.weapon.replace(/^an? /,'')} and I... I didn't mean it.`,'I washed it and hid it. I knew you would come. I knew.'],
    onCrack(){addEv(cs,'confession',`${K.first} confessed`,`${K.name} admitted to killing ${V.name} at about ${cs.tod[0]}. Motive: ${K.motive}`,'Interrogation');}}};
  cs.sub=ok=>ok?`${K.name} is charged with the murder of ${V.name}.${cs.cracked[K.id]?' Full confession on record.':''}`:'The trail went cold.';
  cs.logs.push(`${V.name}, ${V.age}, ${lower(V.job)}, was found dead in his flat at ${scene.address} at 06:40 by his cleaner. Persons of interest: ${sus.map(p=>p.name+' ('+lower(p.hrole)+')').join(', ')}.`);
  return cs;
}
function suspectDoor(cs,p,key){
  const v=iMeshes.get(key||'sus'+p.id);if(!v)return;const N=t=>({name:p.name,text:t});
  if(!cs.done['int_'+p.id]){
    const low=career.rep<30;if(!spend(cs,low?25:15))return;
    const lines=[you(`${p.first} ${p.last}? Division 9, homicide. I need to ask where you were the night ${cs.V.first} died.`)];
    if(low)lines.push(N('Police again? Una go just carry anybody go cell.'),you('Just answer the question, please.'));
    lines.push(N(`${cs.V.first}? God rest his soul. Yes, I knew him. ${p.motive}`),N(`But that night I was ${p.alibi[0]}. From about nine till past midnight. Go and ask.`));
    talkTo(v.g,lines,[{label:'Note the alibi'}],()=>{cs.done['int_'+p.id]=true;addEv(cs,'alibi_'+p.id,`${p.first}'s alibi: ${p.alibi[0]}`,`${p.name} (${lower(p.hrole)}) says: "${p.motive}" Claims to have been ${p.alibi[0]} from 9 pm to past midnight.`,'Interview');SFX.blip('good');});
    return;
  }
  const ch=[{label:`Arrest ${p.first}`,cls:'red'}];
  if(cs.flags['warrant_'+p.id]&&!cs.done['search_'+p.id])ch.unshift({label:'Search the house (warrant)'});
  ch.push({label:'Leave',cls:'ghost'});
  talkTo(v.g,[you(`${p.first}, a few more questions.`),N(pick(['Again? I have told you everything.','Officer, I am a busy person.','Do you have a warrant, or are we just talking?']))],ch,c=>{
    if(c.label.startsWith('Arrest'))attemptArrest(cs,p,v.g.position);
    else if(c.label.startsWith('Search'))setTimeout(()=>enterInterior(cs,'search',p),200);
  });
}
function checkAlibi(cs,p){
  cs.done['chk_'+p.id]=true;closeModal();SFX.blip('radio');
  if(p===cs.K){addEv(cs,'alibiBroken',`${p.first}'s alibi is false`,`The people ${p.alibi[0]} say ${p.first} left before 9:30 pm. ${p.first}'s phone pinged a mast beside ${cs.scene.address} at ${cs.tod[0]}.`,'Alibi check');
    cs.flags['warrant_'+p.id]=true;toast(`${p.first}'s alibi falls apart. A magistrate signs a search warrant for ${p.address}.`,'good');}
  else{addEv(cs,'cleared_'+p.id,`${p.first}'s alibi holds`,p.alibi[1].replace('{n}',p.first),'Alibi check');toast(`${p.first}'s alibi checks out.`,'good');}
}
function traceNumber(cs){
  cs.done.sim=true;closeModal();SFX.blip('radio');
  addEv(cs,'sim','The unknown number','Registered with a fake NIN at a roadside SIM seller. But every night the line connects to masts in '+cs.K.district+'.','Telecoms');
  toast(`The number "sleeps" in ${cs.K.district}.`,'good');
}
function homicideInteractables(cs,I){
  const inC=id=>cs.custody.includes(id);const d=cs.scene;
  I.push({key:'scene',x:d.x+d.nx*1.2,z:d.z+d.nz*1.2,kind:'door',label:`Enter the crime scene (${d.address})`,act:()=>enterInterior(cs,'scene')});
  cs.sus.forEach(p=>{if(inC(p.id)||gpsPerson===p.id||(prisoner&&prisoner.p===p)||(runner&&runner.p===p)||(chase&&chase.p===p))return;
    I.push({key:'sus'+p.id,x:p.door.x,z:p.door.z,kind:'npc',look:lookOf(p),face:faceOf(p.door),label:`Talk to ${p.name} (${lower(p.hrole)})`,act:()=>suspectDoor(cs,p)});});
}
function homicideLeads(cs,L,at,ev,inC){
  const K=cs.K;
  if(!cs.done.scene)L.push({t:'Walk the crime scene',d:`${cs.scene.address}, ${cs.scene.district}. Go inside and examine everything.`,at:at(cs.scene,'Crime scene'),hot:true});
  cs.sus.forEach(p=>{if(!cs.done['int_'+p.id])L.push({t:`Interview ${p.name}`,d:`${p.hrole}. ${p.address}, ${p.district}.`,c:15,at:at(p.door,p.name)});});
  cs.sus.forEach(p=>{if(cs.done['int_'+p.id]&&!cs.done['chk_'+p.id]&&ev('tod'))L.push({t:`Check ${p.first}'s alibi`,d:`Claimed to be ${p.alibi[0]}.`,c:25,run:()=>checkAlibi(cs,p)});});
  if(cs.done['int_'+cs.sus[0].id]&&!ev('tod'))L.push({t:'Alibis need a time of death',d:'Examine the body at the scene first.',at:at(cs.scene,'Crime scene')});
  if(ev('phone')&&!cs.done.sim)L.push({t:'Trace the unknown number',d:'Run the last caller through the NIN-SIM registry.',c:30,run:()=>traceNumber(cs)});
  if(cs.flags['warrant_'+K.id]&&!cs.done['search_'+K.id])L.push({t:`Search ${K.name}'s home`,d:`You have a warrant. ${K.address}.`,at:at(K.door,K.name+'\'s home'),hot:true});
  if(!inC(K.id)&&cs.done['search_'+K.id])L.push({t:`Arrest ${K.name}`,d:`${K.address}, ${K.district}.`,at:at(K.door,K.name+'\'s home'),hot:true});
}

// ---------- walk-in buildings: crime scenes and house searches
const IN={x:-460,z:-130};let insideS=null;
function buildInterior(seed){
  return withSeed(seed,()=>{
    const g=new THREE.Group();scene.add(g);const B=[];const ox=IN.x,oz=IN.z,H=2.5,T=.18;
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(40,30),lam('#3b3d42'));ground.rotation.x=-Math.PI/2;ground.position.set(ox+7.5,.005,oz+5);g.add(ground);
    const [tc,tg]=mkC(64,64);tg.fillStyle='#c9c2b2';tg.fillRect(0,0,64,64);tg.fillStyle='#b8b0a0';tg.fillRect(0,0,32,32);tg.fillRect(32,32,32,32);const tt=ctex(tc,true);tt.repeat.set(5,6);
    const floor=(x,z,w,d,mat)=>{const f=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);f.rotation.x=-Math.PI/2;f.position.set(x+w/2,.02,z+d/2);f.receiveShadow=QUAL.shadows;g.add(f);};
    floor(ox,oz,8,10,new THREE.MeshLambertMaterial({map:tt}));floor(ox+8,oz+5,7,5,lam('#8a6a4c'));floor(ox+8,oz,7,5,lam('#d8d8d0'));
    const wm=lam(pick(['#d9cfb8','#c7d3c4','#d6c3b5','#c4ccd8']));
    const seg=(x0,z0,x1,z1,h=H)=>{const w=Math.abs(x1-x0),d=Math.abs(z1-z0);const m=sh(new THREE.Mesh(new THREE.BoxGeometry(Math.max(w,T),h,Math.max(d,T)),wm));m.position.set((x0+x1)/2,h/2,(z0+z1)/2);g.add(m);
      B.push({x0:Math.min(x0,x1)-T/2,x1:Math.max(x0,x1)+T/2,z0:Math.min(z0,z1)-T/2,z1:Math.max(z0,z1)+T/2});};
    const wall=(x0,z0,x1,z1,gaps,h)=>{const hz=z0===z1;const a0=hz?x0:z0,a1=hz?x1:z1;let cur=a0;gaps.forEach(gp=>{if(gp-.7>cur)hz?seg(cur,z0,gp-.7,z0,h):seg(x0,cur,x0,gp-.7,h);cur=gp+.7;});if(cur<a1)hz?seg(cur,z0,a1,z0,h):seg(x0,cur,x0,a1,h);};
    wall(ox,oz,ox+15,oz,[ox+4],.9);wall(ox,oz+10,ox+15,oz+10,[]);wall(ox,oz,ox,oz+10,[]);wall(ox+15,oz,ox+15,oz+10,[]);
    wall(ox+8,oz,ox+8,oz+10,[oz+2.5,oz+7.5]);wall(ox+8,oz+5,ox+15,oz+5,[],1.4);
    const box=(x,z,w,h,d,c,y=0)=>{const m=sh(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),lam(c)));m.position.set(x,y+h/2,z);g.add(m);B.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});return m;};
    // living room
    box(ox+1,oz+6.5,.9,.8,2.4,pick(['#6b2d5a','#2b4a6e','#7a3a2a']));box(ox+3,oz+6.5,1.1,.4,.7,'#6a4a32');
    box(ox+7.5,oz+6.5,.5,.6,1.8,'#2a2a2a');const tv=new THREE.Mesh(new THREE.BoxGeometry(.08,.7,1.2),lam('#111'));tv.position.set(ox+7.45,1,oz+6.5);g.add(tv);
    box(ox+4,oz+2.6,1.6,.75,1,'#7a5a3a');[[-1,0],[1,0]].forEach(([s])=>box(ox+4+s*1.15,oz+2.6,.45,.5,.45,'#4a3a2a'));
    // kitchen and bedroom
    box(ox+11.5,oz+.45,6,.9,.7,'#8a8a84');box(ox+14.5,oz+2.5,.7,1.8,.7,'#e8e8e8');
    box(ox+12.5,oz+8.4,2,.5,1.6,'#e8e2d4');box(ox+9,oz+9.6,1.4,1.9,.5,'#5a3a22');
    const L1=intLights[1],L2=intLights[2];L1.position.set(ox+4,2.3,oz+5);L1.intensity=2.6;L1.distance=12;L2.position.set(ox+11.5,2.3,oz+5);L2.intensity=2.2;L2.distance=11;
    return {g,B,ox,oz,spawn:{x:ox+4,z:oz+1.1},exitZ:oz+.3};
  });
}
function interiorItems(cs,kind,p){
  const ox=IN.x,oz=IN.z,ev=(id,t,d)=>addEv(cs,id,t,d,kind==='scene'?'Crime scene':'Search');
  if(kind==='scene'){const V=cs.V,K=cs.K;return [
    {id:'body',x:ox+3,z:oz+5,label:'Examine the body',lines:[`${V.name}, under a white sheet. A heavy blow to the head. No defensive wounds: he didn't see it coming.`,`The pathologist estimates the time of death between ${cs.tod[0]} and ${cs.tod[1]}.`],fx:()=>ev('tod',`Time of death: ${cs.tod[0]}–${cs.tod[1]}`,`${V.name} died from a single heavy blow to the head between ${cs.tod[0]} and ${cs.tod[1]}. No defensive wounds.`),make:g=>{const s=new THREE.Mesh(new THREE.BoxGeometry(.7,.28,1.85),lam('#f2f2f0'));s.position.set(ox+3,.16,oz+5);g.add(s);const hd=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),lam('#f2f2f0'));hd.position.set(ox+3,.2,oz+5.95);g.add(hd);}},
    {id:'door',x:ox+4,z:oz+.9,label:'Check the front door',lines:['No scratches on the lock, no broken glass. The door was opened from the inside.','He let the killer in. Someone he knew.'],fx:()=>ev('noForce','No forced entry','The front door was opened from the inside. The victim let the killer in.')},
    {id:'cups',x:ox+4,z:oz+2.6,label:'Look at the dining table',lines:['Two glasses of malt drink, one half-finished. A plate of chin-chin.','He was entertaining a visitor.'],fx:()=>ev('visitor','Two glasses on the table',`${V.first} had a visitor that night and served them a drink.`),make:g=>{[-.25,.25].forEach(d=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.05,.04,.14,8),lam('#6a3a1a'));c.position.set(ox+4+d,.82,oz+2.6);g.add(c);});}},
    {id:'phone',x:ox+3,z:oz+6.5,label:'Pick up the victim\'s phone',lines:[`Last WhatsApp message, ${cs.tod[0]}, from a number with no name saved: "I dey your gate. Open."`,'No other messages after that.'],fx:()=>ev('phone','"I dey your gate. Open."',`At ${cs.tod[0]} an unsaved number messaged ${V.first}: "I dey your gate. Open." Nothing after that.`)},
    {id:'print',x:ox+11,z:oz+2.5,label:'Inspect the kitchen floor',lines:['A shoe print in spilt palm oil by the back door. Size 46.','Whoever left it is tall. 185 centimetres or more.'],fx:()=>ev('print','Size 46 shoe print','A size 46 print by the back door: the person who left it is about 185 cm or taller. Check the heights in Records.'),make:g=>{const s=new THREE.Mesh(new THREE.PlaneGeometry(.35,.6),new THREE.MeshBasicMaterial({color:0x8a5a10,transparent:true,opacity:.55}));s.rotation.x=-Math.PI/2;s.position.set(ox+11,.03,oz+2.5);g.add(s);}},
    {id:'ledger',x:ox+9,z:oz+9,label:'Open the bedroom drawer',lines:['A notebook of money owed to the victim.',`${cs.debtor.name}: ₦1.2 million. ${K.name}: ₦4.5 million, "final warning, Monday".`],fx:()=>ev('ledger','The victim\'s debt book',`${cs.debtor.name} owed ₦1.2 million. ${K.name} owed ₦4.5 million, marked "final warning, Monday".`)},
  ];}
  // house search: one real find, several ordinary ones
  const K=cs.K;const real=p===K;return [
    {id:'wardrobe',x:ox+9,z:oz+9,label:'Search the wardrobe',lines:real?['Behind the clothes, a shirt soaked through and stuffed in a nylon bag. Dark stains on the cuffs.']:['Clothes, an old suitcase, a pile of receipts. Nothing.'],fx:()=>{if(real)addEv(cs,'shirt','Stained shirt in the wardrobe',`A shirt with dark stains on the cuffs, hidden in ${K.first}'s wardrobe. Sent to the lab.`,'Search');}},
    {id:'kitchen',x:ox+12,z:oz+1.2,label:'Search the kitchen',lines:real?[`Under the sink, wrapped in a wet towel: ${cs.weapon}. Washed, but the lab's spray lights it up.`]:['Pots, a gas cylinder, a bag of garri. Nothing.'],fx:()=>{if(real)addEv(cs,'weapon',`Murder weapon: ${cs.weapon}`,`Found under ${K.first}'s kitchen sink, washed and wrapped in a towel. Blood traces react under the lab's spray.`,'Search');}},
    {id:'sofa',x:ox+1.6,z:oz+6.5,label:'Search the sofa',lines:['Coins, a remote, a church bulletin. Nothing.'],fx:()=>{}},
    {id:'bed',x:ox+12.5,z:oz+7.2,label:'Look under the bed',lines:real?['A bus ticket to Abuja, dated tomorrow morning.']:['Dust and a pair of slippers. Nothing.'],fx:()=>{if(real)addEv(cs,'ticket','Bus ticket out of town',`${K.first} bought a one-way ticket out of Port Eko for tomorrow morning.`,'Search');}},
  ];
}
function enterInterior(cs,kind,p){
  if(insideS||raidS)return;if(prisoner){toast('Book your prisoner at the station first.','bad');return;}
  const door=kind==='scene'?cs.scene:p.door;
  const L=buildInterior(cs.seed+(kind==='scene'?1:7)+(p?p.id.length:0));
  const items=interiorItems(cs,kind,p);const dk='fl_in'+kind+(p?p.id:'');const done=cs[dk]||(cs[dk]={});
  items.forEach(it=>{if(it.make)it.make(L.g);const mk=new THREE.Mesh(GEO.marker,new THREE.MeshBasicMaterial({color:col(done[it.id]?'#6b7280':'#f4b740')}));mk.position.set(it.x,1.6,it.z);L.g.add(mk);it.mk=mk;});
  if(kind==='scene'){const tape=new THREE.Mesh(new THREE.BoxGeometry(2,.06,.02),lam('#f4c430'));tape.position.set(IN.x+4,1,IN.z-.05);L.g.add(tape);}
  insideS={cs,kind,p,L,items,done,t:0,back:{x:door.x+door.nx*1.8,z:door.z+door.nz*1.8,h:Math.atan2(door.nx,door.nz)},title:kind==='scene'?`Crime scene · ${cs.scene.address}`:`Search · ${p.name}'s home`};
  inCar=false;pc.vx=pc.vz=0;pl.x=L.spawn.x;pl.z=L.spawn.z;pl.h=0;pl.mesh.visible=true;camPos.init=false;
  document.body.classList.add('raid');$('#raidhud').hidden=false;SFX.blip('door');
  toast(kind==='scene'?'You step over the tape. Walk up to the yellow markers and press E. Leave by the front door.':'Warrant served. Search the rooms (E). Leave by the front door.');
}
function interiorNearest(){const S=insideS;let best=null,bd=1.5;for(const it of S.items){const d=Math.hypot(it.x-pl.x,it.z-pl.z);if(d<bd){bd=d;best=it;}}return best;}
function interiorInteract(){
  const S=insideS;if(!S||DLG)return;const it=interiorNearest();if(!it)return;
  if(it.use){it.use();return;}
  if(!S.done[it.id]&&S.cs&&!spend(S.cs,5))return;
  pose(pl.mesh,'idle');dialog(it.lines.map(t=>you(t)),[{label:S.done[it.id]?'Close':'Log it'}],()=>{
    if(!S.done[it.id]){S.done[it.id]=true;it.fx();it.mk.material.color.set('#6b7280');SFX.blip('good');
      if(S.kind==='scene'&&S.items.every(i=>S.done[i.id]))S.cs.done.scene=true;
      if(S.kind==='search'&&S.items.every(i=>S.done[i.id]))S.cs.done['search_'+S.p.id]=true;}
  });
}
function updateInterior(dt){
  const S=insideS;S.t+=dt;const cs=S.cs;
  if(cs&&!cs.ended&&!DLG){cs.used+=dt;if(cs.used>=cs.limit){cs.used=cs.limit;leaveInterior(true);endCase(cs,'timeout');return;}}
  if(DLG){dlgTick(dt);pose(pl.mesh,'idle',S.t);}
  else{
    const P=padScreen();
    if(P){const sp=(P.run?5.5:3.4)*P.m;pl.x+=P.mx*sp*dt;pl.z+=P.mz*sp*dt;pl.h=Math.atan2(P.mx,P.mz);pl.phase+=dt*sp*1.9;animWalk(pl.mesh,pl.phase,P.run?.7:.45,P.run);}
    else pose(pl.mesh,'idle',S.t);
  }
  pushOut(pl,.32,S.L.B);pl.mesh.position.set(pl.x,.03,pl.z);pl.mesh.rotation.y=pl.h;
  S.items.forEach(it=>{it.mk.position.y=1.6+Math.sin(S.t*3+it.x)*.1;it.mk.rotation.y=S.t*2;});
  const n=interiorNearest();const pr=$('#prompt');
  if(n&&!DLG){pr.hidden=false;pr.innerHTML=`<kbd>E</kbd>${esc(n.label)}`;}else pr.hidden=true;
  const left=S.items.filter(i=>!S.done[i.id]).length;
  $('#raidhud').innerHTML=`<span>${esc(S.title)}</span>${S.kind==='home'?'':`<span><b>${S.items.length-left}/${S.items.length}</b> examined</span>`}${cs&&isFinite(cs.limit)?`<span><b>${fmtMin(cs.limit-cs.used)}</b> left</span>`:''}<span>Exit: front door</span>`;
  if(pl.z<S.L.exitZ-.2&&Math.abs(pl.x-S.L.spawn.x)<1.2)leaveInterior();
}
function leaveInterior(silent){
  const S=insideS;if(!S)return;insideS=null;scene.remove(S.L.g);intLights[1].intensity=0;intLights[2].intensity=0;
  document.body.classList.remove('raid');$('#raidhud').hidden=true;$('#prompt').hidden=true;
  pl.x=S.back.x;pl.z=S.back.z;pl.h=S.back.h;pl.mesh.position.set(pl.x,.2,pl.z);camPos.init=false;
  if(!silent&&S.cs&&!S.cs.ended){const n=S.items.filter(i=>S.done[i.id]).length;toast(`You leave the ${S.kind==='scene'?'scene':'house'}. ${n}/${S.items.length} examined.`);}
}
