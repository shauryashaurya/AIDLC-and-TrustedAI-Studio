// Monte Carlo walk over the agent graph: per-request cost and latency distributions.
// This is the studio's own calculation over user-entered inputs. It is not a benchmark or a price quote.
import type { AgentNode, GraphEdge } from './types';

export interface SimulationOptions { runs?: number; seed?: number; maxTotalVisits?: number }
export interface Distribution { mean: number; p50: number; p95: number; max: number }
export interface NodeStat { id: string; name: string; meanVisits: number; meanCost: number; capHitRate: number; spendHitRate: number }
export interface SimulationResult {
  runs: number;
  cost: Distribution;
  latency: Distribution;
  stepCapHitRate: number;
  spendCapHitRate: number;
  nodes: NodeStat[];
  entryIds: string[];
  warnings: string[];
}

/** Deterministic PRNG (mulberry32) so the same inputs give the same result. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cost of one visit to a node, in USD. */
export function visitCost(n: AgentNode): number {
  const cached = Math.min(Math.max(n.cachedInputPct || 0, 0), 100) / 100;
  const input = (n.inputTokens || 0) * ((1 - cached) * (n.inputPricePerM || 0) + cached * (n.cachedInputPricePerM || 0)) / 1e6;
  const output = (n.outputTokens || 0) * (n.outputPricePerM || 0) / 1e6;
  return input + output + (n.costPerCallUsd || 0);
}

export function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx];
}
const dist = (xs: number[]): Distribution => {
  const s = [...xs].sort((a, b) => a - b);
  return { mean: xs.reduce((a, b) => a + b, 0) / (xs.length || 1), p50: percentile(s, 0.5), p95: percentile(s, 0.95), max: s[s.length - 1] ?? 0 };
};

/** Nodes with no incoming edge start each request. If every node has an incoming edge, the first node starts. */
export function entryNodes(nodes: AgentNode[], edges: GraphEdge[]): string[] {
  const ids = new Set(nodes.map(n => n.id));
  const targets = new Set(edges.filter(e => ids.has(e.from)).map(e => e.to));
  const entries = nodes.filter(n => !targets.has(n.id)).map(n => n.id);
  return entries.length ? entries : nodes.slice(0, 1).map(n => n.id);
}

export function simulate(nodes: AgentNode[], edges: GraphEdge[], opts: SimulationOptions = {}): SimulationResult {
  const runs = opts.runs ?? 2000;
  const maxTotal = opts.maxTotalVisits ?? 5000;
  const random = rng(opts.seed ?? 42);
  const byId = new Map(nodes.map(n => [n.id, n]));
  const out = new Map<string, GraphEdge[]>();
  for (const e of edges) if (byId.has(e.from) && byId.has(e.to)) out.set(e.from, [...(out.get(e.from) ?? []), e]);
  const entryIds = entryNodes(nodes, edges);
  const warnings: string[] = [];
  for (const [from, list] of out) {
    const n = byId.get(from)!;
    const total = list.reduce((a, e) => a + clampP(e.probability), 0);
    if ((n.routing ?? 'one') === 'one' && total > 1.000001) warnings.push(`${n.name}: outgoing probabilities sum to ${total.toFixed(2)} with routing "one"; they are normalised to 1.`);
  }
  if (!nodes.length) return { runs: 0, cost: dist([]), latency: dist([]), stepCapHitRate: 0, spendCapHitRate: 0, nodes: [], entryIds: [], warnings: ['The graph has no nodes.'] };

  const visitsTotal = new Map<string, number>(), costTotal = new Map<string, number>(), capHits = new Map<string, number>(), spendHits = new Map<string, number>();
  const costs: number[] = [], latencies: number[] = [];
  let capRuns = 0, spendRuns = 0, truncatedRuns = 0;

  for (let r = 0; r < runs; r++) {
    const visits = new Map<string, number>(), spent = new Map<string, number>();
    let total = 0, capHit = false, spendHit = false, truncated = false;
    const capHitNodes = new Set<string>(), spendHitNodes = new Set<string>();
    const visit = (id: string): { cost: number; latency: number } => {
      const n = byId.get(id)!;
      const v = visits.get(id) ?? 0;
      if (v >= Math.max(1, n.maxSteps || 1)) { capHit = true; capHitNodes.add(id); return { cost: 0, latency: 0 }; }
      if (total >= maxTotal) { truncated = true; return { cost: 0, latency: 0 }; }
      visits.set(id, v + 1); total++;
      const c = visitCost(n);
      const s = (spent.get(id) ?? 0) + c; spent.set(id, s);
      if (n.spendLimitUsd > 0 && s > n.spendLimitUsd) { spendHit = true; spendHitNodes.add(id); }
      let cost = c, childLatency = 0;
      const next = out.get(id) ?? [];
      if ((n.routing ?? 'one') === 'all') {
        for (const e of next) if (random() < clampP(e.probability)) { const child = visit(e.to); cost += child.cost; childLatency = Math.max(childLatency, child.latency); }
      } else if (next.length) {
        const sum = next.reduce((a, e) => a + clampP(e.probability), 0);
        const scale = sum > 1 ? sum : 1;
        let u = random() * scale, chosen: GraphEdge | undefined;
        for (const e of next) { u -= clampP(e.probability); if (u < 0) { chosen = e; break; } }
        if (chosen) { const child = visit(chosen.to); cost += child.cost; childLatency = child.latency; }
      }
      return { cost, latency: (n.latencySeconds || 0) + childLatency };
    };
    let runCost = 0, runLatency = 0;
    for (const id of entryIds) { const res = visit(id); runCost += res.cost; runLatency = Math.max(runLatency, res.latency); }
    costs.push(runCost); latencies.push(runLatency);
    if (capHit) capRuns++; if (spendHit) spendRuns++; if (truncated) truncatedRuns++;
    for (const [id, v] of visits) visitsTotal.set(id, (visitsTotal.get(id) ?? 0) + v);
    for (const [id, s] of spent) costTotal.set(id, (costTotal.get(id) ?? 0) + s);
    for (const id of capHitNodes) capHits.set(id, (capHits.get(id) ?? 0) + 1);
    for (const id of spendHitNodes) spendHits.set(id, (spendHits.get(id) ?? 0) + 1);
  }
  if (truncatedRuns) warnings.push(`${truncatedRuns} of ${runs} runs stopped at ${maxTotal} total node visits.`);
  return {
    runs, cost: dist(costs), latency: dist(latencies),
    stepCapHitRate: capRuns / runs, spendCapHitRate: spendRuns / runs, entryIds, warnings,
    nodes: nodes.map(n => ({ id: n.id, name: n.name, meanVisits: (visitsTotal.get(n.id) ?? 0) / runs, meanCost: (costTotal.get(n.id) ?? 0) / runs,
      capHitRate: (capHits.get(n.id) ?? 0) / runs, spendHitRate: (spendHits.get(n.id) ?? 0) / runs }))
  };
}
const clampP = (p: number | undefined) => Math.min(Math.max(Number.isFinite(p) ? (p as number) : 1, 0), 1);
