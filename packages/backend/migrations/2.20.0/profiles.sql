CREATE TABLE public.profiles (
	id serial4 NOT NULL,
	user_id int4 NOT NULL,
	identifier varchar NULL,
	apresentacao text NULL,
	areas_interesse _int2 NULL,
	contatos jsonb NULL,
	links jsonb NULL,
	CONSTRAINT profiles_pk PRIMARY KEY (id),
	CONSTRAINT profiles_unique UNIQUE (user_id)
);