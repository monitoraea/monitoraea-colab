CREATE TABLE public.community_types (
	id serial4 NOT NULL,
	alias varchar NOT NULL,
	network_community_id int4 NULL,
	adm_community_id int4 NULL,
	CONSTRAINT community_types_pk PRIMARY KEY (id),
	CONSTRAINT community_types_unique UNIQUE (alias)
);

-- TODO: ATENCAO: conferir os IDS das redes
INSERT INTO public.community_types (alias,network_community_id,adm_community_id) VALUES
	 ('rede',NULL,NULL),
	 ('adm_ciea',499,NULL),
	 ('adm_zcm',250,NULL),
	 ('adm',NULL,NULL),
	 ('comissao',499,497),
	 ('facilitador',250,1),
	 ('projeto',250,1),
	 ('adm_ppea',1889,NULL),
	 ('politica',1889,1890);