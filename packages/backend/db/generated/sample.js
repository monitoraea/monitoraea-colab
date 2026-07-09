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
  members: () => members,
  samples: () => samples
});
module.exports = __toCommonJS(stdin_exports);
var import_pg_core = require("drizzle-orm/pg-core");
var import_file = require("./file");
const samples = (0, import_pg_core.pgTable)("samples", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  description: (0, import_pg_core.text)("description"),
  slot_count: (0, import_pg_core.integer)("slot_count"),
  score: (0, import_pg_core.real)("score"),
  active: (0, import_pg_core.boolean)("active"),
  deadline: (0, import_pg_core.date)("deadline"),
  status: (0, import_pg_core.text)("status"),
  status_detail: (0, import_pg_core.text)("status_detail"),
  has_deadline: (0, import_pg_core.boolean)("has_deadline"),
  owner_id: (0, import_pg_core.integer)("owner_id"),
  phases: (0, import_pg_core.jsonb)("phases"),
  logo: (0, import_pg_core.integer)("logo_file_id").references(() => import_file.files.id),
  thumbnail: (0, import_pg_core.integer)("thumbnail_file_id").references(() => import_file.files.id),
  attachment_tipo: (0, import_pg_core.text)("attachment_tipo"),
  attachment: (0, import_pg_core.text)("attachment"),
  tags: (0, import_pg_core.jsonb)("tags"),
  slots: (0, import_pg_core.jsonb)("slots"),
  phase_details: (0, import_pg_core.jsonb)("phase_details"),
  deleted_at: (0, import_pg_core.timestamp)("deleted_at"),
  created_at: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
const members = (0, import_pg_core.pgTable)("sample_members", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  sample_id: (0, import_pg_core.integer)("sample_id").notNull().references(() => samples.id, { onDelete: "cascade" }),
  name: (0, import_pg_core.text)("name"),
  role: (0, import_pg_core.text)("role"),
  created_at: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
