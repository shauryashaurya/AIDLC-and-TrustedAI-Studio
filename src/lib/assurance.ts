import type { UseCase } from './types';
import { CONTROLS, STAGES } from './model';
export interface Readiness { score:number; evidenced:number; assessed:number; total:number; criticalGaps:string[]; warnings:string[]; gate:'Blocked'|'Review required'|'Planning only'; }
export function assessReadiness(c:UseCase):Readiness {
  const critical=CONTROLS.filter(k=>k.critical);
  const evidenced=critical.filter(k=>{const a=c.controls.find(a=>a.id===k.id);return a?.status==='evidenced' && !!a.owner.trim() && !!a.evidence.trim()});
  const assessed=c.controls.filter(a=>a.status!=='unassessed').length;
  const criticalGaps=critical.filter(k=>!evidenced.find(a=>a.id===k.id)).map(k=>`${k.id}: ${k.name}`);
  const warnings:string[]=[];
  if(!c.accountableOwner) warnings.push('No accountable owner.');
  if(!c.outcome||!c.successMetrics) warnings.push('Outcome and measurable success metrics are incomplete.');
  if(!c.nodes.length) warnings.push('No agent/system architecture configured.');
  if(!c.stages.length) warnings.push('No AI-DLC stages selected.');
  if(c.riskTier==='high'||c.riskTier==='critical'){
    if(!c.scenarios.some(t=>t.failureAndAbuseCase.trim()&&t.verification.trim()))warnings.push('High-impact work requires an independently specified failure/abuse evaluation.');
    if(!c.nodes.some(n=>n.kind==='human'))warnings.push('High-impact work lacks an explicit human authorization point.');
  }
  const importantGates=STAGES.filter(s=>s.gate && c.stages.some(p=>p.id===s.id));
  const missingGates=importantGates.filter(s=>!['approved','waived'].includes(c.stages.find(p=>p.id===s.id)?.status||''));
  if(missingGates.length) warnings.push(`${missingGates.length} selected decision gates are not closed.`);
  const unsupportedGates=c.stages.filter(s=>s.status==='approved'&&(!s.approver.trim()||!s.evidence.trim()));
  if(unsupportedGates.length)warnings.push(`${unsupportedGates.length} stages are marked approved without an approver and evidence reference.`);
  const unrecordedExceptions=c.controls.filter(s=>s.status==='accepted'&&(!s.owner.trim()||!s.exception.trim()));
  if(unrecordedExceptions.length)warnings.push(`${unrecordedExceptions.length} risk exceptions have no owner and written justification.`);
  const openThreats=(c.threats??[]).filter(t=>t.status==='open').length;
  if(openThreats) warnings.push(`${openThreats} threat-model entries are still open.`);
  const mitigatedNoText=(c.threats??[]).filter(t=>t.status==='mitigated'&&!t.mitigation.trim()).length;
  if(mitigatedNoText) warnings.push(`${mitigatedNoText} threat entries are marked mitigated without a written mitigation.`);
  const score=critical.length?Math.round(100*evidenced.length/critical.length):0;
  const gate=criticalGaps.length?'Blocked':warnings.length?'Review required':'Planning only';
  return {score,evidenced:evidenced.length,assessed,total:critical.length,criticalGaps,warnings,gate};
}
export function graphWarnings(c:UseCase):string[] {
  const warnings:string[]=[];
  const names=new Set(c.nodes.map(n=>n.id));
  if(c.nodes.length>2&&!c.nodes.some(n=>n.kind==='human')) warnings.push('No human authorization node in a multi-step workflow.');
  if(c.nodes.length>2&&!c.nodes.some(n=>n.kind==='policy')) warnings.push('No explicit policy decision point.');
  const noPerms=c.nodes.filter(n=>(n.kind==='agent'||n.kind==='tool')&&!n.toolPermissions.trim());
  if(noPerms.length) warnings.push(`No tool permissions recorded for: ${noPerms.map(n=>n.name).join(', ')}.`);
  const noIdentity=c.nodes.filter(n=>(n.kind==='agent'||n.kind==='tool'||n.kind==='orchestrator')&&!(n.identity??'').trim());
  if(noIdentity.length) warnings.push(`No identity (the credential the component acts under) recorded for: ${noIdentity.map(n=>n.name).join(', ')}.`);
  const tools=c.nodes.filter(n=>n.kind==='tool');
  const unsetAction=tools.filter(n=>!n.actionType);
  if(unsetAction.length) warnings.push(`Action type (read-only, additive or destructive) not set for: ${unsetAction.map(n=>n.name).join(', ')} (SEC-12; MCP readOnlyHint/destructiveHint).`);
  const humanBefore=(id:string)=>c.edges.some(e=>e.to===id&&c.nodes.find(n=>n.id===e.from)?.kind==='human');
  const unconfirmed=c.nodes.filter(n=>(n.actionType==='additive'||n.actionType==='destructive')&&!n.requiresHumanApproval&&!humanBefore(n.id));
  if(unconfirmed.length) warnings.push(`State-changing tools with no human confirmation and no human node before them: ${unconfirmed.map(n=>n.name).join(', ')} (SEC-12; MCP: a human in the loop with the ability to deny tool invocations).`);
  const unsandboxed=c.nodes.filter(n=>n.executesCode&&!(n.sandbox??'').trim());
  if(unsandboxed.length) warnings.push(`Nodes that execute code without a recorded sandbox: ${unsandboxed.map(n=>n.name).join(', ')} (SEC-08; OWASP ASI05).`);
  const openNoEgress=c.nodes.filter(n=>n.openWorld&&!(n.allowedEgress??'').trim());
  if(openNoEgress.length) warnings.push(`Open-world nodes without an egress allowlist: ${openNoEgress.map(n=>n.name).join(', ')} (MCP security best practices: SSRF, egress proxy).`);
  const unsafeRetry=c.edges.filter(e=>{const t=c.nodes.find(n=>n.id===e.to);return e.failurePolicy==='retry'&&!!t&&!!t.actionType&&t.actionType!=='read-only'&&!t.idempotent;});
  if(unsafeRetry.length) warnings.push(`${unsafeRetry.length} retried edges lead to state-changing, non-idempotent nodes (REL-02).`);
  const assignedRag=new Set(c.nodes.flatMap(n=>n.ragIds??[]));
  const unassignedRag=c.ragIds.filter(id=>!assignedRag.has(id));
  if(unassignedRag.length) warnings.push(`${unassignedRag.length} selected RAG techniques are not assigned to a retriever node, so no node implements them.`);
  const emptyPatterns=c.patternIds.filter(id=>!c.nodes.some(n=>n.patternId===id));
  if(emptyPatterns.length) warnings.push(`${emptyPatterns.length} selected agent patterns have no nodes tagged with them.`);
  const badP=c.edges.filter(e=>typeof e.probability==='number'&&(e.probability<0||e.probability>1));
  if(badP.length) warnings.push(`${badP.length} edge probabilities are outside 0–1.`);
  if(c.nodes.some(n=>n.spendLimitUsd<=0)) warnings.push('At least one node has no positive spend ceiling.');
  if(c.edges.some(e=>!names.has(e.from)||!names.has(e.to))) warnings.push('A connection references a removed node.');
  if(c.edges.some(e=>e.failurePolicy==='retry'&&!e.contract)) warnings.push('Retries require explicit idempotency and response contracts.');
  // Cycle detection to flag possible runaway orchestrations.
  const adj=new Map(c.nodes.map(n=>[n.id,[] as string[]]));
  c.edges.forEach(e=>adj.get(e.from)?.push(e.to));
  const visited=new Set<string>(),active=new Set<string>();let cyc=false;
  const visit=(id:string)=>{if(active.has(id)){cyc=true;return;}if(visited.has(id))return;active.add(id);(adj.get(id)||[]).forEach(visit);active.delete(id);visited.add(id)};
  c.nodes.forEach(n=>visit(n.id));
  if(cyc) warnings.push('Graph contains a cycle: confirm max iterations, deadlines and stop conditions.');
  return warnings;
}
