import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildKit, slugify, toolNames } from '../src/lib/kit.ts';
import { crc32, zip } from '../src/lib/zip.ts';
import { nextActions, pageSignificance } from '../src/lib/guidance.ts';
const data=(name)=>JSON.parse(readFileSync(new URL(`../data/${name}`,import.meta.url),'utf-8'));
const frameworks={rmf:data('frameworks/nist-ai-rmf-1.0-subcategories.json'),llm:data('frameworks/owasp-llm-2026.json'),asi:data('frameworks/owasp-asi-2026.json'),atlas:data('frameworks/atlas-techniques.json')};
const controls=data('trust-controls.json');
const ctx={stages:data('aidlc-stages.json'),profiles:data('aidlc-profiles.json'),frameworks,controls,patterns:data('pattern-catalog.json'),date:'2026-11-25'};
const sample=data('samples/sample-claims-triage.json');
const file=(files,p)=>files.find(f=>f.path===p);

test('TypeScript kit: CLAUDE.md imports AGENTS.md; skills, subagents and MCP files follow the documented layout',()=>{
 const files=buildKit(sample,'typescript',ctx);
 assert.ok(file(files,'CLAUDE.md').content.startsWith('@AGENTS.md'));
 const agents=file(files,'AGENTS.md').content;
 for(const h of ['## Project overview','## Build and test commands','## Code style guidelines','## Testing instructions','## Security considerations']) assert.ok(agents.includes(h),h);
 const skills=files.filter(f=>/^\.claude\/skills\/[^/]+\/SKILL\.md$/.test(f.path));
 assert.equal(skills.length,5);
 for(const s of skills){assert.match(s.content,/^---\nname: [a-z0-9-]+\ndescription: ".+"\n---/);assert.ok(s.path.includes(s.content.split('\n')[1].slice(6)));}
 const subagents=files.filter(f=>f.path.startsWith('.claude/agents/'));
 assert.equal(subagents.length,sample.nodes.filter(n=>['agent','orchestrator','validator'].includes(n.kind)).length);
 for(const a of subagents) assert.match(a.content,/^---\nname: [a-z0-9-]+\ndescription: ".+"\n---/);
 const mcp=JSON.parse(file(files,'.mcp.json').content);
 const server=Object.values(mcp.mcpServers)[0];
 assert.equal(server.type,'stdio');assert.equal(server.command,'npx');
 const tools=JSON.parse(file(files,'mcp/tools.json').content).tools;
 assert.equal(tools.length,sample.nodes.filter(n=>n.kind==='tool').length);
 for(const t of tools){assert.match(t.name,/^[a-z0-9_]+$/);assert.equal(t.inputSchema.type,'object');}
 const ts=file(files,'mcp/server.ts').content;
 assert.ok(ts.includes("from '@modelcontextprotocol/server'")&&ts.includes("from '@modelcontextprotocol/server/stdio'")&&ts.includes('server.registerTool('));
 for(const t of tools) assert.ok(ts.includes(`'${t.name}'`));
 assert.equal(JSON.parse(file(files,'package.json').content).dependencies['@modelcontextprotocol/server'],'^2.4.0');
 assert.ok(file(files,'vision.md')&&file(files,'aidlc/spaces/default/knowledge/aidlc-shared/technical-environment.md')&&file(files,'KIT.md'));
});
test('Python kit: MCPServer scaffold, HTTP entry with a URL variable, pyproject',()=>{
 const files=buildKit(sample,'python',ctx);
 const py=file(files,'mcp/server.py').content;
 assert.ok(py.startsWith('from mcp.server import MCPServer'));
 assert.equal((py.match(/@mcp\.tool\(\)/g)||[]).length,sample.nodes.filter(n=>n.kind==='tool').length);
 const server=Object.values(JSON.parse(file(files,'.mcp.json').content).mcpServers)[0];
 assert.equal(server.type,'http');assert.match(server.url,/^\$\{[A-Z0-9_]+\}$/);
 assert.match(file(files,'pyproject.toml').content,/requires-python = ">=3\.11"/);
 assert.ok(!file(files,'package.json')&&!file(files,'mcp/server.ts'));
});
test('kit without tool nodes has no MCP files; names are unique',()=>{
 const c=structuredClone(sample);c.nodes=c.nodes.filter(n=>n.kind!=='tool');
 const files=buildKit(c,'typescript',ctx);
 assert.ok(!file(files,'.mcp.json')&&!file(files,'mcp/server.ts'));
 assert.equal(new Set(files.map(f=>f.path)).size,files.length);
 const names=toolNames([{id:'a',name:'Pay API',kind:'tool'},{id:'b',name:'Pay-API',kind:'tool'}]);
 assert.deepEqual([...names.values()],['pay_api','pay_api_2']);
 assert.equal(slugify('Sample: Claims triage!'),'sample-claims-triage');
});
test('zip writer produces a valid archive',()=>{
 assert.equal(crc32(new TextEncoder().encode('hello')),0x3610a686);
 const bytes=zip([{path:'a.txt',content:'hello'},{path:'dir/b.md',content:'# hi'}]);
 const v=new DataView(bytes.buffer);
 assert.equal(v.getUint32(0,true),0x04034b50);
 const end=bytes.length-22;
 assert.equal(v.getUint32(end,true),0x06054b50);
 assert.equal(v.getUint16(end+10,true),2);
 const cdOffset=v.getUint32(end+16,true);
 assert.equal(v.getUint32(cdOffset,true),0x02014b50);
});
test('next actions: grounded reasons, empty case first, export last',()=>{
 const g={stages:ctx.stages,frameworks,criticalControlIds:controls.filter(c=>c.critical).map(c=>c.id)};
 const none=nextActions(null,g);
 assert.equal(none.length,1);assert.match(none[0].why,/1\.1 Intent Capture/);
 const steps=nextActions(sample,g);
 assert.equal(steps.at(-1).id,'export');
 for(const s of steps) assert.ok(s.why.length>10,s.id);
 const owner=nextActions({...sample,accountableOwner:''},g).find(s=>s.id==='owner');
 assert.ok(owner.why.includes(frameworks.rmf.subcategories.find(x=>x.id==='GOVERN 2.1').text));
 for(const p of ['home','workshop','discover','ideate','patterns','nfr','trust','lifecycle','reports','references']) assert.ok(pageSignificance(p,g).length>10,p);
});

test('selected agent patterns and RAG techniques are exported with their details and the nodes that implement them',()=>{
 const files=buildKit(sample,'typescript',ctx);
 const patterns=data('pattern-catalog.json');
 const arch=file(files,'docs/architecture/architecture.md').content;
 assert.ok(arch.includes('```mermaid'));
 assert.ok(file(files,'docs/architecture/agent-graph.mmd').content.startsWith('flowchart LR'));
 for(const id of sample.patternIds){const p=patterns.agentPatterns.find(x=>x.id===id);assert.ok(arch.includes(`### ${p.name}`),p.name);for(const q of p.controlQuestions) assert.ok(arch.includes(q));}
 for(const id of sample.ragIds){const r=patterns.ragTechniques.find(x=>x.id===id);assert.ok(arch.includes(r.name),r.name);}
 const skill=files.find(f=>f.path.endsWith('-retrieval/SKILL.md')).content;
 assert.match(skill,/Policy retriever/);assert.match(skill,/Production checklist/);assert.match(skill,/SEC-05/);
 const ap=files.find(f=>f.path.endsWith('-architecture-patterns/SKILL.md')).content;
 assert.match(ap,/Evaluator-Optimizer/);assert.match(ap,/Coverage assessor/);
 const agents=file(files,'AGENTS.md').content;
 assert.match(agents,/## Architecture patterns and retrieval/);
 assert.match(agents,/\| Policy retriever \| retriever \| — \| Hybrid RAG, Reranking RAG/);
 const skillsIndex=file(files,'SKILLS.md').content;
 for(const f of files.filter(f=>f.path.startsWith('.claude/skills/'))) assert.ok(skillsIndex.includes(f.path),f.path);
 assert.match(file(files,'.claude/agents/coverage-assessor.md').content,/Pattern: Evaluator-Optimizer/);
});
test('no patterns or RAG selected: no pattern/retrieval skills, sections say so',()=>{
 const c=structuredClone(sample);c.patternIds=[];c.ragIds=[];c.nodes=c.nodes.filter(n=>n.kind!=='retriever').map(n=>({...n,patternId:'',ragIds:[]}));
 const files=buildKit(c,'typescript',ctx);
 assert.ok(!files.some(f=>f.path.includes('-architecture-patterns/')||f.path.includes('-retrieval/')));
 assert.match(file(files,'AGENTS.md').content,/_No agent patterns selected in the plan._/);
});
