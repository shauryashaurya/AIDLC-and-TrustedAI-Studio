import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { allFrameworkIds, frameworkIndex, syncThreats, threatSummary } from '../src/lib/frameworks.ts';
const data=(name)=>JSON.parse(readFileSync(new URL(`../data/${name}`,import.meta.url),'utf-8'));
const fw={rmf:data('frameworks/nist-ai-rmf-1.0-subcategories.json'),llm:data('frameworks/owasp-llm-2026.json'),asi:data('frameworks/owasp-asi-2026.json'),atlas:data('frameworks/atlas-techniques.json')};
const index=frameworkIndex(fw);
const controls=data('trust-controls.json');
const threats=data('frameworks/threat-candidates.json');

test('NIST AI RMF 1.0 has 72 subcategories across the four functions',()=>{
 assert.equal(fw.rmf.subcategories.length,72);
 const count=f=>fw.rmf.subcategories.filter(s=>s.function===f).length;
 assert.deepEqual(['GOVERN','MAP','MEASURE','MANAGE'].map(count),[19,18,22,13]);
 for(const s of fw.rmf.subcategories){assert.ok(s.text.length>40,s.id);assert.ok(!s.text.includes('�'),s.id);assert.ok(!/ 5\.\d (Map|Measure|Manage) /.test(s.text),s.id);}
});
test('OWASP 2026 lists have 10 items each',()=>{
 assert.equal(fw.llm.items.length,10);assert.equal(fw.asi.items.length,10);
 assert.equal(index.get('ASI02').label,'Tool Misuse and Exploitation');
 assert.equal(index.get('LLM03:2026').label,'Excessive Agency');
});
test('ATLAS subset uses 2026.10 names',()=>{
 assert.equal(fw.atlas.version,'2026.10');
 assert.equal(index.get('AML.T0051').label,'LLM Prompt Injection');
 assert.equal(index.get('AML.T0070').label,'RAG Poisoning');
});
test('every control framework ID and threat candidate resolves to a verified catalog',()=>{
 for(const c of controls){
  assert.equal(c.mapping,undefined,`${c.id} still has the old free-text mapping`);
  const ids=allFrameworkIds(c.frameworkIds);
  assert.ok(c.frameworkIds.nistAiRmf.length>0,`${c.id} has no NIST AI RMF subcategory`);
  for(const id of ids) assert.ok(index.has(id),`${c.id}: ${id}`);
 }
 for(const [kind,ids] of Object.entries(threats.byKind)) for(const id of ids) assert.ok(index.has(id),`${kind}: ${id}`);
});
test('syncThreats adds candidates per node, keeps existing entries and drops removed nodes',()=>{
 let n=0;const mk=()=>`t${++n}`;
 const nodes=[{id:'a',kind:'tool'},{id:'b',kind:'human'}];
 const first=syncThreats(nodes,[],threats,mk);
 assert.equal(first.length,threats.byKind.tool.length+threats.byKind.human.length);
 first[0].status='mitigated';first[0].mitigation='scoped token';
 const second=syncThreats([nodes[0]],first,threats,mk);
 assert.equal(second.length,threats.byKind.tool.length);
 assert.equal(second[0].mitigation,'scoped token');
 const s=threatSummary(second);
 assert.equal(s.mitigated,1);assert.equal(s.open,second.length-1);
});
test('coverage: every NIST AI RMF subcategory and every OWASP 2026 item is covered by at least one control',()=>{
 const used=new Set(controls.flatMap(c=>allFrameworkIds(c.frameworkIds)));
 assert.deepEqual(fw.rmf.subcategories.filter(s=>!used.has(s.id)).map(s=>s.id),[]);
 assert.deepEqual(fw.llm.items.filter(i=>!used.has(i.id)).map(i=>i.id),[]);
 assert.deepEqual(fw.asi.items.filter(i=>!used.has(i.id)).map(i=>i.id),[]);
});
test('coverage: every OWASP 2026 item appears in some node kind\'s threat list',()=>{
 const listed=new Set(Object.values(threats.byKind).flat());
 assert.deepEqual([...fw.llm.items,...fw.asi.items].filter(i=>!listed.has(i.id)).map(i=>i.id),[]);
});
