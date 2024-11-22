CREATE TABLE public.instituicoes_portal (
	id serial4 NOT NULL,
	"name" varchar NOT NULL,
	link varchar NULL,
	logo varchar NOT NULL,
	"order" int2 DEFAULT 0 NOT NULL,
	CONSTRAINT instituicoes_portal_pk PRIMARY KEY (id)
);

INSERT INTO public.instituicoes_portal
(id, "name", link, logo, "order")
VALUES(1, 'ANPPEA', NULL, 'https://zcm-content-images.s3.us-east-2.amazonaws.com/iniciativas-portal/ic-anppea.png', 0);
INSERT INTO public.instituicoes_portal
(id, "name", link, logo, "order")
VALUES(2, 'IBAMA MMA', 'https://www.ibama.gov.br/', 'https://zcm-content-images.s3.us-east-2.amazonaws.com/iniciativas-portal/ic-mma.png', 1);
INSERT INTO public.instituicoes_portal
(id, "name", link, logo, "order")
VALUES(3, 'CIEA SP', NULL, 'https://zcm-content-images.s3.us-east-2.amazonaws.com/iniciativas-portal/ic-ciea.png', 2);
INSERT INTO public.instituicoes_portal
(id, "name", link, logo, "order")
VALUES(4, 'Instituto Coral Vivo', 'https://institutocoralvivo.org.br/', 'https://zcm-content-images.s3.us-east-2.amazonaws.com/iniciativas-portal/ic-coral.png', 3);
INSERT INTO public.instituicoes_portal
(id, "name", link, logo, "order")
VALUES(5, 'ICMBio', 'https://www.icmbio.gov.br/', 'https://zcm-content-images.s3.us-east-2.amazonaws.com/iniciativas-portal/ic-icmbio.png', 4);
INSERT INTO public.instituicoes_portal
(id, "name", link, logo, "order")
VALUES(6, 'TerraMar', 'https://terramar.org.br/', 'https://zcm-content-images.s3.us-east-2.amazonaws.com/iniciativas-portal/ic-terramar.png', 5);