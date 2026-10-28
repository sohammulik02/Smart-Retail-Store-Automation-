// Autonomous controller and repeatable environment events share simulation time.
let auto;
const originalUpdate=update,originalTick=tick,originalReset=reset,originalDraw=draw;
function initAuto(){auto={enabled:false,environment:false,elapsed:0,nextOrder:12,nextEvent:6,nextDecision:0,sequence:0,eventIndex:0,orders:[],temporary:new Map(),events:[],oldPath:[],flashUntil:0,reason:'Manual mode · you choose the missions.'};$('autopilot').checked=false;$('dynamic').checked=false;renderAuto();}
function eventLog(message){auto.events.unshift(message);auto.events=auto.events.slice(0,6);renderAuto();}
function renderAuto(){if(!auto)return;$('decision').textContent=auto.reason;$('ordercount').textContent=auto.orders.length;$('obstaclecount').textContent=state.blocked.size;$('eventlog').innerHTML=auto.events.map(t=>'<li>'+t+'</li>').join('');$('autoqueue').textContent=auto.orders.length?auto.orders.map(o=>depts[o.id].item+' × '+o.qty).join(' · '):'No pending orders';$('dispatch').disabled=!!state.mission||auto.enabled;$('charge').disabled=!!state.mission||auto.enabled;}
update=function(){originalUpdate();renderAuto();};
function protectedCell(n){return n===state.pos||[dock,stockroom,pickup,entrance,...depts.map(d=>d.target)].includes(n)||walls.has(n);}
function addBlockage(){const ahead=state.path.slice(2).find(n=>!protectedCell(n)&&!state.blocked.has(n));const candidates=[key(9,7),key(15,7),key(9,11),key(15,3)];const n=ahead??candidates.find(n=>!protectedCell(n)&&!state.blocked.has(n));if(n===undefined){eventLog('No free event location. Existing blockages remain visible.');return;}
 const names=['Abandoned trolley','Spilled drink','Delivery crates'];const name=names[auto.eventIndex++%names.length];auto.oldPath=[state.pos,...state.path];auto.flashUntil=auto.elapsed+7;state.blocked.add(n);auto.temporary.set(n,{until:auto.elapsed+18,name});const before=state.path.length;if(state.mission)plan(true);const after=state.path.length;eventLog(name+' blocks an aisle for 18 seconds. '+(state.mission?(after?'Route recalculated: '+before+' → '+after+' steps.':'No route: Pip waits safely.'):'Pip will avoid it on the next mission.'));update();}
function clearTemporary(){for(const n of auto.temporary.keys())state.blocked.delete(n);auto.temporary.clear();if(state.mission)plan(true);eventLog('Temporary blockages cleared. Manual obstacles are preserved.');update();}
function chooseMission(){if(!auto.enabled||state.mission||auto.elapsed<auto.nextDecision)return;auto.nextDecision=auto.elapsed+2;
 if(state.battery<35){auto.reason='Battery below 35% → return to charge.';dispatch(true);renderAuto();return;}
 const low=state.stock.findIndex((n,i)=>n<=4&&state.reserve[i]>0);let chosen;
 if(low>=0){chosen={task:'restock',id:low,qty:Math.min(8,state.reserve[low])};auto.reason=depts[low].name+' has '+state.stock[low]+' units → replenish shelf.';}
 else if(auto.orders.length){const o=auto.orders[0];if(state.stock[o.id]<o.qty){if(state.reserve[o.id]>0){chosen={task:'restock',id:o.id,qty:Math.min(8,state.reserve[o.id])};auto.reason='Order needs '+depts[o.id].item+' → restock first.';}else{auto.orders.shift();eventLog('Order unavailable: '+depts[o.id].item+' has no replenishment stock.');return;}}else{chosen={task:'pick',id:o.id,qty:o.qty};auto.reason='Next customer order → '+o.qty+' '+depts[o.id].item+'.';}}
 else {auto.reason='No pending orders or low shelves · standing by.';renderAuto();return;}
 const previous={task,qty,product:$('product').value};task=chosen.task;qty=chosen.qty;$('product').value=String(chosen.id);dispatch();task=previous.task;qty=previous.qty;$('product').value=previous.product;
 if(state.mission&&chosen.task==='pick')auto.orders.shift();else if(!state.mission){auto.reason='Selected task is currently unreachable or lacks energy. Retrying shortly.';if(state.battery<65)dispatch(true);}update();}
function autoStep(dt){if(state.paused)return;auto.elapsed+=dt/1000*(+$('speed').value);
 for(const[n,entry]of auto.temporary){if(auto.elapsed>=entry.until){state.blocked.delete(n);auto.temporary.delete(n);if(state.mission)plan(true);eventLog(entry.name+' cleared. Aisle reopened.');update();}}
 if(auto.enabled&&auto.elapsed>=auto.nextOrder){auto.nextOrder=auto.elapsed+12;const id=auto.sequence++%depts.length;if(auto.orders.length<6){auto.orders.push({id,qty:2});eventLog('New order received: '+depts[id].item+' × 2.');}}
 if(auto.environment&&auto.elapsed>=auto.nextEvent){auto.nextEvent=auto.elapsed+14;addBlockage();}
 chooseMission();
}
tick=function(dt){autoStep(dt);originalTick(dt);};
draw=function(ts){originalDraw(ts);if(!auto)return;const enabled=$('overlay').checked;if(enabled&&auto.elapsed<auto.flashUntil&&auto.oldPath.length){ctx.strokeStyle='#c47c6180';ctx.lineWidth=3;ctx.setLineDash([3,7]);ctx.beginPath();auto.oldPath.forEach((n,i)=>{const[x,y]=center(n);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.stroke();ctx.setLineDash([]);}
 for(const[n,e]of auto.temporary){const[x,y]=center(n);rect(x-19,y-15,38,30,'#d49a58',4);text('!',x-3,y+6,20,'#fff8de','700');rect(x-40,y-35,80,16,'#fff9e9',3);text(e.name==='Spilled drink'?'SPILL':e.name==='Delivery crates'?'CRATES':'TROLLEY',x-25,y-24,8,'#8d623b','700');text(Math.max(0,Math.ceil(e.until-auto.elapsed))+'s',x-7,y+28,9,'#8d623b');}};
reset=function(){originalReset();initAuto();update();};$('reset').onclick=reset;
$('autopilot').onchange=()=>{auto.enabled=$('autopilot').checked;if(auto.enabled){if(!auto.orders.length)auto.orders.push({id:0,qty:2},{id:2,qty:2});auto.nextDecision=0;auto.nextOrder=auto.elapsed+12;auto.reason='Autonomous shift started. Orders and stock drive decisions.';eventLog('Autopilot on. Priority: recharge → low stock → customer orders.');chooseMission();}else{auto.reason='Manual mode · current mission finishes safely.';eventLog('Autopilot off. No further missions will be assigned.');}update();};
$('dynamic').onchange=()=>{auto.environment=$('dynamic').checked;auto.nextEvent=auto.elapsed+6;eventLog(auto.environment?'Live environment on. First blockage in 6 seconds.':'New events stopped. Existing temporary blockages will expire.');};
$('trigger-event').onclick=addBlockage;$('clear-events').onclick=clearTemporary;
initAuto();
