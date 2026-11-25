export type Status = 'not-started' | 'in-progress' | 'in-review' | 'approved' | 'waived';
export type ControlStatus = 'unassessed' | 'planned' | 'evidenced' | 'accepted';
export type NodeKind = 'agent' | 'orchestrator' | 'tool' | 'retriever' | 'validator' | 'human' | 'memory' | 'event' | 'policy' | 'system';

export interface AgentNode {
  id: string;
  name: string;
  kind: NodeKind;
  x: number;
  y: number;
  description: string;
  model: string;
  toolPermissions: string;
  dataScope: string;
  owner: string;
  timeoutSeconds: number;
  maxSteps: number;
  spendLimitUsd: number;
  /** Workload identity / credential the component acts under (e.g. IAM role, delegated user token). */
  identity: string;
  /** Per-visit cost and latency inputs for the graph simulation (user-entered rates). */
  inputTokens: number;
  outputTokens: number;
  inputPricePerM: number;
  outputPricePerM: number;
  cachedInputPct: number;
  cachedInputPricePerM: number;
  costPerCallUsd: number;
  latencySeconds: number;
  /** 'one': follow a single outgoing edge chosen by edge probability. 'all': follow every outgoing edge whose probability draw succeeds (fan-out). */
  routing: 'one' | 'all';
  /** Security attributes. actionType/idempotent/openWorld map to MCP ToolAnnotations (readOnlyHint, destructiveHint, idempotentHint, openWorldHint). */
  actionType: '' | 'read-only' | 'additive' | 'destructive';
  idempotent: boolean;
  openWorld: boolean;
  requiresHumanApproval: boolean;
  executesCode: boolean;
  sandbox: string;
  allowedEgress: string;
  /** Agent pattern (pattern-catalog id) this node was inserted from, if any. */
  patternId: string;
  /** RAG techniques (pattern-catalog ids) this node implements; used on retriever nodes. */
  ragIds: string[];
}
export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  contract: string;
  failurePolicy: 'halt' | 'retry' | 'compensate' | 'escalate';
  /** Probability (0–1) that this edge is taken when its source node completes. */
  probability: number;
}
export type ThreatStatus = 'open' | 'mitigated' | 'accepted' | 'not-applicable';
export interface ThreatEntry {
  id: string;
  nodeId: string;
  threatId: string;
  status: ThreatStatus;
  mitigation: string;
}
export interface PlannedStage {
  id: string;
  status: Status;
  owner: string;
  evidence: string;
  notes: string;
  approver: string;
}
export interface ControlAssessment {
  id: string;
  status: ControlStatus;
  owner: string;
  evidence: string;
  exception: string;
  likelihood: number;
  impact: number;
}
export interface WorkUnit {
  id: string;
  name: string;
  owner: string;
  description: string;
  dependsOn: string[];
  acceptanceTests: string;
  risk: 'low'|'medium'|'high';
  status: 'planned'|'ready'|'building'|'verified';
  estimateDays: number;
}
export interface TestScenario {
  id: string;
  name: string;
  trigger: string;
  expectedResult: string;
  failureAndAbuseCase: string;
  verification: string;
}
export interface Decision {
  id: string;
  title: string;
  decision: string;
  rationale: string;
  owner: string;
  date: string;
}
export interface NfrModel {
  requestsPerDay: number;
  daysPerMonth: number;
  peakFactor: number;
  avgLatencySeconds: number;
  p95TargetSeconds: number;
  availabilityPct: number;
  rtoMinutes: number;
  rpoMinutes: number;
  agentCallsPerRequest: number;
  inputTokensPerCall: number;
  outputTokensPerCall: number;
  retryPct: number;
  modelInputPricePerMillion: number;
  modelOutputPricePerMillion: number;
  retrievalCostPerRequest: number;
  fixedInfrastructurePerMonth: number;
  storageGb: number;
  storagePriceGbMonth: number;
  humanReviewPct: number;
  humanReviewMinutes: number;
  reviewerHourlyCost: number;
  concurrencyHeadroom: number;
  region: string;
  residency: string;
  encryption: string;
  sensitiveData: string;
  networkBoundary: string;
  unitValueUsd: number;
  dataRetention: string;
}
export interface UseCase {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  summary: string;
  problem: string;
  outcome: string;
  sponsor: string;
  accountableOwner: string;
  stakeholders: string;
  domain: string;
  jurisdictions: string;
  dataClassification: string;
  riskTier: 'low' | 'moderate' | 'high' | 'critical';
  profile: string;
  inScope: string;
  outOfScope: string;
  constraints: string;
  successMetrics: string;
  assumptions: string;
  sourceUrl: string;
  sourceDate: string;
  patternIds: string[];
  ragIds: string[];
  nodes: AgentNode[];
  edges: GraphEdge[];
  stages: PlannedStage[];
  controls: ControlAssessment[];
  decisions: Decision[];
  units: WorkUnit[];
  scenarios: TestScenario[];
  threats: ThreatEntry[];
  nfr: NfrModel;
}
export type Page = 'home' | 'workshop' | 'discover' | 'ideate' | 'patterns' | 'nfr' | 'trust' | 'lifecycle' | 'reports' | 'references';

export type ReferenceStatus = 'current' | 'superseded' | 'unverified';
export interface Reference {
  id: string;
  title: string;
  publisher: string;
  domain: string;
  type: string;
  version: string | null;
  publishedDate: string | null;
  verifiedOn: string | null;
  url: string;
  pinnedUrl: string | null;
  access: 'free' | 'paid' | 'registration' | 'unknown';
  license: string | null;
  /** What the source states about itself. */
  summary: string;
  /** Where this app uses the source. */
  usedIn: string;
  /** Facts observed during verification (fetch failures, conflicting official pages). Empty when none. */
  verificationNotes: string;
  citedBy: { pages: Page[]; stages: string[] };
  status: ReferenceStatus;
}
export interface ReferenceDomain { id: string; label: string }
export interface ReferenceCatalog {
  catalogVersion: string;
  provenance: string;
  types: string[];
  domains: ReferenceDomain[];
  references: Reference[];
}
