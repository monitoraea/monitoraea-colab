ALTER TABLE ciea.comissoes ADD indicadores jsonb NULL;

ALTER TABLE ciea.comissoes ALTER COLUMN indicadores SET DEFAULT '{}'::jsonb;

update ciea.comissoes set indicadores = '{}'

ALTER TABLE ciea.comissoes ALTER COLUMN indicadores SET NOT NULL;
