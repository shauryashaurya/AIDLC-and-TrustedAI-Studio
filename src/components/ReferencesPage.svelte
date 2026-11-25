<script lang="ts">
  import { tick } from 'svelte';
  import type { ReferenceCatalog } from '../lib/types';
  import { buildCitationIndex, filterReferences, isLocalReference, PAGE_LABELS, type CitingControl, type CitingStage } from '../lib/references';
  import { focus, go, openControl, openStage } from '../lib/state';
  import { WORKSHOP } from '../lib/catalog';
  const modulesFor = (id: string) => WORKSHOP.modules.filter(m => m.references.includes(id));

  export let catalog: ReferenceCatalog;
  export let controls: CitingControl[] = [];
  export let stages: CitingStage[] = [];

  let domain = 'all';
  let type = 'all';
  let query = '';
  let includeSuperseded = false;
  let highlighted = '';

  $: index = buildCitationIndex(catalog, controls, stages);
  $: visible = filterReferences(catalog.references, { domain, type, query, includeSuperseded });
  $: groups = catalog.domains.map(d => ({ ...d, refs: visible.filter(r => r.domain === d.id) })).filter(g => g.refs.length);
  $: unverified = catalog.references.filter(r => r.status === 'unverified').length;
  $: domainCounts = new Map(catalog.domains.map(d => [d.id, catalog.references.filter(r => r.domain === d.id && (includeSuperseded || r.status !== 'superseded')).length]));
  $: if ($focus.reference) reveal($focus.reference);

  async function reveal(id: string) {
    focus.update(f => ({ ...f, reference: undefined }));
    const target = catalog.references.find(r => r.id === id);
    if (!target) return;
    domain = 'all'; type = 'all'; query = '';
    if (target.status === 'superseded') includeSuperseded = true;
    highlighted = id;
    await tick();
    document.getElementById(`ref-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function reset() { domain = 'all'; type = 'all'; query = ''; includeSuperseded = false; }
</script>

<section class="section-header">
  <div>
    <div class="eyebrow dark">REFERENCES</div>
    <h1>References</h1>
    <p>Every standard, framework, specification, document and project file the studio uses. For each: what the source states, the version and date checked, where this app uses it, and anything the check could not confirm.</p>
  </div>
</section>

<div class="metric-grid four">
  <div class="metric-card"><small>REFERENCES</small><strong>{catalog.references.length}</strong><span>in {catalog.domains.length} groups</span></div>
  <div class="metric-card"><small>CHECKED ON</small><strong>{catalog.catalogVersion}</strong><span>against official pages</span></div>
  <div class="metric-card"><small>UNVERIFIED</small><strong>{unverified}</strong><span>the check could not confirm them</span></div>
  <div class="metric-card"><small>AI-DLC VERSION</small><strong>{catalog.references.find(r => r.id === 'aws')?.version ?? '—'}</strong><span>awslabs/aidlc-workflows</span></div>
</div>

<div class="callout">{catalog.provenance} This page makes no network requests; links open the sources in a new tab.</div>

<div class="panel filters">
  <div class="chips" role="group" aria-label="Filter by group">
    <button class="chip" class:on={domain === 'all'} on:click={() => domain = 'all'}>All</button>
    {#each catalog.domains as d}{#if domainCounts.get(d.id)}<button class="chip" class:on={domain === d.id} on:click={() => domain = d.id}>{d.label} <span>{domainCounts.get(d.id)}</span></button>{/if}{/each}
  </div>
  <div class="filter-row">
    <input class="search" type="search" placeholder="Search title, version or item ID (e.g. ASI01, LLM03)" bind:value={query} aria-label="Search references"/>
    <select bind:value={type} aria-label="Filter by type"><option value="all">All types</option>{#each catalog.types as t}<option value={t}>{t}</option>{/each}</select>
    <label class="check"><input type="checkbox" bind:checked={includeSuperseded}/> Show superseded</label>
  </div>
</div>

{#if !groups.length}<div class="empty-panel"><h3>No references match</h3><button class="button secondary" on:click={reset}>Clear filters</button></div>{/if}

{#each groups as group (group.id)}
  <section class="domain">
    <div class="domain-head"><h2>{group.label}</h2></div>
    <div class="ref-grid">
      {#each group.refs as ref (ref.id)}
        {@const cites = index.get(ref.id)}
        <article id="ref-{ref.id}" class="ref-card" class:highlight={highlighted === ref.id} class:muted={ref.status === 'superseded'}>
          <header><span class="badge">{ref.type}</span>{#if ref.status !== 'current'}<span class="status st-{ref.status}">{ref.status}</span>{/if}<code>{ref.id}</code></header>
          <h3>{#if isLocalReference(ref)}{ref.title}{:else}<a href={ref.url} target="_blank" rel="noreferrer noopener">{ref.title} <span aria-hidden="true">↗</span></a>{/if}</h3>
          <div class="publisher">{ref.publisher}</div>
          <dl class="facts">
            <div><dt>Version</dt><dd>{ref.version ?? 'not stated'}</dd></div>
            <div><dt>Published</dt><dd>{ref.publishedDate ?? 'not stated'}</dd></div>
            <div><dt>Checked</dt><dd class:warn={!ref.verifiedOn}>{ref.verifiedOn ?? 'not verified'}</dd></div>
            <div><dt>Access</dt><dd>{ref.access}{ref.license ? ` · ${ref.license}` : ''}</dd></div>
          </dl>
          <p><b>Source states:</b> {ref.summary}</p>
          <p><b>Used in this app:</b> {ref.usedIn}</p>
          {#if ref.verificationNotes}<p class="caveat"><b>Verification notes:</b> {ref.verificationNotes}</p>{/if}
          {#if isLocalReference(ref)}<div class="local">Project file: <code>{ref.url}</code></div>{/if}
          {#if ref.pinnedUrl}<a class="pinned" href={ref.pinnedUrl} target="_blank" rel="noreferrer noopener">Pinned version ↗</a>{/if}
          {#if cites && (cites.controls.length || cites.stages.length || cites.pages.length || modulesFor(ref.id).length)}
            <div class="cited"><span class="cited-label">CITED BY</span>
              {#each cites.controls as c}<button class="cite ctrl" title={c.name} on:click={() => openControl(c.id)}>{c.id}</button>{/each}
              {#each cites.stages as s}<button class="cite stage" title="{s.phase}: {s.name}" on:click={() => openStage(s.id)}>Stage {s.id}</button>{/each}
              {#each cites.pages as p}<button class="cite page" on:click={() => go(p)}>{PAGE_LABELS[p]}</button>{/each}
              {#each modulesFor(ref.id) as m}<button class="cite page" title={m.title} on:click={() => go('workshop')}>Workshop {m.id.toUpperCase()}</button>{/each}
            </div>
          {/if}
        </article>
      {/each}
    </div>
  </section>
{/each}

<style>
  .filters { display: flex; flex-direction: column; gap: 14px; margin-bottom: 8px; }
  .chips { display: flex; flex-wrap: wrap; gap: 7px; }
  .chip { border: 1px solid #d8e5ef; background: #fff; color: #49677f; border-radius: 30px; padding: 7px 12px; font-size: 11px; font-weight: 700; }
  .chip span { color: #94a8ba; margin-left: 3px; }
  .chip.on { background: #1874ce; border-color: #1874ce; color: #fff; }
  .chip.on span { color: #cfe5fa; }
  .filter-row { display: flex; gap: 10px; align-items: center; }
  .filter-row .search { flex: 2; }
  .filter-row select { flex: 1; }
  .check { flex-direction: row; align-items: center; gap: 7px; white-space: nowrap; }
  .check input { width: auto; min-height: 0; }
  .domain { margin-top: 30px; }
  .domain-head h2 { font: 800 19px Inter, system-ui; letter-spacing: -.03em; color: #172d48; margin: 0 0 13px; }
  .ref-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 14px; }
  .ref-card { background: #fff; border: 1px solid #dfe7ef; border-radius: 12px; padding: 18px 20px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 4px 11px #1b3d6107; transition: box-shadow .3s, border-color .3s; }
  .ref-card.highlight { border-color: #2a8ad0; box-shadow: 0 0 0 3px #2a8ad033; }
  .ref-card.muted { opacity: .72; }
  .ref-card header { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; }
  .ref-card header code { margin-left: auto; font-size: 10px; color: #8aa0b3; }
  .ref-card h3 { margin: 4px 0 0; font: 800 14px Inter, system-ui; color: #1d3a55; line-height: 1.4; }
  .ref-card h3 a { color: inherit; text-decoration: none; }
  .ref-card h3 a:hover { color: #1874ce; text-decoration: underline; }
  .publisher { font-size: 11px; color: #7d91a5; }
  .facts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 4px 0; background: #f6f9fc; border-radius: 8px; padding: 9px 11px; }
  .facts div { min-width: 0; }
  .facts dt { font-size: 9px; letter-spacing: .1em; font-weight: 800; color: #8fa3b5; text-transform: uppercase; }
  .facts dd { margin: 3px 0 0; font-size: 11px; color: #2f4d68; font-weight: 700; overflow-wrap: anywhere; }
  .facts dd.warn { color: #b0633c; }
  .ref-card p { margin: 0; font-size: 11.5px; line-height: 1.6; color: #546a80; }
  .ref-card p b { color: #34526c; }
  .ref-card p.caveat { color: #866a45; background: #fffaf1; border-left: 3px solid #eccb94; padding: 7px 10px; border-radius: 0 6px 6px 0; }
  .local { font-size: 11px; color: #6b8094; }
  .pinned { font-size: 11px; font-weight: 800; color: #2474a4; text-decoration: none; }
  .cited { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; border-top: 1px solid #edf2f6; padding-top: 10px; margin-top: auto; }
  .cited-label { font-size: 9px; letter-spacing: .13em; font-weight: 800; color: #93a6b8; margin-right: 3px; }
  .cite { border: 1px solid #dbe8f2; border-radius: 5px; padding: 4px 7px; font-size: 10px; font-weight: 700; background: #eef6fc; color: #2d6f9e; }
  .cite:hover { background: #dcecf8; }
  .cite.ctrl { background: #fff4ec; border-color: #f2dcc9; color: #9f6a43; }
  .cite.page { background: #f3f5f8; border-color: #e1e6ec; color: #5c7186; }
  .badge { font-size: 9.5px; font-weight: 800; border-radius: 4px; padding: 4px 7px; background: #eef2f6; color: #50677d; white-space: nowrap; }
  .status { font-size: 9.5px; font-weight: 800; border-radius: 4px; padding: 4px 7px; text-transform: uppercase; letter-spacing: .06em; }
  .st-unverified { background: #fff0e0; color: #b0601d; }
  .st-superseded { background: #eceff2; color: #6b7783; }
  @media (max-width: 800px) {
    .filter-row { flex-direction: column; align-items: stretch; }
    .ref-grid { grid-template-columns: 1fr; }
    .facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
</style>
