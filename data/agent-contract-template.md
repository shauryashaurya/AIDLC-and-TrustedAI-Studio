# Agent / node contract — planning template

**Component name:**
**Accountable owner:**
**Primary pattern / runtime:**
**Authority classification:** read-only / advisory / reversible action / irreversible action

## Interface

- Input schema and trust origin:
- Output schema and invariants:
- RAG/knowledge sources and data ACL:
- Allowed tools, scopes, user/tenant identity:
- Delegation and A2A/MCP contracts:
- Persistent memory boundaries and retention:

## Safety & resilience

- Human approval point / escalation:
- Policy enforcement point / deny-by-default rule:
- Max steps / recursion limit:
- Max tokens / wall-time / spend:
- Retry + idempotency key:
- Compensation / rollback:
- Circuit breaker, fallback and terminal states:
- Timeout, error and dead-letter handling:

## Test evidence

- Golden positive task:
- Incorrect/ambiguous input:
- Prompt injection from untrusted retrieved/tool data:
- Unauthorized tool/data access:
- Double execution / lost acknowledgement:
- Timeout, stale memory, failed dependent service:
- Accuracy, safety, latency, costs and observability metrics:
- Independent evaluator, owner, date and artifact URL:
