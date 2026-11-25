// Lookups over the verified framework catalogs in data/frameworks/ and the per-node threat model.
import type { AgentNode, ThreatEntry } from './types';

export interface RmfCatalog { referenceId: string; version: string; extractedFrom: string; subcategories: { id: string; function: string; text: string }[] }
export interface ListCatalog { referenceId: string; version: string; source: string; items: { id: string; name: string }[] }
export interface FrameworkCatalogs { rmf: RmfCatalog; llm: ListCatalog; asi: ListCatalog; atlas: ListCatalog }
export interface ThreatCandidates { note: string; byKind: Record<string, string[]> }
export interface FrameworkItem { id: string; label: string; framework: string; referenceId: string }

export function frameworkIndex(f: FrameworkCatalogs): Map<string, FrameworkItem> {
  const m = new Map<string, FrameworkItem>();
  for (const s of f.rmf.subcategories) m.set(s.id, { id: s.id, label: s.text, framework: 'NIST AI RMF 1.0', referenceId: f.rmf.referenceId });
  for (const i of f.llm.items) m.set(i.id, { id: i.id, label: i.name, framework: `OWASP Top 10 for LLM Applications ${f.llm.version}`, referenceId: f.llm.referenceId });
  for (const i of f.asi.items) m.set(i.id, { id: i.id, label: i.name, framework: `OWASP Top 10 for Agentic Applications ${f.asi.version}`, referenceId: f.asi.referenceId });
  for (const i of f.atlas.items) m.set(i.id, { id: i.id, label: i.name, framework: `MITRE ATLAS ${f.atlas.version}`, referenceId: f.atlas.referenceId });
  return m;
}

export interface ControlFrameworkIds { nistAiRmf: string[]; owaspLlm2026: string[]; owaspAsi2026: string[]; atlas: string[] }
export const allFrameworkIds = (f: ControlFrameworkIds) => [...f.nistAiRmf, ...f.owaspLlm2026, ...f.owaspAsi2026, ...f.atlas];

/** Threat IDs the designer lists for a node (studio mapping by node kind). */
export const candidatesFor = (c: ThreatCandidates, node: Pick<AgentNode, 'kind'>) => c.byKind[node.kind] ?? [];

/**
 * Returns the threat register with one entry for every (node, candidate threat) pair.
 * Existing entries are kept; entries for removed nodes are dropped; new pairs start as 'open'.
 */
export function syncThreats(nodes: AgentNode[], existing: ThreatEntry[], c: ThreatCandidates, makeId: () => string): ThreatEntry[] {
  const nodeIds = new Set(nodes.map(n => n.id));
  const kept = existing.filter(t => nodeIds.has(t.nodeId));
  const key = (n: string, t: string) => `${n}|${t}`;
  const have = new Set(kept.map(t => key(t.nodeId, t.threatId)));
  const added: ThreatEntry[] = [];
  for (const n of nodes) for (const t of candidatesFor(c, n)) if (!have.has(key(n.id, t))) added.push({ id: makeId(), nodeId: n.id, threatId: t, status: 'open', mitigation: '' });
  return [...kept, ...added];
}

export function threatSummary(threats: ThreatEntry[]) {
  const count = (s: ThreatEntry['status']) => threats.filter(t => t.status === s).length;
  return { total: threats.length, open: count('open'), mitigated: count('mitigated'), accepted: count('accepted'), notApplicable: count('not-applicable'),
    mitigatedWithoutText: threats.filter(t => t.status === 'mitigated' && !t.mitigation.trim()).length };
}
