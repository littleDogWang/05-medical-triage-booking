import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const id = pkg.name;
const required = [
  'README.md', 'RECIPE.md', 'AGENTS.md', 'ARCHITECTURE.md', 'CONTRIBUTING.md',
  'CLAUDE.md', 'LICENSE', '.gitignore', '.dockerignore', 'Dockerfile',
  '.github/workflows/ci.yml', '.github/workflows/docker.yml', 'env.local.example',
  'docs/ai/L0_repo_card.md', 'docs/ai/RECIPE.md', 'docs/ai/L1/L2/_index.md',
  ...['01_setup', '02_architecture', '03_code_map', '04_conventions',
    '05_workflows', '06_interfaces', '07_gotchas', '08_security']
    .map((name) => 'docs/ai/L1/' + name + '.md'),
];
for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), 'Missing ' + file);
assert.ok(!fs.existsSync(path.join(root, 'STANDARD.md')), 'Do not copy the central standard into a scenario.');
assert.equal(read('CLAUDE.md'), 'This project uses AGENTS.md instead of a CLAUDE.md file.\n\nPlease see @AGENTS.md in this same directory and treat its content as the primary reference for this project.', 'CLAUDE.md must match the fixed template exactly.');
assert.equal(pkg.packageManager, 'pnpm@9.15.9');
assert.match(read('pnpm-lock.yaml'), /^lockfileVersion: '9\.0'/);
assert.match(read('Dockerfile'), /pnpm@9\.15\.9/);
assert.match(read('.github/workflows/ci.yml'), /version: 9\.15\.9/);
assert.match(read('.github/workflows/ci.yml'), /pnpm run verify/);
assert.match(read('.github/workflows/docker.yml'), /pnpm run verify:docker/);
assert.ok(read('docs/ai/L0_repo_card.md').includes('littleDogWang/' + id), 'L0 must identify this repository.');
assert.ok(read('docs/ai/RECIPE.md').startsWith('---\nrecipe_version:'), 'Missing recipe frontmatter.');
assert.equal((read('RECIPE.md').match(/^## [1-8]\. /gm) ?? []).length, 8, 'Public recipe needs eight sections.');
for (const file of required.filter((file) => file.endsWith('.md'))) {
  const text = read(file);
  assert.ok(!/\{\{[A-Z_]+\}\}/.test(text), file + ': unresolved template field');
  for (const [, target] of text.matchAll(/\[[^\]\n]*\]\(([^)\s]+)\)/g)) {
    if (/^(?:https?:|mailto:|#)/.test(target)) continue;
    const destination = target.split('#')[0];
    assert.ok(fs.existsSync(path.resolve(root, path.dirname(file), destination)), file + ': broken link ' + target);
  }
  if (/docs\/ai\/L1\/\d/.test(file)) {
    assert.equal([...text.matchAll(/^## (.+)$/gm)].at(-1)?.[1], 'Related Deep Dives', file + ': final section');
  }
}
for (const command of Object.keys(pkg.scripts).filter((key) => key.startsWith('verify:') && key !== 'verify:docker')) {
  assert.ok(pkg.scripts.verify.includes('pnpm run ' + command), 'Canonical verify omits ' + command);
}
if (pkg.scripts['test:follow-up']) assert.ok(pkg.scripts.verify.includes('pnpm run test:follow-up'));
for (const file of ['README.md', 'AGENTS.md', 'docs/ai/L1/01_setup.md']) {
  const text = read(file);
  assert.ok(text.includes('env.local.example') && text.includes('.env.local'), file + ': environment path missing');
  assert.ok(!text.includes('agora project env write'), file + ': use the template-aware env writer');
}
assert.match(read('Dockerfile'), /ARG NEXT_PUBLIC_AGORA_APP_ID/);
assert.match(read('Dockerfile'), /USER nextjs/);
assert.match(read('.dockerignore'), /\.scenario-data/);
assert.match(read('.dockerignore'), /\*\*\/\.env\*/);
console.log('Starter contract passed: ' + id);
