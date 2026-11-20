/* oxlint-disable no-console */
// Packs memoize-one, installs the tarball into an empty project, then loads it
// with `import` (ESM) and `require()` (CommonJS, through Node's require(esm)).
// This checks what users get from npm: the `files` list and the `exports` map.
// Run `npm run build` first.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const checks = `
let calls = 0;
const add = memoizeOne((a, b) => {
  calls++;
  return a + b;
});
assert.equal(add(1, 2), 3);
assert.equal(add(1, 2), 3);
assert.equal(calls, 1);
add.clear();
assert.equal(add(1, 2), 3);
assert.equal(calls, 2);

assert.equal(areInputsEqual([NaN], [NaN]), true);
assert.equal(areInputsEqual([0], [-0]), false);
`;

const esm = `
import assert from 'node:assert/strict';
import * as namespace from 'memoize-one';
import memoizeOneDefault, { memoizeOne, areInputsEqual } from 'memoize-one';
assert.deepEqual(Object.keys(namespace).sort(), ['areInputsEqual', 'default', 'memoizeOne']);
assert.equal(memoizeOneDefault, memoizeOne);
${checks}
console.log('ESM import: ok');
`;

const cjs = `
const assert = require('node:assert/strict');
const { memoizeOne, areInputsEqual, default: memoizeOneDefault } = require('memoize-one');
assert.equal(memoizeOneDefault, memoizeOne);
${checks}
console.log('CommonJS require: ok');
`;

const dir = mkdtempSync(join(tmpdir(), 'memoize-one-smoke-'));
try {
  const [{ filename }] = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', dir], { encoding: 'utf8' }),
  );
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'smoke-test', private: true }));
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--ignore-scripts', `./${filename}`], {
    cwd: dir,
    stdio: 'ignore',
  });
  writeFileSync(join(dir, 'esm.mjs'), esm);
  writeFileSync(join(dir, 'cjs.cjs'), cjs);

  console.log(`node ${process.versions.node}`);
  execFileSync(process.execPath, ['esm.mjs'], { cwd: dir, stdio: 'inherit' });
  execFileSync(process.execPath, ['cjs.cjs'], { cwd: dir, stdio: 'inherit' });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
