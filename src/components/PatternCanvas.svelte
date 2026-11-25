<script lang="ts">
  import type { AgentNode, GraphEdge } from '../lib/types';
  export let nodes: AgentNode[] = [];
  export let edges: GraphEdge[] = [];
  export let selected = '';
  export let onSelect: (id: string) => void = () => {};
  export let onMove: (id: string, x: number, y: number) => void = () => {};
  let boardHeight=540;
  let boardWidth=1500;
  $: boardHeight = Math.max(540, ...nodes.map(n=>n.y+150));
  $: boardWidth = Math.max(1500, ...nodes.map(n=>n.x+230));
  let grabbing: {id: string; pointerX: number; pointerY: number; x: number; y: number} | null = null;
  const colors:Record<string,string> = { orchestrator:'#377ef0', agent:'#8875ea', retriever:'#16a4a5', tool:'#ec9d48', validator:'#5fae7e',human:'#d277a8',memory:'#8d9db7',policy:'#d88354',event:'#66a6d1',system:'#7694a1' };
  function down(event:PointerEvent,n:AgentNode) {
    if(event.button!==0)return;
    grabbing={id:n.id,pointerX:event.clientX,pointerY:event.clientY,x:n.x,y:n.y};
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    onSelect(n.id);
  }
  function move(event:PointerEvent) {
    if(!grabbing)return;
    onMove(grabbing.id,Math.max(12,Math.min(1500,grabbing.x+event.clientX-grabbing.pointerX)),Math.max(12,Math.min(800,grabbing.y+event.clientY-grabbing.pointerY)));
  }
  function up(){grabbing=null;}
  const labelKind=(kind:string)=>kind.replace(/\b\w/g,c=>c.toUpperCase());
</script>

<div class="canvas-scroller" aria-label="Editable agentic workflow architecture canvas">
  <div class="flowboard" style:height={`${boardHeight}px`} style:width={`${boardWidth}px`}>
    <div class="canvas-grid"></div>
    <svg class="edge-layer" width={boardWidth} height={boardHeight} viewBox={`0 0 ${boardWidth} ${boardHeight}`} aria-label="Directed workflow connections">
      <defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="none" stroke="#6c8bac" stroke-width="1.5"/></marker></defs>
      {#each edges as edge (edge.id)}
        {@const source = nodes.find(n=>n.id===edge.from)}
        {@const target = nodes.find(n=>n.id===edge.to)}
        {#if source && target}
          <path d={`M${source.x+180},${source.y+42} C${source.x+235},${source.y+42} ${target.x-55},${target.y+42} ${target.x},${target.y+42}`} fill="none" stroke="#6686a7" stroke-width="2" stroke-dasharray={edge.failurePolicy==='retry'?'6 5':''} marker-end="url(#arrow)"/>
          <text x={(source.x+target.x+180)/2} y={(source.y+target.y+84)/2-9} font-size="11" text-anchor="middle" fill="#88a2bb">{edge.label.slice(0,18)}</text>
        {/if}
      {/each}
    </svg>
    {#each nodes as n (n.id)}
      <div class:selected={selected===n.id} class="diagram-node" style:left={`${n.x}px`} style:top={`${n.y}px`} style:border-top-color={colors[n.kind]||'#7590a6'} role="button" tabindex="0" aria-label={`Edit ${n.name}`} on:pointerdown={(e)=>down(e,n)} on:pointermove={move} on:pointerup={up} on:pointercancel={up} on:keydown={(e)=>{if(e.key==='Enter')onSelect(n.id);const step=e.shiftKey?40:12;if(e.key==='ArrowLeft'){e.preventDefault();onMove(n.id,Math.max(12,n.x-step),n.y)}if(e.key==='ArrowRight'){e.preventDefault();onMove(n.id,n.x+step,n.y)}if(e.key==='ArrowUp'){e.preventDefault();onMove(n.id,n.x,Math.max(12,n.y-step))}if(e.key==='ArrowDown'){e.preventDefault();onMove(n.id,n.x,n.y+step)}}}>
        <div class="diagram-node-kind"><span class="node-bullet" style:background={colors[n.kind]||'#7590a6'}></span>{labelKind(n.kind)}</div>
        <div class="diagram-node-name">{n.name}</div>
        <div class="diagram-node-meta">{n.maxSteps} steps · {n.timeoutSeconds}s · ${n.spendLimitUsd.toFixed(0)} cap</div>
      </div>
    {/each}
    {#if !nodes.length}
      <div class="canvas-empty"><span class="large-symbol">◇</span><strong>Compose an agentic system</strong><small>Add a named agent or insert any pattern template.<br/>Drag nodes to arrange; define explicit handoffs and policies.</small></div>
    {/if}
  </div>
</div>
