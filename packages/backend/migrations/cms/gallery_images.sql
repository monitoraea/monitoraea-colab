CREATE TABLE public.gallery_images (
	id serial4 NOT NULL,
	file_id int4 NOT NULL,
	"createdAt" timestamp NOT NULL DEFAULT NOW(),
	"updatedAt" timestamp NOT NULL DEFAULT NOW(),
	CONSTRAINT gallery_images_pkey PRIMARY KEY (id)
);