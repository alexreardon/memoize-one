import benchmark from 'benchmark';
import memoizeOne from '../src/memoize-one';
import lodash from 'lodash.memoize';

const suite = new benchmark.Suite();

function slowFn() {
  for (let i = 0; i < 2000; i++) {
    void undefined;
  }
}

suite.add('no memoization', {
  fn: slowFn,
});

suite.add('memoize-one', {
  fn: memoizeOne(slowFn),
});

suite.add('lodash.memoize', {
  fn: lodash(slowFn),
});

suite.on('cycle', (e: any) => console.log(String(e.target)));

suite.run();
