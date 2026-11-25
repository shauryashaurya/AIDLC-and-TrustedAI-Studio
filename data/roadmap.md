# Roadmap

## Done (25 November 2026)

R1 References, R2 AI-DLC fidelity, R3 Workshop, R4 Trusted AI operations, R5 engineering. Details in `data/DELIVERY.md`.

## Next

### Content to verify or add
- Confirm the four ISO/IEC entries and the OpenTelemetry GenAI conventions by hand (automated checks could not reach them).
- Read AI-DLC guide chapters not yet used (16 worked examples, glossary, 07 interaction modes, 09 rules and learning loop) and add what the workshop needs.
- Decide whether to keep, rewrite with sources, or delete the two documents in `data/archive/`, and `data/product-spec.md`.
- Re-check every reference before each workshop delivery and bump `catalogVersion`. When AI-DLC publishes a new tag, update the three `data/aidlc-*.json` files; tests will flag count mismatches.
- Have a domain owner review the studio's mappings (control → framework IDs, node kind → threats).

### Workshop
- Facilitator agenda builder: choose modules and a start time, print a schedule.
- Capstone use cases written and approved by the workshop owner, to replace or add to the two fictional demo samples.
- Export workshop progress and checkpoint scores for a facilitator.

### Modelling
- Queueing and rate limits in the simulation; correlated failures; retries driven by edge failure policy.
- Map simulation output to FOCUS 1.4 columns so estimates can be compared with billing data.
- Per-edge latency and payload size; egress.

### Templates and package
- Templates for the remaining artifacts once their sections are confirmed with the AI-DLC maintainers (machine-checked artifacts must keep their blocks).
- Re-run the template extraction when a new AI-DLC tag ships and diff the headings.

### Implementation kit
- Let the user define tool input fields and MCP annotations per tool node, so the kit's schemas are complete.
- Optional test scaffolds per Unit (node test / pytest) from acceptance tests.

### Engineering
- The production bundle is 561 kB (166 kB gzipped) because all catalogs, samples and Ajv load up front; split by page if load time matters.
- Graph editor improvements: keyboard editing, zoom/pan, edge handles.
- Backend for shared cases, authentication and roles, signed approvals and an audit trail (only if the workshop needs multi-user work).

## Non-goals

Running AI-DLC or agents from the studio, live price feeds, compliance certification.
