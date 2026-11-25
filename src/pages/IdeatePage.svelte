<script lang="ts">
  import SamplePicker from '../components/SamplePicker.svelte';
  import type { UseCase } from '../lib/types';
  import { go, openControl, openStage, touch } from '../lib/state';
  import { PROFILE_CATALOG, STAGE_CATALOG } from '../lib/catalog';
  import { profileById, skippedByProfile, stagesForProfile } from '../lib/aidlc';

  export let active: UseCase | null = null;
  export let onBegin: () => void = () => {};
  const mark = () => { if (active) active = touch(active); };

  $: profile = active ? profileById(PROFILE_CATALOG, active.profile) : undefined;
  $: runs = active ? stagesForProfile(PROFILE_CATALOG, STAGE_CATALOG.stages, active.profile).filter(id => !id.startsWith('0.')) : [];
  $: skips = active ? skippedByProfile(PROFILE_CATALOG, STAGE_CATALOG.stages, active.profile) : [];
</script>

<section class="section-header">
  <div><div class="eyebrow dark">AI-DLC IDEATION · 1.1 – 1.4</div><h1>Use-case framing</h1><p>The problem, outcome, scope, owners and constraints of the use case, and the AI-DLC workflow profile it will follow.</p></div>
  {#if active}<span class="pill">Profile · {active.profile}</span>{/if}
</section>
{#if !active}
  <div class="empty-panel"><h3>No use case open</h3><p>Create a blank use case or import one.</p><button class="button primary" on:click={onBegin}>New blank use case</button><SamplePicker/></div>
{:else}
  <div class="form-grid">
    <div class="panel stacked"><div class="panel-head"><h3>Business intent</h3><span class="micro">Feeds vision.md</span></div>
      <label>Use-case title<input bind:value={active.title} on:change={mark} placeholder="e.g. Multi-agent fraud investigation"/></label>
      <label>Executive summary<textarea rows="3" bind:value={active.summary} on:change={mark} placeholder="What is proposed, and for whom?"></textarea></label>
      <label>Problem<textarea rows="4" bind:value={active.problem} on:change={mark}></textarea></label>
      <label>Target outcome<textarea rows="3" bind:value={active.outcome} on:change={mark}></textarea></label>
      <label>In scope<textarea rows="3" bind:value={active.inScope} on:change={mark}></textarea></label>
      <label>Out of scope<textarea rows="3" bind:value={active.outOfScope} on:change={mark}></textarea></label>
      <label>Success metrics<textarea rows="3" bind:value={active.successMetrics} on:change={mark}></textarea></label>
    </div>
    <div class="panel stacked"><div class="panel-head"><h3>Ownership & context</h3><span class="micro">Controls GOV-01 – GOV-03</span></div>
      <p class="micro">Controls fed by these fields: <button class="link" on:click={() => openControl('GOV-01')}>GOV-01 ownership</button> · <button class="link" on:click={() => openControl('GOV-03')}>GOV-03 law</button> · <button class="link" on:click={() => openControl('GOV-07')}>GOV-07 impact and risk tolerance</button> · <button class="link" on:click={() => openControl('SEC-04')}>SEC-04 data classification</button></p>
      <label>Business sponsor<input bind:value={active.sponsor} on:change={mark}/></label>
      <label>Accountable owner<input bind:value={active.accountableOwner} on:change={mark}/></label>
      <label>Stakeholders and approvers<textarea rows="3" bind:value={active.stakeholders} on:change={mark}></textarea></label>
      <label>Industry / business domain<input bind:value={active.domain} on:change={mark}/></label>
      <label>Jurisdictions<select bind:value={active.jurisdictions} on:change={mark}><option value="">Undetermined</option><option>India</option><option>EU</option><option>United States</option><option>Multiple / cross-border</option><option>Other — specify in constraints</option></select></label>
      <div class="input-row"><label>Data classification<select bind:value={active.dataClassification} on:change={mark}><option>Unclassified</option><option>Internal</option><option>Confidential</option><option>Restricted</option><option>Regulated</option></select></label><label>Risk tier<select bind:value={active.riskTier} on:change={mark}><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option><option value="critical">Critical</option></select></label></div>
      <label>Constraints<textarea rows="3" bind:value={active.constraints} on:change={mark}></textarea></label>
      <label>Assumptions and open questions<textarea rows="3" bind:value={active.assumptions} on:change={mark}></textarea></label>
    </div>
  </div>

  <div class="panel stacked profile-panel">
    <div class="panel-head"><div><h3>AI-DLC workflow profile</h3><span class="micro">From the AI-DLC {PROFILE_CATALOG.tag} workflow profiles guide. The default when none is named is classic.</span></div></div>
    <label>Profile<select bind:value={active.profile} on:change={mark}>{#each PROFILE_CATALOG.profiles as p}<option value={p.id}>{p.name} ({p.id}) — {p.statedCount}</option>{/each}</select></label>
    {#if profile}
      <p class="profile-best"><b>Best for:</b> {profile.bestFor}. <b>Depth:</b> {profile.depth}. <b>Test strategy:</b> {profile.testStrategy}.{#if profile.notes} {profile.notes}{/if}</p>
      <div class="stage-chips"><span>RUNS</span>{#each runs as id}<b class:conditional={profile.conditionalStages.includes(id)} title={STAGE_CATALOG.stages.find(s => s.id === id)?.name}>{id}</b>{/each}</div>
      <div class="stage-chips skip"><span>SKIPS</span>{#each skips as id}<b title={STAGE_CATALOG.stages.find(s => s.id === id)?.name}>{id}</b>{:else}<em>nothing</em>{/each}</div>
      {#if profile.conditionalStages.length}<p class="micro">Outlined stages are marked conditional for this profile in the guide.</p>{/if}
      <p class="micro">{PROFILE_CATALOG.countNote}</p>
    {/if}
  </div>
  <p class="micro">AI-DLC stages these fields feed: <button class="link" on:click={() => openStage('1.1')}>1.1 Intent Capture</button> · <button class="link" on:click={() => openStage('1.4')}>1.4 Scope Definition</button> · <button class="link" on:click={() => openStage('2.3')}>2.3 Requirements Analysis</button> · <button class="link" on:click={() => go('lifecycle')}>stage plan for this profile</button></p>
  <div class="bottom-forward"><button class="button primary" on:click={() => go('patterns')}>Next · Agentic designer →</button></div>
{/if}
