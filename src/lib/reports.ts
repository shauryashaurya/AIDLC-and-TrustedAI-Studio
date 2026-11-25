import type { ReferenceCatalog, UseCase } from './types';
import { assessReadiness, graphWarnings } from './assurance';
import { CONTROLS, STAGES } from './model';
import { integer, projectCosts, usd } from './financial';
import { planUnits } from './planning';
import { buildCitationIndex, isLocalReference } from './references';
import { FRAMEWORKS, PROFILE_CATALOG, REFERENCES, STAGE_CATALOG } from './catalog';
import { allFrameworkIds, frameworkIndex } from './frameworks';
import { simulate } from './simulation';
import { errorBudget } from './slo';
import patterns from '../../data/pattern-catalog.json';
const present=(s:unknown)=>String(s??'').trim()||'Not specified';
const FW=frameworkIndex(FRAMEWORKS);
const refLine=(r:ReferenceCatalog['references'][number])=>`- ${r.title}${r.version?` (${r.version})`:''} — ${isLocalReference(r)?r.url:(r.pinnedUrl||r.url)}${r.status==='unverified'?' — _unverified_':''}`;
export const escapeHtml=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const safeCell=(s:unknown)=>present(s).replace(/\|/g,'\\|').replace(/\n/g,'<br>');
const check=(s:string)=>s?'Yes':'No';
export function useCaseReport(c:UseCase):string {
 const a=assessReadiness(c),cost=projectCosts(c.nfr),warnings=graphWarnings(c),units=planUnits(c.units);
 const lines=[
 `# ${present(c.title)} — AI-DLC × Trusted AI execution plan`,
 '',`> Draft planning output • generated ${new Date().toISOString()} • not deployment authorization or certification.`,
 '',`## Executive decision brief`,'',`- Problem: ${present(c.problem)}`,
 `- Outcome: ${present(c.outcome)}`,`- Accountable owner: ${present(c.accountableOwner)}`,
 `- Business sponsor: ${present(c.sponsor)}`,`- Domain: ${present(c.domain)}`,
 `- Risk tier: ${c.riskTier} • Data class: ${c.dataClassification}`,
 `- Approval readiness: ${a.gate} (${a.score}% of essential controls evidenced).`,
 '',`## Scope and success`, '',`**Scope:** ${present(c.inScope)}`,
 `**Out of scope:** ${present(c.outOfScope)}`,
 `**Constraints:** ${present(c.constraints)}`,
 `**Success criteria:** ${present(c.successMetrics)}`,
 `**Assumptions:** ${present(c.assumptions)}`,
 '',`## Agent and RAG patterns`,'',
 `Agentic: ${c.patternIds.map(id=>patterns.agentPatterns.find(p=>p.id===id)?.name||id).join(', ')||'Not selected'}`,
 `Retrieval: ${c.ragIds.map(id=>patterns.ragTechniques.find(p=>p.id===id)?.name||id).join(', ')||'Not selected'}`,
 '',`### Architecture nodes`,'', '| Node | Type | Model | Identity | Tools and permissions | Boundary | Timeout / max steps / ceiling |','|---|---|---|---|---|---|---|',
 ...c.nodes.map(n=>`| ${safeCell(n.name)} | ${n.kind} | ${safeCell(n.model)} | ${safeCell(n.identity)} | ${safeCell(n.toolPermissions)} | ${safeCell(n.dataScope)} | ${n.timeoutSeconds}s / ${n.maxSteps} / ${usd(n.spendLimitUsd)} |`),
 '',`### Directed connections`,'','| From | To | Purpose | Contract | Failure policy | Probability |','|---|---|---|---|---|---:|',
 ...c.edges.map(e=>`| ${safeCell(c.nodes.find(n=>n.id===e.from)?.name)} | ${safeCell(c.nodes.find(n=>n.id===e.to)?.name)} | ${safeCell(e.label)} | ${safeCell(e.contract)} | ${e.failurePolicy} | ${e.probability??1} |`),
 '',`## Execution Units and dependencies`,'','| Unit | Owner | Dependencies | Status | Estimated days | Acceptance tests |','|---|---|---|---|---:|---|', ...c.units.map(u=>`| ${safeCell(u.name)} | ${safeCell(u.owner)} | ${u.dependsOn.map(id=>safeCell(c.units.find(x=>x.id===id)?.name||'missing')).join(', ')} | ${u.status} | ${u.estimateDays} | ${safeCell(u.acceptanceTests)} |`),'',`Proposed work waves: ${units.waves.map((w,i)=>`Wave ${i+1}: ${w.map(u=>u.name||u.id).join(', ')}`).join(' | ')||'None'}.`, `Critical-path effort proxy: ${units.criticalPathDays} days (unlimited parallel execution; excludes integration overhead).`,...units.warnings.map(w=>`- Unit graph warning: ${w}`),'',`## Verification, failure and abuse scenarios`,'',...c.scenarios.map(s=>`- **${present(s.name)}**: trigger ${present(s.trigger)}; expected ${present(s.expectedResult)}; failures/abuse ${present(s.failureAndAbuseCase)}; verification ${present(s.verification)}.`),'',`## NFR and capacity model`,'',
 `- Traffic: ${integer(c.nfr.requestsPerDay)} requests/day, ${c.nfr.peakFactor}× peak, ${integer(cost.monthlyRequests)} per month.`,
 `- Peak: ${cost.peakRps.toFixed(3)} requests/sec, planning concurrency ${cost.suggestedConcurrency} with headroom.` ,
 `- P95 target: ${c.nfr.p95TargetSeconds}s • Availability: ${c.nfr.availabilityPct}% • RTO: ${c.nfr.rtoMinutes} min • RPO: ${c.nfr.rpoMinutes} min.`,
 `- Region/residency: ${present(c.nfr.region)} / ${present(c.nfr.residency)}.`,
 `- Sensitive data: ${present(c.nfr.sensitiveData)} • Network: ${present(c.nfr.networkBoundary)} • Encryption: ${present(c.nfr.encryption)}.`,
 '',`### Monthly cost estimate`,'','| Component | Monthly USD |','|---|---:|',
 ...([['Model inference',cost.modelCost],['Retrieval',cost.retrievalCost],['Fixed infrastructure',cost.infrastructureCost],['Storage',cost.storageCost],['Human review',cost.humanReviewCost],['**Total**',cost.monthlyCost]] as const).map(([x,y])=>`| ${x} | ${usd(y)} |`),
 '',`Annualized: ${usd(cost.annualCost)} • Cost / 1,000 requests: ${usd(cost.costPer1000)} • Gross monthly value assumption: ${usd(cost.monthlyValue)}.`,
 '',`**Cost limitations:** user-entered estimates only, not actual cloud pricing or measured architecture performance. Excludes unmodeled networking, support, data ingestion, multi-model routing, commitments, licenses and tax.`,
 ...cost.assumptionWarnings.map(w=>`- Missing assumption: ${w}`),
 ...simulationLines(c,cost.monthlyRequests),
 '',`## AI-DLC stage plan (profile: ${c.profile}, AI-DLC ${STAGE_CATALOG.upstream.tag})`,'','| Stage | AI-DLC lead agent | Status | Owner | Evidence / approver |','|---|---|---|---|---|',
 ...c.stages.map(s=>{const st=STAGES.find(item=>item.id===s.id);return `| ${s.id} ${safeCell(st?.name)} | ${st?.lead??''} | ${s.status} | ${safeCell(s.owner)} | ${safeCell(s.evidence)} / ${safeCell(s.approver)} |`}),
 '',`## Trusted AI control register`,'','| Control | Domain | Status | Likelihood × impact | Owner | Evidence / exception | Framework IDs (studio mapping) |','|---|---|---|---|---|---|---|',
 ...c.controls.map(s=>{const item=CONTROLS.find(x=>x.id===s.id);return `| ${s.id} ${safeCell(item?.name)} | ${safeCell(item?.domain)} | ${s.status} | ${s.likelihood*s.impact}/25 | ${safeCell(s.owner)} | ${safeCell(s.evidence||s.exception)} | ${item?allFrameworkIds(item.frameworkIds).join(', '):''} |`}),
 '',`## Threat model`,'',...threatLines(c),
 '',`## Open blockers and cautions`,'',...a.criticalGaps.map(w=>`- Required evidence missing: ${w}`),...a.warnings.map(w=>`- ${w}`),...warnings.map(w=>`- Architecture: ${w}`),
 '',`## Decision log`,'',...c.decisions.map(d=>`- **${present(d.title)}** (${d.date}; ${present(d.owner)}): ${present(d.decision)}. Rationale: ${present(d.rationale)}`),
 '',`## Provenance`,'',`Source case: ${present(c.sourceUrl)}`,
 `Source retrieved: ${present(c.sourceDate)}`,
 '',`## References cited by the control register`,'',`Catalog version ${REFERENCES.catalogVersion}. Verify current editions before relying on them.`,'',
 ...(()=>{const index=buildCitationIndex(REFERENCES,CONTROLS,STAGES);return REFERENCES.references.filter(r=>index.get(r.id)?.controls.length).map(refLine);})(),
 '',`---`,'',`_Readiness here is a planning heuristic, not a compliance, security or production certification._`
 ];
 return lines.join('\n');
}
function threatLines(c:UseCase):string[] {
 const t=c.threats??[];
 if(!t.length)return ['_No threat entries. Select each node on the Agentic designer to create them._'];
 return ['| Node | Threat | Status | Mitigation |','|---|---|---|---|',...t.map(x=>`| ${safeCell(c.nodes.find(n=>n.id===x.nodeId)?.name)} | ${x.threatId} ${safeCell(FW.get(x.threatId)?.label)} | ${x.status} | ${safeCell(x.mitigation)} |`)];
}
function simulationLines(c:UseCase,monthlyRequests:number):string[] {
 const out:string[]=[];
 if(c.nodes.length){const sim=simulate(c.nodes,c.edges,{runs:2000,seed:42});
  out.push('',`### Graph simulation (${sim.runs} runs, seed 42; studio calculation over user-entered node inputs)`,'','| Measure | Mean | P50 | P95 | Max |','|---|---:|---:|---:|---:|',
   `| Cost per request (USD) | ${sim.cost.mean.toFixed(5)} | ${sim.cost.p50.toFixed(5)} | ${sim.cost.p95.toFixed(5)} | ${sim.cost.max.toFixed(5)} |`,
   `| Latency per request (s) | ${sim.latency.mean.toFixed(2)} | ${sim.latency.p50.toFixed(2)} | ${sim.latency.p95.toFixed(2)} | ${sim.latency.max.toFixed(2)} |`,'',
   `Runs reaching a node step cap: ${(sim.stepCapHitRate*100).toFixed(1)}% • Runs exceeding a node spend cap: ${(sim.spendCapHitRate*100).toFixed(1)}% • Monthly graph cost at the mean: ${usd(sim.cost.mean*monthlyRequests)}.`,...sim.warnings.map(w=>`- ${w}`));}
 if(c.nfr.availabilityPct){const b=errorBudget(c.nfr.availabilityPct,c.nfr.daysPerMonth,monthlyRequests);
  out.push('',`Error budget for ${c.nfr.availabilityPct}% over ${c.nfr.daysPerMonth} days: ${b.allowedDowntimeMinutes.toFixed(1)} minutes of downtime or ${integer(b.allowedFailedRequests)} failed requests.`);}
 return out;
}
export function referenceReport():string {
  return ['# AI-DLC × Trusted AI reference catalogue',
  '',`Generated ${new Date().toISOString()} without loading any use case.`,
  '',`## AI-DLC ${STAGE_CATALOG.upstream.tag} stages`,'','| Phase | ID | Stage | Lead agent | Mode | Runs | Outputs |','|---|---|---|---|---|---|---|',
  ...STAGES.map(s=>`| ${s.phase} | ${s.id} | ${s.name} | ${s.lead} | ${s.mode} | ${s.runs} | ${s.outputs.join(', ')} |`),
  '',`## AI-DLC ${PROFILE_CATALOG.tag} workflow profiles`,'','| Profile | Best for | Stages (stated) | Depth | Test strategy |','|---|---|---|---|---|',
  ...PROFILE_CATALOG.profiles.map(p=>`| ${p.id} | ${p.bestFor} | ${p.statedCount} | ${p.depth} | ${p.testStrategy} |`),
  '',`## 25 agentic patterns`,'',...patterns.agentPatterns.map(p=>`- **${p.name}** (${p.complexity}): ${p.mechanism}. ${p.useCase}.`),
  '',`## 40 retrieval techniques`,'',...patterns.ragTechniques.map(p=>`- **${p.name}** (${p.category}): ${p.mechanism}.`),
  '',`## ${CONTROLS.length} Trusted AI control prompts`,'',...CONTROLS.map(c=>`- **${c.id} ${c.name}** [${c.domain}${c.critical?' / essential':''}]: ${c.description} Framework IDs (studio mapping): ${allFrameworkIds(c.frameworkIds).join(', ')}.`),
  '',`## References (catalog ${REFERENCES.catalogVersion})`,
  ...REFERENCES.domains.flatMap(d=>{const refs=REFERENCES.references.filter(r=>r.domain===d.id);return refs.length?['',`### ${d.label}`,'',...refs.map(r=>`${refLine(r)} [${r.type}]`)]:[];}),
  '',`_These are educational mappings and planning controls; they are not authoritative reproductions of paid standards._`].join('\n');
}
function richInline(source:string):string {
  return escapeHtml(source).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/(https:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noreferrer">$1</a>');
}
/** Safe, dependency-free rendering of the limited Markdown generated by this app. */
function renderReportMarkdown(markdown:string):string {
  const lines=markdown.split(/\r?\n/), html:string[]=[];
  const cells=(row:string)=>row.replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(x=>x.trim().replace(/\\\|/g,'|'));
  let i=0;
  while(i<lines.length){const line=lines[i];
    if(!line.trim()){i++;continue;}
    const heading=line.match(/^(#{1,4})\s+(.+)/);
    if(heading){const n=heading[1].length;html.push(`<h${n}>${richInline(heading[2])}</h${n}>`);i++;continue;}
    if(/^\|/.test(line)&&i+1<lines.length&&/^\|[\s\-|:]+\|?$/.test(lines[i+1])){
      html.push('<table><thead><tr>'+cells(line).map(x=>`<th>${richInline(x)}</th>`).join('')+'</tr></thead><tbody>');i+=2;
      while(i<lines.length&&/^\|/.test(lines[i])){html.push('<tr>'+cells(lines[i]).map(x=>`<td>${richInline(x)}</td>`).join('')+'</tr>');i++;}
      html.push('</tbody></table>');continue;
    }
    if(/^\- /.test(line)){
      html.push('<ul>');while(i<lines.length&&/^\- /.test(lines[i])){html.push(`<li>${richInline(lines[i].slice(2))}</li>`);i++;}html.push('</ul>');continue;
    }
    if(/^> /.test(line)){html.push(`<blockquote>${richInline(line.slice(2))}</blockquote>`);i++;continue;}
    if(/^---+$/.test(line)){html.push('<hr/>');i++;continue;}
    html.push(`<p>${richInline(line)}</p>`);i++;
  }
  return html.join('\n');
}
export function reportHtml(markdown:string):string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI-DLC × Trusted AI — Planning Report</title><style>
  :root{font-family:Inter,Aptos,Arial,sans-serif;color:#22394e}body{max-width:1120px;margin:50px auto;padding:0 30px;background:#fff;font-size:13px;line-height:1.7}header{border-top:7px solid #176fae;padding:22px 0 25px;border-bottom:1px solid #d7e2ec;margin-bottom:30px;display:flex;justify-content:space-between;gap:40px}header h1{font-size:20px;margin:0;color:#143553}header small{letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:#6991a9}h1,h2,h3,h4{color:#123856;break-after:avoid}h1{font-size:29px;letter-spacing:-.04em;margin-top:35px}h2{font-size:19px;border-bottom:1px solid #dce7ed;padding-bottom:8px;margin-top:32px}h3{font-size:15px;margin-top:25px}p{margin:8px 0;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;margin:15px 0 23px;font-size:11px;table-layout:auto}th,td{border-bottom:1px solid #dfe7ed;text-align:left;padding:9px 8px;vertical-align:top;overflow-wrap:anywhere}th{color:#254d6b;background:#eaf2f8;font-weight:800}tr:nth-child(even) td{background:#f9fbfd}li{padding:2px 0;overflow-wrap:anywhere}blockquote{border-left:3px solid #4fa8c4;margin:18px 0;padding:8px 16px;background:#eff8fb;color:#497c92}a{color:#1579b6;text-decoration:none}code{background:#f1f5f8;padding:2px 4px;border-radius:4px}footer{border-top:1px solid #dce7ed;margin:38px 0;padding:15px 0;color:#7c94a6;font-size:11px}@media print{body{margin:10mm;max-width:none;padding:0}table{font-size:9px;page-break-inside:auto}tr{break-inside:avoid}h2,h3{break-after:avoid}header{margin-bottom:15px}a{color:#22394e}}
  </style></head><body><header><div><small>Enterprise architecture / governance review</small><h1>AI-DLC × Trusted AI Studio</h1></div><small>Generated planning record<br/>Not deployment approval</small></header>${renderReportMarkdown(markdown)}<footer>Independent planning companion · Verify evidence, current standards and provider pricing before execution.</footer></body></html>`;
}

export function controlsCsv(c:UseCase):string {
 const rows=[['ID','Control','Domain','Status','Owner','Likelihood','Impact','Evidence','Exception']];
 c.controls.forEach(x=>{const k=CONTROLS.find(c=>c.id===x.id);rows.push([x.id,k?.name||'',k?.domain||'',x.status,x.owner,String(x.likelihood),String(x.impact),x.evidence,x.exception]);});
 return rows.map(row=>row.map(v=>{const t=String(v);const safe=/^[\s]*[=+@-]/.test(t)?"'"+t:t;return `"${safe.replace(/"/g,'""')}"`}).join(',')).join('\n');
}
