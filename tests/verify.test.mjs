import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { scaffoldWorkspace } from '../src/scaffold.mjs';
import { loadRecords, loadSpec } from '../src/schema.mjs';
import { verifyInvestigation } from '../src/verify.mjs';

test('scaffolded workspace passes verifyInvestigation with 0 errors', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'data-kit-test-'));
  try {
    scaffoldWorkspace(tmp, { title: 'Test Civic Audit' });
    const { spec, baseDir } = loadSpec(path.join(tmp, 'investigation.spec.json'));
    const { records } = loadRecords(path.join(baseDir, spec.dataset));
    const res = verifyInvestigation({ records, spec, baseDir });
    assert.equal(res.ok, true, `Unexpected errors: ${res.errors.join('; ')}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('verifyInvestigation catches stale KPI numbers, dead #anchors, and invalid presets', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'data-kit-fail-'));
  try {
    scaffoldWorkspace(tmp, { title: 'Test Drift Detection' });
    const htmlPath = path.join(tmp, 'site/index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    // Introduce numeric drift, a broken anchor, and an unknown preset param
    html = html.replace('data-kpi="counts.all">4<', 'data-kpi="counts.all">999<');
    html = html.replace('href="#hygiene"', 'href="#missing-section"');
    html = html.replace('data-preset="single=1"', 'data-preset="badparam=1"');
    fs.writeFileSync(htmlPath, html);

    const { spec, baseDir } = loadSpec(path.join(tmp, 'investigation.spec.json'));
    const { records } = loadRecords(path.join(baseDir, spec.dataset));
    const res = verifyInvestigation({ records, spec, baseDir });

    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes('[html-kpi]') && e.includes('counts.all')));
    assert.ok(res.errors.some((e) => e.includes('missing-section')));
    assert.ok(res.errors.some((e) => e.includes('badparam')));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
