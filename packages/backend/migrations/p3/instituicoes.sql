ALTER TABLE instituicoes 
ADD COLUMN "createdAt" timestamp NOT NULL DEFAULT NOW(),
ADD COLUMN "updatedAt" timestamp NOT NULL DEFAULT NOW();

update instituicoes 
set "createdAt" = '2022-12-31'
where "createdAt" is not null