---
name: registry-etl-and-hygiene
description: >-
  Harvest, join, deduplicate, and clean messy public-registry filings into an
  audited JSON dataset. Use this skill when ingesting government procurement,
  grant, court, regulatory, or civic APIs where pagination caps, broken server
  filters, clerical amount typos, multi-lot paste bugs, or keyword false
  positives can corrupt naive totals.
---

# Registry ETL & Data Hygiene

Follow this workflow whenever building or updating an investigation dataset from raw public APIs, CSV dumps, or HTML filings.

## Step 1: Safe Harvesting & Deterministic Joining

1. **Defend against silent pagination truncation:** Many public endpoints cap responses (e.g., `pageSize=500` or `1000`) without throwing an error. Recursively split query windows by date until every slice returns strictly fewer records than the server cap.
2. **Join lifecycle notices client-side:** Do not trust server-side parent-ID filters without verification. Harvest initiation notices, amendments, and award/outcome filings across your date window and join them deterministically by proceeding ID in code.
3. **Preserve raw provenance:** Store raw API payloads in an ignored local cache directory so every normalization rule can be re-run idempotently without re-scraping.

## Step 2: Run the Automated Anomaly Scanner

Before drafting any findings, scan the assembled JSON array with [data-kit.mjs](../../bin/data-kit.mjs) and consult the [Registry Traps Checklist](./references/registry-traps-checklist.md):

```bash
node bin/data-kit.mjs audit <path/to/records.json> --strict
```

Inspect every flagged record against its primary source notice:

- **`TRAILING_ZERO_TYPO` / `MAGNITUDE_MISMATCH`:** Cross-check the entered final contract value against the winning bid and pre-tender estimate. When a clerk added an extra zero, record the verified bid in `amount`, keep the raw figure in `enteredAmount`, add `"amount_corrected"` to `auditFlags`, and explain the fix in `auditNote`.
- **`MULTILOT_TOTAL_PASTED`:** When a buyer pastes the combined multi-lot contract value into every individual lot's award field, sum the true lot-level winning bids instead of the duplicated contract field.
- **`ACRONYM_COLLISION`:** Strip domain collisions using word-boundary regexes and classification codes (e.g., CPV / NAICS / grant program codes).
- **`INCIDENTAL_PURCHASE_IN_CORE`:** Isolate routine facility, renovation, furniture, or catering filings that matched only via an institution's name into `category: "incidental"` and `scope: "incidental"`.
- **`AMBIGUOUS_NULL_BIDS`:** Check the legal procedure type on every resolved record with `bidCount: null`. Tag non-competitive statutory awards with `awardMode: "sole_source"` so they are never mislabeled as "missing data".
- **`VENDOR_NAME_DRIFT` / `BUYER_NAME_DRIFT`:** Normalize punctuation, casing, and pasted tax IDs so repeat winners aggregate accurately.

## Step 3: Verification

Re-run `node bin/data-kit.mjs audit <path/to/records.json> --strict` and confirm `high: 0` findings and valid schema compliance before moving to KPI computation.
