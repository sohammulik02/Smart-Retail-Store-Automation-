const assert=require('node:assert/strict');const E=require('./dist/engine.js');
const g={S:[['A',4],['B',3]],A:[['C',4],['D',7]],B:[['D',4],['E',6]],C:[['D',2],['G',5]],D:[['E',2],['G',3]],E:[['G',4]],G:[]},h={S:8,A:7,B:6,C:4,D:3,E:4,G:0};
for(const [a,c]of Object.entries({BFS:13,DFS:16,UCS:10,Greedy:10,'A*':10}))assert.equal(E.search('S','G',n=>g[n],n=>h[n],a).cost,c,a);
assert.deepEqual(E.search('S','S',n=>g[n],()=>0).path,['S']);assert.equal(E.search('G','S',n=>g[n],()=>0).cost,Infinity);
const robots=[{id:'R1',capacity:8,battery:100},{id:'R2',capacity:5,battery:100},{id:'R3',capacity:7,battery:100}],tasks=[{name:'restock',load:7},{name:'pick',load:4},{name:'deliver',load:4}];assert.equal(E.schedule(robots,tasks).ok,true);assert.equal(E.schedule(robots.slice(1),tasks).ok,false);
const opts=[{name:'staff',scores:[75,65]},{name:'reroute',scores:[50,70]},{name:'keep',scores:[20,60]}];assert.equal(E.minimax(opts).value,65);assert.equal(E.minimax(opts,true).count,4);assert.equal(E.minimax(opts,true).best,E.minimax(opts).best);
console.log('Passed: 11 search, scheduling, and minimax assertions.');
