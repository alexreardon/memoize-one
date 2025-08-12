// @ts-check
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';

const input = 'src/memoize-one.ts';

// Plugin to convert module.exports to exports.default for CommonJS compatibility
const fixCjsExports = () => ({
  name: 'fix-cjs-exports',
  generateBundle(options, bundle) {
    if (options.format === 'cjs') {
      Object.keys(bundle).forEach((fileName) => {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk') {
          chunk.code = chunk.code.replace(
            'module.exports = memoizeOne;',
            'exports.default = memoizeOne;',
          );
        }
      });
    }
  },
});

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
      replace({ 'process.env.NODE_ENV': JSON.stringify('development'), preventAssignment: true }),
      typescript({ module: 'ESNext' }),
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
      replace({ 'process.env.NODE_ENV': JSON.stringify('production'), preventAssignment: true }),
      typescript({ module: 'ESNext' }),
      terser(),
    ],
  },
  // ESM build
  {
    input,
    output: {
      file: 'dist/memoize-one.esm.mjs',
      format: 'es',
    },
    plugins: [typescript({ module: 'ESNext', target: 'ES2015' })],
  },
  // CommonJS build
  {
    input,
    output: {
      file: 'dist/memoize-one.cjs.js',
      format: 'cjs',
      exports: 'default',
    },
    plugins: [typescript({ module: 'ESNext' }), fixCjsExports()],
  },
];
