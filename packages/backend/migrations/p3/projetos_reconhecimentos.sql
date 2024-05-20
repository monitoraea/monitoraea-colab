CREATE TYPE support_type AS ENUM ('apoia', 'apoiada');

CREATE TABLE public.projetos_reconhecimentos (
	id serial4 NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	projeto_rascunho_id int4 NOT NULL,
	projeto_indicado_id int4 NOT NULL,
    type_of_support support_type NOT NULL,
	agreement bool NOT NULL,
	CONSTRAINT projetos_reconhecimentos_pk PRIMARY KEY (id)
);