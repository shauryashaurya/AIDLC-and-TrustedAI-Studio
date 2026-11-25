import type { AgentNode, ControlAssessment, Decision, GraphEdge, NfrModel, PlannedStage, TestScenario, UseCase, WorkUnit } from './types';
import type { ControlFrameworkIds } from './frameworks';
import trustControls from '../../data/trust-controls.json';
import { PROFILE_CATALOG, STAGE_CATALOG } from './catalog';
import { stagesForProfile } from './aidlc';

export interface Control { id: string; name: string; domain: string; description: string; critical: boolean; referenceIds: string[]; frameworkIds: ControlFrameworkIds; aidlcGatePhase: string }
export const STAGES = STAGE_CATALOG.stages;
export const CONTROLS = trustControls as Control[];
export const uid = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const now = () => new Date().toISOString();
export const nfrEmpty = (): NfrModel => ({
  requestsPerDay: 0, daysPerMonth: 30, peakFactor: 1, avgLatencySeconds: 0, p95TargetSeconds: 0,
  availabilityPct: 0, rtoMinutes: 0, rpoMinutes: 0, agentCallsPerRequest: 0, inputTokensPerCall: 0,
  outputTokensPerCall: 0, retryPct: 0, modelInputPricePerMillion: 0, modelOutputPricePerMillion: 0,
  retrievalCostPerRequest: 0, fixedInfrastructurePerMonth: 0, storageGb: 0, storagePriceGbMonth: 0,
  humanReviewPct: 0, humanReviewMinutes: 0, reviewerHourlyCost: 0, concurrencyHeadroom: 1,
  region: '', residency: '', encryption: '', sensitiveData: '', networkBoundary: '', unitValueUsd: 0, dataRetention: ''
});
export function createCase(): UseCase {
  return {
    schemaVersion: 1, id: uid(), createdAt: now(), updatedAt: now(), title: '', summary: '', problem: '',
    outcome: '', sponsor: '', accountableOwner: '', stakeholders: '', domain: '', jurisdictions: '',
    dataClassification: 'Unclassified', riskTier: 'moderate', profile: PROFILE_CATALOG.profiles.find(p => p.default)?.id ?? 'classic',
    inScope: '', outOfScope: '', constraints: '', successMetrics: '', assumptions: '', sourceUrl: '', sourceDate: '',
    patternIds: [], ragIds: [], nodes: [], edges: [], stages: [], controls: [], decisions: [], units:[], scenarios:[], threats: [], nfr: nfrEmpty()
  };
}
/** Stage plan for an AI-DLC workflow profile, using the v2.11.5 stage-by-scope matrix. */
export function initialStages(profile: string): PlannedStage[] {
  return stagesForProfile(PROFILE_CATALOG, STAGES, profile)
    .map(id => ({ id, status: 'not-started' as const, owner: '', evidence: '', notes: '', approver: '' }));
}
export function initialControls(): ControlAssessment[] {
  return CONTROLS.map(c => ({ id:c.id, status:'unassessed', owner:'', evidence:'', exception:'', likelihood:3, impact:4 }));
}
export function makeNode(name: string, kind: AgentNode['kind'], x=80, y=90): AgentNode {
  return { id: uid(), name, kind, x, y, description:'', model:'', toolPermissions:'', dataScope:'', owner:'', timeoutSeconds:90, maxSteps:12, spendLimitUsd:0,
    identity:'', inputTokens:0, outputTokens:0, inputPricePerM:0, outputPricePerM:0, cachedInputPct:0, cachedInputPricePerM:0, costPerCallUsd:0, latencySeconds:0,
    routing: kind === 'orchestrator' ? 'all' : 'one',
    actionType: '', idempotent: false, openWorld: false, requiresHumanApproval: kind === 'human', executesCode: false, sandbox: '', allowedEgress: '', patternId: '', ragIds: [] };
}
export function makeEdge(from: string, to: string, label='handoff'): GraphEdge {
  return {id:uid(), from, to, label, contract:'', failurePolicy:'halt', probability:1};
}
export function makeUnit(): WorkUnit {return {id:uid(),name:'',owner:'',description:'',dependsOn:[],acceptanceTests:'',risk:'medium',status:'planned',estimateDays:0};}
export function makeScenario(): TestScenario {return {id:uid(),name:'',trigger:'',expectedResult:'',failureAndAbuseCase:'',verification:''};}
export function makeDecision(): Decision {return {id:uid(), title:'', decision:'', rationale:'', owner:'', date:new Date().toISOString().slice(0,10)};}
export function validateImport(value: unknown): value is UseCase {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const obj=value as Record<string, unknown>;
  const array=(k:string,max=300)=>Array.isArray(obj[k]) && (obj[k] as unknown[]).length<=max;
  if(!(obj.schemaVersion===1 && typeof obj.id==='string' && obj.id.length>0 && typeof obj.title==='string'
    && typeof obj.createdAt==='string' && typeof obj.updatedAt==='string'
    && array('nodes') && array('edges',800) && array('stages',100)
    && array('controls',150) && array('decisions',300) && array('units') && array('scenarios')
    && array('patternIds',200) && array('ragIds',200)
    && !!obj.nfr && typeof obj.nfr==='object' && !Array.isArray(obj.nfr)))return false;
  const items=(key:string)=>(obj[key] as unknown[]);
  const isObj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
  if(!items('nodes').every(x=>isObj(x)&&typeof x.id==='string'&&typeof x.name==='string'&&Number.isFinite(x.x)&&Number.isFinite(x.y)))return false;
  if(!items('edges').every(x=>isObj(x)&&typeof x.id==='string'&&typeof x.from==='string'&&typeof x.to==='string'))return false;
  if(!items('stages').every(x=>isObj(x)&&typeof x.id==='string'&&typeof x.status==='string'))return false;
  if(!items('controls').every(x=>isObj(x)&&typeof x.id==='string'&&typeof x.status==='string'))return false;
  if(!items('units').every(x=>isObj(x)&&typeof x.id==='string'&&Array.isArray(x.dependsOn)))return false;
  if(!items('scenarios').every(x=>isObj(x)&&typeof x.id==='string'&&typeof x.name==='string'))return false;
  return true;
}

export function cloneCase(c: UseCase): UseCase { return JSON.parse(JSON.stringify(c)) as UseCase; }

/**
 * Fills fields added after the first schemaVersion-1 release (node identity and cost inputs, edge
 * probability, threat register) so older saved or exported cases keep working. Existing values are kept.
 */
export function migrateCase(c: UseCase): UseCase {
  const out = cloneCase(c);
  const nodeDefaults = makeNode('', 'agent');
  out.nodes = out.nodes.map(n => ({ ...nodeDefaults, ...n, id: n.id, routing: n.routing ?? (n.kind === 'orchestrator' ? 'all' : 'one'), ragIds: Array.isArray(n.ragIds) ? n.ragIds : [] }));
  out.edges = out.edges.map(e => ({ ...e, probability: typeof e.probability === 'number' ? e.probability : 1 }));
  out.threats = Array.isArray(out.threats) ? out.threats : [];
  out.nfr = { ...nfrEmpty(), ...out.nfr };
  return out;
}
