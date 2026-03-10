-- ALTERAR PARA PRODUCAO
-- pg_dump --verbose -O --format=C -h localhost -U ricardo --password -d monitoraea_refac -n ciea  -f MONITORAEA_LOCAL_CIEA.2026.03.10.dump

---------------------------- COMISSOES
ALTER TABLE ciea.comissoes ADD iniciativa_id int4 NULL;
CREATE INDEX comissoes_iniciativa_id_idx ON ciea.comissoes (iniciativa_id);

update ciea.comissoes c 
set iniciativa_id = c.id 
where true

ALTER TABLE ciea.comissoes ALTER COLUMN iniciativa_id SET NOT NULL;

INSERT INTO ciea.comissoes
(community_id, uf, versao, link, logo_arquivo, data_criacao, documento_criacao, documento_criacao_arquivo, ativo, composicao_cadeiras_set_pub, composicao_cadeiras_soc_civ, composicao_cadeiras_outros, coordenacao, coordenacao_especifique, membros, regimento_interno, regimento_interno_arquivo, org_interna_periodicidade, organizacao_interna_periodicidade_especifique, organizacao_interna_estrutura_especifique, ppea_decreto, ppea_lei, ppea_arquivo, "createdAt", "updatedAt", "deletedAt", organizacao_interna_estrutura_tem, ppea_tem, regimento_interno_tem, ppea2_tem, ppea2_decreto, ppea2_lei, ppea2_arquivo, programa_estadual_tem, programa_estadual_decreto, programa_estadual_lei, programa_estadual_arquivo, plano_estadual_tem, plano_estadual_decreto, plano_estadual_lei, plano_estadual_arquivo, instituicao_id, indicadores, tipo_colegiado, tipo_colegiado_outro, nivel_atuacao, nivel_atuacao_outro, coordenacao_quem, ppea_outra_tem, ppea_outra_decreto, ppea_outra_lei, ppea_outra_arquivo, iniciativa_id)
SELECT community_id, uf, 'current' as versao, link, logo_arquivo, data_criacao, documento_criacao, documento_criacao_arquivo, ativo, composicao_cadeiras_set_pub, composicao_cadeiras_soc_civ, composicao_cadeiras_outros, coordenacao, coordenacao_especifique, membros, regimento_interno, regimento_interno_arquivo, org_interna_periodicidade, organizacao_interna_periodicidade_especifique, organizacao_interna_estrutura_especifique, ppea_decreto, ppea_lei, ppea_arquivo, "createdAt", "updatedAt", "deletedAt", organizacao_interna_estrutura_tem, ppea_tem, regimento_interno_tem, ppea2_tem, ppea2_decreto, ppea2_lei, ppea2_arquivo, programa_estadual_tem, programa_estadual_decreto, programa_estadual_lei, programa_estadual_arquivo, plano_estadual_tem, plano_estadual_decreto, plano_estadual_lei, plano_estadual_arquivo, instituicao_id, indicadores, tipo_colegiado, tipo_colegiado_outro, nivel_atuacao, nivel_atuacao_outro, coordenacao_quem, ppea_outra_tem, ppea_outra_decreto, ppea_outra_lei, ppea_outra_arquivo, iniciativa_id
FROM ciea.comissoes;
----------------------------

---------------------------- LINHA DO TEMPO
ALTER TABLE ciea.linhas_do_tempo RENAME COLUMN comissao_id TO iniciativa_versao_id;

INSERT INTO ciea.linhas_do_tempo
(iniciativa_versao_id, "date", texto, timeline_arquivo, ordem, "createdAt", "updatedAt")
with current_version as (
	select c2.id, c2.iniciativa_id 
	from ciea.comissoes c
	inner join ciea.comissoes c2 on c2.iniciativa_id = c.iniciativa_id and c2.versao = 'current'
	where c.versao = 'draft' 
	order by c.iniciativa_id 
)
SELECT cv.id as iniciativa_versao_id, 
-- clt.iniciativa_versao_id as iniciativa_versao_id_old, 
clt."date", clt.texto, clt.timeline_arquivo, clt.ordem, clt."createdAt", clt."updatedAt"
FROM ciea.linhas_do_tempo clt
inner join current_version cv on cv.iniciativa_id = clt.iniciativa_versao_id 

DROP INDEX ciea.comissoes_uf_idx;

ALTER TABLE ciea.comissoes ADD nome varchar NULL;

UPDATE ciea.comissoes c
SET nome = CONCAT('CIEA - ', u.nm_estado)
FROM ufs u
WHERE c.uf = u.id;