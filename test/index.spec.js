// @flow
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
      add = jest.fn().mockImplementation((value1: number, value2: number): number => value1 + value2);
      memoizedAdd = memoizeOne(add);
    });

    it('should return the result of a function', () => {
      expect(memoizedAdd(1, 2)).toBe(3);
    });

    it('should return the same result if the arguments have not changed', () => {
      expect(memoizedAdd(1, 2)).toBe(3);
      expect(memoizedAdd(1, 2)).toBe(3);
    });

    it('should not execute the memoized function if the arguments have not changed', () => {
      memoizedAdd(1, 2);
      memoizedAdd(1, 2);

      expect(add).toHaveBeenCalledTimes(1);
    });

    it('should invalidate a memoize cache if new arguments are provided', () => {
      expect(memoizedAdd(1, 2)).toBe(3);
      expect(memoizedAdd(2, 2)).toBe(4);
      expect(add).toHaveBeenCalledTimes(2);
    });

    it('should resume memoization after a cache invalidation', () => {
      expect(memoizedAdd(1, 2)).toBe(3);
      expect(add).toHaveBeenCalledTimes(1);
      expect(memoizedAdd(2, 2)).toBe(4);
      expect(add).toHaveBeenCalledTimes(2);
      expect(memoizedAdd(2, 2)).toBe(4);
      expect(add).toHaveBeenCalledTimes(2);
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

        let mock;
        let memoized;

        beforeEach(() => {
          mock = jest.fn().mockImplementation((...args) => {
            if (isShallowEqual(args, first.args)) {
              return first.result;
            }
            if (isShallowEqual(args, second.args)) {
              return second.result;
            }
            throw new Error('unmatched argument');
          });

          memoized = memoizeOne(mock);
        });

        it('should return the result of a function', () => {
          expect(memoized(...first.args)).toEqual(first.result);
        });

        it('should return the same result if the arguments have not changed', () => {
          expect(memoized(...first.args)).toEqual(first.result);
          expect(memoized(...first.args)).toEqual(first.result);
        });

        it('should not execute the memoized function if the arguments have not changed', () => {
          memoized(...first.args);
          memoized(...first.args);

          expect(mock).toHaveBeenCalledTimes(1);
        });

        it('should invalidate a memoize cache if new arguments are provided', () => {
          expect(memoized(...first.args)).toEqual(first.result);
          expect(memoized(...second.args)).toEqual(second.result);
          expect(mock).toHaveBeenCalledTimes(2);
        });

        it('should resume memoization after a cache invalidation', () => {
          expect(memoized(...first.args)).toEqual(first.result);
          expect(mock).toHaveBeenCalledTimes(1);
          expect(memoized(...second.args)).toEqual(second.result);
          expect(mock).toHaveBeenCalledTimes(2);
          expect(memoized(...second.args)).toEqual(second.result);
          expect(mock).toHaveBeenCalledTimes(2);
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

        expect(result instanceof Foo).toBe(true);
        expect(result.bar).toBe('baz');
      });

      it('should respect explicit bindings', () => {
        const temp = {
          a: 10,
        };

        const memoized = memoizeOne(function () {
          return getA.call(temp);
        });

        expect(memoized()).toBe(10);
      });

      it('should respect hard bindings', () => {
        const temp = {
          a: 20,
        };

        const memoized = memoizeOne(getA.bind(temp));

        expect(memoized()).toBe(20);
      });

      it('should respect implicit bindings', () => {
        const temp = {
          a: 2,
          getA,
        };

        const memoized = memoizeOne(function () {
          return temp.getA();
        });

        expect(memoized()).toBe(2);
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

        expect(memoized()).toBe(50);
      });

      it('should respect ignored bindings', () => {
        const bound = getA.bind(null);
        const memoized = memoizeOne(bound);

        expect(memoized).toThrow(TypeError);
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

        expect(foo1.result).toBe(10);
        expect(foo2.result).toBe(20);
      });

      it('should respect implicit bindings', () => {
        const getAMemoized = memoizeOne(getA);
        const temp = {
          a: 5,
          getAMemoized,
        };

        expect(temp.getAMemoized()).toBe(5);
      });

      it('should respect explicit bindings', () => {
        const temp = {
          a: 10,
        };

        const memoized = memoizeOne(getA);

        expect(memoized.call(temp)).toBe(10);
      });

      it('should respect hard bindings', () => {
        const temp = {
          a: 20,
        };

        const getAMemoized = memoizeOne(getA).bind(temp);

        expect(getAMemoized()).toBe(20);
      });

      it('should memoize hard bound memoized functions', () => {
        const temp = {
          a: 40,
        };
        const spy = jest.fn().mockImplementation(getA);

        const getAMemoized = memoizeOne(spy).bind(temp);

        expect(getAMemoized()).toBe(40);
        expect(getAMemoized()).toBe(40);
        expect(spy).toHaveBeenCalledTimes(1);
      });

      it('should respect implicit bindings', () => {
        const getAMemoized = memoizeOne(getA);
        const temp = {
          a: 2,
          getAMemoized,
        };

        expect(temp.getAMemoized()).toBe(2);
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

        expect(memoized()).toBe(50);
      });

      it('should respect ignored bindings', () => {
        const memoized = memoizeOne(getA);

        const getResult = function () {
          return memoized.call(null);
        };

        expect(getResult).toThrow(TypeError);
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

      expect(temp1.getMemoizedA()).toBe(20);
      expect(temp2.getMemoizedA()).toBe(30);
    });
  });

  describe('custom equality function', () => {
    let add;
    let memoizedAdd;
    let equalityStub;

    beforeEach(() => {
      add = jest.fn().mockImplementation((value1: number, value2: number): number => value1 + value2);
      equalityStub = jest.fn();
      memoizedAdd = memoizeOne(add, equalityStub);
    });

    it('should call the equality function with the last arguments', () => {
      equalityStub.mockReturnValue(true);

      // first call does not trigger equality check
      memoizedAdd(1, 2);
      // will trigger equality check
      memoizedAdd(1, 4);

      expect(equalityStub).toHaveBeenCalledWith(1, 1);
      expect(equalityStub).toHaveBeenCalledWith(4, 2);
    });

    it('should return the previous value without executing the result fn if the equality fn returns true', () => {
      equalityStub.mockReturnValue(true);

      // hydrate the first value
      const first: number = memoizedAdd(1, 2);
      expect(first).toBe(3);
      expect(add).toHaveBeenCalledTimes(1);

      // equality test should not be called yet
      expect(equalityStub).not.toHaveBeenCalled();

      // normally would return false - but our custom equality function returns true
      const second = memoizedAdd(4, 10);

      expect(second).toBe(3);
      // equality test occured
      expect(equalityStub).toHaveBeenCalled();
      // underlying function not called
      expect(add).toHaveBeenCalledTimes(1);
    });

    it('should return execute and return the result of the result fn if the equality fn returns false', () => {
      equalityStub.mockReturnValue(false);

      // hydrate the first value
      const first: number = memoizedAdd(1, 2);
      expect(first).toBe(3);
      expect(add).toHaveBeenCalledTimes(1);

      // equality test should not be called yet
      expect(equalityStub).not.toHaveBeenCalled();

      const second = memoizedAdd(4, 10);

      expect(second).toBe(14);
      // equality test occured
      expect(equalityStub).toHaveBeenCalled();
      // underlying function called
      expect(add).toHaveBeenCalledTimes(2);
    });
  });

  describe('throwing', () => {

    it('should throw when the memoized function throws', () => {
      const willThrow = (message: string) => {
        throw new Error(message);
      };
      const memoized = memoizeOne(willThrow);

      expect(memoized).toThrow();
    });

    it('should memoize a thrown result', () => {
      const willThrow = jest.fn().mockImplementation((message: string) => {
        throw new Error(message);
      });
      const memoized = memoizeOne(willThrow);
      let firstError;
      let secondError;

      try {
        memoized('hello');
      } catch (e) {
        firstError = e;
      }

      try {
        memoized('hello');
      } catch (e) {
        secondError = e;
      }

      expect(willThrow).toHaveBeenCalledTimes(1);
      expect(firstError).toEqual(Error('hello'));
      expect(firstError).toBe(secondError);
    });

    it('should break memoization when the arguments change', () => {
      const willThrow = jest.fn().mockImplementation((message: string) => {
        throw new Error(message);
      });
      const memoized = memoizeOne(willThrow);
      let firstError;
      let secondError;

      try {
        memoized('first');
      } catch (e) {
        firstError = e;
      }

      try {
        memoized('second');
      } catch (e) {
        secondError = e;
      }

      expect(firstError).toEqual(Error('first'));
      expect(secondError).toEqual(Error('second'));
      expect(firstError).not.toBe(secondError);
      expect(willThrow).toHaveBeenCalledTimes(2);
    });

    it('should forget a thrown result after a successful call', () => {
      const canThrow = jest.fn().mockImplementation((shouldThrow: boolean) => {
        if (shouldThrow) {
          throw new Error('hey friend');
        }
        // will return a new object reference each time
        return { hello: 'world' };
      });
      const memoized = memoizeOne(canThrow);
      let firstError;
      let secondError;

      try {
        memoized(true);
      } catch (e) {
        firstError = e;
      }

      const result1 = memoized(false);
      expect(canThrow).toHaveBeenCalledTimes(2);

      // function is now correctly memoized
      const result2 = memoized(false);
      expect(canThrow).toHaveBeenCalledTimes(2);
      // referential equality maintained
      expect(result1).toBe(result2);

      // now going to throw again
      try {
        memoized(true);
      } catch (e) {
        secondError = e;
      }

      // underlying function is called
      expect(canThrow).toHaveBeenCalledTimes(3);
      expect(firstError).toEqual(secondError);
      expect(firstError).not.toBe(secondError);

      // last successful cache value is lost
      const result3 = memoized(false);
      expect(canThrow).toHaveBeenCalledTimes(4);
      // new result
      expect(result3).not.toBe(result2);
    });

    it('should throw regardless of the type of the thrown value', () => {
      // [JavaScript defines seven built-in types:](https://github.com/getify/You-Dont-Know-JS/blob/master/types%20%26%20grammar/ch1.md)
      //    - null
      //    - undefined
      //    - boolean
      //    - number
      //    - string
      //    - object
      //    - symbol
      const values = [null, undefined, true, false, 10, 'hi', { name: 'Alex' }, Symbol('sup')];

      values.forEach((value: mixed) => {
        const throwValue = jest.fn().mockImplementation(() => {
          throw value;
        });
        const memoized = memoizeOne(throwValue);
        let firstError;
        let secondError;

        try {
          memoized();
        } catch (e) {
          firstError = e;
        }

        try {
          memoized();
        } catch (e) {
          secondError = e;
        }

        expect(firstError).toBe(secondError);
        expect(throwValue).toHaveBeenCalledTimes(1);
        // little validation
        expect(firstError).toEqual(value);
      });
    });
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

      expect(result1).toBe(1);
      expect(result2).toBe(1);
    });
  });
});

