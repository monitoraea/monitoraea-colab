CREATE TABLE public.publicos (
	id int4 NOT NULL,
	nome varchar(100) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT publicos_pk PRIMARY KEY (id)
);

INSERT INTO public.publicos
(id, nome, "createdAt", "updatedAt")
VALUES(1, 'Crianças - até 15 anos', '2025-03-10 11:30:24.330', '2025-03-10 11:30:24.330');
INSERT INTO public.publicos
(id, nome, "createdAt", "updatedAt")
VALUES(2, 'Jovens - Entre 15 e 29 anos', '2025-03-10 11:30:24.330', '2025-03-10 11:30:24.330');
INSERT INTO public.publicos
(id, nome, "createdAt", "updatedAt")
VALUES(3, 'Educadores', '2025-03-10 11:30:24.330', '2025-03-10 11:30:24.330');
INSERT INTO public.publicos
(id, nome, "createdAt", "updatedAt")
VALUES(4, 'Gestores', '2025-03-10 11:30:24.330', '2025-03-10 11:30:24.330');
INSERT INTO public.publicos
(id, nome, "createdAt", "updatedAt")
VALUES(5, 'Sociedade Civil', '2025-03-10 11:30:24.330', '2025-03-10 11:30:24.330');
INSERT INTO public.publicos
(id, nome, "createdAt", "updatedAt")
VALUES(6, 'Turistas', '2025-03-10 11:30:24.330', '2025-03-10 11:30:24.330');
INSERT INTO public.publicos
(id, nome, "createdAt", "updatedAt")
VALUES(7, 'Comunidade escolar', '2025-03-10 11:30:24.330', '2025-03-10 11:30:24.330');
INSERT INTO public.publicos
(id, nome, "createdAt", "updatedAt")
VALUES(8, 'Comunidade local', '2025-03-10 11:30:24.330', '2025-03-10 11:30:24.330');
INSERT INTO public.publicos
(id, nome, "createdAt", "updatedAt")
VALUES(9, 'Comunidades tradicionais', '2025-03-10 11:30:24.330', '2025-03-10 11:30:24.330');