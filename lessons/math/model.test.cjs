const test=require('node:test'),a=require('node:assert/strict'),s=require('./bench.js');
test('水平截面与退化情形',()=>{a.deepEqual(s.slice(-1),{kind:'empty',radius:null});a.deepEqual(s.slice(0),{kind:'point',radius:0});a.equal(s.slice(1).radius,1);a.equal(s.slice(4).radius,2);});
test('母线旋转保持半径与高度',()=>{for(const r of [0,.5,1,2])for(const t of [0,.3,Math.PI/2,Math.PI,2*Math.PI]){let [x,y,z]=s.point(r,t);a.ok(Math.abs(x*x+y*y-z)<1e-10);a.ok(Math.abs(z-r*r)<1e-10);}});
