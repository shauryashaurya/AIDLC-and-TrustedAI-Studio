import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildWorkspace, templateFiles } from '../src/lib/workspace.ts';
import { zip } from '../src/lib/zip.ts';
const data=(name)=>JSON.parse(readFileSync(new URL(`../data/${name}`,import.meta.url),'utf-8'));
const stages=data('aidlc-stages.json'), templates=data('aidlc-artifact-templates.json'), controls=data('trust-controls.json');
const frameworks={rmf:data('frameworks/nist-ai-rmf-1.0-subcategories.json'),llm:data('frameworks/owasp-llm-2026.json'),asi:data('frameworks/owasp-asi-2026.json'),atlas:data('frameworks/atlas-techniques.json')};
const gates=data('aidlc-gates.json').gates;
const ctx={stages,profiles:data('aidlc-profiles.json'),frameworks,controls,templates,gates,patterns:data('pattern-catalog.json'),manage11:'NIST AI RMF MANAGE 1.1: “…”',date:'2026-11-25'};
const sample=data('samples/sample-claims-triage.json');

test('every non-Initialization stage declares its artifacts from the stage rule file',()=>{
 for(const s of stages.stages){
  assert.match(s.ruleFile,/^core\/aidlc-common\/stages\/[a-z]+\/[a-z-]+\.md$/,s.id);
  if(s.id.startsWith('0.')){assert.equal(s.recordDir,null);continue;}
  assert.ok(s.produces.length>0,s.id);
  for(const p of s.produces) assert.ok(s.outputs.includes(p==='traceability'?'traceability.json':`${p}.md`),`${s.id} ${p}`);
 }
 assert.equal(stages.stages.find(s=>s.id==='3.2').recordDir,'construction/<unit-name>/nfr-requirements/');
 assert.equal(stages.stages.find(s=>s.id==='1.1').recordDir,'ideation/intent-capture/');
});
test('templates: each stem is produced by its stage, record path matches, no machine-checked artifacts',()=>{
 const banned=new Set(['components','unit-of-work','unit-of-work-dependency','unit-of-work-story-map','entities','rules','functional-spec','contract-summary','traceability','team-practices','discovered-rules','evidence']);
 assert.ok(templates.templates.length>=20);
 for(const t of templates.templates){
  const s=stages.stages.find(x=>x.id===t.stage);
  assert.ok(s.produces.includes(t.stem),t.stem);
  assert.equal(t.recordPath,s.recordDir+t.stem+'.md');
  assert.ok(!banned.has(t.stem)&&!t.stem.endsWith('-questions'),t.stem);
  assert.ok(t.sections.length>=2,t.stem);
 }
 for(const stem of ['intent-statement','stakeholder-map']) assert.equal(templates.templates.find(t=>t.stem===stem).sections.at(-1).heading,'Assumptions & Open Questions');
 assert.ok(templates.templates.find(t=>t.stem==='build-and-test-summary').sections.some(s=>s.heading==='Target Verification Matrix'));
});
test('template files land in the AI-DLC team template folder with ## headings from the catalog',()=>{
 const files=templateFiles(templates);
 for(const [i,f] of files.entries()){
  assert.equal(f.path,`aidlc/spaces/default/memory/templates/${templates.templates[i].stem}.md`);
  const heads=[...f.content.matchAll(/^## (.+)$/gm)].map(m=>m[1]);
  assert.deepEqual(heads,templates.templates[i].sections.map(s=>s.heading));
 }
});
test('workspace package: kit + templates + gate documents, AGENTS.md points to them, PACKAGE.md lists every file',()=>{
 const files=buildWorkspace(sample,'typescript',ctx,{includeTemplates:true});
 const paths=new Set(files.map(f=>f.path));
 assert.equal(paths.size,files.length);
 for(const p of ['AGENTS.md','CLAUDE.md','vision.md','.mcp.json','PACKAGE.md','docs/aidlc/stage-gates.md','docs/trusted-ai/threat-model.md','docs/trusted-ai/control-register.md','docs/trusted-ai/cost-and-capacity.md','docs/trusted-ai/release-decision.md','aidlc/spaces/default/knowledge/aidlc-shared/technical-environment.md','aidlc/spaces/default/memory/templates/intent-statement.md']) assert.ok(paths.has(p),p);
 assert.ok(!paths.has('KIT.md'));
 assert.match(files.find(f=>f.path==='AGENTS.md').content,/## Plan documents/);
 const gates=files.find(f=>f.path==='docs/aidlc/stage-gates.md').content;
 for(const s of sample.stages.filter(s=>!s.id.startsWith('0.'))) assert.ok(gates.includes(`### ${s.id} `),s.id);
 for(const k of controls) assert.ok(gates.includes(`| ${k.id} `),k.id);
 const pkg=files.find(f=>f.path==='PACKAGE.md').content;
 for(const f of files) if(f.path!=='PACKAGE.md') assert.ok(pkg.includes(f.path),f.path);
 assert.match(files.find(f=>f.path==='docs/trusted-ai/release-decision.md').content,/MANAGE 1\.1/);
 const bytes=zip(files);assert.equal(new DataView(bytes.buffer).getUint16(bytes.length-22+10,true),files.length);
});
test('templates can be left out; Python package swaps the scaffold',()=>{
 const files=buildWorkspace(sample,'python',ctx,{includeTemplates:false});
 assert.ok(!files.some(f=>f.path.includes('/memory/templates/')));
 assert.ok(files.some(f=>f.path==='mcp/server.py')&&files.some(f=>f.path==='pyproject.toml'));
 assert.ok(!files.find(f=>f.path==='AGENTS.md').content.includes('memory/templates'));
});
test('every control is assigned to one AI-DLC gate phase',()=>{
 const phases=new Set(stages.phases.map(p=>p.name));
 for(const k of controls) assert.ok(phases.has(k.aidlcGatePhase),k.id);
});

test('gate catalog: AI-DLC gates cite v2.11.5 sources; stage-specific gates name real stages',()=>{
 for(const g of gates.filter(g=>g.kind==='aidlc')) assert.match(g.source,/aidlc-workflows\/blob\/v2\.11\.5\//,g.id);
 for(const g of gates) if(/^\d\.\d$/.test(g.appliesTo)) assert.ok(stages.stages.some(s=>s.id===g.appliesTo),g.id);
 for(const id of ['stage-approval','phase-ideation','phase-inception','phase-construction','plan-approval','unit-checkpoint','merge-gate','assumption-confirmation','release-decision']) assert.ok(gates.some(g=>g.id===id),id);
});
test('agent files: AGENTS.md explains how to work, reaches every package file and gate; CLAUDE.md names every skill',()=>{
 const files=buildWorkspace(sample,'python',ctx,{includeTemplates:true});
 const agents=files.find(f=>f.path==='AGENTS.md').content, claude=files.find(f=>f.path==='CLAUDE.md').content;
 assert.ok(agents.indexOf('## How to work in this repository')<agents.indexOf('## Build and test commands'));
 assert.match(agents,/never approve a gate/);
 for(const g of gates.filter(g=>g.kind==='aidlc')) assert.ok(agents.includes(g.name),g.name);
 for(const f of files.filter(f=>f.path.startsWith('.claude/skills/'))) {assert.ok(agents.includes(f.path),f.path); assert.ok(claude.includes(f.path.split('/')[2]),f.path);}
 for(const p of ['docs/aidlc/stage-gates.md','docs/trusted-ai/control-register.md','docs/trusted-ai/threat-model.md','docs/trusted-ai/release-decision.md','docs/trusted-ai/cost-and-capacity.md','aidlc/spaces/default/memory/templates/','.claude/agents/','vision.md']) assert.ok(agents.includes(p),p);
 assert.match(agents,/MUST validate the `Origin` header/);
 assert.match(agents,/### Node security attributes/);
 const gatesDoc=files.find(f=>f.path==='docs/aidlc/stage-gates.md').content;
 for(const g of gates) assert.ok(gatesDoc.includes(g.name),g.name);
 assert.match(gatesDoc,/Plan Approval \(Code Generation\)/);
});
test('MCP annotations follow the node security attributes',()=>{
 const files=buildWorkspace(sample,'typescript',ctx,{includeTemplates:false});
 const tools=JSON.parse(files.find(f=>f.path==='mcp/tools.json').content).tools;
 const pay=tools.find(t=>t.title==='Payment API'), fraud=tools.find(t=>t.title==='Fraud signal service');
 assert.deepEqual(pay.annotations,{readOnlyHint:false,destructiveHint:false,idempotentHint:true,openWorldHint:true});
 assert.deepEqual(fraud.annotations,{readOnlyHint:true,openWorldHint:true});
 assert.match(files.find(f=>f.path==='AGENTS.md').content,/retrieve credentials from the environment/);
});
