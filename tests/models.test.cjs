const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load(name) {
  const file = path.resolve(__dirname, '../lessons', name, 'scene.js');
  return vm.runInNewContext(fs.readFileSync(file,'utf8')+'\ncompute');
}
test('月相：新月、半月、满月及周期', () => {
  const model=load('moon');
  assert.deepEqual([0,90,180,270,360].map(x=>model(x).percent),[0,50,100,50,0]);
});
test('声压：两束等幅波的逐点和符合解析峰值', () => {
  const model=load('sound');
  for(const deg of [0,60,90,135,180,270,360]) {
    const {phase,peak}=model(deg);
    let measured=0;
    for(let i=0;i<2000;i++) {
      const x=i*Math.PI/1000;
      measured=Math.max(measured,Math.abs(Math.sin(x)+Math.sin(x+phase)));
    }
    assert.ok(Math.abs(peak-measured)<.00001);
  }
});
test('有序查找：每步保留目标、区间严格缩小、15 个目标均终止', () => {
  const model=load('search');
  for(let target=1;target<=15;target++) {
    const {path}=model(target);
    let width=16;
    for(const {lo,hi,mid} of path) {
      assert.ok(lo<=target && target<=hi && hi-lo+1<width);
      assert.equal(mid,Math.floor((lo+hi)/2));
      width=hi-lo+1;
    }
    assert.equal(path.at(-1).mid,target);
    assert.ok(path.length<=4);
  }
  assert.deepEqual(Array.from(model(11).path,s=>s.mid),[8,12,10,11]);
});
