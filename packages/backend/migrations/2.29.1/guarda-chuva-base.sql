-- Base do tipo de GT "guarda-chuva" (territorial): perspectiva, ferramenta do painel, receita e a comunidade "CECSA São Paulo".
-- Idempotente e sem ids fixos (cada id é "máx + 1": as sequences podem estar atrás de ids inseridos à mão).
-- Rodar ANTES de territorial-atuacao.sql, que acrescenta a ferramenta Atuacao, o schema territorial e a iniciativa.
-- Pressupõe as ferramentas 4 e 1 (as mesmas usadas nas demais receitas) e o usuário 1 (administrador).

BEGIN;

-- 1) perspectiva "Territorial"
INSERT INTO public.perspectives (id, "name", config, network_community_id, adm_community_id, aliases)
SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.perspectives), 'Territorial', '{"key": "guardachuva"}'::jsonb, NULL, NULL, '{guardachuva}'
WHERE NOT EXISTS (SELECT 1 FROM public.perspectives WHERE aliases @> '{guardachuva}');

-- 2) ferramenta do painel
INSERT INTO public.dorothy_tools (id, "createdAt", "updatedAt", "type", "element", "class", "parentId", descriptor_json)
SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.dorothy_tools), now(), now(), 'native', 'UmbrellaPanel', 'community', NULL,
       '{"icon": "home", "alias": "guarda-chuva-panel", "title": "painel", "description": "Painel Guarda-chuva"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.dorothy_tools WHERE element = 'UmbrellaPanel');

-- 3) receita (a ferramenta Atuacao entra depois, em territorial-atuacao.sql)
INSERT INTO public.dorothy_community_recipes (id, "name", obs, descriptor_json, "createdAt", "updatedAt", "type", alias)
SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.dorothy_community_recipes), 'umbrella', NULL,
       jsonb_build_object(
         'title', '%TITLE%',
         'tools', jsonb_build_array(
            jsonb_build_object('id', (SELECT id FROM public.dorothy_tools WHERE element = 'UmbrellaPanel' LIMIT 1)),
            jsonb_build_object('id', 4), jsonb_build_object('id', 1)),
         'includes', '[]'::jsonb,
         'perspective', (SELECT id FROM public.perspectives WHERE aliases @> '{guardachuva}' LIMIT 1)),
       now(), now(), 'umbrella', 'guarda-chuva'
WHERE NOT EXISTS (SELECT 1 FROM public.dorothy_community_recipes WHERE alias = 'guarda-chuva');

-- 4) comunidade "CECSA São Paulo" (+ administrador)
INSERT INTO public.dorothy_communities (id, members_only, descriptor_url, descriptor_json, "createdAt", "updatedAt", alias, "type", config)
SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM public.dorothy_communities), false, NULL,
       jsonb_build_object(
         'title', 'CECSA São Paulo',
         'tools', jsonb_build_array(
            jsonb_build_object('id', (SELECT id FROM public.dorothy_tools WHERE element = 'UmbrellaPanel' LIMIT 1)),
            jsonb_build_object('id', 4), jsonb_build_object('id', 1)),
         'includes', '[]'::jsonb,
         'perspective', (SELECT id FROM public.perspectives WHERE aliases @> '{guardachuva}' LIMIT 1)),
       now(), now(), 'guarda-chuva', 'umbrella', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.dorothy_communities WHERE trim("type") = 'umbrella' AND descriptor_json->>'title' = 'CECSA São Paulo');

INSERT INTO public.dorothy_members ("communityId", "userId", "type", "createdAt", "updatedAt", "order")
SELECT c.id, 1, 'adm', now(), now(), 0
FROM public.dorothy_communities c
WHERE trim(c."type") = 'umbrella' AND c.descriptor_json->>'title' = 'CECSA São Paulo'
  AND EXISTS (SELECT 1 FROM public.dorothy_users WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM public.dorothy_members m WHERE m."communityId" = c.id AND m."userId" = 1);

COMMIT;
