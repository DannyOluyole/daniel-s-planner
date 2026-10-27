// ================= Patrol Rush: five minutes of street work for points, with a weekly leaderboard
// More speeders, red-light runners and street calls than a normal shift. Clean traffic stops, boxed-in pursuits and
// arrests score points; doing them back to back builds a combo multiplier, and a sloppy stop, an escape or an
// unjustified shooting breaks it. The best run of the week goes on the leaderboard (in verified mode the server checks it).
const RUSH_LEN=300;                 // seconds of game time (each frame is at most 0.05 s, so never shorter in real time)
const RUSH_COMBO_WINDOW=75;         // seconds after a success before the combo runs out
const rushMult=c=>1+Math.min(3,Math.floor(c/2))*.5;   // x1, x1.5, x2, x2.5
let RUSH=null;
// weeks run Monday to Sunday in Port Eko time: the key is the date of that Monday
const rushWeek=(t=Date.now())=>{const d=new Date(t+3600e3);d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);};
const rushWeekLeft=()=>{const end=Date.parse(rushWeek()+'T00:00:00Z')+7*864e5;return fmtMin(Math.ceil((end-(Date.now()+3600e3))/60000));};

function rushStart(){
  if(RUSH)return;
  if(curCase){toast('Close or hand back your case before starting Patrol Rush.','bad');return;}
  if(raidS||insideS||cctv||cine||prisoner||chase||runner){toast('Finish what you are doing first.','bad');return;}
  closeModal();
  if(!inCar){pl.x=pc.x;pl.z=pc.z;inCar=true;pl.mesh.visible=false;camPos.init=false;}
  gps=null;gpsPerson=null;if(CB.inc)cbIncidentEnd(true);
  RUSH={t:RUSH_LEN,score:0,combo:0,best:0,comboT:0,last:'',lastT:0,n:{stops:0,clean:0,pursuits:0,incidents:0,arrests:0,mistakes:0},
    inq:career.inquiries||0,chase:null,startedAt:Date.now(),ticket:null,over:false,incT:25,incT0:CB.incT};
  // Patrol Rush sends its own street calls (to every player, whatever their chapter); the normal timer waits
  CB.incT=1e9;document.body.classList.add('rush');
  // more offenders on the road straight away
  aiCars.forEach(c=>{if(!c.small&&c.mode==='drive'&&Math.random()<.3)rushSpeeder(c);});
  SFX.blip('radio');toast('Patrol Rush! Five minutes. Stop speeders, box in runners, answer every call. Chain them for a combo.','promo');
  if(NET.srv&&NET.me)NET.srv.call('startRush',{}).then(r=>{if(RUSH)RUSH.ticket=r.ticketId;}).catch(()=>{});
  rushHud();
}
function rushSpeeder(c){c.cruise=c.speed=rnd(64,95)/3.6;c.speeding=c.cruise*3.6>LIMIT+.5;if(Math.random()<.4)c.runsRed=true;}
// points for one piece of work; good work grows the combo, a mistake breaks it
function rushEvent(label,pts,good,stat){
  const R=RUSH;if(!R||R.over&&!stat)return;
  if(stat)R.n[stat]=(R.n[stat]||0)+1;
  if(good){R.combo++;R.best=Math.max(R.best,R.combo);R.comboT=RUSH_COMBO_WINDOW;const p=Math.round(pts*rushMult(R.combo-1));R.score+=p;R.last=`+${p} ${label}${R.combo>2?` · x${rushMult(R.combo-1)}`:''}`;SFX.blip('good');}
  else{R.combo=0;R.comboT=0;R.n.mistakes++;if(pts)R.score=Math.max(0,R.score+pts);R.last=`${pts?pts+' ':''}${label} · combo lost`;SFX.blip('bad');}
  R.lastT=3;rushHud();
}
// traffic stops: graded by the stop form; XP above zero means it was done right
trafficStop=(base=>function(car,fled,done){
  const x0=shift.xp,s0=shift.stops;
  return base(car,fled,arrested=>{
    if(RUSH&&shift.stops>s0){const xp=shift.xp-x0;
      if(xp>0)rushEvent(arrested?'Clean stop and arrest':'Clean stop',200+xp*4+(arrested?150:0),true,'stops');
      else rushEvent('Sloppy stop',0,false,'stops');
      if(xp>0)RUSH.n.clean++;if(arrested)RUSH.n.arrests++;}
    done(arrested);});
})(trafficStop);
// street calls: points per suspect in cuffs, more if nobody needed force
cbIncidentCheck=(base=>function(){
  const I=CB.inc;const ready=I&&!I.foes.some(a=>CB.foes.includes(a));
  const got=ready?I.foes.filter(a=>a.state==='cuffed').length:0,all=ready&&got===I.foes.length,clean=all&&!CB.force,fair=all&&!CB.bad;
  base();
  if(RUSH&&ready){if(got){rushEvent(`${I.typ.title}: ${got} arrested`,got*250+(clean?300:fair?150:0),true,'incidents');RUSH.n.arrests+=got;}else rushEvent(`${I.typ.title}: they got away`,0,false,'incidents');RUSH.incT=Math.min(RUSH.incT,rnd(35,55));}
})(cbIncidentCheck);
cbIncidentEnd=(base=>function(quiet){const I=CB.inc;base(quiet);if(RUSH&&I&&quiet&&!RUSH.over){rushEvent('Another unit took the call',0,false);RUSH.incT=Math.min(RUSH.incT,rnd(30,45));}})(cbIncidentEnd);
spawnAICar=(base=>function(over,near){const c=base(over,near);if(RUSH&&!c.small&&c.mode==='drive'&&!(over&&over.mode)&&Math.random()<.4)rushSpeeder(c);return c;})(spawnAICar);
// no new cases, story scenes or Daily Case while the clock runs
startCase=(base=>function(cs){if(RUSH){toast('Finish Patrol Rush first.','bad');return;}return base(cs);})(startCase);
storyTalk=(base=>function(who){if(RUSH){toast('Finish Patrol Rush first.','bad');return;}return base(who);})(storyTalk);
takeDaily=(base=>function(){if(RUSH){toast('Finish Patrol Rush first.','bad');return;}return base();})(takeDaily);

// every frame: the clock, the combo, pursuits and shootings
frame=(base=>function(){const t0=tAcc;base();if(RUSH)rushTick(tAcc-t0);})(frame);
function rushTick(dt){
  const R=RUSH;
  // pursuits: boxing in a runner scores, losing one breaks the combo
  if(chase&&chase.traffic&&chase!==R.chase){R.chase=chase;R.chaseScored=false;}
  if(R.chase){const c=R.chase.car;
    if(c.mode==='caught'&&!R.chaseScored){R.chaseScored=true;rushEvent('Runner boxed in',300,true,'pursuits');}
    else if(chase!==R.chase){if(!R.chaseScored&&c.mode!=='caught'&&c.mode!=='parked')rushEvent('The runner got away',0,false);R.chase=null;}}
  const inq=career.inquiries||0;if(inq>R.inq){R.inq=inq;rushEvent('Unjustified shooting',-500,false);}
  if(R.over){if(!blockingModal()&&!cine&&!modalOpen())rushEnd();return;}
  if(dt>0&&!blockingModal()&&!CB.inc&&!chase&&!runner&&!prisoner&&!cine&&!gps&&!CB.foes.length){R.incT-=dt;if(R.incT<=0){R.incT=rnd(35,55);cbIncidentStart();}}
  if(dt>0&&!blockingModal()){R.t-=dt;if(R.comboT>0){R.comboT-=dt;if(R.comboT<=0&&R.combo){R.combo=0;R.last='Combo ran out';R.lastT=2;}}}
  if(R.lastT>0)R.lastT-=dt;
  if(R.t<=0){R.t=0;R.over=true;if(blockingModal()||cine||modalOpen())toast('Time! Finish what you are doing.','promo');}
  rushHud();
}
function rushHud(){
  let el=$('#rushHud');
  if(!RUSH){if(el)el.hidden=true;return;}
  if(!el){el=document.createElement('div');el.id='rushHud';el.className='rushhud';$('.hud').appendChild(el);}
  const R=RUSH,m=Math.floor(R.t/60),s=Math.floor(R.t%60);el.hidden=false;
  el.innerHTML=`<div class="rt${R.t<30?' low':''}">${R.over?'TIME':`${m}:${String(s).padStart(2,'0')}`}</div><div class="rs"><b>${R.score.toLocaleString()}</b> pts</div>
    <div class="rc${R.combo>1?' on':''}">Combo x${rushMult(Math.max(0,R.combo-1))}<i style="width:${Math.max(0,R.comboT/RUSH_COMBO_WINDOW*100)}%"></i></div>${R.lastT>0&&R.last?`<div class="rl">${esc(R.last)}</div>`:''}`;
}
function rushQuit(){if(!RUSH)return;RUSH.quit=true;RUSH.t=0;RUSH.over=true;closeModal();}
function rushEnd(){
  const R=RUSH;RUSH=null;document.body.classList.remove('rush');rushHud();CB.incT=R.incT0>1e8?R.incT0:rnd(160,280);
  const week=rushWeek(),prev=career.rush&&career.rush.week===week?career.rush.score:0;
  const best=!R.quit&&R.score>prev,pb=career.rushBest||0;
  career.rushRuns=(career.rushRuns||0)+1;
  if(!R.quit&&R.score>pb)career.rushBest=R.score;
  if(best&&!NET.verified)career.rush={week,score:R.score,combo:R.best,at:Date.now()};
  saveCareer();if(!NET.verified)publishProfile(true);
  if(NET.srv&&R.ticket&&!R.quit)NET.srv.call('closeRush',{ticketId:R.ticket,score:R.score,n:R.n,combo:R.best}).then(r=>{
    if(r&&r.accepted){if(r.best){career.rush={week,score:R.score,combo:R.best,at:Date.now()};saveCareer();}toast(r.best?`Patrol Rush verified: ${R.score.toLocaleString()} is your best this week.`:'Patrol Rush verified.','good');RLB.at=0;}
    else if(r&&r.reason)toast('This run was not added to the weekly board: '+r.reason,'bad');}).catch(()=>{});
  const n=R.n;
  const el=openModal(`<div class="report"><div class="eyebrow">Patrol Rush · ${R.quit?'ended early':'five minutes'}</div><h1>${R.quit?'Rush abandoned':'Time!'}</h1>
    <div class="scorecard"><div class="grade gS" aria-hidden="true">⏱</div><div><div class="sc">${R.score.toLocaleString()}<small> pts</small></div>
      <div class="muted">${R.quit?'Ended early: not counted on the weekly board.':best?(NET.verified?'Your best this week: the Division 9 server is checking it.':NET.db?'Your best run this week: it\'s on the weekly leaderboard.':'Your best run this week: it goes on the weekly board when you play online.'):`Your best this week: ${prev.toLocaleString()}.`}</div></div></div>
    <dl class="stats" style="grid-template-columns:repeat(4,1fr);margin:16px 0"><div><dt>Clean stops</dt><dd>${n.clean}/${n.stops}</dd></div><div><dt>Pursuits</dt><dd>${n.pursuits}</dd></div><div><dt>Street calls</dt><dd>${n.incidents}</dd></div><div><dt>Best combo</dt><dd>${R.best}</dd></div></dl>
    <p class="mono muted">${n.arrests} arrest${n.arrests===1?'':'s'} · ${n.mistakes} mistake${n.mistakes===1?'':'s'}${pb&&R.score>pb&&!R.quit?' · new personal best':''}</p>
    <div class="row end"><button class="btn ghost" id="rBoard">Weekly leaderboard</button><button class="btn" id="rOk">Back on patrol</button></div></div>`,{dismiss:false});
  $('#rOk',el).onclick=closeModal;$('#rBoard',el).onclick=()=>{closeModal();openMDT('rush');};
}
// the weekly best rides on the officer profile (verified mode: the server writes it)
profileDoc=(base=>function(){const d=base();const r=career.rush;if(!NET.verified&&r)Object.assign(d,{rushWeek:r.week,rushScore:r.score,rushAt:r.at||0});return d;})(profileDoc);

// ---------- the Patrol Rush tab and its weekly leaderboard
const RLB={week:null,rows:[],at:0,busy:false,err:false,view:'all'};
async function fetchRush(force){
  const week=rushWeek();if(!NET.db||RLB.busy)return;if(!force&&RLB.week===week&&Date.now()-RLB.at<60000)return;RLB.busy=true;
  try{let q=NET.db.collection('officers').where('rushWeek','==',week);if(NET.verified)q=q.where('flagged','==',false);
    const s=await q.limit(300).get();
    RLB.rows=s.docs.map(d=>Object.assign({uid:d.id},d.data())).filter(o=>typeof o.rushScore==='number').sort((a,b)=>b.rushScore-a.rushScore||(a.rushAt||0)-(b.rushAt||0));
    RLB.week=week;RLB.at=Date.now();RLB.err=false;}catch(e){RLB.err=true;}
  RLB.busy=false;const el=$('#modal [data-mdt]');if(el&&mdtTab==='rush')drawRush($('#mdtBody',el));
}
function drawRush(body){
  const week=rushWeek(),mine=career.rush&&career.rush.week===week?career.rush:null;
  if(NET.status==='online'||NET.status==='readonly')fetchRush();
  let rows=RLB.week===week?RLB.rows.slice():[];
  if(mine&&NET.uid&&!rows.some(o=>o.uid===NET.uid))rows.push({uid:NET.uid,name:publicName(),rank:rankOf(career.xp).name,rushScore:mine.score,rushAt:mine.at});
  rows.sort((a,b)=>b.rushScore-a.rushScore||(a.rushAt||0)-(b.rushAt||0));rows.forEach((o,i)=>o.pos=i+1);
  if(RLB.view==='friends')rows=rows.filter(o=>o.uid===NET.uid||isFriend(o.uid));
  const top=rows.slice(0,20),me=rows.find(o=>o.uid===NET.uid);
  const row=o=>`<tr class="${o.uid===NET.uid?'me':''}"><td class="mono">${o.pos}</td><td>${esc(o.name||'Officer')}${o.uid===NET.uid?' <span class="chip amber">You</span>':''}<div class="muted" style="font-size:12px">${esc(o.rank||'')}</div></td><td class="amt">${o.rushScore.toLocaleString()}</td></tr>`;
  const board=!NET.db?`<div class="empty">The leaderboard needs the online version of the game. You can still play Patrol Rush and beat your own best.</div>`
    :RLB.err?'<div class="empty">Could not load the leaderboard. Try Refresh.</div>'
    :!top.length?`<div class="empty">${RLB.at?(RLB.view==='friends'?'None of your friends have played Patrol Rush this week.':'No runs yet this week. Set the score to beat.'):'Loading…'}</div>`
    :`<div class="tablewrap"><table class="dboard"><thead><tr><th>#</th><th>Officer</th><th style="text-align:right">Best run</th></tr></thead><tbody>${top.map(row).join('')}${me&&me.pos>20?row(me):''}</tbody></table></div>`;
  const btn=RUSH?'<button class="btn red" id="rQuit">End the run</button>':curCase?'<button class="btn" disabled>Close your case first</button>':'<button class="btn" id="rGo">Start Patrol Rush</button>';
  body.innerHTML=`<article class="offer daily"><div class="code"><b>5:00</b>Patrol Rush</div>
      <div><h3>Five minutes on the streets</h3><p>More speeders, red-light runners and street calls than a normal shift. Clean stops score, boxing in a runner scores, every arrest on a call scores. Chain them for a combo up to x2.5. A sloppy stop, a runner who gets away or an unjustified shooting breaks it.</p>
      <span class="chip amber">Weekly leaderboard</span> <span class="chip">Best run counts</span> <span class="chip">Resets in ${rushWeekLeft()}</span>
      <p style="margin:8px 0 0">${RUSH?`Run in progress: ${RUSH.score.toLocaleString()} points.`:mine?`Your best this week: <b>${mine.score.toLocaleString()}</b>.`:'No run yet this week.'}${career.rushBest?` Personal best: ${career.rushBest.toLocaleString()}.`:''}</p></div>${btn}</article>
    <div class="row" style="justify-content:space-between;margin:18px 0 8px"><h3 class="osec" style="margin:0">This week's leaderboard</h3>
      <div class="tabs"><button data-rv="all" aria-pressed="${RLB.view==='all'}">Everyone</button><button data-rv="friends" aria-pressed="${RLB.view==='friends'}">Friends</button>${NET.db?'<button id="rRef">Refresh</button>':''}</div></div>
    ${board}
    <p class="muted" style="font-size:13px">Clean stop 200+ · arrest on a stop +150 · runner boxed in 300 · each arrest on a street call 250, +300 if nobody needed force. Unjustified shooting −500.${NET.verified?' Runs are checked by the Division 9 server.':''}</p>`;
  const g=$('#rGo',body);if(g)g.onclick=rushStart;const q=$('#rQuit',body);if(q)q.onclick=rushQuit;
  $$('[data-rv]',body).forEach(b=>b.onclick=()=>{RLB.view=b.dataset.rv;drawRush(body);});
  const r=$('#rRef',body);if(r)r.onclick=()=>fetchRush(true);
}
drawMDT=(base=>function(el){if(mdtTab==='rush'){drawRush($('#mdtBody',el));return;}return base(el);})(drawMDT);
function rushDispatchCard(){
  const mine=career.rush&&career.rush.week===rushWeek()?career.rush:null;
  return `<article class="offer daily"><div class="code"><b>5:00</b>Patrol Rush</div><div><h3>Patrol Rush</h3><p>Five minutes, as many clean stops, pursuits and arrests as you can. ${mine?`Your best this week: ${mine.score.toLocaleString()}.`:'Best run of the week goes on the leaderboard.'}</p></div><button class="btn" data-rush>Open</button></article>`;
}
