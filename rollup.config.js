// @ts-check
import typescript from 'rollup-plugin-typescript';

const input = 'src/memoize-one.ts';

function emitModulePackageFile() {
  return {
    name: 'emit-module-package-file',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'package.json', source: `{"type":"module"}` });
    },
  };
}

export default [
  // Universal module definition (UMD) build
  {
    input,
    output: {
      file: 'dist/memoize-one.js',
      format: 'umd',
      name: 'memoizeOne',
    },
    plugins: [typescript()],
  },
  // ESM build
  {
    input,
    output: {
      file: 'dist/esm/memoize-one.js',
      format: 'esm',
    },
    plugins: [typescript(), emitModulePackageFile()],
  },
];
