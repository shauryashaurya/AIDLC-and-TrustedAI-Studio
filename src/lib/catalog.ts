// Bundler-side typed access to the JSON catalogs in data/. Pure logic lives in the modules that
// take these catalogs as arguments (aidlc.ts, references.ts, frameworks.ts, workshop.ts).
import type { AgentCatalog, ProfileCatalog, StageCatalog } from './aidlc';
import type { ReferenceCatalog } from './types';
import type { FrameworkCatalogs, ThreatCandidates } from './frameworks';
import type { WorkshopCatalog } from './workshop';
import stagesJson from '../../data/aidlc-stages.json';
import profilesJson from '../../data/aidlc-profiles.json';
import agentsJson from '../../data/aidlc-agents.json';
import referencesJson from '../../data/references.json';
import rmfJson from '../../data/frameworks/nist-ai-rmf-1.0-subcategories.json';
import llmJson from '../../data/frameworks/owasp-llm-2026.json';
import asiJson from '../../data/frameworks/owasp-asi-2026.json';
import atlasJson from '../../data/frameworks/atlas-techniques.json';
import threatJson from '../../data/frameworks/threat-candidates.json';
import workshopJson from '../../data/workshop/modules.json';

export const STAGE_CATALOG = stagesJson as unknown as StageCatalog;
export const PROFILE_CATALOG = profilesJson as unknown as ProfileCatalog;
export const AGENT_CATALOG = agentsJson as unknown as AgentCatalog;
export const REFERENCES = referencesJson as unknown as ReferenceCatalog;
export const FRAMEWORKS = { rmf: rmfJson, llm: llmJson, asi: asiJson, atlas: atlasJson } as unknown as FrameworkCatalogs;
export const THREAT_CANDIDATES = threatJson as unknown as ThreatCandidates;
export const WORKSHOP = workshopJson as unknown as WorkshopCatalog;
export const REF_BY_ID = new Map(REFERENCES.references.map(r => [r.id, r]));

import samplesIndex from '../../data/samples/index.json';
import type { UseCase } from './types';
const sampleFiles = import.meta.glob('../../data/samples/sample-*.json', { eager: true, import: 'default' }) as Record<string, UseCase>;
/** Fictional demo cases (data/samples/), loaded only when the user picks one. */
export const SAMPLES = samplesIndex.samples.map(s => ({ ...s, case: Object.values(sampleFiles).find(c => c.id === s.id)! })).filter(s => s.case);
export const SAMPLE_NOTE = samplesIndex.note;

import templatesJson from '../../data/aidlc-artifact-templates.json';
import type { TemplateCatalog } from './workspace';
/** AI-DLC team templates (data/aidlc-artifact-templates.json), built from the v2.11.5 stage rules. */
export const TEMPLATE_CATALOG = templatesJson as unknown as TemplateCatalog;

import gatesJson from '../../data/aidlc-gates.json';
export interface GateType { id: string; kind: 'aidlc' | 'studio'; name: string; appliesTo: string; rule: string; source: string }
/** Gate types: AI-DLC v2.11.5 (from the guide and rule files) and the studio's Trusted AI gates. */
export const GATES = gatesJson as unknown as { tag: string; verifiedOn: string; note: string; gates: GateType[] };
