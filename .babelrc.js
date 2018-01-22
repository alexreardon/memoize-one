const { BABEL_ENV, NODE_ENV } = process.env;
const modules = BABEL_ENV === 'cjs' || NODE_ENV === 'test' ? 'commonjs' : false;

module.exports = {
  presets: [
    ["env", {
      modules,
      loose: true,
      targets: {
        browsers: [
          'ie >= 11',
          'last 1 Edge version',
          'last 1 Firefox version',
          'last 1 Chrome version',
          'last 1 Safari version',
          'last 1 iOS version',
          'last 1 Android version',
          'last 1 ChromeAndroid version',
        ],
      },
    }],
  ],
  comments: false,
  plugins: [
    "transform-object-rest-spread",
    "transform-flow-strip-types"
  ]
};
