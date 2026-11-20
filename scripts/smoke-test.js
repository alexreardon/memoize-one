/* oxlint-disable no-console */
// Packs memoize-one, installs the tarball into an empty project, then checks
// what users get from npm (the `files` list, the `exports` map and the types):
// - `import` (ESM) and `require()` (CommonJS, through Node's require(esm))
// - the default export through the interop helper that Babel adds to CommonJS output
// - a TypeScript project type-checks against the published types with
//   `moduleResolution: bundler` and `nodenext`, and its compiled ESM and
//   CommonJS output runs (this uses TypeScript's own interop helpers)
// `npm run test:smoke` builds first.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

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

// Node adds \`__esModule\` because the module has a default export.
// Babel's interop helper needs it to find the default export.
assert.equal(require('memoize-one').__esModule, true);
function interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
assert.equal(interopRequireDefault(require('memoize-one')).default, memoizeOne);
${checks}
console.log('CommonJS require: ok');
`;

// Type-checked under each TypeScript setup, then compiled and run under nodenext
const consumer = `
import memoizeOneDefault, {
  areInputsEqual,
  memoizeOne,
  type EqualityFn,
  type MemoizedFn,
} from 'memoize-one';

function check(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const add: MemoizedFn<(a: number, b: number) => number> = memoizeOne(
  (a: number, b: number) => a + b,
);
check(add(1, 2) === 3, 'named import');
add.clear();

const double = memoizeOneDefault((value: number) => value * 2);
check(double(2) === 4, 'default import');
check(memoizeOneDefault === memoizeOne, 'the default export is memoizeOne');

const ignoreLastArg: EqualityFn = (newArgs, lastArgs) =>
  areInputsEqual(newArgs.slice(0, -1), lastArgs.slice(0, -1));
const format = memoizeOne((value: number, unit: string) => value + unit, ignoreLastArg);
check(format(1, 'px') === '1px' && format(1, 'em') === '1px', 'reusable equality function');

// Only checks types: never called
export function typeErrors(): void {
  // @ts-expect-error: wrong argument type
  add('1', 2);
  // @ts-expect-error: wrong return type
  const text: string = add(1, 2);
}
`;

const compilerOptions = { target: 'es2022', lib: ['es2022'], strict: true, types: [] };
const tsconfigs = {
  'tsconfig.bundler.json': {
    compilerOptions: {
      ...compilerOptions,
      module: 'preserve',
      moduleResolution: 'bundler',
      noEmit: true,
    },
    files: ['bundler.ts'],
  },
  'tsconfig.nodenext.json': {
    compilerOptions: { ...compilerOptions, module: 'nodenext', outDir: 'out' },
    files: ['esm.mts', 'cjs.cts'],
  },
};

// The TypeScript version this repo uses
const require = createRequire(import.meta.url);
const tsc = join(dirname(require.resolve('typescript/package.json')), 'bin', 'tsc');

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
  for (const file of ['bundler.ts', 'esm.mts', 'cjs.cts']) {
    writeFileSync(join(dir, file), consumer);
  }
  for (const [file, config] of Object.entries(tsconfigs)) {
    writeFileSync(join(dir, file), JSON.stringify(config));
  }

  console.log(`node ${process.versions.node}`);
  execFileSync(process.execPath, ['esm.mjs'], { cwd: dir, stdio: 'inherit' });
  execFileSync(process.execPath, ['cjs.cjs'], { cwd: dir, stdio: 'inherit' });

  for (const file of Object.keys(tsconfigs)) {
    execFileSync(process.execPath, [tsc, '-p', file], { cwd: dir, stdio: 'inherit' });
  }
  console.log('TypeScript types (bundler, nodenext): ok');
  execFileSync(process.execPath, ['out/esm.mjs'], { cwd: dir, stdio: 'inherit' });
  execFileSync(process.execPath, ['out/cjs.cjs'], { cwd: dir, stdio: 'inherit' });
  console.log('TypeScript compiled ESM and CommonJS: ok');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
