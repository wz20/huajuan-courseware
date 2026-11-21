function compute(angle) {
  const rad = angle * Math.PI / 180;
  const percent = Math.round((1 - Math.cos(rad)) * 50);
  return {rad, percent, summary: '从地球看，可见月面约有 ' + percent + '% 被太阳照亮。'};
}

function createScene(stage) {
  const {Scene, Color, Vector3, Mesh, MeshStandardMaterial, SphereGeometry} = THREE;
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  stage.append(renderer.domElement);
  const world = new Scene();
  world.background = new Color(0x0d202a);
  const geometry = new SphereGeometry(1, 80, 48);
  function sphere(radius, color) {
    const body = new Mesh(geometry, new MeshStandardMaterial({color, roughness:1}));
    body.scale.setScalar(radius);
    world.add(body);
    return body;
  }
  const earth = sphere(.78, 0x45a7aa);
  const moon = sphere(.39, 0xe1d3b1);
  // A reproducible stippled lunar surface, generated locally.
  const tile = document.createElement('canvas');
  tile.width = 768; tile.height = 384;
  const ink = tile.getContext('2d');
  ink.fillStyle = '#e8dfca'; ink.fillRect(0,0,tile.width,tile.height);
  let seed = 109;
  function random() { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }
  for (let i=0;i<1050;i++) {
    const x = random()*768, y = random()*384, r = 1 + 10*random()**3;
    ink.beginPath(); ink.arc(x,y,r,0,Math.PI*2);
    ink.fillStyle = 'rgba(72,66,59,' + (.06+.24*random()) + ')'; ink.fill();
  }
  moon.material.map = new THREE.CanvasTexture(tile);
  moon.material.map.colorSpace = THREE.SRGBColorSpace;
  const sun = new THREE.DirectionalLight(0xfff4db, 3.1);
  sun.position.set(10,0,0); world.add(sun, new THREE.AmbientLight(0xb3ccdf,.10));
  const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
    Array.from({length:160}, (_,i)=>new Vector3(3*Math.cos(i*Math.PI/80),0,-3*Math.sin(i*Math.PI/80)))),
    new THREE.LineBasicMaterial({color:0x467b83}));
  world.add(ring);
  const arrows = new THREE.Group();
  for(const z of [-1.4,0,1.4]) arrows.add(new THREE.ArrowHelper(new Vector3(-1,0,0),new Vector3(4.2,0,z),.9,0xf4b866,.18,.12));
  world.add(arrows);
  const overview = new THREE.OrthographicCamera(-4,4,3,-3,.01,100);
  const observer = new THREE.OrthographicCamera(-1,1,1,-1,.01,10);
  observer.position.set(0,0,0);
  let azimuth = .45, lastModel;
  const view = document.createElement('button');
  view.textContent = '转动系统视角 ↻'; stage.append(view);
  view.onclick = () => { azimuth += Math.PI/4; draw(lastModel); };
  renderer.domElement.style.touchAction='pan-y';
  let lastX = null;
  renderer.domElement.addEventListener('pointerdown', e => {
    const bounds = renderer.domElement.getBoundingClientRect();
    if(e.clientX-bounds.left >= bounds.width*.64) return;
    lastX=e.clientX;
    renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener('pointermove', e => {
    if(lastX===null) return;
    azimuth -= (e.clientX-lastX)*.012;
    lastX=e.clientX; draw(lastModel);
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture']) {
    renderer.domElement.addEventListener(event, () => {lastX=null;});
  }
  const caption = document.createElement('span');
  Object.assign(caption.style,{position:'absolute',bottom:'9px',left:'5%',color:'#d2e4df',fontSize:'12px',pointerEvents:'none'});
  caption.textContent = '地月轨道 · 金色箭头为阳光方向'; stage.append(caption);
  const label = caption.cloneNode(false);
  label.style.left = '69%'; label.textContent = '地面观测'; stage.append(label);
  function fit(camera, width, height, radius) {
    const aspect = width / height;
    camera.top = Math.max(radius, radius/aspect);
    camera.bottom = -camera.top;
    camera.right = camera.top*aspect; camera.left = -camera.right;
    camera.updateProjectionMatrix();
  }
  function draw(model) {
    lastModel = model;
    const w = stage.clientWidth, h = stage.clientHeight, split = Math.round(w*.64);
    renderer.setSize(w,h,false);
    renderer.setScissorTest(true);
    moon.position.set(3*Math.cos(model.rad),0,-3*Math.sin(model.rad));
    overview.position.set(8*Math.sin(azimuth),8,8*Math.cos(azimuth));
    overview.lookAt(0,0,0);
    fit(overview,split,h,4.45);
    earth.visible = ring.visible = arrows.visible = true;
    renderer.setViewport(0,0,split,h); renderer.setScissor(0,0,split,h);
    renderer.render(world,overview);
    earth.visible = ring.visible = arrows.visible = false;
    observer.lookAt(moon.position);
    fit(observer,w-split,h,.49);
    renderer.setViewport(split,0,w-split,h); renderer.setScissor(split,0,w-split,h);
    world.background.setHex(0x142b38); renderer.render(world,observer);
    world.background.setHex(0x0d202a);
  }
  return {draw,reset(){azimuth=.45;}};
}
