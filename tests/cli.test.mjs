import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

const CLI = path.resolve('bin/data-kit.mjs');
const SPEC = path.resolve('examples/civic-grants/investigation.spec.json');
const RAW = path.resolve('examples/civic-grants/data/raw-uncleaned-sample.json');

test('CLI verify passes on reference civic-grants example', () => {
  const out = execFileSync(process.execPath, [CLI, 'verify', '--spec', SPEC], { encoding: 'utf8' });
  assert.match(out, /VERIFICATION GATE PASSED \(0 errors\)/);
});

test('CLI kpis outputs markdown and JSON', () => {
  const md = execFileSync(process.execPath, [CLI, 'kpis', '--spec', SPEC], { encoding: 'utf8' });
  assert.match(md, /# Investigation KPI Summary/);

  const jsonStr = execFileSync(process.execPath, [CLI, 'kpis', '--spec', SPEC, '--format', 'json'], {
    encoding: 'utf8'
  });
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.counts.all, 4);
  assert.equal(parsed.counts.core, 3);
});

test('CLI audit --strict exits non-zero on uncleaned sample', () => {
  let failed = false;
  try {
    execFileSync(process.execPath, [CLI, 'audit', RAW, '--strict'], { encoding: 'utf8', stdio: 'pipe' });
  } catch (err) {
    failed = true;
    assert.equal(err.status, 1);
    assert.match(err.stdout, /TRAILING_ZERO_TYPO/);
  }
  assert.equal(failed, true);
});

test('CLI parallel-plan prints disjoint agent workstreams', () => {
  const out = execFileSync(process.execPath, [CLI, 'parallel-plan', '--spec', SPEC, '--json'], {
    encoding: 'utf8'
  });
  const plan = JSON.parse(out);
  assert.equal(plan.streams.length, 4);
});
