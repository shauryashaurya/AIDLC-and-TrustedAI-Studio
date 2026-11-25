// Implementation kit: files a team copies into the implementation repository, generated from the plan.
// Formats follow (checked 2026-11-25): Claude Code docs (CLAUDE.md + @imports, skills, subagents, .mcp.json),
// agents.md, MCP specification 2026-07-28 (Tool definition), MCP TypeScript SDK 2.4.0, MCP Python SDK v2.3.0.
// Content comes from the case; nothing is added that the plan does not contain, except clearly marked TODOs.
import type { AgentNode, UseCase } from './types';
import type { ProfileCatalog, StageCatalog } from './aidlc';
import type { FrameworkCatalogs } from './frameworks';
import { frameworkIndex } from './frameworks.ts';
import { errorBudget } from './slo.ts';
import { technicalEnvironmentMarkdown, visionMarkdown } from './vision.ts';

export type KitLanguage = 'typescript' | 'python';
export interface KitControl { id: string; name: string; critical: boolean }
export interface PatternCatalog {
  agentPatterns: { id: string; name: string; mechanism: string; useCase: string; complexity: string; origin: string; risk: string; controlQuestions: string[]; assessment: string[] }[];
  ragTechniques: { id: string; name: string; mechanism: string; category: string; workflow?: string; bestUse?: string; complexity?: string }[];
  ragCompetencies: { source: string; items: { competency: string; topics: string }[] };
}
export interface KitControlFull extends KitControl { domain?: string; frameworkIds?: { nistAiRmf: string[]; owaspLlm2026: string[]; owaspAsi2026: string[]; atlas: string[] } }
export interface KitContext { stages: StageCatalog; profiles: ProfileCatalog; frameworks: FrameworkCatalogs; controls: KitControlFull[]; patterns: PatternCatalog; date?: string }
export interface KitFile { path: string; purpose: string; content: string }

export const slugify = (s: string, sep = '-') => (s || 'untitled').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, sep).replace(new RegExp(`^${sep}+|${sep}+$`, 'g'), '').slice(0, 48) || 'untitled';
const has = (s: string | undefined | null) => !!(s ?? '').trim();
const val = (s: string | undefined | null, fallback = '_Not recorded in the plan._') => has(s) ? String(s).trim() : fallback;
const cell = (s: string | number | undefined | null) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ') || '—';
const yamlStr = (s: string) => JSON.stringify(s.replace(/\s+/g, ' ').trim());

/** Unique snake_case MCP tool names for tool nodes. */
export function toolNames(nodes: AgentNode[]): Map<string, string> {
  const out = new Map<string, string>(), used = new Set<string>();
  for (const n of nodes.filter(n => n.kind === 'tool')) {
    let base = slugify(n.name, '_') || 'tool', name = base, i = 2;
    while (used.has(name)) name = `${base}_${i++}`;
    used.add(name); out.set(n.id, name);
  }
  return out;
}
/** MCP ToolAnnotations from node security attributes (schema 2026-07-28: readOnlyHint, destructiveHint, idempotentHint, openWorldHint). */
export function annotations(n: AgentNode): Record<string, boolean> | null {
  if (!n.actionType) return null;
  if (n.actionType === 'read-only') return { readOnlyHint: true, openWorldHint: !!n.openWorld };
  return { readOnlyHint: false, destructiveHint: n.actionType === 'destructive', idempotentHint: !!n.idempotent, openWorldHint: !!n.openWorld };
}
/** Mermaid flowchart of the agent graph (same shape as the designer's Mermaid export). */
export function mermaidGraph(c: UseCase): string {
  const safe = (s: string) => s.replace(/"/g, "'").replace(/\n/g, ' ');
  const ids = new Map(c.nodes.map((n, i) => [n.id, 'N' + i]));
  return ['flowchart LR', ...c.nodes.map(n => `  ${ids.get(n.id)}["${safe(n.name)} (${n.kind})"]`),
    ...c.edges.filter(e => ids.has(e.from) && ids.has(e.to)).map(e => `  ${ids.get(e.from)} -->|${safe(e.label || 'handoff')}${(e.probability ?? 1) < 1 ? ` p=${e.probability}` : ''}| ${ids.get(e.to)}`)].join('\n');
}
const subagentNodes = (c: UseCase) => c.nodes.filter(n => n.kind === 'agent' || n.kind === 'orchestrator' || n.kind === 'validator');

export function buildKit(c: UseCase, lang: KitLanguage, ctx: KitContext): KitFile[] {
  const slug = slugify(c.title);
  const server = `${slug}-tools`;
  const fw = frameworkIndex(ctx.frameworks);
  const tools = toolNames(c.nodes);
  const toolNodes = c.nodes.filter(n => tools.has(n.id));
  const agents = subagentNodes(c);
  const nodeName = (id: string) => c.nodes.find(n => n.id === id)?.name ?? id;
  const ts = lang === 'typescript';
  const date = ctx.date ?? new Date().toISOString().slice(0, 10);
  const tag = ctx.stages.upstream.tag;
  const selectedPatterns = ctx.patterns.agentPatterns.filter(p => c.patternIds.includes(p.id) || c.nodes.some(n => n.patternId === p.id));
  const nodeRag = new Set(c.nodes.flatMap(n => n.ragIds ?? []));
  const selectedRag = ctx.patterns.ragTechniques.filter(r => c.ragIds.includes(r.id) || nodeRag.has(r.id));
  const retrievers = c.nodes.filter(n => n.kind === 'retriever');
  const skills = [`${slug}-trust-review`, `${slug}-budget-guard`, `${slug}-aidlc-handoff`, ...(selectedPatterns.length ? [`${slug}-architecture-patterns`] : []), ...(selectedRag.length || retrievers.length ? [`${slug}-retrieval`] : [])];
  const patternName = (id: string) => ctx.patterns.agentPatterns.find(p => p.id === id)?.name ?? '';
  const ragName = (id: string) => ctx.patterns.ragTechniques.find(r => r.id === id)?.name ?? id;
  const ctrlStatus = (id: string) => c.controls.find(a => a.id === id)?.status ?? 'not assessed';
  const agentFile = (n: AgentNode) => `${slugify(n.name)}`;
  const threats = c.threats ?? [];
  const budget = errorBudget(c.nfr.availabilityPct, c.nfr.daysPerMonth, c.nfr.requestsPerDay * c.nfr.daysPerMonth);
  const essentialGaps = ctx.controls.filter(k => k.critical).filter(k => { const a = c.controls.find(x => x.id === k.id); return !(a?.status === 'evidenced' && has(a.owner) && has(a.evidence)); });
  const files: KitFile[] = [];
  const add = (path: string, purpose: string, content: string) => files.push({ path, purpose, content });

  const commands = ts
    ? ['`npm install`', '`npm test` — run the test suite (add tests under `test/`)', '`npx tsc --noEmit` — type-check', '`npx tsx mcp/server.ts` — start the MCP tool server (stdio)']
    : ['`uv sync`', '`uv run pytest` — run the test suite (add tests under `tests/`)', '`uv run mcp dev mcp/server.py` — inspect the MCP tool server', '`uv run mcp run mcp/server.py --transport streamable-http` — run it over HTTP'];

  // ---------- AGENTS.md (agents.md format: plain Markdown, recommended sections) ----------
  add('AGENTS.md', 'Project instructions for coding agents (agents.md format)', [
    `# ${c.title || 'Untitled use case'}`, '',
    `Generated from the AI-DLC × Trusted AI Studio plan on ${date}. Edit this file as the implementation evolves.`, '',
    '## Project overview', '',
    val(c.summary), '',
    `- **Problem:** ${val(c.problem)}`, `- **Outcome:** ${val(c.outcome)}`, `- **In scope:** ${val(c.inScope)}`, `- **Out of scope:** ${val(c.outOfScope)}`,
    `- **Success metrics:** ${val(c.successMetrics)}`, `- **Constraints:** ${val(c.constraints)}`,
    `- **Risk tier:** ${c.riskTier} · **Data classification:** ${c.dataClassification} · **Jurisdictions:** ${val(c.jurisdictions, 'not recorded')}`,
    `- **Accountable owner:** ${val(c.accountableOwner, 'not recorded')} · **Sponsor:** ${val(c.sponsor, 'not recorded')}`, '',
    '## Build and test commands', '',
    `Language: ${ts ? 'TypeScript (Node.js)' : 'Python 3.11+ (the MCP Python SDK requires 3.11+)'}. The commands assume the scaffold in this kit (${ts ? '`package.json`' : '`pyproject.toml`'}); adjust them to your repository.`, '',
    ...commands.map(x => `- ${x}`), '',
    '## Code style guidelines', '',
    ...(ts ? ['- TypeScript in strict mode, ES modules.', '- Validate tool inputs with zod schemas (`zod/v4`), as the MCP TypeScript SDK expects.'] : ['- Type hints on all public functions.', '- MCP tools are plain functions decorated with `@mcp.tool()`; the docstring is the tool description.']),
    '- Every agent, tool and orchestrator runs under the identity listed in "Agent graph"; do not share credentials between nodes.', '',
    '## Agent graph', '',
    `Diagram and pattern details: \`docs/architecture/architecture.md\` (Mermaid source: \`docs/architecture/agent-graph.mmd\`).`, '',
    '| Node | Kind | Pattern | RAG techniques | Model | Identity | Tool permissions | Data boundary | Max visits / request | Timeout (s) | Spend cap (USD) |', '|---|---|---|---|---|---|---|---|---:|---:|---:|',
    ...c.nodes.map(n => `| ${cell(n.name)} | ${n.kind} | ${cell(patternName(n.patternId))} | ${cell((n.ragIds ?? []).map(ragName).join(', '))} | ${cell(n.model)} | ${cell(n.identity)} | ${cell(n.toolPermissions)} | ${cell(n.dataScope)} | ${n.maxSteps} | ${n.timeoutSeconds} | ${n.spendLimitUsd || '—'} |`), '',
    '| From | To | Label | Contract | On failure | Probability |', '|---|---|---|---|---|---:|',
    ...c.edges.map(e => `| ${cell(nodeName(e.from))} | ${cell(nodeName(e.to))} | ${cell(e.label)} | ${cell(e.contract)} | ${e.failurePolicy} | ${e.probability ?? 1} |`), '',
    '## Architecture patterns and retrieval', '',
    ...(selectedPatterns.length ? ['Agent patterns in this design (details, control questions and assessment criteria in `docs/architecture/architecture.md`):', '', ...selectedPatterns.map(p => `- **${p.name}** — ${p.mechanism}. Nodes: ${c.nodes.filter(n => n.patternId === p.id).map(n => n.name).join(', ') || 'none assigned yet'}.`), ''] : ['_No agent patterns selected in the plan._', '']),
    ...(selectedRag.length ? ['Retrieval techniques (RAG) in this design:', '', ...selectedRag.map(r => `- **${r.name}** (${r.category}) — ${r.mechanism}. Retriever nodes: ${c.nodes.filter(n => (n.ragIds ?? []).includes(r.id)).map(n => n.name).join(', ') || 'not assigned to a retriever node'}.`), ''] : ['_No RAG techniques selected in the plan._', '']),
    '## Testing instructions', '',
    ...(c.scenarios.length ? c.scenarios.map(s => `- **${val(s.name, 'Unnamed scenario')}** — trigger: ${val(s.trigger, '—')}; expected: ${val(s.expectedResult, '—')}${has(s.failureAndAbuseCase) ? `; failure/abuse: ${s.failureAndAbuseCase}` : ''}; verify by: ${val(s.verification, '—')}`) : ['_No test scenarios in the plan._']),
    ...c.units.filter(u => has(u.acceptanceTests)).map(u => `- Unit **${val(u.name, 'Untitled')}** acceptance: ${u.acceptanceTests}`), '',
    '## Security considerations', '',
    ...(threats.length ? ['| Node | Threat | Status | Mitigation |', '|---|---|---|---|', ...threats.map(t => `| ${cell(nodeName(t.nodeId))} | ${t.threatId} ${cell(fw.get(t.threatId)?.label)} | ${t.status} | ${cell(t.mitigation)} |`)] : ['_No threat-model entries in the plan._']), '',
    ...(essentialGaps.length ? [`Essential controls without evidence in the plan: ${essentialGaps.map(k => `${k.id} ${k.name}`).join('; ')}.`, ''] : []),
    `Residency: ${val(c.nfr.residency, 'not recorded')} · Encryption: ${val(c.nfr.encryption, 'not recorded')} · Network: ${val(c.nfr.networkBoundary, 'not recorded')} · Sensitive data: ${val(c.nfr.sensitiveData, 'not recorded')} · Data retention: ${val(c.nfr.dataRetention, 'not recorded')}`, '',
    '### Node security attributes', '',
    'Implement each node so it cannot do more than this table allows. "Human confirmation" means the call waits for a person who can deny it.', '',
    '| Node | Kind | Action type | Idempotent | Open world | Human confirmation | Executes code | Sandbox | Allowed egress |', '|---|---|---|---|---|---|---|---|---|',
    ...c.nodes.map(n => `| ${cell(n.name)} | ${n.kind} | ${n.actionType || 'not set'} | ${n.idempotent ? 'yes' : 'no'} | ${n.openWorld ? 'yes' : 'no'} | ${n.requiresHumanApproval ? 'yes' : 'no'} | ${n.executesCode ? 'yes' : 'no'} | ${cell(n.sandbox)} | ${cell(n.allowedEgress)} |`), '',
    ...(toolNodes.length ? ['### MCP server requirements (MCP specification 2026-07-28)', '',
      '- Servers MUST validate all tool inputs, implement proper access controls, rate limit tool invocations and sanitize tool outputs (server/tools, Security Considerations).',
      '- There SHOULD always be a human in the loop with the ability to deny tool invocations; tool annotations are untrusted unless they come from a trusted server.',
      ...(ts ? ['- This server uses stdio: implementations using an STDIO transport SHOULD NOT follow the HTTP authorization specification and instead retrieve credentials from the environment. Do not put secrets in `.mcp.json` or in code.']
        : ['- This server uses Streamable HTTP. Servers MUST validate the `Origin` header on all incoming connections (respond 403 if present and invalid); when running locally they SHOULD bind only to localhost (127.0.0.1); they SHOULD implement authentication for all connections.',
           '- If you implement authorization: servers MUST validate that access tokens were issued for them as the intended audience, MUST NOT accept or transit any other tokens, and invalid or expired tokens MUST receive HTTP 401. Access tokens MUST NOT be in the URI query string.']), ''] : []),
    '### Security controls in the plan', '',
    '| Control | Status | Owner | Evidence / exception |', '|---|---|---|---|',
    ...ctx.controls.filter(k => k.id.startsWith('SEC-')).map(k => { const a = c.controls.find(x => x.id === k.id); return `| ${k.id} ${cell(k.name)} | ${a?.status ?? 'not assessed'} | ${cell(a?.owner)} | ${cell(a?.evidence || a?.exception)} |`; }), '',
    '## Service targets', '',
    `- P95 latency target: ${c.nfr.p95TargetSeconds || 'not set'} s · availability SLO: ${c.nfr.availabilityPct || 'not set'}%${c.nfr.availabilityPct ? ` (error budget ${budget.allowedDowntimeMinutes.toFixed(1)} min per ${c.nfr.daysPerMonth} days)` : ''} · RTO ${c.nfr.rtoMinutes || '—'} min · RPO ${c.nfr.rpoMinutes || '—'} min`, '',
    '## Delivery plan', '',
    `AI-DLC ${tag} profile: \`${c.profile}\`. Start a run with \`/aidlc ${c.profile} Read ./vision.md and build what it describes\`.`, '',
    ...(c.units.length ? ['| Unit | Owner | Depends on | Status |', '|---|---|---|---|', ...c.units.map(u => `| ${cell(u.name)} | ${cell(u.owner)} | ${u.dependsOn.map(d => cell(c.units.find(x => x.id === d)?.name)).join(', ') || '—'} | ${u.status} |`)] : ['_No Units of Work in the plan._']), ''
  ].join('\n'));

  // ---------- CLAUDE.md (imports AGENTS.md, per Claude Code memory docs) ----------
  add('CLAUDE.md', 'Claude Code project instructions; imports AGENTS.md', [
    '@AGENTS.md', '',
    '# Claude Code', '',
    `- Skills (\`.claude/skills/\`): ${skills.map(s => `\`${s}\``).join(', ')}.`,
    `- Subagents (\`.claude/agents/\`): ${agents.length ? agents.map(a => `\`${agentFile(a)}\``).join(', ') : 'none'}.`,
    `- MCP server (\`.mcp.json\`): ${toolNodes.length ? `\`${server}\` with tools ${[...tools.values()].map(t => `\`${t}\``).join(', ')}` : 'none (the plan has no tool nodes)'}.`,
    `- Use \`${skills[0]}\` before merging any change to agents, tools, prompts or MCP code; use \`${skills[1]}\` when changing limits, timeouts or retries; use \`${skills[2]}\` when starting AI-DLC or preparing for a gate.${skills.includes(`${slug}-architecture-patterns`) ? ` Use \`${slug}-architecture-patterns\` when changing hand-offs, loops or escalation.` : ''}${skills.includes(`${slug}-retrieval`) ? ` Use \`${slug}-retrieval\` when building or changing retrieval.` : ''} \`SKILLS.md\` lists them all.`,
    '- Architecture: `docs/architecture/architecture.md` (diagram, patterns, RAG techniques per node).',
    "- Delegate work on a single node to its subagent; each subagent file states that node's identity, permissions, limits and security attributes.",
    "- Never approve an AI-DLC gate, Plan Approval, Unit checkpoint or merge gate on a person's behalf; ask the person.",
    '- Before changing a node, tool or edge, check its rows in AGENTS.md "Agent graph" and "Node security attributes" and keep its identity, permissions and limits.',
    '- After a change, run the commands in AGENTS.md "Build and test commands".', ''
  ].join('\n'));

  // ---------- Skills ----------
  add(`.claude/skills/${skills[0]}/SKILL.md`, 'Skill: check a change against the plan’s permissions, threats and controls', [
    '---', `name: ${skills[0]}`, `description: ${yamlStr(`Review a code change in ${c.title || 'this project'} against the planned tool permissions, node identities, threat mitigations and essential controls. Use before merging changes to agents, tools or prompts.`)}`, '---', '',
    `# Trust review: ${c.title || 'Untitled'}`, '',
    'For the nodes touched by the change, confirm:', '',
    ...c.nodes.filter(n => n.kind !== 'human').map(n => `- **${n.name}** acts as \`${val(n.identity, 'identity not recorded')}\`, may do: ${val(n.toolPermissions, 'permissions not recorded')}; data boundary: ${val(n.dataScope, 'not recorded')}; action type ${n.actionType || 'not set'}${n.requiresHumanApproval ? '; human confirmation required' : ''}${n.executesCode ? `; executes code in ${val(n.sandbox, 'an unrecorded sandbox')}` : ''}${n.openWorld ? `; egress limited to ${val(n.allowedEgress, 'not recorded')}` : ''}.`), '',
    'Also confirm the change keeps the MCP server requirements and node security attributes in AGENTS.md "Security considerations".', '',
    'Trusted AI controls that code changes can affect (status from the plan; full register in `docs/trusted-ai/control-register.md`):', '',
    '| Control | Status | Framework IDs |', '|---|---|---|',
    ...ctx.controls.filter(k => !k.id.startsWith('GOV-')).map(k => `| ${k.id} ${cell(k.name)}${k.critical ? ' (essential)' : ''} | ${ctrlStatus(k.id)} | ${k.frameworkIds ? [...k.frameworkIds.nistAiRmf, ...k.frameworkIds.owaspLlm2026, ...k.frameworkIds.owaspAsi2026, ...k.frameworkIds.atlas].join(', ') : ''} |`), '',
    'Threat mitigations to keep in place:', '',
    ...(threats.filter(t => t.status === 'mitigated').map(t => `- ${nodeName(t.nodeId)} · ${t.threatId} ${fw.get(t.threatId)?.label ?? ''}: ${val(t.mitigation, 'mitigation text not recorded')}`)),
    ...(threats.some(t => t.status === 'mitigated') ? [] : ['- _None recorded as mitigated in the plan._']), '',
    'Still open in the plan (flag if the change affects them):', '',
    ...(threats.filter(t => t.status === 'open').map(t => `- ${nodeName(t.nodeId)} · ${t.threatId} ${fw.get(t.threatId)?.label ?? ''}`)),
    ...(threats.some(t => t.status === 'open') ? [] : ['- _None._']), ''
  ].join('\n'));
  add(`.claude/skills/${skills[1]}/SKILL.md`, 'Skill: enforce per-node limits and safe retries', [
    '---', `name: ${skills[1]}`, `description: ${yamlStr(`Check that agent and tool code in ${c.title || 'this project'} enforces the planned per-request visit limits, timeouts and spend caps, and that retried edges are idempotent.`)}`, '---', '',
    '# Budget guard', '',
    '| Node | Max visits / request | Timeout (s) | Spend cap (USD) |', '|---|---:|---:|---:|',
    ...c.nodes.map(n => `| ${cell(n.name)} | ${n.maxSteps} | ${n.timeoutSeconds} | ${n.spendLimitUsd || 'not set'} |`), '',
    'Edges with retry or compensation need the contract shown (idempotency key, compensation step):', '',
    ...(c.edges.filter(e => e.failurePolicy === 'retry' || e.failurePolicy === 'compensate').map(e => `- ${nodeName(e.from)} → ${nodeName(e.to)} (${e.failurePolicy}): ${val(e.contract, 'contract not recorded — define one before implementing')}`)),
    ...(c.edges.some(e => e.failurePolicy === 'retry' || e.failurePolicy === 'compensate') ? [] : ['- _None in the plan._']), ''
  ].join('\n'));
  add(`.claude/skills/${skills[2]}/SKILL.md`, 'Skill: run the plan through AI-DLC', [
    '---', `name: ${skills[2]}`, `description: ${yamlStr(`Start or resume the AI-DLC ${tag} run for ${c.title || 'this project'} using vision.md and the ${c.profile} profile, and check each stage's expected output files.`)}`, '---', '',
    '# AI-DLC hand-off', '',
    `1. \`vision.md\` is in the repository root; \`technical-environment.md\` is at \`aidlc/spaces/default/knowledge/aidlc-shared/technical-environment.md\`.`,
    `2. Run \`/aidlc ${c.profile} Read ./vision.md and build what it describes\` (Codex CLI: \`$aidlc\`).`,
    '3. At each approval gate, compare the stage output with the plan below.', '',
    '| Stage | Lead agent (AI-DLC) | Expected files | Plan status | Plan owner |', '|---|---|---|---|---|',
    ...c.stages.map(p => { const s = ctx.stages.stages.find(x => x.id === p.id); return `| ${p.id} ${cell(s?.name)} | ${s?.lead ?? ''} | ${cell(s?.outputs.join(', '))} | ${p.status} | ${cell(p.owner)} |`; }), ''
  ].join('\n'));

  // ---------- Subagents ----------
  for (const n of agents) add(`.claude/agents/${agentFile(n)}.md`, `Subagent for the ${n.name} node`, [
    '---', `name: ${agentFile(n)}`, `description: ${yamlStr(`Implements and maintains the "${n.name}" ${n.kind} node of ${c.title || 'this project'}. ${n.description || ''}`)}`, '---', '',
    `You work on the **${n.name}** node (${n.kind}).`, '',
    `- Responsibility: ${val(n.description)}`, `- Model / runtime in the plan: ${val(n.model)}`, `- Identity: ${val(n.identity)}`,
    `- Allowed tools and actions: ${val(n.toolPermissions)}`, `- Data boundary: ${val(n.dataScope)}`,
    `- Limits per request: max ${n.maxSteps} visits, ${n.timeoutSeconds} s timeout, spend cap ${n.spendLimitUsd ? `$${n.spendLimitUsd}` : 'not set'}`,
    ...(n.patternId ? [`- Pattern: ${patternName(n.patternId)} — ${ctx.patterns.agentPatterns.find(p => p.id === n.patternId)?.mechanism ?? ''}`] : []),
    ...((n.ragIds ?? []).length ? [`- RAG techniques: ${(n.ragIds ?? []).map(id => { const r = ctx.patterns.ragTechniques.find(x => x.id === id); return r ? `${r.name} (${r.mechanism})` : id; }).join('; ')}`] : []),
    `- Security: action type ${n.actionType || 'not set'}; idempotent ${n.idempotent ? 'yes' : 'no'}; open world ${n.openWorld ? 'yes' : 'no'}; human confirmation ${n.requiresHumanApproval ? 'required' : 'not required'}; executes code ${n.executesCode ? `yes (sandbox: ${val(n.sandbox, 'not recorded')})` : 'no'}; allowed egress ${val(n.allowedEgress, 'not recorded')}`,
    `- Receives from: ${c.edges.filter(e => e.to === n.id).map(e => `${nodeName(e.from)} (${e.label || 'handoff'})`).join(', ') || 'request entry'}`,
    `- Sends to: ${c.edges.filter(e => e.from === n.id).map(e => `${nodeName(e.to)} (${e.label || 'handoff'}, p=${e.probability ?? 1}, on failure ${e.failurePolicy})`).join(', ') || 'nothing'}`, '',
    'Threats recorded for this node:', '',
    ...(threats.filter(t => t.nodeId === n.id).map(t => `- ${t.threatId} ${fw.get(t.threatId)?.label ?? ''} — ${t.status}${has(t.mitigation) ? `: ${t.mitigation}` : ''}`)),
    ...(threats.some(t => t.nodeId === n.id) ? [] : ['- _None recorded._']), ''
  ].join('\n'));

  // ---------- Architecture patterns skill ----------
  if (selectedPatterns.length) add(`.claude/skills/${slug}-architecture-patterns/SKILL.md`, 'Skill: keep the implementation true to the selected agent patterns', [
    '---', `name: ${slug}-architecture-patterns`, `description: ${yamlStr(`Check that changes to ${c.title || 'this project'} keep the agent patterns chosen in the plan (${selectedPatterns.map(p => p.name).join(', ')}): answer each pattern's control questions and keep its assessment criteria testable.`)}`, '---', '',
    '# Agent patterns', '',
    ...selectedPatterns.flatMap(p => [`## ${p.name}`, '', `- Mechanism: ${p.mechanism}`, `- Use: ${p.useCase} · Complexity: ${p.complexity}`, `- Risk note: ${p.risk}`,
      `- Nodes implementing it: ${c.nodes.filter(n => n.patternId === p.id).map(n => n.name).join(', ') || 'none assigned yet'}`, '', 'Control questions to answer in code or design:', '', ...p.controlQuestions.map(q => `- ${q}`), '', 'Assessment criteria (write tests for these):', '', ...p.assessment.map(a => `- ${a}`), '']),
    `Source: pattern catalog built from data/rag_and_agent_patterns_master_reference.md.`, ''
  ].join('\n'));

  // ---------- Retrieval skill ----------
  if (selectedRag.length || retrievers.length) {
    const ragThreats = threats.filter(t => ['LLM02:2026', 'LLM05:2026', 'LLM08:2026', 'LLM09:2026', 'AML.T0070', 'AML.T0071'].includes(t.threatId));
    add(`.claude/skills/${slug}-retrieval/SKILL.md`, 'Skill: build and review retrieval (RAG) as planned', [
      '---', `name: ${slug}-retrieval`, `description: ${yamlStr(`Build and review the retrieval (RAG) parts of ${c.title || 'this project'}: the techniques chosen in the plan, which retriever nodes implement them, the retrieval threats and controls, and a production checklist.`)}`, '---', '',
      '# Retrieval (RAG)', '',
      '## Techniques', '',
      ...(selectedRag.length ? selectedRag.flatMap(r => [`### ${r.name}`, '', `- Category: ${r.category}`, `- Mechanism: ${r.mechanism}`, ...(r.workflow ? [`- Workflow: ${r.workflow}`] : []), ...(r.bestUse ? [`- Best use case: ${r.bestUse}`] : []), ...(r.complexity ? [`- Complexity: ${r.complexity}`] : []),
        `- Retriever nodes: ${c.nodes.filter(n => (n.ragIds ?? []).includes(r.id)).map(n => n.name).join(', ') || 'not assigned to a retriever node yet'}`, '']) : ['_No techniques selected in the plan._', '']),
      '## Retriever nodes', '',
      ...(retrievers.length ? retrievers.map(n => `- **${n.name}**: data boundary ${val(n.dataScope, 'not recorded')}; identity ${val(n.identity, 'not recorded')}; techniques ${(n.ragIds ?? []).map(ragName).join(', ') || 'none assigned'}.`) : ['_No retriever nodes in the plan._']), '',
      '## Threats and controls', '',
      ...(ragThreats.length ? ragThreats.map(t => `- ${nodeName(t.nodeId)} · ${t.threatId} ${fw.get(t.threatId)?.label ?? ''}: ${t.status}${has(t.mitigation) ? ` — ${t.mitigation}` : ''}`) : ['- _No retrieval threat entries in the plan._']),
      ...['SEC-05', 'SEC-10', 'EVAL-02'].map(id => `- Control ${id} ${ctx.controls.find(k => k.id === id)?.name ?? ''}: ${ctrlStatus(id)}`), '',
      '## Production checklist', '',
      `From ${ctx.patterns.ragCompetencies.source}:`, '',
      ...ctx.patterns.ragCompetencies.items.map(i => `- [ ] **${i.competency}** — ${i.topics}`), ''
    ].join('\n'));
  }

  // ---------- Architecture documents ----------
  add('docs/architecture/agent-graph.mmd', 'Mermaid source of the agent graph', mermaidGraph(c) + '\n');
  add('docs/architecture/architecture.md', 'Agent graph diagram, patterns, retrieval techniques and node responsibilities', [
    `# Architecture: ${c.title || 'Untitled'}`, '',
    '```mermaid', mermaidGraph(c), '```', '',
    '## Nodes', '',
    ...c.nodes.flatMap(n => [`### ${n.name} (${n.kind})`, '', `- Responsibility: ${val(n.description)}`, ...(n.patternId ? [`- Pattern: ${patternName(n.patternId)}`] : []), ...((n.ragIds ?? []).length ? [`- RAG techniques: ${(n.ragIds ?? []).map(ragName).join(', ')}`] : []),
      `- Model: ${val(n.model)} · identity: ${val(n.identity)} · permissions: ${val(n.toolPermissions)}`, `- Routing: ${n.routing} · max visits ${n.maxSteps} · timeout ${n.timeoutSeconds}s`, '']),
    '## Agent patterns', '',
    ...(selectedPatterns.length ? selectedPatterns.flatMap(p => [`### ${p.name}`, '', `${p.mechanism}. Use: ${p.useCase}. Complexity: ${p.complexity}. ${p.risk}`, '', `Nodes: ${c.nodes.filter(n => n.patternId === p.id).map(n => n.name).join(', ') || 'none assigned yet'}`, '', 'Control questions:', '', ...p.controlQuestions.map(q => `- ${q}`), '', 'Assessment criteria:', '', ...p.assessment.map(a => `- ${a}`), '']) : ['_None selected._', '']),
    '## Retrieval techniques (RAG)', '',
    ...(selectedRag.length ? ['| Technique | Category | Mechanism | Retriever nodes |', '|---|---|---|---|', ...selectedRag.map(r => `| ${r.name} | ${r.category} | ${cell(r.mechanism)} | ${c.nodes.filter(n => (n.ragIds ?? []).includes(r.id)).map(n => n.name).join(', ') || 'not assigned'} |`)] : ['_None selected._']), '',
    'Pattern and RAG descriptions come from the project master reference (data/rag_and_agent_patterns_master_reference.md); its own scope note says benchmark claims in it were not independently re-verified.', ''
  ].join('\n'));

  // ---------- SKILLS.md: skill index for any coding agent ----------
  const skillUse: Record<string, string> = {
    [`${slug}-trust-review`]: 'Before merging any change to agents, tools, prompts or MCP code.',
    [`${slug}-budget-guard`]: 'When changing limits, timeouts, retries or spend caps.',
    [`${slug}-aidlc-handoff`]: 'When starting AI-DLC or preparing for a gate.',
    [`${slug}-architecture-patterns`]: 'When changing how agents hand off, loop, branch or escalate.',
    [`${slug}-retrieval`]: 'When building or changing retrieval, indexes or retriever nodes.'
  };
  add('SKILLS.md', 'Index of skills for any coding agent', [
    `# Skills: ${c.title || 'Untitled'}`, '',
    'Claude Code loads these from `.claude/skills/`. Other coding agents: open the file and follow it as a checklist at the moment shown.', '',
    '| Skill | Use it | File |', '|---|---|---|',
    ...skills.map(k => `| ${k} | ${skillUse[k] ?? ''} | \`.claude/skills/${k}/SKILL.md\` |`), ''
  ].join('\n'));

  // ---------- MCP ----------
  if (toolNodes.length) {
    const envVar = `${slugify(server, '_').toUpperCase()}_MCP_URL`;
    add('.mcp.json', 'Claude Code project MCP configuration', JSON.stringify({ mcpServers: { [server]: ts ? { type: 'stdio', command: 'npx', args: ['tsx', 'mcp/server.ts'] } : { type: 'http', url: `\${${envVar}}` } } }, null, 2) + '\n');
    add('mcp/tools.json', 'MCP Tool definitions (specification 2026-07-28)', JSON.stringify({
      specRevision: '2026-07-28',
      note: 'inputSchema has no parameters yet: add the fields each tool needs. annotations come from the node security attributes in the plan (omitted when the action type is not set); MCP treats them as hints, untrusted unless the server is trusted.',
      tools: toolNodes.map(n => ({ name: tools.get(n.id), title: n.name, description: [n.description, n.toolPermissions && `Permissions: ${n.toolPermissions}`].filter(Boolean).join(' ') || n.name, inputSchema: { type: 'object', additionalProperties: false }, ...(annotations(n) ? { annotations: annotations(n) } : {}) }))
    }, null, 2) + '\n');
    if (ts) {
      add('mcp/server.ts', 'MCP tool server scaffold (TypeScript SDK 2.4.0, stdio)', [
        "import { McpServer } from '@modelcontextprotocol/server';", "import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';", "import * as z from 'zod/v4';", '',
        `const server = new McpServer({ name: '${server}', version: '0.1.0' });`, '',
        ...toolNodes.flatMap(n => [
          `// ${n.name} — identity: ${n.identity || 'not recorded'}; permissions: ${n.toolPermissions || 'not recorded'}; timeout ${n.timeoutSeconds}s; action type: ${n.actionType || 'not set'}${n.requiresHumanApproval ? '; requires human confirmation' : ''}`,
          '// MUST validate inputs, enforce access control, rate limit and sanitize outputs (MCP spec 2026-07-28, server/tools).',
          `server.registerTool(`, `  '${tools.get(n.id)}',`, `  { description: ${JSON.stringify(n.description || n.name)}, inputSchema: z.object({}) },`,
          `  async () => ({ content: [{ type: 'text', text: 'TODO: implement ${tools.get(n.id)}' }] })`, ');', '']),
        'async function main() {', '  const transport = new StdioServerTransport();', '  await server.connect(transport);', '}', '', 'main();', ''
      ].join('\n'));
    } else {
      add('mcp/server.py', 'MCP tool server scaffold (Python SDK v2.3.0)', [
        'from mcp.server import MCPServer', '',
        '# Streamable HTTP (MCP spec 2026-07-28): servers MUST validate the Origin header (403 if present and invalid),',
        '# SHOULD bind only to 127.0.0.1 when running locally, and SHOULD authenticate all connections.',
        '# If you add authorization: validate token audience, accept no tokens issued for others, return 401 for invalid tokens.',
        '', `mcp = MCPServer(${JSON.stringify(server)})`, '',
        ...toolNodes.flatMap(n => [
          '', '@mcp.tool()', `def ${tools.get(n.id)}() -> str:`,
          `    """${(n.description || n.name).replace(/"""/g, "'")}`, '',
          `    Identity: ${n.identity || 'not recorded'}. Permissions: ${n.toolPermissions || 'not recorded'}. Timeout: ${n.timeoutSeconds}s. Action type: ${n.actionType || 'not set'}${n.requiresHumanApproval ? '; requires human confirmation' : ''}.`, '    MUST validate inputs, enforce access control, rate limit and sanitize outputs (MCP spec 2026-07-28, server/tools).', '    """',
          `    raise NotImplementedError(${JSON.stringify(`TODO: implement ${tools.get(n.id)}`)})`, '']), ''
      ].join('\n'));
    }
  }
  if (ts) add('package.json', 'Node package scaffold for the MCP server', JSON.stringify({ name: slug, private: true, type: 'module', scripts: { test: 'node --test', typecheck: 'tsc --noEmit', 'mcp:start': 'tsx mcp/server.ts' }, dependencies: { '@modelcontextprotocol/server': '^2.4.0', zod: '^4.0.0' }, devDependencies: { tsx: '^4.0.0', typescript: '^5.0.0' } }, null, 2) + '\n');
  else add('pyproject.toml', 'Python project scaffold for the MCP server', [`[project]`, `name = "${slug}"`, `version = "0.1.0"`, `requires-python = ">=3.11"`, `dependencies = ["mcp[cli]>=2.3.0"]`, '', `[dependency-groups]`, `dev = ["pytest"]`, ''].join('\n'));

  // ---------- AI-DLC inputs ----------
  add('vision.md', 'AI-DLC input: vision document', visionMarkdown(c));
  add('aidlc/spaces/default/knowledge/aidlc-shared/technical-environment.md', 'AI-DLC input: technical environment note', technicalEnvironmentMarkdown(c));

  // ---------- Index ----------
  add('KIT.md', 'What is in this kit and where each format comes from', [
    `# Implementation kit: ${c.title || 'Untitled'} (${ts ? 'TypeScript' : 'Python'})`, '',
    `Generated by AI-DLC × Trusted AI Studio on ${date}. Copy these files into the implementation repository.`, '',
    '| File | Purpose |', '|---|---|', ...files.map(f => `| \`${f.path}\` | ${f.purpose} |`), '',
    'Formats follow (checked 2026-11-25): Claude Code documentation for CLAUDE.md, skills, subagents and .mcp.json (code.claude.com/docs); agents.md; MCP specification 2026-07-28; MCP TypeScript SDK 2.4.0; MCP Python SDK v2.3.0.',
    ts ? '' : `\nThe Python server runs over HTTP (\`uv run mcp run mcp/server.py --transport streamable-http\`). Set the environment variable named in \`.mcp.json\` to the server's URL before starting Claude Code.`, ''
  ].join('\n'));
  return files;
}
