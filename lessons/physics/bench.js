const leftEnd=-2.9, rightEnd=.9, span=rightEnd-leftEnd;
function experiment(position,red,blue,power) {
  const lower=[red,blue].filter(p=>p==='A'||p==='B');
  const x=Math.max(0,Math.min(100,position))/100;
  const start=lower.length===0?x:lower.length===2||lower[0]==='A'?0:x;
  const end=lower.length===0?x:lower.length===2||lower[0]==='B'?1:x;
  const resistance=24*(end-start), current=power?6/(12+resistance):0;
  const path=lower.length===2?'A 到 B，整段电阻丝接入。':lower.length===0?'C、D 由金属杆直接连通，电阻丝未接入。':lower[0]==='A'?'A 到滑片，滑片右移时接入的电阻丝变长。':'滑片到 B，滑片右移时接入的电阻丝变短。';
  return {x,start,end,resistance,current,brightness:current*current*4,path};
}
function makeBench(){
  const T=THREE,scene=new T.Scene(), V=(x,y,z)=>new T.Vector3(x,y,z);
  const mat=(color,metalness=.18,roughness=.42)=>new T.MeshStandardMaterial({color,metalness,roughness});
  const green=mat(0x234e49),cream=mat(0xe4d6b4,.02),gold=mat(0xc39a56,.58),steel=mat(0x98a6a4,.58),
    ink=mat(0x29322f),red=mat(0xad412f),blue=mat(0x325c75),black=mat(0x2e393b),copper=mat(0xe59043,.52);
  function mesh(geo,m,x,y,z,parent=scene){
    const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
  }
  const box=(a,b,c,m,x,y,z,p)=>mesh(new T.BoxGeometry(a,b,c),m,x,y,z,p);
  const cyl=(r,h,m,x,y,z,p,n=48)=>mesh(new T.CylinderGeometry(r,r,h,n),m,x,y,z,p);
  function rod(a,b,r,m,p){const d=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5);
    const o=cyl(r,d.length(),m,mid.x,mid.y,mid.z,p);o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return o;}
  const floor=mesh(new T.PlaneGeometry(200,200),mat(0xe6e3d8,0,.92),0,-.02,0);
  floor.rotation.x=-Math.PI/2;floor.castShadow=false;
  // Ceramic former, wound wire, conducting rail, and separately mounted terminals.
  box(4.94,.10,1.78,black,-1,.09,0);box(4.88,.24,1.74,green,-1,.25,0);
  for(const x of [-3.12,1.12]){
    box(.22,1.05,.64,cream,x,.86,-.03);
    cyl(.13,.055,gold,x,.405,.66);box(.15,.012,.025,ink,x,.436,.66);
    box(.25,.14,.66,gold,x,1.52,-.12);
  }
  rod(V(-3.06,.92,0),V(1.06,.92,0),.36,cream);
  rod(V(-3.18,1.54,0),V(1.18,1.54,0),.066,steel);
  const turns=48, helix=[];
  for(let i=0;i<=turns*20;i++){const f=i/(turns*20),a=2*Math.PI*turns*f;helix.push(V(leftEnd+span*f,.92+.374*Math.cos(a),.374*Math.sin(a)));}
  const winding=new T.CatmullRomCurve3(helix,false,'centripetal');
  mesh(new T.TubeGeometry(winding,turns*20,.03,7,false),mat(0x53615b,.52),0,0,0);
  const activeGeo=new T.TubeGeometry(winding,turns*20,.033,7,false);
  mesh(activeGeo,copper,0,0,0);
  const carriage=new T.Group();scene.add(carriage);
  box(.24,.21,.25,gold,0,1.56,0,carriage);box(.30,.11,.33,red,0,1.70,0,carriage);
  const grip=cyl(.13,.22,ink,0,1.85,0,carriage);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;cyl(.017,.19,black,.127*Math.cos(a),1.85,.127*Math.sin(a),carriage,8);}
  rod(V(0,1.53,.10),V(0,1.25,.115),.039,gold,carriage);
  const terminals={},anchors={};
  for(const [id,x,z,y] of [['A',-3.14,.59,.69],['B',1.14,.59,.69],['C',-3.14,-.49,1.60],['D',1.14,-.49,1.60]]){
    const g=new T.Group();g.position.set(x,y,z);scene.add(g);terminals[id]=g;
    cyl(.137,.12,ink,0,0,0,g);cyl(.108,.12,gold,0,.11,0,g);cyl(.05,.009,black,0,.175,0,g);
    anchors[id]=V(x,y+.185,z);
    if('AB'.includes(id))rod(V(x,y-.04,z),V(id==='A'?leftEnd:rightEnd,1.294,0),.045,steel);
    else rod(V(x,1.54,z),V(x,1.54,0),.047,steel);
  }
  for(let i=0;i<=40;i++){const x=leftEnd+span*i/40;box(.014,.012,i%10===0?.18:i%5===0?.12:.07,cream,x,.378,.68);}
  // Independent series lamp and switched power supply, all three leads terminate on contacts.
  const lampX=2.72;
  cyl(.59,.19,green,lampX,.13,-.05);cyl(.39,.16,cream,lampX,.30,-.05);
  for(let i=0;i<5;i++)cyl(.209+(i%2)*.02,.046,gold,lampX,.42+i*.054,-.05);
  const glassMat=new T.MeshPhysicalMaterial({color:0xffdf95,transparent:true,opacity:.25,roughness:.18,metalness:.12,depthWrite:false});
  const profile=[[.16,.59],[.16,.70],[.25,.78],[.36,.93],[.40,1.09],[.38,1.23],[.30,1.34],[.16,1.40],[.02,1.43],[0,1.43]];
  mesh(new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(r,h)),64),glassMat, lampX,0,-.05);
  const filamentMat=mat(0xf7a542,.1);filamentMat.emissive.setHex(0xff9b29);
  const filamentPoints=[];
  for(let i=0;i<=72;i++){const f=i/72;filamentPoints.push(V(lampX-.13+.26*f,1.02+.032*Math.cos(f*Math.PI*14),-.05+.032*Math.sin(f*Math.PI*14)));}
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(filamentPoints),72,.016,6,false),filamentMat,0,0,0);
  for(const dx of [-.13,.13])rod(V(lampX+dx/2,.59,-.05),V(lampX+dx,1.04,-.05),.013,steel);
  const bulbLight=new T.PointLight(0xffb343,1.5,3);bulbLight.position.set(lampX,1.07,-.05);scene.add(bulbLight);
  const pack=V(-.8,0,2.14);box(2.55,.38,.89,green,pack.x,.22,pack.z);
  box(2.48,.045,.83,steel,pack.x,.433,pack.z);
  const supply=V(pack.x-1,.53,pack.z), ground=V(pack.x+1,.53,pack.z);
  cyl(.105,.16,red,supply.x,supply.y-.06,supply.z);cyl(.105,.16,black,ground.x,ground.y-.06,ground.z);
  const key=box(.46,.14,.30,ink,pack.x,.50,pack.z);
  box(.08,.015,.21,cream,-.13,.078,0,key);
  const bulbA=V(2.33,.26,.18),bulbB=V(3.09,.26,.18);
  for(const v of [bulbA,bulbB])cyl(.074,.12,gold,v.x,v.y-.02,v.z);
  function lead(points,m){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),80,.043,9,false),m,0,0,0);}
  lead([ground,V(.75,.11,2.55),V(2.97,.055,2.08),V(3.49,.09,.77),bulbB],black);
  let wires=[],lastPair='';
  function replaceWires(a,b){
    if(a+b===lastPair)return;lastPair=a+b;
    for(const w of wires){scene.remove(w);w.geometry.dispose();}
    function plugPath(id,side){const p=anchors[id],edge=p.x<0?-3.72:1.75;
      return [p,p.clone().add(V(0,.19,0)),V(edge,p.y-.02,p.z),V(edge,.09,side)];}
    wires=[lead([...plugPath(a,1.35),V(-2.8,.075,2.54),supply],red),
      lead([...plugPath(b,-1.24),V(2.28,.07,-1.40),V(2.03,.12,-.40),bulbA],blue)];
  }
  function apply(s,m){
    replaceWires(s.red,s.blue);carriage.position.x=leftEnd+span*m.x;
    const count=turns*20, stride=7*6,first=Math.round(count*m.start),last=Math.round(count*m.end);
    activeGeo.setDrawRange(first*stride,(last-first)*stride);
    key.rotation.z=s.power?.18:-.18;
    filamentMat.emissiveIntensity=s.power?.35+4*m.brightness:0;
    filamentMat.color.setHex(s.power?0xfab459:0x544d45);
    glassMat.opacity=.18+.37*m.brightness;glassMat.emissive.setHex(0xffa737);glassMat.emissiveIntensity=m.brightness*.95;
    bulbLight.intensity=4*m.brightness;
  }
  scene.add(new T.HemisphereLight(0xfff9e9,0xb7b4a1,1.8));
  const light=new T.DirectionalLight(0xffeacc,3.1);light.position.set(-2,7,4);light.castShadow=true;
  Object.assign(light.shadow.camera,{left:-6,right:6,top:5,bottom:-5});light.shadow.mapSize.set(1024,1024);
  light.shadow.normalBias=.014;scene.add(light);
  return {scene,carriage,terminals,anchors,key,apply};
}
