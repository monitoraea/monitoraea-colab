CREATE TABLE public.files (
	id serial4 NOT NULL,
	file_name varchar(255) NOT NULL,
	description text NULL,
	content_type varchar(25) NOT NULL,
	"createdAt" timestamp NOT NULL DEFAULT now(),
	"updatedAt" timestamp NOT NULL DEFAULT now(),
	tags _char NULL,
	url varchar NOT NULL,
	file_size int4 NULL,
	legacy_id int4 NULL,
	origin varchar(50) NULL,
	document_type varchar(50) NULL,
	send_date timestamptz NULL
);
CREATE UNIQUE INDEX files_id_idx ON public.files USING btree (id);
CREATE INDEX files_name_idx ON public.files USING btree (file_name, description, content_type, tags);