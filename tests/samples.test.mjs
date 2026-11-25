import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import { simulate } from '../src/lib/simulation.ts';
import { stagesForProfile } from '../src/lib/aidlc.ts';
const data=(name)=>JSON.parse(readFileSync(new URL(`../data/${name}`,import.meta.url),'utf-8'));
const index=data('samples/index.json');
const validate=new Ajv2020({allErrors:true,strict:false}).compile(data('schemas/use-case.schema.json'));
const fw=new Set([...data('frameworks/owasp-asi-2026.json').items,...data('frameworks/owasp-llm-2026.json').items,...data('frameworks/atlas-techniques.json').items].map(i=>i.id));

test('samples are marked fictional and cover every page',()=>{
 assert.ok(index.samples.length>=2);
 assert.match(index.note,/Fictional/);
 for(const s of index.samples){
  const c=data(`samples/${s.id}.json`);
  assert.ok(c.title.startsWith('Sample:'),c.id);
  assert.match(c.assumptions,/Fictional/);
  assert.ok(validate(c),JSON.stringify(validate.errors));
  const ids=new Set(c.nodes.map(n=>n.id));
  for(const e of c.edges){assert.ok(ids.has(e.from)&&ids.has(e.to),e.id);}
  for(const t of c.threats){assert.ok(ids.has(t.nodeId));assert.ok(fw.has(t.threatId),t.threatId);}
  for(const u of c.units) for(const d of u.dependsOn) assert.ok(c.units.some(x=>x.id===d));
  assert.deepEqual(c.stages.map(x=>x.id),stagesForProfile(data('aidlc-profiles.json'),data('aidlc-stages.json').stages,c.profile));
  assert.equal(c.controls.length,data("trust-controls.json").length);
  assert.ok(c.nodes.length&&c.edges.length&&c.units.length&&c.decisions.length&&c.scenarios.length&&c.nfr.requestsPerDay>0);
  const sim=simulate(c.nodes,c.edges,{runs:500});
  assert.ok(sim.cost.mean>0&&sim.latency.p95>0,c.id);
 }
});
