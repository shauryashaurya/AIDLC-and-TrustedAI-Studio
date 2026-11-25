import test from 'node:test';
import assert from 'node:assert/strict';
import { planUnits } from '../src/lib/planning.ts';
const u=(id,deps=[],days=1)=>({id,name:id,owner:'team',description:'',dependsOn:deps,acceptanceTests:'independent validation',risk:'medium',status:'planned',estimateDays:days});
test('execution planner groups independent Units into valid parallel waves',()=>{
 const plan=planUnits([u('A',[],2),u('B',[],1),u('C',['A','B'],4),u('D',['C'],1)]);
 assert.deepEqual(plan.waves.map(w=>w.map(u=>u.id)),[['A','B'],['C'],['D']]);
 assert.equal(plan.criticalPathDays,7);assert.equal(plan.totalEffortDays,8);assert.equal(plan.warnings.length,0);
});
test('dependency cycles are not silently scheduled',()=>{
 const plan=planUnits([u('A',['B']),u('B',['A'])]);assert.equal(plan.waves.length,0);
 assert.ok(plan.warnings.some(s=>s.includes('Cyclic')));
});
