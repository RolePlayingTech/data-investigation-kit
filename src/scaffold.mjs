import fs from 'node:fs';
import path from 'node:path';
import { computeKpis } from './kpis.mjs';
import { generateOgSvg } from './og.mjs';
import { EXPLORER_CSS_TEMPLATE, EXPLORER_JS_TEMPLATE } from './templates.mjs';

export function scaffoldWorkspace(targetDir, { title = 'Municipal Grid & Sensor Grants Investigation' } = {}) {
  const root = path.resolve(targetDir);
  for (const sub of ['data', 'site', 'assets', 'docs']) {
    fs.mkdirSync(path.join(root, sub), { recursive: true });
  }

  const starterRecords = [
    {
      id: 'REG-2026-001',
      publishedDate: '2026-02-14',
      eventDate: '2026-02-10',
      year: 2026,
      title: 'Telemetry Leak-Detection Software Rollout for District Water Mains',
      buyer: 'Metro Water Authority',
      city: 'Riverdale',
      region: 'North District',
      sector: 'Utilities',
      category: 'software',
      scope: 'pure',
      status: 'resolved',
      amount: 420000,
      estimatedAmount: 410000,
      bidCount: 1,
      awardMode: 'competitive',
      grantFunded: true,
      vendors: ['HydroGrid Analytics Inc.'],
      auditFlags: [],
      sourceUrl: 'https://example.org/filings/REG-2026-001'
    },
    {
      id: 'REG-2026-002',
      publishedDate: '2026-03-04',
      eventDate: '2026-03-01',
      year: 2026,
      title: 'Introductory Grid-Operations Data Literacy Workshop',
      buyer: 'County Public Works Board',
      city: 'Oakview',
      region: 'South District',
      sector: 'Local Government',
      category: 'training',
      scope: 'pure',
      status: 'resolved',
      amount: 18500,
      estimatedAmount: 20000,
      bidCount: 14,
      awardMode: 'competitive',
      grantFunded: true,
      vendors: ['CivicSkills Collective LLC'],
      auditFlags: [],
      sourceUrl: 'https://example.org/filings/REG-2026-002'
    },
    {
      id: 'REG-2026-003',
      publishedDate: '2026-04-19',
      eventDate: '2026-04-15',
      year: 2026,
      title: 'Proprietary SCADA Telemetry Connector Extension',
      buyer: 'Regional Hospital Energy Plant',
      city: 'harborview',
      region: 'Coastal District',
      sector: 'Healthcare',
      category: 'software',
      scope: 'pure',
      status: 'resolved',
      amount: 195000,
      estimatedAmount: 195000,
      bidCount: null,
      awardMode: 'sole_source',
      grantFunded: false,
      vendors: ['CoreSCADA Systems Corp.'],
      auditFlags: ['sole_source_verified'],
      auditNote: 'Sole-source award citing exclusive integration rights on incumbent SCADA controller.',
      sourceUrl: 'https://example.org/filings/REG-2026-003'
    },
    {
      id: 'REG-2026-004',
      publishedDate: '2026-05-08',
      eventDate: '2026-05-06',
      year: 2026,
      title: 'Repainting Smart-Grid Division Hallways and Office Chairs',
      buyer: 'Institute of Grid Engineering',
      city: 'Riverdale',
      region: 'North District',
      sector: 'Research & Higher Ed',
      category: 'incidental',
      scope: 'incidental',
      status: 'resolved',
      amount: 310000,
      estimatedAmount: 305000,
      bidCount: 5,
      awardMode: 'competitive',
      grantFunded: false,
      vendors: ['BuildRight Interiors Ltd.'],
      auditFlags: ['incidental_separated'],
      auditNote: 'Matched keyword only via division name; isolated from core technology totals.',
      sourceUrl: 'https://example.org/filings/REG-2026-004'
    }
  ];

  const spec = {
    schemaVersion: 1,
    title,
    dataset: 'data/records.json',
    currency: 'USD',
    snapshotDate: '2026-06-01',
    enums: {
      statuses: ['resolved', 'open', 'cancelled'],
      coreCategories: ['software', 'infrastructure', 'training', 'advisory'],
      incidentalCategory: 'incidental',
      scopes: ['pure', 'mixed', 'incidental'],
      awardModes: ['competitive', 'sole_source']
    },
    sourceUrlPattern: '^https://example\\.org/filings/',
    og: {
      kicker: 'ISSUE 01 · PUBLIC REGISTRY AUDIT',
      headline: title
    },
    reports: [
      {
        path: 'site/index.html',
        lang: 'en',
        ogImageFile: 'assets/og-card.svg',
        mustContainKpis: [
          'counts.all',
          'counts.core',
          'counts.coreSigned',
          'totals.coreSumMillions',
          'competition.singleBidPct'
        ]
      },
      {
        path: 'docs/methodology.md',
        requireSeo: false,
        mustContainKpis: ['counts.all', 'counts.coreSigned', 'totals.coreSumMillions']
      }
    ]
  };

  const kpis = computeKpis(starterRecords, spec);
  const ogSvg = generateOgSvg(kpis, spec);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Audited database of ${kpis.counts.all} public proceedings (${kpis.totals.coreSumMillions} across ${kpis.counts.coreSigned} signed core contracts).">
<meta property="og:title" content="${title}">
<meta property="og:description" content="Audited dataset of ${kpis.counts.all} public filings: ${kpis.totals.coreSumMillions} in signed core contracts, ${kpis.competition.singleBidPct}% single-bid rate.">
<meta property="og:image" content="https://example.org/assets/og-card.svg">
<meta name="twitter:card" content="summary_large_image">
<title>${title}</title>
<script>if(location.search.indexOf('embed=1')!==-1)document.documentElement.classList.add('is-embed');</script>
<link rel="stylesheet" href="./explorer.css">
<script src="./explorer.js" defer></script>
</head>
<body>
<nav class="subnav report-chrome">
  <div class="frame subnav-inner">
    <div class="subnav-links">
      <a href="#findings">01 · Key Findings</a>
      <a href="#hygiene">02 · Registry Hygiene</a>
    </div>
    <a class="subnav-cta" href="#explorer">Database (${kpis.counts.all}) ↓</a>
  </div>
</nav>

<header class="hero frame report-chrome" id="findings">
  <div class="kicker">Issue 01 · Source-Verified Investigation</div>
  <h1>${title}</h1>
  <div class="lead-grid">
    <div>
      <p>Every figure on this page is computed deterministically from <code data-kpi="counts.all">${kpis.counts.all}</code> audited registry records (<code data-kpi="counts.core">${kpis.counts.core}</code> core proceedings and <code data-kpi="counts.incidental">${kpis.counts.incidental}</code> incidental filings).</p>
      <p><a href="?single=1#explorer" data-preset="single=1">Inspect single-bid contracts ↓</a> · <a href="?sole=1#explorer" data-preset="sole=1">Inspect sole-source awards ↓</a></p>
    </div>
    <aside class="meta-box">
      <strong>Scope &amp; Accounting Guardrails</strong>
      <ul>
        <li>Tracks signed gross contract commitments, not annual cash outlays.</li>
        <li>Separates open competitive tenders from sole-source awards.</li>
      </ul>
      <details class="meta-more">
        <summary>Methodology &amp; audit details</summary>
        <p>Incidental facility filings are retained in JSON for transparency and excluded from core totals by default.</p>
      </details>
    </aside>
  </div>

  <div class="findings">
    <div class="finding">
      <span class="finding-num" data-kpi="totals.coreSumMillions">${kpis.totals.coreSumMillions}</span>
      <span class="finding-label">across <strong data-kpi="counts.coreSigned">${kpis.counts.coreSigned}</strong> signed core contracts</span>
    </div>
    <div class="finding">
      <span class="finding-num"><span data-kpi="competition.singleBidPct">${kpis.competition.singleBidPct}</span>%</span>
      <span class="finding-label">single-bid rate among competitive contracts</span>
    </div>
    <div class="finding">
      <span class="finding-num" data-kpi="competition.soleSourceCount">${kpis.competition.soleSourceCount}</span>
      <span class="finding-label">sole-source contracts without an open tender</span>
    </div>
    <div class="finding">
      <span class="finding-num" data-kpi="totals.incidentalSumMillions">${kpis.totals.incidentalSumMillions}</span>
      <span class="finding-label">isolated in incidental non-core filings</span>
    </div>
  </div>
</header>

<section class="chapter frame report-chrome" id="hygiene">
  <div class="kicker">Chapter 02 · Dirty Registries</div>
  <h2>Why naive keyword totals fail without filing-level validation</h2>
  <p>Public registries routinely mix core technology deployments with hallway renovations (<a href="?incidental=1&amp;cat=incidental#explorer" data-preset="incidental=1&amp;cat=incidental">see incidental records ↓</a>) and clerical entry typos.</p>
</section>

<section class="explorer-section" id="explorer">
  <div class="frame">
    <div id="data-explorer" data-src="../data/records.json" data-currency="${spec.currency}">
      <noscript>
        <p>Interactive filtering requires JavaScript. Download the full dataset of ${kpis.counts.all} audited proceedings directly at <a href="../data/records.json">records.json</a>.</p>
      </noscript>
    </div>
  </div>
</section>
</body>
</html>
`;

  const methodology = `# Methodology & Audit Log

- **Snapshot date:** \`${spec.snapshotDate}\`
- **Audited records:** ${kpis.counts.all} total (${kpis.counts.core} core, ${kpis.counts.incidental} incidental)
- **Signed core contracts:** ${kpis.counts.coreSigned} totaling ${kpis.totals.coreSumMillions}

## Verification Gate

Run \`npx data-investigation-kit verify --spec investigation.spec.json\` before publishing any prose or dataset edit.
`;

  const pressKit = `# Editorial & Embed Press Kit

## Embeddable Newsroom Explorer

Append \`?embed=1\` to the published report URL to embed the standalone interactive database without article chrome:

\`\`\`html
<iframe src="https://example.org/report/?embed=1" width="100%" height="760" style="border:1px solid #d4cfc3" loading="lazy"></iframe>
\`\`\`
`;

  fs.writeFileSync(path.join(root, 'data/records.json'), JSON.stringify(starterRecords, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'investigation.spec.json'), JSON.stringify(spec, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'assets/og-card.svg'), ogSvg);
  fs.writeFileSync(path.join(root, 'site/explorer.css'), EXPLORER_CSS_TEMPLATE);
  fs.writeFileSync(path.join(root, 'site/explorer.js'), EXPLORER_JS_TEMPLATE);
  fs.writeFileSync(path.join(root, 'site/index.html'), html);
  fs.writeFileSync(path.join(root, 'docs/methodology.md'), methodology);
  fs.writeFileSync(path.join(root, 'docs/press-kit.md'), pressKit);

  return { root, kpis };
}

/**
 * Generates a conflict-free multi-agent execution plan with strict file ownership boundaries.
 */
export function generateParallelPlan(spec, agentsCount = 4) {
  const datasetPath = spec.dataset || 'data/records.json';
  const reportPaths = (spec.reports || []).map((r) => r.path);

  const streams = [
    {
      id: 'agent-1-data-hygiene',
      role: 'Registry ETL & Source Auditor',
      owns: [datasetPath, 'scripts/etl.*'],
      readOnly: ['investigation.spec.json'],
      deliverable:
        'Audit raw filings, fix 10x trailing-zero and N-lot paste errors with explicit auditFlags, tag sole_source vs competitive bid counts, canonicalize entity names, and ensure `data-kit audit` reports 0 high-severity issues.'
    },
    {
      id: 'agent-2-explorer-ux',
      role: 'Interactive Explorer & Visual Engineer',
      owns: ['site/explorer.css', 'site/explorer.js', 'assets/*.svg'],
      readOnly: [datasetPath, 'investigation.spec.json'],
      deliverable:
        'Build responsive SVG charts, 1-click investigative lenses, `Copy quote + link` deep-link citations, `?embed=1` newsroom widget mode, and verify 0 horizontal overflows across 360px, 768px, 1024px, and 1440px.'
    },
    {
      id: 'agent-3-prose-and-specimens',
      role: 'Investigative Prose & Specimen Editor',
      owns: reportPaths.length ? reportPaths : ['site/index.html', 'docs/methodology.md'],
      readOnly: [datasetPath, 'investigation.spec.json'],
      deliverable:
        'Bind all headline KPIs with `data-kpi` attributes, document statutory/denominator caveats above the fold, build the 3-card source anomaly specimen grid, and separate measured facts from forward-looking hypotheses.'
    },
    {
      id: 'agent-4-quality-gate-and-press',
      role: 'Verification Gate & Press Kit Author',
      owns: ['investigation.spec.json', 'docs/press-kit.md', 'tests/**'],
      readOnly: [datasetPath, ...reportPaths],
      deliverable:
        'Configure exhaustive `mustContainKpis` assertions, regenerate OpenGraph social cards via `data-kit og`, prepare factual newsroom pitches + iframe snippets, and verify `data-kit verify` exits 0.'
    }
  ].slice(0, Math.max(2, Math.min(4, agentsCount)));

  return {
    title: spec.title,
    coordinatorRule:
      'No two parallel subagents may write to the same file path. Run `data-kit verify` in the coordinator after all subagents finish.',
    streams
  };
}
