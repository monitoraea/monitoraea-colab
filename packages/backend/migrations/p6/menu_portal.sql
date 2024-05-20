CREATE TABLE public.menu_portal (
	id serial4 NOT NULL,
	title varchar NULL,
	link text NULL,
	content_id int4 NULL,
	parent_id int4 NULL,
	"type" public."menu_type" NOT NULL DEFAULT 'link'::menu_type,
	"createdAt" timestamp NULL DEFAULT now(),
	"updatedAt" timestamp NULL DEFAULT now(),
	"deletedAt" timestamp NULL,
	"order" int2 NOT NULL DEFAULT 0,
	CONSTRAINT menu_portal_pkey PRIMARY KEY (id)
);
ALTER TABLE public.menu_portal ADD blank bool NOT NULL DEFAULT false;

INSERT INTO public.menu_portal
(id, title, link, content_id, parent_id, "type", "createdAt", "updatedAt", "deletedAt", "order")
VALUES(1, 'Sobre', '/sobre', NULL, NULL, 'link'::public."menu_type", '2023-11-23 11:09:11.431', '2023-11-23 11:09:11.432', NULL, 0);
INSERT INTO public.menu_portal
(id, title, link, content_id, parent_id, "type", "createdAt", "updatedAt", "deletedAt", "order")
VALUES(2, 'PPEA', '/sobre/ppea', NULL, 1, 'link'::public."menu_type", '2023-11-23 11:09:52.503', '2023-11-23 11:09:52.503', NULL, 0);
INSERT INTO public.menu_portal
(id, title, link, content_id, parent_id, "type", "createdAt", "updatedAt", "deletedAt", "order")
VALUES(3, 'PPZCM', '/sobre/pppzcm', NULL, 1, 'link'::public."menu_type", '2023-11-23 11:09:52.503', '2023-11-23 11:09:52.503', NULL, 0);
INSERT INTO public.menu_portal
(id, title, link, content_id, parent_id, "type", "createdAt", "updatedAt", "deletedAt", "order")
VALUES(4, 'Novidades', '/novidades/news', NULL, NULL, 'link'::public."menu_type", '2023-11-23 11:09:52.503', '2023-11-23 11:09:52.503', NULL, 1);