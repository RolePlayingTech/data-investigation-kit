import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ALLOWED_PLUGIN_KEYS = new Set([
  'name',
  'description',
  'logo',
  'suggestedPrompts',
  'displayName',
  'version',
  'author',
  'homepage',
  'repository',
  'disabled'
]);

// Enforce universal, domain-neutral repository content (zero references to specific country registries or external articles)
const FORBIDDEN_TERMS_RE =
  /\b(bzp|ezamowienia|przetargi|roleplayingtech-portfolio|stuczynski|mumro|swiadek|uzp|kpo)\b/i;

function walkFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

test('plugin.json uses only valid top-level manifest keys and existing logo asset', () => {
  const plugin = JSON.parse(fs.readFileSync(path.resolve('plugin.json'), 'utf8'));
  for (const key of Object.keys(plugin)) {
    assert.ok(ALLOWED_PLUGIN_KEYS.has(key), `Invalid top-level key in plugin.json: "${key}"`);
  }
  assert.match(plugin.name, /^[a-z0-9-]+$/);
  assert.equal(plugin.suggestedPrompts.length, 3);
  assert.ok(fs.existsSync(path.resolve(plugin.logo)), 'plugin.json logo path must exist');
});

test('every skill in skills/ has valid YAML frontmatter and resolvable relative links', () => {
  const skillsRoot = path.resolve('skills');
  const dirs = fs.readdirSync(skillsRoot, { withFileTypes: true }).filter((d) => d.isDirectory());
  assert.ok(dirs.length >= 5, 'Expected at least 5 portable skills');

  for (const d of dirs) {
    const skillMd = path.join(skillsRoot, d.name, 'SKILL.md');
    assert.ok(fs.existsSync(skillMd), `Missing SKILL.md in skills/${d.name}`);
    const text = fs.readFileSync(skillMd, 'utf8');
    const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert.ok(fmMatch, `Missing YAML frontmatter in skills/${d.name}/SKILL.md`);
    assert.match(fmMatch[1], new RegExp(`^name:\\s*${d.name}\\s*$`, 'm'));
    assert.match(fmMatch[1], /^description:/m);

    // Check relative markdown links
    const linkRe = /\[[^\]]+\]\((\.[^)]+)\)/g;
    let m;
    while ((m = linkRe.exec(text)) !== null) {
      const target = path.resolve(path.dirname(skillMd), m[1]);
      assert.ok(fs.existsSync(target), `Broken relative link "${m[1]}" in skills/${d.name}/SKILL.md`);
    }
  }
});

test('repository remains 100% universal and free of domain-specific article references', () => {
  const allFiles = walkFiles(path.resolve('.'));
  for (const f of allFiles) {
    if (path.resolve(f) === path.resolve('tests/skills-and-plugin.test.mjs')) continue;
    const text = fs.readFileSync(f, 'utf8');
    const match = text.match(FORBIDDEN_TERMS_RE);
    assert.equal(match, null, `Found non-universal term "${match?.[0]}" in ${path.relative('.', f)}`);
  }
});
