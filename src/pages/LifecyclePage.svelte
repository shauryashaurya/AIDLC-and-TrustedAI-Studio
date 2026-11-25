<script lang="ts">
  import SamplePicker from '../components/SamplePicker.svelte';
  import type { UseCase } from '../lib/types';
  import { STAGES, initialStages, makeDecision, makeUnit } from '../lib/model';
  import { planUnits } from '../lib/planning';
  import { AGENT_CATALOG, GATES, PROFILE_CATALOG, STAGE_CATALOG, TEMPLATE_CATALOG } from '../lib/catalog';
  import { compareWithProfile, profileById } from '../lib/aidlc';
  import { focus, go, openControl, openReference, toast, touch } from '../lib/state';
  import { pagesForStage } from '../lib/crosslinks';
  import { PAGE_LABELS } from '../lib/references';
  import { CONTROLS } from '../lib/model';

  export let active: UseCase | null = null;
  const mark = () => { if (active) active = touch(active); };
  const PHASES = STAGE_CATALOG.phases;

  let selectedPhase = 'Ideation';
  let expanded = '';
  let showAgents = false;
  $: if ($focus.stage) { const s = STAGES.find(x => x.id === $focus.stage); if (s) { selectedPhase = s.phase; expanded = s.id; } focus.update(f => ({ ...f, stage: undefined })); }
  $: phase = PHASES.find(p => p.name === selectedPhase);
  $: unitPlan = active ? planUnits(active.units) : null;
  $: profile = active ? profileById(PROFILE_CATALOG, active.profile) : undefined;
  $: diff = active ? compareWithProfile(PROFILE_CATALOG, STAGES, active.profile, active.stages.map(s => s.id)) : null;

  function applyStages() {
    if (!active) return;
    if (active.stages.length && !confirm('Replace the current stage plan and its evidence?')) return;
    active.stages = initialStages(active.profile); mark();
    toast(`Stage plan created from the ${active.profile} profile (${active.stages.length} stages including Initialization).`);
  }
  function addStage(id: string) { if (!active || active.stages.some(s => s.id === id)) return; active.stages = [...active.stages, { id, status: 'not-started' as const, owner: '', evidence: '', notes: '', approver: '' }].sort((a, b) => parseFloat(a.id) - parseFloat(b.id)); mark(); }
  function removeStage(id: string) { if (!active) return; active.stages = active.stages.filter(s => s.id !== id); mark(); }
  function addUnit() { if (!active) return; active.units = [...active.units, makeUnit()]; mark(); }
  function deleteUnit(id: string) { if (!active) return; active.units = active.units.filter(u => u.id !== id).map(u => ({ ...u, dependsOn: u.dependsOn.filter(d => d !== id) })); mark(); }
  function toggleDep(unitId: string, depId: string) { if (!active || unitId === depId) return; const u = active.units.find(x => x.id === unitId); if (!u) return; u.dependsOn = u.dependsOn.includes(depId) ? u.dependsOn.filter(i => i !== depId) : [...u.dependsOn, depId]; mark(); }
  function addDecision() { if (!active) return; active.decisions = [...active.decisions, makeDecision()]; mark(); }
</script>

<section class="section-header">
  <div><div class="eyebrow dark">AWS AI-DLC {STAGE_CATALOG.upstream.tag}</div><h1>AI-DLC lifecycle</h1><p>The {STAGES.length} stages in {PHASES.length} phases as documented in AI-DLC {STAGE_CATALOG.upstream.tag}: lead and supporting agents, execution mode, conditions and output files. With a use case open, plan stages, Units of Work and decisions. This studio does not run AI-DLC.</p></div>
  {#if active}<button class="button primary" on:click={applyStages}>{active.stages.length ? 'Rebuild plan from profile' : 'Create stage plan from profile'} ({active.profile})</button>{/if}
</section>

{#if active && diff && active.stages.length && (diff.missing.length || diff.extra.length)}
  <div class="callout">Plan differs from the {active.profile} profile. {#if diff.missing.length}Not in plan: {diff.missing.join(', ')}. {/if}{#if diff.extra.length}Added beyond the profile: {diff.extra.join(', ')}.{/if}</div>
{/if}

{#if !active}<div class="callout">No use case open: the stages below are for reading. Open or create a use case to plan stages, Units and decisions.<SamplePicker/></div>{/if}
<div class="phase-strip">{#each PHASES as p}<button class:chosen={selectedPhase === p.name} on:click={() => selectedPhase = p.name}><b>{p.id}</b><strong>{p.name}</strong><small>{STAGES.filter(s => s.phase === p.name).length} stages</small></button>{/each}</div>

<div class="lifecycle-layout">
  <div class="panel stacked">
    <div class="panel-head"><div><h3>{selectedPhase}</h3><span class="micro">{phase?.purpose}</span></div><span class="pill">{active?.stages.filter(s => STAGES.find(t => t.id === s.id)?.phase === selectedPhase).length || 0} in plan</span></div>
    {#each STAGES.filter(x => x.phase === selectedPhase) as stage (stage.id)}
      {@const plan = active?.stages.find(s => s.id === stage.id)}
      {@const inProfile = profile?.stages.includes(stage.id)}
      <div class="stage-row">
        <button class="stage-row-head" aria-expanded={expanded === stage.id} on:click={() => expanded = expanded === stage.id ? '' : stage.id}><span class="stage-id">{stage.id}</span><div><strong>{stage.name}</strong><small>{stage.lead} · {stage.mode} · {stage.runs}{stage.perUnit ? ' · per Unit' : ''}{active ? (inProfile ? ` · in ${active.profile}` : ` · not in ${active.profile}`) : ''}</small></div>{#if stage.gate}<span class="gate-tag">GATE</span>{:else}<span></span>{/if}<span class="stage-status">{plan?.status || (active ? 'not in plan' : '')}</span><span>⌄</span></button>
        {#if expanded === stage.id}
          <div class="stage-details">
            <dl class="stage-facts">
              <div><dt>Lead agent</dt><dd>{stage.lead}</dd></div>
              <div><dt>Supporting agents</dt><dd>{stage.support.join(', ') || 'none'}</dd></div>
              <div><dt>Reviewer</dt><dd>{stage.reviewer ?? 'none listed'}</dd></div>
              <div><dt>Mode</dt><dd>{stage.mode}</dd></div>
              <div><dt>Runs</dt><dd>{stage.runs}{stage.condition ? ` — ${stage.condition}` : ''}</dd></div>
              <div><dt>Approval gate</dt><dd>{stage.gate ? 'Yes' : 'No'}{stage.gateNote ? ` — ${stage.gateNote}` : ''}</dd></div>
            </dl>
            {#if stage.recordDir}<p><b>Written to:</b> <code>{stage.recordDir}</code> · <b>Rule file:</b> <code>{stage.ruleFile}</code></p>{/if}
            {#if TEMPLATE_CATALOG.templates.some(t => t.stage === stage.id)}<p><b>Team templates in the workspace package:</b> {TEMPLATE_CATALOG.templates.filter(t => t.stage === stage.id).map(t => `${t.stem}.md (${t.sections.length} sections)`).join(', ')}</p>{/if}
            <div class="ref-chips"><span>WORK ON THIS IN</span>{#each pagesForStage(stage.id) as pg}<button on:click={() => go(pg)}>{PAGE_LABELS[pg]}</button>{/each}<button on:click={() => openReference('aidlc-stage-rules')}>Stage rule ({stage.ruleFile.split('/').pop()})</button></div>
            {#if !stage.id.startsWith('0.')}<div class="ref-chips"><span>TRUSTED AI CHECKS AT {stage.phase.toUpperCase()} GATES</span>{#each CONTROLS.filter(k => k.aidlcGatePhase === stage.phase) as k}<button title={k.name} on:click={() => openControl(k.id)}>{k.id}{active ? ` · ${active.controls.find(a => a.id === k.id)?.status ?? 'not assessed'}` : ''}</button>{/each}</div>{/if}
            <p><b>Output files:</b> {stage.outputs.length ? stage.outputs.join(', ') : 'none'}{stage.outputsNote ? ` (${stage.outputsNote})` : ''}</p>
            {#if active && plan}
              <div class="input-grid third"><label>Status<select bind:value={plan.status} on:change={mark}><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="in-review">In review</option><option value="approved">Approved</option><option value="waived">Waived</option></select></label><label>Accountable owner<input bind:value={plan.owner} on:change={mark}/></label><label>Approver<input bind:value={plan.approver} on:change={mark}/></label></div>
              <label>Evidence (artifact link, test ID, approval record)<textarea rows="2" bind:value={plan.evidence} on:change={mark}></textarea></label>
              <label>Notes<textarea rows="2" bind:value={plan.notes} on:change={mark}></textarea></label>
              <button class="text-danger" on:click={() => removeStage(stage.id)}>Remove from plan</button>
            {:else if active}<button class="button secondary small" on:click={() => addStage(stage.id)}>+ Add stage to plan</button>{/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
  <div class="panel stacked">
    <div class="panel-head"><h3>Rules stated in the AI-DLC guide</h3></div>
    {#each STAGE_CATALOG.rules as r}<div class="learning-point"><p>{r}</p></div>{/each}
    <div class="learning-point"><p>State is kept in aidlc-state.md and an append-only audit/ folder inside each intent's record dir. <button class="link" on:click={() => openReference('aidlc-state-audit')}>Source</button></p></div>
    <div class="panel-head"><h3>Gate types</h3><span class="micro">AI-DLC {GATES.tag} and the studio's Trusted AI gates</span></div>
    {#each GATES.gates as g}<div class="learning-point"><b>{g.name}{g.kind === 'studio' ? ' (studio)' : ''}</b> <span class="micro">{g.appliesTo}</span><p>{g.rule}</p></div>{/each}
    <button class="button ghost small" on:click={() => showAgents = !showAgents}>{showAgents ? 'Hide' : 'Show'} the {AGENT_CATALOG.agents.length} AI-DLC agents</button>
    {#if showAgents}
      {#each AGENT_CATALOG.agents as a}<div class="learning-point"><b>{a.id}</b> <span class="micro">{a.kind} · {a.domain}</span><p>{a.role}{a.leads.length ? ` Leads: ${a.leads.join(', ')}.` : ''}{a.supports.length ? ` Supports: ${a.supports.join(', ')}.` : ''}{a.reviews.length ? ` Reviews: ${a.reviews.join(', ')}.` : ''}</p></div>{/each}
    {/if}
  </div>
</div>

{#if active}
  <div class="panel stacked decision-panel">
    <div class="panel-head"><div><h3>Units of Work and dependencies</h3><span class="micro">AI-DLC 2.7 Units Generation writes unit-of-work.md and unit-of-work-dependency.md</span></div><button class="button secondary small" on:click={addUnit}>+ Unit</button></div>
    {#if !active.units.length}<p class="subtle-empty">No Units yet.</p>{/if}
    {#each active.units as unit (unit.id)}
      <div class="decision-item">
        <div class="input-grid third"><label>Unit name<input bind:value={unit.name} on:change={mark}/></label><label>Owner<input bind:value={unit.owner} on:change={mark}/></label><label>Status<select bind:value={unit.status} on:change={mark}><option>planned</option><option>ready</option><option>building</option><option>verified</option></select></label></div>
        <div class="input-grid third"><label>Scope<textarea rows="2" bind:value={unit.description} on:change={mark}></textarea></label><label>Acceptance tests<textarea rows="2" bind:value={unit.acceptanceTests} on:change={mark}></textarea></label><div class="input-grid"><label>Risk<select bind:value={unit.risk} on:change={mark}><option>low</option><option>medium</option><option>high</option></select></label><label>Estimated days<input type="number" min="0" step=".5" bind:value={unit.estimateDays} on:change={mark}/></label></div></div>
        <div class="unit-dependencies"><b>Depends on</b>{#each active.units.filter(u => u.id !== unit.id) as dep (dep.id)}<label><input type="checkbox" checked={unit.dependsOn.includes(dep.id)} on:change={() => toggleDep(unit.id, dep.id)}/><span>{dep.name || 'Untitled Unit'}</span></label>{/each}</div>
        <button class="text-danger" on:click={() => deleteUnit(unit.id)}>Remove Unit</button>
      </div>
    {/each}
    {#if unitPlan && active.units.length}
      <div class="unit-plan-result"><div class="panel-head"><h3>Dependency waves</h3><span class="micro">Critical path: {unitPlan.criticalPathDays} days · total effort: {unitPlan.totalEffortDays} days</span></div>
        {#each unitPlan.waves as wave, i}<div class="execution-wave"><span>WAVE {i + 1}</span><div>{#each wave as u}<b>{u.name || 'Untitled Unit'}</b>{/each}</div></div>{/each}
        {#each unitPlan.warnings as w}<p class="wave-warning">⚠ {w}</p>{/each}
        <p class="mini-note">Waves group Units whose dependencies are complete. The critical path assumes unlimited parallel teams and no integration time.</p>
      </div>
    {/if}
  </div>
  <div class="panel stacked decision-panel">
    <div class="panel-head"><div><h3>Decision records</h3><span class="micro">AI-DLC 1.7 writes decision-log.md; 2.6 writes decisions.md</span></div><button class="button secondary small" on:click={addDecision}>+ Decision</button></div>
    {#if !active.decisions.length}<p class="subtle-empty">No decisions yet.</p>{/if}
    {#each active.decisions as d (d.id)}
      <div class="decision-item"><div class="input-grid third"><label>Title<input bind:value={d.title} on:change={mark}/></label><label>Owner<input bind:value={d.owner} on:change={mark}/></label><label>Date<input type="date" bind:value={d.date} on:change={mark}/></label></div><div class="input-grid"><label>Decision<textarea rows="2" bind:value={d.decision} on:change={mark}></textarea></label><label>Rationale and evidence<textarea rows="2" bind:value={d.rationale} on:change={mark}></textarea></label></div><button class="text-danger" on:click={() => { if (!active) return; active.decisions = active.decisions.filter(x => x.id !== d.id); mark(); }}>Remove</button></div>
    {/each}
  </div>
{/if}
