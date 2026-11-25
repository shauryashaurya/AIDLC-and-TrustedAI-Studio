<script lang="ts">
  import type { Page } from '../lib/types';
  import { EXPORT_MAP } from '../lib/exportmap';
  import { go } from '../lib/state';
  export let page: Page;
  let open = false;
  $: rows = EXPORT_MAP.filter(e => e.page === page);
  $: files = [...new Set(rows.flatMap(r => r.targets.map(t => t.file.replace('<slug>-', ''))))];
</script>

{#if rows.length}
  <div class="export-trace" class:open>
    <button class="et-head" aria-expanded={open} on:click={() => open = !open}><b>IN THE EXPORT</b><span>{files.join(' · ')}</span><em>{open ? 'hide' : 'where and why ▸'}</em></button>
    {#if open}
      <table>
        <thead><tr><th>Input on this page</th><th>File</th><th>Section</th><th>Used for</th></tr></thead>
        <tbody>{#each rows as r}{#each r.targets as t, i}<tr>{#if i === 0}<td rowspan={r.targets.length}>{r.input}</td>{/if}<td><code>{t.file}</code></td><td>{t.heading ?? '—'}</td><td>{t.use}</td></tr>{/each}{/each}</tbody>
      </table>
      <p>Download the package on <button class="link" on:click={() => go('reports')}>Reports & exports</button>. <code>&lt;slug&gt;</code> is the use-case title in lowercase with dashes.</p>
    {/if}
  </div>
{/if}

<style>
  .export-trace { border: 1px solid #dbe8f2; background: #f7fbfe; border-radius: 9px; margin: 0 0 16px; font-size: 11px; }
  .et-head { display: flex; gap: 10px; align-items: center; width: 100%; background: none; border: 0; padding: 7px 12px; text-align: left; color: #4b647b; }
  .et-head b { font-size: 9px; letter-spacing: .13em; color: #2d86bb; white-space: nowrap; }
  .et-head span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .et-head em { font-style: normal; color: #2f82b0; font-weight: 700; white-space: nowrap; }
  table { width: 100%; border-collapse: collapse; margin: 0 0 6px; }
  th { text-align: left; font-size: 9px; letter-spacing: .1em; color: #7d91a7; padding: 6px 12px; border-top: 1px solid #e3edf5; text-transform: uppercase; }
  td { padding: 6px 12px; border-top: 1px solid #eef3f7; color: #34526c; vertical-align: top; }
  code { font-size: 10.5px; }
  p { margin: 4px 12px 8px; color: #6b8399; }
</style>
