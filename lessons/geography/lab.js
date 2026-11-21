(() => {
'use strict';
const D=Daylight, $=id=>document.getElementById(id), rad=D.rad;
const places=[['北京',40,116.4],['赤道',0,0],['悉尼',-34,151.2],['70°N',70,20]];
const state={season:1,lat:40,lon:116.4,place:0,minutes:540,yaw:-61,pitch:17};
const canvas=$('globe'),ctx=canvas.getContext('2d'),sphere=document.createElement('canvas'),stone=sphere.getContext('2d');
const mask=Uint8Array.from(atob($('land-mask').textContent.trim()),c=>c.charCodeAt(0));
let size,geometry,rot,basis,sunVec,raf=0,playing=false,startAt=0,startTime=0,queued=false;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function latName(p){return p===0?'0°':Math.abs(p)+'°'+(p>0?'N':'S');}
function timeAngle(){return (state.minutes/60-12)*15;}
function placeName(){return state.place<0?'观测点':state.place===0?'北京附近':state.place===2?'悉尼附近':places[state.place][0];}
function camera(){
 const t=state.yaw*rad,p=state.pitch*rad;
 return {front:D.normal(state.pitch,state.yaw),east:[-Math.sin(t),0,-Math.cos(t)],up:[-Math.sin(p)*Math.cos(t),Math.cos(p),Math.sin(p)*Math.sin(t)]};
}
function setupGeometry(){
 const w=canvas.clientWidth||680,h=canvas.clientHeight||360,dpr=Math.min(window.devicePixelRatio||1,2);
 const r=Math.min(h*.394,w*.31),res=Math.max(80,Math.min(480,Math.round(2*r*dpr)));
 const key=[res,state.pitch,state.yaw].join('/');
 size={w,h,r,x:w*.49,y:h*.51,dpr};basis=camera();
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 if(geometry?.key===key)return;
 sphere.width=res;sphere.height=res;
 const im=stone.createImageData(res,res),total=res*res,latRow=new Int32Array(total),lonCol=new Uint16Array(total),nx=new Float32Array(total),ny=new Float32Array(total),zbuf=new Float32Array(total);
 latRow.fill(-1);
 const {front,east,up}=basis;
 for(let j=0;j<res;j++)for(let i=0;i<res;i++){
   const x=(i+.5)*2/res-1,y=1-(j+.5)*2/res,q=1-x*x-y*y;if(q<0)continue;
   const z=Math.sqrt(q),idx=j*res+i;
   const a=x*east[0]+y*up[0]+z*front[0],b=x*east[1]+y*up[1]+z*front[1],c=x*east[2]+y*up[2]+z*front[2];
   nx[idx]=a;ny[idx]=b;zbuf[idx]=z;
   latRow[idx]=clamp(Math.floor((.5-Math.asin(clamp(b,-1,1))/Math.PI)*512),0,511)*1024;
   lonCol[idx]=Math.floor(512+Math.atan2(-c,a)*512/Math.PI)&1023;
 }
 geometry={key,im,latRow,lonCol,nx,ny,zbuf};
}
function texture(){
 const {im,latRow,lonCol,nx,ny,zbuf}=geometry,data=im.data;
 // In the Sun-fixed frame the terrestrial meridian rotates eastward.
 const offset=Math.round(rot*1024/360),sx=sunVec[0],sy=sunVec[1];
 const landDay=[159,186,145],landNight=[54,80,86],seaDay=[74,145,160],seaNight=[28,60,82];
 for(let i=0;i<latRow.length;i++){
   if(latRow[i]<0)continue;const idx=latRow[i]+((lonCol[i]-offset)&1023),land=(mask[idx>>3]>>(7-(idx&7)))&1;
   const light=nx[i]*sx+ny[i]*sy,day=light>=0,shade=day?.79+.21*Math.sqrt(light):.68+.18*(light+1);
   const rim=(1-zbuf[i])**3;
   const palette=land?(day?landDay:landNight):(day?seaDay:seaNight);
   const k=i*4;data[k]=palette[0]*shade+rim*12;data[k+1]=palette[1]*shade+rim*19;data[k+2]=palette[2]*shade+rim*20;data[k+3]=255;
 }
 stone.putImageData(im,0,0);
}
function proj(v,r=1){return [size.x+size.r*r*dot(v,basis.east),size.y-size.r*r*dot(v,basis.up),dot(v,basis.front)];}
function stroke(points,color,width,dash=[]){
 if(points.length<2)return;
 ctx.beginPath();for(let i=0;i<points.length;i++){const p=points[i];if(!i)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);}
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);
}
function curve(fn,style,n=144){
 let run=[],key='';
 const flush=()=>{if(run.length>1){const [col,w,d]=style(key);stroke(run,col,w,d);}run=[];};

 for(let i=0;i<=n;i++){const v=fn(i/n),p=proj(v),next=dot(v,sunVec)>=0?'day':'night';
   if(p[2]<-.001){if(run.length)flush();continue;}
   if(run.length&&next!==key){run.push(p);flush();run=[p];}
   else run.push(p);
   key=next;
 }flush();
}
function text(s,x,y,color,font='12px system-ui',align='center'){
 ctx.font=font;ctx.textAlign=align;ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle='#142a36';ctx.strokeText(s,x,y);ctx.fillStyle=color;ctx.fillText(s,x,y);
}
function circle(x,y,r,color,edge,width=1){
 ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);if(color){ctx.fillStyle=color;ctx.fill();}
 if(edge){ctx.strokeStyle=edge;ctx.lineWidth=width;ctx.stroke();}
}
function solarArrows(){
 let x=dot(sunVec,basis.east),y=-dot(sunVec,basis.up),len=Math.hypot(x,y);if(len<.12)return;
 x/=len;y/=len;const side=Math.min(size.w*.5-size.r-8,size.r*.56);
 for(const shift of [-.16,0,.16]){
   const k=shift*size.r,end=[size.x+x*(size.r+7)-y*k,size.y+y*(size.r+7)+x*k],start=[end[0]+x*side,end[1]+y*side];
   if(start[1]<8||start[1]>size.h-8)continue;
   stroke([start,end],'#f4ce8c',1.6);stroke([[end[0]+x*6-y*3,end[1]+y*6+x*3],end,[end[0]+x*6+y*3,end[1]+y*6-x*3]],'#f4ce8c',1.5);
 }
 const tx=clamp(size.x+x*(size.r+side*.6),25,size.w-25),ty=clamp(size.y+y*(size.r+side*.6)-size.r*.26,12,size.h-10);
 text('太阳光',tx,ty,'#f9d595');
}
function draw(){
 queued=false;setupGeometry();
 rot=timeAngle()-state.lon;const dec=D.seasons[state.season].dec;sunVec=D.normal(dec,0);
 texture();const {w,h,x,y,r,dpr}=size;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 ctx.save();ctx.setLineDash([2,6]);circle(x,y,r+8,null,'#50626b',.8);ctx.restore();
 ctx.drawImage(sphere,x-r,y-r,r*2,r*2);circle(x,y,r,null,'#a4c2be',1.1);
 for(let g=-150;g<=180;g+=30)curve(t=>D.normal(-90+180*t,g+rot),()=>['#c5d9cc5c',.7],70);
 for(const lat of [-66.56,-30,0,30,66.56])curve(t=>D.normal(lat,360*t),()=>[lat===0?'#e0e8d1a1':'#c5d9cc69',lat===0?1.35:.8,lat===0?[]:[2,3]]);
 const b=[-Math.sin(dec*rad),Math.cos(dec*rad),0];
 curve(t=>{const a=t*2*Math.PI;return [b[0]*Math.cos(a),b[1]*Math.cos(a),Math.sin(a)];},()=>['#edf4e2',2.25],216);
 curve(t=>D.normal(state.lat,360*t),k=>k==='day'?['#ffd171',3.9,[]]:['#75c9fb',3.4,[5,4]],360);
 for(const s of [-1,1]){const a=proj([0,s,0]),tip=proj([0,s,0],1.13);let start=a;
   if(a[2]<0){const dx=tip[0]-x,dy=tip[1]-y,dist=Math.hypot(dx,dy);if(dist<=r+1)continue;start=[x+dx*r/dist,y+dy*r/dist];}
   stroke([start,tip],'#e6e8d8',1.4);text(s===1?'N':'S',tip[0]+8,clamp(tip[1],8,h-8),'#e2ecda','bold 12px system-ui');}
 const point=proj(D.normal(state.lat,timeAngle()));const visible=point[2]>=-.001;
 if(visible){circle(point[0],point[1],8,'#162d35','#fff3bc',2);circle(point[0],point[1],3.5,'#ffc973');const dx=point[0]<x?1:-1;const lx=point[0]+dx*20,ly=point[1]-17;stroke([[point[0]+dx*5,point[1]-4],[lx,ly]],'#fff1ca',1);text(placeName(),lx+dx*3,ly,'#fff1d6','bold 13px system-ui',dx===1?'left':'right');}
 solarArrows();
 if(!visible)text('观测点在球背面',12,h-14,'#bccece','12px system-ui','left');
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(draw);}}
function stop(){playing=false;cancelAnimationFrame(raf);$('play').textContent='播放一天';$('play').setAttribute('aria-pressed','false');}
function animate(now){
 if(!playing)return;
 const f=Math.min(1,(now-startTime)/11500),next=startAt+f*1440;
 state.minutes=f===1?startAt:(next%1440);updateTime();draw();
 if(f===1)stop();else raf=requestAnimationFrame(animate);
}
function updateTime(){
 const sun=D.sunHeight(state.lat,D.seasons[state.season].dec,state.minutes/60);
 $('now').textContent=D.clock(state.minutes/60)+' · '+(Math.abs(sun)<1e-8?'晨昏线上':sun>0?'白昼':'黑夜');
 $('time').value=Math.round(state.minutes);
 $('time').setAttribute('aria-valuetext',D.clock(state.minutes/60)+' 地方太阳时');
}
function update(){
 const se=D.seasons[state.season],r=D.daylight(state.lat,se.dec),p=placeName();
 $('seasonName').textContent=se.name;$('cityName').textContent=p+' · '+latName(state.lat);
 $('latitude').textContent=latName(state.lat);$('lat').value=state.lat;
 $('decl').textContent='太阳直射'+(se.dec===0?'赤道':se.dec>0?'北回归线（23.44°N）':'南回归线（23.44°S）')+'。';
 Array.from($('seasons').children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===state.season)));
 Array.from($('places').children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===state.place)));
 const total=Math.round(r.hours*60);$('length').textContent=Math.floor(total/60)+' 小时 '+String(total%60).padStart(2,'0')+' 分';
 const normal=r.kind==='normal';
 $('kind').textContent=!normal?(r.hours?'极昼':'极夜'):Math.abs(r.hours-12)<1e-6?'昼夜等长':r.hours>12?'昼长夜短':'昼短夜长';
 $('reason').textContent=normal?(Math.abs(r.hours-12)<1e-6?'晨昏线把这条纬线平分，地球转过半圈就是 12 小时。':r.hours>12?'昼弧超过纬线的一半。观测点穿过受光面所用的时间超过 12 小时。':'夜弧超过纬线的一半。观测点在背光面停留得更久。'):(r.hours?'整条纬线都在受光面，转满一圈也不会进入夜半球。':'整条纬线都在背光面，转满一圈也不会进入昼半球。');
 $('events').textContent=normal?'日出 '+D.clock(r.rise)+'　日落 '+D.clock(r.set)+'（地方太阳时）':r.hours?'这一天太阳始终在地平线上方。':'这一天太阳始终在地平线下方。';
 $('rise').disabled=$('set').disabled=!normal;
 const a=normal?r.rise/24*100:0,bp=normal?r.set/24*100:100;
 $('strip').style.background=normal?'linear-gradient(to right,#5794b3 '+a+'%,#f9c971 '+a+'% '+bp+'%,#5794b3 '+bp+'%)':r.hours?'#f9c971':'#5794b3';
 $('mirror').disabled=state.lat===0;updateTime();schedule();
}
function btn(container,title,act){const b=document.createElement('button');b.textContent=title;b.onclick=()=>{stop();act();update();};$(container).append(b);}
D.seasons.forEach((v,i)=>btn('seasons',v.name,()=>state.season=i));
places.forEach(([name,lat,lon],i)=>btn('places',name,()=>Object.assign(state,{lat,lon,place:i})));
$('lat').oninput=e=>{stop();state.lat=+e.target.value;state.place=-1;update();};
$('mirror').onclick=()=>{stop();state.lat=-state.lat;state.place=-1;update();};
$('time').oninput=e=>{stop();state.minutes=+e.target.value;updateTime();schedule();};
function jump(key){const r=D.daylight(state.lat,D.seasons[state.season].dec);if(r[key]===null)return;stop();state.minutes=60*r[key];updateTime();schedule();}
$('rise').onclick=()=>jump('rise');$('set').onclick=()=>jump('set');
$('play').onclick=()=>{if(playing)return stop();playing=true;startAt=state.minutes;startTime=performance.now();$('play').textContent='暂停';$('play').setAttribute('aria-pressed','true');raf=requestAnimationFrame(animate);};
function resetView(){state.yaw=-61;state.pitch=17;schedule();}
$('home').onclick=resetView;
$('center').onclick=()=>{state.yaw=timeAngle();state.pitch=state.lat;schedule();};
let drag=null;canvas.onpointerdown=e=>{if(e.button)return;drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(!drag)return;state.yaw-=(e.clientX-drag[0])*.46;state.pitch=clamp(state.pitch+(e.clientY-drag[1])*.37,-88,88);drag=[e.clientX,e.clientY];schedule();};
canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')return resetView();
 if(e.key==='ArrowLeft')state.yaw-=10;if(e.key==='ArrowRight')state.yaw+=10;
 if(e.key==='ArrowUp')state.pitch=clamp(state.pitch+8,-88,88);if(e.key==='ArrowDown')state.pitch=clamp(state.pitch-8,-88,88);schedule();};
$('project').onclick=()=>{const active=document.body.classList.toggle('project');$('project').textContent=active?'展开讲解':'收起讲解';schedule();};
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{if(!document.body.classList.contains('project'))$('project').click();}};
document.addEventListener('fullscreenchange',()=>{$('full').textContent=document.fullscreenElement?'退出全屏':'全屏投影';schedule();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
new ResizeObserver(schedule).observe(canvas);
update();
})();
