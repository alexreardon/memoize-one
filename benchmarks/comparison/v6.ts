// The memoize-one v6 comparison logic, kept only so that the benchmarks
// can compare it with the current `Object.is` comparison.
// Source: memoize-one@6.0.0 (src/are-inputs-equal.ts and src/memoize-one.ts)

const safeIsNaN =
  Number.isNaN ||
  function ponyfill(value: unknown): boolean {
    return typeof value === 'number' && value !== value;
  };

function isEqual(first: unknown, second: unknown): boolean {
  if (first === second) {
    return true;
  }

  // Special case for NaN (NaN !== NaN)
  if (safeIsNaN(first) && safeIsNaN(second)) {
    return true;
  }

  return false;
}

export function areInputsEqualV6(
  newInputs: readonly unknown[],
  lastInputs: readonly unknown[],
): boolean {
  if (newInputs.length !== lastInputs.length) {
    return false;
  }
  for (let i = 0; i < newInputs.length; i++) {
    if (!isEqual(newInputs[i], lastInputs[i])) {
      return false;
    }
  }
  return true;
}

type EqualityFn = (newArgs: any[], lastArgs: any[]) => boolean;

type Cache = {
  lastThis: unknown;
  lastArgs: unknown[];
  lastResult: unknown;
};

type MemoizedFnV6<TFunc extends (this: any, ...args: any[]) => any> = {
  clear: () => void;
  (this: ThisParameterType<TFunc>, ...args: Parameters<TFunc>): ReturnType<TFunc>;
};

export function memoizeOneV6<TFunc extends (this: any, ...args: any[]) => any>(
  resultFn: TFunc,
  isEqual: EqualityFn = areInputsEqualV6,
): MemoizedFnV6<TFunc> {
  let cache: Cache | null = null;

  function memoized(
    this: ThisParameterType<TFunc>,
    ...newArgs: Parameters<TFunc>
  ): ReturnType<TFunc> {
    if (cache && cache.lastThis === this && isEqual(newArgs, cache.lastArgs)) {
      return cache.lastResult as ReturnType<TFunc>;
    }

    const lastResult = resultFn.apply(this, newArgs);
    cache = {
      lastResult,
      lastArgs: newArgs,
      lastThis: this,
    };

    return lastResult;
  }

  memoized.clear = function clear() {
    cache = null;
  };

  return memoized;
}
