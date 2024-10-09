CREATE TABLE public.community_types (
	id serial4 NOT NULL,
	alias varchar NOT NULL,
	perspective_id int4 NULL,
	CONSTRAINT community_types_pk PRIMARY KEY (id),
	CONSTRAINT community_types_unique UNIQUE (alias)
);

INSERT INTO public.community_types
(id, alias, perspective_id)
VALUES(1, 'rede_zcm', 2);
INSERT INTO public.community_types
(id, alias, perspective_id)
VALUES(9, 'adm', 1);
INSERT INTO public.community_types
(id, alias, perspective_id)
VALUES(3, 'comissao', 3);
INSERT INTO public.community_types
(id, alias, perspective_id)
VALUES(4, 'facilitador', 2);
INSERT INTO public.community_types
(id, alias, perspective_id)
VALUES(6, 'projeto', 2);
INSERT INTO public.community_types
(id, alias, perspective_id)
VALUES(8, 'politica', 4);
INSERT INTO public.community_types
(id, alias, perspective_id)
VALUES(2, 'adm_ciea', 3);
INSERT INTO public.community_types
(id, alias, perspective_id)
VALUES(5, 'adm_zcm', 2);
INSERT INTO public.community_types
(id, alias, perspective_id)
VALUES(7, 'adm_ppea', 4);
INSERT INTO public.community_types
(id, alias, perspective_id)
VALUES(10, 'rede_ciea', 3);
INSERT INTO public.community_types
(id, alias, perspective_id)
VALUES(11, 'rede_ppea', 4);