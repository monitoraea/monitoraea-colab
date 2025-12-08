create extension fuzzystrmatch;
create extension pg_trgm;

CREATE TABLE public.organizacoes (
	id serial4 NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"deletedAt" timestamp NULL,
	"publishedAt" timestamp NULL,
	nome varchar NOT NULL,
	legacy jsonb DEFAULT '{}' NOT NULL,
	CONSTRAINT organizacoes_pk PRIMARY KEY (id)
);