import {
  centsToNumber,
  formatExactCurrency,
  formatMillions,
  formatScaled,
  formatThousands,
  medianCents,
  medianInt,
  pctString,
  ratioScaled,
  sumCents,
  toCents
} from './money.mjs';
import { canonicalEntityKey, DEFAULT_SPEC } from './schema.mjs';

function isSigned(r) {
  return r.status === 'resolved' && typeof r.amount === 'number' && Number.isFinite(r.amount);
}

/**
 * Deterministically computes all investigation KPIs and denominators from audited records.
 */
export function computeKpis(records, spec = DEFAULT_SPEC) {
  const incCat = spec.enums.incidentalCategory || 'incidental';
  const currency = spec.currency || 'USD';

  const core = records.filter((r) => r.category !== incCat && r.scope !== 'incidental');
  const incidental = records.filter((r) => r.category === incCat || r.scope === 'incidental');

  const coreSigned = core.filter(isSigned);
  const incSigned = incidental.filter(isSigned);

  const coreSumCents = sumCents(coreSigned.map((r) => r.amount));
  const incSumCents = sumCents(incSigned.map((r) => r.amount));
  const coreMedianCents = medianCents(coreSigned.map((r) => r.amount));

  // Scope breakdown inside core ("pure" vs "mixed")
  const purePool = core.filter((r) => (r.scope || 'pure') === 'pure');
  const mixedPool = core.filter((r) => r.scope === 'mixed');
  const pureSigned = purePool.filter(isSigned);
  const mixedSigned = mixedPool.filter(isSigned);
  const pureSumCents = sumCents(pureSigned.map((r) => r.amount));
  const mixedSumCents = sumCents(mixedSigned.map((r) => r.amount));

  // Status breakdown
  const statusCounts = (pool) => {
    const out = {};
    for (const s of spec.enums.statuses) out[s] = 0;
    for (const r of pool) out[r.status] = (out[r.status] || 0) + 1;
    return out;
  };

  // Core categories: count share vs monetary share + competition stats
  const categories = {};
  for (const catKey of spec.enums.coreCategories) {
    const catPool = core.filter((r) => r.category === catKey);
    const catSigned = coreSigned.filter((r) => r.category === catKey);
    const catSumCents = sumCents(catSigned.map((r) => r.amount));
    const catMedCents = medianCents(catSigned.map((r) => r.amount));
    const catWithBids = catSigned.filter((r) => Number.isInteger(r.bidCount) && r.bidCount >= 1);
    const catSingleBid = catWithBids.filter((r) => r.bidCount === 1);
    const catSoleSource = catSigned.filter((r) => r.awardMode === 'sole_source');

    categories[catKey] = {
      key: catKey,
      recordCount: catPool.length,
      recordPct: pctString(catPool.length, core.length, 1),
      signedCount: catSigned.length,
      sumCents: catSumCents,
      sumUnits: centsToNumber(catSumCents),
      valuePct: pctString(catSumCents, coreSumCents, 1),
      medianCents: catMedCents,
      withBidsCount: catWithBids.length,
      singleBidCount: catSingleBid.length,
      singleBidPct: pctString(catSingleBid.length, catWithBids.length, 1),
      soleSourceCount: catSoleSource.length,
      medianBids: medianInt(catWithBids.map((r) => r.bidCount), 1)
    };
  }

  // Competition overall in core
  const coreWithBids = coreSigned.filter((r) => Number.isInteger(r.bidCount) && r.bidCount >= 1);
  const coreSingleBids = coreWithBids.filter((r) => r.bidCount === 1);
  const coreSoleSource = coreSigned.filter((r) => r.awardMode === 'sole_source');
  const coreSoleSourceCents = sumCents(coreSoleSource.map((r) => r.amount));

  // Grant / co-financing share
  const grantSigned = coreSigned.filter((r) => r.grantFunded === true);
  const grantSumCents = sumCents(grantSigned.map((r) => r.amount));

  // Dual time-series: by publication year vs physical event/contract signing year
  const pubYearMap = new Map();
  const eventYearMap = new Map();
  for (const r of core) {
    const py = String(r.year || (r.publishedDate || '').slice(0, 4) || 'unknown');
    if (!pubYearMap.has(py)) pubYearMap.set(py, { year: py, recordCount: 0, signedCount: 0, sumCents: 0n });
    const pBucket = pubYearMap.get(py);
    pBucket.recordCount += 1;
    if (isSigned(r)) {
      pBucket.signedCount += 1;
      pBucket.sumCents += toCents(r.amount);
    }
  }
  for (const r of coreSigned) {
    const ey = String((r.eventDate || r.publishedDate || '').slice(0, 4) || 'unknown');
    if (!eventYearMap.has(ey)) eventYearMap.set(ey, { year: ey, signedCount: 0, sumCents: 0n });
    const eBucket = eventYearMap.get(ey);
    eBucket.signedCount += 1;
    eBucket.sumCents += toCents(r.amount);
  }

  const publicationYears = Object.fromEntries(
    [...pubYearMap.entries()].sort(([a], [b]) => a.localeCompare(b))
  );
  const eventYears = Object.fromEntries(
    [...eventYearMap.entries()].sort(([a], [b]) => a.localeCompare(b))
  );

  // Sectors & regions
  const buildGroupBreakdown = (field) => {
    const buckets = new Map();
    for (const r of core) {
      const k = r[field] || 'Other';
      if (!buckets.has(k)) buckets.set(k, { key: k, recordCount: 0, signedCount: 0, sumCents: 0n });
      const b = buckets.get(k);
      b.recordCount += 1;
      if (isSigned(r)) {
        b.signedCount += 1;
        b.sumCents += toCents(r.amount);
      }
    }
    return [...buckets.values()]
      .map((b) => ({
        ...b,
        recordPct: pctString(b.recordCount, core.length, 1),
        valuePct: pctString(b.sumCents, coreSumCents, 1)
      }))
      .sort((a, b) => (b.sumCents > a.sumCents ? 1 : b.sumCents < a.sumCents ? -1 : b.recordCount - a.recordCount));
  };

  // Canonicalized recurring vendors
  const vendorBuckets = new Map();
  for (const r of coreSigned) {
    const amtCents = toCents(r.amount);
    for (const rawV of r.vendors || []) {
      const cKey = canonicalEntityKey(rawV);
      if (!cKey) continue;
      if (!vendorBuckets.has(cKey)) {
        vendorBuckets.set(cKey, {
          canonKey: cKey,
          variants: new Map(),
          signedCount: 0,
          sumCents: 0n,
          singleBidCount: 0,
          soleSourceCount: 0
        });
      }
      const vb = vendorBuckets.get(cKey);
      vb.variants.set(rawV, (vb.variants.get(rawV) || 0) + 1);
      vb.signedCount += 1;
      vb.sumCents += amtCents;
      if (r.bidCount === 1) vb.singleBidCount += 1;
      if (r.awardMode === 'sole_source') vb.soleSourceCount += 1;
    }
  }

  const vendors = [...vendorBuckets.values()]
    .map((vb) => {
      const displayName = [...vb.variants.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0];
      return {
        canonKey: vb.canonKey,
        displayName,
        signedCount: vb.signedCount,
        sumCents: vb.sumCents,
        singleBidCount: vb.singleBidCount,
        soleSourceCount: vb.soleSourceCount
      };
    })
    .sort((a, b) => b.signedCount - a.signedCount || (b.sumCents > a.sumCents ? 1 : -1));

  return {
    currency,
    snapshotDate: spec.snapshotDate,
    counts: {
      all: records.length,
      core: core.length,
      incidental: incidental.length,
      coreSigned: coreSigned.length,
      incidentalSigned: incSigned.length,
      statusCore: statusCounts(core),
      statusAll: statusCounts(records)
    },
    totals: {
      coreSumCents,
      coreSumMillions: formatMillions(coreSumCents, { currency }),
      coreSumExact: formatExactCurrency(coreSumCents, { currency }),
      coreMedianCents,
      coreMedianThousands: formatThousands(coreMedianCents, { currency }),
      incidentalSumCents: incSumCents,
      incidentalSumMillions: formatMillions(incSumCents, { currency })
    },
    scope: {
      pureRecords: purePool.length,
      pureSigned: pureSigned.length,
      pureSumCents,
      pureValuePct: pctString(pureSumCents, coreSumCents, 1),
      mixedRecords: mixedPool.length,
      mixedSigned: mixedSigned.length,
      mixedSumCents,
      mixedValuePct: pctString(mixedSumCents, coreSumCents, 1)
    },
    competition: {
      signedCount: coreSigned.length,
      withBidsCount: coreWithBids.length,
      singleBidCount: coreSingleBids.length,
      singleBidPct: pctString(coreSingleBids.length, coreWithBids.length, 1),
      soleSourceCount: coreSoleSource.length,
      soleSourceSumCents: coreSoleSourceCents,
      noCompetitionCount: coreSingleBids.length + coreSoleSource.length,
      noCompetitionPctOfSigned: pctString(coreSingleBids.length + coreSoleSource.length, coreSigned.length, 1),
      medianBids: medianInt(coreWithBids.map((r) => r.bidCount), 1)
    },
    grants: {
      signedCount: grantSigned.length,
      signedPct: pctString(grantSigned.length, coreSigned.length, 1),
      sumCents: grantSumCents,
      valuePct: pctString(grantSumCents, coreSumCents, 1)
    },
    categories,
    publicationYears,
    eventYears,
    sectors: buildGroupBreakdown('sector'),
    regions: buildGroupBreakdown('region'),
    recurringVendors: vendors.filter((v) => v.signedCount >= 2),
    allVendors: vendors,
    formatHelpers: {
      ratio: (a, b, dec = 1) => formatScaled(ratioScaled(a, b, dec), dec)
    }
  };
}

export function renderKpisMarkdown(kpis) {
  const cur = kpis.currency;
  const lines = [
    `# Investigation KPI Summary (Snapshot ${kpis.snapshotDate})`,
    '',
    '## 1. Denominators & Core Totals',
    `- **All audited records:** ${kpis.counts.all} (${kpis.counts.core} core + ${kpis.counts.incidental} incidental)`,
    `- **Signed core contracts:** ${kpis.counts.coreSigned} totaling **${kpis.totals.coreSumMillions}** (${kpis.totals.coreSumExact}; median ${kpis.totals.coreMedianThousands})`,
    `- **Pure vs mixed scope:** ${kpis.scope.pureSigned} pure (${formatMillions(kpis.scope.pureSumCents, { currency: cur })}, ${kpis.scope.pureValuePct}%) vs ${kpis.scope.mixedSigned} mixed (${formatMillions(kpis.scope.mixedSumCents, { currency: cur })}, ${kpis.scope.mixedValuePct}%)`,
    `- **Incidental records (excluded by default):** ${kpis.counts.incidentalSigned} signed totaling ${kpis.totals.incidentalSumMillions}`,
    '',
    '## 2. Category Split (Notice Volume vs Contract Value)',
    '| Category | Proceedings | Share of Notices | Signed | Gross Value | Share of Value | Median | Single-Bid Rate |',
    '| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'
  ];

  for (const c of Object.values(kpis.categories)) {
    lines.push(
      `| \`${c.key}\` | ${c.recordCount} | ${c.recordPct}% | ${c.signedCount} | ${formatMillions(c.sumCents, { currency: cur })} | ${c.valuePct}% | ${formatThousands(c.medianCents, { currency: cur })} | ${c.singleBidCount}/${c.withBidsCount} (${c.singleBidPct}%) |`
    );
  }

  lines.push(
    '',
    '## 3. Competition & Sole-Source Denominators',
    `- **Competitive contracts with disclosed bids:** ${kpis.competition.withBidsCount} (single-bid: ${kpis.competition.singleBidCount} = **${kpis.competition.singleBidPct}%**, median bids: ${kpis.competition.medianBids})`,
    `- **Sole-source awards (no open tender):** ${kpis.competition.soleSourceCount} (${formatMillions(kpis.competition.soleSourceSumCents, { currency: cur })})`,
    `- **Combined zero-rival awards:** ${kpis.competition.noCompetitionCount} of ${kpis.competition.signedCount} signed contracts (**${kpis.competition.noCompetitionPctOfSigned}%**)`,
    '',
    '## 4. Grant Co-Financing',
    `- **Grant-backed signed contracts:** ${kpis.grants.signedCount} of ${kpis.counts.coreSigned} (${kpis.grants.signedPct}%), representing **${kpis.grants.valuePct}%** of core value (${formatMillions(kpis.grants.sumCents, { currency: cur })})`
  );

  return lines.join('\n');
}
