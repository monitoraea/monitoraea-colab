// One-off data migration: copies real data from the legacy ciea.comissoes
// table into the new CAS-managed `colegiado` table (Informações) and
// `entity_records` table (the 19 indicator forms).
//
// For each iniciativa_id, picks the single most-recently-updated
// non-deleted ciea.comissoes row (this dev DB has duplicate 'current' rows
// for some iniciativa_ids — a pre-existing data-quality issue, not caused
// by this migration — so we can't just filter by versao='current').
//
// Run with: node scripts/migrate-legacy-data.js   (from packages/backend)

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

// Not the plain S3 bucket root: the legacy app (services/commission/index.js
// getFileKey/getFileKey_i) stores files at a per-commission, per-field
// nested path — `${S3_CONTENT_URL}/ciea/{segmentedId}/{folder}/original/{filename}`
// — never a bare `${bucket}/{filename}`. Must replicate that exactly or
// every migrated non-link file URL 404s.
const S3_CONTENT_URL = process.env.S3_CONTENT_URL || 'https://zcm-content-images.s3.us-east-2.amazonaws.com';
const ENTITY_TYPE = 'legacy_colegiado';

// packages/backend/utils.js's getSegmentedId — zero-pads to 9 digits, then
// groups into 3-digit path segments (e.g. 30 -> "000000030" -> "000/000/030").
function getSegmentedId(id) {
  let s = String(id);
  while (s.length < 9) s = `0${s}`;
  return s.match(/.{1,3}/g).join('/');
}

// ---------- generic transforms ----------

function simNao(v) {
  if (v === 1) return true;
  if (v === 0) return false;
  return null; // -1 (não respondido) or null/undefined
}
function optionMap(map) {
  return (v) => (v == null ? null : map[v] ?? null);
}
function multiMap(map) {
  return (arr) => (Array.isArray(arr) ? arr.map((v) => map[v]).filter((v) => v != null) : []);
}
function identity(v) {
  return v ?? null;
}

// ---------- Informações (ciea.comissoes -> colegiado) code maps ----------

const TIPO_COLEGIADO_MAP = { 1: 'pnea', 2: 'ciea', 3: 'cimea', 4: 'ct_cpp', 5: 'ct_cguc', 6: 'ct_bh', 7: 'other' };
const NIVEL_ATUACAO_MAP = { 1: 'federal', 2: 'regional', 5: 'estadual', 3: 'municipal', 4: 'other' };
const ATIVO_MAP = { 1: 'sim', 2: 'restruturacao', 3: 'nao' };
const TIPO_COORDENACAO_MAP = { 1: 'secretarias_ma_educacao', 2: 'secretaria_ma', 3: 'secretaria_educacao', 4: 'outra_pasta', 5: 'sociedade_civil', 6: 'outro_segmento', 7: 'outro' };
const PERIODICIDADE_MAP = { 1: 'mensal', 2: 'bimestral', 3: 'semestral', 4: 'anual', 5: 'outro' };

// ---------- Per-indicator field maps: legacy numeric key -> [newKey, transform] ----------

const F = {
  bool: () => simNao,
  text: () => identity,
  opt: (map) => optionMap(map),
  multi: (map) => multiMap(map),
  file: () => 'FILE', // special-cased: resolved via resolveFile()
};

const INDICATOR_FIELD_MAPS = {
  '1_1': {
    1: ['diagnostico_realizado', F.bool()],
    2: ['periodicidade_diagnostico', F.opt({ 1: 'bianual', 2: 'quadrianual', 3: 'decenal' })],
    3: ['evidencia_diagnostico', F.file()],
    4: ['estrategias_diagnostico', F.multi({ 1: 'entrevistas', 2: 'oficinas', 3: 'multiplas_tecnicas', 4: 'outros' })],
    5: ['estrategias_diagnostico_especifique', F.text()],
    6: ['evidencia_estrategias', F.file()],
  },
  '1_2': {
    1: ['planejamento_realizado', F.bool()],
    2: ['plano_acao_inserido', F.text()],
    3: ['periodicidade_planejamento', F.opt({ 1: 'anual', 2: 'bianual', 3: 'quadrianual' })],
    4: ['envolvimento_atores', F.opt({ 1: 'mesa_diretora', 2: 'menos_50', 3: 'entre_50_75', 4: 'mais_75' })],
    5: ['monitora_execucao', F.bool()],
    6: ['monitora_execucao_comente', F.text()],
    7: ['taxa_execucao', F.opt({ 1: 'menos_25', 2: 'entre_25_50', 3: 'entre_50_75', 4: 'mais_75' })],
    8: ['evidencia_execucao', F.file()],
  },
  '1_3': {
    1: ['processo_formativo_realizado', F.bool()],
    2: ['articulou_teoria_pratica', F.bool()],
    3: ['articulou_teoria_pratica_comente', F.text()],
    4: ['tecnicas_formacao', F.multi({ 1: 'expositivas', 2: 'estudo_caso', 3: 'leitura_compartilhada', 4: 'oficinas', 5: 'grupos_estudo', 6: 'estudo_meio', 7: 'mostras', 8: 'jogos_pedagogicos', 9: 'resolucao_exercicios', 10: 'trabalhos_individuais', 11: 'multilinguagens', 12: 'representacao_papeis', 13: 'outros' })],
    5: ['tecnicas_formacao_especifique', F.text()],
    6: ['avaliacao_formacao', F.bool()],
    7: ['avaliacao_formacao_comente', F.text()],
    8: ['instrumentos_avaliacao', F.multi({ 1: 'provas', 2: 'questionario', 3: 'entrevistas', 4: 'dinamicas', 5: 'reuniao', 6: 'outros' })],
    9: ['instrumentos_avaliacao_especifique', F.text()],
  },
  '2_1': {
    1: ['institucionalizado', F.bool()],
    2: ['normativa_define_papel', F.bool()],
    3: ['normativa_define_papel_comente', F.text()],
    4: ['relacoes_definidas_como', F.opt({ 1: 'participacao_obrigatoria', 2: 'participacao_ocasional', 3: 'informalmente_envolvido' })],
    5: ['evidencia_relacoes', F.file()],
  },
  '2_2': {
    1: ['apoio_existe', F.bool()],
    2: ['apoio_destinado_a', F.multi({ 1: 'totalidade_membros', 2: 'sociedade_civil', 3: 'grupos_vulneraveis', 4: 'quem_solicita' })],
    3: ['mecanismos_custeio', F.multi({ 0: 'mecanismo_1', 1: 'mecanismo_2', 2: 'mecanismo_3', 3: 'mecanismo_4' })],
    4: ['evidencia_apoio', F.file()],
  },
  '2_3': {
    1: ['promove_transparencia', F.bool()],
    2: ['tem_canais_comunicacao', F.bool()],
    3: ['tem_canais_comunicacao_comente', F.text()],
    5: ['canais_comunicacao', F.multi({ 1: 'site', 2: 'rede_social', 3: 'whatsapp', 4: 'email', 5: 'outro' })],
    6: ['canal_site_endereco', F.text()],
    7: ['canal_rede_social_endereco', F.text()],
    8: ['canal_outro_especifique', F.text()],
    9: ['publica_informacoes_site', F.bool()],
    10: ['publica_informacoes_comente', F.text()],
    11: ['publica_informacoes_especifique', F.text()],
    12: ['publica_informacoes_endereco', F.text()],
    13: ['preserva_historia', F.bool()],
    14: ['preserva_historia_comente', F.text()],
    16: ['preserva_historia_forma', F.multi({ 1: 'drives_compartilhados', 2: 'documentos_publicacoes', 3: 'site_publico' })],
  },
  '2_5': {
    1: ['realiza_monitoramento_ppea', F.bool()],
    2: ['ppea_cadastrada_monitoraea', F.opt({ 0: 'nao', 1: 'sim_sem_participacao', 2: 'sim_com_participacao' })],
    3: ['quantidade_membros_gt', F.text()],
  },
  '2_6': {
    1: ['toma_decisoes', F.bool()],
    2: ['temas_decisoes', F.text()],
    3: ['temas_decisoes_comente', F.text()],
    4: ['decisoes_qualificadas', F.bool()],
    5: ['decisoes_qualificadas_comente', F.text()],
    6: ['decisoes_baseadas_em', F.multi({ 1: 'estudos_evidencias', 2: 'escuta_ativa', 3: 'participacao_representativa', 4: 'mediacao_consensos', 5: 'monitoramento_participativo' })],
    7: ['decisoes_concretizadas', F.bool()],
    8: ['decisoes_concretizadas_comente', F.text()],
    9: ['decisoes_concretizadas_especifique', F.text()],
    10: ['evidencia_decisoes_concretizadas', F.file()],
  },
  '2_7': {
    1: ['ampliou_participacao', F.bool()],
    2: ['acoes_ampliacao', F.multi({ 1: 'audiencias_publicas', 2: 'consultas_publicas', 3: 'oficinas_gt', 4: 'outras' })],
    3: ['acoes_ampliacao_especifique', F.text()],
    4: ['evidencia_ampliacao', F.file()],
    5: ['grupos_contemplados', F.multi({ 1: 'povos_tradicionais', 2: 'movimentos_populares', 3: 'grupos_vulnerabilizados', 4: 'juventudes_criancas', 5: 'pessoas_idosas', 6: 'trabalhadores_sindicatos', 7: 'mulheres_feministas', 8: 'populacao_negra', 9: 'ambientalistas', 10: 'migrantes_refugiados', 11: 'outro' })],
    6: ['grupos_contemplados_especifique', F.text()],
  },
  '3_1': {
    1: ['tem_estrategias_enraizamento', F.bool()],
    2: ['coordena_formacao_formadores', F.bool()],
    3: ['coordena_formacao_comente', F.text()],
    4: ['coordena_formacao_especifique', F.text()],
    5: ['pessoas_formadas', F.text()],
    6: ['pessoas_formadas_comente', F.text()],
    7: ['evidencia_formacao', F.file()],
    8: ['articula_redes_ea', F.bool()],
    9: ['articula_redes_comente', F.text()],
    10: ['articula_redes_especifique', F.text()],
    11: ['evidencia_articula_redes', F.file()],
    12: ['quantidade_redes_articuladas', F.text()],
    13: ['quais_redes_articuladas', F.text()],
  },
  '3_2': {
    1: ['elaborou_documentos', F.bool()],
    2: ['qual_documento_comente', F.text()],
  },
  '3_3': {
    1: ['promove_articulacao', F.bool()],
    2: ['quantidade_setores_envolvidos', F.opt({ 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8+' })],
    3: ['articulacao_envolveu', F.multi({ 1: 'atores', 2: 'temas', 3: 'politicas', 4: 'territorios' })],
    4: ['articulacao_comente', F.text()],
    5: ['criou_grupos_intersetoriais', F.bool()],
    6: ['criou_grupos_comente', F.text()],
    7: ['criou_grupos_especifique', F.text()],
    8: ['evidencia_grupos_intersetoriais', F.file()],
  },
  '3_4': {
    1: ['houve_compromissos', F.bool()],
    2: ['quantidade_compromissos', F.opt({ 1: 'ate_5', 2: 'entre_6_10', 3: 'acima_10' })],
    3: ['compromissos_documentados', F.bool()],
    4: ['compromissos_documentados_comente', F.text()],
    5: ['como_registrados', F.opt({ 1: 'acordos_termos', 2: 'contratos_parceria', 3: 'correspondencia_eletronica', 4: 'outros' })],
    6: ['como_registrados_especifique', F.text()],
  },
  '3_5': {
    1: ['poder_publico_comprometido', F.bool()],
    2: ['compromissos_governo', F.multi({ 1: 'respondeu_formalmente', 2: 'reunioes_com_colegiado', 3: 'revisou_normativas', 4: 'fortaleceu_colegiado' })],
  },
  '3_6': {
    1: ['proposta_inserida', F.bool()],
    2: ['qual_intervencao_comente', F.text()],
  },
  '4_1': {
    1: ['tem_acordo_convivencia', F.bool()],
    2: ['acordo_preve_acolhimento', F.bool()],
    3: ['acordo_acolhimento_explique', F.text()],
    4: ['acordo_preve_reflexao', F.bool()],
    5: ['acordo_reflexao_explique', F.text()],
    6: ['como_constroi_sentidos', F.multi({ 1: 'reflexao_grupo', 2: 'compartilhar_duvidas', 3: 'compartilhar_conceitos', 4: 'construcao_coletiva' })],
  },
  '4_2': {
    1: ['tem_estrategias_percepcao', F.bool()],
    2: ['estrategias_percepcao', F.multi({ 1: 'questionario', 2: 'entrevista', 3: 'oficinas_rodas_conversa', 4: 'outra' })],
    3: ['estrategias_percepcao_especifique', F.text()],
    4: ['resultados_percepcao', F.opt({ 1: 'acima_90', 2: 'entre_75_90', 3: 'entre_50_75', 4: 'entre_25_50', 5: 'abaixo_25' })],
    5: ['frequencia_percepcao', F.opt({ 1: 'anual', 2: 'bianual', 3: 'quadrianual' })],
  },
  '4_3': {
    1: ['avalia_comprometimento', F.bool()],
    2: ['comprometimento_comente', F.text()],
    3: ['nivel_comprometimento', F.opt({ 1: 'excelente', 2: 'bom_regular', 3: 'ruim' })],
    4: ['frequencia_avaliacao_comprometimento', F.opt({ 1: 'anual', 2: 'bianual', 3: 'quadrianual' })],
    5: ['aspectos_comprometimento', F.multi({ 1: 'proativos', 2: 'cumprem_prazos', 3: 'participam_ativamente', 4: 'trabalham_equipe', 5: 'compartilham_aprendizados', 6: 'cooperam', 7: 'outros' })],
    6: ['aspectos_comprometimento_especifique', F.text()],
  },
  '5_1': {
    1: ['promove_mecanismos_racismo', F.bool()],
    2: ['mecanismos_denuncia', F.multi({ 1: 'email_telefone', 2: 'formulario_anonimo', 3: 'ouvidoria', 4: 'grupo_trabalho_monitoramento', 5: 'relatorios_periodicos', 6: 'outros' })],
    3: ['mecanismos_evidencia', F.file()],
    4: ['garantia_retaliacao', F.bool()],
    5: ['garantia_retaliacao_comente', F.text()],
    6: ['capacitacoes_realizadas', F.bool()],
    7: ['capacitacoes_comente', F.text()],
    8: ['capacitacoes_ultima_cite', F.text()],
    9: ['capacitacoes_evidencia', F.file()],
    10: ['capacitacoes_quantas', F.text()],
    11: ['producao_materiais', F.bool()],
    12: ['producao_materiais_comente', F.text()],
    13: ['producao_materiais_evidencia', F.file()],
    14: ['producao_materiais_quantos', F.text()],
    15: ['producao_materiais_comente_sim', F.text()],
    16: ['producao_materiais_evidencia2', F.file()],
    17: ['pautas_antirracistas', F.bool()],
    18: ['pautas_antirracistas_comente', F.text()],
    19: ['pautas_antirracistas_evidencia', F.file()],
    20: ['espacos_escuta', F.bool()],
    21: ['espacos_escuta_comente', F.text()],
    22: ['espacos_escuta_descreva', F.text()],
    23: ['espacos_escuta_evidencia', F.file()],
    24: ['parcerias', F.bool()],
    25: ['parcerias_grupos', F.multi({ 1: 'povos_comunidades_tradicionais', 2: 'movimentos_populares_urbanos', 3: 'grupos_vulnerabilizados', 4: 'juventudes_criancas', 5: 'pessoas_idosas', 6: 'trabalhadores_sindicatos', 7: 'mulheres_movimentos_feministas', 8: 'populacao_negra_combate_racismo', 9: 'grupos_ambientalistas', 10: 'migrantes_refugiados', 11: 'outros' })],
    26: ['parcerias_grupos_especifique', F.text()],
  },
};

// ---------- file resolution (legacy files.id -> URL string), memoized ----------

const fileCache = new Map();
// iniciativaId + folder are required to reconstruct a non-link file's real
// S3 path (see getFileKey/getFileKey_i above) — link-mode files ignore them
// entirely since `url` is already the real external URL in that case.
async function resolveFileUrl(client, fileId, iniciativaId, folder) {
  if (fileId == null) return null;
  const cacheKey = `${fileId}:${folder}:${iniciativaId}`;
  if (fileCache.has(cacheKey)) return fileCache.get(cacheKey);
  const res = await client.query('SELECT content_type, url FROM files WHERE id = $1', [fileId]);
  if (!res.rows.length) { fileCache.set(cacheKey, null); return null; }
  const { content_type, url } = res.rows[0];
  const isLink = content_type === 'text/uri-list';
  const resolved = {
    tipo: isLink ? 'link' : 'file',
    url: isLink ? url : `${S3_CONTENT_URL}/ciea/${getSegmentedId(iniciativaId)}/${folder}/original/${url}`,
  };
  fileCache.set(cacheKey, resolved);
  return resolved;
}

const backfilledFileIds = new Set();
async function backfillFileUrl(client, fileId, iniciativaId, folder) {
  if (fileId == null || backfilledFileIds.has(fileId)) return;
  backfilledFileIds.add(fileId);
  const res = await client.query('SELECT content_type, url FROM files WHERE id = $1', [fileId]);
  if (!res.rows.length) return;
  const { content_type, url } = res.rows[0];
  if (content_type === 'text/uri-list' || url.startsWith('http')) return; // already a real URL
  const fullUrl = `${S3_CONTENT_URL}/ciea/${getSegmentedId(iniciativaId)}/${folder}/original/${url}`;
  await client.query('UPDATE files SET url = $1 WHERE id = $2', [fullUrl, fileId]);
}

// ---------- generic upsert-by-match helper ----------

async function upsertByMatch(client, table, matchCols, data) {
  const whereClause = matchCols.map((c, i) => `${c} = $${i + 1}`).join(' AND ');
  const matchVals = matchCols.map((c) => data[c]);
  const existing = await client.query(`SELECT id FROM ${table} WHERE ${whereClause} LIMIT 1`, matchVals);

  const cols = Object.keys(data);
  if (existing.rows.length) {
    const setCols = cols.filter((c) => !matchCols.includes(c));
    const setClause = setCols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const setVals = setCols.map((c) => data[c]);
    await client.query(`UPDATE ${table} SET ${setClause} WHERE id = $${setCols.length + 1}`, [...setVals, existing.rows[0].id]);
    return { id: existing.rows[0].id, created: false };
  }
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const vals = cols.map((c) => data[c]);
  const res = await client.query(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING id`, vals);
  return { id: res.rows[0].id, created: true };
}

// ---------- main ----------

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows: legacyRows } = await client.query(`
    SELECT DISTINCT ON (iniciativa_id) *
    FROM ciea.comissoes
    WHERE "deletedAt" IS NULL
    ORDER BY iniciativa_id, "updatedAt" DESC
  `);

  console.log(`Found ${legacyRows.length} legacy colegiados (deduped by iniciativa_id, most-recently-updated row).`);

  let colegiadoCreated = 0, colegiadoUpdated = 0, indicRows = 0;

  for (const row of legacyRows) {
    const entityId = row.iniciativa_id;

    // ---- Informações ----
    // folder name matches the legacy field name exactly, per the
    // `${document}_arquivo` convention in commission/index.js's getDraft().
    const docCriacao = await resolveFileUrl(client, row.documento_criacao_arquivo, entityId, 'documento_criacao_arquivo');
    const regimento = await resolveFileUrl(client, row.regimento_interno_arquivo, entityId, 'regimento_interno_arquivo');
    const ppea = await resolveFileUrl(client, row.ppea_arquivo, entityId, 'ppea_arquivo');
    const ppea2 = await resolveFileUrl(client, row.ppea2_arquivo, entityId, 'ppea2_arquivo');
    const programaEstadual = await resolveFileUrl(client, row.programa_estadual_arquivo, entityId, 'programa_estadual_arquivo');
    const planoEstadual = await resolveFileUrl(client, row.plano_estadual_arquivo, entityId, 'plano_estadual_arquivo');
    const ppeaOutra = await resolveFileUrl(client, row.ppea_outra_arquivo, entityId, 'ppea_outra_arquivo');

    // `logo`/`plano_acao_arquivo` are genuine MD `type: file` fields —
    // colegiado stores the raw files.id, and the CAS engine's own
    // expandFileFields (crud.ts) resolves it server-side by reading
    // `files.url` verbatim, with no knowledge of the legacy nested-path
    // convention. So instead of computing a URL to store on colegiado,
    // backfill the shared `files` row's `url` column in place — each such
    // row is exclusively owned by one (commission, field) pair (confirmed
    // via updateFileModel's `document_type: ciea_<field>` tagging), so this
    // is safe and makes server-side resolution correct with no engine change.
    await backfillFileUrl(client, row.logo_arquivo, entityId, 'logo_arquivo');
    await backfillFileUrl(client, row.plano_acao_arquivo, entityId, 'plano_acao_arquivo');

    const colegiadoData = {
      entity_id: entityId,
      entity_type: ENTITY_TYPE,
      name: row.nome,
      type: TIPO_COLEGIADO_MAP[row.tipo_colegiado] ?? null,
      type_detail: row.tipo_colegiado_outro,
      level: NIVEL_ATUACAO_MAP[row.nivel_atuacao] ?? null,
      level_detail: row.nivel_atuacao_outro,
      logo_file_id: row.logo_arquivo,
      uf_id: JSON.stringify(row.ufs ?? []),
      creation_data: row.data_criacao ? `${row.data_criacao}-01-01` : null,
      status: ATIVO_MAP[row.ativo] ?? null,
      site_link: row.link,
      obs: row.obs,
      cadeiras_pub: row.composicao_cadeiras_set_pub,
      cadeiras_civil: row.composicao_cadeiras_soc_civ,
      composicao_cadeiras_outros: JSON.stringify(row.composicao_cadeiras_outros ?? []),

      documento_criacao: row.documento_criacao,
      documento_criacao_tipo: docCriacao?.tipo ?? null,
      documento_criacao_arquivo: docCriacao?.url ?? null,

      coordenacao: TIPO_COORDENACAO_MAP[row.coordenacao] ?? null,
      coordenacao_especifique: row.coordenacao_especifique,
      coordenacao_quem: JSON.stringify(row.coordenacao_quem ?? []),

      regimento_interno_tem: row.regimento_interno_tem,
      regimento_interno: row.regimento_interno,
      regimento_interno_tipo: regimento?.tipo ?? null,
      regimento_interno_arquivo: regimento?.url ?? null,

      org_interna_periodicidade: PERIODICIDADE_MAP[row.org_interna_periodicidade] ?? null,
      organizacao_interna_periodicidade_especifique: row.organizacao_interna_periodicidade_especifique,
      organizacao_interna_estrutura_tem: row.organizacao_interna_estrutura_tem,
      organizacao_interna_estrutura_especifique: row.organizacao_interna_estrutura_especifique,

      ppea_tem: row.ppea_tem,
      ppea_tipo: ppea?.tipo ?? null,
      ppea_arquivo: ppea?.url ?? null,
      ppea_decreto: row.ppea_decreto,
      ppea_lei: row.ppea_lei,

      ppea2_tem: row.ppea2_tem,
      ppea2_tipo: ppea2?.tipo ?? null,
      ppea2_arquivo: ppea2?.url ?? null,
      ppea2_decreto: row.ppea2_decreto,
      ppea2_lei: row.ppea2_lei,

      programa_estadual_tem: row.programa_estadual_tem,
      programa_estadual_tipo: programaEstadual?.tipo ?? null,
      programa_estadual_arquivo: programaEstadual?.url ?? null,
      programa_estadual_decreto: row.programa_estadual_decreto,
      programa_estadual_lei: row.programa_estadual_lei,

      plano_estadual_tem: row.plano_estadual_tem,
      plano_estadual_tipo: planoEstadual?.tipo ?? null,
      plano_estadual_arquivo: planoEstadual?.url ?? null,
      plano_estadual_decreto: row.plano_estadual_decreto,
      plano_estadual_lei: row.plano_estadual_lei,

      ppea_outra_tem: row.ppea_outra_tem,
      ppea_outra_tipo: ppeaOutra?.tipo ?? null,
      ppea_outra_arquivo: ppeaOutra?.url ?? null,
      ppea_outra_decreto: row.ppea_outra_decreto,
      ppea_outra_lei: row.ppea_outra_lei,

      plano_acao_arquivo: row.plano_acao_arquivo,
      plano_acao_ini: row.plano_acao_ini || null,
      plano_acao_fim: row.plano_acao_fim || null,
    };

    const { created } = await upsertByMatch(client, 'colegiado', ['entity_id', 'entity_type'], colegiadoData);
    if (created) colegiadoCreated++; else colegiadoUpdated++;

    // ---- Indicadores ----
    const indicadores = row.indicadores || {};
    for (const [indicKey, fieldMap] of Object.entries(INDICATOR_FIELD_MAPS)) {
      const answer = indicadores[indicKey];
      if (!answer || typeof answer !== 'object') continue;

      const data = {};
      let hasAny = false;
      for (const [legacyKey, [newKey, transform]] of Object.entries(fieldMap)) {
        const raw = answer[legacyKey];
        if (raw === undefined) continue;
        if (transform === 'FILE') {
          // Indicator files use getFileKey_i's convention: folder = the
          // legacy *numeric* field key itself (e.g. "3", "6"), not a name.
          const resolved = await resolveFileUrl(client, raw, entityId, legacyKey);
          data[newKey] = resolved?.url ?? null;
        } else {
          data[newKey] = transform(raw);
        }
        if (data[newKey] !== null && data[newKey] !== undefined && !(Array.isArray(data[newKey]) && data[newKey].length === 0)) {
          hasAny = true;
        }
      }
      if (!hasAny) continue;

      await upsertByMatch(client, 'entity_records',
        ['entity_id', 'entity_type', 'record_key'],
        {
          entity_id: entityId,
          entity_type: ENTITY_TYPE,
          record_key: `indic_${indicKey}`,
          data: JSON.stringify(data),
        });
      indicRows++;
    }
  }

  console.log(`colegiado: ${colegiadoCreated} created, ${colegiadoUpdated} updated.`);
  console.log(`entity_records: ${indicRows} indicator answer rows upserted.`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
