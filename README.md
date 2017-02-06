# memoizeOne

A simple memoization library which only remembers the latest arguments

[![Build Status](https://travis-ci.org/alexreardon/memoize-one.svg?branch=master)](https://travis-ci.org/alexreardon/memoize-one)
[![codecov](https://codecov.io/gh/alexreardon/memoize-one/branch/master/graph/badge.svg)](https://codecov.io/gh/alexreardon/memoize-one)

## DOCS: Work in progress

## Rationale

Cache invalidation is hard:

> There are only two hard things in Computer Science: cache invalidation and naming things.
>
> - Phil Karlton

So keep things simple and just use a cache size of one.

Unlike other memoization libraries, `memoizeOne` only remembers the latest argument - a cache size of one. No need to worry about `maxAge`, `maxSize`, `exlusions` and so on. It simply remembers the last arguments, and if the function next called with the same arguments then it returns the previously computed result.


## Usage

```js
import memoizeOne from 'memoize-one';

const add = (a, b) => a + b;
const memoizedAdd = memoizeOne(add);

memoizedAdd(1, 2); // 3

memoizedOne(1, 2); // 3
// Add function is not executed: previous result is returned

memoizedAdd(2, 3); // 5
// Add function is called to get new value

memoizedOne(2, 3); // 5
// Add function is not executed: previous result is returned

memoizedOne(1, 2); // 3
// Add function is called to get new value.
// While this was previously cached,
// it is not the latest so the cached result is lost
```

## Installation

```bash
# yarn
yarn add memoize-one

# npm
npm install memoize-one --save
```

## Other features

### Correctly supports `this` binding

### Custom equality function

### Code health

- Tested with all JavaScript *types*
- 100% code coverage
- flow types for safer internal execution and type checking / auto complete for editors
- Semantically versioned