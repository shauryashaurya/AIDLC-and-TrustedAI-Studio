<script lang="ts">
  import type { Page, UseCase } from './lib/types';
  import { CONTROLS, STAGES, cloneCase, createCase, migrateCase, uid, validateImport } from './lib/model';
  import { REFERENCES, SAMPLES } from './lib/catalog';
  import { deleteSavedCase, listSavedCases, saveCase } from './lib/storage';
  import { validateCaseJson } from './lib/validate';
  import { back, go, notice, page, sampleRequest, syncFromLocation, toast, trail } from './lib/state';
  import HomePage from './pages/HomePage.svelte';
  import WorkshopPage from './pages/WorkshopPage.svelte';
  import DiscoverPage from './pages/DiscoverPage.svelte';
  import IdeatePage from './pages/IdeatePage.svelte';
  import DesignerPage from './pages/DesignerPage.svelte';
  import NfrPage from './pages/NfrPage.svelte';
  import TrustPage from './pages/TrustPage.svelte';
  import LifecyclePage from './pages/LifecyclePage.svelte';
  import ReportsPage from './pages/ReportsPage.svelte';
  import ReferencesPage from './components/ReferencesPage.svelte';
  import NextActions from './components/NextActions.svelte';
  import ExportTrace from './components/ExportTrace.svelte';

  const nav: { id: Page; name: string; symbol: string; subtitle: string }[] = [
    { id: 'home', name: 'Command center', symbol: '◈', subtitle: 'Start' },
    { id: 'ideate', name: 'Use-case framing', symbol: '◎', subtitle: 'Intent, scope, profile' },
    { id: 'patterns', name: 'Agentic designer', symbol: '◇', subtitle: 'Graph & threat model' },
    { id: 'nfr', name: 'NFR & cost lab', symbol: '▤', subtitle: 'Scale, cost, SLOs' },
    { id: 'trust', name: 'Trust & security', symbol: '⬡', subtitle: 'Controls & evidence' },
    { id: 'lifecycle', name: 'AI-DLC lifecycle', symbol: '▣', subtitle: 'Stages, Units, decisions' },
    { id: 'reports', name: 'Reports & exports', symbol: '⇧', subtitle: 'Reports, vision.md' },
    { id: 'references', name: 'References', symbol: '§', subtitle: 'Sources & versions' },
    { id: 'workshop', name: 'Workshop', symbol: '✦', subtitle: 'Modules & checkpoints' },
    { id: 'discover', name: 'AWS samples', symbol: '↗', subtitle: 'Fetched on request' }
  ];
  let active: UseCase | null = null;
  let saved: UseCase[] = [];
  let showSaved = false;
  let importInput: HTMLInputElement;

  function begin() { active = createCase(); go('ideate'); toast('Blank use case created. All fields start empty.'); }
  function loadSaved() { saved = listSavedCases(); showSaved = true; }
  function chooseSaved(c: UseCase) { active = migrateCase(c); showSaved = false; go('home'); toast('Saved use case opened.'); }
  function persist() { if (!active) return; try { saveCase(active); saved = listSavedCases(); toast('Saved in this browser. Export JSON for a portable copy.'); } catch { toast('Save failed: browser storage may be full or unavailable. Export JSON instead.'); } }
  function removeSaved(id: string) { if (!confirm('Delete this saved use case from this browser?')) return; deleteSavedCase(id); saved = listSavedCases(); }
  function duplicate() { if (!active) return; const now = new Date().toISOString(); active = { ...cloneCase(active), id: uid(), title: (active.title || 'Untitled') + ' — copy', createdAt: now, updatedAt: now }; toast('Unsaved copy created.'); }
  function useDraft(c: UseCase) { active = c; go('ideate'); toast('Draft created from the sample README. Review every field.'); }
  async function importFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0]; if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast('Import rejected: the file is larger than 4 MB.'); input.value = ''; return; }
    try {
      const content = JSON.parse(await file.text());
      const schema = validateCaseJson(content);
      if (!schema.ok) throw new Error(`Schema check failed: ${schema.errors.join('; ')}`);
      if (!validateImport(content)) throw new Error('Missing required collections.');
      active = migrateCase(content); go('home'); toast('Use case imported. Not saved until you select Save.');
    } catch (err) { toast(`Import failed: ${err instanceof Error ? err.message : String(err)}`); }
    input.value = '';
  }
  let sampleChoice = '';
  function loadSample(id: string) {
    const s = SAMPLES.find(x => x.id === id); if (!s) return;
    if (active && !confirm(`Replace the open use case with “${s.title}”? Unsaved changes are lost.`)) return;
    active = migrateCase(cloneCase(s.case)); toast(`${s.title} loaded. It is fictional demo data; Save it to keep your own copy.`);
  }
  $: if ($sampleRequest) { const id = $sampleRequest; sampleRequest.set(null); loadSample(id); }
  function closeOnEscape(e: KeyboardEvent) { if (e.key === 'Escape' && showSaved) showSaved = false; }
</script>

<svelte:window on:keydown={closeOnEscape} on:popstate={syncFromLocation}/>
<svelte:head><title>AI-DLC × Trusted AI Studio</title></svelte:head>
<div class="app-shell">
  <aside class="sidebar">
    <div class="brand"><div class="brand-mark">◇</div><div><div class="brand-title">AIDLC<span> × </span>TRUST</div><div class="brand-sub">WORKSHOP STUDIO</div></div></div>
    <div class="sidebar-section">PAGES</div>
    <nav class="navigation" aria-label="Studio pages">
      {#each nav as item}
        <button class:active={$page === item.id} class="nav-btn" aria-current={$page === item.id ? 'page' : undefined} on:click={() => go(item.id)}>
          <span class="nav-symbol">{item.symbol}</span><span class="nav-copy"><strong>{item.name}</strong><small>{item.subtitle}</small></span>
          {#if $page === item.id}<span class="nav-active-dot"></span>{/if}
        </button>
      {/each}
    </nav>
    <div class="sidebar-bottom"><div class="credit">AIDLC + Trusted AI Planner by SHAURYA AGARWAL © 2026</div></div>
  </aside>

  <div class="main-shell">
    <header class="topbar">
      <div class="breadcrumbs">{#if $trail.length}<button class="back-btn" title="Back to the previous page" on:click={back}>← {nav.find(n => n.id === $trail[$trail.length - 1])?.name}</button><span class="divider-dot">/</span>{:else}<span>STUDIO</span><span class="divider-dot">/</span>{/if}<strong>{nav.find(n => n.id === $page)?.name}</strong></div>
      <div class="top-actions">
        {#if active}<span class="active-case-tag" title={active.title || 'Untitled use case'}>◉ {active.title || 'Untitled use case'}</span>{/if}
        <select class="sample-select" aria-label="Load a sample use case" bind:value={sampleChoice} on:change={() => { const id = sampleChoice; sampleChoice = ''; loadSample(id); }}><option value="">Load sample…</option>{#each SAMPLES as s}<option value={s.id}>{s.title.replace(/^Sample:\s*/, '')}</option>{/each}</select>
        <button class="button ghost small" on:click={loadSaved}>Open saved</button>
        <button class="button secondary small" on:click={() => importInput.click()}>Import JSON</button>
        <input bind:this={importInput} class="hidden" type="file" accept="application/json,.json" aria-label="Import case JSON" on:change={importFile}/>
        <button class="button primary small" on:click={active ? persist : begin}>{active ? 'Save' : '+ New use case'}</button>
      </div>
    </header>

    <div class="main-scroll">
      <main class="workspace">
        {#if $notice}<div class="alert" role="status"><span>{$notice}</span><button class="icon-button" aria-label="Dismiss" on:click={() => notice.set('')}>×</button></div>{/if}
        {#if active && ['ideate', 'patterns', 'nfr', 'trust', 'lifecycle'].includes($page)}<ExportTrace page={$page}/>{/if}
        {#if $page === 'home'}<HomePage {active} onBegin={begin} onLoadSaved={loadSaved} onDuplicate={duplicate}/>
        {:else if $page === 'workshop'}<WorkshopPage/>
        {:else if $page === 'discover'}<DiscoverPage onUseDraft={useDraft}/>
        {:else if $page === 'ideate'}<IdeatePage bind:active onBegin={begin}/>
        {:else if $page === 'patterns'}<DesignerPage bind:active onBegin={begin}/>
        {:else if $page === 'nfr'}<NfrPage bind:active onBegin={begin}/>
        {:else if $page === 'trust'}<TrustPage bind:active onBegin={begin}/>
        {:else if $page === 'lifecycle'}<LifecyclePage bind:active/>
        {:else if $page === 'reports'}<ReportsPage {active}/>
        {:else if $page === 'references'}<ReferencesPage catalog={REFERENCES} controls={CONTROLS} stages={STAGES}/>
        {/if}
      </main>
      <footer class="footer credit-narrow"><span>AIDLC + Trusted AI Planner by SHAURYA AGARWAL © 2026</span></footer>
    </div>
  </div>
</div>
<NextActions {active} page={$page}/>
{#if showSaved}
  <div class="modal-overlay" role="presentation" on:click={() => showSaved = false}>
    <div class="saved-modal" role="dialog" aria-modal="true" aria-label="Saved use cases" tabindex="-1" on:click|stopPropagation on:keydown|stopPropagation>
      <div class="panel-head"><div><div class="eyebrow dark">SAVED IN THIS BROWSER</div><h2>Open a saved use case</h2></div><button class="icon-button" aria-label="Close" on:click={() => showSaved = false}>×</button></div>
      {#if !saved.length}<div class="subtle-empty">No saved use cases. Create one and select Save, or import a JSON export.</div>
      {:else}{#each saved as c}<div class="saved-row"><button on:click={() => chooseSaved(c)}><strong>{c.title || 'Untitled use case'}</strong><small>{c.domain || 'No domain'} · updated {new Date(c.updatedAt).toLocaleString()}</small></button><button class="text-danger" on:click={() => removeSaved(c.id)}>Delete</button></div>{/each}{/if}
      <p class="mini-note">Stored in this browser's localStorage, unencrypted. Export JSON for a portable copy.</p>
    </div>
  </div>
{/if}
