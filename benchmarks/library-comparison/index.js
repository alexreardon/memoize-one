/* oxlint-disable no-console */
import { styleText } from 'node:util';
import { Bench } from 'tinybench';
import { markdownTable } from 'markdown-table';
import { memoizeOne } from 'memoize-one';
import { memoize as lodashMemoize } from 'lodash-es';
import fastMemoize from 'fast-memoize';
import { memoize as microMemoize } from 'micro-memoize';
import memoizee from 'memoizee';
import memoize from 'memoize';

const libraries = [
  {
    name: 'no memoization',
    memoize: (fn) => fn,
  },
  {
    name: 'memoize-one',
    memoize: memoizeOne,
  },
  {
    name: 'lodash memoize (JSON.stringify key resolver)',
    memoize: (fn) => {
      const resolver = (...args) => JSON.stringify(args);
      return lodashMemoize(fn, resolver);
    },
  },
  {
    name: 'fast-memoize',
    memoize: fastMemoize,
  },
  {
    name: 'micro-memoize',
    memoize: microMemoize,
  },
  {
    name: 'memoizee',
    memoize: memoizee,
  },
  {
    name: 'memoize (JSON.stringify cache key)',
    // memoize supports lots of strategies, choosing a 'fair' one for lots of operations
    memoize: (fn) => memoize(fn, { cacheKey: JSON.stringify }),
  },
];

function slowFn() {
  // Burn CPU for 2ms
  const start = Date.now();
  while (Date.now() - start < 2) {
    void undefined;
  }
}

const scenarios = [
  {
    name: 'no arguments',
    // Returning a value: some libraries (such as fast-memoize) do not cache `undefined`
    baseFn: function getValue() {
      slowFn();
      return 'value';
    },
    args: [],
  },
  {
    name: 'single primitive argument',
    baseFn: function add1(value) {
      slowFn();
      return value + 1;
    },
    args: [2],
  },
  {
    name: 'single complex argument',
    baseFn: function identity(value) {
      slowFn();
      return value;
    },
    args: [{ hello: 'world' }],
  },
  {
    name: 'multiple primitive arguments',
    baseFn: function asArray(a, b, c) {
      slowFn();
      return [a, b, c];
    },
    args: [1, 'hello', true],
  },
  {
    name: 'multiple complex arguments',
    baseFn: function asArray(a, b, c) {
      slowFn();
      return [a, b, c];
    },
    args: [() => {}, { hello: { there: 'world' } }, [1, 2, 3]],
  },
  {
    name: 'multiple complex arguments (spreading arguments)',
    baseFn: function asArray(...values) {
      slowFn();
      return [...values];
    },
    args: [() => {}, { hello: { there: 'world' } }, [1, 2, 3]],
  },
];

// Each sample makes this many calls. Timing one call at a time would mostly
// measure the timer, and would hide the differences between fast libraries.
const callsPerSample = 100;

console.log(`node version \`${process.versions.node}\`\n`);

for (const scenario of scenarios) {
  console.log(`${styleText('bold', 'Scenario')}: ${styleText('green', scenario.name)}`);

  const bench = new Bench({ name: scenario.name, time: 1000, iterations: 10 });
  for (const library of libraries) {
    const memoized = library.memoize(scenario.baseFn);
    bench.add(library.name, () => {
      for (let i = 0; i < callsPerSample; i++) {
        memoized(...scenario.args);
      }
    });
  }
  await bench.run();

  const results = bench.tasks
    .map((task) => ({
      name: task.name,
      hz: task.result.throughput.mean * callsPerSample,
      rme: task.result.throughput.rme,
    }))
    // bigger score goes first
    .sort((a, b) => b.hz - a.hz);

  for (const result of results) {
    console.log(`  ${result.name}: ±${result.rme.toFixed(2)}%`);
  }

  const rows = results.map((row, index) => [
    String(index + 1),
    row.name,
    Math.round(row.hz).toLocaleString('en-US'),
  ]);

  console.log(`\n**${scenario.name}**\n`);
  console.log(markdownTable([['Position', 'Library', 'Operations per second'], ...rows]));
  console.log('');
}
