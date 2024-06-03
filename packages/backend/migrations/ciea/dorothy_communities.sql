update dorothy_communities
set descriptor_json = descriptor_json || jsonb_build_object('perspective', 2)

INSERT INTO public.dorothy_communities
(id, members_only, descriptor_url, descriptor_json, "createdAt", "updatedAt", alias, "type", config)
VALUES(601, false, NULL, '{"title": "Gestão do CIEA", "tools": [{"id": 12}, {"id": 4}, {"id": 1}], "includes": [], "perspective": 3}'::jsonb, '2024-05-20 11:56:13.117', '2024-05-20 11:56:13.118', 'adm_ciea', 'adm_ciea', NULL);

INSERT INTO public.dorothy_communities
(id, members_only, descriptor_url, descriptor_json, "createdAt", "updatedAt", alias, "type", config)
VALUES(302, false, NULL, '{"title": "Gestão do MonitoraEA", "tools": [{"id": 12}, {"id": 4}, {"id": 1}], "includes": [], "perspective": 1}'::jsonb, '2024-05-20 11:56:13.117', '2024-05-20 11:56:13.118', 'adm', 'adm                 ', NULL);

INSERT INTO public.dorothy_communities
(id, members_only, descriptor_url, descriptor_json, "createdAt", "updatedAt", alias, "type", config)
VALUES(603, false, NULL, '{"title": "Rede de Comunidades de Aprendizagem do CIEA", "tools": [{"id": 17}], "includes": [], "perspective": 3}'::jsonb, '2024-05-20 11:56:13.117', '2024-05-20 11:56:13.118', 'rede', 'network                 ', NULL);

UPDATE public.dorothy_communities
SET members_only=false, descriptor_url=NULL, descriptor_json='{"title": "Gestão do PPPZCM", "tools": [{"id": 14, "group": "painel"}, {"id": 15, "group": "painel"}, {"id": 12}, {"id": 4}, {"id": 1}], "groups": [{"id": "painel", "icon": "chart", "title": "visualizações"}], "includes": [], "perspective": 2}'::jsonb, "createdAt"='2021-06-04 11:57:36.469', "updatedAt"='2021-06-04 11:57:36.469', alias='adm_zcm', "type"='adm_zcm', config=NULL
WHERE id=1;

INSERT INTO public.dorothy_communities
(id, members_only, descriptor_url, descriptor_json, "createdAt", "updatedAt", alias, "type", config)
VALUES(604, false, NULL, '{"title": "Gestão do Portal", "tools": [{"id": 13, "group": "cms"}, {"id": 16, "group": "cms"}, {"id": 4}, {"id": 1}], "groups": [{"id": "cms", "icon": "cms", "title": "conteúdo"}], "includes": [], "perspective": 1}'::jsonb, '2024-05-20 11:56:13.117', '2024-05-20 11:56:13.118', 'adm', 'adm                 ', NULL);

-- DEPOIS DA MIGRACAO

update dorothy_communities 
set descriptor_json = jsonb_set(descriptor_json,'{"tools"}','[{"id": 18}, {"id": 1}]') 
where alias = 'comissao'

-- atualiza sequencia
select max(id)+1 from dorothy_communities dc; 

ALTER SEQUENCE communities_id_seq RESTART WITH ??;