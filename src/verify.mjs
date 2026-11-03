import fs from 'node:fs';
import path from 'node:path';
import { computeKpis } from './kpis.mjs';
import { formatMillions, formatThousands } from './money.mjs';
import { filterRecordsByPreset, validateRecordsSchema } from './schema.mjs';

/**
 * Resolves a dot-path KPI token (e.g. "counts.coreSigned", "totals.coreSumMillions",
 * "categories.software.singleBidPct", "categories.software.sumMillions") against computed KPIs.
 */
export function resolveKpiToken(kpis, token) {
  const cur = kpis.currency;
  if (token.startsWith('categories.')) {
    const [, catKey, prop] = token.split('.');
    const cat = kpis.categories[catKey];
    if (!cat) return undefined;
    if (prop === 'sumMillions') return formatMillions(cat.sumCents, { currency: cur });
    if (prop === 'sumMillionsNum') return formatMillions(cat.sumCents, { currency: '' }).replace(/M$/, '');
    if (prop === 'medianThousands') return formatThousands(cat.medianCents, { currency: cur });
    return String(cat[prop]);
  }
  if (token === 'totals.coreSumMillionsNum') {
    return formatMillions(kpis.totals.coreSumCents, { currency: '' }).replace(/M$/, '');
  }
  if (token === 'totals.incidentalSumMillionsNum') {
    return formatMillions(kpis.totals.incidentalSumCents, { currency: '' }).replace(/M$/, '');
  }
  if (token === 'scope.pureSumMillions') {
    return formatMillions(kpis.scope.pureSumCents, { currency: cur });
  }
  if (token === 'scope.mixedSumMillions') {
    return formatMillions(kpis.scope.mixedSumCents, { currency: cur });
  }

  const parts = token.split('.');
  let curVal = kpis;
  for (const p of parts) {
    if (curVal === null || curVal === undefined || !(p in curVal)) return undefined;
    curVal = curVal[p];
  }
  return curVal === undefined ? undefined : String(curVal);
}

function decodeAttrEntities(val) {
  return String(val ?? '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function parseAttributes(attrString) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(attrString)) !== null) {
    attrs[m[1].toLowerCase()] = decodeAttrEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function validateHtmlReport(htmlText, relPath, baseDir, records, kpis, spec, reportCfg, errors) {
  // 1. Collect all id="..." attributes and check duplicates
  const ids = new Map();
  const tagRe = /<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*?)?\/?>/g;
  const linksAndPresets = [];
  const metaMap = new Map();
  const linkTags = [];

  let m;
  while ((m = tagRe.exec(htmlText)) !== null) {
    const tag = m[1].toLowerCase();
    const attrs = parseAttributes(m[2] || '');
    if (attrs.id) {
      ids.set(attrs.id, (ids.get(attrs.id) || 0) + 1);
    }
    if (attrs.href !== undefined || attrs['data-preset'] !== undefined) {
      linksAndPresets.push({ tag, attrs });
    }
    if (tag === 'meta') {
      const key = attrs.property ? `property:${attrs.property}` : attrs.name || '';
      if (key) metaMap.set(key.toLowerCase(), attrs.content || '');
    }
    if (tag === 'link') {
      linkTags.push(attrs);
    }
  }

  for (const [id, count] of ids.entries()) {
    if (count > 1) {
      errors.push(`[html-anchors] ${relPath}: duplicate id="${id}" (${count} occurrences).`);
    }
  }

  // 2. Validate internal #anchors and data-preset query links
  const allowedParams = new Set(spec.allowedPresetParams || []);
  const allCats = new Set([...spec.enums.coreCategories, spec.enums.incidentalCategory].filter(Boolean));
  const knownSectors = new Set(records.map((r) => r.sector).filter(Boolean));
  const knownRegions = new Set(records.map((r) => r.region).filter(Boolean));

  for (const { attrs } of linksAndPresets) {
    if (attrs.href !== undefined) {
      const href = attrs.href.trim();
      if (href === '#') {
        errors.push(`[html-anchors] ${relPath}: empty href="#".`);
      } else if (href.startsWith('#') || (href.startsWith('?') && href.includes('#'))) {
        const frag = decodeURIComponent(href.split('#')[1] || '');
        if (!frag || !ids.has(frag)) {
          errors.push(`[html-anchors] ${relPath}: href="${href}" points to missing id="${frag}".`);
        }
      }
    }

    if (attrs['data-preset'] !== undefined) {
      const preset = attrs['data-preset'].trim();
      if (!preset) {
        errors.push(`[html-presets] ${relPath}: empty data-preset attribute.`);
        continue;
      }
      const params = new URLSearchParams(preset);
      for (const [k, v] of params.entries()) {
        if (!allowedParams.has(k)) {
          errors.push(`[html-presets] ${relPath}: unsupported param "${k}" in data-preset="${preset}".`);
          continue;
        }
        if (v === '') {
          errors.push(`[html-presets] ${relPath}: empty value for "${k}" in data-preset="${preset}".`);
          continue;
        }
        if (k === 'cat' && !allCats.has(v)) {
          errors.push(`[html-presets] ${relPath}: unknown category cat="${v}" in data-preset="${preset}".`);
        }
        if (k === 'status' && v !== 'all' && !spec.enums.statuses.includes(v)) {
          errors.push(`[html-presets] ${relPath}: unknown status="${v}" in data-preset="${preset}".`);
        }
        if (['single', 'sole', 'grant', 'incidental', 'pure'].includes(k) && v !== '0' && v !== '1') {
          errors.push(`[html-presets] ${relPath}: boolean param "${k}=${v}" must be "0" or "1".`);
        }
        if (k === 'sector' && knownSectors.size > 0 && !knownSectors.has(v)) {
          errors.push(`[html-presets] ${relPath}: unknown sector="${v}" in data-preset="${preset}".`);
        }
        if (k === 'region' && knownRegions.size > 0 && !knownRegions.has(v)) {
          errors.push(`[html-presets] ${relPath}: unknown region="${v}" in data-preset="${preset}".`);
        }
      }

      if (!reportCfg.allowEmptyPresets) {
        const matched = filterRecordsByPreset(records, preset, spec);
        if (matched.length === 0) {
          errors.push(`[html-presets] ${relPath}: data-preset="${preset}" matches 0 records.`);
        }
      }
    }
  }

  // 3. Validate data-kpi="<token>" inline HTML bindings
  const dataKpiRe = /<([a-zA-Z0-9-]+)([^>]*\bdata-kpi=(?:"([^"]+)"|'([^']+)')[^>]*)>([\s\S]*?)<\/\1>/g;
  let km;
  while ((km = dataKpiRe.exec(htmlText)) !== null) {
    const token = (km[3] || km[4] || '').trim();
    const actualText = stripTags(km[5]);
    const expected = resolveKpiToken(kpis, token);
    if (expected === undefined) {
      errors.push(`[html-kpi] ${relPath}: unknown data-kpi token "${token}".`);
    } else if (!actualText.includes(expected)) {
      errors.push(
        `[html-kpi] ${relPath}: element [data-kpi="${token}"] displays "${actualText}", expected to contain "${expected}".`
      );
    }
  }

  // 4. Validate declarative mustContainKpis from investigation.spec.json
  const plainDocText = stripTags(htmlText);
  for (const token of reportCfg.mustContainKpis || []) {
    const expected = resolveKpiToken(kpis, token);
    if (expected === undefined) {
      errors.push(`[spec-kpi] ${relPath}: unknown KPI token "${token}" in mustContainKpis.`);
    } else if (!plainDocText.includes(expected) && !htmlText.includes(expected)) {
      errors.push(
        `[spec-kpi] ${relPath}: report text does not contain expected value "${expected}" for KPI "${token}".`
      );
    }
  }

  // 5. Required <noscript> fallback inside interactive explorer mount
  if (ids.has('data-explorer') && !/<div[^>]+id=["']data-explorer["'][\s\S]*?<noscript>/i.test(htmlText)) {
    errors.push(`[accessibility] ${relPath}: #data-explorer must include a <noscript> dataset fallback.`);
  }

  // 6. SEO / OpenGraph / local OG asset validation when requireSeo !== false
  if (reportCfg.requireSeo !== false) {
    for (const reqMeta of ['description', 'property:og:title', 'property:og:description', 'property:og:image', 'twitter:card']) {
      if (!metaMap.get(reqMeta)) {
        errors.push(`[seo-og] ${relPath}: missing required meta tag "${reqMeta}".`);
      }
    }
    const ogImg = metaMap.get('property:og:image') || '';
    if (ogImg && reportCfg.ogImageFile) {
      const absOg = path.resolve(baseDir, reportCfg.ogImageFile);
      if (!fs.existsSync(absOg) || fs.statSync(absOg).size === 0) {
        errors.push(`[seo-og] ${relPath}: ogImageFile "${reportCfg.ogImageFile}" is missing or empty on disk.`);
      }
    }
  }

  return { linkTags, metaMap };
}

/**
 * Runs the full zero-drift verification gate for an investigation spec.
 */
export function verifyInvestigation({ records, spec, baseDir }) {
  const errors = validateRecordsSchema(records, spec);
  if (errors.length > 0) {
    return { ok: false, errors, kpis: null };
  }

  const kpis = computeKpis(records, spec);
  const parsedReports = [];

  for (const reportCfg of spec.reports || []) {
    const relPath = reportCfg.path;
    const absPath = path.resolve(baseDir, relPath);
    if (!fs.existsSync(absPath)) {
      errors.push(`[files] Missing configured report file: "${relPath}".`);
      continue;
    }
    const content = fs.readFileSync(absPath, 'utf8');
    if (relPath.endsWith('.html')) {
      const info = validateHtmlReport(content, relPath, baseDir, records, kpis, spec, reportCfg, errors);
      parsedReports.push({ reportCfg, relPath, ...info });
    } else {
      for (const token of reportCfg.mustContainKpis || []) {
        const expected = resolveKpiToken(kpis, token);
        if (expected === undefined) {
          errors.push(`[spec-kpi] ${relPath}: unknown KPI token "${token}".`);
        } else if (!content.includes(expected)) {
          errors.push(
            `[spec-kpi] ${relPath}: markdown file does not contain expected value "${expected}" for KPI "${token}".`
          );
        }
      }
    }
  }

  // Cross-language hreflang reciprocity when multiple language HTML reports are configured
  const langReports = parsedReports.filter((r) => r.reportCfg.lang);
  if (langReports.length >= 2) {
    const expectedLangs = langReports.map((r) => r.reportCfg.lang.toLowerCase());
    for (const rep of langReports) {
      const foundLangs = new Set(
        rep.linkTags
          .filter((l) => (l.rel || '').toLowerCase().split(/\s+/).includes('alternate') && l.hreflang)
          .map((l) => l.hreflang.toLowerCase())
      );
      for (const reqLang of expectedLangs) {
        if (!foundLangs.has(reqLang)) {
          errors.push(`[i18n-seo] ${rep.relPath}: missing <link rel="alternate" hreflang="${reqLang}">.`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors, kpis };
}
