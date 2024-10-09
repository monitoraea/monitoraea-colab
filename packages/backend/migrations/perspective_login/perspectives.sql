ALTER TABLE public.perspectives ADD network_community_id int4 NULL;
ALTER TABLE public.perspectives ADD adm_community_id int4 NULL;

-- TODO: ATENCAO: conferir os IDS das redes

UPDATE public.perspectives
SET "name"='MonitoraEA - Geral', config='{"key": "monitoraea"}'::jsonb, network_community_id=NULL, adm_community_id=NULL
WHERE id=1;
UPDATE public.perspectives
SET "name"='M&A de Iniciativas Vinculadas ao PPPZCM', config='{"key": "zcm"}'::jsonb, network_community_id=250, adm_community_id=1
WHERE id=2;
UPDATE public.perspectives
SET "name"='Comissões Interinstitucional de Educação Ambiental', config='{"key": "ciea"}'::jsonb, network_community_id=499, adm_community_id=497
WHERE id=3;
UPDATE public.perspectives
SET "name"='M&A de Políticas Públicas de Educação Ambiental', config='{"key": "ppea"}'::jsonb, network_community_id=1889, adm_community_id=1890
WHERE id=4;