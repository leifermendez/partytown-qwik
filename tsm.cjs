const { pathToFileURL } = require("url");
const corePath = pathToFileURL("./node_modules/@builder.io/qwik/core.mjs");

module.exports = {
  common: {
    minifyWhitespace: true,
    target: "es2020",
  },
  config: {
    ".tsx": {
      jsxFactory: "qwikJsx.h",
      jsxFragment: "qwikJsx.Fragment",
      banner: `
      globalThis.qTest = true;
      globalThis.qDev = true;
      import * as qwikJsx from "${corePath}";`,
      target: "es2020",
      loader: "tsx",
      minify: false,
    },
    ".ts": {
      loader: "ts",
      banner: `
globalThis.qTest = true;
globalThis.qDev = true;
`,
      minify: false,
    },
  },
};
