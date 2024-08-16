ALTER TABLE ciea.comissoes DROP COLUMN organizacao_interna_estrutura_tem;
ALTER TABLE ciea.comissoes ADD organizacao_interna_estrutura_tem bool NULL;

ALTER TABLE ciea.comissoes ADD COLUMN ppea_tem_bool bool NULL;

update ciea.comissoes set ppea_tem_bool = (ppea_tem = 1);

ALTER TABLE ciea.comissoes DROP COLUMN ppea_tem;

ALTER TABLE ciea.comissoes RENAME COLUMN ppea_tem_bool TO ppea_tem;