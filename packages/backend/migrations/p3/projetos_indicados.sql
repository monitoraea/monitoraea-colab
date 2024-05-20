ALTER TABLE projetos_indicados 
ADD COLUMN "createdAt" timestamp NOT NULL DEFAULT NOW(),
ADD COLUMN "updatedAt" timestamp NOT NULL DEFAULT NOW();