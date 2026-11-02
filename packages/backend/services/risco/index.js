const zlib = require('zlib');
const crypto = require('crypto');
const Sequelize = require('sequelize');
const db = require('../database');

/*
 * Dados do painel "Risco climático em água". Os três documentos são montados a partir do schema `risco`
 * (ver migrations/risco/risco.tables.sql) e guardados em memória (JSON + gzip + ETag), pois mudam raramente e pesam 1–1,6 MB.
 */
const TTL_MS = 10 * 60 * 1000;

const select = (sql) => db.instance().query(sql, { type: Sequelize.QueryTypes.SELECT });

const builders = {
  // { m: [[cd_mun, nome, uf]], v: { cN: [valor 0-10000 ou -1] }, nb: [[índice do vizinho]] } — índices seguem a ordem de m
  async dados() {
    const [muns, inds, vals, viz] = await Promise.all([
      select('SELECT cd_mun, nome, uf FROM risco.municipios ORDER BY pos'),
      select('SELECT col FROM risco.indicadores ORDER BY col'),
      select('SELECT cd_mun, col, valor FROM risco.valores'),
      select('SELECT cd_mun, vizinho FROM risco.vizinhos ORDER BY cd_mun, ord'),
    ]);

    const idx = new Map(muns.map((x, i) => [x.cd_mun, i]));
    const v = {};
    inds.forEach(({ col }) => { v[`c${col}`] = new Array(muns.length).fill(-1); });
    vals.forEach((r) => { v[`c${r.col}`][idx.get(r.cd_mun)] = r.valor; });
    const nb = muns.map(() => []);
    viz.forEach((r) => nb[idx.get(r.cd_mun)].push(idx.get(r.vizinho)));

    return JSON.stringify({ m: muns.map((x) => [x.cd_mun, x.nome, x.uf]), v, nb });
  },

  async malha() {
    const rows = await select('SELECT topojson::text AS t FROM risco.malha WHERE id = 1');
    if (!rows.length) throw new Error('Malha do painel de risco não carregada');
    return rows[0].t;
  },

  // { indicadores: { cN: {...ficha do Caderno} }, temas: { nome: descrição } }
  async meta() {
    const [inds, temas] = await Promise.all([
      select('SELECT col, meta FROM risco.indicadores ORDER BY col'),
      select('SELECT nome, descricao FROM risco.temas ORDER BY nome'),
    ]);
    const indicadores = {};
    inds.forEach((r) => { indicadores[`c${r.col}`] = r.meta; });
    const t = {};
    temas.forEach((r) => { t[r.nome] = r.descricao; });
    return JSON.stringify({ indicadores, temas: t });
  },
};

class Service {
  constructor() {
    this.cache = new Map(); // nome -> { at, promise }
  }

  /* { body, gzip, etag } do documento (dados | malha | meta) */
  get(name) {
    if (!builders[name]) throw new Error(`Documento de risco desconhecido: ${name}`);

    const hit = this.cache.get(name);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.promise;

    const promise = builders[name]().then((json) => {
      const body = Buffer.from(json);
      return { body, gzip: zlib.gzipSync(body), etag: `"${crypto.createHash('sha1').update(body).digest('hex')}"` };
    });
    this.cache.set(name, { at: Date.now(), promise });
    promise.catch(() => this.cache.delete(name)); // não guarda falha
    return promise;
  }

  clear() {
    this.cache.clear();
  }
}

module.exports = new Service();
