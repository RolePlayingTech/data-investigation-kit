import { canonicalEntityKey, DEFAULT_SPEC } from './schema.mjs';

const DEFAULT_ACRONYM_TRAPS = [
  {
    pattern: /\bavian influenza\b|\bpoultry\b|\bveterinary\s+diagnostic/i,
    code: 'ACRONYM_COLLISION',
    reason: 'Potential false-positive match on acronym ("AI" = Avian Influenza in veterinary filings).'
  },
  {
    pattern: /\bcatering\b|\boffice\s+chairs\b|\bfurniture\s+delivery\b|\bjanitorial\b/i,
    code: 'INCIDENTAL_PURCHASE_IN_CORE',
    reason: 'Routine administrative/facility purchase inside a core category; consider isolating as "incidental".'
  }
];

/**
 * Scans public-registry records for real-world data-hygiene traps that distort naive summaries:
 * 1. Trailing-zero / magnitude clerical typos (entered amount >= 5x winningBid or estimatedAmount)
 * 2. Multi-lot total paste errors (lotValues all equal to full contract total, or 3x repeated lot sums)
 * 3. Acronym & substring false-positive collisions
 * 4. Untagged null competition counts on resolved awards (missing sole_source vs missing bidCount)
 * 5. Entity name fragmentation across vendor / buyer spellings
 */
export function auditDataset(records, spec = DEFAULT_SPEC) {
  const findings = [];
  const incCat = spec.enums.incidentalCategory || 'incidental';
  const vendorVariants = new Map();
  const buyerVariants = new Map();

  records.forEach((r, idx) => {
    const id = r?.id || `#${idx + 1}`;
    const alreadyCorrected = Array.isArray(r?.auditFlags) && r.auditFlags.includes('amount_corrected');

    // 1. Magnitude / trailing-zero clerical error check
    const refBid = typeof r?.winningBid === 'number' && r.winningBid > 0 ? r.winningBid : null;
    const refEst = typeof r?.estimatedAmount === 'number' && r.estimatedAmount > 0 ? r.estimatedAmount : null;
    const entered = typeof r?.enteredAmount === 'number' ? r.enteredAmount : r?.amount;

    if (!alreadyCorrected && typeof entered === 'number' && entered > 0) {
      const baseline = refBid ?? refEst;
      if (baseline) {
        const ratio = entered / baseline;
        if (ratio >= 5 || ratio <= 0.12) {
          const isTenX = Math.abs(ratio - 10) < 0.25 || Math.abs(ratio - 100) < 1;
          findings.push({
            severity: 'high',
            code: isTenX ? 'TRAILING_ZERO_TYPO' : 'MAGNITUDE_MISMATCH',
            recordId: id,
            message: `${id}: amount (${entered}) differs by ${ratio.toFixed(2)}x from reference ${refBid ? 'winningBid' : 'estimatedAmount'} (${baseline}). Verify source notice sections before summing.`
          });
        }
      }
    }

    // 2. Multi-lot pasted contract total check
    if (!alreadyCorrected && Array.isArray(r?.lots) && r.lots.length >= 2) {
      const lotEntered = r.lots
        .map((l) => l?.enteredContractValue)
        .filter((v) => typeof v === 'number' && v > 0);
      const lotBids = r.lots.map((l) => l?.winningBid).filter((v) => typeof v === 'number' && v > 0);
      if (lotEntered.length === r.lots.length && lotBids.length === r.lots.length) {
        const trueLotSum = lotBids.reduce((a, b) => a + b, 0);
        const allPastedTotal = lotEntered.every((v) => Math.abs(v - trueLotSum) < 1);
        const rawSum = lotEntered.reduce((a, b) => a + b, 0);
        if (allPastedTotal && typeof r.amount === 'number' && Math.abs(r.amount - rawSum) < 1) {
          findings.push({
            severity: 'high',
            code: 'MULTILOT_TOTAL_PASTED',
            recordId: id,
            message: `${id}: combined ${r.lots.length}-lot total (${trueLotSum}) was pasted into every lot, inflating amount to ${r.amount} (+${(rawSum - trueLotSum).toFixed(2)}).`
          });
        }
      }
    }

    // 3. Acronym & routine incidental purchase checks
    const textHay = `${r?.title || ''} ${r?.description || ''}`;
    for (const rule of DEFAULT_ACRONYM_TRAPS) {
      if (rule.pattern.test(textHay)) {
        if (rule.code === 'INCIDENTAL_PURCHASE_IN_CORE' && (r?.category === incCat || r?.scope === 'incidental')) {
          continue;
        }
        findings.push({
          severity: rule.code === 'ACRONYM_COLLISION' ? 'high' : 'medium',
          code: rule.code,
          recordId: id,
          message: `${id}: ${rule.reason}`
        });
      }
    }

    // 4. Ambiguous null bidCount on resolved contracts without explicit awardMode
    if (r?.status === 'resolved' && (r.bidCount === null || r.bidCount === undefined) && !r.awardMode) {
      findings.push({
        severity: 'medium',
        code: 'AMBIGUOUS_NULL_BIDS',
        recordId: id,
        message: `${id}: resolved contract has null bidCount without awardMode ("sole_source" vs "competitive"). Inspect source notice to distinguish sole-source awards from missing bid disclosures.`
      });
    }

    // 5. Collect entity spelling variants
    if (typeof r?.buyer === 'string' && r.buyer.trim()) {
      const bKey = canonicalEntityKey(r.buyer);
      if (bKey) {
        if (!buyerVariants.has(bKey)) buyerVariants.set(bKey, new Set());
        buyerVariants.get(bKey).add(r.buyer.trim());
      }
    }
    for (const v of r?.vendors || []) {
      if (typeof v === 'string' && v.trim()) {
        const vKey = canonicalEntityKey(v);
        if (vKey) {
          if (!vendorVariants.has(vKey)) vendorVariants.set(vKey, new Set());
          vendorVariants.get(vKey).add(v.trim());
        }
      }
    }
  });

  for (const [canon, variants] of vendorVariants.entries()) {
    if (variants.size > 1) {
      findings.push({
        severity: 'low',
        code: 'VENDOR_NAME_DRIFT',
        recordId: canon,
        message: `Vendor entity "${canon}" appears under ${variants.size} raw spellings: ${[...variants].map((s) => `"${s}"`).join(' | ')}. Canonicalize before ranking repeat winners.`
      });
    }
  }

  for (const [canon, variants] of buyerVariants.entries()) {
    if (variants.size > 1) {
      findings.push({
        severity: 'low',
        code: 'BUYER_NAME_DRIFT',
        recordId: canon,
        message: `Buyer entity "${canon}" appears under ${variants.size} raw spellings: ${[...variants].map((s) => `"${s}"`).join(' | ')}.`
      });
    }
  }

  const countsBySeverity = {
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length
  };

  return {
    totalRecords: records.length,
    findingsCount: findings.length,
    countsBySeverity,
    findings
  };
}
