CREATE TABLE public.perspectives (
	id serial4 NOT NULL,
	"name" varchar NOT NULL,
	config jsonb NOT NULL,
	CONSTRAINT perspectives_pk PRIMARY KEY (id)
);

INSERT INTO public.perspectives
(id, "name", config)
VALUES(1, 'Geral', '{"key": "monitoraea"}'::jsonb);
INSERT INTO public.perspectives
(id, "name", config)
VALUES(2, 'PPPZCM', '{"key": "zcm"}'::jsonb);
INSERT INTO public.perspectives
(id, "name", config)
VALUES(3, 'CIEA', '{"key": "ciea"}'::jsonb);