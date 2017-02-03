// @flow
const isShallowEqual = (array1: Array<any>, array2: Array<any>): boolean =>
    array1.length === array2.length &&
    array1.every((item, i) => array2[i] === item);

type EqualityFn = (currentArgs: Array<any>, previousArgs: Array<any>) => boolean;

export default function (resultFn: Function, isEqual?: EqualityFn = isShallowEqual) {
    let lastArgs: Array<any> = [];
    let lastResult: any;
    let calledOnce: boolean = false;

    return function(...args: Array<any>) {
        if (calledOnce && isEqual(args, lastArgs)) {
            return lastResult;
        }

        calledOnce = true;
        lastArgs = args;
        lastResult = resultFn.apply(this, args);
        return lastResult;
    };
}
