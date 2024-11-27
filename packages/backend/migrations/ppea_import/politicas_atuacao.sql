CREATE TABLE ppea.politicas_atuacao (
	id serial4 NOT NULL,
	politica_versao_id int4 NOT NULL,
	geom public.geometry NOT NULL,
	CONSTRAINT politicas_atuacao_pk PRIMARY KEY (id)
);
CREATE INDEX politicas_atuacao_politica_versao_id_idx ON ppea.politicas_atuacao (politica_versao_id);