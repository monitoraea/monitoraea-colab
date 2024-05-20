CREATE TABLE public.facilitators (
	id serial NOT NULL,
	"userId" int NULL,
	"name" varchar NOT NULL,
	email varchar NULL,
	photo varchar NULL,
	institution varchar NULL,
	state varchar(2) NULL,
	territory_group varchar NULL,
	stamp timestamp NULL,
	CONSTRAINT facilitators_pk PRIMARY KEY (id)
);

ALTER TABLE public.facilitators ADD intro text NULL;
ALTER TABLE public.facilitators ADD "createdAt" timestamp NOT NULL;
ALTER TABLE public.facilitators ADD "updatedAt" timestamp NOT NULL;
ALTER TABLE public.facilitators ADD "deletedAt" timestamp NULL;
