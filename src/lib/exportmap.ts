// Where each studio input ends up in the workspace package, and what it is used for there.
// `file` may contain <slug> (from the case title); `heading` is text that appears in that file.
// tests/exportmap.test.mjs builds a package from a sample and checks every file and heading exists.
import type { Page } from './types';

export interface ExportTarget { file: string; heading?: string; use: string }
export interface ExportEntry { page: Page; input: string; targets: ExportTarget[] }

export const EXPORT_MAP: ExportEntry[] = [
  { page: 'ideate', input: 'Title, summary, problem, outcome, scope, success metrics', targets: [
    { file: 'vision.md', heading: '## Executive Summary', use: 'AI-DLC reads it at the start of the run (Intent Capture)' },
    { file: 'AGENTS.md', heading: '## Project overview', use: 'First thing every coding agent reads' }] },
  { page: 'ideate', input: 'Sponsor, owner, jurisdictions, risk tier, data classification', targets: [
    { file: 'AGENTS.md', heading: '## Project overview', use: 'Constraints the agent works within' },
    { file: 'vision.md', heading: '### Business Constraints', use: 'AI-DLC feasibility and scope stages' },
    { file: 'docs/trusted-ai/release-decision.md', heading: '# Release decision', use: 'Names the owner who signs the go/no-go' }] },
  { page: 'ideate', input: 'AI-DLC workflow profile', targets: [
    { file: 'AGENTS.md', heading: '## How to work in this repository', use: 'The /aidlc start command and gate list' },
    { file: 'docs/aidlc/stage-gates.md', heading: '## Gate types', use: 'Which stages and gates the run will hit' },
    { file: '.claude/skills/<slug>-aidlc-handoff/SKILL.md', heading: '# AI-DLC hand-off', use: 'Stage-by-stage check of expected files' }] },
  { page: 'patterns', input: 'Nodes: role, model, identity, permissions, limits', targets: [
    { file: 'AGENTS.md', heading: '## Agent graph', use: 'What each component may do' },
    { file: 'docs/architecture/architecture.md', heading: '## Nodes', use: 'Responsibilities per node' },
    { file: '.claude/agents/', use: 'One subagent per agent, orchestrator and validator node' }] },
  { page: 'patterns', input: 'Edges: hand-offs, contracts, failure policy, probability', targets: [
    { file: 'docs/architecture/agent-graph.mmd', use: 'Diagram source (also embedded in architecture.md)' },
    { file: 'AGENTS.md', heading: '| From | To | Label | Contract | On failure | Probability |', use: 'Hand-off contracts to implement' },
    { file: '.claude/skills/<slug>-budget-guard/SKILL.md', heading: '# Budget guard', use: 'Retry and compensation contracts to enforce' }] },
  { page: 'patterns', input: 'Agent patterns (selected or inserted as blueprints)', targets: [
    { file: 'docs/architecture/architecture.md', heading: '## Agent patterns', use: 'Mechanism, control questions, assessment criteria, nodes' },
    { file: '.claude/skills/<slug>-architecture-patterns/SKILL.md', heading: '# Agent patterns', use: 'Checklist when changing hand-offs, loops or escalation' },
    { file: 'AGENTS.md', heading: '## Architecture patterns and retrieval', use: 'Summary with the implementing nodes' }] },
  { page: 'patterns', input: 'RAG techniques (selected and assigned to retriever nodes)', targets: [
    { file: 'docs/architecture/architecture.md', heading: '## Retrieval techniques (RAG)', use: 'Technique per retriever node' },
    { file: '.claude/skills/<slug>-retrieval/SKILL.md', heading: '# Retrieval (RAG)', use: 'Build checklist, retrieval threats and controls' },
    { file: 'AGENTS.md', heading: '## Architecture patterns and retrieval', use: 'Summary; RAG column in the node table' }] },
  { page: 'patterns', input: 'Tool nodes', targets: [
    { file: 'mcp/tools.json', heading: '"specRevision"', use: 'MCP tool definitions' },
    { file: '.mcp.json', heading: '"mcpServers"', use: 'Claude Code connects to the tool server' }] },
  { page: 'patterns', input: 'Security attributes: action type, idempotent, open world, human confirmation, code execution, sandbox, egress', targets: [
    { file: 'AGENTS.md', heading: '### Node security attributes', use: 'Limits the implementation must enforce' },
    { file: 'mcp/tools.json', heading: '"annotations"', use: 'MCP readOnlyHint, destructiveHint, idempotentHint, openWorldHint' },
    { file: '.claude/skills/<slug>-trust-review/SKILL.md', heading: '# Trust review', use: 'Checked before merging' }] },
  { page: 'patterns', input: 'Threat model entries', targets: [
    { file: 'docs/trusted-ai/threat-model.md', heading: '# Threat model', use: 'Full register' },
    { file: 'AGENTS.md', heading: '## Security considerations', use: 'Mitigations the code must keep' },
    { file: '.claude/skills/<slug>-trust-review/SKILL.md', heading: 'Threat mitigations to keep in place', use: 'Checked before merging' }] },
  { page: 'patterns', input: 'Test scenarios', targets: [
    { file: 'AGENTS.md', heading: '## Testing instructions', use: 'Tests to write' }] },
  { page: 'nfr', input: 'Traffic, latency target, availability, RTO/RPO', targets: [
    { file: 'AGENTS.md', heading: '## Service targets', use: 'Targets the code is built to' },
    { file: 'docs/trusted-ai/cost-and-capacity.md', heading: '## Targets', use: 'With error budget' }] },
  { page: 'nfr', input: 'Cost inputs and per-node cost and latency', targets: [
    { file: 'docs/trusted-ai/cost-and-capacity.md', heading: '## Graph simulation', use: 'Cost and latency per request, largest cost drivers' }] },
  { page: 'nfr', input: 'Region, residency, encryption, network, sensitive data, retention', targets: [
    { file: 'AGENTS.md', heading: 'Data retention:', use: 'Security constraints' },
    { file: 'aidlc/spaces/default/knowledge/aidlc-shared/technical-environment.md', heading: '## Security basics', use: 'AI-DLC reads it for every stage' }] },
  { page: 'trust', input: 'Control status, owner, evidence, exceptions', targets: [
    { file: 'docs/trusted-ai/control-register.md', heading: '# Control register', use: 'Full register with framework IDs' },
    { file: 'docs/aidlc/stage-gates.md', heading: 'Trusted AI checks at the', use: 'Controls to check at each phase\'s gates' },
    { file: 'AGENTS.md', heading: '### Security controls in the plan', use: 'Security control status' },
    { file: '.claude/skills/<slug>-trust-review/SKILL.md', heading: 'Trusted AI controls that code changes can affect', use: 'Checked before merging' },
    { file: 'docs/trusted-ai/release-decision.md', heading: 'Essential controls without evidence', use: 'Open items for the go/no-go' }] },
  { page: 'lifecycle', input: 'Stage plan: status, owner, approver, evidence', targets: [
    { file: 'docs/aidlc/stage-gates.md', heading: '### ', use: 'Each gate with artifacts and owners' },
    { file: '.claude/skills/<slug>-aidlc-handoff/SKILL.md', heading: '| Stage | Lead agent (AI-DLC) |', use: 'Plan status per stage' }] },
  { page: 'lifecycle', input: 'Units of Work and acceptance tests', targets: [
    { file: 'AGENTS.md', heading: '## Delivery plan', use: 'Build order and dependencies' },
    { file: 'vision.md', heading: '### Definition of Done', use: 'AI-DLC scope and requirements stages' }] },
  { page: 'lifecycle', input: 'Decision records', targets: [
    { file: 'docs/trusted-ai/release-decision.md', heading: '## Decisions already recorded in the plan', use: 'Context for the go/no-go' }] },
  { page: 'reports', input: 'AI-DLC team templates (package option)', targets: [
    { file: 'aidlc/spaces/default/memory/templates/', use: 'AI-DLC uses their headings as each artifact\'s structure and checks them at the gate' }] }
];

export const resolveFile = (file: string, slug: string) => file.replace('<slug>', slug);

export function traceabilityMarkdown(slug: string, title: string): string {
  return [`# Traceability: ${title || 'Untitled'}`, '',
    'Where each part of the studio plan appears in this package and what it is used for.', '',
    '| Studio page | Input | File | Section | Used for |', '|---|---|---|---|---|',
    ...EXPORT_MAP.flatMap(e => e.targets.map(t => `| ${e.page} | ${e.input} | \`${resolveFile(t.file, slug)}\` | ${t.heading ? t.heading.replace(/\|/g, '\\|') : '—'} | ${t.use} |`)), ''].join('\n');
}
