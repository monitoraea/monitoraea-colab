CREATE TYPE porte AS ENUM ('none', 'pequeno', 'medio', 'grande');

ALTER TABLE public.instituicoes add segmentos _int4 NULL, add "porte" public.porte null;