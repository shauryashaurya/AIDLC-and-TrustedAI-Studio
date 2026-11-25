<script lang="ts">
  import SamplePicker from '../components/SamplePicker.svelte';
  import type { UseCase } from '../lib/types';
  import { touch, go } from '../lib/state';
  import { integer, projectCosts, usd } from '../lib/financial';
  import { simulate, type SimulationResult } from '../lib/simulation';
  import { errorBudget, latencyCheck } from '../lib/slo';
  import { SAMPLES } from '../lib/catalog';
  import { openControl, openNode, openStage, toast } from '../lib/state';

  export let active: UseCase | null = null;
  export let onBegin: () => void = () => {};
  const mark = () => { if (active) active = touch(active); };

  let stressFactor = 1;
  let runs = 2000;
  let seed = 42;
  let sim: SimulationResult | null = null;
  let simStamp = '';

  $: cost = active ? projectCosts(active.nfr, stressFactor) : null;
  $: budget = active && cost ? errorBudget(active.nfr.availabilityPct, active.nfr.daysPerMonth, cost.monthlyRequests) : null;
  $: graphStamp = active ? JSON.stringify([active.nodes, active.edges]) : '';
  $: stale = !!sim && simStamp !== graphStamp;
  $: latency = sim && active ? latencyCheck(sim.latency.p95, active.nfr.p95TargetSeconds) : 'no-target';

  function runSimulation() {
    if (!active) return;
    sim = simulate(active.nodes, active.edges, { runs: Math.min(Math.max(runs, 100), 20000), seed });
    simStamp = graphStamp;
  }
  let sampleId = '';
  function applySample() {
    const s = SAMPLES.find(x => x.id === sampleId); sampleId = '';
    if (!active || !s) return;
    if (!confirm(`Replace this case's traffic, SLO and cost inputs with the example values from “${s.title}”?`)) return;
    active.nfr = { ...s.case.nfr }; mark(); toast('Example NFR and cost inputs applied. They are fictional values, not quotes.');
  }
  const n5 = (x: number) => `$${x.toFixed(5)}`;
</script>

<section class="section-header">
  <div><div class="eyebrow dark">AI-DLC CONSTRUCTION · 3.2 NFR REQUIREMENTS · 3.3 NFR DESIGN</div><h1>NFR & cost lab</h1><p>Traffic, availability, recovery and cost inputs; a monthly projection; a Monte Carlo simulation of the agent graph for cost and latency per request; and the error budget for the availability SLO. All prices are entered by you.</p></div>
  {#if active}<label class="sample-apply">Apply example inputs from a sample<select bind:value={sampleId} on:change={applySample}><option value="">Choose a sample…</option>{#each SAMPLES as smp}<option value={smp.id}>{smp.title}</option>{/each}</select></label>{/if}
</section>
{#if !active}
  <div class="empty-panel"><h3>No use case open</h3><p>Create or load a use case to enter inputs.</p><button class="button primary" on:click={onBegin}>New blank use case</button><SamplePicker/></div>
{:else}
  <div class="metric-grid four">
    <div class="metric-card"><small>MONTHLY REQUESTS</small><strong>{integer(cost?.monthlyRequests || 0)}</strong><span>requests/day × days × stress factor</span></div>
    <div class="metric-card"><small>PEAK</small><strong>{cost?.peakRps.toFixed(2) || '0'} <em>RPS</em></strong><span>In-flight estimate ~{integer(cost?.suggestedConcurrency || 0)}</span></div>
    <div class="metric-card"><small>MONTHLY COST (AVERAGE INPUTS)</small><strong>{usd(cost?.monthlyCost || 0)}</strong><span>{usd(cost?.costPer1000 || 0)} per 1,000 requests</span></div>
    <div class="metric-card"><small>ERROR BUDGET</small><strong>{budget && active.nfr.availabilityPct ? `${budget.allowedDowntimeMinutes.toFixed(1)} min` : '—'}</strong><span>{budget && active.nfr.availabilityPct ? `or ${integer(budget.allowedFailedRequests)} failed requests / ${active.nfr.daysPerMonth} days` : 'Set an availability SLO'}</span></div>
  </div>
  <div class="panel scenario-bar"><div><strong>Stress factor</strong><small>Multiplies traffic in the projection without changing saved inputs.</small></div><input aria-label="Stress multiplier" type="range" min="0.5" max="10" step="0.5" bind:value={stressFactor}/><span class="scenario-value">{stressFactor.toFixed(1)}×</span></div>

  <div class="form-grid">
    <div class="panel stacked"><div class="panel-head"><h3>Traffic & capacity</h3></div>
      <div class="input-grid"><label>Requests per day<input type="number" min="0" bind:value={active.nfr.requestsPerDay} on:change={mark}/></label><label>Days in window / month<input type="number" min="1" max="31" bind:value={active.nfr.daysPerMonth} on:change={mark}/></label><label>Peak traffic multiplier<input type="number" min="1" step="0.5" bind:value={active.nfr.peakFactor} on:change={mark}/></label><label>Average end-to-end latency (s)<input type="number" min="0" step="0.1" bind:value={active.nfr.avgLatencySeconds} on:change={mark}/></label><label>P95 latency target (s)<input type="number" min="0" step="0.1" bind:value={active.nfr.p95TargetSeconds} on:change={mark}/></label><label>Concurrency headroom multiplier<input type="number" min="1" step="0.1" bind:value={active.nfr.concurrencyHeadroom} on:change={mark}/></label></div>
      <div class="mini-note">Peak RPS = requests/day × peak multiplier ÷ 86,400. In-flight estimate = peak RPS × average latency × headroom (Little's law).</div>
      <div class="panel-head"><h3>Availability & recovery</h3></div>
      <div class="input-grid"><label>Availability SLO (%)<input type="number" min="0" max="100" step="0.01" bind:value={active.nfr.availabilityPct} on:change={mark}/></label><label>RTO (minutes)<input type="number" min="0" bind:value={active.nfr.rtoMinutes} on:change={mark}/></label><label>RPO (minutes)<input type="number" min="0" bind:value={active.nfr.rpoMinutes} on:change={mark}/></label><label>Primary region<input bind:value={active.nfr.region} on:change={mark}/></label><label>Residency requirement<input bind:value={active.nfr.residency} on:change={mark}/></label><label>Network isolation<input bind:value={active.nfr.networkBoundary} on:change={mark}/></label><label>Encryption requirement<input bind:value={active.nfr.encryption} on:change={mark}/></label><label>Sensitive data<input bind:value={active.nfr.sensitiveData} on:change={mark}/></label><label>Data retention<input bind:value={active.nfr.dataRetention} on:change={mark} placeholder="How long prompts, outputs, logs and memory are kept"/></label></div>
      <p class="micro">Related: <button class="link" on:click={() => openControl('REL-04')}>REL-04 SLOs</button> · <button class="link" on:click={() => openControl('SEC-04')}>SEC-04 residency</button> · <button class="link" on:click={() => openControl('OPS-04')}>OPS-04 cost</button> · AI-DLC <button class="link" on:click={() => openStage('3.2')}>3.2 NFR Requirements</button> · <button class="link" on:click={() => openStage('4.4')}>4.4 Observability Setup</button></p>
    </div>
    <div class="panel stacked"><div class="panel-head"><h3>Average-based cost inputs</h3><span class="micro">USD · your rates</span></div>
      <div class="input-grid"><label>Model calls per request<input type="number" min="0" bind:value={active.nfr.agentCallsPerRequest} on:change={mark}/></label><label>Input tokens per call<input type="number" min="0" bind:value={active.nfr.inputTokensPerCall} on:change={mark}/></label><label>Output tokens per call<input type="number" min="0" bind:value={active.nfr.outputTokensPerCall} on:change={mark}/></label><label>Retries / overhead (%)<input type="number" min="0" bind:value={active.nfr.retryPct} on:change={mark}/></label><label>Input USD / 1M tokens<input type="number" min="0" step="0.01" bind:value={active.nfr.modelInputPricePerMillion} on:change={mark}/></label><label>Output USD / 1M tokens<input type="number" min="0" step="0.01" bind:value={active.nfr.modelOutputPricePerMillion} on:change={mark}/></label><label>Retrieval USD / request<input type="number" min="0" step="0.0001" bind:value={active.nfr.retrievalCostPerRequest} on:change={mark}/></label><label>Fixed platform USD / month<input type="number" min="0" bind:value={active.nfr.fixedInfrastructurePerMonth} on:change={mark}/></label><label>Storage GB<input type="number" min="0" bind:value={active.nfr.storageGb} on:change={mark}/></label><label>Storage USD / GB-month<input type="number" min="0" step="0.001" bind:value={active.nfr.storagePriceGbMonth} on:change={mark}/></label><label>Human review rate (%)<input type="number" min="0" max="100" bind:value={active.nfr.humanReviewPct} on:change={mark}/></label><label>Minutes per review<input type="number" min="0" step="0.5" bind:value={active.nfr.humanReviewMinutes} on:change={mark}/></label><label>Reviewer USD / hour<input type="number" min="0" bind:value={active.nfr.reviewerHourlyCost} on:change={mark}/></label><label>Business value / request (USD)<input type="number" min="0" step="0.01" bind:value={active.nfr.unitValueUsd} on:change={mark}/></label></div>
      <div class="cost-breakdown"><h3>Monthly cost by component</h3>{#each [{ name: 'Model inference', val: cost?.modelCost || 0 }, { name: 'Retrieval', val: cost?.retrievalCost || 0 }, { name: 'Platform', val: cost?.infrastructureCost || 0 }, { name: 'Storage', val: cost?.storageCost || 0 }, { name: 'Human review', val: cost?.humanReviewCost || 0 }] as c}<div class="cost-row"><span>{c.name}</span><div class="track"><span style:width={`${cost?.monthlyCost ? c.val / cost.monthlyCost * 100 : 0}%`}></span></div><b>{usd(c.val)}</b></div>{/each}</div>
      <div class="cost-foot"><span>Gross value: <strong>{usd(cost?.monthlyValue || 0)}</strong></span><span>Net of cost: <strong>{usd(cost?.netValue || 0)}</strong></span></div>
      {#if cost?.assumptionWarnings.length}<div class="warning-panel">{#each cost.assumptionWarnings as w}<p>• {w}</p>{/each}</div>{/if}
    </div>
  </div>

  <div class="panel stacked sim-panel">
    <div class="panel-head"><div><h3>Graph simulation</h3><span class="micro">Walks the agent graph per request using each node's tokens, prices, cached-input share, latency, max visits and spend cap, and each edge's probability. Studio calculation; not a benchmark.</span></div>
      <div class="sim-controls"><label>Runs<input type="number" min="100" max="20000" step="100" bind:value={runs}/></label><label>Seed<input type="number" bind:value={seed}/></label><button class="button primary small" disabled={!active.nodes.length} on:click={runSimulation}>Run simulation</button></div></div>
    {#if !active.nodes.length}<p class="subtle-empty">Add nodes on the <button class="link" on:click={() => go('patterns')}>Agentic designer</button> first.</p>
    {:else if !sim}<p class="subtle-empty">Enter cost and latency inputs on each node, then run the simulation.</p>
    {:else}
      {#if stale}<div class="callout">The graph changed since this run. Run the simulation again.</div>{/if}
      <table class="sim-table"><thead><tr><th>Per request</th><th>Mean</th><th>P50</th><th>P95</th><th>Max</th></tr></thead><tbody>
        <tr><td>Cost (USD)</td><td>{n5(sim.cost.mean)}</td><td>{n5(sim.cost.p50)}</td><td>{n5(sim.cost.p95)}</td><td>{n5(sim.cost.max)}</td></tr>
        <tr><td>Latency (s)</td><td>{sim.latency.mean.toFixed(2)}</td><td>{sim.latency.p50.toFixed(2)}</td><td>{sim.latency.p95.toFixed(2)}</td><td>{sim.latency.max.toFixed(2)}</td></tr>
      </tbody></table>
      <div class="metric-grid four">
        <div class="metric-card"><small>MONTHLY GRAPH COST AT MEAN</small><strong>{usd(sim.cost.mean * (cost?.monthlyRequests || 0))}</strong><span>mean × monthly requests</span></div>
        <div class="metric-card"><small>P95 LATENCY VS TARGET</small><strong class:status-text={latency === 'exceeds'}>{latency === 'no-target' ? 'No target' : latency === 'within' ? 'Within' : 'Exceeds'}</strong><span>{sim.latency.p95.toFixed(2)}s vs {active.nfr.p95TargetSeconds || '—'}s</span></div>
        <div class="metric-card"><small>RUNS HITTING A VISIT CAP</small><strong>{(sim.stepCapHitRate * 100).toFixed(1)}%</strong><span>node max visits reached</span></div>
        <div class="metric-card"><small>RUNS OVER A SPEND CAP</small><strong>{(sim.spendCapHitRate * 100).toFixed(1)}%</strong><span>node spend cap exceeded</span></div>
      </div>
      <table class="sim-table"><thead><tr><th>Node</th><th>Mean visits</th><th>Mean cost (USD)</th><th>Share of cost</th><th>Visit cap hit</th><th>Spend cap hit</th></tr></thead><tbody>
        {#each [...sim.nodes].sort((a, b) => b.meanCost - a.meanCost) as n}<tr><td><button class="link" title="Open this node in the Agentic designer" on:click={() => openNode(n.id)}>{n.name}</button></td><td>{n.meanVisits.toFixed(2)}</td><td>{n5(n.meanCost)}</td><td>{sim.cost.mean ? (n.meanCost / sim.cost.mean * 100).toFixed(1) : '0'}%</td><td>{(n.capHitRate * 100).toFixed(1)}%</td><td>{(n.spendHitRate * 100).toFixed(1)}%</td></tr>{/each}
      </tbody></table>
      {#each sim.warnings as w}<p class="wave-warning">⚠ {w}</p>{/each}
      <p class="mini-note">{sim.runs} runs, seed {seed}. Requests start at nodes with no incoming edge ({sim.entryIds.length}). Routing “one” follows one outgoing edge chosen by probability (remaining probability stops); routing “all” follows each edge whose draw succeeds, and latency takes the slowest branch.</p>
    {/if}
  </div>
{/if}
