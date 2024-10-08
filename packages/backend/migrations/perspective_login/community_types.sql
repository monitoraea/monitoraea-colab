CREATE TABLE public.community_types (
	id serial4 NOT NULL,
	alias varchar NOT NULL,
	network_community_id int4 NULL,
	CONSTRAINT community_types_pk PRIMARY KEY (id),
	CONSTRAINT community_types_unique UNIQUE (alias)
);

-- TODO: ATENCAO: conferir os IDS das redes
INSERT INTO public.community_types (alias,network_community_id) VALUES
	 ('rede',NULL),
	 ('adm_ciea',499),
	 ('comissao',499),
	 ('facilitador',250),
	 ('adm_zcm',250),
	 ('projeto',250),
	 ('adm_ppea',1889),
	 ('politica',1889),
	 ('adm',NULL);
