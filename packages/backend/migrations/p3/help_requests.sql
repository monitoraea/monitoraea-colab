CREATE TABLE public.help_requests (
	id serial4 NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"closedAt" timestamp NULL,
    community_id int4 NULL,
    tab varchar NOT NULL,
	"text" text NOT NULL,
	CONSTRAINT help_requests_pk PRIMARY KEY (id)
);