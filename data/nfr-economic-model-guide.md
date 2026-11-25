# NFR and cost models: formulas

All inputs are entered by the user. These are the studio's own calculations, not benchmarks or price quotes.

## 1. Average-based monthly projection (`src/lib/financial.ts`)

With D = requests/day, M = days in the window, P = peak multiplier, L = average latency (s), H = headroom, C = model calls per request, R = retry overhead (decimal), S = stress factor:

- Monthly requests = D × M × S
- Peak RPS = D × P × S / 86,400
- In-flight estimate = peak RPS × L × H (Little's law)
- Input tokens/month = monthly requests × C × (1 + R) × input tokens per call; output tokens likewise
- Inference cost = input tokens × input price / 1,000,000 + output tokens × output price / 1,000,000
- Retrieval cost = monthly requests × retrieval cost per request
- Human review cost = monthly requests × review rate × minutes per review / 60 × hourly rate
- Monthly total = inference + retrieval + human review + fixed platform + storage GB × price
- The stress factor changes traffic-dependent amounts only.

## 2. Graph simulation (`src/lib/simulation.ts`)

For each simulated request (default 2,000 runs, seeded PRNG):

1. Start at every node that has no incoming edge (if every node has one, start at the first node).
2. On each visit, add the node's cost: input tokens × ((1 − cached share) × input price + cached share × cached price) / 1e6 + output tokens × output price / 1e6 + other cost per visit. Add its latency.
3. Leave the node by its routing: `one` picks one outgoing edge with the edge probabilities (probabilities above a total of 1 are normalised; the remainder ends the path); `all` follows each edge whose probability draw succeeds, and latency takes the slowest branch.
4. A node visited as many times as its max visits stops that path (counted as a visit-cap hit). A node whose cost in the request exceeds its spend cap is counted as a spend-cap hit; the run continues.
5. Each run stops after 5,000 node visits in total.

Reported: mean, P50, P95 and max of cost and latency per request; per-node mean visits and cost; the share of runs hitting a visit cap or spend cap; monthly graph cost = mean cost × monthly requests.

## 3. Error budget (`src/lib/slo.ts`)

- Budget fraction = 1 − availability SLO / 100
- Allowed downtime = budget fraction × days × 24 × 60 minutes
- Allowed failed requests = budget fraction × requests in the window
- The simulated P95 latency is compared with the P95 target: within, exceeds, or no target.

## What these models leave out

Queueing and contention, rate limits of downstream services, multi-region failover, egress, reserved capacity and commitments, licences, taxes, currency, and any correlation between node outcomes. Replace inputs with measured values and provider quotes before using the figures for decisions.
