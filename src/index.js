// @flow
export type EqualityFn = (newArgs: mixed[], lastArgs: mixed[]) => boolean;

const shallowEqual = (newValue: mixed, oldValue: mixed): boolean =>
  newValue === oldValue;

const simpleIsEqual: EqualityFn = (
  newArgs: mixed[],
  lastArgs: mixed[],
): boolean =>
  newArgs.length === lastArgs.length &&
  newArgs.every(
    (newArg: mixed, index: number): boolean =>
      shallowEqual(newArg, lastArgs[index]),
  );

// Type TArgs (arguments type) and TRet (return type) as generics to ensure that the
// returned function (`memoized`) has the same type as the provided function (`inputFn`).
//
// `mixed` means that the result can be anything but needs to be checked before usage.
// As opposed to `any`, it does not compromise type-safety.
// See https://flow.org/en/docs/types/mixed/ for more.
export default function memoizeOne<TArgs: mixed[], TRet: mixed>(
  inputFn: (...TArgs) => TRet,
  isEqual?: EqualityFn = simpleIsEqual,
): (...TArgs) => TRet {
  let lastThis: mixed;
  let lastArgs: ?TArgs;
  let lastResult: TRet; // not ?TRet because TRet must include undefined | null
  let calledOnce: boolean = false;

  // breaking cache when context (this) or arguments change
  const memoized = function(...newArgs: TArgs): TRet {
    if (calledOnce && lastThis === this && isEqual(newArgs, lastArgs || [])) {
      return lastResult;
    }

    // Throwing during an assignment aborts the assignment: https://codepen.io/alexreardon/pen/RYKoaz
    // Doing the lastResult assignment first so that if it throws
    // nothing will be overwritten
    lastResult = inputFn.apply(this, newArgs);
    calledOnce = true;
    lastThis = this;
    lastArgs = newArgs;
    return lastResult;
  };

  return memoized;
}
