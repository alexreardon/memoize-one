// TODO: import and test both
import { memoizeOne as memoize } from '../src/next';

it('should give the memoized function a helpful name (named fn)', () => {
  function add(a: number, b: number) {
    return a + b;
  }
  const memoized = memoize(add);
  expect(memoized.name).toBe('memoized(add)');
});

it('should give the memoized function a helpful name (anonymous fn)', () => {
  const memoized = memoize(() => 'hi');
  expect(memoized.name).toBe('memoized(anonymous)');
});

it('should enable cache clearing', () => {
  const underlyingFn = jest.fn(function add(a: number, b: number) {
    return a + b;
  });

  const memoizedAdd = memoize(underlyingFn);

  // first call - not memoized
  const first = memoizedAdd(1, 2);
  expect(first).toBe(3);
  expect(underlyingFn).toHaveBeenCalledTimes(1);

  // second call - memoized (underlying function not called)
  const second = memoizedAdd(1, 2);
  expect(second).toBe(3);
  expect(underlyingFn).toHaveBeenCalledTimes(1);

  // clearing memoization cache
  memoizedAdd.clear();

  // third call - not memoized (cache was cleared)
  const third = memoizedAdd(1, 2);
  expect(third).toBe(3);
  expect(underlyingFn).toHaveBeenCalledTimes(2);
});
