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
var stdin_exports = {};
__export(stdin_exports, {
  geos: () => geos
});
module.exports = __toCommonJS(stdin_exports);
var import_pg_core = require("drizzle-orm/pg-core");
const geos = (0, import_pg_core.pgTable)("geo", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  entity_id: (0, import_pg_core.integer)("entity_id").notNull(),
  entity_type: (0, import_pg_core.text)("entity_type").notNull(),
  version: (0, import_pg_core.integer)("version"),
  published_at: (0, import_pg_core.date)("published_at"),
  geojson: (0, import_pg_core.jsonb)("geojson"),
  descricao_territorio: (0, import_pg_core.text)("descricao_territorio"),
  estados_atuacao: (0, import_pg_core.jsonb)("estados_atuacao"),
  deleted_at: (0, import_pg_core.timestamp)("deleted_at"),
  created_at: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
