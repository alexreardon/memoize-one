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

it('should allow weak equality function types', () => {
  function add(first: number, second: number): number {
    return first + second;
  }

  {
    const isEqual = function isEqual(first: [number, number], second: [number, number]) {
      return first === second;
    };
    expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
  }

  {
    const isEqual = function strong(first: number[], second: number[]) {
      return first === second;
    };
    expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
  }

  {
    const isEqual = function unknownStrong(first: [unknown, unknown], second: [unknown, unknown]) {
      return first === second;
    };
    expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
  }

  {
    const isEqual = function unknownWeak(first: unknown[], second: unknown[]) {
      return first === second;
    };
    expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
  }

  {
    const isEqual = function anyStrong(first: [any, any], second: [any, any]) {
      return first === second;
    };
    expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
  }

  {
    const isEqual = function anyWeak(first: any[], second: any[]) {
      return first === second;
    };
    expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
  }

  {
    const isEqual = function anyWeakest(first: any, second: any) {
      return first === second;
    };
    expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
  }

  {
    const isEqual = function anyWeakest(first: any) {
      return !!first;
    };
    expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
  }

  {
    const isEqual = function anyWeakest(...first: any[]) {
      return !!first;
    };
    expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
  }

  {
    const isEqual = function anyWeakest(...first: unknown[]) {
      return !!first;
    };
    expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
  }
});
