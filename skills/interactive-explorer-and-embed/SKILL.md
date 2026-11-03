---
name: interactive-explorer-and-embed
description: >-
  Build or polish a zero-framework interactive data explorer, responsive SVG
  charts, newsroom iframe embed mode, 1-click investigative lenses, and
  deep-link quote sharing. Use this skill when creating the frontend for an
  interactive data essay or upgrading UX for newsroom syndication and social
  sharing across mobile, tablet, and desktop viewports.
---

# Interactive Explorer, Charts & Newsroom Embed UX

Use this workflow to turn a static report and JSON dataset into an interactive, self-verifying tool that newsrooms can embed and social readers can explore on phones without horizontal overflow.

## Step 1: Scaffold or Structure the Explorer

To initialize a fresh project with the reference zero-framework HTML/CSS/JS architecture, run [data-kit.mjs](../../bin/data-kit.mjs):

```bash
node bin/data-kit.mjs init <project-dir> --title "Your Investigation Title"
```

Every production explorer should include five reader- and newsroom-centric mechanics:

1. **Zero-Flash `?embed=1` Newsroom Widget Mode:**
   Place an inline `<script>` in `<head>` (`if (location.search.includes('embed=1')) document.documentElement.classList.add('is-embed')`) that hides site navigation, essay chapters, and quick-lens strips (`html.is-embed .report-chrome { display: none !important }`), leaving a clean, attributable database widget with a one-click **`Copy iframe`** button.
2. **1-Click Investigative Lenses:**
   Render a toolbar of 5–8 pre-built filter pills above the KPI strip (e.g., *All core*, *Single-bid deployments*, *Sole-source awards*, *Pure scope only*, *Incidental exclusions*) with live record counts in parentheses so readers discover the sharpest slices in one click.
3. **1-Click `Copy quote + link` Citation Generator:**
   Generate a factual one-sentence summary of the currently active filter slice plus its exact URL query string (`?cat=...&single=1#explorer`) onto the clipboard so journalists and social commenters share verifiable deep links.
4. **3-Card Source Anomaly Specimen Grid:**
   Display side-by-side "Filing Specimens" showing exact section numbers, estimated/bid baselines, and highlighted clerical or scope distortions (`is-error`) with direct links to official filings.
5. **Accessible `<noscript>` & `@media print` Fallbacks:**
   Always include a `<noscript>` summary + direct JSON download link inside `#data-explorer`, auto-expand `<details>` methodology caveats on `beforeprint`, and hide interactive filter chrome in `@media print`.

## Step 2: Multi-Viewport & Typography Guardrails

- **Above-the-fold balance (`1440px`):** Keep `.meta-box` upfront caveats concise (~60–80 words in 3 bullets) and place extended statutory/accounting notes inside `<details class="meta-more">` so the 4 headline KPI cards remain visible above the fold.
- **Laptop & tablet table grid (`768px–1100px`):** Tighten column widths below `1100px` so right-aligned `Filing ↗` source buttons never clip, and switch `.exp-row` to a stacked card layout at `<=760px` with `.exp-row.is-head { display: none }`.
- **Mobile (`360px–390px`):** Keep a compact sticky CTA (`Database (N) ↓`) in the chapter bar, span odd trailing KPI cells across full width (`grid-column: 1 / -1`), and use a mobile-proportioned SVG `viewBox` (e.g., `500×344`) on scatter/distribution charts so axis labels remain legible.
- **Consistent rounding:** Format medians identically between prose, chart labels, and explorer KPI strips (e.g., 1 decimal place in thousands: `148.5k`).

## Step 3: Verification

1. Run `node --check <path/to/explorer.js>` to confirm syntax validity.
2. Run `node bin/data-kit.mjs verify --spec investigation.spec.json` to validate all `#anchors`, `data-preset` links, and `<noscript>` fallbacks.
3. When Playwright is available, verify `document.documentElement.scrollWidth <= window.innerWidth + 1` and `0` console errors across `1440px`, `1024px`, `768px`, `720px (?embed=1)`, and `390px`.
