CREATE TABLE public.user_files (
	id serial4 NOT NULL,
	user_id int4 NOT NULL,
	title varchar NOT NULL,
	url varchar NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"deletedAt" timestamp NULL,
	CONSTRAINT user_files_pk PRIMARY KEY (id)
);
CREATE INDEX user_files_user_id_idx ON public.user_files (user_id);