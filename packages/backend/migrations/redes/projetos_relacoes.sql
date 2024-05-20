CREATE TABLE public.projetos_relacoes (
	id serial4 NOT NULL,
	"projeto_rascunho_id" int4 NOT null,
	"data" jsonb,
	CONSTRAINT projetos_relacoes_pk PRIMARY KEY (id)
);