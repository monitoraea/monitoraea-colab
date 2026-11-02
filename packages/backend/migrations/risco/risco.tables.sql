-- Painel "Risco climático em água": dados servidos em /risco/dados, /risco/malha e /risco/meta.
-- Carga inicial: `node migrations/risco/seed_risco.js <pasta com dados.json, malha.json e meta.json>`.
-- (A migração `contents.sql` desta pasta, que adiciona 'risco' ao enum portals, é independente.)

CREATE SCHEMA IF NOT EXISTS risco;

-- Municípios do painel. `pos` (0, 1, 2...) define a ordem e os índices usados em "dados" (m, v, nb).
CREATE TABLE IF NOT EXISTS risco.municipios (
  cd_mun char(7) PRIMARY KEY,
  pos integer NOT NULL UNIQUE,
  nome text NOT NULL,
  uf char(2) NOT NULL
);

-- Um indicador por coluna do painel (c6..c56); `meta` reúne nome, unidade, fonte, descrição etc. (Caderno de Indicadores).
CREATE TABLE IF NOT EXISTS risco.indicadores (
  col smallint PRIMARY KEY,
  meta jsonb NOT NULL DEFAULT '{}'
);

-- Valor normalizado do indicador no município, de 0 a 10000. Sem linha = sem dado (o painel recebe -1).
CREATE TABLE IF NOT EXISTS risco.valores (
  cd_mun char(7) NOT NULL REFERENCES risco.municipios (cd_mun),
  col smallint NOT NULL REFERENCES risco.indicadores (col),
  valor smallint NOT NULL CHECK (valor BETWEEN 0 AND 10000),
  PRIMARY KEY (cd_mun, col)
);

-- Municípios vizinhos (jornada da EA), na ordem em que o painel os recebe.
CREATE TABLE IF NOT EXISTS risco.vizinhos (
  cd_mun char(7) NOT NULL REFERENCES risco.municipios (cd_mun),
  ord smallint NOT NULL,
  vizinho char(7) NOT NULL REFERENCES risco.municipios (cd_mun),
  PRIMARY KEY (cd_mun, ord)
);

-- Descrição dos temas do fluxograma, por nome.
CREATE TABLE IF NOT EXISTS risco.temas (
  nome text PRIMARY KEY,
  descricao text NOT NULL
);

-- Malha municipal (TopoJSON, IBGE 2010 simplificada) tal como o painel a consome. Uma única linha; `json` (e não jsonb) guarda o texto como veio, sem reformatar.
CREATE TABLE IF NOT EXISTS risco.malha (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  topojson json NOT NULL
);
