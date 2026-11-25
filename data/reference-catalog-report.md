# AI-DLC × Trusted AI reference catalogue

Generated 2026-11-25T17:46:32.179Z without loading any use case.

## AI-DLC v2.11.5 stages

| Phase | ID | Stage | Lead agent | Mode | Runs | Outputs |
|---|---|---|---|---|---|---|
| Initialization | 0.1 | Workspace Scaffold | orchestrator | inline (auto-proceed) | always |  |
| Initialization | 0.2 | Workspace Detection | orchestrator | inline (auto-proceed) | always | aidlc-state.md |
| Initialization | 0.3 | State Initialization | orchestrator | inline (auto-proceed) | always | aidlc-state.md, audit/ |
| Ideation | 1.1 | Intent Capture & Framing | aidlc-product-agent | inline | always | intent-statement.md, stakeholder-map.md, intent-capture-questions.md |
| Ideation | 1.2 | Market Research | aidlc-product-agent | inline | conditional | competitive-analysis.md, market-trends.md, build-vs-buy.md, market-research-questions.md |
| Ideation | 1.3 | Feasibility & Constraints | aidlc-architect-agent | inline | conditional | feasibility-assessment.md, constraint-register.md, raid-log.md, feasibility-questions.md |
| Ideation | 1.4 | Scope Definition | aidlc-product-agent | inline | always | scope-document.md, intent-backlog.md, scope-definition-questions.md |
| Ideation | 1.5 | Team Formation | aidlc-delivery-agent | inline | conditional | team-assessment.md, skill-matrix.md, mob-composition.md, team-formation-questions.md |
| Ideation | 1.6 | Rough Mockups | aidlc-design-agent | inline | conditional | wireframes.md, user-flow.md, rough-mockups-questions.md |
| Ideation | 1.7 | Approval & Handoff | aidlc-delivery-agent | inline | always | initiative-brief.md, decision-log.md, approval-handoff-questions.md, verification/phase-check-ideation.md |
| Inception | 2.1 | Reverse Engineering | aidlc-developer-agent | pipeline | brownfield only | business-overview.md, architecture.md, code-structure.md, api-documentation.md, component-inventory.md, technology-stack.md, dependencies.md, code-quality-assessment.md, reverse-engineering-timestamp.md |
| Inception | 2.2 | Practices Discovery | aidlc-pipeline-deploy-agent | subagent | conditional | team-practices.md, discovered-rules.md, evidence.md, practices-discovery-timestamp.md |
| Inception | 2.3 | Requirements Analysis | aidlc-product-agent | inline | always | requirements.md, requirements-analysis-questions.md |
| Inception | 2.4 | User Stories | aidlc-product-agent | mob | conditional | stories.md, personas.md, user-stories-assessment.md, traceability.json |
| Inception | 2.5 | Refined Mockups | aidlc-design-agent | inline | conditional | mockups.md, interaction-spec.md, design-system-mapping.md, accessibility-checklist.md, refined-mockups-questions.md |
| Inception | 2.6 | Domain Design | aidlc-architect-agent | inline | conditional | components.md, decisions.md, traceability.json |
| Inception | 2.7 | Units Generation | aidlc-architect-agent | inline | always | unit-of-work.md, unit-of-work-dependency.md, unit-of-work-story-map.md, traceability.json |
| Inception | 2.8 | Contract Design | aidlc-architect-agent | inline | conditional | contract-summary.md |
| Inception | 2.9 | Delivery Planning | aidlc-delivery-agent | inline | always | bolt-plan.md, team-allocation.md, risk-and-sequencing-rationale.md, external-dependency-map.md, delivery-planning-questions.md, verification/phase-check-inception.md |
| Construction | 3.1 | Functional Design | aidlc-architect-agent | inline | conditional | entities.md, rules.md, functional-spec.md, traceability.json |
| Construction | 3.2 | NFR Requirements | aidlc-architect-agent | inline | conditional | performance-requirements.md, security-requirements.md, scalability-requirements.md, reliability-requirements.md, observability-requirements.md, tech-stack-decisions.md, traceability.json |
| Construction | 3.3 | NFR Design | aidlc-architect-agent | inline | conditional | performance-design.md, security-design.md, scalability-design.md, reliability-design.md, observability-design.md, logical-components.md, traceability.json |
| Construction | 3.4 | Infrastructure Design | aidlc-aws-platform-agent | inline | conditional | infrastructure-specification.md, monitoring-design.md, cicd-pipeline.md, traceability.json |
| Construction | 3.5 | Code Generation | aidlc-developer-agent | subagent | always | code-generation-plan.md, unit-test-instructions.md, code-summary.md, traceability.json, source-manifest.json |
| Construction | 3.6 | Build and Test | aidlc-quality-agent | inline | always | build-instructions.md, build-and-test-summary.md, build-test-results.md, cross-unit-traceability.md |
| Construction | 3.7 | CI Pipeline | aidlc-pipeline-deploy-agent | inline | conditional | ci-config.md, quality-gates.md, ci-pipeline-questions.md, verification/phase-check-construction.md |
| Operation | 4.1 | Deployment Pipeline | aidlc-pipeline-deploy-agent | inline | conditional | cd-config.md, deployment-strategy.md, rollback-runbook.md, deployment-pipeline-questions.md |
| Operation | 4.2 | Environment Provisioning | aidlc-aws-platform-agent | inline | conditional | environment-inventory.md, validation-report.md, environment-provisioning-questions.md |
| Operation | 4.3 | Deployment Execution | aidlc-pipeline-deploy-agent | inline | conditional | deployment-log.md, smoke-test-results.md, health-check-report.md, deployment-execution-questions.md |
| Operation | 4.4 | Observability Setup | aidlc-operations-agent | inline | conditional | dashboards.md, alarms.md, slo-config.md, log-queries.md, tracing-config.md, anomaly-config.md, observability-setup-questions.md |
| Operation | 4.5 | Incident Response | aidlc-operations-agent | inline | conditional | runbooks.md, incident-plan.md, escalation-matrix.md, incident-response-questions.md |
| Operation | 4.6 | Performance Validation | aidlc-quality-agent | inline | conditional | load-test-plan.md, load-test-results.md, nfr-validation-matrix.md, performance-validation-questions.md |
| Operation | 4.7 | Feedback & Optimization | aidlc-operations-agent | inline | conditional | slo-report.md, cost-analysis.md, drift-report.md, feedback-loop.md, feedback-optimization-questions.md |

## AI-DLC v2.11.5 workflow profiles

| Profile | Best for | Stages (stated) | Depth | Test strategy |
|---|---|---|---|---|
| classic | V1-style ceremony through Inception and Construction, ending at Build and Test | 15/30 | standard | standard |
| express | The lightest requirements-to-code-and-test path | 7/30 | minimal | minimal |
| feature | A production feature using the complete lifecycle | 30/30 | standard | standard |
| enterprise | Regulated or high-assurance work with full traceability | 30/30 | comprehensive | comprehensive |
| mvp | A real first product increment without the Operation phase | 20/30 | standard | standard |
| poc | Testing feasibility with the smallest useful implementation path | 5/30 | minimal | minimal |
| bugfix | A known defect that needs a focused fix and regression test | 6/30 | minimal | minimal |
| refactor | Improving existing code without changing product behavior | 7/30 | minimal | minimal |
| infra | Environments, IaC, deployment foundations, or cost work | 12/30 | standard | standard |
| security-patch | A CVE or focused vulnerability response | 7/30 | minimal | minimal |
| workshop | A facilitated training or group delivery session | 23/30 | standard | minimal |

## 25 agentic patterns

- **ReAct** (Medium): Reason → Act → Observe → Repeat. Dynamic tool use, troubleshooting, research.
- **Plan and Execute** (Medium): Plan → execute steps → optionally replan. Complex projects and multi-step tasks.
- **Reflection** (Medium): Generate → critique → refine. Writing, code and answer quality.
- **Reflexion** (High): Actor → feedback → reflection → memory → retry. Repeated problem-solving.
- **ReWOO** (High): Planner → tool worker → solver. Reduce repeated reasoning overhead.
- **Tree of Thoughts (ToT)** (High): Branch → evaluate → prune → select. Math, optimization, strategy.
- **LATS** (Very high): Search tree with actions, reasoning and feedback. Difficult autonomous tasks.
- **LLMCompiler** (High): Dependency graph → parallel tools → join. API orchestration and aggregation.
- **Tool Calling** (Low): Select function → invoke → use result. CRM, ERP, SQL and APIs.
- **Prompt Chaining** (Low): Sequential specialized LLM operations. Structured document workflows.
- **Routing** (Medium): Classify → dispatch to specialist. Enterprise copilots and support.
- **Parallelization** (Medium): Fan out independent tasks → merge. Bulk analysis and ensembles.
- **Evaluator-Optimizer** (Medium): Generate → evaluate against criteria → improve. Compliance and code validation.
- **Supervisor-Worker** (High): Central orchestrator → specialist workers → synthesis. Enterprise automation and research.
- **Multi-Agent Collaboration** (Very high): Agents exchange information, debate or hand off work. Software teams and business operations.
- **Human-in-the-Loop** (Medium): Pause → authorize action → resume. Regulated decisions and privileged actions.
- **State Machine** (Medium): Explicit states → guards → transitions. Auditable bounded processes.
- **Saga / Compensation** (High): Multi-step transaction → compensating actions. Distributed agent actions and rollback.
- **Event-Driven Agents** (High): Event → router → worker → event. Long-running distributed workflows.
- **Blackboard Collaboration** (High): Shared workspace → specialists → synthesis. Complex joint problem-solving.
- **Swarm** (Very high): Peers coordinate and hand off. Adaptive collaboration at scale.
- **Hierarchical Agents** (Very high): Executive → submanagers → workers. Very large task decomposition.
- **Memory-Augmented Agents** (High): Recall → plan → act → consolidate. Persistent task and user context.
- **Circuit Breaker & Fallback** (Medium): Detect failures → degrade → recover. Fail-safe automation and operations.
- **Policy-Gated Tool Use** (Medium): Policy decision → scoped tool call → audit. Enterprise action control.

## 40 retrieval techniques

- **Naive / Dense RAG** (Foundational RAG): Embedding-based vector retrieval.
- **Sparse / Lexical RAG** (Foundational RAG): BM25, TF-IDF or learned sparse retrieval such as SPLADE.
- **Hybrid RAG** (Foundational RAG): Combine dense and sparse retrieval.
- **Modular RAG** (Foundational RAG): Independently configurable retrieval and generation modules.
- **Semantic Chunking** (Indexing and chunking): Split documents at meaningful semantic boundaries.
- **Proposition-based RAG** (Indexing and chunking): Index atomic, self-contained factual statements.
- **Parent-Child RAG** (Indexing and chunking): Retrieve small chunks and expand to larger parent sections.
- **Contextual Retrieval** (Indexing and chunking): Enrich chunks with document-specific context before indexing.
- **Late Chunking** (Indexing and chunking): Contextualize document tokens before pooling chunk embeddings.
- **Query Rewriting** (Query optimization): Reformulate user queries for better retrieval.
- **HyDE** (Query optimization): Generate hypothetical documents for embedding-based retrieval.
- **Multi-Query RAG / RAG-Fusion** (Query optimization): Generate multiple queries and merge retrieval results.
- **Step-Back RAG** (Query optimization): Retrieve using a more abstract, generalized question.
- **Query Decomposition** (Query optimization): Break complex questions into searchable subquestions.
- **Reranking RAG** (Advanced retrieval): Rescore retrieved documents with cross-encoders or LLMs.
- **Late-Interaction RAG** (Advanced retrieval): Token-level multi-vector matching, such as ColBERT.
- **Multi-Hop RAG** (Advanced retrieval): Follow sequential chains of evidence.
- **Metadata-Aware / Filtered RAG** (Advanced retrieval): Combine semantic retrieval with structured constraints.
- **Federated RAG** (Advanced retrieval): Retrieve and consolidate evidence across distributed sources.
- **Iterative RAG** (Advanced retrieval): Alternate retrieval and intermediate reasoning.
- **GraphRAG** (Knowledge representation and structure): Entity, relationship and graph-community retrieval.
- **LightRAG** (Knowledge representation and structure): Lightweight graph-based retrieval at different granularities.
- **HippoRAG** (Knowledge representation and structure): Graph-based associative and multi-hop memory retrieval.
- **RAPTOR** (Knowledge representation and structure): Recursive hierarchical summarization and tree retrieval.
- **Structured / SQL-RAG** (Knowledge representation and structure): Retrieve evidence through SQL, JSON or structured-data interfaces.
- **Temporal RAG** (Knowledge representation and structure): Retrieve time-sensitive and historically appropriate knowledge.
- **Self-RAG** (Intelligent and autonomous RAG): Self-reflective retrieval and generation.
- **Corrective RAG (CRAG)** (Intelligent and autonomous RAG): Assess evidence and trigger corrective searches.
- **Adaptive RAG** (Intelligent and autonomous RAG): Select retrieval strategies based on task requirements.
- **Active RAG (FLARE)** (Intelligent and autonomous RAG): Trigger retrieval dynamically during generation.
- **Agentic RAG** (Intelligent and autonomous RAG): Autonomous retrieval planning and tool selection.
- **RL-based RAG** (Intelligent and autonomous RAG): Learn retrieval and reasoning policies through reinforcement learning.
- **Contextual Compression RAG** (Context optimization and generation): Remove irrelevant information from retrieved context.
- **Fusion-in-Decoder (FiD)** (Context optimization and generation): Encode passages independently and jointly attend to them during decoding.
- **Grounded / Verifiable RAG** (Context optimization and generation): Evidence attribution, citations, verification and abstention.
- **Multimodal RAG** (Specialized and frontier RAG): Retrieve text, images, tables, audio or video.
- **Visual Document RAG** (Specialized and frontier RAG): Retrieve document-page or region embeddings using vision models.
- **Conversational RAG** (Specialized and frontier RAG): History-aware retrieval and follow-up question resolution.
- **Memory-Augmented RAG** (Specialized and frontier RAG): Retrieve from persistent episodic, semantic or working memory.
- **Long-Context Hybrid RAG** (Specialized and frontier RAG): Dynamically choose or combine retrieval and long-context inference.

## 35 Trusted AI control prompts

- **GOV-01 AI governance ownership** [Governance / essential]: Assign accountable business owner, risk owner and model owner. Framework IDs (studio mapping): GOVERN 2.1, GOVERN 2.3, GOVERN 1.2, GOVERN 1.3.
- **GOV-02 Inventory and use-case scope** [Governance / essential]: Maintain system inventory, intended use and impact boundaries. Framework IDs (studio mapping): GOVERN 1.6, MAP 1.1, MAP 3.3, MAP 1.3, MAP 1.4, MAP 1.6, MAP 2.1.
- **GOV-03 Applicable law and regulation** [Governance / essential]: Determine applicable laws and risk categories with legal review. Framework IDs (studio mapping): GOVERN 1.1, MAP 4.1.
- **GOV-04 Human oversight** [Governance / essential]: Define reviewable decisions, escalation and reversal authority. Framework IDs (studio mapping): GOVERN 3.2, MAP 3.5, MANAGE 2.4, MAP 2.2, ASI09.
- **GOV-05 Vendor and third-party assurance** [Governance]: Review model/provider risk, processing terms, subcontractors and exit plans. Framework IDs (studio mapping): GOVERN 6.1, GOVERN 6.2, MANAGE 3.1, MANAGE 3.2, MAP 4.2, LLM04:2026, ASI04, AML.T0010.
- **GOV-06 AI risk training and team competence** [Governance]: Train the people who build, operate and oversee the system on its AI risks, and record who has the skills to operate it. Covers training, team diversity in risk decisions, a safety-first practice and operator proficiency. Framework IDs (studio mapping): GOVERN 2.2, GOVERN 3.1, GOVERN 4.1, MAP 1.2, MAP 3.4.
- **GOV-07 Impact assessment, risk tolerance and residual risk** [Governance / essential]: Assess likely benefits and harms with their likelihood and magnitude, set risk tolerance, prioritise risk treatment and record the residual risk that remains. Framework IDs (studio mapping): GOVERN 4.2, MAP 1.5, MAP 3.1, MAP 5.1, MANAGE 1.2, MANAGE 1.3, MANAGE 1.4.
- **GOV-08 External feedback, appeal and engagement** [Governance]: Give users and affected people a way to report problems and appeal outcomes, and feed that input back into evaluation and design. Framework IDs (studio mapping): GOVERN 5.1, GOVERN 5.2, MAP 5.2, MEASURE 3.3.
- **GOV-09 Decommissioning and deactivation** [Governance]: Define how the system, its agents and credentials are switched off, superseded or retired without raising risk, and who can do it. Framework IDs (studio mapping): GOVERN 1.7, MANAGE 2.4.
- **SEC-01 Least-privilege tool execution** [Security / essential]: Authorize each agent tool against role, tenant and action context. Framework IDs (studio mapping): MEASURE 2.7, LLM03:2026, ASI02, ASI03, AML.T0053, AML.T0101.
- **SEC-02 Prompt injection and tool-output isolation** [Security / essential]: Treat retrieval and tool outputs as untrusted; adversarially test. Framework IDs (studio mapping): MEASURE 2.7, LLM01:2026, LLM10:2026, ASI01, AML.T0051, AML.T0054.
- **SEC-03 Secrets and credentials** [Security / essential]: Avoid raw credentials in prompts; use scoped ephemeral identities. Framework IDs (studio mapping): MEASURE 2.7, LLM02:2026, ASI03, AML.T0083, AML.T0098.
- **SEC-04 Data classification and residency** [Security / essential]: Classify PII, financial and regulated data; enforce region and retention. Framework IDs (studio mapping): MAP 4.1, MEASURE 2.10, LLM02:2026.
- **SEC-05 Tenant and retrieval authorization** [Security / essential]: Enforce ACLs before data retrieval and post-filter access. Framework IDs (studio mapping): MEASURE 2.10, LLM08:2026, LLM09:2026, AML.T0070, AML.T0071.
- **SEC-06 Agent-to-agent and MCP trust** [Security / essential]: Authenticate integrations, verify tool manifests and constrain remote agents. Framework IDs (studio mapping): MEASURE 2.7, ASI04, ASI07, AML.T0010.005, AML.T0110.
- **SEC-07 Threat modeling and red team** [Security / essential]: Test exfiltration, escalation, tool misuse, memory poisoning and goal hijack. Framework IDs (studio mapping): MEASURE 1.3, MEASURE 2.7, LLM01:2026, ASI01, AML.T0051, AML.T0080.
- **SEC-08 Code and command execution isolation** [Security / essential]: Run any agent-generated or tool-executed code and commands in a sandbox or container, and require extra authorization for potentially dangerous commands. Framework IDs (studio mapping): MEASURE 2.7, LLM10:2026, ASI05, AML.T0053.
- **SEC-09 Memory and context integrity** [Security / essential]: Control what can be written to agent memory and shared context, scope it per user or task, and detect or expire poisoned entries. Framework IDs (studio mapping): MEASURE 2.7, LLM02:2026, ASI06, AML.T0080, AML.T0080.000.
- **SEC-10 Training, fine-tuning and retrieval data integrity** [Security / essential]: Control the sources of training, fine-tuning and retrieval data, verify their provenance and detect poisoned content before it reaches the model or index. Framework IDs (studio mapping): MAP 2.3, MEASURE 2.7, LLM05:2026, AML.T0020, AML.T0070, AML.T0071.
- **SEC-11 MCP server and tool interface security** [Security / essential]: Each MCP tool server validates all inputs, enforces access control, rate-limits calls and sanitizes outputs. HTTP servers authenticate every request, validate token audience and accept no tokens issued for others, validate the Origin header and bind to localhost when local; stdio servers take credentials from the environment. Framework IDs (studio mapping): MEASURE 2.7, LLM03:2026, LLM10:2026, ASI02, ASI03, ASI04, AML.T0053, AML.T0110.
- **SEC-12 Human confirmation for state-changing tools** [Security / essential]: Tools that change or delete data, move money or act outside the system require a human confirmation step that can deny the call; the person sees the inputs before the call is made. Framework IDs (studio mapping): GOVERN 3.2, MAP 3.5, LLM03:2026, ASI02, ASI09, AML.T0101.
- **REL-01 Bounded loops and budgets** [Reliability / essential]: Set timeouts, max steps, retries, spend ceilings and kill switches. Framework IDs (studio mapping): MANAGE 2.4, LLM06:2026, ASI08, AML.T0029, AML.T0034, AML.T0034.002.
- **REL-02 Idempotency and compensation** [Reliability / essential]: Protect side effects; define rollback and compensating transactions. Framework IDs (studio mapping): MANAGE 2.3, ASI08.
- **REL-03 Failure isolation and degraded operation** [Reliability]: Plan circuit breakers, fallback models and human escalation. Framework IDs (studio mapping): MEASURE 2.6, ASI08, ASI10.
- **REL-04 SLOs and capacity testing** [Reliability / essential]: Define latency, throughput, availability, RTO/RPO and load tests. Framework IDs (studio mapping): MEASURE 2.4, MEASURE 2.6, LLM06:2026, AML.T0029.
- **EVAL-01 Independent task evaluation** [Evaluation / essential]: Maintain golden tasks, misuse tests, groundedness and acceptance thresholds. Framework IDs (studio mapping): MEASURE 1.3, MEASURE 2.3, MEASURE 2.5, LLM07:2026.
- **EVAL-02 RAG evidence integrity** [Evaluation]: Validate citation attribution, provenance, freshness and refusal on no evidence. Framework IDs (studio mapping): MEASURE 2.5, MEASURE 2.9, LLM07:2026, LLM09:2026, AML.T0070.
- **EVAL-03 Bias and fairness analysis** [Evaluation]: Measure harms for affected groups where relevant. Framework IDs (studio mapping): MEASURE 2.2, MEASURE 2.11.
- **EVAL-04 Measurement plan and TEVV documentation** [Evaluation]: Choose metrics for the most significant risks first, document test sets, tools and results, record what cannot be measured, and review whether the metrics and evaluation process still work. Framework IDs (studio mapping): MEASURE 1.1, MEASURE 1.2, MEASURE 2.1, MEASURE 2.13, MEASURE 3.2, MEASURE 4.1, MEASURE 4.2, MEASURE 4.3.
- **OPS-01 End-to-end trace and audit** [Operations / essential]: Capture prompt/tool/model versions, decisions, approvals and cost. Framework IDs (studio mapping): MEASURE 2.8, MANAGE 4.1, ASI10.
- **OPS-02 Incident response and containment** [Operations / essential]: Define on-call, incident taxonomies, rollback and containment playbooks. Framework IDs (studio mapping): GOVERN 4.3, MANAGE 2.3, MANAGE 4.1, MANAGE 4.3, ASI10.
- **OPS-03 Change and release control** [Operations / essential]: Maintain gated deployments, reproducible releases and rollback evidence. Framework IDs (studio mapping): GOVERN 1.4, MANAGE 1.1, LLM04:2026, AML.T0010.
- **OPS-04 Cost governance** [Operations]: Track token budgets, utilization, unit economics and spend alerts. Framework IDs (studio mapping): MAP 3.2, MANAGE 2.1, LLM06:2026, AML.T0034.
- **OPS-05 Continuous improvement and drift** [Operations]: Monitor model/data/tool drift and route defects into backlog. Framework IDs (studio mapping): MEASURE 2.4, MEASURE 3.1, MANAGE 4.2, GOVERN 1.5, MANAGE 2.2.
- **OPS-06 Environmental impact** [Operations]: Assess and record the energy and resource use of model training and operation. Framework IDs (studio mapping): MEASURE 2.12.

## References (catalog 2026-11-25)

### AI-DLC methodology

- AI-DLC Workflows (awslabs/aidlc-workflows) (v2.11.5) — https://github.com/awslabs/aidlc-workflows/releases/tag/v2.11.5 [Methodology and tooling (open source)]
- AI-DLC guide 04: Phases and stages (v2.11.5) — https://github.com/awslabs/aidlc-workflows/blob/v2.11.5/docs/guide/04-phases-and-stages.md [Methodology documentation]
- AI-DLC guide 05: Scopes and depth (v2.11.5) — https://github.com/awslabs/aidlc-workflows/blob/v2.11.5/docs/guide/05-scopes-and-depth.md [Methodology documentation]
- AI-DLC guide: Workflow profiles (v2.11.5) — https://github.com/awslabs/aidlc-workflows/blob/v2.11.5/docs/guide/workflow-profiles.md [Methodology documentation]
- AI-DLC guide 06: Agents (v2.11.5) — https://github.com/awslabs/aidlc-workflows/blob/v2.11.5/docs/guide/06-agents.md [Methodology documentation]
- AI-DLC guide 14: Artifacts reference (v2.11.5) — https://github.com/awslabs/aidlc-workflows/blob/v2.11.5/docs/guide/14-artifacts-reference.md [Methodology documentation]
- AI-DLC guide 10: State and audit (v2.11.5) — https://github.com/awslabs/aidlc-workflows/blob/v2.11.5/docs/guide/10-state-and-audit.md [Methodology documentation]
- AI-DLC guide: Writing a vision document (v2.11.5) — https://github.com/awslabs/aidlc-workflows/blob/v2.11.5/docs/guide/writing-inputs/vision-document-guide.md [Methodology documentation]
- AI-DLC guide: Multi-Team Construction and Workshop Mode (v2.11.5) — https://github.com/awslabs/aidlc-workflows/blob/v2.11.5/docs/guide/workshop-mode.md [Methodology documentation]
- AI-DLC guide: Facilitator guide (v2.11.5) — https://github.com/awslabs/aidlc-workflows/blob/v2.11.5/docs/guide/facilitator-guide.md [Methodology documentation]
- AI-DLC guide: Onboarding, a guided first week (v2.11.5) — https://github.com/awslabs/aidlc-workflows/blob/v2.11.5/docs/guide/onboarding.md [Methodology documentation]
- AI-DLC stage rule files (core/aidlc-common/stages) (v2.11.5) — https://github.com/awslabs/aidlc-workflows/tree/v2.11.5/core/aidlc-common/stages [Methodology source (open source)]
- AI-DLC stage protocol: template overrides (v2.11.5) — https://github.com/awslabs/aidlc-workflows/blob/v2.11.5/core/aidlc-common/protocols/stage-protocol.md [Methodology source (open source)]
- AI-DLC guide 16: Worked examples (v2.11.5) — https://github.com/awslabs/aidlc-workflows/blob/v2.11.5/docs/guide/16-worked-examples.md [Methodology documentation]
- AI-DLC guide: Glossary (v2.11.5) — https://github.com/awslabs/aidlc-workflows/blob/v2.11.5/docs/guide/glossary.md [Methodology documentation]

### AWS samples & documentation

- AI for software engineering on AWS (samples) (main @ d311330) — https://github.com/aws-samples/sample-ai-for-software-engineering-on-aws [Sample repository]
- Collaborative AI-DLC (sample) (main @ 0038b3d) — https://github.com/aws-samples/sample-collaborative-ai-dlc [Sample repository]
- Collaborative AI-DLC: Methodology (main) — https://github.com/aws-samples/sample-collaborative-ai-dlc/blob/main/docs/getting-started/methodology.md [Sample documentation]
- AWS Well-Architected Framework — https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html [Vendor documentation]
- AWS Well-Architected Generative AI Lens — https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/generative-ai-lens.html [Vendor documentation]
- AWS Well-Architected Responsible AI Lens — https://docs.aws.amazon.com/wellarchitected/latest/responsible-ai-lens/responsible-ai-lens.html [Vendor documentation]
- Amazon Bedrock AgentCore Developer Guide — https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html [Vendor documentation]

### AI governance & law

- NIST AI Risk Management Framework 1.0 (NIST AI 100-1) (1.0) — https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf [Framework (US government, voluntary)]
- NIST AI 600-1: Generative AI Profile (600-1) — https://doi.org/10.6028/NIST.AI.600-1 [Framework profile (US government, voluntary)]
- NIST Cybersecurity Framework 2.0 (2.0 (NIST CSWP 29)) — https://doi.org/10.6028/NIST.CSWP.29 [Framework (US government, voluntary)]
- ISO/IEC 42001 (2023) — https://www.iso.org/standard/42001 — _unverified_ [International standard]
- ISO/IEC 23894 (2023) — https://www.iso.org/standard/77304.html — _unverified_ [International standard]
- ISO/IEC 42005 — https://www.iso.org/standard/42005 — _unverified_ [International standard]
- ISO/IEC 27001 — https://www.iso.org/standard/27001 — _unverified_ [International standard]
- EU AI Act: Regulation (EU) 2024/1689 (2024/1689, amended by the AI Omnibus) — https://eur-lex.europa.eu/eli/reg/2024/1689/oj [Law (EU regulation)]
- European Commission: AI Act regulatory framework page — https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai [Government guidance]
- OECD AI Principles (OECD-LEGAL-0449 (updated May 2024)) — https://oecd.ai/en/ai-principles [Intergovernmental recommendation]

### AI security

- OWASP Top 10 for LLM Applications 2026 (2026) — https://genai.owasp.org/top-10-for-llm-applications-2026/ [Community security list]
- OWASP Top 10 for LLM Applications 2025 (2025) — https://genai.owasp.org/llm-top-10/ [Community security list]
- OWASP Top 10 for Agentic Applications 2026 (2026) — https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/ [Community security list]
- OWASP Agentic AI – Threats and Mitigations (1.0) — https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/ [Community security guide]
- OWASP AI Security Verification Standard (AISVS) (1.01) — https://github.com/OWASP/AISVS [Community verification standard]
- MITRE ATLAS (atlas-data v2026.10) — https://github.com/mitre-atlas/atlas-data/releases/tag/v2026.10 [Knowledge base]
- NIST AI 100-2 E2025: Adversarial Machine Learning (E2025) — https://doi.org/10.6028/NIST.AI.100-2e2025 [Government publication]
- NIST SP 800-218A (SP 800-218A (final)) — https://doi.org/10.6028/NIST.SP.800-218A [Government publication]
- CSA AI Controls Matrix (AICM) (v1.1) — https://cloudsecurityalliance.org/artifacts/ai-controls-matrix-v1-1 [Industry control framework]

### Agent protocols

- Model Context Protocol specification (2026-07-28) — https://modelcontextprotocol.io/specification/2026-07-28/ [Protocol specification]
- Agent2Agent (A2A) protocol specification (v1.0.1) — https://a2a-protocol.org/v1.0.0/specification [Protocol specification]

### Coding-agent formats & SDKs

- Claude Code docs: memory (CLAUDE.md) — https://code.claude.com/docs/en/memory [Vendor documentation]
- Claude Code docs: skills — https://code.claude.com/docs/en/skills [Vendor documentation]
- Claude Code docs: subagents — https://code.claude.com/docs/en/sub-agents [Vendor documentation]
- Claude Code docs: MCP (.mcp.json) — https://code.claude.com/docs/en/mcp [Vendor documentation]
- AGENTS.md — https://agents.md/ [Open format]
- MCP TypeScript SDK (2.4.0) — https://github.com/modelcontextprotocol/typescript-sdk [SDK]
- MCP Python SDK (v2.3.0) — https://github.com/modelcontextprotocol/python-sdk [SDK]

### FinOps & cost

- FinOps Framework — https://www.finops.org/framework/ [Practitioner framework]
- FinOps Foundation: AI FinOps topic page — https://www.finops.org/topic/finops-for-ai/ [Practitioner guidance]
- FOCUS: FinOps Open Cost & Usage Specification (1.4) — https://focus.finops.org/docs/specification/v1-4/ [Data specification]

### Reliability & SLOs

- Site Reliability Engineering, chapter 4: Service Level Objectives — https://sre.google/sre-book/service-level-objectives/ [Book chapter]
- The Site Reliability Workbook, chapter 2: Implementing SLOs — https://sre.google/workbook/implementing-slos/ [Book chapter]

### Observability

- OpenTelemetry semantic conventions for generative AI — https://github.com/open-telemetry/semantic-conventions-genai — _unverified_ [Specification]

### Software delivery

- DORA research (2025 report) — https://dora.dev/research/2025/ [Research report]

### Project files

- RAG techniques and AI agent design patterns: master reference (Research snapshot 2026-11-25) — data/rag_and_agent_patterns_master_reference.md [Project file]
- Enterprise AI Practices executive blueprint (Marp deck) — data/reference/enterprise-practices-40-slide-marp.md [Project file]
- Enterprise AI Practices: Expertise Coaching tracks (Marp deck) — data/reference/expertise-training-tracks-marp.md [Project file]
- AI expertise coaching workbook (6 tracks) — data/reference/ai-expertise-coaching-6-tracks.xlsx [Project file]

_These are educational mappings and planning controls; they are not authoritative reproductions of paid standards._
