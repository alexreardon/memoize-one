// @flow
type EqualityFn = (a: mixed, b: mixed) => boolean;

const simpleIsEqual: EqualityFn = (a: mixed, b: mixed): boolean => a === b;

const defineProperty = (target: Object, property: string, value: mixed) =>
  Object.defineProperty(target, property, {
    writable: false,
    configurable: true,
    value: value,
  });

// <ResultFn: (...Array<any>) => mixed>
// The purpose of this typing is to ensure that the returned memoized
// function has the same type as the provided function (`resultFn`).
// ResultFn:        Generic type (which is the same as the resultFn).
// (...Array<any>): Accepts any length of arguments - and they are not checked
// mixed:           The result can be anything but needs to be checked before usage
export default function <ResultFn: (...Array<any>) => mixed>(resultFn: ResultFn, isEqual?: EqualityFn = simpleIsEqual): ResultFn {
  let lastThis: mixed;
  let lastArgs: Array<mixed> = [];
  let lastResult: mixed;
  let calledOnce: boolean = false;

  const isNewArgEqualToLast = (newArg: mixed, index: number): boolean => isEqual(newArg, lastArgs[index]);

  // breaking cache when context (this) or arguments change
  const result = function (...newArgs: Array<mixed>) {
    if (calledOnce &&
      lastThis === this &&
      newArgs.length === lastArgs.length &&
      newArgs.every(isNewArgEqualToLast)) {
      return lastResult;
    }

    calledOnce = true;
    lastThis = this;
    lastArgs = newArgs;
    lastResult = resultFn.apply(this, newArgs);
    return lastResult;
  };

  // Adding a length property
  // This is useful for some memoization checks that inspect the length of the function arguments
  defineProperty(result, 'length', resultFn.length);

  // Giving a useful name to the resulting function
  // This is helpful for debug purposes
  const name: string = `memoized_${resultFn.name || 'fn'}`;
  defineProperty(result, 'name', name);

  // telling flow to ignore the type of `result` as we know it is `ResultFn`
  return (result: any);
}