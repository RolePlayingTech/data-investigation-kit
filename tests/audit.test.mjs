import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { auditDataset } from '../src/audit.mjs';

test('auditDataset catches 10x zero typos, 3x lot paste bugs, acronym collisions, null bids, and vendor drift', () => {
  const samplePath = path.resolve('examples/civic-grants/data/raw-uncleaned-sample.json');
  const raw = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
  const report = auditDataset(raw);

  const codes = new Set(report.findings.map((f) => f.code));
  assert.ok(codes.has('TRAILING_ZERO_TYPO'), 'Expected TRAILING_ZERO_TYPO');
  assert.ok(codes.has('MULTILOT_TOTAL_PASTED'), 'Expected MULTILOT_TOTAL_PASTED');
  assert.ok(codes.has('ACRONYM_COLLISION'), 'Expected ACRONYM_COLLISION');
  assert.ok(codes.has('INCIDENTAL_PURCHASE_IN_CORE'), 'Expected INCIDENTAL_PURCHASE_IN_CORE');
  assert.ok(codes.has('AMBIGUOUS_NULL_BIDS'), 'Expected AMBIGUOUS_NULL_BIDS');
  assert.ok(codes.has('VENDOR_NAME_DRIFT'), 'Expected VENDOR_NAME_DRIFT');
  assert.equal(report.countsBySeverity.high, 3);
});

test('auditDataset skips amount warnings when record carries auditFlags: ["amount_corrected"]', () => {
  const cleaned = [
    {
      id: 'CLEAN-1',
      publishedDate: '2026-01-19',
      title: 'Operator Portal',
      buyer: 'Central Water Agency',
      category: 'software',
      scope: 'pure',
      status: 'resolved',
      estimatedAmount: 49500,
      winningBid: 54000,
      enteredAmount: 540000,
      amount: 54000,
      bidCount: 4,
      awardMode: 'competitive',
      auditFlags: ['amount_corrected'],
      vendors: ['AquaLearn LLC'],
      sourceUrl: 'https://example.org/filings/CLEAN-1'
    }
  ];
  const report = auditDataset(cleaned);
  assert.equal(report.findingsCount, 0);
});
