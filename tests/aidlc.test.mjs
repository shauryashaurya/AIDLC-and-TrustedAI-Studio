import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { agentRolesForStage, compareWithProfile, skippedByProfile, stagesForProfile } from '../src/lib/aidlc.ts';
const data=(name)=>JSON.parse(readFileSync(new URL(`../data/${name}`,import.meta.url),'utf-8'));
const sc=data('aidlc-stages.json'), pc=data('aidlc-profiles.json'), ac=data('aidlc-agents.json');

test('33 stages in 5 phases with the documented counts and modes',()=>{
 assert.equal(sc.stages.length,33);
 assert.deepEqual(sc.phases.map(p=>sc.stages.filter(s=>s.phase===p.name).length),[3,7,9,7,7]);
 const modes=s=>sc.stages.filter(x=>x.mode===s).map(x=>x.id);
 assert.deepEqual(modes('subagent'),['2.2','3.5']);
 assert.deepEqual(modes('pipeline'),['2.1']);
 assert.deepEqual(modes('mob'),['2.4']);
 assert.equal(sc.stages.filter(s=>s.mode.startsWith('inline')).length,29);
});
test('only Initialization stages have no approval gate',()=>{
 assert.deepEqual(sc.stages.filter(s=>!s.gate).map(s=>s.id),['0.1','0.2','0.3']);
});
test('stages 3.1–3.5 are per Unit',()=>{
 assert.deepEqual(sc.stages.filter(s=>s.perUnit).map(s=>s.id),['3.1','3.2','3.3','3.4','3.5']);
});
test('stage leads and slugs agree with the agents chapter',()=>{
 const agentIds=new Set(ac.agents.map(a=>a.id));
 for(const s of sc.stages){
  if(s.lead==='orchestrator')continue;
  assert.ok(agentIds.has(s.lead),`${s.id} lead ${s.lead}`);
  for(const x of s.support) assert.ok(agentIds.has(x),`${s.id} support ${x}`);
 }
 const slugs=new Set(sc.stages.map(s=>s.slug).filter(Boolean));
 for(const a of ac.agents) for(const slug of [...a.leads,...a.supports,...a.reviews]) assert.ok(slugs.has(slug),`${a.id}: ${slug}`);
 assert.equal(ac.agents.length,14);
 assert.equal(ac.agents.filter(a=>a.kind==='domain').length,11);
 // The agents chapter's "leads" lists agree with the phases chapter's lead agent for every stage.
 for(const s of sc.stages.filter(s=>s.slug)){
  const leads=agentRolesForStage(ac,s).filter(r=>r.role==='leads').map(r=>r.agent);
  assert.ok(leads.includes(s.lead),`${s.id} ${s.slug}: ${leads.join(',')} vs ${s.lead}`);
 }
});
test('every profile stage count equals the count the guide states',()=>{
 assert.equal(pc.profiles.length,11);
 for(const p of pc.profiles){
  const n=stagesForProfile(pc,sc.stages,p.id).filter(id=>!id.startsWith('0.')).length;
  assert.equal(`${n}/30`,p.statedCount,p.id);
 }
 assert.equal(pc.profiles.filter(p=>p.default).map(p=>p.id).join(),'classic');
});
test('profile facts from the guide',()=>{
 assert.deepEqual(stagesForProfile(pc,sc.stages,'poc').filter(id=>!id.startsWith('0.')),['1.1','2.1','2.3','3.5','3.6']);
 assert.ok(skippedByProfile(pc,sc.stages,'workshop').every(id=>id.startsWith('1.')));
 for(const id of ['classic','mvp','poc']) assert.ok(!stagesForProfile(pc,sc.stages,id).some(s=>s.startsWith('4.')),`${id} runs no Operation stage`);
 assert.deepEqual(stagesForProfile(pc,sc.stages,'nope'),[]);
});
test('compareWithProfile reports missing and extra stages',()=>{
 const r=compareWithProfile(pc,sc.stages,'poc',['0.1','0.2','0.3','1.1','4.4']);
 assert.deepEqual(r.missing,['2.1','2.3','3.5','3.6']);
 assert.deepEqual(r.extra,['4.4']);
});
test('data/aidlc-stage-guide.md is generated from the catalogs and up to date',async()=>{
 const { stageGuideMarkdown }=await import('../src/lib/aidlc.ts');
 const md=readFileSync(new URL('../data/aidlc-stage-guide.md',import.meta.url),'utf-8').replace(/\r\n/g,'\n');
 assert.equal(md,stageGuideMarkdown(sc,pc,ac),'Run npm run docs:gen');
});
