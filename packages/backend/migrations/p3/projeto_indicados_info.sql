CREATE TABLE public.projetos_indicados_info (
	id serial4 NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	projeto_indicado_id int4 NOT NULL,
    contact_name varchar NULL,
    contact_email varchar NULL,
    contact_phone varchar NULL,
    website varchar NULL,
	CONSTRAINT projetos_projetos_indicados_info_pk PRIMARY KEY (id)
);