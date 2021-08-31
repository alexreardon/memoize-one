import areInputsEqual from './are-inputs-equal';

// Using ReadonlyArray<T> rather than readonly T as it works with TS v3
export type EqualityFn = (newArgs: any[], lastArgs: any[]) => boolean;

type State = {
  lastThis: unknown;
  lastArgs: unknown[];
  lastResult: unknown;
  calledOnce: boolean;
};

function getInitialState(): State {
  return {
    lastThis: undefined,
    lastArgs: [],
    lastResult: undefined,
    calledOnce: false,
  };
}

function memoizeOne<
  // Need to use 'any' rather than 'unknown' here as it has
  // The correct Generic narrowing behaviour.
  ResultFn extends (this: any, ...newArgs: any[]) => ReturnType<ResultFn>
>(resultFn: ResultFn, isEqual: EqualityFn = areInputsEqual): ResultFn {
  let state: State = getInitialState();

  // breaking cache when context (this) or arguments change
  function memoized(this: unknown, ...newArgs: unknown[]): ReturnType<ResultFn> {
    const { lastThis, lastArgs, lastResult, calledOnce } = state;
    if (calledOnce && lastThis === this && isEqual(newArgs, lastArgs)) {
      return lastResult;
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

    return state.lastResult;
  }

  memoized.clear = function clear() {
    state = getInitialState();
  };

  return memoized;
}

// default export
export default memoizeOne;
