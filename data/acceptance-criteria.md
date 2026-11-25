# Acceptance criteria

Items marked (e2e) are covered by `npm run test:e2e`; the rest are manual.

## Workflow

1. (e2e) Open the app: no use case is open and no request leaves localhost while moving between pages.
2. Create a blank use case: all text fields are empty; the profile is `classic` (the AI-DLC default).
3. (e2e) Pick a profile on Use-case framing: the page lists the stages it runs and skips. Create the stage plan on AI-DLC lifecycle: it contains exactly the profile's stages plus 0.1–0.3 (poc → 8 stages).
4. On AI-DLC lifecycle, every stage shows lead agent, supporting agents, reviewer, mode, runs/condition, gate and output files. If the plan differs from the profile, the page lists the differences.
5. (e2e) Add a node on the Agentic designer: its threat list appears with the items for its kind; each item shows its framework and links to its reference.
6. Set edge probabilities and routing; the warning panel flags probabilities outside 0–1 and nodes without identity or permissions.
7. (e2e) Enter node cost and latency inputs and run the simulation: mean/P50/P95/max cost and latency, per-node shares and cap-hit rates appear; changing the graph shows a "run again" notice; the same seed gives the same numbers.
8. Enter an availability SLO: the error budget shows minutes and failed requests (99.9% over 30 days = 43.2 minutes).
9. Create the control register: all 35 controls start unassessed; each expanded control shows its NIST AI RMF, OWASP and ATLAS IDs with text and its references.
10. (e2e) Save, reload, Open saved: the case returns with graph, stages, controls and threats.
11. Import a case exported before this release: it opens, new node fields get defaults, edges get probability 1, threats start empty. Import a file with an invalid enum: the import is rejected with the schema error.
12. (e2e) Reports: vision.md downloads with the upstream headings; the `/aidlc … Read ./vision.md and build what it describes` command is shown. Markdown, HTML, JSON, CSV and technical-environment.md download.
13. (e2e) AWS samples with GitHub returning an error: an error box appears and no samples are shown.
14. (e2e) References: search `ASI02` shows one card; "Cited by" OPS-04 on the FOCUS card opens Trust & security with OPS-04 expanded.
15. (e2e) Workshop, self-paced: answering a checkpoint question marks it right or wrong immediately and shows its source; progress survives a reload. Facilitated: "Show answer" reveals it.
16. User text that looks like HTML is escaped in the HTML report.
17. (e2e) The left column ends with "AIDLC + Trusted AI Planner by SHAURYA AGARWAL © 2026" and no process notes.
18. (e2e) The bottom-right "Next" chip is visible on every page; with no case it suggests creating one; it updates as the case fills; expanded, it shows what the current page contributes and up to four next steps, each with its source.
19. (e2e) Load sample… opens a fictional case that fills framing, graph, threats, NFR inputs, controls, stage plan, Units, decisions and scenarios. The NFR & cost lab can apply a sample's inputs alone.
20. (e2e) Reports → Implementation kit lists CLAUDE.md, AGENTS.md, skills, subagents, .mcp.json, MCP files; switching to Python swaps in mcp/server.py and pyproject.toml; "All files (.zip)" downloads a valid zip.
21. (e2e) Reports → Workspace package lists `aidlc/spaces/default/memory/templates/` (24 AI-DLC team templates), `docs/aidlc/stage-gates.md` and `docs/trusted-ai/` (4 files) alongside the agent files; the template toggle removes the templates; the zip downloads. Each template's `##` headings match the stage rule's description of the artifact.
22. (e2e) Navigation: the top bar shows ← Back to the previous page; browser Back/Forward follow page changes; NFR simulation rows open the node; threat rows link to their controls; a control's threat entries open the node; references link to controls, stages, pages and workshop modules.
23. (e2e) Trust & security shows coverage NIST AI RMF 72/72, OWASP LLM 10/10, OWASP Agentic 10/10.
24. Designer warns about tools without an action type, state-changing tools with no human confirmation (and no human node before them), code execution without a sandbox, open-world nodes without an egress list, and retries into non-idempotent state-changing nodes.
25. The workspace AGENTS.md starts with "How to work in this repository" (read order, AI-DLC command, every gate type, never approve a gate on a person's behalf, templates, skills for agents without Claude skills, subagents, release decision) and has node security attributes, MCP server requirements for the chosen transport, and SEC control status. stage-gates.md lists all 13 gate types.
26. (e2e) Each planning page shows an "In the export" bar; expanded, it lists file, section and use for that page's inputs. Reports shows the full map; the package contains docs/TRACEABILITY.md. A test builds the sample package and checks every mapped file and section exists.
27. (e2e) Selecting a RAG technique lists it under "Patterns and retrieval in this design" as not assigned until a retriever node implements it; "add a retriever node for it" creates one. Inserted blueprint nodes are tagged with their pattern; any node can be tagged. The package then has docs/architecture/architecture.md (Mermaid, patterns with control questions and assessment criteria, RAG per retriever node), agent-graph.mmd, the architecture-patterns and retrieval skills, SKILLS.md, Pattern and RAG columns in AGENTS.md, and pattern/RAG lines in subagent files.

## Automated checks

- `npm run test:logic` (72 tests): catalog counts and integrity, AI-DLC stage/profile/agent consistency with the guide's stated counts, framework IDs resolve, simulation and SLO maths, workshop answers computed from data, schema validation, generated docs up to date.
- `npm run docs:check`: `data/references.md` and `data/aidlc-stage-guide.md` match their sources.
- `npm run check`: 0 errors, 0 warnings. `npm run build` succeeds.
