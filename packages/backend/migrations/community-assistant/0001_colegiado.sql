-- Walking-skeleton migration for the CAS-managed "colegiado" entity.
-- Column set matches packages/community-assistant-schema's generated
-- Drizzle schema exactly (see the vendored copy's db/generated/colegiado.ts
-- and file.ts) — not versioned yet (schema/colegiado/model.yml still has
-- versioned: false), coexists alongside the legacy ciea.comissoes table.
-- No data migration from ciea.comissoes happens here or in this phase.

CREATE TABLE IF NOT EXISTS files (
  id serial PRIMARY KEY,
  filename text NOT NULL,
  url text NOT NULL,
  mime_type text,
  size_bytes integer,
  deleted_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS colegiado (
  id serial PRIMARY KEY,
  name text NOT NULL,
  type text,
  type_detail text,
  level text,
  level_detail text,
  logo_file_id integer REFERENCES files(id),
  uf_id jsonb,
  creation_data date,
  status text,
  site_link text,
  obs text,
  cadeiras_pub integer,
  cadeiras_civil integer,
  membros jsonb,
  deleted_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- membros was missed in the initial hand-written migration (Phase 1) even
-- though model.yml always declared it — caught only when Part D's
-- registry-injection verification re-exercised the save path with the
-- freshly-generated (and therefore accurate) colegiado.js Drizzle table,
-- whose .returning() failed against the real table's actual columns.
ALTER TABLE colegiado ADD COLUMN IF NOT EXISTS membros jsonb;

-- colegiado/model.yml has an on_save trigger (sync_column) that keeps a WG
-- instance's name in sync with the colegiado's own name. That's a Part
-- C-later (shell-backend) concern we haven't wired up in this phase, but
-- the trigger fires unconditionally on every save regardless — it just
-- needs the target table to exist (a zero-match UPDATE is a harmless
-- no-op). Minimal stub, matching db/shell.ts's workingGroupsTable shape;
-- not the full shell-backend migration.
CREATE TABLE IF NOT EXISTS working_groups (
  id serial PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  entity_type text,
  entity_id integer,
  created_at timestamp NOT NULL DEFAULT now()
);

-- resolveTriggers() (engine/trigger-executor.ts) logs every fired trigger
-- (any type, not just webhooks) to this outbox table for async dispatch —
-- required as soon as a save goes through the FD-aware path (formKey +
-- fdEntity params), which FormPage always sends. Matches db/outbox.ts.
CREATE TABLE IF NOT EXISTS outbox (
  id serial PRIMARY KEY,
  queue text NOT NULL DEFAULT 'default',
  event text NOT NULL,
  url text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamp NOT NULL DEFAULT now(),
  dispatched_at timestamp,
  retry_after timestamp
);
