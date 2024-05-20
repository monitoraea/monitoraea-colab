CREATE TYPE menu_type AS ENUM ('none', 'page', 'link');

CREATE TABLE public.menu (
	id serial4 NOT NULL,
	title varchar NULL,
	link text NULL,
	content_id int4 NULL,
	menu_parent_id int4 NULL,
	"type" public."menu_type" NOT NULL DEFAULT 'link'::menu_type,
	"createdAt" timestamp NULL DEFAULT now(),
	"updatedAt" timestamp NULL DEFAULT now(),
	"deletedAt" timestamp NULL,
	blank bool NOT NULL DEFAULT false,
	"order" int2 NOT NULL DEFAULT 0,
	CONSTRAINT menu_pkey PRIMARY KEY (id)
);

INSERT INTO public.menu
(id, title, link, content_id, menu_parent_id, "type", "createdAt", "updatedAt", "deletedAt", blank, "order")
VALUES(17, 'sobre', '', 15, NULL, 'page'::public."menu_type", '2023-04-21 07:59:16.202', '2023-04-21 07:59:16.202', NULL, false, 0);
INSERT INTO public.menu
(id, title, link, content_id, menu_parent_id, "type", "createdAt", "updatedAt", "deletedAt", blank, "order")
VALUES(2, 'facilitadores', '/facilitadores', NULL, NULL, 'link'::public."menu_type", '2023-03-20 19:19:44.436', '2023-03-20 19:19:44.436', NULL, false, 1);
INSERT INTO public.menu
(id, title, link, content_id, menu_parent_id, "type", "createdAt", "updatedAt", "deletedAt", blank, "order")
VALUES(3, 'notícias', '#news', NULL, NULL, 'link'::public."menu_type", '2023-03-20 19:20:15.931', '2023-03-20 19:20:15.931', NULL, false, 2);
INSERT INTO public.menu
(id, title, link, content_id, menu_parent_id, "type", "createdAt", "updatedAt", "deletedAt", blank, "order")
VALUES(5, 'projetos', '#homeDash', NULL, NULL, 'link'::public."menu_type", '2023-03-20 21:05:01.421', '2023-03-20 21:05:01.421', NULL, false, 3);


