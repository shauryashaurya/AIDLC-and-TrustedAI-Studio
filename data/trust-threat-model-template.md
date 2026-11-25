# Threat-model worksheet — complex enterprise agentic initiative

## Assets & boundaries

List users, agent identities, service accounts, data sources, retrieved content, memory, MCP/A2A endpoints, sensitive tools, logs, outputs, and human approval surface. Map all boundaries where instructions/data cross trust levels.

## Abuse cases

| Threat | Entry point | Asset | Exposure | Preventive control | Detection/evidence | Residual risk owner |
|---|---|---|---|---|---|---|
| Prompt injection | Untrusted documents or tool output | Agent instruction hierarchy | Workflow hijacking | Authority isolation and structured tool permissions | Adversarial eval report | |
| Cross-tenant retrieval | Index ACL mismatch | Confidential data | Data leak | ACL prefilter and tenant scoping | Access-control test | |
| Tool privilege escalation | MCP tool manifest or API | Write-capable systems | Unauthorized change | Scoped token and policy gate | Policy decision log | |
| Loop amplification | Planner feedback cycle | Budget, systems | Cost, outages | Max steps, deadline, cost ceiling | Budget and loop telemetry | |
| Memory poisoning | Persistent agent memory | Future decisions | Contaminated tasks | Quarantine/provenance and write controls | Memory audit | |
| Duplicate side effect | Retries and parallel agents | Payment, ticket, workflow | Duplicate transaction | Idempotency and compensation | Integration chaos test | |
| Human approval spoofing | UI or webhook | Privileged action | Unapproved execution | Strong identity, signed audit | Approval service evidence | |
| Evidence laundering | AI-generated compliance report | Risk decision | False confidence | Independent reviewer and artifact check | Traceable assessment | |

## Risk acceptance record

Owner, impact, likelihood, conditions, time-bounded exceptions, compensating controls, independent risk review, evidence and expiry date.
