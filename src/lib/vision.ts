// Exports that a team can take into a real AI-DLC run. The app never runs AI-DLC itself.
// - vision.md uses the section headings of AI-DLC's writing-inputs/vision-document-guide.md (v2.11.5).
// - technical-environment.md uses the contents the facilitator guide suggests for the tech-environment note.
import type { UseCase } from './types';

const val = (s: string | undefined | null) => (s ?? '').trim() || '_Not yet written._';
const list = (items: string[]) => items.length ? items.map(i => `- ${i}`).join('\n') : '_None recorded._';

export function visionMarkdown(c: UseCase): string {
  const tools = c.nodes.filter(n => n.kind === 'tool' || n.kind === 'system' || n.kind === 'event').map(n => `${n.name}${n.toolPermissions ? ` — permissions: ${n.toolPermissions}` : ''}`);
  const risks = c.controls
    .filter(a => a.status !== 'evidenced' && a.likelihood * a.impact >= 12)
    .map(a => `${a.id}: likelihood ${a.likelihood} × impact ${a.impact}, status ${a.status}${a.exception ? `; exception: ${a.exception}` : ''}`);
  const openThreats = (c.threats ?? []).filter(t => t.status === 'open').length;
  const dod = c.units.filter(u => u.acceptanceTests.trim()).map(u => `${u.name || 'Untitled Unit'}: ${u.acceptanceTests.trim()}`);
  return [
    `# ${c.title || 'Untitled intent'}`,
    '',
    `> Exported from AI-DLC × Trusted AI Studio on ${new Date().toISOString().slice(0, 10)}. Section headings follow the AI-DLC v2.11.5 vision document guide. Review before use.`,
    '',
    '## Executive Summary', '', val(c.summary), '',
    '## Business Context', '',
    '### Problem Statement', '', val(c.problem), '',
    '### Business Drivers', '', val(c.outcome), '',
    '### Target Users and Stakeholders', '', [c.sponsor && `Sponsor: ${c.sponsor}`, c.accountableOwner && `Accountable owner: ${c.accountableOwner}`, c.stakeholders].filter(Boolean).join('\n\n') || '_Not yet written._', '',
    '### Business Constraints', '', [c.constraints, c.jurisdictions && `Jurisdictions: ${c.jurisdictions}`, `Data classification: ${c.dataClassification}`, `Risk tier: ${c.riskTier}`].filter(Boolean).join('\n\n'), '',
    '### Success Metrics', '', val(c.successMetrics), '',
    '## Full Scope Vision', '',
    '### Product Vision Statement', '', val(c.outcome), '',
    '### Feature Areas', '', val(c.inScope), '',
    '### Integration Points', '', list(tools), '',
    '### User Journeys', '', '_Not yet written._', '',
    '## MVP Scope', '',
    '### Objective', '', val(c.outcome), '',
    '### Success Criteria', '', val(c.successMetrics), '',
    '### Features In Scope', '', val(c.inScope), '',
    '### Features Out of Scope', '', val(c.outOfScope), '',
    '### Journeys the First Release Supports', '', '_Not yet written._', '',
    '### Assumptions and Accepted Limits', '', val(c.assumptions), '',
    '### Definition of Done', '', list(dod), '',
    '## Risks and Dependencies', '',
    '### Key Risks', '', list([...risks, ...(openThreats ? [`${openThreats} open threat-model entries (see studio report).`] : [])]), '',
    '### External Dependencies', '', list(tools), '',
    '### Open Questions', '', '_Not yet written._', ''
  ].join('\n');
}

export function technicalEnvironmentMarkdown(c: UseCase): string {
  const n = c.nfr;
  return [
    '# Technical environment',
    '',
    '> Exported from AI-DLC × Trusted AI Studio. Headings follow the contents the AI-DLC facilitator guide suggests for the tech-environment note. AI-DLC reads this file from aidlc/spaces/default/knowledge/aidlc-shared/technical-environment.md.',
    '',
    '## Language and version', '', '_Not yet written._', '',
    '## Framework', '', '_Not yet written._', '',
    '## Test tool', '', '_Not yet written._', '',
    '## Cloud and deployment model', '', [n.region && `Primary region: ${n.region}`, n.residency && `Residency: ${n.residency}`, n.networkBoundary && `Network isolation: ${n.networkBoundary}`, n.availabilityPct ? `Availability SLO: ${n.availabilityPct}%` : '', n.rtoMinutes ? `RTO: ${n.rtoMinutes} min` : '', n.rpoMinutes ? `RPO: ${n.rpoMinutes} min` : ''].filter(Boolean).join('\n\n') || '_Not yet written._', '',
    '## Prohibited libraries', '', '_Not yet written._', '',
    '## Security basics', '', [n.encryption && `Encryption: ${n.encryption}`, n.sensitiveData && `Sensitive data: ${n.sensitiveData}`, `Data classification: ${c.dataClassification}`].filter(Boolean).join('\n\n'), '',
    '## Example endpoint, function and test', '', '_Not yet written._', ''
  ].join('\n');
}

/** Commands shown in the AI-DLC facilitator guide / profiles guide, filled with the case's profile. */
export function aidlcCommands(profile: string): string[] {
  return [
    `/aidlc ${profile} Read ./vision.md and build what it describes`,
    `$aidlc ${profile} Read ./vision.md and build what it describes   (Codex CLI)`
  ];
}
