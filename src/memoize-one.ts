import areInputsEqual from './are-inputs-equal';

// Using ReadonlyArray<T> rather than readonly T as it works with TS v3
export type EqualityFn<Args extends any[] = any[]> = (newArgs: Args, lastArgs: Args) => boolean;

export default function memoizeOne<
  This,
  // Need to use 'any' rather than 'unknown' here as it has
  // The correct Generic narrowing behaviour.
  Args extends any[],
  R
>(
  resultFn: (this: This, ...newArgs: Args) => R,
  isEqual: EqualityFn<Args> = areInputsEqual,
): (this: This, ...newArgs: Args) => R {
  let lastThis: This;
  let lastArgs: any = [];
  let lastResult: R;
  let calledOnce: boolean = false;

  // breaking cache when context (this) or arguments change
  function memoized(this: This, ...newArgs: Args): R {
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

  return memoized;
}
