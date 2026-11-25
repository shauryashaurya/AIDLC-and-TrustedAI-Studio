// Workshop modules and checkpoint questions. Every question's answer is computed from the catalogs
// (AI-DLC stages/profiles, NIST AI RMF text, OWASP/ATLAS lists, SLO arithmetic), never hand-written.
import type { ProfileCatalog, StageCatalog } from './aidlc.ts';
import type { FrameworkCatalogs } from './frameworks';
import type { Page } from './types';
import { stagesForProfile } from './aidlc.ts';
import { errorBudget } from './slo.ts';

export type QuizSpec =
  | { type: 'stageCount' } | { type: 'gateRule' } | { type: 'profileDefault' }
  | { type: 'phaseOfStage' | 'stageLead' | 'stageMode' | 'stageOutput'; stage: string }
  | { type: 'profileRuns'; profile: string; stage: string }
  | { type: 'profileDepth' | 'profileTest'; profile: string }
  | { type: 'rmfText' | 'listName'; id: string }
  | { type: 'errorBudget'; availability: number; days: number };

export interface WorkshopModule {
  id: string; title: string; timed: boolean; aidlcStages: string[]; pages: Page[]; references: string[];
  objectives: string[]; steps: string[]; facilitatorNotes: string[]; capstone: string | null; quiz: QuizSpec[];
}
export interface WorkshopCatalog {
  title: string; version: string;
  format: { sessionMinutes: number; qaMinutes: number; capstoneMinutes: number; source: string; sourceText: string };
  modes: { facilitated: string; selfPaced: string };
  modules: WorkshopModule[];
}
export interface QuizContext { stages: StageCatalog; profiles: ProfileCatalog; frameworks: FrameworkCatalogs }
export interface Question { key: string; prompt: string; options: string[]; answer: string; source: string }

/** Deterministic pick of `n` distractors from `pool` (excluding the answer), seeded by a string. */
export function distractors(pool: string[], answer: string, n: number, seed: string): string[] {
  const uniq = [...new Set(pool.filter(x => x !== answer))];
  if (!uniq.length) return [];
  let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const out: string[] = [];
  for (let i = 0; out.length < Math.min(n, uniq.length); i++) {
    const c = uniq[(h + i * 7) % uniq.length];
    if (!out.includes(c)) out.push(c);
  }
  return out;
}
const shuffle = (xs: string[], seed: string) => { const s = [...xs].sort(); let h = 0; for (const ch of seed) h = (h * 33 + ch.charCodeAt(0)) >>> 0; const k = h % s.length; return [...s.slice(k), ...s.slice(0, k)]; };
const mc = (key: string, prompt: string, answer: string, pool: string[], source: string): Question =>
  ({ key, prompt, answer, options: shuffle([answer, ...distractors(pool, answer, 3, key)], key), source });

export function buildQuestion(spec: QuizSpec, ctx: QuizContext): Question {
  const { stages: sc, profiles: pc, frameworks: f } = ctx;
  const tag = sc.upstream.tag;
  const stage = (id: string) => { const s = sc.stages.find(x => x.id === id); if (!s) throw new Error(`Unknown stage ${id}`); return s; };
  const profile = (id: string) => { const p = pc.profiles.find(x => x.id === id); if (!p) throw new Error(`Unknown profile ${id}`); return p; };
  const key = JSON.stringify(spec);
  switch (spec.type) {
    case 'stageCount':
      return mc(key, `How many stages does AI-DLC ${tag} define across its five phases?`, String(sc.stages.length), ['30', '26', '23', '15', '33'], `AI-DLC ${tag} phases and stages`);
    case 'gateRule': {
      const noGate = [...new Set(sc.stages.filter(s => !s.gate).map(s => s.phase))].join(', ');
      return mc(key, 'Stages in which phase do not end with an approval gate?', noGate, sc.phases.map(p => p.name), `AI-DLC ${tag} phases and stages`);
    }
    case 'profileDefault': {
      const d = pc.profiles.find(p => p.default)!;
      return mc(key, 'Which workflow profile does AI-DLC use when none is named?', d.id, pc.profiles.map(p => p.id), `AI-DLC ${tag} scopes and depth`);
    }
    case 'phaseOfStage': { const s = stage(spec.stage); return mc(key, `Which phase contains stage ${s.id} ${s.name}?`, s.phase, sc.phases.map(p => p.name), `AI-DLC ${tag} phases and stages`); }
    case 'stageLead': { const s = stage(spec.stage); return mc(key, `Which agent leads stage ${s.id} ${s.name}?`, s.lead, sc.stages.map(x => x.lead).filter(l => l !== 'orchestrator'), `AI-DLC ${tag} phases and stages`); }
    case 'stageMode': { const s = stage(spec.stage); return mc(key, `What execution mode does stage ${s.id} ${s.name} use?`, s.mode, ['inline', 'subagent', 'pipeline', 'mob'], `AI-DLC ${tag} phases and stages`); }
    case 'stageOutput': {
      const s = stage(spec.stage);
      const others = sc.stages.filter(x => x.id !== s.id && x.outputs.length).map(x => x.outputs[0]).filter(o => !s.outputs.includes(o));
      return mc(key, `Which file does stage ${s.id} ${s.name} write?`, s.outputs[0], others, `AI-DLC ${tag} artifacts reference`);
    }
    case 'profileRuns': {
      const s = stage(spec.stage);
      const runs = stagesForProfile(pc, sc.stages, spec.profile).includes(s.id);
      return { key, prompt: `Does the ${spec.profile} profile run stage ${s.id} ${s.name}?`, options: ['Yes', 'No'], answer: runs ? 'Yes' : 'No', source: `AI-DLC ${tag} stage-by-scope matrix` };
    }
    case 'profileDepth': { const p = profile(spec.profile); return mc(key, `What depth does the ${p.id} profile use?`, p.depth, ['minimal', 'standard', 'comprehensive'], `AI-DLC ${tag} scopes and depth`); }
    case 'profileTest': { const p = profile(spec.profile); return mc(key, `What test strategy does the ${p.id} profile use?`, p.testStrategy, ['minimal', 'standard', 'comprehensive'], `AI-DLC ${tag} scopes and depth`); }
    case 'rmfText': {
      const item = f.rmf.subcategories.find(s => s.id === spec.id);
      if (!item) throw new Error(`Unknown RMF subcategory ${spec.id}`);
      return mc(key, `Which NIST AI RMF 1.0 subcategory says: “${item.text}”`, item.id, f.rmf.subcategories.filter(s => s.function === item.function).map(s => s.id), 'NIST AI 100-1, Tables 1–4');
    }
    case 'listName': {
      for (const [list, label] of [[f.asi, 'OWASP Top 10 for Agentic Applications 2026'], [f.llm, 'OWASP Top 10 for LLM Applications 2026'], [f.atlas, 'MITRE ATLAS 2026.10']] as const) {
        const item = list.items.find(i => i.id === spec.id);
        if (item) return mc(key, `In ${label}, what is ${item.id}?`, item.name, list.items.map(i => i.name), label);
      }
      throw new Error(`Unknown list item ${spec.id}`);
    }
    case 'errorBudget': {
      const m = errorBudget(spec.availability, spec.days, 0).allowedDowntimeMinutes;
      const fmt = (x: number) => `${Number(x.toFixed(1)).toLocaleString('en-US')} minutes`;
      return mc(key, `An availability SLO of ${spec.availability}% over ${spec.days} days allows how much downtime?`, fmt(m), [fmt(m * 10), fmt(m / 10), fmt(m * 2), fmt(m / 2)], 'Studio calculation: (100% − SLO) × window length');
    }
  }
}

export function moduleMinutes(w: WorkshopCatalog, m: WorkshopModule): number {
  return m.timed ? w.format.sessionMinutes + w.format.qaMinutes + w.format.capstoneMinutes : 0;
}

/** Self-paced progress, kept in localStorage by the Workshop page. */
export interface WorkshopProgress { steps: Record<string, boolean>; answers: Record<string, string> }
export const emptyProgress = (): WorkshopProgress => ({ steps: {}, answers: {} });
export function moduleProgress(m: WorkshopModule, p: WorkshopProgress, questions: Question[]) {
  const stepsDone = m.steps.filter((_, i) => p.steps[`${m.id}:${i}`]).length;
  const answered = questions.filter(q => p.answers[`${m.id}:${q.key}`] !== undefined);
  const correct = answered.filter(q => p.answers[`${m.id}:${q.key}`] === q.answer).length;
  return { stepsDone, stepsTotal: m.steps.length, answered: answered.length, correct, questions: questions.length };
}
