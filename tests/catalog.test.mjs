import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const data=(name)=>JSON.parse(readFileSync(new URL(`../data/${name}`,import.meta.url),'utf-8'));
const patterns=data('pattern-catalog.json');
const stages=data('aidlc-stages.json');
const controls=data('trust-controls.json');
const references=data('references.json').references;

test('user-provided RAG and 15 original agent patterns retained',()=>{
 assert.equal(patterns.ragTechniques.length,40);
 assert.equal(patterns.agentPatterns.length,25);
 assert.equal(patterns.agentPatterns.filter(x=>x.origin==='User-supplied master reference').length,15);
 assert.equal(new Set(patterns.ragTechniques.map(x=>x.id)).size,40);
 assert.equal(new Set(patterns.agentPatterns.map(x=>x.id)).size,25);
});
test('all patterns contain valid graph topology with explicit multi-branch examples',()=>{
 for(const p of patterns.agentPatterns){
  assert.ok(p.template.length>=3,`missing template for ${p.name}`);
  assert.ok(p.links.length>=2,`missing topology for ${p.name}`);
  for(const l of p.links){assert.ok(l.from<p.template.length&&l.to<p.template.length,`${p.name} has invalid node reference`);}
 }
 const routing=patterns.agentPatterns.find(x=>x.name==='Routing');
 assert.equal(routing.links.filter(e=>e.from===0).length,2);
 const fanout=patterns.agentPatterns.find(x=>x.name==='Parallelization');
 assert.equal(fanout.links.filter(e=>e.from===0).length,2);
});
test('AWS stages and phase counts are consistent',()=>{
 assert.equal(stages.stages.length,33);
 assert.deepEqual(['Initialization','Ideation','Inception','Construction','Operation'].map(p=>stages.stages.filter(x=>x.phase===p).length),[3,7,9,7,7]);
 assert.equal(new Set(stages.stages.map(x=>x.id)).size,33);
});
test('control register and references carry traceability',()=>{
 assert.equal(controls.length,35);
 assert.ok(controls.every(c=>c.description&&typeof c.critical==='boolean'&&c.referenceIds.length>0&&c.frameworkIds));
 assert.ok(references.some(s=>s.id==='nist'));
 assert.ok(references.some(s=>s.id==='iso'));
 assert.ok(references.some(s=>s.id==='aws'));
});
test('source-backed reference documents and editor files are included',()=>{
 for(const file of ['../data/rag_and_agent_patterns_master_reference.md','../data/reference/enterprise-practices-40-slide-marp.md','../AGENTS.md','../CLAUDE.md','../SKILLS.md','../agents.md','../claude.md','../skills.md','../src/App.svelte','../src/components/PatternCanvas.svelte'])
  assert.ok(existsSync(new URL(file,import.meta.url)),file);
});
