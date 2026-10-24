// Eko Nights · Firebase adapter
// The game talks to a small online interface (db, user, room). On claude.ai the platform provides it;
// on your own website this file provides it with Firebase Auth, Cloud Firestore and the Realtime Database.
// With no config in firebase-config.js the game runs offline and saves on the device.
(function(){
  'use strict';
  const cfg=window.EKO_FIREBASE;
  let choose;const chosen=new Promise(r=>{choose=r;});let picked=false;
  let pickedUid=null;const pick=v=>{if(!picked){picked=true;pickedUid=v?v.uid:null;choose(v);}};
  let DB=null,USER=null,ROOMS=null,SRV=null;
  window.claude={use:async name=>{const u=await chosen;if(!u)return null;
    if(name==='db')return DB;if(name==='user')return USER;if(name==='ekoserver')return SRV;if(name==='room'){if(!ROOMS)ROOMS={join:async n=>makeRoom(n),connected:()=>connected,onConnection:h=>{connWatch.add(h);setTimeout(()=>h(connected),0);return()=>connWatch.delete(h);},
      presence:async()=>{},peers:()=>[],onPeers:()=>()=>{},emit:async()=>{},on:()=>()=>{}};return ROOMS;}return null;}};
  // There is deliberately no global lobby: only squads (max 4 officers) share live positions.
  // Starting the shift without signing in means offline play.
  document.addEventListener('click',e=>{if(e.target&&e.target.id==='startBtn')pick(null);},true);
  if(!cfg||!window.firebase){pick(null);return;}

  firebase.initializeApp(cfg);
  // App Check: only genuine copies of the game on your domain can reach your database and functions.
  if(cfg.appCheckKey&&firebase.appCheck){
    if(cfg.appCheckDebug)self.FIREBASE_APPCHECK_DEBUG_TOKEN=cfg.appCheckDebug;
    firebase.appCheck().activate(new firebase.appCheck.ReCaptchaEnterpriseProvider(cfg.appCheckKey),true);
  }
  const auth=firebase.auth(),fs=firebase.firestore();
  // Squad rooms are spread across one or more Realtime Database instances (databaseURLs) by a hash of the room name.
  const urls=(cfg.databaseURLs&&cfg.databaseURLs.length?cfg.databaseURLs:[cfg.databaseURL]).filter(Boolean);
  const shards=urls.map(u=>firebase.app().database(u));const rtdb=shards[0];
  const shardOf=name=>{let h=0;for(const c of name)h=(h*31+c.charCodeAt(0))>>>0;return shards[h%shards.length];};
  fs.settings({ignoreUndefinedProperties:true,merge:true});
  // Verified mode: the Cloud Functions keep the official service record (needs the Blaze plan).
  if(cfg.verified&&firebase.functions){
    const fns=firebase.app().functions(cfg.functionsRegion||'europe-west1');if(cfg.emulators)fns.useEmulator('127.0.0.1',5001);
    SRV={call:async(n,d)=>{try{return (await fns.httpsCallable(n)(d)).data;}catch(e){throw {code:String(e.code||'').replace('functions/',''),message:e.message};}}};
  }
  if(cfg.emulators){auth.useEmulator('http://127.0.0.1:9099',{disableWarnings:true});fs.useEmulator('127.0.0.1',8085);shards.forEach(d=>d.useEmulator('127.0.0.1',9000));}

  // ---------- db: the subset of the document-store interface the game uses
  const err=e=>({code:e&&e.code==='unavailable'?'unavailable':'invalid_argument',message:(e&&e.message)||String(e)});
  const snap=s=>({id:s.id,exists:s.exists,data:()=>s.exists?s.data():undefined,metadata:{fromCache:s.metadata.fromCache,hasPendingWrites:s.metadata.hasPendingWrites}});
  const qsnap=q=>({docs:q.docs.map(snap),size:q.size,empty:q.empty,metadata:{fromCache:q.metadata.fromCache,hasPendingWrites:q.metadata.hasPendingWrites},
    docChanges:()=>q.docChanges().map(c=>({type:c.type,doc:snap(c.doc),oldIndex:c.oldIndex,newIndex:c.newIndex}))});
  const wrapErr=p=>p.catch(e=>{throw err(e);});
  function docRef(path){const r=fs.doc(path);return {id:r.id,path,
    get:async()=>{try{return snap(await r.get());}catch(e){if(e.code==='permission-denied')return {id:r.id,exists:false,data:()=>undefined,metadata:{fromCache:false,hasPendingWrites:false}};throw err(e);}},
    set:d=>wrapErr(r.set(d)),update:d=>wrapErr(r.update(d)),delete:()=>wrapErr(r.delete()),
    onSnapshot:(next,onErr)=>r.onSnapshot(s=>next(snap(s)),e=>onErr&&onErr(err(e))),
    collection:c=>colRef(path+'/'+c),acquire:async()=>({acquired:true})};}
  function query(q){return {where:(f,op,v)=>query(q.where(f,op,v)),orderBy:(f,d)=>query(q.orderBy(f,d||'asc')),limit:n=>query(q.limit(n)),
    get:async()=>{try{return qsnap(await q.get());}catch(e){throw err(e);}},
    onSnapshot:(next,onErr)=>q.onSnapshot(s=>next(qsnap(s)),e=>onErr&&onErr(err(e)))};}
  function colRef(path){const c=fs.collection(path);return Object.assign(query(c),{path,
    doc:id=>docRef(id?path+'/'+id:c.doc().path),add:async d=>{try{const r=await c.add(d);return docRef(r.path);}catch(e){throw err(e);}}});}
  DB={doc:docRef,collection:colRef};
  USER={id:async()=>auth.currentUser?auth.currentUser.uid:null,can:async()=>!!auth.currentUser,isOwner:async()=>false,canEdit:async()=>false,
    me:async()=>{const u=auth.currentUser;return {id:u?u.uid:null,name:u&&u.displayName||'',guest:false};},profiles:async()=>({})};

  // ---------- room: who is here right now, on the Realtime Database
  let connected=false,offset=0;const connWatch=new Set();
  rtdb.ref('.info/connected').on('value',s=>{connected=!!s.val();connWatch.forEach(h=>h(connected));});
  rtdb.ref('.info/serverTimeOffset').on('value',s=>{offset=s.val()||0;});
  function makeRoom(name){
    const uid=auth.currentUser.uid;const ref=shardOf(name).ref('rooms/'+name);const peer=uid+'-'+Math.random().toString(36).slice(2,9);const me=ref.child(peer);
    let pres={},peers=[],alive=true,lastW=0,timer=null;const hs=new Set();
    const write=()=>{timer=null;lastW=Date.now();if(alive)me.set({uid,at:firebase.database.ServerValue.TIMESTAMP,p:pres}).catch(()=>{});};
    const schedule=()=>{if(timer)return;const wait=Math.max(0,400-(Date.now()-lastW));timer=setTimeout(write,wait);};
    me.onDisconnect().remove();write();const beat=setInterval(()=>{if(alive)write();},30000);
    const onVal=s=>{const v=s.val()||{};const now=Date.now()+offset;const old=new Map(peers.map(p=>[p.peer,p]));
      const list=Object.entries(v).filter(([,o])=>o&&o.uid&&now-(o.at||0)<95000).map(([k,o])=>{const p=old.get(k);const presence=o.p||{};
        return p&&JSON.stringify(p.presence)===JSON.stringify(presence)?p:Object.freeze({peer:k,by:o.uid,isMe:k===peer,sameTab:k===peer,kind:'viewer',guest:false,presence:Object.freeze(presence),updatedAt:Date.now()});});
      const ids=new Set(list.map(p=>p.peer));const joined=list.filter(p=>!old.has(p.peer)),left=peers.filter(p=>!ids.has(p.peer)),updated=list.filter(p=>old.has(p.peer)&&old.get(p.peer)!==p);
      peers=Object.freeze(list);if(joined.length||left.length||updated.length)hs.forEach(h=>h({peers,joined,left,updated}));};
    ref.on('value',onVal);
    return {name,
      presence:async patch=>{for(const [k,v] of Object.entries(patch)){if(v===null)delete pres[k];else pres[k]=v;}schedule();},
      peers:()=>peers,
      onPeers:h=>{hs.add(h);setTimeout(()=>{if(hs.has(h))h({peers,joined:peers,left:[],updated:[]});},0);return()=>hs.delete(h);},
      emit:async()=>{},on:()=>()=>{},connected:()=>connected,
      onConnection:h=>{connWatch.add(h);setTimeout(()=>h(connected),0);return()=>connWatch.delete(h);},
      leave:async()=>{if(!alive)return;alive=false;clearInterval(beat);ref.off('value',onVal);me.onDisconnect().cancel();await me.remove().catch(()=>{});}};
  }

  // ---------- sign-in box on the title screen
  const box=document.createElement('div');box.id='onlineBox';box.className='contcard online';
  const mount=()=>{const cb=document.getElementById('charBox');if(cb&&!box.isConnected)cb.parentNode.insertBefore(box,cb);};
  const provider=new firebase.auth.GoogleAuthProvider();
  const google=async()=>{try{const u=auth.currentUser;if(u&&u.isAnonymous)await u.linkWithPopup(provider);else await auth.signInWithPopup(provider);}
    catch(e){if(e.code==='auth/credential-already-in-use'){await auth.signInWithCredential(e.credential);}else if(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment'){await auth.signInWithRedirect(provider);}else render(e.message);}};
  function render(msg){
    const u=auth.currentUser;mount();
    if(u){const who=u.isAnonymous?'Guest officer (this device only)':(u.displayName||u.email||'Signed in');
      box.innerHTML=`<div><div class="eyebrow">Online · Eko Metropolitan Police network</div><b>${esc(who)}</b><span class="muted">${u.isAnonymous?'Link a Google account to keep your officer on any phone or computer.':'Your officer and progress sync to your account.'}</span></div>
        <div class="row">${u.isAnonymous?'<button class="btn sm" id="obLink">Link Google</button>':''}<button class="btn ghost sm" id="obOut">Sign out</button></div>`;
      const l=box.querySelector('#obLink');if(l)l.onclick=google;box.querySelector('#obOut').onclick=()=>auth.signOut().then(()=>location.reload());
    }else{
      box.innerHTML=`<div><div class="eyebrow">Play online</div><b>Join the Division 9 network</b><span class="muted">Squad up with other officers, appear in the officer directory and keep your progress on any device.${msg?` <span class="loaderr">${esc(msg)}</span>`:''}</span></div>
        <div class="row"><button class="btn sm" id="obGoogle">Sign in with Google</button><button class="btn ghost sm" id="obGuest">Play as guest</button></div>`;
      box.querySelector('#obGoogle').onclick=google;box.querySelector('#obGuest').onclick=()=>auth.signInAnonymously().catch(e=>render(e.message));
    }
  }
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  auth.getRedirectResult().catch(()=>{});
  let first=true;
  auth.onAuthStateChanged(u=>{render();if(u&&pickedUid&&u.uid!==pickedUid){location.reload();return;}if(u)pick(u);else if(!first&&picked)location.reload();first=false;});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>render());else render();
})();
