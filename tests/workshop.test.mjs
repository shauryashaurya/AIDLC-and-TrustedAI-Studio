import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildQuestion, distractors, moduleMinutes, moduleProgress, emptyProgress } from '../src/lib/workshop.ts';
const data=(name)=>JSON.parse(readFileSync(new URL(`../data/${name}`,import.meta.url),'utf-8'));
const w=data('workshop/modules.json');
const ctx={stages:data('aidlc-stages.json'),profiles:data('aidlc-profiles.json'),frameworks:{rmf:data('frameworks/nist-ai-rmf-1.0-subcategories.json'),llm:data('frameworks/owasp-llm-2026.json'),asi:data('frameworks/owasp-asi-2026.json'),atlas:data('frameworks/atlas-techniques.json')}};
const refs=new Set(data('references.json').references.map(r=>r.id));
const pages=new Set(['home','workshop','discover','ideate','patterns','nfr','trust','lifecycle','reports','references']);
const stageIds=new Set(ctx.stages.stages.map(s=>s.id));

test('module timing comes from the training-tracks format',()=>{
 assert.equal(w.format.source,'training-tracks');
 const deck=readFileSync(new URL('../data/reference/expertise-training-tracks-marp.md',import.meta.url),'utf-8');
 assert.ok(deck.includes('90 min facilitated session + 45 min Q&A + 45 min timed capstone'));
 assert.equal(moduleMinutes(w,w.modules[1]),180);
 assert.equal(moduleMinutes(w,w.modules[0]),0);
});
test('every module references real stages, pages and references',()=>{
 for(const m of w.modules){
  for(const s of m.aidlcStages) assert.ok(stageIds.has(s),`${m.id}: stage ${s}`);
  for(const p of m.pages) assert.ok(pages.has(p),`${m.id}: page ${p}`);
  for(const r of m.references) assert.ok(refs.has(r),`${m.id}: reference ${r}`);
  assert.ok(m.steps.length>0&&m.objectives.length>0,m.id);
 }
});
test('every checkpoint question builds from data, has its answer among the options and no duplicates',()=>{
 let n=0;
 for(const m of w.modules) for(const spec of m.quiz){
  const q=buildQuestion(spec,ctx);n++;
  assert.ok(q.options.includes(q.answer),`${m.id} ${q.key}`);
  assert.equal(new Set(q.options).size,q.options.length,`${m.id} ${q.key} duplicate options`);
  assert.ok(q.options.length>=2,q.key);
 }
 assert.ok(n>=25);
});
test('computed answers match the source data',()=>{
 const a=spec=>buildQuestion(spec,ctx).answer;
 assert.equal(a({type:'stageCount'}),'33');
 assert.equal(a({type:'gateRule'}),'Initialization');
 assert.equal(a({type:'profileDefault'}),'classic');
 assert.equal(a({type:'stageLead',stage:'2.9'}),'aidlc-delivery-agent');
 assert.equal(a({type:'stageMode',stage:'2.4'}),'mob');
 assert.equal(a({type:'stageOutput',stage:'2.7'}),'unit-of-work.md');
 assert.equal(a({type:'profileRuns',profile:'mvp',stage:'4.1'}),'No');
 assert.equal(a({type:'profileRuns',profile:'workshop',stage:'1.1'}),'No');
 assert.equal(a({type:'profileTest',profile:'workshop'}),'minimal');
 assert.equal(a({type:'rmfText',id:'MAP 1.4'}),'MAP 1.4');
 assert.equal(a({type:'listName',id:'ASI02'}),'Tool Misuse and Exploitation');
 assert.equal(a({type:'errorBudget',availability:99.9,days:30}),'43.2 minutes');
});
test('distractors are deterministic and never the answer',()=>{
 const d=distractors(['a','b','c','d','e'],'c',3,'seed');
 assert.deepEqual(d,distractors(['a','b','c','d','e'],'c',3,'seed'));
 assert.ok(!d.includes('c'));assert.equal(d.length,3);
});
test('progress counts steps and correct answers',()=>{
 const m=w.modules[1];const qs=m.quiz.map(s=>buildQuestion(s,ctx));
 const p=emptyProgress();p.steps[`${m.id}:0`]=true;p.answers[`${m.id}:${qs[0].key}`]=qs[0].answer;p.answers[`${m.id}:${qs[1].key}`]='wrong';
 const r=moduleProgress(m,p,qs);
 assert.equal(r.stepsDone,1);assert.equal(r.answered,2);assert.equal(r.correct,1);
});
