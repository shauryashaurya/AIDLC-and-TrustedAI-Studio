// Next-action suggestions. Each suggestion is a check on the current case; its "why" text is built
// from the AI-DLC stage catalog (stage names and output files) and the NIST AI RMF / OWASP catalogs.
import type { Page, UseCase } from './types';
import type { StageCatalog } from './aidlc';
import type { FrameworkCatalogs } from './frameworks';

export interface GuidanceContext { stages: StageCatalog; frameworks: FrameworkCatalogs; criticalControlIds: string[] }
export interface Suggestion { id: string; action: string; why: string; page: Page; stage?: string; source: string }

const has = (s: string | undefined | null) => !!(s ?? '').trim();

export function stageWhy(ctx: GuidanceContext, id: string): string {
  const s = ctx.stages.stages.find(x => x.id === id);
  if (!s) return '';
  return `AI-DLC ${s.id} ${s.name} (lead: ${s.lead})${s.outputs.length ? ` writes ${s.outputs.slice(0, 3).join(', ')}` : ''}.`;
}
export function rmfQuote(ctx: GuidanceContext, id: string): string {
  const t = ctx.frameworks.rmf.subcategories.find(x => x.id === id)?.text;
  return t ? `NIST AI RMF ${id}: “${t}”` : '';
}
const asi = (ctx: GuidanceContext, id: string) => {
  const i = ctx.frameworks.asi.items.find(x => x.id === id);
  return i ? `OWASP Agentic 2026 ${i.id} ${i.name}` : id;
};

/** Ordered checks; the first unmet ones are the next actions. */
export function nextActions(c: UseCase | null, ctx: GuidanceContext): Suggestion[] {
  const tag = ctx.stages.upstream.tag;
  if (!c) return [{ id: 'start', action: 'Create a use case, open a saved one, or load a sample', why: `Every AI-DLC ${tag} intent starts at ${stageWhy(ctx, '1.1')}`, page: 'home', stage: '1.1', source: 'aidlc-stages' }];
  const out: Suggestion[] = [];
  const add = (cond: boolean, s: Suggestion) => { if (cond) out.push(s); };
  add(!has(c.title) || !has(c.problem) || !has(c.outcome), { id: 'intent', action: 'Write the title, problem and target outcome', why: stageWhy(ctx, '1.1'), page: 'ideate', stage: '1.1', source: 'aidlc-stages' });
  add(!has(c.accountableOwner) || !has(c.sponsor), { id: 'owner', action: 'Name the sponsor and accountable owner', why: rmfQuote(ctx, 'GOVERN 2.1'), page: 'ideate', source: 'nist' });
  add(!has(c.inScope) || !has(c.outOfScope) || !has(c.successMetrics), { id: 'scope', action: 'Define in scope, out of scope and success metrics', why: stageWhy(ctx, '1.4'), page: 'ideate', stage: '1.4', source: 'aidlc-stages' });
  add(!has(c.jurisdictions), { id: 'law', action: 'Record the jurisdictions the system will operate in', why: rmfQuote(ctx, 'GOVERN 1.1'), page: 'ideate', source: 'nist' });
  add(!c.stages.length, { id: 'plan', action: `Create the stage plan from the ${c.profile} profile`, why: `The workflow profile decides which AI-DLC ${tag} stages run. ${stageWhy(ctx, '0.3')}`, page: 'lifecycle', stage: '0.3', source: 'aidlc-profiles' });
  add(!c.nodes.length, { id: 'graph', action: 'Design the agent graph', why: stageWhy(ctx, '2.6'), page: 'patterns', stage: '2.6', source: 'aidlc-stages' });
  const actors = c.nodes.filter(n => n.kind === 'agent' || n.kind === 'tool' || n.kind === 'orchestrator');
  add(actors.some(n => !has(n.toolPermissions) || !has(n.identity)), { id: 'identity', action: 'Record tool permissions and identity for every agent, tool and orchestrator', why: `${asi(ctx, 'ASI03')}; ${asi(ctx, 'ASI02')}.`, page: 'patterns', source: 'owasp-agent' });
  const open = (c.threats ?? []).filter(t => t.status === 'open').length;
  add(open > 0, { id: 'threats', action: `Resolve ${open} open threat-model entries`, why: rmfQuote(ctx, 'MEASURE 2.7'), page: 'patterns', stage: '3.3', source: 'nist' });
  add(c.nodes.length > 0 && !c.scenarios.length, { id: 'tests', action: 'Add positive, failure and adversarial test scenarios', why: rmfQuote(ctx, 'MEASURE 2.3'), page: 'patterns', stage: '3.6', source: 'nist' });
  add(!c.units.length, { id: 'units', action: 'Split the work into Units of Work with dependencies', why: stageWhy(ctx, '2.7'), page: 'lifecycle', stage: '2.7', source: 'aidlc-stages' });
  add(c.nfr.requestsPerDay <= 0 || c.nfr.p95TargetSeconds <= 0, { id: 'nfr', action: 'Enter traffic and the P95 latency target', why: stageWhy(ctx, '3.2'), page: 'nfr', stage: '3.2', source: 'aidlc-stages' });
  add(c.nfr.availabilityPct <= 0, { id: 'slo', action: 'Set the availability SLO', why: stageWhy(ctx, '4.4'), page: 'nfr', stage: '4.4', source: 'aidlc-stages' });
  add(c.nodes.length > 0 && c.nodes.every(n => !n.inputTokens && !n.costPerCallUsd), { id: 'cost', action: 'Enter per-node token, price and latency inputs, then run the graph simulation', why: rmfQuote(ctx, 'MAP 3.2'), page: 'nfr', source: 'nist' });
  add(!c.controls.length, { id: 'controls', action: 'Create the control register', why: rmfQuote(ctx, 'MANAGE 1.1'), page: 'trust', source: 'nist' });
  const gaps = c.controls.length ? ctx.criticalControlIds.filter(id => { const a = c.controls.find(x => x.id === id); return !(a?.status === 'evidenced' && has(a.owner) && has(a.evidence)); }).length : 0;
  add(gaps > 0, { id: 'evidence', action: `Record evidence for ${gaps} essential controls`, why: rmfQuote(ctx, 'MEASURE 2.1'), page: 'trust', source: 'nist' });
  add(!c.decisions.length, { id: 'decisions', action: 'Record the key decisions and their rationale', why: stageWhy(ctx, '1.7'), page: 'lifecycle', stage: '1.7', source: 'aidlc-stages' });
  const unapproved = c.stages.filter(s => !['approved', 'waived'].includes(s.status)).length;
  add(c.stages.length > 0 && unapproved > 0, { id: 'gates', action: `Close ${unapproved} planned stages (approver and evidence)`, why: ctx.stages.rules[0], page: 'lifecycle', source: 'aidlc-stages' });
  out.push({ id: 'export', action: 'Export vision.md and the implementation kit', why: 'vision.md is the input to a real AI-DLC run; the kit carries CLAUDE.md, AGENTS.md, skills, subagents and MCP definitions into the implementation repository.', page: 'reports', source: 'aidlc-vision' });
  return out;
}

/** What the current page contributes, in AI-DLC and Trusted AI terms. */
export function pageSignificance(page: Page, ctx: GuidanceContext): string {
  const s = (id: string) => stageWhy(ctx, id);
  switch (page) {
    case 'home': return 'Start or resume a use case. Each case carries one intent through the AI-DLC phases.';
    case 'workshop': return 'Modules follow the AI-DLC phases in order; each ends with a capstone and checkpoint questions.';
    case 'discover': return 'AWS samples are starting material only; nothing in a sample is reviewed or approved.';
    case 'ideate': return `${s('1.1')} ${s('1.4')}`;
    case 'patterns': return `${s('2.6')} ${rmfQuote(ctx, 'MEASURE 2.7')}`;
    case 'nfr': return `${s('3.2')} ${s('3.3')}`;
    case 'trust': return `${rmfQuote(ctx, 'MANAGE 1.1')}`;
    case 'lifecycle': return `${s('2.7')} ${s('2.9')}`;
    case 'reports': return `${s('1.7')} The exports carry the plan into an AI-DLC run and the implementation repository.`;
    case 'references': return 'Versions and check dates for every source the plan relies on.';
  }
}
