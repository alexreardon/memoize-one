// @flow
const isShallowEqual = (array1: Array<any>, array2: Array<any>): boolean =>
    array1.length === array2.length &&
    array1.every((item, i) => array2[i] === item);

type EqualityFn = (array1: Array<any>, array2: Array<any>) => boolean;

export default function (fn: Function, isEqual: EqualityFn = isShallowEqual) {
    let lastArgs = [];
    let lastResult;
    let calledOnce = false;

    return function(...args: Array<any>) {
        if (calledOnce && isEqual(args, lastArgs)) {
            return lastResult;
        }

        calledOnce = true;
        lastArgs = args;
        lastResult = fn.apply(this, args);
        return lastResult;
    };
}
