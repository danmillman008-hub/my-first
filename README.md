# Private Self-Adapting Learning Agent

One tutor, one continuous relationship. The learner talks naturally; the agent adapts around the
conversation using a two-timescale memory that learns from evidence and stays revisable.

## Architecture (src/)

```
agent/perceive.ts   what happened this turn (intent, lightly-interpreted observations, answer grading)
memory/index.ts     working memory (observations) → consolidation → beliefs (LTM, prior not verdict)
                    BKT-style knowledge state from demonstrated evidence; graph touch/reinforce; dormancy
agent/policy.ts     style choice (present > working memory > scoped beliefs > default), next concept,
                    probe decision (value of information × disruption budget)
agent/compose.ts    offline response composer (no visible "modes")
agent/run.ts        one turn: perceive → record → consolidate → context → decide → respond → learn
knowledge/          seed domain packs + open-domain research (LLM → Wikipedia sections → learner)
llm/                OpenAI-compatible / Anthropic providers; offline engine when no key is set
lab/                synthetic learners with hidden traits, ablations, long-horizon runs
```

Key principles implemented:
- **Observation before interpretation**: observations store *what happened*; interpretations are tentative.
- **Beliefs are priors**: confidence = beta-like(support, contradictions); promotion needs cross-session
  confirmation; contradictions demote; 3 consecutive contradictions retire (never delete) and link a successor.
- **Context-specific**: beliefs are scoped (`*`, `domain:x`, `activity:y`); specific scopes outrank global.
- **Behaviour over self-report**: stated preferences are honored now but weighed against outcomes;
  claims set `claimed`, never `p_known`; exposure alone caps p_known at 0.45.
- **Frequency ≠ meaning**: `touch_count` is recorded but never used in decisions.
- **Probing is rationed**: a check requires meaningful uncertainty that affects the next step and a budget.
- **Dormancy is reversible**: read-time recency weighting, dormant status, automatic reactivation.

## Running

```
npm run dev                      # app (offline engine unless OPENAI_API_KEY / ANTHROPIC_API_KEY set)
npx tsx --env-file=.env src/lab/run.ts --name=abl_none --seeds=1,2,3 --sessions=8 --turns=10
LA_ABLATION=no_ltm npx tsx --env-file=.env src/lab/run.ts --name=abl_no_ltm --ablation=no_ltm
npx tsx --env-file=.env src/lab/longhorizon.ts
```
Results are stored in `lab_runs` and shown at `/lab`. Transcripts land in `lab-results/`.

Env: `OPENAI_API_KEY` (+ optional `OPENAI_BASE_URL`, `OPENAI_MODEL`), or `ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`).
