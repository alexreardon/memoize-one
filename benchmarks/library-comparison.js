/* eslint-disable no-console */
import Benchmark from 'benchmark';
import memoizeOne from '../dist/memoize-one.esm.js';
import lodash from 'lodash.memoize';
import fastMemoize from 'fast-memoize';
import mem from 'mem';
import ora from 'ora';
import moize from 'moize';
import memoizee from 'memoizee';
import { green, bold } from 'nanocolors';
import { markdownTable } from 'markdown-table';

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
    name: 'lodash.memoize (JSON.stringify key resolver)',
    memoize: (fn) => {
      const resolver = (...args) => JSON.stringify(args);
      return lodash(fn, resolver);
    },
  },
  {
    name: 'fast-memoize',
    memoize: fastMemoize,
  },
  {
    name: 'moize',
    memoize: moize,
  },
  {
    name: 'memoizee',
    memoize: memoizee,
  },
  {
    name: 'mem (JSON.stringify strategy)',
    // mem supports lots of strategies, choosing a 'fair' one for lots of operations
    memoize: (fn) => mem(fn, { cacheKey: JSON.stringify }),
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
    baseFn: slowFn,
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

scenarios.forEach((scenario) => {
  const suite = new Benchmark.Suite(scenario.name);

  libraries.forEach(function callback(library) {
    const memoized = library.memoize(scenario.baseFn);
    const spinner = ora({
      text: library.name,
      spinner: {
        frames: ['⏳'],
      },
    });

    // Add a benchmark
    suite.add({
      name: library.name,
      fn: () => memoized(...scenario.args),
      onStart: () => spinner.start(),
      onComplete: () => spinner.succeed(),
    });
  });

  suite.on('start', () => {
    console.log(`${bold('Scenario')}: ${green(scenario.name)}`);
  });
  // suite.on('cycle', (e) => console.log(String(e.target)));
  suite.on('complete', (event) => {
    const benchmarks = Object.values(event.currentTarget).filter(
      (item) => item instanceof Benchmark,
    );
    const rows = benchmarks
      // bigger score goes first
      .sort((a, b) => {
        return b.hz - a.hz;
      })
      .map((benchmark, index) => {
        return [index + 1, benchmark.name, Math.round(benchmark.hz).toLocaleString()];
      });

    console.log('\nMarkdown:\n');
    console.log(`**${scenario.name}**\n`);

    const table = markdownTable([['Position', 'Library', 'Operations per second'], ...rows]);
    console.log(table);
    console.log('');
  });
  suite.run();
});
