// Type tests declare functions and values only to check their types
/* oxlint-disable no-unused-vars */
import { isEqual as isDeepEqual } from 'es-toolkit';
import { expect, expectTypeOf, it } from 'vitest';
import memoizeOneDefault, {
  areInputsEqual,
  memoizeOne,
  type EqualityFn,
  type MemoizedFn,
} from '../src/memoize-one.js';

it('should maintain the types of the original function', () => {
  function getLocation(this: Window, value: number) {
    return this.location;
  }
  const memoized = memoizeOne(getLocation);

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
  const memoized = memoizeOne(add);
  memoized.clear();

  // @ts-expect-error
  expect(() => memoized.foo()).toThrow();

  expectTypeOf<typeof memoized.clear>().toEqualTypeOf<() => void>();
});

it('should return a `MemoizedFn<T>`', () => {
  function add(first: number, second: number): number {
    return first + second;
  }

  const memoized = memoizeOne(add);

  expectTypeOf<typeof memoized>().toEqualTypeOf<MemoizedFn<typeof add>>();
});

it('should allow you to leverage the MemoizedFn generic to allow many memoized functions', () => {
  function withDeepEqual<TFunc extends (...args: any[]) => any>(fn: TFunc): MemoizedFn<TFunc> {
    return memoizeOne(fn, isDeepEqual);
  }
  function add(first: number, second: number): number {
    return first + second;
  }

  const memoized = withDeepEqual(add);

  expectTypeOf<typeof memoized>().toEqualTypeOf<MemoizedFn<typeof add>>();
});

it('should return a memoized function that satisies a typeof check for the original function', () => {
  function add(first: number, second: number): number {
    return first + second;
  }
  function caller(fn: typeof add) {
    return fn(1, 2);
  }
  const memoized = memoizeOne(add);

  // this line is the actual type test
  const result = caller(memoized);
  expectTypeOf<typeof result>().toEqualTypeOf<number>();
});

it('should allow casting back to the original function type', () => {
  type AddFn = (first: number, second: number) => number;
  function add(first: number, second: number): number {
    return first + second;
  }
  // baseline
  {
    const memoized = memoizeOne(add);
    // a memoized function is assignable to the original function type,
    // but is not equal to it (it has an extra `.clear()` property)
    expectTypeOf<typeof memoized>().not.toEqualTypeOf<AddFn>();
    expectTypeOf<typeof memoized>().toExtend<AddFn>();
    expectTypeOf<typeof memoized>().toEqualTypeOf<MemoizedFn<typeof add>>();
    expectTypeOf<typeof memoized>().toEqualTypeOf<MemoizedFn<AddFn>>();
    expectTypeOf<typeof memoized>().toExtend<MemoizedFn<typeof add>>();
    expectTypeOf<typeof memoized>().toExtend<MemoizedFn<AddFn>>();
  }
  {
    const memoized: typeof add = memoizeOne(add);
    expectTypeOf<typeof memoized>().toEqualTypeOf<AddFn>();
    expectTypeOf<typeof memoized>().not.toExtend<MemoizedFn<typeof add>>();
    expectTypeOf<typeof memoized>().not.toExtend<MemoizedFn<AddFn>>();
  }
  {
    const memoized: AddFn = memoizeOne(add);
    expectTypeOf<typeof memoized>().toEqualTypeOf<AddFn>();
    expectTypeOf<typeof memoized>().not.toExtend<MemoizedFn<typeof add>>();
    expectTypeOf<typeof memoized>().not.toExtend<MemoizedFn<AddFn>>();
  }
  {
    const memoized = memoizeOne(add) as typeof add;
    expectTypeOf<typeof memoized>().toEqualTypeOf<AddFn>();
    expectTypeOf<typeof memoized>().not.toExtend<MemoizedFn<typeof add>>();
    expectTypeOf<typeof memoized>().not.toExtend<MemoizedFn<AddFn>>();
  }
  {
    const memoized = memoizeOne(add) as AddFn;
    expectTypeOf<typeof memoized>().toEqualTypeOf<AddFn>();
    expectTypeOf<typeof memoized>().not.toExtend<MemoizedFn<typeof add>>();
    expectTypeOf<typeof memoized>().not.toExtend<MemoizedFn<AddFn>>();
  }
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

it('should allow weaker equality function types', () => {
  function add(first: number, second: number): number {
    return first + second;
  }

  // ✅ exact parameters of `add`
  {
    const isEqual = function (first: Parameters<typeof add>, second: Parameters<typeof add>) {
      return true;
    };
    expectTypeOf<typeof isEqual>().toExtend<EqualityFn<typeof add>>();
  }

  // ✅ tuple of the correct types
  {
    const isEqual = function (first: [number, number], second: [number, number]) {
      return true;
    };
    expectTypeOf<typeof isEqual>().toExtend<EqualityFn<typeof add>>();
  }

  // ❌ tuple of incorrect types
  {
    const isEqual = function (first: [number, string], second: [number, number]) {
      return true;
    };
    expectTypeOf<typeof isEqual>().not.toExtend<EqualityFn<typeof add>>();
  }

  // ✅ array of the correct types
  {
    const isEqual = function (first: number[], second: number[]) {
      return true;
    };
    expectTypeOf<typeof isEqual>().toExtend<EqualityFn<typeof add>>();
  }

  // ❌ array of incorrect types
  {
    const isEqual = function (first: string[], second: number[]) {
      return true;
    };
    expectTypeOf<typeof isEqual>().not.toExtend<EqualityFn<typeof add>>();
  }

  // ✅ tuple of 'unknown'
  {
    const isEqual = function (first: [unknown, unknown], second: [unknown, unknown]) {
      return true;
    };
    expectTypeOf<typeof isEqual>().toExtend<EqualityFn<typeof add>>();
  }

  // ❌ tuple of 'unknown' of incorrect length
  {
    const isEqual = function (first: [unknown, unknown, unknown], second: [unknown, unknown]) {
      return true;
    };
    expectTypeOf<typeof isEqual>().not.toExtend<EqualityFn<typeof add>>();
  }

  // ✅ array of 'unknown'
  {
    const isEqual = function (first: unknown[], second: unknown[]) {
      return true;
    };
    expectTypeOf<typeof isEqual>().toExtend<EqualityFn<typeof add>>();
  }

  // ✅ spread of 'unknown'
  {
    const isEqual = function (...first: unknown[]) {
      return !!first;
    };
    expectTypeOf<typeof isEqual>().toExtend<EqualityFn<typeof add>>();
  }

  // ✅ tuple of 'any'
  {
    const isEqual = function (first: [any, any], second: [any, any]) {
      return true;
    };
    expectTypeOf<typeof isEqual>().toExtend<EqualityFn<typeof add>>();
  }

  // ❌ tuple of 'any' or incorrect size
  {
    const isEqual = function (first: [any, any, any], second: [any, any]) {
      return true;
    };
    expectTypeOf<typeof isEqual>().not.toExtend<EqualityFn<typeof add>>();
  }

  // ✅ array of 'any'
  {
    const isEqual = function (first: any[], second: any[]) {
      return true;
    };
    expectTypeOf<typeof isEqual>().toExtend<EqualityFn<typeof add>>();
  }

  // ✅ two arguments of type any
  {
    const isEqual = function (first: any, second: any) {
      return true;
    };
    expectTypeOf<typeof isEqual>().toExtend<EqualityFn<typeof add>>();
  }

  // ✅ a single argument of type any
  {
    const isEqual = function (first: any) {
      return true;
    };
    expectTypeOf<typeof isEqual>().toExtend<EqualityFn<typeof add>>();
  }

  // ✅ spread of any type
  {
    const isEqual = function (...first: any[]) {
      return true;
    };
    expectTypeOf<typeof isEqual>().toExtend<EqualityFn<typeof add>>();
  }
});

it('should give the default export the same type as the named export', () => {
  expectTypeOf(memoizeOneDefault).toEqualTypeOf(memoizeOne);
});

it('should require a "this" context when the original function declares one', () => {
  function getA(this: { a: number }) {
    return this.a;
  }
  const memoized = memoizeOne(getA);

  expectTypeOf<ThisParameterType<typeof memoized>>().toEqualTypeOf<{ a: number }>();
  // only checks types: never called
  const checkTypes = () => {
    // @ts-expect-error: no "this" context
    memoized();
    memoized.call({ a: 1 });
  };
  expect(checkTypes).toBeTypeOf('function');
});

it('should not require a "this" context when the original function does not declare one', () => {
  const memoized = memoizeOne((a: number) => a);

  expectTypeOf<ThisParameterType<typeof memoized>>().toEqualTypeOf<unknown>();
  expect(memoized(1)).toBe(1);
  expect(memoized.call({ unrelated: true }, 2)).toBe(2);
});

it('should allow a reusable equality function with no type argument', () => {
  const ignoreLastArg: EqualityFn = (newArgs, lastArgs) =>
    areInputsEqual(newArgs.slice(0, -1), lastArgs.slice(0, -1));

  expectTypeOf<Parameters<typeof ignoreLastArg>>().toEqualTypeOf<[unknown[], unknown[]]>();
  expectTypeOf(ignoreLastArg).toExtend<EqualityFn<(a: number, b: string) => string>>();
  expectTypeOf(ignoreLastArg).toExtend<EqualityFn<() => void>>();

  const memoized = memoizeOne((a: number, b: string) => `${a}${b}`, ignoreLastArg);
  expectTypeOf(memoized).toEqualTypeOf<MemoizedFn<(a: number, b: string) => string>>();
  expect(memoized(1, 'a')).toBe('1a');
  // the last argument is ignored
  expect(memoized(1, 'b')).toBe('1a');
});

it('should infer the memoized function type from the result function only', () => {
  const add = (a: number, b: number) => a + b;
  const anyEqual: EqualityFn<any> = () => true;

  expectTypeOf(memoizeOne(add, anyEqual)).toEqualTypeOf<MemoizedFn<typeof add>>();
  expectTypeOf(memoizeOne(add, areInputsEqual)).toEqualTypeOf<MemoizedFn<typeof add>>();
});
