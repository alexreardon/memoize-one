// @flow
type EqualityFn = (a: any, b: any) => boolean;

const simpleIsEqual = (a: any, b: any): boolean => a === b;

export default function (resultFn: Function, isEqual?: EqualityFn = simpleIsEqual) {
    let lastThis: any;
    let lastArgs: Array<any> = [];
    let lastResult: any;
    let calledOnce: boolean = false;

    const isNewArgEqualToLast = (newArg, index) => isEqual(newArg, lastArgs[index]);

    // breaking cache when context (this) or arguments change
    return function (...newArgs: Array<any>) {
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
}
