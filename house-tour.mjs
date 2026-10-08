import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

// A reference-inspired procedural model. All geometry, textures and interior
// furnishings are local; no remote model or texture service is needed.
const viewer = document.querySelector('#house-viewer');
const mount = document.querySelector('#house-mount');
const canvasHost = document.querySelector('#house-canvas');
const loading = document.querySelector('#house-loading');
const enterButton = document.querySelector('#house-enter');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (error) {
  loading.innerHTML = '<div class="house-load-error"><img src="assets/house-reference.png" alt="House reference"><h3>Your browser could not start the 3D view.</h3><p>Enable hardware acceleration or open this page in a WebGL-enabled browser to explore the house.</p></div>';
  enterButton.hidden = true;
  console.error('WebGL unavailable:', error);
}
if (renderer) initialize();

function initialize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  canvasHost.append(renderer.domElement);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label','3D house. Drag to orbit, scroll to zoom, or press Enter to start the interior tour.');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#c6d4d5');
  scene.fog = new THREE.Fog('#c6d4d5',45,110);
  const camera = new THREE.PerspectiveCamera(42,1,.06,150);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduced;
  controls.dampingFactor = .08;
  controls.enablePan = false;
  controls.minDistance = 12;
  controls.maxDistance = 37;
  controls.minPolarAngle = .32;
  controls.maxPolarAngle = Math.PI / 2 - .035;
  controls.target.set(0,3.05,0);
  const exterior = new THREE.Group();
  scene.add(exterior);
  const house = new THREE.Group();
  exterior.add(house);
  const hemi = new THREE.HemisphereLight('#e3f0ff','#7f8266',2.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffe5c1',3.1);
  sun.position.set(-10,18,13);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:70});
  sun.shadow.bias = -.0005;
  sun.shadow.normalBias = .035;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#cbdfff',1.1);
  fill.position.set(9,8,-10);scene.add(fill);
  const interiorFill = new THREE.PointLight('#fff1d6',50,16,2);
  interiorFill.position.set(0,2.9,0);interiorFill.visible=false;scene.add(interiorFill);
  const warmLights = [];
  let seed = 417;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  function texture(kind) {
    const c = document.createElement('canvas');c.width=c.height=512;
    const ctx = c.getContext('2d');
    if(kind==='stone') {
      ctx.fillStyle='#73736a';ctx.fillRect(0,0,512,512);
      for(let y=0;y<512;y+=32) for(let x=-96;x<512;) {
        const w=55+Math.floor(rand()*90);const tone=104+Math.floor(rand()*58);
        ctx.fillStyle=`rgb(${tone+10},${tone+7},${tone})`;ctx.fillRect(x+2,y+2,w-3,29);
        ctx.fillStyle='#ffffff17';ctx.fillRect(x+2,y+2,w-3,3);x+=w;
      }
    } else if(kind==='wood') {
      ctx.fillStyle='#8c5b35';ctx.fillRect(0,0,512,512);
      for(let i=0;i<1400;i++) {ctx.fillStyle=rand()>.5?'#2b140d15':'#e8b67620';ctx.fillRect(rand()*512,rand()*512,30+rand()*330,.5+rand()*2);}
      for(let y=0;y<512;y+=64){ctx.fillStyle='#36281950';ctx.fillRect(0,y,512,2);}
    } else {
      ctx.fillStyle=kind==='rug'?'#bcb59f':'#d5d0c3';ctx.fillRect(0,0,512,512);
      for(let i=0;i<15000;i++){ctx.fillStyle=rand()>.5?'#ffffff16':'#18291b0b';ctx.fillRect(rand()*512,rand()*512,1+rand()*3,1+rand()*3);}
      if(kind==='rug'){ctx.strokeStyle='#e2dbc355';ctx.lineWidth=2;for(let i=0;i<512;i+=14){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke();}}
    }
    const t = new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
  }
  const mat = (color,opts={}) => new THREE.MeshStandardMaterial({color,roughness:.78,...opts});
  const plaster=mat('#e8e4d8'), trim=mat('#dedccc'), charcoal=mat('#303b3d'), black=mat('#222e2f',{metalness:.5,roughness:.38});
  const stone=mat('#ffffff',{map:texture('stone')}), wood=mat('#ffffff',{map:texture('wood')});
  const paving=mat('#ffffff',{map:texture('concrete')});
  const glass=mat('#a7d0ca',{transparent:true,opacity:.2,metalness:.2,roughness:.15,depthWrite:false,side:THREE.DoubleSide});
  const windowGlass=mat('#96aeab',{transparent:true,opacity:.27,roughness:.13,metalness:.3,depthWrite:false});
  const glow = mat('#ffe4a0',{emissive:'#ffcf7f',emissiveIntensity:3});
  const olive=mat('#73805a'), leaf=mat('#415b36'), bark=mat('#736348');
  const linen=mat('#d4c8b0'), cream=mat('#ede4d1'), darkFabric=mat('#687767'), rug=mat('#ffffff',{map:texture('rug')});
  const boxGeo = new THREE.BoxGeometry(1,1,1);
  const sphereGeo = new THREE.SphereGeometry(1,12,8);
  function box(parent,w,h,d,x,y,z,material) {
    const m=new THREE.Mesh(boxGeo,material);m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  const softGeometries = new Map();
  function softBox(parent,w,h,d,x,y,z,material,radius=.07) {
    const key=[w,h,d,radius].join('/');
    if(!softGeometries.has(key)) {
      const geo=new THREE.BoxGeometry(w,h,d,6,6,6),p=geo.attributes.position;
      const v=new THREE.Vector3(),inner=new THREE.Vector3();
      for(let i=0;i<p.count;i++){
        v.fromBufferAttribute(p,i);inner.set(THREE.MathUtils.clamp(v.x,-w/2+radius,w/2-radius),THREE.MathUtils.clamp(v.y,-h/2+radius,h/2-radius),THREE.MathUtils.clamp(v.z,-d/2+radius,d/2-radius));
        v.sub(inner).normalize().multiplyScalar(radius).add(inner);p.setXYZ(i,v.x,v.y,v.z);
      }
      geo.computeVertexNormals();softGeometries.set(key,geo);
    }
    const m=new THREE.Mesh(softGeometries.get(key),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function sphere(parent,x,y,z,sx,sy,sz,material) {
    const m=new THREE.Mesh(sphereGeo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;
  }
  function cylinder(parent,rTop,rBottom,h,x,y,z,material,segments=16) {
    const m=new THREE.Mesh(new THREE.CylinderGeometry(rTop,rBottom,h,segments),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function bar(parent,a,b,r=.026,material=black) {
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),diff=bv.clone().sub(av);
    const m=cylinder(parent,r,r,diff.length(),0,0,0,material,8);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.normalize());return m;
  }
  function plant(parent,x,y,z,size=1,pot=true) {
    if(pot) cylinder(parent,.23*size,.17*size,.4*size,x,y+.2*size,z,mat('#969d83'));
    const base=y+(pot?.35:0)*size;
    for(let i=0;i<8;i++) {
      const a=i*Math.PI/4, h=(.55+rand()*.4)*size;
      const lx=x+Math.cos(a)*size*.21,lz=z+Math.sin(a)*size*.21;
      bar(parent,[x,base,z],[lx,base+h,lz],.014*size,olive);
      const l=sphere(parent,lx,base+h*.75,lz,.11*size,.32*size,.08*size,leaf);l.rotation.z=Math.cos(a)*.45;l.rotation.x=Math.sin(a)*.4;
    }
  }
  function tree(x,z,size=1) {
    cylinder(exterior,.09*size,.15*size,2.8*size,x,1.4*size,z,bark,8);
    for(let i=0;i<9;i++){const a=i*2.4; sphere(exterior,x+Math.cos(a)*size*.75,2.5*size+(i%3)*.48*size,z+Math.sin(a)*size*.65,.72*size,.8*size,.7*size,i%2?leaf:olive);}
  }
  function downlight(x,y,z) {
    cylinder(house,.085,.085,.025,x,y,z,glow,12);
    const light=new THREE.PointLight('#ffc579',6,4.5,2);light.position.set(x,y-.11,z);house.add(light);warmLights.push(light);
  }
  function sconce(x,y,z) {
    box(house,.13,.3,.12,x,y,z,black);box(house,.08,.045,.13,x,y-.17,z,glow);
    const light=new THREE.PointLight('#ffd095',5,2.7,2);light.position.set(x,y,z+.15);house.add(light);warmLights.push(light);
  }
  function windowFront(x,y,z,w,h) {
    box(house,w+.12,h+.12,.12,x,y,z,charcoal);
    box(house,w-.07,h-.07,.13,x,y,z+.02,windowGlass);
    box(house,.05,h,.16,x,y,z+.1,black);
    box(house,w-.14,h-.2,.025,x,y,z-.19,mat('#c3ad80',{emissive:'#997149',emissiveIntensity:.2}));
    for(const side of [-1,1]){box(house,.26,h-.15,.12,x+side*(w/2-.21),y,z-.12,cream);}
  }
  // Landscape, street and perimeter.
  box(exterior,180,.12,180,0,-.35,0,mat('#86927d'));
  box(exterior,30,.18,7,0,-.19,11.8,mat('#68736d'));
  box(exterior,18,.18,2.1,0,-.06,7.6,paving);
  box(house,13,.25,13,0,0,0,paving);
  box(house,11.4,.13,10.3,0,.17,-.3,paving);
  for(let x=-5.4;x<5.6;x+=1.1) for(let z=4.3;z<6.8;z+=.65) box(house,1.07,.022,.62,x,.2,z,mat((Math.floor((x+5.5)*10)%3)?'#c6c2b5':'#adae9f'));
  box(house,.2,1.05,11.4,-6.2,.6,-.4,plaster);box(house,.2,1.05,11.4,6.2,.6,-.4,plaster);box(house,12.5,1.05,.2,0,.6,-6.1,plaster);
  box(house,4.7,1.2,.2,3.7,.7,6.15,plaster);box(house,1.05,1.2,.2,-5.72,.7,6.15,plaster);
  for(const x of [-5.1,-.9,1.5,6.1]){box(house,.3,1.6,.35,x,.85,6.15,trim);sconce(x,1.05,6.35);}
  // Timber-and-steel driveway gate and pedestrian gate.
  for(const [left,width] of [[-5,4],[ -.72,2.03]]) {
    box(house,width,.07,.09,left+width/2,.35,6.2,black);box(house,width,.07,.09,left+width/2,1.65,6.2,black);
    for(let x=left;x<=left+width;x+=.17)box(house,.035,1.35,.05,x,1,6.2,black);
    for(let y=.57;y<1.12;y+=.11)box(house,width-.15,.085,.04,left+width/2,y,6.23,wood);
  }
  for(const x of [-5.7,2,3.2,4.4,5.65])plant(house,x,.25,5.8,.85,false);
  for(const x of [-8.8,8.8,-10,10.7])tree(x,-1-rand()*5,1.3+rand()*.4);
  for(const z of [-13,-11,-9])tree(-5+rand()*11,z,1.7);
  // Main house: carport left, entry at centre, exterior stair to the right.
  box(house,10,.24,8,0,.33,-.3,trim);
  box(house,10,.27,8.5,0,3.65,-.05,plaster);
  box(house,10,.28,8.45,0,6.94,-.05,plaster);
  box(house,10,6.65,.2,0,3.65,-4.15,plaster);
  box(house,.22,6.65,8,-4.91,3.65,-.2,plaster);
  box(house,.38,7.4,.56,4.94,3.95,3.78,charcoal);
  box(house,.32,3.25,.5,-4.72,1.95,3.63,plaster);
  box(house,.3,3.2,.4,-1.27,1.95,3.62,plaster);
  box(house,5.1,3.15,.22,.98,1.95,1.47,plaster);
  box(house,.2,3.2,5.55,-1.25,1.95,-1.3,plaster);
  box(house,2.1,3.17,.25,.23,5.38,2.18,stone);
  box(house,2.96,3.13,.2,-3.05,5.38,2.05,wood);
  box(house,3.3,3.13,.2,3.02,5.38,1.5,plaster);
  box(house,.22,3.1,5.7,4.85,5.38,-1.2,plaster);
  // Ground entrance, upper windows, projecting fascias and timber soffits.
  box(house,1.05,2.5,.18,-.57,1.72,1.64,wood);box(house,.035,.65,.06,-.18,1.6,1.75,black);
  windowFront(1.16,1.73,1.65,1.65,2.4);
  windowFront(-3.03,5.17,2.22,1.9,2.25);windowFront(2.12,5.18,1.67,1.6,2.35);
  box(house,4.6,.17,1.5,-2.61,6.61,2.58,wood);box(house,4.8,.23,1.55,-2.57,6.75,2.59,charcoal);
  box(house,5.9,.2,2.6,1.9,6.95,2.5,wood);box(house,6,.35,.2,1.9,7.08,3.88,plaster);
  box(house,5.96,.12,.12,1.9,7.31,3.95,trim);
  box(house,5.5,.25,2.8,2.0,7.18,2.35,plaster);
  box(house,5.7,.44,.27,1.92,3.57,4.2,charcoal);box(house,4.55,.3,.25,-2.75,3.67,4.1,plaster);
  box(house,4.6,.1,2.2,2.0,3.42,2.7,wood);box(house,3.4,.1,6.9,-3,3.47,-.3,cream);
  // Vertical charcoal frame and fine decorative screen on upper left.
  box(house,.52,4.05,.5,-4.63,5.45,3.17,charcoal);box(house,1.2,.22,.5,-4.25,7.36,3.17,charcoal);
  box(house,.06,2.7,.08,-4.31,5.25,3.24,glow);
  for(let y=4.02;y<6.55;y+=.13)for(let x=-4.2;x<-3.88;x+=.11){const m=box(house,.06,.08,.045,x,y,3.19,trim);m.rotation.z=.5;}
  for(let x=-4.75;x<-3.3;x+=.21)box(house,.07,.9,.14,x,7.24,2.72,charcoal);
  // Transparent balcony rail: continuous black top rail and slender posts.
  for(let x=-4.53;x<4.7;x+=1.14){box(house,.035,1.07,.04,x,4.3,4.03,black);box(house,1.08,.91,.035,x+.55,4.25,4.03,glass);}
  box(house,9.3,.045,.06,.1,4.83,4.03,black);
  for(const z of [2.9,3.5])box(house,.04,1.1,.04,4.76,4.3,z,black);
  box(house,.035,.9,1.6,4.76,4.25,3.2,glass);box(house,.045,.045,1.65,4.76,4.83,3.22,black);
  // Roof terrace railing.
  for(let x=-.95;x<4.95;x+=.8)box(house,.035,.64,.035,x,7.73,3.35,black);
  for(let y=7.45;y<8.08;y+=.16)box(house,5.95,.027,.027,1.95,y,3.35,black);
  for(let z=-3.95;z<3.4;z+=1)box(house,.035,.65,.035,4.82,7.72,z,black);
  for(let y=7.45;y<8.08;y+=.16)box(house,.027,.027,7.3,4.82,y,-.3,black);
  box(house,9.8,.45,.16,0,7.27,-4.1,plaster);
  // Two open stair flights. Each tread, stringer and railing is actual geometry.
  function stairs(baseY,frontZ,count,rise,run) {
    for(let i=0;i<count;i++){const y=baseY+(i+1)*rise,z=frontZ-i*run;box(house,1.37,.15,run+.04,3.65,y,z,trim);box(house,.045,.87,.045,3.0,y+.48,z,black);}
    bar(house,[3,baseY+.95,frontZ+.15],[3,baseY+count*rise+.95,frontZ-(count-1)*run],.035);
    bar(house,[4.25,baseY+.95,frontZ+.15],[4.25,baseY+count*rise+.95,frontZ-(count-1)*run],.035);
    bar(house,[3,baseY,frontZ+.1],[3,baseY+count*rise-.12,frontZ-(count-1)*run],.065,charcoal);
  }
  stairs(.4,3.18,16,.196,.34);stairs(3.83,.8,15,.21,.31);
  for(const x of [-3.6,-1.55,1.1,2.65,4.0])plant(house,x,3.8,3.42,.8);
  plant(house,2.2,.46,2.6,1.2);plant(house,4.8,.3,4.8,1.1);
  // Car in the open carport.
  const car=new THREE.Group();house.add(car);car.position.set(-3,.68,.35);
  const carPaint=mat('#c5c6b9',{metalness:.48,roughness:.24});
  box(car,1.72,.54,3.5,0,.42,0,carPaint);box(car,1.5,.55,1.7,0,.94,-.2,carPaint);
  box(car,1.32,.44,.05,0,.98,.68,mat('#344b4d',{metalness:.5,roughness:.12}));
  box(car,1.33,.4,.05,0,.98,-1.08,charcoal);
  for(const x of [-.88,.88])for(const z of [-1.1,1.08]){const t=cylinder(car,.31,.31,.19,x,.25,z,black);t.rotation.z=Math.PI/2;const rim=cylinder(car,.18,.18,.2,x,.25,z,mat('#a9aca6',{metalness:.8}));rim.rotation.z=Math.PI/2;}
  for(const x of [-.62,.62])box(car,.35,.13,.07,x,.5,1.78,cream);
  box(car,.8,.15,.055,0,.24,1.79,charcoal);
  for(const p of [[-3,3.38,2.2],[-3,3.38,-1],[-2.9,6.5,2.6],[-1,6.5,2.6],[.1,6.81,3.1],[1.7,6.81,3.1],[3.4,6.81,3.1],[1.1,3.31,3.0],[3.5,3.31,3.0]])downlight(...p);
  for(const p of [[.55,5.55,2.37],[4.65,5.3,3.9],[-1.1,2.2,1.7]])sconce(...p);

  // Furniture helpers shared by the interior rooms.
  const rooms = {};
  function art(parent,x,y,z,w,h) {
    box(parent,w,h,.07,x,y,z,wood);box(parent,w-.1,h-.1,.08,x,y,z+.04,cream);
    const a=sphere(parent,x-.1,y+.05,z+.095,w*.28,h*.27,.012,olive);
    a.rotation.z=.45;box(parent,w*.23,h*.55,.015,x+w*.2,y-h*.12,z+.1,mat('#b6744e'));
  }
  function sofa(parent,x,z,rotation=0) {
    const g=new THREE.Group();parent.add(g);g.position.set(x,0,z);g.rotation.y=rotation;
    softBox(g,3.25,.38,1.03,0,.42,0,linen);softBox(g,3.3,.74,.24,0,.87,-.5,linen);
    for(const side of [-1,1]){softBox(g,.23,.7,1.15,side*1.58,.69,0,linen);box(g,.09,.19,.08,side*1.4,.15,.38,wood);}
    for(let i=-1;i<=1;i++)softBox(g,.97,.19,.84,i*1.02,.68,.08,cream);
    for(const [x,c] of [[-1.06,darkFabric],[1.05,mat('#b17c53')]]){const p=softBox(g,.49,.5,.18,x,.99,-.2,c);p.rotation.z=x*.12;p.rotation.x=-.15;}
  }
  function table(parent,x,z,w=1.6,d=.85) {
    const top=box(parent,w,.12,d,x,.52,z,wood);
    for(const dx of [-w*.37,w*.37])for(const dz of [-d*.32,d*.32])box(parent,.055,.44,.055,x+dx,.27,z+dz,black);
    return top;
  }
  function vase(parent,x,y,z){cylinder(parent,.12,.18,.28,x,y+.14,z,mat('#b99068'));bar(parent,[x,y+.25,z],[x+.06,y+.8,z],.009,olive);sphere(parent,x+.09,y+.65,z,.16,.12,.04,olive);}
  function pendant(parent,x,z,y=2.95){bar(parent,[x,3.43,z],[x,y,z],.015,black);cylinder(parent,.12,.34,.21,x,y-.12,z,mat('#b59058',{metalness:.6,roughness:.3}));cylinder(parent,.28,.28,.015,x,y-.23,z,glow);}
  function roomShell(name,w=8,d=8){
    const g=new THREE.Group();g.visible=false;scene.add(g);rooms[name]=g;
    box(g,w,.16,d,0,-.08,0,paving);box(g,w,3.6,.15,0,1.75,-d/2,plaster);box(g,w,3.6,.15,0,1.75,d/2,plaster);
    box(g,.15,3.6,d,-w/2,1.75,0,plaster);box(g,.15,.7,d,w/2,.3,0,plaster);box(g,.15,.5,d,w/2,3.3,0,plaster);
    box(g,w,.12,d,0,3.55,0,cream);
    // Tall glazed side wall, curtains, skirting, and ceiling lighting.
    box(g,.045,2.5,d-.2,w/2,1.87,0,glass);
    for(let z=-d/2;z<=d/2;z+=1.5)box(g,.12,2.65,.045,w/2-.04,1.86,z,black);
    for(const z of [-d/2+.27,d/2-.27]){box(g,.26,2.85,.55,w/2-.22,1.83,z,linen);}
    box(g,w,.12,.05,0,.06,-d/2+.1,wood);box(g,.05,.12,d,-w/2+.1,.06,0,wood);
    for(const x of [-2,2])for(const z of [-2.5,2.5])cylinder(g,.07,.07,.02,x,3.47,z,glow);
    for(let z=-d/2;z<d/2;z+=1)box(g,w,.003,.012,0,.008,z,mat('#aca997'));
    // Soft landscape visible through the glass.
    box(g,14,.1,18,w/2+7,-.22,0,mat('#84976c'));
    for(let z=-5;z<6;z+=2){sphere(g,w/2+3,1,z,1,1.5,1,leaf);}
    return g;
  }
  const living=roomShell('living');
  box(living,4.3,.025,3.8,0,.025,.1,rug);
  sofa(living,-2.85,.35,Math.PI/2);
  sofa(living,.3,2.8,Math.PI);
  table(living,-.2,.15,1.65,1.05);vase(living,-.45,.59,.2);
  box(living,.44,.055,.3,.2,.63,-.04,cream);box(living,.4,.04,.28,.22,.68,-.07,olive);
  box(living,4.8,2.8,.13,-.4,1.6,-3.86,wood);
  box(living,2.7,1.42,.1,-.4,1.85,-3.74,black);box(living,2.53,1.28,.025,-.4,1.85,-3.68,mat('#203737',{metalness:.2,roughness:.18}));
  box(living,4.45,.42,.5,-.4,.45,-3.48,wood);box(living,4.5,.07,.57,-.4,.71,-3.47,cream);
  for(let x=-2.35;x<1.65;x+=.65)box(living,.018,.35,.03,x,.45,-3.21,black);
  plant(living,2.9,0,-3.1,1.6);art(living,-2.9,1.98,3.89,1.4,1.7);
  cylinder(living,.33,.33,.5,2.5,.25,.7,wood);vase(living,2.5,.5,.7);
  pendant(living,0,0,3.1);
  const kitchen=roomShell('kitchen',8,7);
  const cabinet=mat('#657566');
  for(let x=-3.3;x<3.5;x+=.88){box(kitchen,.85,.85,.68,x,.5,-3.08,cabinet);box(kitchen,.018,.12,.045,x+.28,.67,-2.71,black);box(kitchen,.85,.94,.38,x,2.52,-3.22,wood);}
  box(kitchen,7.6,.09,.85,0,.99,-3,cream);box(kitchen,7.6,.65,.035,0,1.36,-3.39,stone);
  box(kitchen,.82,.015,.48,-.4,1.044,-3,black);bar(kitchen,[-.5,1.03,-3.3],[-.5,1.48,-3.3],.025,black);bar(kitchen,[-.5,1.48,-3.3],[-.5,1.48,-3.04],.025,black);
  box(kitchen,.85,.024,.47,1.58,1.05,-3,charcoal);
  for(const x of [1.34,1.8])for(const z of [-3.15,-2.91])cylinder(kitchen,.1,.1,.025,x,1.073,z,black);
  box(kitchen,1.03,2.68,.75,-3.25,1.39,-2.91,mat('#9daba4',{metalness:.65,roughness:.3}));
  box(kitchen,.025,2.1,.04,-3.21,1.57,-2.5,black);
  box(kitchen,2.9,.91,1.13,.9,.47,-.05,wood);box(kitchen,3.13,.12,1.32,.9,.98,-.05,cream);
  for(const x of [-.05,1,2.05]){cylinder(kitchen,.28,.28,.09,x,.69,1.06,linen);for(const s of [-1,1])bar(kitchen,[x+s*.2,.1,1.22],[x+s*.15,.67,1.1],.025,black);}
  for(const x of [.1,1.8])pendant(kitchen,x,-.05,2.65);
  vase(kitchen,1.9,1.06,-.1);cylinder(kitchen,.23,.29,.13,.35,1.1,-.08,olive);
  table(kitchen,-2.3,1.2,1.45,1.1);
  for(const z of [.25,2.1]){box(kitchen,.5,.1,.5,-2.3,.48,z,wood);box(kitchen,.5,.55,.09,-2.3,.8,z+(z>1?.22:-.22),wood);for(const dx of [-.2,.2])for(const dz of [-.2,.2])box(kitchen,.04,.43,.04,-2.3+dx,.23,z+dz,black);}
  plant(kitchen,3.0,0,2.9,1.4);
  const bedroom=roomShell('bedroom',8,8);
  box(bedroom,5.5,3.45,.13,-.3,1.75,-3.85,wood);
  box(bedroom,3.5,1.3,.2,-.3,.95,-3.65,linen);
  box(bedroom,3.1,.4,3.5,-.3,.33,-1.85,wood);box(bedroom,3,.29,3.4,-.3,.67,-1.85,cream);
  box(bedroom,3.08,.1,1.1,-.3,.85,-.66,darkFabric);
  for(const x of [-1.12,.55])softBox(bedroom,1.24,.2,.64,x,.93,-2.97,linen);
  for(const x of [-2.45,1.85]){box(bedroom,.62,.46,.6,x,.35,-3.18,wood);cylinder(bedroom,.09,.15,.35,x,.76,-3.18,mat('#c0aa7f'));cylinder(bedroom,.2,.28,.3,x,1.05,-3.18,cream);}
  box(bedroom,4.4,.025,5,-.3,.025,-1,rug);
  box(bedroom,2.2,.13,.5,0,.53,1.7,linen);for(const x of [-.85,.85])box(bedroom,.07,.46,.36,x,.25,1.7,wood);
  box(bedroom,.55,2.9,2.6,-3.62,1.47,.8,cabinet);for(let z=-.35;z<2.1;z+=.8)box(bedroom,.04,2.7,.025,-3.32,1.47,z,wood);
  plant(bedroom,3,0,-3.1,1.4);art(bedroom,.3,1.98,3.86,1.9,1.6);
  pendant(bedroom,1.9,-3.18,2.65);

  const roomData={
    living:{title:'The living room',caption:'Natural textures. Warm light. Space to slow down.',number:'01 / 04',position:[2.5,1.62,2.4],yaw:.57,pitch:-.08,next:'kitchen',nextLabel:'Explore kitchen',bounds:[-3.25,3.3,-2.9,3.3]},
    kitchen:{title:'Kitchen & dining',caption:'A considered space for everyday rituals.',number:'02 / 04',position:[2.9,1.62,2.6],yaw:.5,pitch:-.08,next:'bedroom',nextLabel:'Visit the bedroom',bounds:[-2.65,3.3,-2.3,2.85]},
    bedroom:{title:'The bedroom',caption:'Soft finishes and a quieter pace upstairs.',number:'03 / 04',position:[2.8,1.62,2.8],yaw:.55,pitch:-.08,next:'balcony',nextLabel:'Step onto the balcony',bounds:[-2.8,3.25,-2.6,3.3]},
    balcony:{title:'The balcony',caption:'An open-air pause, framed by glass and greenery.',number:'04 / 04',position:[2.55,5.32,3.24],yaw:2.4,pitch:-.07,next:'living',nextLabel:'Return to living room',bounds:[-4.1,4.1,2.55,3.55]}
  };
  // Obstacles prevent keyboard movement from crossing solid furnishings.
  const obstacles={living:[[-3.6,-2.1,-1.6,2.3],[-1.65,2.25,2.1,3.65],[-1.3,.9,-.6,.9],[-2.9,2,-3.8,-3.0]],kitchen:[[-.85,2.65,-.87,.8],[-3.25,-1.3,.4,1.95]],bedroom:[[-2,1.4,-3.65,.1],[-1.3,1.3,1.32,2.05]],balcony:[]};
  let currentRoom=null,inTour=false,dusk=false,yaw=0,pitch=0,drag=null,moved=false,roomBusy=false,returnFocus=null;
  const tourDialog=document.createElement('dialog');tourDialog.className='house-tour-dialog';tourDialog.setAttribute('aria-label','Courtyard Residence interior tour');document.body.append(tourDialog);
  const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
  const roomNav=viewer.querySelector('.room-navigation');
  const tourInfo=viewer.querySelector('.house-tour-info');
  const movement=viewer.querySelector('.tour-movement');
  const nextButton=document.querySelector('#next-room');
  const exitButton=document.querySelector('#house-exit');
  const transition=viewer.querySelector('.tour-transition');
  const keys=new Set();
  let savedPosition=new THREE.Vector3(),savedTarget=new THREE.Vector3();
  function resize(){const w=canvasHost.clientWidth,h=canvasHost.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(canvasHost);
  function resetExterior(){const narrow=canvasHost.clientWidth<650;camera.position.set(narrow?13:12,narrow?9.5:9,narrow?29:22);controls.target.set(0,3.1,.4);controls.update();}
  resize();resetExterior();
  function lighting(){
    scene.background.set(dusk?'#44566a':'#c6d4d5');scene.fog.color.copy(scene.background);
    hemi.intensity=dusk?1.15:2.6;sun.intensity=dusk?.25:3.1;fill.intensity=dusk?.6:1.1;
    renderer.toneMappingExposure=inTour&&currentRoom!=='balcony'?1.1:(dusk?1.35:1.15);
    interiorFill.visible=inTour&&currentRoom!=='balcony';
    warmLights.forEach(l=>l.intensity=dusk?12:5);
    viewer.classList.toggle('is-dusk',dusk);
    const b=document.querySelector('#house-light');b.innerHTML=dusk?'Daylight <span>☀</span>':'Dusk <span>◐</span>';b.setAttribute('aria-pressed',dusk);
  }
  function look(){camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);}
  async function goRoom(name,initial=false){
    if(roomBusy||!roomData[name])return;roomBusy=true;keys.clear();
    if(!initial){transition.classList.add('active');if(!reduced)await new Promise(r=>setTimeout(r,280));}
    if(!inTour){roomBusy=false;transition.classList.remove('active');return;}
    currentRoom=name;const r=roomData[name];
    Object.entries(rooms).forEach(([key,g])=>g.visible=key===name);exterior.visible=name==='balcony';
    camera.position.set(...r.position);camera.fov=70;camera.updateProjectionMatrix();yaw=r.yaw;pitch=r.pitch;look();
    document.querySelector('#room-title').textContent=r.title;document.querySelector('#room-caption').textContent=r.caption;document.querySelector('#room-number').textContent=r.number;
    document.querySelector('#house-location-label').textContent=name==='living'||name==='kitchen'?'GROUND FLOOR / INTERIOR':'FIRST FLOOR / '+(name==='balcony'?'OUTDOOR':'INTERIOR');
    roomNav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.room===name));
    nextButton.innerHTML=`${r.nextLabel} <span>→</span>`;lighting();transition.classList.remove('active');roomBusy=false;
  }
  function enter(){
    if(inTour)return;returnFocus=document.activeElement;savedPosition.copy(camera.position);savedTarget.copy(controls.target);controls.enabled=false;controls.enableDamping=false;
    inTour=true;viewer.classList.add('in-tour');tourDialog.append(viewer);tourDialog.showModal();document.body.style.overflow='hidden';
    [roomNav,tourInfo,movement,nextButton,exitButton].forEach(el=>el.hidden=false);
    document.querySelector('#house-controls-hint').textContent='DRAG TO LOOK · WASD TO MOVE · ARROW KEYS TO LOOK · ESC TO EXIT';
    renderer.domElement.setAttribute('aria-label','Interior tour. Drag or use arrow keys to look around. Use W A S D to move, and room buttons to explore.');
    goRoom('living',true);resize();renderer.domElement.focus({preventScroll:true});
  }
  function exit(){
    if(!inTour)return;inTour=false;keys.clear();drag=null;roomBusy=false;transition.classList.remove('active');
    Object.values(rooms).forEach(g=>g.visible=false);exterior.visible=true;
    mount.append(viewer);viewer.classList.remove('in-tour');[roomNav,tourInfo,movement,nextButton,exitButton].forEach(el=>el.hidden=true);
    if(tourDialog.open)tourDialog.close();document.body.style.overflow='';
    camera.fov=42;camera.position.copy(savedPosition);controls.target.copy(savedTarget);controls.enabled=true;controls.enableDamping=!reduced;controls.update();resize();lighting();
    document.querySelector('#house-location-label').textContent='THE COURTYARD RESIDENCE';document.querySelector('#house-controls-hint').textContent='DRAG TO ROTATE · SCROLL TO ZOOM · CLICK THE HOUSE TO ENTER';
    renderer.domElement.setAttribute('aria-label','3D house. Drag to orbit, scroll to zoom, or press Enter to start the interior tour.');
    (returnFocus?.isConnected?returnFocus:enterButton).focus({preventScroll:true});
  }
  enterButton.addEventListener('click',enter);exitButton.addEventListener('click',exit);
  tourDialog.addEventListener('cancel',e=>{e.preventDefault();exit();});tourDialog.addEventListener('close',()=>{if(inTour)exit();});
  roomNav.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>goRoom(b.dataset.room)));
  nextButton.addEventListener('click',()=>goRoom(roomData[currentRoom].next));
  document.querySelector('#house-light').addEventListener('click',()=>{dusk=!dusk;lighting();});
  document.querySelector('#house-reset').addEventListener('click',()=>inTour?goRoom(currentRoom):resetExterior());
  function move(forward,strafe=0){
    if(!inTour||roomBusy)return;const b=roomData[currentRoom].bounds;
    const x=THREE.MathUtils.clamp(camera.position.x-Math.sin(yaw)*forward+Math.cos(yaw)*strafe,b[0],b[1]);
    const z=THREE.MathUtils.clamp(camera.position.z-Math.cos(yaw)*forward-Math.sin(yaw)*strafe,b[2],b[3]);
    const blocked=(x,z)=>obstacles[currentRoom].some(o=>x>o[0]-.12&&x<o[1]+.12&&z>o[2]-.12&&z<o[3]+.12);
    if(!blocked(x,camera.position.z))camera.position.x=x;if(!blocked(camera.position.x,z))camera.position.z=z;
  }
  movement.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.look==='left')yaw+=.25;else if(b.dataset.look==='right')yaw-=.25;else move(b.dataset.look==='forward'?.4:-.4);look();}));
  renderer.domElement.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,id:e.pointerId};moved=false;if(inTour)renderer.domElement.setPointerCapture(e.pointerId);});
  renderer.domElement.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6)moved=true;
    if(inTour){yaw-=(e.clientX-drag.lastX)*.004;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-drag.lastY)*.003,-1.1,1.05);look();}
    drag.lastX=e.clientX;drag.lastY=e.clientY;
  });
  renderer.domElement.addEventListener('pointerup',e=>{
    if(!drag)return;const click=!moved;drag=null;
    if(inTour||!click||e.button!==0)return;
    const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
    if(raycaster.intersectObject(house,true).length)enter();
  });
  renderer.domElement.addEventListener('pointercancel',()=>drag=null);
  renderer.domElement.addEventListener('keydown',e=>{
    if(!inTour&&e.key==='Enter'){e.preventDefault();enter();return;}
    if(inTour&&['KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){e.preventDefault();keys.add(e.code);}
  });
  window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();drag=null;});
  renderer.domElement.addEventListener('blur',()=>keys.clear());
  let visible=true,last=performance.now();
  new IntersectionObserver(entries=>visible=entries[0].isIntersecting,{rootMargin:'100px'}).observe(mount);
  document.addEventListener('visibilitychange',()=>{last=performance.now();keys.clear();});
  function frame(now){
    requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;
    if(document.hidden||(!inTour&&!visible))return;
    if(inTour){
      if(keys.has('ArrowLeft'))yaw+=dt*1.2;if(keys.has('ArrowRight'))yaw-=dt*1.2;
      if(keys.has('ArrowUp'))pitch=Math.min(1.05,pitch+dt);if(keys.has('ArrowDown'))pitch=Math.max(-1.1,pitch-dt);
      move(((keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0))*dt*1.7,((keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0))*dt*1.7);look();
    }else controls.update();
    renderer.render(scene,camera);
  }
  lighting();renderer.render(scene,camera);loading.hidden=true;enterButton.disabled=false;requestAnimationFrame(frame);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();loading.hidden=false;loading.textContent='The 3D view was interrupted. Reload the page to resume the tour.';enterButton.disabled=true;});
}
