<script lang="ts">
  import { SAMPLES, SAMPLE_NOTE } from '../lib/catalog';
  import { requestSample } from '../lib/state';
</script>

<div class="sample-picker">
  <span>OR LOAD A SAMPLE</span>
  {#each SAMPLES as s}<button class="button ghost small" title={s.summary} on:click={() => requestSample(s.id)}>{s.title.replace(/^Sample:\s*/, '')} <em>{s.profile} · {s.riskTier} risk</em></button>{/each}
  <small>{SAMPLE_NOTE}</small>
</div>

<style>
  .sample-picker { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; margin-top: 14px; max-width: 640px; }
  .sample-picker > span { font-size: 9px; letter-spacing: .13em; font-weight: 800; color: #93a6b8; width: 100%; }
  em { font-style: normal; font-weight: 500; color: #8aa0b3; margin-left: 4px; }
  small { width: 100%; font-size: 10px; color: #98a9b9; line-height: 1.5; }
</style>
