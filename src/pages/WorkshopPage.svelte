<script lang="ts">
  import { onMount } from 'svelte';
  import type { Page } from '../lib/types';
  import { FRAMEWORKS, PROFILE_CATALOG, REF_BY_ID, STAGE_CATALOG, WORKSHOP } from '../lib/catalog';
  import { buildQuestion, emptyProgress, moduleMinutes, moduleProgress, type Question, type WorkshopProgress } from '../lib/workshop';
  import { PAGE_LABELS } from '../lib/references';
  import { go, openReference, openStage } from '../lib/state';

  const KEY = 'aidlc-trust-studio.workshop.v1';
  const ctx = { stages: STAGE_CATALOG, profiles: PROFILE_CATALOG, frameworks: FRAMEWORKS };
  const questions = new Map<string, Question[]>(WORKSHOP.modules.map(m => [m.id, m.quiz.map(q => buildQuestion(q, ctx))]));
  const totalMinutes = WORKSHOP.modules.reduce((a, m) => a + moduleMinutes(WORKSHOP, m), 0);

  let mode: 'facilitated' | 'selfPaced' = 'facilitated';
  let selected = WORKSHOP.modules[0].id;
  let progress: WorkshopProgress = emptyProgress();
  let revealed: Record<string, boolean> = {};

  onMount(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) { const v = JSON.parse(raw); progress = { ...emptyProgress(), ...v.progress }; mode = v.mode === 'selfPaced' ? 'selfPaced' : 'facilitated'; } } catch { /* ignore unreadable progress */ }
  });
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ mode, progress })); } catch { /* storage unavailable */ } }
  function setMode(m: typeof mode) { mode = m; save(); }
  function toggleStep(key: string) { progress.steps[key] = !progress.steps[key]; progress = progress; save(); }
  function answer(moduleId: string, q: Question, option: string) { progress.answers[`${moduleId}:${q.key}`] = option; progress = progress; save(); }
  function reset() { if (!confirm('Clear workshop progress stored in this browser?')) return; progress = emptyProgress(); revealed = {}; save(); }

  $: module = WORKSHOP.modules.find(m => m.id === selected)!;
  $: qs = questions.get(module.id) ?? [];
  $: stats = moduleProgress(module, progress, qs);
  const stageName = (id: string) => STAGE_CATALOG.stages.find(s => s.id === id)?.name ?? id;
  const mins = (m: number) => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`;
  // Renders `code` spans in step text without using raw HTML.
  const parts = (s: string) => s.split(/(`[^`]+`)/).map(p => p.startsWith('`') && p.endsWith('`') ? { code: true, text: p.slice(1, -1) } : { code: false, text: p });
</script>

<section class="section-header">
  <div><div class="eyebrow dark">WORKSHOP · {WORKSHOP.modules.length} MODULES</div><h1>{WORKSHOP.title}</h1>
    <p>Teams plan one agentic AI use case through the AI-DLC phases inside this studio, then export it for a real AI-DLC run. Timed modules use the format in the project's training-tracks deck: {WORKSHOP.format.sessionMinutes} min session + {WORKSHOP.format.qaMinutes} min Q&A + {WORKSHOP.format.capstoneMinutes} min capstone ({mins(totalMinutes)} in total for {WORKSHOP.modules.filter(m => m.timed).length} timed modules).</p></div>
  <div class="segment mode-toggle" role="group" aria-label="Workshop mode"><button class:selected={mode === 'facilitated'} on:click={() => setMode('facilitated')}>Facilitated</button><button class:selected={mode === 'selfPaced'} on:click={() => setMode('selfPaced')}>Self-paced</button></div>
</section>
<div class="callout">{mode === 'facilitated' ? WORKSHOP.modes.facilitated : WORKSHOP.modes.selfPaced}</div>

<div class="workshop-layout">
  <nav class="panel module-list" aria-label="Modules">
    {#each WORKSHOP.modules as m, i}
      {@const p = moduleProgress(m, progress, questions.get(m.id) ?? [])}
      <button class:chosen={selected === m.id} on:click={() => selected = m.id}>
        <b>{i}</b><span><strong>{m.title}</strong><small>{m.timed ? mins(moduleMinutes(WORKSHOP, m)) : 'Pre-work'}{m.aidlcStages.length ? ` · stages ${m.aidlcStages.join(', ')}` : ''}</small>{#if mode === 'selfPaced'}<small>{p.stepsDone}/{p.stepsTotal} steps · {p.correct}/{p.questions} correct</small>{/if}</span>
      </button>
    {/each}
    {#if mode === 'selfPaced'}<button class="text-danger reset" on:click={reset}>Clear progress</button>{/if}
  </nav>

  <article class="panel stacked module-detail">
    <div class="panel-head"><div><h2>{module.title}</h2><span class="micro">{module.timed ? `${WORKSHOP.format.sessionMinutes} min session · ${WORKSHOP.format.qaMinutes} min Q&A · ${WORKSHOP.format.capstoneMinutes} min capstone` : 'Before the workshop'}</span></div></div>

    <section><h3>Objectives</h3><ul>{#each module.objectives as o}<li>{o}</li>{/each}</ul></section>

    <section class="chips-row">
      {#if module.aidlcStages.length}<div class="stage-chips"><span>AI-DLC STAGES</span>{#each module.aidlcStages as s}<button on:click={() => openStage(s)} title={stageName(s)}>{s} {stageName(s)}</button>{/each}</div>{/if}
      <div class="stage-chips"><span>STUDIO PAGES</span>{#each module.pages as p}<button on:click={() => go(p as Page)}>{PAGE_LABELS[p as Page]}</button>{/each}</div>
      <div class="stage-chips"><span>REFERENCES</span>{#each module.references as r}<button on:click={() => openReference(r)}>{REF_BY_ID.get(r)?.title ?? r}</button>{/each}</div>
    </section>

    <section><h3>Steps</h3>
      <ol class="steps">{#each module.steps as step, i}{@const key = `${module.id}:${i}`}<li>
        {#if mode === 'selfPaced'}<label class="step-check"><input type="checkbox" checked={!!progress.steps[key]} on:change={() => toggleStep(key)}/><span>{#each parts(step) as part}{#if part.code}<code>{part.text}</code>{:else}{part.text}{/if}{/each}</span></label>
        {:else}{#each parts(step) as part}{#if part.code}<code>{part.text}</code>{:else}{part.text}{/if}{/each}{/if}
      </li>{/each}</ol>
    </section>

    {#if mode === 'facilitated' && module.facilitatorNotes.length}
      <section class="facilitator"><h3>Facilitator notes</h3><ul>{#each module.facilitatorNotes as n}<li>{n}</li>{/each}</ul></section>
    {/if}
    {#if module.capstone}<section><h3>Capstone ({WORKSHOP.format.capstoneMinutes} min)</h3><p>{module.capstone}</p></section>{/if}

    <section><h3>Checkpoint questions</h3>
      <p class="micro">Answers are computed from the studio's catalogs; each question shows its source.</p>
      {#each qs as q, qi (q.key)}
        {@const key = `${module.id}:${q.key}`}
        {@const chosen = progress.answers[key]}
        {@const show = mode === 'facilitated' ? revealed[key] : chosen !== undefined}
        <div class="quiz">
          <p><b>{qi + 1}.</b> {q.prompt}</p>
          <div class="quiz-options">{#each q.options as o}<button class:picked={chosen === o} class:right={show && o === q.answer} class:wrong={show && chosen === o && o !== q.answer} on:click={() => answer(module.id, q, o)}>{o}</button>{/each}</div>
          {#if mode === 'facilitated'}<button class="link" on:click={() => revealed = { ...revealed, [key]: !revealed[key] }}>{revealed[key] ? 'Hide answer' : 'Show answer'}</button>{/if}
          {#if show}<small class="quiz-source">Answer: {q.answer} · Source: {q.source}</small>{/if}
        </div>
      {/each}
      {#if mode === 'selfPaced'}<p class="micro">Score for this module: {stats.correct} of {stats.questions} · steps done: {stats.stepsDone} of {stats.stepsTotal}</p>{/if}
    </section>
  </article>
</div>
