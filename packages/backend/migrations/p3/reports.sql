CREATE TABLE public.reports (
	id serial4 NOT NULL,
	"version" int2 NOT NULL,
	"content" jsonb NOT NULL,
	"type" char(20) NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT reports_pk PRIMARY KEY (id)
);
