(()=>{'use strict';
const $=id=>document.getElementById(id), overlay=$('overlay'),modal=$('modal');
if(!window.THREE){modal.innerHTML='<h1>โหลดฉาก 3D ไม่สำเร็จ</h1><p>กรุณาเชื่อมต่ออินเทอร์เน็ต แล้วรีเฟรชหน้าเกม</p><button class="primary" onclick="location.reload()">ลองใหม่</button>';return;}
const T=THREE, WORLD=46, keys={},joy={x:0,y:0};let running=false,dialog=false,combat=false,enemyTarget=null,combatTimer=null,question=null,attackUntil=0,invuln=0,toastTimer=0,nearNPC=null;
const defaults={level:1,xp:0,coins:0,hp:100,chapter:0,kills:0,questStage:0,gear:{wand:0,armor:0,boots:0},defeated:{},done:false};let save;try{save={...defaults,...JSON.parse(localStorage.getItem('math-monster-rpg-7stage-v1')||'{}')}}catch{save={...defaults}}save.gear={...defaults.gear,...save.gear};save.defeated=save.defeated&&typeof save.defeated==='object'?save.defeated:{};
const quests=[
{title:'ด่าน 1 · ป่าสายรุ้ง',intro:'ช่วยลูน่าฝึกเวทบวกจำนวนเต็ม กำจัดสไลม์ 3 ตัว!',target:3,type:'slime',reward:35,story:'เวทบวกสำเร็จ! เส้นทางสู่หมู่บ้านเปิดแล้ว'},
{title:'ด่าน 2 · หมู่บ้านดอกไม้',intro:'ฝึกเวทลบจำนวนเต็ม ช่วยชาวบ้านจากสไลม์ 3 ตัว',target:3,type:'slime',reward:45,story:'ช่วยหมู่บ้านสำเร็จ! เดินทางไปสวนผลไม้กัน'},
{title:'ด่าน 3 · สวนผลไม้มหัศจรรย์',intro:'เวทบวกและลบจำนวนลบ! กำจัดโกเลม 4 ตัว',target:4,type:'golem',reward:55,story:'ผลไม้กลับมาเติบโตแล้ว!'},
{title:'ด่าน 4 · ป่าเห็ดแสนสนุก',intro:'ฝึกคูณจำนวนเต็มบวกและลบ กำจัดโกเลม 4 ตัว',target:4,type:'golem',reward:65,story:'ผ่านบททดสอบการคูณแล้ว!'},
{title:'ด่าน 5 · หมู่บ้านริมลำธาร',intro:'ฝึกหารจำนวนเต็ม (ตัวหารไม่เป็นศูนย์) กำจัดผู้พิทักษ์ 4 ตัว',target:4,type:'guard',reward:75,story:'น้ำในลำธารกลับมาใสสะอาด!'},
{title:'ด่าน 6 · ป่าคริสตัลสีรุ้ง',intro:'ใช้เวทบวกลบคูณหารผสมกัน กำจัดผู้พิทักษ์ 5 ตัว',target:5,type:'guard',reward:90,story:'คริสตัลทั้งหกกลับมาแล้ว! เหลือภารกิจสุดท้าย'},
{title:'ด่าน 7 · หมู่บ้านปราสาทสายรุ้ง',intro:'พิสูจน์พลังจำนวนเต็ม! กำจัดผู้พิทักษ์ 3 ตัว แล้วปราบบอสใหญ่',target:3,type:'guard',reward:120,story:'จอมมารตัวเลขถูกปราบแล้ว โลกกลับมาสดใส!'}
];
const STAGES=quests.length;
// Sounds are synthesized locally; no external audio files or licensing required.
let audioCtx=null,soundOn=true,musicTimer=null,musicStep=0;
function audioInit(){if(!soundOn)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}catch{soundOn=false}}
function tone(freq=440,duration=.12,type='sine',volume=.055,delay=0){if(!soundOn||!audioCtx)return;try{const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+duration+.03)}catch{}}
function sfx(kind){audioInit();if(kind==='hit'){tone(520,.11,'triangle');tone(780,.18,'sine',.04,.09)}else if(kind==='wrong'){tone(180,.22,'sawtooth',.025)}else if(kind==='win'){[523,659,784,1046].forEach((n,i)=>tone(n,.25,'triangle',.05,i*.13))}else if(kind==='quest'){[392,523,659].forEach((n,i)=>tone(n,.17,'sine',.04,i*.1))}else if(kind==='hurt'){tone(210,.18,'triangle',.045)}else tone(620,.07,'sine',.025)}
function musicStart(){if(musicTimer)return;musicTimer=setInterval(()=>{if(!soundOn||!audioCtx||document.hidden||dialog||combat)return;const notes=[262,330,392,330,294,349,440,349];tone(notes[musicStep++%notes.length],.26,'sine',.009)},420)}
const scene=new T.Scene();scene.background=new T.Color('#91c7ec');scene.fog=new T.Fog('#91c7ec',25,75);const camera=new T.PerspectiveCamera(62,innerWidth/innerHeight,.1,150);const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=0.85;$('world').appendChild(renderer.domElement);
scene.add(new T.HemisphereLight(0xd8f4ff,0x61735a,0.75));const sun=new T.DirectionalLight(0xfff1ce,1.15);sun.position.set(15,28,13);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-36;sun.shadow.camera.right=36;sun.shadow.camera.top=36;sun.shadow.camera.bottom=-36;scene.add(sun);
const mat=(c,roughness=0.85)=>new T.MeshStandardMaterial({color:c,roughness});const mats={grass:mat('#83c982'),dark:mat('#488c6a'),dirt:mat('#e3b58e'),wood:mat('#a76d50'),leaf:mat('#65b58b'),stone:mat('#a5a4c2'),purple:mat('#a781e5'),pink:mat('#ffc3d8'),yellow:mat('#ffdc86'),white:mat('#fff8eb'),black:mat('#3e305a'),blue:mat('#76cfff'),red:mat('#ef7199')};
function mesh(g,m,parent=scene,x=0,y=0,z=0){let o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}function sphere(parent,r,m,x,y,z){return mesh(new T.SphereGeometry(r,14,10),m,parent,x,y,z)}function box(parent,w,h,d,m,x,y,z){return mesh(new T.BoxGeometry(w,h,d),m,parent,x,y,z)}function cyl(parent,rt,rb,h,m,x,y,z){return mesh(new T.CylinderGeometry(rt,rb,h,9),m,parent,x,y,z)}
// Each chapter has its own complete 3D environment, palette and landmarks.
const worldThemes=[
{name:'ป่าสายรุ้ง',sky:'#8bdcff',fog:'#b8f0ff',ground:'#6fce84',path:'#ffe6a8',tree:'#39ba79',accent:'#ff7cae',kind:'forest',wall:'#fff2c7',roof:'#ff7fa9',flower:'#ffcf58'},
{name:'หมู่บ้านดอกไม้',sky:'#ffc8e6',fog:'#ffe2f0',ground:'#a2dc83',path:'#fff0cf',tree:'#70c68c',accent:'#f78cce',kind:'flower',wall:'#fff0f5',roof:'#ec91c9',flower:'#fff17b'},
{name:'สวนผลไม้มหัศจรรย์',sky:'#ffdda4',fog:'#ffe9c6',ground:'#a5d76d',path:'#f6d49b',tree:'#65b66a',accent:'#ff8b4d',kind:'orchard',wall:'#fff0c4',roof:'#ff9a59',flower:'#fbd966'},
{name:'ป่าเห็ดแสนสนุก',sky:'#d8c5ff',fog:'#e9dfff',ground:'#9ddcbb',path:'#fce0b7',tree:'#70bfa9',accent:'#ad7aef',kind:'mushroom',wall:'#f8e7ff',roof:'#b58cf3',flower:'#ff9bd0'},
{name:'หมู่บ้านริมลำธาร',sky:'#92e9f6',fog:'#c7f7fb',ground:'#7eddb6',path:'#f7e9b7',tree:'#3cbca9',accent:'#47bde9',kind:'river',wall:'#e6fff9',roof:'#57c7e3',flower:'#fff49a'},
{name:'ป่าคริสตัลสีรุ้ง',sky:'#b8b9ff',fog:'#dcdcff',ground:'#91d7ce',path:'#f7d8ec',tree:'#5bc1bb',accent:'#bc82ff',kind:'crystal',wall:'#f2eaff',roof:'#a590f2',flower:'#ffa4d8'},
{name:'หมู่บ้านปราสาทสายรุ้ง',sky:'#ffbdcf',fog:'#ffe4e8',ground:'#94d98b',path:'#ffe5a7',tree:'#59c6a1',accent:'#ff9bdb',kind:'castle',wall:'#fff0f8',roof:'#f6a4da',flower:'#ffdc65'}
];
const scenery=[];let worldRoot=null;
// Traversable maze: seven deterministic layouts, looped alleys, collision and monster pathfinding.
const GRID=9,CELL=5,HALF=22.5;let mazeWalls=[],mazeEdges=[],mazeCells=[];
const gridPos=(c,r)=>({x:-20+c*CELL,z:-20+r*CELL});
const cellOf=(x,z)=>({c:Math.max(0,Math.min(8,Math.round((x+20)/CELL))),r:Math.max(0,Math.min(8,Math.round((z+20)/CELL)))});
const mazeIndex=(c,r)=>r*GRID+c;
function makeMaze(chapter,t){
 mazeWalls=[];mazeEdges=[];mazeCells=Array.from({length:81},()=>({open:[false,false,false,false]}));
 let seed=(chapter+1)*87431+773;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const directions=[[0,-1],[1,0],[0,1],[-1,0]];
 const seen=new Set([mazeIndex(1,4)]),stack=[[1,4]];
 while(stack.length){const [c,r]=stack[stack.length-1];const opts=[];for(let d=0;d<4;d++){const nc=c+directions[d][0],nr=r+directions[d][1];if(nc>=0&&nc<GRID&&nr>=0&&nr<GRID&&!seen.has(mazeIndex(nc,nr)))opts.push([d,nc,nr])}if(!opts.length){stack.pop();continue}const [d,nc,nr]=opts[Math.floor(rand()*opts.length)];mazeCells[mazeIndex(c,r)].open[d]=true;mazeCells[mazeIndex(nc,nr)].open[(d+2)%4]=true;seen.add(mazeIndex(nc,nr));stack.push([nc,nr])}
 // Extra loops create alternative routes, alleys and shortcuts, avoiding a frustrating single-solution maze.
 for(let i=0;i<23+chapter*3;i++){const c=Math.floor(rand()*GRID),r=Math.floor(rand()*GRID),d=Math.floor(rand()*4),nc=c+directions[d][0],nr=r+directions[d][1];if(nc<0||nc>=GRID||nr<0||nr>=GRID)continue;mazeCells[mazeIndex(c,r)].open[d]=true;mazeCells[mazeIndex(nc,nr)].open[(d+2)%4]=true}
 // Clear hub around hero and Luna; players can begin the quest immediately.
 for(const [c,r,d] of [[1,4,3],[1,4,0],[0,4,0],[0,3,1],[1,4,1]]){const nc=c+directions[d][0],nr=r+directions[d][1];if(nc>=0&&nc<9&&nr>=0&&nr<9){mazeCells[mazeIndex(c,r)].open[d]=true;mazeCells[mazeIndex(nc,nr)].open[(d+2)%4]=true}}
 const hedge=mat(t.tree),hedgeTop=mat(t.accent);
 function segment(x,z,w,h,d){const ob=box(worldRoot,w,h,d,hedge,x,h/2,z);ob.castShadow=true;box(worldRoot,w,.18,d,hedgeTop,x,h+.02,z);mazeWalls.push({x,z,w,d});mazeEdges.push({x,z,w,d})}
 for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++){
  const {x,z}=gridPos(c,r),node=mazeCells[mazeIndex(c,r)];
  // Maze boundaries are visible and impassable, internal barriers use hedges and pastel fences.
  if(!node.open[1]&&c<GRID-1)segment(x+CELL/2,z,.7,1.6,CELL);
  if(!node.open[2]&&r<GRID-1)segment(x,z+CELL/2,CELL,1.6,.7);
 }
 // Gate markers at branching intersections.
 const marker=mat(t.flower);
 for(let r=1;r<GRID-1;r++)for(let c=1;c<GRID-1;c++){const node=mazeCells[mazeIndex(c,r)];if(node.open.filter(Boolean).length>=3&&rand()<.38){const {x,z}=gridPos(c,r);cyl(worldRoot,.08,.1,1.5,mats.wood,x+1.55,.75,z+1.55);sphere(worldRoot,.26,marker,x+1.55,1.58,z+1.55)}}
}
function canWalk(x,z,radius=.48){if(Math.abs(x)>HALF-radius||Math.abs(z)>HALF-radius)return false;for(const o of mazeWalls){if(Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius)return false}return true}
function moveSafe(obj,dx,dz,radius=.48){const x=obj.position.x,z=obj.position.z;if(canWalk(x+dx,z,radius))obj.position.x=x+dx;if(canWalk(obj.position.x,z+dz,radius))obj.position.z=z+dz}
function pathNext(from,to){const a=cellOf(from.x,from.z),b=cellOf(to.x,to.z),start=mazeIndex(a.c,a.r),goal=mazeIndex(b.c,b.r);if(start===goal)return {x:to.x,z:to.z};const queue=[start],prev=Array(81).fill(-1);prev[start]=start;const dirs=[[0,-1],[1,0],[0,1],[-1,0]];for(let i=0;i<queue.length;i++){const cur=queue[i],c=cur%GRID,r=Math.floor(cur/GRID);if(cur===goal)break;for(let d=0;d<4;d++){if(!mazeCells[cur].open[d])continue;const nc=c+dirs[d][0],nr=r+dirs[d][1],ni=mazeIndex(nc,nr);if(nc<0||nc>=GRID||nr<0||nr>=GRID||prev[ni]!==-1)continue;prev[ni]=cur;queue.push(ni)}}if(prev[goal]===-1)return null;let step=goal;while(prev[step]!==start&&step!==start)step=prev[step];return gridPos(step%GRID,Math.floor(step/GRID))}

function tree(x,z,leafMat,fruit=false){
 const g=new T.Group();g.position.set(x,0,z);cyl(g,.25,.34,1.8,mats.wood,0,.9,0);
 sphere(g,1.05,leafMat,0,2.12,0);sphere(g,.72,leafMat,-.6,1.95,.25);sphere(g,.65,leafMat,.65,2.04,-.15);
 if(fruit){const fruitMat=mat('#ff8f7e');for(const [fx,fy,fz] of [[-.7,2,.65],[.55,1.85,.56],[.2,2.55,.7]])sphere(g,.14,fruitMat,fx,fy,fz)}
 worldRoot.add(g);scenery.push(g)
}
function flower(x,z,colorMat){const g=new T.Group();g.position.set(x,0,z);cyl(g,.035,.04,.48,mat('#4f9d63'),0,.24,0);for(let i=0;i<5;i++){let a=i*Math.PI*2/5;sphere(g,.17,colorMat,Math.cos(a)*.18,.55,Math.sin(a)*.18)}sphere(g,.13,mats.yellow,0,.55,0);worldRoot.add(g)}
function house(x,z,wall,roof){const g=new T.Group();g.position.set(x,0,z);box(g,3.2,2.5,2.8,wall,0,1.25,0);let r=mesh(new T.ConeGeometry(2.6,1.7,4),roof,g,0,3.28,0);r.rotation.y=Math.PI/4;box(g,.8,1.35,.1,mats.wood,0,.68,-1.46);box(g,.55,.65,.11,mats.blue,-1.03,1.45,-1.46);box(g,.55,.65,.11,mats.blue,1.03,1.45,-1.46);worldRoot.add(g)}
function changeWorld(chapter){
 chapter=Math.max(0,Math.min(STAGES-1,chapter));const t=worldThemes[chapter];
 if(worldRoot){scene.remove(worldRoot);worldRoot.traverse(o=>{if(o.geometry)o.geometry.dispose()});scenery.length=0}
 worldRoot=new T.Group();scene.add(worldRoot);
 scene.background=new T.Color(t.sky);scene.fog=new T.Fog(t.fog,30,82);
 const ground=mat(t.ground),path=mat(t.path),accent=mat(t.accent),leaf=mat(t.tree);
 const floor=mesh(new T.PlaneGeometry(110,110),ground,worldRoot);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
 for(let i=0;i<18;i++)box(worldRoot,2.6,.06,4.6,path,-21+i*2.5,.035,0);
 makeMaze(chapter,t);
 // Repeatable scenery, safe bounded loops and a clear central path for gameplay.
 let seed=12345+chapter*7381;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const wall=mat(t.wall);
 const roof=mat(t.roof);
 // Houses stay away from the main walking path and Luna's starting location.
 for(const [x,z] of [[-28,-15],[-10,-29],[12,-29],[-28,13],[5,29],[27,12]])house(x,z,wall,roof);
 for(let i=0;i<72;i++){
  const x=(rand()-.5)*81,z=(rand()-.5)*81;
  if(Math.abs(x)<24&&Math.abs(z)<24)continue;
  if(rand()<.73)tree(x,z,leaf,chapter===2);else flower(x,z,accent)
 }
 for(let i=0;i<38;i++){
  const x=(rand()-.5)*43,z=(rand()-.5)*39;
  if(Math.abs(x)<23&&Math.abs(z)<23)continue;
  flower(x,z,i%2===0?accent:mat(t.flower))
 }
 if(chapter>=5){for(const [x,z] of [[-9,-8],[8,-8],[-9,8],[8,8]]){let g=new T.Group();g.position.set(x,0,z);cyl(g,.25,.35,2.5,mat('#a9a3f5'),0,1.25,0);sphere(g,.55,mat('#fff3ab'),0,2.8,0);worldRoot.add(g)}}
 if(chapter===3){for(const [x,z] of [[-6,-8],[9,9],[11,-9]]){const m=new T.Group();m.position.set(x,0,z);cyl(m,.18,.22,1.3,mat('#fff4d9'),0,.65,0);sphere(m,.95,mat('#e7a5e8'),0,1.5,0);worldRoot.add(m)}}
 if(chapter===4){const river=mesh(new T.PlaneGeometry(4,80),mat('#83dcf3'),worldRoot,9,.035,0);river.rotation.x=-Math.PI/2;river.castShadow=false}
 if(chapter===5){for(let i=0;i<9;i++){const x=-18+i*4.5,z=(i%2?14:-15);let crystal=mesh(new T.OctahedronGeometry(.8,0),mat(['#ff9cca','#93eaff','#e4bbff'][i%3]),worldRoot,x,1,z);crystal.rotation.y=i}}
 if(chapter===6){const tower=box(worldRoot,5,5,5,mat('#f4e4fb'),20,2.5,-16);mesh(new T.ConeGeometry(4.2,3,4),mat('#e6a5ec'),worldRoot,20,6.5,-16)}
 // Distinctive cheerful landmarks make each stage visibly different beyond recoloring.
 const deco=(x,z,color,scale=1)=>{const g=new T.Group();g.position.set(x,0,z);sphere(g,.7*scale,mat(color),0,.75*scale,0);sphere(g,.36*scale,mat('#fff8ed'),0,1.2*scale,.48*scale);worldRoot.add(g)};
 if(chapter===0){for(const [x,z] of [[-7,-11],[6,10],[17,8]]){const g=new T.Group();g.position.set(x,0,z);for(let j=0;j<5;j++){let a=j*Math.PI*2/5;box(g,.27,2.6,.27,mat(['#ff8e9e','#ffd75b','#80e0b0','#7dbaff','#c4a1ff'][j]),Math.cos(a)*1.2,1.3,Math.sin(a)*1.2)}sphere(g,.55,mat('#fff6a6'),0,2.8,0);worldRoot.add(g)}}
 if(chapter===1){for(let i=0;i<11;i++){let x=-19+i*3.8;flower(x,-7,mat(i%2?'#ff7cae':'#ffdf6a'));flower(x,7,mat(i%2?'#f6a3e6':'#fff1a2'))}}
 if(chapter===2){for(const [x,z] of [[-10,9],[3,9],[15,-9]]){const g=new T.Group();g.position.set(x,0,z);cyl(g,.18,.24,1.7,mat('#ae7b51'),0,.85,0);sphere(g,1.05,mat('#74c65b'),0,2,0);for(let i=0;i<5;i++){let a=i*Math.PI*2/5;sphere(g,.18,mat('#ff7c4c'),Math.cos(a)*.75,2+Math.sin(a)*.45,Math.sin(a)*.75)}worldRoot.add(g)}}
 if(chapter===3){for(const [x,z] of [[-15,7],[-3,-10],[12,9]]){const g=new T.Group();g.position.set(x,0,z);cyl(g,.24,.32,1.5,mat('#fff0d4'),0,.75,0);let cap=sphere(g,1.25,mat('#e18bf4'),0,1.65,0);cap.scale.y=.55;for(const [dx,dz] of [[-.5,-.4],[.5,.3],[0,.6]])sphere(g,.15,mat('#fff6c8'),dx,1.9,dz);worldRoot.add(g)}}
 if(chapter===4){for(let i=0;i<5;i++){const z=-15+i*7;box(worldRoot,5,.24,1.1,mat('#c99a65'),9,.23,z);deco(12,z+1,'#8ad7f2',.5)}}
 if(chapter===5){for(let i=0;i<12;i++){const x=-19+i*3.5,z=i%2?10:-10;const crystal=mesh(new T.OctahedronGeometry(.65+(i%3)*.12,0),mat(['#ff8fc5','#75d9ff','#caa2ff','#ffe78e'][i%4]),worldRoot,x,1.1,z);crystal.rotation.z=.18}}
 if(chapter===6){for(let i=0;i<8;i++){const x=-17+i*4.8;const pole=cyl(worldRoot,.09,.11,2.2,mat('#fff0c5'),x,1.1,-8);sphere(worldRoot,.4,mat(['#ff9bcb','#ffe28a','#8cddf2','#b6a5f6'][i%4]),x,2.3,-8)}for(const [x,z] of [[-10,11],[10,11]])deco(x,z,'#ffb4d7',1.3)}
 if(mapCanvas)drawMap();
}
function buildHero(){let g=new T.Group();const cape=box(g,1.05,1.1,.18,mats.purple,0,1.15,.39);cape.rotation.x=-.16;box(g,.82,1,.6,mats.blue,0,1.12,0);sphere(g,.48,mats.pink,0,1.95,0);let hat=mesh(new T.ConeGeometry(.66,1.05,10),mats.purple,g,0,2.62,0);hat.rotation.z=.12;sphere(g,.075,mats.black,-.16,2.03,-.43);sphere(g,.075,mats.black,.16,2.03,-.43);let l=box(g,.28,.68,.3,mats.black,-.25,.38,0),r=box(g,.28,.68,.3,mats.black,.25,.38,0);let a=box(g,.25,.8,.25,mats.pink,.58,1.18,0);a.rotation.z=-.35;let staff=cyl(g,.06,.07,1.5,mats.wood,.85,1.35,-.12);sphere(g,.21,mats.yellow,.85,2.13,-.12);g.userData={l,r,a,cape,staff};scene.add(g);return g}
const hero=buildHero();hero.position.set(-16,0,0);let facing=new T.Vector3(0,0,-1);
function npc(x,z){let g=new T.Group();g.position.set(x,0,z);box(g,1,1.4,.75,mats.purple,0,1.05,0);sphere(g,.47,mats.pink,0,2.02,0);sphere(g,.085,mats.black,-.16,2.08,-.42);sphere(g,.085,mats.black,.16,2.08,-.42);let hat=mesh(new T.ConeGeometry(.7,1.2,10),mats.yellow,g,0,2.85,0);sphere(g,.25,mats.yellow,0,3.6,0);scene.add(g);return g}const luna=npc(-19,-3);const lunaHome=new T.Vector3(-19,0,-3);let lunaStep=0,lunaFacing=0;
function monster(type,x,z){let g=new T.Group();g.position.set(x,0,z);let body,legs=[];if(type==='slime'){body=sphere(g,.85,mats.purple,0,.9,0);body.scale.y=.78}else if(type==='golem'){body=box(g,1.5,1.5,1.15,mats.stone,0,1.1,0);legs=[box(g,.45,.65,.5,mats.dark,-.5,.32,0),box(g,.45,.65,.5,mats.dark,.5,.32,0)]}else if(type==='boss'){body=sphere(g,1.7,mats.red,0,1.9,0);sphere(g,.6,mats.yellow,-.8,3.3,0);sphere(g,.6,mats.yellow,.8,3.3,0)}else{body=sphere(g,1.0,mats.dark,0,1.1,0);body.scale.y=1.3}let eyey=type==='boss'?2.2:type==='golem'?1.35:1.1;sphere(g,.12,mats.white,-.28,eyey,-.73);sphere(g,.12,mats.white,.28,eyey,-.73);sphere(g,.055,mats.black,-.28,eyey,-.84);sphere(g,.055,mats.black,.28,eyey,-.84);scene.add(g);return {g,type,hp:type==='boss'?8:type==='golem'?3:type==='guard'?4:2,max:type==='boss'?8:type==='golem'?3:type==='guard'?4:2,alive:true,home:new T.Vector3(x,0,z),cool:0,body,legs,phase:Math.random()*7}}
let enemies=[];function clearEnemies(){enemies.forEach(e=>scene.remove(e.g));enemies=[]}
function spawn(){clearEnemies();let chapter=Math.min(save.chapter,STAGES-1),type=quests[chapter].type;let count=chapter===STAGES-1?5:7;for(let i=0;i<count;i++){let c=(i*3+4+chapter)%9,r=(i*5+2+chapter*2)%9;let {x,z}=gridPos(c,r);if(Math.hypot(x+16,z)<7){({x,z}=gridPos(7,i%9))}if(!save.defeated[`${chapter}:${i}`]){let e=monster(type,x,z);e.id=`${chapter}:${i}`;enemies.push(e)}}if(chapter===STAGES-1&&save.kills>=quests[chapter].target&&!save.defeated[`${chapter}:boss`]){let boss=monster('boss',20,0);boss.id=`${chapter}:boss`;enemies.push(boss)}}
function persist(){try{localStorage.setItem('math-monster-rpg-7stage-v1',JSON.stringify(save))}catch{}}function maxHp(){return 100+save.gear.armor*30}function updateHud(){let need=save.level*50;$('level').textContent='Lv.'+save.level;$('coins').textContent='🪙 '+save.coins;$('hp').style.width=Math.max(0,save.hp/maxHp()*100)+'%';$('hpText').textContent='HP '+Math.ceil(save.hp)+'/'+maxHp();$('xp').style.width=Math.min(100,save.xp/need*100)+'%';let q=quests[Math.min(save.chapter,STAGES-1)];$('chapter').textContent=save.done?'🌟 พิชิตจอมมารสำเร็จ':q.title;$('quest').textContent=save.done?'โลกแห่งตัวเลขกลับมาสงบสุข':save.questStage===0?'คุยกับลูน่า 💬':save.questStage===2?'กลับไปคุยกับลูน่า 💬':save.chapter===STAGES-1&&save.kills>=quests[STAGES-1].target?'ปราบจอมมารที่ปลายทางด้านขวา':`กำจัด ${q.type} ${q.target} ตัว`;$('progress').textContent=save.done?'เล่นสำรวจและสะสมเหรียญต่อได้':save.questStage===1?`${Math.min(save.kills,q.target)} / ${q.target} ตัว`:'เดินไปหาตัวละครหมวกสีเหลือง'}
function notify(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2600)}function show(html){dialog=true;running=false;overlay.classList.remove('hidden');modal.innerHTML=html}function close(){dialog=false;overlay.classList.add('hidden');running=true}function gain(xp,coins){save.xp+=xp;save.coins+=coins;while(save.xp>=save.level*50){save.xp-=save.level*50;save.level++;save.hp=maxHp();notify('เลเวลอัป! Lv.'+save.level)}persist();updateHud()}
function intro(){show(`<h1>⚔️ Math Monster RPG 3D</h1><p>ดินแดนแห่งตัวเลขถูกจอมมารขโมยคริสตัลเวทมนตร์! รับเควสจากลูน่า ต่อสู้กับมอนสเตอร์ และช่วยกอบกู้โลก</p><p class="story">🕹️ ลากจอยสติ๊กเพื่อวิ่ง · ⚔️ กดโจมตีใกล้มอนสเตอร์ · 💬 คุยกับ NPC<br>ตอบโจทย์ถูกเพื่อปล่อยเวทโจมตี</p><button class="primary" id="start">เริ่มผจญภัย</button>`);$('start').onclick=()=>{audioInit();musicStart();close();notify('เดินไปหาลูน่าที่หมวกสีเหลืองเพื่อรับเควส')}}
// Celebration: a persistent victory crown, a cheerful village and animated finale.
let festivalRoot=null;
function makeFestival(){
 if(festivalRoot){scene.remove(festivalRoot);festivalRoot=null}
 festivalRoot=new T.Group();scene.add(festivalRoot);
 const colors=['#ff91ba','#ffe28a','#94e6d3','#bca3ff','#ffb078'];
 for(let i=0;i<14;i++){
  const a=i*Math.PI*2/14,x=Math.cos(a)*10,z=Math.sin(a)*10;
  const villager=new T.Group();villager.position.set(x,0,z);
  cyl(villager,.42,.55,1.15,mat(colors[i%5]),0,.75,0);
  sphere(villager,.4,mat('#ffe4b5'),0,1.6,0);
  sphere(villager,.49,mat(colors[(i+2)%5]),0,1.99,0);
  festivalRoot.add(villager);
 }
 for(let i=0;i<28;i++){
  const a=i*2.399,r=3+(i%6)*1.35;
  const f=new T.Group();f.position.set(Math.cos(a)*r,0,Math.sin(a)*r);
  cyl(f,.045,.045,.7,mat('#6ca878'),0,.35,0);
  sphere(f,.22,mat(colors[i%5]),0,.8,0);festivalRoot.add(f);
 }
 if(!hero.userData.victoryCrown){
  const crown=new T.Group();
  const band=cyl(crown,.37,.37,.18,mat('#ffd15b'),0,0,0);
  for(let i=0;i<5;i++){let a=i*Math.PI*2/5;let gem=sphere(crown,.14,mat(i%2?'#ff8ec5':'#9ae9ff'),Math.cos(a)*.32,.2,Math.sin(a)*.32)}
  hero.add(crown);crown.position.set(0,2.35,0);hero.userData.victoryCrown=crown;
 }
}
function showEnding(){
 show(`<div class="ending-title">🌈 โลกแห่งตัวเลขสดใสอีกครั้ง!</div><div class="ending-medal">👑</div><h1>ยินดีด้วย! ผู้พิทักษ์แห่งโลกคณิตศาสตร์</h1><p>ลูน่าและชาวหมู่บ้านมาร่วมฉลองชัย! มอนสเตอร์กลับมาเป็นเพื่อน และทุกคนขอบคุณความกล้าหาญของเธอ</p><p class="story">🎁 ได้รับมงกุฎแห่งปัญญา · ปลดล็อกหมู่บ้านแห่งการเฉลิมฉลอง</p><button class="primary" id="freeRoam">🌼 เล่นต่อในโลกอิสระ</button><button class="primary secondary" id="newJourney">🔄 เริ่มผจญภัยใหม่</button><div class="confetti" aria-hidden="true">${Array.from({length:32},(_,i)=>`<i style="--x:${(i*37)%100}%;--d:${(i%9)*-.27}s;--c:${['#ffd46f','#ff8bb6','#8de2d5','#c2a4ff'][i%4]}"></i>`).join('')}</div>`);
 $('freeRoam').onclick=()=>{close();notify('ยินดีต้อนรับสู่หมู่บ้านฉลองชัย!')};
 $('newJourney').onclick=()=>{if(!confirm('เริ่มเกมใหม่? เลเวล เหรียญ อุปกรณ์ และความคืบหน้าจะถูกรีเซ็ต'))return;localStorage.removeItem('math-monster-rpg-7stage-v1');location.reload()};
}
function finishAdventure(){
 save.done=true;save.chapter=STAGES-1;save.questStage=3;save.hp=maxHp();persist();
 changeWorld(0);clearEnemies();hero.position.set(0,0,2);luna.position.set(2,0,-2);
 makeFestival();updateHud();sfx('win');showEnding();
}
function talk(){if(combat||dialog)return;if(hero.position.distanceTo(luna.position)>4.5){notify('เดินเข้าใกล้ลูน่าก่อนนะ');return}let q=quests[Math.min(save.chapter,STAGES-1)];if(save.done){showEnding();return}if(save.questStage===0){show(`<h1>🧚 ลูน่า</h1><p>${q.intro}</p><button class="primary" id="accept">รับเควส!</button>`);$('accept').onclick=()=>{save.questStage=1;save.kills=0;persist();updateHud();close();sfx('quest');notify('รับเควสแล้ว!')};return}if(save.questStage===2){show(`<h1>✨ เควสสำเร็จ!</h1><p>${q.story}</p><p>รับรางวัล 🪙 ${q.reward} เหรียญ + XP 35</p><button class="primary" id="next">ดำเนินเรื่องต่อ</button>`);$('next').onclick=()=>{sfx('win');gain(35,q.reward);save.chapter++;save.kills=0;save.questStage=0;save.hp=maxHp();if(save.chapter>=STAGES){finishAdventure()}else {changeWorld(save.chapter);hero.position.set(-16,0,0);luna.position.copy(lunaHome);spawn();persist();updateHud();close();notify('เข้าสู่ฉากใหม่: '+worldThemes[save.chapter].name)}};return}notify('ยังทำภารกิจไม่ครบจ้า')}
function ask(e){if(dialog||combat||!running)return;if(!e||!e.alive)return;if(hero.position.distanceTo(e.g.position)>3.8){notify('เข้าใกล้มอนสเตอร์อีกนิด');return}if(save.questStage!==1&&!save.done){notify('รับเควสจากลูน่าก่อนนะ');return}combat=true;running=false;enemyTarget=e;makeQuestion()}
function makeQuestion(){
 const stage=Math.min(save.chapter,STAGES-1),r=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),signed=(n,zero=true)=>{let x=r(1,n);return Math.random()<.5?-x:x},showN=n=>n<0?`(${n})`:`${n}`;
 let mode=stage===0?0:stage===1?1:stage===2?r(0,1):stage===3?2:stage===4?3:r(0,3);
 let a,b,answer,label;
 if(mode===0){a=stage===0?r(0,18):r(-25,25);b=stage===0?r(-12,12):r(-25,25);answer=a+b;label=`${showN(a)} + ${showN(b)} = ?`}
 else if(mode===1){a=r(-25,25);b=r(-25,25);answer=a-b;label=`${showN(a)} − ${showN(b)} = ?`}
 else if(mode===2){a=signed(stage===3?9:12);b=Math.random()<.15?0:signed(stage===3?9:12);answer=a*b;label=`${showN(a)} × ${showN(b)} = ?`}
 else {b=signed(stage===4?9:12);answer=r(-12,12);a=b*answer;label=`${showN(a)} ÷ ${showN(b)} = ?`}
 question={answer,label};const choices=new Set([answer]);let attempts=0;while(choices.size<4&&attempts++<80){const offset=r(-Math.max(8,Math.abs(answer)/3|0),Math.max(8,Math.abs(answer)/3|0));if(offset!==0)choices.add(answer+offset)}for(let n=1;choices.size<4;n++)choices.add(answer+n);
 const shuffled=[...choices].sort(()=>Math.random()-.5);let seconds=stage>=5?20:18;
 show(`<h1>⚔️ เวทมนตร์จำนวนเต็ม</h1><p>ด่าน ${stage+1}/7 · ตอบถูกเพื่อโจมตี ${enemyTarget.type==='boss'?'บอส':'มอนสเตอร์'}</p><div class="timer" id="time">⏳ ${seconds}</div><h1 style="font-size:clamp(25px,7vw,36px)">${label}</h1><div class="choices">${shuffled.map(v=>`<button data-answer="${v}">${v}</button>`).join('')}</div><p>จำไว้: จำนวนลบคูณหรือหารจำนวนลบได้ผลบวก และห้ามหารด้วยศูนย์</p>`);
 clearInterval(combatTimer);combatTimer=setInterval(()=>{seconds--;const el=$('time');if(el)el.textContent='⏳ '+seconds;if(seconds<=0)resolve(false)},1000);
 modal.querySelectorAll('[data-answer]').forEach(btn=>btn.onclick=()=>resolve(Number(btn.dataset.answer)===answer));
}
function resolve(correct){if(!combat)return;clearInterval(combatTimer);combat=false;close();if(correct){sfx('hit');let damage=1+save.gear.wand;enemyTarget.hp-=damage;attackUntil=performance.now()+450;notify(`✨ ตอบถูก! โจมตี ${damage} HP`);if(enemyTarget.hp<=0){enemyTarget.alive=false;save.defeated[enemyTarget.id]=true;scene.remove(enemyTarget.g);persist();gain(enemyTarget.type==='boss'?80:15,enemyTarget.type==='boss'?80:12);if(!save.done&&save.questStage===1){if(enemyTarget.type==='boss'){save.questStage=2;notify('จอมมารถูกปราบแล้ว! กลับหาลูน่า')}else{save.kills++;let q=quests[save.chapter];if(save.kills>=q.target){if(save.chapter===STAGES-1){if(!save.defeated[`${save.chapter}:boss`]&&!enemies.some(e=>e.alive&&e.type==='boss')){let boss=monster('boss',20,0);boss.id=`${save.chapter}:boss`;enemies.push(boss)}notify('บอสปรากฏที่ปลายทาง!')}else{save.questStage=2;notify('ภารกิจครบแล้ว! กลับไปหาลูน่า')}}}persist();updateHud()}}}else{sfx('wrong');save.hp=Math.max(0,save.hp-(12+save.chapter*2));invuln=performance.now()+1500;notify('ตอบผิด! เสียพลังชีวิต');if(save.hp<=0){save.hp=maxHp();hero.position.set(-16,0,0);notify('หมดพลัง! กลับมาที่หมู่บ้านแล้ว')}persist();updateHud()}if(enemyTarget.alive&&correct&&enemyTarget.hp>0)notify('มอนสเตอร์ยังอยู่! โจมตีอีกครั้ง');enemyTarget=null}
function attack(){if(dialog||combat||!running)return;let candidates=enemies.filter(e=>e.alive).sort((a,b)=>hero.position.distanceTo(a.g.position)-hero.position.distanceTo(b.g.position));let e=candidates[0];if(!e||hero.position.distanceTo(e.g.position)>3.8){notify('เข้าใกล้มอนสเตอร์เพื่อโจมตี');attackUntil=performance.now()+350;return}ask(e)}
function gear(){if(combat)return;const items=[['wand','🪄 คทาเวท','โจมตีเพิ่ม +1',60],['armor','🛡️ เกราะ','HP สูงสุดเพิ่ม +30',50],['boots','👟 รองเท้าวิ่ง','ความเร็วเพิ่ม',45]];show(`<h1>🎒 อุปกรณ์นักผจญภัย</h1><p>🪙 เหรียญ ${save.coins}</p><div class="gear">${items.map(([k,name,desc,base])=>{let cost=base*(save.gear[k]+1);return `<button data-gear="${k}" ${save.coins<cost?'disabled':''}>${name} Lv.${save.gear[k]} → Lv.${save.gear[k]+1}<br><small>${desc} · ราคา ${cost} เหรียญ</small></button>`}).join('')}</div><button class="primary" id="back">กลับเข้าเกม</button>`);$('back').onclick=close;modal.querySelectorAll('[data-gear]').forEach(b=>b.onclick=()=>{let k=b.dataset.gear,base={wand:60,armor:50,boots:45}[k],cost=base*(save.gear[k]+1);if(save.coins<cost)return;save.coins-=cost;save.gear[k]++;if(k==='armor')save.hp+=30;persist();updateHud();gear()})}
function help(){show('<h1>📜 วิธีเล่น</h1><p>1. เดินไปหาลูน่า (หมวกสีเหลือง) แล้วกด 💬 รับเควส<br>2. วิ่งสำรวจทางแยกและซอกซอยด้วยจอยสติ๊ก หรือ WASD<br>3. เข้าใกล้มอนสเตอร์แล้วกด ⚔️<br>4. ตอบโจทย์ให้ถูกเพื่อปล่อยเวทโจมตี<br>5. เก็บ XP เหรียญ ซื้ออุปกรณ์ และกลับส่งเควส<br>6. ผ่าน 7 ด่านเพื่อพบจอมมาร</p><p>เกมบันทึกความคืบหน้าในเบราว์เซอร์เครื่องนี้อัตโนมัติ</p><button class="primary" id="back">เล่นต่อ</button>');$('back').onclick=close}
$('soundBtn').onclick=()=>{soundOn=!soundOn;$('soundBtn').textContent=soundOn?'🔊 เสียง':'🔇 ปิดเสียง';if(soundOn){audioInit();musicStart();sfx('quest')}};$('actionBtn').onclick=attack;$('talkBtn').onclick=talk;$('gearBtn').onclick=gear;$('helpBtn').onclick=help;window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='Space')attack();if(e.code==='KeyE')talk();if(e.code==='KeyI')gear()});window.addEventListener('keyup',e=>keys[e.code]=false);window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);joy.x=joy.y=0;$('nub').style.transform='' });
const stick=$('joystick'),nub=$('nub');function moveStick(e){let r=stick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),len=Math.hypot(dx,dy),max=r.width*.33,scale=Math.min(1,max/(len||1));joy.x=dx*scale/max;joy.y=dy*scale/max;nub.style.transform=`translate(${joy.x*max}px,${joy.y*max}px)`}stick.addEventListener('pointerdown',e=>{stick.setPointerCapture(e.pointerId);moveStick(e)});stick.addEventListener('pointermove',e=>{if(stick.hasPointerCapture(e.pointerId))moveStick(e)});function stopStick(){joy.x=joy.y=0;nub.style.transform=''}stick.addEventListener('pointerup',stopStick);stick.addEventListener('pointercancel',stopStick);
const mapCanvas=$('minimapCanvas'),mapCtx=mapCanvas.getContext('2d');let lastMap=0;
function drawMap(){const c=mapCtx,w=mapCanvas.width,h=mapCanvas.height;c.clearRect(0,0,w,h);const theme=worldThemes[Math.min(save.chapter,STAGES-1)];c.fillStyle=theme.ground;c.fillRect(0,0,w,h);c.fillStyle=theme.path;c.fillRect(0,0,w,h);c.fillStyle=theme.ground;c.fillRect(0,0,w,h);c.fillStyle=theme.tree;c.strokeStyle=theme.tree;c.lineWidth=2.6;for(const o of mazeEdges){const xx=(o.x+WORLD/2)/WORLD*w,zz=(o.z+WORLD/2)/WORLD*h;c.fillRect(xx-o.w/WORLD*w/2,zz-o.d/WORLD*h/2,Math.max(2,o.w/WORLD*w),Math.max(2,o.d/WORLD*h))}c.strokeStyle='#ffffff30';c.strokeRect(1,1,w-2,h-2);const pos=(x,z)=>({x:(x+WORLD/2)/WORLD*w,y:(z+WORLD/2)/WORLD*h});const dot=(x,z,color,r)=>{const q=pos(x,z);c.beginPath();c.arc(Math.max(5,Math.min(w-5,q.x)),Math.max(5,Math.min(h-5,q.y)),r,0,Math.PI*2);c.fillStyle=color;c.fill();c.strokeStyle='#231e36';c.lineWidth=1.5;c.stroke()};for(const e of enemies)if(e.alive)dot(e.g.position.x,e.g.position.z,e.type==='boss'?'#ff5e83':'#ffbc8c',e.type==='boss'?6:3.5);dot(luna.position.x,luna.position.z,'#ffe478',5);dot(hero.position.x,hero.position.z,'#73eaff',6);const q=pos(hero.position.x,hero.position.z);c.save();c.translate(q.x,q.y);c.rotate(Math.atan2(facing.x,-facing.z));c.fillStyle='#fff';c.beginPath();c.moveTo(0,-11);c.lineTo(-4,-4);c.lineTo(4,-4);c.closePath();c.fill();c.restore()}
let last=performance.now(),walk=0;function loop(now){requestAnimationFrame(loop);let dt=Math.min(.05,(now-last)/1000);last=now;let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x,dz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+joy.y;let len=Math.hypot(dx,dz);if(running&&len>.08){dx/=len;dz/=len;let speed=5.1+save.gear.boots*.9;moveSafe(hero,dx*speed*dt,dz*speed*dt,.44);facing.set(dx,0,dz);hero.rotation.y=Math.atan2(-dx,-dz);walk+=dt*12;hero.userData.l.rotation.x=Math.sin(walk)*.5;hero.userData.r.rotation.x=-Math.sin(walk)*.5;hero.userData.cape.rotation.x=-.2+Math.sin(walk)*.08;hero.position.y=Math.abs(Math.sin(walk))*.06}else{hero.userData.l.rotation.x*=.85;hero.userData.r.rotation.x*=.85;hero.position.y*=.85}if(now<attackUntil){hero.userData.a.rotation.x=-1.5;hero.userData.staff.rotation.z=-.3}else{hero.userData.a.rotation.x*=.85;hero.userData.staff.rotation.z*=.85}
// Luna wanders around the village, then pauses to greet the player.
if(running){lunaStep+=dt;const angle=lunaStep*.48;const tx=lunaHome.x+Math.cos(angle)*2.1,tz=lunaHome.z+Math.sin(angle)*1.7;const vx=tx-luna.position.x,vz=tz-luna.position.z;const d=Math.hypot(vx,vz);if(d>.07){luna.position.x+=vx/d*Math.min(d,dt*1.15);luna.position.z+=vz/d*Math.min(d,dt*1.15);lunaFacing=Math.atan2(-vx,-vz);luna.rotation.y=lunaFacing;}}luna.position.y=Math.abs(Math.sin(lunaStep*7))*.045;
for(let e of enemies){if(!e.alive)continue;let dist=e.g.position.distanceTo(hero.position);e.phase+=dt*3;e.body.scale.y=(e.type==='slime'?.78:1)*(1+Math.sin(e.phase)*.06);e.g.position.y=Math.abs(Math.sin(e.phase))*.07;if(running&&dist<11&&dist>1.5){let v=hero.position.clone().sub(e.g.position).normalize();const next=pathNext(e.g.position,hero.position);if(next){const tx=next.x-e.g.position.x,tz=next.z-e.g.position.z,dist2=Math.hypot(tx,tz);if(dist2>.12)moveSafe(e.g,tx/dist2*dt*(e.type==='boss'?1.25:1.65),tz/dist2*dt*(e.type==='boss'?1.25:1.65),e.type==='boss'?.7:.48)}e.g.lookAt(hero.position.x,e.g.position.y,hero.position.z)}if(running&&dist<1.5&&now>e.cool&&now>invuln){e.cool=now+1800;save.hp=Math.max(0,save.hp-7-save.chapter*2);invuln=now+1000;sfx('hurt');notify('มอนสเตอร์โจมตี! -HP');if(save.hp<=0){save.hp=maxHp();hero.position.set(-16,0,0);notify('กลับไปพักที่หมู่บ้านแล้ว')}persist();updateHud()}}
let desired=hero.position.clone().add(new T.Vector3(0,11,15));camera.position.lerp(desired,Math.min(1,dt*4));camera.lookAt(hero.position.x,1.15,hero.position.z);if(now-lastMap>110){drawMap();lastMap=now}renderer.render(scene,camera)}window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});changeWorld(save.done?0:save.chapter);if(save.done){clearEnemies();hero.position.set(0,0,2);luna.position.set(2,0,-2);makeFestival()}else{spawn()}updateHud();drawMap();intro();requestAnimationFrame(loop);
})();
