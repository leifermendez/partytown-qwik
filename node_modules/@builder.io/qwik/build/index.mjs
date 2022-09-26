// packages/qwik/src/build/index.ts
var isServer = /* @__PURE__ */ (() => typeof process !== "undefined" && !!process.versions && !!process.versions.node || typeof Deno !== "undefined")();
var isBrowser = /* @__PURE__ */ (() => typeof window !== "undefined" && !!window.document || typeof self !== "undefined" && typeof self.importScripts === "function")();
export {
  isBrowser,
  isServer
};
//# sourceMappingURL=index.mjs.map
