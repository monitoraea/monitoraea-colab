-- DROP SCHEMA ciea;

CREATE SCHEMA ciea AUTHORIZATION ricardo;
-- ciea.comissoes definition

-- Drop table

-- DROP TABLE ciea.comissoes;

CREATE TABLE ciea.comissoes (
	id serial4 NOT NULL,
	community_id int4 NOT NULL,
	uf int4 NOT NULL,
	versao varchar(10) DEFAULT 'draft'::character varying NOT NULL,
	link varchar NULL,
	logo_arquivo int4 NULL,
	data_criacao int4 NULL,
	documento_criacao text NULL,
	documento_criacao_arquivo int4 NULL,
	ativo int2 NULL,
	composicao_cadeiras_set_pub int4 NULL,
	composicao_cadeiras_soc_civ int4 NULL,
	composicao_cadeiras_outros jsonb NULL,
	coordenacao int2 NULL,
	coordenacao_especifique varchar NULL,
	membros jsonb NULL,
	regimento_interno varchar NULL,
	regimento_interno_arquivo int4 NULL,
	org_interna_periodicidade int2 NULL,
	organizacao_interna_periodicidade_especifique text NULL,
	organizacao_interna_estrutura_tem int2 NULL,
	organizacao_interna_estrutura_especifique text NULL,
	ppea_tem int2 NULL,
	ppea_decreto varchar NULL,
	ppea_lei varchar NULL,
	ppea_arquivo int4 NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NULL,
	CONSTRAINT comissoes_pk PRIMARY KEY (id)
);
CREATE UNIQUE INDEX comissoes_uf_idx ON ciea.comissoes USING btree (uf, versao);

ALTER TABLE ciea.comissoes ADD "deletedAt" timestamp NULL;