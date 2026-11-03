import assert from 'node:assert/strict';
import test from 'node:test';
import { computeKpis, renderKpisMarkdown } from '../src/kpis.mjs';
import { formatMillions, formatThousands, medianCents, pctString, sumCents, toCents } from '../src/money.mjs';
import { canonicalEntityKey, filterRecordsByPreset } from '../src/schema.mjs';

test('exact integer-cent arithmetic avoids float drift and rounds half-up', () => {
  const cents = sumCents([0.1, 0.2, '19.99', 100]);
  assert.equal(cents, 12029n);
  assert.equal(pctString(27, 41, 1), '65.9');
  assert.equal(medianCents([10000, 20000, 35000, 90000]), toCents(27500));
  assert.equal(formatMillions(toCents(32202163.25), { currency: 'USD' }), '32.20M USD');
  assert.equal(formatThousands(toCents(170685), { currency: 'USD' }), '170.7k USD');
});

test('canonicalEntityKey collapses legal suffixes, punctuation, and tax IDs', () => {
  const a = canonicalEntityKey('HydroGrid Analytics, Inc. (Tax ID: 88-9911223)');
  const b = canonicalEntityKey('HYDROGRID ANALYTICS INC');
  const c = canonicalEntityKey('HydroGrid Analytics LLC');
  assert.equal(a, 'hydrogrid analytics');
  assert.equal(b, 'hydrogrid analytics');
  assert.equal(c, 'hydrogrid analytics');
});

test('computeKpis separates core vs incidental, pure vs mixed, and open bids vs sole-source', () => {
  const records = [
    {
      id: 'R1',
      publishedDate: '2024-01-12',
      eventDate: '2023-12-28',
      title: 'Telemetry Platform',
      buyer: 'North Water Board',
      category: 'software',
      scope: 'pure',
      status: 'resolved',
      amount: 300000,
      bidCount: 1,
      awardMode: 'competitive',
      grantFunded: true,
      vendors: ['GridWorks Inc.'],
      sourceUrl: 'https://example.org/filings/R1'
    },
    {
      id: 'R2',
      publishedDate: '2025-05-10',
      eventDate: '2025-05-02',
      title: 'Proprietary SCADA Connector',
      buyer: 'Coastal Utility',
      category: 'software',
      scope: 'pure',
      status: 'resolved',
      amount: 200000,
      bidCount: null,
      awardMode: 'sole_source',
      grantFunded: false,
      vendors: ['GridWorks, LLC'],
      sourceUrl: 'https://example.org/filings/R2'
    },
    {
      id: 'R3',
      publishedDate: '2026-03-18',
      eventDate: '2026-03-15',
      title: 'Design-and-Build Pump Station & Sensor Array',
      buyer: 'Metro Water',
      category: 'infrastructure',
      scope: 'mixed',
      status: 'resolved',
      amount: 500000,
      bidCount: 4,
      awardMode: 'competitive',
      grantFunded: true,
      vendors: ['CivicBuild Corp.'],
      sourceUrl: 'https://example.org/filings/R3'
    },
    {
      id: 'R4',
      publishedDate: '2026-04-01',
      title: 'Division Hallway Repainting',
      buyer: 'Metro Water',
      category: 'incidental',
      scope: 'incidental',
      status: 'resolved',
      amount: 450000,
      bidCount: 6,
      awardMode: 'competitive',
      grantFunded: false,
      vendors: ['PaintPro Ltd.'],
      sourceUrl: 'https://example.org/filings/R4'
    }
  ];

  const kpis = computeKpis(records);
  assert.equal(kpis.counts.all, 4);
  assert.equal(kpis.counts.core, 3);
  assert.equal(kpis.counts.incidental, 1);
  assert.equal(kpis.totals.coreSumMillions, '1.00M USD');
  assert.equal(kpis.scope.pureValuePct, '50.0');
  assert.equal(kpis.scope.mixedValuePct, '50.0');

  // Competition: 2 competitive (1 single-bid = 50.0%), 1 sole-source, 2/3 (66.7%) zero-rival
  assert.equal(kpis.competition.withBidsCount, 2);
  assert.equal(kpis.competition.singleBidCount, 1);
  assert.equal(kpis.competition.singleBidPct, '50.0');
  assert.equal(kpis.competition.soleSourceCount, 1);
  assert.equal(kpis.competition.noCompetitionCount, 2);
  assert.equal(kpis.competition.noCompetitionPctOfSigned, '66.7');

  // Dual date mode captures Dec 2023 signing of Jan 2024 notice
  assert.equal(kpis.publicationYears['2024'].signedCount, 1);
  assert.equal(kpis.eventYears['2023'].signedCount, 1);

  // Canonicalized vendor merges GridWorks Inc. + GridWorks, LLC into 2 contracts
  assert.equal(kpis.recurringVendors.length, 1);
  assert.equal(kpis.recurringVendors[0].signedCount, 2);

  // Preset filtering
  assert.equal(filterRecordsByPreset(records, 'sole=1').length, 1);
  assert.equal(filterRecordsByPreset(records, 'pure=1').length, 2);
  assert.equal(filterRecordsByPreset(records, 'incidental=1&cat=incidental').length, 1);

  const md = renderKpisMarkdown(kpis);
  assert.match(md, /1\.00M USD/);
  assert.match(md, /Sole-source awards/);
});
