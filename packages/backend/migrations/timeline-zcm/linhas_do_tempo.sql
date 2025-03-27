CREATE TABLE public.linhas_do_tempo (
  id serial4 NOT NULL,
  projeto_id int4 NOT NULL,
  "date" varchar NOT NULL,
  texto text NULL,
  timeline_arquivo int4 NULL,
  ordem int2 DEFAULT 0 NOT NULL,
  "createdAt" timestamp NOT NULL,
  "updatedAt" timestamp NOT NULL,
  CONSTRAINT cne_linhas_do_tempo_pk PRIMARY KEY (id)
);
