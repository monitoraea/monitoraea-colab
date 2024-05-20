CREATE TABLE public.segmentos (
	id serial4 NOT NULL,
	nome text NOT NULL,
	CONSTRAINT segmentos_pk PRIMARY KEY (id)
);

INSERT INTO public.segmentos
(id, nome)
VALUES(1, 'Segmento 1');

INSERT INTO public.segmentos
(id, nome)
VALUES(2, 'Segmento 2');
