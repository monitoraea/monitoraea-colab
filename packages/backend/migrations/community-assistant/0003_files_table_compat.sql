-- @community-assistant/schema-gen unconditionally appends deleted_at,
-- created_at, updated_at (all snake_case) to every generated Drizzle table
-- (packages/community-assistant-schema-gen/src/generator.ts), with no way
-- to opt out via model.yml. MEA's real `files` table (shared with the
-- legacy app, predates CAS entirely) has neither a soft-delete column nor
-- snake_case timestamps — it uses "createdAt"/"updatedAt" (camelCase,
-- Sequelize's own default). This surfaced as a live 500
-- ("column deleted_at does not exist") the moment a real, non-null file
-- reference (colegiado.plano_acao_arquivo) went through crud.ts's
-- expandFileFields, which does `_db.select().from(files)` against the
-- registry's generated `file` table — i.e. selects every column the
-- generator assumes exists.
--
-- Fix: add the three missing columns. Additive and non-breaking for the
-- legacy app, which only reads its own camelCase columns.
ALTER TABLE files ADD COLUMN IF NOT EXISTS deleted_at timestamp;
ALTER TABLE files ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();
ALTER TABLE files ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();
UPDATE files SET created_at = "createdAt", updated_at = "updatedAt" WHERE created_at IS NULL;
