const test=require('node:test'), assert=require('node:assert/strict'),m=require('./bench.js');
test('配平区分氧不守恒、最简比和整数倍',()=>{
  assert.deepEqual(m.count([1,1,1]),{left:[2,2],right:[2,1],balanced:false,simplest:false});
  assert.equal(m.count([2,1,2]).simplest,true);
  assert.deepEqual(m.count([4,2,4]),{left:[8,4],right:[8,4],balanced:true,simplest:false});
});
test('同一组原子从三颗分子进入两颗弯折形水分子',()=>{
  assert.deepEqual(m.positions(0),m.atoms.map(a=>a.start));
  for(const [i,a] of m.atoms.entries())assert.ok(a.end.every((v,k)=>Math.abs(m.positions(1)[i][k]-v)<1e-10));
  assert.deepEqual(m.atoms.map(a=>a.id).sort(),['H1','H2','H3','H4','O1','O2']);
  for(const n of [1,2]){
    const group=m.atoms.filter(a=>a.to===n),o=group.find(a=>a.id[0]==='O'),hs=group.filter(a=>a.id[0]==='H');
    assert.equal(hs.length,2);
    const v=hs.map(a=>a.end.map((p,i)=>p-o.end[i]));assert.ok(Math.abs(Math.acos(v[0].reduce((s,x,i)=>s+x*v[1][i],0)/(58*58))*180/Math.PI-104.5)<1e-9);
  }
});
