(()=>{
 const T=THREE,$=id=>document.getElementById(id),stage=$('stage'),work=$('work');
 let canvas=$('canvas'),renderer,soft;
 try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));}
 catch{const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;soft=softwareSurface(canvas);}
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-5,5,4,-4,.1,160),ray=new T.Raycaster();
 scene.add(new T.HemisphereLight(0xfffbea,0x829e95,1.27));
 for(const [x,y,z,intensity,color] of [[-4,9,6,2,0xfff2dd],[4,5,-6,1.35,0xd5eeed]]){const light=new T.DirectionalLight(color,intensity);light.position.set(x,y,z);if(x<0 && renderer?.shadowMap){renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-6,right:6,bottom:-6,top:6});light.shadow.bias=-.00030;light.shadow.normalBias=.015;}
 scene.add(light);}
 const cache=[],levels=[],sizes=[5.20,5.08,4.35,4.32], angles=[[.31,.76],[.29,.66],[.42,.40],[.27,.54]],keyPins=[['nucleus','vacuole','chloro'],['granum','stroma','outer'],['disc','bridge'],['lumen','psii','synth']];
 let level=0,model,st,activeModel=null,chosenObject=null,showLabels=true,showAside=true,W=0,H=0,queued=0;
 const temp=new T.Vector3(),center=new T.Vector3(),bounds=new T.Box3(),home=new T.Vector3(),eye=new T.Vector3();
 let soloBounds=null;
 function unitFor(o){for(let p=o;p&&p!==model.root;p=p.parent)if(p.userData.unit)return p;return null;}
 function isolate(){
   const focus=st.focused&&st.key!=='outside',selected=focus?rep(st.key):null;
   const unit=focus?unitFor(selected):null;
   soloBounds=null;
   for(const all of Object.values(model.parts))for(const o of all)o.visible=true;
   model.cover(st.open);
   if(!focus)return;
   soloBounds=new T.Box3().makeEmpty();
   for(const all of Object.values(model.parts))for(const o of all){
     let keep=unit?unitFor(o)===unit:o.userData.key===st.key;
     if(level===2&&st.key==='disc')keep=o.parent===selected.parent;
     if(st.key==='stroma'||st.key==='lumen'||st.key==='cytoplasm')keep=true;
     o.visible=o.visible&&keep;if(o.visible)soloBounds.expandByObject(o);
   }
 }
 function initial(i){return {key:plates[i].start,yaw:angles[i][0],pitch:angles[i][1],zoom:1,open:true,spacing:0,focused:false};}
 function change(i){
   if(i<0||i>=plates.length)return;
   if(activeModel)scene.remove(activeModel);
   level=i;model=cache[i]??=(specimen(i));st=levels[i]??=initial(i);chosenObject=null;
   activeModel=model.root;scene.add(activeModel);model.cover(st.open);model.separate(st.spacing);
   $('ask').open=false;buildNav();controls();draw();
 }
 function buildNav(){
   const crumbs=$('crumbs');crumbs.replaceChildren();
   plates.forEach((p,i)=>{if(i){const sp=document.createElement('span');sp.textContent='›';sp.className='sep';crumbs.append(sp);}
     const b=document.createElement('button');b.textContent=p.name;if(i===level)b.setAttribute('aria-current','step');b.onclick=()=>change(i);crumbs.append(b);});
   const list=$('list');list.replaceChildren();
   for(const [key,part] of Object.entries(plates[level].parts)){
     const b=document.createElement('button');b.dataset.key=key;
     const dot=document.createElement('i');dot.className='dot';dot.style.background='#'+pigments[key].toString(16).padStart(6,'0');b.append(dot,document.createTextNode(part[0]));
     if(part[2]!=null){let arrow=document.createElement('em');arrow.textContent='›';b.append(arrow);}
     b.onclick=()=>pick(key,false);list.append(b);
   }
 }
 function controls(){
   isolate();
   const plate=plates[level],part=plate.parts[st.key];
   $('sceneTitle').textContent=plate.sub;$('count').textContent=Object.keys(plate.parts).length+' 项';
   $('partName').textContent=part[0];$('partText').textContent=part[1];
   $('enter').hidden=part[2]==null;if(part[2]!=null)$('enter').textContent='进入'+plates[part[2]].name+'模型 →';
   $('question').textContent='课堂提问：'+plate.ask;$('answer').textContent=plate.answer;
   $('cut').hidden=level===2;$('cut').textContent=st.open?'合上剖面':'打开剖面';
   $('focus').textContent=st.focused?'回到全貌':'单独观察';$('focus').setAttribute('aria-pressed',String(st.focused));
   $('labels').setAttribute('aria-pressed',String(showLabels));$('sidebar').setAttribute('aria-pressed',String(showAside));
   $('aside').hidden=!showAside;work.classList.toggle('wide',!showAside);
   $('up').disabled=level===0;$('spacingWrap').hidden=level!==2;$('spacing').value=st.spacing*100;
   $('list').querySelectorAll('button').forEach(b=>{const on=b.dataset.key===st.key;b.classList.toggle('chosen',on);b.setAttribute('aria-pressed',String(on));});
   for(const [k,all] of Object.entries(model.parts))for(const o of all){o.material.emissive.setHex(k===st.key?0x779656:0x000000);o.material.emissiveIntensity=k===st.key?.17:0;}
 }
 function pick(k,drill,o=null){
   const entry=plates[level].parts[k];if(!entry)return;
   if(drill&&entry[2]!=null){change(entry[2]);return;}
   st.key=k;chosenObject=o;st.focused=false;st.zoom=1;
   if(!st.open && !['wall','outer','thylMem'].includes(k)){st.open=true;model.cover(true);}
   controls();draw();
 }
 function rep(k){
   if(k===st.key&&chosenObject?.visible)return chosenObject;
   const all=model.parts[k];if(k==='chloro')return all.find(o=>o.parent.position.z>1.5&&o.parent.userData.unit==='chloro')||all[0];
   if(k==='granum')return all.find(o=>o.parent.parent.position.z>.7&&o.parent.position.y>.35)||all[0];
   if(k==='disc')return all.filter(o=>o.userData.discLayer!=null).at(-1);
   return all.find(o=>o.visible)||all[0];
 }
 function anchor(k){
   if(k==="outside")return new T.Vector3(2.16,1.02,-.24);
   const o=rep(k);bounds.setFromObject(o);bounds.getCenter(temp);
   const custom={wall:[.25,0,3.03],membrane:[3.5,0,2.21],cytoplasm:[-1.7,.0,2.6],tonoplast:[1.13,.42,1.59],outer:[.3,0,2.61],inner:[3.9,0,1.08],stroma:[.20,-.02,1.65],thylMem:[.4,0,2.02],lumen:[.25,-.03,.75]};
   if(custom[k])temp.fromArray(custom[k]);return temp.clone();
 }
 function cameraPose(){
   model.root.updateMatrixWorld(true);center.copy(st.focused?anchor(st.key):home);
   let half=Math.max(sizes[level]/(W/H),level===2?2.83+st.spacing*.65:level===3?2.42:level===0?2.88:2.63)/st.zoom;
   if(soloBounds&&!soloBounds.isEmpty()){
     soloBounds.getCenter(center);const size=soloBounds.getSize(new T.Vector3());
     half=Math.max(.09,Math.hypot(size.x,size.z)*.54/(W/H),Math.hypot(size.y,Math.hypot(size.x,size.z)*Math.sin(st.pitch))*.57)/st.zoom;
   }
   Object.assign(camera,{left:-half*W/H,right:half*W/H,top:half,bottom:-half});
   eye.set(Math.sin(st.yaw)*Math.cos(st.pitch),Math.sin(st.pitch),Math.cos(st.yaw)*Math.cos(st.pitch));
   camera.position.copy(center).addScaledVector(eye,20);camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 }
 function pins(){
   const pinBox=$('pins'),leads=$('leads');pinBox.replaceChildren();leads.replaceChildren();if(!showLabels)return;
   let ks=st.open||level===2?[st.key,...keyPins[level]]:[[ 'wall','outer','disc','thylMem'][level]];
   if(st.focused)ks=[st.key];const used=[];
   for(const key of new Set(ks)){
     const a=anchor(key).project(camera),px=(1+a.x)*W/2,py=(1-a.y)*H/2;
     if(px<0||px>W||py<0||py>H)continue;
     const b=document.createElement('button');b.className='pin'+(key===st.key?' sel':'');b.textContent=plates[level].parts[key][0]+(plates[level].parts[key][2]!=null?' ›':'');
     b.onclick=()=>pick(key,true);pinBox.append(b);
     const bw=b.offsetWidth||65,bh=b.offsetHeight||27,side=px<W/2?-1:1;
     const x=Math.max(3,Math.min(W-bw-3,px+side*Math.min(64,W*.075)-(side<0?bw:0)));
     let y=Math.max(31,Math.min(H-bh-3,py-43));for(let j=0;j<5&&used.some(r=>x<r.x+r.w+3&&x+bw+3>r.x&&Math.abs(y-r.y)<bh+3);j++)y=y+bh+4>H-bh?Math.max(3,y-2*(bh+4)):y+bh+4;
     b.style.left=x+'px';b.style.top=y+'px';used.push({x,y,w:bw});
     const svg='http://www.w3.org/2000/svg',line=document.createElementNS(svg,'line'),dot=document.createElementNS(svg,'circle');
     for(const [k,v] of Object.entries({x1:px,y1:py,x2:x+bw/2,y2:y+bh/2,stroke:'#c1d8c7','stroke-width':1.25}))line.setAttribute(k,v);
     for(const [k,v] of Object.entries({cx:px,cy:py,r:3,fill:'#fffada',stroke:'#648c77'}))dot.setAttribute(k,v);
     leads.append(line,dot);
   }
 }
 function draw(){if(!model||!W||!H)return;cameraPose();if(renderer)renderer.render(scene,camera);else soft.draw(model.root,camera);pins();}
 function schedule(){if(!queued)queued=requestAnimationFrame(()=>{queued=0;draw();});}
 function resize(){let w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;if(w!==W||h!==H){W=w;H=h;if(renderer)renderer.setSize(w,h,false);else soft.resize(w,h);}schedule();}
 function zoom(v){st.zoom=Math.max(.65,Math.min(6,st.zoom*v));schedule();}
 function pose(){Object.assign(st,{yaw:angles[level][0],pitch:angles[level][1],zoom:1,focused:false});controls();draw();}
 function hit(x,y){const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,1-2*(y-r.top)/r.height),camera);
   const visible=[];model.root.traverseVisible(o=>{if(o.isMesh)visible.push(o);});
   return ray.intersectObjects(visible,false)[0]?.object;
 }
 const pointers=new Map();let down=null,spread=0;
 const distance=()=>{const [a,b]=[...pointers.values()];return Math.hypot(a.x-b.x,a.y-b.y);};
 canvas.onpointerdown=e=>{if(e.button>0)return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pointers.size===1)down={x:e.clientX,y:e.clientY,moved:false};else{down.moved=true;spread=distance();}};
 canvas.onpointermove=e=>{const prev=pointers.get(e.pointerId);if(!prev)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pointers.size===2){const d=distance();if(spread>1)zoom(d/spread);spread=d;return;}
   if(!down)return;if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>4)down.moved=true;
   if(down.moved){st.yaw-=(e.clientX-prev.x)*.009;st.pitch=Math.max(-1.47,Math.min(1.47,st.pitch+(e.clientY-prev.y)*.009));schedule();}};
 function release(e){if(!pointers.has(e.pointerId))return;const click=e.type==='pointerup'&&down&&!down.moved&&pointers.size===1;pointers.delete(e.pointerId);if(!pointers.size)down=null;if(click){const o=hit(e.clientX,e.clientY);if(o)pick(o.userData.key,true,o);}}
 canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=release;
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.0016));},{passive:false});
 canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home'){pose();return;}if('+=-'.includes(e.key))zoom(e.key==='-'?.85:1.18);
     else{st.yaw+=e.key==='ArrowLeft'?-.14:e.key==='ArrowRight'?.14:0;st.pitch=Math.max(-1.47,Math.min(1.47,st.pitch+(e.key==='ArrowUp'?.11:e.key==='ArrowDown'?-.11:0)));schedule();}}};
 $('cut').onclick=()=>{st.open=!st.open;model.cover(st.open);if(!st.open){st.key=['wall','outer','disc','thylMem'][level];st.focused=false;st.zoom=1;chosenObject=null;}controls();draw();};
 $('focus').onclick=()=>{st.focused=!st.focused;st.zoom=st.focused&&st.key==="outside"?1.5:1;controls();draw();};
 $('spacing').oninput=e=>{st.spacing=+e.target.value/100;model.separate(st.spacing);schedule();};
 $('plus').onclick=()=>zoom(1.23);$('minus').onclick=()=>zoom(1/1.23);$('home').onclick=pose;
 $('enter').onclick=()=>{const next=plates[level].parts[st.key][2];if(next!=null)change(next);};
 $('up').onclick=()=>change(level-1);$('labels').onclick=()=>{showLabels=!showLabels;controls();draw();};
 $('sidebar').onclick=()=>{showAside=!showAside;controls();resize();};
 function syncFull(){$('full').textContent=document.fullscreenElement||work.classList.contains('present')?'退出投影':'全屏投影';resize();}
 $('full').onclick=async()=>{if(document.fullscreenElement)await document.exitFullscreen();else if(work.classList.contains('present'))work.classList.remove('present');else try{await work.requestFullscreen();}catch{work.classList.add('present');}syncFull();};
 document.addEventListener('fullscreenchange',syncFull);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&work.classList.contains('present')){work.classList.remove('present');syncFull();}});
 new ResizeObserver(resize).observe(stage);resize();change(0);
})();
