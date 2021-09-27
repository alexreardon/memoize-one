/* eslint-disable no-console */
import benchmark from 'benchmark';
import memoizeOne from '../dist/memoize-one.esm';
import lodash from 'lodash.memoize';
import fastMemoize from 'fast-memoize';
import mem from 'mem';
import ora from 'ora';
import { green, bold } from 'nanocolors';
var libraries = [
    {
        name: 'no memoization',
        memoize: function (fn) { return fn; }
    },
    {
        name: 'memoize-one',
        memoize: memoizeOne
    },
    {
        name: 'lodash.memoize',
        memoize: lodash
    },
    {
        name: 'fast-memoize',
        memoize: fastMemoize
    },
    {
        name: 'mem',
        memoize: mem
    },
];
function slowFn() {
    for (var i = 0; i < 2000; i++) {
        void undefined;
    }
}
var scenarios = [
    {
        name: 'no arguments',
        baseFn: slowFn,
        args: []
    },
    // {
    //   name: 'single primitive argument',
    //   baseFn: function add1(value) {
    //     slowFn();
    //     return value + 1;
    //   },
    //   args: [2],
    // },
    // {
    //   name: 'single complex argument',
    //   baseFn: function identity(value) {
    //     slowFn();
    //     return value;
    //   },
    //   args: [{ hello: 'world' }],
    // },
    // {
    //   name: 'multiple primitive arguments',
    //   baseFn: function asArray(...values) {
    //     slowFn();
    //     return values;
    //   },
    //   args: [1, 'hello', true],
    // },
    // {
    //   name: 'multiple complex arguments',
    //   baseFn: function asArray(...values) {
    //     slowFn();
    //     return values;
    //   },
    //   args: [() => {}, { hello: { there: 'world' } }, [1, 2, 3]],
    // },
];
scenarios.forEach(function (useCase) {
    var suite = new benchmark.Suite(useCase.name);
    libraries.forEach(function callback(library) {
        var memoized = library.memoize(useCase.baseFn);
        var spinner = ora({
            text: library.name,
            spinner: {
                frames: ['⏳']
            }
        });
        // Add a benchmark
        suite.add({
            name: library.name,
            fn: function () { return memoized.apply(void 0, useCase.args); },
            onStart: function () { return spinner.start(); },
            onComplete: function () { return spinner.succeed(); }
        });
    });
    suite.on('start', function () {
        console.log(bold('Scenario') + ": " + green(useCase.name));
    });
    // suite.on('cycle', (e) => console.log(String(e.target)));
    suite.on('complete', function (event) {
        var map = event.target;
        var benchmarks = Object.values(map);
        // benchmarks.sort((a, b) => {
        //   return a.hz > b.hz;
        // });
        // console.log(benchmarks);
    });
    suite.run();
});
