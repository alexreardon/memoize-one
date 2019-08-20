// @ts-check
import typescript from 'rollup-plugin-typescript';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';

const input = 'src/memoize-one.ts';

export default [
  // Universal module definition (UMD) build
  {
    input,
    output: {
      file: 'dist/memoize-one.js',
      format: 'umd',
      name: 'memoizeOne',
    },
    plugins: [
      // Setting development env before running other steps
      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }),
      typescript(),
    ],
  },
  // Universal module definition (UMD) build (production)
  {
    input,
    output: {
      file: 'dist/memoize-one.min.js',
      format: 'umd',
      name: 'memoizeOne',
    },
    plugins: [
      // Setting production env before running other steps
      replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
      typescript(),
      terser(),
    ],
  },
  // ESM build
  {
    input,
    output: {
      file: 'dist/memoize-one.esm.js',
      format: 'esm',
    },
    plugins: [typescript()],
  },
  // CommonJS build
  {
    input,
    output: {
      file: 'dist/memoize-one.cjs.js',
      format: 'cjs',
    },
    plugins: [typescript()],
  },
];
