/* eslint-disable flowtype/require-valid-file-annotation */

const Benchmark = require('benchmark');

const suite = new Benchmark.Suite();

function shallowEvery(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((e, i) => b[i] === e);
}

function shallowFor(a, b) {
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

let a = {};
let b = {};

let listA = [a, b, {}, {}];
let listB = [a, b, {}, {}];

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

suite.on('cycle', e => console.log(String(e.target)));

suite.run({ async: true });
