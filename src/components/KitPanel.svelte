<script lang="ts">
  import type { UseCase } from '../lib/types';
  import type { KitLanguage } from '../lib/kit';
  import { buildWorkspace, packageFileName } from '../lib/workspace';
  import { zip } from '../lib/zip';
  import { CONTROLS } from '../lib/model';
  import { FRAMEWORKS, GATES, PROFILE_CATALOG, STAGE_CATALOG, TEMPLATE_CATALOG } from '../lib/catalog';
  import { downloadBlob } from '../lib/storage';
  import patternCatalog from '../../data/pattern-catalog.json';
  import type { PatternCatalog } from '../lib/kit';
  import { EXPORT_MAP } from '../lib/exportmap';
  let showMap = false;
  import { openReference } from '../lib/state';

  export let active: UseCase;
  let lang: KitLanguage = 'typescript';
  let includeTemplates = true;
  let selected = 'PACKAGE.md';
  const manage11 = `NIST AI RMF MANAGE 1.1: “${FRAMEWORKS.rmf.subcategories.find(s => s.id === 'MANAGE 1.1')?.text ?? ''}”`;
  $: files = buildWorkspace(active, lang, { stages: STAGE_CATALOG, profiles: PROFILE_CATALOG, frameworks: FRAMEWORKS, controls: CONTROLS, patterns: patternCatalog as unknown as PatternCatalog, templates: TEMPLATE_CATALOG, manage11, gates: GATES.gates }, { includeTemplates });
  $: current = files.find(f => f.path === selected) ?? files[0];
  $: groups = [...files].sort((a, b) => a.path.localeCompare(b.path)).reduce((m, f) => { const dir = f.path.includes('/') ? f.path.slice(0, f.path.lastIndexOf('/')) : '(root)'; (m[dir] ??= []).push(f); return m; }, {} as Record<string, typeof files>);
  const mime = (p: string) => p.endsWith('.json') ? 'application/json' : p.endsWith('.md') ? 'text/markdown' : 'text/plain';
  function downloadOne() { if (current) downloadBlob(current.content, current.path.split('/').pop()!, mime(current.path)); }
  function downloadAll() { downloadBlob(zip(files), packageFileName(active, lang), 'application/zip'); }
</script>

<div class="panel stacked kit">
  <div class="panel-head">
    <div><h3>Workspace package</h3><span class="micro">One zip to unpack at the root of the repository: agent instructions (AGENTS.md, CLAUDE.md, skills, subagents, MCP), AI-DLC inputs and team templates for each gate, and the Trusted AI gate documents — all generated from this plan.</span></div>
    <div class="segment" role="group" aria-label="Package language"><button class:selected={lang === 'typescript'} on:click={() => lang = 'typescript'}>TypeScript</button><button class:selected={lang === 'python'} on:click={() => lang = 'python'}>Python</button></div>
  </div>
  <label class="tpl-toggle"><input type="checkbox" bind:checked={includeTemplates}/> Include AI-DLC team templates ({TEMPLATE_CATALOG.templates.length} artifacts) — AI-DLC uses their headings as each artifact's structure and checks them at the gate. <button class="link" on:click|preventDefault={() => openReference('aidlc-stage-protocol')}>Source</button></label>
  <button class="link map-toggle" on:click={() => showMap = !showMap}>{showMap ? 'Hide' : 'Show'} where each input from the studio goes in this package (also in docs/TRACEABILITY.md)</button>
  {#if showMap}<table class="map-table"><thead><tr><th>Page</th><th>Input</th><th>File</th><th>Section</th><th>Used for</th></tr></thead><tbody>{#each EXPORT_MAP as e}{#each e.targets as t, i}<tr>{#if i === 0}<td rowspan={e.targets.length}>{e.page}</td><td rowspan={e.targets.length}>{e.input}</td>{/if}<td><code>{t.file}</code></td><td>{t.heading ?? '—'}</td><td>{t.use}</td></tr>{/each}{/each}</tbody></table>{/if}
  <div class="kit-body">
    <div class="kit-files" aria-label="Package files">
      {#each Object.entries(groups) as [dir, list]}
        <div class="dir">{dir}/ <span>{list.length}</span></div>
        {#each list as f (f.path)}<button class:chosen={current?.path === f.path} on:click={() => selected = f.path}><code>{f.path.split('/').pop()}</code><small>{f.purpose}</small></button>{/each}
      {/each}
    </div>
    <div class="kit-preview">
      <div class="kit-actions"><code>{current?.path}</code><button class="button secondary small" on:click={downloadOne}>↓ This file</button><button class="button primary small" on:click={downloadAll}>↓ Package (.zip, {files.length} files)</button></div>
      <pre>{current?.content}</pre>
    </div>
  </div>
  <p class="micro">Formats: <button class="link" on:click={() => openReference('claude-code-memory')}>CLAUDE.md</button> · <button class="link" on:click={() => openReference('claude-code-skills')}>skills</button> · <button class="link" on:click={() => openReference('claude-code-subagents')}>subagents</button> · <button class="link" on:click={() => openReference('claude-code-mcp')}>.mcp.json</button> · <button class="link" on:click={() => openReference('agents-md')}>AGENTS.md</button> · <button class="link" on:click={() => openReference('mcp')}>MCP tools</button> · <button class="link" on:click={() => openReference(lang === 'typescript' ? 'mcp-ts-sdk' : 'mcp-py-sdk')}>{lang === 'typescript' ? 'TypeScript' : 'Python'} SDK</button> · <button class="link" on:click={() => openReference('aidlc-stage-rules')}>AI-DLC stage rules</button></p>
</div>

<style>
  .kit { margin: 18px 0; }
  .map-toggle { align-self: flex-start; font-size: 11.5px; }
  .map-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .map-table th { text-align: left; font-size: 9px; letter-spacing: .1em; color: #7d91a7; padding: 6px 8px; border-bottom: 1px solid #e1e8ef; text-transform: uppercase; }
  .map-table td { padding: 6px 8px; border-bottom: 1px solid #f0f3f6; color: #34526c; vertical-align: top; }
  .tpl-toggle { flex-direction: row; align-items: flex-start; gap: 8px; font-weight: 500; font-size: 11.5px; color: #4b647b; line-height: 1.5; }
  .tpl-toggle input { width: auto; min-height: 0; margin-top: 3px; }
  .kit-body { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 14px; }
  .kit-files { display: flex; flex-direction: column; gap: 1px; max-height: 560px; overflow: auto; }
  .dir { font-size: 10px; font-weight: 800; color: #6f8aa1; margin: 8px 0 2px; overflow-wrap: anywhere; }
  .dir span { color: #a3b4c3; font-weight: 600; }
  .kit-files button { width: 100%; text-align: left; background: transparent; border: 0; border-radius: 7px; padding: 6px 9px 6px 14px; }
  .kit-files button:hover, .kit-files button.chosen { background: #eef6fc; }
  .kit-files code { display: block; font-size: 11px; color: #25445f; overflow-wrap: anywhere; }
  .kit-files small { display: block; font-size: 10px; color: #8ea1b3; margin-top: 2px; }
  .kit-actions { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
  .kit-actions code { flex: 1; font-size: 11px; color: #4b647b; overflow-wrap: anywhere; }
  .kit-preview pre { background: #0d1c2e; color: #d1e3ed; padding: 16px; max-height: 510px; overflow: auto; border-radius: 8px; font-size: 11px; line-height: 1.65; white-space: pre-wrap; overflow-wrap: anywhere; margin: 0; }
  @media (max-width: 1100px) { .kit-body { grid-template-columns: 1fr; } }
</style>
