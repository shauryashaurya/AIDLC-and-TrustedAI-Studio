// Error-budget arithmetic for an availability SLO (budget = 1 − SLO over the window).

export interface ErrorBudget { budgetFraction: number; allowedDowntimeMinutes: number; allowedFailedRequests: number; windowMinutes: number }

export function errorBudget(availabilityPct: number, windowDays: number, requestsInWindow: number): ErrorBudget {
  const slo = Math.min(Math.max(availabilityPct || 0, 0), 100) / 100;
  const budgetFraction = 1 - slo;
  const windowMinutes = Math.max(windowDays || 0, 0) * 24 * 60;
  return { budgetFraction, windowMinutes, allowedDowntimeMinutes: budgetFraction * windowMinutes, allowedFailedRequests: budgetFraction * Math.max(requestsInWindow || 0, 0) };
}

/** Compares a P95 latency (e.g. from the graph simulation) with the P95 target. */
export function latencyCheck(p95Seconds: number, targetSeconds: number): 'no-target' | 'within' | 'exceeds' {
  if (!targetSeconds || targetSeconds <= 0) return 'no-target';
  return p95Seconds <= targetSeconds ? 'within' : 'exceeds';
}
