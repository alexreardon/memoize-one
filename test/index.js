// @flow
import { it, beforeEach, describe } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import memoizeOne from '../src/';

describe('memoizeOne', () => {
  function getA() {
    // [appeasing flow](https://flowtype.org/docs/nullable-types.html)
    if (this == null) {
      throw new TypeError();
    }
    return this.a;
  }

  describe('standard behaviour - baseline', () => {
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

  describe('standard behaviour - dynamic', () => {
    type Expectation = {|
      args: any[],
      result: any
    |};

    type Input = {|
      name: string,
      first: Expectation,
      second: Expectation
    |};

    // [JavaScript defines seven built-in types:](https://github.com/getify/You-Dont-Know-JS/blob/master/types%20%26%20grammar/ch1.md)
    //    - null
    //    - undefined
    //    - boolean
    //    - number
    //    - string
    //    - object
    //    - symbol
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
      describe(`type: [${name}]`, () => {

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
      it('should respect new bindings', () => {
        const Foo = function (bar) {
          this.bar = bar;
        };
        const memoized = memoizeOne(function (bar) {
          return new Foo(bar);
        });

        const result = memoized('baz');

        expect(result instanceof Foo).to.equal(true);
        expect(result.bar).to.equal('baz');
      });

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

      it('should respect implicit bindings', () => {
        const temp = {
          a: 2,
          getA,
        };

        const memoized = memoizeOne(function () {
          return temp.getA();
        });

        expect(memoized()).to.equal(2);
      });

      it('should respect fat arrow bindings', () => {
        const temp = {
          a: 50,
        };
        function foo() {
          // return an arrow function
          return () => {
            // `this` here is lexically adopted from `foo()`
            return getA.call(this);
          };
        }
        const bound = foo.call(temp);
        const memoized = memoizeOne(bound);

        expect(memoized()).to.equal(50);
      });

      it('should respect ignored bindings', () => {
        const bound = getA.bind(null);
        const memoized = memoizeOne(bound);

        expect(memoized).to.throw(TypeError);
      });
    });

    describe('memoized function', () => {
      it('should respect new bindings', () => {
        const memoizedGetA = memoizeOne(getA);
        const Foo = function (a) {
          this.a = a;
          this.result = memoizedGetA.call(this);
        };

        const foo1 = new Foo(10);
        const foo2 = new Foo(20);

        expect(foo1.result).to.equal(10);
        expect(foo2.result).to.equal(20);
      });

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

      it('should respect implicit bindings', () => {
        const getAMemoized = memoizeOne(getA);
        const temp = {
          a: 2,
          getAMemoized,
        };

        expect(temp.getAMemoized()).to.equal(2);
      });

      it('should respect fat arrow bindings', () => {
        const temp = {
          a: 50,
        };
        const memoizedGetA = memoizeOne(getA);
        function foo() {
          // return an arrow function
          return () => {
            // `this` here is lexically adopted from `foo()`
            return memoizedGetA.call(this);
          };
        }
        const bound = foo.call(temp);
        const memoized = memoizeOne(bound);

        expect(memoized()).to.equal(50);
      });

      it('should respect ignored bindings', () => {
        const memoized = memoizeOne(getA);

        const getResult = function () {
          return memoized.call(null);
        };

        expect(getResult).to.throw(TypeError);
      });
    });
  });

  describe('context change', () => {
    it('should break the memoization cache if the execution context changes', () => {
      const memoized = memoizeOne(getA);
      const temp1 = {
        a: 20,
        getMemoizedA: memoized,
      };
      const temp2 = {
        a: 30,
        getMemoizedA: memoized,
      };

      expect(temp1.getMemoizedA()).to.equal(20);
      expect(temp2.getMemoizedA()).to.equal(30);
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
      expect(equalityStub.calledWith(4, 2)).to.be.true;
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

  describe('clearing the cache', () => {
    // TODO
  });

  describe('flow typing', () => {
    it('should maintain the type of the original function', () => {
      // this test will create a flow error if the typing is incorrect
      type SubtractFn = (a: number, b: number) => number;
      const subtract: SubtractFn = (a: number, b: number): number => a - b;
      const requiresASubtractFn = (fn: SubtractFn): number => fn(2, 1);

      const memoizedSubtract: SubtractFn = memoizeOne(subtract);

      // will cause a flow error if `fn` is not of type `SubtractFn`
      const result1 = requiresASubtractFn(memoizedSubtract);
      const result2 = requiresASubtractFn(memoizeOne(subtract));

      expect(result1).to.equal(1);
      expect(result2).to.equal(1);
    });
  });
});

