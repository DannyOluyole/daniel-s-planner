// Builds the low-poly vehicle models as GLBs: node tools/make-models.js [names, default all] (after ./build.sh, which fetches three.js)
// Writes models/<name>.glb, adds each to models/manifest.json and saves a line-up render to tools/vehicles-preview.png.
// Front faces +Z and wheels are included (the game hides its own). Body panels use a material named "paint", which the
// game repaints with each vehicle's own colour. The cruiser has no light bar: the game puts its own flashing one on the roof.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),path=require('path');
const DIR=path.join(__dirname,'..');
// len: length in metres the game scales the model to
const MODELS={cruiser:{len:4.8},sedan:{len:4.5},hatchback:{len:4.1},minivan:{len:4.9},pickup:{len:5.1},suv:{len:4.7},danfo:{len:4.9},keke:{len:2.8},okada:{len:1.9}};

// runs in the browser with THREE loaded
function kit(){
  const WHITE='#eef1f5',BLACK='#16181c',GLASS='#1c2a3a',CHROME='#9aa3ad';
  const mat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.55,metalness:.1},o));
  const paint=c=>{const m=mat(c,{metalness:.35,roughness:.4});m.name='paint';return m;};
  const glass=()=>mat(GLASS,{metalness:.6,roughness:.15});
  const lamp=(c,e)=>mat(c,{emissive:e,emissiveIntensity:.8,roughness:.3});
  const chrome=()=>mat(CHROME,{metalness:.8,roughness:.25});
  const boxIn=g=>(w,h,l,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),m);b.position.set(x,y,z);g.add(b);return b;};
  // a tyre with a rounded shoulder, a dished rim and spokes
  const wheel=(g,x,z,r,w=.24,spokes=5)=>{
    const k=new THREE.Group(),h=w/2;
    const ty=new THREE.LatheGeometry([[r*.60,-h],[r*.90,-h],[r,-h*.6],[r,h*.6],[r*.90,h],[r*.60,h]].map(p=>new THREE.Vector2(p[0],p[1])),16);ty.rotateZ(Math.PI/2);
    k.add(new THREE.Mesh(ty,mat('#101114',{roughness:.9})));
    const rim=new THREE.CylinderGeometry(r*.62,r*.62,w*.72,14);rim.rotateZ(Math.PI/2);k.add(new THREE.Mesh(rim,mat('#2a2d33',{roughness:.6})));
    const cm=chrome();
    for(let i=0;i<spokes;i++){const sp=new THREE.Mesh(new THREE.BoxGeometry(w*.80,r*.58,r*.16),cm);const a=i/spokes*Math.PI*2;sp.position.set(0,Math.cos(a)*r*.31,Math.sin(a)*r*.31);sp.rotation.x=a;k.add(sp);}
    const hub=new THREE.CylinderGeometry(r*.16,r*.16,w*.86,8);hub.rotateZ(Math.PI/2);k.add(new THREE.Mesh(hub,cm));
    k.position.set(x,r,z);g.add(k);return k;};
  const decal=(txt,w,h,fs,col,bg)=>{const c=document.createElement('canvas');c.width=512;c.height=Math.round(512*h/w);const x=c.getContext('2d');
    if(bg){x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);}x.fillStyle=col;x.font=`900 ${fs}px Arial Black, Arial, sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(txt,c.width/2,c.height/2+4);
    const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:.5}));};
  // a decal on both flanks of a vehicle W wide, reading front to back from either side
  const flanks=(g,W,mk,y,z)=>[1,-1].forEach(sx=>{const d=mk();d.position.set(sx*(W/2+.012),y,z);d.rotation.y=sx*Math.PI/2;g.add(d);});
  const plate=(g,y,z,back)=>{const p=decal('EKO 482 KJ',.52,.12,64,'#1b3a7a','#f4f4ee');p.position.set(0,y,z);if(back)p.rotation.y=Math.PI;g.add(p);};

  // ---- a body lofted through cross-sections, front (+z) to back
  // keys: [z, w, y0, yb, yt, wt, crown] = half-width at the widest point, underside, shoulder line (base of the windows),
  // top (bonnet, roof or boot lid), half-width at the top, and how much the top rises to the centre line.
  // Each cross-section is a ring of 15 points; on each side the 7 faces between them are numbered 0 (sill) to 6 (top centre).
  // o.ax/o.wr: axle positions and wheel radius, for arches cut round the wheels; o.extra: more cross-sections (pillar edges);
  // o.matFor(z,k): which of o.mats the face k at z uses, or null to leave it open.
  function loft(g,keys,o){
    const K=keys.slice().sort((a,b)=>b[0]-a[0]),F=K[0][0],R=K[K.length-1][0];
    const at=z=>{for(let i=0;i<K.length-1;i++)if(z<=K[i][0]&&z>=K[i+1][0]){const t=(K[i][0]-z)/((K[i][0]-K[i+1][0])||1);return K[i].map((v,j)=>v+(K[i+1][j]-v)*t);}return z>F?K[0]:K[K.length-1];};
    let zs=K.map(k=>k[0]).concat(o.extra||[]);const aR=(o.wr||0)+.12;
    (o.ax||[]).forEach(a=>{for(let i=0;i<=8;i++)zs.push(a+aR*Math.cos(i/8*Math.PI));});
    zs=zs.filter(z=>z<=F&&z>=R).sort((a,b)=>b-a).filter((z,i,A)=>!i||A[i-1]-z>.012);
    const ring=z=>{let [,w,y0,yb,yt,wt,cr]=at(z);
      (o.ax||[]).forEach(a=>{const d=Math.abs(z-a);if(d<aR)y0=Math.max(y0,o.wr+Math.sqrt(aR*aR-d*d));});
      y0=Math.min(y0,yb-.06);
      const h=[[w*.82,y0],[w*.985,y0+(yb-y0)*.2],[w,y0+(yb-y0)*.55],[w*.975,yb],[wt,Math.max(yb+.012,yt-.07)],[wt-.09,yt],[wt*.5,yt+cr*.8],[0,yt+cr]];
      const pts=h.map(p=>[p[0],p[1],z]);for(let i=6;i>=0;i--)pts.push([-h[i][0],h[i][1],z]);return {pts,mid:(y0+yt)/2};};
    const S=zs.map(ring),N=15,nor=S.map(()=>Array.from({length:N},()=>[0,0,0])),faces=[];
    const tri=(A,B,C,ref,key,ids)=>{const u=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],v=[C[0]-A[0],C[1]-A[1],C[2]-A[2]];
      let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      if(n[0]*ref[0]+n[1]*ref[1]+n[2]*ref[2]<0){[B,C]=[C,B];n=n.map(x=>-x);if(ids)[ids[1],ids[2]]=[ids[2],ids[1]];}
      if(ids)ids.forEach(([i,j])=>{nor[i][j][0]+=n[0];nor[i][j][1]+=n[1];nor[i][j][2]+=n[2];});
      faces.push({P:[A,B,C],n,key,ids});};
    for(let i=0;i<S.length-1;i++)for(let j=0;j<N-1;j++){
      const k=j<7?j:13-j,key=o.matFor((zs[i]+zs[i+1])/2,k);if(!key)continue;
      const a=S[i].pts[j],b=S[i].pts[j+1],c=S[i+1].pts[j+1],d=S[i+1].pts[j];
      const ref=[(a[0]+b[0]+c[0]+d[0])/4,(a[1]+b[1]+c[1]+d[1])/4-(S[i].mid+S[i+1].mid)/2,0];
      tri(a,b,c,ref,key,[[i,j],[i,j+1],[i+1,j+1]]);tri(a,c,d,ref,key,[[i,j],[i+1,j+1],[i+1,j]]);}
    // flat faces closing the two ends
    [[0,1],[S.length-1,-1]].forEach(([i,dir])=>{const c=[0,S[i].mid,zs[i]];
      for(let j=0;j<N;j++){const k=j<7?j:j===14?0:13-j,key=o.capFor?o.capFor(k,dir):o.matFor(zs[i]+dir*.01,Math.min(k,2));if(!key)continue;
        tri(c,S[i].pts[j],S[i].pts[(j+1)%N],[0,0,dir],key,null);}});
    const B={};
    faces.forEach(f=>{const b=B[f.key]||(B[f.key]={p:[],n:[]});f.P.forEach((P,q)=>{b.p.push(P[0],P[1],P[2]);
      let n=f.ids?nor[f.ids[q][0]][f.ids[q][1]]:f.n;const l=Math.hypot(n[0],n[1],n[2])||1;b.n.push(n[0]/l,n[1]/l,n[2]/l);});});
    Object.keys(B).forEach(key=>{const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute(B[key].p,3));ge.setAttribute('normal',new THREE.Float32BufferAttribute(B[key].n,3));
      g.add(new THREE.Mesh(ge,o.mats[key]));});
    return {F,R,at,nose:K[0],tail:K[K.length-1]};
  }

  // a car: painted body with bumpers, a glass cabin on pillars, lamps, grille, mirrors, door lines, handles, plates and wheels
  // o.cowl > o.roofF > o.roofR > o.deck: where the windscreen starts, the roof starts and ends, and the rear screen ends
  function car(o){
    const g=new THREE.Group(),box=boxIn(g),p=o.paint||paint(o.col),trim=mat('#1c1e22',{roughness:.8}),gl=glass();
    const mats={paint:p,roof:o.roof||p,glass:gl,trim,dark:mat('#101114',{roughness:.9})};
    const pill=(o.pillars||[]),pw=o.pillarW||.05,isP=z=>pill.some(q=>Math.abs(z-q)<pw);
    let F=Math.max(...o.keys.map(k=>k[0])),R=Math.min(...o.keys.map(k=>k[0]));
    const extra=[];pill.forEach(q=>extra.push(q-pw,q+pw));extra.push(F-.13,R+.13);
    const matFor=(z,k)=>{
      if(o.matFor){const m=o.matFor(z,k);if(m!==undefined)return m;}
      if((z>F-.13||z<R+.13)&&k<=1)return 'trim';
      if(k===0)return 'trim';
      if(z<o.cowl&&z>o.roofF||z<o.roofR&&z>o.deck)return k===3?'glass':k===4?'paint':k>=5?'glass':'paint';
      if(z<=o.roofF&&z>=o.roofR)return k===3?(isP(z)?'paint':'glass'):k>=4?'roof':'paint';
      return 'paint';};
    const L=loft(g,o.keys,{ax:[o.ax,-o.ax],wr:o.wr,extra,matFor,mats});
    const n=L.nose,t=L.tail,w=L.at(0)[1],yb=L.at(0)[3],y0=L.at(0)[2];
    const aT=o.wr*2+.14;box(2*w-.56,aT-y0,F-R-.9,mats.dark,0,(aT+y0)/2,(F+R)/2);                         // what shows through the wheel arches
    const ly=n[2]+(n[3]-n[2])*.74,ty=o.tailY||t[2]+(t[3]-t[2])*.74;
    [-1,1].forEach(sx=>{
      box(.34,.12,.07,lamp('#fff6d8','#ffe9a8'),sx*(n[1]-.24),ly,F);box(.11,.06,.07,lamp('#ffb020','#ff9900'),sx*(n[1]-.13),ly-.12,F);
      if(o.tallTail)box(.12,.40,.07,lamp('#c4141c','#a00008'),sx*(t[1]-.10),ty,R);else box(.36,.12,.07,lamp('#c4141c','#a00008'),sx*(t[1]-.25),ty,R);
      const mz=o.cowl-.10,my=L.at(mz)[3]+.05;box(.13,.10,.07,p,sx*(w+.035),my,mz);box(.012,.085,.012,gl,sx*(w+.04),my,mz-.04);   // mirror on its stalk
      (o.doors||[]).forEach(z=>{const d=Math.min(Math.abs(z-o.ax),Math.abs(z+o.ax)),aR=o.wr+.12,lo=(d<aR?Math.max(y0,o.wr+Math.sqrt(aR*aR-d*d)):y0)+.06,hi=L.at(z)[3]-.02;
        box(.012,hi-lo,.016,trim,sx*(w+.001),(hi+lo)/2,z);});    // door shut lines
      (o.handles||[]).forEach(z=>box(.03,.035,.16,chrome(),sx*(w-.012),yb-.10,z));});
    box(2*(n[1]-.46),.11,.05,mats.dark,0,ly,F+.005);                                      // grille
    plate(g,n[2]+.09,F+.012,false);plate(g,t[2]+(t[3]-t[2])*.42,R-.012,true);
    const ex=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.16,8),chrome());ex.rotation.x=Math.PI/2;ex.position.set(-(t[1]-.3),t[2]-.02,R-.03);g.add(ex);
    [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx,sz])=>wheel(g,sx*(w-.125),sz*o.ax,o.wr,.24));
    return {g,box,p,w,L,mats,F,R};
  }

  // the saloon shared by the cruiser and the everyday sedans
  const SALOON={cowl:1.15,roofF:.38,roofR:-.92,deck:-1.55,ax:1.42,wr:.35,pillars:[-.20],doors:[1.02,-.20,-1.22],handles:[-.02,-1.02],keys:[
    [2.42,.80,.38,.80,.84,.74,.01],[2.32,.905,.31,.86,.90,.82,.02],[2.05,.92,.30,.90,.935,.83,.03],[1.15,.92,.30,.97,1.00,.84,.03],
    [.38,.92,.30,.98,1.42,.70,.03],[-.92,.92,.30,.98,1.42,.70,.03],[-1.55,.92,.30,.98,1.01,.82,.02],[-2.30,.905,.32,.94,.97,.81,.02],[-2.44,.80,.40,.80,.84,.74,.01]]};

  const B={};
  B.cruiser=()=>{
    const NAVY='#13244a',navy=mat(NAVY,{metalness:.35,roughness:.4});
    const {g,box,w,F}=car(Object.assign({},SALOON,{paint:navy,roof:mat(WHITE,{metalness:.2,roughness:.45})}));const W=2*w;
    box(W-.012,.07,4.2,mat(WHITE),0,.905,0);box(W-.006,.045,4.2,mat('#c8202a'),0,.845,0);    // white belt stripe, red pinstripe
    [-.5,.5].forEach(x=>box(.08,.44,.08,mat(BLACK),x,.60,F+.13));box(1.16,.07,.08,mat(BLACK),0,.80,F+.13);box(1.16,.07,.08,mat(BLACK),0,.48,F+.13);
    [-.5,.5].forEach(x=>box(.06,.06,.14,mat(BLACK),x,.48,F+.05));                           // bull bar on its mounts
    flanks(g,W,()=>decal('POLICE',1.7,.34,118,WHITE),.64,.05);flanks(g,W,()=>decal('DIV 9 · PORT EKO',1.2,.12,44,'#d9dee6'),.47,.05);
    const hood=decal('POLICE',1.2,.3,120,WHITE);hood.rotation.x=-Math.PI/2+.07;hood.position.set(0,1.004,1.66);hood.rotation.z=Math.PI;g.add(hood);
    const boot=decal('POLICE',1.0,.22,120,WHITE);boot.rotation.x=-Math.PI/2-.05;boot.position.set(0,1.022,-1.95);g.add(boot);
    box(1.20,.04,.30,mat(BLACK),0,1.475,-.26);  // light bar mount; the game's flashing bar sits on top
    return g;};
  B.sedan=()=>{
    const {g,box,w}=car(Object.assign({col:'#a8b0ba'},SALOON));
    box(2*w-.01,.025,4.1,chrome(),0,.80,0);                                                // chrome waistline
    return g;};
  B.hatchback=()=>car({col:'#2f7d4f',cowl:.95,roofF:.32,roofR:-1.62,deck:-2.0,ax:1.25,wr:.32,pillars:[-.42],doors:[.84,-.42],handles:[-.22],tallTail:true,tailY:.92,keys:[
    [2.07,.77,.38,.78,.82,.71,.01],[1.97,.88,.31,.84,.88,.79,.02],[1.75,.89,.30,.90,.93,.80,.03],[.95,.89,.30,.96,.99,.81,.03],
    [.32,.89,.30,.97,1.44,.69,.03],[-1.62,.89,.30,.97,1.43,.69,.03],[-2.0,.88,.31,.97,1.02,.79,.01],[-2.09,.79,.40,.80,.84,.72,.01]]}).g;
  B.suv=()=>{const {g,box,w}=car({col:'#1c1f26',cowl:1.18,roofF:.55,roofR:-1.95,deck:-2.3,ax:1.45,wr:.40,pillars:[-.25,-1.25],doors:[1.02,-.25,-1.25],handles:[-.05,-1.05],tallTail:true,tailY:1.12,keys:[
      [2.37,.85,.52,.96,1.0,.79,.01],[2.26,.96,.44,1.02,1.06,.86,.02],[2.0,.97,.42,1.08,1.11,.88,.03],[1.18,.97,.42,1.13,1.16,.89,.03],
      [.55,.97,.42,1.14,1.74,.78,.03],[-1.95,.97,.42,1.14,1.74,.78,.03],[-2.3,.96,.44,1.14,1.20,.86,.01],[-2.39,.87,.52,.96,1.0,.80,.01]]});
    [-1,1].forEach(sx=>{box(.05,.05,2.3,chrome(),sx*(w-.30),1.80,-.70);[.2,-1.6].forEach(z=>box(.05,.06,.05,chrome(),sx*(w-.30),1.77,z));  // roof rails
      box(.03,.10,1.7,mat('#22252b'),sx*(w+.002),.60,0);});                                // side cladding
    return g;};
  B.minivan=()=>{const {g,box,w}=car({col:'#e8ebee',cowl:1.62,roofF:.92,roofR:-2.08,deck:-2.4,ax:1.52,wr:.34,pillars:[.0,-1.1],doors:[1.45,.0,-1.1],handles:[.2],tallTail:true,tailY:1.12,keys:[
      [2.45,.85,.42,.86,.90,.77,.01],[2.34,.97,.34,.94,.98,.86,.02],[2.1,.98,.32,1.0,1.03,.88,.03],[1.62,.98,.32,1.07,1.10,.89,.03],
      [.92,.98,.32,1.08,1.75,.80,.03],[-2.08,.98,.32,1.08,1.75,.80,.03],[-2.4,.97,.34,1.08,1.14,.87,.01],[-2.49,.87,.42,.90,.94,.79,.01]]});
    [-1,1].forEach(sx=>box(.03,.03,1.1,mat('#33363c'),sx*(w+.002),1.0,-.56));              // sliding-door rail
    return g;};
  B.pickup=()=>{const {g,box,p,w}=car({col:'#e8ebee',cowl:1.18,roofF:.62,roofR:-.40,deck:-.52,ax:1.62,wr:.40,pillars:[],doors:[1.02,-.34],handles:[-.14],tallTail:true,tailY:1.0,keys:[
      [2.47,.86,.50,.96,1.0,.79,.01],[2.36,.97,.42,1.02,1.06,.87,.02],[2.1,.98,.40,1.08,1.11,.88,.03],[1.18,.98,.40,1.13,1.16,.89,.03],
      [.62,.98,.40,1.14,1.76,.80,.03],[-.40,.98,.40,1.14,1.76,.80,.03],[-.52,.98,.40,1.14,1.18,.955,0],[-2.52,.98,.42,1.14,1.18,.955,0],[-2.61,.90,.50,1.0,1.04,.86,0]]});
    box(2*w-.20,.02,1.86,mat('#17181b',{roughness:.95}),0,1.186,-1.50);                    // the load bed, inside its rails
    for(const z of [-.9,-1.3,-1.7,-2.1])box(2*w-.24,.012,.03,mat('#26282d'),0,1.20,z);     // bed ribs
    [-1,1].forEach(sx=>box(.06,.5,.06,mat(BLACK),sx*(w-.2),1.44,-.64));box(2*w-.34,.06,.06,mat(BLACK),0,1.70,-.64);  // roll bar
    return g;};
  B.danfo=()=>{
    // the yellow Lagos minibus: tall body, two black stripes, a row of windows, roof rack, sliding door
    const {g,box,w,F,R}=car({col:'#e8b417',cowl:2.28,roofF:1.86,roofR:-2.36,deck:-2.44,ax:1.55,wr:.36,pillars:[1.05,.26,-.62,-1.5],pillarW:.045,doors:[1.05,.26],handles:[.5],tallTail:true,tailY:1.0,keys:[
      [2.45,.82,.56,1.0,1.04,.75,.01],[2.36,.92,.50,1.14,1.18,.84,.02],[2.28,.93,.50,1.20,1.24,.86,.02],[1.86,.93,.50,1.22,2.0,.84,.04],
      [-2.36,.93,.50,1.22,2.02,.84,.04],[-2.44,.92,.52,1.22,1.27,.86,.01],[-2.47,.88,.56,1.0,1.04,.80,.01]]});
    [1,-1].forEach(sx=>{for(const y of [.72,1.04])box(.02,.11,4.5,mat('#111111'),sx*(w-.004),y,0);});   // the black stripes
    [-.66,.66].forEach(x=>box(.05,.07,3.9,mat(BLACK),x,2.12,-.25));for(const z of [-1.9,-.8,.3,1.4])box(1.42,.05,.05,mat(BLACK),0,2.12,z);  // roof rack
    [[-.66,-2.1],[.66,-2.1],[-.66,1.6],[.66,1.6]].forEach(([x,z])=>box(.05,.10,.05,mat(BLACK),x,2.06,z));
    const back=decal("GOD'S TIME IS THE BEST",1.5,.16,46,'#111');back.position.set(0,1.12,R-.016);back.rotation.y=Math.PI;g.add(back);
    return g;};
  B.keke=()=>{
    // the three-wheel tricycle taxi: rounded nose and tub, a domed canopy on posts, the driver up front, one wheel at the front
    const g=new THREE.Group(),box=boxIn(g),p=paint('#e8b417'),dk=mat('#151515',{roughness:.85}),seat=mat('#2b2420',{roughness:.9});
    loft(g,[[1.52,.20,.52,.84,.88,.15,.02],[1.36,.36,.44,.96,1.02,.28,.04],[.95,.52,.40,1.0,1.05,.45,.03],[.55,.62,.40,.98,1.0,.585,0],[-1.2,.63,.40,.98,1.0,.595,0],[-1.28,.56,.46,.90,.92,.52,0]],
      {ax:[-.85],wr:.30,mats:{paint:p,dark:dk},matFor:(z,k)=>k===0||(k>=5&&z<.9)?'dark':'paint'});
    loft(g,[[1.10,.60,1.70,1.86,1.90,.56,.05],[.95,.67,1.70,1.87,1.92,.62,.06],[-1.25,.67,1.70,1.87,1.92,.62,.06],[-1.40,.60,1.70,1.86,1.90,.56,.05]],
      {mats:{dark:dk},matFor:(z,k)=>k>=3?'dark':null,capFor:()=>null});                    // canopy
    box(1.16,.74,.06,dk,0,1.42,-1.24);                                                     // rear panel under the canopy
    box(1.05,.14,.55,seat,0,1.05,-.75);box(1.05,.45,.10,seat,0,1.28,-1.05);                // passenger bench
    box(.45,.12,.4,seat,0,1.07,.35);                                                       // driver seat
    [[-.60,.92],[.60,.92],[-.62,-1.2],[.62,-1.2]].forEach(([x,z])=>{const post=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.90,8),dk);post.position.set(x,1.43,z);g.add(post);});
    const ws=new THREE.Mesh(new THREE.PlaneGeometry(1.12,.60),glass());ws.material.side=THREE.DoubleSide;ws.position.set(0,1.56,.98);ws.rotation.x=-.16;g.add(ws);
    box(.62,.04,.04,chrome(),0,1.30,.78);const col=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.34,6),dk);col.position.set(0,1.16,.86);col.rotation.x=.45;g.add(col);  // handlebar
    // driver
    const tor=new THREE.Mesh(new THREE.CylinderGeometry(.15,.17,.44,10),mat('#2f5fb8'));tor.scale.z=.7;tor.position.set(0,1.36,.35);g.add(tor);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),mat('#5a3620'));head.position.set(0,1.71,.38);g.add(head);
    [-1,1].forEach(sx=>{const arm=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.46,6),mat('#2f5fb8'));arm.position.set(sx*.2,1.38,.56);arm.rotation.x=1.15;arm.rotation.z=sx*-.25;g.add(arm);});
    const hl=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),lamp('#fff6d8','#ffe9a8'));hl.scale.z=.5;hl.position.set(0,.90,1.50);g.add(hl);
    [-.5,.5].forEach(x=>box(.1,.1,.04,lamp('#c4141c','#a00008'),x,.75,-1.29));
    flanks(g,1.26,()=>decal('KEKE NAPEP',.9,.16,64,'#151515'),.74,-.35);
    wheel(g,0,1.25,.28,.14,4);wheel(g,-.54,-.85,.30,.16,4);wheel(g,.54,-.85,.30,.16,4);
    return g;};
  B.okada=()=>{
    // the motorbike taxi; the game keeps its own rider and passenger on top, sitting at seat height .84
    const g=new THREE.Group(),box=boxIn(g),p=paint('#c8323c'),cm=chrome(),bk=mat('#141414',{roughness:.85});
    const cyl=(r1,r2,l,m,x,y,z,rx=0,seg=8)=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,l,seg),m);c.position.set(x,y,z);c.rotation.x=rx;g.add(c);return c;};
    cyl(.035,.035,.80,bk,0,.70,.02,1.25);cyl(.03,.03,.62,bk,0,.50,-.08,1.75);cyl(.03,.03,.50,bk,0,.56,-.50,1.2);   // frame tubes
    const tank=new THREE.Mesh(new THREE.SphereGeometry(.17,12,10),p);tank.scale.set(.85,.72,1.5);tank.position.set(0,.85,.20);g.add(tank);
    const seat=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),bk);seat.scale.set(.9,.36,2.5);seat.position.set(0,.84,-.30);g.add(seat);
    box(.24,.24,.30,mat('#3a3d44',{metalness:.5,roughness:.5}),0,.44,.06);cyl(.10,.10,.26,cm,0,.44,.06,0,10).rotation.z=Math.PI/2;   // engine
    cyl(.07,.07,.20,mat('#3a3d44',{metalness:.5}),0,.60,.10,.3,8);
    box(.28,.03,.30,bk,0,.90,-.82);                                                        // rear rack
    [-1,1].forEach(sx=>{cyl(.022,.022,.70,cm,sx*.085,.66,.60,.40,6);                       // forks
      cyl(.02,.02,.44,cm,sx*.10,.56,-.66,-.55,6);});                                       // rear shocks
    box(.66,.035,.035,bk,0,1.06,.50);[-1,1].forEach(sx=>cyl(.022,.022,.12,bk,sx*.33,1.06,.50,0,6).rotation.z=Math.PI/2);  // handlebar and grips
    const hl=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),lamp('#fff6d8','#ffe9a8'));hl.scale.z=.6;hl.position.set(0,.92,.70);g.add(hl);
    box(.12,.06,.04,lamp('#c4141c','#a00008'),0,.80,-.99);
    cyl(.035,.05,.62,cm,.15,.36,-.42,Math.PI/2,8);                                         // exhaust
    // mudguards: an arc over each wheel
    [[.62,1.5,.25],[-.62,1.9,-.15]].forEach(([z,len,tilt])=>{const ge=new THREE.TorusGeometry(.35,.045,5,10,len);ge.rotateZ(Math.PI/2-len/2+tilt);ge.rotateY(-Math.PI/2);ge.scale(1.7,1,1);
      const f=new THREE.Mesh(ge,p);f.position.set(0,.32,z);g.add(f);});
    wheel(g,0,.62,.32,.10,6);wheel(g,0,-.62,.32,.10,6);
    return g;};
  return {B,paintAll:(m,c)=>m.traverse(o=>{if(o.isMesh&&o.material&&o.material.name==='paint'){o.material=o.material.clone();o.material.color.set(c);}})};
}

(async()=>{
  const want=process.argv.slice(2).length?process.argv.slice(2):Object.keys(MODELS);
  for(const w of want)if(!MODELS[w]){console.error('unknown model '+w+'; choose from '+Object.keys(MODELS).join(', '));process.exit(2);}
  for(const f of ['three/package/build/three.min.js','three/package/examples/js/exporters/GLTFExporter.js'])
    if(!fs.existsSync(path.join(DIR,f))){console.error('missing '+f+': run ./build.sh first');process.exit(2);}
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:1500,height:520}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.setContent('<body style="margin:0;background:#cfd6df"></body>');
  await pg.addScriptTag({path:path.join(DIR,'three/package/build/three.min.js')});
  await pg.addScriptTag({path:path.join(DIR,'three/package/examples/js/exporters/GLTFExporter.js')});
  await pg.addScriptTag({content:'window.KIT=('+kit.toString()+')();'});
  const out=await pg.evaluate(async want=>{
    const res={};
    for(const k of want){const m=KIT.B[k]();m.name=k;
      let tris=0;m.traverse(o=>{if(o.isMesh){const g=o.geometry;tris+=(g.index?g.index.count:g.attributes.position.count)/3;}});
      const glb=await new Promise(r=>new THREE.GLTFExporter().parse(m,x=>r(Array.from(new Uint8Array(x))),{binary:true}));
      res[k]={glb,tris:Math.round(tris)};}
    // line-up render of every model, sedans and kekes in a couple of their colours as the game paints them
    const R=new THREE.WebGLRenderer({antialias:true});R.setSize(1500,520);R.outputEncoding=THREE.sRGBEncoding;R.setClearColor('#cfd6df');document.body.appendChild(R.domElement);
    const S=new THREE.Scene();S.add(new THREE.HemisphereLight('#ffffff','#556070',.9));const sun=new THREE.DirectionalLight('#fff4e0',1.1);sun.position.set(6,10,8);S.add(sun);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,20),new THREE.MeshStandardMaterial({color:'#8e969f'}));ground.rotation.x=-Math.PI/2;S.add(ground);
    [['cruiser',null,-12.6,0],['sedan','#c8323c',-9.4,0],['hatchback','#2f5fb8',-6.4,0],['suv','#1c1f26',-3.2,0],['minivan','#e8ebee',.2,0],['pickup','#a8b0ba',3.6,0],['danfo',null,7.2,0],['keke','#2f8a4f',10.2,0],['okada','#c8323c',12.2,0]].forEach(([k,c,x])=>{
      const m=KIT.B[k]();if(c)KIT.paintAll(m,c);m.rotation.y=-.62;m.position.x=x;S.add(m);});
    const cam=new THREE.PerspectiveCamera(30,1500/520,.1,100);cam.position.set(.2,6.5,20);cam.lookAt(0,.8,0);R.render(S,cam);
    return res;},want);
  await pg.screenshot({path:path.join(__dirname,'vehicles-preview.png')});
  fs.mkdirSync(path.join(DIR,'models'),{recursive:true});
  const mp=path.join(DIR,'models/manifest.json');let man={};try{man=JSON.parse(fs.readFileSync(mp,'utf8'));}catch(e){}
  for(const k of want){fs.writeFileSync(path.join(DIR,`models/${k}.glb`),Buffer.from(out[k].glb));man[k]={file:k+'.glb',len:MODELS[k].len};
    console.log(`${k}: models/${k}.glb, ${out[k].glb.length} bytes, ${out[k].tris} triangles`);}
  fs.writeFileSync(mp,JSON.stringify(man,null,2)+'\n');
  if(errs.length){console.error('page errors',errs);process.exitCode=1;}
  await b.close();
})();
