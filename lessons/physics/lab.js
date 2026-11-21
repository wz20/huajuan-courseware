(() => {
  const $=id=>document.getElementById(id),stage=$('stage'),view=$('view'),plan=$('plan');
  const init={position:32,red:'C',blue:'A',power:true};
  const s={...init};
  let mode='physical',held='',drag=null,yaw=.15,tilt=.49,zoom=1,renderer,bench,camera,prevW,prevH;
  const labels={},ray=new THREE.Raycaster(),tasks=[
    '保持红线接 C，把蓝线从 A 换到 B，再向右推滑片。电流怎样变化？',
    '选哪两个接线柱，滑片从左到右移动，电流始终最小？',
    '想让电流稳定在 0.25 A，红线接 C、蓝线接 A 时，滑片应该放在哪里？'];
  let taskIndex=0;
  function moveWire(wire,terminal){
    const other=wire==='red'?'blue':'red';
    if(s[other]===terminal)s[other]=s[wire];
    s[wire]=terminal;held='';draw();
  }
  function pickTerminal(id){
    if(held){moveWire(held,id);return;}
    if(s.red===id)held='red';else if(s.blue===id)held='blue';
    draw();
  }
  function position(n){s.position=Math.round(Math.max(0,Math.min(100,n)));draw();}
  function model(){return experiment(s.position,s.red,s.blue,s.power);}
  function updateCamera(){
    const w=stage.clientWidth,h=stage.clientHeight;
    if(!w||!h)return;
    const half=Math.max(2.14,4.25/(w/h))/zoom;
    Object.assign(camera,{left:-half*w/h,right:half*w/h,top:half,bottom:-half});
    camera.position.set(12*Math.sin(yaw)*Math.cos(tilt)-.25,12*Math.sin(tilt)+.71,12*Math.cos(yaw)*Math.cos(tilt)+.49);
    camera.lookAt(-.25,.71,.49);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    if(w!==prevW||h!==prevH){renderer.setSize(w,h,false);prevW=w;prevH=h;}
  }
  function tagAt(id,p){
    const n=p.clone().project(camera),el=labels[id];
    el.style.left=(n.x+1)*50+'%';el.style.top=(1-n.y)*50+'%';
  }
  function renderModel(m){
    updateCamera();bench.apply(s,m);renderer.render(bench.scene,camera);
    for(const id of 'ABCD'){
      tagAt(id,bench.anchors[id].clone().add(new THREE.Vector3(0,.12,0)));
      labels[id].classList.toggle('hot',id===s.red);
    }
    tagAt('P',new THREE.Vector3(bench.carriage.position.x,2.09,0));
  }
  const terminals={A:[83,166],B:[407,166],C:[83,77],D:[407,77]};
  function diagram(m){
    const x=110+270*m.x,xa=110+270*m.start,xb=110+270*m.end;
    function lead(id,wire){
      const [tx,ty]=terminals[id],edge=wire==='red'?32:456;
      const y=wire==='red'?ty-12:ty+12;
      return 'M'+tx+' '+ty+'v'+(y-ty)+'H'+edge+'V233H'+(wire==='red'?188:340);
    }
    const ends=Object.entries(terminals).map(([id,[px,py]])=>'<g data-terminal="'+id+'" style="cursor:pointer"><circle cx="'+px+'" cy="'+py+'" r="14" fill="#f4efe2"/><circle cx="'+px+'" cy="'+py+'" r="6" fill="'+(id===s.red?'#ac482d':id===s.blue?'#346980':'#444f49')+'"/><text x="'+px+'" y="'+(py-15)+'" text-anchor="middle">'+id+'</text></g>').join('');
    const segments='<g stroke-width="3" stroke="#445950" fill="none"><path d="M83 77H407 M83 166H110 M380 166H407"/><rect x="110" y="158" width="270" height="16"/><path d="M'+x+' 77V153m-6 -7l6 7 6-7"/></g>';
    plan.innerHTML='<svg viewBox="0 0 490 270" aria-label="变阻器内部接线和串联电路"><g fill="none" stroke-width="3"><path d="'+lead(s.red,'red')+'" stroke="#af5133"/><path d="'+lead(s.blue,'blue')+'" stroke="#3a657d"/></g>'+segments+'<rect x="'+xa+'" y="159" width="'+(xb-xa)+'" height="14" fill="#d89343"/><g data-p="1" style="cursor:ew-resize"><rect x="'+(x-17)+'" y="66" width="34" height="90" fill="transparent"/><rect x="'+(x-10)+'" y="69" width="20" height="16" rx="3" fill="#a94d31"/><text x="'+x+'" y="56" text-anchor="middle">P</text></g>'+ends+'<g fill="none" stroke="#354d40" stroke-width="3"><path d="M188 219v28m8-20v12m0-6h24m0 0l28 '+(s.power?'0':'-15')+'m0 '+(s.power?'0':'15')+'h44m30 0h18"/><circle cx="307" cy="233" r="15" fill="'+(s.power?'rgba(241,168,58,'+(.18+.78*m.brightness)+')':'none')+'"/><path d="m297 223 20 20m0-20-20 20"/></g><text x="165" y="225">+</text><text x="189" y="264">6 V</text><text x="19" y="29" fill="#526655">铜色：接入电路的电阻丝</text></svg>';
  }
  function gauge(a){
    // Printed scale spans a 120-degree arc, zero at the left.
    const pt=(v,r)=>{const t=(150-120*v)*Math.PI/180;return [110+r*Math.cos(t),102-r*Math.sin(t)];};
    let ticks='';
    for(let i=0;i<=25;i++){const a=pt(i/25,78),b=pt(i/25,i%5===0?67:73);
      ticks+='<path d="M'+a.join(' ')+'L'+b.join(' ')+'" stroke="#58685c"/>';
      if(i%5===0){const t=pt(i/25,55);ticks+='<text x="'+t[0]+'" y="'+t[1]+'" font-size="10" text-anchor="middle" fill="#3d5146">'+(i/50).toFixed(1)+'</text>';}}
    const end=pt(Math.min(1,a/.5),77);
    $('dial').innerHTML=ticks+'<text x="110" y="75" text-anchor="middle" font-size="18" fill="#294238">A</text><path d="M110 102L'+end.join(' ')+'" stroke="#bb5839" stroke-width="2.8"/><circle cx="110" cy="102" r="4.5" fill="#394c41"/>';
  }
  function draw(){
    const m=model();$('pos').value=s.position;$('wireA').value=s.red;$('wireB').value=s.blue;
    $('position').textContent=s.position+'%';$('amp').textContent=m.current.toFixed(3);$('ohm').textContent=m.resistance.toFixed(2);
    $('reason').textContent=(s.power?'':'开关断开，电流为零。')+m.path;
    $('power').textContent=s.power?'断开开关':'闭合开关';gauge(m.current);
    $('hint').textContent=held?'已拿起'+(held==='red'?'红':'蓝')+'线，点目标接线柱插入。':
      mode==='physical'?'拖 P 调阻 · 点已接线柱换线 · 拖背景环视 · 滚轮缩放':'拖 P 调阻 · 点已接线柱，再点目标柱换线';
    if(mode==='physical'&&renderer)renderModel(m);else diagram(m);
  }
  function switchMode(next){mode=next;view.hidden=mode!=='physical';plan.hidden=mode!=='plan';
    $('physical').setAttribute('aria-pressed',String(mode==='physical'));$('schematic').setAttribute('aria-pressed',String(mode==='plan'));draw();}
  function setRay(e){const r=stage.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2(2*(e.clientX-r.left)/r.width-1,1-2*(e.clientY-r.top)/r.height),camera);}
  function coordinate(e){
    if(mode==='plan'){const svg=plan.firstElementChild;return (new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse()).x-110)/270*100;}
    setRay(e);const p=ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-drag.height),new THREE.Vector3());
    return p?(p.x-leftEnd)/span*100:s.position;
  }
  function hit(e){
    setRay(e);return ray.intersectObjects([bench.carriage,bench.key,...Object.values(bench.terminals)],true)[0];
  }
  function terminalFor(o){for(;o;o=o.parent){for(const [id,t] of Object.entries(bench.terminals))if(o===t)return id;}return '';}
  stage.addEventListener('pointerdown',e=>{
    if(e.target.closest('button')||drag)return;
    let kind='camera',height=1.8;
    if(mode==='plan'){const term=e.target.closest('[data-terminal]');if(term){pickTerminal(term.dataset.terminal);return;}if(!e.target.closest('[data-p]'))return;kind='slider';}
    else{const h=hit(e);if(h){const id=terminalFor(h.object);if(id){pickTerminal(id);return;}
      if(h.object===bench.key||h.object.parent===bench.key){s.power=!s.power;draw();return;}
      kind='slider';height=h.point.y;}}
    drag={id:e.pointerId,kind,height,x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId);
    if(kind==='slider'){held='';drag.offset=s.position-coordinate(e);}
  });
  stage.addEventListener('pointermove',e=>{
    if(!drag){if(mode==='physical'&&!e.target.closest('button'))stage.style.cursor=hit(e)?'grab':'move';return;}
    if(drag.id!==e.pointerId)return;
    if(drag.kind==='slider')position(coordinate(e)+drag.offset);
    else{yaw-=(e.clientX-drag.x)*.008;tilt=Math.min(1.32,Math.max(.21,tilt+(e.clientY-drag.y)*.006));draw();}
    drag.x=e.clientX;drag.y=e.clientY;
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(type,e=>{if(drag?.id===e.pointerId)drag=null;});
  stage.addEventListener('wheel',e=>{if(mode!=='physical')return;e.preventDefault();zoom=Math.min(1.7,Math.max(.75,zoom*Math.exp(-e.deltaY*.0012)));draw();},{passive:false});
  for(const [id,wire] of [['wireA','red'],['wireB','blue']]){
    const el=$(id);for(const name of 'ABCD')el.add(new Option(name,name));
    el.onchange=()=>moveWire(wire,el.value);
  }
  $('pos').oninput=e=>position(+e.target.value);$('power').onclick=()=>{s.power=!s.power;draw();};
  $('schematic').onclick=()=>switchMode('plan');$('physical').onclick=()=>switchMode('physical');
  $('next').onclick=()=>{taskIndex=(taskIndex+1)%tasks.length;$('task').textContent=tasks[taskIndex];};
  $('reset').onclick=()=>{Object.assign(s,init);held='';yaw=.15;tilt=.49;zoom=1;taskIndex=0;$('task').textContent=tasks[0];switchMode(renderer?'physical':'plan');};
  try{
    renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor(0xe6e3d8);
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;
    camera=new THREE.OrthographicCamera(-4,4,3,-3,.1,80);bench=makeBench();view.append(renderer.domElement);
    for(const id of 'ABCDP'){const t=document.createElement('span');t.className='tag';t.textContent=id==='P'?'P · 拖动':id;view.append(t);labels[id]=t;}
  }catch(err){renderer=null;$('physical').disabled=true;$('physical').textContent='3D 不可用';}
  switchMode(renderer?'physical':'plan');new ResizeObserver(draw).observe(stage);
})();
