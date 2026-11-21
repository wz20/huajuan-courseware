// Each key identifies the same structure in the model, the outline and the teacher's notes.
const plates=[
 {name:'叶肉细胞',sub:'成熟叶肉细胞',start:'vacuole',ask:'为什么叶绿体大多靠近细胞边缘？',answer:'中央液泡占据了大部分空间，细胞质和许多细胞器分布在液泡与细胞膜之间。',parts:{
 wall:['细胞壁','细胞最外侧的支撑层，主要成分包括纤维素。转到侧面看它与紧贴内侧的细胞膜。'],
 membrane:['细胞膜','紧贴细胞壁内侧的薄膜，选择性地控制物质进出。图中将膜加厚，以便投影辨认。'],
 cytoplasm:['细胞质基质','细胞器之间的液态环境，多种代谢反应在这里发生。可沿液泡边缘找到薄薄的一层。'],
 vacuole:['中央液泡','成熟植物细胞中常有一个很大的中央液泡。液泡膜包围细胞液，液泡有助于维持膨压。'],
 tonoplast:['液泡膜','把细胞液与细胞质基质分隔开。蓝色轮廓标出膜的位置。'],
 nucleus:['细胞核','双层核膜包围遗传物质。此处去掉部分核膜，可找到深紫色的核仁。'],
 nucleolus:['核仁','核内的致密区域，参与核糖体 RNA 的合成和核糖体亚基的组装。'],
 chloro:['叶绿体','绿色椭球分布在周缘。点模型上的任意一个叶绿体，就能剖开观察它的内部。',1],
 mito:['线粒体','橙色细胞器。内膜折叠形成嵴；植物细胞也依靠细胞呼吸获得 ATP。'],
 rough:['粗面内质网','靠近细胞核的膜性管囊，外表面附有核糖体。'],
 smooth:['光面内质网','表面没有附着核糖体的膜性管网，参与脂质合成等过程。'],
 golgi:['高尔基体','一叠扁平膜囊，边缘的小囊泡参与物质运输。注意和叶绿体内部的基粒区别。'],
 ribo:['核糖体','无膜的小颗粒，负责蛋白质合成。图中放大了游离与附着的核糖体。'],
 perox:['过氧化物酶体','单层膜包围的小细胞器，在叶肉细胞中参与光呼吸等代谢过程。'],
 skeleton:['细胞骨架','细胞质中的蛋白质纤维网络，有助于细胞内运输和细胞器定位。这里显示沿细胞周缘分布的部分纤维。'],
 plasmodesma:['胞间连丝','穿过细胞壁、连接相邻细胞细胞质的通道。截取的壁段用三个小孔示意，邻细胞未画出。'],
 vesicle:['运输囊泡','小膜泡帮助细胞在不同膜性结构之间运输物质。']}},
 {name:'叶绿体',sub:'叶绿体剖面',start:'granum',ask:'绿色圆盘的外面、双层包膜的里面，是什么空间？',answer:'是叶绿体基质。光反应发生在类囊体膜上；固定二氧化碳的卡尔文循环发生在基质中。',parts:{
 outer:['外膜','包膜的外层，环绕整个叶绿体。合上剖面，观察叶绿体完整的椭球外形。'],
 inner:['内膜','包膜的内层。内外膜之间有膜间隙；内部的扁囊属于另一套膜系统。'],
 stroma:['基质','围绕基粒的流体区域。卡尔文循环在这里利用 ATP 和 NADPH，将二氧化碳中的碳固定进有机物。'],
 granum:['基粒','一摞紧密堆叠的类囊体叫作一个基粒。点任意一摞圆盘，近看堆叠关系。',2],
 lamella:['基质片层','基粒之间由未堆叠的类囊体膜相连。转动模型，找一条从一摞延伸到另一摞的片层。'],
 dna:['叶绿体 DNA','基质中的遗传物质以线团作示意，叶绿体自身能编码部分蛋白质。'],
 plastRibo:['叶绿体核糖体','位于基质中的小颗粒，参与叶绿体内部的蛋白质合成。'],
 starch:['淀粉粒','叶绿体能暂时将部分光合产物以淀粉形式贮存。图中浅色椭球为淀粉粒。']}},
 {name:'基粒',sub:'堆叠的类囊体',start:'disc',ask:'一摞圆盘和其中一个圆盘，分别叫什么？',answer:'整摞叫基粒；其中的一个扁囊叫类囊体。拉开间距再合上，比较两者的层级。',parts:{
 disc:['一个类囊体','每一个看似圆盘的结构都是扁平膜囊。拖动层间距，点其中一层进入剖面。',3],
 bridge:['相连的片层','基质片层从堆叠区域向外延伸。这里截取局部，显示它与膜囊的衔接。']}},
 {name:'类囊体',sub:'类囊体膜与囊腔',start:'thylMem',ask:'ATP 在膜的哪一侧生成？',answer:'氢离子顺电化学梯度从囊腔经 ATP 合酶返回基质，驱动 ATP 在基质侧合成。',parts:{
 thylMem:['类囊体膜','扁囊的边界。叶绿素所在的光系统、电子传递组分及 ATP 合酶分布在这套膜系统中。'],
 lumen:['囊腔','膜围成的内部空间。光照下，水的氧化与电子传递有助于建立跨膜的质子梯度。'],
 outside:['基质侧','类囊体膜外侧朝向叶绿体基质，ATP 合酶的催化头部伸向这一侧。'],
 psii:['光系统 II','吸收光能后启动电子传递，水在靠囊腔一侧被氧化，生成电子、氢离子和氧气。'],
 synth:['ATP 合酶','氢离子从囊腔经 ATP 合酶流回基质，驱动 ADP 和无机磷酸合成 ATP。此处并列展示不同膜区的代表性复合体。']}}
];
const pigments={skeleton:0xa28c6c,plasmodesma:0x536f54,wall:0x86aa79,membrane:0xe8ad60,cytoplasm:0xecdfad,vacuole:0x83c9ce,tonoplast:0x428d99,nucleus:0xa18bbf,nucleolus:0x68437c,chloro:0x479966,mito:0xe49b62,rough:0x829cc4,smooth:0x529f9c,golgi:0xd59787,ribo:0x5c6582,perox:0xdbbf72,vesicle:0xd79589,outer:0x488e6b,inner:0x9fc580,stroma:0xe0dfa2,granum:0x498c61,lamella:0x8cb56e,dna:0xb97679,plastRibo:0x8c6d9c,starch:0xe5cb9a,disc:0x4d9968,bridge:0x92ba7d,thylMem:0x609c73,lumen:0x91cebf,outside:0xbed7b2,psii:0x497999,synth:0xbd8052};
function specimen(level){
 const T=THREE,root=new T.Group(),covers=[],layers=[],parts={},ends=[];

 function group(parent,x=0,y=0,z=0){let g=new T.Group();parent.add(g);g.position.set(x,y,z);return g;}
 function mesh(k,geo,parent,x=0,y=0,z=0,col=pigments[k]){
   const m=new T.MeshStandardMaterial({color:col,roughness:.73,metalness:.015,side:T.DoubleSide});
   const o=new T.Mesh(geo,m);o.castShadow=o.receiveShadow=true;parent.add(o);o.position.set(x,y,z);o.userData.key=k;(parts[k]??=[]).push(o);return o;
 }
 const sph=new T.SphereGeometry(1,24,16),dotGeo=new T.SphereGeometry(1,9,6);
 function ball(k,p,x,y,z,a,b,c,col){let o=mesh(k,a<.14?dotGeo:sph,p,x,y,z,col);o.scale.set(a,b,c);return o;}
 function tube(k,p,points,r,col){const v=points.map(a=>new T.Vector3(...a));return mesh(k,new T.TubeGeometry(new T.CatmullRomCurve3(v),Math.max(10,points.length*3),r,6,false),p,0,0,0,col);}
 const signed=(x,n)=>Math.sign(x)*Math.pow(Math.abs(x),n);
 // Concentric open shells share a horizontal section; the upper cap restores the intact envelope.
 function shell(k,p,A,B,C,n,low,high,col){
   const v=[],idx=[],N=72,M=12;
   for(let j=0;j<=M;j++){let lat=low+(high-low)*j/M,ring=Math.cos(lat);
     for(let i=0;i<=N;i++){let t=2*Math.PI*i/N;
       const warp=level===0&&['wall','membrane','cytoplasm'].includes(k)?wallProfile(t,lat):1;
       v.push(A*warp*signed(Math.cos(t)*ring,n), B*signed(Math.sin(lat),n), C*warp*signed(Math.sin(t)*ring,n));}}
   for(let j=0;j<M;j++)for(let i=0;i<N;i++){let a=j*(N+1)+i;idx.push(a,a+N+1,a+1,a+1,a+N+1,a+N+2);}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();
   return mesh(k,geo,p,0,0,0,col);
 }
 function rim(k,p,A,C,n,y,r,col){
   let pts=[];for(let i=0;i<64;i++){let a=2*Math.PI*i/64;const warp=level===0&&['wall','membrane','cytoplasm'].includes(k)?wallProfile(a,0):1;pts.push(new T.Vector3(A*warp*signed(Math.cos(a),n),y,C*warp*signed(Math.sin(a),n)));}
   return mesh(k,new T.TubeGeometry(new T.CatmullRomCurve3(pts,true),96,r,8,true),p,0,0,0,col);
 }
 // Indexed parametric surfaces keep the cut edges and folds visible from the reverse side.
 function surface(k,p,nu,nv,at,color){
   const xyz=[],tris=[];
   for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++)xyz.push(...at(i/nu,j/nv));
   for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i;tris.push(a,a+nu+1,a+1,a+1,a+nu+1,a+nu+2);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));g.setIndex(tris);g.computeVertexNormals();
   return mesh(k,g,p,0,0,0,color);
 }
 function loop(k,p,fn,r,col){
   const pts=Array.from({length:60},(_,i)=>new T.Vector3(...fn(i*Math.PI/30)));
   return mesh(k,new T.TubeGeometry(new T.CatmullRomCurve3(pts,true),72,r,6,true),p,0,0,0,col);
 }
 // A sealed, curved cisterna, broad in the centre and tapered at both margins.
 function cisterna(k,p,xyz,at,color){
   const g=group(p,...xyz);
   return surface(k,g,38,16,(u,v)=>{
     const a=v*Math.PI*2, w=Math.pow(Math.max(.001,Math.sin(Math.PI*u)),.56);
     return at(u,w*Math.cos(a),w*Math.sin(a));
   },color);
 }
 function lens(k,p,x,y,z,A,C,h,seed,col){
   return surface(k,group(p,x,y,z),48,18,(u,v)=>{
     const a=u*2*Math.PI,b=(v-.5)*Math.PI,t=Math.cos(b),wave=1+.037*Math.sin(3*a+seed)+.021*Math.cos(5*a-seed);
     return [A*Math.cos(a)*t*wave,h*Math.sin(b)+h*.24*t*t*Math.sin(a*2+seed),C*Math.sin(a)*t*wave];
   },col);
 }
 function wallProfile(a,lat){
   return 1+.043*Math.cos(3*a+.5)+.024*Math.sin(5*a-.6)+.018*Math.sin(2*a+lat);
 }
 function outerShell(k,p,A,B,C,n,color){shell(k,p,A,B,C,n,-Math.PI/2,0,color);rim(k,p,A,C,n,0,.046,color);const cap=shell(k,p,A,B,C,n,0,Math.PI/2,color);cap.visible=false;covers.push(cap);}
 // Leave part of the rear envelope intact when sectioned so the specimen keeps its depth.
 function backSection(k,A,B,C,n,col){
   function edge(a){return .02+.93*Math.pow(Math.max(0,-Math.sin(a)*.93-Math.cos(a)*.28),1.12);}
   function pt(a,lat){const r=Math.cos(lat),w=level===0?wallProfile(a,lat):1;
     return [A*w*signed(r*Math.cos(a),n),B*signed(Math.sin(lat),n),C*w*signed(r*Math.sin(a),n)];}
   const back=surface(k,root,96,12,(u,v)=>{const a=2*Math.PI*u;return pt(a,edge(a)*v);},col);
   const cutRim=loop(k,root,a=>pt(a,edge(a)),.034,level===0?0xb5bf84:0x93b674);
   back.userData.sectionOnly=cutRim.userData.sectionOnly=true;
 }
 function stack(k,p,x,y,z,r,count,sep){
   let g=group(p,x,y,z);if(k==='granum')g.userData.unit=k;
   for(let i=0;i<count;i++){
     let d=group(g,.025*Math.sin(i*1.7),i*sep,.018*Math.cos(i));let scale=r*(.95+.05*Math.cos(i));
     const disk=lens(k,d,0,0,0,scale,scale*.81,sep*.47,i*.74,i%2?0x478151:0x528e58);
     disk.userData.discLayer=i;
     loop(k,d,a=>{const w=1+.037*Math.sin(3*a+i*.74)+.021*Math.cos(5*a-i*.74);return [scale*Math.cos(a)*w,.24*sep*.47*Math.sin(2*a+i*.74),scale*.81*Math.sin(a)*w];},Math.min(.031,r*.026),0x8eb374);
     if(level===2){
       layers.push({d,i,sep});
       for(let j=0;j<19;j++){
         const a=j*2.399+i*.25,r=Math.sqrt((j+.5)/20)*.84;
         const x=scale*r*Math.cos(a),z=.81*scale*r*Math.sin(a),y=sep*.47*(Math.sqrt(1-r*r)+.24*r*r*Math.sin(2*a+i*.74));
         const patch=ball(k,d,x,y,z,.047+.02*(j%2),.016,.034,0x6ba069);patch.rotation.y=a;
       }
     }
   }return g;
 }
 if(level===0){
   outerShell('wall',root,4.63,1.48,3.03,.63,0x84ab74);
   outerShell('membrane',root,4.49,1.36,2.91,.63,0xedaf66);
   shell('cytoplasm',root,4.39,1.22,2.82,.63,-Math.PI/2,0);rim('cytoplasm',root,4.39,2.82,.63,0,.035);
   for(let j=0;j<3;j++){const path=[];for(let i=0;i<=30;i++){const a=-2.8+i*.12+j*.17;path.push([(4.13-j*.055)*signed(Math.cos(a),.72),.075+j*.09,(2.62-j*.045)*signed(Math.sin(a),.72)]);}tube('skeleton',root,path,.022);}
   for(let j=0;j<3;j++){const a=1.63+j*.066;const xx=signed(Math.cos(a),.63),zz=signed(Math.sin(a),.63);tube('plasmodesma',root,[[4.36*xx,0,2.82*zz],[4.49*xx,.025,2.93*zz],[4.65*xx,.03,3.05*zz]],.068);}
   // Liquid compartment conforming to the surrounding organelles, section plane above the lower wall.
   function vacPoint(a,lat){
     const w=1+.10*Math.sin(3*a-.2)+.055*Math.cos(5*a+.7)-.11*Math.exp(-Math.pow((Math.cos(a)+.95)*4,2));
     const ring=Math.cos(lat);
     return [.03+2.60*w*ring*Math.cos(a),-.06+1.08*Math.sin(lat)+.075*ring*Math.sin(2*a),.02+1.69*w*ring*Math.sin(a)];
   }
   const liquidCut=.42;
   surface('vacuole',root,88,28,(u,v)=>vacPoint(u*2*Math.PI,-Math.PI/2+(liquidCut+Math.PI/2)*v),0x6aa9ae);
   const fluidFace=surface('vacuole',root,88,28,(u,v)=>{
     const [x,y,z]=vacPoint(u*2*Math.PI,liquidCut);return [.03+(x-.03)*v,.38+(y-.38)*v*v,.02+(z-.02)*v];
   },0x92c5c2);
   const radial=fluidFace.geometry.attributes.position;
   const colors=[];for(let i=0;i<radial.count;i++){
     const v=Math.floor(i/89)/28,edge=Math.pow(v,3),wave=.025*Math.cos(radial.getX(i)*3+radial.getZ(i));
     colors.push(.85-.28*edge+wave,.98-.13*edge+wave,1-.08*edge+wave);
   }
   fluidFace.geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));fluidFace.material.vertexColors=true;
   loop('tonoplast',root,a=>vacPoint(a,liquidCut),.035,0x499097);
   // Close-set fibres show the depth and direction of the cell wall in oblique views.
   for(let i=0;i<8;i++)loop('wall',root,a=>{
     const lat=-.08-i*.085+.016*Math.sin(a*5+i*.5),r=Math.cos(lat),w=wallProfile(a,lat);
     return [4.64*w*signed(Math.cos(a)*r,.63),1.48*signed(Math.sin(lat),.63),3.04*w*signed(Math.sin(a)*r,.63)];
   },.012,i%2?0x829567:0xa7b57a);
   const nu=group(root,-2.95,.38,.53);nu.userData.unit='nucleus';
   shell('nucleus',nu,.84,.78,.82,1,-Math.PI/2,.53);rim('nucleus',nu,.722,.707,1,.394,.035,0xb690bb);
   ball('nucleus',nu,0,.10,0,.75,.30,.72,0x9c789f);ball('nucleolus',nu,-.09,.33,.05,.32,.30,.32,0x673e73);
   for(let i=0;i<3;i++){const pts=[];for(let j=0;j<=45;j++){const a=j/45*2*Math.PI+i*.83,r=.43+.095*Math.sin(4*a+i);
     const x=r*Math.cos(a),z=r*Math.sin(a);pts.push([x,.12+.30*Math.sqrt(1-(x/.75)**2-(z/.72)**2)+.024*Math.cos(9*a),z]);}
     tube('nucleus',nu,pts,.023,i%2?0xebbed4:0xcda2c2);}
   backSection('wall',4.63,1.48,3.03,.63,0x839d6c);backSection('membrane',4.49,1.36,2.91,.63,0xd3ad6f);
   const chloros=[[-3.34,-1.27,.39],[-1.38,-2.12,-.33],[1.16,-2.05,.16],[3.38,-1.08,-1.1],[3.54,.96,1.23],[1.04,2.00,-.23],[-1.16,2.08,.32]];
   for(const [x,z,a] of chloros){
     const g=group(root,x,.32,z);g.userData.unit='chloro';g.rotation.y=a;
     shell('chloro',g,.82,.31,.42,1,-Math.PI/2,.17,0x39845d);
     rim('chloro',g,.807,.412,1,.052,.023,0x83b87c);
     ball('chloro',g,0,-.053,0,.78,.085,.39,0xb0bf79);
     for(let j=0;j<4;j++){const u=-.48+j*.30,v=(j%2-.5)*.18;for(let q=0;q<3;q++)ball('chloro',g,u,.051+q*.039,v,.147,.022,.115,q%2?0x417849:0x588554);}
   }
   for(const [x,z,rot] of [[2.24,1.74,.36],[-2.62,1.89,-.58],[2.58,-1.71,.29]]){
     const g=group(root,x,.33,z);g.userData.unit='mito';g.rotation.y=rot;
     shell('mito',g,.62,.255,.32,1,-Math.PI/2,.17,0xc67749);rim('mito',g,.61,.316,1,.043,.028,0xe9ab72);
     ball('mito',g,0,-.056,0,.59,.085,.29,0xad653d);
     for(let i=0;i<6;i++){const t=-.43+i*.17,side=i%2?1:-1,reach=.25*Math.sqrt(1-(t/.62)**2);
       cisterna('mito',g,[t,.074,0],(u,v,w)=>[.035*Math.sin(Math.PI*u)+v*.028,.036+w*.072,side*reach*(1-u*1.68)],0xf1b876);}
   }
   const er=group(root,-2.95,.27,.53);er.userData.unit='rough';
   for(let i=0;i<4;i++){
     const bend=(u,v,w)=>{const a=.27+u*2.67,rad=.91+v*.16+.04*Math.sin(5*a+i*.4);return [-rad*Math.sin(a),.16*i+w*.043+.068*Math.sin(a*2+i*.36),rad*Math.cos(a)];};
     cisterna('rough',er,[0,0,0],bend,i%2?0x829cbd:0x738eaf);
     for(let j=0;j<9;j++){const [x,y,z]=bend((j+.4)/9,.58,1);ball('ribo',er,x,y+.015,z,.038,.034,.038,0x465673);}
   }
   for(let i=0;i<4;i++)tube('smooth',root,[[-3.87,.15+i*.09,-.17],[-3.69,.27,-.56+i*.14],[-3.47,.37+i*.045,-.48+i*.06],[-3.15,.25,-.75+i*.10],[-2.79,.18,-.84+i*.13]],.049);
   for(let i=0;i<5;i++)cisterna('golgi',root,[2.78+.032*i,.15+i*.105,.62],(u,v,w)=>[
     .37*Math.sin(Math.PI*u)+v*.20,.13*Math.sin(Math.PI*u)+w*.039+.04*Math.sin(6*u+i*.3),1.19*(u-.5)],i%2?0xc47e73:0xdb9583);
   for(let i=0;i<5;i++){let a=i*1.7;ball('vesicle',root,3.25+.24*Math.cos(a),.31+.09*i,.26+.21*Math.sin(a),.097,.10,.098);}
   for(const [x,z] of [[-2.43,-1.42],[.04,2.28],[3.56,-.4]])ball('perox',root,x,.22,z,.22,.21,.21);
   for(let i=0;i<24;i++){let a=(i+.38)*2.399;ball('ribo',root,3.92*Math.cos(a),.14,2.49*Math.sin(a),.062,.06,.06);}
 }else if(level===1){
   outerShell('outer',root,4.55,1.29,2.63,1,0x4b9069);outerShell('inner',root,4.37,1.18,2.48,1,0xa6c98b);
   backSection('outer',4.55,1.29,2.63,1,0x438460);backSection('inner',4.37,1.18,2.48,1,0x8daf74);
   const fluid=ball('stroma',root,0,-.44,0,4.15,.48,2.31);
   const sites=[[-2.74,.09,.22],[-1.52,-1.20,.09],[-.63,.83,.14],[.55,-.65,.14],[1.67,.86,.12],[2.73,-.52,.12]];
   sites.forEach(([x,z,y],i)=>{const g=stack('granum',root,x,y,z,[.66,.51,.62,.57,.65,.53][i],4+(i*3)%5,.103);g.rotation.x=.035*Math.sin(i);});
   for(const [i,j] of [[0,1],[0,2],[1,3],[2,3],[2,4],[3,5],[4,5]]){
     const [x,z]=sites[i],[X,Z]=sites[j],dx=X-x,dz=Z-z,len=Math.hypot(dx,dz);
     cisterna('lamella',root,[x,.27,z],(u,v,w)=>[u*dx-dz/len*v*.16,.078*Math.sin(Math.PI*2*u+i)+w*.041,u*dz+dx/len*v*.16],0x84a468);}
   const chain=[];for(let i=0;i<=36;i++){let t=2*Math.PI*i/36;chain.push([-1.5+.52*Math.cos(t),.17+.08*Math.sin(3*t),1.53+.20*Math.sin(2*t)]);}tube('dna',root,chain,.031);
   ball('starch',root,1.20,.18,-1.58,.57,.29,.33);
   for(let i=0;i<17;i++){let a=i*2.39;ball('plastRibo',root,3.56*Math.cos(a),.08,1.91*Math.sin(a),.067,.06,.067);}
 }else if(level===2){
   stack('disc',root,-.55,-1.10,.08,2.10,7,.31);
   for(const [dir,i] of [[1,2],[-1,4]]){let d=group(root,-.55,-1.10+i*.31,.08);
     let b=ball('bridge',d,dir*2.07,0,-.2,1.65,.10,.41);b.rotation.y=.16;ends.push({d,i});}
 }else{
   outerShell('thylMem',root,3.65,.61,2.05,1,0x659e79);
   ball('lumen',root,0,-.22,0,3.40,.24,1.84);
   const top=shell('thylMem',root,3.60,.60,2.00,1,0,Math.PI/2); // Rear membrane half remains over the lumen.
   const idx=top.geometry.index.array, keep=[];const pa=top.geometry.attributes.position;
   for(let i=0;i<idx.length;i+=3)if(pa.getZ(idx[i])+pa.getZ(idx[i+1])+pa.getZ(idx[i+2])<0)keep.push(idx[i],idx[i+1],idx[i+2]);
   top.geometry.setIndex(keep);top.userData.sectionOnly=true;
   // Cross-section of the rear membrane: polar heads face the two aqueous spaces.
   const lipid=(x,y,z,flip)=>{
     ball('thylMem',root,x,y,z,.048,.045,.050,flip>0?0x9fbf7e:0x83aa77);
     for(const side of [-1,1])tube('thylMem',root,[[x+side*.012,y,z],[x+side*.02,y-flip*.058,z],[x+side*.028,y-flip*.097,z+.015]],.011,0xa9a46f);
   };
   for(let i=-30;i<=30;i++){const x=i*.105,y=.60*Math.sqrt(1-(x/3.60)**2);
     lipid(x,y+.065,.012,1);lipid(x,y-.115,.012,-1);}
   const protein=(k,parent,x,y,z,A,B,C,seed,col)=>surface(k,group(parent,x,y,z),30,20,(u,v)=>{
     const a=2*Math.PI*u,b=Math.PI*(v-.5),r=Math.cos(b);
     const lobes=1+.125*Math.cos(4*a+2*b+seed)+.09*Math.sin(3*b+seed)*Math.cos(3*a);
     return [A*r*lobes*Math.cos(a),B*Math.sin(b),C*r*lobes*Math.sin(a)];
   },col);
   const ps=group(root,-1.38,.48,-.49);ps.userData.unit='psii';
   for(let i=0;i<9;i++){const a=i*2.399,r=.15+.087*Math.sqrt(i);
     protein('psii',ps,r*Math.cos(a),.04*Math.sin(i),r*Math.sin(a),.235,.54+.05*Math.cos(i),.20,i,i%2?0x387481:0x568d98);}
   const atp=group(root,1.21,.44,-.49);atp.userData.unit='synth';
   for(let i=0;i<9;i++){const a=i*Math.PI*2/9;protein('synth',atp,.24*Math.cos(a),0,.24*Math.sin(a),.115,.35,.12,i,0xb77c4b);}
   tube('synth',atp,[[0,.26,0],[-.03,.55,.01],[0,.78,0]],.090,0xcc9c63);
   tube('synth',atp,[[.29,.08,0],[.48,.36,.02],[.45,.81,.03],[.26,1.08,.05]],.047,0x986543);
   for(let i=0;i<6;i++){const a=i*Math.PI/3;protein('synth',atp,.204*Math.cos(a),.91,.204*Math.sin(a),.22,.30,.21,i,i%2?0xce9863:0xb88254);}
   // The stroma side is open space; the label targets a coordinate, not a fictitious particle.
 }
 const grainKeys=new Set(['wall','cytoplasm','vacuole','nucleus','nucleolus','outer','stroma','granum','disc','thylMem','psii','synth']);
 const colorCache=new WeakMap();
 root.traverse(o=>{
   if(!o.isMesh)return;const k=o.userData.key;
   o.material.roughness=k==='vacuole'?.29:k==='wall'?.92:.58;
   if(!grainKeys.has(k)||o.geometry.attributes.color)return;
   let textured=colorCache.get(o.geometry);
   if(!textured){
     textured=o.geometry.clone();const pos=textured.attributes.position,values=[];
     for(let i=0;i<pos.count;i++){
       const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
       const ripple=.5+.5*Math.sin(11*x+4*Math.sin(7*z)+3*y)*Math.cos(14*z-3*y);
       const fine=.5+.5*Math.sin(45*x+31*y+37*z);const shade=.77+.18*ripple+.05*fine;
       values.push(shade,shade*.99+.01,.94*shade+.06);
     }
     textured.setAttribute('color',new T.Float32BufferAttribute(values,3));colorCache.set(o.geometry,textured);
   }
   o.geometry=textured;o.material.vertexColors=true;
 });
 function cover(open){covers.forEach(c=>c.visible=!open); for(const all of Object.values(parts))for(const o of all)if(o.userData.sectionOnly)o.visible=open;}
 function separate(amount){for(const {d,i,sep} of layers)d.position.y=i*sep*(1+amount*1.75)-amount*1.55;
   for(const {d,i} of ends)d.position.y=-1.10+i*.31*(1+amount*1.75)-amount*1.55;}
 return {root,parts,cover,separate};
}

// Depth-buffered Canvas projection of the same pickable meshes for classrooms without WebGL.
function softwareSurface(canvas){
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('2D canvas unavailable');
 const buf=new WeakMap(),matrix=new THREE.Matrix4(),normal=new THREE.Matrix3();
 let W,H,frame,depth;
 return {resize(w,h){const r=Math.min(1.4,850/w,600/h);W=canvas.width=Math.round(w*r);H=canvas.height=Math.round(h*r);frame=ctx.createImageData(W,H);depth=new Float32Array(W*H);},
 draw(root,camera){
   frame.data.fill(0);depth.fill(Infinity);const pixels=frame.data;
   const vp=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
   root.traverseVisible(o=>{
     if(!o.isMesh)return;const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,idx=g.index.array;
     const vertexTint=g.attributes.color;let v=buf.get(g);if(!v){v=new Float32Array(p.count*4);buf.set(g,v);}
     const m=matrix.multiplyMatrices(vp,o.matrixWorld).elements,nm=normal.getNormalMatrix(o.matrixWorld).elements;
     for(let i=0;i<p.count;i++){let a=p.getX(i),b=p.getY(i),c=p.getZ(i),k=i*4;
       v[k]=(1+m[0]*a+m[4]*b+m[8]*c+m[12])*W/2;v[k+1]=(1-m[1]*a-m[5]*b-m[9]*c-m[13])*H/2;v[k+2]=m[2]*a+m[6]*b+m[10]*c+m[14];
       a=n.getX(i);b=n.getY(i);c=n.getZ(i);const x=nm[0]*a+nm[3]*b+nm[6]*c,y=nm[1]*a+nm[4]*b+nm[7]*c,z=nm[2]*a+nm[5]*b+nm[8]*c;v[k+3]=(-.4*x+.82*y+.38*z)/(Math.hypot(x,y,z)||1);}
     const rgb=o.material.color.getHex(),rr=rgb>>16,gg=(rgb>>8)&255,bb=rgb&255,em=o.material.emissiveIntensity*.05;
     for(let i=0;i<idx.length;i+=3){const a=idx[i]*4,b=idx[i+1]*4,c=idx[i+2]*4,ax=v[a],ay=v[a+1],ux=v[b]-ax,uy=v[b+1]-ay,vx=v[c]-ax,vy=v[c+1]-ay,det=ux*vy-uy*vx;
       if(Math.abs(det)<.05)continue;
       const x0=Math.max(0,Math.floor(Math.min(ax,v[b],v[c]))),x1=Math.min(W-1,Math.ceil(Math.max(ax,v[b],v[c]))),y0=Math.max(0,Math.floor(Math.min(ay,v[b+1],v[c+1]))),y1=Math.min(H-1,Math.ceil(Math.max(ay,v[b+1],v[c+1])));
       for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const dx=x+.5-ax,dy=y+.5-ay,u=(dx*vy-dy*vx)/det,t=(ux*dy-uy*dx)/det,w=1-u-t;if(u<0||t<0||w<0)continue;
         const j=y*W+x,z=v[a+2]*w+v[b+2]*u+v[c+2]*t;if(z>=depth[j])continue;depth[j]=z;
         const lambert=(det<0?1:-1)*(v[a+3]*w+v[b+3]*u+v[c+3]*t);
         const tex=vertexTint?(vertexTint.getX(idx[i])*w+vertexTint.getX(idx[i+1])*u+vertexTint.getX(idx[i+2])*t):1;
         const light=(.68+.44*lambert+.055*Math.pow(Math.max(0,lambert),12))*Math.sqrt(tex)+em,k=4*j;
         pixels[k]=rr*light;pixels[k+1]=gg*light;pixels[k+2]=bb*light;pixels[k+3]=255;}
     }
   });
   // Contact shading at depth discontinuities keeps tightly stacked membranes readable.
   const step=Math.max(2,Math.round(W/190));
   for(let y=step*2;y<H-step*2;y++)for(let x=step*2;x<W-step*2;x++){
     const j=y*W+x,here=depth[j];if(!Number.isFinite(here))continue;
     let occlusion=0;
     for(const offset of [-step,step,-W*step,W*step,-step*(W+1),step*(W+1)]){
       const gap=here-depth[j+offset];if(gap>.00045&&gap<.024)occlusion+=Math.min(1,gap/.0025);
     }
     const shade=1-occlusion*.043;for(let c=0;c<3;c++)pixels[4*j+c]*=shade;
   }
   ctx.putImageData(frame,0,0);
 }};
}
