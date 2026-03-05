ALTER TABLE public.dorothy_community_recipes ADD "deletedAt" timestamp NULL;

ALTER TABLE public.dorothy_community_recipes ADD creatable bool NOT NULL DEFAULT true;

ALTER TABLE public.dorothy_community_recipes ADD alias varchar NULL;
