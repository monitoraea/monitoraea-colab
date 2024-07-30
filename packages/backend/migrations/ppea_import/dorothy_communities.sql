INSERT INTO public.dorothy_communities
(members_only, descriptor_json, "createdAt", "updatedAt", alias, "type")
VALUES(false, '{"title": "Rede de Comunidades de Aprendizagem do MonitoraEA-PPEA",   "tools": [{ "id": 21 }], "includes": [], "perspective": 4}', NOW(), NOW(), 'rede', 'network');

INSERT INTO public.dorothy_communities
(members_only, descriptor_url, descriptor_json, "createdAt", "updatedAt", alias, "type", config)
VALUES(false, NULL, '{"title": "Gestão do MonitoraEA-PPEA", "tools": [{"id": 12}, {"id": 4}, {"id": 1}], "includes": [], "perspective": 4}'::jsonb, '2024-05-20 11:56:13.117', '2024-05-20 11:56:13.118', 'adm_ppea                 ', 'adm_ppea            ', NULL);
// INSERIR EM DOROTHY MEMBERS