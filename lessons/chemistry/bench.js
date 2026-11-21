const WaterLesson = (() => {
  const angle = 104.5 * Math.PI / 360;
  const dx = 58 * Math.sin(angle), dy = 58 * Math.cos(angle);
  const atoms = [
    {id:'H1',start:[-157,72,0],end:[-105-dx,dy,0],from:'第一颗氢分子',to:1},
    {id:'H2',start:[-105,93,4],end:[105+dx,-dy,0],from:'第一颗氢分子',to:2},
    {id:'H3',start:[-157,-68,0],end:[-105+dx,dy,0],from:'第二颗氢分子',to:1},
    {id:'H4',start:[-105,-89,-4],end:[105-dx,-dy,0],from:'第二颗氢分子',to:2},
    {id:'O1',start:[99,26,0],end:[-105,0,0],from:'氧分子',to:1},
    {id:'O2',start:[145,-10,0],end:[105,0,0],from:'氧分子',to:2}
  ];
  const arcs = [[-30,45,-25],[25,70,35],[20,-50,18],[0,-65,-24],[-10,-40,36],[30,35,-25]];
  const initialBonds=[[0,1],[2,3],[4,5]],finalBonds=[[4,0],[4,2],[5,1],[5,3]];
  const limit=t=>Math.min(1,Math.max(0,t));
  function positions(t){
    const v=limit(t),u=v*v*(3-2*v);
    return atoms.map((a,i)=>a.start.map((start,k)=>start+(a.end[k]-start)*u+arcs[i][k]*Math.sin(Math.PI*u)));
  }
  function count([h,o,w]){
    const left=[2*h,2*o],right=[2*w,w];
    const balanced=left.every((v,i)=>v===right[i]);
    return {left,right,balanced,simplest:balanced&&o===1};
  }
  return {atoms,positions,initialBonds,finalBonds,count};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=WaterLesson;
