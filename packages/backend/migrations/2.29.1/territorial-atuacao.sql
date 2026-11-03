-- Atuacao (território de atuação) das iniciativas guarda-chuva.
-- Idempotente e sem ids fixos: pode ser rodado em ambientes que já aplicaram a versão anterior de guarda-chuva.sql
-- (perspectiva + painel + receita + comunidade) e também em ambientes sem nada disso (as inserções "se não existe").
-- Requer PostGIS (a coluna geom usa public.geometry).

BEGIN;

-- 1) schema e tabelas -------------------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS territorial;

CREATE TABLE IF NOT EXISTS territorial.iniciativas (
	id serial4 NOT NULL,
	community_id int4 NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NULL,
	"deletedAt" timestamp NULL,
	nome varchar NULL,
	atuacao_aplica bool NULL,
	atuacao_naplica_just text NULL,
	CONSTRAINT iniciativas_pk PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS iniciativas_iniciativa_id_idx ON territorial.iniciativas USING btree (id);
CREATE INDEX IF NOT EXISTS iniciativas_community_id_idx ON territorial.iniciativas USING btree (community_id);

CREATE TABLE IF NOT EXISTS territorial.atuacao (
	id serial4 NOT NULL,
	iniciativa_id int4 NOT NULL,
	geom public.geometry NOT NULL,
	CONSTRAINT territorial_atuacao_pk PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS territorial_atuacao_iniciativa_id_idx ON territorial.atuacao USING btree (iniciativa_id);

-- 2) ferramenta "Atuacao" ---------------------------------------------------------------------------------------
-- o id é calculado (máx + 1): a sequence de dorothy_tools pode estar atrás dos ids inseridos à mão
INSERT INTO public.dorothy_tools (id, "createdAt", "updatedAt", "type", "element", "class", "parentId", descriptor_json)
SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.dorothy_tools), now(), now(), 'native', 'Atuacao', 'community', NULL,
       '{"icon": "home", "alias": "atuacao", "title": "atuação", "description": "Atuacao tool"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.dorothy_tools WHERE element = 'Atuacao');

-- 3) inclui a ferramenta na receita e nas comunidades guarda-chuva já criadas ---------------------------------------
-- Ordem final: UmbrellaPanel, Atuacao, depois as demais. Só altera quem ainda não tem a Atuacao.
UPDATE public.dorothy_community_recipes r
SET descriptor_json = jsonb_set(
      r.descriptor_json, '{tools}',
      jsonb_build_array(
        jsonb_build_object('id', (SELECT id FROM public.dorothy_tools WHERE element = 'UmbrellaPanel' LIMIT 1)),
        jsonb_build_object('id', (SELECT id FROM public.dorothy_tools WHERE element = 'Atuacao' LIMIT 1))
      ) || COALESCE((
        SELECT jsonb_agg(t ORDER BY ord)
        FROM jsonb_array_elements(r.descriptor_json->'tools') WITH ORDINALITY AS x(t, ord)
        WHERE (t->>'id')::int NOT IN (SELECT id FROM public.dorothy_tools WHERE element IN ('UmbrellaPanel', 'Atuacao'))
      ), '[]'::jsonb)
    ),
    "updatedAt" = now()
WHERE r.alias = 'guarda-chuva'
  AND EXISTS (SELECT 1 FROM public.dorothy_tools WHERE element = 'UmbrellaPanel')
  AND NOT (r.descriptor_json->'tools') @> jsonb_build_array(
        jsonb_build_object('id', (SELECT id FROM public.dorothy_tools WHERE element = 'Atuacao' LIMIT 1)));

UPDATE public.dorothy_communities c
SET descriptor_json = jsonb_set(
      c.descriptor_json, '{tools}',
      jsonb_build_array(
        jsonb_build_object('id', (SELECT id FROM public.dorothy_tools WHERE element = 'UmbrellaPanel' LIMIT 1)),
        jsonb_build_object('id', (SELECT id FROM public.dorothy_tools WHERE element = 'Atuacao' LIMIT 1))
      ) || COALESCE((
        SELECT jsonb_agg(t ORDER BY ord)
        FROM jsonb_array_elements(c.descriptor_json->'tools') WITH ORDINALITY AS x(t, ord)
        WHERE (t->>'id')::int NOT IN (SELECT id FROM public.dorothy_tools WHERE element IN ('UmbrellaPanel', 'Atuacao'))
      ), '[]'::jsonb)
    ),
    "updatedAt" = now()
WHERE trim(c."type") = 'umbrella'
  AND EXISTS (SELECT 1 FROM public.dorothy_tools WHERE element = 'UmbrellaPanel')
  AND NOT (c.descriptor_json->'tools') @> jsonb_build_array(
        jsonb_build_object('id', (SELECT id FROM public.dorothy_tools WHERE element = 'Atuacao' LIMIT 1)));

-- 4) uma iniciativa territorial para cada comunidade guarda-chuva que ainda não tem (nome = título da comunidade) -----
INSERT INTO territorial.iniciativas (community_id, "createdAt", nome)
SELECT c.id, now(), c.descriptor_json->>'title'
FROM public.dorothy_communities c
WHERE trim(c."type") = 'umbrella'
  AND NOT EXISTS (SELECT 1 FROM territorial.iniciativas i WHERE i.community_id = c.id AND i."deletedAt" IS NULL);

COMMIT;
