import areInputsEqual from './are-inputs-equal';

export type EqualityFn = (newArgs: unknown[], lastArgs: unknown[]) => boolean;

// <ResultFn: (...any[]) => mixed>
// The purpose of this typing is to ensure that the returned memoized
// function has the same type as the provided function (`resultFn`).
// ResultFn:        Generic type (which is the same as the resultFn).
// (...any[]): Accepts any length of arguments - and they are not checked
// mixed:           The result can be anything but needs to be checked before usage
export function memoizeOne<ResultFn extends (this: unknown, ...newArgs: unknown[]) => ReturnType<ResultFn>>(
  resultFn: ResultFn,
  isEqual: EqualityFn = areInputsEqual,
): ResultFn {
  let lastThis: unknown;
  let lastArgs: unknown[] = [];
  let lastResult: ReturnType<ResultFn>;
  let calledOnce: boolean = false;

  // breaking cache when context (this) or arguments change
  function memoized(this: unknown, ...newArgs: unknown[]): ReturnType<ResultFn> {
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

  return (memoized as ResultFn);
}

export default memoizeOne;