CREATE TYPE situacao_desenvolvimento AS ENUM ('none','nao_iniciada', 'em_desenvolvimento', 'finalizada', 'interrompida');

ALTER TABLE public.projetos_rascunho ADD ufs _int4 NULL;
ALTER TABLE public.projetos_rascunho ADD "status_desenvolvimento" public.situacao_desenvolvimento NULL;
ALTER TABLE public.projetos_rascunho ADD mes_inicio timestamp NULL;
ALTER TABLE public.projetos_rascunho ADD mes_fim timestamp NULL;