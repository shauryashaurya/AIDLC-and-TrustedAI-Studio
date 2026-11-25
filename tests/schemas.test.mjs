import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
const data=(name)=>JSON.parse(readFileSync(new URL(`../data/${name}`,import.meta.url),'utf-8'));
const ajv=new Ajv2020({allErrors:true,strict:false});
let caseValidator;const caseSchema=()=>caseValidator??=ajv.compile(data('schemas/use-case.schema.json'));

test('references.json matches references.schema.json',()=>{
 const validate=ajv.compile(data('schemas/references.schema.json'));
 assert.ok(validate(data('references.json')),JSON.stringify(validate.errors?.slice(0,3)));
});

const baseCase=()=>({schemaVersion:1,id:'c1',title:'t',createdAt:'x',updatedAt:'x',summary:'',problem:'',outcome:'',sponsor:'',accountableOwner:'',stakeholders:'',domain:'',jurisdictions:'',dataClassification:'Internal',riskTier:'moderate',profile:'classic',inScope:'',outOfScope:'',constraints:'',successMetrics:'',assumptions:'',sourceUrl:'',sourceDate:'',
 patternIds:[],ragIds:[],nodes:[{id:'n1',name:'Agent',kind:'agent',x:0,y:0,maxSteps:3,timeoutSeconds:60,spendLimitUsd:0}],edges:[],stages:[{id:'1.1',status:'not-started'}],controls:[{id:'GOV-01',status:'unassessed',likelihood:3,impact:4}],decisions:[],units:[],scenarios:[],
 nfr:{requestsPerDay:0,peakFactor:1,agentCallsPerRequest:0,modelInputPricePerMillion:0,modelOutputPricePerMillion:0}});

test('use-case schema accepts a case saved before the new fields existed, and the new fields',()=>{
 const validate=caseSchema();
 assert.ok(validate(baseCase()),JSON.stringify(validate.errors));
 const c=baseCase();Object.assign(c.nodes[0],{identity:'role/x',inputTokens:10,routing:'all',cachedInputPct:20});
 c.edges=[{id:'e',from:'n1',to:'n1',failurePolicy:'halt',probability:0.5}];
 c.threats=[{id:'t',nodeId:'n1',threatId:'ASI01',status:'open',mitigation:''}];
 assert.ok(validate(c),JSON.stringify(validate.errors));
});
test('use-case schema rejects bad enums, probabilities and wrong schemaVersion',()=>{
 const validate=caseSchema();
 const a=baseCase();a.edges=[{id:'e',from:'n1',to:'n1',failurePolicy:'halt',probability:2}];assert.ok(!validate(a));
 const b=baseCase();b.nodes[0].kind='wizard';assert.ok(!validate(b));
 const c=baseCase();c.schemaVersion=2;assert.ok(!validate(c));
 const d=baseCase();d.stages=[{id:'1.1',status:'done'}];assert.ok(!validate(d));
});
