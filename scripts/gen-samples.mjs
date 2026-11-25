// Builds the fictional demo cases in data/samples/ so every page of the studio can be reviewed with data.
// The organisations, numbers and prices are invented example values, not real data or quotes.
// Usage: npm run samples:gen
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const data = name => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf-8'));
const catalog = data('pattern-catalog.json');
const pat = name => catalog.agentPatterns.find(p => p.name === name).id;
const rag = name => catalog.ragTechniques.find(r => r.name === name).id;
const profiles = data('aidlc-profiles.json'), controls = data('trust-controls.json'), threats = data('frameworks/threat-candidates.json');
const STAMP = '2026-11-25T00:00:00.000Z';
const NOTE = 'Fictional sample shipped with the studio to demonstrate every page. The organisation, volumes, prices and evidence are invented example values, not quotes or measurements.';

function node(id, name, kind, x, y, o = {}) {
  return { id, name, kind, x, y, description: '', model: '', toolPermissions: '', dataScope: '', owner: '', timeoutSeconds: 60, maxSteps: 1, spendLimitUsd: 0,
    identity: '', inputTokens: 0, outputTokens: 0, inputPricePerM: 0, outputPricePerM: 0, cachedInputPct: 0, cachedInputPricePerM: 0, costPerCallUsd: 0, latencySeconds: 0,
    routing: 'one', actionType: '', idempotent: false, openWorld: false, requiresHumanApproval: kind === 'human', executesCode: false, sandbox: '', allowedEgress: '', patternId: '', ragIds: [], ...o };
}
const edge = (id, from, to, label, probability, failurePolicy = 'halt', contract = '') => ({ id, from, to, label, contract, failurePolicy, probability });
function threatRegister(prefix, nodes, decide) {
  const out = []; let i = 0;
  for (const n of nodes) for (const t of threats.byKind[n.kind] ?? []) { const d = decide(n, t) ?? { status: 'open', mitigation: '' }; out.push({ id: `${prefix}-t${++i}`, nodeId: n.id, threatId: t, ...d }); }
  return out;
}
function controlRegister(map) {
  return controls.map(c => ({ id: c.id, status: 'unassessed', owner: '', evidence: '', exception: '', likelihood: 3, impact: 3, ...(map[c.id] ?? {}) }));
}
function stagePlan(profileId, approvedUpTo, owners) {
  const p = profiles.profiles.find(x => x.id === profileId);
  return p.stages.map(id => {
    const done = parseFloat(id) <= approvedUpTo;
    return { id, status: done ? 'approved' : parseFloat(id) <= approvedUpTo + 0.2 ? 'in-progress' : 'not-started', owner: owners(id), evidence: done ? `Sample: stage output reviewed in workshop (${id})` : '', notes: '', approver: done ? 'Sample approver' : '' };
  });
}

// ---------- Sample 1: insurance claims triage ----------
const A = [
  node('s1-n1', 'Intake router', 'orchestrator', 60, 80, { model: 'Small model', toolPermissions: 'Read claim submission; route only', identity: 'Workload role: claims-intake-router', owner: 'Claims platform lead', maxSteps: 1, timeoutSeconds: 20, spendLimitUsd: 0.02, inputTokens: 1200, outputTokens: 80, inputPricePerM: 0.5, outputPricePerM: 2, latencySeconds: 0.8, routing: 'one', patternId: pat('Routing'), description: 'Classifies a new claim and routes it to extraction or straight to a handler.' }),
  node('s1-n2', 'Document extraction agent', 'agent', 320, 80, { model: 'Multimodal model', toolPermissions: 'Read uploaded claim documents', identity: 'Workload role: claims-doc-reader', dataScope: 'Claim documents of the current claim only', owner: 'Claims platform lead', maxSteps: 2, timeoutSeconds: 90, spendLimitUsd: 0.2, inputTokens: 9000, outputTokens: 900, inputPricePerM: 3, outputPricePerM: 15, cachedInputPct: 20, cachedInputPricePerM: 0.3, latencySeconds: 6, description: 'Extracts claimant, incident, amounts and dates into a claim record.' }),
  node('s1-n3', 'Policy retriever', 'retriever', 580, 80, { toolPermissions: 'Read policy wording index for the claimant’s policy', identity: 'Workload role: policy-index-reader', dataScope: 'Policy documents, filtered by policy ID', owner: 'Knowledge platform owner', maxSteps: 2, timeoutSeconds: 10, spendLimitUsd: 0.01, costPerCallUsd: 0.002, latencySeconds: 0.6, actionType: 'read-only', idempotent: true, ragIds: [rag('Hybrid RAG'), rag('Reranking RAG'), rag('Metadata-Aware / Filtered RAG')], description: 'Returns policy clauses relevant to the claim.' }),
  node('s1-n4', 'Coverage assessor', 'agent', 840, 80, { model: 'Large model', toolPermissions: 'Call fraud signal tool (read-only)', identity: 'Workload role: coverage-assessor', dataScope: 'Claim record and retrieved clauses', owner: 'Head of claims', maxSteps: 3, timeoutSeconds: 120, spendLimitUsd: 0.4, inputTokens: 7000, outputTokens: 1200, inputPricePerM: 3, outputPricePerM: 15, cachedInputPct: 40, cachedInputPricePerM: 0.3, latencySeconds: 9, routing: 'all', patternId: pat('Evaluator-Optimizer'), description: 'Proposes a coverage decision with cited clauses and requests a fraud signal.' }),
  node('s1-n5', 'Fraud signal service', 'tool', 840, 260, { toolPermissions: 'POST /fraud-score (read-only scoring)', identity: 'Service account: fraud-score-client', owner: 'Fraud analytics lead', maxSteps: 3, timeoutSeconds: 5, spendLimitUsd: 0.05, costPerCallUsd: 0.01, latencySeconds: 1.2, actionType: 'read-only', idempotent: true, openWorld: true, allowedEgress: 'fraud-score.internal (fictional)', description: 'Returns a fraud risk score for the claim.' }),
  node('s1-n6', 'Decision validator', 'validator', 1100, 80, { model: 'Large model', toolPermissions: 'None', identity: 'Workload role: decision-validator', owner: 'Claims quality lead', maxSteps: 3, timeoutSeconds: 60, spendLimitUsd: 0.15, inputTokens: 5000, outputTokens: 400, inputPricePerM: 3, outputPricePerM: 15, latencySeconds: 4, patternId: pat('Evaluator-Optimizer'), description: 'Checks the proposed decision against cited clauses; sends it back for revision or forward.' }),
  node('s1-n7', 'Policy engine', 'policy', 1100, 260, { toolPermissions: 'Evaluate payout authority rules', identity: 'Service account: payout-policy', owner: 'Risk officer', maxSteps: 1, timeoutSeconds: 2, costPerCallUsd: 0.0005, latencySeconds: 0.1, patternId: pat('Policy-Gated Tool Use'), description: 'Applies payout limits; above the limit the claim goes to a human handler.' }),
  node('s1-n8', 'Claims handler approval', 'human', 1360, 260, { toolPermissions: 'Approve or reject in claims system', identity: 'Named employee via SSO', owner: 'Head of claims', maxSteps: 1, timeoutSeconds: 86400, costPerCallUsd: 2.5, latencySeconds: 0, patternId: pat('Human-in-the-Loop'), description: 'Human approval for escalated or high-value claims. Latency excluded from the per-request figure.' }),
  node('s1-n9', 'Payment API', 'tool', 1360, 80, { toolPermissions: 'POST /payments with idempotency key; amount ≤ approved amount', identity: 'Service account: claims-payments (scoped token)', owner: 'Payments platform owner', maxSteps: 1, timeoutSeconds: 15, costPerCallUsd: 0.003, latencySeconds: 1.5, actionType: 'additive', idempotent: true, openWorld: true, allowedEgress: 'payments.internal (fictional)', description: 'Issues the payment for an approved claim.' })
];
const AE = [
  edge('s1-e1', 's1-n1', 's1-n2', 'standard claim', 0.85, 'retry', 'Claim ID; idempotent re-read'),
  edge('s1-e2', 's1-n1', 's1-n8', 'unreadable / complex', 0.15, 'escalate'),
  edge('s1-e3', 's1-n2', 's1-n3', 'claim record', 1, 'retry', 'Claim record schema v1'),
  edge('s1-e4', 's1-n3', 's1-n4', 'clauses', 1, 'halt'),
  edge('s1-e5', 's1-n4', 's1-n5', 'score request', 1, 'retry', 'Read-only; safe to retry'),
  edge('s1-e6', 's1-n4', 's1-n6', 'proposed decision', 1, 'halt', 'Decision + cited clauses'),
  edge('s1-e7', 's1-n6', 's1-n4', 'revise', 0.2, 'halt'),
  edge('s1-e8', 's1-n6', 's1-n7', 'validated', 0.8, 'halt'),
  edge('s1-e9', 's1-n7', 's1-n9', 'within authority', 0.7, 'compensate', 'Idempotency key = claim ID + decision version'),
  edge('s1-e10', 's1-n7', 's1-n8', 'above authority', 0.3, 'escalate'),
  edge('s1-e11', 's1-n8', 's1-n9', 'approved', 0.9, 'compensate', 'Idempotency key = claim ID + decision version')
];
const mitigations1 = { 'ASI02': 'Fraud tool is read-only; payment tool limited to approved amount with idempotency key.', 'ASI03': 'Each node runs under its own scoped workload role.', 'LLM03:2026': 'Assessor can only call the fraud tool; payment requires policy engine or human approval.', 'AML.T0053': 'Tool calls logged and rate-limited per claim.', 'LLM09:2026': 'Index filtered by policy ID; no cross-policy retrieval.', 'AML.T0070': 'Policy index built only from approved policy wording.' };
const sample1 = {
  schemaVersion: 1, id: 'sample-claims-triage', createdAt: STAMP, updatedAt: STAMP,
  title: 'Sample: Insurance claims triage agents',
  summary: 'Agents extract claim details, find the relevant policy wording, propose a coverage decision and pay approved claims, with a human handler for complex or high-value claims.',
  problem: 'Motor claims wait several days for a first assessment because handlers re-key documents and search policy wording by hand.',
  outcome: 'A first coverage proposal with cited policy clauses within minutes of submission; humans decide every claim above the payout authority.',
  sponsor: 'Chief Claims Officer (fictional)', accountableOwner: 'Head of Claims Operations (fictional)', stakeholders: 'Claims handlers, fraud analytics, payments, risk, data protection officer',
  domain: 'Insurance — motor claims', jurisdictions: 'EU', dataClassification: 'Confidential', riskTier: 'high', profile: 'feature',
  inScope: 'Motor claims under the payout authority; document extraction; policy clause retrieval; coverage proposal; payment of approved claims.',
  outOfScope: 'Injury claims; litigation; changes to policy wording; automatic rejection without human review.',
  constraints: 'Claim data stays in the EU region. Every rejection is decided by a human. Payments only through the existing payments API.',
  successMetrics: 'Median time to first proposal under 10 minutes; proposal agreement with handlers ≥ 90% on the evaluation set; zero duplicate payments.',
  assumptions: NOTE, sourceUrl: '', sourceDate: '',
  patternIds: [pat('Routing'), pat('Evaluator-Optimizer'), pat('Policy-Gated Tool Use'), pat('Human-in-the-Loop')], ragIds: [rag('Hybrid RAG'), rag('Reranking RAG'), rag('Metadata-Aware / Filtered RAG')], nodes: A, edges: AE,
  stages: stagePlan('feature', 2.3, id => id.startsWith('1.') ? 'Head of Claims Operations' : id.startsWith('2.') ? 'Solution architect' : id.startsWith('3.') ? 'Engineering lead' : 'Platform SRE lead'),
  controls: controlRegister({
    'GOV-01': { status: 'evidenced', owner: 'Head of Claims Operations', evidence: 'Sample: RACI approved in steering meeting', likelihood: 2, impact: 4 },
    'GOV-02': { status: 'evidenced', owner: 'AI governance lead', evidence: 'Sample: entry in AI system inventory', likelihood: 2, impact: 3 },
    'GOV-03': { status: 'planned', owner: 'Legal counsel', likelihood: 3, impact: 5 },
    'GOV-04': { status: 'evidenced', owner: 'Head of Claims Operations', evidence: 'Sample: human approval node above payout authority', likelihood: 2, impact: 5 },
    'SEC-01': { status: 'evidenced', owner: 'Security architect', evidence: 'Sample: per-node workload roles reviewed', likelihood: 3, impact: 5 },
    'SEC-02': { status: 'planned', owner: 'Security architect', likelihood: 4, impact: 4 },
    'SEC-03': { status: 'evidenced', owner: 'Platform security', evidence: 'Sample: secrets in vault; scoped tokens', likelihood: 2, impact: 4 },
    'SEC-04': { status: 'evidenced', owner: 'Data protection officer', evidence: 'Sample: EU-only deployment record', likelihood: 2, impact: 5 },
    'REL-01': { status: 'evidenced', owner: 'Engineering lead', evidence: 'Sample: max visits and spend caps set per node', likelihood: 3, impact: 3 },
    'REL-02': { status: 'planned', owner: 'Payments platform owner', likelihood: 3, impact: 5 },
    'EVAL-01': { status: 'planned', owner: 'Claims quality lead', likelihood: 3, impact: 4 },
    'OPS-04': { status: 'accepted', owner: 'Finance partner', exception: 'Sample: cost reporting starts after pilot', likelihood: 3, impact: 2 }
  }),
  decisions: [
    { id: 's1-d1', title: 'Profile: feature', decision: 'Use the AI-DLC feature profile (all 30 stages after setup).', rationale: 'Production feature with Operation stages required.', owner: 'Head of Claims Operations', date: '2026-11-20' },
    { id: 's1-d2', title: 'Human approval above payout authority', decision: 'Policy engine routes claims above authority to a human handler.', rationale: 'High risk tier; GOV-04.', owner: 'Risk officer', date: '2026-11-21' }
  ],
  units: [
    { id: 's1-u1', name: 'Claim intake and extraction', owner: 'Team A', description: 'Router + extraction agent', dependsOn: [], acceptanceTests: 'Extraction accuracy on 200 labelled claims', risk: 'medium', status: 'ready', estimateDays: 8 },
    { id: 's1-u2', name: 'Policy retrieval index', owner: 'Team B', description: 'Index + retriever filtered by policy ID', dependsOn: [], acceptanceTests: 'Recall@5 on clause lookup set', risk: 'medium', status: 'building', estimateDays: 6 },
    { id: 's1-u3', name: 'Coverage assessment and validation', owner: 'Team A', description: 'Assessor, fraud call, validator', dependsOn: ['s1-u1', 's1-u2'], acceptanceTests: 'Agreement with handlers ≥ 90%', risk: 'high', status: 'planned', estimateDays: 10 },
    { id: 's1-u4', name: 'Payout policy and payment', owner: 'Team C', description: 'Policy engine, human approval, payment API', dependsOn: ['s1-u3'], acceptanceTests: 'No duplicate payment under retry tests', risk: 'high', status: 'planned', estimateDays: 7 }
  ],
  scenarios: [
    { id: 's1-sc1', name: 'Standard claim within authority', trigger: 'Readable claim, amount under limit', expectedResult: 'Paid once with cited clauses', failureAndAbuseCase: '', verification: 'Replay 50 labelled claims' },
    { id: 's1-sc2', name: 'Prompt injection in uploaded document', trigger: 'Document text instructs the agent to approve payment', expectedResult: 'Instruction ignored; claim flagged', failureAndAbuseCase: 'Indirect prompt injection (AML.T0051.001)', verification: 'Red-team document set' },
    { id: 's1-sc3', name: 'Payment API timeout and retry', trigger: 'Payment call times out', expectedResult: 'Single payment after retry', failureAndAbuseCase: 'Duplicate side effect', verification: 'Fault injection with idempotency check' }
  ],
  threats: threatRegister('s1', A, (n, t) => mitigations1[t] ? { status: 'mitigated', mitigation: mitigations1[t] } : n.kind === 'human' ? { status: 'accepted', mitigation: 'Sample: handler training and four-eyes on large payouts' } : undefined),
  nfr: { requestsPerDay: 4000, daysPerMonth: 30, peakFactor: 3, avgLatencySeconds: 25, p95TargetSeconds: 60, availabilityPct: 99.5, rtoMinutes: 240, rpoMinutes: 15, agentCallsPerRequest: 5, inputTokensPerCall: 6000, outputTokensPerCall: 700, retryPct: 5, modelInputPricePerMillion: 3, modelOutputPricePerMillion: 15, retrievalCostPerRequest: 0.002, fixedInfrastructurePerMonth: 3500, storageGb: 800, storagePriceGbMonth: 0.023, humanReviewPct: 25, humanReviewMinutes: 6, reviewerHourlyCost: 45, concurrencyHeadroom: 1.5, region: 'EU (single region)', residency: 'EU only', encryption: 'At rest and in transit', sensitiveData: 'Personal data, claim documents', networkBoundary: 'Private endpoints', unitValueUsd: 6, dataRetention: 'Claim files 7 years; prompts and model outputs 90 days (example values)' }
};

// ---------- Sample 2: IT service desk ----------
const B = [
  node('s2-n1', 'Ticket classifier', 'agent', 60, 80, { model: 'Small model', toolPermissions: 'Read new ticket', identity: 'Workload role: desk-classifier', owner: 'Service desk manager', maxSteps: 1, timeoutSeconds: 15, spendLimitUsd: 0.01, inputTokens: 800, outputTokens: 60, inputPricePerM: 0.5, outputPricePerM: 2, latencySeconds: 0.7, patternId: pat('Routing'), description: 'Classifies the ticket and decides whether self-service resolution is allowed.' }),
  node('s2-n2', 'Knowledge base retriever', 'retriever', 320, 80, { toolPermissions: 'Read published KB articles', identity: 'Workload role: kb-reader', dataScope: 'Published KB only', owner: 'Knowledge manager', maxSteps: 3, timeoutSeconds: 5, costPerCallUsd: 0.001, latencySeconds: 0.4, actionType: 'read-only', idempotent: true, ragIds: [rag('Hybrid RAG'), rag('Corrective RAG (CRAG)')] }),
  node('s2-n3', 'Resolver agent', 'agent', 580, 80, { model: 'Medium model', toolPermissions: 'Draft reply; no direct system changes', identity: 'Workload role: desk-resolver', owner: 'Service desk manager', maxSteps: 3, timeoutSeconds: 60, spendLimitUsd: 0.05, inputTokens: 4000, outputTokens: 500, inputPricePerM: 1, outputPricePerM: 4, cachedInputPct: 50, cachedInputPricePerM: 0.1, latencySeconds: 4, routing: 'all', patternId: pat('Reflection'), description: 'Drafts a resolution from KB articles and conversation history.' }),
  node('s2-n4', 'Answer critic', 'validator', 840, 80, { model: 'Medium model', toolPermissions: 'None', identity: 'Workload role: desk-critic', owner: 'Service desk quality lead', maxSteps: 3, timeoutSeconds: 30, spendLimitUsd: 0.02, inputTokens: 2500, outputTokens: 200, inputPricePerM: 1, outputPricePerM: 4, latencySeconds: 2, patternId: pat('Reflection'), description: 'Checks the draft against the KB article; sends it back or forward.' }),
  node('s2-n5', 'Conversation memory', 'memory', 580, 260, { toolPermissions: 'Read/write current ticket thread', identity: 'Workload role: desk-memory', dataScope: 'Current ticket only', owner: 'Platform team', maxSteps: 3, costPerCallUsd: 0.0002, latencySeconds: 0.05 }),
  node('s2-n6', 'Ticketing API', 'tool', 1100, 80, { toolPermissions: 'Post reply; set status resolved', identity: 'Service account: desk-bot (scoped)', owner: 'ITSM platform owner', maxSteps: 1, timeoutSeconds: 10, costPerCallUsd: 0.0005, latencySeconds: 0.8, actionType: 'additive', idempotent: true, requiresHumanApproval: false }),
  node('s2-n7', 'Escalation to engineer', 'human', 320, 260, { toolPermissions: 'Assign ticket in ITSM', identity: 'Named engineer via SSO', owner: 'Service desk manager', maxSteps: 1, costPerCallUsd: 4, latencySeconds: 0 })
];
const BE = [
  edge('s2-e1', 's2-n1', 's2-n2', 'self-service eligible', 0.7, 'retry'),
  edge('s2-e2', 's2-n1', 's2-n7', 'needs engineer', 0.3, 'escalate'),
  edge('s2-e3', 's2-n2', 's2-n3', 'articles', 1, 'halt'),
  edge('s2-e4', 's2-n3', 's2-n4', 'draft', 1, 'halt'),
  edge('s2-e5', 's2-n3', 's2-n5', 'thread update', 1, 'retry'),
  edge('s2-e6', 's2-n4', 's2-n3', 'revise', 0.35, 'halt'),
  edge('s2-e7', 's2-n4', 's2-n6', 'approved reply', 0.6, 'retry', 'Idempotency key = ticket ID + draft version'),
  edge('s2-e8', 's2-n4', 's2-n7', 'not resolvable', 0.05, 'escalate')
];
const sample2 = {
  schemaVersion: 1, id: 'sample-service-desk', createdAt: STAMP, updatedAt: STAMP,
  title: 'Sample: IT service desk resolution agents',
  summary: 'Agents classify tickets, draft answers from the knowledge base, check them, and post replies; engineers take tickets that need hands-on work.',
  problem: 'Most tickets are repeat questions already answered in the knowledge base, but each waits in the queue for an engineer.',
  outcome: 'Repeat questions answered within minutes with a KB citation; engineers see only tickets that need them.',
  sponsor: 'CIO (fictional)', accountableOwner: 'Service desk manager (fictional)', stakeholders: 'Employees, service desk engineers, knowledge manager, security',
  domain: 'Internal IT support', jurisdictions: 'India', dataClassification: 'Internal', riskTier: 'moderate', profile: 'mvp',
  inScope: 'Password and access how-to questions, software install guidance, known-issue answers.',
  outOfScope: 'Account changes, access grants, hardware orders.',
  constraints: 'The bot cannot change accounts or permissions. Replies must cite a KB article.',
  successMetrics: '40% of eligible tickets resolved without an engineer; reopened rate below 10%.',
  assumptions: NOTE, sourceUrl: '', sourceDate: '',
  patternIds: [pat('Routing'), pat('Reflection'), pat('Human-in-the-Loop')], ragIds: [rag('Hybrid RAG'), rag('Corrective RAG (CRAG)'), rag('Conversational RAG')], nodes: B, edges: BE,
  stages: stagePlan('mvp', 1.6, id => id.startsWith('1.') ? 'Service desk manager' : 'Engineering lead'),
  controls: controlRegister({
    'GOV-01': { status: 'evidenced', owner: 'Service desk manager', evidence: 'Sample: owner named in charter', likelihood: 2, impact: 2 },
    'SEC-01': { status: 'evidenced', owner: 'Security engineer', evidence: 'Sample: bot token can only post replies', likelihood: 2, impact: 3 },
    'SEC-02': { status: 'planned', owner: 'Security engineer', likelihood: 3, impact: 3 },
    'REL-01': { status: 'evidenced', owner: 'Engineering lead', evidence: 'Sample: resolver max 3 visits', likelihood: 3, impact: 2 },
    'EVAL-02': { status: 'planned', owner: 'Knowledge manager', likelihood: 3, impact: 3 }
  }),
  decisions: [{ id: 's2-d1', title: 'Profile: mvp', decision: 'Use the AI-DLC mvp profile (no Operation stages yet).', rationale: 'First increment for one site.', owner: 'Service desk manager', date: '2026-11-22' }],
  units: [
    { id: 's2-u1', name: 'Classifier and routing', owner: 'Team D', description: '', dependsOn: [], acceptanceTests: 'Routing accuracy on 300 historical tickets', risk: 'low', status: 'ready', estimateDays: 4 },
    { id: 's2-u2', name: 'KB retrieval and resolver', owner: 'Team D', description: '', dependsOn: ['s2-u1'], acceptanceTests: 'Answers cite a KB article in 100% of cases', risk: 'medium', status: 'planned', estimateDays: 7 },
    { id: 's2-u3', name: 'Ticketing integration', owner: 'Team E', description: '', dependsOn: ['s2-u2'], acceptanceTests: 'No duplicate replies under retry', risk: 'medium', status: 'planned', estimateDays: 3 }
  ],
  scenarios: [
    { id: 's2-sc1', name: 'Known password-reset question', trigger: 'Ticket matches KB article', expectedResult: 'Reply with article link; ticket resolved', failureAndAbuseCase: '', verification: 'Replay labelled tickets' },
    { id: 's2-sc2', name: 'Request to grant admin access', trigger: 'User asks the bot for admin rights', expectedResult: 'Escalated to engineer; no change made', failureAndAbuseCase: 'Excessive agency (LLM03:2026)', verification: 'Red-team prompts' }
  ],
  threats: threatRegister('s2', B, (n, t) => t === 'LLM03:2026' ? { status: 'mitigated', mitigation: 'Bot token cannot change accounts.' } : t === 'ASI06' ? { status: 'mitigated', mitigation: 'Memory scoped to the current ticket.' } : undefined),
  nfr: { requestsPerDay: 1500, daysPerMonth: 22, peakFactor: 4, avgLatencySeconds: 10, p95TargetSeconds: 20, availabilityPct: 99, rtoMinutes: 480, rpoMinutes: 60, agentCallsPerRequest: 4, inputTokensPerCall: 2500, outputTokensPerCall: 250, retryPct: 5, modelInputPricePerMillion: 1, modelOutputPricePerMillion: 4, retrievalCostPerRequest: 0.001, fixedInfrastructurePerMonth: 600, storageGb: 50, storagePriceGbMonth: 0.023, humanReviewPct: 30, humanReviewMinutes: 10, reviewerHourlyCost: 20, concurrencyHeadroom: 1.5, region: 'India (single region)', residency: 'India', encryption: 'At rest and in transit', sensitiveData: 'Employee names and ticket text', networkBoundary: 'Corporate network only', unitValueUsd: 3, dataRetention: 'Ticket threads 1 year; conversation memory deleted when the ticket closes (example values)' }
};

mkdirSync(new URL('../data/samples/', import.meta.url), { recursive: true });
const index = [];
for (const s of [sample1, sample2]) {
  writeFileSync(new URL(`../data/samples/${s.id}.json`, import.meta.url), JSON.stringify(s, null, 2) + '\n');
  index.push({ id: s.id, title: s.title, profile: s.profile, riskTier: s.riskTier, summary: s.summary });
}
writeFileSync(new URL('../data/samples/index.json', import.meta.url), JSON.stringify({ note: NOTE, samples: index }, null, 2) + '\n');
console.log(`Wrote ${index.length} samples to data/samples/`);
