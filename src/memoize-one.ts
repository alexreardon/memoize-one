import areInputsEqual from './are-inputs-equal';

// Using ReadonlyArray<T> rather than readonly T as it works with TS v3
export type EqualityFn = (newArgs: any[], lastArgs: any[]) => boolean;

export default function memoizeOne<
  // Need to use 'any' rather than 'unknown' here as it has
  // The correct Generic narrowing behaviour.
  Args extends unknown[],
  Result
>(
  resultFn: (this: any, ...newArgs: Args) => Result,
  isEqual: EqualityFn = areInputsEqual,
): (this: unknown, ...newArgs: Args) => Result {
  let lastThis: unknown;
  let lastArgs: unknown[] = [];
  let lastResult: ReturnType<(this: any, ...newArgs: Args) => Result>;
  let calledOnce: boolean = false;

  // breaking cache when context (this) or arguments change
  function memoized(
    this: unknown,
    ...newArgs: Args
  ): ReturnType<(this: any, ...newArgs: Args) => Result> {
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
  }

  return memoized as (this: any, ...newArgs: Args) => Result;
}
