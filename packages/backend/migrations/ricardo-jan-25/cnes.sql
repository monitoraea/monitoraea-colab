CREATE TABLE cne.cnes (
	id serial4 NOT NULL,
	cne_id int4 NOT NULL,
	community_id int4 NOT NULL,
	nome varchar NULL,
	"createdAt" timestamp NULL,
	"updatedAt" timestamp NULL,
	"deletedAt" timestamp NULL,
	versao varchar(10) DEFAULT 'draft'::character varying NOT NULL,
	CONSTRAINT cnes_pk PRIMARY KEY (id)
);