#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { auditDataset } from '../src/audit.mjs';
import { computeKpis, renderKpisMarkdown } from '../src/kpis.mjs';
import { generateOgSvg } from '../src/og.mjs';
import { generateParallelPlan, scaffoldWorkspace } from '../src/scaffold.mjs';
import { DEFAULT_SPEC, loadRecords, loadSpec } from '../src/schema.mjs';
import { verifyInvestigation } from '../src/verify.mjs';

const HELP = `data-investigation-kit (data-kit) v1.0.0
Deterministic CLI & verification harness for source-verified data investigations.

Usage:
  data-kit init <target-dir> [--title "Investigation Title"]
  data-kit audit <records.json> [--spec investigation.spec.json] [--json] [--strict]
  data-kit kpis <records.json> [--spec investigation.spec.json] [--format markdown|json]
  data-kit verify [--spec investigation.spec.json]
  data-kit og [--spec investigation.spec.json] [--out assets/og-card.svg]
  data-kit parallel-plan [--spec investigation.spec.json] [--agents 4] [--json]
`;

function parseFlags(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i += 1;
      }
    } else if (arg === '-h') {
      flags.help = true;
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function serializeBigIntJson(obj) {
  return JSON.stringify(
    obj,
    (_, v) => (typeof v === 'bigint' ? v.toString() : v),
    2
  );
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { positional, flags } = parseFlags(rest);

  if (!cmd || cmd === '--help' || cmd === '-h' || flags.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }
  if (cmd === '--version' || cmd === '-v') {
    process.stdout.write('1.0.0\n');
    process.exit(0);
  }

  if (cmd === 'init') {
    const dir = positional[0];
    if (!dir) {
      console.error('Error: `data-kit init <target-dir>` requires a directory path.');
      process.exit(1);
    }
    const { root, kpis } = scaffoldWorkspace(dir, { title: flags.title });
    console.log(
      `Scaffolded investigation workspace at ${root} (${kpis.counts.all} starter records, ${kpis.totals.coreSumMillions} core signed).`
    );
    return;
  }

  if (cmd === 'audit') {
    const specInfo = flags.spec ? loadSpec(flags.spec) : null;
    const spec = specInfo ? specInfo.spec : DEFAULT_SPEC;
    const dataFile = positional[0] || (specInfo ? path.resolve(specInfo.baseDir, spec.dataset) : null);
    if (!dataFile) {
      console.error('Error: provide <records.json> or --spec <investigation.spec.json>.');
      process.exit(1);
    }
    const { records } = loadRecords(dataFile);
    const report = auditDataset(records, spec);
    if (flags.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(
        `AUDIT SUMMARY — ${report.totalRecords} records scanned · ${report.findingsCount} finding(s) ` +
          `(high: ${report.countsBySeverity.high}, medium: ${report.countsBySeverity.medium}, low: ${report.countsBySeverity.low})`
      );
      for (const f of report.findings) {
        console.log(`  [${f.severity.toUpperCase()}] ${f.code} — ${f.message}`);
      }
    }
    if (flags.strict && report.countsBySeverity.high > 0) {
      process.exit(1);
    }
    return;
  }

  if (cmd === 'kpis') {
    const specInfo = flags.spec ? loadSpec(flags.spec) : null;
    const spec = specInfo ? specInfo.spec : DEFAULT_SPEC;
    const dataFile = positional[0] || (specInfo ? path.resolve(specInfo.baseDir, spec.dataset) : null);
    if (!dataFile) {
      console.error('Error: provide <records.json> or --spec <investigation.spec.json>.');
      process.exit(1);
    }
    const { records } = loadRecords(dataFile);
    const kpis = computeKpis(records, spec);
    if (flags.format === 'json' || flags.json) {
      console.log(serializeBigIntJson(kpis));
    } else {
      console.log(renderKpisMarkdown(kpis));
    }
    return;
  }

  if (cmd === 'verify') {
    const specFile = flags.spec || positional[0] || 'investigation.spec.json';
    const { spec, baseDir } = loadSpec(specFile);
    const { records } = loadRecords(path.resolve(baseDir, spec.dataset));
    const result = verifyInvestigation({ records, spec, baseDir });
    if (!result.ok) {
      console.error(`VERIFICATION GATE FAILED (${result.errors.length} error(s)):`);
      result.errors.forEach((err, idx) => {
        console.error(`  ${idx + 1}. ${err}`);
      });
      process.exit(1);
    }
    console.log(
      `VERIFICATION GATE PASSED (0 errors) · ${result.kpis.counts.all} records ` +
        `(${result.kpis.counts.core} core, ${result.kpis.counts.coreSigned} signed = ${result.kpis.totals.coreSumMillions}) · ` +
        `${(spec.reports || []).length} report file(s) verified.`
    );
    return;
  }

  if (cmd === 'og') {
    const specFile = flags.spec || positional[0] || 'investigation.spec.json';
    const { spec, baseDir } = loadSpec(specFile);
    const { records } = loadRecords(path.resolve(baseDir, spec.dataset));
    const kpis = computeKpis(records, spec);
    const svg = generateOgSvg(kpis, spec);
    const outRel = flags.out || spec.reports?.find((r) => r.ogImageFile)?.ogImageFile || 'assets/og-card.svg';
    const outAbs = path.resolve(baseDir, outRel);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, svg);
    console.log(`Generated 1200x630 OpenGraph SVG card at ${outAbs}`);
    return;
  }

  if (cmd === 'parallel-plan') {
    const specFile = flags.spec || positional[0] || 'investigation.spec.json';
    const { spec } = fs.existsSync(specFile) ? loadSpec(specFile) : { spec: DEFAULT_SPEC };
    const plan = generateParallelPlan(spec, Number(flags.agents || 4));
    if (flags.json) {
      console.log(JSON.stringify(plan, null, 2));
    } else {
      console.log(`# Parallel Multi-Agent Plan — ${plan.title}\n`);
      console.log(`Rule: ${plan.coordinatorRule}\n`);
      for (const s of plan.streams) {
        console.log(`## ${s.id} (${s.role})`);
        console.log(`- **Write ownership:** \`${s.owns.join('`, `')}\``);
        console.log(`- **Read-only inputs:** \`${s.readOnly.join('`, `')}\``);
        console.log(`- **Deliverable:** ${s.deliverable}\n`);
      }
    }
    return;
  }

  console.error(`Unknown command: "${cmd}". Run \`data-kit --help\` for usage.`);
  process.exit(1);
}

main();
