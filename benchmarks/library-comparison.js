/* eslint-disable no-console */
import benchmark from 'benchmark';
import memoizeOne from '../dist/memoize-one.esm.js';
import lodash from 'lodash.memoize';
import fastMemoize from 'fast-memoize';
import mem from 'mem';

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
    name: 'lodash.memoize',
    memoize: lodash,
  },
  {
    name: 'fast-memoize',
    memoize: fastMemoize,
  },
  {
    name: 'mem',
    memoize: mem,
  },
];

function slowFn() {
  for (let i = 0; i < 2000; i++) {
    void undefined;
  }
}

const cases = [
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
    baseFn: function asArray(...values) {
      slowFn();
      return values;
    },
    args: [1, 'hello', true],
  },
  {
    name: 'multiple complex arguments',
    baseFn: function asArray(...values) {
      slowFn();
      return values;
    },
    args: [() => {}, { hello: { there: 'world' } }, [1, 2, 3]],
  },
];

cases.forEach((useCase) => {
  const suite = new benchmark.Suite(useCase.name);

  libraries.forEach(function callback(library) {
    const memoized = library.memoize(useCase.baseFn);

    // Add a benchmark
    suite.add({
      name: library.name,
      fn: () => memoized(...useCase.args),
    });
  });

  suite.on('start', () => console.log(`Use case: [${useCase.name}]`));
  suite.on('cycle', (e) => console.log(String(e.target)));
  // suite.on('finish', () => console.log('\n\r'));
  suite.run();
});
