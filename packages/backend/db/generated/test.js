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
  relation_array: () => relation_array,
  tests: () => tests
});
module.exports = __toCommonJS(stdin_exports);
var import_pg_core = require("drizzle-orm/pg-core");
var import_file = require("./file");
const tests = (0, import_pg_core.pgTable)("tests", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  text_field: (0, import_pg_core.text)("text_field"),
  textarea_field: (0, import_pg_core.text)("textarea_field"),
  integer_field: (0, import_pg_core.integer)("integer_field"),
  real_field: (0, import_pg_core.real)("real_field"),
  boolean_field: (0, import_pg_core.boolean)("boolean_field"),
  boolean_switch_field: (0, import_pg_core.boolean)("boolean_switch_field"),
  date_field: (0, import_pg_core.date)("date_field"),
  select_field: (0, import_pg_core.text)("select_field"),
  multiselect_field: (0, import_pg_core.jsonb)("multiselect_field"),
  multiselect_list_field: (0, import_pg_core.jsonb)("multiselect_list_field"),
  date_field_eu: (0, import_pg_core.date)("date_field_eu"),
  month_year_field: (0, import_pg_core.date)("month_year_field"),
  year_field: (0, import_pg_core.date)("year_field"),
  real_field_eu: (0, import_pg_core.real)("real_field_eu"),
  autocomplete_field: (0, import_pg_core.integer)("autocomplete_field"),
  autocomplete_multiselect_field: (0, import_pg_core.jsonb)("autocomplete_multiselect_field"),
  file_field: (0, import_pg_core.integer)("file_field_id").references(() => import_file.files.id),
  thumb_field: (0, import_pg_core.integer)("thumb_field_id").references(() => import_file.files.id),
  file_or_link_tipo: (0, import_pg_core.text)("file_or_link_tipo"),
  file_or_link_field: (0, import_pg_core.text)("file_or_link_field"),
  jsonb_array: (0, import_pg_core.jsonb)("jsonb_array"),
  deleted_at: (0, import_pg_core.timestamp)("deleted_at"),
  created_at: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
const relation_array = (0, import_pg_core.pgTable)("test_items", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  test_id: (0, import_pg_core.integer)("test_id").notNull().references(() => tests.id, { onDelete: "cascade" }),
  name: (0, import_pg_core.text)("name"),
  value: (0, import_pg_core.text)("value"),
  created_at: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
