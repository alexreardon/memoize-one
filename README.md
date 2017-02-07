# memoizeOne

A memoization library which only remembers the latest invokation

[![Build Status](https://travis-ci.org/alexreardon/memoize-one.svg?branch=master)](https://travis-ci.org/alexreardon/memoize-one) [![codecov](https://codecov.io/gh/alexreardon/memoize-one/branch/master/graph/badge.svg)](https://codecov.io/gh/alexreardon/memoize-one)

## Rationale

Cache invalidation is hard:

> There are only two hard things in Computer Science: cache invalidation and naming things.
>
> *Phil Karlton*

So keep things simple and just use a cache size of one.

Unlike other memoization libraries, `memoizeOne` only remembers the latest arguments and result. No need to worry about cache busting mechanisms such as `maxAge`, `maxSize`, `exlusions` and so on which can be prone to memory leaks. `memoizeOne` simply remembers the last arguments, and if the function is next called with the same arguments then it returns the previous result.

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

#### Type signature
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

## Other

### memoizeOne correctly supports `this` control

This library takes special care to maintain, and allow control over the the `this` context just like a regular function. Both the original function and the memoized function's can be controlled using all the standard `this` controlling techniques:

- new bindings (`new`)
- explicit binding (`call`, `apply`, `bind`);
- implicit binding (call site: `obj.foo()`);
- default binding (`window` or `undefined` in `strict mode`);
- fat arrow binding (binding to lexical `this`)
- ignored this (pass `null` as `this` to explicit binding)

### Code health

- Tested with all built in [JavaScript types](https://github.com/getify/You-Dont-Know-JS/blob/master/types%20%26%20grammar/ch1.md).
- 100% code coverage.
- [flow types](http://flowtype.org) for safer internal execution and external consumption. Also allows for editor autocompletion.
- Follows [Semantic versioning (2.0)](http://semver.org/) for safer versioning.