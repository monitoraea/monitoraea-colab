CREATE TABLE ciea.linhas_do_tempo (
	id serial4 NOT NULL,
	comissao_id int4 NOT NULL,
	"date" varchar NOT NULL,
	texto text NULL,
	file int4 NULL,
	ordem int2 DEFAULT 0 NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT linhas_do_tempo_pk PRIMARY KEY (id)
);