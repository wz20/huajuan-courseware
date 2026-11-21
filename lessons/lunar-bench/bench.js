const TAU = 2*Math.PI;
const radius = 2.68;
const radians = deg => deg*Math.PI/180;
const angleAt = (x,z) => (Math.atan2(-z,x)*180/Math.PI+360)%360;
const phaseAt = deg => (1-Math.cos(radians(deg)))/2;
const phaseNames = ['朔月','娥眉月','上弦月','盈凸月','满月','亏凸月','下弦月','残月'];
function phaseName(a) {
  const quarter=Math.round(a/90);
  if(Math.abs(a-quarter*90)<1) return phaseNames[(quarter*2)%8];
  return phaseNames[1+2*Math.floor(a/90)%8];
}
function pointAt(deg,r=radius) {return new THREE.Vector3(r*Math.cos(radians(deg)),2.14,-r*Math.sin(radians(deg)));}
function createBench() {
  const T=THREE, scene=new T.Scene(), group=new T.Group(); scene.add(group);
  const material=(c,metalness=0,roughness=.46)=>new T.MeshStandardMaterial({color:c,metalness,roughness});
  const brass=material(0xca954c,.55,.30), brassLight=material(0xffdb8c,.48,.25);
  const enamel=material(0x21413e,.3,.36), dark=material(0x142a29,.25,.42), rim=material(0x805631,.4);
  function mesh(parent,geo,mat,x=0,y=0,z=0) {
    const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;
  }
  function cyl(p,r,d,y,mat,x=0,z=0,n=96) {return mesh(p,new T.CylinderGeometry(r,r,d,n),mat,x,y,z);}
  function ring(p,r,t,y,mat) {const m=mesh(p,new T.TorusGeometry(r,t,10,128),mat,0,y);m.rotation.x=Math.PI/2;return m;}
  function sphere(p,r,mat,x,y,z) {return mesh(p,new T.SphereGeometry(r,64,40),mat,x,y,z);}
  function bar(p,a,b,thick,mat) {
    const d=b.clone().sub(a), mid=a.clone().add(b).multiplyScalar(.5);
    const m=mesh(p,new T.CylinderGeometry(thick,thick,d.length(),14),mat,mid.x,mid.y,mid.z);
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;
  }
  const v=(x,y,z)=>new T.Vector3(x,y,z);
  const floor=mesh(scene,new T.PlaneGeometry(300,300),material(0xe5ded0));floor.rotation.x=-Math.PI/2;floor.castShadow=false;
  for(let i=0;i<3;i++){const a=i*TAU/3+.6,x=Math.cos(a)*2.55,z=Math.sin(a)*2.55;
    cyl(group,.27,.25,.16,dark,x,z);cyl(group,.29,.065,.29,brass,x,z);}
  cyl(group,3.22,.20,.39,dark);cyl(group,3.27,.08,.5,brass);cyl(group,3.22,.24,.65,enamel);
  ring(group,3.19,.05,.78,brassLight);ring(group,2.94,.018,.786,brass);ring(group,2.4,.022,.787,brass);
  const ticks=new T.InstancedMesh(new T.BoxGeometry(1,1,1),brassLight,180);
  const dummy=new T.Object3D();
  for(let i=0;i<180;i++){const a=i*TAU/180,len=i%15===0?.30:i%5===0?.21:.08;
    dummy.position.set((3.11-len/2)*Math.cos(a),.788,-(3.11-len/2)*Math.sin(a));
    dummy.rotation.y=a;dummy.scale.set(len,.014,i%15===0?.037:.016);dummy.updateMatrix();ticks.setMatrixAt(i,dummy.matrix);}
  group.add(ticks);
  for(let i=0;i<8;i++){const a=i*TAU/8;const x=2.2*Math.cos(a),z=2.2*Math.sin(a);
    cyl(group,.085,.027,.79,brass,x,z,24);
    const slot=mesh(group,new T.BoxGeometry(.11,.009,.016),rim,x,.808,z);slot.rotation.y=a+.35;}
  cyl(group,.68,.13,.86,rim);cyl(group,.59,.1,.97,brass);cyl(group,.46,.14,1.05,enamel);
  cyl(group,.20,.93,1.51,brass);for(const y of [1.17,1.38,1.64])cyl(group,.25,.043,y,brassLight);
  // Toothed wheels embedded in the dial transfer the arm rotation to a counterwheel.
  function wheel(x,count,pitch,rotation) {
    const g=new T.Group();g.position.set(x,.86,0);group.add(g);
    const ringRadius=count*pitch/TAU, shape=new T.Shape();
    for(let i=0;i<count*4;i++){
      const a=i*TAU/(count*4),r=ringRadius+([1,2].includes(i%4)?.042:-.044);
      if(i===0)shape.moveTo(r,0);else shape.lineTo(r*Math.cos(a),r*Math.sin(a));
    }
    shape.closePath();
    const hole=new T.Path();hole.absarc(0,0,ringRadius*.76,0,TAU,true);shape.holes.push(hole);
    const part=mesh(g,new T.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:false,curveSegments:28}),brass);
    part.rotation.x=-Math.PI/2;
    for(let i=0;i<3;i++){
      const spoke=mesh(g,new T.BoxGeometry(ringRadius*1.7,.06,.085),brass);spoke.rotation.y=i*Math.PI/3;
    }
    cyl(g,.14,.1,.03,brassLight);g.rotation.y=rotation;return g;
  }
  const drive=wheel(0,38,.195,0),counter=wheel(-54*.195/TAU,16,.195,Math.PI/16);
  // Numerals are stroked into the horizontal measuring face in world coordinates.
  const digits={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg'};
  const strokes={a:[0,0,1,0],b:[1,0,1,1],c:[1,1,1,2],d:[0,2,1,2],e:[0,1,0,2],f:[0,0,0,1],g:[0,1,1,1]};
  const engraving=[];
  for(let deg=0;deg<360;deg+=30){
    const text=String(deg),a=radians(deg),c=Math.cos(a),ss=Math.sin(a);
    const at=(u,v)=>[(2.72-v*.076)*c+u*.062*ss,.794,-(2.72-v*.076)*ss+u*.062*c];
    [...text].forEach((ch,j)=>{for(const id of digits[ch]){
      const [x,y,xx,yy]=strokes[id],offset=(j-(text.length-1)/2)*1.55-.5;
      engraving.push(...at(x+offset,y-1),...at(xx+offset,yy-1));
    }});
  }
  const etch=new T.BufferGeometry();etch.setAttribute('position',new T.Float32BufferAttribute(engraving,3));
  group.add(new T.LineSegments(etch,new T.LineBasicMaterial({color:0xe4c48b})));
  const earth=sphere(group,.66,material(0x43888c,.08,.45),0,2.14,0);
  // Etched graticule on the enamel terrestrial globe.
  const wire=new T.LineBasicMaterial({color:0xffde90,transparent:true,opacity:.55});
  function line(points,p){p.add(new T.Line(new T.BufferGeometry().setFromPoints(points),wire));}
  for(let i=-2;i<=2;i++){const phi=i*Math.PI/7;line(Array.from({length:97},(_,k)=>{
    const a=k*TAU/96;return v(.664*Math.cos(phi)*Math.cos(a),.664*Math.sin(phi),.664*Math.cos(phi)*Math.sin(a));}),earth);}
  for(let i=0;i<8;i++){const a=i*Math.PI/8;line(Array.from({length:97},(_,k)=>{
    const b=k*TAU/96;return v(.664*Math.cos(a)*Math.cos(b),.664*Math.sin(b),.664*Math.sin(a)*Math.cos(b));}),earth);}
  const meridian=mesh(group,new T.TorusGeometry(.78,.024,10,128),brassLight,0,2.14,0);meridian.rotation.y=.73;meridian.rotation.z=.26;
  const arm=new T.Group();group.add(arm);
  bar(arm,v(-.72,1.2,0),v(radius,1.2,0),.085,brass);
  cyl(arm,.29,.18,1.19,dark,-.66,0);cyl(arm,.26,.045,1.30,brass,-.66);
  cyl(arm,.175,.16,1.22,brassLight,radius);cyl(arm,.077,.78,1.62,brass,radius);
  const lunar=sphere(arm,.32,material(0xc8c2af,.06,.8),radius,2.14,0);
  // Keep the teaching light fixed in world space even when the arm rotates.
  lunar.material=new T.ShaderMaterial({
    vertexShader:`varying vec3 worldN; varying vec3 localN;
      void main(){localN=normal;worldN=mat3(modelMatrix)*normal;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec3 worldN; varying vec3 localN;
      void main(){vec3 n=normalize(localN);float d=max(0.0,normalize(worldN).x);
      float grain=.89+.07*sin(n.y*27.0+sin(n.x*12.0)*4.0)+.04*sin(dot(n,vec3(61.,31.,19.)));
      gl_FragColor=vec4(vec3(.92,.86,.69)*grain*(.075+.925*pow(d,.74)),1.);
      #include <colorspace_fragment>
      }`});
  // A separate miniature lamp supplies the direction marker on the +X side.
  const lamp=new T.Group();group.add(lamp);lamp.position.x=4.06;
  cyl(lamp,.47,.12,.06,dark);cyl(lamp,.36,.09,.16,brass);cyl(lamp,.085,1.82,1.1,brass);
  const bulb=sphere(lamp,.39,new T.MeshStandardMaterial({color:0xffdd80,emissive:0xffb23c,emissiveIntensity:.65,roughness:.27}),0,2.14,0);
  for(const y of [1.8,2.14,2.48])ring(lamp,y===2.14?.405:.22,.014,y,brass);
  const sky=new T.HemisphereLight(0xfff7df,0x8e8e76,1.55);scene.add(sky);
  const key=new T.DirectionalLight(0xffeed1,3.1);key.position.set(5.8,9,3);key.castShadow=true;
  Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6});key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.015;
  scene.add(key);
  const fill=new T.DirectionalLight(0xe1f4ff,1.1);fill.position.set(-4,3,-5);scene.add(fill);
  function setAngle(deg) {
    arm.rotation.y=drive.rotation.y=radians(deg);
    counter.rotation.y=Math.PI/16-radians(deg)*38/16;
  }
  return {scene,arm,lunar,earth,bulb,setAngle};
}
const surfaces=new Map();
function lunarSurface(size) {
  if(surfaces.has(size))return surfaces.get(size);
  const samples=new Float32Array(size*size*5);
  let seed=3187;
  const rand=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  const basins=[[-.36,.30,.32],[.02,.41,.19],[.27,.24,.24],[.43,.04,.13],[-.29,-.11,.21]];
  const craters=Array.from({length:180},()=>[2*rand()-1,2*rand()-1,.009+.09*rand()**3]);
  function noise(x,y) {
    const hash=(i,j)=>{let n=Math.imul(i+512,3266489917)^Math.imul(j+512,668265263);
      n=Math.imul(n^(n>>>15),2246822519);return (n>>>0)/4294967296;};
    const i=Math.floor(x),j=Math.floor(y);let u=x-i,v=y-j;u=u*u*(3-2*u);v=v*v*(3-2*v);
    return (hash(i,j)*(1-u)+hash(i+1,j)*u)*(1-v)+(hash(i,j+1)*(1-u)+hash(i+1,j+1)*u)*v;
  }
  for(let j=0;j<size;j++)for(let i=0;i<size;i++){
    const x=(2*i+1)/size-1,y=1-(2*j+1)/size,d=x*x+y*y;
    if(d>=1)continue;
    const z=Math.sqrt(1-d),k=5*(j*size+i),warp=.065*(noise(x*13,y*13)-.5);
    let tone=.70+.17*noise(x*35,y*35)+.12*noise(x*130,y*130),relief=0;
    for(const [cx,cy,r] of basins){const q=Math.hypot(x-cx,y-cy)/r+warp*4;
      tone-=.22*Math.max(0,Math.min(1,(1-q)*6));}
    for(const [cx,cy,r] of craters){
      if(Math.abs(x-cx)>r*1.2||Math.abs(y-cy)>r*1.2)continue;
      const q=Math.hypot(x-cx,y-cy)/r;
      if(q<1.15){const rim=Math.exp(-((q-.89)**2)/.027);
        tone+=.11*rim-.085*Math.max(0,1-q);relief+=rim*(x-cx)/r*.14;}
    }
    samples.set([x,z,tone,relief,Math.min(1,(1-Math.sqrt(d))*size)],k);
  }
  surfaces.set(size,samples);return samples;
}
function moonImage(angle,size) {
  const map=lunarSurface(size),a=radians(angle),sx=Math.sin(a),sz=-Math.cos(a);
  const bytes=new Uint8ClampedArray(size*size*4);
  for(let p=0;p<size*size;p++){
    const k=p*5,j=p*4;if(map[k+4]===0)continue;
    const sunlight=Math.max(0,map[k]*sx+map[k+1]*sz);
    const grey=map[k+2]*(.045+sunlight**.52*(.955+map[k+3]*sx));
    bytes[j]=255*grey;bytes[j+1]=250*grey;bytes[j+2]=237*grey;bytes[j+3]=255*map[k+4];
  }
  return bytes;
}
