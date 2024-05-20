CREATE TABLE public.projetos_indicados (
	id serial4 NOT NULL,
	"projeto_id" int4 NULL,
	"name" varchar NOT NULL,
	instituicao_id int4 NULL,	
	CONSTRAINT projetos_indicados_pk PRIMARY KEY (id)
);