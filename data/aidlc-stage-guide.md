# AI-DLC v2.11.5: stages, profiles and agents

> Generated from data/aidlc-stages.json, data/aidlc-profiles.json and data/aidlc-agents.json by `npm run docs:gen`. Do not edit by hand. Content is taken from the AI-DLC v2.11.5 guide (chapters 04, 05, 06, 14 and workflow-profiles), checked 2026-11-25.

Source repository: https://github.com/awslabs/aidlc-workflows (tag v2.11.5). This studio plans with this data; it does not run AI-DLC.

## Rules stated in the guide

- Every stage your scope runs, outside Initialization, ends with an approval gate. (04-phases-and-stages)
- A verification gate runs at each phase boundary except Initialization → Ideation. (04-phases-and-stages)
- Stages 3.1–3.5 run per Unit; 3.6 and 3.7 run once after all Units. (04-phases-and-stages)
- Execution modes: 29 inline, 2 subagent (2.2, 3.5), 1 pipeline (2.1), 1 mob (2.4). (04-phases-and-stages)
- Supporting agents take part only when the collaborators setting is on; otherwise the lead agent works alone. (04-phases-and-stages)
- Each stage writes its files under aidlc/spaces/<space>/intents/<YYMMDD>-<label>/. (14-artifacts-reference)
- A team template at aidlc/spaces/<space>/memory/templates/<artifact>.md is used whole-doc: its ## headings become the artifact skeleton and the required-sections sensor checks them. (core/aidlc-common/protocols/stage-protocol.md, Template overrides)

## Phase 0: Initialization

> Bootstrap the workspace: create the intent's record dir, detect the workspace, and initialize state.

| Stage | Lead agent | Supporting agents | Reviewer | Mode | Runs | Gate | Output files |
|---|---|---|---|---|---|---|---|
| 0.1 Workspace Scaffold | orchestrator | — | — | inline (auto-proceed) | always | no | — (Creates the intent's record dir aidlc/spaces/<space>/intents/<YYMMDD>-<label>/.) |
| 0.2 Workspace Detection | orchestrator | — | — | inline (auto-proceed) | always | no | aidlc-state.md (Rule-based scan of file extensions, known config filenames and package manifests.) |
| 0.3 State Initialization | orchestrator | — | — | inline (auto-proceed) | always | no | aidlc-state.md, audit/ |

## Phase 1: Ideation

> Validate the initiative — capture intent, assess feasibility, define scope, form the team, and secure approval to proceed.

| Stage | Lead agent | Supporting agents | Reviewer | Mode | Runs | Gate | Output files |
|---|---|---|---|---|---|---|---|
| 1.1 Intent Capture & Framing | aidlc-product-agent | aidlc-architect-agent | aidlc-product-lead-agent | inline | always | yes — Retained assumptions require explicit confirmation before the Product Lead reviewer and approval gate run. | intent-statement.md, stakeholder-map.md, intent-capture-questions.md |
| 1.2 Market Research | aidlc-product-agent | — | — | inline | conditional | yes | competitive-analysis.md, market-trends.md, build-vs-buy.md, market-research-questions.md |
| 1.3 Feasibility & Constraints | aidlc-architect-agent | aidlc-aws-platform-agent, aidlc-compliance-agent | — | inline | conditional | yes | feasibility-assessment.md, constraint-register.md, raid-log.md, feasibility-questions.md |
| 1.4 Scope Definition | aidlc-product-agent | aidlc-delivery-agent | — | inline | always | yes | scope-document.md, intent-backlog.md, scope-definition-questions.md |
| 1.5 Team Formation | aidlc-delivery-agent | — | — | inline | conditional | yes | team-assessment.md, skill-matrix.md, mob-composition.md, team-formation-questions.md |
| 1.6 Rough Mockups | aidlc-design-agent | aidlc-product-agent | aidlc-product-lead-agent | inline | conditional | yes | wireframes.md, user-flow.md, rough-mockups-questions.md |
| 1.7 Approval & Handoff | aidlc-delivery-agent | aidlc-product-agent | — | inline | always | yes — Followed by the Ideation → Inception verification gate. | initiative-brief.md, decision-log.md, approval-handoff-questions.md, verification/phase-check-ideation.md |

## Phase 2: Inception

> Elaborate the requirements — analyze the codebase, elicit requirements, design architecture, decompose into units of work, and plan delivery.

| Stage | Lead agent | Supporting agents | Reviewer | Mode | Runs | Gate | Output files |
|---|---|---|---|---|---|---|---|
| 2.1 Reverse Engineering | aidlc-developer-agent | aidlc-architect-agent | — | pipeline | brownfield only — "It only executes for brownfield projects." | yes — Approval gate only. | business-overview.md, architecture.md, code-structure.md, api-documentation.md, component-inventory.md, technology-stack.md, dependencies.md, code-quality-assessment.md, reverse-engineering-timestamp.md (Written to aidlc/spaces/<space>/codekb/<repo>/, not the record dir.) |
| 2.2 Practices Discovery | aidlc-pipeline-deploy-agent | aidlc-quality-agent, aidlc-developer-agent, aidlc-devsecops-agent | — | subagent | conditional | yes — Practices interview + final gate. | team-practices.md, discovered-rules.md, evidence.md, practices-discovery-timestamp.md |
| 2.3 Requirements Analysis | aidlc-product-agent | — | aidlc-product-lead-agent | inline | always | yes | requirements.md, requirements-analysis-questions.md |
| 2.4 User Stories | aidlc-product-agent | aidlc-design-agent, aidlc-developer-agent, aidlc-quality-agent | aidlc-product-lead-agent | mob | conditional — User-facing features. | yes — Mid-stage judgment questions + approval gate. | stories.md, personas.md, user-stories-assessment.md, traceability.json |
| 2.5 Refined Mockups | aidlc-design-agent | aidlc-product-agent | aidlc-product-lead-agent | inline | conditional — UI projects. | yes | mockups.md, interaction-spec.md, design-system-mapping.md, accessibility-checklist.md, refined-mockups-questions.md |
| 2.6 Domain Design | aidlc-architect-agent | aidlc-aws-platform-agent, aidlc-design-agent | aidlc-architecture-reviewer-agent | inline | conditional — Per execution plan (when new components are needed). | yes | components.md, decisions.md, traceability.json |
| 2.7 Units Generation | aidlc-architect-agent | aidlc-delivery-agent | aidlc-architecture-reviewer-agent | inline | always | yes | unit-of-work.md, unit-of-work-dependency.md, unit-of-work-story-map.md, traceability.json |
| 2.8 Contract Design | aidlc-architect-agent | aidlc-aws-platform-agent | aidlc-architecture-reviewer-agent | inline | conditional — More than one Unit, or an externally used API. | yes | contract-summary.md |
| 2.9 Delivery Planning | aidlc-delivery-agent | aidlc-architect-agent | — | inline | always | yes — Followed by the Inception → Construction verification gate. | bolt-plan.md, team-allocation.md, risk-and-sequencing-rationale.md, external-dependency-map.md, delivery-planning-questions.md, verification/phase-check-inception.md |

## Phase 3: Construction

> Build the solution — design, implement, and test — in reviewable slices.

| Stage | Lead agent | Supporting agents | Reviewer | Mode | Runs | Gate | Output files |
|---|---|---|---|---|---|---|---|
| 3.1 Functional Design | aidlc-architect-agent | aidlc-developer-agent | aidlc-architecture-reviewer-agent | inline | conditional — Per execution plan. (per Unit) | yes | entities.md, rules.md, functional-spec.md, traceability.json |
| 3.2 NFR Requirements | aidlc-architect-agent | aidlc-devsecops-agent, aidlc-compliance-agent, aidlc-quality-agent | aidlc-architecture-reviewer-agent | inline | conditional — Per execution plan. observability-requirements.md for service Units only. (per Unit) | yes | performance-requirements.md, security-requirements.md, scalability-requirements.md, reliability-requirements.md, observability-requirements.md, tech-stack-decisions.md, traceability.json |
| 3.3 NFR Design | aidlc-architect-agent | aidlc-aws-platform-agent | aidlc-architecture-reviewer-agent | inline | conditional — Per execution plan. observability-design.md for service Units only. (per Unit) | yes | performance-design.md, security-design.md, scalability-design.md, reliability-design.md, observability-design.md, logical-components.md, traceability.json |
| 3.4 Infrastructure Design | aidlc-aws-platform-agent | aidlc-devsecops-agent, aidlc-compliance-agent | aidlc-architecture-reviewer-agent | inline | conditional — Per execution plan. (per Unit) | yes | infrastructure-specification.md, monitoring-design.md, cicd-pipeline.md, traceability.json |
| 3.5 Code Generation | aidlc-developer-agent | — | aidlc-architecture-reviewer-agent | subagent | always (per Unit) | yes — Plan Approval is mandatory during Code Generation. | code-generation-plan.md, unit-test-instructions.md, code-summary.md, traceability.json, source-manifest.json (Application code goes to the workspace root, not the record dir.) |
| 3.6 Build and Test | aidlc-quality-agent | aidlc-devsecops-agent | — | inline | always — Runs once after all Units; reads every Unit's code. | yes | build-instructions.md, build-and-test-summary.md, build-test-results.md, cross-unit-traceability.md |
| 3.7 CI Pipeline | aidlc-pipeline-deploy-agent | — | — | inline | conditional — Runs once after all Units. | yes — Followed by the Construction → Operation verification gate. | ci-config.md, quality-gates.md, ci-pipeline-questions.md, verification/phase-check-construction.md |

## Phase 4: Operation

> Deploy and operate — set up deployment pipelines, provision environments, configure observability, and establish feedback loops.

| Stage | Lead agent | Supporting agents | Reviewer | Mode | Runs | Gate | Output files |
|---|---|---|---|---|---|---|---|
| 4.1 Deployment Pipeline | aidlc-pipeline-deploy-agent | — | — | inline | conditional | yes | cd-config.md, deployment-strategy.md, rollback-runbook.md, deployment-pipeline-questions.md |
| 4.2 Environment Provisioning | aidlc-aws-platform-agent | aidlc-devsecops-agent, aidlc-compliance-agent | — | inline | conditional | yes | environment-inventory.md, validation-report.md, environment-provisioning-questions.md |
| 4.3 Deployment Execution | aidlc-pipeline-deploy-agent | aidlc-developer-agent | — | inline | conditional | yes | deployment-log.md, smoke-test-results.md, health-check-report.md, deployment-execution-questions.md |
| 4.4 Observability Setup | aidlc-operations-agent | — | — | inline | conditional | yes | dashboards.md, alarms.md, slo-config.md, log-queries.md, tracing-config.md, anomaly-config.md, observability-setup-questions.md |
| 4.5 Incident Response | aidlc-operations-agent | — | — | inline | conditional | yes | runbooks.md, incident-plan.md, escalation-matrix.md, incident-response-questions.md |
| 4.6 Performance Validation | aidlc-quality-agent | — | — | inline | conditional | yes | load-test-plan.md, load-test-results.md, nfr-validation-matrix.md, performance-validation-questions.md |
| 4.7 Feedback & Optimization | aidlc-operations-agent | aidlc-aws-platform-agent | — | inline | conditional | yes — "On approval, the workflow is complete." | slo-report.md, cost-analysis.md, drift-report.md, feedback-loop.md, feedback-optimization-questions.md |

## Workflow profiles

Stage counts are as stated in the guide and exclude the 3 Initialization stages. The scopes page routing table uses a 33-stage basis instead (e.g. workshop 26/33).

| Profile | Best for | Stated count | Depth | Test strategy | Stages run (after Initialization) | Notes |
|---|---|---|---|---|---|---|
| classic (default) | V1-style ceremony through Inception and Construction, ending at Build and Test | 15/30 | standard | standard | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6 | Default when no profile is named. Reviews are advisory (one pass per stage, findings at the approval gate). |
| express | The lightest requirements-to-code-and-test path | 7/30 | minimal | minimal | 2.1*, 2.3, 3.5, 3.6, 4.1*, 4.3*, 4.4* | Review cap none; plan approval off. |
| feature | A production feature using the complete lifecycle | 30/30 | standard | standard | 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7 |  |
| enterprise | Regulated or high-assurance work with full traceability | 30/30 | comprehensive | comprehensive | 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7 | Guard Policy strict. |
| mvp | A real first product increment without the Operation phase | 20/30 | standard | standard | 1.1, 1.3, 1.4, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7 |  |
| poc | Testing feasibility with the smallest useful implementation path | 5/30 | minimal | minimal | 1.1, 2.1, 2.3, 3.5, 3.6 | Plan approval off. |
| bugfix | A known defect that needs a focused fix and regression test | 6/30 | minimal | minimal | 2.1, 2.3, 3.5, 3.6, 4.1, 4.3 |  |
| refactor | Improving existing code without changing product behavior | 7/30 | minimal | minimal | 2.1, 2.3, 3.1, 3.5, 3.6, 4.1, 4.3 |  |
| infra | Environments, IaC, deployment foundations, or cost work | 12/30 | standard | standard | 2.2, 2.3, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4 |  |
| security-patch | A CVE or focused vulnerability response | 7/30 | minimal | minimal | 2.1, 2.3, 3.2, 3.5, 3.6, 4.1, 4.3 |  |
| workshop | A facilitated training or group delivery session | 23/30 | standard | minimal | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7 | Normal reviews capped at one advisory pass. Keywords: workshop, lab, training. |

Stages marked * are conditional for this profile.

### Depth levels

- **minimal**: Core essentials only. Short documents, key decisions, minimal supporting analysis.
- **standard**: Balanced detail. Complete requirements, architecture decisions with rationale, thorough test plans.
- **comprehensive**: Full enterprise detail. Exhaustive requirements, compliance matrices, detailed NFR specifications.

### Test-strategy levels

- **minimal**: 1 test per identified requirement plus a happy-path floor; about 5–15 tests for a typical project.
- **standard**: 5–8 tests per component; unit and integration.
- **comprehensive**: 10–15 tests per component; all test types.

### Choosing a profile

- /aidlc <profile> <description>, e.g. /aidlc bugfix Fix the login timeout issue
- /aidlc --scope <profile>
- /aidlc compose "<request>" asks the composer agent to propose a stage grid
- With no profile named, the assistant proposes one; the default is classic.
- Overrides: --depth minimal|standard|comprehensive, --test-strategy minimal|standard|comprehensive, --review adversarial|advisory|none

## Agents

| Agent | Kind | Domain | Role | Leads | Supports | Reviews |
|---|---|---|---|---|---|---|
| aidlc-product-agent | domain | Requirements, user stories, scope, market research | Product manager and business analyst: captures intent, does market research, defines scope, elicits requirements, produces user stories. | intent-capture, market-research, scope-definition, requirements-analysis, user-stories | rough-mockups, approval-handoff, refined-mockups | — |
| aidlc-design-agent | domain | UX/UI design, wireframes, interaction design, accessibility | Creates wireframes, mockups and interaction specs. | rough-mockups, refined-mockups | user-stories, domain-design | — |
| aidlc-delivery-agent | domain | Team formation, capacity planning, delivery sequencing | Engineering manager: assesses capacity, forms mob composition, plans sequencing, manages phase handoffs. | team-formation, approval-handoff, delivery-planning | scope-definition, units-generation | — |
| aidlc-architect-agent | domain | Domain design, domain modelling, NFRs, component decomposition | Described as the "central design authority"; involved in 10 stages across 3 phases. | feasibility, domain-design, units-generation, contract-design, functional-design, nfr-requirements, nfr-design | intent-capture, reverse-engineering, delivery-planning | — |
| aidlc-aws-platform-agent | domain | AWS infrastructure, CDK/CloudFormation, cost optimization | Designs infrastructure, provisions environments, optimizes costs. | infrastructure-design, environment-provisioning | feasibility, domain-design, contract-design, nfr-design, feedback-optimization | — |
| aidlc-compliance-agent | domain | Regulatory scanning, data classification, risk assessment | Advisory only; "has no lead stages". | — | feasibility, nfr-requirements, infrastructure-design, environment-provisioning | — |
| aidlc-devsecops-agent | domain | Threat modelling, security scanning, DevSecOps pipelines | Reviews designs for security, defines security requirements, integrates security into CI/CD. Support role only. | — | practices-discovery, nfr-requirements, infrastructure-design, build-and-test, environment-provisioning | — |
| aidlc-developer-agent | domain | Code implementation, code analysis, data modelling | Spans Inception through Operation. | reverse-engineering, code-generation | practices-discovery, user-stories, functional-design, deployment-execution | — |
| aidlc-quality-agent | domain | Test strategy, test generation, performance validation | Defines test strategy, generates test suites, validates quality gates, runs performance testing. | build-and-test, performance-validation | practices-discovery, user-stories, nfr-requirements | — |
| aidlc-pipeline-deploy-agent | domain | CI/CD pipelines, deployment strategy, release execution | Configures CI/CD, plans deployment strategy, executes releases with rollback. | practices-discovery, ci-pipeline, deployment-pipeline, deployment-execution | — | — |
| aidlc-operations-agent | domain | Observability, incident response, SLO tracking, feedback loops | Sets up monitoring, defines incident response, feeds insights back to the product agent. | observability-setup, incident-response, feedback-optimization | — | — |
| aidlc-product-lead-agent | reviewer | Review of requirements, stories and UX artifacts | Reviewer; reviewers "do not produce artifacts". | — | — | intent-capture, rough-mockups, refined-mockups, requirements-analysis, user-stories |
| aidlc-architecture-reviewer-agent | reviewer | Review of technical design artifacts | Reviewer; reviewers "do not produce artifacts". | — | — | domain-design, units-generation, contract-design, functional-design, nfr-requirements, nfr-design, infrastructure-design, code-generation |
| aidlc-composer-agent | composer | Adaptive workflows | Estimates implementation entropy and proposes an EXECUTE/SKIP stage grid for approval. Dispatched by /aidlc compose. | — | — | — |
