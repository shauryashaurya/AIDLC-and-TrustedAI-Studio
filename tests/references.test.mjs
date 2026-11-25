import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCitationIndex, filterReferences, referencesMarkdown, validateCatalog } from '../src/lib/references.ts';
const data=(name)=>JSON.parse(readFileSync(new URL(`../data/${name}`,import.meta.url),'utf-8'));
const catalog=data('references.json');
const controls=data('trust-controls.json');
const stages=data('aidlc-stages.json');

test('reference catalog passes all integrity rules',()=>{
 assert.deepEqual(validateCatalog(catalog,controls,stages.stages),[]);
});
test('legacy reference ids are preserved for existing links',()=>{
 const ids=new Set(catalog.references.map(r=>r.id));
 for(const id of ['aws','aws-guide','aws-samples','aws-collab','nist','nist-gen','iso','eu','owasp-llm','owasp-agent','owasp-aisvs','mcp','a2a','atlas','dora','rag-ref']) assert.ok(ids.has(id),id);
});
test('entries carry only source statements, app usage and verification facts (no editorial fields)',()=>{
 const allowed=new Set(['id','title','publisher','domain','type','version','publishedDate','verifiedOn','url','pinnedUrl','access','license','summary','usedIn','verificationNotes','citedBy','status']);
 for(const r of catalog.references) for(const k of Object.keys(r)) assert.ok(allowed.has(k),`${r.id} has unexpected field ${k}`);
 assert.equal(catalog.authorityLevels,undefined);
});
test('unverified entries have no verification date and say why',()=>{
 const unverified=catalog.references.filter(r=>r.status==='unverified');
 assert.ok(unverified.length>=5);
 for(const r of unverified){assert.equal(r.verifiedOn,null,r.id);assert.ok(r.verificationNotes.length>10,r.id);}
});
test('AI-DLC upstream is pinned to one release tag across stages, profiles, agents and references',()=>{
 const tag=stages.upstream.tag;
 assert.match(tag,/^v\d+\.\d+\.\d+$/);
 assert.equal(data('aidlc-profiles.json').tag,tag);
 assert.equal(data('aidlc-agents.json').tag,tag);
 const aws=catalog.references.find(r=>r.id==='aws');
 assert.equal(aws.version,tag);
 assert.ok(aws.pinnedUrl.endsWith(tag));
 for(const r of catalog.references.filter(r=>r.domain==='aidlc'&&r.id!=='aws')) assert.ok(r.pinnedUrl.includes(`/${tag}/`),r.id);
});
test('integrity rules catch broken references',()=>{
 const broken=structuredClone(catalog);
 broken.references[0].type='Gospel';
 broken.references.push({...broken.references[1]});
 const problems=validateCatalog(broken,[{id:'X-1',name:'x',referenceIds:['nope']}],stages.stages);
 assert.ok(problems.some(p=>p.includes("type 'Gospel'")));
 assert.ok(problems.some(p=>p.includes('duplicate id')));
 assert.ok(problems.some(p=>p.includes("unknown reference 'nope'")));
});
test('citation index merges control referenceIds and declared stages',()=>{
 const index=buildCitationIndex(catalog,controls,stages.stages);
 assert.ok(index.get('nist').controls.length>=5);
 assert.ok(index.get('focus').controls.some(c=>c.id==='OPS-04'));
 assert.ok(index.get('sre-slo').stages.some(s=>s.id==='3.2'));
});
test('filters by domain, type, text and superseded status',()=>{
 const refs=catalog.references;
 assert.ok(filterReferences(refs,{domain:'finops'}).every(r=>r.domain==='finops'));
 assert.ok(filterReferences(refs,{type:'Protocol specification'}).every(r=>r.type==='Protocol specification'));
 assert.ok(filterReferences(refs,{query:'ASI01'}).some(r=>r.id==='owasp-agent'));
 assert.ok(!filterReferences(refs,{includeSuperseded:false}).some(r=>r.status==='superseded'));
});
test('data/references.md is generated from the JSON and up to date',()=>{
 const md=readFileSync(new URL('../data/references.md',import.meta.url),'utf-8').replace(/\r\n/g,'\n');
 assert.equal(md,referencesMarkdown(catalog,controls,stages.stages),'Run npm run docs:gen');
 assert.match(md,/loaded on demand only/);
});
test('every control named in a usedIn sentence actually cites that reference',()=>{
 for(const r of catalog.references) for(const id of r.usedIn.match(/\b[A-Z]{3,4}-\d{2}\b/g)??[]){
  const c=controls.find(x=>x.id===id);
  assert.ok(c,`${r.id}: unknown control ${id}`);
  assert.ok(c.referenceIds.includes(r.id),`${r.id} says it is cited by ${id}, but ${id} does not cite it`);
 }
});
