import areInputsEqual from './are-inputs-equal';

// Using ReadonlyArray<T> rather than readonly T as it works with TS v3
export type EqualityFn<TFunc extends (...args: any[]) => any> = (
  newArgs: Parameters<TFunc>,
  lastArgs: Parameters<TFunc>,
) => boolean;

type Cache<TThis, TArgs, TResult> = {
  lastThis: TThis;
  lastArgs: TArgs;
  lastResult: TResult;
};

type MemoizedFn<TFunc extends (this: any, ...args: any[]) => any> = {
  clear: () => void;
  (this: ThisParameterType<TFunc>, ...args: Parameters<TFunc>): ReturnType<TFunc>;
};

function memoizeOne<TFunc extends (this: any, ...newArgs: any[]) => any>(
  resultFn: TFunc,
  isEqual: EqualityFn<TFunc> = areInputsEqual,
): MemoizedFn<TFunc> {
  let cache: Cache<ThisParameterType<TFunc>, Parameters<TFunc>, ReturnType<TFunc>> | null = null;

  // breaking cache when context (this) or arguments change
  function memoized(
    this: ThisParameterType<TFunc>,
    ...newArgs: Parameters<TFunc>
  ): ReturnType<TFunc> {
    if (cache && cache.lastThis === this && isEqual(newArgs, cache.lastArgs)) {
      return cache.lastResult;
    }

    // Throwing during an assignment aborts the assignment: https://codepen.io/alexreardon/pen/RYKoaz
    // Doing the lastResult assignment first so that if it throws
    // nothing will be overwritten
    const lastResult = resultFn.apply(this, newArgs);
    cache = {
      lastResult,
      lastArgs: newArgs,
      lastThis: this,
    };

    return lastResult;
  }

  // Giving the function a better name for devtools
  Object.defineProperty(memoized, 'name', {
    value: `memoized(${resultFn.name || 'anonymous'})`,
    // fn.name is configurable, so maintaining that.
    configurable: true,
    // Using the default values:
    // enumerable: false,
    // writable: false,
  });

  // Adding the ability to clear the cache of a memoized function
  memoized.clear = function clear() {
    cache = null;
  };

  return memoized;
}

export { memoizeOne };
