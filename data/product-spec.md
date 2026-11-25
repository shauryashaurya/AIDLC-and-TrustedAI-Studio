# Product specification — Enterprise AI-DLC / Trusted AI Design Studio

## Product positioning

A teach-through-doing architecture and lifecycle planner for enterprise leaders, architects, engineering teams and security/risk officers to **groom complex agentic use cases**. It intentionally avoids the trivial chatbot bias: it models multi-role autonomous and deterministic workflows, tool authority, bounded iterations, complex RAG, staged delivery, NFRs, cost, resilience and assurance evidence. The app is a structured decision workspace, not a demo agent runner.

## Primary users and outcomes

| Persona | Goal | In-app output |
|---|---|---|
| MD / CXO / business owner | Confirm use-case value and risk appetite | Executive intent, objectives, economics and blockers |
| Product / delivery lead | Define problem, sequence controlled delivery | Scope, success KPIs, AWS stage plan, dependency-aware Units |
| Principal architect | Design agentic interactions and evidence contracts | Node/edge graph, 25 pattern blueprints, 40 RAG selections |
| Platform / SRE lead | Validate scale, reliability and operational feasibility | Capacity proxy, SLOs, recovery constraints, TCO sensitivity |
| CISO / AI Trust lead | Establish control ownership and assurance | Trust register, critical gaps, evidence links, risk exceptions |
| Engineering lead / assessor | Test and graduate expert teams | Positive, negative, failure and abuse scenarios with verification methods |

## Navigation model

1. **Command center:** Empty initial state; if a user deliberately creates/loads a case, overview, selected-stage coverage, essential-control evidence and cost proxy.
2. **AWS live samples:** On-demand GitHub browsing; inspect source READMEs with commit provenance, optionally start an unsaved draft.
3. **Use-case framing:** Design hypotheses, risk, stakeholders, source, scope, success criteria and profile.
4. **Agentic designer:** Source pattern taxonomy, editable graph, node boundaries, edge contracts, chosen RAG retrieval approaches and independent test scenarios.
5. **NFR & cost lab:** Capacity and cost assumptions, scenario sensitivity, reliability, data/residency policy.
6. **Trust & security:** Mapped controls, evidence state, risk ownership, source standards.
7. **AI-DLC lifecycle:** AWS phases, explicit profile plan creation, 33 stage reference cards, implementation Units/critical dependencies, decision records.
8. **Reports & exports:** From a blank reference catalogue or an explicitly opened use case: Markdown, HTML, JSON, CSV, Mermaid.

## Agentic architecture primitives

- Distinguish deterministic workflow, planner/act agent, specialized worker, tool/API, RAG/retriever, independent evaluator, human approval gate, policy enforcement point, memory and event source/sink.
- Allow directed arcs with independent failure policies and contract hints. Connections are modeling entities, not live runtime connections.
- Pattern library includes cycles and branching for ReAct, Plan/Execute, Reflection, Reflexion, ToT/LATS, ReWOO, LLMCompiler, Routing, Parallelization, Evaluator/Optimizer, Supervisor/Worker, Multiagent, HITL, Blackboard, Swarm, hierarchical delegation and related resilience patterns.
- Model layers that cut across every pattern: identity and least privilege, context isolation, budget and step limits, independent verification, traceability, observability, recovery and human override.

## How the app teaches

The bottom Field Guide is contextual to the active workspace and answers **why it matters, what good looks like, the most frequent gotcha, and where the source authority comes from**. Pattern cards show mechanism, appropriate use and complexity. Each Trust control carries its purpose and standards mapping. Stage cards show phase question, expected evidence, accountable owner and gate flags. The NFR tool shows transparent approximations and warnings.

## Explicitly not included in draft

No model calls, no automatic case fixtures, no automatic AWS fetch, no code generation/runtime, no authorization proof, no SOC controls evidence signing, no direct priced cloud calculator connector, no remote account data and no multiuser collaboration.

## Definition of expert graduation (future integration)

An architect graduating from the proposed coaching track should independently build an end-to-end complex scenario, justify architectural choices against simpler baselines, defend scale and cost assumptions, demonstrate adversarial tests, show human/automatic authority separation, produce a dependency-aware Unit delivery plan and articulate how to safely operationalize the outcome. A rubric and program outline exist in the linked coaching workbook inside `data/reference/`.
