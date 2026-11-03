---
name: editorial-verification-gate
description: >-
  Configure and run automated zero-drift verification gates across datasets,
  report prose, deep-link presets, OpenGraph social cards, and multi-language
  editions. Use this skill before publishing or updating any data investigation
  to guarantee zero numeric drift, zero broken anchors, and full SEO/i18n parity.
---

# Editorial & Technical Verification Gate

Treat narrative prose, interactive charts, social preview cards, and raw JSON records as a single compiled artifact: if one record changes in `records.json`, the build must fail wherever a number, preset, or social card becomes stale.

## Step 1: Configure `investigation.spec.json`

Declare your dataset schema, enums, source URL regex, and every HTML/Markdown deliverable in `investigation.spec.json`:

```json
{
  "schemaVersion": 1,
  "title": "Municipal Infrastructure Grants Audit",
  "dataset": "data/records.json",
  "currency": "USD",
  "snapshotDate": "2026-06-01",
  "sourceUrlPattern": "^https://",
  "reports": [
    {
      "path": "site/index.html",
      "lang": "en",
      "ogImageFile": "assets/og-card.svg",
      "mustContainKpis": [
        "counts.all",
        "counts.core",
        "counts.coreSigned",
        "totals.coreSumMillions",
        "competition.singleBidPct"
      ]
    },
    {
      "path": "docs/methodology.md",
      "requireSeo": false,
      "mustContainKpis": ["counts.all", "counts.coreSigned", "totals.coreSumMillions"]
    }
  ]
}
```

## Step 2: Regenerate Deterministic Social Cards

Whenever the dataset changes, regenerate the `1200×630` OpenGraph card directly from live KPIs via [data-kit.mjs](../../bin/data-kit.mjs) so social previews never show outdated totals:

```bash
node bin/data-kit.mjs og --spec investigation.spec.json
```

## Step 3: Run the Zero-Drift Gate

Execute the verification gate:

```bash
node bin/data-kit.mjs verify --spec investigation.spec.json
```

Fix every reported error before considering the task done:
- **`[schema]`:** Missing required fields, duplicate IDs, negative amounts, invalid dates, sole-source records carrying competitive bid counts, or malformed `sourceUrl` values.
- **`[html-kpi]` / `[spec-kpi]`:** Prose text or `[data-kpi="..."]` elements out of sync with live integer-cent calculations from `records.json`.
- **`[html-anchors]` / `[html-presets]`:** Broken `#id` fragments, unsupported query parameters, unknown category/sector/region filters, or presets returning `0` matching records.
- **`[seo-og]` / `[i18n-seo]`:** Missing OpenGraph/Twitter meta tags, missing/empty `ogImageFile` on disk, or asymmetric `hreflang` links across translated report editions.
