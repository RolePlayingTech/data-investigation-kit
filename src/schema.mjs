import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_SPEC = {
  schemaVersion: 1,
  title: 'Public Records Investigation',
  dataset: 'data/records.json',
  currency: 'USD',
  snapshotDate: '2026-01-01',
  enums: {
    statuses: ['resolved', 'open', 'cancelled'],
    coreCategories: ['software', 'infrastructure', 'training', 'advisory'],
    incidentalCategory: 'incidental',
    scopes: ['pure', 'mixed', 'incidental'],
    awardModes: ['competitive', 'sole_source']
  },
  sourceUrlPattern: '^https?://',
  allowedPresetParams: [
    'q',
    'status',
    'cat',
    'sector',
    'region',
    'year',
    'eyear',
    'ymode',
    'single',
    'sole',
    'grant',
    'incidental',
    'pure',
    'sort'
  ],
  reports: []
};

const LEGAL_SUFFIX_RE =
  /(?:^|[\s,;(])(inc\.?|llc|l\.l\.c\.|ltd\.?|limited|corp\.?|corporation|co\.?|company|plc|gmbh|ag|ab|pty|s\.a\.r\.l\.|s\.a\.|sp\.?\s*z\s*o\.?\s*o\.?|sp\.?\s*j\.?|b\.v\.|s\.r\.l\.)(?=$|[\s,;).])/gi;
const REGISTRY_ID_RE = /\b(tax\s*id|ein|vat|reg(?:istration)?\s*no\.?|id)\s*[:#-]?\s*[\w-]{5,}\b/gi;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(val) {
  if (typeof val !== 'string' || !ISO_DATE_RE.test(val)) return false;
  const d = new Date(`${val}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === val;
}

/**
 * Normalizes an organization or vendor name to a canonical entity key so
 * casing differences, pasted tax IDs, and legal suffixes collapse cleanly.
 */
export function canonicalEntityKey(rawName) {
  if (typeof rawName !== 'string') return '';
  return rawName
    .normalize('NFKC')
    .replace(REGISTRY_ID_RE, ' ')
    .replace(/[“”„"']/g, ' ')
    .replace(LEGAL_SUFFIX_RE, ' ')
    .replace(/[.,;:/\\()[\]{}-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function loadSpec(specPath) {
  const absSpec = path.resolve(specPath);
  const raw = JSON.parse(fs.readFileSync(absSpec, 'utf8'));
  const baseDir = path.dirname(absSpec);
  const merged = {
    ...DEFAULT_SPEC,
    ...raw,
    enums: {
      ...DEFAULT_SPEC.enums,
      ...(raw.enums || {})
    }
  };
  return { spec: merged, baseDir, specPath: absSpec };
}

export function loadRecords(datasetPath) {
  const absData = path.resolve(datasetPath);
  const parsed = JSON.parse(fs.readFileSync(absData, 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error(`Dataset at "${absData}" must be a top-level JSON array of records.`);
  }
  return { records: parsed, datasetPath: absData };
}

/**
 * Validates structural & domain invariants on a dataset against a spec.
 */
export function validateRecordsSchema(records, spec = DEFAULT_SPEC) {
  const errors = [];
  if (!Array.isArray(records) || records.length === 0) {
    errors.push('[schema] Dataset must be a non-empty array of records.');
    return errors;
  }

  const seenIds = new Set();
  const statuses = new Set(spec.enums.statuses);
  const allCats = new Set([...spec.enums.coreCategories, spec.enums.incidentalCategory].filter(Boolean));
  const scopes = new Set(spec.enums.scopes);
  const awardModes = new Set(spec.enums.awardModes);
  const urlRe = spec.sourceUrlPattern ? new RegExp(spec.sourceUrlPattern) : null;

  records.forEach((rec, idx) => {
    const label = rec && rec.id ? `record "${rec.id}" (#${idx + 1})` : `record #${idx + 1}`;
    if (!rec || typeof rec !== 'object' || Array.isArray(rec)) {
      errors.push(`[schema] ${label}: must be a JSON object.`);
      return;
    }

    if (typeof rec.id !== 'string' || !rec.id.trim()) {
      errors.push(`[schema] ${label}: missing non-empty string "id".`);
    } else if (seenIds.has(rec.id)) {
      errors.push(`[schema] ${label}: duplicate id "${rec.id}".`);
    } else {
      seenIds.add(rec.id);
    }

    for (const reqStr of ['title', 'buyer', 'category', 'status']) {
      if (typeof rec[reqStr] !== 'string' || !rec[reqStr].trim()) {
        errors.push(`[schema] ${label}: missing non-empty string "${reqStr}".`);
      }
    }

    if (rec.status && !statuses.has(rec.status)) {
      errors.push(`[schema] ${label}: unknown status "${rec.status}" (allowed: ${[...statuses].join(', ')}).`);
    }
    if (rec.category && !allCats.has(rec.category)) {
      errors.push(`[schema] ${label}: unknown category "${rec.category}" (allowed: ${[...allCats].join(', ')}).`);
    }
    if (rec.scope !== undefined && !scopes.has(rec.scope)) {
      errors.push(`[schema] ${label}: unknown scope "${rec.scope}" (allowed: ${[...scopes].join(', ')}).`);
    }
    if (rec.category === spec.enums.incidentalCategory && rec.scope && rec.scope !== 'incidental') {
      errors.push(`[schema] ${label}: incidental category must carry scope "incidental" (got "${rec.scope}").`);
    }

    if (rec.publishedDate !== undefined && rec.publishedDate !== null && !isValidIsoDate(rec.publishedDate)) {
      errors.push(`[schema] ${label}: invalid ISO publishedDate "${rec.publishedDate}".`);
    }
    if (rec.eventDate !== undefined && rec.eventDate !== null && !isValidIsoDate(rec.eventDate)) {
      errors.push(`[schema] ${label}: invalid ISO eventDate "${rec.eventDate}".`);
    }

    if (rec.status === 'resolved') {
      if (typeof rec.amount !== 'number' || !Number.isFinite(rec.amount) || rec.amount < 0) {
        errors.push(`[schema] ${label}: resolved record must have a non-negative finite "amount".`);
      }
      if (rec.awardMode !== undefined && !awardModes.has(rec.awardMode)) {
        errors.push(`[schema] ${label}: unknown awardMode "${rec.awardMode}".`);
      }
      if (rec.bidCount !== null && rec.bidCount !== undefined) {
        if (!Number.isInteger(rec.bidCount) || rec.bidCount < 1) {
          errors.push(`[schema] ${label}: bidCount on resolved record must be an integer >= 1 or null.`);
        }
      }
      if (rec.awardMode === 'sole_source' && typeof rec.bidCount === 'number') {
        errors.push(`[schema] ${label}: sole_source record cannot carry a competitive bidCount (${rec.bidCount}).`);
      }
    }

    if (typeof rec.sourceUrl !== 'string' || !rec.sourceUrl.trim()) {
      errors.push(`[schema] ${label}: missing "sourceUrl".`);
    } else if (urlRe && !urlRe.test(rec.sourceUrl)) {
      errors.push(`[schema] ${label}: sourceUrl "${rec.sourceUrl}" does not match ${spec.sourceUrlPattern}.`);
    }
  });

  return errors;
}

/**
 * Evaluates a URL preset query string (e.g. "cat=software&single=1") against records,
 * mirroring interactive explorer filtering rules.
 */
export function filterRecordsByPreset(records, presetQuery, spec = DEFAULT_SPEC) {
  const params = new URLSearchParams(presetQuery);
  const incCat = spec.enums.incidentalCategory || 'incidental';
  const includeIncidental = params.get('incidental') === '1' || params.get('cat') === incCat;
  const pureOnly = params.get('pure') === '1';
  const status = params.get('status') || '';
  const cat = params.get('cat') || '';
  const sector = params.get('sector') || '';
  const region = params.get('region') || '';
  const year = params.get('year') || '';
  const eyear = params.get('eyear') || '';
  const single = params.get('single') === '1';
  const sole = params.get('sole') === '1';
  const grant = params.get('grant') === '1';
  const q = (params.get('q') || '').trim().toLowerCase();

  return records.filter((r) => {
    if (!includeIncidental && (r.category === incCat || r.scope === 'incidental')) return false;
    if (pureOnly && r.scope === 'mixed') return false;
    if (status && status !== 'all' && r.status !== status) return false;
    if (cat && r.category !== cat) return false;
    if (sector && r.sector !== sector) return false;
    if (region && r.region !== region) return false;
    if (year) {
      const py = String(r.year || (r.publishedDate || '').slice(0, 4));
      if (py !== year) return false;
    }
    if (eyear) {
      const evy = String((r.eventDate || '').slice(0, 4));
      if (evy !== eyear) return false;
    }
    if (single && r.bidCount !== 1) return false;
    if (sole && !(r.status === 'resolved' && (r.awardMode === 'sole_source' || r.bidCount === null))) return false;
    if (grant && !r.grantFunded) return false;
    if (q) {
      const hay = [
        r.id,
        r.sourceId,
        r.title,
        r.buyer,
        r.city,
        r.region,
        r.sector,
        ...(Array.isArray(r.vendors) ? r.vendors : [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
