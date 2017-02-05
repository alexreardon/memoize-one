// @flow
type EqualityFn = (a: any, b: any) => boolean;

const simpleEquality = (a: any, b: any): boolean => a === b;

export default function (resultFn: Function, equalityCheck?: EqualityFn = simpleEquality) {
    let lastArgs: Array<any> = [];
    let lastResult: any;
    let calledOnce: boolean = false;

    return function (...newArgs: Array<any>) {
        if (calledOnce && newArgs.length === lastArgs.length &&
            lastArgs.every((lastArg, i) => equalityCheck(lastArg, newArgs[i]))) {
            return lastResult;
        }

        calledOnce = true;
        lastArgs = newArgs;
        lastResult = resultFn.apply(this, newArgs);
        return lastResult;
    };
}
