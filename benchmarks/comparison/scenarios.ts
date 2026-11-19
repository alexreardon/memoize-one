import { areInputsEqual, memoizeOne } from '../../src/memoize-one.ts';
import { areInputsEqualV6, memoizeOneV6 } from './v6.ts';

export type Version = 'v6' | 'v7';

// Each sample makes this many calls. Timing one tiny call at a time
// would mostly measure the timer.
export const callsPerSample = 10_000;

// Writing results here stops the engine from removing calls that look unused
export const sink = { value: 0 };

const obj = { hello: 'world' };
const otherObj = { hello: 'world' };
const fn = () => {};
const list = [1, 2, 3];

const equalityFns = { v6: areInputsEqualV6, v7: areInputsEqual };
const memoizeFns = { v6: memoizeOneV6, v7: memoizeOne };

function compare(newInputs: unknown[], lastInputs: unknown[]) {
  return (version: Version) => {
    const isEqual = equalityFns[version];
    return () => {
      for (let i = 0; i < callsPerSample; i++) {
        if (isEqual(newInputs, lastInputs)) {
          sink.value++;
        }
      }
    };
  };
}

function add(a: number, b: number, c: number): number {
  return a + b + c;
}

export const scenarios: Record<string, (version: Version) => () => void> = {
  'areInputsEqual: same primitives': compare([1, 'hello', true], [1, 'hello', true]),
  'areInputsEqual: same references': compare([obj, fn, list], [obj, fn, list]),
  'areInputsEqual: last input changed': compare([1, 'hello', true], [1, 'hello', false]),
  'areInputsEqual: different references': compare([obj], [otherObj]),
  'areInputsEqual: NaN inputs': compare([NaN, NaN], [NaN, NaN]),
  'areInputsEqual: mixed input types': (version) => {
    // Calling with many input types, as an app would
    const isEqual = equalityFns[version];
    const pairs: [unknown[], unknown[]][] = [
      [
        [1, 'hello', true],
        [1, 'hello', true],
      ],
      [
        [obj, fn, list],
        [obj, fn, list],
      ],
      [
        [1, 'hello', true],
        [1, 'hello', false],
      ],
      [[obj], [otherObj]],
      [
        [NaN, NaN],
        [NaN, NaN],
      ],
      [
        [null, undefined],
        [null, undefined],
      ],
      [
        [1.5, 2.5],
        [1.5, 2.5],
      ],
    ];
    return () => {
      for (let i = 0; i < callsPerSample; i++) {
        const [newInputs, lastInputs] = pairs[i % pairs.length];
        if (isEqual(newInputs, lastInputs)) {
          sink.value++;
        }
      }
    };
  },
  'memoized function: cache hit': (version) => {
    const memoized = memoizeFns[version](add);
    return () => {
      for (let i = 0; i < callsPerSample; i++) {
        sink.value += memoized(1, 2, 3);
      }
    };
  },
  'memoized function: cache miss': (version) => {
    const memoized = memoizeFns[version](add);
    return () => {
      for (let i = 0; i < callsPerSample; i++) {
        // the last argument changes on every call
        sink.value += memoized(1, 2, i);
      }
    };
  },
};
