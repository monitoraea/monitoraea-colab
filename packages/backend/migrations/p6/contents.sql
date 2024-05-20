ALTER TYPE content_type ADD VALUE 'learning';
ALTER TYPE content_type ADD VALUE 'publication';
ALTER TYPE content_type ADD VALUE 'faq';

CREATE TYPE portals AS ENUM ('main','monitoraea','pp','pppzcm', 'anppea');

ALTER TABLE contents ADD COLUMN portal portals;

update contents set portal = 'pppzcm' where portal is null;

ALTER TABLE contents ALTER COLUMN portal SET NOT NULL;

ALTER TABLE public.contents ADD "level" int NOT NULL DEFAULT 0;