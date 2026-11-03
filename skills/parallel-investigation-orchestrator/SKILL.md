---
name: parallel-investigation-orchestrator
description: >-
  Partition a data investigation, audit pass, or bilingual report build across
  parallel AI subagents with strict non-overlapping file ownership and a central
  verification gate. Use this skill when coordinating multiple agents to deliver
  a data essay, interactive explorer, social cards, and newsroom press kit
  simultaneously without merge conflicts or KPI drift.
---

# Parallel Investigation Orchestrator

Parallelizing a data investigation across subagents is fast only when **one source of truth governs numbers** and **no two agents touch the same file**.

## Step 1: Lock the Dataset First (Phase 0)

Never launch prose or chart-authoring subagents while record counts or monetary corrections are still in flux:

1. Finish ETL + `node bin/data-kit.mjs audit <records.json> --strict` first (or run `agent-1-data-hygiene` alone as Phase 0).
2. Freeze `data/records.json` and generate the canonical KPI table via `node bin/data-kit.mjs kpis --spec investigation.spec.json`.

## Step 2: Generate Disjoint Subagent Partitions (Phase 1)

Run [data-kit.mjs](../../bin/data-kit.mjs) to print conflict-free ownership boundaries:

```bash
node bin/data-kit.mjs parallel-plan --spec investigation.spec.json --agents 4
```

Enforce three coordinator rules in every subagent prompt:
1. **Strict write-scope:** List the exact files the subagent may create or edit, and forbid touching any other path.
2. **Read-only KPI sheet:** Paste the output of `data-kit kpis` directly into prose/editorial prompts so every subagent uses identical rounded figures and denominators.
3. **No git commits inside subagents:** Subagents write to disk and run read-only checks; the coordinator runs the final gate.

## Step 3: Central Gate & Editorial Packaging (Phase 2)

Once all parallel subagents report back:

1. Regenerate social cards if needed: `node bin/data-kit.mjs og --spec investigation.spec.json`.
2. Run the central verification gate: `node bin/data-kit.mjs verify --spec investigation.spec.json` (must exit `0`).
3. Review `docs/press-kit.md` to ensure newsroom pitches and social hooks highlight concrete structural findings, direct source links, and the `?embed=1` iframe snippet — with zero marketing fluff or unverified claims.
