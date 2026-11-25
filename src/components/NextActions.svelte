<script lang="ts">
  import type { Page, UseCase } from '../lib/types';
  import { FRAMEWORKS, REF_BY_ID, STAGE_CATALOG } from '../lib/catalog';
  import { CONTROLS } from '../lib/model';
  import { nextActions, pageSignificance, type GuidanceContext } from '../lib/guidance';
  import { go, openReference, openStage } from '../lib/state';

  export let active: UseCase | null = null;
  export let page: Page = 'home';

  const ctx: GuidanceContext = { stages: STAGE_CATALOG, frameworks: FRAMEWORKS, criticalControlIds: CONTROLS.filter(c => c.critical).map(c => c.id) };
  let open = false;
  $: steps = nextActions(active, ctx);
  $: here = pageSignificance(page, ctx);
  $: next = steps[0];
</script>

<div class="next-actions" class:open>
  {#if open}
    <div class="na-panel" role="region" aria-label="Next actions">
      <div class="na-head"><span>THIS PAGE</span><button class="icon-button" aria-label="Close next actions" on:click={() => open = false}>×</button></div>
      <p class="na-here">{here}</p>
      <div class="na-head"><span>NEXT ({steps.length})</span></div>
      <ol>
        {#each steps.slice(0, 4) as s (s.id)}
          <li>
            <button class="na-go" on:click={() => { go(s.page); if (s.stage && s.page === 'lifecycle') openStage(s.stage); }}>{s.action} →</button>
            <small>{s.why}</small>
            <button class="na-src" on:click={() => openReference(s.source)}>{REF_BY_ID.get(s.source)?.title ?? s.source}</button>
          </li>
        {/each}
      </ol>
    </div>
  {/if}
  <button class="na-chip" aria-expanded={open} title={next?.why} on:click={() => open = !open}><b>Next</b><span>{next?.action}</span></button>
</div>

<style>
  .next-actions { position: fixed; right: 18px; bottom: 16px; z-index: 40; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; max-width: min(420px, calc(100vw - 36px)); }
  .na-chip { display: flex; gap: 8px; align-items: center; max-width: 100%; border: 1px solid #d3e1ec; background: #ffffffe8; backdrop-filter: blur(4px); color: #46637c; border-radius: 20px; padding: 6px 12px; font-size: 11px; box-shadow: 0 3px 10px #1b3d6114; opacity: .82; transition: opacity .15s; }
  .na-chip:hover, .open .na-chip { opacity: 1; }
  .na-chip b { font-size: 9px; letter-spacing: .12em; text-transform: uppercase; color: #2d86bb; }
  .na-chip span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .na-panel { background: #fff; border: 1px solid #dbe6ef; border-radius: 12px; padding: 12px 14px; box-shadow: 0 12px 30px #1b3d6126; width: 100%; max-height: 60vh; overflow: auto; }
  .na-head { display: flex; justify-content: space-between; align-items: center; font-size: 9px; letter-spacing: .13em; font-weight: 800; color: #93a6b8; margin-top: 4px; }
  .na-head .icon-button { font-size: 18px; }
  .na-here { font-size: 11.5px; line-height: 1.55; color: #4b647b; margin: 4px 0 10px; }
  ol { margin: 4px 0 0; padding-left: 18px; display: flex; flex-direction: column; gap: 9px; }
  li { font-size: 11px; color: #6b8094; }
  .na-go { background: none; border: 0; padding: 0; text-align: left; font-weight: 800; font-size: 12px; color: #1f6fa8; }
  .na-go:hover { text-decoration: underline; }
  small { display: block; line-height: 1.5; margin-top: 3px; }
  .na-src { background: none; border: 0; padding: 0; font-size: 10px; color: #8aa0b3; text-decoration: underline; text-underline-offset: 2px; }
  @media print { .next-actions { display: none; } }
</style>
