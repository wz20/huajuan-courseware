const SurfaceLesson=(()=>{
  function point(r,angle){return [r*Math.cos(angle),r*Math.sin(angle),r*r];}
  function slice(h){return h<0?{kind:'empty',radius:null}:h===0?{kind:'point',radius:0}:{kind:'circle',radius:Math.sqrt(h)};}
  return {point,slice};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=SurfaceLesson;
