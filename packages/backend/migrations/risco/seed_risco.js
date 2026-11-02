/*
 * Carga (ou recarga) dos dados do painel de risco climático em água.
 *
 *   node migrations/risco/seed_risco.js <pasta>
 *
 * A pasta traz os três arquivos do painel: dados.json ({m, v, nb}), malha.json (TopoJSON) e meta.json ({indicadores, temas}).
 * Cria as tabelas (risco.tables.sql, idempotente) e roda em uma transação: apaga os dados do schema `risco` e insere de novo.
 * Pode ser repetido para recarregar os dados.
 * Usa DATABASE_URL (e NO_DATABASE_SSL=1 para banco sem SSL), como o resto do backend.
 */
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const CHUNK = 50000;

async function main() {
  const dir = process.argv[2];
  if (!dir) throw new Error('Uso: node migrations/risco/seed_risco.js <pasta com dados.json, malha.json e meta.json>');

  const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
  const dados = JSON.parse(read('dados.json'));
  const meta = JSON.parse(read('meta.json'));
  const malha = read('malha.json');
  JSON.parse(malha); // valida

  const { m, v, nb } = dados;
  const cols = Object.keys(v).map((k) => +k.slice(1)).sort((a, b) => a - b);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NO_DATABASE_SSL == 1 ? false : { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await client.query(fs.readFileSync(path.join(__dirname, 'risco.tables.sql'), 'utf8'));
    await client.query('BEGIN');
    await client.query('TRUNCATE risco.vizinhos, risco.valores, risco.indicadores, risco.municipios, risco.temas, risco.malha');

    await client.query(
      'INSERT INTO risco.municipios (cd_mun, pos, nome, uf) SELECT * FROM unnest($1::char(7)[], $2::integer[], $3::text[], $4::char(2)[])',
      [m.map((x) => x[0]), m.map((x, i) => i), m.map((x) => x[1]), m.map((x) => x[2])],
    );

    await client.query(
      'INSERT INTO risco.indicadores (col, meta) SELECT * FROM unnest($1::smallint[], $2::jsonb[])',
      [cols, cols.map((c) => JSON.stringify((meta.indicadores || {})[`c${c}`] || {}))],
    );

    // valores: -1 = sem dado, não vira linha
    const vm = []; const vc = []; const vv = [];
    cols.forEach((c) => v[`c${c}`].forEach((val, i) => { if (val >= 0) { vm.push(m[i][0]); vc.push(c); vv.push(val); } }));
    for (let i = 0; i < vm.length; i += CHUNK) {
      await client.query(
        'INSERT INTO risco.valores (cd_mun, col, valor) SELECT * FROM unnest($1::char(7)[], $2::smallint[], $3::smallint[])',
        [vm.slice(i, i + CHUNK), vc.slice(i, i + CHUNK), vv.slice(i, i + CHUNK)],
      );
    }

    const nm = []; const no = []; const nv = [];
    nb.forEach((lst, i) => lst.forEach((j, k) => { nm.push(m[i][0]); no.push(k); nv.push(m[j][0]); }));
    await client.query(
      'INSERT INTO risco.vizinhos (cd_mun, ord, vizinho) SELECT * FROM unnest($1::char(7)[], $2::smallint[], $3::char(7)[])',
      [nm, no, nv],
    );

    const temas = Object.entries(meta.temas || {});
    if (temas.length) {
      await client.query(
        'INSERT INTO risco.temas (nome, descricao) SELECT * FROM unnest($1::text[], $2::text[])',
        [temas.map((t) => t[0]), temas.map((t) => t[1])],
      );
    }

    await client.query('INSERT INTO risco.malha (id, topojson) VALUES (1, $1::json)', [malha]);

    await client.query('COMMIT');
    console.log(`OK: ${m.length} municípios, ${cols.length} indicadores, ${vm.length} valores, ${nm.length} vizinhanças, ${temas.length} temas.`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
