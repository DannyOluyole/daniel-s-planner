// ================= Eko Nights online: saves, officer profiles, squads, live presence
// Everything works offline on one device. Online (claude.ai capabilities, or Firebase via eko-online.js), saves sync
// across devices, officers can find each other, and squads see each other in the city.
// Built to scale: no global lobby, the directory is fetched on demand, and only squads (max 4) share live positions.
const GAME_VERSION=3;
const NET={squadMax:4,db:null,room:null,user:null,uid:null,canWrite:true,cfg:{online:true,squads:true,message:''},dir:{top:[],open:[],friends:[],found:null,at:0,busy:false},cache:new Map(),invites:[],credits:[],sq:null,sqHost:null,sqUnsub:null,sqMembers:new Map(),pm:new Map(),status:'offline',lastProfile:'',lastSq:'',busy:{}};
const SAVE_KEY='eko-save';
let RESUME=null;try{RESUME=JSON.parse(localStorage.getItem(SAVE_KEY));}catch(e){}

// ---------- saving: everything needed to pick up exactly where you stopped
function snapshot(){
  const cs=curCase&&!curCase.ended?curCase:null;
  let p={x:pl.x,z:pl.z,h:pl.h};if(insideS)p=insideS.back;else if(raidS)p=raidS.saved;
  return {v:1,at:Date.now(),career,
    world:{min:Math.round(worldMin),inCar:inCar&&!insideS&&!raidS,pc:{x:pc.x,z:pc.z,h:pc.h},pl:p,shift:Object.assign({},shift)},
    case:cs?{type:cs.gen,title:cs.title,seed:cs.seed,opt:cs.opt,startMin:cs.startMin,story:!!cs.story,si:cs.si,squad:cs.squad||null,backup:cs.backup||null,ticket:cs.ticket||null,st:caseState(cs)}:null,
    prisoner:prisoner&&prisoner.cs===cs?prisoner.p.id:null};
}
function saveGame(){
  if(!started||!career.officer)return;
  try{saveCareer();const s=snapshot();RESUME=s;localStorage.setItem(SAVE_KEY,JSON.stringify(s));}catch(e){}
}
let cloudKey='',cloudAt=0,cloudSig='';
async function saveCloud(){
  if(!NET.ready||!NET.db||!NET.uid||!NET.canWrite||!started||!career.officer||NET.busy.save)return;
  const s=snapshot();const j=JSON.stringify(s);const k=j.replace(/"at":\d+,/,'');if(k===cloudKey)return;
  NET.busy.save=true;try{await NET.db.doc(`data/users/${NET.uid}/save`).set({at:s.at,blob:j});cloudKey=k;cloudAt=Date.now();cloudSig=eventSig();}catch(e){if(e&&e.code==='invalid_argument')NET.canWrite=false;}
  NET.busy.save=false;
}
// The things worth saving straight away: rank, story progress, a new case, a new clue or arrest.
function eventSig(){const cs=curCase;const s=career.story||{};return [career.xp,career.cases,s.ch,s.i,s.step,cs?cs.seed:0,cs?cs.evidence.length:0,cs?cs.custody.length:0].join('|');}
function cloudTick(){if(!started)return;const t=Date.now()-cloudAt;if((eventSig()!==cloudSig&&t>20000)||t>120000)saveCloud();}
setInterval(saveGame,4000);setInterval(cloudTick,5000);
addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){saveGame();saveCloud();}});
addEventListener('pagehide',saveGame);
async function cloudLoad(){
  try{const d=await NET.db.doc(`data/users/${NET.uid}/save`).get();if(!d.exists)return;const s=JSON.parse(d.data().blob);
    if(s&&s.career&&(!RESUME||!RESUME.at||s.at>RESUME.at)&&!started){RESUME=s;career=s.career;saveCareer();try{localStorage.setItem(SAVE_KEY,JSON.stringify(s));}catch(e){}renderCharBox();}
  }catch(e){}
}
function resumeLine(){
  const R=RESUME;if(!R||!R.case||!career.officer)return '';
  const c=R.case;const st=c.st||{};return `<span class="muted resume">Resuming: ${esc(c.title||caseLabelOf(c.type))}${c.squad?' · squad case':''}${st.ev?` · ${st.ev.length} clues`:''}</span>`;
}
const caseLabelOf=t=>({robbery:'Armed robbery',kidnap:'Kidnapping',homicide:'Homicide',romance:'Romance fraud',yahoo:'Cyber fraud',contract:'Public corruption',leak:'Inside Man',finale:'Harmattan'})[t]||'Case';
function resumeGame(){
  const R=RESUME;if(!R||!R.world||!career.officer)return;const w=R.world;
  worldMin=w.min;Object.assign(shift,w.shift||{});
  if(w.pc){pc.x=w.pc.x;pc.z=w.pc.z;pc.h=w.pc.h;pc.mesh.position.set(pc.x,0,pc.z);pc.mesh.rotation.y=pc.h;}
  inCar=!!w.inCar;if(w.pl){pl.x=w.pl.x;pl.z=w.pl.z;pl.h=w.pl.h;pl.mesh.position.set(pl.x,.2,pl.z);}pl.mesh.visible=!inCar;camPos.init=false;
  if(R.case){try{
    const c=R.case;const cs=makeCase(c.type,c.seed,c.opt);cs.startMin=c.startMin;applyState(cs,c.st);cs.story=c.story;cs.si=c.si;cs.squad=c.squad;cs.backup=c.backup;cs.ticket=c.ticket||null;
    if(R.prisoner&&!cs.custody.includes(R.prisoner)){cs.custody.push(R.prisoner);cs.named[R.prisoner]=true;clog(cs,'The night shift booked your prisoner while you were away.');}
    curCase=cs;nextCases=null;if(cs.bank)setBankSign(cs.bank);if(cs.type==='contract')drawSiteBoard(cs);
    const L=leads(cs).find(l=>l.at);if(L)setGPS(L.at.x,L.at.z,L.at.label);
    if(cs.squad)squadJoin(cs.squad);if(cs.backup)spawnBackup(cs.backup);if(!cs.ticket)setTimeout(()=>ticketStart(cs),3000);
    setTimeout(()=>toast(`Welcome back. ${cs.title}: ${cs.evidence.length} clues on file${isFinite(cs.limit)?`, ${fmtMin(cs.limit-cs.used)} left`:''}.`,'good'),1200);
  }catch(e){console.warn('resume failed',e);}}
}

// ---------- officer profile: what other players see
function myCode(){if(NET.me&&NET.me.code)return NET.me.code;if(!career.code){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';career.code='EKO-'+Array.from({length:4},()=>A[Math.floor(_mr()*A.length)]).join('');saveCareer();}return career.code;}
function rating(c=career){const s=c.cases||0,f=c.failed||0;return Math.max(0,Math.min(100,Math.round((s+1)/(s+f+2)*55+Math.min(25,s*2.5)+(c.rep||0)*.2-(c.falseArrests||0)*2)));}
function specialty(c=career){const b=c.byType||{};const t=Object.keys(b).sort((x,y)=>b[y]-b[x])[0];return t?caseLabelOf(t):'Traffic';}
function squadInfo(){const cs=curCase;if(!cs||!cs.squad||cs.ended)return null;return {host:cs.squad,type:cs.gen,seed:cs.seed,opt:cs.opt,title:cs.title,startMin:cs.startMin,open:cs.squad===NET.uid};}
function presenceDoc(){const sq=squadInfo();const cs=curCase;return {seen:Date.now(),onCase:cs&&!cs.story&&!cs.ended?cs.title:null,open:!!(sq&&sq.open&&NET.cfg.squads),squad:sq,v:GAME_VERSION};}
function profileDoc(){if(NET.verified&&NET.me)return Object.assign({},NET.me,presenceDoc());const o=OFF();const sq=squadInfo();const cs=curCase;return {name:`${o.first} ${o.last}`,rank:rankOf(career.xp).name,xp:career.xp,code:myCode(),cases:career.cases||0,failed:career.failed||0,arrests:career.arrests||0,raids:career.raids||0,homicides:(career.byType||{}).homicide||0,trust:career.rep,rating:rating(),spec:specialty(),skin:o.skin,gender:o.gender,squad:sq,open:!!(sq&&sq.open&&NET.cfg.squads),onCase:cs&&!cs.story&&!cs.ended?cs.title:null,v:GAME_VERSION,seen:Date.now()};}
async function publishProfile(force){
  if(!NET.ready||!NET.db||!NET.uid||!NET.canWrite||!career.officer||NET.busy.prof||!started)return;
  if(NET.verified)return publishPresence(force);
  const d=profileDoc();const k=JSON.stringify(Object.assign({},d,{seen:0}));if(k===NET.lastProfile&&!force&&Date.now()-(NET.profAt||0)<300000)return;
  NET.busy.prof=true;try{await NET.db.doc('officers/'+NET.uid).set(d);NET.lastProfile=k;NET.profAt=Date.now();}catch(e){if(e&&e.code==='invalid_argument'){NET.canWrite=false;NET.status='readonly';}}
  NET.busy.prof=false;
}
setInterval(()=>{if(started)publishProfile();},8000);
// Verified mode: name, code and stats come from the server; the game only reports presence.
async function registerOfficer(){
  if(!NET.srv||!career.officer||NET.busy.reg)return;const o=OFF();const want=`${o.first} ${o.last}`;
  if(NET.me&&NET.me.name===want&&NET.me.skin===o.skin)return;if(NET.regFor===want+o.skin)return;
  NET.busy.reg=true;NET.regFor=want+o.skin;
  try{const r=await NET.srv.call('registerOfficer',{first:o.first,last:o.last,gender:o.gender,skin:o.skin});career.code=r.code;saveCareer();
    if(!r.ok&&r.message)toast(`Online name: ${r.name}. ${r.message}`,'bad');}catch(e){if(started)toast('Could not reach the Division 9 server. You can keep playing.','bad');NET.regFor='';}
  NET.busy.reg=false;
}
async function publishPresence(force){
  if(!NET.me){await registerOfficer();return;}
  const d=presenceDoc();const k=JSON.stringify(Object.assign({},d,{seen:0}));if(k===NET.lastProfile&&!force&&Date.now()-(NET.profAt||0)<300000)return;
  NET.busy.prof=true;try{await NET.db.doc('officers/'+NET.uid).update(d);NET.lastProfile=k;NET.profAt=Date.now();}catch(e){}
  NET.busy.prof=false;
}
// Case tickets: the server records when each case starts and checks the result when it ends.
function ticketStart(cs){
  if(!NET.srv||!NET.me||!cs||cs.ticket||cs.ended||cs.ticketBusy)return;cs.ticketBusy=true;
  NET.srv.call('startCase',{type:cs.gen,seed:cs.seed,opt:cs.opt||{},squadHost:cs.squad&&cs.squad!==NET.uid?cs.squad:null})
    .then(r=>{cs.ticket=r.ticketId;}).catch(e=>{if(e.code==='resource-exhausted')toast('This case won\'t count towards your verified record: too many new cases this hour.','bad');})
    .finally(()=>{cs.ticketBusy=false;});
}
async function ticketClose(cs,how,success){
  if(!NET.srv||!cs.ticket)return;
  const claim={success,caught:cs.gang.filter(id=>cs.custody.includes(id)).length,falseArrests:cs.falseArrests,evidence:cs.evidence.length,raid:!!cs.flags.raidWin,backup:cs.backup?cs.backup.uid:null,paid:!!(cs.flags.paid||cs.flags.honPaid),title:cs.title,timeFrac:cs.scoreIn?cs.scoreIn.timeFrac:0,badShots:cs.scoreIn?cs.scoreIn.badShots:0};
  try{const r=await NET.srv.call('closeCase',{ticketId:cs.ticket,outcome:how,claim});if(r.daily)dailyVerified(cs,r.daily);
    if(r.accepted&&r.xp&&!r.reason)toast(`Verified service record: +${r.xp} XP${r.backupXp?`, and +${r.backupXp} XP to your backup`:''}.`,'good');
    else if(r.reason==='daily_cap')toast('Daily limit reached: this case counts, but gives no verified XP today.');
    else if(r.reason==='too_fast')toast('Not added to your verified record: the case was closed faster than the server allows.','bad');
    else if(r.reason==='no_arrest')toast('Not added to your verified record: no arrest was reported.','bad');
  }catch(e){}
}
const isOnline=o=>o&&o.seen&&Date.now()-o.seen<6*60000;

// ---------- connecting to claude.ai capabilities
(async function netInit(){
  if(!window.claude||!claude.use)return;
  try{
    const [db,user,room,srv]=await Promise.all([claude.use('db'),claude.use('user'),claude.use('room'),claude.use('ekoserver')]);NET.srv=srv||null;
    NET.user=user;NET.uid=user?await user.id():null;NET.db=NET.uid?db:null;NET.room=room;NET.verified=!!(NET.srv&&NET.db);
    if(NET.uid&&!started)switchDeviceOwner(NET.uid);
    if(user){const w=await user.can('data.write');if(w===false){NET.canWrite=false;}}
    NET.status=NET.db?(NET.canWrite?'online':'readonly'):'offline';
    if(NET.db){
      await cloudLoad();
      await loadLiveConfig();setInterval(loadLiveConfig,10*60000);
      if(NET.verified){
        NET.db.doc('officers/'+NET.uid).onSnapshot(s=>{NET.me=s.exists?Object.assign({uid:NET.uid},s.data()):null;if(NET.me&&started)registerOfficer();redrawOfficers();},()=>{});
        NET.db.doc('inbox/'+NET.uid).onSnapshot(s=>{const v=s.exists?s.data():{};const now=Date.now();
          const fresh=(v.invites||[]).filter(i=>now-i.at<3*3600e3);
          fresh.forEach(i=>{if(!NET.invites.some(x=>x.from===i.from&&x.at===i.at)&&started){SFX.blip('radio');toast(`${i.name} invited you to a case: ${i.title}. Open Dispatch (Tab) to join.`,'good');}});
          NET.invites=fresh;NET.credits=(v.notices||[]).map(n=>Object.assign({to:NET.uid},n));claimCredits(true);},()=>{});
      }else{
      NET.db.collection('invites').where('to','array-contains',NET.uid).onSnapshot(s=>{
        const fresh=s.docs.map(d=>Object.assign({from:d.id},d.data())).filter(i=>Date.now()-i.at<3*3600e3);
        fresh.forEach(i=>{if(!NET.invites.some(x=>x.from===i.from&&x.at===i.at)&&started){SFX.blip('radio');toast(`${i.name} invited you to a case: ${i.title}. Open Dispatch (Tab) to join.`,'good');}});
        NET.invites=fresh;},()=>{});
      NET.db.collection('assists').where('to','array-contains',NET.uid).onSnapshot(s=>{NET.credits=[];s.docs.forEach(d=>(d.data().list||[]).forEach(c=>{if(c.to===NET.uid)NET.credits.push(c);}));claimCredits();},()=>{});
      }
    }
    NET.ready=true;renderCharBox();if(started)publishProfile(true);
  }catch(e){console.warn('online features unavailable',e);}
})();
// Remote switches, read from config/live: turn online features or squads off without shipping a new version.
async function loadLiveConfig(){
  try{const d=await NET.db.doc('config/live').get();const c=d.exists?d.data():{};NET.cfg={online:c.online!==false,squads:c.squads!==false,message:c.message||'',minVersion:c.minVersion||0};}catch(e){return;}
  if(!NET.cfg.online){if(NET.status!=='paused'){NET.status='paused';NET.canWrite=false;squadLeave();toast(NET.cfg.message||'Online play is paused for maintenance. Your game keeps saving on this device.','bad');}}
  else if(NET.status==='paused'){NET.status='online';NET.canWrite=true;}
  if(!NET.cfg.squads&&NET.sqHost)squadLeave();
  if(NET.cfg.minVersion>GAME_VERSION&&!NET.warnedVer){NET.warnedVer=true;toast('A new version of Eko Nights is available. Reload the page to update.','promo');}
}
// One device, several people: keep each signed-in account's local officer separate.
// The first account to sign in on a device adopts whatever was played offline there.
function switchDeviceOwner(uid){
  try{const last=localStorage.getItem('eko-uid');localStorage.setItem('eko-uid',uid);if(!last||last===uid)return;
    localStorage.setItem('p9-career@'+last,localStorage.getItem('p9-career')||'');localStorage.setItem('eko-save@'+last,localStorage.getItem(SAVE_KEY)||'');
    const c=localStorage.getItem('p9-career@'+uid),sv=localStorage.getItem('eko-save@'+uid);
    career=c?JSON.parse(c):{badge:ri(1100,9899),xp:0,rep:40,tickets:0,warnings:0,arrests:0,cases:0,failed:0,falseArrests:0,log:[]};RESUME=sv?JSON.parse(sv):null;
    saveCareer();if(RESUME)localStorage.setItem(SAVE_KEY,JSON.stringify(RESUME));else localStorage.removeItem(SAVE_KEY);CHAR.newMode=false;renderCharBox();
  }catch(e){}
}
function netStatusLine(){
  return {online:'Online: your progress syncs to your account and other officers can find you.',paused:'Online play is paused right now. Your game keeps saving on this device and will sync again when it is back.',readonly:'You can see other officers, but this page is view-only for you, so your profile and cloud save are off. Ask the owner to share it with you as a Contributor.',offline:window.EKO_FIREBASE!==undefined?'Offline: progress is saved on this device only. Sign in from the title screen to play with other officers.':'Offline: progress is saved on this device only. Open the game inside claude.ai to play with other officers.'}[NET.status];
}

// ---------- the Officers tab in the MDT
function avatarOf(o){return avatar({skin:o.skin||SKIN[2],shirt:'#1f2b45',hair:{h:'#141010'}},48);}
function rememberOfficers(list){list.forEach(o=>NET.cache.set(o.uid,o));return list;}
async function fetchDirectory(force){
  if(!NET.db||NET.dir.busy)return;if(!force&&Date.now()-NET.dir.at<60000)return;NET.dir.busy=true;
  const rows=s=>rememberOfficers(s.docs.map(d=>Object.assign({uid:d.id},d.data())).filter(o=>o.uid!==NET.uid));
  try{
    const [top,open]=await Promise.all([(NET.verified?NET.db.collection('officers').where('flagged','==',false):NET.db.collection('officers')).orderBy('rating','desc').limit(20).get(),NET.cfg.squads?NET.db.collection('officers').where('open','==',true).limit(30).get():null]);
    NET.dir.top=rows(top);NET.dir.open=open?rows(open).filter(o=>isOnline(o)&&o.squad):[];
    const ids=(career.friends||[]).slice(0,30);const fr=await Promise.all(ids.map(id=>NET.db.doc('officers/'+id).get().catch(()=>null)));
    NET.dir.friends=rememberOfficers(fr.filter(d=>d&&d.exists).map(d=>Object.assign({uid:d.id},d.data())));NET.dir.at=Date.now();
  }catch(e){}
  NET.dir.busy=false;redrawOfficers(true);
}
async function findByCode(code){
  code=code.trim().toUpperCase();if(!code)return;if(!code.startsWith('EKO-'))code='EKO-'+code.replace(/^EKO/,'');
  NET.dir.found={code,loading:true};redrawOfficers(true);
  try{const s=await NET.db.collection('officers').where('code','==',code).limit(1).get();const o=s.docs.map(d=>Object.assign({uid:d.id},d.data()))[0];NET.dir.found={code,o:o&&o.uid!==NET.uid?rememberOfficers([o])[0]:null};}
  catch(e){NET.dir.found={code,o:null};}
  redrawOfficers(true);
}
const isFriend=uid=>(career.friends||[]).includes(uid);
function setFriend(uid,on){career.friends=(career.friends||[]).filter(x=>x!==uid);if(on)career.friends.unshift(uid);career.friends=career.friends.slice(0,50);saveCareer();}
function officerCard(o,me){
  const solved=o.cases||0,rate=solved+(o.failed||0)?Math.round(solved/(solved+(o.failed||0))*100):0;const live=!me&&isOnline(o);
  const sq=o.squad;const cs=curCase;const mine=cs&&cs.squad===NET.uid&&!cs.ended;const ok=NET.status==='online';
  const status=me?'':live?(o.onCase?`<span class="chip ok">Online · on "${esc(o.onCase)}"</span>`:'<span class="chip ok">Online</span>'):`<span class="chip">Last seen ${ago(o.seen)}</span>`;
  const acts=me||!ok?'':[
    sq&&o.open&&live&&!cs&&NET.cfg.squads?`<button class="btn sm" data-join="${o.uid}">Join their case</button>`:'',
    mine&&live&&NET.cfg.squads?`<button class="btn sm" data-invite="${o.uid}">Invite to my case</button>`:'',
    cs&&!cs.story&&!cs.ended&&!cs.backup&&!live?`<button class="btn ghost sm" data-backup="${o.uid}">Bring as backup</button>`:'',
    `<button class="btn ghost sm" data-friend="${o.uid}">${isFriend(o.uid)?'Remove friend':'Add friend'}</button>`].join('');
  return `<div class="ocard${me?' me':''}">${avatarOf(o)}<div class="oinfo"><div class="oname">${esc(o.name)}${me?' <span class="chip amber">You</span>':''}</div>
    <div class="muted" style="font-size:13px">${esc(o.rank)} · ${esc(o.code||'')} · ${esc(o.spec||'Traffic')} specialist</div>
    <div class="ostats"><span><b>${o.rating||0}</b> rating</span><span><b>${solved}</b> solved</span><span><b>${rate}%</b> solve rate</span><span><b>${o.homicides||0}</b> homicides</span><span><b>${o.raids||0}</b> raids</span><span><b>${o.trust||0}</b> trust</span></div>
    <div class="rbar"><i style="width:${o.rating||0}%"></i></div>${status}${sq&&!me&&o.open?` <span class="chip amber">Squad open: ${esc(sq.title)}</span>`:''}</div><div class="oacts">${acts}</div></div>`;
}
const ago=t=>{if(!t)return 'a while ago';const m=Math.round((Date.now()-t)/60000);return m<2?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago';};
let offCode='';
function drawOfficers(body){
  const cs=curCase;const me=Object.assign({uid:NET.uid},profileDoc());const D=NET.dir;const ok=NET.status==='online';
  if(ok)fetchDirectory();
  const section=(title,list,empty)=>`<h3 class="osec" style="margin:18px 0 8px">${title}</h3>${list.length?list.map(o=>officerCard(o)).join(''):`<div class="empty">${empty}</div>`}`;
  const squadBox=cs&&!cs.story&&!cs.ended?(cs.squad?`<div class="sqbox"><b>Squad case: ${esc(cs.title)}</b><p class="muted">${cs.squad===NET.uid?`Share your code <b class="mono">${myCode()}</b> or invite officers below. Up to 4 officers get the same case, see each other in the city, and share every clue and arrest.`:'You joined this case. Clues and arrests are shared with the squad.'}</p>
      <div class="roster">${[...NET.sqMembers.values()].map(m=>`<span class="chip ${m.live?'ok':''}">${esc(m.name)} · ${esc(m.rank)}${m.live?' · here now':''}</span>`).join('')||'<span class="muted">No one else has joined yet.</span>'}</div>
      ${cs.squad!==NET.uid?'<button class="btn ghost sm" id="sqLeave">Leave the squad</button>':''}</div>`
    :`<div class="sqbox"><b>${esc(cs.title)}</b><p class="muted">Working alone. Open this case to a squad so up to 3 other officers can join, or bring an offline officer as AI backup.</p>${ok&&NET.cfg.squads?'<button class="btn sm" id="sqOpen">Open this case to a squad</button>':''}${cs.backup?`<p class="muted">Backup: <b>${esc(cs.backup.name)}</b> (${cs.backup.rating} rating). Leads cost ${Math.round(backupCut(cs)*100)}% less time.</p>`:''}</div>`):'';
  const F=D.found;
  body.innerHTML=`<p class="muted" style="margin-top:0">${netStatusLine()}${NET.verified?' Ranks, XP and case stats here are your verified service record, checked by the Division 9 server.':''}${NET.cfg.message&&NET.status==='online'?` <b>${esc(NET.cfg.message)}</b>`:''}</p>${officerCard(me,true)}${squadBox}
    ${ok?`<label class="muted" for="oQ" style="display:block;margin:16px 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase">Find an officer by friend code</label><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="oQ" class="mono" placeholder="EKO-7K2P" autocomplete="off" value="${esc(offCode)}" style="flex:1 1 180px;min-width:0;max-width:280px;background:var(--panel2);border:1px solid var(--line);border-radius:4px;padding:8px 10px;color:inherit"><button class="btn sm" id="oFind">Find</button><button class="btn ghost sm" id="oRef">Refresh</button></div>
    ${F?(F.loading?'<div class="empty">Searching…</div>':F.o?officerCard(F.o):`<div class="empty">No officer has the code ${esc(F.code)}. Check it with your friend.</div>`):''}
    ${NET.cfg.squads?section('Squads looking for officers',D.open,'No open squads right now. Open your own case to a squad from the Case you are working.'):''}
    ${section('Friends',D.friends,'Add officers as friends to see them here.')}
    ${section('Top officers',D.top,D.at?'No officers yet.':'Loading…')}`
    :`<div class="empty">${NET.status==='paused'?'The officer network is paused for now.':'The officer directory needs the online version of the game.'}</div>`}`;
  const q=$('#oQ',body);if(q){q.oninput=()=>{offCode=q.value;};q.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();findByCode(q.value);}};$('#oFind',body).onclick=()=>findByCode(q.value);$('#oRef',body).onclick=()=>fetchDirectory(true);}
  const so=$('#sqOpen',body);if(so)so.onclick=()=>{openSquad();drawOfficers(body);};
  const sl=$('#sqLeave',body);if(sl)sl.onclick=()=>{leaveSquadCase();drawOfficers(body);};
  $$('[data-join]',body).forEach(b=>b.onclick=()=>joinSquadByHost(b.dataset.join));
  $$('[data-invite]',body).forEach(b=>b.onclick=()=>{sendInvite(b.dataset.invite);b.disabled=true;b.textContent='Invited';});
  $$('[data-backup]',body).forEach(b=>b.onclick=()=>{const o=NET.cache.get(b.dataset.backup);if(o){takeBackup(o);drawOfficers(body);}});
  $$('[data-friend]',body).forEach(b=>b.onclick=()=>{const id=b.dataset.friend;setFriend(id,!isFriend(id));NET.dir.at=0;fetchDirectory(true);});
}
function redrawOfficers(force){const el=$('#modal [data-mdt]');if(el&&mdtTab==='officers'&&(force||!document.activeElement.matches('#oQ')))drawOfficers($('#mdtBody',el));}
function inviteCards(){
  return NET.invites.filter(i=>!curCase||curCase.squad!==i.from).map(i=>`<article class="offer urgent"><div class="code"><b>SQD</b>Invite</div><div><h3>${esc(i.name)} wants backup</h3><p>${esc(i.rank)} ${esc(i.name)} invited you to join "${esc(i.title)}". You get the same case and share every clue and arrest.</p></div><button class="btn" data-inv="${i.from}" ${curCase?'disabled':''}>Join</button></article>`).join('');
}

// ---------- squads: same case, shared clues, live positions
const roomName=uid=>'sq-'+String(uid).toLowerCase().replace(/[^a-z0-9]/g,'').slice(-40);
function openSquad(){const cs=curCase;if(!cs||!NET.uid||!NET.cfg.squads)return;cs.squad=NET.uid;squadJoin(NET.uid);publishProfile(true);toast(`Squad open. Your code is ${myCode()}. Invite officers from the Officers tab.`,'good');}
async function sendInvite(uid){
  if(!NET.db||!curCase)return;
  if(NET.verified){try{await NET.srv.call('sendInvite',{to:uid});toast('Invite sent.','good');}catch(e){toast(e.message||'Could not send the invite.','bad');}return;}const o=NET.cache.get(uid);
  try{const ref=NET.db.doc('invites/'+NET.uid);const cur=await ref.get();const to=((cur.exists&&cur.data().title===curCase.title&&cur.data().to)||[]).filter(x=>x!==uid).concat(uid).slice(-12);
    await ref.set({to,name:`${OFF().first} ${OFF().last}`,rank:rankOf(career.xp).name,title:curCase.title,at:Date.now()});toast(`Invite sent${o?' to '+o.name:''}.`,'good');}catch(e){toast('Could not send the invite.','bad');}
}
async function joinSquadByHost(host){
  if(curCase){toast('Close or hand back your current case first.','bad');return;}
  if(!NET.db||!NET.cfg.squads){toast('Squads are not available right now.','bad');return;}
  let o=null;try{const d=await NET.db.doc('officers/'+host).get();if(d.exists)o=Object.assign({uid:host},d.data());}catch(e){}
  if(!o||!o.squad||!o.open||!isOnline(o)){toast('That case has already been closed.','bad');return;}
  try{const s=await NET.db.collection('squadstate').where('squad','==',host).get();
    const active=s.docs.filter(d=>{const v=d.data();return d.id!==NET.uid&&d.id!==host&&Date.now()-(v.at||0)<2*3600e3&&!(v.blob||'').includes('"ended":"');}).length;
    if(active+1>=NET.squadMax){toast(`That squad is full (${NET.squadMax} officers).`,'bad');return;}}catch(e){}
  const q=o.squad;const cs=makeCase(q.type,q.seed,q.opt);cs.squad=q.host;cs.startMin=q.startMin;
  startCase(cs);squadJoin(q.host);NET.invites=NET.invites.filter(i=>i.from!==host);setFriend(host,true);
  toast(`You joined ${o.name} on "${cs.title}". Clues and arrests are shared.`,'good');publishProfile(true);
}
function leaveSquadCase(){const cs=curCase;if(!cs)return;squadLeave();if(NET.db&&NET.canWrite)NET.db.doc('squadstate/'+NET.uid).set({squad:'',name:`${OFF().first} ${OFF().last}`,rank:rankOf(career.xp).name,at:Date.now(),blob:''}).catch(()=>{});cs.squad=null;toast('You left the squad. The case is yours alone now.');publishProfile(true);}
async function squadJoin(host){
  if(NET.sqHost===host)return;squadLeave();NET.sqHost=host;NET.sqMembers=new Map();
  if(NET.db){NET.sqUnsub=NET.db.collection('squadstate').where('squad','==',host).onSnapshot(s=>{
    s.docs.forEach(d=>{const v=d.data();if(d.id===NET.uid)return;if(!NET.sqMembers.has(d.id)&&d.id!==host)setFriend(d.id,true);NET.sqMembers.set(d.id,{name:v.name,rank:v.rank,live:(NET.sqMembers.get(d.id)||{}).live||false});
      const cs=curCase;if(!cs||cs.squad!==host||!v.blob)return;let st;try{st=JSON.parse(v.blob);}catch(e){return;}
      const before=cs.evidence.length;if(applyState(cs,st)){if(cs.evidence.length>before)toast(`${v.name} logged new evidence: ${cs.evidence[cs.evidence.length-1].title}.`,'good');}
      if(st.ended==='closed'&&!cs.ended&&caseCanClose(cs)){toast(`${v.name} closed the case.`,'good');setTimeout(()=>{if(!cs.ended)endCase(cs,'closed');},600);}
    });redrawOfficers();},()=>{});}
  if(NET.room&&NET.cfg.squads){try{NET.sq=await NET.room.join(roomName(host));NET.sq.onPeers(ch=>{
    const live=new Set(ch.peers.filter(p=>!p.isMe).map(p=>p.presence&&p.presence.uid));NET.sqMembers.forEach((m,id)=>m.live=live.has(id));
    ch.joined.forEach(p=>{if(!p.isMe&&p.presence&&p.presence.name)toast(`${p.presence.name} is on the case with you.`);});redrawOfficers();},()=>{});}catch(e){NET.sq=null;}}
  pushSquadState(true);
}
function squadLeave(){
  if(NET.sqUnsub){NET.sqUnsub();NET.sqUnsub=null;}if(NET.sq){NET.sq.leave().catch(()=>{});NET.sq=null;}
  NET.pm.forEach(m=>{scene.remove(m.person,m.car,m.tag);});NET.pm.clear();NET.sqHost=null;NET.lastSq='';
}
async function pushSquadState(force){
  const cs=curCase;if(!NET.ready||!NET.db||!NET.canWrite||!cs||!cs.squad||NET.busy.sq)return;
  const st=caseState(cs);const k=JSON.stringify(Object.assign({},st,{used:0}));if(k===NET.lastSq&&!force)return;
  NET.busy.sq=true;try{await NET.db.doc('squadstate/'+NET.uid).set({squad:cs.squad,name:`${OFF().first} ${OFF().last}`,rank:rankOf(career.xp).name,at:Date.now(),blob:JSON.stringify(st)});NET.lastSq=k;}catch(e){}
  NET.busy.sq=false;
}
setInterval(()=>{if(started)pushSquadState();},1500);
function onCaseEnd(cs,how,success){
  cs.endedHow=how;
  if(success){(career.byType=career.byType||{})[cs.type]=(career.byType[cs.type]||0)+1;saveCareer();if(cs.backup&&!NET.verified)creditBackup(cs);}
  if(NET.verified)ticketClose(cs,how,success);
  if(cs.squad&&NET.db&&NET.canWrite){const st=caseState(cs);NET.db.doc('squadstate/'+NET.uid).set({squad:cs.squad,name:`${OFF().first} ${OFF().last}`,rank:rankOf(career.xp).name,at:Date.now(),blob:JSON.stringify(st)}).catch(()=>{});setTimeout(squadLeave,4000);}
  if(cs.backup)removeBackup();
  RESUME=null;setTimeout(()=>{saveGame();saveCloud();publishProfile(true);},400);
}

// ---------- squad-mates in the 3D city
function nameTag(text){
  const [c,g]=mkC(256,56);g.fillStyle='rgba(11,18,32,.82)';rr(g,4,6,248,44,10);g.fill();g.fillStyle='#f4b740';g.font='700 26px IBM Plex Sans, Arial, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text.slice(0,20),128,29);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:ctex(c),depthTest:false,transparent:true}));s.scale.set(2.6,.57,1);s.renderOrder=5;return s;
}
let presT=0,lastPres=null;
function netFrame(dt){
  const S=NET.sq;if(!S)return;
  presT-=dt;if(presT<=0){presT=.4;const me=inCar?{x:+pc.x.toFixed(1),z:+pc.z.toFixed(1),h:+pc.h.toFixed(2),car:1}:{x:+pl.x.toFixed(1),z:+pl.z.toFixed(1),h:+pl.h.toFixed(2),car:0};
    const L=lastPres;if(!L||L.car!==me.car||Math.hypot(me.x-L.x,me.z-L.z)>.3||Math.abs(angDiff(me.h,L.h))>.12){lastPres=me;S.presence(Object.assign(me,{uid:NET.uid,name:`${OFF().first} ${OFF().last}`,rank:rankOf(career.xp).name,skin:OFF().skin})).catch(()=>{});}}
  const seen=new Set();
  for(const p of S.peers()){
    if(p.isMe||!p.presence||p.presence.x==null)continue;seen.add(p.peer);const q=p.presence;let m=NET.pm.get(p.peer);
    if(!m){m={person:makePersonMesh(Object.assign(playerLook(),{skin:q.skin||SKIN[2],bun:false})),car:makeCarMesh('#15171c','Sedan',true,false),tag:nameTag(q.name||'Officer'),x:q.x,z:q.z,h:q.h,ph:0};scene.add(m.person,m.car,m.tag);NET.pm.set(p.peer,m);}
    const dx=q.x-m.x,dz=q.z-m.z,d=Math.hypot(dx,dz),k=Math.min(1,dt*(d>25?20:4));m.x+=dx*k;m.z+=dz*k;m.h+=angDiff(q.h,m.h)*Math.min(1,dt*5);
    m.car.visible=!!q.car;m.person.visible=!q.car;
    if(q.car){m.car.position.set(m.x,0,m.z);m.car.rotation.y=m.h;}else{m.person.position.set(m.x,.2,m.z);m.person.rotation.y=m.h;if(d>.05){m.ph+=dt*8;animWalk(m.person,m.ph,.45);}else pose(m.person,'idle',tAcc);}
    m.tag.position.set(m.x,q.car?2.6:2.4,m.z);m.tag.visible=!raidS&&!insideS&&!cctv;
  }
  NET.pm.forEach((m,k)=>{if(!seen.has(k)){scene.remove(m.person,m.car,m.tag);NET.pm.delete(k);}});
}

// ---------- AI backup: bring an offline officer onto your case
const backupCut=cs=>cs.backup?Math.min(.3,(cs.backup.rating||0)/300):0;
let backupM=null;
function takeBackup(o){const cs=curCase;if(!cs)return;cs.backup={uid:o.uid,name:o.name,rating:o.rating||0,spec:o.spec||'Traffic',skin:o.skin};spawnBackup(cs.backup);clog(cs,`${o.name} (${o.rank}) joined as backup.`);toast(`${o.name} is riding with you. Leads cost ${Math.round(backupCut(cs)*100)}% less time, and they share the credit.`,'good');}
function spawnBackup(b){removeBackup();backupM={mesh:makePersonMesh(Object.assign(playerLook(),{skin:b.skin||SKIN[2],bun:false})),tag:nameTag(b.name),x:pl.x+1,z:pl.z+1,ph:0};scene.add(backupM.mesh,backupM.tag);}
function removeBackup(){if(backupM){scene.remove(backupM.mesh,backupM.tag);backupM=null;}}
function updateBackup(dt){
  if(!backupM)return;const B=backupM;const show=!inCar&&!raidS&&!insideS&&!cctv;B.mesh.visible=B.tag.visible=show;if(!show){B.x=pl.x-1;B.z=pl.z-1;return;}
  const tx=pl.x-Math.sin(pl.h)*1.4+Math.cos(pl.h)*1.1,tz=pl.z-Math.cos(pl.h)*1.4-Math.sin(pl.h)*1.1;const dx=tx-B.x,dz=tz-B.z,d=Math.hypot(dx,dz);
  if(d>30){B.x=tx;B.z=tz;}else if(d>.5){const sp=Math.min(d*2.4,7);B.x+=dx/d*sp*dt;B.z+=dz/d*sp*dt;B.ph+=dt*sp*1.9;animWalk(B.mesh,B.ph,.45,sp>5);B.mesh.rotation.y=Math.atan2(dx,dz);}else{pose(B.mesh,'idle',tAcc);B.mesh.rotation.y=pl.h;}
  B.mesh.position.set(B.x,.2,B.z);B.tag.position.set(B.x,2.4,B.z);
}
async function creditBackup(cs){
  if(!NET.db||!NET.canWrite)return;const b=cs.backup;
  try{const ref=NET.db.doc('assists/'+NET.uid);const cur=await ref.get();const list=((cur.exists&&cur.data().list)||[]).slice(-19);
    list.push({id:cs.seed+'-'+Date.now(),to:b.uid,from:`${OFF().first} ${OFF().last}`,title:cs.title,xp:60,at:Date.now()});
    await ref.set({list,to:[...new Set(list.map(c=>c.to))]});}catch(e){}
}
function claimCredits(verified){
  if(!career.officer)return;career.claimed=career.claimed||[];let n=0;
  NET.credits.forEach(c=>{if(!career.claimed.includes(c.id)){career.claimed.push(c.id);gainXP(c.xp);n++;toast(`${c.from} closed "${c.title}" with you as backup. +${c.xp} XP${verified?' on your verified record':''}.`,'good');}});
  if(n){career.claimed=career.claimed.slice(-60);saveCareer();}
}

storyMigrate();renderCharBox();
