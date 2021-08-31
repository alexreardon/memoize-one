// TODO: import and test both
import memoize, { EqualityFn } from '../src/next';
import isDeepEqual from 'lodash.isequal';
/* eslint-disable @typescript-eslint/no-explicit-any */

it('should give the memoized function a helpful name', () => {
  function add(...args: number[]) {
    return args.reduce((acc, current) => acc + current, 0);
  }

  const memoized = memoize(add);
  expect(memoized.name).toBe('memoized(add)');
});
