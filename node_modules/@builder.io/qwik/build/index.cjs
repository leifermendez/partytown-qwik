"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/qwik/src/build/index.ts
var build_exports = {};
__export(build_exports, {
  isBrowser: () => isBrowser,
  isServer: () => isServer
});
module.exports = __toCommonJS(build_exports);
var isServer = /* @__PURE__ */ (() => typeof process !== "undefined" && !!process.versions && !!process.versions.node || typeof Deno !== "undefined")();
var isBrowser = /* @__PURE__ */ (() => typeof window !== "undefined" && !!window.document || typeof self !== "undefined" && typeof self.importScripts === "function")();
//# sourceMappingURL=index.cjs.map
