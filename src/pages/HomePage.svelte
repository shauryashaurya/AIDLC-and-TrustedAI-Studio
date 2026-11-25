<script lang="ts">
  import SamplePicker from '../components/SamplePicker.svelte';
  import type { UseCase } from '../lib/types';
  import { go } from '../lib/state';
  import { CONTROLS } from '../lib/model';
  import { assessReadiness } from '../lib/assurance';
  import { projectCosts, usd } from '../lib/financial';
  import { PROFILE_CATALOG, REFERENCES, STAGE_CATALOG, WORKSHOP } from '../lib/catalog';
  import catalog from '../../data/pattern-catalog.json';

  export let active: UseCase | null = null;
  export let onBegin: () => void = () => {};
  export let onLoadSaved: () => void = () => {};
  export let onDuplicate: () => void = () => {};

  $: readiness = active ? assessReadiness(active) : null;
  $: cost = active ? projectCosts(active.nfr) : null;
  $: stageProgress = active?.stages.length ? Math.round(100 * active.stages.filter(s => s.status === 'approved' || s.status === 'waived').length / active.stages.length) : 0;
  const stats = [
    { n: STAGE_CATALOG.stages.length, label: `AI-DLC ${STAGE_CATALOG.upstream.tag} stages` },
    { n: PROFILE_CATALOG.profiles.length, label: 'Workflow profiles' },
    { n: catalog.agentPatterns.length, label: 'Agentic patterns' },
    { n: catalog.ragTechniques.length, label: 'RAG techniques' },
    { n: CONTROLS.length, label: 'Trust control prompts' },
    { n: REFERENCES.references.length, label: 'References' }
  ];
</script>

<div class="hero-grid">
  <section class="hero">
    <div class="eyebrow"><span class="eyebrow-dot"></span>AI-DLC × TRUSTED AI STUDIO</div>
    <h1>Plan an agentic AI use case<br/><span>with AI-DLC and Trusted AI controls.</span></h1>
    <p class="hero-description">Frame the intent, choose an AI-DLC workflow profile, design the agent graph, model scale and cost, review threats and controls, then export a vision document for a real AI-DLC run. Built to run as a workshop, facilitated or self-paced.</p>
    <div class="hero-actions">
      <button class="button primary" on:click={() => go('workshop')}>Open the workshop</button>
      <button class="button outline-light" on:click={onBegin}>Create a blank use case</button>
    </div>
    <div class="hero-footnote">Nothing is loaded automatically. AWS samples are fetched from GitHub only when you ask.</div>
  </section>
  <aside class="hero-right">
    <div class="hero-right-label">WORKSHOP</div>
    <div class="large-figure">{WORKSHOP.modules.length}<span> / MODULES</span></div>
    {#each WORKSHOP.modules.slice(1, 5) as m, i}
      <div class="hero-practice"><b>0{i + 1}</b><div>{m.title}</div></div>
    {/each}
    <div class="hero-practice"><b>…</b><div>{WORKSHOP.modules.length - 5} more</div></div>
  </aside>
</div>

{#if active}
  <section class="section-block">
    <div class="section-heading"><div><div class="eyebrow dark">CURRENT USE CASE</div><h2>{active.title || 'Untitled use case'}</h2><p>{active.summary || 'No summary yet.'}</p></div><button class="button ghost" on:click={onDuplicate}>Duplicate</button></div>
    <div class="metric-grid four">
      <div class="metric-card"><small>STAGES APPROVED OR WAIVED</small><strong>{stageProgress}%</strong><span>{active.stages.length} stages in plan · profile {active.profile}</span></div>
      <div class="metric-card"><small>ESSENTIAL CONTROLS EVIDENCED</small><strong>{readiness?.score || 0}%</strong><span>{readiness?.gate || 'Not assessed'}</span></div>
      <div class="metric-card"><small>AGENT GRAPH</small><strong>{active.nodes.length}</strong><span>nodes · {active.edges.length} edges · {(active.threats ?? []).filter(t => t.status === 'open').length} open threats</span></div>
      <div class="metric-card"><small>MONTHLY ESTIMATE</small><strong>{usd(cost?.monthlyCost || 0)}</strong><span>From your inputs</span></div>
    </div>
  </section>
{:else}
  <section class="section-block">
    <div class="section-heading"><div><div class="eyebrow dark">START</div><h2>Start from a blank use case, a saved plan or an AWS sample.</h2></div></div>
    <div class="action-grid">
      <button class="action-card" on:click={onBegin}><span class="action-card-icon">＋</span><strong>Create a blank use case</strong><small>All fields start empty.</small><b>Create ↗</b></button>
      <button class="action-card" on:click={() => go('discover')}><span class="action-card-icon">↗</span><strong>Browse AWS samples</strong><small>Reads the aws-samples repository from GitHub when you click.</small><b>Browse ↗</b></button>
      <button class="action-card" on:click={onLoadSaved}><span class="action-card-icon">▣</span><strong>Open a saved plan</strong><small>Plans saved in this browser.</small><b>Load ↗</b></button>
    </div>
    <div class="home-samples"><SamplePicker/></div>
  </section>
{/if}

<section class="section-block">
  <div class="section-heading"><div><div class="eyebrow dark">CATALOGS</div></div><button class="button ghost" on:click={() => go('references')}>References §</button></div>
  <div class="reference-stats six">{#each stats as s}<div><b>{s.n}</b><span>{s.label}</span></div>{/each}</div>
</section>
