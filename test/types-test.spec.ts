import { EqualityFn } from './../src/memoize-one';
import { expectTypeOf } from 'expect-type';
import memoize from '../src/memoize-one';

it('should maintain the types of the original function', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function getLocation(this: Window, value: number) {
    return this.location;
  }
  const memoized = memoize(getLocation);

  expectTypeOf<ThisParameterType<typeof getLocation>>().toEqualTypeOf<
    ThisParameterType<typeof memoized>
  >();
  expectTypeOf<Parameters<typeof getLocation>>().toEqualTypeOf<Parameters<typeof memoized>>();
  expectTypeOf<ReturnType<typeof getLocation>>().toEqualTypeOf<ReturnType<typeof memoized>>();
});

it('should add a .clear function property', () => {
  function add(first: number, second: number) {
    return first + second;
  }
  const memoized = memoize(add);
  memoized.clear();

  // @ts-expect-error
  expect(() => memoized.foo()).toThrow();

  expectTypeOf<typeof memoized.clear>().toEqualTypeOf<() => void>();
});

it('should type the equality function to based on the provided function', () => {
  function add(first: number, second: number) {
    return first + second;
  }

  expectTypeOf<EqualityFn<typeof add>>().toEqualTypeOf<
    (newArgs: Parameters<typeof add>, lastArgs: Parameters<typeof add>) => boolean
  >();
  expectTypeOf<EqualityFn<typeof add>>().toEqualTypeOf<
    (newArgs: [number, number], lastArgs: [number, number]) => boolean
  >();
});
