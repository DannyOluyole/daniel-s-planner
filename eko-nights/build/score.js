// ================= case scores and the Daily Case
// Every case ends with a score out of 1000 and a grade from S to D, so there is always a better run to chase.
// The Daily Case is the same case for every officer each day (it is built from a seed of the date). The first attempt
// each day is ranked on the daily leaderboard; replays are practice. In verified mode the server scores it.

// ---------- scoring (site-src/functions/index.js scores verified daily cases with the same formula)
const GRADES=[[900,'S'],[750,'A'],[600,'B'],[450,'C'],[0,'D']];
const gradeOf=s=>GRADES.find(([m])=>s>=m)[1];
// r: {success, caught, gang, falseArrests, evidence, paid, badShots, timeFrac (share of the deadline left, 0-1)}
function caseScore(r){
  const parts=[];const add=(label,pts)=>{if(pts)parts.push([label,pts]);};
  add('Case solved',r.success?400:0);
  add(`Suspects in custody (${Math.min(r.caught,r.gang)}/${r.gang})`,Math.round(250*Math.min(r.caught,r.gang)/Math.max(1,r.gang)));
  add('Time to spare',r.success?Math.round(200*clamp(r.timeFrac,0,1)):0);
  add(`Evidence on file (${r.evidence})`,Math.min(100,r.evidence*8));
  add('Clean police work',r.success&&!r.falseArrests&&!r.badShots&&!r.paid?50:0);
  add('False arrests',-100*r.falseArrests);add('Unjustified shootings',-150*r.badShots);add('Took a bribe',r.paid?-300:0);
  const score=clamp(parts.reduce((a,p)=>a+p[1],0),0,1000);
  return {score,grade:gradeOf(score),parts};
}
// cases with no deadline are timed against six hours of game time
function caseResult(cs,success){
  const inq=career.inquiries||0;
  return {success,caught:cs.gang.filter(id=>cs.custody.includes(id)).length,gang:cs.gang.length,falseArrests:cs.falseArrests||0,evidence:cs.evidence.length,
    paid:!!(cs.flags.paid||cs.flags.honPaid),badShots:Math.max(0,inq-(cs.inq0==null?inq:cs.inq0)),timeFrac:isFinite(cs.limit)?(cs.limit-cs.used)/cs.limit:1-cs.used/360};
}

// ---------- the Daily Case: one case a day, the same on every device
const DAILY_TYPES=['robbery','romance','kidnap','homicide','yahoo','contract'];
// the day in Port Eko: West Africa Time, UTC+1, no daylight saving
const dailyDay=(t=Date.now())=>new Date(t+3600e3).toISOString().slice(0,10);
function dailyFor(day){
  let h=2166136261;for(const ch of 'eko-daily-'+day){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
  const n=Math.round(Date.parse(day+'T00:00:00Z')/864e5);
  return {day,type:DAILY_TYPES[((n%DAILY_TYPES.length)+DAILY_TYPES.length)%DAILY_TYPES.length],seed:((h>>>0)%2147483645)+1};
}
const isDaily=cs=>!!(cs&&cs.opt&&cs.opt.daily);
let dailyCache=null;
function dailyPreview(){const day=dailyDay();if(!dailyCache||dailyCache.day!==day){const d=dailyFor(day);dailyCache=Object.assign({cs:makeCase(d.type,d.seed,{free:true,daily:day})},d);}return dailyCache;}
// the first start each day is the ranked attempt, even if it is handed back
const dailyRankedLeft=day=>career.dailyStarted!==day;
function takeDaily(){
  if(curCase){toast(isDaily(curCase)?'You are already on the Daily Case.':'Close or hand back your current case first.','bad');return;}
  const d=dailyPreview(),ranked=dailyRankedLeft(d.day);
  const cs=makeCase(d.type,d.seed,{free:true,daily:d.day,ranked});
  if(ranked){career.dailyStarted=d.day;saveCareer();}
  startCase(cs);
  toast(ranked?'Daily Case: this attempt is ranked. Every officer in Port Eko gets the same case today.':'Daily Case replay: practice only. Your ranked score stays as it is.',ranked?'promo':'');
}
const untilNextDaily=()=>{const t=Date.now()+3600e3;const m=Math.ceil((864e5-t%864e5)/60000);return fmtMin(m);};

// ---------- hooks into the case flow
startCase=(base=>function(cs){if(cs&&cs.inq0==null)cs.inq0=career.inquiries||0;return base(cs);})(startCase);
endCase=(base=>function(cs,how){
  if(!cs||cs.ended)return base(cs,how);
  const success=how!=='abandoned'&&caseCanClose(cs);
  cs.scoreIn=caseResult(cs,success);const S=cs.score=caseScore(cs.scoreIn);
  let best=null;
  if(!cs.story){career.best=career.best||{};const b=career.best[cs.type];cs.newBest=!b||S.score>b.score;if(cs.newBest)career.best[cs.type]={score:S.score,grade:S.grade};best=career.best[cs.type];}
  const ranked=isDaily(cs)&&cs.opt.ranked;
  if(ranked&&!NET.verified)career.daily={day:cs.opt.daily,score:S.score,grade:S.grade,title:cs.title,at:Date.now()};
  saveCareer();
  base(cs,how);
  const rep=$('#modal .report');if(!rep)return;
  const note=isDaily(cs)?(ranked?(NET.verified?'Daily Case · ranked: the Division 9 server is checking your score.':NET.db?'Daily Case · ranked: your score is on today\'s leaderboard.':'Daily Case · ranked: your score goes on today\'s leaderboard when you play online.'):'Daily Case · practice replay: not ranked.')
    :cs.story?'':cs.newBest?`New personal best for ${lower(caseLabelOf(cs.type))}.`:best?`Personal best for ${lower(caseLabelOf(cs.type))}: ${best.score} (${best.grade}).`:'';
  rep.querySelector('dl.stats').insertAdjacentHTML('beforebegin',`<div class="scorecard"><div class="grade g${S.grade}" aria-label="Grade ${S.grade}">${S.grade}</div>
    <div><div class="sc">${S.score}<small> / 1000</small></div>${note?`<div class="muted">${esc(note)}</div>`:''}
    <ul class="scoreparts">${S.parts.map(([l,p])=>`<li class="${p<0?'bad':''}"><span>${esc(l)}</span><b class="mono">${p>0?'+':''}${p}</b></li>`).join('')}</ul></div></div>`);
})(endCase);
// verified mode: the server's daily score is the one that counts
function dailyVerified(cs,d){
  if(!d||!isDaily(cs))return;
  if(d.ranked){career.daily={day:cs.opt.daily,score:d.score,grade:d.grade,title:cs.title,at:Date.now()};saveCareer();toast(`Daily Case verified: ${d.score} (${d.grade}) is on today's leaderboard.`,'good');DLB.at=0;}
  else toast('Daily Case: you already played today\'s ranked attempt, so this one was practice.');
}
// the Daily Case is solo: no squads, no AI backup
openSquad=(base=>function(){if(isDaily(curCase)){toast('The Daily Case is solo: every officer plays it alone.','bad');return;}return base();})(openSquad);
takeBackup=(base=>function(o){if(isDaily(curCase)){toast('The Daily Case is solo: no backup today.','bad');return;}return base(o);})(takeBackup);
// players' own profiles carry their daily result (verified mode: the server writes it)
// an officer saved before the politician-name rule shows up to others as "Officer" plus their friend code
const publicName=()=>{const o=OFF();return playerNameRisk(o.first,o.last)?'Officer '+myCode().slice(4):`${o.first} ${o.last}`;};
profileDoc=(base=>function(){const d=base();if(!NET.verified)d.name=publicName();const y=career.daily;if(!NET.verified&&y)Object.assign(d,{dailyDay:y.day,dailyScore:y.score,dailyGrade:y.grade,dailyTitle:y.title,dailyAt:y.at||0});return d;})(profileDoc);

// ---------- the daily leaderboard
const DLB={day:null,rows:[],at:0,busy:false,err:false,view:'all'};
async function fetchDaily(force){
  const day=dailyDay();if(!NET.db||DLB.busy)return;if(!force&&DLB.day===day&&Date.now()-DLB.at<60000)return;DLB.busy=true;
  try{let q=NET.db.collection('officers').where('dailyDay','==',day);if(NET.verified)q=q.where('flagged','==',false);
    const s=await q.limit(300).get();
    DLB.rows=s.docs.map(d=>Object.assign({uid:d.id},d.data())).filter(o=>typeof o.dailyScore==='number').sort((a,b)=>b.dailyScore-a.dailyScore||(a.dailyAt||0)-(b.dailyAt||0));
    DLB.day=day;DLB.at=Date.now();DLB.err=false;}catch(e){DLB.err=true;}
  DLB.busy=false;redrawDaily();
}
function redrawDaily(){const el=$('#modal [data-mdt]');if(el&&mdtTab==='daily')drawDaily($('#mdtBody',el));}
function dailyBoardRows(){
  const day=dailyDay(),y=career.daily;let rows=DLB.day===day?DLB.rows.slice():[];
  // my own result shows straight away, before the next fetch
  if(y&&y.day===day&&NET.uid&&!rows.some(o=>o.uid===NET.uid)){const o=OFF();rows.push({uid:NET.uid,name:publicName(),rank:rankOf(career.xp).name,dailyScore:y.score,dailyGrade:y.grade,dailyAt:y.at});rows.sort((a,b)=>b.dailyScore-a.dailyScore||(a.dailyAt||0)-(b.dailyAt||0));}
  rows.forEach((o,i)=>o.pos=i+1);
  if(DLB.view==='friends')rows=rows.filter(o=>o.uid===NET.uid||isFriend(o.uid));
  return rows;
}
function drawDaily(body){
  const d=dailyPreview(),cs=d.cs,day=d.day,y=career.daily&&career.daily.day===day?career.daily:null,cur=curCase,onIt=isDaily(cur)&&!cur.ended;
  const ok=NET.status==='online'||NET.status==='readonly';if(ok)fetchDaily();
  const status=onIt?`You're on it now${cur.opt.ranked?': this is your ranked attempt.':' (practice).'}`:y?`Your ranked score today: <b>${y.score}</b> (${y.grade}). Replays are practice.`
    :!dailyRankedLeft(day)?'You used today\'s ranked attempt. Replays are practice.':'Your first attempt today is ranked. Handing it back still uses it up.';
  const btn=onIt?'':cur?'<button class="btn" disabled>Finish your current case first</button>':`<button class="btn" id="dTake">${dailyRankedLeft(day)?'Take the Daily Case':'Replay (practice)'}</button>`;
  const rows=dailyBoardRows(),top=rows.slice(0,20),me=rows.find(o=>o.uid===NET.uid);
  const row=o=>`<tr class="${o.uid===NET.uid?'me':''}"><td class="mono">${o.pos}</td><td>${esc(o.name||'Officer')}${o.uid===NET.uid?' <span class="chip amber">You</span>':''}<div class="muted" style="font-size:12px">${esc(o.rank||'')}</div></td><td><span class="grade sm g${esc(o.dailyGrade||'D')}">${esc(o.dailyGrade||'')}</span></td><td class="amt">${o.dailyScore}</td></tr>`;
  const board=!NET.db?`<div class="empty">${NET.status==='paused'?'The leaderboard is paused for now.':'The leaderboard needs the online version of the game. You can still play the Daily Case and see your score.'}</div>`
    :DLB.err?'<div class="empty">Could not load the leaderboard. Try Refresh.</div>'
    :!top.length?`<div class="empty">${DLB.at?(DLB.view==='friends'?'None of your friends have played today\'s case yet.':'No scores yet today. Be the first on the board.'):'Loading…'}</div>`
    :`<div class="tablewrap"><table class="dboard"><thead><tr><th>#</th><th>Officer</th><th>Grade</th><th style="text-align:right">Score</th></tr></thead><tbody>${top.map(row).join('')}${me&&me.pos>20?row(me):''}</tbody></table></div>`;
  const bests=Object.entries(career.best||{});
  body.innerHTML=`<article class="offer daily"><div class="code"><b>DAY</b>${esc(new Date(day+'T12:00:00Z').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}))}</div>
      <div><h3>${esc(cs.title)}</h3><p>${esc(caseBlurb(cs))}</p><span class="chip amber">${esc(caseLabelOf(cs.type))}</span> <span class="chip">Same case for every officer</span> <span class="chip">Solo</span> <span class="chip">New case in ${untilNextDaily()}</span>
      <p style="margin:8px 0 0">${status}</p></div>${btn}</article>
    <div class="row" style="justify-content:space-between;margin:18px 0 8px"><h3 class="osec" style="margin:0">Today's leaderboard</h3>
      <div class="tabs"><button data-dv="all" aria-pressed="${DLB.view==='all'}">Everyone</button><button data-dv="friends" aria-pressed="${DLB.view==='friends'}">Friends</button>${NET.db?'<button id="dRef">Refresh</button>':''}</div></div>
    ${board}
    <p class="muted" style="font-size:13px">Scores out of 1000: solving the case, suspects in custody, time to spare and evidence, minus false arrests, unjustified shootings and bribes. S 900+, A 750+, B 600+, C 450+.${NET.verified?' Scores are checked by the Division 9 server.':''}</p>
    ${bests.length?`<h3 class="osec" style="margin:18px 0 8px">Your personal bests</h3><div class="roster">${bests.map(([t,b])=>`<span class="chip">${esc(caseLabelOf(t))}: ${b.score} (${b.grade})</span>`).join('')}</div>`:''}`;
  const t=$('#dTake',body);if(t)t.onclick=takeDaily;
  $$('[data-dv]',body).forEach(b=>b.onclick=()=>{DLB.view=b.dataset.dv;drawDaily(body);});
  const r=$('#dRef',body);if(r)r.onclick=()=>fetchDaily(true);
}
drawMDT=(base=>function(el){if(mdtTab==='daily'){drawDaily($('#mdtBody',el));return;}return base(el);})(drawMDT);
// the Daily Case also heads the Dispatch list
function dailyDispatchCard(){
  const d=dailyPreview(),y=career.daily&&career.daily.day===d.day?career.daily:null;
  return `<article class="offer daily"><div class="code"><b>DAY</b>Daily Case</div><div><h3>${esc(d.cs.title)}</h3><p>Today's case for every officer in Port Eko. ${y?`Your ranked score: ${y.score} (${y.grade}).`:'Your first attempt is ranked on the daily leaderboard.'}</p></div><button class="btn" data-daily>Open</button></article>`;
}
