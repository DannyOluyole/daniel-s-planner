// Builds the low-poly vehicle models as GLBs: node tools/make-models.js [cruiser sedan danfo keke] (after ./build.sh, which fetches three.js)
// Writes models/<name>.glb, adds each to models/manifest.json and saves a line-up render to tools/vehicles-preview.png.
// Front faces +Z and wheels are included (the game hides its own). Body panels use a material named "paint", which the
// game repaints with each vehicle's own colour. The cruiser has no light bar: the game puts its own flashing one on the roof.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),path=require('path');
const DIR=path.join(__dirname,'..');
// len: length in metres the game scales the model to
const MODELS={cruiser:{len:4.8},sedan:{len:4.5},danfo:{len:4.9},keke:{len:2.8}};

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
  const arches=(rear,front,ax,r)=>s=>{s.lineTo(rear,.30);s.lineTo(-ax-r,.30);s.absarc(-ax,.30,r,Math.PI,0,true);s.lineTo(ax-r,.30);s.absarc(ax,.30,r,Math.PI,0,true);s.lineTo(front,.30);};
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
  return {B,paintAll:(m,c)=>m.traverse(o=>{if(o.isMesh&&o.material&&o.material.name==='paint'){o.material=o.material.clone();o.material.color.set(c);}})};
}

(async()=>{
  const want=process.argv.slice(2).length?process.argv.slice(2):Object.keys(MODELS);
  for(const w of want)if(!MODELS[w]){console.error('unknown model '+w+'; choose from '+Object.keys(MODELS).join(', '));process.exit(2);}
  for(const f of ['three/package/build/three.min.js','three/package/examples/js/exporters/GLTFExporter.js'])
    if(!fs.existsSync(path.join(DIR,f))){console.error('missing '+f+': run ./build.sh first');process.exit(2);}
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:1200,height:520}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
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
    const R=new THREE.WebGLRenderer({antialias:true});R.setSize(1200,520);R.outputEncoding=THREE.sRGBEncoding;R.setClearColor('#cfd6df');document.body.appendChild(R.domElement);
    const S=new THREE.Scene();S.add(new THREE.HemisphereLight('#ffffff','#556070',.9));const sun=new THREE.DirectionalLight('#fff4e0',1.1);sun.position.set(6,10,8);S.add(sun);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(40,14),new THREE.MeshStandardMaterial({color:'#8e969f'}));ground.rotation.x=-Math.PI/2;S.add(ground);
    [['cruiser',null,-7.2],['sedan','#c8323c',-3.7],['sedan','#2f5fb8',-.6],['danfo',null,2.7],['keke','#e8b417',5.6],['keke','#2f8a4f',7.5]].forEach(([k,c,x])=>{
      const m=KIT.B[k]();if(c)KIT.paintAll(m,c);m.rotation.y=-.62;m.position.x=x;S.add(m);});
    const cam=new THREE.PerspectiveCamera(30,1200/520,.1,100);cam.position.set(1.2,7,17);cam.lookAt(.3,.9,0);R.render(S,cam);
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
