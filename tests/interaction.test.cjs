// Deterministic view tests use the bundled Three math, cameras and meshes.
// Only the display surface is simulated. Pixel appearance needs browser review.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root=path.resolve(__dirname,'..');
function setup(topic) {
  class Element {
    constructor() {this.style={};this.children=[];this.clientWidth=640;this.clientHeight=360;}
    append(...children) {this.children.push(...children);}
    replaceChildren() {this.children=[];}
    setAttribute() {}
    addEventListener() {}
    cloneNode() {return new Element();}
    getContext() {
      return new Proxy({}, {get:(target,key)=>target[key]??(()=>{})});
    }
  }
  const frames=[];
  const stage=new Element();
  const scope=vm.createContext({document:{createElement:()=>new Element()},devicePixelRatio:1});
  const run=code=>vm.runInContext(code,scope);
  if(topic==='moon'){
    run(fs.readFileSync(path.join(root,'assets/vendor/three.js'),'utf8'));
    scope.RenderSurface=class {
      constructor(){this.domElement=new Element();}
      setPixelRatio(){} setScissorTest(){} setSize(){} setViewport(){} setScissor(){}
      render(world,camera){frames.push({position:camera.position.toArray().join(','), visible:world.children[0].visible});}
    };
    run('THREE = {...THREE, WebGLRenderer:RenderSurface}');
  }
  run(fs.readFileSync(path.join(root,'lessons',topic,'scene.js'),'utf8'));
  return {stage,view:scope.createScene(stage),compute:scope.compute,frames};
}
test('观察相机可以转动和复位，地面观察点独立，辅助几何仅在总览出现',()=>{
  const {stage,view,compute,frames}=setup('moon');
  const model=compute(90);view.draw(model);
  const before=frames[0].position;
  stage.children[1].onclick();
  assert.notEqual(before,frames[2].position);
  assert.equal(frames[1].position,frames[3].position);
  assert.equal(frames[0].visible,true);assert.equal(frames[1].visible,false);
  view.reset();view.draw(model);assert.equal(frames[4].position,before);
});
test('翻书、重绘、换题、终止、重置',()=>{
  const {stage,view,compute}=setup('search');
  const [,log,next]=stage.children[0].children;
  view.draw(compute(11));next.onclick();next.onclick();
  view.draw(compute(11));assert.match(log.textContent,/8 → 12/);
  view.draw(compute(8));assert.doesNotMatch(log.textContent,/已翻/);
  next.onclick();assert.equal(next.disabled,true);
  view.reset();view.draw(compute(8));assert.equal(next.disabled,false);
});
test('声波视图可按新尺寸重新绘制',()=>{
  const {stage,view,compute}=setup('sound');
  view.draw(compute(180));stage.clientWidth=390;view.draw(compute(30));
  assert.equal(stage.children[0].width,390);
});
