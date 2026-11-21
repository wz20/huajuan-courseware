(() => {
  const $=id=>document.getElementById(id);
  const stage=$('stage'),viewport=$('view'),diagram=$('diag');
  const defaults={angle:55,yaw:.23,pitch:.54,zoom:1};
  const state={...defaults};
  let renderer,bench,camera,mode='physical',playing=false,drag=null,lastTime=null,frame=null;
  let diskAngle=-1, lastWidth=0, lastHeight=0;
  const scope=$('disk').getContext('2d');
  const ray=new THREE.Raycaster(), deck=new THREE.Plane(new THREE.Vector3(0,1,0),-2.14);
  const tags={};
  for(const [key,text] of Object.entries({lunar:'月球 · 可拖动',earth:'地球',bulb:'日光'})){
    const label=document.createElement('span');label.className='tag';label.textContent=text;
    viewport.append(label);tags[key]=label;
  }
  function setHint(message){$('hint').textContent=message;}
  function pause(){playing=false;lastTime=null;$('play').setAttribute('aria-pressed','false');$('play').textContent='演示公转';}
  function angle(value){state.angle=Math.max(0,Math.min(360,Math.round(value)));draw();}
  function viewCamera(w,h) {
    const target=new THREE.Vector3(.32,.94,0),dist=12;
    const half=Math.max(3.25,4.94/(w/h))/state.zoom;
    Object.assign(camera,{left:-half*w/h,right:half*w/h,top:half,bottom:-half});
    camera.position.set(dist*Math.sin(state.yaw)*Math.cos(state.pitch),dist*Math.sin(state.pitch),dist*Math.cos(state.yaw)*Math.cos(state.pitch)).add(target);
    camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  function drawBench() {
    const w=stage.clientWidth,h=stage.clientHeight;
    viewCamera(w,h);
    if(w!==lastWidth||h!==lastHeight){
      renderer.setSize(w,h,false);lastWidth=w;lastHeight=h;
    }
    bench.setAngle(state.angle);
    renderer.render(bench.scene,camera);
    for(const key of Object.keys(tags)){
      const pos=bench[key].getWorldPosition(new THREE.Vector3());
      pos.y+=key==='earth'?.81:key==='bulb'?.49:.44; pos.project(camera);
      tags[key].style.left=(pos.x+1)*50+'%';tags[key].style.top=(1-pos.y)*50+'%';
    }
  }
  function diagramPoint(a){return {x:300+154*Math.cos(radians(a)),y:155-104*Math.sin(radians(a))};}
  function drawPlan() {
    const pt=diagramPoint(state.angle);
    diagram.innerHTML='<svg viewBox="0 0 600 325" aria-label="轨道投影示意"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#d2c8b2" stroke-width=".7"/></pattern><marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="#b78640"/></marker></defs><rect width="600" height="325" fill="url(#grid)"/><g stroke="#b78640" stroke-width="2" marker-end="url(#arrow)"><path d="M555 115h-65"/><path d="M555 155h-65"/><path d="M555 195h-65"/></g><ellipse cx="300" cy="155" rx="154" ry="104" stroke="#617568" stroke-dasharray="4 4" fill="none"/><path d="M300 155L'+pt.x+' '+pt.y+'" stroke="#967442" stroke-width="4"/><circle cx="300" cy="155" r="23" fill="#408381"/><text x="300" y="200" text-anchor="middle">地球</text><text x="523" y="93" text-anchor="middle">太阳光</text><g data-drag="moon" style="cursor:grab"><circle cx="'+pt.x+'" cy="'+pt.y+'" r="24" fill="transparent"/><circle cx="'+pt.x+'" cy="'+pt.y+'" r="13" fill="#343e3a" stroke="#b7904a" stroke-width="2"/><path d="M'+pt.x+' '+(pt.y-13)+' a13 13 0 0 1 0 26Z" fill="#eddbad"/></g></svg>';
  }
  function draw() {
    if(mode==='physical'&&renderer)drawBench();else drawPlan();
    $('angle').value=state.angle;$('degrees').textContent=state.angle+'°';
    $('phase').textContent=phaseName(state.angle);$('percent').textContent=Math.round(100*phaseAt(state.angle))+'%';
    for(const b of document.querySelectorAll('[data-angle]')) b.setAttribute('aria-pressed',String(Number(b.dataset.angle)===state.angle%360));
    if(diskAngle!==state.angle){
      const size=$('disk').width;
      scope.putImageData(new ImageData(moonImage(state.angle,size),size,size),0,0);diskAngle=state.angle;
    }
  }
  function changeMode(next) {
    mode=next;viewport.hidden=next!=='physical';diagram.hidden=next!=='plan';
    $('physical').setAttribute('aria-pressed',String(next==='physical'));$('plan').setAttribute('aria-pressed',String(next==='plan'));
    for(const id of ['zoomIn','zoomOut']) $(id).disabled=mode==='plan';
    setHint(next==='physical'?'拖月球转动摇臂 · 拖空白处环视 · 滚轮缩放':'拖动轨道上的月球 · 右侧箭头为太阳光');draw();
  }
  function schedule(t) {
    frame=null;if(!playing)return;
    if(lastTime===null)lastTime=t;
    const steps=Math.floor((t-lastTime)/65);
    if(steps){angle((state.angle+Math.min(steps,4))%360);lastTime=t;}
    frame=requestAnimationFrame(schedule);
  }
  function zoom(factor){state.zoom=Math.min(1.65,Math.max(.75,state.zoom*factor));draw();}
  $('play').onclick=()=>{if(playing){pause();return;}playing=true;$('play').setAttribute('aria-pressed','true');$('play').textContent='暂停公转';if(frame===null)frame=requestAnimationFrame(schedule);};
  $('angle').oninput=e=>{pause();angle(+e.target.value);};
  for(const btn of document.querySelectorAll('[data-angle]'))btn.onclick=()=>{pause();angle(+btn.dataset.angle);};
  $('reset').onclick=()=>{pause();Object.assign(state,defaults);$('detail').textContent='试一试：上弦月和下弦月都亮一半，亮的是同一边吗？';changeMode(renderer?'physical':'plan');};
  $('plan').onclick=()=>changeMode('plan');$('physical').onclick=()=>changeMode('physical');
  $('zoomIn').onclick=()=>zoom(1.14);$('zoomOut').onclick=()=>zoom(1/1.14);
  function setRay(e) {
    const rect=stage.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);
  }
  function pointerAngle(e){
    if(mode==='physical'){
      setRay(e);const p=ray.ray.intersectPlane(deck,new THREE.Vector3());
      if(!p||Math.hypot(p.x,p.z)<.15)return null;
      return angleAt(p.x,p.z);
    }
    const svg=diagram.firstElementChild,point=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    return angleAt((point.x-300)/154,(point.y-155)/104);
  }
  stage.addEventListener('pointerdown',e=>{
    if(e.target.closest('button')||drag)return;
    let kind='camera',selected='';
    if(mode==='plan'){if(!e.target.closest('[data-drag]'))return;kind='moon';}
    else{
      setRay(e);
      const hit=ray.intersectObjects([bench.lunar,bench.earth,bench.bulb],false)[0];
      const pos=bench.lunar.getWorldPosition(new THREE.Vector3());
      if(hit?.object===bench.lunar||(!hit&&ray.ray.distanceToPoint(pos)<.48))kind='moon';
      if(hit?.object===bench.earth)selected='地球位于观测中心。望远镜画面始终从这里朝月球看。';
      if(hit?.object===bench.bulb)selected='灯标出太阳方向。试着让月球转到灯与地球之间，观察亮面。';
    }
    const start=kind==='moon'?pointerAngle(e):0;
    if(kind==='moon'){pause();$('detail').textContent='观察望远镜：月球绕行时，一半球面始终被照亮，地球上能看见的亮面在变。';}
    if(selected)$('detail').textContent=selected;
    drag={id:e.pointerId,kind,x:e.clientX,y:e.clientY,offset:state.angle-(start??state.angle)};
    stage.setPointerCapture(e.pointerId);stage.style.cursor='grabbing';
  });
  stage.addEventListener('pointermove',e=>{
    if(!drag){if(mode==='physical'&&renderer&&!e.target.closest('button')){setRay(e);stage.style.cursor=ray.intersectObject(bench.lunar,false).length?'grab':'move';}return;}
    if(drag.id!==e.pointerId)return;
    if(drag.kind==='moon'){
      const next=pointerAngle(e);if(next!==null)angle((next+drag.offset+720)%360);
    }else{
      state.yaw-=(e.clientX-drag.x)*.009;
      state.pitch=Math.max(.25,Math.min(1.23,state.pitch+(e.clientY-drag.y)*.006));draw();
    }
    drag.x=e.clientX;drag.y=e.clientY;
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,e=>{if(drag?.id===e.pointerId){drag=null;stage.style.cursor='';}});
  stage.addEventListener('wheel',e=>{if(mode==='physical'){e.preventDefault();zoom(Math.exp(-e.deltaY*.0013));}},{passive:false});
  try{
    renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor(0xe5ded0);
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;
    camera=new THREE.OrthographicCamera(-5,5,5,-5,.1,70);bench=createBench();viewport.prepend(renderer.domElement);
  }catch(error){renderer=null;$('physical').disabled=true;$('detail').textContent='此浏览器未能启动 WebGL。可在原理图继续拖动月球。';}
  changeMode(renderer?'physical':'plan');
  new ResizeObserver(draw).observe(stage);
})();
