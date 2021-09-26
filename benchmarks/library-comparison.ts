/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-console */
import benchmark from 'benchmark';
import memoizeOne from '../src/memoize-one';
import lodash from 'lodash.memoize';
import fastMemoize from 'fast-memoize';
// import mem from 'mem';

type Library = {
  name: string;
  memoize: (fn: (...args: any[]) => unknown) => (...args: any[]) => unknown;
};

const libraries: Library[] = [
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
];

type UseCase = {
  name: string;
  baseFn: (...args: any[]) => unknown;
  args: unknown[];
};

function slowFn() {
  for (let i = 0; i < 2000; i++) {
    void undefined;
  }
}

const cases: UseCase[] = [
  {
    name: 'no arguments',
    baseFn: slowFn,
    args: [],
  },
  {
    name: 'single primitive argument',
    baseFn: slowFn,
    args: [2],
  },
  {
    name: 'single complex argument',
    baseFn: slowFn,
    args: [{ hello: 'world' }],
  },
  {
    name: 'multiple primitive arguments',
    baseFn: slowFn,
    args: [1, 'hello', true],
  },
  {
    name: 'multiple complex arguments',
    baseFn: slowFn,
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
  suite.on('cycle', (e: any) => console.log(String(e.target)));
  // suite.on('finish', () => console.log('\n\r'));
  suite.run();
});
