import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildWorkspace } from '../src/lib/workspace.ts';
import { slugify } from '../src/lib/kit.ts';
import { EXPORT_MAP, resolveFile } from '../src/lib/exportmap.ts';
const data=(name)=>JSON.parse(readFileSync(new URL(`../data/${name}`,import.meta.url),'utf-8'));
const ctx={stages:data('aidlc-stages.json'),profiles:data('aidlc-profiles.json'),controls:data('trust-controls.json'),patterns:data('pattern-catalog.json'),templates:data('aidlc-artifact-templates.json'),gates:data('aidlc-gates.json').gates,
 frameworks:{rmf:data('frameworks/nist-ai-rmf-1.0-subcategories.json'),llm:data('frameworks/owasp-llm-2026.json'),asi:data('frameworks/owasp-asi-2026.json'),atlas:data('frameworks/atlas-techniques.json')},manage11:'MANAGE 1.1',date:'2026-11-25'};

for(const lang of ['typescript','python']) test(`export map is true for the claims sample (${lang}): every file and section exists`,()=>{
 const c=data('samples/sample-claims-triage.json');
 const files=buildWorkspace(c,lang,ctx,{includeTemplates:true});
 const slug=slugify(c.title);
 for(const e of EXPORT_MAP) for(const t of e.targets){
  const path=resolveFile(t.file,slug);
  const hits=path.endsWith('/')?files.filter(f=>f.path.startsWith(path)):files.filter(f=>f.path===path);
  assert.ok(hits.length,`${e.input}: missing ${path}`);
  if(t.heading) assert.ok(hits.some(f=>f.content.includes(t.heading)),`${e.input}: ${path} lacks "${t.heading}"`);
 }
 const trace=files.find(f=>f.path==='docs/TRACEABILITY.md').content;
 assert.ok(trace.includes(`${slug}-retrieval/SKILL.md`));
});
test('every editable studio page has map entries',()=>{
 for(const p of ['ideate','patterns','nfr','trust','lifecycle']) assert.ok(EXPORT_MAP.some(e=>e.page===p),p);
});
