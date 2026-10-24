// Builds the Division 9 police cruiser as a low-poly GLB: node tools/make-cruiser.js (after ./build.sh, which fetches three.js)
// Writes models/cruiser.glb, adds it to models/manifest.json and saves a preview render to tools/cruiser-preview.png.
// No light bar: the game puts its own flashing one on the roof. Front faces +Z, wheels included (the game hides its own).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),path=require('path');
const DIR=path.join(__dirname,'..');

// runs in the browser with THREE loaded
function build(){
  const NAVY='#13244a',WHITE='#eef1f5',BLACK='#16181c',GLASS='#1c2a3a',CHROME='#9aa3ad';
  const mat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.55,metalness:.1},o));
  const car=new THREE.Group();car.name='cruiser';
  // a side outline (x = along the car, front at +x; y = up) extruded across the car's width
  const side=(pts,width,m,bevel=.04,arches=null)=>{
    const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);pts.slice(1).forEach(p=>s.lineTo(p[0],p[1]));
    if(arches)arches(s);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:width-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:10});
    g.rotateY(-Math.PI/2);g.translate((width-2*bevel)/2,0,0);return new THREE.Mesh(g,m);};
  const W=1.84,AX=1.42,WR=.35;
  // body: bottom edge runs round the wheel arches, from the front bumper back to the rear
  const body=side([[2.36,.62],[2.30,.86],[1.15,.98],[-1.55,.98],[-2.32,.93],[-2.40,.62]],W,mat(NAVY,{metalness:.35,roughness:.4}),.05,s=>{
    s.lineTo(-2.36,.30);s.lineTo(-AX-.47,.30);s.absarc(-AX,.30,.47,Math.PI,0,true);s.lineTo(AX-.47,.30);s.absarc(AX,.30,.47,Math.PI,0,true);s.lineTo(2.34,.30);});
  car.add(body);
  // cabin of tinted glass, narrower than the body, with a white roof and pillars
  car.add(side([[-1.52,.96],[-.92,1.40],[.38,1.42],[1.14,.97]],1.56,mat(GLASS,{metalness:.6,roughness:.15}),.05));
  const box=(w,h,l,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,l),m);b.position.set(x,y,z);car.add(b);return b;};
  box(1.58,.06,1.36,mat(WHITE),0,1.45,-.26);                                   // roof
  [-.08].forEach(z=>{box(1.60,.44,.10,mat(NAVY),0,1.19,z);});                  // B pillars
  box(W+.02,.07,4.62,mat(WHITE),0,.90,0);                                      // white belt stripe along both sides
  box(W+.02,.05,4.62,mat('#c8202a'),0,.84,0);                                  // thin red pinstripe under it
  // bumpers, grille, bull bar
  box(1.90,.20,.16,mat(BLACK),0,.42,2.36);box(1.90,.20,.16,mat(BLACK),0,.42,-2.40);
  box(1.10,.16,.04,mat('#2a2d33'),0,.70,2.37);
  [-.5,.5].forEach(x=>box(.08,.42,.08,mat(BLACK),x,.56,2.55));box(1.16,.07,.08,mat(BLACK),0,.76,2.55);box(1.16,.07,.08,mat(BLACK),0,.46,2.55);
  // lights: headlights, indicators, tail lights, reversing lights
  const lamp=(c,e)=>mat(c,{emissive:e,emissiveIntensity:.8,roughness:.3});
  [-.66,.66].forEach(x=>{box(.36,.13,.05,lamp('#fff6d8','#ffe9a8'),x,.74,2.425);box(.12,.08,.05,lamp('#ffb020','#ff9900'),x*1.22,.60,2.425);
    box(.40,.14,.05,lamp('#c4141c','#a00008'),x,.78,-2.465);box(.12,.08,.05,lamp('#f2f2f2','#888'),x*.62,.64,-2.465);});
  // wheels: black tyres, silver hubs
  const tyre=new THREE.CylinderGeometry(WR,WR,.26,18),hub=new THREE.CylinderGeometry(.19,.19,.27,10);tyre.rotateZ(Math.PI/2);hub.rotateZ(Math.PI/2);
  [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx,sz])=>{const w=new THREE.Group();w.add(new THREE.Mesh(tyre,mat('#101114',{roughness:.9})));w.add(new THREE.Mesh(hub,mat(CHROME,{metalness:.7,roughness:.3})));w.position.set(sx*.80,WR,sz*AX);car.add(w);});
  // "POLICE" decals on the doors, bonnet and boot
  const decal=(txt,w,h,fs,col,bg)=>{const c=document.createElement('canvas');c.width=512;c.height=Math.round(512*h/w);const x=c.getContext('2d');
    if(bg){x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);}x.fillStyle=col;x.font=`900 ${fs}px Arial Black, Arial, sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(txt,c.width/2,c.height/2+4);
    const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:.5}));};
  [1,-1].forEach(sx=>{const d=decal('POLICE',1.7,.34,118,WHITE);d.position.set(sx*(W/2+.012),.64,.05);d.rotation.y=sx*Math.PI/2;car.add(d);
    const n=decal('DIV 9 · PORT EKO',1.2,.12,44,'#d9dee6');n.position.set(sx*(W/2+.012),.47,.05);n.rotation.y=sx*Math.PI/2;car.add(n);});
  const hood=decal('POLICE',1.2,.3,120,WHITE);hood.rotation.x=-Math.PI/2+.11;hood.position.set(0,.985,1.72);hood.rotation.z=Math.PI;hood.rotation.y=0;car.add(hood);
  const boot=decal('POLICE',1.0,.22,120,WHITE);boot.rotation.x=-Math.PI/2+.05;boot.position.set(0,.985,-1.95);car.add(boot);
  box(1.20,.04,.30,mat(BLACK),0,1.50,-.26);  // light bar mount; the game's flashing bar sits on top
  return car;
}

(async()=>{
  for(const f of ['three/package/build/three.min.js','three/package/examples/js/exporters/GLTFExporter.js'])
    if(!fs.existsSync(path.join(DIR,f))){console.error('missing '+f+': run ./build.sh first');process.exit(2);}
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:900,height:560}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.setContent('<body style="margin:0;background:#cfd6df"></body>');
  await pg.addScriptTag({path:path.join(DIR,'three/package/build/three.min.js')});
  await pg.addScriptTag({path:path.join(DIR,'three/package/examples/js/exporters/GLTFExporter.js')});
  await pg.addScriptTag({content:'window.buildCruiser='+build.toString()});
  const out=await pg.evaluate(async()=>{
    const car=buildCruiser();
    let tris=0;car.traverse(o=>{if(o.isMesh){const g=o.geometry;tris+=(g.index?g.index.count:g.attributes.position.count)/3;}});
    const size=new THREE.Box3().setFromObject(car).getSize(new THREE.Vector3());
    const glb=await new Promise(r=>new THREE.GLTFExporter().parse(car,x=>r(Array.from(new Uint8Array(x))),{binary:true}));
    // preview render
    const R=new THREE.WebGLRenderer({antialias:true});R.setSize(900,560);R.outputEncoding=THREE.sRGBEncoding;R.setClearColor('#cfd6df');document.body.appendChild(R.domElement);
    const S=new THREE.Scene();S.add(new THREE.HemisphereLight('#ffffff','#556070',.9));const sun=new THREE.DirectionalLight('#fff4e0',1.1);sun.position.set(5,8,6);S.add(sun);
    const ground=new THREE.Mesh(new THREE.CircleGeometry(6,48),new THREE.MeshStandardMaterial({color:'#9aa3ad'}));ground.rotation.x=-Math.PI/2;S.add(ground);S.add(car);
    const cam=new THREE.PerspectiveCamera(35,900/560,.1,100);cam.position.set(5.6,2.6,6.2);cam.lookAt(0,.7,0);R.render(S,cam);
    return {glb,tris:Math.round(tris),size:[size.x,size.y,size.z].map(v=>+v.toFixed(2))};});
  await pg.screenshot({path:path.join(__dirname,'cruiser-preview.png')});
  fs.mkdirSync(path.join(DIR,'models'),{recursive:true});
  fs.writeFileSync(path.join(DIR,'models/cruiser.glb'),Buffer.from(out.glb));
  const mp=path.join(DIR,'models/manifest.json');let man={};try{man=JSON.parse(fs.readFileSync(mp,'utf8'));}catch(e){}
  man.cruiser={file:'cruiser.glb',len:4.8};fs.writeFileSync(mp,JSON.stringify(man,null,2)+'\n');
  console.log(JSON.stringify({file:'models/cruiser.glb',bytes:out.glb.length,triangles:out.tris,size_m:out.size,errors:errs}));
  await b.close();if(errs.length)process.exitCode=1;
})();
