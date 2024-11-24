CREATE TABLE public.na_midia (
	id serial4 NOT NULL,
    "publishedAt" timestamp NULL,
	"text" text NULL,
	thumb varchar NOT NULL,
	CONSTRAINT na_midia_pk PRIMARY KEY (id)
);

INSERT INTO public.na_midia
(id, "publishedAt", "text", thumb)
VALUES(2, '2024-10-24 00:00:00.000', '[SEDUC-PA] Projetos finalistas da CYC serão nacionalmente divulgados  em plataforma', 'https://zcm-content-images.s3.us-east-2.amazonaws.com/na-midia/happy_1.jpg');
INSERT INTO public.na_midia
(id, "publishedAt", "text", thumb)
VALUES(3, '2024-10-16 00:00:00.000', '[Agência de notícias -AC] Equipe do Acre participa da Oficina de Formação e Construção de Indicadores da Educação Ambiental em Belém – PA', 'https://zcm-content-images.s3.us-east-2.amazonaws.com/na-midia/happy_2.jpg');
INSERT INTO public.na_midia
(id, "publishedAt", "text", thumb)
VALUES(4, '2024-08-22 00:00:00.000', '[IBAMA] Ibama participa de Oficina de Monitoramento e Avaliação de Políticas Públicas de Educação Ambiental', 'https://zcm-content-images.s3.us-east-2.amazonaws.com/na-midia/happy_3.jpg');

