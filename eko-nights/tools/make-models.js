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
  // a side outline (x = along the vehicle, front at +x; y = up) extruded across its width
  const side=(pts,width,m,bevel=.04,arches=null)=>{
    const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);pts.slice(1).forEach(p=>s.lineTo(p[0],p[1]));
    if(arches)arches(s);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:width-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:10});
    g.rotateY(-Math.PI/2);g.translate((width-2*bevel)/2,0,0);return new THREE.Mesh(g,m);};
  // bottom edge from the rear corner forward, round two wheel arches
  const arches=(rear,front,ax,r,y=.30)=>s=>{s.lineTo(rear,y);s.lineTo(-ax-r,y);s.absarc(-ax,y,r,Math.PI,0,true);s.lineTo(ax-r,y);s.absarc(ax,y,r,Math.PI,0,true);s.lineTo(front,y);};
  const boxIn=g=>(w,h,l,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),m);b.position.set(x,y,z);g.add(b);return b;};
  const wheel=(g,x,z,r,w=.26)=>{const t=new THREE.CylinderGeometry(r,r,w,18),h=new THREE.CylinderGeometry(r*.55,r*.55,w+.01,10);t.rotateZ(Math.PI/2);h.rotateZ(Math.PI/2);
    const k=new THREE.Group();k.add(new THREE.Mesh(t,mat('#101114',{roughness:.9})));k.add(new THREE.Mesh(h,mat(CHROME,{metalness:.7,roughness:.3})));k.position.set(x,r,z);g.add(k);return k;};
  const decal=(txt,w,h,fs,col,bg)=>{const c=document.createElement('canvas');c.width=512;c.height=Math.round(512*h/w);const x=c.getContext('2d');
    if(bg){x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);}x.fillStyle=col;x.font=`900 ${fs}px Arial Black, Arial, sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(txt,c.width/2,c.height/2+4);
    const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:.5}));};
  // a decal on both flanks of a vehicle W wide, reading front to back from either side
  const flanks=(g,W,mk,y,z)=>[1,-1].forEach(sx=>{const d=mk();d.position.set(sx*(W/2+.012),y,z);d.rotation.y=sx*Math.PI/2;g.add(d);});
  const plate=(g,y,z,back)=>{const p=decal('EKO 482 KJ',.52,.12,64,'#1b3a7a','#f4f4ee');p.position.set(0,y,z);if(back)p.rotation.y=Math.PI;g.add(p);};

  // sedan body shared by the cruiser and the everyday sedans: a three-box saloon with a glass cabin
  function saloon(g,bodyMat,roofMat){
    const W=1.84,AX=1.42,box=boxIn(g);
    g.add(side([[2.36,.62],[2.30,.86],[1.15,.98],[-1.55,.98],[-2.32,.93],[-2.40,.62]],W,bodyMat,.05,arches(-2.36,2.34,AX,.47)));
    g.add(side([[-1.52,.96],[-.92,1.40],[.38,1.42],[1.14,.97]],1.56,glass(),.05));
    box(1.58,.06,1.36,roofMat,0,1.45,-.26);box(1.60,.44,.10,bodyMat,0,1.19,-.08);
    box(1.90,.20,.16,mat(BLACK),0,.42,2.36);box(1.90,.20,.16,mat(BLACK),0,.42,-2.40);box(1.10,.16,.04,mat('#2a2d33'),0,.70,2.37);
    [-.66,.66].forEach(x=>{box(.36,.13,.05,lamp('#fff6d8','#ffe9a8'),x,.74,2.425);box(.12,.08,.05,lamp('#ffb020','#ff9900'),x*1.22,.60,2.425);
      box(.40,.14,.05,lamp('#c4141c','#a00008'),x,.78,-2.465);box(.12,.08,.05,lamp('#f2f2f2','#888'),x*.62,.64,-2.465);});
    [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx,sz])=>wheel(g,sx*.80,sz*AX,.35));
    return {W,box};
  }

  const B={};
  B.cruiser=()=>{
    const NAVY='#13244a',g=new THREE.Group();const navy=mat(NAVY,{metalness:.35,roughness:.4});
    const {W,box}=saloon(g,navy,mat(WHITE));
    box(W+.02,.07,4.62,mat(WHITE),0,.90,0);box(W+.02,.05,4.62,mat('#c8202a'),0,.84,0);    // white belt stripe, red pinstripe
    [-.5,.5].forEach(x=>box(.08,.42,.08,mat(BLACK),x,.56,2.55));box(1.16,.07,.08,mat(BLACK),0,.76,2.55);box(1.16,.07,.08,mat(BLACK),0,.46,2.55);  // bull bar
    flanks(g,W,()=>decal('POLICE',1.7,.34,118,WHITE),.64,.05);flanks(g,W,()=>decal('DIV 9 · PORT EKO',1.2,.12,44,'#d9dee6'),.47,.05);
    const hood=decal('POLICE',1.2,.3,120,WHITE);hood.rotation.x=-Math.PI/2+.11;hood.position.set(0,.985,1.72);hood.rotation.z=Math.PI;g.add(hood);
    const boot=decal('POLICE',1.0,.22,120,WHITE);boot.rotation.x=-Math.PI/2+.05;boot.position.set(0,.985,-1.95);g.add(boot);
    box(1.20,.04,.30,mat(BLACK),0,1.50,-.26);  // light bar mount; the game's flashing bar sits on top
    return g;};
  B.sedan=()=>{
    const g=new THREE.Group();const p=paint('#a8b0ba');const {W,box}=saloon(g,p,p);
    box(W+.015,.03,4.5,mat(CHROME,{metalness:.8,roughness:.25}),0,.80,0);                  // chrome waistline
    [[.42],[-.6]].forEach(([z])=>[1,-1].forEach(sx=>box(.03,.04,.18,mat(CHROME,{metalness:.8}),sx*(W/2+.01),.86,z)));  // door handles
    [1,-1].forEach(sx=>box(.16,.10,.10,p,sx*(W/2+.06),1.02,1.02));                         // mirrors
    plate(g,.42,2.445,false);plate(g,.52,-2.485,true);
    return g;};
  B.danfo=()=>{
    // the yellow Lagos minibus: tall boxy body, two black stripes, a row of windows, roof rack, sliding door
    const g=new THREE.Group(),W=1.86,AX=1.55,box=boxIn(g);const p=paint('#e8b417');
    g.add(side([[2.42,.50],[2.40,1.10],[2.12,1.62],[1.80,1.98],[-2.30,2.02],[-2.42,1.90],[-2.44,.50]],W,p,.06,arches(-2.40,2.40,AX,.46)));
    const gl=glass();
    [1,-1].forEach(sx=>{box(.03,.46,3.55,gl,sx*(W/2+.005),1.50,-.32);                    // side windows
      for(const z of [-1.5,-.62,.26])box(.04,.48,.08,p,sx*(W/2+.01),1.50,z);              // window pillars
      for(const y of [.62,1.0])box(.03,.12,4.75,mat('#111111'),sx*(W/2+.01),y,0);         // the black stripes
      box(.03,.9,.03,mat('#3a3020'),sx*(W/2+.012),.95,.40);});                             // sliding-door seam
    const ws=new THREE.Mesh(new THREE.PlaneGeometry(1.62,.62),gl);ws.position.set(0,1.62,2.27);ws.rotation.x=-.75;g.add(ws);  // windscreen
    box(1.5,.42,.03,gl,0,1.52,-2.455);                                                     // rear window
    [[-.7],[.7]].forEach(([x])=>{box(.30,.20,.05,lamp('#fff6d8','#ffe9a8'),x,.95,2.43);box(.16,.30,.05,lamp('#c4141c','#a00008'),x*1.12,1.0,-2.46);});
    box(1.92,.22,.16,mat('#2a2a2a'),0,.52,2.44);box(1.92,.22,.16,mat('#2a2a2a'),0,.52,-2.46);
    [-.72,.72].forEach(x=>box(.05,.08,4.0,mat(BLACK),x,2.10,-.2));for(const z of [-1.8,-.6,.6,1.6])box(1.5,.05,.05,mat(BLACK),0,2.10,z);  // roof rack
    const back=decal("GOD'S TIME IS THE BEST",1.5,.16,46,'#111');back.position.set(0,1.18,-2.47);back.rotation.y=Math.PI;g.add(back);
    plate(g,.75,2.53,false);
    [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx,sz])=>wheel(g,sx*.80,sz*AX,.36));
    return g;};
  B.keke=()=>{
    // the three-wheel tricycle taxi: painted tub and nose, black canopy on posts, driver up front, one wheel at the front
    const g=new THREE.Group(),box=boxIn(g);const p=paint('#e8b417');
    box(1.25,.55,1.8,p,0,.68,-.35);                                                     // passenger tub
    const nose=new THREE.Mesh(new THREE.CylinderGeometry(.34,.42,.95,8),p);nose.position.set(0,.90,1.05);g.add(nose);
    box(1.15,.40,.10,mat('#151515'),0,1.08,-1.22);                                       // rear panel
    box(1.05,.14,.55,mat('#2b2420'),0,1.0,-.75);box(1.05,.45,.10,mat('#2b2420'),0,1.25,-1.0);   // passenger bench
    box(.45,.12,.4,mat('#2b2420'),0,1.05,.35);                                           // driver seat
    box(1.34,.07,2.45,mat('#151515'),0,1.88,-.15);                                       // canopy
    [[-.62,.92],[.62,.92],[-.62,-1.22],[.62,-1.22]].forEach(([x,z])=>box(.05,.86,.05,mat('#151515'),x,1.43,z));
    const ws=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.52),glass());ws.position.set(0,1.55,.95);ws.rotation.x=-.18;g.add(ws);
    box(.62,.04,.04,mat(CHROME,{metalness:.7}),0,1.30,.78);                              // handlebar
    // driver
    box(.36,.42,.24,mat('#2f5fb8'),0,1.36,.35);const head=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),mat('#5a3620'));head.position.set(0,1.70,.38);g.add(head);
    box(.20,.12,.10,lamp('#fff6d8','#ffe9a8'),0,1.18,1.53);box(.1,.1,.04,lamp('#c4141c','#a00008'),-.5,.75,-1.27);box(.1,.1,.04,lamp('#c4141c','#a00008'),.5,.75,-1.27);
    flanks(g,1.25,()=>decal('KEKE NAPEP',.9,.16,64,'#151515'),.72,-.35);
    wheel(g,0,1.25,.28,.16);wheel(g,-.62,-.85,.30,.18);wheel(g,.62,-.85,.30,.18);
    return g;};

  // everyday cars: a painted lower body round the wheel arches, a glass cabin, a painted roof, lamps, bumpers, plates and wheels
  function car(o){
    const g=new THREE.Group(),box=boxIn(g),p=paint(o.col);const W=o.W,zF=o.front,zR=o.rear;
    g.add(side(o.body,W,p,.05,arches(zR+.04,zF-.02,o.ax,o.wr+.12,o.y0)));
    g.add(side(o.cabin,W-.28,glass(),.05));
    box(W-.26,.06,o.roofLen,p,0,o.roofY,o.roofZ);
    box(W+.04,.20,.16,mat(BLACK),0,o.y0+.14,zF+.04);box(W+.04,.20,.16,mat(BLACK),0,o.y0+.14,zR-.04);
    const fy=o.lampY,ry=o.tailY||o.lampY;
    [-1,1].forEach(sx=>{box(.34,.13,.05,lamp('#fff6d8','#ffe9a8'),sx*(W/2-.3),fy,zF+.03);box(.12,.07,.05,lamp('#ffb020','#ff9900'),sx*(W/2-.08),fy-.13,zF+.03);
      box(o.tallTail?.14:.36,o.tallTail?.42:.14,.05,lamp('#c4141c','#a00008'),sx*(W/2-(o.tallTail?.1:.3)),ry,zR-.03);
      box(.16,.10,.10,p,sx*(W/2+.06),o.mirrorY,o.mirrorZ);});
    plate(g,o.y0+.14,zF+.125,false);plate(g,o.y0+.34,zR-.065,true);
    [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx,sz])=>wheel(g,sx*(W/2-.12),sz*o.ax,o.wr,.24));
    return {g,box,p,W};}
  B.hatchback=()=>car({col:'#2f7d4f',W:1.78,front:2.03,rear:-2.04,ax:1.25,wr:.32,y0:.30,
    body:[[2.03,.60],[1.98,.86],[.95,.98],[-1.80,.98],[-2.02,.88],[-2.04,.60]],
    cabin:[[-1.98,.96],[-1.86,1.40],[.32,1.44],[.95,.97]],roofLen:2.12,roofY:1.44,roofZ:-.78,lampY:.74,tailY:.82,tallTail:true,mirrorY:1.02,mirrorZ:.86}).g;
  B.suv=()=>{const o={col:'#1c1f26',W:1.94,front:2.34,rear:-2.36,ax:1.45,wr:.40,y0:.42,
    body:[[2.34,.70],[2.28,1.0],[1.2,1.14],[-2.22,1.14],[-2.36,1.0],[-2.36,.70]],
    cabin:[[-2.26,1.12],[-2.20,1.70],[.55,1.74],[1.18,1.13]],roofLen:2.70,roofY:1.74,roofZ:-.83,lampY:.95,tailY:1.05,tallTail:true,mirrorY:1.20,mirrorZ:1.05};
    const {g,box,W}=car(o);
    [-1,1].forEach(sx=>{box(.05,.06,2.5,mat(CHROME,{metalness:.7}),sx*(W/2-.22),1.82,-.85);box(.05,.12,4.4,mat('#22252b'),sx*(W/2+.012),.58,0);});  // roof rails, side cladding
    return g;};
  B.minivan=()=>{const o={col:'#e8ebee',W:1.96,front:2.42,rear:-2.46,ax:1.52,wr:.34,y0:.32,
    body:[[2.42,.62],[2.36,.95],[1.62,1.08],[-2.36,1.08],[-2.46,.96],[-2.46,.62]],
    cabin:[[-2.40,1.06],[-2.34,1.72],[.92,1.76],[1.62,1.07]],roofLen:3.24,roofY:1.75,roofZ:-.70,lampY:.86,tailY:1.10,tallTail:true,mirrorY:1.15,mirrorZ:1.40};
    const {g,box,W}=car(o);
    [-1,1].forEach(sx=>{box(.03,.03,1.3,mat('#33363c'),sx*(W/2+.012),1.12,-.55);box(.03,.62,.03,mat('#33363c'),sx*(W/2+.012),.78,.10);});  // sliding-door rail and seam
    return g;};
  B.pickup=()=>{const o={col:'#e8ebee',W:1.96,front:2.44,rear:-2.58,ax:1.62,wr:.40,y0:.40,
    body:[[2.44,.70],[2.38,1.0],[1.2,1.14],[-2.55,1.14],[-2.58,.70]],
    cabin:[[-.46,1.12],[-.40,1.74],[.62,1.76],[1.18,1.13]],roofLen:1.04,roofY:1.76,roofZ:.11,lampY:.96,tailY:1.0,tallTail:true,mirrorY:1.22,mirrorZ:1.0};
    const {g,box,p,W}=car(o);
    box(W-.26,.62,.06,p,0,1.44,-.46);                                                    // back of the cab
    [-1,1].forEach(sx=>box(.08,.30,2.06,p,sx*(W/2-.04),1.29,-1.53));box(W,.30,.08,p,0,1.29,-2.54);  // load bed walls, tailgate
    box(W-.16,.02,2.0,mat('#1b1c20'),0,1.15,-1.53);                                      // bed floor
    [-1,1].forEach(sx=>box(.06,.5,.06,mat(BLACK),sx*(W/2-.2),1.65,-.62));box(W-.34,.06,.06,mat(BLACK),0,1.9,-.62);  // roll bar
    return g;};
  B.okada=()=>{
    // the motorbike taxi; the game keeps its own rider and passenger on top, sitting at seat height .84
    const g=new THREE.Group(),box=boxIn(g);const p=paint('#c8323c');
    box(.22,.30,1.20,p,0,.62,0);                                                          // frame
    const tank=new THREE.Mesh(new THREE.CylinderGeometry(.16,.14,.42,10),p);tank.rotation.x=Math.PI/2;tank.position.set(0,.86,.22);g.add(tank);
    box(.28,.09,.78,mat('#141414'),0,.84,-.22);                                           // seat
    box(.30,.04,.34,mat(BLACK),0,.86,-.78);                                               // rear rack
    const fork=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.62,6),mat(CHROME,{metalness:.7}));fork.position.set(0,.66,.66);fork.rotation.x=.38;g.add(fork);
    box(.70,.04,.04,mat('#222'),0,1.05,.55);                                              // handlebar
    box(.18,.12,.06,lamp('#fff6d8','#ffe9a8'),0,.90,.70);box(.12,.06,.04,lamp('#c4141c','#a00008'),0,.74,-.95);
    const ex=new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,.6,8),mat(CHROME,{metalness:.7}));ex.rotation.x=Math.PI/2;ex.position.set(.16,.36,-.42);g.add(ex);
    box(.30,.06,.42,p,0,.98,-.80);                                                        // rear mudguard
    wheel(g,0,.62,.32,.10);wheel(g,0,-.62,.32,.10);
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
