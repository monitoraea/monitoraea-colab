-- Part B: identity linking (entity_id/entity_type) + entity_records table
-- (scoped storage for the 19 indicator FDs) + the full set of new
-- Informações fields added to colegiado/model.yml. Column set matches
-- packages/community-assistant-schema's freshly generated Drizzle schema
-- exactly (see db/generated/colegiado.js and entity_records.js after
-- running `pnpm run schema-gen`).

-- Identity linking: ties a colegiado row back to the legacy
-- ciea.comissoes record it belongs to (entity_type is always the fixed
-- constant 'legacy_colegiado'; entity_id is the legacy iniciativa_id).
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS entity_id integer;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS entity_type text;

-- Scoped storage for the 19 indicator FDs (form-indic-<dim>-<n>.yml), one
-- row per (entity_id, entity_type, record_key) via EntityRecordsDataProvider.
CREATE TABLE IF NOT EXISTS entity_records (
  id serial PRIMARY KEY,
  entity_id integer NOT NULL,
  entity_type text NOT NULL,
  record_key text NOT NULL,
  version integer,
  published_at date,
  data jsonb NOT NULL DEFAULT '{}',
  deleted_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Remaining Informações fields (B.2/B.4): documento de criação,
-- composição de cadeiras (outros setores), coordenação, regimento
-- interno, organização interna, 5 políticas públicas blocks, plano de ação.
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS documento_criacao text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS documento_criacao_tipo text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS documento_criacao_arquivo text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS composicao_cadeiras_outros jsonb;

ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS coordenacao text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS coordenacao_especifique text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS coordenacao_quem jsonb;

ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS regimento_interno_tem boolean;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS regimento_interno text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS regimento_interno_tipo text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS regimento_interno_arquivo text;

ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS org_interna_periodicidade text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS organizacao_interna_periodicidade_especifique text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS organizacao_interna_estrutura_tem boolean;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS organizacao_interna_estrutura_especifique text;

ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea_tem boolean;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea_tipo text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea_arquivo text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea_decreto text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea_lei text;

ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea2_tem boolean;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea2_tipo text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea2_arquivo text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea2_decreto text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea2_lei text;

ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS programa_estadual_tem boolean;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS programa_estadual_tipo text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS programa_estadual_arquivo text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS programa_estadual_decreto text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS programa_estadual_lei text;

ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS plano_estadual_tem boolean;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS plano_estadual_tipo text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS plano_estadual_arquivo text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS plano_estadual_decreto text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS plano_estadual_lei text;

ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea_outra_tem boolean;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea_outra_tipo text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea_outra_arquivo text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea_outra_decreto text;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS ppea_outra_lei text;

-- plano_acao_arquivo is a genuine file-only upload (type: file in
-- model.yml, unlike the *_arquivo text fields above which are file_or_link
-- pairs) — stored as an FK to files, matching logo_file_id's pattern.
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS plano_acao_arquivo integer REFERENCES files(id);
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS plano_acao_ini date;
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS plano_acao_fim date;
