# Agent Operating Rules for Data Investigations

When building, auditing, or editing a data-driven essay, public-records report, or interactive explorer with this kit, enforce these non-negotiable standards:

## 1. Zero Mental Math — Compute Deterministically
- Never estimate or sum monetary totals, medians, percentages, or entity rankings in prose from memory.
- Always run `node bin/data-kit.mjs kpis --spec <investigation.spec.json>` and bind headline figures via `data-kpi="<token>"` and `mustContainKpis`.

## 2. Explicit Scope & Denominator Hygiene
- **Core vs. Incidental:** Keep incidental matches (e.g., building renovations, furniture, or catering that only match a keyword via a department name) inside the JSON dataset for full auditability, tagged `category: "incidental"` and `scope: "incidental"`, excluded from core headline sums by default.
- **Pure vs. Mixed Scope:** Distinguish pure-scope records (`scope: "pure"`) from inseparable multi-discipline lump sums (`scope: "mixed"`).
- **Competition Denominators:** Never conflate missing bid disclosures with sole-source contracts. Inspect source notices and tag non-competitive statutory awards explicitly with `awardMode: "sole_source"` and `bidCount: null`, keeping them distinct from the open-tender `bidCount >= 1` denominator.
- **Contract Commitments vs. Annual Cash:** State upfront whether monetary figures represent multi-year signed contract totals or single-year cash outlays, and expose dual date-grouping modes (`publishedDate` vs. physical `eventDate`) whenever calendar boundary shifts exist.

## 3. Epistemic Honesty & Modest Editorial Voice
- Clearly separate what the source filings directly establish from forward-looking budget or policy hypotheses.
- Preserve every primary-source link (`sourceUrl`) and document every clerical correction (`auditFlags`, `auditNote`) transparently rather than silently overwriting raw anomalies.

## 4. Mandatory Pre-Completion Gate
- No edit to dataset JSON, prose HTML/Markdown, presets, or OpenGraph cards is complete until `node bin/data-kit.mjs verify --spec <investigation.spec.json>` exits with code `0`.
