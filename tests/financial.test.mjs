import test from 'node:test';
import assert from 'node:assert/strict';
import { projectCosts } from '../src/lib/financial.ts';
const n={requestsPerDay:100,daysPerMonth:30,peakFactor:3,avgLatencySeconds:4,p95TargetSeconds:8,availabilityPct:99.9,rtoMinutes:60,rpoMinutes:15,agentCallsPerRequest:2,inputTokensPerCall:1000,outputTokensPerCall:500,retryPct:0,modelInputPricePerMillion:1,modelOutputPricePerMillion:2,retrievalCostPerRequest:.01,fixedInfrastructurePerMonth:100,storageGb:5,storagePriceGbMonth:1,humanReviewPct:10,humanReviewMinutes:2,reviewerHourlyCost:60,concurrencyHeadroom:2,region:'eu',residency:'eu',encryption:'yes',sensitiveData:'none',networkBoundary:'private',unitValueUsd:2};
test('cost formula is explainable and correct',()=>{
 const c=projectCosts(n);assert.equal(c.monthlyRequests,3000);assert.equal(c.inputTokens,6000000);assert.equal(c.outputTokens,3000000);
 assert.equal(c.modelCost,12);assert.equal(c.retrievalCost,30);assert.equal(c.storageCost,5);assert.equal(c.humanReviewCost,600);
 assert.equal(c.monthlyCost,747);assert.equal(c.annualCost,8964);
});
test('stress multiplier scales variable spending, not fixed infrastructure',()=>{
 const baseline=projectCosts(n), stressed=projectCosts(n,2);
 assert.equal(stressed.monthlyRequests,2*baseline.monthlyRequests);assert.equal(stressed.modelCost,2*baseline.modelCost);
 assert.equal(stressed.infrastructureCost,baseline.infrastructureCost);
});
test('no workload does not lead to NaN',()=>{
 const x=projectCosts({...n,requestsPerDay:0,modelInputPricePerMillion:0});assert.equal(x.costPer1000,0);
 assert.ok(x.assumptionWarnings.length>0);assert.ok(Number.isFinite(x.monthlyCost));
});
