// Typed views over data/aidlc-stages.json, data/aidlc-profiles.json and data/aidlc-agents.json
// (AI-DLC v2.11.5). Pure functions: the data is passed in, so Node tests can use them directly.

export interface Phase { id: number; name: string; purpose: string }
export interface Stage {
  id: string; phase: string; name: string; slug: string | null;
  gate: boolean; gateNote: string | null;
  mode: string; lead: string; support: string[]; reviewer: string | null;
  outputs: string[]; outputsNote: string | null;
  runs: string; condition: string | null; perUnit: boolean;
  /** Rule file in awslabs/aidlc-workflows, artifact stems from its produces: list, and where they are written. */
  ruleFile: string; produces: string[]; recordDir: string | null;
}
export interface StageCatalog {
  upstream: { repo: string; tag: string; verifiedOn: string; referenceId: string; sources: Record<string, string> };
  note: string; rules: string[]; phases: Phase[]; stages: Stage[];
}
export interface Profile {
  id: string; name: string; bestFor: string; stages: string[]; conditionalStages: string[];
  depth: string; testStrategy: string; statedCount: string; default: boolean; notes: string | null;
}
export interface ProfileCatalog {
  source: string; matrixSource: string; tag: string; verifiedOn: string; choose: string[]; countNote: string;
  depthLevels: { id: string; text: string }[]; testLevels: { id: string; text: string }[]; profiles: Profile[];
}
export interface Agent { id: string; kind: 'domain' | 'reviewer' | 'composer'; domain: string; role: string; leads: string[]; supports: string[]; reviews: string[] }
export interface AgentCatalog { source: string; tag: string; verifiedOn: string; agents: Agent[] }

export function profileById(catalog: ProfileCatalog, id: string): Profile | undefined {
  return catalog.profiles.find(p => p.id === id);
}

/** Stage IDs a profile runs, in catalog order. Unknown profile → empty list. */
export function stagesForProfile(profiles: ProfileCatalog, stages: Stage[], profileId: string): string[] {
  const p = profileById(profiles, profileId);
  if (!p) return [];
  const set = new Set(p.stages);
  return stages.filter(s => set.has(s.id)).map(s => s.id);
}

/** Stages of the full lifecycle that a profile skips (excluding Initialization). */
export function skippedByProfile(profiles: ProfileCatalog, stages: Stage[], profileId: string): string[] {
  const run = new Set(stagesForProfile(profiles, stages, profileId));
  return stages.filter(s => !s.id.startsWith('0.') && !run.has(s.id)).map(s => s.id);
}

/** Lead / support / review role of each agent on a stage, from the agents catalog (slug-based). */
export function agentRolesForStage(agents: AgentCatalog, stage: Stage): { agent: string; role: 'leads' | 'supports' | 'reviews' }[] {
  if (!stage.slug) return [];
  const out: { agent: string; role: 'leads' | 'supports' | 'reviews' }[] = [];
  for (const a of agents.agents) {
    if (a.leads.includes(stage.slug)) out.push({ agent: a.id, role: 'leads' });
    if (a.supports.includes(stage.slug)) out.push({ agent: a.id, role: 'supports' });
    if (a.reviews.includes(stage.slug)) out.push({ agent: a.id, role: 'reviews' });
  }
  return out;
}

/** Compares a case's selected stages with a profile: which profile stages are missing, which extras were added. */
export function compareWithProfile(profiles: ProfileCatalog, stages: Stage[], profileId: string, planned: string[]) {
  const expected = new Set(stagesForProfile(profiles, stages, profileId));
  const have = new Set(planned);
  return {
    missing: [...expected].filter(id => !have.has(id)),
    extra: [...have].filter(id => !expected.has(id))
  };
}

/** Markdown guide generated only from the three AI-DLC catalogs (data/aidlc-stage-guide.md). */
export function stageGuideMarkdown(sc: StageCatalog, pc: ProfileCatalog, ac: AgentCatalog): string {
  const t = sc.upstream.tag;
  const out: string[] = [
    `# AI-DLC ${t}: stages, profiles and agents`,
    '',
    `> Generated from data/aidlc-stages.json, data/aidlc-profiles.json and data/aidlc-agents.json by \`npm run docs:gen\`. Do not edit by hand. Content is taken from the AI-DLC ${t} guide (chapters 04, 05, 06, 14 and workflow-profiles), checked ${sc.upstream.verifiedOn}.`,
    '',
    `Source repository: ${sc.upstream.repo} (tag ${t}). This studio plans with this data; it does not run AI-DLC.`,
    '',
    '## Rules stated in the guide',
    '',
    ...sc.rules.map(r => `- ${r}`),
    ''
  ];
  for (const p of sc.phases) {
    out.push(`## Phase ${p.id}: ${p.name}`, '', `> ${p.purpose}`, '', '| Stage | Lead agent | Supporting agents | Reviewer | Mode | Runs | Gate | Output files |', '|---|---|---|---|---|---|---|---|');
    for (const s of sc.stages.filter(x => x.phase === p.name)) {
      const runs = `${s.runs}${s.condition ? ` — ${s.condition}` : ''}${s.perUnit ? ' (per Unit)' : ''}`;
      const gate = `${s.gate ? 'yes' : 'no'}${s.gateNote ? ` — ${s.gateNote}` : ''}`;
      const outputs = `${s.outputs.join(', ') || '—'}${s.outputsNote ? ` (${s.outputsNote})` : ''}`;
      out.push(`| ${s.id} ${s.name} | ${s.lead} | ${s.support.join(', ') || '—'} | ${s.reviewer ?? '—'} | ${s.mode} | ${runs} | ${gate} | ${outputs} |`.replace(/\n/g, ' '));
    }
    out.push('');
  }
  out.push('## Workflow profiles', '', `${pc.countNote}`, '', '| Profile | Best for | Stated count | Depth | Test strategy | Stages run (after Initialization) | Notes |', '|---|---|---|---|---|---|---|');
  for (const p of pc.profiles) out.push(`| ${p.id}${p.default ? ' (default)' : ''} | ${p.bestFor} | ${p.statedCount} | ${p.depth} | ${p.testStrategy} | ${p.stages.filter(s => !s.startsWith('0.')).map(s => p.conditionalStages.includes(s) ? `${s}*` : s).join(', ')} | ${p.notes ?? ''} |`);
  out.push('', 'Stages marked * are conditional for this profile.', '', '### Depth levels', '', ...pc.depthLevels.map(d => `- **${d.id}**: ${d.text}`), '', '### Test-strategy levels', '', ...pc.testLevels.map(d => `- **${d.id}**: ${d.text}`), '', '### Choosing a profile', '', ...pc.choose.map(c => `- ${c}`), '');
  out.push('## Agents', '', '| Agent | Kind | Domain | Role | Leads | Supports | Reviews |', '|---|---|---|---|---|---|---|');
  for (const a of ac.agents) out.push(`| ${a.id} | ${a.kind} | ${a.domain} | ${a.role} | ${a.leads.join(', ') || '—'} | ${a.supports.join(', ') || '—'} | ${a.reviews.join(', ') || '—'} |`);
  out.push('');
  return out.join('\n');
}
