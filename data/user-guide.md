# User guide

How to plan one agentic AI use case in the studio. The Workshop page walks through the same steps as modules 1–8.

## 1. Start

To explore every page with data first, pick a case from **Load sample…** in the top bar. Samples are fictional and their numbers are example values.

The **Next** chip in the bottom-right corner always shows the next step for the open case; click it to see why that step matters (the AI-DLC stage output or NIST AI RMF / OWASP text behind it).

**+ New use case** creates an empty case. **Open saved** and **Import JSON** bring back earlier work. **AWS samples → Fetch AWS samples live** reads the AWS sample repository from GitHub; **Use as draft** copies a README's title and summary into a new case and records the source URL and commit.

## 2. Frame the intent (Use-case framing)

Fill in the problem, outcome, scope, exclusions, success metrics, owners, jurisdictions, data classification and risk tier. Pick an AI-DLC workflow profile. The page lists the stages that profile runs and skips, with its depth and test strategy, as stated in the AI-DLC v2.11.5 guide. These fields fill the sections of the `vision.md` export.

## 3. Design the agent graph (Agentic designer)

- Insert a pattern blueprint or add nodes by hand. Blueprint edges start with probability 1.
- For each node record tool permissions, identity (the credential it acts under), owner, timeout, max visits per request, spend cap, and the cost and latency inputs used by the simulation: tokens in and out, prices per million tokens, cached-input share and price, other cost per visit, latency per visit.
- **Routing** decides how the simulation leaves a node: `one` picks a single outgoing edge by probability (any remaining probability ends the path); `all` follows every edge whose probability draw succeeds.
- Each node shows the OWASP 2026 and ATLAS 2026.10 items listed for its kind. Set each to mitigated, accepted or not applicable and write the mitigation. The list per node kind is the studio's own mapping.
- Add test scenarios (positive, failure and adversarial). The warning panel lists missing permissions, identities, spend caps, human or policy nodes, cycles and out-of-range probabilities.

## 4. Scale, cost and SLOs (NFR & cost lab)

- Enter requests per day, peak multiplier, latency, availability SLO, RTO/RPO and the average-based cost inputs. The projection shows monthly requests, peak RPS, an in-flight estimate (Little's law) and monthly cost by component.
- **Run simulation** walks the agent graph for each simulated request and reports mean, P50, P95 and max cost and latency, the share of cost per node, and how often a node hits its visit cap or spend cap. The same seed always gives the same result.
- The error budget is (100% − availability SLO) × the window, shown in minutes and in failed requests.

## 5. Controls (Trust & security)

**Create control register** starts all 35 controls as unassessed. For each, record owner, status, evidence or exception, and likelihood × impact. Each control lists the NIST AI RMF 1.0 subcategories (with their text), OWASP 2026 items and ATLAS techniques it relates to; this mapping is the studio's own. "Essential controls evidenced" counts essential controls set to evidenced with both an owner and evidence text. "Risk accepted" is never counted as evidence.

## 6. Lifecycle plan (AI-DLC lifecycle)

**Create stage plan from profile** adds the stages the chosen profile runs. Each stage shows its lead, supporting and reviewer agents, mode, conditions, gate and the files AI-DLC writes for it. Record owner, approver and evidence per stage. Add Units of Work with dependencies to get dependency waves and a critical-path estimate, and record decisions.

## 7. Export (Reports & exports)

**Workspace package:** choose TypeScript or Python, keep or drop the AI-DLC team templates, and download single files or one zip to unpack at the root of the repository. Besides the files below it contains `aidlc/spaces/default/memory/templates/` (24 templates: AI-DLC uses each template's `##` headings as the structure of that artifact and checks them at the gate), `docs/aidlc/stage-gates.md` (each planned gate with its artifacts, owners and the Trusted AI controls to check) and `docs/trusted-ai/` (threat model, control register, cost and capacity, release decision). `PACKAGE.md` lists every file and the start commands.

The package's agent files: The kit contains CLAUDE.md (starting with `@AGENTS.md`), AGENTS.md (overview, build and test commands, code style, agent graph, tests, security, targets, delivery plan), three skills under `.claude/skills/`, one subagent per agent/orchestrator/validator node under `.claude/agents/`, `.mcp.json`, `mcp/tools.json` and an MCP server scaffold, plus vision.md and technical-environment.md. Tool input schemas and annotations are left for you to fill in.


Download the case report (Markdown or HTML for printing), case JSON, controls CSV, the reference report, `vision.md` and `technical-environment.md`. To continue in AI-DLC: put `vision.md` in the project root, save `technical-environment.md` at `aidlc/spaces/default/knowledge/aidlc-shared/technical-environment.md`, and run the command shown on the page, for example `/aidlc workshop Read ./vision.md and build what it describes`.
