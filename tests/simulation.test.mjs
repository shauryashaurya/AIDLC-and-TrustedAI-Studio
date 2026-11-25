import test from 'node:test';
import assert from 'node:assert/strict';
import { entryNodes, percentile, simulate, visitCost } from '../src/lib/simulation.ts';
import { errorBudget, latencyCheck } from '../src/lib/slo.ts';

const node=(id,o={})=>({id,name:id,kind:'agent',x:0,y:0,description:'',model:'',toolPermissions:'',dataScope:'',owner:'',timeoutSeconds:60,maxSteps:10,spendLimitUsd:0,
 identity:'',inputTokens:0,outputTokens:0,inputPricePerM:0,outputPricePerM:0,cachedInputPct:0,cachedInputPricePerM:0,costPerCallUsd:0,latencySeconds:0,routing:'one',...o});
const edge=(from,to,probability=1)=>({id:`${from}-${to}`,from,to,label:'',contract:'',failurePolicy:'halt',probability});

test('visit cost applies cached-input pricing',()=>{
 const n=node('a',{inputTokens:1_000_000,outputTokens:500_000,inputPricePerM:2,outputPricePerM:8,cachedInputPct:50,cachedInputPricePerM:0.5,costPerCallUsd:0.01});
 assert.equal(visitCost(n),0.5*2+0.5*0.5+0.5*8+0.01);
});
test('a straight chain has a deterministic cost and summed latency',()=>{
 const nodes=[node('a',{costPerCallUsd:1,latencySeconds:2}),node('b',{costPerCallUsd:2,latencySeconds:3})];
 const r=simulate(nodes,[edge('a','b')],{runs:50});
 assert.equal(r.cost.mean,3);assert.equal(r.cost.p95,3);assert.equal(r.latency.p50,5);
 assert.deepEqual(r.entryIds,['a']);
});
test('routing "one" splits by probability; "all" fans out and takes the slowest branch',()=>{
 const one=simulate([node('r',{routing:'one'}),node('x',{costPerCallUsd:1}),node('y',{costPerCallUsd:3})],[edge('r','x',0.75),edge('r','y',0.25)],{runs:4000,seed:7});
 assert.ok(Math.abs(one.cost.mean-1.5)<0.1,`mean ${one.cost.mean}`);
 assert.equal(one.cost.p50,1);assert.equal(one.cost.p95,3);
 const all=simulate([node('r',{routing:'all'}),node('x',{costPerCallUsd:1,latencySeconds:1}),node('y',{costPerCallUsd:3,latencySeconds:4})],[edge('r','x'),edge('r','y')],{runs:20});
 assert.equal(all.cost.mean,4);assert.equal(all.latency.max,4);
});
test('cycles are bounded by maxSteps and reported',()=>{
 const nodes=[node('a',{costPerCallUsd:1,maxSteps:3}),node('b',{costPerCallUsd:1,maxSteps:3})];
 const r=simulate(nodes,[edge('a','b'),edge('b','a')],{runs:10});
 assert.equal(r.cost.mean,6);assert.equal(r.stepCapHitRate,1);
 assert.equal(r.nodes.find(n=>n.id==='a').capHitRate,1);
});
test('spend caps are reported per node',()=>{
 const r=simulate([node('a',{costPerCallUsd:2,spendLimitUsd:1})],[],{runs:5});
 assert.equal(r.spendCapHitRate,1);
});
test('same seed gives the same result',()=>{
 const nodes=[node('r'),node('x',{costPerCallUsd:1}),node('y',{costPerCallUsd:2})];const edges=[edge('r','x',0.5),edge('r','y',0.5)];
 assert.deepEqual(simulate(nodes,edges,{seed:3}),simulate(nodes,edges,{seed:3}));
});
test('entry nodes and percentile helpers',()=>{
 assert.deepEqual(entryNodes([node('a'),node('b')],[edge('a','b'),edge('b','a')]),['a']);
 assert.equal(percentile([1,2,3,4,5,6,7,8,9,10],0.95),10);
 assert.equal(percentile([],0.5),0);
});
test('error budget arithmetic',()=>{
 const b=errorBudget(99.9,30,1_000_000);
 assert.ok(Math.abs(b.allowedDowntimeMinutes-43.2)<1e-9);
 assert.ok(Math.abs(b.allowedFailedRequests-1000)<1e-6);
 assert.equal(latencyCheck(3,2),'exceeds');assert.equal(latencyCheck(1,2),'within');assert.equal(latencyCheck(1,0),'no-target');
});
