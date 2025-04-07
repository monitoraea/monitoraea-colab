CREATE TABLE cne.cne_relacoes (
	id serial4 NOT NULL,
	cne_versao_id int4 NOT NULL,
	"data" jsonb NULL,
	CONSTRAINT cne_relacoes_pk PRIMARY KEY (id)
);