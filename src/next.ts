import areInputsEqual from './are-inputs-equal';

// Using ReadonlyArray<T> rather than readonly T as it works with TS v3
export type EqualityFn = (newArgs: any[], lastArgs: any[]) => boolean;

type State<TResult> = {
  lastThis: unknown;
  lastArgs: unknown[];
  lastResult: TResult | undefined;
  calledOnce: boolean;
};

function getInitialState<TResult>(): State<TResult> {
  return {
    lastThis: undefined,
    lastArgs: [],
    lastResult: undefined,
    calledOnce: false,
  };
}

type MemoizedFn<T extends (this: any, ...args: any[]) => any> = {
  name: string;
  clear: () => void;
  (...args: Parameters<T>): ReturnType<T>;
};

function memoizeOne<
  // Need to use 'any' rather than 'unknown' here as it has
  // The correct Generic narrowing behaviour.
  TFunc extends (this: any, ...newArgs: any[]) => any
>(resultFn: TFunc, isEqual: EqualityFn = areInputsEqual): MemoizedFn<TFunc> {
  let state: State<ReturnType<TFunc>> = getInitialState();

  // breaking cache when context (this) or arguments change
  function memoized(this: unknown, ...newArgs: unknown[]): ReturnType<TFunc> {
    const { lastThis, lastArgs, lastResult, calledOnce } = state;
    if (calledOnce && lastThis === this && isEqual(newArgs, lastArgs)) {
      return lastResult as ReturnType<TFunc>;
    }

    // Throwing during an assignment aborts the assignment: https://codepen.io/alexreardon/pen/RYKoaz
    // Doing the lastResult assignment first so that if it throws
    // nothing will be overwritten
    state = {
      lastResult: resultFn.apply(this, newArgs),
      calledOnce: true,
      lastThis: this,
      lastArgs: newArgs,
    };

    return state.lastResult as ReturnType<TFunc>;
  }

  // Giving the function a better name for devtools
  memoized.name = `memoized(${resultFn.name})`;

  // Adding the ability to clear the cache of a memoized function
  memoized.clear = function clear() {
    state = getInitialState();
  };

  return memoized;
}

// default export
export default memoizeOne;
