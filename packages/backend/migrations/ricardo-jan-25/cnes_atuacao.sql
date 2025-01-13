CREATE TABLE cne.cnes_atuacao (
	id serial4 NOT NULL,
	cne_versao_id int4 NOT NULL,
	geom public.geometry NOT NULL,
	CONSTRAINT cnes_atuacao_pk PRIMARY KEY (id)
);
CREATE INDEX cnes_atuacao_cne_versao_id_idx ON cne.cnes_atuacao USING btree (cne_versao_id);