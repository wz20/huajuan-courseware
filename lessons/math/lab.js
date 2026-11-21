const $=id=>document.getElementById(id);
const poly=(points,attrs)=>'<polygon points="'+points.map(p=>p[0].toFixed(2)+','+p[1].toFixed(2)).join(' ')+'" '+attrs+'/>';
function path(points,color,width=2,more=''){
  const d=points.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' ');
  return '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round" stroke-linejoin="round" '+more+'/>';
}
function circle(p,r,fill,more=''){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+r+'" fill="'+fill+'" '+more+'/>';}
function label(p,text,size,fill,more=''){return '<text x="'+p[0]+'" y="'+p[1]+'" text-anchor="middle" dominant-baseline="middle" font-size="'+size+'" fill="'+fill+'" '+more+'>'+text+'</text>';}
function initOrbit(camera,reset,draw,pick,enabled){
  const svg=$('view');let drag;
  svg.onpointerdown=e=>{if(e.button||!enabled())return;drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,id:e.target.closest('[data-atom]')?.dataset.atom,moved:false,slide:e.target.closest("[data-slice]")!==null};svg.setPointerCapture(e.pointerId);};
  svg.onpointermove=e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>4)drag.moved=true;
    if(drag.moved&&drag.slide){const heightScale=5*370/(240*Math.max(180,svg.getBoundingClientRect().height));inputHeight((drag.lastY-e.clientY)*heightScale);draw();}
    else if(drag.moved){camera.yaw+=(e.clientX-drag.lastX)*.009;camera.pitch=Math.max(-1.35,Math.min(1.35,camera.pitch+(e.clientY-drag.lastY)*.008));draw();}
    drag.lastX=e.clientX;drag.lastY=e.clientY;};
  svg.onpointerup=()=>{if(drag&&!drag.moved&&drag.id)pick(drag.id);drag=null;};svg.onpointercancel=()=>drag=null;
  svg.onkeydown=e=>{if(!enabled()||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();
    if(e.key==='Home')Object.assign(camera,reset);
    if(e.key==='ArrowLeft')camera.yaw-=.12;if(e.key==='ArrowRight')camera.yaw+=.12;
    if(e.key==='ArrowUp')camera.pitch=Math.max(-1.35,camera.pitch-.12);if(e.key==='ArrowDown')camera.pitch=Math.min(1.35,camera.pitch+.12);draw();};
  $('camera').onclick=()=>{Object.assign(camera,reset);draw();};
  $('present').onclick=()=>{const on=document.body.classList.toggle('present');$('present').textContent=on?'展开讲解':'收起讲解';};
  $('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{if(!document.body.classList.contains('present'))$('present').click();}};
  document.addEventListener('fullscreenchange',()=>{$('full').textContent=document.fullscreenElement?'退出全屏':'全屏';});
}
const M=SurfaceLesson,tau=2*Math.PI,resetCamera={yaw:.71,pitch:.35},camera={...resetCamera};
let sectionMode=false,angle=115,height=1;
function project([x,y,z]){
 const cos=Math.cos(camera.yaw),sin=Math.sin(camera.yaw),rear=x*sin+y*cos;
 const tilt=camera.pitch,sc=Math.min(68,158/(2.75*Math.cos(tilt)+3.05*Math.abs(Math.sin(tilt))));
 return [331+sc*(x*cos-y*sin),187-sc*((z-1.65)*Math.cos(tilt)+rear*Math.sin(tilt)),z*Math.sin(tilt)-rear*Math.cos(tilt)];
}
const P=(r,t)=>M.point(r,t);
function series(n,f){return Array.from({length:n+1},(_,i)=>f(i/n));}
function curve(n,f,col,w,attrs=''){return path(series(n,v=>project(f(v))),col,w,attrs);}
function surface(theta){
 if(theta===0)return '';
 const n=Math.max(1,Math.ceil(theta/tau*56)),bands=10,faces=[];
 for(let j=0;j<n;j++){
   const t1=theta*j/n,t2=theta*(j+1)/n;
   for(let k=0;k<bands;k++){const r1=2*k/bands,r2=2*(k+1)/bands;
     const pts=[P(r1,t1),P(r2,t1),P(r2,t2),P(r1,t2)].map(project);
     const light=.5+.5*Math.cos((t1+t2)/2-.5);
     const c=[45+51*light,125+60*light,129+45*light].map(Math.round).join(',');
     faces.push([pts.reduce((v,p)=>v+p[2],0)/4,poly(pts,'fill="rgb('+c+')" fill-opacity=".43"')]);
   }
 }
 let s=faces.sort((a,b)=>a[0]-b[0]).map(v=>v[1]).join('');
 for(let r=.4;r<2.01;r+=.4)s+=curve(n,v=>P(r,theta*v),'#83d9cd',r>1.95?2.3:1,'opacity=".72"');
 for(let a=0;a<theta-1e-6;a+=tau/16)s+=curve(16,v=>P(2*v,a),'#93d3ce',1.1,'opacity=".60"');
 return s;
}
function axes(){
 let s='';for(let i=-2;i<=2;i++){
   s+=path([project([i,-2,0]),project([i,2,0])],'#5f7e83',1,'opacity=".50"');
   s+=path([project([-2,i,0]),project([2,i,0])],'#5f7e83',1,'opacity=".50"');
 }
 for(const [name,a,b] of [['x',[-2.6,0,0],[3.1,0,0]],['y',[0,-2.6,0],[0,3.1,0]],['z',[0,0,-1],[0,0,4.35]]]){
   const A=project(a),B=project(b);s+=path([A,B],'#c8dcd8',1.5);
   const d=Math.hypot(B[0]-A[0],B[1]-A[1])||1,u=(B[0]-A[0])/d,v=(B[1]-A[1])/d;
   s+=poly([B,[B[0]-9*u+3*v,B[1]-9*v-3*u],[B[0]-9*u-3*v,B[1]-9*v+3*u]],'fill="#c8dcd8"');
   s+=label([B[0]+11,B[1]],name,17,'#effbf6','font-style="italic"');}
 const O=project([0,0,0]);s+=label([O[0]-11,O[1]+9],'O',14,'#e0eeeb');
 for(const z of [1,2,3,4]){const p=project([0,0,z]);s+=path([[p[0]-3,p[1]],[p[0]+3,p[1]]],'#c8dcd8',1.3)+label([p[0]-12,p[1]],z,11,'#c8dcd8');}return s;
}
function topDown(th,sl){
 const center=[120,72],scale=27;
 let s='';for(let i=-2;i<=2;i++){s+=path([[120+i*scale,10],[120+i*scale,132]],'#d4ded2',1)+path([[55,72+i*scale],[185,72+i*scale]],'#d4ded2',1);}
 s+=path([[48,72],[194,72]],'#81978a',1.4)+path([[120,133],[120,7]],'#81978a',1.4)+label([202,73],'x',13,'#41594f')+label([131,12],'y',13,'#41594f');
 const xy=(r,t)=>[120+scale*r*Math.cos(t),72-scale*r*Math.sin(t)];
 if(!sectionMode){const arc=series(72,v=>xy(2,v*th));s+=poly([center,...arc],'fill="#6db9ac" fill-opacity=".34"')+path(arc,'#469282',1.8)+path([center,xy(2,th)],'#a35916',3);}
 else if(sl.kind==='circle'){s+=circle(center,scale*sl.radius,'#edb57655','stroke="#ad6d2f" stroke-width="2"');s+=path([center,xy(sl.radius,0)],'#9a551a',2);s+=label([120+scale*sl.radius/2,60],'r',13,'#8a491d');}
 s+=circle(center,sectionMode&&sl.kind==='point'?4:2,'#425c50');$('top').innerHTML=s;
}
function inputHeight(delta){
 height=Math.max(-1,Math.min(4,height+delta));$('value').value=height;
}
function fmt(v){return Number(v.toFixed(2)).toString();}
function draw(){
 const theta=sectionMode?tau:angle*Math.PI/180,sl=M.slice(height);let s=axes()+surface(theta);
 if(sectionMode){
   const corners=[[-2.15,-2.15],[2.15,-2.15],[2.15,2.15],[-2.15,2.15]].map(p=>project([...p,height]));
   s+=poly(corners,'fill="#ffd390" fill-opacity=".12" stroke="#eac08b" stroke-width="1.2" stroke-dasharray="5 5"');
   if(sl.kind==='point')s+=circle(project([0,0,0]),5,'#ffca83');
   if(sl.kind==='circle'){
     s+=curve(90,v=>P(sl.radius,v*tau),'#ffc078',3.6);
     s+=path([project([0,0,height]),project([sl.radius,0,height])],'#ffdcaa',2,'stroke-dasharray="5 4"');
   }
    const tip=project([2.15,-2.15,height]);
   s+='<g data-slice="true" style="cursor:ns-resize">'+circle(tip,12,'#5c4634','stroke="#ffd199" stroke-width="2"')+label([tip[0],tip[1]+1],'↕',17,'#ffe2bd')+'</g>';
 }else{
   s+=curve(35,v=>P(v*2,theta),'#ffbe79',4);s+=circle(project(P(2,theta)),5,'#ffd081');
 }
 $('drawing').innerHTML=s;topDown(theta,sl);
 const rim=P(2,theta);$('coordinates').textContent=sectionMode?(sl.kind==='empty'?'切面 z = '+fmt(height)+'，与曲面无交点。':('截面上的一点  ('+fmt(sl.radius)+', 0, '+fmt(height)+')')):('母线上端  ('+fmt(rim[0])+', '+fmt(rim[1])+', 4)');
 $('valueOut').textContent=sectionMode?'h = '+fmt(height):angle+'°';
 $('result').textContent=!sectionMode?(angle===0?'起点是 xz 平面内的一条半抛物线。':angle===360?'整圈闭合。到 z 轴距离相同的点，高度也相同。':'金线是此刻的母线，青绿色部分是它扫过的曲面。'):
   sl.kind==='empty'?'没有交点。曲面上任一点都满足 z ≥ 0。':sl.kind==='point'?'截面缩成原点。此时 x = y = 0，半径为 0。':'截面为圆。x² + y² = '+fmt(height)+'，半径 r '+(Math.abs(sl.radius-Number(fmt(sl.radius)))<1e-9?'= ':'≈ ')+fmt(sl.radius)+'。';
 document.querySelectorAll('#presets button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.v===(sectionMode?height:angle))));
}
function changeMode(isSection){
 sectionMode=isSection;$('tabA').setAttribute('aria-pressed',!isSection);$('tabB').setAttribute('aria-pressed',isSection);
 $('controlTitle').textContent=isSection?'平移水平面':'旋转半抛物线';$('sceneTitle').textContent=isSection?'切面与交线':'曲面生成';$('sceneSub').textContent='三维直角坐标系';$('gold').textContent=isSection?'截面':'母线';
 $('explain').textContent=isSection?'上下拖动金色把手或滑杆，观察切面与抛物面的交线。':'从 z = x² 的右半支出发，拖动角度，让它绕 z 轴扫过一圈。';
 $('valueLabel').textContent=isSection?'切面高度 h':'扫过角度';const input=$('value');input.min=isSection?-1:0;input.max=isSection?4:360;input.step=isSection?.05:1;input.value=isSection?height:angle;
 $('presets').replaceChildren();for(const n of isSection?[-1,0,1,2,4]:[0,90,180,270,360]){const b=document.createElement('button');b.textContent=isSection?'h='+n:n+'°';b.dataset.v=n;b.onclick=()=>{input.value=n;input.oninput();};$('presets').append(b);}draw();
}
$('tabA').onclick=()=>changeMode(false);$('tabB').onclick=()=>changeMode(true);
$('value').oninput=()=>{const n=+$('value').value;if(sectionMode)height=n;else angle=n;draw();};
initOrbit(camera,resetCamera,draw,()=>{},()=>true);changeMode(false);
