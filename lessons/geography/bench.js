const Daylight=(()=>{
 const rad=Math.PI/180;
 const seasons=[{name:'春分',dec:0},{name:'夏至',dec:23.44},{name:'秋分',dec:0},{name:'冬至',dec:-23.44}];
 // Coordinates are right-handed: north is +Y; east follows rotation about +Y.
 function normal(lat,angle){
   const p=lat*rad,a=angle*rad,c=Math.cos(p);return [c*Math.cos(a),Math.sin(p),-c*Math.sin(a)];
 }
 function sunHeight(lat,dec,h){
   const a=normal(lat,(h-12)*15),s=normal(dec,0);
   return a[0]*s[0]+a[1]*s[1];
 }
 function daylight(lat,dec){
   const cut=-Math.tan(lat*rad)*Math.tan(dec*rad);
   if(cut<=-1+1e-12)return {hours:24,kind:'polarDay',rise:null,set:null};
   if(cut>=1-1e-12)return {hours:0,kind:'polarNight',rise:null,set:null};
   const half=Math.acos(cut)/(15*rad);
   return {hours:half*2,kind:'normal',rise:12-half,set:12+half};
 }
 function clock(hour){const m=Math.round(hour*60);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
 return {rad,seasons,normal,daylight,sunHeight,clock};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=Daylight;
