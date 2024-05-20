CREATE TABLE public.contents_tags (
	id serial4 NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"deletedAt" timestamp NULL,
    title varchar NOT NULL,
	CONSTRAINT contents_tags_pk PRIMARY KEY (id)
);