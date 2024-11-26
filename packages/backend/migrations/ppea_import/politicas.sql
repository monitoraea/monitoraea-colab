-- ppea.politicas definition

-- Drop table

-- DROP TABLE ppea.politicas;

CREATE TABLE ppea.politicas (
	id serial4 NOT NULL,
	politica_id int4 NOT NULL,
	legacy_id int4 NOT NULL,
	community_id int4 NOT NULL,
	enquadramento_1 int2 NULL,
	enquadramento_1_just varchar NULL,
	enquadramento_2 int2 NULL,
	enquadramento_2_just varchar NULL,
	enquadramento_3 int2 NULL,
	enquadramento_3_just varchar NULL,
	enquadramento_4 int2 NULL,
	enquadramento_4_just varchar NULL,
	instituicao_nome varchar NULL,
	instituicao_enquadramento int2 NULL,
	responsavel_nome varchar NULL,
	responsavel_cargo varchar NULL,
	responsavel_telefone varchar NULL,
	responsavel_email varchar NULL,
	nome varchar NULL,
	link varchar NULL,
	fase int2 NULL,
	fase_ano int4 NULL,
	fase_descricao text NULL,
	area int2 NULL,
	area_tematica varchar NULL,
	dificuldades _int2 NULL,
	contemplados text NULL,
	indicadores jsonb NULL,
	"createdAt" timestamp NULL,
	"updatedAt" timestamp NULL,
	"deletedAt" timestamp NULL,
	versao varchar(10) DEFAULT 'draft'::character varying NOT NULL,
	CONSTRAINT politicas_pk PRIMARY KEY (id)
);