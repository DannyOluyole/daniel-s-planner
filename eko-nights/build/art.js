// ================= art: real 3D models (GLB) that replace the built-in shapes when they are present
// models/manifest.json lists what exists, e.g.
//   {"sedan":{"file":"sedan.glb","len":4.5},"cruiser":{"file":"cruiser.glb","len":4.8,"rotY":180}}
// len: target length in metres (longest side), rotY: degrees to turn it so the front faces +Z, y: lift in metres.
// Anything missing keeps the built-in look, so the game works with no models at all.
const ART={ready:{},spec:{},cars:new Set(),loaded:false};
// which model each vehicle uses
const ART_CAR={Corolla:'sedan',Camry:'sedan',Golf:'hatchback',Sedan:'sedan',Sienna:'minivan',Hilux:'pickup',Highlander:'suv',Van:'danfo',Danfo:'danfo',Keke:'keke',Okada:'okada'};
// vehicles with no entry keep their built-in look
function artKeyForCar(model,police){return police?'cruiser':ART_CAR[model];}
// a model's body is painted with the vehicle's own colour: any material named "paint" takes it
const ART_PAINT={};
function artPaint(m,color){m.traverse(o=>{if(!o.isMesh||!o.material||o.material.name!=='paint')return;const k=o.material.uuid+color;o.material=ART_PAINT[k]||(ART_PAINT[k]=o.material.clone());o.material.color.set(color);});}
function artNormalize(root,spec){
  const g=new THREE.Group();g.add(root);
  root.rotation.y=(spec.rotY||0)*Math.PI/180;root.updateMatrixWorld(true);
  let box=new THREE.Box3().setFromObject(root);const size=box.getSize(new THREE.Vector3());
  // vehicles are longer than they are wide: lay the long side along +Z unless told otherwise
  if(spec.rotY==null&&size.x>size.z*1.15){root.rotation.y=Math.PI/2;root.updateMatrixWorld(true);box=new THREE.Box3().setFromObject(root);box.getSize(size);}
  const s=(spec.len||Math.max(size.x,size.z))/Math.max(size.x,size.z,1e-6);root.scale.multiplyScalar(s);root.updateMatrixWorld(true);
  box=new THREE.Box3().setFromObject(root);const c=box.getCenter(new THREE.Vector3());
  root.position.x-=c.x;root.position.z-=c.z;root.position.y-=box.min.y-(spec.y||0);
  g.traverse(o=>{if(o.isMesh){o.castShadow=QUAL.shadows;o.receiveShadow=false;const m=o.material;(Array.isArray(m)?m:[m]).forEach(x=>{if(x&&x.map)x.map.anisotropy=2;});}});
  return g;
}
async function artLoad(){
  if(!THREE.GLTFLoader){ART.loaded=true;return;}
  let man;try{const r=await fetch('models/manifest.json',{cache:'no-cache'});if(r.ok)man=await r.json();}catch(e){}
  if(!man||typeof man!=='object'){ART.loaded=true;ART.cars.clear();return;}
  const loader=new THREE.GLTFLoader();
  await Promise.all(Object.entries(man).map(([k,spec])=>new Promise(res=>{
    loader.load('models/'+spec.file,gl=>{try{ART.ready[k]=artNormalize(gl.scene,spec);ART.spec[k]=spec;}catch(e){console.warn('art',k,e);}res();},undefined,e=>{console.warn('art: could not load',spec.file);res();});
  })));
  ART.loaded=true;
  // cars already on the road get their new bodies too
  ART.cars.forEach(g=>{if(g.parent)artDressCar(g);else ART.cars.delete(g);});
}
// swap a built-in car for its model; the lights, siren and suspension stay as they were
function artDressCar(g){
  const u=g.userData;if(!u||u.art)return;const key=artKeyForCar(u.model,u.police);const tpl=ART.ready[key];
  if(!tpl){if(!ART.loaded)ART.cars.add(g);return;}
  u.art=true;ART.cars.delete(g);
  const keep=new Set([u.mr,u.mb].filter(Boolean));
  u.body.children.forEach(c=>{if(c.isMesh&&!keep.has(c.material))c.visible=false;});
  if(u.sil)u.sil.visible=false;
  u.wheels.forEach(w=>w.visible=false);
  const m=tpl.clone(true);if(u.color&&!u.police)artPaint(m,u.color);u.body.add(m);u.artMesh=m;
  // the light bar sits on the model's roof
  if(u.police){const top=new THREE.Box3().setFromObject(m).max.y-g.position.y;u.body.children.forEach(c=>{if(c.isMesh&&keep.has(c.material))c.position.y=top+.08;});
    [u.gr,u.gb].forEach(s=>{if(s)s.position.y=top+.12;});}
}
function artStatus(){return Object.keys(ART.ready);}
