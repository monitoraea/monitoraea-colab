INSERT INTO public.perspectives (id, "name", config, network_community_id, adm_community_id, aliases) VALUES(ID_PER, 'Territorial', '{"key": "guardachuva"}'::jsonb, NULL, NULL, '{guardachuva}');

INSERT INTO public.dorothy_tools (id, "createdAt", "updatedAt", "type", "element", "class", "parentId", descriptor_json) VALUES(ID_TOOL, '2026-11-03 08:54:50.779', '2026-11-03 08:54:50.779', 'native', 'UmbrellaPanel', 'community', NULL, '{"icon": "home", "alias": "guarda-chuva-panel", "title": "painel", "description": "Painel Guarda-chuva"}'::jsonb);

INSERT INTO public.dorothy_community_recipes (id, "name", obs, descriptor_json, "createdAt", "updatedAt", "type", alias) VALUES(ID_COM_RECIPE, 'umbrella', NULL, '{"title": "%TITLE%", "tools": [{"id": ID_TOOL}, {"id": 4}, {"id": 1}], "includes": [], "perspective": ID_PER}'::jsonb, '2026-11-03 08:58:35.000', '2026-11-03 08:58:35.000', 'umbrella            ', 'guarda-chuva');

INSERT INTO public.dorothy_communities (id, members_only, descriptor_url, descriptor_json, "createdAt", "updatedAt", alias, "type", config) VALUES(ID_COM, false, NULL, '{"title": "CECSA São Paulo", "tools": [{"id": ID_TOOL}, {"id": 4}, {"id": 1}], "includes": [], "perspective": ID_PER}'::jsonb, '2026-11-03 09:04:41.552', '2026-11-03 09:04:41.552', 'guarda-chuva', 'umbrella            ', NULL);

INSERT INTO public.dorothy_members ("communityId", "userId", "type", "createdAt", "updatedAt", "order") VALUES(ID_COM, 1, 'adm       ', '2026-11-03 09:07:51.839', '2026-11-03 09:07:51.839', 0);