ALTER TABLE public.perspectives ADD aliases _varchar NULL;
CREATE INDEX perspectives_aliases_idx ON public.perspectives (aliases);

TRUNCATE TABLE public.perspectives RESTART IDENTITY RESTRICT;

INSERT INTO public.perspectives
(id, "name", config, network_community_id, adm_community_id, aliases)
VALUES(1, 'MonitoraEA - Geral', '{"key": "monitoraea"}'::jsonb, NULL, NULL, '{adm}');
INSERT INTO public.perspectives
(id, "name", config, network_community_id, adm_community_id, aliases)
VALUES(2, 'M&A de Iniciativas Vinculadas ao PPPZCM', '{"key": "zcm"}'::jsonb, 250, 1, '{adm_zcm,facilitador,projeto,rede_zcm}');
INSERT INTO public.perspectives
(id, "name", config, network_community_id, adm_community_id, aliases)
VALUES(3, 'Comissões Interinstitucional de Educação Ambiental', '{"key": "ciea"}'::jsonb, 603, 601, '{adm_ciea,comissao,rede_ciea}');
INSERT INTO public.perspectives
(id, "name", config, network_community_id, adm_community_id, aliases)
VALUES(4, 'M&A de Políticas Públicas de Educação Ambiental', '{"key": "ppea"}'::jsonb, 533, 534, '{adm_ppea,politica,rede_ppea}');
INSERT INTO public.perspectives
(id, "name", config, network_community_id, adm_community_id, aliases)
VALUES(5, 'Centro/Núcleo/Equipamento', '{"key": "cne"}'::jsonb, 1236, 1233, '{adm_cne,cne,rede_cne}');
INSERT INTO public.perspectives
(id, "name", config, network_community_id, adm_community_id, aliases)
VALUES(6, 'Iniciativas não governamentais', '{"key": "iniciativas"}'::jsonb, 1692, 1693, '{adm_iniciativas,iniciativa,rede_iniciativas}');
INSERT INTO public.perspectives
(id, "name", config, network_community_id, adm_community_id, aliases)
VALUES(7, 'Educom&Clima', '{"key": "educom_clima"}'::jsonb, NULL, NULL, '{educom_clima}');