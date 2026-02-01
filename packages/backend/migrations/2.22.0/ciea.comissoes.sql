ALTER TABLE ciea.comissoes ADD tipo_colegiado int2 NULL;

ALTER TABLE ciea.comissoes ADD tipo_colegiado_outro varchar NULL;

ALTER TABLE ciea.comissoes ADD nivel_atuacao int2 NULL;

ALTER TABLE ciea.comissoes ADD nivel_atuacao_outro varchar NULL;

ALTER TABLE ciea.comissoes ADD coordenacao_quem jsonb NULL;

ALTER TABLE ciea.comissoes ADD ppea_outra_tem bool NULL;

ALTER TABLE ciea.comissoes ADD ppea_outra_decreto varchar NULL;

ALTER TABLE ciea.comissoes ADD ppea_outra_lei varchar NULL;

ALTER TABLE ciea.comissoes ADD ppea_outra_arquivo int4 NULL;

update ciea.comissoes c set tipo_colegiado = 2 where tipo_colegiado is null;