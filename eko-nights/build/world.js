// ================= 3D world: renderer, sky, day/night, city, models
let QUAL={name:'high',shadows:true,pr:1.5,peds:30,cars:26};
let renderer,scene,camera,sky,stars,sun,hemi,clock3;
const GEO={},MATS={};
const V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const col=c=>new THREE.Color(c).convertSRGBToLinear();
const lam=c=>MATS['l'+c]||(MATS['l'+c]=new THREE.MeshLambertMaterial({color:col(c)}));
const std=(c,r=.6,m=0)=>{const k='s'+c+'|'+r+'|'+m;return MATS[k]||(MATS[k]=new THREE.MeshStandardMaterial({color:col(c),roughness:r,metalness:m}));};
function ctex(cv,rep){const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;if(rep)t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
const mkC=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];};
function sh(m,cast=true,rec=true){m.castShadow=cast&&QUAL.shadows;m.receiveShadow=rec&&QUAL.shadows;return m;}
const WIN_MATS=[],NEON_MATS=[],LAMPS=[],SIGNODES=[];
let bulbMat,matLF,matLR,glowTex,sigLamps,lampPool=[],intLights=[],bankSign=null,nightF=0,timeOverride=null,camBaseFov=60;
const sunDirV=V3(0,1,0);
const SKYC={dt:new THREE.Color('#3b74c0'),db:new THREE.Color('#cfdbe7'),nt:new THREE.Color('#02050c'),nb:new THREE.Color('#121a2e'),dusk:new THREE.Color('#f09a58')};

function buildWorld(){
  const cv=$('#gl');
  renderer=new THREE.WebGLRenderer({canvas:cv,antialias:QUAL.name==='high',powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(QUAL.pr,window.devicePixelRatio||1));
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=QUAL.shadows;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();scene.fog=new THREE.Fog(0xbfcbd8,90,380);
  camera=new THREE.PerspectiveCamera(62,1,.2,1600);
  hemi=new THREE.HemisphereLight(0xdfe8ff,0x4d4538,.8);scene.add(hemi);
  sun=new THREE.DirectionalLight(0xfff0d6,1.5);
  if(QUAL.shadows){sun.castShadow=true;const m=QUAL.name==='high'?2048:1024;sun.shadow.mapSize.set(m,m);const sc=sun.shadow.camera;sc.left=-80;sc.right=80;sc.top=80;sc.bottom=-80;sc.near=20;sc.far=460;sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;}
  scene.add(sun,sun.target);
  sky=new THREE.Mesh(new THREE.SphereGeometry(1100,32,16),new THREE.ShaderMaterial({
    uniforms:{top:{value:new THREE.Color()},bot:{value:new THREE.Color()},sunDir:{value:V3(0,1,0)},sunCol:{value:new THREE.Color()}},
    vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 top;uniform vec3 bot;uniform vec3 sunDir;uniform vec3 sunCol;varying vec3 vP;void main(){float h=clamp(vP.y*1.7+.06,0.,1.);vec3 c=mix(bot,top,pow(h,.6));float s=max(dot(vP,normalize(sunDir)),0.);c+=sunCol*(pow(s,500.)*2.5+pow(s,10.)*.22);gl_FragColor=vec4(c,1.);}',
    side:THREE.BackSide,depthWrite:false,fog:false}));
  sky.renderOrder=-2;scene.add(sky);
  const sp=new Float32Array(900*3);for(let i=0;i<900;i++){const th=Math.random()*Math.PI*2,ph=Math.acos(Math.random()*.95);sp[i*3]=Math.sin(ph)*Math.cos(th)*1000;sp[i*3+1]=Math.cos(ph)*1000;sp[i*3+2]=Math.sin(ph)*Math.sin(th)*1000;}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
  stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));stars.renderOrder=-1;scene.add(stars);
  matLF=new THREE.MeshStandardMaterial({color:col('#fff6d8'),emissive:col('#fff2c0'),emissiveIntensity:.4,roughness:.2});
  matLR=new THREE.MeshStandardMaterial({color:col('#8a0d18'),emissive:col('#ff1830'),emissiveIntensity:.35,roughness:.3});
  bulbMat=new THREE.MeshStandardMaterial({color:col('#fff4dc'),emissive:col('#ffd9a0'),emissiveIntensity:.2});
  const [gc,gg]=mkC(64,64);const grd=gg.createRadialGradient(32,32,0,32,32,32);grd.addColorStop(0,'rgba(255,255,255,1)');grd.addColorStop(.3,'rgba(255,255,255,.5)');grd.addColorStop(1,'rgba(255,255,255,0)');gg.fillStyle=grd;gg.fillRect(0,0,64,64);glowTex=new THREE.CanvasTexture(gc);
  initGeo();buildCity();buildLamps();buildSignals();buildProps();
  for(let i=0;i<6;i++){const l=new THREE.PointLight(0xffc98a,0,30,2);l.position.set(0,-80,0);scene.add(l);lampPool.push(l);}
  for(let i=0;i<3;i++){const l=new THREE.PointLight(0xffe0b0,0,14,2);l.position.set(0,-80,0);scene.add(l);intLights.push(l);}
  window.addEventListener('resize',resize);resize();
  clock3=new THREE.Clock();
}
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camBaseFov=w<h?74:60;camera.updateProjectionMatrix();}

function applyTime(min){
  const h=(((min%1440)+1440)%1440)/60;
  const ang=(h-6)/12*Math.PI,el=Math.sin(ang);
  const day=clamp(el*2.6+.22,0,1);nightF=1-day;
  const dusk=clamp(1-Math.abs(el)*3,0,1)*(el>-.3?1:0);
  const u=sky.material.uniforms;
  u.top.value.copy(SKYC.nt).lerp(SKYC.dt,day);u.bot.value.copy(SKYC.nb).lerp(SKYC.db,day).lerp(SKYC.dusk,dusk*.6);
  const sd=V3(Math.cos(ang)*.8,el,.45).normalize();u.sunDir.value.copy(sd);
  u.sunCol.value.setRGB(1,.85-dusk*.3,.6-dusk*.35).multiplyScalar(day);
  if(el>-.08){sunDirV.copy(sd);if(sunDirV.y<.14)sunDirV.y=.14;sunDirV.normalize();sun.color.setRGB(1,.93-dusk*.25,.84-dusk*.42);sun.intensity=.15+1.55*day;}
  else{sunDirV.set(-.35,.85,-.4).normalize();sun.color.set('#9db3e6');sun.intensity=.3;}
  hemi.intensity=.26+.62*day;hemi.color.set(day>.5?'#dfe8ff':'#7487b5');hemi.groundColor.set(day>.5?'#4d4538':'#16181f');
  scene.fog.color.copy(u.bot.value).convertSRGBToLinear();
  stars.material.opacity=clamp(nightF*1.3-.3,0,1);
  for(const m of WIN_MATS)m.emissiveIntensity=nightF*1.2;
  for(const m of NEON_MATS)m.emissiveIntensity=.35+nightF*2.2;
  bulbMat.emissiveIntensity=.12+nightF*3.2;
  matLF.emissiveIntensity=.35+nightF*2.6;
  renderer.toneMappingExposure=1.05+nightF*.3;
}
function updateLampPool(cx,cz){
  if(nightF<.05){lampPool.forEach(l=>l.intensity=0);return;}
  const near=LAMPS.map(p=>[p,(p.x-cx)**2+(p.z-cz)**2]).sort((a,b)=>a[1]-b[1]);
  lampPool.forEach((l,i)=>{const p=near[i][0];l.position.set(p.x,p.y-.5,p.z);l.intensity=nightF*2.6;});
}

// ---------- geometry
const CAR_PROF={
  Sedan:{W:1.84,wz:1.38,roof:1.45,body:[[-2.25,.32],[-2.3,.72],[-2.12,.95],[-1.25,1.0],[-.85,1.42],[.42,1.45],[1.05,1.02],[2.12,.86],[2.3,.6],[2.25,.32]],glass:[[-1.25,1.0],[-.85,1.42],[.42,1.45],[1.05,1.02]]},
  Coupe:{W:1.82,wz:1.35,roof:1.31,body:[[-2.2,.3],[-2.25,.7],[-2.05,.9],[-1.1,.95],[-.6,1.3],[.3,1.32],[.95,.98],[2.1,.82],[2.28,.58],[2.2,.3]],glass:[[-1.1,.95],[-.6,1.3],[.3,1.32],[.95,.98]]},
  Hatchback:{W:1.78,wz:1.25,roof:1.45,body:[[-1.95,.34],[-2.02,.8],[-1.86,1.42],[.35,1.46],[.95,1.02],[1.9,.86],[2.05,.6],[2.0,.34]],glass:[[-1.98,.98],[-1.86,1.42],[.35,1.46],[.95,1.02]]},
  SUV:{W:1.94,wz:1.45,roof:1.76,body:[[-2.3,.42],[-2.36,.95],[-2.26,1.72],[.55,1.76],[1.2,1.15],[2.22,1.0],[2.36,.7],[2.3,.42]],glass:[[-2.3,1.12],[-2.26,1.72],[.55,1.76],[1.2,1.15]]},
  Van:{W:1.98,wz:1.55,roof:2.08,body:[[-2.4,.42],[-2.46,1.0],[-2.42,2.05],[1.3,2.08],[1.95,1.3],[2.36,1.05],[2.46,.7],[2.4,.42]],glass:[[-2.4,1.42],[-2.4,1.92],[1.3,1.96],[1.92,1.32]]},
  Pickup:{W:1.96,wz:1.6,roof:1.78,body:[[-2.55,.42],[-2.6,1.05],[-.45,1.05],[-.4,1.75],[.65,1.78],[1.2,1.15],[2.3,1.0],[2.46,.7],[2.4,.42]],glass:[[-.42,1.1],[-.4,1.75],[.65,1.78],[1.2,1.15]]},
};
function initGeo(){
  GEO.thigh=new THREE.CylinderGeometry(.075,.062,.46,8);GEO.shin=new THREE.CylinderGeometry(.06,.048,.46,8);GEO.shoe=new THREE.BoxGeometry(.11,.08,.25);
  GEO.pelvis=new THREE.CylinderGeometry(.17,.16,.2,10);GEO.chest=new THREE.CylinderGeometry(.2,.165,.6,10);GEO.vest=new THREE.CylinderGeometry(.218,.192,.42,10);
  GEO.neck=new THREE.CylinderGeometry(.05,.055,.12,8);GEO.head=new THREE.SphereGeometry(.125,14,12);GEO.hairCap=new THREE.SphereGeometry(.133,14,10,0,Math.PI*2,0,Math.PI*.55);
  GEO.eye=new THREE.SphereGeometry(.017,6,6);GEO.slit=new THREE.BoxGeometry(.13,.025,.02);GEO.pack=new THREE.BoxGeometry(.26,.32,.14);
  GEO.uarm=new THREE.CylinderGeometry(.052,.045,.3,8);GEO.farm=new THREE.CylinderGeometry(.044,.036,.28,8);GEO.hand=new THREE.SphereGeometry(.045,8,6);
  GEO.hat=new THREE.CylinderGeometry(.13,.135,.09,14);GEO.brim=new THREE.CylinderGeometry(.16,.16,.015,14);GEO.badge=new THREE.BoxGeometry(.05,.06,.01);
  GEO.tire=new THREE.CylinderGeometry(.36,.36,.24,18);GEO.tire.rotateZ(Math.PI/2);GEO.rim=new THREE.CylinderGeometry(.22,.22,.25,10);GEO.rim.rotateZ(Math.PI/2);
  GEO.hl=new THREE.BoxGeometry(.38,.15,.05);GEO.barBase=new THREE.BoxGeometry(1.3,.1,.32);GEO.lens=new THREE.BoxGeometry(.56,.13,.28);GEO.push=new THREE.BoxGeometry(1.3,.42,.1);
  GEO.silHead=new THREE.SphereGeometry(.12,10,8);GEO.silBody=new THREE.BoxGeometry(.42,.42,.28);GEO.plate=new THREE.PlaneGeometry(.52,.13);
  GEO.marker=new THREE.OctahedronGeometry(.3);GEO.arrow=new THREE.ConeGeometry(.5,1,4);GEO.arrow.rotateX(Math.PI);
  GEO.kiosk=new THREE.BoxGeometry(.7,1.4,.45);GEO.screen=new THREE.PlaneGeometry(.55,.38);
}
function carGeo(model){
  const k='car'+model;if(GEO[k])return GEO[k];const P=CAR_PROF[model]||CAR_PROF.Sedan;
  const ext=(pts,w,bev)=>{const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));
    const g=new THREE.ExtrudeGeometry(s,{depth:w,bevelEnabled:bev,bevelThickness:.03,bevelSize:.02,bevelSegments:2,curveSegments:2});
    g.rotateY(-Math.PI/2);g.translate(w/2,0,0);g.computeVertexNormals();return g;};
  const cx=P.glass.reduce((a,p)=>a+p[0],0)/P.glass.length,cy=P.glass.reduce((a,p)=>a+p[1],0)/P.glass.length;
  const gp=P.glass.map(([x,y])=>[cx+(x-cx)*1.05,cy+(y-cy)*1.05]);
  return GEO[k]={body:ext(P.body,P.W,true),glass:ext(gp,P.W+.08,false),len:Math.max(...P.body.map(p=>p[0]))};
}
let liveryTex=null;
function makeCarMesh(color,model,police,player){
  const P=CAR_PROF[model]||CAR_PROF.Sedan,G=carGeo(model);
  const g=new THREE.Group(),body=new THREE.Group();g.add(body);
  const paint=police?std('#101216',.35,.5):std(color,.35,.45);
  body.add(sh(new THREE.Mesh(G.body,paint),true,false));
  body.add(new THREE.Mesh(G.glass,std('#0b1118',.08,.85)));
  const zf=G.len,zr=Math.min(...P.body.map(p=>p[0]));
  const hl=matLF,tl=player?new THREE.MeshStandardMaterial({color:col('#8a0d18'),emissive:col('#ff1830'),emissiveIntensity:.35}):matLR;
  [-1,1].forEach(s=>{const a=new THREE.Mesh(GEO.hl,hl);a.position.set(s*(P.W/2-.32),.78,zf-.02);body.add(a);const b=new THREE.Mesh(GEO.hl,tl);b.position.set(s*(P.W/2-.32),.8,zr+.02);body.add(b);});
  const wheels=[],steer=[];
  [[1,1],[-1,1],[1,-1],[-1,-1]].forEach(([sx,sz])=>{const piv=new THREE.Group();piv.position.set(sx*(P.W/2-.08),.36,sz*P.wz);const spin=new THREE.Group();piv.add(spin);
    spin.add(sh(new THREE.Mesh(GEO.tire,lam('#121316')),true,false));spin.add(new THREE.Mesh(GEO.rim,std('#a3aab3',.3,.8)));g.add(piv);wheels.push(spin);if(sz>0)steer.push(piv);});
  const ud={wheels,steer,body,P,tail:tl,model,color,police:!!police};
  if(police){
    if(!liveryTex){const [c,x]=mkC(512,128);x.fillStyle='#f4f5f7';x.fillRect(0,0,512,128);x.fillStyle='#1d3a7a';x.fillRect(0,92,512,14);x.fillStyle='#14234a';x.font='800 70px Saira Condensed, Arial Narrow, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('POLICE',256,50);x.font='600 18px IBM Plex Mono, monospace';x.fillText('PRECINCT 9 · DIAL 911',256,116);liveryTex=ctex(c);}
    const lm=new THREE.MeshStandardMaterial({map:liveryTex,roughness:.4,metalness:.2});
    [-1,1].forEach(s=>{const pnl=new THREE.Mesh(new THREE.PlaneGeometry(2.1,.5),lm);pnl.position.set(s*(P.W/2+.035),.68,.05);pnl.rotation.y=s*Math.PI/2;body.add(pnl);});
    const base=new THREE.Mesh(GEO.barBase,lam('#15171c'));base.position.set(0,P.roof+.06,-.2);body.add(base);
    const mr=player?new THREE.MeshStandardMaterial({color:col('#5b1520'),emissive:col('#ff2236'),emissiveIntensity:0}):std('#5b1520',.3);
    const mb=player?new THREE.MeshStandardMaterial({color:col('#1b2c5b'),emissive:col('#2a63ff'),emissiveIntensity:0}):std('#1b2c5b',.3);
    const r=new THREE.Mesh(GEO.lens,mr);r.position.set(-.33,P.roof+.17,-.2);const b=new THREE.Mesh(GEO.lens,mb);b.position.set(.33,P.roof+.17,-.2);body.add(r,b);
    const pb=new THREE.Mesh(GEO.push,lam('#0d0e10'));pb.position.set(0,.55,zf+.1);body.add(pb);
    ud.mr=mr;ud.mb=mb;
    if(player){
      const gr=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff2a3c,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));gr.scale.set(3.2,3.2,1);gr.position.set(-.4,P.roof+.2,-.2);gr.visible=false;
      const gb=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0x3b7bff,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));gb.scale.set(3.2,3.2,1);gb.position.set(.4,P.roof+.2,-.2);gb.visible=false;
      body.add(gr,gb);ud.gr=gr;ud.gb=gb;
      const pl2=new THREE.PointLight(0xff3347,0,24,2);pl2.position.set(0,P.roof+1,0);g.add(pl2);ud.pl=pl2;
      ud.spots=[-1,1].map(s=>{const sp=new THREE.SpotLight(0xfff0d0,0,55,.5,.55,1.4);sp.position.set(s*.6,.8,zf);const tg=new THREE.Object3D();tg.position.set(s*.9,0,zf+20);g.add(sp,tg);sp.target=tg;return sp;});
    }
  }else{
    const sil=new THREE.Group();const hy=P.roof-.3;
    const hd=new THREE.Mesh(GEO.silHead,lam('#2a2422'));hd.position.set(.4,hy,-.1);const bd=new THREE.Mesh(GEO.silBody,lam('#2b2f38'));bd.position.set(.4,hy-.36,-.18);sil.add(hd,bd);body.add(sil);ud.sil=sil;
  }
  g.userData=ud;artDressCar(g);return g;
}
function plateMesh(text){
  const [c,x]=mkC(256,64);x.fillStyle='#f2efe2';x.fillRect(0,0,256,64);x.strokeStyle='#2b3a6b';x.lineWidth=4;x.strokeRect(3,3,250,58);
  x.font='700 40px IBM Plex Mono, monospace';x.textAlign='center';x.textBaseline='middle';
  const w=26;const start=128-(text.length-1)*w/2;
  [...text].forEach((ch,i)=>{if(ch==='?'){x.save();x.filter='blur(5px)';x.fillStyle='#23263a';x.fillRect(start+i*w-10,18,20,30);x.restore();}else{x.fillStyle='#1b2546';x.fillText(ch,start+i*w,35);}});
  return new THREE.Mesh(GEO.plate,new THREE.MeshLambertMaterial({map:ctex(c)}));
}
function makePersonMesh(o={}){
  const g=new THREE.Group(),root=new THREE.Group();g.add(root);
  const pants=lam(o.pants||'#2a2e38'),shirt=lam(o.shirt||'#3d4f6e'),skinC=o.skin||'#c68a5e',skin=lam(o.masked?'#16171b':skinC),shoe=lam(o.shoes||'#141414');
  const M=(geo,m,x,y,z,p)=>{const k=new THREE.Mesh(geo,m);k.position.set(x,y,z);p.add(k);sh(k,true,false);return k;};
  const legs=[-1,1].map(s=>{const hip=new THREE.Group();hip.position.set(s*.095,.93,0);root.add(hip);M(GEO.thigh,pants,0,-.23,0,hip);const knee=new THREE.Group();knee.position.y=-.46;hip.add(knee);M(GEO.shin,pants,0,-.23,0,knee);M(GEO.shoe,shoe,0,-.47,.05,knee);return {hip,knee};});
  M(GEO.pelvis,pants,0,.98,0,root);
  const torso=new THREE.Group();torso.position.y=1.0;root.add(torso);
  M(GEO.chest,shirt,0,.32,0,torso).scale.z=.68;
  if(o.vest){M(GEO.vest,lam(o.vestColor||'#1c2028'),0,.36,0,torso).scale.z=.74;M(GEO.badge,lam('#d9b44a'),-.09,.47,.15,torso);}
  if(o.backpack)M(GEO.pack,lam(o.backpack===true?'#e0b52b':o.backpack),0,.33,-.17,torso);
  const head=new THREE.Group();head.position.y=.62;torso.add(head);
  M(GEO.neck,skin,0,.02,0,head);
  M(GEO.head,skin,0,.17,0,head).scale.set(1,1.12,1.06);
  if(!o.masked){M(GEO.eye,lam('#111111'),-.045,.19,.115,head);M(GEO.eye,lam('#111111'),.045,.19,.115,head);}
  else M(GEO.slit,lam('#d8d4c8'),0,.19,.112,head);
  if(o.hood)M(GEO.hairCap,shirt,0,.18,-.012,head).scale.set(1.14,1.16,1.16);
  else if(o.hair&&!o.masked&&!o.hat)M(GEO.hairCap,lam(o.hair),0,.185,-.008,head);
  if(o.hat){M(GEO.hat,lam(o.hatColor||'#141c30'),0,.31,0,head);M(GEO.brim,lam('#0f1524'),0,.265,.03,head).scale.z=1.15;}
  const arms=[-1,1].map(s=>{const shd=new THREE.Group();shd.position.set(s*.25,.55,0);torso.add(shd);M(GEO.uarm,shirt,0,-.15,0,shd);const el=new THREE.Group();el.position.y=-.3;shd.add(el);M(GEO.farm,shirt,0,-.14,0,el);M(GEO.hand,lam(o.gloves||skinC),0,-.3,0,el);return {sh:shd,el,s};});
  if(o.kid)g.scale.setScalar(.62);else if(o.tall)g.scale.setScalar(o.tall);
  g.userData.j={root,legs,arms,torso,head};
  resetPose(g);
  return g;
}
const OFFICER_LOOK={shirt:'#1d2c4f',pants:'#161d31',skin:SKIN[2],hat:true,vest:true,shoes:'#0b0b0b'};
const SWAT_LOOK={shirt:'#23272e',pants:'#1c1f24',skin:SKIN[3],hat:true,hatColor:'#1a1d22',vest:true,vestColor:'#2f343c',gloves:'#111111'};
function resetPose(g){const j=g.userData.j;j.root.position.y=0;j.root.rotation.set(0,0,0);j.torso.rotation.set(0,0,0);j.head.rotation.set(0,0,0);
  j.legs.forEach(l=>{l.hip.rotation.set(0,0,0);l.knee.rotation.set(0,0,0);});j.arms.forEach(a=>{a.sh.rotation.set(0,0,-a.s*.06);a.el.rotation.set(-.15,0,0);});}
function animWalk(g,ph,amp,run){
  const j=g.userData.j;const s=Math.sin(ph),c=Math.cos(ph);
  j.legs[0].hip.rotation.x=s*amp;j.legs[1].hip.rotation.x=-s*amp;
  j.legs[0].knee.rotation.x=Math.max(0,-c)*amp*1.6+(run?.2:0);j.legs[1].knee.rotation.x=Math.max(0,c)*amp*1.6+(run?.2:0);
  j.arms[0].sh.rotation.set(-s*amp*.85,0,.06);j.arms[1].sh.rotation.set(s*amp*.85,0,-.06);
  const e=run?-1.35:-.25;j.arms[0].el.rotation.x=e;j.arms[1].el.rotation.x=e;
  j.root.position.y=Math.abs(c)*amp*(run?.09:.035);j.torso.rotation.x=run?.17:0;j.head.rotation.set(run?-.12:0,0,0);
}
function pose(g,names,t=0){
  const j=g.userData.j;resetPose(g);
  for(const n of [].concat(names)){
    if(n==='idle'){j.torso.rotation.x=Math.sin(t*1.6)*.012;j.arms.forEach(a=>a.sh.rotation.x=Math.sin(t*1.6+a.s)*.03);}
    else if(n==='talk'){j.arms[1].sh.rotation.x=-.45+Math.sin(t*3)*.22;j.arms[1].el.rotation.x=-1.1+Math.sin(t*4.2)*.25;j.head.rotation.x=Math.sin(t*2.3)*.06;j.head.rotation.y=Math.sin(t*1.1)*.12;}
    else if(n==='handsUp'){j.arms.forEach(a=>{a.sh.rotation.set(-2.75,0,-a.s*.38);a.el.rotation.x=-.45;});}
    else if(n==='cuffed'){j.arms.forEach(a=>{a.sh.rotation.set(.42,0,a.s*.3);a.el.rotation.x=-1.05;});j.head.rotation.x=.16;}
    else if(n==='sit'){j.root.position.y=-.44;j.legs.forEach(l=>{l.hip.rotation.x=-1.52;l.knee.rotation.x=1.48;});}
    else if(n==='floor'){j.root.position.y=-.72;j.legs.forEach((l,i)=>{l.hip.rotation.set(-1.45,0,(i?-1:1)*.25);l.knee.rotation.x=.3;});j.arms.forEach(a=>{a.sh.rotation.x=-.5;a.el.rotation.x=-1.2;});j.head.rotation.x=.3;}
    else if(n==='crossed'){j.arms.forEach(a=>{a.sh.rotation.set(-.55,0,a.s*.12);a.el.rotation.set(-1.85,a.s*.3,0);});j.torso.rotation.x=-.08;j.head.rotation.z=.08;}
    else if(n==='table'){j.arms.forEach(a=>{a.sh.rotation.set(-.95,0,a.s*.05);a.el.rotation.x=-.75;});}
    else if(n==='lean'){j.torso.rotation.x=.28;j.arms.forEach(a=>{a.sh.rotation.set(-1.05,0,0);a.el.rotation.x=-.6;});j.head.rotation.x=-.2;}
    else if(n==='slump'){j.torso.rotation.x=.3;j.head.rotation.x=.3;j.arms.forEach(a=>{a.sh.rotation.set(-1.15,0,a.s*.1);a.el.rotation.x=-1.9;});}
    else if(n==='kneel'){j.root.position.y=-.43;j.legs.forEach(l=>{l.hip.rotation.x=0;l.knee.rotation.x=1.55;});j.torso.rotation.x=.08;}
    else if(n==='behind'){j.arms.forEach(a=>{a.sh.rotation.set(.62,0,a.s*.22);a.el.rotation.set(-.35,-a.s*.9,0);});j.head.rotation.x=.18;}
    else if(n==='cuffing'){j.torso.rotation.x=.3;j.arms.forEach(a=>{a.sh.rotation.set(-.95,0,a.s*.28);a.el.rotation.x=-.75;});j.head.rotation.x=.28;}
    else if(n==='patdown'){j.torso.rotation.x=.42;j.arms.forEach(a=>{a.sh.rotation.set(-.55,0,-a.s*.05);a.el.rotation.x=-.35;});j.head.rotation.x=.3;}
    else if(n==='crouch'){j.root.position.y=-.32;j.legs.forEach((l,i)=>{l.hip.rotation.x=i?-1.3:-.35;l.knee.rotation.x=i?1.45:1.5;});j.torso.rotation.x=.35;}
    else if(n==='down'){j.root.rotation.x=-1.52;j.root.position.y=.14;j.arms.forEach(a=>{a.sh.rotation.set(-.2,0,-a.s*.7);a.el.rotation.x=-.3;});j.legs.forEach((l,i)=>l.hip.rotation.z=(i?-1:1)*.12);j.head.rotation.x=-.2;}
    else if(n==='cough'){j.torso.rotation.x=.38;j.head.rotation.x=.35;j.arms.forEach(a=>{a.sh.rotation.set(-2.05,0,-a.s*.45);a.el.rotation.set(-1.95,a.s*.4,0);});}
    else if(n==='aim'){j.arms[1].sh.rotation.set(-1.52,0,.08);j.arms[1].el.rotation.x=0;j.arms[0].sh.rotation.set(-1.4,0,-.42);j.arms[0].el.rotation.x=-.25;j.torso.rotation.y=.12;}
    else if(n==='windup'){j.arms[1].sh.rotation.set(-2.7,0,.2);j.arms[1].el.rotation.x=-.9;j.torso.rotation.y=.25;}
    else if(n==='strike'){j.arms[1].sh.rotation.set(-1.25,0,-.1);j.arms[1].el.rotation.x=-.1;j.torso.rotation.set(.18,-.3,0);}
    else if(n==='brawl'){j.arms.forEach(a=>{a.sh.rotation.set(-1.05,0,-a.s*.12);a.el.rotation.x=-1.75;});j.torso.rotation.x=.1;j.legs[0].hip.rotation.x=-.25;j.legs[1].hip.rotation.x=.2;}
    else if(n==='punch'){j.arms[0].sh.rotation.set(-1.05,0,.12);j.arms[0].el.rotation.x=-1.75;j.arms[1].sh.rotation.set(-1.58,0,-.05);j.arms[1].el.rotation.x=-.05;j.torso.rotation.set(.15,-.35,0);}
    else if(n==='stagger'){j.torso.rotation.x=-.32;j.head.rotation.x=-.35;j.arms.forEach(a=>{a.sh.rotation.set(.35,0,-a.s*.6);});}
    else if(n==='drive'){j.arms.forEach(a=>{a.sh.rotation.set(-1.2,0,-a.s*.1);a.el.rotation.x=-.5;});}
    else if(n==='point'){j.arms[1].sh.rotation.set(-1.5,0,-.1);j.arms[1].el.rotation.x=-.05;}
  }
}

// ---------- city
function winCanvas(lit,glass){
  const [c,g]=mkC(256,256);
  g.fillStyle=lit?'#000':'#fff';g.fillRect(0,0,256,256);
  for(let i=0;i<8;i++)for(let j=0;j<8;j++){const x=i*32,y=j*32;
    if(!lit){
      if(glass){g.fillStyle='#8396ab';g.fillRect(x+1,y+3,30,26);g.fillStyle='rgba(255,255,255,.22)';g.fillRect(x+2,y+4,10,12);}
      else{g.fillStyle='#e9e4dc';g.fillRect(x+4,y+5,24,22);g.fillStyle='#46505f';g.fillRect(x+6,y+7,20,18);g.fillStyle='rgba(255,255,255,.28)';g.fillRect(x+7,y+8,6,7);g.fillStyle='#d8d1c4';g.fillRect(x+5,y+25,22,3);}
    }else if(Math.random()<.36){g.fillStyle=pick(['#ffd28a','#ffe7b8','#fff0d0','#ffc770','#cfe3ff']);g.fillRect(x+(glass?1:6),y+(glass?3:7),glass?30:20,glass?26:18);}
  }
  return c;
}
function boxUV(geo,w,h,d,cw,ch,ou){
  const uv=geo.attributes.uv;
  for(let f=0;f<6;f++){
    if(f===2||f===3){for(let k=0;k<4;k++)uv.setXY(f*4+k,0,0);continue;}
    const su=(f<2?d:w)/cw,sv=h/ch;
    for(let k=0;k<4;k++){const i=f*4+k;uv.setXY(i,uv.getX(i)*su+ou,uv.getY(i)*sv);}
  }
  uv.needsUpdate=true;
}
function signMat(text,bg,fg,neon,w=512,h=128,font=64){
  const [c,g]=mkC(w,h);g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=fg;g.font=`700 ${font}px Saira Condensed, Arial Narrow, sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2+4);
  const t=ctex(c);const m=new THREE.MeshLambertMaterial({map:t,emissive:col('#ffffff'),emissiveMap:t,emissiveIntensity:neon?.4:.12});if(neon)NEON_MATS.push(m);m.userData={c,g};return m;
}
function setBankSign(name){if(!bankSign)return;const {c,g}=bankSign.userData;g.fillStyle='#1f2226';g.fillRect(0,0,c.width,c.height);g.fillStyle='#e9dfc4';g.font='700 56px Saira Condensed, Arial Narrow, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(name.toUpperCase(),c.width/2,c.height/2+4);bankSign.map.needsUpdate=true;}
function buildCity(){
  const len=CITY+16;
  const gr=new THREE.Mesh(new THREE.PlaneGeometry(2600,2600),lam('#4c6240'));gr.rotation.x=-Math.PI/2;gr.position.set(CITY/2,-.35,CITY/2);gr.receiveShadow=QUAL.shadows;scene.add(gr);
  // roads
  const [rc,g]=mkC(256,128);g.fillStyle='#3a3d43';g.fillRect(0,0,256,128);
  for(let i=0;i<2600;i++){g.fillStyle=`rgba(${Math.random()<.5?255:0},${Math.random()<.5?255:0},${Math.random()<.5?255:0},${Math.random()*.05})`;g.fillRect(Math.random()*256,Math.random()*128,2,2);}
  g.fillStyle='rgba(0,0,0,.09)';g.fillRect(0,30,256,18);g.fillRect(0,80,256,18);
  g.fillStyle='#e8e8e8';g.fillRect(0,6,256,3);g.fillRect(0,119,256,3);
  g.fillStyle='#e2b43a';for(let x=0;x<256;x+=64)g.fillRect(x,62,38,4);
  const rt=ctex(rc,true);rt.repeat.set(len/32,1);const rm=new THREE.MeshLambertMaterial({map:rt});
  for(let i=0;i<=NB;i++){
    const h=new THREE.Mesh(new THREE.PlaneGeometry(len,16),rm);h.rotation.x=-Math.PI/2;h.position.set(CITY/2,.03,i*S);h.receiveShadow=QUAL.shadows;scene.add(h);
    const v=new THREE.Mesh(new THREE.PlaneGeometry(len,16),rm);v.rotation.set(-Math.PI/2,0,Math.PI/2);v.position.set(i*S,.05,CITY/2);v.receiveShadow=QUAL.shadows;scene.add(v);
  }
  const [ic,ig]=mkC(256,256);ig.fillStyle='#3a3d43';ig.fillRect(0,0,256,256);
  for(let i=0;i<1500;i++){ig.fillStyle=`rgba(255,255,255,${Math.random()*.04})`;ig.fillRect(Math.random()*256,Math.random()*256,2,2);}
  ig.fillStyle='#e9e9e9';
  for(let k=22;k<232;k+=18){ig.fillRect(k,4,10,40);ig.fillRect(k,212,10,40);ig.fillRect(4,k,40,10);ig.fillRect(212,k,40,10);}
  const isecMat=new THREE.MeshLambertMaterial({map:ctex(ic)}),plainMat=lam('#3a3d43');const isec=new THREE.PlaneGeometry(16,16);
  for(let i=0;i<=NB;i++)for(let j=0;j<=NB;j++){const m=new THREE.Mesh(isec,isSig([i,j])?isecMat:plainMat);m.rotation.x=-Math.PI/2;m.position.set(i*S,.08,j*S);m.receiveShadow=QUAL.shadows;scene.add(m);}
  // blocks
  const sw=new THREE.BoxGeometry(S-16,.55,S-16),lawnG=new THREE.PlaneGeometry(S-25,S-25);
  for(let bi=0;bi<NB;bi++)for(let bj=0;bj<NB;bj++){
    const sp=SPECIAL[bi+','+bj];const cx=(bi+.5)*S,cz=(bj+.5)*S;
    const m=new THREE.Mesh(sw,lam('#a3a198'));m.position.set(cx,-.075,cz);m.receiveShadow=QUAL.shadows;scene.add(m);
    const lawn=new THREE.Mesh(lawnG,lam(sp&&sp.kind==='park'?'#5f8a48':sp&&sp.kind==='station'?'#55585e':'#6f8a5c'));lawn.rotation.x=-Math.PI/2;lawn.position.set(cx,.24,cz);lawn.receiveShadow=QUAL.shadows;scene.add(lawn);
    if(sp&&sp.kind==='park'){const pth=new THREE.Mesh(new THREE.PlaneGeometry(4,S-25),lam('#cbbd9a'));pth.rotation.set(-Math.PI/2,0,.6);pth.position.set(cx,.27,cz);scene.add(pth);const p2=pth.clone();p2.rotation.z=-.6;p2.position.y=.28;scene.add(p2);}
  }
  // buildings
  const winA=ctex(winCanvas(false,false),true),winG=ctex(winCanvas(false,true),true),lit=ctex(winCanvas(true,false),true),litG=ctex(winCanvas(true,true),true);
  const wallMat=(c,glass)=>{const m=glass?new THREE.MeshStandardMaterial({color:col(c),map:winG,roughness:.28,metalness:.55,emissive:col('#ffd9a0'),emissiveMap:litG,emissiveIntensity:0}):new THREE.MeshLambertMaterial({color:col(c),map:winA,emissive:col('#ffd9a0'),emissiveMap:lit,emissiveIntensity:0});WIN_MATS.push(m);return m;};
  const DOWN=['#9aa6b6','#7f8fa3','#aab2bc','#738499'].map(c=>wallMat(c,true));
  const MID=['#b07a5e','#a5694f','#c4b49a','#9c8a74','#b9a58a','#8e6e5a','#c9c0ae'].map(c=>wallMat(c,false));
  const roofM=lam('#4a4c52'),roofT=['#6b3b2e','#4b4f57','#5a4636','#7a4a3a'].map(lam);
  const rooftop=new THREE.BoxGeometry(1,1,1);
  for(const b of BUILD_LIST){
    if(b.special){buildSpecial(b);continue;}
    const tall=b.h>=18,house=!tall&&b.h<9.5;
    const hh=house?Math.max(4.2,b.h*.6):b.h;
    const geo=new THREE.BoxGeometry(b.w,hh,b.d);boxUV(geo,b.w,hh,b.d,24,25.6,ri(0,7)/8);
    const w=tall?pick(DOWN):pick(MID);
    const m=sh(new THREE.Mesh(geo,[w,w,roofM,roofM,w,w]));m.position.set(b.x,hh/2+.2,b.z);scene.add(m);
    if(house){const rf=new THREE.ConeGeometry(.7071,2.6,4,1);rf.rotateY(Math.PI/4);const r=sh(new THREE.Mesh(rf,pick(roofT)));r.scale.set((b.w/2+.35)/.5,1,(b.d/2+.35)/.5);r.position.set(b.x,hh+.2+1.3,b.z);scene.add(r);}
    else if(tall){for(let k=0;k<2;k++){const u=sh(new THREE.Mesh(rooftop,lam('#5c6068')));u.scale.set(rnd(2,4),rnd(1.2,2.4),rnd(2,4));u.position.set(b.x+rnd(-b.w/4,b.w/4),hh+.2+u.scale.y/2,b.z+rnd(-b.d/4,b.d/4));scene.add(u);}
      if(Math.random()<.5){const ant=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,6,6),lam('#888'));ant.position.set(b.x,hh+3.2,b.z);scene.add(ant);}}
    else{const roofEdge=sh(new THREE.Mesh(rooftop,lam('#5a5650')));roofEdge.scale.set(b.w+.3,.45,b.d+.3);roofEdge.position.set(b.x,hh+.4,b.z);scene.add(roofEdge);}
  }
  for(const d of RES_DOORS){
    const fm=new THREE.Mesh(new THREE.PlaneGeometry(1.3,2.25),lam(pick(['#5a3b28','#2f4a3a','#6b2d2d','#2d3e5c'])));fm.position.set(d.x-d.nx*1.27,1.33,d.z-d.nz*1.27);fm.rotation.y=faceOf(d);scene.add(fm);
    const st=new THREE.Mesh(new THREE.BoxGeometry(1.8,.18,.9),lam('#9a978f'));st.position.set(d.x-d.nx*.85,.29,d.z-d.nz*.85);st.rotation.y=faceOf(d);scene.add(st);
  }
}
function buildSpecial(b){
  const sp=b.special,d=sp.door,rot=faceOf(d);
  const at=(m,u,v,y,ry=0)=>{m.position.set(d.x+d.tx*u+d.nx*v,y,d.z+d.tz*u+d.nz*v);m.rotation.y=rot+ry;scene.add(m);return m;};
  const wl=c=>{const m=new THREE.MeshLambertMaterial({color:col(c),map:ctex(winCanvas(false,false),true),emissive:col('#ffd9a0'),emissiveMap:ctex(winCanvas(true,false),true),emissiveIntensity:0});WIN_MATS.push(m);return m;};
  const geo=new THREE.BoxGeometry(b.w,b.h,b.d);boxUV(geo,b.w,b.h,b.d,24,25.6,0);
  const wm=wl(sp.color);const main=sh(new THREE.Mesh(geo,[wm,wm,lam('#4a4c52'),lam('#4a4c52'),wm,wm]));main.position.set(b.x,b.h/2+.2,b.z);scene.add(main);
  const glassDoor=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.9),std('#18222e',.1,.8));at(glassDoor,0,-1.57,1.65);
  if(sp.kind==='station'){
    const band=sh(new THREE.Mesh(new THREE.BoxGeometry(b.w+.2,1.1,b.d+.2),lam('#1d3a7a')));band.position.set(b.x,4.2,b.z);scene.add(band);
    at(new THREE.Mesh(new THREE.PlaneGeometry(13,2),signMat('POLICE · PRECINCT 9','#13285a','#f4f1e6',true)),0,-1.5,6.2);
    const fp=sh(new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,11,8),lam('#c9ccd2')));at(fp,10,6,5.5);
    const [fc,fg]=mkC(128,80);fg.fillStyle='#1d3a7a';fg.fillRect(0,0,128,80);fg.fillStyle='#f4b740';fg.beginPath();for(let k=0;k<10;k++){const a=k*Math.PI/5-Math.PI/2,r=k%2?10:24;fg.lineTo(64+Math.cos(a)*r,40+Math.sin(a)*r);}fg.fill();
    const flag=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.4),new THREE.MeshLambertMaterial({map:ctex(fc),side:THREE.DoubleSide}));at(flag,11.15,6,10.2,Math.PI/2);
    for(const k of [-12,-18]){const car=makeCarMesh('#15171c','Sedan',true);car.position.set(d.cx+d.nx*34+d.tx*k,0,d.cz+d.nz*34+d.tz*k);car.rotation.y=Math.atan2(d.tx,d.tz);car.traverse(o=>{if(o.isMesh)o.castShadow=QUAL.shadows;});scene.add(car);BOXES.push({x0:car.position.x-2.2,x1:car.position.x+2.2,z0:car.position.z-2.2,z1:car.position.z+2.2});}
    const stp=sh(new THREE.Mesh(new THREE.BoxGeometry(8,.25,2.4),lam('#b9b6ae')));at(stp,0,-.4,.32);
  }else if(sp.kind==='bank'){
    const cg=new THREE.CylinderGeometry(.42,.5,7.4,16);const cm=lam('#ddd5c2');
    for(const u of [-10.5,-7.5,-4.5,4.5,7.5,10.5]){const c=sh(new THREE.Mesh(cg,cm));at(c,u,-.3,3.9);}
    const ped=sh(new THREE.Mesh(new THREE.BoxGeometry(24,1.3,2.8),lam('#d4ccb8')));at(ped,0,-.5,8.2);
    const st1=sh(new THREE.Mesh(new THREE.BoxGeometry(24,.22,3.4),lam('#c9c3b5')));at(st1,0,.2,.31);
    bankSign=signMat('BANK','#1f2226','#e9dfc4',false,640,96,56);const sgn=new THREE.Mesh(new THREE.PlaneGeometry(13,1.95),bankSign);at(sgn,0,.92,8.2);
  }else if(sp.kind==='school'){
    at(new THREE.Mesh(new THREE.PlaneGeometry(10,1.7),signMat('SCHOOL','#f3efe2','#7a3324',false)),0,-1.5,6.2);
    const fp=sh(new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,10,8),lam('#c9ccd2')));at(fp,-9,5,5);
    const bus=makeCarMesh('#e5b21f','Van');bus.scale.set(1.22,1.3,2.3);const bx=d.cx+d.nx*23.6+d.tx*14,bz=d.cz+d.nz*23.6+d.tz*14;bus.position.set(bx,0,bz);bus.rotation.y=Math.atan2(d.tx,d.tz);bus.traverse(o=>{if(o.isMesh)o.castShadow=QUAL.shadows;});scene.add(bus);
    BOXES.push({x0:bx-5.6,x1:bx+5.6,z0:bz-5.6,z1:bz+5.6});
    const postG=new THREE.CylinderGeometry(.04,.04,1.3,5);const posts=new THREE.InstancedMesh(postG,lam('#3c4048'),40);const dm=new THREE.Object3D();let k=0;
    for(let u=-24;u<=24;u+=1.25){if(Math.abs(u)<3.5)continue;if(k>=40)break;dm.position.set(d.x+d.tx*u+d.nx*6,.85,d.z+d.tz*u+d.nz*6);dm.updateMatrix();posts.setMatrixAt(k++,dm.matrix);}
    posts.count=k;scene.add(posts);
  }else if(sp.kind==='motel'){
    const roof=sh(new THREE.Mesh(new THREE.BoxGeometry(b.w+.4,.18,b.d+.4),lam('#7a4a3a')));roof.position.set(b.x,b.h+.3,b.z);scene.add(roof);
    const walk=sh(new THREE.Mesh(new THREE.BoxGeometry(40,.16,2.6),lam('#ece6d8')));at(walk,0,-.3,3.1);
    for(let u=-18;u<=18;u+=4.5){const p=sh(new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,3,6),lam('#ece6d8')));at(p,u,.9,1.6);
      if(Math.abs(u)>1){const dr=new THREE.Mesh(new THREE.PlaneGeometry(1.1,2.1),lam('#5a2f2a'));at(dr,u+1.6,-1.57,1.25);}}
    const pole=sh(new THREE.Mesh(new THREE.CylinderGeometry(.16,.18,8,8),lam('#3a3e46')));at(pole,17,9,4);
    const sm=signMat(sp.name.toUpperCase(),'#141a2a',pick(['#ff5fa2','#58e1ff','#ffcf4a']),true,512,128,58);
    const sign=sh(new THREE.Mesh(new THREE.BoxGeometry(6.4,1.7,.3),[lam('#141a2a'),lam('#141a2a'),lam('#141a2a'),lam('#141a2a'),sm,sm]));at(sign,17,9,8.6);
    BOXES.push({x0:d.x+d.tx*17+d.nx*9-.3,x1:d.x+d.tx*17+d.nx*9+.3,z0:d.z+d.tz*17+d.nz*9-.3,z1:d.z+d.tz*17+d.nz*9+.3});
  }
}
function buildLamps(){
  const pts=[];
  for(let bi=0;bi<NB;bi++)for(let bj=0;bj<NB;bj++)for(const sx of [-1,1])for(const sz of [-1,1]){
    const x=(bi+.5)*S+sx*31.2,z=(bj+.5)*S+sz*31.2,dx=sx*.7071,dz=sz*.7071;pts.push({x,z,dx,dz});LAMPS.push({x:x+dx*1.9,y:6.2,z:z+dz*1.9});}
  const n=pts.length,dm=new THREE.Object3D();
  const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.08,.12,6.4,8),lam('#3b4049'),n);
  const arm=new THREE.InstancedMesh(new THREE.BoxGeometry(.08,.08,2.1),lam('#3b4049'),n);
  const head=new THREE.InstancedMesh(new THREE.BoxGeometry(.32,.14,.62),lam('#2c3038'),n);
  const bulb=new THREE.InstancedMesh(new THREE.BoxGeometry(.24,.04,.46),bulbMat,n);
  pts.forEach((p,i)=>{const ry=Math.atan2(p.dx,p.dz);
    dm.rotation.set(0,0,0);dm.position.set(p.x,3.4,p.z);dm.updateMatrix();pole.setMatrixAt(i,dm.matrix);
    dm.rotation.set(0,ry,0);dm.position.set(p.x+p.dx*1,6.45,p.z+p.dz*1);dm.updateMatrix();arm.setMatrixAt(i,dm.matrix);
    dm.position.set(p.x+p.dx*1.95,6.35,p.z+p.dz*1.95);dm.updateMatrix();head.setMatrixAt(i,dm.matrix);
    dm.position.set(p.x+p.dx*1.95,6.26,p.z+p.dz*1.95);dm.updateMatrix();bulb.setMatrixAt(i,dm.matrix);});
  pole.castShadow=QUAL.shadows;scene.add(pole,arm,head,bulb);
}
function buildSignals(){
  const dm=new THREE.Object3D();const list=[];
  for(let i=1;i<NB;i++)for(let j=1;j<NB;j++)DIRS.forEach(d=>{const r=[-d[1],d[0]];list.push({n:[i,j],ax:axisOf(d),x:i*S+d[0]*9.3+r[0]*9.3,z:j*S+d[1]*9.3+r[1]*9.3,ry:Math.atan2(-d[0],-d[1]),fx:-d[0],fz:-d[1]});});
  const n=list.length;
  const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.09,.11,4.4,8),lam('#2f343c'),n);
  const box=new THREE.InstancedMesh(new THREE.BoxGeometry(.42,1.25,.3),lam('#1d2026'),n);
  sigLamps=new THREE.InstancedMesh(new THREE.SphereGeometry(.12,10,8),new THREE.MeshBasicMaterial({color:0xffffff}),n*3);
  list.forEach((s,k)=>{dm.rotation.set(0,s.ry,0);dm.position.set(s.x,2.2,s.z);dm.updateMatrix();pole.setMatrixAt(k,dm.matrix);
    dm.position.set(s.x,4.75,s.z);dm.updateMatrix();box.setMatrixAt(k,dm.matrix);
    for(let q=0;q<3;q++){dm.position.set(s.x+s.fx*.16,5.15-q*.4,s.z+s.fz*.16);dm.updateMatrix();sigLamps.setMatrixAt(k*3+q,dm.matrix);sigLamps.setColorAt(k*3+q,new THREE.Color(.05,.05,.05));}
    SIGNODES.push(s);});
  pole.castShadow=QUAL.shadows;scene.add(pole,box,sigLamps);
}
const SIGC={r:new THREE.Color(4,.25,.15),y:new THREE.Color(4,2.4,.2),g:new THREE.Color(.25,3.6,1.3),off:new THREE.Color(.05,.05,.05)};
function updateSignals(){
  if(!sigLamps)return;
  SIGNODES.forEach((s,k)=>{const st=sigState(s.n,s.ax);sigLamps.setColorAt(k*3,st==='r'?SIGC.r:SIGC.off);sigLamps.setColorAt(k*3+1,st==='y'?SIGC.y:SIGC.off);sigLamps.setColorAt(k*3+2,st==='g'?SIGC.g:SIGC.off);});
  sigLamps.instanceColor.needsUpdate=true;
}
function buildProps(){
  const dm=new THREE.Object3D();
  const spots=[];
  for(let bi=0;bi<NB;bi++)for(let bj=0;bj<NB;bj++){const sp=SPECIAL[bi+','+bj];if(sp&&sp.kind==='park')continue;
    const cx=(bi+.5)*S,cz=(bj+.5)*S;for(let k=0;k<3;k++){const side=ri(0,3),u=rnd(-22,22);const p=side===0?[cx+u,cz-29.4]:side===1?[cx+u,cz+29.4]:side===2?[cx-29.4,cz+u]:[cx+29.4,cz+u];spots.push(p);}}
  const hyd=new THREE.InstancedMesh(new THREE.CylinderGeometry(.13,.16,.75,8),lam('#c0392b'),spots.length);
  const bin=new THREE.InstancedMesh(new THREE.CylinderGeometry(.27,.24,.95,10),lam('#2f5b45'),spots.length);
  let h=0,b=0;spots.forEach((p,i)=>{dm.position.set(p[0],i%2?.57:.67,p[1]);dm.updateMatrix();if(i%2)hyd.setMatrixAt(h++,dm.matrix);else bin.setMatrixAt(b++,dm.matrix);});
  hyd.count=h;bin.count=b;hyd.castShadow=bin.castShadow=QUAL.shadows;scene.add(hyd,bin);
  // street trees along a few sidewalks
  for(let bi=0;bi<NB;bi++)for(let bj=0;bj<NB;bj++){const sp=SPECIAL[bi+','+bj];if(sp)continue;const cx=(bi+.5)*S,cz=(bj+.5)*S;
    for(const u of [-16,0,16])if(Math.random()<.45)TREES.push([cx+u,cz+(Math.random()<.5?-29.6:29.6)]);}
  const n=TREES.length;
  const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.18,.26,2.6,6),lam('#5b4232'),n);
  const crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.9,1),new THREE.MeshLambertMaterial({color:0xffffff}),n);
  TREES.forEach(([x,z],i)=>{const s=rnd(.8,1.25);dm.rotation.set(0,rnd(0,6),0);dm.scale.set(s,s,s);dm.position.set(x,1.5*s,z);dm.updateMatrix();trunk.setMatrixAt(i,dm.matrix);
    dm.position.set(x,3.7*s,z);dm.scale.set(s,s*rnd(.85,1.15),s);dm.updateMatrix();crown.setMatrixAt(i,dm.matrix);crown.setColorAt(i,col(pick(['#3f6b3a','#4b7a3f','#365f34','#567f3b'])));});
  trunk.castShadow=crown.castShadow=QUAL.shadows;crown.receiveShadow=QUAL.shadows;scene.add(trunk,crown);
  // park benches
  const parks=Object.values(SPECIAL).filter(s=>s.kind==='park').length;const bench=new THREE.InstancedMesh(new THREE.BoxGeometry(1.8,.45,.55),lam('#6b4a32'),parks*6);let k=0;
  for(const key in SPECIAL){if(SPECIAL[key].kind!=='park')continue;const [bi,bj]=key.split(',').map(Number);for(let q=0;q<6;q++){dm.scale.set(1,1,1);dm.rotation.set(0,rnd(0,3),0);dm.position.set((bi+.5)*S+rnd(-20,20),.45,(bj+.5)*S+rnd(-20,20));dm.updateMatrix();bench.setMatrixAt(k++,dm.matrix);}}
  bench.count=k;scene.add(bench);
}
