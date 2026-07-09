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
  colegiados: () => colegiados
});
module.exports = __toCommonJS(stdin_exports);
var import_pg_core = require("drizzle-orm/pg-core");
var import_file = require("./file");
const colegiados = (0, import_pg_core.pgTable)("colegiado", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  type: (0, import_pg_core.text)("type"),
  type_detail: (0, import_pg_core.text)("type_detail"),
  level: (0, import_pg_core.text)("level"),
  level_detail: (0, import_pg_core.text)("level_detail"),
  logo: (0, import_pg_core.integer)("logo_file_id").references(() => import_file.files.id),
  uf_id: (0, import_pg_core.jsonb)("uf_id"),
  creation_data: (0, import_pg_core.date)("creation_data"),
  status: (0, import_pg_core.text)("status"),
  site_link: (0, import_pg_core.text)("site_link"),
  obs: (0, import_pg_core.text)("obs"),
  cadeiras_pub: (0, import_pg_core.integer)("cadeiras_pub"),
  cadeiras_civil: (0, import_pg_core.integer)("cadeiras_civil"),
  membros: (0, import_pg_core.jsonb)("membros"),
  entity_id: (0, import_pg_core.integer)("entity_id"),
  entity_type: (0, import_pg_core.text)("entity_type"),
  documento_criacao: (0, import_pg_core.text)("documento_criacao"),
  documento_criacao_tipo: (0, import_pg_core.text)("documento_criacao_tipo"),
  documento_criacao_arquivo: (0, import_pg_core.text)("documento_criacao_arquivo"),
  composicao_cadeiras_outros: (0, import_pg_core.jsonb)("composicao_cadeiras_outros"),
  coordenacao: (0, import_pg_core.text)("coordenacao"),
  coordenacao_especifique: (0, import_pg_core.text)("coordenacao_especifique"),
  coordenacao_quem: (0, import_pg_core.jsonb)("coordenacao_quem"),
  regimento_interno_tem: (0, import_pg_core.boolean)("regimento_interno_tem"),
  regimento_interno: (0, import_pg_core.text)("regimento_interno"),
  regimento_interno_tipo: (0, import_pg_core.text)("regimento_interno_tipo"),
  regimento_interno_arquivo: (0, import_pg_core.text)("regimento_interno_arquivo"),
  org_interna_periodicidade: (0, import_pg_core.text)("org_interna_periodicidade"),
  organizacao_interna_periodicidade_especifique: (0, import_pg_core.text)("organizacao_interna_periodicidade_especifique"),
  organizacao_interna_estrutura_tem: (0, import_pg_core.boolean)("organizacao_interna_estrutura_tem"),
  organizacao_interna_estrutura_especifique: (0, import_pg_core.text)("organizacao_interna_estrutura_especifique"),
  ppea_tem: (0, import_pg_core.boolean)("ppea_tem"),
  ppea_tipo: (0, import_pg_core.text)("ppea_tipo"),
  ppea_arquivo: (0, import_pg_core.text)("ppea_arquivo"),
  ppea_decreto: (0, import_pg_core.text)("ppea_decreto"),
  ppea_lei: (0, import_pg_core.text)("ppea_lei"),
  ppea2_tem: (0, import_pg_core.boolean)("ppea2_tem"),
  ppea2_tipo: (0, import_pg_core.text)("ppea2_tipo"),
  ppea2_arquivo: (0, import_pg_core.text)("ppea2_arquivo"),
  ppea2_decreto: (0, import_pg_core.text)("ppea2_decreto"),
  ppea2_lei: (0, import_pg_core.text)("ppea2_lei"),
  programa_estadual_tem: (0, import_pg_core.boolean)("programa_estadual_tem"),
  programa_estadual_tipo: (0, import_pg_core.text)("programa_estadual_tipo"),
  programa_estadual_arquivo: (0, import_pg_core.text)("programa_estadual_arquivo"),
  programa_estadual_decreto: (0, import_pg_core.text)("programa_estadual_decreto"),
  programa_estadual_lei: (0, import_pg_core.text)("programa_estadual_lei"),
  plano_estadual_tem: (0, import_pg_core.boolean)("plano_estadual_tem"),
  plano_estadual_tipo: (0, import_pg_core.text)("plano_estadual_tipo"),
  plano_estadual_arquivo: (0, import_pg_core.text)("plano_estadual_arquivo"),
  plano_estadual_decreto: (0, import_pg_core.text)("plano_estadual_decreto"),
  plano_estadual_lei: (0, import_pg_core.text)("plano_estadual_lei"),
  ppea_outra_tem: (0, import_pg_core.boolean)("ppea_outra_tem"),
  ppea_outra_tipo: (0, import_pg_core.text)("ppea_outra_tipo"),
  ppea_outra_arquivo: (0, import_pg_core.text)("ppea_outra_arquivo"),
  ppea_outra_decreto: (0, import_pg_core.text)("ppea_outra_decreto"),
  ppea_outra_lei: (0, import_pg_core.text)("ppea_outra_lei"),
  plano_acao_arquivo: (0, import_pg_core.integer)("plano_acao_arquivo").references(() => import_file.files.id),
  plano_acao_ini: (0, import_pg_core.date)("plano_acao_ini"),
  plano_acao_fim: (0, import_pg_core.date)("plano_acao_fim"),
  deleted_at: (0, import_pg_core.timestamp)("deleted_at"),
  created_at: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updated_at: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
