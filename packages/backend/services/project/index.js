const Sequelize = require('sequelize');
const db = require('../database');

/* TODO: review messagery */
/* const { MessageService } = require('dorothy-dna-services');*/

const dayjs = require('dayjs');

const shapefile = require('shapefile');
const simplify = require('simplify-geojson');

const AdmZip = require('adm-zip');

const indics = require('./indics');

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

const { Messagery } = require('dorothy-dna-services');

const sgMail = require('@sendgrid/mail');
const { applyWhere, parseBBOX, getSegmentedId } = require('../../utils');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const defaultLimit = 5;

class Service {
  async downloadProject(id) {
    /* recupera projeto e linhas de acao */

    let rows = await db.instance().query(
      `
      select p.id, p.nome, p.objetivos_txt, p.aspectos_gerais_txt, p.publico_txt, p.periodo_txt, p.parceiros_txt,
      i.nome as instituicao_nome, m2.nome as modalidade_nome,
      (
      	select array_agg(distinct la.nome)
      	from linhas_acao la
	    inner join projetos__linhas_acao pla on pla.linha_acao_id = la.id
	    where pla.projeto_id = p.id
      ) as linhas,
      p.nome_ponto_focal, p.email_contatos, p.tel_contatos,
        p.status_desenvolvimento,
        p.mes_inicio,
        p.mes_fim,
        (select array_agg(distinct s.nome) from segmentos s where s.id = any(i.segmentos)) as segmentos,
        (select array_agg(distinct u.nm_estado) from ufs u where u.id = any(p.ufs)) as ufs,
      (
      	select array_agg(distinct pu.nome)
      	from publicos pu
	    where pu.id = any(p.publicos)
      ) as publicos,
      (
      	select array_agg(distinct ts.nome)
      	from tematicas_socioambientais ts
	    where ts.id = any(p.tematicas)
      ) as tematicas
      from projetos p
      left join instituicoes i on i.id = p.instituicao_id
      left join modalidades m2 on m2.id = p.modalidade_id
      --left join projetos_atuacao pa on pa.projeto_id = p.id
      where p.id = :id
      `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!rows.length) return null;

    let title = rows[0].nome;

    // fileName
    const fileName = `projeto_${id}`;

    const csvFileName = `${fileName}.csv`;
    const zipFileName = `${fileName}.zip`;

    // 1. transformar em csv
    const columns = Object.keys(rows[0]).filter(k => !['coordinates', 'bbox'].includes(k));
    let initialContent = columns.join(';') + '\n';

    const content = rows.reduce((accum, r) => {
      const row = columns.reduce((accum, key) => {
        if (typeof r[key] === 'string') r[key] = r[key].replace(/\n/g, ' ').replace(/;/g, ',').trim();

        return [...accum, r[key]];
      }, []);
      return `${accum} ${row.join(`;`)}\n`;
    }, initialContent);

    // 2. zipar e colocar na memoria
    const zip = new AdmZip();
    zip.addFile(csvFileName, Buffer.from(content, 'latin1'));

    return {
      zipFileName,
      content: zip.toBuffer(), // get in-memory zip
    };
  }

  /* Retorna o id do projeto relacionado a uma comunidade */
  async getProjectIdFromCommunity(community_id) {
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(
      ` select  p.id
        from projetos p
        where p.community_id = :community_id`,
      {
        replacements: { community_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!result.length) return null;

    const id = result[0].id;

    return { id };
  }

  /* Retorna os dados de rascunho existente ou cria um novo rascunho de um determinado projeto */
  async getProjectDraft(id) {
    let draft = await this.retrieveProjectDraft(id);

    /* Se nao encontrar o registro de rascunho do projeto, criar */
    if (!draft) draft = await this.createDraft(id);

    return { draft };
  }

  /* Cria o registro rascunho para determinado projetos */
  async createDraft(id) {
    let result;

    result = await db.instance().query(
      `
      select p.publicacao
        from projetos p
        where p.id = ${parseInt(id)}
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (result[0].publicacao) {
      result = await db.instance().query(
        `
          insert into projetos_rascunho(
                  projeto_id, nome, instituicao_id, modalidade_id,
                  objetivos_txt, aspectos_gerais_txt, publico_txt, periodo_txt, parceiros_txt,
                  linhas_acao,
                  atuacao,
                  "createdAt", "updatedAt"
          )
          select p.id, p.nome, p.instituicao_id, p.modalidade_id,
                  p.objetivos_txt, p.aspectos_gerais_txt, p.publico_txt, p.periodo_txt, p.parceiros_txt,
                  array_agg(distinct pla.linha_acao_id)::int[] as linhas_acao,
                  array_agg(distinct pa.nm_regiao) as regioes,
                  NOW(), NOW()
          from projetos p
          left join projetos__linhas_acao pla on pla.projeto_id = p.id
          left join projetos_atuacao pa on pa.projeto_id = p.id
          where p.id = ${parseInt(id)}
          group by p.id
          RETURNING id`,
        {
          type: Sequelize.QueryTypes.SELECT,
        },
      );
    } else {
      result = await db.instance().query(
        `
        insert into projetos_rascunho(
              projeto_id, nome, instituicao_id, modalidade_id,
              objetivos_txt, aspectos_gerais_txt, publico_txt, periodo_txt, parceiros_txt,
              linhas_acao,
              atuacao,
              "createdAt", "updatedAt"
        )
        select p.id, p.nome, null, null,
                null, null, null, null, null,
                null,
                null,
                NOW(), NOW()
        from projetos p
        where p.id = ${parseInt(id)}
        RETURNING id`,
        {
          type: Sequelize.QueryTypes.SELECT,
        },
      );
    }

    if (!result.length) throw new Error(`Can't create draft for project ${id}`);

    const newId = result[0].id; /* recupera o id recem criado */

    /* Adiciona os contatos */
    result = await db.instance().query(
      `
    select p.nome_ponto_focal, p.email_contatos, p.tel_contatos
    from projetos p
    where p.id = ${parseInt(id)}
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (result.length) {
      let contatos = [];
      const { nome_ponto_focal, email_contatos, tel_contatos } = result[0];

      const tam = Math.max(
        nome_ponto_focal ? nome_ponto_focal.length : 0,
        email_contatos ? email_contatos.length : 0,
        tel_contatos ? tel_contatos.length : 0,
      );

      for (let idx = 0; idx < tam; idx++)
        contatos.push({
          nome: nome_ponto_focal && nome_ponto_focal[idx] ? nome_ponto_focal[idx] : '',
          email: email_contatos && email_contatos[idx] ? email_contatos[idx] : '',
          tel: tel_contatos && tel_contatos[idx] ? tel_contatos[idx] : '',
        });

      /* grava contatos */
      result = await db.instance().query(
        `
        update projetos_rascunho
        set contatos = '${JSON.stringify(contatos)}'
        where id = ${newId}
      `,
        {
          type: Sequelize.QueryTypes.UPDATE,
        },
      );
    }

    const draft = await this.retrieveProjectDraft(id);

    return draft;
  }

  async createProject(nome, communityId, user) {
    let query, result;

    /* community for project */
    result = await db.instance().query(
      `
    select * from dorothy_community_recipes where name = 'project'
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const communityRecipe = result[0];

    result = await db.instance().query(
      `
    INSERT INTO dorothy_communities(
      descriptor_json,
      "createdAt",
      "updatedAt",
      alias,
      type
    )
    VALUES(
        '${JSON.stringify(communityRecipe['descriptor_json']).replace('%TITLE%', nome.replace(/"/g, ''))}',
        NOW(),
        NOW(),
        '${communityRecipe['alias']}',
        '${communityRecipe['type']}'
    ) RETURNING id
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const community_id = result[0].id;

    /* projetos: ID, nome (e, se facilitador, facilitador_community_id) */
    result = await db.instance().query(
      `
    INSERT into projetos(nome, community_id, facilitador_community_id) values(:nome, :community_id, :facilitador_community_id)
    `,
      {
        replacements: { nome, community_id, facilitador_community_id: communityId || null },
        type: Sequelize.QueryTypes.INSERT,
      },
    );

    /* torna o criador membro do projeto */
    await require('../gt').addMember(community_id, user.id);

    return { communityId: community_id };
  }

  async suggest(projeto_id, field, data, communityId, sender) {
    /* Cria proposta */
    const sequelize = db.instance();

    let result;

    const query = `
      insert into suggestions(
        projeto_id,
        field,
        data,
        "createdAt", "updatedAt" )
      values (
        :projeto_id,
        :field,
        :data,
        NOW(), NOW()
      )
      RETURNING id`;

    result = await sequelize.query(query, {
      replacements: { projeto_id, field, data: JSON.stringify(data[field]) },
      type: Sequelize.QueryTypes.SELECT,
    });

    if (!result.length) throw new Error(`Can't create suggestion for project ${id}`);

    const newId = result[0].id; /* recupera o id recem criado */

    /* ja contabiliza um voto para esta proposta */
    result = await sequelize.query(
      `
        insert into votes
          ("suggestionId", "userId", "isLike", "createdAt", "updatedAt")
        values
          (:suggestion_id, :user_id, true, NOW(), NOW())`,
      {
        replacements: { suggestion_id: newId, user_id: sender.id },
        type: Sequelize.QueryTypes.INSERT,
      },
    );

    /* TODO: review messagery */
    /* send suggest notification for field room */
    /* const message = await MessageService.sendNotification(
      sender.id,

      `room_${communityId}_ProjectField_${field}`,

      {
        // Notification Tool
        type: 'native',
        element: 'SuggestionNotification',
        actions: true,
      },

      {
        // Data
        id: newId,
        text: `sugeriu um novo valor para este campo`,
        sender: sender.name,
      },

      {
        // Options
        watch: `suggestions_${newId}`,
      },
    ); */

    return { suggestion_id: newId };
  }

  async promote(suggestion_id, communityId, sender) {
    const sequelize = db.instance();

    let result;

    /* recupera a suggestion */
    result = await sequelize.query(
      `
        select s.*
        from suggestions s
        where s.id = :suggestion_id`,
      {
        replacements: { suggestion_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const { field: fieldRaw, data, projeto_id } = result[0];
    const field = fieldRaw.trim();

    await sequelize.query(
      `
        update projetos_rascunho pr
        set ${field} = :data
        where pr.projeto_id = :projeto_id`,
      {
        replacements: { data: Array.isArray(data) ? `{${data}}` : data, projeto_id },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );

    /* TODO: review messagery */
    /* send promote notification for field room */
    /* await MessageService.sendNotification(
      sender.id,

      `room_${communityId}_ProjectField_${field}`,

      {
        // Notification Tool
        type: 'native',
        element: 'PromotionNotification',
      },

      {
        // Data
        id: suggestion_id,
        text: `promoveu uma sugestão como novo valor para este campo`,
        sender: sender.name,
      },
    );

    MessageService.sendCommand(`room_${communityId}_ProjectField_${field}`, 'promoted'); */

    return { ok: true };
  }

  async vote(suggestion_id, like, sender) {
    if (like === undefined) throw new Error('You must specify if you like or not!');

    const voteLike = like === '1';

    const sequelize = db.instance();

    let result;
    let operation = 'none';

    /* recupera a suggestion */
    result = await sequelize.query(
      `
        select s.*
        from suggestions s
        where s.id = :suggestion_id`,
      {
        replacements: { suggestion_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const suggestion = result[0];

    /* recupera o voto deste usuario, se existir */
    result = await sequelize.query(
      `
        select v."isLike"
        from votes v
        where v."suggestionId" = :suggestion_id and v."userId" = :user_id `,
      {
        replacements: { suggestion_id, user_id: sender.id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (result.length) {
      /* ja votou */
      /* altera o voto, se for diferente */
      if (result[0].isLike !== voteLike) {
        result = await sequelize.query(
          `
          update votes
          set "isLike" = :is_like
          where "suggestionId" = :suggestion_id and "userId" = :user_id`,
          {
            replacements: { suggestion_id, is_like: voteLike, user_id: sender.id },
            type: Sequelize.QueryTypes.UPDATE,
          },
        );
        operation = 'updated';
      }
    } else {
      /* nao votou */
      /* cria voto */
      result = await sequelize.query(
        `
        insert into votes
          ("suggestionId", "userId", "isLike", "createdAt", "updatedAt")
        values
          (:suggestion_id, :user_id, :is_like, NOW(), NOW())`,
        {
          replacements: { suggestion_id, user_id: sender.id, is_like: voteLike },
          type: Sequelize.QueryTypes.INSERT,
        },
      );
      operation = 'new';
    }

    /* TODO: review messagery */
    /* update notification (LIVE) */
    /* await MessageService.updateNotification(sender.id, `suggestions_${suggestion_id}`); */

    return { operation };
  }

  async myVote(suggestion_id, sender) {
    const sequelize = db.instance();

    let result;

    /* recupera o voto deste usuario, se existir */
    result = await sequelize.query(
      `
        select v."isLike"
        from votes v
        where v."suggestionId" = :suggestion_id and v."userId" = :user_id `,
      {
        replacements: { suggestion_id, user_id: sender.id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (result.length) return { isLike: result[0].isLike };
    else return { isLike: null };
  }

  async getVotes(suggestion_id, field) {
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(
      `
        select v."isLike"
        from votes v
        where v."suggestionId" = :suggestion_id`,
      {
        replacements: { suggestion_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    /* parse */
    const consolidation = result.reduce(
      (accum, { isLike }) => {
        const newAccum = { ...accum };
        if (isLike) newAccum.likes++;
        else newAccum.dislikes++;

        return newAccum;
      },
      {
        likes: 0,
        dislikes: 0,
      },
    );

    return consolidation;
  }

  async getSuggestion(id) {
    const sequelize = db.instance();

    const result = await sequelize.query(
      `
    select * from suggestions s
    where s.id = ${parseInt(id)}`,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!result || result.length === 0) throw new Error('Cannot get suggestion data!');

    return result[0];
  }

  async saveProjectDraftIndicFile(id, lae_id, indic, question, file) {
    let Key = `//TODO`;

    const params = {
      Bucket: BUCKET_NAME,
      Key,
      Body: buffer,
      ACL: 'public-read',
    };

    await s3.upload(params).promise();

    return { ok: true };
  }

  async saveProjectDraftIndic(project_id, lae_id, indic, question, value) {
    const sequelize = db.instance();

    /*
    console.log(projeto_id, lae_id, indic, question, value);
    13 2 3 1 { items: [ 6, 9, 4 ], other: 'Outro valor' }
    */

    let query, result;

    query = `
    select indicadores
    from projetos_rascunho pr
    where pr.projeto_id = :project_id
    `;

    result = await sequelize.query(query, {
      replacements: { project_id },
      type: Sequelize.QueryTypes.SELECT,
    });

    const indicadores = result[0].indicadores;
    if (!indicadores[`${lae_id}_${indic}`]) indicadores[`${lae_id}_${indic}`] = {};

    /* Se indicador alterado e' base e o valor e' "nao" ou "nao se aplica", o indicador e' "resetado" */
    if (question === 'base' && ['none', 'nao', 'nao_aplica'].includes(value))
      indicadores[`${lae_id}_${indic}`] = { base: value };
    else indicadores[`${lae_id}_${indic}`][question] = value;

    query = `
    update projetos_rascunho pr
    set indicadores = :indicadores
    where pr.projeto_id = :project_id
    `;

    result = await sequelize.query(query, {
      replacements: { project_id, indicadores: JSON.stringify(indicadores) },
      type: Sequelize.QueryTypes.SELECT,
    });

    return { ok: true };
  }

  async getListForUser(user, config) {
    const entities = await db.instance().query(
      `
    with iniciatives as (
      select
        c.id,
        dc.id as "community_id",
        dc.descriptor_json->>'title' as "name",
        count(dm.*) > 0 as "has_members"
      from projetos c
      inner join dorothy_communities dc on dc.id = c.community_id
      left join dorothy_members dm on dm."communityId" = dc.id
      group by c.id, dc.id
    )
    select
      c.id,
      c.community_id,
      c."name",
      dm."createdAt" is not null as "is_member",
      c."has_members",
      p.id is not null as "is_requesting",
      count(*) OVER() AS total_count
    from iniciatives c
    left join dorothy_members dm on dm."communityId" = c.community_id and dm."userId" = :userId
    left join participar p on p."communityId" = c.community_id and p."userId" = :userId and p."resolvedAt" is null
    order by c."name" ${config.direction || 'asc'}
    `,
      {
        replacements: { userId: user.id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { entities, total: entities[0].total_count };
  }

  async saveProjectJustDraft(id, value) {
    await db.instance().query(
      `
        update projetos_rascunho
        set atuacao_naplica_just = :value
        where projeto_id = :id`,
      {
        replacements: {
          id,
          value,
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { ok: true };
  }

  async saveProjectUFsDraft(id, ufs) {
    await db.instance().query(
      `
        update projetos_rascunho
        set ufs = '{${ufs.map(u => u.id).join(',')}}'
        where projeto_id = :id
      `,
      {
        replacements: {
          id,
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { ok: true };
  }

  async saveProjectDraft(data) {
    const sequelize = db.instance();

    if (data.relacionado_ppea !== 'sim') data['qual_ppea'] = null;

    await sequelize.query(
      `
        update projetos_rascunho
        set nome = :nome,
            modalidade_id = :modalidade_id,

            instituicao_id = :instituicao_id,
            instituicao_nova = :instituicao_nova,

            atuacao = :atuacao,
            objetivos_txt = :objetivos_txt,
            aspectos_gerais_txt = :aspectos_gerais_txt,
            publico_txt = :publico_txt,
            periodo_txt = :periodo_txt,
            parceiros_txt = :parceiros_txt,
            contatos = :contatos,

            relacionado_ppea = :relacionado_ppea,
            qual_ppea = :qual_ppea
        where projeto_id = :projeto_id`,
      {
        replacements: {
          projeto_id: data.projeto_id,
          nome: data.nome,

          modalidade_id: data.modalidade_id,

          instituicao_id: data.instituicao.newOne ? null : data.instituicao.raw,
          instituicao_nova: !data.instituicao.newOne ? null : data.instituicao.raw,

          atuacao: data.atuacao
            ? `{${data.atuacao.reduce((accum, item) => `${accum}${accum.length ? ',' : ''}"${item}"`, '')}}`
            : null,

          objetivos_txt: cleanItems(data.objetivos_txt),
          aspectos_gerais_txt: cleanItems(data.aspectos_gerais_txt),
          publico_txt: cleanItems(data.publico_txt),
          periodo_txt: cleanItems(data.periodo_txt),
          parceiros_txt: cleanItems(data.parceiros_txt),

          contatos: JSON.stringify(data.contatos),

          relacionado_ppea: data.relacionado_ppea,
          qual_ppea: data.qual_ppea,
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const draft = await this.retrieveProjectDraft(data.projeto_id);

    return draft;
  }

  /* Busca e retorna um draft de projeto, se ele existir */
  async retrieveProjectDraft(id) {
    let result;

    result = await db.instance().query(
      `
        select  pr.*, p.community_id
        from projetos_rascunho pr
        left join projetos p on p.id = pr.projeto_id
        where pr.projeto_id = :id`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!result.length) return null;

    let draft = result[0];
    /* draft.instituicao = {
      newOne: !!draft.instituicao_nova,
      raw: !!draft.instituicao_nova ? draft.instituicao_nova : draft.instituicao_id,
    }; */

    /* Se atuacao_aplica, procura quantos atuacoes em rasc e quantas atuacoes definitivas */
    if (draft.atuacao_aplica) {
      result = await db.instance().query(
        `
      select count(*)::integer as total
      from projetos_atuacao pa
      where pa.projeto_id = :id`,
        {
          replacements: { id },
          type: Sequelize.QueryTypes.SELECT,
        },
      );

      draft.qtd_atuacoes = result[0].total;

      result = await db.instance().query(
        `
      select count(*)::integer as total
      from projetos_atuacao_rascunho par
      where par.projeto_id = :id`,
        {
          replacements: { id },
          type: Sequelize.QueryTypes.SELECT,
        },
      );

      draft.qtd_atuacoes_rascunho = result[0].total;
    }

    return draft;
  }

  async enterInInitiative(user) {
    /* descobre o id da comunidade rede */
    const result = await db.instance().query(
      `
      select id
      from dorothy_communities dc
      where alias = 'rede_zcm'
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const community_id = result[0].id;

    /* torna o criador membro da iniciativa */
    await require('../gt').addMember(community_id, user.id, 'member', 99);

    /* retorna id da comunidade */
    return { communityId: community_id };
  }

  async getProjectForParticipation(id) {
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(
      `
        select p.id, p.nome
        from projetos p
        where p.id = ${parseInt(id)}`,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!result.length) return null;

    let project = result[0];

    const members = await sequelize.query(
      `
      select count(*)::integer as total
      from dorothy_members m
      inner join projetos p on p.community_id = m."communityId"
      where p.id = ${parseInt(id)}
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    project.total_members = !members || !members.length ? 0 : members[0].total;

    return project;
  }

  async getTotalInstitutions() {
    const institutions = await db.instance().query(
      `
    select count(distinct p.instituicao_id)::integer as total
    from projetos p
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return institutions[0].total;
  }

  async getStatisticsLinhas() {
    const institutions = await db.instance().query(
      `
    select la.id, la.nome, count(*)::integer as total
    from linhas_acao la
    inner join projetos__linhas_acao pla on pla.linha_acao_id = la.id
    group by la.id, la.nome
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const data = institutions.map(i => ({ x: i.nome, y: i.total }));

    return data;
  }

  /* Recupera os dados de um determinado projeto */
  async getProject(id) {
    const sequelize = db.instance();

    let result;

    result = await sequelize.query(
      `
        select distinct p.id, p.nome, p.objetivos_txt, p.aspectos_gerais_txt, p.publico_txt, p.periodo_txt, p.parceiros_txt,
        i.nome as instituicao_nome, m2.nome as modalidade_nome,
        (
          select distinct array_agg(la.nome)
          from projetos__linhas_acao pla
          left join linhas_acao la on la.id = pla.linha_acao_id
          where pla.projeto_id = p.id
        ) as linhas,
        (
          select array_agg(distinct m.nm_regiao)
          from municipios m
          where m.cd_mun = pa.cd_mun
        ) as regioes,
        (
          select array_agg(distinct pu.nome)
          from publicos pu
          where pu.id = any(p.publicos)
        ) as publicos,
        (
          select array_agg(distinct ts.nome)
          from tematicas_socioambientais ts
          where ts.id = any(p.tematicas)
        ) as tematicas,
        status_desenvolvimento,
        mes_inicio,
        mes_fim
        from projetos p
        left join instituicoes i on i.id = p.instituicao_id
        left join modalidades m2 on m2.id = p.modalidade_id
        left join projetos_atuacao pa on pa.projeto_id = p.id
        where p.id = ${parseInt(id)}`,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!result.length) return null;

    let project = result[0];

    result = await sequelize.query(
      `select m.cd_mun, m.nm_regiao, m.nm_uf, m.nm_mun
        from projetos p
        inner join projetos_atuacao pa ON pa.projeto_id = p.id
        inner join municipios m on m.cd_mun = pa.cd_mun
        where p.id = ${parseInt(id)}`,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    project.atuacao = result;

    const members = await sequelize.query(
      `
      select count(*)::integer as total
      from dorothy_members m
      inner join projetos p on p.community_id = m."communityId"
      where p.id = ${parseInt(id)}
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    project.total_members = !members || !members.length ? 0 : members[0].total;

    return project;
  }

  async getTotal() {
    let entities;

    entities = await db.instance().query(
      `
    select count(*)::int as total
    from projetos p
    where p.publicacao is not null
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const total = entities[0].total;

    entities = await db.instance().query(
      `select p.modalidade_id, m.nome, count(*)::int
    from projetos p
    inner join modalidades m on m.id = p.modalidade_id
    WHERE publicacao is NOT NULL
    group by p.modalidade_id, m.nome`,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { total, modalidades: entities };
  }

  async getNames(ids) {
    const sequelize = db.instance();

    const query = `
            select p.id, p.nome
            from projetos p
            where id in (${ids
              .split(',')
              .map(id => parseInt(id))
              .join(',')})
            order by p.nome
        `; /* TODO: melhor protecao contra injection? */

    const projects = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return projects;
  }

  async listProjectsIDs(f_id, where) {
    const sequelize = db.instance();

    if (f_id) where = `${where} AND p.id = ${f_id}`;

    const query = `
            select distinct p.id
            from projetos p
            left join projetos__linhas_acao pla on pla.projeto_id = p.id
            left join instituicoes i on i.id = p.instituicao_id
            left join projetos_atuacao pa on pa.projeto_id = p.id
            left join municipios m on m.cd_mun = pa.cd_mun
            ${where}
            and pa.geom is not null
        `;

    const projects = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return projects.map(p => p.id);
  }

  async fromMap(ids) {
    const sequelize = db.instance();

    const query = `
    select p.id, p.nome, i.nome as instituicao_nome, array_agg(distinct pa.nm_regiao) as regioes,
    count(*) OVER() AS total_count
    from projetos p
    left join projetos__linhas_acao pla on pla.projeto_id = p.id
    left join instituicoes i on i.id = p.instituicao_id
    left join projetos_atuacao pa on pa.projeto_id = p.id
    left join municipios m on m.cd_mun = pa.cd_mun
            where p.id in (${ids
              .split(',')
              .map(id => parseInt(id))
              .join(',')})
        group by p.id, i.nome
        order by p.nome
        `; /* TODO: melhor protecao contra injection? */

    const projects = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return projects;
  }

  /* Retorna a lista os projetos - com filtros */
  async listProjects(page, f_id, where, limit) {
    const sequelize = db.instance();

    const specificLimit = limit || defaultLimit;

    let query;

    if (f_id) where = `${where} AND p.id = ${f_id}`;

    query = `
            select p.id, p.nome, i.nome as instituicao_nome, array_agg(distinct pa.nm_regiao) as regioes,
            count(*) OVER() AS total_count
            from projetos p
            left join projetos__linhas_acao pla on pla.projeto_id = p.id
            left join instituicoes i on i.id = p.instituicao_id
            left join projetos_atuacao pa on pa.projeto_id = p.id
            left join municipios m on m.cd_mun = pa.cd_mun
            ${where}
            group by p.id, p.nome, i.nome
            order by p.nome
            LIMIT ${specificLimit}
            OFFSET ${(page - 1) * specificLimit}
        `;

    const projects = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    // bboxes
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];

      const [bbox] = await sequelize.query(
        `
        with bounds as (
          select ST_Extent(geom) as bbox
          from projetos_atuacao pa
          where pa.projeto_id = ${p.id} and geom is not null
        )
        select ST_YMin(bbox) as y1, ST_XMin(bbox) as x1, ST_YMax(bbox) as y2, ST_XMax(bbox) as x2
        from bounds`,
        {
          type: Sequelize.QueryTypes.SELECT,
        },
      );

      projects[i].bbox = bbox && bbox.y1 && bbox.x1 && bbox.y2 && bbox.x2 ? bbox : null;
    }

    const rawPages = projects.length ? parseInt(projects[0]['total_count']) / specificLimit : 0;
    let pages = rawPages === Math.trunc(rawPages) ? rawPages : Math.trunc(rawPages) + 1;
    let hasPrevious = page > 1;
    let hasNext = page !== pages;

    /* projects and members */
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];

      query = `
      select count(*)::integer as total
      from dorothy_members m
      inner join projetos p on p.community_id = m."communityId"
      where p.id = ${p.id}
      `;
      const members = await sequelize.query(query, {
        type: Sequelize.QueryTypes.SELECT,
      });

      p.total_members = !members || !members.length ? 0 : members[0].total;
    }

    /* chart de modalidade */
    const entities = await db.instance().query(
      `
    select p.modalidade_id, mo.nome, count(distinct p.id)::int
    from projetos p
    left join modalidades mo on mo.id = p.modalidade_id
    left join projetos__linhas_acao pla on pla.projeto_id = p.id
    left join instituicoes i on i.id = p.instituicao_id
    left join projetos_atuacao pa on pa.projeto_id = p.id
    left join municipios m on m.cd_mun = pa.cd_mun
    ${where}
    group by p.modalidade_id, mo.nome`,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      entities: projects,
      pages,
      hasPrevious,
      hasNext,
      currentPage: page,
      total: parseInt(projects.length ? projects[0]['total_count'] : 0),
      modalidades: entities,
    };
  }

  async listAllIndicProjects(projetoId) {
    const projects = await db.instance().query(
      `
    select distinct pi.id, pi.name, pi.instituicao_id
    from projetos_indicados pi
    where pi."projeto_id" is null OR pi."projeto_id" = :projetoId
    order by pi.name
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { projetoId },
      },
    );

    return { list: projects };
  }

  async listOptRelations(config) {
    let where1 = ['LENGTH(pr.nome) > 0'];
    let where2 = ['p.projeto_id is null'];
    let replacements = {};

    if (config.institution) {
      where1.push('pr.instituicao_id = :instituicao_id1');
      where2.push('p.instituicao_id = :instituicao_id2');
      replacements.instituicao_id1 = config.institution;
      replacements.instituicao_id2 = config.institution;
    }

    const projects = await db.instance().query(
      `
      with all_pr as (
        select CONCAT('draft_',pr.id) as id, pr.nome as "name"
        from projetos_rascunho pr
        ${applyWhere(where1)}
        union
        select CONCAT('indic_',p.id) as id, p."name"
        from projetos_indicados p
        ${applyWhere(where2)}
      )
      select id, "name"
      from all_pr
      order by "name"
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements,
      },
    );

    return { list: projects };
  }

  async getOptRelations(key) {
    const [type, id] = key.split('_');

    let projects;
    if (type === 'indic') {
      projects = await db.instance().query(
        `
      select CONCAT('indic_',p.id) as id, p."name"
      from projetos_indicados p
      where p.id = :id
      `,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { id },
        },
      );
    } else {
      projects = await db.instance().query(
        `
      select CONCAT('draft_',pr.id) as id, pr.nome as "name"
      from projetos_rascunho pr
      where pr.id = :id
      `,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { id },
        },
      );
    }

    return projects[0];
  }

  /* async listAllDraftProjects(config) {
    let where = ['LENGTH(p.nome) > 0'];
    let replacements = {};

    let me_fields = '';
    let me_order = '';

    if (!!config.no_owner_and_me) {
      where.push('(p.? is NULL OR p.projeto_id = :id)');
      replacements.id = config.no_owner_and_me;
      replacements.me_id = config.no_owner_and_me;

      me_fields = `, (p.projeto_id = :me_id) as me`;
      me_order = 'me desc ,';
    }

    const query = `
            select distinct p.id, p.nome as "name" ${me_fields}
            from projetos_rascunho p
            ${applyWhere(where)}
            order by ${me_order}"name"
        `;

    const projects = await db.instance().query(query, {
      type: Sequelize.QueryTypes.SELECT,
      replacements,
    });

    return { list: projects };
  } */

  /* Retorna uma lista de projetos, filtrando pelo titulo (parcial) */
  async listProjectsByName(where) {
    const sequelize = db.instance();

    const query = `
            select distinct p.id as value, p.nome as "label"
            from projetos p
            left join projetos__linhas_acao pla on pla.projeto_id = p.id
            left join projetos_atuacao pa on pa.projeto_id = p.id
            left join municipios m on m.cd_mun = pa.cd_mun
            ${where}
            order by "label"
        `;

    const projects = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return projects;
  }

  async listIntituicoesByName(nome) {
    const sequelize = db.instance();

    const query = `
            select distinct i.id as value, i.nome as "label"
            from instituicoes i
            where LOWER(unaccent(nome)) like '%${nome.toLowerCase()}%'
            order by "label"
        `;

    const intituicoes = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return intituicoes;
  }

  /* Retorna uma lista de municipios (com projetos), filtrado por nome (parcial) */
  async listMunicipiosByName(where) {
    const sequelize = db.instance();

    const query = `
            select distinct m.cd_mun as value, upper(m.nm_mun) as "label"
            from projetos p
            left join projetos__linhas_acao pla on pla.projeto_id = p.id
            inner join projetos_atuacao pa on pa.projeto_id = p.id
            inner join municipios m on m.cd_mun = pa.cd_mun
            ${where}
            order by "label"
        `;

    const municipios = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return municipios;
  }

  /* Retorna as listas de opcoes disponiveis */
  async getOptions(all = false) {
    /* se all, recupera todas as opcoes e nao somente aquelas que participam de projetos */
    const sequelize = db.instance();

    /* const modalidades = await sequelize.query(
      `
        select id as value, upper(nome) as "label"
        from modalidades
        order by nome
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    ); */

    const linhas_acao = await sequelize.query(
      `
        select id as value, upper(nome) as "label"
        from linhas_acao
        order by nome
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let regioes;
    if (!all) {
      regioes = await sequelize.query(
        `
        select distinct pa.nm_regiao as value, upper(pa.nm_regiao) as "label"
        from projetos p
        inner join projetos_atuacao pa on pa.projeto_id = p.id
        where nm_regiao <> 'NACIONAL'
        order by "label"`,
        {
          type: Sequelize.QueryTypes.SELECT,
        },
      );
      regioes = [{ value: 'NACIONAL', label: 'NACIONAL' }, ...regioes];
    } else {
      let regions = await this.getAllRegions();

      regioes = regions.list;
    }

    const instituicoes = await sequelize.query(
      `
        select id as value, nome as "label"
        from instituicoes
        order by nome
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const segmentos = await sequelize.query(
      `
        select id as value, nome as "label"
        from segmentos
        order by nome
        `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      /* modalidades, */
      linhas_acao,
      regioes,
      instituicoes,
      segmentos,
    };
  }

  async getAllRegions() {
    let list = [
      { id: 1, value: 'NACIONAL', label: 'NACIONAL' },
      { id: 2, value: 'CENTRO-OESTE', label: 'CENTRO-OESTE' },
      { id: 3, value: 'NORDESTE', label: 'NORDESTE' },
      { id: 4, value: 'NORTE', label: 'NORTE' },
      { id: 5, value: 'SUDESTE', label: 'SUDESTE' },
      { id: 6, value: 'SUL', label: 'SUL' },
    ];

    return { list };
  }

  /* Retorna uma lista de estados (UFs) que contem projetos  */
  async getUFs(f_regioes) {
    const sequelize = db.instance();

    let where = '';
    if (f_regioes)
      where = `where u.nm_regiao IN (${f_regioes
        .split(',')
        .map(r => `'${r}'`)
        .join(',')})`;

    const query = `
        select distinct u.id as value, u.nm_estado as "label"
        from projetos p
        inner join ufs u on u.id = any(p.ufs)
        ${where}
        order by "label"`;

    const ufs = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return ufs;
  }

  async getUFList(f_regioes) {
    const ufs = await this.getUFs(f_regioes);

    return { list: ufs.map(i => ({ id: i.value, name: i.label, value: i.value })) };
  }

  async listFacilitatorsStates() {
    const items = await db.instance().query(
      `
      select
        distinct u.id as "value",
        u.nm_estado as "label"
      from ufs u
      inner join facilitators f on f.state = u.sigla
      order by u.nm_estado
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return items;
  }

  async listFacilitators(config) {
    let where = [];
    let replacements = {};

    if (config.uf) {
      where.push('u.id = :uf');
      replacements.uf = config.uf;
    }

    const items = await db.instance().query(
      `
      select
        f.id,
        f.photo,
        f.name,
        f.institution,
        f.email,
        f.state
      from facilitators f
      inner join ufs u on u.sigla = f.state
      ${applyWhere(where)}
      order by f.name
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements,
      },
    );

    return items;
  }

  async listProjectsByFacilitator(community_id) {
    const sequelize = db.instance();

    // verifica se nacional esta entre areas deste facilitador
    let query;

    query = `select count(*) as qtd
    from facilitadores f
    where f."communityId" = ${community_id}
    and 'NACIONAL' = ANY(f.atuacao)`;

    const result = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    const whereNacional = result[0].qtd > 0 ? "OR pa.nm_regiao = 'NACIONAL'" : '';

    query = `
    select p.id, p.nome, p."community_id", array_agg(pa.nm_regiao) as referencia
    from projetos p
    left join projetos_atuacao pa on pa.projeto_id = p.id
    left join municipios m on m.cd_mun = pa.cd_mun
    where m.nm_uf in (select unnest(atuacao) from facilitadores f where f."communityId" = ${community_id})
    ${whereNacional}
    or p.facilitador_community_id = ${community_id}
    group by p.id
    order by p.nome
    `;
    const projects = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    return { projects };
  }

  async getProjectGeo(id) {
    const sequelize = db.instance();

    let atuacoes = await sequelize.query(
      `
        select pa.id, ST_AsGeoJSON(pa.geom) as geojson, ST_AsGeoJSON(ST_Envelope(pa.geom)) as bbox, m.mungeo
        from projetos_atuacao pa
        left join municipios m on m.cd_mun = pa.cd_mun
        where pa.projeto_id = ${parseInt(id)} and pa.geom is not null`,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    atuacoes = atuacoes.map(a => {
      a.bounds = parseBBOX(a.bbox);

      return a;
    });

    const bbox = await sequelize.query(
      `
        with bounds as (
          select ST_Extent(geom) as bbox
          from projetos_atuacao pa
          where pa.projeto_id = ${parseInt(id)} and geom is not null
        )
        select ST_YMin(bbox) as y1, ST_XMin(bbox) as x1, ST_YMax(bbox) as y2, ST_XMax(bbox) as x2
        from bounds`,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      atuacoes,
      bbox: bbox[0],
    };
  }

  async translate(field, values) {
    let result;

    switch (field) {
      case 'instituicao_id':
        result = await sequelize.query(`select nome from instituicoes where id = ${values[0]}`, {
          type: Sequelize.QueryTypes.SELECT,
        });
        return result.length ? result[0].nome : '';
      case 'linhas_acao':
        result = await sequelize.query(`select upper(nome) as nome from linhas_acao where id IN (${values})`, {
          type: Sequelize.QueryTypes.SELECT,
        });
        return result.length ? result.map(r => r.nome) : [];
      case 'modalidade_id':
        result = await sequelize.query(`select  upper(nome) as nome from modalidades where id =${values[0]}`, {
          type: Sequelize.QueryTypes.SELECT,
        });
        return result.length ? result[0].nome : '';
      default:
        throw new Error('Unknown field!');
    }
  }

  async waiting(communityId) {
    let where;

    if (communityId) {
      /* Se communityId recupera os usuarios na lista de espera para um projeto */
      where = `where p."communityId" = :communityId and adm = false and "resolvedAt" is null`;
    } else {
      /* Sem communityId recupara os usuarios na lista de espera por moderacao - todos os projetos */
      where = `where adm = true and "resolvedAt" is null`;
    }

    const query = `select p.id, "userId", "communityId", p2.nome as project_name, u.id as user_id, u."name" as user_name, u.email as user_email
    from participar p
    inner join projetos p2 on p2.community_id = p."communityId"
    inner join dorothy_users u on u.id = p."userId"
    ${where}`;

    const waiting = await sequelize.query(query, {
      replacements: { communityId },
      type: Sequelize.QueryTypes.SELECT,
    });

    return waiting;
  }

  async cancelWaiting(id) {
    /* Resolve o pedido de participacao */
    await sequelize.query(`delete from participar where id = :id`, {
      replacements: { id },
      type: Sequelize.QueryTypes.DELETE,
    });

    return { ok: true };
  }

  async approveWaiting(id) {
    /* recupera os dados da participacao e do usuario */
    const participation = await sequelize.query(
      `select p.id, "userId", "communityId", p2.nome as project_name, u.id as user_id, u."name" as user_name, u.email as user_email, adm
      from participar p
      inner join projetos p2 on p2.community_id = p."communityId"
      inner join dorothy_users u on u.id = p."userId"
      where p.id = :id and "resolvedAt" is null`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!participation) throw new Error('Nothing to approve based on participation ID!');

    const [pData] = participation;

    // console.log(pData.communityId, pData.user_name, pData.user_email, pData.adm ? 'ADM' : 'MEMBER')

    const isADM = pData.adm;

    /* Transforma em membro ou adm */
    require('../gt').addMember(pData.communityId, pData.user_id, isADM ? 'adm' : 'member');

    /* Resolve o pedido de participacao */
    await sequelize.query(`update participar set "resolvedAt" = NOW() where id = :id`, {
      replacements: { id },
      type: Sequelize.QueryTypes.UPDATE,
    });

    /* Envia email para o requerente  */
    const subject = isADM ? 'Confirmação de responsabilidade por iniciativa' : 'Confirmação de pedido de participação';

    const pedido = isADM ? 'moderador' : 'membro';
    const message = `Agora você é ${pedido} do grupo "${pData.project_name}".
    `;

    const msg = {
      to: pData.user_email,
      from: `Plataforma MonitoraEA <${process.env.CONTACT_EMAIL}>`,
      subject: `MonitoraEA - ${subject}`,
      text: `${message}\n\n${process.env.BASE_URL}/projeto/${pData.communityId}`,
      html: `${message.replace(/(?:\r\n|\r|\n)/g, '<br>')}\n\n<a href="${process.env.BASE_URL}/projeto/${
        pData.communityId
      }">Clique aqui para acessar esta iniciativa</a>`,
    };

    try {
      await sgMail.send(msg);
    } catch (err) {
      console.log('participation confirmation email error', {
        error: err.toString(),
      });
    }

    return { ok: true };
  }

  async participate(user, id, isADM) {
    /* Recupera o id da comunidade, a partir do id do projeto */
    const community = await db.instance().query(
      `
      select community_id, nome from projetos where id = :id
      `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!community) throw new Error('Project without community');

    const communityId = community[0].community_id;
    const projectName = community[0].nome;

    return require('../gt').participate(user, communityId, projectName, isADM);
  }

  async hasGeo(id) {
    const sequelize = db.instance();

    let [{ atuacao_aplica, atuacao_naplica_just, ufs }] = await sequelize.query(
      `
    select atuacao_aplica, atuacao_naplica_just, ufs
    from projetos_rascunho pa
    where pa.projeto_id = :id`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!!ufs && ufs.length) {
      ufs = await db.instance().query(
        `
        select
          u.id,
          u.nm_estado as "value",
          u.nm_estado as "label",
          u.nm_regiao as "region"
        from ufs u
        where u.id in (${ufs.join(',')})`,
        {
          type: Sequelize.QueryTypes.SELECT,
        },
      );
    }

    return { atuacao_aplica, atuacao_naplica_just, ufs };
  }

  async geoAble(id, isAble) {
    let isAbleString = null;
    if (isAble === '1') isAbleString = true;
    if (isAble === '0') isAbleString = false;

    await db.instance().query(
      `
    update projetos_rascunho
    set atuacao_aplica = :isAbleString
    where projeto_id = :id`,
      {
        replacements: { id, isAbleString },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );

    return { success: true };
  }

  async getGeoDraw(id) {
    const sequelize = db.instance();

    /* O primeiro passo e' verificar se ha, nesta tabela, qualquer registro para o projeto (id) */
    const [{ atuacao_edited }] = await sequelize.query(
      `
        select atuacao_edited
        from projetos_rascunho
        where projeto_id = :id`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    /* Se nao houver, copiar os registro deste projeto (id) de projetos_atuacao para projetos_atuacao_rascunho */
    /* e marcar que este projeto editou sua atuacao */
    if (!atuacao_edited) {
      await sequelize.query(
        `
        insert into projetos_atuacao_rascunho(projeto_id, geom)
        select projeto_id, geom from projetos_atuacao where projeto_id = :id`,
        {
          replacements: { id },
          type: Sequelize.QueryTypes.INSERT,
        },
      );

      await sequelize.query(
        `
        update projetos_rascunho
        set atuacao_edited = true
        where projeto_id = :id
      `,
        {
          replacements: { id },
          type: Sequelize.QueryTypes.INSERT,
        },
      );
    }

    const geoms = await sequelize.query(
      `
      select ST_AsGeoJSON((ST_Dump(pa.geom)).geom)::jsonb as geojson
      from projetos_atuacao_rascunho pa
      where projeto_id = :id`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const bbox = await sequelize.query(
      `
      select
            st_xmin(bb) as bbxmin,
            st_ymin(bb) as bbymin,
            st_xmax(bb) as bbxmax,
            st_ymax(bb) as bbymax
        from (select ST_Extent(geom) as bb
				      from projetos_atuacao_rascunho pa
				      where projeto_id = :id
			       ) s1
      `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      geoms: geoms.map(({ geojson }) => geojson),
      bbox: [
        [bbox[0].bbymin, bbox[0].bbxmin],
        [bbox[0].bbymax, bbox[0].bbxmax],
      ],
    };
  }

  async sendContact(id, name, email, message) {
    // descobre o id do gt
    let entities;

    entities = await db.instance().query(
      `
      select p.nome,
        p.community_id
      from projetos p
      where p.id = :id
      `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const projectName = entities[0].nome;
    const communityId = entities[0].community_id;

    // se gt tem membros, envia para gt
    entities = await db.instance().query(
      `
      select count(*) as total
      from dorothy_members dm
      where dm."communityId" = :communityId
      `,
      {
        replacements: { communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const hasMembers = entities[0].total > 0;

    // se gt nao tem membros, envia para adm (referindo o GT)
    let room;
    if (hasMembers) room = `room_c${communityId}_t1`;
    else room = `room_c1_t1`;

    /* NOTIFICACAO */

    let content = {
      projectName,
      communityId,
      name,
      email,
      message,
      isADM: !hasMembers,
    };

    await Messagery.sendNotification({ id: 0 }, room, {
      content,
      userId: 0,
      tool: {
        type: 'native',
        element: 'NewContactFromSite',
      },
    });

    return {
      success: true,
    };
  }

  async getGeoDrawSave(id, geoms) {
    /* apaga os registro para este projeto id */
    await db.instance().query(
      `
        delete from projetos_atuacao_rascunho where projeto_id = :id`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.DELETE,
      },
    );

    /* grava os novos registro para este projeto id */
    for (let idx = 0; idx < geoms.length; idx++) {
      const geom = geoms[idx];

      await db.instance().query(
        `
        insert into projetos_atuacao_rascunho(projeto_id, geom)
        values(:id, ST_GeomFromGeoJSON(:geom))`,
        {
          replacements: { id, geom: JSON.stringify(geom) },
          type: Sequelize.QueryTypes.INSERT,
        },
      );
    }

    /* identifica e atualiza os estados */
    const ufs = await db.instance().query(
      `
      with w_points as (
          select
              CASE
          WHEN ST_GeometryType(par.geom) = 'ST_Point' then ST_Buffer(par.geom, 0.00001, 'quad_segs=8')
          else par.geom
          end as geom,
              par.projeto_id
          from projetos_atuacao_rascunho par
      ), u_geom as (
          select
              ST_Transform(ST_Union(ST_MakeValid(geom, 'method=structure')),3857) as geom
          from w_points
        where projeto_id =  :id
      ), a_geom as (
          select st_area(geom) as area from u_geom
      ), inter as (
          select
              u.id,
              u.nm_estado,
              ST_AREA(ST_intersection(u_geom.geom, u.geom)) as area_inter
          from u_geom
          inner join ufs u on ST_intersects(u_geom.geom, u.geom) and u.id <> 28
      ), percent as (
          select
              id,
              nm_estado as label,
              nm_estado as value,
              area_inter / a_geom.area * 100 as percent_area_inter
          from inter
          inner join a_geom on true
          order by 3 desc
      )
      select *
      from percent p
      where p.percent_area_inter >= 0.5
  `,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { id },
      },
    );

    await db.instance().query(
      `
      update projetos_rascunho
      set ufs = '{${ufs.map(u => u.id).join(',')}}'
      where projeto_id = :id
    `,
      {
        replacements: {
          id,
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { ok: true, ufs };
  }

  async importSHP(filePath) {
    const source = await shapefile.openShp(filePath);
    const result = await source.read();

    const feature = {
      type: 'Feature',
      geometry: result.value,
      properties: {
        name: 'co2',
      },
    };

    return { geojson: simplify(feature, 0.001) };
  }

  /* v2 */
  async getDraftNetwork(id) {
    let entity = await db.instance().query(
      `
        select
        pr.id as "draft_id"
      from projetos_rascunho pr
      where pr.projeto_id = :id`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!entity.length) return null;

    const relacoes = await db.instance().query(
      `
      select
        pr."data"->>'pp_base' as "pp_base",
        pr."data"->>'apoiada_base' as "apoiada_base",
        pr."data"->>'apoia_base' as "apoia_base"
      from projetos_relacoes pr
      where pr.projeto_rascunho_id = :id
      `,
      {
        replacements: { id: entity[0].draft_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!!relacoes.length) {
      entity[0].pp_base = relacoes[0].pp_base;
      entity[0].apoiada_base = relacoes[0].apoiada_base;
      entity[0].apoia_base = relacoes[0].apoia_base;
    } else {
      entity[0].pp_base = 'none';
      entity[0].apoiada_base = 'none';
      entity[0].apoia_base = 'none';
    }

    entity[0].pp = await db.instance().query(
      `
      select
        politica_id as "id",
        p.nome as "name",
        "type",
        other_type
      from
        projetos_relacoes pr,
        jsonb_to_recordset((pr."data"->>'politicas')::jsonb) AS specs(politica_id int, "type" jsonb, "other_type" varchar)
      inner join politicas p on p.id = politica_id
      where pr.projeto_rascunho_id = :id
      `,
      {
        replacements: { id: entity[0].draft_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );
    const pp_length = entity[0].pp.length;

    for (let i = 5; i >= pp_length; i--) entity[0].pp.push({ id: null, name: '', type: [], other_type: '' });

    //****************************

    entity[0].apoiada = await db.instance().query(
      `
      select
        i.id as instituicao_id,
        coalesce(i.nome,'') as instituicao_name,
        case
          when p_i.id is not null then concat('indic_', p_i.id)
          else null
        end	as iniciativa_id,
        coalesce(p_rasc.nome, p_i."name", '') as iniciativa_name,
        "type",
        other_type
      from
        projetos_relacoes pr,
          jsonb_to_recordset((pr."data"->>'recebe_apoio')::jsonb) AS specs(instituicao_id int, projeto_indicado_id int, "type" jsonb, "other_type" varchar)
      left join instituicoes i on i.id = instituicao_id
      left join projetos_indicados p_i on p_i.id = projeto_indicado_id
      left join projetos_rascunho p_rasc on p_rasc.id = p_i.projeto_id
      where pr.projeto_rascunho_id = :id
      `,
      {
        replacements: { id: entity[0].draft_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const apoiada_length = entity[0].apoiada.length;
    for (let i = 5; i >= apoiada_length; i--)
      entity[0].apoiada.push({
        instituicao_id: null,
        instituicao_name: '',
        iniciativa_id: null,
        iniciativa_name: '',
        type: [],
        other_type: '',
      });

    //****************************

    entity[0].apoia = await db.instance().query(
      `
      select
        i.id as instituicao_id,
        coalesce(i.nome,'') as instituicao_name,
        case
          when p_i.id is not null then concat('indic_', p_i.id)
          else null
        end	as iniciativa_id,
        coalesce(p_rasc.nome, p_i."name", '') as iniciativa_name,
        "type",
        other_type
      from
        projetos_relacoes pr,
          jsonb_to_recordset((pr."data"->>'oferece_apoio')::jsonb) AS specs(instituicao_id int, projeto_indicado_id int, "type" jsonb, "other_type" varchar)
      left join instituicoes i on i.id = instituicao_id
      left join projetos_indicados p_i on p_i.id = projeto_indicado_id
      left join projetos_rascunho p_rasc on p_rasc.id = p_i.projeto_id
      where pr.projeto_rascunho_id = :id
      `,
      {
        replacements: { id: entity[0].draft_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const apoia_length = entity[0].apoia.length;
    for (let i = 5; i >= apoia_length; i--)
      entity[0].apoia.push({
        instituicao_id: null,
        instituicao_name: '',
        iniciativa_id: null,
        iniciativa_name: '',
        type: [],
        other_type: '',
      });

    return entity[0];
  }

  async get(id) {
    let entity = await db.instance().query(
      `
        select
        pr.id as "draft_id",
        pr.nome,
        pr.instituicao_id,
        pr.modalidade_id,
        pr.contatos,
        pr.objetivos_txt,
        pr.aspectos_gerais_txt,
        -- pr.publico_txt,
        pr.periodo_txt,
        pr.publicos,
        pr.tematicas,
        pr.publicos_especificar,
        pr.tematicas_especificar,
        pr.parceiros_txt,
        pr.atuacao,
        pr.relacionado_ppea,
        pr.qual_ppea,
        pr.ufs,
        pr.status_desenvolvimento,
        pr.mes_inicio,
        pr.mes_fim,
        i.porte as "instituicao_porte"
      from projetos_rascunho pr
      left join instituicoes i on i.id = pr.instituicao_id
      where pr.projeto_id = :id`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!entity.length) return null;

    // relações -> getDraftNetwork

    if (entity[0].instituicao_id) {
      entity[0].instituicao_segmentos = await db.instance().query(
        `
        select
          s.id,
          s.nome as "name"
        from segmentos s
        inner join instituicoes i on s.id = any(i.segmentos)
        where i.id = :instituicao_id`,
        {
          replacements: { instituicao_id: entity[0].instituicao_id },
          type: Sequelize.QueryTypes.SELECT,
        },
      );
    }

    if (!!entity[0].ufs && entity[0].ufs.length) {
      entity[0].ufs = await db.instance().query(
        `
        select
          u.id,
          u.nm_estado as "value",
          u.nm_estado as "label",
          u.nm_regiao as "region"
        from ufs u
        where u.id in (${entity[0].ufs.join(',')})`,
        {
          replacements: { instituicao_id: entity[0].instituicao_id },
          type: Sequelize.QueryTypes.SELECT,
        },
      );
    }

    if (!!entity[0].publicos && entity[0].publicos.length) {
      const publicos = await db.instance().query(
        `
        select
          e.id,
          e.id as "value",
          e.nome as "label"
        from publicos e
        where e.id in (${entity[0].publicos.join(',')})`,
        {
          type: Sequelize.QueryTypes.SELECT,
        },
      );

      if (entity[0].publicos.includes(-1)) publicos.push({ id: -1, value: -1, label: 'Outros - especificar' });
      entity[0].publicos = publicos;
    }

    if (!!entity[0].tematicas && entity[0].tematicas.length) {
      const tematicas = await db.instance().query(
        `
        select
          e.id,
          e.id as "value",
          e.nome as "label"
        from tematicas_socioambientais e
        where e.id in (${entity[0].tematicas.join(',')})`,
        {
          type: Sequelize.QueryTypes.SELECT,
        },
      );

      if (entity[0].tematicas.includes(-1)) tematicas.push({ id: -1, value: -1, label: 'Outros - especificar' });
      entity[0].tematicas = tematicas;
    }

    return entity[0];
  }

  async getDraftInfo(id) {
    let draft = await this.get(id);

    /* Se nao encontrar o registro de rascunho do projeto, criar */
    if (!draft) draft = await this.createDraft(id);

    return {
      project: draft,
    };
  }

  async getDraftName(id) {
    let entity = await db.instance().query(
      `
      select id, nome as "name"
      from projetos_rascunho pr
      where pr.projeto_id = :id`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return entity[0];
  }

  async saveDraftInfo(id, data) {
    if (data.relacionado_ppea !== 'sim') data['qual_ppea'] = null;

    let mes_inicio_str = 'mes_inicio = NULL,';
    if (
      !!data.mes_inicio &&
      ['nao_iniciada', 'em_desenvolvimento', 'finalizada', 'interrompida'].includes(data.status_desenvolvimento)
    ) {
      mes_inicio_str = `mes_inicio = '${dayjs(data.mes_inicio)
        .set('date', 2)
        .set('hour', 0)
        .set('minute', 0)
        .set('second', 0)}',`;
    }
    let mes_fim_str = 'mes_fim = NULL,';
    if (
      !!data.mes_fim &&
      ['nao_iniciada', 'finalizada', 'interrompida', 'em_desenvolvimento'].includes(data.status_desenvolvimento)
    ) {
      mes_fim_str = `mes_fim = '${dayjs(data.mes_fim)
        .set('date', 2)
        .set('hour', 0)
        .set('minute', 0)
        .set('second', 0)}}',`;
    }

    await db.instance().query(
      `
        update projetos_rascunho
        set nome = :nome,
            modalidade_id = :modalidade_id,

            instituicao_id = :instituicao_id,

            atuacao = :atuacao,
            objetivos_txt = :objetivos_txt,
            aspectos_gerais_txt = :aspectos_gerais_txt,
            periodo_txt = :periodo_txt,
            parceiros_txt = :parceiros_txt,
            contatos = :contatos,

            publicos = '{${!!data.publicos?.length ? data.publicos.map(p => p.id).join(',') : ''}}',
            tematicas = '{${!!data.tematicas?.length ? data.tematicas.map(t => t.id).join(',') : ''}}',

            publicos_especificar = :publicos_especificar,
            tematicas_especificar = :tematicas_especificar,

            ufs = '{${!!data.ufs?.length ? data.ufs.map(u => u.id).join(',') : ''}}',
            status_desenvolvimento = :status_desenvolvimento,
            ${mes_inicio_str}
            ${mes_fim_str}

            relacionado_ppea = :relacionado_ppea,
            qual_ppea = :qual_ppea
        where projeto_id = :id`,
      {
        replacements: {
          id,
          nome: data.nome,

          modalidade_id: data.modalidade_id,

          instituicao_id: data.instituicao_id,

          atuacao: data.atuacao
            ? `{${data.atuacao.reduce((accum, item) => `${accum}${accum.length ? ',' : ''}"${item}"`, '')}}`
            : null,

          objetivos_txt: cleanItems(data.objetivos_txt),
          aspectos_gerais_txt: cleanItems(data.aspectos_gerais_txt),
          periodo_txt: cleanItems(data.periodo_txt),
          parceiros_txt: cleanItems(data.parceiros_txt),

          publicos_especificar: data.publicos_especificar,
          tematicas_especificar: data.tematicas_especificar,

          contatos: JSON.stringify(data.contatos),

          status_desenvolvimento: data.status_desenvolvimento,

          relacionado_ppea: data.relacionado_ppea,
          qual_ppea: data.qual_ppea,
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    // sobrescreve segmentos e porte da instituicao
    if (!!data.instituicao_id) {
      await db.instance().query(
        `
        update instituicoes
        set segmentos = '{${
          !!data.instituicao_segmentos?.length ? data.instituicao_segmentos.map(s => s.id).join(',') : ''
        }}',
            porte = :porte
        where id = :id
        `,
        {
          replacements: { id: data.instituicao_id, porte: data.instituicao_porte },
          type: Sequelize.QueryTypes.UPDATE,
        },
      );
    }

    // Trata de indicacao
    let entity = await db.instance().query(
      `
      select id
      from projetos_indicados pi
      where pi.projeto_id = :id`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const draft = await this.get(id);

    if (!!entity.length > 0 && (!data.indicado || data.indicado !== entity[0].id)) {
      // nao uso mais indicado e tem um indicado apontando para mim
      // remove meu id do indicado
      await db.instance().query(
        `
        update projetos_indicados
        set projeto_id = NULL
        where projeto_id = :projeto_id
        `,
        {
          replacements: { projeto_id: id },
          type: Sequelize.QueryTypes.UPDATE,
        },
      );
    }

    if (!!data.indicado) {
      // uso indicado
      // coloca meu id em indicado
      await db.instance().query(
        `
        update projetos_indicados
        set projeto_id = :projeto_id
        where id = :indicado_id
        `,
        {
          replacements: { projeto_id: id, indicado_id: data.indicado },
          type: Sequelize.QueryTypes.UPDATE,
        },
      );
    }

    return draft;
  }

  async saveIndicationInfo(id, data) {
    // console.log({ id, data });

    // se withData, grava dados
    if (data.withData) {
      await db.instance().query(
        `
        INSERT INTO projetos_indicados_info(projeto_indicado_id, contact_name, contact_email, contact_phone, website, "createdAt","updatedAt")
        values(:projeto_indicado_id, :contact_name, :contact_email, :contact_phone, :website, NOW(),NOW())
        `,
        {
          replacements: {
            projeto_indicado_id: id,
            contact_name: data.contact_name,
            contact_email: data.contact_email,
            contact_phone: data.contact_phone,
            website: data.website,
          },
          type: Sequelize.QueryTypes.INSERT,
        },
      );
    }

    // atualiza notificacao com refresh
    const notificationData = await Messagery.getNotificationData(data.notificationId);
    if (!notificationData) return { success: false, error: 'Notification does not exist!' };

    await Messagery.updateNotificationContent(
      data.notificationId,
      { ...notificationData.content, answered: true },
      true,
    );

    return { success: true };
  }

  async saveDraftNetwork(id, data) {
    console.log({ id, data: JSON.stringify(data) });

    let relation_data = {
      politicas: [],
      recebe_apoio: [],
      oferece_apoio: [],
      pp_base: data.pp_base,
      apoiada_base: data.apoiada_base,
      apoia_base: data.apoia_base,
    };

    //********************************************** */

    let result;

    // recupera dados do projeto indicador
    result = await db.instance().query(
      `
      select pr.id, pr.nome as "name"
      from projetos_rascunho pr
      inner join projetos p on p.id = pr.projeto_id
      where p.id = :id
      `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const indicador = result[0];

    if (data.pp_base === 'sim') {
      for (let d of data.pp) {
        if (!!d.name) {
          let ppId = d.id;
          if (!ppId) {
            /* cria politica, se necessario */
            result = await db.instance().query(
              `
              INSERT INTO politicas(nome)
              VALUES(:nome)
              RETURNING id
              `,
              {
                replacements: { nome: d.name },
                type: Sequelize.QueryTypes.SELECT,
              },
            );

            ppId = result[0].id;
          }

          relation_data.politicas.push({
            type: d.type,
            other_type: d.other_type,
            politica_id: ppId,
          });
        }
      }
    }

    //********************************************** */

    for (let what of ['apoiada', 'apoia']) {
      if (data[`${what}_base`] === 'sim') {
        for (let d of data[what]) {
          if (!!d.instituicao_name) {
            let instituionId = d.instituicao_id;
            if (!instituionId) {
              /* cria instituicao, se necessario */
              result = await db.instance().query(
                `
              INSERT INTO instituicoes(nome)
              VALUES(:nome)
              RETURNING id
              `,
                {
                  replacements: { nome: d.instituicao_name },
                  type: Sequelize.QueryTypes.SELECT,
                },
              );

              instituionId = result[0].id;
            }

            let projeto_indicado_id = null;

            if (!!d.iniciativa_name.length) {
              let projectId = d.iniciativa_id;
              if (!projectId) {
                /* NOVA */
                result = await db.instance().query(
                  `
                  INSERT INTO projetos_indicados(name, instituicao_id)
                  VALUES (:name, :instituicao_id)
                  RETURNING id
                  `,
                  {
                    replacements: { name: d.iniciativa_name, instituicao_id: instituionId },
                    type: Sequelize.QueryTypes.SELECT,
                  },
                );

                projeto_indicado_id = result[0].id;

                /* NOTIFICACAO */
                let content = {
                  indicationId: projeto_indicado_id,
                  indicationName: d.iniciativa_name,
                  type: what,
                  answered: false,
                };

                await Messagery.sendNotification({ id: 0 }, `room_c${data.communityId}_t1`, {
                  content,
                  userId: 0,
                  tool: {
                    type: 'native',
                    element: 'NewIndicatedProjectNotification',
                  },
                });
              } else {
                /* tem id, indic ou draft */

                const [type, eId] = projectId.split('_');
                //console.log({ type, eId })
                if (type === 'indic') projeto_indicado_id = eId;
                else {
                  // tem indic para este draft_[este ID]?
                  result = await db.instance().query(
                    `
                    select id
                    from projetos_indicados p
                    where p.projeto_id = :id
                    `,
                    {
                      replacements: { id: eId },
                      type: Sequelize.QueryTypes.SELECT,
                    },
                  );

                  if (!!result.length) projeto_indicado_id = result[0].id;
                  else {
                    result = await db.instance().query(
                      `
                      INSERT INTO projetos_indicados(projeto_id, name, instituicao_id)
                      VALUES (:draft_id, :name, :instituicao_id)
                      RETURNING id
                      `,
                      {
                        replacements: { draft_id: eId, name: d.iniciativa_name, instituicao_id: instituionId },
                        type: Sequelize.QueryTypes.SELECT,
                      },
                    );

                    projeto_indicado_id = result[0].id;
                  }

                  /****
                   * NOTIFICACOES
                   */

                  // qual a comunidade deste projeto?
                  result = await db.instance().query(
                    `
                    select p.community_id
                    from projetos_rascunho pr
                    inner join projetos p on p.id = pr.projeto_id
                    where pr.id = :id
                    `,
                    {
                      replacements: { id: eId },
                      type: Sequelize.QueryTypes.SELECT,
                    },
                  );

                  const communityId = result[0].community_id;

                  const content = {
                    sourceProjectId: id,
                    sourceDraftId: indicador.id,
                    sourceProjectName: indicador.name,
                    indicationId: projeto_indicado_id,
                    type: what,
                  };

                  const key = `indication_${indicador.id}_${projeto_indicado_id}_${what}`;

                  await Messagery.sendNotification(
                    { id: 0 },
                    `room_c${communityId}_t1`,
                    {
                      content,
                      userId: 0,
                      tool: {
                        type: 'native',
                        element: 'IndicationNotification',
                      },
                    },
                    [key],
                    true,
                    {
                      dedup: [key],
                    },
                  );
                }
              }
            }

            relation_data[what === 'apoiada' ? 'recebe_apoio' : 'oferece_apoio'].push({
              type: d.type,
              other_type: d.other_type,
              instituicao_id: instituionId,
              projeto_indicado_id,
            });
          }
        }
      }
    }

    /* descobre o id do draft */
    let entity = await db.instance().query(
      `
      select pr.id, pr2.id as "relation_id"
      from projetos_rascunho pr
      left join projetos_relacoes pr2 on pr2.projeto_rascunho_id = pr.id
      where pr.projeto_id = :id`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    // console.log(JSON.stringify(relation_data))

    const relationId = entity[0].relation_id;
    if (!!relationId) {
      /* Atualiza */
      await db.instance().query(
        `
        update projetos_relacoes
        set data = '${JSON.stringify(relation_data).replace(/\:null/g, ': null')}' /* gambiarra */
        where projeto_rascunho_id = :draft_id
        `,
        {
          replacements: { draft_id: entity[0].id },
          type: Sequelize.QueryTypes.UPDATE,
        },
      );
    } else {
      await db.instance().query(
        `
        insert into projetos_relacoes(projeto_rascunho_id, data)
        values(:draft_id, '${JSON.stringify(relation_data).replace(/\:null/g, ': null')}')  /* gambiarra */
        `,
        {
          replacements: { draft_id: entity[0].id },
          type: Sequelize.QueryTypes.INSERT,
        },
      );
    }
  }

  async getRelationAgreement(id, type, sourceDraftId, indicationId) {
    let entity = await db.instance().query(
      `
      select agreement
      from projetos_reconhecimentos pr
      where pr.type_of_support = :type
      and pr.projeto_rascunho_id = :sourceDraftId
      and pr.projeto_indicado_id = :indicationId
      `,
      {
        replacements: { type: type === 'apoia' ? 'apoia' : 'apoiada', sourceDraftId, indicationId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return { agreement: !!entity.length ? entity[0].agreement : null };
  }

  async saveRelationAgreement(id, data) {
    await db.instance().query(
      `
      insert into projetos_reconhecimentos(projeto_rascunho_id, projeto_indicado_id, type_of_support, agreement, "createdAt", "updatedAt")
      values(:projeto_rascunho_id, :projeto_indicado_id, :type_of_support, :agreement, NOW(), NOW())
      `,
      {
        replacements: {
          projeto_rascunho_id: data.sourceDraftId,
          projeto_indicado_id: data.indicationId,
          type_of_support: data.type === 'apoia' ? 'apoia' : 'apoiada',
          agreement: data.agreement,
        },
        type: Sequelize.QueryTypes.INSERT,
      },
    );

    /* refresh notification (LIVE) */
    const watch = `indication_${data.sourceDraftId}_${data.indicationId}_${
      data.type === 'apoia' ? 'apoia' : 'apoiada'
    }`;
    Messagery.refreshNotifications(watch);

    return { success: true };
  }

  async delete(id, user) {
    const result = await this.getProjectIdFromCommunity(id);

    if (result) {
      let project = result;

      await db.instance().query(
        `
        delete from projetos_atuacao
        where projeto_id = :id
    `,
        {
          replacements: {
            id: project.id,
          },
          type: Sequelize.QueryTypes.DELETE,
        },
      );

      await db.instance().query(
        `
      delete from projetos_atuacao_rascunho
      where projeto_id = :id
  `,
        {
          replacements: {
            id: project.id,
          },
          type: Sequelize.QueryTypes.DELETE,
        },
      );

      await db.instance().query(
        `
      delete from projetos__linhas_acao
      where projeto_id = :id
  `,
        {
          replacements: {
            id: project.id,
          },
          type: Sequelize.QueryTypes.DELETE,
        },
      );

    //   await db.instance().query(
    //     `
    //     delete from projetos__linhas_atuacao
    //     where projeto_id = :id
    // `,
    //     {
    //       replacements: {
    //         id: project.id,
    //       },
    //       type: Sequelize.QueryTypes.DELETE,
    //     },
    //   );

      await db.instance().query(
        `
      delete from projetos
      where id = :id
  `,
        {
          replacements: {
            id: project.id,
          },
          type: Sequelize.QueryTypes.DELETE,
        },
      );
    }

    // TODO: remove community and members
    await db.instance().query(
      `
      delete from dorothy_communities
      where id = :id
  `,
      {
        replacements: {
          id: id,
        },
        type: Sequelize.QueryTypes.DELETE,
      },
    );

    await db.instance().query(
      `
      delete from dorothy_members
      where "communityId" = :communityId
  `,
      {
        replacements: {
          communityId: id,
        },
        type: Sequelize.QueryTypes.DELETE,
      },
    );

    // get user membership from DB
    const membership = await db.instance().query(
      `
      select dm."communityId" as id
      from dorothy_members dm
      where dm."userId" = :userId
      `,
      {
        replacements: {
          userId: user.id,
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (membership.some(m => m.id === 1)) {
      return 1;
    } else if (membership.some(m => m.id === 250)) {
      return 250;
    } else {
      await require('../gt').addMember(250, user.id);
      return 250;
    }
  }

  async verify(id) {
    let result = await db.instance().query(
      ` select
          p.*,
          pr.id as pr_id,
          pro.publicacao
        from projetos_rascunho p
        left join projetos_relacoes pr on pr.projeto_rascunho_id = p.id
        left join projetos pro on pro.id = p.projeto_id
        where projeto_id = :id`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!result.length) return null;

    const project = result[0];

    let conclusion = { ready: true };

    let analysis = {
      information: {},
      connections: true,
      dims: {},
      indics: {},
      geo: true,
      question_problems: [],
      published: project.publicacao || false,
    };

    // ATUACAO
    if (project.atuacao_aplica === null) {
      analysis.geo = false;
      conclusion.ready = false;
    }
    if (project.atuacao_aplica === false && (!project.atuacao_naplica_just || !project.atuacao_naplica_just.length)) {
      analysis.geo = false;
      conclusion.ready = false;

      if (!project.atuacao_naplica_just || !project.atuacao_naplica_just.length)
        analysis.question_problems.push('naplica_just');
    }

    // INFORMACOES

    for (let item of [
      'nome',
      'objetivos_txt',
      // 'aspectos_gerais_txt',
      // 'parceiros_txt',
      'atuacao',
      'publicos',
      'tematicas',
    ]) {
      analysis.information[item] = this.check(!!project[item] && project[item].length > 0, conclusion);
    }

    if ('NACIONAL'.includes(project.atuacao)) analysis.information.ufs = true;
    else analysis.information.ufs = this.check(!!project.ufs && project.ufs.length > 0, conclusion);

    for (let item of ['instituicao_id', 'modalidade_id'])
      analysis.information[item] = this.check(!!project[item], conclusion);

    analysis.information.contatos = this.check(
      !!project.contatos &&
        !!project.contatos[0] &&
        (project.contatos[0].nome.length > 0 ||
          project.contatos[0].email.length > 0 ||
          project.contatos[0].tel.length > 0),
      conclusion,
    );

    if (project['publicos'] && project['publicos'].includes(-1) && !project['publicos_especificar']) {
      analysis.information.publicos_especificar = false;
      conclusion.ready = false;
    }
    if (project['tematicas'] && project['tematicas'].includes(-1) && !project['tematicas_especificar']) {
      analysis.information.tematicas_especificar = false;
      conclusion.ready = false;
    }

    // analysis.information.relacionado_ppea = this.check(!!project.relacionado_ppea && project.relacionado_ppea !== 'none', conclusion);
    analysis.information.qual_ppea = this.check(!!project.qual_ppea || project.relacionado_ppea !== 'sim', conclusion);

    analysis.information.status_desenvolvimento = this.check(project.status_desenvolvimento !== 'none', conclusion);
    analysis.information.mes_inicio =
      !['em_desenvolvimento', 'finalizada', 'interrompida', 'nao_iniciada'].includes(project.status_desenvolvimento) ||
      this.check(!!project.mes_inicio, conclusion);
    analysis.information.mes_fim =
      !['em_desenvolvimento', 'finalizada', 'interrompida', 'nao_iniciada'].includes(project.status_desenvolvimento) ||
      this.check(!!project.mes_fim, conclusion);

    // CONEXOES
    analysis.connections = true;
    if (!project.pr_id) {
      analysis.connections = false;
      // ATENÇÃO: em março de 2022, a verificação está ignorando conexões //  conclusion.ready = false;
    }

    // INDICADORES
    for (let lae of indics.LAEs) {
      analysis.dims[lae.id] = {
        title: lae.title,
        ready: true,
      };

      const laeIndics = indics.INDICs.filter(i => i.lae_id === lae.id);

      for (let indic of laeIndics) {
        const dbKey = `${lae.id}_${indic.id}`;
        analysis.indics[dbKey] = {
          title: indic.name,
          ready: true,
        };
        const itemData = project.indicadores[dbKey];

        const itemStatus = this.checkIndic(indic, itemData);
        if (!itemStatus.result) {
          analysis.indics[dbKey].ready = false;
          analysis.dims[lae.id].ready = false;
          // ATENÇÃO: em março de 2022, a verificação está ignorando indicadores // conclusion.ready = false;
          analysis.question_problems = [...analysis.question_problems, ...itemStatus.problems];
        }
      }
    }

    return {
      ready: conclusion.ready,
      analysis,
    };
  }

  check(test, conclusion) {
    if (!test) conclusion.ready = false;

    return test;
  }

  checkIndic(indic, itemData) {
    const dbKey = `${indic.lae_id}_${indic.id}`;

    let problems = [];
    if (!itemData || !itemData.base || itemData.base === 'none') {
      problems.push(`${dbKey}_base`);

      return { result: false, problems };
    } else if (itemData.base === 'sim') {
      let isOk = true;
      for (let question of indic.questions) {
        const data = itemData[question.id];
        if (!indics.TEST_TYPES[question.type](data)) {
          isOk = false;

          problems.push(`${dbKey}_${question.id}`);
        }
      }

      return { result: isOk, problems };
    }

    return { result: true, problems };
  }

  getLaesFromIndics(indicadores) {
    let laes = [];

    for (let lae of indics.LAEs) {
      const laeIndics = indics.INDICs.filter(i => i.lae_id === lae.id);

      for (let indic of laeIndics) {
        const dbKey = `${lae.id}_${indic.id}`;
        const itemData = indicadores[dbKey];

        if (itemData && itemData.base === 'sim') {
          laes.push(lae);
          break;
        }
      }
    }

    return laes;
  }

  async publish(id) {
    /* Recupera o rascunho */
    const draft = await this.retrieveProjectDraft(id);

    // verifica, se nao ready, retorna com erro
    // ATENÇÃO: em março de 2025, a verificação desconsidera indicadores e conexões
    let verification = await this.verify(id);

    if (!verification.ready)
      return { success: false, reason: { code: 'not_ready', message: 'project draft is not ready', verification } };

    const laes = this.getLaesFromIndics(draft.indicadores).map(l => l.id);

    /* prepare complex update fields */
    /* Contatos */
    let nome_ponto_focal = [],
      email_contatos = [],
      tel_contatos = [];
    draft.contatos.forEach(({ nome, email, tel }) => {
      nome_ponto_focal.push(nome ? nome : '');
      email_contatos.push(email ? email : '');
      tel_contatos.push(tel ? tel : '');
    });

    const mes_inicio = dayjs(draft.mes_inicio).isValid() ? dayjs(draft.mes_inicio).format('YYYY-MM-DD') : null;
    const mes_fim = dayjs(draft.mes_fim).isValid() ? dayjs(draft.mes_fim).format('YYYY-MM-DD') : null;

    /* Update project*/
    await db.instance().query(
      `
        update projetos
        set nome = :nome,
        modalidade_id = :modalidade_id,
        objetivos_txt = :objetivos_txt,
        aspectos_gerais_txt = :aspectos_gerais_txt,

        parceiros_txt = :parceiros_txt,
        indicadores = :indicadores,
        relacionado_ppea = :relacionado_ppea,
        qual_ppea = :qual_ppea,
        publicacao = NOW(),

        nome_ponto_focal = :nome_ponto_focal,
        email_contatos = :email_contatos,
        tel_contatos = :tel_contatos,

        instituicao_id = :instituicao_id,

        ufs = :ufs,
        status_desenvolvimento = :status_desenvolvimento,
        mes_inicio = :mes_inicio,
        mes_fim = :mes_fim,

        publicos = :publicos,
        tematicas = :tematicas,
        publicos_especificar = :publicos_especificar,
        tematicas_especificar = :tematicas_especificar

        where id = :id
      `,
      {
        replacements: {
          id,
          nome: draft.nome,
          modalidade_id: draft.modalidade_id,
          objetivos_txt: draft.objetivos_txt,
          aspectos_gerais_txt: draft.aspectos_gerais_txt,

          parceiros_txt: draft.parceiros_txt,
          indicadores: JSON.stringify(draft.indicadores),
          relacionado_ppea: draft.relacionado_ppea,
          qual_ppea: draft.qual_ppea,

          nome_ponto_focal: JSON.stringify(nome_ponto_focal),
          email_contatos: JSON.stringify(email_contatos),
          tel_contatos: JSON.stringify(tel_contatos),

          instituicao_id: draft.instituicao_id,

          ufs: `{${draft.ufs.join(',')}}`,
          status_desenvolvimento: draft.status_desenvolvimento,
          mes_inicio,
          mes_fim,

          publicos: `{${draft.publicos.join(',')}}`,
          tematicas: `{${draft.tematicas.join(',')}}`,
          publicos_especificar: draft.publicos_especificar || '',
          tematicas_especificar: draft.tematicas_especificar || '',
        },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );

    /*
    ufs: [ 11 ],
    status_desenvolvimento: 'finalizada',
    mes_inicio: 2023-01-01T20:00:00.000Z,
    mes_fim: 2023-05-01T18:00:00.000Z,
    */

    /* atualiza o nome da comunidade */
    await db.instance().query(
      `
    update dorothy_communities
    set descriptor_json = jsonb_set(descriptor_json , '{"title"}', jsonb '"${draft.nome}"', true)
    where id = :id
    `,
      {
        replacements: {
          id: draft.community_id,
        },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );

    /* tabelas relacionadas */

    /* atuacao */
    /* apaga as atuacoes atuais */
    /* se nao foi editado, preserva as geometrias e remove o resto */
    const where = draft.atuacao_edited || !draft.atuacao_aplica ? '' : 'and geom is null';
    await db.instance().query(
      `
          delete from projetos_atuacao where projeto_id = :id
          ${where}
        `,
      {
        replacements: {
          id,
        },
        type: Sequelize.QueryTypes.DELETE,
      },
    );

    /* 1 info */
    for (let idx = 0; idx < draft.atuacao.length; idx++) {
      const nm_regiao = draft.atuacao[idx];

      await db.instance().query(
        `
          insert into projetos_atuacao(projeto_id, nm_regiao)
          values(:id, :nm_regiao)
        `,
        {
          replacements: {
            id,
            nm_regiao,
          },
          type: Sequelize.QueryTypes.INSERT,
        },
      );
    }

    // console.log(draft);

    /* 2 geo */
    if (draft.atuacao_aplica) {
      await db.instance().query(
        `
        insert into projetos_atuacao(projeto_id, geom)
        select projeto_id, geom from projetos_atuacao_rascunho where projeto_id = :id
        `,
        {
          replacements: {
            id,
          },
          type: Sequelize.QueryTypes.INSERT,
        },
      );
    }

    /* projetos__linhas_acao - EMERGE DOS INDICADORES! */
    /* apaga as projetos__linhas_acao */
    await db.instance().query(
      `
          delete from projetos__linhas_acao where projeto_id = :id
          ${where}
        `,
      {
        replacements: {
          id,
        },
        type: Sequelize.QueryTypes.DELETE,
      },
    );

    for (let lae of laes) {
      await db.instance().query(
        `
        insert into projetos__linhas_acao(projeto_id, linha_acao_id)
        values(:id, :lae)
        `,
        {
          replacements: {
            id,
            lae,
          },
          type: Sequelize.QueryTypes.INSERT,
        },
      );
    }

    // send notification for SE e Facilitador
    const content = {
      id,
      communityId: draft.community_id,
      name: draft.nome,
    };

    const basicKey = `published_${id}_${dayjs().format('YYYYMMDD')}`;

    // SE
    await Messagery.sendNotification(
      { id: 0 },
      'room_c1_t1',
      {
        content,
        userId: 0,
        tool: {
          type: 'native',
          element: 'PublishNotification',
        },
      },
      [`${basicKey}_1`],
      true,
      {
        dedup: [`${basicKey}_1`],
      },
    );

    // Facilitadores
    const supporters = await singletonInstance.retrieveSupporters(id);
    for (let sup of supporters) {
      // para cada facilitador
      await Messagery.sendNotification(
        { id: 0 },
        `room_c${sup.communityId}_t1`,
        {
          content,
          userId: 0,
          tool: {
            type: 'native',
            element: 'PublishNotification',
          },
        },
        [`${basicKey}_${sup.communityId}`],
        true,
        {
          dedup: [`${basicKey}_${sup.communityId}`],
        },
      );
    }

    return { success: true };
  }

  async retrieveSupporters(projectId) {
    // { communityId }
    let entities = await db.instance().query(
      `
      select
        p.facilitador_community_id,
        pa.nm_regiao,
        m.nm_uf
      from projetos p
      left join projetos_atuacao pa on pa.projeto_id = p.id
      left join municipios m on m.cd_mun = pa.cd_mun
      where p.id = :projectId
    `,
      {
        replacements: { projectId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );
    const project = entities[0];

    let where = [];
    if (!!project.facilitador_community_id) where.push(`dc.id = ${project.facilitador_community_id}`);
    if (!!project.nm_uf) where.push(`'${project.nm_uf}' = any(f.atuacao)`);
    if (!!project.nm_regiao && project.nm_regiao === 'NACIONAL') where.push(`'NACIONAL' = any(f.atuacao)`);

    if (!where.length) return [];

    return await db.instance().query(
      `
      select
        dc.id as "communityId"
      from dorothy_communities dc
      inner join facilitadores f on f."communityId" = dc.id
      where ${where.join('\nOR ')}
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );
  }

  async getIndic(id, indicKey) {
    const [laeId, indicId] = indicKey.split('_');

    let indic = indics.INDICs.find(i => String(i.lae_id) === laeId && String(i.id) === indicId);
    const lae = indics.LAEs.find(l => String(l.id) === laeId);
    indic.lae_title = lae.title;

    let entities = await db.instance().query(
      `
    select indicadores->>'${indicKey}' as "indic"
    from projetos_rascunho pr
    where projeto_id = :id
    `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const data = entities[0] && entities[0].indic ? JSON.parse(entities[0].indic) : null;
    const status = this.checkIndic(indic, data);

    return {
      indic,
      data,
      problems: status.result ? [] : status.problems,
    };
  }

  async saveIndic(id, indicKey, data) {
    await db.instance().query(
      `
    update projetos_rascunho
    set indicadores = jsonb_set(indicadores, '{${indicKey}}', jsonb '${JSON.stringify(data)}', true)
    where projeto_id = :id
    `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );

    return { success: true };
  }

  async spreadsheet(type) {
    const indic = require('./indics.js');
    const TYPES = indic.TYPES;

    let data = [];

    let header = [
      '#',
      'nome da acao',
      'instituicao',
      'modalidade',
      'estados',
      'segmentos',
      'status desenvolvimento (S.D.)',
      'S.D. inicio',
      'S.D. fim',
      'publicos',
      'tematicas',
      'regioes',
      'data cadastro',
      'data ultima atualizacao',
      'objetivos',
      'aspectos gerais',
      'publico',
      'periodo',
      'parceiros',
      'relacionado ppea',
      'qual ppea',
      'contatos',
    ];

    let data_members = [];

    for (let lae of indic.LAEs) {
      const laeIndics = indic.INDICs.filter(i => i.lae_id === lae.id);

      for (let indic of laeIndics) {
        header.push(`${lae.title}::${indic.name}::${indic.base_question} (base)`);

        for (let question of indic.questions) {
          header.push(`${lae.title}::${indic.name}::${question.title}`);
        }
      }
    }
    data.push(header);

    const query =
      type === 'published'
        ? `
      with projeto_regioes as (
        select p.id, array_agg(distinct pa.nm_regiao) as regioes
        from projetos p
        left join projetos_atuacao pa on pa.projeto_id = p.id
        group by p.id
      )
      select
        p.id,
        p.nome,
        i.nome as "instituicao",
        m.nome as "modalidade",
        pr.regioes,
        p.objetivos_txt,
        p.aspectos_gerais_txt,
        p.publico_txt,
        p.periodo_txt,
        p.parceiros_txt,
        p.relacionado_ppea,
        p.qual_ppea,
        p.nome_ponto_focal,
        p.email_contatos,
        p.tel_contatos,
        p.indicadores,
        p.status_desenvolvimento,
        p.mes_inicio,
        p.mes_fim,
        (select array_agg(distinct s.nome) from segmentos s where s.id = any(i.segmentos)) as segmentos,
        (select array_agg(distinct u.nm_estado) from ufs u where u.id = any(p.ufs)) as ufs,
        (
      	select array_agg(distinct pu.nome)
      	from publicos pu
	    where pu.id = any(p.publicos)
      ) as publicos,
      (
      	select array_agg(distinct ts.nome)
      	from tematicas_socioambientais ts
	    where ts.id = any(p.tematicas)
      ) as tematicas,
      pr2."createdAt" as dt_cadastro,
      pr2."updatedAt" as dt_ultima_atualizacao
      from projetos p
      left join instituicoes i on i.id = p.instituicao_id
      left join modalidades m on m.id = p.modalidade_id
      left join projeto_regioes pr on pr.id = p.id
      left join projetos_rascunho pr2 on pr2.projeto_id = p.id
      order by id
      `
        : `

      select
        p.id,
        p.nome,
        i.nome as "instituicao",
        m.nome as "modalidade",
        p.objetivos_txt,
        p.aspectos_gerais_txt,
        p.publico_txt,
        p.periodo_txt,
        p.parceiros_txt,
        p.relacionado_ppea,
        p.qual_ppea,
        p.contatos,
        p.indicadores,
        p.status_desenvolvimento,
        p.mes_inicio,
        p.mes_fim,
        (select array_agg(distinct s.nome) from segmentos s where s.id = any(i.segmentos)) as segmentos,
        (select array_agg(distinct u.nm_estado) from ufs u where u.id = any(p.ufs)) as ufs,
        (
      	select array_agg(distinct pu.nome)
      	from publicos pu
	    where pu.id = any(p.publicos)
      ) as publicos,
      (
      	select array_agg(distinct ts.nome)
      	from tematicas_socioambientais ts
	    where ts.id = any(p.tematicas)
      ) as tematicas,
      p."createdAt" as dt_cadastro,
      p."updatedAt" as dt_ultima_atualizacao
      from projetos_rascunho p
      left join instituicoes i on i.id = p.instituicao_id
      left join modalidades m on m.id = p.modalidade_id
      order by id
      `;

    const projects = await db.instance().query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    for (let idx in projects) {
      const p = projects[idx];

      let project_data = [];
      let project_data_members = [];

      project_data.push(p.id); // ID
      project_data.push(p.nome); // nome da acao
      project_data.push(p.instituicao); // instituicao
      project_data.push(p.modalidade); // modalidade
      project_data.push(p.ufs?.length ? p.ufs.join(', ') : ''); // estados
      project_data.push(p.segmentos?.length ? p.segmentos.join(', ') : ''); // segmentos

      project_data_members.push(p.id); // ID
      project_data_members.push(p.nome); // nome da acao
      project_data_members.push(p.instituicao); // instituicao
      project_data_members.push(p.ufs?.length ? p.ufs.join(', ') : ''); // estados

      let status = '';
      let dt_inicio = '';
      let dt_fim = '';
      if (p.status_desenvolvimento) {
        switch (p.status_desenvolvimento) {
          case 'nao_iniciada':
            status = 'Não iniciada';
            dt_inicio = dayjs(p.mes_inicio).format('MM/YYYY');
            dt_fim = dayjs(p.mes_fim).format('MM/YYYY');
            break;
          case 'em_desenvolvimento':
            status = 'Em desenvolvimento';
            dt_inicio = dayjs(p.mes_inicio).format('MM/YYYY');
            dt_fim = dayjs(p.mes_fim).format('MM/YYYY');
            break;
          case 'finalizada':
            status = 'Finalizada';
            dt_inicio = dayjs(p.mes_inicio).format('MM/YYYY');
            dt_fim = dayjs(p.mes_fim).format('MM/YYYY');
            break;
          case 'interrompida':
            status = 'Interrompida';
            dt_inicio = dayjs(p.mes_inicio).format('MM/YYYY');
            dt_fim = dayjs(p.mes_fim).format('MM/YYYY');
            break;
          default:
            status = 'Não respondido';
            break;
        }
      }
      project_data.push(status); // status desenvolvimento
      project_data.push(dt_inicio); // status desenvolvimento - inicio
      project_data.push(dt_fim); // status desenvolvimento - fim

      project_data_members.push(status); // status desenvolvimento
      project_data_members.push(dt_inicio); // status desenvolvimento - inicio
      project_data_members.push(dt_fim); // status desenvolvimento - fim

      project_data.push(p.publicos?.length ? p.publicos.join(', ') : ''); // publicos
      project_data.push(p.tematicas?.length ? p.tematicas.join(', ') : ''); // tematicas
      if (type === 'published') project_data.push(p.regioes.filter(r => !!r).join(', ')); // regioes

      project_data.push(dayjs(p.dt_cadastro).format('MM/YYYY'));
      project_data.push(dayjs(p.dt_ultima_atualizacao).format('MM/YYYY'));

      project_data.push(!!p.objetivos_txt ? p.objetivos_txt.replace(/(?:\r\n|\r|\n)/g, ' | ') : ''); // objetivos
      project_data.push(!!p.aspectos_gerais_txt ? p.aspectos_gerais_txt.replace(/(?:\r\n|\r|\n)/g, ' | ') : ''); // aspectos gerais
      project_data.push(!!p.publico_txt ? p.publico_txt.replace(/(?:\r\n|\r|\n)/g, ' | ') : ''); // publico
      project_data.push(!!p.periodo_txt ? p.periodo_txt.replace(/(?:\r\n|\r|\n)/g, ' | ') : ''); // periodo
      project_data.push(!!p.parceiros_txt ? p.parceiros_txt.replace(/(?:\r\n|\r|\n)/g, ' | ') : ''); // parceiros

      // relacionado ppea
      if (!!p.relacionado_ppea) project_data.push(p.relacionado_ppea);
      else project_data.push('NAO_RESPONDIDO');

      project_data.push(!!p.qual_ppea ? p.qual_ppea : ''); // qual ppea

      // contatos
      let contacts_array = [];

      if (type === 'published') {
        const total_contacts = Math.max(
          !!p.nome_ponto_focal ? p.nome_ponto_focal.length : 0,
          !!p.email_contatos ? p.email_contatos.length : 0,
          !!p.tel_contatos ? p.tel_contatos.length : 0,
        );
        for (let cIdx = 0; cIdx < total_contacts; cIdx++) {
          contacts_array.push(
            [
              !!p.nome_ponto_focal ? p.nome_ponto_focal[cIdx] : '',
              !!p.email_contatos ? p.email_contatos[cIdx] : '',
              !!p.tel_contatos ? p.tel_contatos[cIdx] : '',
            ].join(' - '),
          );
        }
      } else {
        for (let c of p.contatos) {
          contacts_array.push([!!c.nome ? c.nome : '', !!c.email ? c.email : '', !!c.tel ? c.tel : ''].join(' - '));
        }
      }

      project_data.push(contacts_array.join(' | '));
      project_data_members.push(contacts_array.join(' | '));

      const indicDB = p['indicadores'];

      /* lae -> indic */
      // indic.LAEs
      // indic.INDICs -> questions
      if (indicDB)
        for (let lae of indic.LAEs) {
          const laeIndics = indic.INDICs.filter(i => i.lae_id === lae.id);

          for (let indic of laeIndics) {
            const dbKey = `${lae.id}_${indic.id}`;
            // console.log(dbKey)

            // existe esta chave, no registro?
            let key;
            if (indicDB[dbKey]) {
              key = indicDB[dbKey].base.toUpperCase();
            } else {
              key = 'NAO_RESPONDIDO';
            }

            project_data.push(key);

            for (let question of indic.questions) {
              const eValue = indicDB[dbKey]?.[question.id];
              if (key === 'SIM' && eValue !== undefined) {
                let value;
                switch (question.type) {
                  case TYPES.INT:
                  case TYPES.TEXT:
                  case TYPES.TEXT_M:
                  case TYPES.SN:
                    value = eValue;
                    break;
                  case TYPES.SEL_MO:
                  case TYPES.SEL_M:
                    let items_array =
                      !!eValue.items && eValue.items.length
                        ? eValue.items.map(i => question.options.find(o => String(o.value) === String(i)).title)
                        : [];
                    if (!!eValue.other) items_array.push(eValue.other);
                    value = items_array.join(', ');
                    break;
                  case TYPES.SEL_S:
                    let tempvalue = question.options.find(o => String(o.value) === String(eValue));

                    if (!!eValue) value = tempvalue ? tempvalue.title : '';
                    break;
                  case TYPES.SEL_SO:
                    if (!!eValue.other) value = eValue.other;
                    else if (!!eValue.value && eValue.value !== 'none')
                      question.options.find(o => String(o.value) === String(eValue.value)).title;
                    else value = '';
                    break;
                  case TYPES.ITEMS:
                    value = !!eValue ? eValue.replace(/(?:\r\n|\r|\n)/g, ' | ') : '';
                    break;
                  default:
                    console.log(question.type, eValue, data.length);
                    value = `[${question.type}]?`;
                }

                project_data.push(value);
              } else project_data.push('');
            }

            // console.log(key);
            // console.log(analysis.indicators[dbKey]);
          }
        }

      // membros
      const members = await db.instance().query(
        `
        select
          du."name",
          du.email
        from dorothy_members dm
        inner join dorothy_users du on du.id = dm."userId"
        inner join projetos p on p.community_id = dm."communityId"
        where p.id = :id
        order by du."name"
        `,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { id: p.id },
        },
      );

      for (let m of members) {
        project_data_members.push(`${m.name} <${m.email}>`);
      }

      data.push(project_data);
      data_members.push(project_data_members);
    }

    // fileName
    const fileName = `spreadsheet_${dayjs().format('YYYY.MM.DD')}`;

    const csvFileName = `${fileName}_${type === 'published' ? 'publicados' : 'rascunhos'}_dados.csv`;
    const csvMembersFileName = `${fileName}_${type === 'published' ? 'publicados' : 'rascunhos'}_membros.csv`;
    const zipFileName = `${fileName}_${type === 'published' ? 'publicados' : 'rascunhos'}.zip`;

    // 1. transformar em csv
    let content = data.reduce((accum, row) => {
      return `${accum.length ? `${accum}\n` : ''}${row
        .map(c => String(c).replace(/\n/g, ' ').replace(/;/g, ',').trim())
        .join(';')}`;
    }, '');

    let content_members = data_members.reduce((accum, row) => {
      return `${accum.length ? `${accum}\n` : ''}${row
        .map(c => String(c).replace(/\n/g, ' ').replace(/;/g, ',').trim())
        .join(';')}`;
    }, '');

    // console.log(content);
    // const fs = require('fs')

    // try {
    //   fs.writeFileSync('/home/ricardo/Downloads/tmp/test.csv', content)
    //   //file written successfully
    // } catch (err) {
    //   console.error(err)
    // }

    // 2. zipar e colocar na memoria

    const zip = new AdmZip();
    zip.addFile(csvFileName, Buffer.from(content, 'latin1'));
    zip.addFile(csvMembersFileName, Buffer.from(content_members, 'latin1'));

    return {
      zipFileName,
      content: zip.toBuffer(), // get in-memory zip
    };
  }

  async analysis() {
    const indic = require('./indics.js');

    const result = await db.instance().query(
      `
        select count(*)::integer as "total" from projetos
      `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );
    const totalProjects = result[0].total;

    const analysis = {
      totalProjects,
      indicators: {},
    };

    const LIMIT = 20;
    for (let i = 0; i < totalProjects; i += LIMIT) {
      const currentTotal = Math.min(i + LIMIT, totalProjects);

      // console.log({ currentTotal })

      const projects = await db.instance().query(
        `
        select indicadores from projetos
        order by id
        LIMIT ${LIMIT}
        OFFSET ${i}

    `,
        {
          type: Sequelize.QueryTypes.SELECT,
        },
      );

      projects.forEach(p => {
        const indicDB = p['indicadores'];

        /* lae -> indic */
        // indic.LAEs
        // indic.INDICs -> questions
        for (let lae of indic.LAEs) {
          const laeIndics = indic.INDICs.filter(i => i.lae_id === lae.id);

          for (let indic of laeIndics) {
            const dbKey = `${lae.id}_${indic.id}`;
            // console.log(dbKey)

            if (!analysis.indicators[dbKey])
              analysis.indicators[dbKey] = {
                lae_id: lae.id,
                lae_title: lae.title,
                indic_id: indic.id,
                indic_title: indic.name,
                base_title: indic.base_question,
                base: {
                  SIM: { value: 0, percent: 0, percent_relevant: 0 },
                  NAO: { value: 0, percent: 0, percent_relevant: 0 },
                  NAO_APLICA: { value: 0, percent: 0, percent_relevant: 0 },
                  NAO_RESPONDIDO: { value: 0, percent: 0 },
                },
                questions: {},
              };

            // existe esta chave, no registro?
            let key;
            if (indicDB[dbKey]) {
              key = indicDB[dbKey].base.toUpperCase();
            } else {
              key = 'NAO_RESPONDIDO';
            }

            // incrementa valor da resposta
            analysis.indicators[dbKey].base[key].value++;
            // calcula o percentual desta reposta
            analysis.indicators[dbKey].base[key].percent = analysis.indicators[dbKey].base[key].value / currentTotal;

            // calcula o percentual relevante (respondidas) para a resposta
            if (key === 'NAO_RESPONDIDO')
              for (let respo of ['SIM', 'NAO', 'NAO_APLICA'])
                analysis.indicators[dbKey].base[respo].percent_relevant =
                  analysis.indicators[dbKey].base[respo].value /
                  (currentTotal - analysis.indicators[dbKey].base['NAO_RESPONDIDO'].value);

            if (key === 'SIM')
              for (let question of indic.questions)
                if (question.consolidate) {
                  if (question.consolidate === 'avg') {
                    if (!analysis.indicators[dbKey].questions[question.id]) {
                      analysis.indicators[dbKey].questions[question.id] = {
                        title: question.title,
                        type: question.consolidate,
                        accum: 0,
                        qtd: 0,
                        avg: 0,
                      };
                    }

                    // incrementa
                    let value = 0;
                    try {
                      value = parseInt(indicDB[dbKey][question.id]);
                    } catch (e) {}

                    analysis.indicators[dbKey].questions[question.id].accum += value;
                    analysis.indicators[dbKey].questions[question.id].qtd++;

                    analysis.indicators[dbKey].questions[question.id].avg =
                      analysis.indicators[dbKey].questions[question.id].accum /
                      analysis.indicators[dbKey].questions[question.id].qtd;
                  } else if (
                    ['distribution-m+o', 'distribution-m', 'distribution+o', 'distribution', 'sn'].includes(
                      question.consolidate,
                    )
                  ) {
                    if (!analysis.indicators[dbKey].questions[question.id]) {
                      analysis.indicators[dbKey].questions[question.id] = {
                        title: question.title,
                        type: question.consolidate,
                        qtd: 0,
                        options: {},
                      };

                      if (question.consolidate !== 'sn')
                        question.options.forEach(o => {
                          analysis.indicators[dbKey].questions[question.id].options[o.value] = {
                            title: o.title,
                            value: 0,
                            percent: 0,
                          };
                        });
                      else {
                        analysis.indicators[dbKey].questions[question.id].options['sim'] = {
                          title: 'Sim',
                          value: 0,
                          percent: 0,
                        };
                        analysis.indicators[dbKey].questions[question.id].options['nao'] = {
                          title: 'Nao',
                          value: 0,
                          percent: 0,
                        };
                      }

                      if (['distribution-m+o', 'distribution+o'].includes(question.consolidate))
                        analysis.indicators[dbKey].questions[question.id].options['other'] = {
                          title: 'outro',
                          value: 0,
                          percent: 0,
                        };
                    }

                    // incrementa
                    analysis.indicators[dbKey].questions[question.id].qtd++;

                    if (['distribution-m+o'].includes(question.consolidate))
                      for (let item of indicDB[dbKey][question.id].items)
                        analysis.indicators[dbKey].questions[question.id].options[item].value++;

                    if (['distribution-m'].includes(question.consolidate))
                      for (let item of indicDB[dbKey][question.id])
                        analysis.indicators[dbKey].questions[question.id].options[item].value++;

                    if (['sn'].includes(question.consolidate))
                      analysis.indicators[dbKey].questions[question.id].options[indicDB[dbKey][question.id]].value++;

                    if (['distribution+o', 'distribution'].includes(question.consolidate))
                      if (!!indicDB[dbKey][question.id]) {
                        const option = isNaN(indicDB[dbKey][question.id])
                          ? indicDB[dbKey][question.id].value
                          : indicDB[dbKey][question.id];
                        // TODO: melhorar
                        if (option !== 'none')
                          analysis.indicators[dbKey].questions[question.id].options[option].value++;
                      }

                    if (['distribution-m+o', 'distribution+o'].includes(question.consolidate))
                      if (!!indicDB[dbKey][question.id].other)
                        analysis.indicators[dbKey].questions[question.id].options['other'].value++;

                    for (let oKey of Object.keys(analysis.indicators[dbKey].questions[question.id].options))
                      analysis.indicators[dbKey].questions[question.id].options[oKey].percent =
                        analysis.indicators[dbKey].questions[question.id].options[oKey].value /
                        analysis.indicators[dbKey].questions[question.id].qtd;
                  }
                }

            // console.log(key);
            // console.log(analysis.indicators[dbKey]);
          }
        }
      });
    }

    return { analysis };
  }
  /* .v2 */

  async getDraftTimeline(id) {
    const tLs = await db.instance().query(
      `
        SELECT
              lt.id,
              lt."date",
              lt.texto,
              f.url,
              f.file_name,
              p.id as project_id
          FROM public.linhas_do_tempo lt
          left join files f on f.id = lt.timeline_arquivo
          inner join projetos p on p.id = lt.projeto_id
          where p.id = :id
          order by lt."date"
          `,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    for (let tl of tLs) {
      if (!!tl.url)
        tl.timeline_arquivo = `${process.env.S3_CONTENT_URL}/${this.getFileKey(
          tl.project_id,
          'timeline_arquivo',
          tl.url,
        )}`;
    }

    return tLs;
  }

  async saveDraftTimeline(user, entity, timeline_arquivo, projeto_id, tlid) {
    let entityModel;
    if (!tlid) {
      entityModel = await db.models['Project_timeline'].create({
        ...entity,
        projeto_id,
        timeline_arquivo: undefined,
      });
    } else {
      // recupera
      entityModel = await db.models['Project_timeline'].findByPk(tlid);
      // atualiza
      entityModel.date = entity.date;
      entityModel.texto = entity.texto;
      // salva
      entityModel.save();
    }

    if (entity.timeline_arquivo === 'remove') await this.removeFile(entityModel, 'timeline_arquivo');
    else if (timeline_arquivo)
      await this.updateFile(entityModel, timeline_arquivo, 'timeline_arquivo', entityModel.get('projeto_id'));

    return entityModel;
  }

  async removeDraftTimeline(projeto_id, tlId) {
    const timeline = await db.models['Project_timeline'].findByPk(tlId);

    if (timeline.get('timeline_arquivo')) {
      /* remove file */
      await db.models['File'].destroy({
        where: { id: timeline.get('timeline_arquivo') },
      });
    }

    await db.models['Project_timeline'].destroy({
      where: {
        id: tlId,
        projeto_id,
      },
    });

    return true;
  }

  async removeFile(entityModel, fieldName) {
    let fileId = entityModel.get(fieldName);
    entityModel.set(fieldName, null);

    entityModel.save();

    /* remove file */
    db.models['File'].destroy({
      where: { id: fileId },
    });

    /* TODO: remove from S3? */
  }

  async updateFile(entityModel, file, fieldName, entityId) {
    // S3
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: this.getFileKey(entityId || entityModel.get('projeto_id'), fieldName, file.originalname),
        Body: file.buffer,
        ACL: 'public-read',
      })
      .promise();

    await this.updateFileModel(
      entityModel,
      fieldName,
      file.originalname,
      file.originalname.includes('.pdf') ? `application/pdf` : `image/jpeg`,
    );
  }

  async updateFileModel(entityModel, fieldName, file_name, content_type) {
    let fileModel;
    if (!!entityModel[fieldName]) {
      fileModel = await db.models['File'].findByPk(entityModel[fieldName]);
    }

    if (!!fileModel) {
      fileModel.file_name = file_name;
      fileModel.url = file_name;
      fileModel.document_type = `cne_${fieldName}`;
      fileModel.content_type = content_type;

      fileModel.save();
    } else {
      const fileModel = await db.models['File'].create({
        file_name,
        url: file_name,
        document_type: `cne_${fieldName}`,
        content_type,
      });

      entityModel.set(fieldName, fileModel.id);

      await entityModel.save();
    }
  }

  getFileKey(id, folder, filename) {
    const segmentedId = getSegmentedId(id);

    return `project/${segmentedId}/${folder}/original/${filename}`;
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;

function cleanItems(txt) {
  return txt
    ? txt
        .split('\n')
        .filter(t => t.length)
        .join('\n')
    : '';
}
