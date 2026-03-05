CREATE TYPE following_type AS ENUM ('alert-only', 'single-email', 'daily-email');

alter table dorothy_following add column "type" following_type not null default 'single-email'