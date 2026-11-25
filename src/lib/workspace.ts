// Workspace package: one folder tree a team drops into a repository before starting work with a coding
// agent and AI-DLC. It combines the implementation kit (kit.ts) with:
// - AI-DLC team templates at aidlc/spaces/default/memory/templates/<artifact>.md (stage-protocol.md,
//   "Template overrides": AI-DLC uses their ## headings as the artifact skeleton and checks them at the gate)
// - docs/aidlc/stage-gates.md: every planned AI-DLC gate with lead agent, artifact paths and Trusted AI checks
// - docs/trusted-ai/*.md: threat model, control register, cost and capacity, release decision (from the plan)
import type { UseCase } from './types';
import type { KitContext, KitFile, KitLanguage } from './kit';
import { buildKit, slugify } from './kit.ts';
import { allFrameworkIds, frameworkIndex, type ControlFrameworkIds } from './frameworks.ts';
import { projectCosts } from './financial.ts';
import { simulate } from './simulation.ts';
import { errorBudget, latencyCheck } from './slo.ts';
import { traceabilityMarkdown } from './exportmap.ts';

export interface TemplateCatalog {
  tag: string; templateDir: string; source: string; rule: string; selection: string;
  templates: { stem: string; title: string; stage: string; stageSlug: string; recordPath: string; ruleFile: string; ruleText: string; sections: { heading: string; note: string }[] }[];
}
export interface WorkspaceControl { id: string; name: string; domain: string; description: string; critical: boolean; frameworkIds: ControlFrameworkIds; aidlcGatePhase: string }
export interface GateType { id: string; kind: 'aidlc' | 'studio'; name: string; appliesTo: string; rule: string; source: string }
export interface WorkspaceContext extends KitContext { templates: TemplateCatalog; controls: WorkspaceControl[]; manage11: string; gates: GateType[] }
export interface WorkspaceOptions { includeTemplates: boolean; space?: string }

const has = (s: string | null | undefined) => !!(s ?? '').trim();
const cell = (s: string | number | null | undefined) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ') || '—';
const money = (n: number, d = 2) => `$${n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;

export function templateFiles(t: TemplateCatalog, space = 'default'): KitFile[] {
  return t.templates.map(x => ({
    path: `aidlc/spaces/${space}/memory/templates/${x.stem}.md`,
    purpose: `AI-DLC team template for ${x.stem}.md (stage ${x.stage} ${x.stageSlug})`,
    content: [
      `# ${x.title}`, '',
      `<!-- AI-DLC ${t.tag} team template for artifact "${x.stem}" (stage ${x.stage} ${x.stageSlug}, written to <record>/${x.recordPath}). AI-DLC uses the ## headings below as the skeleton and checks them at the gate. Section notes are from ${x.ruleFile}. -->`, '',
      ...x.sections.flatMap(s => [`## ${s.heading}`, '', ...(s.note ? [`<!-- ${s.note} -->`, ''] : [])])
    ].join('\n')
  }));
}

export function buildWorkspace(c: UseCase, lang: KitLanguage, ctx: WorkspaceContext, opts: WorkspaceOptions): KitFile[] {
  const space = opts.space ?? 'default';
  const fw = frameworkIndex(ctx.frameworks);
  const tag = ctx.stages.upstream.tag;
  const nodeName = (id: string) => c.nodes.find(n => n.id === id)?.name ?? id;
  const assess = (id: string) => c.controls.find(a => a.id === id);
  const templatesByStage = new Map<string, string[]>();
  for (const t of ctx.templates.templates) templatesByStage.set(t.stage, [...(templatesByStage.get(t.stage) ?? []), t.stem]);
  const kit = buildKit(c, lang, ctx).filter(f => f.path !== 'KIT.md');
  const files: KitFile[] = [...kit];
  const add = (path: string, purpose: string, content: string) => files.push({ path, purpose, content });
  if (opts.includeTemplates) files.push(...templateFiles(ctx.templates, space));

  // ---------- docs/aidlc/stage-gates.md ----------
  const controlLine = (k: WorkspaceControl) => { const a = assess(k.id); return `| ${k.id} ${cell(k.name)}${k.critical ? ' (essential)' : ''} | ${a?.status ?? 'not assessed'} | ${cell(a?.owner)} | ${cell(a?.evidence || a?.exception)} | ${allFrameworkIds(k.frameworkIds).join(', ')} |`; };
  const phaseOf = (id: string) => ctx.stages.stages.find(s => s.id === id)?.phase ?? '';
  const planned = c.stages.filter(p => !p.id.startsWith('0.'));
  const phasesInPlan = [...new Set(planned.map(p => phaseOf(p.id)))];
  const gatesFor = (id: string, perUnit: boolean) => ctx.gates.filter(g => g.kind === 'aidlc' && g.id !== 'stage-approval' && (g.appliesTo === id || (perUnit && g.id === 'unit-checkpoint') || (g.id === 'merge-gate' && perUnit && c.profile === 'workshop') || (g.id === 'reviewer-pass' && !!ctx.stages.stages.find(x => x.id === id)?.reviewer)));
  const gateDoc: string[] = [
    `# AI-DLC stage gates: ${c.title || 'Untitled'}`, '',
    `AI-DLC ${tag}, profile \`${c.profile}\`. ${ctx.stages.rules[0]} ${ctx.stages.rules[1]}`, '',
    '## Gate types', '',
    'A coding agent must not approve any of these on a person\'s behalf.', '',
    '| Gate | Where | Rule | Source |', '|---|---|---|---|',
    ...ctx.gates.map(g => `| ${cell(g.name)}${g.kind === 'studio' ? ' (studio)' : ''} | ${cell(g.appliesTo)} | ${cell(g.rule)} | ${cell(g.source)} |`), '',
    'For each gate: what AI-DLC writes, whether this package provides a team template, the plan\'s owner and approver, and the Trusted AI controls to check before approving. The control-to-phase assignment is this studio\'s mapping.', ''
  ];
  for (const ph of ctx.stages.phases.filter(p => phasesInPlan.includes(p.name))) {
    gateDoc.push(`## ${ph.name}`, '', `> ${ph.purpose}`, '');
    for (const p of planned.filter(x => phaseOf(x.id) === ph.name)) {
      const s = ctx.stages.stages.find(x => x.id === p.id)!;
      const tpl = templatesByStage.get(s.id) ?? [];
      gateDoc.push(`### ${s.id} ${s.name}`, '',
        `- Lead agent: ${s.lead}${s.support.length ? `; supporting: ${s.support.join(', ')}` : ''}${s.reviewer ? `; reviewer: ${s.reviewer}` : ''}`,
        `- Runs: ${s.runs}${s.condition ? ` — ${s.condition}` : ''}${s.perUnit ? ' (per Unit)' : ''}`,
        `- Gate: ${s.gate ? 'approval gate' : 'no gate'}${s.gateNote ? ` — ${s.gateNote}` : ''}`,
        ...(gatesFor(s.id, s.perUnit).length ? [`- Also at this stage: ${gatesFor(s.id, s.perUnit).map(g => g.name).join('; ')}`] : []),
        ...(s.id === '4.3' ? ['- Before this stage: release decision recorded in `docs/trusted-ai/release-decision.md` (studio gate, NIST AI RMF MANAGE 1.1)'] : []),
        `- Writes to \`${s.recordDir ?? '—'}\`: ${s.outputs.join(', ') || '—'}`,
        `- Team templates in this package: ${opts.includeTemplates && tpl.length ? tpl.map(t => `\`${t}.md\``).join(', ') : 'none'}`,
        `- Plan: status ${p.status}; owner ${p.owner || 'not set'}; approver ${p.approver || 'not set'}${p.evidence ? `; evidence: ${p.evidence}` : ''}`, '');
    }
    const ks = ctx.controls.filter(k => k.aidlcGatePhase === ph.name);
    if (ks.length) gateDoc.push(`**Trusted AI checks at the ${ph.name} gates**`, '', '| Control | Status | Owner | Evidence / exception | Framework IDs |', '|---|---|---|---|---|', ...ks.map(controlLine), '');
  }
  if (!planned.length) gateDoc.push('_No stage plan yet. Create one on the AI-DLC lifecycle page._', '');
  add('docs/aidlc/stage-gates.md', 'Every planned AI-DLC gate with artifacts, templates, owners and Trusted AI checks', gateDoc.join('\n'));

  // ---------- docs/trusted-ai/threat-model.md ----------
  const threats = c.threats ?? [];
  add('docs/trusted-ai/threat-model.md', 'Per-node threat register from the plan', [
    `# Threat model: ${c.title || 'Untitled'}`, '',
    'Items listed per node kind are this studio\'s mapping; item names are from OWASP Top 10 for LLM Applications 2026, OWASP Top 10 for Agentic Applications 2026 and MITRE ATLAS 2026.10.', '',
    ...(threats.length ? ['| Node | Item | Name | Status | Mitigation |', '|---|---|---|---|---|', ...threats.map(t => `| ${cell(nodeName(t.nodeId))} | ${t.threatId} | ${cell(fw.get(t.threatId)?.label)} | ${t.status} | ${cell(t.mitigation)} |`)] : ['_No threat entries in the plan._']), '',
    `Open: ${threats.filter(t => t.status === 'open').length} · mitigated: ${threats.filter(t => t.status === 'mitigated').length} · accepted: ${threats.filter(t => t.status === 'accepted').length} · not applicable: ${threats.filter(t => t.status === 'not-applicable').length}`, ''
  ].join('\n'));

  // ---------- docs/trusted-ai/control-register.md ----------
  add('docs/trusted-ai/control-register.md', `The ${ctx.controls.length} controls with status, evidence and framework IDs`, [
    `# Control register: ${c.title || 'Untitled'}`, '',
    'Framework IDs per control are this studio\'s mapping to NIST AI RMF 1.0, OWASP 2026 lists and MITRE ATLAS 2026.10.', '',
    '| Control | Domain | Checked at | Status | Owner | Likelihood × impact | Evidence / exception | Framework IDs |', '|---|---|---|---|---|---|---|---|',
    ...ctx.controls.map(k => { const a = assess(k.id); return `| ${k.id} ${cell(k.name)}${k.critical ? ' (essential)' : ''} | ${k.domain} | ${k.aidlcGatePhase} | ${a?.status ?? 'not assessed'} | ${cell(a?.owner)} | ${a ? `${a.likelihood}×${a.impact}` : '—'} | ${cell(a?.evidence || a?.exception)} | ${allFrameworkIds(k.frameworkIds).join(', ')} |`; }), '',
    '## NIST AI RMF 1.0 subcategories referenced', '',
    ...[...new Set(ctx.controls.flatMap(k => k.frameworkIds.nistAiRmf))].sort().map(id => `- **${id}**: ${fw.get(id)?.label ?? ''}`), ''
  ].join('\n'));

  // ---------- docs/trusted-ai/cost-and-capacity.md ----------
  const cost = projectCosts(c.nfr);
  const sim = c.nodes.length ? simulate(c.nodes, c.edges, { runs: 2000, seed: 42 }) : null;
  const budget = errorBudget(c.nfr.availabilityPct, c.nfr.daysPerMonth, cost.monthlyRequests);
  add('docs/trusted-ai/cost-and-capacity.md', 'NFR targets, cost projection, graph simulation and error budget', [
    `# Cost, capacity and SLOs: ${c.title || 'Untitled'}`, '',
    'All prices and volumes are inputs from the plan. Figures are the studio\'s calculations, not quotes or benchmarks.', '',
    '## Targets', '',
    `- Requests/day ${c.nfr.requestsPerDay.toLocaleString('en-US')} · peak ×${c.nfr.peakFactor} · P95 target ${c.nfr.p95TargetSeconds || '—'} s · availability ${c.nfr.availabilityPct || '—'}% · RTO ${c.nfr.rtoMinutes || '—'} min · RPO ${c.nfr.rpoMinutes || '—'} min`,
    ...(c.nfr.availabilityPct ? [`- Error budget over ${c.nfr.daysPerMonth} days: ${budget.allowedDowntimeMinutes.toFixed(1)} minutes or ${Math.round(budget.allowedFailedRequests).toLocaleString('en-US')} failed requests`] : []), '',
    '## Monthly projection (average-based)', '',
    '| Component | Monthly |', '|---|---:|',
    ...([['Model inference', cost.modelCost], ['Retrieval', cost.retrievalCost], ['Platform', cost.infrastructureCost], ['Storage', cost.storageCost], ['Human review', cost.humanReviewCost], ['Total', cost.monthlyCost]] as const).map(([k, v]) => `| ${k} | ${money(v)} |`), '',
    `Peak ${cost.peakRps.toFixed(2)} RPS · in-flight estimate ${Math.round(cost.suggestedConcurrency)} · ${money(cost.costPer1000)} per 1,000 requests`, '',
    '## Graph simulation (2,000 runs, seed 42)', '',
    ...(sim ? ['| Per request | Mean | P50 | P95 | Max |', '|---|---:|---:|---:|---:|',
      `| Cost | ${money(sim.cost.mean, 5)} | ${money(sim.cost.p50, 5)} | ${money(sim.cost.p95, 5)} | ${money(sim.cost.max, 5)} |`,
      `| Latency (s) | ${sim.latency.mean.toFixed(2)} | ${sim.latency.p50.toFixed(2)} | ${sim.latency.p95.toFixed(2)} | ${sim.latency.max.toFixed(2)} |`, '',
      `P95 latency vs target: ${latencyCheck(sim.latency.p95, c.nfr.p95TargetSeconds)}. Runs reaching a node visit cap: ${(sim.stepCapHitRate * 100).toFixed(1)}%. Runs over a node spend cap: ${(sim.spendCapHitRate * 100).toFixed(1)}%.`, '',
      '| Node | Mean visits | Mean cost | Share |', '|---|---:|---:|---:|',
      ...[...sim.nodes].sort((a, b) => b.meanCost - a.meanCost).map(n => `| ${cell(n.name)} | ${n.meanVisits.toFixed(2)} | ${money(n.meanCost, 5)} | ${sim.cost.mean ? (n.meanCost / sim.cost.mean * 100).toFixed(1) : '0'}% |`)] : ['_No agent graph in the plan._']), ''
  ].join('\n'));

  // ---------- docs/trusted-ai/release-decision.md ----------
  const essentialGaps = ctx.controls.filter(k => k.critical).filter(k => { const a = assess(k.id); return !(a?.status === 'evidenced' && has(a.owner) && has(a.evidence)); });
  const openThreats = threats.filter(t => t.status === 'open');
  const openStages = c.stages.filter(s => !['approved', 'waived'].includes(s.status));
  add('docs/trusted-ai/release-decision.md', 'Go/no-go record with the items still open in the plan', [
    `# Release decision: ${c.title || 'Untitled'}`, '',
    `> ${ctx.manage11}`, '',
    'This record lists what the plan still has open. The decision itself is made and signed by the accountable owner, not by this file or a coding agent.', '',
    `- Accountable owner: ${c.accountableOwner || 'not recorded'} · risk tier: ${c.riskTier} · jurisdictions: ${c.jurisdictions || 'not recorded'}`,
    `- Essential controls without evidence (${essentialGaps.length}): ${essentialGaps.map(k => k.id).join(', ') || 'none'}`,
    `- Open threat entries (${openThreats.length}): ${openThreats.map(t => `${nodeName(t.nodeId)} ${t.threatId}`).join('; ') || 'none'}`,
    `- Planned AI-DLC stages not approved or waived (${openStages.length}): ${openStages.map(s => s.id).join(', ') || 'none'}`, '',
    '## Decision', '', '- Decision (go / no-go / go with conditions):', '- Conditions:', '- Decided by:', '- Date:', '',
    '## Decisions already recorded in the plan', '',
    ...(c.decisions.length ? c.decisions.map(d => `- **${d.title || 'Untitled'}** (${d.date}, ${d.owner || 'owner not set'}): ${d.decision}${d.rationale ? ` — ${d.rationale}` : ''}`) : ['_None._']), ''
  ].join('\n'));

  // ---------- AGENTS.md: how to work, near the top; plan documents at the end ----------
  const agents = files.find(f => f.path === 'AGENTS.md')!;
  const skillDirs = files.filter(f => f.path.startsWith('.claude/skills/')).map(f => f.path);
  const howTo = ['## How to work in this repository', '',
    '1. Read this file, then `docs/aidlc/stage-gates.md` (gates, artifacts, owners and Trusted AI checks), `docs/architecture/architecture.md` (diagram, patterns, RAG), the files in `docs/trusted-ai/`, and `SKILLS.md`. `docs/TRACEABILITY.md` shows where each part of the plan is written.',
    `2. Delivery follows AI-DLC ${tag} with the \`${c.profile}\` profile. Start or resume with \`/aidlc ${c.profile} Read ./vision.md and build what it describes\` (\`$aidlc\` on Codex CLI) after \`aidlc config --harness <name>\` and \`aidlc doctor\`.`,
    `3. AI-DLC stops at gates (${ctx.gates.filter(g => g.kind === 'aidlc').map(g => g.name).join(', ')}). A gate needs a real human message to approve: never approve a gate, a Plan Approval, a Unit checkpoint or a merge gate on a person's behalf.`,
    ...(opts.includeTemplates ? [`4. AI-DLC writes ${ctx.templates.templates.length} artifacts using the team templates in \`aidlc/spaces/${space}/memory/templates/\`: keep every \`##\` heading; AI-DLC checks them at the gate.`] : []),
    `${opts.includeTemplates ? 5 : 4}. Before asking a person to approve a gate, check the Trusted AI controls listed for that phase in \`docs/trusted-ai/control-register.md\` and the open entries in \`docs/trusted-ai/threat-model.md\`, and say which are still open.`,
    `${opts.includeTemplates ? 6 : 5}. Skills: Claude Code loads \`.claude/skills/\`. Other agents: read these files as checklists — ${skillDirs.map(p => `\`${p}\``).join(', ')}. Use the trust review before merging changes to agents, tools, prompts or MCP code; the budget guard when changing limits, timeouts or retries; the AI-DLC hand-off when starting AI-DLC or preparing for a gate.`,
    `${opts.includeTemplates ? 7 : 6}. Each file in \`.claude/agents/\` describes one node of the agent graph (role, identity, permissions, limits, security attributes); follow it when working on that node.`,
    `${opts.includeTemplates ? 8 : 7}. The release decision is recorded by the accountable owner in \`docs/trusted-ai/release-decision.md\`, not by a coding agent.`, ''].join('\n');
  agents.content = agents.content.replace('## Build and test commands', howTo + '\n## Build and test commands');
  agents.content += ['', '## Plan documents', '',
    '- `docs/aidlc/stage-gates.md` — AI-DLC gates in this plan, artifacts each writes, owners, and the Trusted AI controls to check at each phase.',
    '- `docs/trusted-ai/threat-model.md`, `docs/trusted-ai/control-register.md`, `docs/trusted-ai/cost-and-capacity.md`, `docs/trusted-ai/release-decision.md`.',
    ...(opts.includeTemplates ? [`- \`aidlc/spaces/${space}/memory/templates/\` — AI-DLC team templates. AI-DLC uses their \`##\` headings as the structure of each artifact and checks them at the gate; do not remove headings.`] : []),
    '- `vision.md` — input for the AI-DLC run.', ''].join('\n');

  add('docs/TRACEABILITY.md', 'Where each part of the plan appears in this package and what it is used for', traceabilityMarkdown(slugify(c.title), c.title));

  // ---------- PACKAGE.md ----------
  const tree = [...files].map(f => f.path).sort();
  add('PACKAGE.md', 'What is in this package and how to start', [
    `# Workspace package: ${c.title || 'Untitled'} (${lang === 'typescript' ? 'TypeScript' : 'Python'})`, '',
    `Generated by AI-DLC × Trusted AI Studio from the plan. AI-DLC ${tag}, profile \`${c.profile}\`.`, '',
    '## Start', '',
    '1. Unzip into the root of the repository you will build in.',
    '2. Coding agents read `AGENTS.md`; Claude Code reads `CLAUDE.md`, which imports `AGENTS.md`.',
    `3. To run AI-DLC: install it, run \`aidlc config --harness <name>\` and \`aidlc doctor\`, then \`/aidlc ${c.profile} Read ./vision.md and build what it describes\` (\`$aidlc\` on Codex CLI).`,
    ...(opts.includeTemplates ? [`4. AI-DLC picks up the team templates in \`aidlc/spaces/${space}/memory/templates/\` for ${ctx.templates.templates.length} artifacts. ${ctx.templates.selection}`] : []), '',
    '## Files', '', '```', ...tree, 'PACKAGE.md', '```', ''
  ].join('\n'));
  return files;
}

export const packageFileName = (c: UseCase, lang: KitLanguage) => `${slugify(c.title)}-workspace-${lang}.zip`;
