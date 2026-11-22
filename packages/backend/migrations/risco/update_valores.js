/*
 * Atualização dos valores dos indicadores do painel de risco climático (sem recarregar o resto do schema `risco`).
 *
 *   python3 migrations/risco/xlsx_to_valores.py <planilha.xlsx> valores.json
 *   node migrations/risco/update_valores.js valores.json [--dry-run]
 *
 * valores.json: { m: [cd_mun], v: { cN: [valor 0-10000 ou -1] } } (ordem de m).
 * - Exige que m seja idêntico a risco.municipios (mesmos códigos, mesma ordem).
 * - Para cada cN do arquivo, apaga e reinsere risco.valores daquele indicador (-1 = sem linha).
 * - c53 passa a ser "População total" (EX_PO_2_2): só o nome do indicador é atualizado; o restante da ficha continua o
 *   que já havia (nunca teve texto do Caderno).
 * - c54 (usuários urbanos expostos) deixa de existir: remove seus valores e o indicador; o tema "Usuários rurais e urbanos
 *   expostos" sai de risco.temas e a descrição de "População exposta" passa a citar a população total.
 * - Tudo em uma transação; --dry-run mostra o resumo e desfaz. Antes de gravar, salva uma cópia dos valores e das
 *   fichas afetados em <valores.json>.backup-<data>.json.
 * Usa DATABASE_URL (e NO_DATABASE_SSL=1 para banco sem SSL), como o resto do backend.
 * Depois: POST /risco/cache/clear (token de administrador) ou reiniciar o serviço.
 */
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const { Client } = require('pg');

const CHUNK = 50000;
const REMOVED = [54];
const RENAMED = { 53: 'População total' };

async function main() {
  const file = process.argv[2];
  const dry = process.argv.includes('--dry-run');
  if (!file || file.startsWith('--')) throw new Error('Uso: node migrations/risco/update_valores.js <valores.json> [--dry-run]');

  const { m, v } = JSON.parse(fs.readFileSync(file, 'utf8'));
  const cols = Object.keys(v).map((k) => +k.slice(1)).sort((a, b) => a - b);
  if (cols.some((c) => REMOVED.includes(c))) throw new Error(`O arquivo não deveria ter os indicadores removidos (${REMOVED}).`);
  cols.forEach((c) => {
    if (v[`c${c}`].length !== m.length) throw new Error(`c${c}: ${v[`c${c}`].length} valores para ${m.length} municípios`);
    v[`c${c}`].forEach((x) => { if (!Number.isInteger(x) || x < -1 || x > 10000) throw new Error(`c${c}: valor inválido ${x}`); });
  });

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NO_DATABASE_SSL == 1 ? false : { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    const muns = (await client.query('SELECT cd_mun FROM risco.municipios ORDER BY pos')).rows.map((r) => r.cd_mun);
    if (muns.length !== m.length || muns.some((c, i) => c !== m[i])) throw new Error('Os municípios do arquivo diferem de risco.municipios (códigos ou ordem).');

    const existing = (await client.query('SELECT col FROM risco.indicadores')).rows.map((r) => r.col);
    const unknown = cols.filter((c) => !existing.includes(c));
    if (unknown.length) throw new Error(`Indicadores inexistentes em risco.indicadores: ${unknown}`);

    const affected = [...cols, ...REMOVED];
    const before = (await client.query('SELECT col, count(*)::int n FROM risco.valores WHERE col = ANY($1) GROUP BY col', [affected])).rows;
    const nBefore = Object.fromEntries(before.map((r) => [r.col, r.n]));

    if (!dry) {
      const backup = {
        valores: (await client.query('SELECT cd_mun, col, valor FROM risco.valores WHERE col = ANY($1)', [affected])).rows,
        indicadores: (await client.query('SELECT col, meta FROM risco.indicadores WHERE col = ANY($1)', [[...Object.keys(RENAMED).map(Number), ...REMOVED]])).rows,
      };
      const bf = `${file}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      fs.writeFileSync(bf, JSON.stringify(backup));
      console.log(`Cópia de segurança: ${bf}`);
    }

    await client.query('BEGIN');

    const lines = [];
    for (const c of cols) {
      const vm = []; const vv = [];
      v[`c${c}`].forEach((x, i) => { if (x >= 0) { vm.push(m[i]); vv.push(x); } });
      await client.query('DELETE FROM risco.valores WHERE col = $1', [c]);
      for (let i = 0; i < vm.length; i += CHUNK) {
        await client.query(
          'INSERT INTO risco.valores (cd_mun, valor, col) SELECT u.*, $3::smallint FROM unnest($1::char(7)[], $2::smallint[]) AS u',
          [vm.slice(i, i + CHUNK), vv.slice(i, i + CHUNK), c],
        );
      }
      lines.push(`c${c}: ${nBefore[c] || 0} -> ${vm.length}`);
    }

    for (const [c, nome] of Object.entries(RENAMED)) {
      await client.query("UPDATE risco.indicadores SET meta = jsonb_set(meta, '{nomePlanilha}', to_jsonb($2::text)) WHERE col = $1", [c, nome]);
    }
    // temas: "Usuários rurais e urbanos expostos" deixa de existir; "População exposta" passa a incluir a população total
    await client.query("DELETE FROM risco.temas WHERE nome = 'Usuários rurais e urbanos expostos'");
    await client.query(
      "UPDATE risco.temas SET descricao = 'Concentração de pessoas no território, medida pela densidade populacional e pela população total.' WHERE nome = 'População exposta'",
    );
    for (const c of REMOVED) {
      await client.query('DELETE FROM risco.valores WHERE col = $1', [c]);
      await client.query('DELETE FROM risco.indicadores WHERE col = $1', [c]);
      lines.push(`c${c}: removido (${nBefore[c] || 0} valores)`);
    }

    console.log(lines.join('\n'));
    if (dry) {
      await client.query('ROLLBACK');
      console.log('\n--dry-run: nada foi gravado.');
    } else {
      await client.query('COMMIT');
      console.log('\nOK. Para ver agora: POST /risco/cache/clear (token de administrador) ou reinicie o serviço.');
    }
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
