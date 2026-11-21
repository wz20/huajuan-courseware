function compute(target) {
  const path=[];
  let lo=1,hi=15;
  while(lo<=hi){
    const mid=Math.floor((lo+hi)/2);
    path.push({lo,hi,mid});
    if(mid===target) break;
    if(mid<target) lo=mid+1; else hi=mid-1;
  }
  return {target,path,summary:'目标为 '+target+' 号。逐次翻书，观察每一步留下的区间。'};
}
function createScene(stage) {
  const panel=document.createElement('div');
  panel.style.cssText='height:100%;display:grid;align-content:center;gap:20px;padding:clamp(14px,4vw,48px);box-sizing:border-box';
  const shelf=document.createElement('div');
  shelf.style.cssText='display:grid;grid-template-columns:repeat(15,minmax(0,1fr));gap:2px';
  const log=document.createElement('div'); log.setAttribute('aria-live','polite');
  const next=document.createElement('button');
  next.style.cssText='position:static;justify-self:start'; next.textContent='翻中间一本';
  panel.append(shelf,log,next); stage.append(panel);
  let count=0,active;
  function draw(model){
    if(active?.target!==model.target) count=0;
    active=model;
    const previous=model.path[count-1], pending=model.path[count];
    const range=pending??previous;
    const complete=count===model.path.length;
    shelf.replaceChildren();
    for(let n=1;n<=15;n++){
      const book=document.createElement('span');
      const hit=previous?.mid===n;
      const keep=n>=range.lo&&n<=range.hi&&!complete;
      book.style.cssText='text-align:center;padding:20px 0;font:600 clamp(10px,2vw,20px) monospace;border-radius:3px;color:#13292f;background:'+(hit?'#f5b66b':keep?'#91cabe':'#435966');
      book.textContent=n;shelf.append(book);
    }
    const visited=model.path.slice(0,count).map(s=>s.mid).join(' → ');
    log.textContent=complete?'找到了！共翻 '+count+' 次：'+visited:
      '待查 '+range.lo+' 至 '+range.hi+' 号'+(count?' ｜ 已翻 '+visited:'');
    next.disabled=complete;
  }
  next.onclick=()=>{if(count<active.path.length){count++;draw(active);}};
  return {draw,reset(){count=0;}};
}
