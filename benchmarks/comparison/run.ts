/* oxlint-disable no-console */
// Compares the v7 `Object.is` comparison with the v6 comparison (`===` plus a NaN check).
// Run with: npm run bench
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scenarios, type Version } from './scenarios.ts';

const worker = fileURLToPath(new URL('./worker.ts', import.meta.url));
const runsPerVersion = 5;

function measure(scenario: string, version: Version): number {
  const output = execFileSync(process.execPath, [worker, scenario, version], { encoding: 'utf8' });
  return JSON.parse(output).opsPerSecond;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function format(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

console.log(`node version \`${process.versions.node}\``);
console.log(`median of ${runsPerVersion} runs, each in a fresh process\n`);

const rows: string[] = [];
for (const scenario of Object.keys(scenarios)) {
  const results: Record<Version, number[]> = { v6: [], v7: [] };
  // alternate the versions, so that neither always runs first
  for (let run = 0; run < runsPerVersion; run++) {
    const order: Version[] = run % 2 === 0 ? ['v6', 'v7'] : ['v7', 'v6'];
    for (const version of order) {
      results[version].push(measure(scenario, version));
    }
  }
  const v6 = median(results.v6);
  const v7 = median(results.v7);
  const row = `| ${scenario} | ${format(v6)} | ${format(v7)} | ${(v7 / v6).toFixed(2)}x |`;
  const spread = (values: number[]) =>
    `${format(Math.min(...values))}–${format(Math.max(...values))}`;
  console.log(`${row}  (v6 runs ${spread(results.v6)}, v7 runs ${spread(results.v7)})`);
  rows.push(row);
}

console.log('\nMarkdown:\n');
console.log(
  '| Scenario | v6: `===` with NaN check (calls/sec) | v7: `Object.is` (calls/sec) | v7 / v6 |',
);
console.log('| --- | --- | --- | --- |');
console.log(rows.join('\n'));
