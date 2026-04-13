CREATE TYPE type_of_entity AS ENUM ('zcm', 'ppea', 'centro', 'colegiado', 'iniciativa', 'educom', 'organizacao', 'indefinida');
CREATE TYPE created_by AS ENUM ('from', 'to');

CREATE TABLE relations.entities (
	id uuid NOT NULL,
	"name" varchar NOT NULL,
	entity_type public.type_of_entity NOT NULL,
	entity_id int4 NULL,
	metadata json DEFAULT '{}'::json NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	relations_recebe_it_base boolean NULL,
    relations_oferece_it_base boolean NULL
	CONSTRAINT entities_pk PRIMARY KEY (id)
);
CREATE INDEX entities_entity_type_idx ON relations.entities USING btree (entity_type, entity_id);

CREATE TABLE relations.relations (
	id uuid NOT NULL,
	from_id uuid NOT NULL,
	to_id uuid NOT NULL,
	type_id int4 NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	other_type varchar NULL,
	"createdBy" public.created_by NOT NULL DEFAULT 'from',
	"confirmedByOther" boolean NULL,
	justification varchar DEFAULT '' NOT NULL
	CONSTRAINT relations_pk PRIMARY KEY (id)
);
CREATE INDEX relations_from_id_idx ON relations.relations USING btree (from_id);
CREATE INDEX relations_to_id_idx ON relations.relations USING btree (to_id);

CREATE TABLE relations.relation_options (
	id serial4 NOT NULL,
	"name" varchar NOT NULL,
	description text NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT relation_options_pk PRIMARY KEY (id)
);

INSERT INTO relations.relation_options
(id, "name", description, "createdAt", "updatedAt")
VALUES(1, 'proponência', 'B é proponente de A', '2026-02-09 12:01:31.404', '2026-02-09 12:01:31.404');
INSERT INTO relations.relation_options
(id, "name", description, "createdAt", "updatedAt")
VALUES(3, 'alinhamento de princípios e diretrizes', NULL, '2026-02-09 13:34:12.789', '2026-02-09 13:34:12.795');
INSERT INTO relations.relation_options
(id, "name", description, "createdAt", "updatedAt")
VALUES(4, 'atuação em instrumentos específicos', NULL, '2026-02-09 13:34:12.795', '2026-02-09 13:34:12.795');
INSERT INTO relations.relation_options
(id, "name", description, "createdAt", "updatedAt")
VALUES(5, 'atuação em planos e programas conectados', NULL, '2026-02-09 13:34:12.795', '2026-02-09 13:34:12.795');
INSERT INTO relations.relation_options
(id, "name", description, "createdAt", "updatedAt")
VALUES(6, 'atuação em atividades vinculadas', NULL, '2026-02-09 13:34:12.796', '2026-02-09 13:34:12.796');
INSERT INTO relations.relation_options
(id, "name", description, "createdAt", "updatedAt")
VALUES(7, 'fomento financeiro', NULL, '2026-02-09 13:34:12.796', '2026-02-09 13:34:12.796');
INSERT INTO relations.relation_options
(id, "name", description, "createdAt", "updatedAt")
VALUES(8, 'compartilhamento de infraestrutura', NULL, '2026-02-09 13:34:12.796', '2026-02-09 13:34:12.796');
INSERT INTO relations.relation_options
(id, "name", description, "createdAt", "updatedAt")
VALUES(9, 'compartilhamento de recursos humanos', NULL, '2026-02-09 13:34:12.796', '2026-02-09 13:34:12.796');
INSERT INTO relations.relation_options
(id, "name", description, "createdAt", "updatedAt")
VALUES(10, 'compartilhamento de informações', NULL, '2026-02-09 13:34:12.796', '2026-02-09 13:34:12.796');

-------------------------------------------------------------
-- RELATIONS AUX FUNCTIONS
-------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_entity(
	e_type type_of_entity,
	e_id int4,
	e_name text
)
RETURNS int AS $$
BEGIN
	-- RAISE NOTICE 'Args: %, %, %', entity_type, entity_id, entity_name;
	update relations.entities
	set name = e_name
	where entity_type = e_type and entity_id = e_id;

  RETURN FOUND::int;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_entity(
  e_type type_of_entity,
  e_id int4,
  e_name text,
  e_uuid uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  result_id uuid;
BEGIN
  INSERT INTO relations.entities
  (id, "name", entity_type, entity_id, metadata, "createdAt", "updatedAt")
  VALUES (
    COALESCE(e_uuid, gen_random_uuid()),
    e_name,
    e_type,
    e_id,
    json_build_object('origin', e_type || '_' || e_id),
    NOW(),
    NOW()
  )
  RETURNING id INTO result_id;

  RETURN result_id;
END;
$$ LANGUAGE plpgsql;