import type { WorkUnit } from './types';
export interface UnitPlan { waves:WorkUnit[][]; warnings:string[]; criticalPathDays:number; totalEffortDays:number; }
/** Advisory dependency waves for AI-DLC Unit planning, not an execution scheduler. */
export function planUnits(units:WorkUnit[]): UnitPlan {
  const warnings:string[]=[], byId=new Map(units.map(u=>[u.id,u]));
  const remaining=new Set(units.map(u=>u.id)), finished=new Set<string>(),waves:WorkUnit[][]=[];
  const byWave=new Map<string,number>();
  for(const unit of units){
    if(unit.dependsOn.includes(unit.id))warnings.push(`${unit.name||unit.id} depends on itself.`);
    for(const dep of unit.dependsOn)if(!byId.has(dep))warnings.push(`${unit.name||unit.id} references a missing dependency.`);
    if(!unit.acceptanceTests.trim())warnings.push(`${unit.name||unit.id} is missing acceptance-test criteria.`);
    if(!unit.owner.trim())warnings.push(`${unit.name||unit.id} has no accountable owner.`);
  }
  while(remaining.size){
    const ready=units.filter(u=>remaining.has(u.id)&&u.dependsOn.every(id=>finished.has(id)));
    if(!ready.length){warnings.push('Cyclic or unresolved Unit dependency graph; execution order cannot be determined.');break;}
    waves.push(ready);
    ready.forEach(u=>{remaining.delete(u.id);finished.add(u.id);byWave.set(u.id,waves.length);});
  }
  const durations=new Map<string,number>();
  for(const wave of waves){for(const u of wave){durations.set(u.id,Math.max(0,u.estimateDays)+Math.max(0,...u.dependsOn.map(id=>durations.get(id)||0)));}}
  return {waves,warnings,criticalPathDays:Math.max(0,...durations.values()),totalEffortDays:units.reduce((s,u)=>s+Math.max(0,u.estimateDays),0)};
}
