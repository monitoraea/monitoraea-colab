ALTER TABLE public.contents ADD "publishedAt" timestamp NULL;

UPDATE contents SET "publishedAt" = "createdAt" WHERE published = true;  