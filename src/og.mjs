import { formatMillions } from './money.mjs';

function escXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generates a crisp 1200x630 editorial OpenGraph SVG card directly from computed KPIs,
 * preventing social preview cards from drifting out of sync with the audited dataset.
 */
export function generateOgSvg(kpis, spec) {
  const title = spec.og?.headline || spec.title || 'Public Records Investigation';
  const subtitle =
    spec.og?.subheadline ||
    `Audited dataset of ${kpis.counts.all} proceedings (${kpis.counts.coreSigned} signed core contracts) · Snapshot ${kpis.snapshotDate}`;
  const kicker = (spec.og?.kicker || 'DATA INVESTIGATION & INTERACTIVE DATABASE').toUpperCase();
  const topCatKey = spec.enums.coreCategories[0];
  const topCat = topCatKey ? kpis.categories[topCatKey] : null;

  const metric1Val = formatMillions(kpis.totals.coreSumCents, { currency: '' });
  const metric1Unit = kpis.currency;
  const metric1Sub = `${kpis.counts.coreSigned} signed core contracts`;

  const metric2Val = `${kpis.competition.singleBidPct}%`;
  const metric2Unit = 'single-bid';
  const metric2Sub = `${kpis.competition.singleBidCount} of ${kpis.competition.withBidsCount} competitive awards`;

  const metric3Val = topCat ? `${topCat.valuePct}%` : `${kpis.grants.valuePct}%`;
  const metric3Unit = topCat ? `in ${topCatKey}` : 'grant-backed';
  const metric3Sub = topCat
    ? `${topCat.recordPct}% of notices vs ${topCat.valuePct}% of value`
    : `${kpis.grants.signedCount} grant-backed contracts`;

  // Split title cleanly across up to 2 lines (~42 chars per line)
  const words = title.split(/\s+/);
  const lines = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length > 42 && lines.length < 1) {
      lines.push(current.trim());
      current = w;
    } else {
      current = (current + ' ' + w).trim();
    }
  }
  if (current) lines.push(current);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#F7F6F2"/>
  <rect x="40" y="36" width="1120" height="558" fill="none" stroke="#1E1D1B" stroke-width="2"/>
  <line x1="76" y1="102" x2="1124" y2="102" stroke="#D8D3C8" stroke-width="1.5"/>

  <text x="76" y="82" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="15" font-weight="700" letter-spacing="1.6" fill="#98513C">${escXml(kicker)}</text>
  <text x="1124" y="82" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="14" fill="#5C5852">N = ${kpis.counts.all} RECORDS</text>

  <text x="76" y="182" font-family="Georgia, 'Times New Roman', serif" font-size="52" font-weight="700" fill="#1E1D1B">${escXml(lines[0] || '')}</text>
  ${lines[1] ? `<text x="76" y="244" font-family="Georgia, 'Times New Roman', serif" font-size="52" font-weight="700" fill="#1E1D1B">${escXml(lines[1])}</text>` : ''}

  <text x="76" y="${lines[1] ? 296 : 244}" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="22" fill="#514E49">${escXml(subtitle)}</text>

  <g transform="translate(76, 356)">
    <rect x="0" y="0" width="332" height="190" fill="#EFECE4" stroke="#1E1D1B" stroke-width="1.5"/>
    <text x="24" y="38" font-family="ui-monospace, SFMono-Regular, monospace" font-size="13" font-weight="700" letter-spacing="1.2" fill="#5C5852">SIGNED CORE VALUE</text>
    <text x="24" y="108" font-family="Georgia, serif" font-size="56" font-weight="700" fill="#1E1D1B">${escXml(metric1Val)} <tspan font-size="24" fill="#98513C">${escXml(metric1Unit)}</tspan></text>
    <text x="24" y="154" font-family="system-ui, sans-serif" font-size="17" fill="#514E49">${escXml(metric1Sub)}</text>

    <rect x="358" y="0" width="332" height="190" fill="#EFECE4" stroke="#1E1D1B" stroke-width="1.5"/>
    <text x="382" y="38" font-family="ui-monospace, SFMono-Regular, monospace" font-size="13" font-weight="700" letter-spacing="1.2" fill="#5C5852">COMPETITION SPLIT</text>
    <text x="382" y="108" font-family="Georgia, serif" font-size="56" font-weight="700" fill="#98513C">${escXml(metric2Val)} <tspan font-size="22" fill="#1E1D1B">${escXml(metric2Unit)}</tspan></text>
    <text x="382" y="154" font-family="system-ui, sans-serif" font-size="17" fill="#514E49">${escXml(metric2Sub)}</text>

    <rect x="716" y="0" width="332" height="190" fill="#EFECE4" stroke="#1E1D1B" stroke-width="1.5"/>
    <text x="740" y="38" font-family="ui-monospace, SFMono-Regular, monospace" font-size="13" font-weight="700" letter-spacing="1.2" fill="#5C5852">CONCENTRATION</text>
    <text x="740" y="108" font-family="Georgia, serif" font-size="56" font-weight="700" fill="#2D546B">${escXml(metric3Val)} <tspan font-size="22" fill="#1E1D1B">${escXml(metric3Unit)}</tspan></text>
    <text x="740" y="154" font-family="system-ui, sans-serif" font-size="17" fill="#514E49">${escXml(metric3Sub)}</text>
  </g>
</svg>
`;
}
