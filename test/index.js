// @flow
import { it, beforeEach, describe } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import memoizeOne from '../src/';

describe('memoizeOne', () => {
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

        it('should always execute the result function and return the result on the first call', () => {
            const result = sinon.spy((value) => value);
            const memoized = memoizeOne(result);

            const values = [undefined, null, true, false, 'hi there', {}, 20, () => { }];

            values.forEach((value) => {
                expect(memoized(value)).to.equal(value);
            });
            expect(result.callCount).to.equal(values.length);
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

        it('should call the function with the last arguments', () => {
            // first call does not trigger equality check
            memoizedAdd(1, 2);
            // will trigger equality check
            memoizedAdd(3, 4);

            expect(equalityStub.calledWithExactly([3, 4], [1, 2])).to.be.true;
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
});

