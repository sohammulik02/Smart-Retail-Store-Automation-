const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),context=new Proxy({},{get:(_,name)=>name==='ellipse'?function(...args){assert.ok(args.length>=7)}:()=>{}});
function el(id){if(!elements.has(id))elements.set(id,{value:id==='product'?'0':id==='algorithm'?'A*':'4',checked:true,style:{},classList:{toggle(){},remove(){}},getContext:()=>context});return elements.get(id);}
const sandbox={console,performance,document:{getElementById:el,querySelectorAll:()=>[]},requestAnimationFrame:()=>{}};sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(fs.readFileSync('dist/engine.js','utf8'),sandbox);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),sandbox);
const run=s=>vm.runInContext(s,sandbox);run('draw(0)');
function finish(){for(let i=0;i<5000&&run('!!state.mission');i++)run('tick(100)');assert.equal(run('!!state.mission'),false);}
run('dispatch()');finish();assert.equal(run('state.stock[0]'),10);assert.equal(run('state.load'),0);assert.equal(run('state.completed'),1);
run("task='restock';dispatch()");finish();assert.equal(run('state.stock[0]'),12);assert.equal(run('state.reserve[0]'),28);
run("reset();task='assist';dispatch()");finish();assert.equal(run('state.completed'),1);
run("reset();task='inspect';dispatch()");finish();assert.equal(run('state.completed'),1);
run("reset();task='pick';dispatch();state.paused=true;tick(100)");assert.equal(run('state.cost'),0);run('state.paused=false;state.blocked.add(state.path[0]);plan(true)');finish();assert.equal(run('state.replans'),1);
run('dispatch(true)');finish();assert.equal(run('state.battery'),100);
run("reset();state.stock[0]=0;task='pick';dispatch()");assert.equal(run('state.mission'),null);
run("reset();qty=3;document.getElementById('product').value='all';dispatch()");assert.equal(run('state.mission'),null);
console.log('Passed simulation: render, delivery, inventory, restock, guidance, inspection, pause, reroute, charging, stock and payload validation.');

vm.runInContext(fs.readFileSync('dist/autonomy.js','utf8'),sandbox);
run("reset();document.getElementById('product').value='0';qty=2;task='pick';auto.enabled=true;auto.orders=[{id:0,qty:2}];chooseMission()");
assert.equal(run('!!state.mission'),true);
run('addBlockage()');assert.equal(run('auto.temporary.size'),1);assert.equal(run('state.replans'),1);
const elapsed=run('auto.elapsed');run('state.paused=true;tick(1000)');assert.equal(run('auto.elapsed'),elapsed);
run('state.paused=false;auto.enabled=false');finish();assert.equal(run('state.completed'),1);
for(let i=0;i<60;i++)run('tick(100)');assert.equal(run('auto.temporary.size'),0);
run('reset();state.stock[2]=3;auto.enabled=true;chooseMission()');assert.equal(run("state.mission.stages[0].type"),'collect');
run('reset();state.battery=25;auto.enabled=true;chooseMission()');assert.equal(run('state.mission.charge'),true);
run('reset();auto.enabled=true;auto.environment=true;auto.orders=[{id:0,qty:2}]');for(let i=0;i<1500;i++)run('tick(100)');assert.ok(run('state.completed')>5);assert.ok(run('state.replans')>0);assert.ok(run('state.stock.every(n=>n>=0)'));
run('reset()');assert.equal(run('auto.enabled'),false);assert.equal(run('auto.temporary.size'),0);
console.log('Passed autonomous missions, priority decisions, temporary blockage expiry, pause, continuous operation and reset.');
