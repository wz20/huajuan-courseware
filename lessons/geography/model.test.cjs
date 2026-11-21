const test=require('node:test'),a=require('node:assert/strict'),m=require('./bench.js');
const close=(x,y,e=1e-8)=>a.ok(Math.abs(x-y)<e,x+' vs '+y);
test('赤道和二分日昼夜均分，日出日落为地方太阳时6时和18时',()=>{
 for(const d of [-23.44,0,23.44])close(m.daylight(0,d).hours,12);
 for(const p of [-80,-40,0,40,80]){const r=m.daylight(p,0);close(r.rise,6);close(r.set,18);}
});
test('北京近似纬度的二至日，高纬极昼极夜及南北互补',()=>{
 const h=m.daylight(40,23.44);close(h.hours,14.845,.01);close(m.daylight(40,-23.44).hours,9.155,.01);
 for(const p of [20,40,66.56,70,80])close(m.daylight(p,23.44).hours+m.daylight(-p,23.44).hours,24);
 a.equal(m.daylight(70,23.44).kind,'polarDay');a.equal(m.daylight(70,-23.44).kind,'polarNight');
});
test('独立按分钟累计太阳在地平线上的时间，与解析结果相符',()=>{
 for(const p of [-75,-44,0,40,62,72])for(const d of [-23.44,0,23.44]){
   const r=m.daylight(p,d);let n=0;for(let i=0;i<1440;i++)n+=m.sunHeight(p,d,(i+.5)/60)>0;
   close(r.hours,n/60,.018);if(r.rise!==null){close(m.sunHeight(p,d,r.rise),0);close(m.sunHeight(p,d,r.set),0);}
 }
});
