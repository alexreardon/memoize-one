/**
 * A function that decides if the new arguments are equal to the last arguments.
 * Return `true` to use the cached result, or `false` to call the result function again.
 *
 * `TFunc` is the function being memoized. Without it, `EqualityFn` accepts the
 * arguments of any function, so you can write one equality function and reuse it.
 */
export type EqualityFn<TFunc extends (...args: any[]) => any = (...args: any[]) => any> = (
  newArgs: Parameters<TFunc>,
  lastArgs: Parameters<TFunc>,
) => boolean;

/**
 * A memoized version of `TFunc`. It has the same `this` type, parameters and
 * return type as `TFunc`, plus a `.clear()` function to clear the cache.
 *
 * Other properties of `TFunc` are not copied. Because the call signature is
 * rebuilt from `Parameters` and `ReturnType`, only the last overload of `TFunc`
 * is kept, generic type parameters become `unknown`, and type predicates and
 * assertion signatures no longer narrow.
 */
export type MemoizedFn<TFunc extends (this: any, ...args: any[]) => any> = {
  /** Clear the cache, so that the next call will call the result function again */
  clear: () => void;
  (this: ThisParameterType<TFunc>, ...args: Parameters<TFunc>): ReturnType<TFunc>;
};

// internal type
type Cache<TFunc extends (this: any, ...args: any[]) => any> = {
  lastThis: ThisParameterType<TFunc>;
  lastArgs: Parameters<TFunc>;
  lastResult: ReturnType<TFunc>;
};

/**
 * The default equality check used by `memoizeOne`.
 *
 * Returns `true` when both lists have the same length,
 * and each item is the same value according to `Object.is`.
 */
export function areInputsEqual(
  newInputs: readonly unknown[],
  lastInputs: readonly unknown[],
): boolean {
  // no checks needed if the inputs length has changed
  if (newInputs.length !== lastInputs.length) {
    return false;
  }
  // Using for loop for speed. It generally performs better than array.every
  // https://github.com/alexreardon/memoize-one/pull/59
  for (let i = 0; i < newInputs.length; i++) {
    if (!Object.is(newInputs[i], lastInputs[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Memoize a function so that it only remembers the latest arguments and result.
 *
 * The result function is called again when `this` or the arguments change.
 * By default, arguments are compared with `areInputsEqual` (`Object.is` on each argument).
 *
 * @param resultFn The function to memoize
 * @param isEqual An optional custom equality function for the arguments
 */
export function memoizeOne<TFunc extends (this: any, ...newArgs: any[]) => any>(
  resultFn: TFunc,
  // `TFunc & {}` makes TypeScript infer `TFunc` from `resultFn` first. Without it, an
  // equality function typed as `EqualityFn` or `EqualityFn<any>` would change `TFunc`.
  // The equality function is still used when `resultFn` has no parameter types.
  isEqual: EqualityFn<TFunc & {}> = areInputsEqual,
): MemoizedFn<TFunc> {
  let cache: Cache<TFunc> | null = null;

  // breaking cache when context (this) or arguments change
  function memoized(
    this: ThisParameterType<TFunc>,
    ...newArgs: Parameters<TFunc>
  ): ReturnType<TFunc> {
    if (cache && Object.is(cache.lastThis, this) && isEqual(newArgs, cache.lastArgs)) {
      return cache.lastResult;
    }

    // Throwing during an assignment aborts the assignment: https://codepen.io/alexreardon/pen/RYKoaz
    // Doing the lastResult assignment first so that if it throws
    // the cache will not be overwritten
    const lastResult = resultFn.apply(this, newArgs);
    cache = {
      lastResult,
      lastArgs: newArgs,
      lastThis: this,
    };

    return lastResult;
  }

  // Adding the ability to clear the cache of a memoized function
  memoized.clear = function clear() {
    cache = null;
  };

  return memoized;
}

/**
 * The same function as the named `memoizeOne` export.
 * Kept so that `import memoizeOne from 'memoize-one'` from v6 still works.
 */
export default memoizeOne;
