# memoize-one

A memoization library that only caches the result of the most recent arguments.

[![npm](https://img.shields.io/npm/v/memoize-one.svg)](https://www.npmjs.com/package/memoize-one)
![types](https://img.shields.io/badge/types-typescript-blueviolet)
[![minzip](https://img.shields.io/bundlephobia/minzip/memoize-one.svg)](https://www.npmjs.com/package/memoize-one)
[![Downloads per month](https://img.shields.io/npm/dm/memoize-one.svg)](https://www.npmjs.com/package/memoize-one)

## Rationale

Unlike other memoization libraries, `memoize-one` only remembers the latest arguments and result. No need to worry about cache busting mechanisms such as `maxAge`, `maxSize`, `exclusions` and so on, which can be prone to memory leaks. A function memoized with `memoize-one` simply remembers the last arguments, and if the memoized function is next called with the same arguments then it returns the previous result.

> For working with promises, [@Kikobeats](https://github.com/Kikobeats) has built [async-memoize-one](https://github.com/microlinkhq/async-memoize-one).

## Usage

```js
import { memoizeOne } from 'memoize-one';

function add(a, b) {
  return a + b;
}
const memoizedAdd = memoizeOne(add);

memoizedAdd(1, 2);
// add function: is called
// [new value returned: 3]

memoizedAdd(1, 2);
// add function: not called
// [cached result is returned: 3]

memoizedAdd(2, 3);
// add function: is called
// [new value returned: 5]

memoizedAdd(2, 3);
// add function: not called
// [cached result is returned: 5]

memoizedAdd(1, 2);
// add function: is called
// [new value returned: 3]
// 👇
// While the result of `add(1, 2)` was previously cached
// `(1, 2)` was not the *latest* arguments (the last call was `(2, 3)`)
// so the previous cached result of `(1, 2)` was lost
```

## Installation

```bash
npm install memoize-one
```

## Supported environments

`memoize-one` v7 is an [ES module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) only package, written in ES2022 syntax.

- **Browsers**: browsers that are [Baseline widely available](https://web.dev/baseline) (Chrome, Edge and Firefox 111+, Safari 16.4+), with any modern bundler
- **Node.js**: `import` works in all supported versions. `require()` works in Node.js 20.19+ and 22.12+ (through [`require(esm)`](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require))

```js
// ES modules
import { memoizeOne } from 'memoize-one';

// CommonJS (Node.js 20.19+ and 22.12+)
const { memoizeOne } = require('memoize-one');
```

If you need to support older environments, please use `memoize-one` v6.

## Upgrading from v6

1. **Named export.** There is no default export anymore:

   ```diff
   - import memoizeOne from 'memoize-one';
   + import { memoizeOne } from 'memoize-one';
   ```

2. **Arguments are compared with `Object.is`.** `NaN` is still equal to `NaN`. The only change is that `+0` and `-0` are now treated as different arguments, so `memoized(0)` followed by `memoized(-0)` will call your function again. The `this` context is also compared with `Object.is`.
3. **ES module only.** The CommonJS and UMD builds are gone. CommonJS users on Node.js 20.19+ and 22.12+ can still `require()` the package. If you used the UMD build from a CDN, load the module instead: `<script type="module">import { memoizeOne } from 'https://cdn.jsdelivr.net/npm/memoize-one@7/+esm';</script>`
4. **ES2022 syntax.** Internet Explorer 11 is no longer supported (see [supported environments](#supported-environments)).
5. **No Flow types.** The Flow type definitions are no longer included.
6. **New: `areInputsEqual` is exported**, so you can build on the default equality check (see [custom equality function](#custom-equality-function)).

## Function argument equality

By default, we apply our own _fast_ and _relatively naive_ equality function (`areInputsEqual`) to determine whether the arguments provided to your function are equal. You can see the full code here: [memoize-one.ts](https://github.com/alexreardon/memoize-one/blob/master/src/memoize-one.ts).

(By default) function arguments are considered equal if:

1. there is same amount of arguments
2. each new argument is the same value as the previous argument, according to [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)

`Object.is` is the same as strict equality (`===`), except for two special cases:

- `NaN` is equal to `NaN`
- `+0` and `-0` are not equal

This is the same comparison that React uses for hook dependencies (such as in `useMemo`).

What this looks like in practice:

```js
import { memoizeOne } from 'memoize-one';

// add all numbers provided to the function
const add = (...args = []) =>
  args.reduce((current, value) => {
    return current + value;
  }, 0);
const memoizedAdd = memoizeOne(add);
```

> 1. there is same amount of arguments

```js
memoizedAdd(1, 2);
// the amount of arguments has changed, so add function is called
memoizedAdd(1, 2, 3);
```

> 2. each new argument is the same value as the previous argument, according to `Object.is`

```js
memoizedAdd(1, 2);
// each argument is the same value as the last argument, so cache is used
memoizedAdd(1, 2);
// second argument has changed, so add function is called again
memoizedAdd(1, 3);
// the first value is not the same value as the previous first value (1 !== 3)
// so add function is called again
memoizedAdd(3, 1);
```

> **[special case]** `NaN` is equal to `NaN`

```js
memoizedAdd(NaN);
// Even though NaN !== NaN, Object.is(NaN, NaN) is true
// so the cache is used
memoizedAdd(NaN);
```

> **[special case]** `+0` and `-0` are not equal

```js
memoizedAdd(0);
// Even though 0 === -0, Object.is(0, -0) is false
// so add function is called again
memoizedAdd(-0);
```

## Custom equality function

You can also pass in a custom function for checking the equality of two sets of arguments

```js
const memoized = memoizeOne(fn, isEqual);
```

An equality function should return `true` if the arguments are equal. If `true` is returned then the wrapped function will not be called.

**Tip**: A custom equality function needs to compare `Arrays`. The `newArgs` array will be a new reference every time so a simple `newArgs === lastArgs` will always return `false`.

Equality functions are not called if the `this` context of the function has changed (see below).

Here is an example that uses a [lodash.isEqual](https://lodash.com/docs/4.17.15#isEqual) deep equal equality check

> `lodash.isequal` correctly handles deep comparing two arrays

```js
import { memoizeOne } from 'memoize-one';
import isDeepEqual from 'lodash.isequal';

const identity = (x) => x;

const shallowMemoized = memoizeOne(identity);
const deepMemoized = memoizeOne(identity, isDeepEqual);

const result1 = shallowMemoized({ foo: 'bar' });
const result2 = shallowMemoized({ foo: 'bar' });

result1 === result2; // false - different object reference

const result3 = deepMemoized({ foo: 'bar' });
const result4 = deepMemoized({ foo: 'bar' });

result3 === result4; // true - arguments are deep equal
```

You can build on the default equality check with `areInputsEqual`. For example, to ignore the last argument:

```js
import { memoizeOne, areInputsEqual } from 'memoize-one';

const memoized = memoizeOne(format, (newArgs, lastArgs) =>
  areInputsEqual(newArgs.slice(0, -1), lastArgs.slice(0, -1)),
);
```

The equality function needs to conform to the `EqualityFn` `type`:

```ts
// TFunc is the function being memoized
type EqualityFn<TFunc extends (...args: any[]) => any> = (
  newArgs: Parameters<TFunc>,
  lastArgs: Parameters<TFunc>,
) => boolean;

// You can import this type
import type { EqualityFn } from 'memoize-one';
```

The `EqualityFn` type allows you to create equality functions that are extremely typesafe. You are welcome to provide your own less type safe equality functions.

Here are some examples of equality functions which are ordered by most type safe, to least type safe:

<details>
  <summary>Example equality function types</summary>
  <p>

```ts
// the function we are going to memoize
function add(first: number, second: number): number {
  return first + second;
}

// Some options for our equality function
// ↑ stronger types
// ↓ weaker types

// ✅ exact parameters of `add`
{
  const isEqual = function (first: Parameters<typeof add>, second: Parameters<typeof add>) {
    return true;
  };
  expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
}

// ✅ tuple of the correct types
{
  const isEqual = function (first: [number, number], second: [number, number]) {
    return true;
  };
  expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
}

// ❌ tuple of incorrect types
{
  const isEqual = function (first: [number, string], second: [number, number]) {
    return true;
  };
  expectTypeOf<typeof isEqual>().not.toMatchTypeOf<EqualityFn<typeof add>>();
}

// ✅ array of the correct types
{
  const isEqual = function (first: number[], second: number[]) {
    return true;
  };
  expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
}

// ❌ array of incorrect types
{
  const isEqual = function (first: string[], second: number[]) {
    return true;
  };
  expectTypeOf<typeof isEqual>().not.toMatchTypeOf<EqualityFn<typeof add>>();
}

// ✅ tuple of 'unknown'
{
  const isEqual = function (first: [unknown, unknown], second: [unknown, unknown]) {
    return true;
  };
  expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
}

// ❌ tuple of 'unknown' of incorrect length
{
  const isEqual = function (first: [unknown, unknown, unknown], second: [unknown, unknown]) {
    return true;
  };
  expectTypeOf<typeof isEqual>().not.toMatchTypeOf<EqualityFn<typeof add>>();
}

// ✅ array of 'unknown'
{
  const isEqual = function (first: unknown[], second: unknown[]) {
    return true;
  };
  expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
}

// ✅ spread of 'unknown'
{
  const isEqual = function (...first: unknown[]) {
    return !!first;
  };
  expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
}

// ✅ tuple of 'any'
{
  const isEqual = function (first: [any, any], second: [any, any]) {
    return true;
  };
  expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
}

// ❌ tuple of 'any' or incorrect size
{
  const isEqual = function (first: [any, any, any], second: [any, any]) {
    return true;
  };
  expectTypeOf<typeof isEqual>().not.toMatchTypeOf<EqualityFn<typeof add>>();
}

// ✅ array of 'any'
{
  const isEqual = function (first: any[], second: any[]) {
    return true;
  };
  expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
}

// ✅ two arguments of type any
{
  const isEqual = function (first: any, second: any) {
    return true;
  };
  expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
}

// ✅ a single argument of type any
{
  const isEqual = function (first: any) {
    return true;
  };
  expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
}

// ✅ spread of any type
{
  const isEqual = function (...first: any[]) {
    return true;
  };
  expectTypeOf<typeof isEqual>().toMatchTypeOf<EqualityFn<typeof add>>();
}
```

  </p>
</details>

## `this`

### `memoize-one` correctly respects `this` control

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
};

getA.call(temp1); // 20
getA.call(temp2); // 30
```

Therefore, in order to prevent against unexpected results, `memoize-one` takes into account the current execution context (`this`) of the memoized function. If `this` is different to the previous invocation (according to `Object.is`) then it is considered a change in argument. [further discussion](https://github.com/alexreardon/memoize-one/issues/3).

Generally this will be of no impact if you are not explicity controlling the `this` context of functions you want to memoize with [explicit binding](https://github.com/getify/You-Dont-Know-JS/blob/master/this%20%26%20object%20prototypes/ch2.md#explicit-binding) or [implicit binding](https://github.com/getify/You-Dont-Know-JS/blob/master/this%20%26%20object%20prototypes/ch2.md#implicit-binding). `memoize-One` will detect when you are manipulating `this` and will then consider the `this` context as an argument. If `this` changes, it will re-execute the original function even if the arguments have not changed.

## Clearing the memoization cache

A `.clear()` property is added to memoized functions to allow you to clear it's memoization cache.

This is helpful if you want to:

- Release memory
- Allow the result function to be called again without having to change arguments

```ts
import { memoizeOne } from 'memoize-one';

function add(a: number, b: number): number {
  return a + b;
}

const memoizedAdd = memoizeOne(add);

// first call - not memoized
const first = memoizedAdd(1, 2);

// second call - cache hit (result function not called)
const second = memoizedAdd(1, 2);

// 👋 clearing memoization cache
memoizedAdd.clear();

// third call - not memoized (cache was cleared)
const third = memoizedAdd(1, 2);
```

## When your result function `throw`s

> There is no caching when your result function throws

If your result function `throw`s then the memoized function will also throw. The throw will not break the memoized functions existing argument cache. It means the memoized function will pretend like it was never called with arguments that made it `throw`.

```js
const canThrow = (name: string) => {
  console.log('called');
  if (name === 'throw') {
    throw new Error(name);
  }
  return { name };
};

const memoized = memoizeOne(canThrow);

const value1 = memoized('Alex');
// result function called: console.log => 'called'

const value2 = memoized('Alex');
// result function not called (cache hit)

console.log(value1 === value2);
// console.log => true

try {
  memoized('throw');
  // console.log => 'called'
} catch (e) {
  firstError = e;
}

try {
  memoized('throw');
  // console.log => 'called'
  // the result function was called again even though it was called twice
  // with the 'throw' string
} catch (e) {
  secondError = e;
}

console.log(firstError !== secondError);
// console.log => true

const value3 = memoized('Alex');
// result function not called as the original memoization cache has not been busted

console.log(value1 === value3);
// console.log => true
```

## Function properties

Functions memoized with `memoize-one` do not preserve any properties on the function object.

> This behaviour is correctly reflected in the TypeScript types

```ts
import { memoizeOne } from 'memoize-one';

function add(a, b) {
  return a + b;
}
add.hello = 'hi';

console.log(typeof add.hello); // string

const memoized = memoizeOne(add);

// hello property on the `add` was not preserved
console.log(typeof memoized.hello); // undefined
```

> If you feel strongly that `memoize-one` _should_ preserve function properties, please raise an issue. This decision was made in order to keep `memoize-one` as light as possible.

The `.length` property of a function is not preserved on the memoized function

```ts
import { memoizeOne } from 'memoize-one';

function add(a, b) {
  return a + b;
}

console.log(add.length); // 2

const memoized = memoizeOne(add);

console.log(memoized.length); // 0
```

If you need it, you can set the `.length` property yourself:

```ts
const memoized = memoizeOne(add);
Object.defineProperty(memoized, 'length', { value: add.length });

console.log(memoized.length); // 2
```

[→ discussion](https://github.com/alexreardon/memoize-one/issues/38).

## Memoized function `type`

The resulting function you get back from `memoize-one` has _almost_ the same `type` as the function that you are memoizing

```ts
declare type MemoizedFn<TFunc extends (this: any, ...args: any[]) => any> = {
  clear: () => void;
  (this: ThisParameterType<TFunc>, ...args: Parameters<TFunc>): ReturnType<TFunc>;
};
```

- the same call signature as the function being memoized
- a `.clear()` function property added
- other function object properties on `TFunc` as not carried over

You are welcome to use the `MemoizedFn` generic directly from `memoize-one` if you like:

```ts
import { memoizeOne, type MemoizedFn } from 'memoize-one';
import isDeepEqual from 'lodash.isequal';
import { expectTypeOf } from 'expect-type';

// Takes any function: TFunc, and returns a Memoized<TFunc>
function withDeepEqual<TFunc extends (...args: any[]) => any>(fn: TFunc): MemoizedFn<TFunc> {
  return memoizeOne(fn, isDeepEqual);
}

function add(first: number, second: number): number {
  return first + second;
}

const memoized = withDeepEqual(add);

expectTypeOf<typeof memoized>().toEqualTypeOf<MemoizedFn<typeof add>>();
```

In this specific example, this type would have been correctly inferred too

```ts
import { memoizeOne, type MemoizedFn } from 'memoize-one';
import isDeepEqual from 'lodash.isequal';
import { expectTypeOf } from 'expect-type';

// return type of MemoizedFn<TFunc> is inferred
function withDeepEqual<TFunc extends (...args: any[]) => any>(fn: TFunc) {
  return memoizeOne(fn, isDeepEqual);
}

function add(first: number, second: number): number {
  return first + second;
}

const memoized = withDeepEqual(add);

// type test still passes
expectTypeOf<typeof memoized>().toEqualTypeOf<MemoizedFn<typeof add>>();
```

## Performance 🚀

### Tiny

`memoize-one` is super lightweight at [![min](https://img.shields.io/bundlephobia/min/memoize-one.svg?label=)](https://www.npmjs.com/package/memoize-one) minified and [![minzip](https://img.shields.io/bundlephobia/minzip/memoize-one.svg?label=)](https://www.npmjs.com/package/memoize-one) gzipped. (`1KB` = `1,024 Bytes`)

### Extremely fast

`memoize-one` is one of the fastest options for remembering the latest invocation. In these benchmarks `micro-memoize` is a little faster in most scenarios, and `memoize-one` is well ahead of the other libraries.

The comparisons are not exhaustive and are primarily to show that `memoize-one` accomplishes remembering the latest invocation really fast. There is variability between runs. The benchmarks do not take into account the differences in feature sets, library sizes, parse time, and so on.

<details>
  <summary>Expand for results</summary>
  <p>

node version `24.22.3`

You can run this test in the repo with `npm run bench:library-comparison`

**no arguments**

| Position | Library                                      | Operations per second |
| -------- | -------------------------------------------- | --------------------- |
| 1        | micro-memoize                                | 138,740,822           |
| 2        | memoize-one (v6)                             | 108,842,277           |
| 3        | memoize-one (v7)                             | 106,426,013           |
| 4        | memoizee                                     | 40,489,909            |
| 5        | lodash memoize (JSON.stringify key resolver) | 10,468,355            |
| 6        | memoize (JSON.stringify cache key)           | 10,056,899            |
| 7        | fast-memoize                                 | 500                   |
| 8        | no memoization                               | 498                   |

**single primitive argument**

| Position | Library                                      | Operations per second |
| -------- | -------------------------------------------- | --------------------- |
| 1        | fast-memoize                                 | 71,576,931            |
| 2        | memoize-one (v7)                             | 64,211,677            |
| 3        | micro-memoize                                | 63,996,270            |
| 4        | memoize-one (v6)                             | 55,823,274            |
| 5        | memoizee                                     | 38,036,396            |
| 6        | lodash memoize (JSON.stringify key resolver) | 8,927,912             |
| 7        | memoize (JSON.stringify cache key)           | 8,828,374             |
| 8        | no memoization                               | 496                   |

**single complex argument**

| Position | Library                                      | Operations per second |
| -------- | -------------------------------------------- | --------------------- |
| 1        | micro-memoize                                | 67,279,577            |
| 2        | memoize-one (v7)                             | 67,088,906            |
| 3        | memoize-one (v6)                             | 52,150,121            |
| 4        | memoizee                                     | 29,511,810            |
| 5        | lodash memoize (JSON.stringify key resolver) | 6,108,687             |
| 6        | memoize (JSON.stringify cache key)           | 5,601,366             |
| 7        | fast-memoize                                 | 4,026,807             |
| 8        | no memoization                               | 498                   |

**multiple primitive arguments**

| Position | Library                                      | Operations per second |
| -------- | -------------------------------------------- | --------------------- |
| 1        | micro-memoize                                | 43,973,181            |
| 2        | memoize-one (v7)                             | 41,312,359            |
| 3        | memoize-one (v6)                             | 33,525,601            |
| 4        | memoizee                                     | 17,396,741            |
| 5        | lodash memoize (JSON.stringify key resolver) | 6,858,169             |
| 6        | memoize (JSON.stringify cache key)           | 6,060,002             |
| 7        | fast-memoize                                 | 3,637,239             |
| 8        | no memoization                               | 500                   |

**multiple complex arguments**

| Position | Library                                      | Operations per second |
| -------- | -------------------------------------------- | --------------------- |
| 1        | micro-memoize                                | 44,041,191            |
| 2        | memoize-one (v7)                             | 41,121,742            |
| 3        | memoize-one (v6)                             | 34,239,499            |
| 4        | memoizee                                     | 13,024,996            |
| 5        | lodash memoize (JSON.stringify key resolver) | 3,755,731             |
| 6        | memoize (JSON.stringify cache key)           | 3,600,071             |
| 7        | fast-memoize                                 | 2,359,919             |
| 8        | no memoization                               | 500                   |

**multiple complex arguments (spreading arguments)**

| Position | Library                                      | Operations per second |
| -------- | -------------------------------------------- | --------------------- |
| 1        | micro-memoize                                | 43,787,230            |
| 2        | memoize-one (v7)                             | 41,322,204            |
| 3        | memoize-one (v6)                             | 33,794,556            |
| 4        | memoizee                                     | 31,295,061            |
| 5        | lodash memoize (JSON.stringify key resolver) | 3,768,015             |
| 6        | memoize (JSON.stringify cache key)           | 3,618,300             |
| 7        | fast-memoize                                 | 2,384,435             |
| 8        | no memoization                               | 500                   |

  </p>
</details>

## Code health 👍

- Tested with all built in [JavaScript types](https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/types%20%26%20grammar/ch1.md)
- Written in `Typescript`
- Correct typing for `Typescript`, checked with [`publint`](https://publint.dev) and [`arethetypeswrong`](https://arethetypeswrong.github.io)
- ES module only
- No dependencies
