// ================= case guide: always say who to meet, where, and how
// The objective panel names the next step in plain words, the GPS follows it automatically,
// and a beam of light stands over the place you need to go.
const GUIDE={t:0,beam:null,gem:null};
// the step to do now: anything urgent first, then the case's own order, the records search last
// leads kept only for reference (a camera you already watched, a house you can't enter yet) are never "next"
const guideSkip=l=>l.info||(l.at&&l.c===0&&!l.hot&&!l.pid&&!l.run);
function guideLead(L){return L.find(l=>l.hot)||L.find(l=>!l.db&&!guideSkip(l))||L.find(l=>l.db)||L[0];}
function guideKey(){return document.body.classList.contains('touchmode')?'USE':'E';}
function guideObj(cs){
  const L=leads(cs),l=guideLead(L),more=L.length-1;
  const e=`${cs.code} · ${cs.title}`;
  const can=caseCanClose(cs);
  if(!l||(can&&l.db))return {e,b:'Close the case',p:'The job is done. Open the MDT (Tab, or the MDT button top right), go to the Case tab and tap "Close the case" to file your report.',w:'Open MDT › Case › Close the case'};
  let p;
  if(l.at){const d=Math.round(Math.hypot(l.at.x-pl.x,l.at.z-pl.z));
    p=`${l.d} Go to ${l.at.label}${d>6?` (${d} m)`:''}: follow the yellow GPS line and the light beam, then press ${guideKey()} at the yellow marker.`;}
  else if(l.db)p='Find who did it: open the MDT, go to Records and tick the clues from your evidence board (car, tattoo, height...) until one person is left. Then tap "Set GPS to home" and go and arrest them.';
  else p=`${l.d} Open the MDT (Tab, or the MDT button top right), go to the Case tab and tap Open next to "${l.t}".`;
  if(more>0)p+=` ${more} more lead${more>1?'s':''} in the MDT.`;
  if(can)p+=' The main suspect is in custody: you can close the case from the MDT any time.';
  const w=l.at?'':l.db?'Open MDT › Records › find the suspect':`Open MDT › Case › Open "${l.t}"`;
  return {e,b:l.t,p,w,guide:true};
}
function guideBusy(){return chase||runner||raidS||insideS||cine||CB.inc;}
function guideTick(dt){
  GUIDE.t-=dt;
  if(GUIDE.t<=0){GUIDE.t=.5;
    // GPS follows the case: only ever replaces a route the guide set itself
    if(curCase&&!guideBusy()){
      const l=guideLead(leads(curCase));
      if(l&&l.at&&(!gps||gps.auto)){if(!gps||gps.label!==l.at.label||Math.hypot(gps.x-l.at.x,gps.z-l.at.z)>1){setGPS(l.at.x,l.at.z,l.at.label,l.pid||null);gps.auto=true;}}
      else if(gps&&gps.auto&&!(l&&l.at)){gps=null;gpsPerson=null;}
    }
  }
  // the beam over the destination
  if(!GUIDE.beam){
    GUIDE.beam=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,70,14,1,true),new THREE.MeshBasicMaterial({color:0xf4b740,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,fog:false}));
    GUIDE.gem=new THREE.Mesh(new THREE.OctahedronGeometry(.9),new THREE.MeshBasicMaterial({color:0xf4b740,fog:false}));
    scene.add(GUIDE.beam);scene.add(GUIDE.gem);
  }
  const d=gps?Math.hypot(gps.x-pl.x,gps.z-pl.z):0;
  const show=!!gps&&!raidS&&!insideS&&!cine&&!cctv&&d>7;
  GUIDE.beam.visible=GUIDE.gem.visible=show;
  if(show){GUIDE.beam.position.set(gps.x,35,gps.z);GUIDE.beam.material.opacity=.16+.08*Math.sin(tAcc*3);
    GUIDE.gem.position.set(gps.x,5.5+Math.sin(tAcc*2.4)*.5,gps.z);GUIDE.gem.rotation.y=tAcc*1.5;GUIDE.gem.scale.setScalar(clamp(d/40,1,4));}
}
function bindGuide(){
  // tap the objective panel to open the case board
  const o=$('#obj');if(o)o.addEventListener('click',()=>{if(started&&!modalOpen()&&!cine&&!raidS&&!cctv)openMDT(curCase?'case':'dispatch');});
}
