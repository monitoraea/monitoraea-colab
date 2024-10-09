-- TODO: conferir os ID das ferramentas

update dorothy_communities 
set descriptor_json = descriptor_json || '{ "tools": [{"id": 18}, {"id": 4}, {"id": 1}] }'
where alias = 'comissao'


-- TODO: conferir os ID das comunidades
UPDATE public.dorothy_communities
SET members_only=false, descriptor_url=NULL, descriptor_json='{"title": "Rede de Comunidades de Aprendizagem do MonitoraEA-CIEA", "tools": [{"id": 17}], "includes": [], "perspective": 3}'::jsonb, "createdAt"='2024-05-20 11:56:13.117', "updatedAt"='2024-05-20 11:56:13.118', alias='rede_ciea', "type"='network             ', config=NULL
WHERE id=499;
UPDATE public.dorothy_communities
SET members_only=false, descriptor_url=NULL, descriptor_json='{"title": "Rede de Comunidades de Aprendizagem do MonitoraEA-PPPZCM", "tools": [{"id": 3}], "groups": [], "includes": [], "perspective": 2}'::jsonb, "createdAt"='2021-09-27 20:37:45.680', "updatedAt"='2021-09-27 20:37:45.680', alias='rede_zcm', "type"='network             ', config=NULL
WHERE id=250;
UPDATE public.dorothy_communities
SET members_only=false, descriptor_url=NULL, descriptor_json='{"title": "Rede de Comunidades de Aprendizagem do MonitoraEA-PPEA", "tools": [{"id": 21}], "includes": [], "perspective": 4}'::jsonb, "createdAt"='2024-07-30 14:50:31.360', "updatedAt"='2024-07-30 14:50:31.360', alias='rede_ppea', "type"='network             ', config=NULL
WHERE id=1889;