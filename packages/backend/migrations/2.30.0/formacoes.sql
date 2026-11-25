-- Cursos e formações do portal (página "Fique por dentro" > "Cursos e formações").
-- Idempotente. Imagens (image/thumb) guardam a URL do arquivo no S3.

BEGIN;

DO $$ BEGIN
  CREATE TYPE public.formacao_tipo AS ENUM ('curso', 'palestra', 'oficina', 'consultoria');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.formacao_detalhe_tipo AS ENUM ('formato', 'carga', 'plataforma', 'publico', 'prazo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.formacoes (
  id SERIAL PRIMARY KEY,
  published BOOLEAN NOT NULL DEFAULT false,
  titulo VARCHAR(500) NOT NULL,
  intro VARCHAR(1000),
  image VARCHAR(500),
  thumb VARCHAR(500),
  tipo public.formacao_tipo NOT NULL,
  link VARCHAR(500),
  aberto_inscricao BOOLEAN NOT NULL DEFAULT false,
  "isEAD" BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.formacoes_detalhes (
  id SERIAL PRIMARY KEY,
  formacoes_id INTEGER NOT NULL REFERENCES public.formacoes (id) ON DELETE CASCADE,
  tipo public.formacao_detalhe_tipo NOT NULL,
  texto VARCHAR(1000) NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS formacoes_detalhes_formacoes_id_idx ON public.formacoes_detalhes (formacoes_id);

-- bases que já rodaram a versão com varchar(255)
ALTER TABLE public.formacoes ALTER COLUMN titulo TYPE VARCHAR(500);

COMMIT;
