// @flow
import areInputsEqual from './are-inputs-equal';

export type EqualityFn = (newArgs: mixed[], lastArgs: mixed[]) => boolean;

// <ResultFn: (...any[]) => mixed>
// The purpose of this typing is to ensure that the returned memoized
// function has the same type as the provided function (`resultFn`).
// ResultFn:        Generic type (which is the same as the resultFn).
// (...any[]): Accepts any length of arguments - and they are not checked
// mixed:           The result can be anything but needs to be checked before usage
export default function memoizeOne<ResultFn: (...any[]) => mixed>(
  resultFn: ResultFn,
  isEqual?: EqualityFn = areInputsEqual,
): ResultFn & { reset: () => void } {
  let lastThis: mixed;
  let lastArgs: mixed[] = [];
  let lastResult: mixed;
  let calledOnce: boolean = false;

  // breaking cache when context (this) or arguments change
  const result = function memoized(...newArgs: mixed[]) {
    if (calledOnce && lastThis === this && isEqual(newArgs, lastArgs)) {
      return lastResult;
    }

    // Throwing during an assignment aborts the assignment: https://codepen.io/alexreardon/pen/RYKoaz
    // Doing the lastResult assignment first so that if it throws
    // nothing will be overwritten
    lastResult = resultFn.apply(this, newArgs);
    calledOnce = true;
    lastThis = this;
    lastArgs = newArgs;
    return lastResult;
  };

  // We allow to reset cache, in cases we need computations to re-happen. It can happen in 2 cases:
  // - In cases `memoizeOne` not used for "result", but for side-effects that should
  //   happens only when some of the "params" change
  // - When for some reason, `resultFn` needs "impure" elements that will change
  const reset = function() {
    // Reset memoization
    calledOnce = false;
    // Clean cache from memory
    lastThis = undefined;
    lastArgs = [];
    lastResult = undefined;
  };

  result.reset = reset;

  return (result: any);
}
