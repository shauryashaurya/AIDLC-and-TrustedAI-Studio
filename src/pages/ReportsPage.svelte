<script lang="ts">
  import type { UseCase } from '../lib/types';
  import { controlsCsv, referenceReport, reportHtml, useCaseReport } from '../lib/reports';
  import { aidlcCommands, technicalEnvironmentMarkdown, visionMarkdown } from '../lib/vision';
  import { downloadBlob, filenameSlug } from '../lib/storage';
  import { openReference, toast } from '../lib/state';
  import KitPanel from '../components/KitPanel.svelte';

  export let active: UseCase | null = null;
  let mode: 'case' | 'reference' | 'vision' | 'techenv' = active ? 'case' : 'reference';
  let text = '';

  $: if (!active && mode !== 'reference') mode = 'reference';
  $: text = mode === 'reference' ? referenceReport() : !active ? '' : mode === 'case' ? useCaseReport(active) : mode === 'vision' ? visionMarkdown(active) : technicalEnvironmentMarkdown(active);

  function download(kind: 'md' | 'html' | 'json' | 'csv' | 'vision' | 'techenv') {
    const slug = filenameSlug(active?.title || 'aidlc-trust-reference');
    if ((kind === 'json' || kind === 'csv' || kind === 'vision' || kind === 'techenv') && !active) { toast('Open a use case first.'); return; }
    if (kind === 'json') return downloadBlob(JSON.stringify(active, null, 2), `${slug}.json`, 'application/json');
    if (kind === 'csv') return downloadBlob(controlsCsv(active!), `${slug}-controls.csv`, 'text/csv');
    if (kind === 'vision') return downloadBlob(visionMarkdown(active!), 'vision.md', 'text/markdown');
    if (kind === 'techenv') return downloadBlob(technicalEnvironmentMarkdown(active!), 'technical-environment.md', 'text/markdown');
    const md = mode === 'case' && active ? useCaseReport(active) : referenceReport();
    if (kind === 'md') downloadBlob(md, `${slug}-report.md`, 'text/markdown');
    else downloadBlob(reportHtml(md), `${slug}-print.html`, 'text/html');
  }
  async function copy(cmd: string) { try { await navigator.clipboard.writeText(cmd); toast('Command copied.'); } catch { toast('Copy failed; select the text instead.'); } }
</script>

<section class="section-header">
  <div><div class="eyebrow dark">EXPORTS</div><h1>Reports & exports</h1><p>The case report (Markdown or print-friendly HTML), the case JSON, the control register CSV, the reference catalog report, two inputs for a real AI-DLC run (vision.md and technical-environment.md), and an implementation kit in TypeScript or Python.</p></div>
</section>

<div class="panel report-controls">
  <label>Preview<select bind:value={mode}><option value="case" disabled={!active}>Case report</option><option value="reference">Reference catalog report</option><option value="vision" disabled={!active}>vision.md</option><option value="techenv" disabled={!active}>technical-environment.md</option></select></label>
  <div class="report-buttons">
    <button class="button secondary small" on:click={() => download('md')}>↓ Report (Markdown)</button>
    <button class="button secondary small" on:click={() => download('html')}>↓ Report (HTML)</button>
    <button class="button secondary small" disabled={!active} on:click={() => download('json')}>↓ Case JSON</button>
    <button class="button secondary small" disabled={!active} on:click={() => download('csv')}>↓ Controls CSV</button>
    <button class="button secondary small" disabled={!active} on:click={() => download('vision')}>↓ vision.md</button>
    <button class="button secondary small" disabled={!active} on:click={() => download('techenv')}>↓ technical-environment.md</button>
  </div>
</div>

{#if active}
  <div class="panel stacked handoff">
    <div class="panel-head"><div><h3>Start a real AI-DLC run from these exports</h3><span class="micro">Command form from the AI-DLC facilitator guide (“/aidlc workshop Read ./vision.md and build what it describes”), with this case's profile</span></div><button class="button ghost small" on:click={() => openReference('aidlc-vision')}>Vision guide §</button></div>
    <ol class="handoff-steps">
      <li>Save <code>vision.md</code> in the project root.</li>
      <li>Save <code>technical-environment.md</code> as <code>aidlc/spaces/default/knowledge/aidlc-shared/technical-environment.md</code>.</li>
      <li>In your coding agent, run:</li>
    </ol>
    {#each aidlcCommands(active.profile) as cmd}<div class="cmd"><code>{cmd}</code><button class="button ghost small" on:click={() => copy(cmd.split('   ')[0])}>Copy</button></div>{/each}
  </div>
{/if}

{#if active}<KitPanel {active}/>{/if}

<div class="panel report-preview"><div class="panel-head"><h3>Preview</h3><span class="micro">{text.length.toLocaleString()} characters</span></div><pre>{text || 'Open a use case to preview its report.'}</pre></div>
