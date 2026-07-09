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
  projects: () => projects
});
module.exports = __toCommonJS(stdin_exports);
var import_pg_core = require("drizzle-orm/pg-core");
const projects = (0, import_pg_core.pgTable)("projects", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  description: (0, import_pg_core.text)("description"),
  status: (0, import_pg_core.text)("status"),
  start_date: (0, import_pg_core.date)("start_date"),
  end_date: (0, import_pg_core.date)("end_date"),
  deleted_at: (0, import_pg_core.timestamp)("deleted_at"),
  created_at: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
