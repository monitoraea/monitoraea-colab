DROP VIEW public.educom_w_region;

TRUNCATE TABLE educom_clima.iniciativas;

ALTER TABLE educom_clima.iniciativas ALTER COLUMN temas TYPE _int2 USING temas::_int2;
ALTER TABLE educom_clima.iniciativas ALTER COLUMN midias TYPE _int2 USING midias::_int2;
ALTER TABLE educom_clima.iniciativas ALTER COLUMN estrategias_educativas TYPE _int2 USING estrategias_educativas::_int2;
ALTER TABLE educom_clima.iniciativas DROP COLUMN acao_enfrentamento;

CREATE OR REPLACE VIEW public.educom_w_region
AS SELECT p.id,
    p.iniciativa_id,
    p.versao,
    p."createdAt",
    p."updatedAt" AS "updateddAt",
    p."deletedAt",
    p.email,
    p.nome,
    p.uf,
    p.definicao,
    p.faixa_etaria,
    p.participantes_genero,
    p.racas_etnias,
    p.temas,
    p.midias,
    p.estrategias_educativas,
    p.noticia_falsa_recebeu,
    p.noticia_falsa_exemplo,
    p.aborda_desinformacao,
    p.aborda_desinformacao_exemplo,
    p.apresentacao,
    p.materiais_didaticos,
    p.redes_sociais,
    p.conte_mais,
    p.nivel,
    array_agg(DISTINCT u.nm_regia::text) AS regions
   FROM educom_clima.iniciativas p
     LEFT JOIN br_uf u ON u.cd_uf::text = ANY (p.uf::text[])
  GROUP BY p.id;

  -- RODAR SCRIPT DE MIGRACAO!