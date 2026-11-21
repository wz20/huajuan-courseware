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
  svg.onpointerdown=e=>{if(e.button||!enabled())return;drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,id:e.target.closest('[data-atom]')?.dataset.atom,moved:false};svg.setPointerCapture(e.pointerId);};
  svg.onpointermove=e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>4)drag.moved=true;
    if(drag.moved){camera.yaw+=(e.clientX-drag.lastX)*.009;camera.pitch=Math.max(-1.35,Math.min(1.35,camera.pitch+(e.clientY-drag.lastY)*.008));draw();}
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
const M=WaterLesson, resetCamera={yaw:-.10,pitch:.06},camera={...resetCamera};
let t=0,selected='O1',mode='observe',playing=false,last=0,frame=0,coeff=[1,1,1];
const displayId=a=>a[0]+['','①','②','③','④'][+a[1]];
function atomBall(p,id,r,marked,interactive=true){
 const isO=id[0]==='O',element=id[0],token=id.length>1?displayId(id):element;
 return '<g '+(interactive?'data-atom="'+id+'" style="cursor:pointer"':'')+'>'+
  (marked?circle(p,r+6,'none','stroke="#ffe19e" stroke-width="2.4" stroke-dasharray="5 4"'):'')+
  circle(p,r,isO?'url(#o)':'url(#h)','stroke="'+(isO?'#ffb8a1':'#ebf5ef')+'" stroke-width="1.2"')+
  label([p[0],p[1]+1],token,interactive?15:12,isO?'#512f2d':'#28404b','font-weight="700"')+'</g>';
}
function project(a){
 const v=new THREE.Vector3(...a).applyEuler(new THREE.Euler(camera.pitch,camera.yaw,0,'XYZ'));
 return [340+1.37*v.x,179-1.37*v.y,v.z];
}
function observation(){
 const ps=M.positions(t).map(project),sel=M.atoms.findIndex(a=>a.id===selected);
 let parts=[];const links=(bonds,strength,old)=>{if(strength<=0)return;
   for(const [a,b] of bonds){const pair=[ps[a],ps[b]],double=old&&a===4&&b===5;
     const d=Math.hypot(pair[1][0]-pair[0][0],pair[1][1]-pair[0][1])||1;
     const offset=[-(pair[1][1]-pair[0][1])/d*3.8,(pair[1][0]-pair[0][0])/d*3.8];
     for(const f of double?[-1,1]:[0]){const seg=pair.map(p=>[p[0]+offset[0]*f,p[1]+offset[1]*f]);
       parts.push([(ps[a][2]+ps[b][2])/2-100,path(seg,'#e2eae1',double?4:6,'opacity="'+strength+'"')]);}}
 };
 links(M.initialBonds,Math.max(0,1-t/.40),true);links(M.finalBonds,Math.max(0,(t-.58)/.42),false);
 if(t>.015){const trail=[];for(let j=0;j<=28;j++)trail.push(project(M.positions(t*j/28)[sel]));parts.push([-150,path(trail,'#f4d9a3',2,'opacity=".72" stroke-dasharray="3 6"')]);}
 M.atoms.forEach((a,i)=>parts.push([ps[i][2],atomBall(ps[i],a.id,a.id[0]==='O'?34:24,i===sel)]));
 let slots=t===0?[[[0,1],'H₂'],[[2,3],'H₂'],[[4,5],'O₂']]:t===1?[[[0,2,4],'H₂O · 甲'],[[1,3,5],'H₂O · 乙']]:[];
 for(const [ids,text] of slots){const x=ids.reduce((s,i)=>s+ps[i][0],0)/ids.length,y=Math.max(...ids.map(i=>ps[i][1]+(i>=4?34:24)))+20;parts.push([200,label([x,y],text,15,'#b7d4d2','font-weight="550"')]);}
 $('drawing').innerHTML=parts.sort((a,b)=>a[0]-b[0]).map(x=>x[1]).join('');
 $('pct').textContent=Math.round(t*100)+'%';$('progress').value=Math.round(t*100);
 $('stageText').textContent=t===0?'反应物 · 三颗分子':t===1?'生成物 · 两颗水分子':'原子重新组合 · 示意';
 const a=M.atoms[sel];$('tracking').textContent=displayId(selected)+(t===0?' 在'+a.from+'中。':t===1?' 在水分子'+(a.to===1?'甲':'乙')+'中。':' 的位置用金圈标出，虚线是它已经走过的路线。');
 document.querySelectorAll('#picks button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===selected)));
}
function icon(form,x,y){
 const rel=form==='H₂'?[[-12,-5,'H'],[12,5,'H']]:form==='O₂'?[[-13,5,'O'],[13,-5,'O']]:[[-17,-10,'H'],[17,-10,'H'],[0,4,'O']];
 const nodes=rel.map(([a,b])=>[x+a,y+b]),bonds=rel.length===3?[[0,2],[1,2]]:[[0,1]];
 return bonds.map(([a,b])=>path([nodes[a],nodes[b]],'#d0dad4',5)).join('')+rel.map((p,i)=>atomBall(nodes[i],p[2],p[2]==='O'?13:9,false,false)).join('');
}
function balance(){
 const groups=[['H₂',coeff[0],164,111],['O₂',coeff[1],164,252],['H₂O',coeff[2],504,174]];
 let s=path([[340,50],[340,335]],'#799490',1,'stroke-dasharray="4 7"')+label([164,37],'反应物',18,'#e2efea')+label([504,37],'生成物',18,'#e2efea');
 for(const [form,n,x,y] of groups){for(let i=0;i<n;i++){const cols=Math.min(3,n),row=Math.floor(i/3),rowCount=Math.min(3,n-row*3);s+=icon(form,x+((i%3)-(rowCount-1)/2)*65,y+(row-(n>3?.5:0))*35);}
  s+=label([x,y+55],n+' × '+form,16,'#cce0dd');}
 $('drawing').innerHTML=s;const c=M.count(coeff),forms=['H₂','O₂','H₂O'];const term=i=>(coeff[i]===1?'':coeff[i])+forms[i];
 $('equation').textContent=term(0)+' + '+term(1)+' → '+term(2);$('tally').textContent='氢原子：左 '+c.left[0]+' · 右 '+c.right[0]+'　氧原子：左 '+c.left[1]+' · 右 '+c.right[1];
 $('feedback').textContent=c.simplest?'配平了！最简整数比是 2 ∶ 1 ∶ 2。':c.balanced?'两侧都守恒。还能把三个系数同时约小吗？':(c.left[0]!==c.right[0]?'氢':'氧')+'原子数还没对上。';
 coeff.forEach((n,i)=>{$('n'+i).textContent=n;$('m'+i).disabled=n<=1;$('p'+i).disabled=n>=6;});
}
function draw(){if(mode==='observe')observation();else balance();}
function stop(){playing=false;cancelAnimationFrame(frame);$('play').textContent='播放重组';}
function animate(now){if(!playing)return;t=Math.min(1,t+(now-last)/5400);last=now;draw();if(t===1)stop();else frame=requestAnimationFrame(animate);}
function go(v){stop();t=v;draw();}
function pick(id){selected=id;draw();}
M.atoms.forEach(a=>{const b=document.createElement('button');b.dataset.id=a.id;b.textContent=displayId(a.id);b.onclick=()=>pick(a.id);$('picks').append(b);});
['H₂','O₂','H₂O'].forEach((f,i)=>{const row=document.createElement('div');row.className='steppers';row.innerHTML='<strong>'+f+'</strong><div class="keys"><button id="m'+i+'" aria-label="减少 '+f+'">−</button><output id="n'+i+'"></output><button id="p'+i+'" aria-label="增加 '+f+'">＋</button></div>';$('counters').append(row);
 [-1,1].forEach(d=>$(d<0?'m'+i:'p'+i).onclick=()=>{coeff[i]=Math.max(1,Math.min(6,coeff[i]+d));draw();});});
function switchTo(next){stop();mode=next;const obs=next==='observe';$('observe').hidden=!obs;$('balance').hidden=obs;$('tabA').setAttribute('aria-pressed',obs);$('tabB').setAttribute('aria-pressed',!obs);$('camera').hidden=!obs;$('orbitHelp').hidden=!obs;$('sceneTitle').textContent=obs?'分子模型':'两侧分子清单';$('sceneSub').textContent=obs?'球棍视图':'按当前系数显示';draw();}
$('tabA').onclick=()=>switchTo('observe');$('tabB').onclick=()=>switchTo('balance');$('progress').oninput=e=>go(+e.target.value/100);
$('start').onclick=()=>go(0);$('end').onclick=()=>go(1);$('resetCount').onclick=()=>{coeff=[1,1,1];draw();};
$('play').onclick=()=>{if(playing)return stop();if(t===1)t=0;playing=true;last=performance.now();$('play').textContent='暂停';frame=requestAnimationFrame(animate);};
initOrbit(camera,resetCamera,draw,pick,()=>mode==='observe');switchTo('observe');
