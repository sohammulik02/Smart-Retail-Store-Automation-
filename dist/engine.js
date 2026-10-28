/* Pure search and scheduling functions, shared by the app and tests. */
(function(root){
function search(start,goal,neighbors,heuristic,method='A*'){
 const begin=performance.now(),open=[{n:start,g:0}],cost={[start]:0},parent={},closed=new Set(),explored=[];
 while(open.length){
  if(!['BFS','DFS'].includes(method))open.sort((a,b)=>{const score=x=>method==='UCS'?x.g:method==='Greedy'?heuristic(x.n):x.g+heuristic(x.n);return score(a)-score(b)||String(a.n).localeCompare(String(b.n));});
  const {n,g}=open.shift();if(closed.has(n)||g!==cost[n])continue;
  if(n===goal){const path=[n];while(path[0]!==start)path.unshift(parent[path[0]]);return {path,cost:g,explored,ms:performance.now()-begin};}
  closed.add(n);explored.push(n);const next=[];
  for(const [v,w]of neighbors(n)){if(closed.has(v))continue;const candidate=g+w;
   if(method==='DFS'||cost[v]===undefined||(!['BFS','Greedy'].includes(method)&&candidate<cost[v])){cost[v]=candidate;parent[v]=n;next.push({n:v,g:candidate});}}
  if(method==='DFS')open.unshift(...next);else open.push(...next);
 }return {path:[],cost:Infinity,explored,ms:performance.now()-begin};
}
function schedule(robots,tasks){const log=[],assigned={};function visit(i){if(i===tasks.length)return true;const t=tasks[i];for(const r of robots){const why=Object.values(assigned).includes(r.id)?'already assigned':r.capacity<t.load?'payload exceeded':r.battery<30?'low battery':null;if(why){log.push(`${t.name} → ${r.id}: reject (${why})`);continue;}assigned[t.name]=r.id;log.push(`${t.name} → ${r.id}: try`);if(visit(i+1))return true;delete assigned[t.name];log.push(`Backtrack ${t.name}`);}return false;}return {ok:visit(0),assigned,log};}
function minimax(options,prune=false){let alpha=-Infinity,best=null,count=0,skipped=0;const trace=[];for(const o of options){let value=Infinity;for(let i=0;i<o.scores.length;i++){count++;value=Math.min(value,o.scores[i]);if(prune&&value<=alpha){skipped+=o.scores.length-i-1;break;}}trace.push({name:o.name,value});if(value>alpha){alpha=value;best=o.name;}}return {best,value:alpha,count,skipped,trace};}
root.RetailEngine={search,schedule,minimax};if(typeof module!=='undefined')module.exports=root.RetailEngine;
})(typeof window!=='undefined'?window:globalThis);
