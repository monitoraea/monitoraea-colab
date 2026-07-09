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
  getEntityTable: () => getEntityTable,
  relationHandlers: () => relationHandlers
});
module.exports = __toCommonJS(stdin_exports);
var import_drizzle_orm = require("drizzle-orm");
var import_server = require("@community-assistant/server");
var import_user = require("../db/generated/user");
var import_uf = require("../db/generated/uf");
var import_timeline = require("../db/generated/timeline");
var import_sample = require("../db/generated/sample");
var import_project = require("../db/generated/project");
var import_person = require("../db/generated/person");
var import_file = require("../db/generated/file");
var import_organization = require("../db/generated/organization");
var import_geo = require("../db/generated/geo");
var import_colegiado = require("../db/generated/colegiado");
function getEntityTable(entityName) {
  switch (entityName) {
    case "user":
      return import_user.users;
    case "uf":
      return import_uf.ufs;
    case "timeline":
      return import_timeline.timelines;
    case "sample":
      return import_sample.samples;
    case "project":
      return import_project.projects;
    case "person":
      return import_person.persons;
    case "file":
      return import_file.files;
    case "organization":
      return import_organization.organizations;
    case "geo":
      return import_geo.geos;
    case "colegiado":
      return import_colegiado.colegiados;
    default:
      return null;
  }
}
const relationHandlers = {
  "sample_members": {
    fetchAll: async (parentId) => {
      const rows = await (0, import_server.getEngineDb)().select().from(import_sample.members).where((0, import_drizzle_orm.eq)(import_sample.members.sample_id, parentId));
      return rows;
    },
    deleteByIds: async (ids) => {
      if (ids.length === 0) return;
      await (0, import_server.getEngineDb)().delete(import_sample.members).where((0, import_drizzle_orm.inArray)(import_sample.members.id, ids));
    },
    insert: async (data) => {
      await (0, import_server.getEngineDb)().insert(import_sample.members).values(data);
    },
    update: async (id, data) => {
      await (0, import_server.getEngineDb)().update(import_sample.members).set({ ...data, updated_at: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.eq)(import_sample.members.id, id));
    }
  }
};
