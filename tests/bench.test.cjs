const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

function harness(width=900,allow3d=true) {
  const events=new Map(), elements=new Map();
  function element(id='') {
    if(id&&elements.has(id))return elements.get(id);
    const node={style:{},dataset:{},clientWidth:width,clientHeight:480,width:80,
      append(){},prepend(){},setPointerCapture(){},setAttribute(k,v){this[k]=v;},
      addEventListener(k,fn){events.set(id+':'+k,fn);},getBoundingClientRect(){return {left:0,top:0,width,height:480};},
      getContext(){return {putImageData(){}};}};
    if(id)elements.set(id,node);
    return node;
  }
  const presets=[0,90,180,270].map(a=>Object.assign(element(),{dataset:{angle:a}}));
  const document={getElementById:element,createElement:()=>element(),querySelectorAll:()=>presets};
  let world,cam;
  class Surface {
    constructor(){if(!allow3d)throw Error('no WebGL');this.shadowMap={};this.domElement=element();}
    setClearColor(){} setPixelRatio(){} setSize(){}
    render(s,c){world=s;cam=c;s.updateMatrixWorld();}
  }
  const scope=vm.createContext({document,Surface,devicePixelRatio:1,
    ResizeObserver:class{observe(){}},ImageData:class{},Uint8ClampedArray,console,requestAnimationFrame(){}});
  const run=code=>vm.runInContext(code,scope);
  run(read('assets/vendor/three.js'));run('THREE={...THREE,WebGLRenderer:Surface}');
  run(read('lessons/lunar-bench/bench.js'));
  run(read('lessons/lunar-bench/lab.js'));
  function screen(a){
    const t=scope.pointAt(a).project(cam);return {x:(t.x+1)*width/2,y:(1-t.y)*240};
  }
  function pointer(type,{x,y}){
    events.get('stage:pointer'+type)({pointerId:1,clientX:x,clientY:y,target:{closest(){return null;}}});
  }
  return {element,presets,world,screen,pointer,scope};
}
for(const width of [900,390]){
  test('月球拾取、沿轨道拖动、释放、相机与复位 '+width,()=>{
    const ui=harness(width);
    const start=ui.screen(55),end=ui.screen(125);
    ui.pointer('down',start);ui.pointer('move',end);ui.pointer('up',end);
    assert.equal(ui.element('degrees').textContent,'125°');
    assert.equal(ui.element('percent').textContent,'79%');
    ui.pointer('down',{x:50,y:30});ui.pointer('move',{x:110,y:62});ui.pointer('up',{x:110,y:62});
    ui.element('zoomIn').onclick();
    assert.equal(ui.element('degrees').textContent,'125°');
    ui.element('plan').onclick();assert.match(ui.element('diag').innerHTML,/data-drag/);
    ui.element('physical').onclick();assert.equal(ui.element('percent').textContent,'79%');
    ui.element('reset').onclick();assert.equal(ui.element('degrees').textContent,'55°');
  });
}
test('上下弦亮面相反，新月和满月读数与月面像素同步',()=>{
  const ui=harness();
  function sides(angle){let left=0,right=0;const N=70,p=ui.scope.moonImage(angle,N);
    for(let i=0;i<N*N;i++){if(i%N<N/2)left+=p[i*4];else right+=p[i*4];}return [left,right];}
  const [l,r]=sides(90),[l2,r2]=sides(270);assert.ok(r>5*l && l2>5*r2);
  ui.presets[2].onclick();assert.equal(ui.element('percent').textContent,'100%');
  ui.presets[0].onclick();assert.equal(ui.element('percent').textContent,'0%');
});
test('WebGL 初始化失败时进入仍可操作的原理图',()=>{
  const ui=harness(390,false);assert.equal(ui.element('physical').disabled,true);
  assert.equal(ui.element('diag').hidden,false);ui.presets[1].onclick();assert.equal(ui.element('phase').textContent,'上弦月');
});
