CREATE TABLE contents_categories (
	id serial4 NOT NULL,
	"createdAt" timestamp NOT NULL DEFAULT NOW(),
	"updatedAt" timestamp NOT NULL DEFAULT NOW(),
	"deletedAt" timestamp NULL,
	title varchar NOT NULL,
	CONSTRAINT contents_categories_pk PRIMARY KEY (id)
);

INSERT INTO
	public.contents_categories ("createdAt", "updatedAt", "deletedAt", title)
VALUES
(
		'2023-03-23 11:47:45.078',
		'2023-03-23 11:47:45.078',
		NULL,
		'noticias'
	);