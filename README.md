# memoizeOne

A memoization library which only remembers the latest invocation

[![Build Status](https://travis-ci.org/alexreardon/memoize-one.svg?branch=master)](https://travis-ci.org/alexreardon/memoize-one) [![dependencies](https://david-dm.org/alexreardon/memoize-one.svg)](https://david-dm.org/alexreardon/memoize-one) [![SemVer](https://img.shields.io/badge/SemVer-2.0.0-brightgreen.svg)](http://semver.org/spec/v2.0.0.html)

## Rationale

Cache invalidation is hard:

> There are only two hard things in Computer Science: cache invalidation and naming things.
>
> *Phil Karlton*

So keep things simple and just use a cache size of one.

Unlike other memoization libraries, `memoizeOne` only remembers the latest arguments and result. No need to worry about cache busting mechanisms such as `maxAge`, `maxSize`, `exclusions` and so on which can be prone to memory leaks. `memoizeOne` simply remembers the last arguments, and if the function is next called with the same arguments then it returns the previous result.

## Usage

### Standard usage

```js
import memoizeOne from 'memoize-one';

const add = (a, b) => a + b;
const memoizedAdd = memoizeOne(add);

memoizedAdd(1, 2); // 3

memoizedAdd(1, 2); // 3
// Add function is not executed: previous result is returned

memoizedAdd(2, 3); // 5
// Add function is called to get new value

memoizedAdd(2, 3); // 5
// Add function is not executed: previous result is returned

memoizedAdd(1, 2); // 3
// Add function is called to get new value.
// While this was previously cached,
// it is not the latest so the cached result is lost
```
[Play with this example](http://www.webpackbin.com/NkCiYkz_M)

### Custom equality function

You can also pass in a custom function for checking the equality of two items.

```js
import memoizeOne from 'memoize-one';
import deepEqual from 'lodash.isEqual';

const identity = x => x;

const defaultMemoization = memoizeOne(identity);
const customMemoization = memoizeOne(identity, deepEqual);

const result1 = defaultMemoization({foo: 'bar'});
const result2 = defaultMemoization({foo: 'bar'});

result1 === result2 // false - difference reference

const result3 = customMemoization({foo: 'bar'});
const result4 = customMemoization({foo: 'bar'});

result3 === result4 // true - arguments are deep equal
```

[Play with this example](http://www.webpackbin.com/NJW-tJMdf)

#### Equality function type signature

Here is the expected [flow](http://flowtype.org) type signature for a custom equality function:

```js
type EqualityFn = (a: any, b: any) => boolean;
```

## Installation

```bash
# yarn
yarn add memoize-one

# npm
npm install memoize-one --save
```

## Module usage

### ES6 module

```js
import memoizeOne from 'memoize-one';
```

### CommonJS

If you are in a CommonJS environment (eg [Node](https://nodejs.org)), then **you will need to add `.default` to your import**:

```js
const memoizeOne = require('memoize-one').default;
```

## `this`

### memoizeOne correctly respects `this` control

This library takes special care to maintain, and allow control over the the `this` context for **both** the original function being memoized as well as the returned memoized function. Both the original function and the memoized function's `this` context respect [all the `this` controlling techniques](https://github.com/getify/You-Dont-Know-JS/blob/master/this%20%26%20object%20prototypes/ch2.md):

- new bindings (`new`)
- explicit binding (`call`, `apply`, `bind`);
- implicit binding (call site: `obj.foo()`);
- default binding (`window` or `undefined` in `strict mode`);
- fat arrow binding (binding to lexical `this`)
- ignored this (pass `null` as `this` to explicit binding)

### Changes to `this` is considered an argument change

Changes to the running context (`this`) of a function can result in the function returning a different value even though its arguments have stayed the same:

```js
function getA() {
  return this.a;
}

const temp1 = {
  a: 20,
};
const temp2 = {
  a: 30,
}

getA.call(temp1); // 20
getA.call(temp2); // 30
```

Therefore, in order to prevent against unexpected results, `memoizeOne` takes into account the current execution context (`this`) of the memoized function. If `this` is different to the previous invocation then it is considered a change in argument. [further discussion](https://github.com/alexreardon/memoize-one/issues/3).

Generally this will be of no impact if you are not explicity controlling the `this` context of functions you want to memoize with [explicit binding](https://github.com/getify/You-Dont-Know-JS/blob/master/this%20%26%20object%20prototypes/ch2.md#explicit-binding)  or [implicit binding](https://github.com/getify/You-Dont-Know-JS/blob/master/this%20%26%20object%20prototypes/ch2.md#implicit-binding). `memoizeOne` will detect when you are manipulating `this` and will then consider the `this` context as an argument. If `this` changes, it will re-execute the original function even if the arguments have not changed.

## Performance :rocket:

### Tiny

`memoizeOne` is super lightweight at `457 bytes` minified and `299 bytes` gzipped. (`1kb` = `1000 bytes`)

### Extremely fast

`memoizeOne` performs better or on par with than other popular memoization libraries for the purpose of remembering the latest invocation.

**Results**

- [simple arguments](https://www.measurethat.net/Benchmarks/ShowResult/4452)
- [complex arguments](https://www.measurethat.net/Benchmarks/ShowResult/4488)

The comparisions are not exhaustive and are primiarly to show that `memoizeOne` accomplishes remembering the latest invocation really fast. The benchmarks do not take into account the differences in feature sets, library sizes, parse time, and so on.

## Code health :thumbsup:

- Tested with all built in [JavaScript types](https://github.com/getify/You-Dont-Know-JS/blob/master/types%20%26%20grammar/ch1.md).
- 100% code coverage
- [Continuous integration](https://travis-ci.org/alexreardon/memoize-one) to run tests and type checks.
- [`Flow` types](http://flowtype.org) for safer internal execution and external consumption. Also allows for editor autocompletion.
- Follows [Semantic versioning (2.0)](http://semver.org/) for safer consumption.
- No dependencies
