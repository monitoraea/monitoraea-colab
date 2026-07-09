var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
module.exports = __toCommonJS(stdin_exports);
__reExport(stdin_exports, require("./user"), module.exports);
__reExport(stdin_exports, require("./uf"), module.exports);
__reExport(stdin_exports, require("./timeline"), module.exports);
__reExport(stdin_exports, require("./test"), module.exports);
__reExport(stdin_exports, require("./sample"), module.exports);
__reExport(stdin_exports, require("./project"), module.exports);
__reExport(stdin_exports, require("./person"), module.exports);
__reExport(stdin_exports, require("./organization"), module.exports);
__reExport(stdin_exports, require("./geo"), module.exports);
__reExport(stdin_exports, require("./file"), module.exports);
__reExport(stdin_exports, require("./entity_records"), module.exports);
__reExport(stdin_exports, require("./colegiado"), module.exports);
