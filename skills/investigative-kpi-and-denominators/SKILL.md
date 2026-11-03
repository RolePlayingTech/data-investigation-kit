---
name: investigative-kpi-and-denominators
description: >-
  Compute deterministic monetary sums, medians, category shares, competition
  rates, and time-series denominators for a data investigation. Use this skill
  when summarizing a cleaned dataset, framing editorial findings, comparing
  notice volume against contract value, or checking numbers before writing prose.
---

# Investigative KPIs & Denominators

Never calculate aggregate amounts, percentages, or medians by hand or in an LLM prompt. Use [data-kit.mjs](../../bin/data-kit.mjs) to compute exact integer-cent metrics and surface structural contrasts.

## Step 1: Generate the Canonical KPI Sheet

Run the KPI engine against your workspace specification:

```bash
node bin/data-kit.mjs kpis --spec investigation.spec.json
```

For machine-readable bindings (e.g., when populating chart configs or prose assertions), output JSON:

```bash
node bin/data-kit.mjs kpis --spec investigation.spec.json --format json
```

## Step 2: Frame Findings Around Structural Contrasts

Check four high-signal analytical cuts in the KPI output:

1. **Notice Volume Share vs. Monetary Value Share:** Compare `categories.<key>.recordPct` against `categories.<key>.valuePct`. Small, frequent purchases (like workshops or micro-grants) often dominate notice counts while representing `<10%` of contracted money.
2. **Bidding / Competition Divide:** Compare `medianBids` and `singleBidPct` across categories, keeping `withBidsCount` (competitive awards) separate from `soleSourceCount` (`awardMode: "sole_source"`). Report both the competitive single-bid rate and the combined zero-rival share (`(singleBidCount + soleSourceCount) / signedCount`) when sole-source lock-in is part of the story.
3. **Pure Scope vs. Mixed Turnkey Bundles:** Report `totals.coreSumMillions` alongside the exact split between `scope.pureSumMillions` (`pureValuePct%`) and `scope.mixedSumMillions` (`mixedValuePct%`) so readers see how much sits inside multi-discipline lump sums.
4. **Publication Year vs. Event/Signing Year:** Check `publicationYears` against `eventYears`. If late-December contracts published in January shift multi-year growth multipliers, disclose both numbers explicitly.

## Step 3: Bind Prose to Live Tokens

Wrap headline numbers in HTML with `data-kpi="<token>"` (for example `<span data-kpi="totals.coreSumMillions">...</span>`) and list required narrative metrics under `mustContainKpis` in `investigation.spec.json` so any future dataset refresh fails `data-kit verify` immediately if prose lags behind.
