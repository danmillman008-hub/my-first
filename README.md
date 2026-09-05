# Private Self-Adapting Learning Agent

Tell it what you want to learn in plain language — *"I want to learn Bash"*, *"Teach me OOP"*, *"I want to learn Rust, especially ownership"* — and the agent interprets the goal, investigates the subject if it has never taught it, builds a prerequisite graph, diagnoses what you already know, teaches, observes how you respond, and continuously adapts **while keeping a persistent, inspectable model of you**.

## What it does (verified by `scripts/simulate.mjs` against the running app)

| Capability | Mechanism | Evidence from harness |
|---|---|---|
| Understand the goal | heuristic parser (LLM when configured): subject, level, focus terms | `"Bash, I already know the basics"` → subject *Bash*, level *intermediate* |
| Investigate unknown subjects | Wikipedia research: learnability-ranked disambiguation, section structure → concepts, lead-definition links → prerequisites, text-reference → prerequisite edges, exercise synthesis (definition matching, cloze, T/F) | photosynthesis → 14 concepts, 17 edges, 56 exercises; *Rust ownership* → Rust (programming language), not iron oxide |
| Curated expertise + latent knowledge | Bash & OOP packs with 5 explanation styles and misconception-tagged exercises; latent concepts activated only when a gap appears | word-splitting discovered from quoting errors, linked as prerequisite, taught, then return |
| Diagnose | adaptive bisection over the topological order, self-report shortcuts | expert: 4 probes → all 10 concepts mastered in 21 steps |
| Mastery beliefs with uncertainty | Bayesian Knowledge Tracing + Beta pseudo-counts; basis ∈ prior / inferred / demonstrated; evidence propagates to prerequisites | 24 inference events in one session |
| Learn *how to teach you* | Thompson sampling over explanation strategies, global + per-domain scopes, sharpened once evidence is strong; explicit feedback also rewards/penalises | example-dependent learner → concrete_example 0.85–0.92; preference carries into a new subject (7/7) |
| Verify adaptations | every strategy switch is a logged decision whose *outcome* is filled in by the next answer | `verify_adaptation` decisions with worked / did not work |
| Detect and fill gaps | misconception → prerequisite probe, or graph extension (latent → LLM → web research) | `extend_graph` decisions; "what is chlorophyll?" → researched & added |
| Affect | frustration / confusion / engagement / fatigue / confidence from streaks, latency vs. personal baseline, hints, feedback buttons, lexical cues; drives re-explanation, easier items, skip-ahead, break suggestions | 15 `affect_response` decisions for a frustrated learner |
| Give up gracefully | after every style has failed: `strategy_exhausted` → essentials + simplest item + invitation to ask about unknown terms | |
| Persist everything | append-only evidence, mutable beliefs, traits with confidence & rationale, affect timeline, decision log | sessions resume with beliefs intact |
| Interoperate | MCP Streamable HTTP at `POST /api/mcp` | 11 tools exercised end-to-end |

## Intelligence modes

* **No API key (default here):** built-in reasoner + live web research. All adaptive machinery is fully active.
* **`ANTHROPIC_API_KEY` or `OPENAI_API_KEY`:** LLM used for goal interpretation, research-grounded curriculum synthesis for any subject, free-text grading, open Q&A, and LLM-generated gap concepts. Optional `ANTHROPIC_MODEL`, `OPENAI_MODEL`, `ANTHROPIC_BASE_URL`, `OPENAI_BASE_URL` (path verified with a mock OpenAI-compatible endpoint).

## Architecture

```
src/lib/agent/
  intelligence.ts   LLM provider abstraction with deterministic fallbacks
  research.ts       Wikipedia investigation, ranking/disambiguation, exercise & explanation synthesis
  packs/            curated expertise (bash, oop) incl. latent concepts
  domain.ts         goal interpretation → domain build (existing/curated/LLM/research) → graph extension
  mastery.ts        BKT + Beta uncertainty, prerequisite propagation, self-reports
  strategy.ts       Thompson-sampling strategy bandit, learner traits
  affect.ts         affect estimation from behavioural + explicit signals
  tutor.ts          the agent loop: diagnose → teach → observe → update → verify → re-plan
  learner-model.ts  inspectable snapshots (UI + MCP)
src/app/api/        goals, turns, learner, mcp
src/db/schema.ts    learners, domains, concepts, prerequisites, goals, mastery_beliefs,
                    evidence_events, strategy_stats, learner_traits, affect_states,
                    sessions, turns, agent_decisions
```

## MCP

Stateless Streamable HTTP endpoint: `POST /api/mcp`. Tools: `create_learner`, `get_learner_state`, `list_goals`, `create_goal`, `get_concept_graph`, `get_mastery`, `get_recommendation`, `tutoring_turn`, `get_interaction_history`, `record_evidence`, `extend_graph`. Resource: `pal://schema/learner-model`.

## Testing

```
node scripts/simulate.mjs          # BASE=http://localhost:3000 by default
```

Simulates an expert, a prerequisite-gap learner, an example-dependent learner (then a second subject), a frustrated learner, an open-domain subject, and an MCP client — 30 behavioural checks against the real API and database.
