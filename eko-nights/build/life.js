// ================= life on the job: realistic cuffing, booking at the station, your own house, the city map

// ---------- cuffing: step behind, hands behind the back, two clicks, a pat-down
// Out on the street it plays as a short close-up. Inside a raid it plays in place so the raid keeps moving.
let CUFF=null;
const POCKETS=[['a phone','a wallet'],['two phones','a lighter'],['a phone','car keys'],['a wallet','an ATM card in someone else\'s name'],['a phone','a small bag of weed'],['a phone','a fake ID card']];
function cuffScene(mesh,x,z,o,done){
  o=o||{};
  const h=Math.atan2(x-pl.x,z-pl.z);// the suspect turns their back to the officer
  const C={t:0,mesh,x,z,h,o,done,len:o.quick?1.5:2.6,clicks:0,told:false,find:pick(POCKETS),cash:ri(2,48)*500};
  CUFF=C;pl.h=h;pl.x=x-Math.sin(h)*.72;pl.z=z-Math.cos(h)*.72;pl.mesh.visible=true;
  if(!raidS&&!o.inPlace){
    const r={x:Math.cos(h),z:-Math.sin(h)};
    startCine({fov:40,pos:V3(x+r.x*2.9-Math.sin(h)*.6,1.6,z+r.z*2.9-Math.cos(h)*.6),look:V3(x-Math.sin(h)*.35,.95,z-Math.cos(h)*.35),
      update(dt){cuffStep(dt);},cleanup(){}});
    C.cine=true;
  }
  SFX.blip('shout');
}
function cuffStep(dt){
  const C=CUFF;if(!C)return;C.t+=dt;const t=C.t,k=C.len/2.6;const Y=raidS||insideS?.03:.2;
  const m=C.mesh;m.rotation.y=C.h;m.position.set(C.x,Y,C.z);
  pl.mesh.position.set(pl.x,Y,pl.z);pl.mesh.rotation.y=C.h;
  const kneel=C.o.kneel&&t<1.75*k;
  if(t<.45*k)pose(m,kneel&&t>.2*k?['kneel','handsUp']:'handsUp');
  else if(t<1.75*k)pose(m,kneel?['kneel','behind']:'behind');
  else pose(m,'cuffed');
  if(t<.45*k)pose(pl.mesh,'idle',t);
  else if(t<1.65*k)pose(pl.mesh,kneel?['crouch','cuffing']:'cuffing');
  else pose(pl.mesh,'patdown');
  if(C.clicks===0&&t>.8*k){C.clicks=1;SFX.blip('cuff');}
  if(C.clicks===1&&t>1.25*k){C.clicks=2;SFX.blip('cuff');}
  if(!C.told&&t>1.8*k&&!C.o.quick){C.told=true;toast(`Pat-down: ${C.find[0]}, ${C.find[1]} and ₦${C.cash.toLocaleString()} cash. Bagged as evidence.`);}
  if(t>=C.len){CUFF=null;if(C.cine)endCine();C.done&&C.done();}
}
function cuffBusy(){return !!CUFF;}

// ---------- bringing a prisoner in: park in the bay, walk them inside, booking, cell
let BAY=null,bayTold=false;
function bayCheck(){
  const d=Math.hypot(pc.x-LOC.book.x,pc.z-LOC.book.z),sp=Math.hypot(pc.vx,pc.vz);
  if(d<9&&sp<1.5&&!bayTold){bayTold=true;toast(`You're in the drop-off bay. Get out (${document.body.classList.contains('touchmode')?'EXIT':'F'}) and take ${prisoner.p.first} inside.`,'good');}
  if(d>25)bayTold=false;
}
// the case board's step while you have someone in cuffs
function prisonerLead(at){const P=prisoner,n=P.p.name;
  if(P.state==='car')return {t:`Take ${n} to Division 9`,d:'Park in the yellow drop-off bay in front of the station, then get out.',at:at(LOC.book,'Prisoner drop-off bay'),hot:true};
  // close to the station: walk them in; anywhere else: back to the cruiser
  if(Math.hypot(pl.x-LOC.station.x,pl.z-LOC.station.z)>60)return {t:`Put ${n} in your cruiser`,d:'Walk them to the car and get in: they go in the back seat.',at:{x:pc.x,z:pc.z,label:'Your cruiser'},hot:true};
  return {t:`Walk ${n} inside`,d:'Walk them through the front door of Division 9 to the charge room.',at:at(LOC.station,'Division 9 entrance'),hot:true};}
// called when the officer gets out of the cruiser
function unloadPrisoner(){
  const P=prisoner;if(!P||P.state!=='car')return false;
  if(Math.hypot(pc.x-LOC.book.x,pc.z-LOC.book.z)>16)return false;
  pc.mesh.remove(P.mesh);scene.add(P.mesh);
  P.x=pc.x-Math.sin(pc.h)*2.6+Math.cos(pc.h)*1.2;P.z=pc.z-Math.cos(pc.h)*2.6-Math.sin(pc.h)*1.2;P.h=pc.h+Math.PI;P.state='follow';
  P.mesh.position.set(P.x,.2,P.z);pose(P.mesh,'cuffed');SFX.blip('door');
  toast(`You open the back door and take ${P.p.first} by the arm. Walk them to the front door of Division 9.`);
  return true;
}
const CHARGE={robbery:'armed robbery',kidnap:'kidnapping',homicide:'murder',romance:'obtaining money by false pretences',yahoo:'cyber fraud',contract:'fraud and abuse of office',leak:'leaking police operations',finale:'running a criminal syndicate'};
const BK={x:-460,z:-215};
function buildBookingRoom(){
  const g=new THREE.Group();scene.add(g);const ox=BK.x,oz=BK.z;
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(14,10,14,10),lam('#6d7178'));fl.rotation.x=-Math.PI/2;fl.position.set(ox+7,.02,oz+5);g.add(fl);
  const wm=lam('#c9ccc4');// walls in 1 m tiles so the lamps light them evenly
  const wall=(x,z,w,d,h=3)=>{const m=sh(new THREE.Mesh(new THREE.BoxGeometry(w,h,d,Math.max(1,Math.round(w)),3,Math.max(1,Math.round(d))),wm));m.position.set(x,h/2,z);g.add(m);};
  wall(ox+7,oz+10,14,.2);wall(ox,oz+5,.2,10);wall(ox+14,oz+5,.2,10);
  // booking counter with the duty sergeant
  const desk=sh(new THREE.Mesh(new THREE.BoxGeometry(4,1.1,.8),lam('#4a3a2c')));desk.position.set(ox+3.5,.55,oz+6.5);g.add(desk);
  const top=new THREE.Mesh(new THREE.BoxGeometry(4.2,.06,1),lam('#2e2f33'));top.position.set(ox+3.5,1.12,oz+6.5);g.add(top);
  const scan=new THREE.Mesh(new THREE.BoxGeometry(.3,.05,.22),new THREE.MeshBasicMaterial({color:0x3a4a3a}));scan.position.set(ox+2.6,1.17,oz+6.25);g.add(scan);
  const tray=new THREE.Mesh(new THREE.BoxGeometry(.5,.06,.35),lam('#8a8a84'));tray.position.set(ox+4.3,1.17,oz+6.25);g.add(tray);
  const items=[];for(let i=0;i<3;i++){const it=new THREE.Mesh(new THREE.BoxGeometry(.12,.03,.2),lam(['#111','#6a4a2a','#2a6a3a'][i]));it.position.set(ox+4.15+i*.15,1.21,oz+6.25);it.visible=false;g.add(it);items.push(it);}
  const sgt=makePersonMesh({shirt:'#1f2b45',pants:'#141922',skin:SKIN[4],hat:true,vest:true});sgt.position.set(ox+3.5,0,oz+7.4);sgt.rotation.y=Math.PI;g.add(sgt);
  const signC=mkC(256,64)[0];const sg=signC.getContext('2d');sg.fillStyle='#13285a';sg.fillRect(0,0,256,64);sg.fillStyle='#f4f1e6';sg.font='700 26px sans-serif';sg.textAlign='center';sg.fillText('CHARGE ROOM · D9',128,42);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.6),new THREE.MeshBasicMaterial({map:ctex(signC)}));sign.position.set(ox+3.5,2.5,oz+9.88);sign.rotation.y=Math.PI;g.add(sign);
  // mugshot wall: height lines
  const [hc,hg]=mkC(128,256);hg.fillStyle='#d8d8d0';hg.fillRect(0,0,128,256);hg.strokeStyle='#3a3a3a';hg.fillStyle='#3a3a3a';hg.font='bold 12px monospace';
  for(let i=0;i<=10;i++){const y=256-i*23;hg.lineWidth=i%2?1:3;hg.beginPath();hg.moveTo(0,y);hg.lineTo(128,y);hg.stroke();if(!(i%2))hg.fillText((140+i*6)+'',4,y-3);}
  const hw=new THREE.Mesh(new THREE.PlaneGeometry(1.6,2.4),new THREE.MeshBasicMaterial({map:ctex(hc)}));hw.position.set(ox+8,1.2,oz+9.88);hw.rotation.y=Math.PI;g.add(hw);
  const plate=new THREE.Mesh(new THREE.BoxGeometry(.5,.18,.02),lam('#111'));plate.visible=false;g.add(plate);
  // the cell: bars and a sliding door
  const bm=lam('#2a2c30');const bar=new THREE.CylinderGeometry(.03,.03,2.6,6);
  for(let i=0;i<14;i++){const b=new THREE.Mesh(bar,bm);b.position.set(ox+10.2+i*.27,1.3,oz+4);g.add(b);}
  const door=new THREE.Group();for(let i=0;i<5;i++){const b=new THREE.Mesh(bar,bm);b.position.set(i*.27,1.3,0);door.add(b);}door.position.set(ox+10.2,0,oz+4.15);g.add(door);
  const bench=sh(new THREE.Mesh(new THREE.BoxGeometry(3,.45,.6),lam('#555a60')));bench.position.set(ox+12,.22,oz+9.4);g.add(bench);
  const L1=intLights[1],L2=intLights[2];L1.position.set(ox+4,2.7,oz+5);L1.intensity=2.6;L1.distance=12;L2.position.set(ox+10,2.7,oz+6);L2.intensity=2.2;L2.distance=11;
  return {g,ox,oz,scan,items,door,plate,sgt};
}
function startBooking(){
  const P=prisoner;if(!P||P.state==='booking')return;
  const {cs,p}=P;P.state='booking';
  const R=buildBookingRoom(),ox=R.ox,oz=R.oz;
  const saved={x:pl.x,z:pl.z,h:pl.h};
  const pm=P.mesh;if(pm.parent!==scene){pm.parent&&pm.parent.remove(pm);scene.add(pm);}
  pm.position.set(ox+3.1,.02,oz+5.6);pm.rotation.y=0;pl.mesh.visible=true;pl.mesh.position.set(ox+4.1,.02,oz+5.4);pl.mesh.rotation.y=0;
  const no=`EKO/D9/${ri(1000,9999)}/${new Date().getFullYear()}`;const charge=CHARGE[cs.type]||'robbery';
  const prior=p.prior&&!/none/i.test(p.prior)?`Match on file: ${p.prior}.`:'No match on file. First time in our system.';
  const full=(career.bookings||0)<3;
  const L=[];const shot=[];
  const S=(cam,look,act)=>shot.push({cam,look,act});
  L.push({name:'Sgt Musa · charge room',text:`Evening, Constable. Who you bring?`});S([ox+6.5,2,oz+2.4],[ox+3.5,1.3,oz+6.5]);
  L.push(you(`${p.name}. Arrested for ${charge}. Cuffed and searched at the scene.`));S([ox+6.5,2,oz+2.4],[ox+3.5,1.3,oz+6.5]);
  if(full){
    L.push({name:'Sgt Musa · charge room',text:'Empty im pockets for the tray.'});S([ox+4.6,1.7,oz+5],[ox+4.3,1.15,oz+6.3],'items');
    L.push({name:'Property log',text:'Phone, wallet and cash counted in front of the suspect, bagged and sealed. Receipt signed.'});S([ox+4.6,1.7,oz+5],[ox+4.3,1.15,oz+6.3],'items');
    L.push({name:'Sgt Musa · charge room',text:'Right hand. Press am well well on the glass.'});S([ox+2.2,1.6,oz+5.2],[ox+2.6,1.15,oz+6.25],'scan');
    L.push({name:'Fingerprints',text:prior});S([ox+2.2,1.6,oz+5.2],[ox+2.6,1.15,oz+6.25],'scan');
  }
  L.push({name:'Mugshot',text:`Booking number ${no}. Look at the camera. Now turn left.`});S([ox+8,1.65,oz+6.6],[ox+8,1.55,oz+9.4],'photo');
  L.push({name:'Sgt Musa · charge room',text:`Cell two. ${p.first}, inside. Your lawyer fit come tomorrow.`});S([ox+8.6,1.9,oz+1.8],[ox+11,1.2,oz+5.6],'cell');
  let last=-1,flashN=0;
  startCine({fov:44,snap:true,pos:V3(...shot[0].cam),look:V3(...shot[0].look),
    update(dt){
      const i=DLG?Math.min(DLG.i,shot.length-1):shot.length-1;const s=shot[i];
      if(i!==last){last=i;this.pos=V3(...s.cam);this.look=V3(...s.look);this.st=0;}
      this.st=(this.st||0)+dt;
      pose(R.sgt,DLG&&DLG.lines[DLG.i]&&/Sgt/.test(DLG.lines[DLG.i].name)?'talk':'idle',this.t);
      pose(pl.mesh,'idle',this.t+1);
      R.items.forEach(m=>m.visible=s.act==='items'||i>shot.findIndex(x=>x.act==='items')&&shot.some(x=>x.act==='items'));
      if(s.act==='scan'){pm.position.set(ox+2.6,.02,oz+5.75);pm.rotation.y=0;pose(pm,'table');R.scan.material.color.setHSL(.33,.8,.25+.25*Math.abs(Math.sin(this.t*5)));}
      else if(s.act==='photo'){pm.position.set(ox+8,.02,oz+9.35);const side=this.st>1.3;pm.rotation.y=side?-Math.PI/2:Math.PI;pose(pm,'cuffed');
        R.plate.visible=true;R.plate.position.set(ox+8+(side?.25:0),1.25,oz+9.1+(side?.25:0));R.plate.rotation.y=pm.rotation.y;
        if((flashN===0&&this.st>.4)||(flashN===1&&this.st>1.7)){flashN++;flashT=.12;SFX.blip('click');$('#flash').classList.remove('blue');}}
      else if(s.act==='cell'){R.plate.visible=false;const tx=ox+11.5,tz=oz+7.5,dx=tx-pm.position.x,dz=tz-pm.position.z,d=Math.hypot(dx,dz);
        if(this.st<.3){pm.position.set(ox+10.6,.02,oz+3.2);}
        else if(d>.3){pm.position.x+=dx/d*1.6*dt;pm.position.z+=dz/d*1.6*dt;pm.rotation.y=Math.atan2(dx,dz);animWalk(pm,this.t*6,.4);pm.userData.j.arms.forEach(a=>{a.sh.rotation.set(.42,0,a.s*.3);a.el.rotation.x=-1.05;});}
        else{pose(pm,'sit');pm.position.y=-.02;pm.rotation.y=Math.PI;}
        if(this.st>1.6&&!this.clang){this.clang=true;SFX.blip('door');SFX.blip('cuff');}
        R.door.position.x=this.st>1.6?Math.max(ox+10.2,ox+11.55-(this.st-1.6)*2.2):ox+11.55;}
      else{pm.position.set(ox+3.1,.02,oz+5.6);pm.rotation.y=0;pose(pm,'cuffed');}
    },
    cleanup(){scene.remove(R.g);intLights[1].intensity=0;intLights[2].intensity=0;
      pl.x=LOC.station.x+LOC.station.nx*2;pl.z=LOC.station.z+LOC.station.nz*2;pl.h=faceOf(LOC.station);pl.mesh.position.set(pl.x,.2,pl.z);camPos.init=false;}});
  dialog(L,[{label:'Back to work'}],()=>{scene.remove(pm);career.bookings=(career.bookings||0)+1;book();endCine();});
}

// ---------- your own house
function homeLook(){return (career.officer&&career.officer.uniform)||'blue';}
var UNIFORMS={blue:{name:'Standard blue',shirt:'#1f2b45',vest:true},black:{name:'Night patrol black',shirt:'#16181d',vest:true,vestColor:'#0e0f12'},khaki:{name:'Khaki field',shirt:'#8a7a52',vest:true,vestColor:'#3c3a2c'},white:{name:'Parade white',shirt:'#e9e5da',vest:false}};
function refreshPlayerMesh(){
  const old=pl.mesh;const m=makePersonMesh(playerLook());m.position.copy(old.position);m.rotation.y=old.rotation.y;m.visible=old.visible;
  scene.remove(old);scene.add(m);pl.mesh=m;CB.hand=null;
}
let homeBuilt=false;
function decorHome(){
  if(homeBuilt||!LOC.home)return;homeBuilt=true;const d=LOC.home,rot=faceOf(d);const sp=SPECIAL[HOME_KEY];
  const at=(m,u,v,y,ry=0)=>{m.position.set(d.x+d.tx*u+d.nx*v,y,d.z+d.tz*u+d.nz*v);m.rotation.y=rot+ry;scene.add(m);return m;};
  // pitched roof over the bungalow
  const rf=new THREE.ConeGeometry(.7071,3.2,4,1);rf.rotateY(Math.PI/4);const r=sh(new THREE.Mesh(rf,std('#7a3a2a',.85,0)));
  const bx=d.x-d.nx*(sp.D/2+1.6),bz=d.z-d.nz*(sp.D/2+1.6);const w=d.nx?sp.D:sp.W,dd=d.nx?sp.W:sp.D;
  r.scale.set((w/2+.6)/.5,1,(dd/2+.6)/.5);r.position.set(bx,sp.H+.2+1.6,bz);scene.add(r);
  // compound wall with a gate, a nameplate and your private car
  const wallM=lam('#d8cdb4');const seg=(u,v,len,alongT)=>{const m=sh(new THREE.Mesh(new THREE.BoxGeometry(alongT?len:.3,1.6,alongT?.3:len),wallM));at(m,u,v,.8);};
  seg(-9,7,10,true);seg(9,7,10,true);
  const gate=sh(new THREE.Mesh(new THREE.BoxGeometry(7,1.8,.12),lam('#2c3a4a')));at(gate,0,7.2,.9);gate.visible=false;
  const [c,cg]=mkC(256,96);cg.fillStyle='#f4f1e6';cg.fillRect(0,0,256,96);cg.fillStyle='#1d3a7a';cg.font='700 30px sans-serif';cg.textAlign='center';cg.fillText('HOME',128,44);cg.font='600 18px sans-serif';cg.fillText((OFF().first||'Officer')+' '+(OFF().last||''),128,76);
  at(new THREE.Mesh(new THREE.PlaneGeometry(1.6,.6),new THREE.MeshBasicMaterial({map:ctex(c)})),3.6,7.4,1.3);
  for(const u of [-2.4,2.4]){const pot=sh(new THREE.Mesh(new THREE.CylinderGeometry(.35,.28,.6,10),lam('#9a5a3a')));at(pot,u,1.4,.5);const pl2=sh(new THREE.Mesh(new THREE.SphereGeometry(.55,8,6),lam('#3f7a3a')));at(pl2,u,1.4,1.15);}
  try{const car=makeCarMesh('#6b1f24','Corolla',false,false);at(car,-5.5,4,0,Math.PI/2);}catch(e){}
}
const HOME_KEY='6,2';
function homeInteractable(I){
  if(!LOC.home)return;const d=LOC.home;
  I.push({key:'home',x:d.x+d.nx*.8,z:d.z+d.nz*.8,kind:'door',face:faceOf(d),label:'Go inside your house',act:enterHome});
}
function enterHome(){
  if(insideS||raidS)return;if(prisoner){toast('Book your prisoner at the station first.','bad');return;}
  const L=buildInterior(31337),ox=IN.x,oz=IN.z;
  const items=[
    {id:'bed',x:ox+12.5,z:oz+7.1,label:'Sleep',use:sleepHome},
    {id:'wardrobe',x:ox+9,z:oz+8.9,label:'Change your uniform',use:wardrobe},
    {id:'fridge',x:ox+13.8,z:oz+2.5,label:'Eat something',use:eatHome},
    {id:'tv',x:ox+2.1,z:oz+6.5,label:'Watch the news',use:watchNews},
    {id:'table',x:ox+4,z:oz+3.5,label:'Look at your service file',use:()=>openMDT('service')},
  ];
  items.forEach(it=>{const mk=new THREE.Mesh(GEO.marker,new THREE.MeshBasicMaterial({color:col('#7fb0ea')}));mk.position.set(it.x,1.6,it.z);L.g.add(mk);it.mk=mk;});
  const d=LOC.home;
  insideS={cs:null,kind:'home',p:null,L,items,done:{},t:0,back:{x:d.x+d.nx*1.8,z:d.z+d.nz*1.8,h:faceOf(d)},title:'Home'};
  inCar=false;pc.vx=pc.vz=0;pl.x=L.spawn.x;pl.z=L.spawn.z;pl.h=0;pl.mesh.visible=true;camPos.init=false;
  document.body.classList.add('raid');$('#raidhud').hidden=false;SFX.blip('door');
  toast('Home. Sleep, eat, change your uniform or catch the news. Leave by the front door.');
}
function sleepFade(cb){
  let f=$('#sleepFade');if(!f){f=document.createElement('div');f.id='sleepFade';document.body.appendChild(f);}
  f.classList.add('on');setTimeout(()=>{cb();setTimeout(()=>f.classList.remove('on'),900);},1100);
}
function sleepHome(){
  const cs=curCase;
  if(cs&&!cs.ended){
    if(isFinite(cs.limit)&&cs.limit-cs.used<8*60+30){toast(`No time to sleep: only ${fmtMin(cs.limit-cs.used)} left on ${cs.title}.`,'bad');return;}
    dialog([you(`If I sleep now, eight hours go off the ${cs.title} clock.`)],[{label:'Sleep 8 hours'},{label:'Not now',cls:'ghost'}],ch=>{if(ch.label.startsWith('Sleep'))doSleep(480);});return;
  }
  doSleep(480);
}
function doSleep(min){
  pose(pl.mesh,'idle');
  sleepFade(()=>{
    if(curCase&&!curCase.ended){if(!spend(curCase,min))return;}else worldMin+=min;
    CB.hp=100;career.sleeps=(career.sleeps||0)+1;saveCareer();try{saveGame();}catch(e){}
    const night=nightF>.5;
    toast(`You sleep for eight hours. ${worldClock()}. Fully rested${night?'':', and the city is already awake'}.`,'good');
  });
}
function eatHome(){
  const meals=['jollof rice and fried plantain','amala and ewedu','yam and egg sauce','beans and dodo','a plate of fried rice and chicken'];
  CB.hp=100;SFX.blip('good');
  dialog([you(`You warm up ${pick(meals)} and eat standing at the counter.`),you('Better. Back to it.')],[{label:'Done'}],()=>{});
}
function watchNews(){
  const o=OFF(),s=ST(),t=career.rep;const name=`${o.first} ${o.last}`;
  const lines=[{name:'Eko TV · Nightly news',text:t>=65?`Market women in Port Eko are talking about a Division 9 officer, ${name}, who "no dey collect". Our reporter could not confirm. They would not let her.`:t>=40?`Port Eko police say crime is down this month. Residents say they will believe it when they see it.`:`Complaints against Division 9 are up again. Residents describe officers who "settle" cases for cash.`}];
  if(career.arrests)lines.push({name:'Eko TV · Nightly news',text:`Police report ${career.arrests} arrest${career.arrests>1?'s':''} by Division 9's newest constable${s.refused?`, who has refused ${s.refused} bribe${s.refused>1?'s':''}`:''}.`});
  if(s.taken)lines.push({name:'Eko TV · Nightly news',text:'In other news, an anonymous source says some officers at Division 9 have been living above their salary.'});
  lines.push({name:'Eko TV · Weather',text:pick(['Harmattan haze expected tomorrow. Drive carefully.','Rain from midday. Lagoon roads may flood.','Hot and humid. NEPA promises light by evening.'])});
  dialog(lines,[{label:'Turn it off'}],()=>{});
}
function wardrobe(){
  const cur=homeLook();
  dialog([you('Which uniform today?')],Object.entries(UNIFORMS).map(([k,u])=>({label:u.name+(k===cur?' ✓':'')})),ch=>{
    const k=Object.keys(UNIFORMS).find(k=>ch.label.startsWith(UNIFORMS[k].name));if(!k)return;
    career.officer.uniform=k;saveCareer();refreshPlayerMesh();SFX.blip('click');toast(`${UNIFORMS[k].name} on.`);
  });
}

// ---------- the city map: tap the minimap to open it, tap anywhere to set a pin
function mapPlaces(){
  const P=[];const add=(x,z,label,kind)=>P.push({x,z,label,kind});
  add(LOC.station.x,LOC.station.z,'Division 9 police station','station');
  if(LOC.home)add(LOC.home.x,LOC.home.z,'Your house','home');
  add(LOC.bank.x,LOC.bank.z,'The bank','bank');add(LOC.school.x,LOC.school.z,'The school','school');
  for(const n in LOC.motels){const m=LOC.motels[n];add(m.x,m.z,n,'motel');}
  if(prisoner)add(LOC.book.x,LOC.book.z,'Prisoner drop-off bay','bay');
  try{for(const it of interactables())add(it.x,it.z,it.label,'case');}catch(e){}
  return P;
}
function openCityMap(){
  if(!started||modalOpen()||cine||cctv)return;
  const el=openModal(`<header><div><div class="eyebrow">Port Eko · tap a place to set the GPS</div><h2>City map</h2></div><button class="x" aria-label="Close">✕</button></header>
    <div class="citymap"><canvas id="bigmap" width="900" height="900"></canvas><div class="maplegend">
      <span><i style="background:#4b8dff"></i>You</span><span><i style="background:#f4b740"></i>Case</span><span><i style="background:#7fb0ea"></i>Home</span><span><i style="background:#ff4d5e"></i>Suspect</span>
      <div class="row" style="margin-top:8px"><button class="btn ghost sm" id="mapClear">Clear GPS</button></div><p class="muted" id="mapNote" style="font-size:12px;margin:6px 0 0">Tap a landmark to route there, or anywhere to drop a pin.</p></div></div>`,{wide:true});
  $('.x',el).onclick=closeModal;$('#mapClear',el).onclick=()=>{gps=null;gpsPerson=null;drawCityMap();$('#mapNote').textContent='GPS cleared.';};
  const cv=$('#bigmap',el);
  cv.addEventListener('click',e=>{
    const r=cv.getBoundingClientRect(),W=CITY+60,x=(e.clientX-r.left)/r.width*W-30,z=(e.clientY-r.top)/r.height*W-30;
    let best=null,bd=32;for(const p of mapPlaces()){const d=Math.hypot(p.x-x,p.z-z);if(d<bd){bd=d;best=p;}}
    if(best)setGPS(best.x,best.z,best.label,null,true);else setGPS(clamp(x,0,CITY),clamp(z,0,CITY),'Map pin',null,true);
    SFX.blip('click');drawCityMap();$('#mapNote').textContent=`GPS set: ${gps.label}. Close the map and follow the yellow line.`;
  });
  drawCityMap();
}
function drawCityMap(){
  const cv=$('#bigmap');if(!cv)return;const g=cv.getContext('2d'),W=cv.width,sc=W/(CITY+60),X=x=>(x+30)*sc;
  g.fillStyle='#1b2433';g.fillRect(0,0,W,W);
  g.fillStyle='#3a404b';for(let i=0;i<=NB;i++){g.fillRect(X(i*S-8),X(-8),16*sc,(CITY+16)*sc);g.fillRect(X(-8),X(i*S-8),(CITY+16)*sc,16*sc);}
  for(let bi=0;bi<NB;bi++)for(let bj=0;bj<NB;bj++){const sp=SPECIAL[bi+','+bj];
    g.fillStyle=sp?({park:'#2e5a3a',station:'#22408a',bank:'#5a4a20',school:'#5a2e26',home:'#2c4a6a'}[sp.kind]||'#4a2a44'):'#26303f';
    g.fillRect(X(bi*S+8),X(bj*S+8),(S-16)*sc,(S-16)*sc);}
  g.fillStyle='rgba(230,236,246,.35)';g.font=`600 ${Math.round(W/60)}px IBM Plex Sans, sans-serif`;g.textAlign='center';
  const dists={};for(const d of RES_DOORS){(dists[d.district]=dists[d.district]||[]).push(d);}
  for(const k in dists){const a=dists[k];const x=a.reduce((s,d)=>s+d.x,0)/a.length,z=a.reduce((s,d)=>s+d.z,0)/a.length;g.fillText(k.toUpperCase(),X(x),X(z));}
  if(gps&&route.length>1){g.strokeStyle='#f4b740';g.lineWidth=W/150;g.lineJoin='round';g.beginPath();route.forEach((q,i)=>i?g.lineTo(X(q.x),X(q.z)):g.moveTo(X(q.x),X(q.z)));g.stroke();}
  const dot=(x,z,c,r)=>{g.fillStyle=c;g.beginPath();g.arc(X(x),X(z),r,0,7);g.fill();};
  g.textAlign='left';g.font=`700 ${Math.round(W/52)}px IBM Plex Sans, sans-serif`;
  for(const p of mapPlaces()){const c=p.kind==='case'?'#f4b740':p.kind==='home'?'#7fb0ea':p.kind==='station'?'#4b8dff':p.kind==='bay'?'#f4b740':'#c9ccd2';
    dot(p.x,p.z,c,W/90);if(p.kind!=='case'){g.fillStyle='#e6ecf6';g.strokeStyle='rgba(10,14,20,.8)';g.lineWidth=4;g.strokeText(p.label,X(p.x)+W/70,X(p.z)+5);g.fillText(p.label,X(p.x)+W/70,X(p.z)+5);}}
  if(suspect)dot(suspect.rx,suspect.rz,'#ff4d5e',W/80);if(runner)dot(runner.x,runner.z,'#ff4d5e',W/80);
  for(const a of CB.foes)if(a.state!=='cuffed')dot(a.x,a.z,'#ff4d5e',W/100);
  if(gps){g.save();g.translate(X(gps.x),X(gps.z));g.rotate(Math.PI/4);const s=W/45;g.fillStyle='#f4b740';g.strokeStyle='#1d1406';g.lineWidth=3;g.fillRect(-s/2,-s/2,s,s);g.strokeRect(-s/2,-s/2,s,s);g.restore();}
  if(!inCar)dot(pc.x,pc.z,'#9aa6b6',W/110);
  const p=inCar?pc:pl;g.save();g.translate(X(p.x),X(p.z));g.rotate(-p.h+Math.PI);const a=W/45;g.fillStyle='#4b8dff';g.strokeStyle='#fff';g.lineWidth=3;
  g.beginPath();g.moveTo(0,-a);g.lineTo(a*.65,a*.6);g.lineTo(0,a*.25);g.lineTo(-a*.65,a*.6);g.closePath();g.fill();g.stroke();g.restore();
}

// ---------- every frame
function lifeFrame(dt){
  decorHome();
  if(CUFF&&!CUFF.cine)cuffStep(dt);
}
function bindLife(){
  const m=$('#mini');if(m)m.addEventListener('click',openCityMap);
}
