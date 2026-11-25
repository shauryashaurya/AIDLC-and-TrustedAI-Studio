<script lang="ts">
  import SamplePicker from '../components/SamplePicker.svelte';
  import type { UseCase } from '../lib/types';
  import { CONTROLS, STAGES, initialControls } from '../lib/model';
  import { assessReadiness } from '../lib/assurance';
  import { FRAMEWORKS, REFERENCES, REF_BY_ID } from '../lib/catalog';
  import { allFrameworkIds, frameworkIndex } from '../lib/frameworks';
  import { buildCitationIndex } from '../lib/references';
  import { focus, go, openNode, openReference, openStage, toast, touch } from '../lib/state';
  import { pageForControl } from '../lib/crosslinks';
  import { PAGE_LABELS } from '../lib/references';

  export let active: UseCase | null = null;
  export let onBegin: () => void = () => {};
  const mark = () => { if (active) active = touch(active); };
  const FW = frameworkIndex(FRAMEWORKS);
  const citationIndex = buildCitationIndex(REFERENCES, CONTROLS, STAGES);
  const controlRefs = REFERENCES.references.filter(r => citationIndex.get(r.id)?.controls.length);
  const usedIds = new Set(CONTROLS.flatMap(k => allFrameworkIds(k.frameworkIds)));
  const coverage = [
    { name: 'NIST AI RMF 1.0 subcategories', ids: FRAMEWORKS.rmf.subcategories.map(x => x.id) },
    { name: 'OWASP LLM 2026', ids: FRAMEWORKS.llm.items.map(x => x.id) },
    { name: 'OWASP Agentic 2026', ids: FRAMEWORKS.asi.items.map(x => x.id) }
  ].map(f => ({ ...f, covered: f.ids.filter(id => usedIds.has(id)).length }));
  const firstStageOf = (phase: string) => STAGES.find(s => s.phase === phase)?.id;
  const DOMAINS = ['All', ...new Set(CONTROLS.map(c => c.domain))];

  let controlDomain = 'All';
  let expanded = '';
  $: if ($focus.control) { controlDomain = 'All'; expanded = $focus.control; focus.update(f => ({ ...f, control: undefined })); }
  $: readiness = active ? assessReadiness(active) : null;
  $: visible = CONTROLS.filter(c => controlDomain === 'All' || c.domain === controlDomain);

  function applyControls() {
    if (!active) return;
    if (active.controls.length && !confirm('Replace the existing assessment and evidence?')) return;
    active.controls = initialControls(); mark(); toast('Control register created. Every control starts as unassessed.');
  }
</script>

<section class="section-header">
  <div><div class="eyebrow dark">TRUSTED AI CONTROLS</div><h1>Trust & security</h1><p>{CONTROLS.length} control prompts. Each lists the NIST AI RMF 1.0 subcategories, OWASP 2026 items and MITRE ATLAS techniques it relates to (studio mapping), and records owner, status, evidence or exception, and likelihood × impact.</p></div>
  {#if active}<button class="button secondary" on:click={applyControls}>{active.controls.length ? 'Reset control assessment' : 'Create control register'}</button>{/if}
</section>
{#if !active}
  <div class="empty-panel"><h3>No use case open</h3><p>The {CONTROLS.length} control prompts are listed below for reading. Create a use case to assess them.</p><button class="button primary" on:click={onBegin}>New blank use case</button><SamplePicker/></div>
{:else}
  <div class="metric-grid four">
    <div class="metric-card"><small>ESSENTIAL CONTROLS EVIDENCED</small><strong>{readiness?.score || 0}%</strong><span>{readiness?.evidenced || 0} of {readiness?.total || 0}, with owner and evidence</span></div>
    <div class="metric-card"><small>ESSENTIAL GAPS</small><strong>{readiness?.criticalGaps.length || 0}</strong><span>Essential controls without evidence</span></div>
    <div class="metric-card"><small>ASSESSED</small><strong>{readiness?.assessed || 0}</strong><span>of {CONTROLS.length} controls</span></div>
    <div class="metric-card"><small>STUDIO STATUS</small><strong class="status-text">{readiness?.gate || 'Blocked'}</strong><span>Calculated by this studio; not a compliance result</span></div>
  </div>
  {#if !active.controls.length}<div class="callout">No register yet. Select “Create control register”.</div>{/if}
{/if}

<p class="micro coverage-line">Framework coverage by these controls (studio mapping): {#each coverage as f, i}{#if i} · {/if}{f.name} {f.covered}/{f.ids.length}{/each}</p>
<div class="panel controls-panel"><div class="panel-head"><h3>Control register</h3><select class="small-select" aria-label="Filter by domain" bind:value={controlDomain}>{#each DOMAINS as d}<option>{d}</option>{/each}</select></div>
  {#each visible as ctrl (ctrl.id)}
    {@const assessment = active?.controls.find(a => a.id === ctrl.id)}
    <div class="control-row">
      <button class="control-row-main" aria-expanded={expanded === ctrl.id} on:click={() => expanded = expanded === ctrl.id ? '' : ctrl.id}><span class:critical={ctrl.critical} class="control-key">{ctrl.id}</span><span class="control-title"><strong>{ctrl.name}</strong><small>{ctrl.domain}{ctrl.critical ? ' · essential' : ''} · {allFrameworkIds(ctrl.frameworkIds).slice(0, 4).join(', ')}{allFrameworkIds(ctrl.frameworkIds).length > 4 ? ' …' : ''}</small></span><span class="control-status">{assessment?.status || '—'}</span><span>⌄</span></button>
      {#if expanded === ctrl.id}
        <div class="control-expand">
          <p>{ctrl.description}</p>
          <div class="fw-list"><span class="fw-head">FRAMEWORK IDS · studio mapping</span>
            {#each allFrameworkIds(ctrl.frameworkIds) as fid}{@const item = FW.get(fid)}<div class="fw-item"><button on:click={() => item && openReference(item.referenceId)}>{fid}</button><span>{item?.label}<small>{item?.framework}</small></span></div>{/each}
          </div>
          <div class="ref-chips"><span>REFERENCES</span>{#each ctrl.referenceIds as rid}<button on:click={() => openReference(rid)}>{REF_BY_ID.get(rid)?.title ?? rid}</button>{/each}</div>
          <div class="ref-chips"><span>GO TO</span><button on:click={() => go(pageForControl(ctrl.id))}>{PAGE_LABELS[pageForControl(ctrl.id)]}</button>{#if firstStageOf(ctrl.aidlcGatePhase)}<button on:click={() => openStage(firstStageOf(ctrl.aidlcGatePhase) ?? '')}>AI-DLC {ctrl.aidlcGatePhase} gates (studio mapping)</button>{/if}</div>
          {#if active}{@const related = (active.threats ?? []).filter(t => allFrameworkIds(ctrl.frameworkIds).includes(t.threatId))}{#if related.length}<div class="ref-chips"><span>THREAT ENTRIES</span>{#each related as t}<button title={t.status} on:click={() => openNode(t.nodeId)}>{active.nodes.find(n => n.id === t.nodeId)?.name ?? '?'} · {t.threatId} · {t.status}</button>{/each}</div>{/if}{/if}
          {#if active && assessment}
            <div class="input-grid third"><label>Status<select bind:value={assessment.status} on:change={mark}><option value="unassessed">Unassessed</option><option value="planned">Planned</option><option value="evidenced">Evidenced</option><option value="accepted">Risk accepted / exception</option></select></label><label>Control owner<input bind:value={assessment.owner} on:change={mark}/></label><label>Likelihood × impact (1–5 each)<div class="risk-pair"><input aria-label="Likelihood" type="number" min="1" max="5" bind:value={assessment.likelihood} on:change={mark}/><span>×</span><input aria-label="Impact" type="number" min="1" max="5" bind:value={assessment.impact} on:change={mark}/><strong>{assessment.likelihood * assessment.impact}/25</strong></div></label></div>
            <div class="input-grid"><label>Evidence (artifact, test result, date, reviewer)<textarea rows="2" bind:value={assessment.evidence} on:change={mark}></textarea></label><label>Exception justification<textarea rows="2" bind:value={assessment.exception} on:change={mark}></textarea></label></div>
          {:else if active}<button class="button secondary small" on:click={applyControls}>Create the register to record evidence</button>{/if}
        </div>
      {/if}
    </div>
  {/each}
</div>
{#if active && readiness?.criticalGaps.length}<div class="warning-panel"><strong>{readiness.criticalGaps.length} essential controls have no evidence</strong><p>“Risk accepted” counts as an exception, not as evidence.</p></div>{/if}
{#if active && readiness?.warnings.length}<div class="warning-panel"><strong>Other checks</strong>{#each readiness.warnings as w}<p>• {w}</p>{/each}</div>{/if}
<div class="panel"><div class="panel-head"><h3>References cited by the control register</h3><button class="button ghost small" on:click={() => go('references')}>All references §</button></div>
  <div class="standards-list">{#each controlRefs as ref}<button class="standards-ref" on:click={() => openReference(ref.id)}><div><strong>{ref.title}{ref.version ? ` · ${ref.version}` : ''}</strong><small>{ref.type}{ref.status === 'unverified' ? ' · unverified' : ''} · cited by {citationIndex.get(ref.id)?.controls.map(c => c.id).join(', ')}</small></div><span>§</span></button>{/each}</div>
</div>
