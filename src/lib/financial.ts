import type { NfrModel } from './types';
export interface CostProjection {
  monthlyRequests: number; peakRps: number; suggestedConcurrency: number; inputTokens: number; outputTokens: number;
  modelCost: number; retrievalCost: number; infrastructureCost: number; storageCost: number; humanReviewCost: number;
  monthlyCost: number; annualCost: number; costPer1000: number; monthlyValue: number; netValue: number;
  assumptionWarnings: string[];
}
const finite = (n: number) => Number.isFinite(n) ? Math.max(0,n) : 0;
/** Transparent scenario approximation; prices are user inputs, never fetched provider quotes. */
export function projectCosts(n: NfrModel, stressFactor=1): CostProjection {
  const monthlyRequests=finite(n.requestsPerDay)*finite(n.daysPerMonth || 30)*finite(stressFactor);
  const peakRps=finite(n.requestsPerDay)*finite(n.peakFactor)/(24*60*60)*finite(stressFactor);
  const suggestedConcurrency=Math.ceil(peakRps*finite(n.avgLatencySeconds)*finite(n.concurrencyHeadroom || 1));
  const calls=finite(n.agentCallsPerRequest)*(1+finite(n.retryPct)/100);
  const inputTokens=monthlyRequests*calls*finite(n.inputTokensPerCall);
  const outputTokens=monthlyRequests*calls*finite(n.outputTokensPerCall);
  const modelCost=(inputTokens*finite(n.modelInputPricePerMillion)+outputTokens*finite(n.modelOutputPricePerMillion))/1000000;
  const retrievalCost=monthlyRequests*finite(n.retrievalCostPerRequest);
  const infrastructureCost=finite(n.fixedInfrastructurePerMonth);
  const storageCost=finite(n.storageGb)*finite(n.storagePriceGbMonth);
  const humanReviewCost=monthlyRequests*(finite(n.humanReviewPct)/100)*(finite(n.humanReviewMinutes)/60)*finite(n.reviewerHourlyCost);
  const monthlyCost=modelCost+retrievalCost+infrastructureCost+storageCost+humanReviewCost;
  const monthlyValue=monthlyRequests*finite(n.unitValueUsd);
  const assumptionWarnings:string[]=[];
  if(n.requestsPerDay<=0) assumptionWarnings.push('Volume is not specified.');
  if(n.agentCallsPerRequest<=0) assumptionWarnings.push('Agent/model calls per request are not specified.');
  if(n.modelInputPricePerMillion<=0 || n.modelOutputPricePerMillion<=0) assumptionWarnings.push('Model unit rates are missing or zero: obtain current supplier quotes.');
  if(n.availabilityPct<=0 || n.p95TargetSeconds<=0) assumptionWarnings.push('Availability and P95 latency SLOs need owners.');
  if(n.rtoMinutes<=0 || n.rpoMinutes<=0) assumptionWarnings.push('RTO/RPO must be explicitly assessed; zero may be intentional.');
  return {monthlyRequests,peakRps,suggestedConcurrency,inputTokens,outputTokens,modelCost,retrievalCost,infrastructureCost,storageCost,humanReviewCost,monthlyCost,annualCost:monthlyCost*12,costPer1000:monthlyRequests?monthlyCost*1000/monthlyRequests:0,monthlyValue,netValue:monthlyValue-monthlyCost,assumptionWarnings};
}
export const usd = (n:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n);
export const integer = (n:number) => new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n);
