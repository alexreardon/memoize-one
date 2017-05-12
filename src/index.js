// @flow
type EqualityFn = (a: mixed, b: mixed) => boolean;

const simpleIsEqual: EqualityFn = (a: mixed, b: mixed): boolean => a === b;

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

  // telling flow to ignore the type of `result` as we know it is `ResultFn`
  return (result: any);
}