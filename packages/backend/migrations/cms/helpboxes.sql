CREATE TYPE helpbox_type AS ENUM ('info', 'redes', 'indic');

CREATE TABLE public.helpboxes (
  id serial4 NOT NULL,
  "createdAt" timestamp NOT NULL,
  "updatedAt" timestamp NOT NULL,
  "deletedAt" timestamp NULL,
  "type" helpbox_type NOT NULL,
  "key_ref" varchar NOT NULL,
  content_id int4 NULL,
  CONSTRAINT helpboxes_pkey PRIMARY KEY (id),
  CONSTRAINT unique_content_id UNIQUE (content_id)
);