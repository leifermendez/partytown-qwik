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

// packages/qwik/src/jsx-runtime/index.ts
var jsx_runtime_exports = {};
__export(jsx_runtime_exports, {
  Fragment: () => import_qwik.Fragment,
  jsx: () => import_qwik.jsx,
  jsxDEV: () => import_qwik.jsxDEV,
  jsxs: () => import_qwik.jsxs
});
module.exports = __toCommonJS(jsx_runtime_exports);
var import_qwik = require("@builder.io/qwik");
//# sourceMappingURL=jsx-runtime.cjs.map
