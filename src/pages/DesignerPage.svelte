<script lang="ts">
  import SamplePicker from '../components/SamplePicker.svelte';
  import { onMount } from 'svelte';
  import PatternCanvas from '../components/PatternCanvas.svelte';
  import type { AgentNode, UseCase } from '../lib/types';
  import { makeEdge, makeNode, makeScenario, uid } from '../lib/model';
  import { graphWarnings } from '../lib/assurance';
  import { FRAMEWORKS, THREAT_CANDIDATES } from '../lib/catalog';
  import { frameworkIndex, syncThreats, threatSummary } from '../lib/frameworks';
  import { visitCost } from '../lib/simulation';
  import { downloadBlob, filenameSlug } from '../lib/storage';
  import { focus, go, openControl, openReference, toast, touch } from '../lib/state';
  import { CONTROLS } from '../lib/model';
  import { allFrameworkIds } from '../lib/frameworks';
  import catalog from '../../data/pattern-catalog.json';

  export let active: UseCase | null = null;
  export let onBegin: () => void = () => {};
  const mark = () => { if (active) active = touch(active); };
  const FW = frameworkIndex(FRAMEWORKS);
  const KINDS: AgentNode['kind'][] = ['agent', 'orchestrator', 'tool', 'retriever', 'validator', 'human', 'policy', 'memory', 'event', 'system'];

  let patternTab: 'agents' | 'rag' = 'agents';
  let search = '';
  let chosenNode = '';
  let nodeKind: AgentNode['kind'] = 'agent';
  let nodeName = '';
  let fromId = ''; let toId = ''; let connectionLabel = 'handoff';

  $: filteredPatterns = catalog.agentPatterns.filter(p => (p.name + ' ' + p.useCase + ' ' + p.mechanism).toLowerCase().includes(search.toLowerCase()));
  $: filteredRag = catalog.ragTechniques.filter(p => (p.name + ' ' + p.category + ' ' + p.mechanism).toLowerCase().includes(search.toLowerCase()));
  $: currentNode = active?.nodes.find(n => n.id === chosenNode);
  $: nodeThreats = active && currentNode ? (active.threats ?? []).filter(t => t.nodeId === currentNode!.id) : [];
  $: warnings = active ? graphWarnings(active) : [];
  $: summary = threatSummary(active?.threats ?? []);

  function resync() { if (!active) return; active.threats = syncThreats(active.nodes, active.threats ?? [], THREAT_CANDIDATES, uid); mark(); }
  const controlsFor = (fid: string) => CONTROLS.filter(k => allFrameworkIds(k.frameworkIds).includes(fid));
  $: if ($focus.node) { chosenNode = $focus.node; focus.update(f => ({ ...f, node: undefined })); }
  onMount(() => { if (active) active.threats = syncThreats(active.nodes, active.threats ?? [], THREAT_CANDIDATES, uid); });

  function selectPattern(id: string) { if (!active) return; active.patternIds = active.patternIds.includes(id) ? active.patternIds.filter(v => v !== id) : [...active.patternIds, id]; mark(); }
  $: selectedPatterns = active ? catalog.agentPatterns.filter(p => active!.patternIds.includes(p.id) || active!.nodes.some(n => n.patternId === p.id)) : [];
  $: selectedRag = active ? catalog.ragTechniques.filter(r => active!.ragIds.includes(r.id) || active!.nodes.some(n => (n.ragIds ?? []).includes(r.id))) : [];
  $: retrieverNodes = active ? active.nodes.filter(n => n.kind === 'retriever') : [];
  function toggleNodeRag(n: AgentNode, id: string) { n.ragIds = (n.ragIds ?? []).includes(id) ? n.ragIds.filter(x => x !== id) : [...(n.ragIds ?? []), id]; if (active && !active.ragIds.includes(id)) active.ragIds = [...active.ragIds, id]; mark(); }
  function addRetrieverFor(ids: string[]) {
    if (!active) return;
    const n = { ...makeNode('Retriever', 'retriever', 80 + (active.nodes.length % 5) * 260, 90 + Math.floor(active.nodes.length / 5) * 135), ragIds: ids, actionType: 'read-only' as const, idempotent: true };
    active.nodes = [...active.nodes, n]; chosenNode = n.id; resync();
    toast('Retriever node added with the selected RAG techniques. Connect it to the agents that use it.');
  }
  function setNodePattern(n: AgentNode, id: string) { n.patternId = id; if (id && active && !active.patternIds.includes(id)) active.patternIds = [...active.patternIds, id]; mark(); }
  function selectRag(id: string) { if (!active) return; active.ragIds = active.ragIds.includes(id) ? active.ragIds.filter(v => v !== id) : [...active.ragIds, id]; mark(); }
  function kindFor(name: string): AgentNode['kind'] {
    const low = name.toLowerCase();
    if (low.includes('human')) return 'human';
    if (low.includes('policy') || low.includes('guard')) return 'policy';
    if (low.includes('memory') || low.includes('blackboard')) return 'memory';
    if (low.includes('tool') || low.includes('api') || low.includes('service')) return 'tool';
    if (['evaluator', 'critic', 'review', 'scorer'].some(k => low.includes(k))) return 'validator';
    if (['router', 'controller', 'planner', 'supervisor', 'orchestrator'].some(k => low.includes(k))) return 'orchestrator';
    return 'agent';
  }
  function injectPattern(id: string) {
    if (!active) return;
    const pattern = catalog.agentPatterns.find(x => x.id === id); if (!pattern) return;
    const baseY = active.nodes.length ? 80 + Math.ceil(active.nodes.length / 5) * 145 : 75;
    const created = pattern.template.map((name, i) => ({ ...makeNode(name, kindFor(name), 75 + (i % 5) * 260, baseY + Math.floor(i / 5) * 135), patternId: id }));
    active.nodes = [...active.nodes, ...created];
    active.edges = [...active.edges, ...pattern.links.map(l => { const e = makeEdge(created[l.from].id, created[l.to].id, l.label); e.failurePolicy = l.failurePolicy as typeof e.failurePolicy; return e; })];
    if (!active.patternIds.includes(id)) active.patternIds = [...active.patternIds, id];
    chosenNode = created[0]?.id || ''; resync();
    toast(`${pattern.name} added. Edges start with probability 1; set probabilities and routing before simulating.`);
  }
  function addNode() {
    if (!active) return;
    const n = makeNode(nodeName.trim() || 'Unnamed ' + nodeKind, nodeKind, 80 + (active.nodes.length % 5) * 260, 90 + Math.floor(active.nodes.length / 5) * 135);
    active.nodes = [...active.nodes, n]; chosenNode = n.id; nodeName = ''; resync();
  }
  function moveNode(id: string, x: number, y: number) { if (!active) return; const n = active.nodes.find(n => n.id === id); if (n) { n.x = x; n.y = y; mark(); } }
  function dropNode() { if (!active || !chosenNode) return; active.nodes = active.nodes.filter(n => n.id !== chosenNode); active.edges = active.edges.filter(e => e.from !== chosenNode && e.to !== chosenNode); chosenNode = ''; resync(); }
  function connect() {
    if (!active || !fromId || !toId || fromId === toId) { toast('Select two different nodes.'); return; }
    if (active.edges.some(e => e.from === fromId && e.to === toId)) { toast('That connection already exists.'); return; }
    active.edges = [...active.edges, makeEdge(fromId, toId, connectionLabel)]; mark();
  }
  function removeEdge(id: string) { if (!active) return; active.edges = active.edges.filter(e => e.id !== id); mark(); }
  function addScenario() { if (!active) return; active.scenarios = [...active.scenarios, makeScenario()]; mark(); }
  function exportMermaid() {
    if (!active) return;
    const safe = (s: string) => s.replace(/"/g, "'").replace(/\n/g, ' ');
    const ids = new Map(active.nodes.map((n, i) => [n.id, 'N' + i]));
    const lines = ['flowchart LR', ...active.nodes.map(n => `  ${ids.get(n.id)}["${safe(n.name)}"]`), ...active.edges.filter(e => ids.has(e.from) && ids.has(e.to)).map(e => `  ${ids.get(e.from)} -->|${safe(e.label)}${e.probability < 1 ? ` p=${e.probability}` : ''}| ${ids.get(e.to)}`)];
    downloadBlob(lines.join('\n'), `${filenameSlug(active.title)}-architecture.mmd`, 'text/plain');
  }
</script>

<section class="section-header">
  <div><div class="eyebrow dark">AI-DLC INCEPTION · 2.6 DOMAIN DESIGN</div><h1>Agentic designer</h1><p>Agent graph, tool permissions and identities, per-node cost inputs, edge probabilities, failure policies, the per-node threat model and test scenarios.</p></div>
  {#if active}<button class="button secondary" on:click={exportMermaid}>Export Mermaid graph</button>{/if}
</section>
<div class="pattern-layout">
  <div class="panel palette"><div class="panel-head"><h3>Pattern library</h3><span class="micro">From the project's master reference</span></div>
    <div class="segment"><button class:selected={patternTab === 'agents'} on:click={() => { patternTab = 'agents'; search = ''; }}>Agentic <span>{catalog.agentPatterns.length}</span></button><button class:selected={patternTab === 'rag'} on:click={() => { patternTab = 'rag'; search = ''; }}>RAG <span>{catalog.ragTechniques.length}</span></button></div>
    <input class="search-input" placeholder="Search patterns…" aria-label="Search patterns" bind:value={search}/>
    <div class="palette-scroll">
      {#if patternTab === 'agents'}
        {#each filteredPatterns as pattern}<div class="palette-item"><div class="palette-item-top"><strong>{pattern.name}</strong><span class="tiny-label">{pattern.complexity}</span></div><p>{pattern.mechanism}</p><small>USE: {pattern.useCase}</small><div class="palette-actions">{#if active}<button on:click={() => selectPattern(pattern.id)}>{active.patternIds.includes(pattern.id) ? '✓ Selected' : '+ Select'}</button><button on:click={() => injectPattern(pattern.id)}>Insert blueprint ↗</button>{:else}<span class="micro">Create a use case to use</span>{/if}</div></div>{/each}
      {:else}
        {#each filteredRag as technique}<div class="palette-item"><div class="palette-item-top"><strong>{technique.name}</strong></div><small>{technique.category}</small><p>{technique.mechanism}</p>{#if active}<div class="palette-actions"><button on:click={() => selectRag(technique.id)}>{active.ragIds.includes(technique.id) ? '✓ Selected' : '+ Select'}</button></div>{/if}</div>{/each}
      {/if}
    </div>
  </div>
  <div class="designer-main">
    {#if !active}
      <div class="empty-panel"><h3>No use case open</h3><p>Browse the pattern library, or create a use case to build a graph.</p><button class="button primary" on:click={onBegin}>New blank use case</button><SamplePicker/></div>
    {:else}
      <div class="panel canvas-panel"><div class="panel-head"><div><h3>Agent graph</h3><span class="micro">Drag nodes · select a node to configure it</span></div><span class="pill">{active.nodes.length} nodes · {active.edges.length} edges · {summary.open} open threats</span></div>
        <PatternCanvas nodes={active.nodes} edges={active.edges} selected={chosenNode} onSelect={(id) => chosenNode = id} onMove={moveNode}/>
        <div class="node-toolbar"><input placeholder="New node name" aria-label="New node name" bind:value={nodeName}/><select aria-label="New node kind" bind:value={nodeKind}>{#each KINDS as k}<option value={k}>{k}</option>{/each}</select><button class="button primary small" on:click={addNode}>+ Add node</button></div>
      </div>

      <div class="panel stacked selected-panel">
        <div class="panel-head"><div><h3>Patterns and retrieval in this design</h3><span class="micro">Selecting a pattern or RAG technique does not create agents by itself. Insert a pattern blueprint to create its nodes, or tag existing nodes. Assign RAG techniques to retriever nodes. All of this is written to AGENTS.md, docs/architecture/architecture.md and the architecture-patterns and retrieval skills.</span></div></div>
        {#if !selectedPatterns.length && !selectedRag.length}<p class="subtle-empty">Nothing selected. Use “+ Select” or “Insert blueprint” in the pattern library.</p>{/if}
        {#each selectedPatterns as p (p.id)}
          {@const impl = active.nodes.filter(n => n.patternId === p.id)}
          <div class="sel-item"><div class="sel-top"><strong>{p.name}</strong><span class="tiny-label">pattern · {p.complexity}</span><button class="text-danger" on:click={() => selectPattern(p.id)}>{active.patternIds.includes(p.id) ? 'Deselect' : ''}</button></div>
            <p>{p.mechanism}. {p.useCase}.</p>
            <p class="micro">Nodes: {#each impl as n, i}{#if i}, {/if}<button class="link" on:click={() => chosenNode = n.id}>{n.name}</button>{:else}<span class="warn-text">none yet — insert the blueprint or tag nodes in the node panel</span>{/each}</p>
            <details><summary>Control questions and assessment criteria (exported to the architecture-patterns skill)</summary><ul>{#each p.controlQuestions as q}<li>{q}</li>{/each}</ul><ul>{#each p.assessment as a}<li>{a}</li>{/each}</ul></details>
          </div>
        {/each}
        {#each selectedRag as r (r.id)}
          {@const users = active.nodes.filter(n => (n.ragIds ?? []).includes(r.id))}
          <div class="sel-item"><div class="sel-top"><strong>{r.name}</strong><span class="tiny-label">RAG · {r.category}</span><button class="text-danger" on:click={() => selectRag(r.id)}>{active.ragIds.includes(r.id) ? 'Deselect' : ''}</button></div>
            <p>{r.mechanism}{r.workflow ? ` — ${r.workflow}` : ''}{r.bestUse ? `. Best use: ${r.bestUse}` : ''}.</p>
            <p class="micro">Retriever nodes: {#each users as n, i}{#if i}, {/if}<button class="link" on:click={() => chosenNode = n.id}>{n.name}</button>{:else}<span class="warn-text">not assigned</span>{#if retrieverNodes.length} — assign it on a retriever node below{/if} <button class="link" on:click={() => addRetrieverFor([r.id])}>add a retriever node for it</button>{/each}</p>
          </div>
        {/each}
      </div>

      <div class="panel node-detail"><div class="panel-head"><h3>Node</h3>{#if currentNode}<button class="text-danger" on:click={dropNode}>Remove node</button>{/if}</div>
        {#if currentNode}
          <div class="input-grid third"><label>Name<input bind:value={currentNode.name} on:change={mark}/></label><label>Kind<select bind:value={currentNode.kind} on:change={resync}>{#each KINDS as k}<option>{k}</option>{/each}</select></label><label>Model / runtime<input bind:value={currentNode.model} on:change={mark}/></label></div>
          <div class="input-grid"><label>Responsibility / output contract<textarea rows="2" bind:value={currentNode.description} on:change={mark}></textarea></label><label>Tool permissions<textarea rows="2" bind:value={currentNode.toolPermissions} on:change={mark} placeholder="Allowed tools, methods, scopes and approval rules"></textarea></label><label>Identity<input bind:value={currentNode.identity} on:change={mark} placeholder="Credential this node acts under, e.g. IAM role, delegated user token"/></label><label>Data and trust boundary<input bind:value={currentNode.dataScope} on:change={mark}/></label><label>Accountable owner<input bind:value={currentNode.owner} on:change={mark}/></label><label>Routing of outgoing edges<select bind:value={currentNode.routing} on:change={mark}><option value="one">one — pick a single edge by probability</option><option value="all">all — follow every edge whose probability draw succeeds</option></select></label></div>
          <div class="input-grid fourth"><label>Timeout (s)<input type="number" min="1" bind:value={currentNode.timeoutSeconds} on:change={mark}/></label><label>Max visits per request<input type="number" min="1" bind:value={currentNode.maxSteps} on:change={mark}/></label><label>Spend cap per request (USD)<input type="number" min="0" step="0.01" bind:value={currentNode.spendLimitUsd} on:change={mark}/></label><label>Latency per visit (s)<input type="number" min="0" step="0.1" bind:value={currentNode.latencySeconds} on:change={mark}/></label></div>
          <div class="input-grid fourth"><label>Input tokens / visit<input type="number" min="0" bind:value={currentNode.inputTokens} on:change={mark}/></label><label>Output tokens / visit<input type="number" min="0" bind:value={currentNode.outputTokens} on:change={mark}/></label><label>Input USD / 1M tokens<input type="number" min="0" step="0.01" bind:value={currentNode.inputPricePerM} on:change={mark}/></label><label>Output USD / 1M tokens<input type="number" min="0" step="0.01" bind:value={currentNode.outputPricePerM} on:change={mark}/></label><label>Cached input (%)<input type="number" min="0" max="100" bind:value={currentNode.cachedInputPct} on:change={mark}/></label><label>Cached input USD / 1M<input type="number" min="0" step="0.01" bind:value={currentNode.cachedInputPricePerM} on:change={mark}/></label><label>Other cost per visit (USD)<input type="number" min="0" step="0.0001" bind:value={currentNode.costPerCallUsd} on:change={mark}/></label><div class="readout"><span>Cost per visit</span><span class="read-only">${visitCost(currentNode).toFixed(5)}</span></div></div>

          <div class="input-grid"><label>Agent pattern this node belongs to<select value={currentNode.patternId} on:change={(e) => currentNode && setNodePattern(currentNode, e.currentTarget.value)}><option value="">none</option>{#each catalog.agentPatterns as p}<option value={p.id}>{p.name}</option>{/each}</select></label>
            {#if currentNode.kind === 'retriever'}<div class="rag-assign"><span>RAG techniques this retriever implements</span><div>{#each catalog.ragTechniques.filter(r => active?.ragIds.includes(r.id) || (currentNode?.ragIds ?? []).includes(r.id)) as r}<label class="check-label"><input type="checkbox" checked={(currentNode.ragIds ?? []).includes(r.id)} on:change={() => currentNode && toggleNodeRag(currentNode, r.id)}/> {r.name}</label>{:else}<em>Select RAG techniques in the pattern library first.</em>{/each}</div></div>{/if}</div>
          <div class="security-block"><div class="panel-head"><div><h3>Security attributes</h3><span class="micro">Action type, idempotent and open world become MCP tool annotations in the workspace package. Related controls: <button class="link" on:click={() => openControl('SEC-12')}>SEC-12</button> · <button class="link" on:click={() => openControl('SEC-08')}>SEC-08</button> · <button class="link" on:click={() => openControl('SEC-11')}>SEC-11</button></span></div></div>
            <div class="input-grid fourth"><label>Action type<select bind:value={currentNode.actionType} on:change={mark}><option value="">not set</option><option value="read-only">read-only (does not modify its environment)</option><option value="additive">additive (creates, does not overwrite or delete)</option><option value="destructive">destructive (may update or delete)</option></select></label><label class="check-label"><input type="checkbox" bind:checked={currentNode.idempotent} on:change={mark}/> Idempotent (repeat calls have no additional effect)</label><label class="check-label"><input type="checkbox" bind:checked={currentNode.openWorld} on:change={mark}/> Open world (reaches external entities)</label><label class="check-label"><input type="checkbox" bind:checked={currentNode.requiresHumanApproval} on:change={mark}/> Human confirmation before each call</label></div>
            <div class="input-grid third"><label class="check-label"><input type="checkbox" bind:checked={currentNode.executesCode} on:change={mark}/> Executes code or commands</label><label>Sandbox / isolation<input bind:value={currentNode.sandbox} on:change={mark} placeholder="e.g. container with no network"/></label><label>Allowed network egress<input bind:value={currentNode.allowedEgress} on:change={mark} placeholder="Hosts or services this node may reach"/></label></div>
            <p class="micro">Costs this node adds per request appear in the <button class="link" on:click={() => go('nfr')}>NFR & cost lab</button> graph simulation.</p>
          </div>

          <div class="threats"><div class="panel-head"><div><h3>Threat model for this node</h3><span class="micro">Items listed for kind “{currentNode.kind}” (studio mapping; names from OWASP 2026 lists and ATLAS 2026.10)</span></div></div>
            {#each nodeThreats as t (t.id)}
              {@const item = FW.get(t.threatId)}
              <div class="threat-row"><button class="threat-id" title={item?.framework} on:click={() => item && openReference(item.referenceId)}>{t.threatId}</button><span class="threat-name">{item?.label ?? t.threatId}<small>{item?.framework}</small></span><select aria-label="Threat status" bind:value={t.status} on:change={mark}><option value="open">open</option><option value="mitigated">mitigated</option><option value="accepted">accepted</option><option value="not-applicable">not applicable</option></select><input aria-label="Mitigation" placeholder="Mitigation or reason" bind:value={t.mitigation} on:change={mark}/><span class="threat-ctrls">{#each controlsFor(t.threatId) as k}<button class="link" title={k.name} on:click={() => openControl(k.id)}>{k.id}</button> {/each}</span></div>
            {:else}<p class="subtle-empty">No items listed for this node kind.</p>{/each}
          </div>
        {:else}<div class="subtle-empty">Select a node in the graph to edit it.</div>{/if}
      </div>

      <div class="panel stacked"><div class="panel-head"><h3>Edges</h3><span class="micro">Probability is used by the graph simulation on the NFR & cost lab</span></div>
        <div class="connect-row"><select aria-label="Source node" bind:value={fromId}><option value="">Source node</option>{#each active.nodes as n}<option value={n.id}>{n.name}</option>{/each}</select><span>→</span><select aria-label="Destination node" bind:value={toId}><option value="">Destination node</option>{#each active.nodes as n}<option value={n.id}>{n.name}</option>{/each}</select><input aria-label="Edge label" bind:value={connectionLabel} placeholder="Edge label"/><button class="button secondary small" on:click={connect}>+ Connect</button></div>
        {#each active.edges as e (e.id)}<div class="edge-item six"><strong>{active.nodes.find(n => n.id === e.from)?.name || '?'} → {active.nodes.find(n => n.id === e.to)?.name || '?'}</strong><input aria-label="Edge label" bind:value={e.label} on:change={mark} placeholder="Label"/><input aria-label="Edge contract" bind:value={e.contract} on:change={mark} placeholder="Schema, auth, idempotency"/><select aria-label="Failure policy" bind:value={e.failurePolicy} on:change={mark}><option>halt</option><option>retry</option><option>compensate</option><option>escalate</option></select><input aria-label="Edge probability" type="number" min="0" max="1" step="0.05" bind:value={e.probability} on:change={mark}/><button class="text-danger" aria-label="Remove edge" on:click={() => removeEdge(e.id)}>×</button></div>{/each}
      </div>

      <div class="panel stacked"><div class="panel-head"><div><h3>Test scenarios</h3><span class="micro">Positive, failure and adversarial cases</span></div><button class="button secondary small" on:click={addScenario}>+ Scenario</button></div>
        {#if !active.scenarios.length}<p class="subtle-empty">No scenarios yet.</p>{/if}
        {#each active.scenarios as scenario (scenario.id)}<div class="decision-item"><div class="input-grid third"><label>Name<input bind:value={scenario.name} on:change={mark}/></label><label>Trigger<input bind:value={scenario.trigger} on:change={mark}/></label><label>Expected result<input bind:value={scenario.expectedResult} on:change={mark}/></label></div><div class="input-grid"><label>Failure / abuse case<textarea rows="2" bind:value={scenario.failureAndAbuseCase} on:change={mark}></textarea></label><label>Verification method<textarea rows="2" bind:value={scenario.verification} on:change={mark}></textarea></label></div><button class="text-danger" on:click={() => { if (!active) return; active.scenarios = active.scenarios.filter(s => s.id !== scenario.id); mark(); }}>Remove scenario</button></div>{/each}
      </div>
      {#if warnings.length}<div class="warning-panel"><strong>Graph checks ({warnings.length})</strong>{#each warnings as w}<p>• {w}</p>{/each}</div>{/if}
    {/if}
  </div>
</div>
