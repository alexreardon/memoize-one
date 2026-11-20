import { expect, it, vi } from 'vitest';
import { memoizeOne } from '../src/memoize-one.js';

it('should enable cache clearing', () => {
  const underlyingFn = vi.fn(function add(a: number, b: number) {
    return a + b;
  });

  const memoizedAdd = memoizeOne(underlyingFn);

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

it('should not throw when the cache is cleared before the first call', () => {
  const underlyingFn = vi.fn((a: number) => a);
  const memoized = memoizeOne(underlyingFn);

  expect(() => memoized.clear()).not.toThrow();
  expect(memoized(1)).toBe(1);
  expect(underlyingFn).toHaveBeenCalledTimes(1);
});

it('should not call the equality function on the first call after the cache is cleared', () => {
  const underlyingFn = vi.fn((a: number) => a);
  const isEqual = vi.fn(() => true);
  const memoized = memoizeOne(underlyingFn, isEqual);

  memoized(1);
  memoized(1);
  expect(isEqual).toHaveBeenCalledTimes(1);

  memoized.clear();
  memoized(1);
  // no last arguments to compare with
  expect(isEqual).toHaveBeenCalledTimes(1);
  expect(underlyingFn).toHaveBeenCalledTimes(2);
});

it('should clear the cached "this" context', () => {
  const getA = vi.fn(function getA(this: { a: number }) {
    return this.a;
  });
  const memoized = memoizeOne(getA);
  const context = { a: 1 };

  expect(memoized.call(context)).toBe(1);
  memoized.clear();
  // the same context after a clear is a cache miss
  expect(memoized.call(context)).toBe(1);
  expect(getA).toHaveBeenCalledTimes(2);
});

it('should only clear the cache of the memoized function it is called on', () => {
  const first = vi.fn((a: number) => a);
  const second = vi.fn((a: number) => a);
  const memoizedFirst = memoizeOne(first);
  const memoizedSecond = memoizeOne(second);

  memoizedFirst(1);
  memoizedSecond(1);
  memoizedFirst.clear();

  memoizedFirst(1);
  memoizedSecond(1);
  expect(first).toHaveBeenCalledTimes(2);
  expect(second).toHaveBeenCalledTimes(1);
});
