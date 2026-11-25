// Pure, framework-free helpers over data/references.json.
// The catalog is passed in, never imported, so Node tests and the generator script can use these
// functions without a bundler.
import type { Page, Reference, ReferenceCatalog } from './types';

export interface CitingControl { id: string; name: string; referenceIds?: string[] }
export interface CitingStage { id: string; name: string; phase: string }
export interface Citations { pages: Page[]; stages: CitingStage[]; controls: CitingControl[] }
export interface ReferenceFilter { domain?: string; type?: string; query?: string; includeSuperseded?: boolean }

export const PAGE_LABELS: Record<Page, string> = {
  home: 'Command center', workshop: 'Workshop', discover: 'AWS live samples', ideate: 'Use-case framing', patterns: 'Agentic designer',
  nfr: 'NFR & cost lab', trust: 'Trust & security', lifecycle: 'AI-DLC lifecycle', reports: 'Reports & exports', references: 'References'
};

export const isLocalReference = (r: Pick<Reference, 'url'>): boolean => !/^https:\/\//.test(r.url);

export function filterReferences(refs: Reference[], f: ReferenceFilter = {}): Reference[] {
  const q = (f.query ?? '').trim().toLowerCase();
  return refs.filter(r =>
    (!f.domain || f.domain === 'all' || r.domain === f.domain) &&
    (!f.type || f.type === 'all' || r.type === f.type) &&
    (f.includeSuperseded !== false || r.status !== 'superseded') &&
    (!q || [r.id, r.title, r.publisher, r.version ?? '', r.summary, r.usedIn, r.verificationNotes].join(' ').toLowerCase().includes(q)));
}

/** Reverse index: which controls, stages and pages cite each reference. */
export function buildCitationIndex(catalog: ReferenceCatalog, controls: CitingControl[], stages: CitingStage[]): Map<string, Citations> {
  const index = new Map<string, Citations>();
  const stageById = new Map(stages.map(s => [s.id, s]));
  for (const r of catalog.references) {
    index.set(r.id, {
      pages: [...r.citedBy.pages],
      stages: r.citedBy.stages.map(id => stageById.get(id)).filter((s): s is CitingStage => Boolean(s)),
      controls: []
    });
  }
  for (const c of controls) for (const id of c.referenceIds ?? []) index.get(id)?.controls.push(c);
  return index;
}

/** Integrity rules for the catalog. Returns human-readable problems; empty means valid. */
export function validateCatalog(catalog: ReferenceCatalog, controls: CitingControl[], stages: CitingStage[]): string[] {
  const problems: string[] = [];
  const types = new Set(catalog.types);
  const domains = new Set(catalog.domains.map(d => d.id));
  const stageIds = new Set(stages.map(s => s.id));
  const pages = new Set(Object.keys(PAGE_LABELS));
  const seen = new Set<string>();
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  for (const r of catalog.references) {
    const at = `reference '${r.id}'`;
    if (seen.has(r.id)) problems.push(`${at}: duplicate id`);
    seen.add(r.id);
    for (const key of ['title', 'publisher', 'summary', 'usedIn'] as const) if (!r[key]?.trim()) problems.push(`${at}: missing ${key}`);
    if (typeof r.verificationNotes !== 'string') problems.push(`${at}: verificationNotes must be a string`);
    if (!types.has(r.type)) problems.push(`${at}: type '${r.type}' is not listed in catalog.types`);
    if (!domains.has(r.domain)) problems.push(`${at}: unknown domain '${r.domain}'`);
    if (isLocalReference(r) && (r.domain !== 'project' || !r.url.startsWith('data/'))) problems.push(`${at}: url must be https (only project files may use a data/ path)`);
    if (r.pinnedUrl && !r.pinnedUrl.startsWith('https://')) problems.push(`${at}: pinnedUrl must be https`);
    if (r.verifiedOn === null) { if (r.status !== 'unverified') problems.push(`${at}: verifiedOn may be null only when status is 'unverified'`); }
    else if (!isoDate.test(r.verifiedOn)) problems.push(`${at}: verifiedOn must be YYYY-MM-DD`);
    if (r.status === 'unverified' && !r.verificationNotes.trim()) problems.push(`${at}: unverified entries must say why in verificationNotes`);
    if (r.publishedDate !== null && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(r.publishedDate)) problems.push(`${at}: publishedDate must be YYYY[-MM[-DD]]`);
    for (const p of r.citedBy.pages) if (!pages.has(p)) problems.push(`${at}: unknown page '${p}'`);
    for (const s of r.citedBy.stages) if (!stageIds.has(s)) problems.push(`${at}: unknown stage '${s}'`);
  }
  for (const c of controls) {
    if (!c.referenceIds?.length) problems.push(`control '${c.id}': no referenceIds`);
    for (const id of c.referenceIds ?? []) if (!seen.has(id)) problems.push(`control '${c.id}': unknown reference '${id}'`);
  }
  return problems;
}

const cell = (s: string | null | undefined) => (s ?? '—').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const link = (r: Reference) => isLocalReference(r) ? `\`${r.url}\`` : `[${cell(r.title)}](${r.url})`;

/** Deterministic Markdown rendering. data/references.md is this output; a test keeps them identical. */
export function referencesMarkdown(catalog: ReferenceCatalog, controls: CitingControl[], stages: CitingStage[]): string {
  const index = buildCitationIndex(catalog, controls, stages);
  const out: string[] = [
    `# References: AI-DLC × Trusted AI Studio`,
    '',
    `> Generated from \`data/references.json\` by \`npm run docs:gen\`. Do not edit by hand. Catalog version ${catalog.catalogVersion}.`,
    '',
    catalog.provenance,
    '',
    'AWS samples are loaded on demand only: the app reads GitHub only when the user clicks "Fetch AWS samples live". No sample is bundled.',
    ''
  ];
  for (const d of catalog.domains) {
    const refs = catalog.references.filter(r => r.domain === d.id);
    if (!refs.length) continue;
    out.push(`## ${d.label}`, '', '| Reference | Type | Version | Published | Verified | Status |', '|---|---|---|---|---|---|');
    for (const r of refs) out.push(`| ${link(r)}${r.pinnedUrl ? ` ([pinned](${r.pinnedUrl}))` : ''} | ${cell(r.type)} | ${cell(r.version)} | ${cell(r.publishedDate)} | ${cell(r.verifiedOn)} | ${r.status} |`);
    out.push('');
    for (const r of refs) {
      const cites = index.get(r.id);
      const citedBy = [...(cites?.controls.map(c => c.id) ?? []), ...(cites?.stages.map(s => `stage ${s.id}`) ?? []), ...(cites?.pages.map(p => PAGE_LABELS[p]) ?? [])];
      out.push(`### ${r.title}`, '',
        `- **Publisher:** ${r.publisher}. **Access:** ${r.access}${r.license ? `. **Licence:** ${r.license}` : ''}.`,
        `- **Source states:** ${r.summary}`,
        `- **Used in this app:** ${r.usedIn}`,
        ...(r.verificationNotes ? [`- **Verification notes:** ${r.verificationNotes}`] : []),
        ...(citedBy.length ? [`- **Cited by:** ${citedBy.join(', ')}`] : []),
        '');
    }
  }
  out.push('## Control → reference traceability', '', '| Control | References |', '|---|---|');
  for (const c of controls) out.push(`| ${c.id} ${cell(c.name)} | ${(c.referenceIds ?? []).map(id => `\`${id}\``).join(', ')} |`);
  out.push('');
  return out.join('\n');
}
