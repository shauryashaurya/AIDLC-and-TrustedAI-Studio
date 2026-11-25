<script lang="ts">
  import type { UseCase } from '../lib/types';
  import { createCase } from '../lib/model';
  import { fetchRemoteSamples, loadRemoteSample, type RemoteSample } from '../lib/github';

  /** Called with a new draft case built from the selected README. */
  export let onUseDraft: (c: UseCase) => void = () => {};

  let remote: RemoteSample[] = [];
  let remoteError = '';
  let remoteBusy = false;
  let readmeBusy = false;
  let remoteSelected: RemoteSample | null = null;
  let remoteReadme = '';
  let remoteReadmeUrl = '';
  let remoteSha = '';

  async function browse() {
    remoteBusy = true; remoteError = ''; remote = []; remoteSelected = null; remoteReadme = '';
    try { remote = await fetchRemoteSamples(); } catch (err) { remoteError = err instanceof Error ? err.message : String(err); }
    finally { remoteBusy = false; }
  }
  async function inspect(s: RemoteSample) {
    remoteSelected = s; remoteReadme = ''; remoteError = ''; readmeBusy = true;
    try { const r = await loadRemoteSample(s); remoteReadme = r.body; remoteReadmeUrl = r.url; remoteSha = r.sha; }
    catch (err) { remoteError = err instanceof Error ? err.message : String(err); } finally { readmeBusy = false; }
  }
  function useSample() {
    if (!remoteSelected || !remoteReadme) return;
    const c = createCase();
    c.title = remoteSelected.name.replace(/\b\w/g, x => x.toUpperCase()) + ' — AWS sample adaptation';
    c.summary = remoteReadme.split('\n').filter(x => x.trim() && !x.startsWith('#')).slice(0, 3).join(' ').slice(0, 850);
    c.sourceUrl = remoteReadmeUrl || remoteSelected.htmlUrl; c.sourceDate = new Date().toISOString();
    c.assumptions = `Imported as a draft from ${remoteSelected.repo} at commit ${remoteSha}. Nothing in this sample has been reviewed or validated in this studio.`;
    onUseDraft(c);
  }
</script>

<section class="section-header">
  <div><div class="eyebrow dark">AWS SAMPLES</div><h1>AWS AI-DLC samples on GitHub</h1><p>Lists the samples in aws-samples/sample-ai-for-software-engineering-on-aws. Select one to read its README and commit, and optionally start a draft use case from it.</p></div>
  <button class="button primary" disabled={remoteBusy} on:click={browse}>{remoteBusy ? 'Contacting GitHub…' : '↻ Fetch AWS samples live'}</button>
</section>
<div class="callout">Requests go from your browser to the public GitHub API only when you click, with no token and no cache. On 2026-11-25 the repository described itself as "early development".</div>
{#if remoteError}<div class="error-box">{remoteError}</div>{/if}
{#if remoteBusy}<div class="loading-panel">Requesting the sample directory from GitHub…</div>{/if}
{#if !remoteBusy && remote.length === 0}
  <div class="empty-panel"><span>↗</span><h3>No remote data requested</h3><p>Select “Fetch AWS samples live” to list the samples.</p><a href="https://github.com/aws-samples/sample-ai-for-software-engineering-on-aws/tree/main/samples" target="_blank" rel="noreferrer">Open the repository on GitHub ↗</a></div>
{/if}
{#if remote.length}
  <div class="split-grid remote-grid">
    <div class="panel"><div class="panel-head"><h3>Samples</h3><span class="micro">{remote.length} returned</span></div>
      {#each remote as sample (sample.id)}<button class:chosen={remoteSelected?.id === sample.id} class="sample-item" on:click={() => inspect(sample)}><div><strong>{sample.name}</strong><small>{sample.description}</small></div><span>↗</span></button>{/each}
    </div>
    <div class="panel sample-preview"><div class="panel-head"><h3>{remoteSelected?.name || 'Choose a sample'}</h3>{#if remoteReadme}<button class="button primary small" on:click={useSample}>Use as draft ↗</button>{/if}</div>
      {#if readmeBusy}<p>Loading README…</p>
      {:else if remoteReadme}<div class="source-meta"><a href={remoteReadmeUrl} target="_blank" rel="noreferrer">Open source file ↗</a><small>Commit {remoteSha.slice(0, 12)} · retrieved now</small></div><pre class="readme">{remoteReadme.slice(0, 18000)}{remoteReadme.length > 18000 ? '\n\n[Preview truncated — open the full file]' : ''}</pre>
      {:else}<div class="subtle-empty">The README and commit are loaded when you select a sample.</div>{/if}
    </div>
  </div>
{/if}
