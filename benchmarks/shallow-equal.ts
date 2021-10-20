import benchmark from 'benchmark';

const suite = new benchmark.Suite();

import areInputsEqual from '../src/are-inputs-equal';

function shallowEvery(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((e, i) => b[i] === e);
}

function shallowFor(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

const a = {};
const b = {};

const listA = [a, b, {}, {}];
const listB = [a, b, {}, {}];

suite.add('shallowEvery with identical lists', () => {
  shallowEvery(listA, listA);
});

suite.add('shallowFor with identical lists', () => {
  shallowFor(listA, listA);
});

suite.add('shallowEvery with half-identical lists', () => {
  shallowEvery(listA, listB);
});

suite.add('shallowFor with half-identical lists', () => {
  shallowFor(listA, listB);
});

suite.add('our areInputsEqual with identical lists', () => {
  areInputsEqual(listA, listA);
});

suite.add('our areInputsEqual with half-identical lists', () => {
  areInputsEqual(listA, listB);
});

// eslint-disable-next-line no-console
suite.on('cycle', (e: any) => console.log(String(e.target)));

suite.run({ async: true });
