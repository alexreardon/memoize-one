import benchmark from 'benchmark';
import memoize from '../src/memoize-one';

const suite = new benchmark.Suite();

function baseline() {
  for (var i = 0; i < 2000; i++) {
    void undefined;
  }
}

suite.add('no memoization', {
  fn: baseline,
});

suite.add('memoize-one', {
  fn: memoize(baseline),
});

suite.on('cycle', (e: any) => console.log(String(e.target)));

suite.run();
