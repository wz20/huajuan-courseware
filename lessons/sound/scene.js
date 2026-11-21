function compute(angle) {
  const phase = angle*Math.PI/180;
  const peak = 2*Math.abs(Math.cos(phase/2));
  return {phase, peak, summary:'合成波峰值约为单束声波的 ' + peak.toFixed(2) + ' 倍。'};
}
function createScene(stage) {
  const canvas = document.createElement('canvas'); stage.append(canvas);
  const ctx = canvas.getContext('2d');
  function draw(model) {
    const w=stage.clientWidth,h=stage.clientHeight,d=Math.min(devicePixelRatio,2);
    canvas.width=w*d; canvas.height=h*d; ctx.scale(d,d);
    const groups=[
      ['声波 A','#82d0c3',x=>Math.sin(x)],
      ['声波 B','#f5b66b',x=>Math.sin(x+model.phase)],
      ['叠加结果','#fff1c5',x=>Math.sin(x)+Math.sin(x+model.phase)]
    ];
    groups.forEach(([name,color,sample],i)=>{
      const top=i*h/3, center=top+h/6+5, span=w-36;
      ctx.font='bold 13px sans-serif'; ctx.fillStyle=color; ctx.fillText(name,18,top+20);
      ctx.strokeStyle='#37515c'; ctx.lineWidth=1; ctx.beginPath();
      ctx.moveTo(18,center);ctx.lineTo(w-18,center);ctx.stroke();
      ctx.beginPath();
      for(let px=0;px<=span;px++){
        const y=center-sample(px/span*4*Math.PI)*h*.047;
        if(px===0) ctx.moveTo(18,y);else ctx.lineTo(18+px,y);
      }
      ctx.strokeStyle=color;ctx.lineWidth=i===2?3:2;ctx.stroke();
    });
  }
  return {draw};
}
