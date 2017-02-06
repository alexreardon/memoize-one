// @flow
import { it, beforeEach, describe } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import memoizeOne from '../src/';

type Expectation = {|
    args: any[],
        result: any
            |};

type Input = {|
    name: string,
        first: Expectation,
            second: Expectation
                |};

describe('memoizeOne', () => {
    // JavaScript defines seven built-in types:
    //     - null
    //     - undefined
    //     - boolean
    //     - number
    //     - string
    //     - object
    //     - symbol-- added in ES6!
    // https://github.com/getify/You-Dont-Know-JS/blob/master/types%20%26%20grammar/ch1.md

    describe('standard behaviour', () => {
        const inputs: Input[] = [
            {
                name: 'null',
                first: {
                    args: [null, null],
                    result: true,
                },
                second: {
                    args: [null],
                    result: false,
                },
            },
            {
                name: 'undefined',
                first: {
                    args: [],
                    result: true,
                },
                second: {
                    args: [undefined, undefined],
                    result: false,
                },
            },
            {
                name: 'boolean',
                first: {
                    args: [true, false],
                    result: true,
                },
                second: {
                    args: [false, true],
                    result: false,
                },
            },
            {
                name: 'number',
                first: {
                    args: [1, 2],
                    result: 3,
                },
                second: {
                    args: [1, 5],
                    result: 6,
                },
            },
            {
                name: 'string',
                first: {
                    args: ['hi', 'there'],
                    result: 'greetings',
                },
                second: {
                    args: ['luke', 'skywalker'],
                    result: 'starwars',
                },
            },

            {
                name: 'object: different values and references',
                first: {
                    args: [{ foo: 'bar' }],
                    result: { baz: 'bar' },
                },
                second: {
                    args: [{ bar: 'test' }],
                    result: { baz: true },
                },
            },
            {
                name: 'object: same values but different references',
                first: {
                    args: [{ foo: 'bar' }],
                    result: { baz: 'bar' },
                },
                second: {
                    args: [{ foo: 'bar' }],
                    result: { baz: 'bar' },
                },
            },
            {
                name: 'symbols',
                first: {
                    args: [Symbol('first')],
                    result: true,
                },
                second: {
                    args: [Symbol('second')],
                    result: false,
                },
            },
        ];

        const isShallowEqual = (array1: Array<any>, array2: Array<any>): boolean => {
            if (array1 === array2) {
                return true;
            }

            return array1.length === array2.length &&
                array1.every((item, i) => array2[i] === item);
        };

        inputs.forEach(({ name, first, second }) => {
            describe(`dynamic type test:[${name}]`, () => {

                let spy;
                let memoized;

                beforeEach(() => {
                    spy = sinon.spy((...args) => {
                        if (isShallowEqual(args, first.args)) {
                            return first.result;
                        }
                        if (isShallowEqual(args, second.args)) {
                            return second.result;
                        }
                        throw new Error('unmatched argument');
                    });

                    memoized = memoizeOne(spy);
                });

                it('should return the result of a function', () => {
                    expect(memoized(...first.args)).to.equal(first.result);
                });

                it('should return the same result if the arguments have not changed', () => {
                    expect(memoized(...first.args)).to.equal(first.result);
                    expect(memoized(...first.args)).to.equal(first.result);
                });

                it('should not execute the memoized function if the arguments have not changed', () => {
                    memoized(...first.args);
                    memoized(...first.args);

                    expect(spy.callCount).to.equal(1);
                });

                it('should invalidate a memoize cache if new arguments are provided', () => {
                    expect(memoized(...first.args)).to.equal(first.result);
                    expect(memoized(...second.args)).to.equal(second.result);
                    expect(spy.callCount).to.equal(2);
                });

                it('should resume memoization after a cache invalidation', () => {
                    expect(memoized(...first.args)).to.equal(first.result);
                    expect(spy.callCount).to.equal(1);
                    expect(memoized(...second.args)).to.equal(second.result);
                    expect(spy.callCount).to.equal(2);
                    expect(memoized(...second.args)).to.equal(second.result);
                    expect(spy.callCount).to.equal(2);
                });
            });

        });
    });

    describe('respecting "this" context', () => {
        describe('original function', () => {
            function getA() {
                return this.a;
            }

            it('should respect explicit bindings', () => {
                const temp = {
                    a: 10,
                };

                const memoized = memoizeOne(function () {
                    return getA.call(temp);
                });

                expect(memoized()).to.equal(10);
            });

            it('should respect hard bindings', () => {
                const temp = {
                    a: 20,
                };

                const memoized = memoizeOne(getA.bind(temp));

                expect(memoized()).to.equal(20);
            });

            it('should respect default bindings', () => {
                const memoized = memoizeOne(getA);

                expect(memoized).to.throw(TypeError);
            });
        });

        describe('memoized function', () => {
            function getA() {
                return this.a;
            }

            it('should respect implicit bindings', () => {
                const getAMemoized = memoizeOne(getA);
                const temp = {
                    a: 5,
                    getAMemoized,
                };

                expect(temp.getAMemoized()).to.equal(5);
            });

            it('should respect explicit bindings', () => {
                const temp = {
                    a: 10,
                };

                const memoized = memoizeOne(getA);

                expect(memoized.call(temp)).to.equal(10);
            });

            it('should respect hard bindings', () => {
                const temp = {
                    a: 20,
                };

                const getAMemoized = memoizeOne(getA).bind(temp);

                expect(getAMemoized()).to.equal(20);
            });

            it('should memoize hard bound memoized functions', () => {
                const temp = {
                    a: 40,
                };
                const spy = sinon.spy(getA);

                const getAMemoized = memoizeOne(spy).bind(temp);

                expect(getAMemoized()).to.equal(40);
                expect(getAMemoized()).to.equal(40);
                expect(spy.callCount).to.equal(1);
            });
        });
    });

    describe('custom equality function', () => {
        let add;
        let memoizedAdd;
        let equalityStub;

        beforeEach(() => {
            add = sinon.spy((value1: number, value2: number): number => value1 + value2);
            equalityStub = sinon.stub();
            memoizedAdd = memoizeOne(add, equalityStub);
        });

        it('should call the equality function with the last arguments', () => {
            equalityStub.returns(true);

            // first call does not trigger equality check
            memoizedAdd(1, 2);
            // will trigger equality check
            memoizedAdd(1, 4);

            expect(equalityStub.calledWith(1, 1)).to.be.true;
            expect(equalityStub.calledWith(2, 4)).to.be.true;
        });

        it('should return the previous value without executing the result fn if the equality fn returns true', () => {
            equalityStub.returns(true);

            // hydrate the first value
            memoizedAdd(1, 2);
            expect(add.callCount).to.equal(1);

            // equality test should not be called yet
            expect(equalityStub.called).to.be.false;

            // normally would return false - but our custom equality function returns true
            const result = memoizedAdd(4, 10);

            expect(result).to.equal(3);
            // equality test occured
            expect(equalityStub.called).to.be.true;
            // underlying function not called
            expect(add.callCount).to.equal(1);
        });

        it('should return execute and return the result of the result fn if the equality fn returns false', () => {
            equalityStub.returns(false);

            // hydrate the first value
            memoizedAdd(1, 2);
            expect(add.callCount).to.equal(1);

            // equality test should not be called yet
            expect(equalityStub.called).to.be.false;

            const result = memoizedAdd(4, 10);

            expect(result).to.equal(14);
            // equality test occured
            expect(equalityStub.called).to.be.true;
            // underlying function called
            expect(add.callCount).to.equal(2);
        });
    });

    describe('standard behaviour', () => {
        let add;
        let memoizedAdd;

        beforeEach(() => {
            add = sinon.spy((value1: number, value2: number): number => value1 + value2);
            memoizedAdd = memoizeOne(add);
        });

        it('should return the result of a function', () => {
            expect(memoizedAdd(1, 2)).to.equal(3);
        });

        it('should return the same result if the arguments have not changed', () => {
            expect(memoizedAdd(1, 2)).to.equal(3);
            expect(memoizedAdd(1, 2)).to.equal(3);
        });

        it('should not execute the memoized function if the arguments have not changed', () => {
            memoizedAdd(1, 2);
            memoizedAdd(1, 2);

            expect(add.callCount).to.equal(1);
        });

        it('should invalidate a memoize cache if new arguments are provided', () => {
            expect(memoizedAdd(1, 2)).to.equal(3);
            expect(memoizedAdd(2, 2)).to.equal(4);
            expect(add.callCount).to.equal(2);
        });

        it('should resume memoization after a cache invalidation', () => {
            expect(memoizedAdd(1, 2)).to.equal(3);
            expect(add.callCount).to.equal(1);
            expect(memoizedAdd(2, 2)).to.equal(4);
            expect(add.callCount).to.equal(2);
            expect(memoizedAdd(2, 2)).to.equal(4);
            expect(add.callCount).to.equal(2);
        });
    });
});

