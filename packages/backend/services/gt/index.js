const Sequelize = require('sequelize');
const db = require('../database');

const { Messagery } = require('dorothy-dna-services');

const { applyJoins, applyWhere, protect } = require('../../utils');

const crypto = require('crypto');

const { v4: uuidv4 } = require('uuid');

const config = require('../../config');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const baseURL = process.env.BASE_URL || 'https://pppzcm.monitoraea.com.br';

class Service {
  async getPerspectives() {
    return await db.instance().query(
      `
    select * 
    from perspectives
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );
  }

  async getPerspectivesUser(user) {

    return await db.instance().query(
      `
    select 
    p.id,
    p.name,
    p.network_community_id,
    p.id in (
      select 
        distinct p.id
      from dorothy_members dm 
      inner join dorothy_communities dc on dc.id = dm."communityId"
      inner join community_types ct on ct.alias = trim(dc.alias)
      inner join perspectives p on p.id = ct.perspective_id 
      where dm."userId" = :userId
    ) as "participate"
    from perspectives p
    where p.id <> 1
    `,
      {
        replacements: { userId: user.id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );
  }

  async list(communityId, alias, config) {
    // what type of community is this?
    const community = await db.instance().query(
      `
    select type 
    from ${process.env.DB_PREFIX}communities c
    where c.id = :communityId
    `,
      {
        replacements: { communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!community.length) throw new Error('Unknown community!');
    const type = community[0].type.trim();

    if (!['adm', 'facilitador', 'adm_zcm', 'adm_ciea', 'adm_ppea', 'adm_cne'].includes(type)) throw new Error('Permission denied!');

    if (type === 'adm') return this.list4Adm(communityId, config);
    else if (type === 'facilitador') return this.list4Facilit(communityId, config);
    else if (type === 'adm_zcm') return this.list4AdmZCM(communityId, config);
    else if (type === 'adm_ciea') return this.list4AdmCIEA(communityId, config);
    else if (type === 'adm_ppea') return this.list4AdmPPEA(communityId, config);
    else if (type === 'adm_cne') return this.list4AdmCNE(communityId, config);
    else return {
      entities: [],
      total: 0,
    }
  }

  async list4Adm(communityId, config) {
    let order = `"${config.order}"`;
    if (config.order === 'perspectiveName') order = 'p."name"';

    let entities = await db.instance().query(
      `
        select 
          dc.id, 
          dc.alias, 
          TRIM(dc.type) as "type",
          case
            when TRIM(dc.type) = 'policy' then 'Política'
            when TRIM(dc.type) = 'project' then 'Projeto'
            when TRIM(dc.type) = 'commission' then 'Comissão'
            when TRIM(dc.type) = 'cne' then 'Centro/Núcleo/Equipamento'
            else 'Facilitador'
          end as "typeName",
          dc.descriptor_json->'title' as "name",
          p."name" as "pespectiveName",
          count(*) OVER() AS total_count 
        from dorothy_communities dc
        left join perspectives p on p.id::text = descriptor_json->>'perspective'
        where type not in ('network','adm')
        order by ${order} ${config.direction}
      `,
      {
        replacements: { communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      entities,
      total: entities.length ? parseInt(entities[0].total_count) : 0,
    };
  }

  async list4Facilit(communityId, config) {
    // verifica se nacional esta entre areas deste facilitador

    const result = await db.instance().query(
      `
    select count(*) as qtd
    from facilitadores f
    where f."communityId" = :communityId
    and 'NACIONAL' = ANY(f.atuacao)
    `,
      {
        replacements: { communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const whereNacional = result[0].qtd > 0 ? "OR pa.nm_regiao = 'NACIONAL'" : '';

    let query1 = `
    select distinct p."community_id"
    from projetos p
    left join projetos_atuacao pa on pa.projeto_id = p.id
    left join municipios m on m.cd_mun = pa.cd_mun
    where m.nm_uf in (select unnest(atuacao) from facilitadores f where f."communityId" = :communityId)
    ${whereNacional}
    or p.facilitador_community_id = :communityId
    `;

    const entities = await db.instance().query(
      `
    select 
      id, 
      alias, 
      TRIM(type) as "type", 
      case
        when TRIM(type) = 'project' then 'Projeto'
        else 'Facilitador'
      end as "typeName",
      descriptor_json->'title' as "name",
      count(*) OVER() AS total_count
    from dorothy_communities 
    where type not in ('network','adm')
    and id in (${query1})
    order by "${config.order}" ${config.direction}
    `,
      {
        replacements: { communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      entities,
      total: entities.length ? parseInt(entities[0].total_count) : 0,
    };
  }

  async list4AdmCIEA(communityId, config) {
    let entities = await db.instance().query(
      `
        select 
          id, 
          alias, 
          TRIM(type) as "type", 
          'Comissão' as "typeName",
          descriptor_json->'title' as "name",
          count(*) OVER() AS total_count 
        from dorothy_communities
        where type not in ('network','adm_ciea')
        and descriptor_json->>'perspective' = '3'
        order by "${config.order}" ${config.direction}
      `,
      {
        replacements: { communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      entities,
      total: entities.length ? parseInt(entities[0].total_count) : 0,
    };
  }

  async list4AdmPPEA(communityId, config) {
    let entities = await db.instance().query(
      `
        select 
          id, 
          alias, 
          TRIM(type) as "type", 
          'Política Pública' as "typeName",
          descriptor_json->'title' as "name",
          count(*) OVER() AS total_count 
        from dorothy_communities
        where type not in ('network','adm_ppea')
        and descriptor_json->>'perspective' = '4'
        order by "${config.order}" ${config.direction}
      `,
      {
        replacements: { communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      entities,
      total: entities.length ? parseInt(entities[0].total_count) : 0,
    };
  }

  async list4AdmZCM(communityId, config) {
    let entities = await db.instance().query(
      `
        select 
          id, 
          alias, 
          TRIM(type) as "type", 
          case
            when TRIM(type) = 'project' then 'Projeto'
            else 'Facilitador'
          end as "typeName",
          descriptor_json->'title' as "name",
          count(*) OVER() AS total_count 
        from dorothy_communities
        where type not in ('network','adm_zcm')
        and descriptor_json->>'perspective' = '2'
        order by "${config.order}" ${config.direction}
      `,
      {
        replacements: { communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      entities,
      total: entities.length ? parseInt(entities[0].total_count) : 0,
    };
  }

  async list4AdmCNE(communityId, config) {
    let entities = await db.instance().query(
      `
        select 
          id, 
          alias, 
          TRIM(type) as "type", 
          'Centro/Núcleo/Equipamento' as "typeName",
          descriptor_json->'title' as "name",
          count(*) OVER() AS total_count 
        from dorothy_communities
        where type not in ('network','adm_cne')
        and descriptor_json->>'perspective' = '5'
        order by "${config.order}" ${config.direction}
      `,
      {
        replacements: { communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return {
      entities,
      total: entities.length ? parseInt(entities[0].total_count) : 0,
    };
  }

  async members(communityId, config) {
    let where = ['dm."communityId" = :communityId'];

    let replacements = {
      communityId,
      limit: config.limit,
      offset: (config.page - 1) * config.limit,
    };

    const entities = await db.instance().query(
      `
        select 
            du.id, 
            du.email, 
            du."name",

            count(*) OVER() AS total_count 
        from dorothy_users du
        inner join dorothy_members dm on dm."userId" = du.id
        ${applyWhere(where)}
        order by ${!config.last
        ? `"${protect.order(config.order)}" ${protect.direction(config.direction)}`
        : 'i."updatedAt" desc'
      }
        LIMIT :limit 
        OFFSET :offset
        `,
      {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const total = entities.length ? parseFloat(entities[0]['total_count']) : 0;
    const rawPages = entities.length ? parseInt(total) / config.limit : 0;
    let pages = rawPages === Math.trunc(rawPages) ? rawPages : Math.trunc(rawPages) + 1;
    let hasPrevious = config.page > 1;
    let hasNext = config.page !== pages;

    return {
      entities,
      pages,
      total,
      hasPrevious,
      hasNext,
    };
  }

  async invites(communityId, config) {
    let where = ['i."confirmedAt" is null and i."communityId" = :communityId'];

    let replacements = {
      communityId,
      limit: config.limit,
      offset: (config.page - 1) * config.limit,
    };

    const entities = await db.instance().query(
      `
    select 
        i.id, 
        i.email, 
        i."name",
        count(*) OVER() AS total_count 
    from invites i 
    ${applyWhere(where)}
    order by ${!config.last ? `"${protect.order(config.order)}" ${protect.direction(config.direction)}` : 'i."updatedAt" desc'
      }
    LIMIT :limit 
    OFFSET :offset
    `,
      {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const total = entities.length ? parseFloat(entities[0]['total_count']) : 0;
    const rawPages = entities.length ? parseInt(total) / config.limit : 0;
    let pages = rawPages === Math.trunc(rawPages) ? rawPages : Math.trunc(rawPages) + 1;
    let hasPrevious = config.page > 1;
    let hasNext = config.page !== pages;

    return {
      entities,
      pages,
      total,
      hasPrevious,
      hasNext,
    };
  }

  async participation(communityId, config) {
    let where = ['p."resolvedAt" is null'];

    // what type of community is this?
    const community = await db.instance().query(
      `
    select type 
    from ${process.env.DB_PREFIX}communities c
    where c.id = :communityId
    `,
      {
        replacements: { communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!community.length) throw new Error('Unknown community!');
    const type = community[0].type.trim();

    if (type !== 'adm') where.push('p."communityId" = :communityId');

    let replacements = {
      communityId,
      limit: config.limit,
      offset: (config.page - 1) * config.limit,
    };

    if (config.ini_date && config.end_date) {
      where.push('p."createdAt" between :iniDate and :endDate');
      replacements.iniDate = config.ini_date;
      replacements.endDate = config.end_date;
    } else if (config.ini_date) {
      where.push('p."createdAt" >= :iniDate');
      replacements.iniDate = config.ini_date;
    } else if (config.end_date) {
      where.push('p."createdAt" <= :endDate');
      replacements.endDate = config.end_date;
    }

    if (config.participation_type) {
      where.push('p.adm = :p_type');
      replacements.p_type = config.participation_type === 'adm';
    }

    const entities = await db.instance().query(
      `
    select p.id, p."createdAt", p."communityId", du."name", p.adm, dc.descriptor_json->>'title' as "community_name",
    count(*) OVER() AS total_count   
    from participar p 
    inner join ${process.env.DB_PREFIX}users du on du.id = p."userId"
    inner join ${process.env.DB_PREFIX}communities dc on dc.id = p."communityId" 
    ${applyWhere(where)}
    order by ${!config.last ? `"${protect.order(config.order)}" ${protect.direction(config.direction)}` : 'p."updatedAt" desc'
      }
    LIMIT :limit 
    OFFSET :offset
    `,
      {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const total = entities.length ? parseFloat(entities[0]['total_count']) : 0;
    const rawPages = entities.length ? parseInt(total) / config.limit : 0;
    let pages = rawPages === Math.trunc(rawPages) ? rawPages : Math.trunc(rawPages) + 1;
    let hasPrevious = config.page > 1;
    let hasNext = config.page !== pages;

    return {
      entities,
      pages,
      total,
      hasPrevious,
      hasNext,
    };
  }

  async remove(communityId, userId) {
    await db.instance().query(
      `
    delete from dorothy_members 
    where "communityId" = :communityId and "userId" = :userId
    `,
      {
        replacements: { communityId, userId },
        type: Sequelize.QueryTypes.DELETE,
      },
    );

    return { success: true };
  }

  async removeInvite(communityId, id) {
    await db.instance().query(
      `
    delete from invites 
    where "communityId" = :communityId and id = :id
    `,
      {
        replacements: { communityId, id },
        type: Sequelize.QueryTypes.DELETE,
      },
    );

    return { success: true };
  }

  async removeParticipation(communityId, id) {
    let where = ['id = :id'];

    // what type of community is this?
    const community = await db.instance().query(
      `
    select type 
    from ${process.env.DB_PREFIX}communities c
    where c.id = :communityId
    `,
      {
        replacements: { communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!community.length) throw new Error('Unknown community!');
    const type = community[0].type.trim();

    if (type !== 'adm') where.push('"communityId" = :communityId');

    await db.instance().query(
      `
    delete from participar 
    ${applyWhere(where)} 
    `,
      {
        replacements: { communityId, id },
        type: Sequelize.QueryTypes.DELETE,
      },
    );

    return { success: true };
  }

  async approveParticipacion(id) {
    /* recupera os dados da participacao e do usuario */
    const participation = await db.instance().query(
      `select p.id, "userId", "communityId", initiative_name, u.id as user_id, u."name" as user_name, u.email as user_email, adm  
      from participar p 
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
    this.addMember(pData.communityId, pData.user_id, isADM ? 'adm' : 'member');

    /* Resolve o pedido de participacao */
    await db.instance().query(`update participar set "resolvedAt" = NOW() where id = :id`, {
      replacements: { id },
      type: Sequelize.QueryTypes.UPDATE,
    });

    /* NOTIFICACAO */
    if (isADM) {
      await Messagery.sendNotification({ id: 0 }, `room_c${pData.communityId}_t1`, {
        content: {
          new_adm_name: pData.user_name,
        },
        userId: 0,
        tool: {
          type: "native",
          element: "NewGTADMNotification"
        },
      });
    }

    /* Envia email para o requerente  */
    const subject = isADM ? 'Confirmação de responsabilidade por iniciativa' : 'Confirmação de pedido de participação';

    const pedido = isADM ? 'moderador' : 'membro';
    const message = `Agora você é ${pedido} do grupo "${pData.initiative_name}".
    `;

    const msg = {
      to: pData.user_email,
      from: `Plataforma MonitoraEA <${process.env.FROM_EMAIL}>`,
      subject: `MonitoraEA - ${subject}`,
      text: `${message}\n\n${process.env.BASE_URL}/colabora/projeto/${pData.communityId}`,
      html: `${message.replace(/(?:\r\n|\r|\n)/g, '<br>')}\n\n<a href="${process.env.BASE_URL}/colabora/projeto/${pData.communityId
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

  async invite(communityId, name, email) {
    let result;

    result = await db.instance().query(
      ` 
        select *
        from invites i
        where i."communityId" = :communityId
        and email = :email`,
      {
        replacements: { communityId, email },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (result.length) return { ok: true }; /* Ja tem convite para este email, para esta comunidade */

    result = await db.instance().query(
      ` 
      select descriptor_json::json->>'title' as title
      from dorothy_communities c
      where c.id = :communityId`,
      {
        replacements: { communityId, email },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const communityTitle = result[0].title;

    const uuid = uuidv4();

    result = await db.instance().query(
      ` 
        insert into invites("communityId", name, email, uuid, "createdAt", "updatedAt")
        values(:communityId, :name, :email, :uuid, NOW(), NOW())
        `,
      {
        replacements: { communityId, email, name, uuid },
        type: Sequelize.QueryTypes.INSERT,
      },
    );

    // send email
    const link = `${baseURL}/colabora/convite/${uuid}`;

    const text = `
    Olá ${name}!\n
    Voce foi convidado para participar do grupo de trabalho "${communityTitle}", na plataforma MonitoraEA.\n
    Para confirmar a sua participação, utilize o seguinte link: ${link}`;

    const html = `
    <p>Olá ${name}!</p>
    <p>Voce foi convidado para participar do grupo de trabalho "${communityTitle}", na plataforma MonitoraEA.<br/>
    Para confirmar a sua participação, clique no link a seguir: <a href="${link}">${link}</a></p>`;

    const msg = {
      to: email,
      from: config.invite.from,
      subject: config.invite.subject,
      text,
      html,
    };

    try {
      await sgMail.send(msg);
      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false };
    }
  }

  async verifyInvitation(uuid, loggedUser) {
    let result;

    /* verifica se existe o convite */
    result = await db.instance().query(
      ` select *
        from invites i
        where i.uuid = :uuid
        and "confirmedAt" is null
        order by name`,
      {
        replacements: { uuid },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!result.length) return { result: 'unknow-invitation' };

    const invitation = result[0];

    /* verifica se usuario ja esta cadastrado */
    result = await db.instance().query(
      ` select id
        from dorothy_users u
        where u.email = :email`,
      {
        replacements: { email: invitation['email'] },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    /* se usuario nao esta cadastrado, confirma que convite existe e nada mais */
    if (!result.length)
      return {
        result: 'new-user',
        communityId: invitation['communityId'],
        name: invitation['name'],
        email: invitation['email'],
        logout: loggedUser && loggedUser.email !== invitation['email'],
      };

    const user = result[0];

    /* se usuario esta cadastrado, confirma convite e devolve dados da comunidade */

    // confirma o convite
    await this.markInvitation(invitation['id']);

    // torna membro
    await this.addMember(invitation['communityId'], user.id);

    return {
      result: 'already-user',
      communityId: invitation['communityId'],
      logout: loggedUser && loggedUser.email !== invitation['email'],
    };
  }

  async broadcasting(type, message) {
    // types: all, supporters, iniciativas
    let where = [];
    if (type === 'supporters') where.push(`dc."type" = 'facilitador'`);
    else if (type === 'iniciativas') where.push(`dc."type" = 'project'`);
    else where.push(`dc."type" <> 'adm'`);

    const entities = await db.instance().query(
      `    
      select dc.id, dc.descriptor_json->>'title' as "name"
      from dorothy_communities dc
      ${applyWhere(where)}
    `,
      {
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    let content = {
      message,
      tags: ['broadcasting'],
    }

    // send message to SEC
    await Messagery.sendNotification({ id: 0 }, `room_c1_t1`, {
      content: {
        ...content,
        total: entities.length,
        type,
      },
      userId: 0,
      tool: {
        type: "native",
        element: "SendingBroadcastNotification"
      },
    });

    // send message to target
    for (let gt of entities) {
      await Messagery.sendNotification({ id: 0 }, `room_c${gt.id}_t1`, {
        content,
        userId: 0,
        tool: {
          type: "native",
          element: "BroadcastNotification"
        },
      });
    };

    return { success: true }
  }

  async signup(password, uuid) {
    let result;

    /* verifica se existe o convite */
    result = await db.instance().query(
      ` select *
        from invites i
        where i.uuid = :uuid
        and "confirmedAt" is null
        order by name`,
      {
        replacements: { uuid },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!result.length) return { result: 'unknow-invitation' };

    const invitation = result[0];

    /* Cria o novo usuario */
    result = await db.instance().query(
      ` insert into dorothy_users(email, password, name, "createdAt", "updatedAt")
        values(:email, :password, :name, NOW(), NOW())
        RETURNING id
        `,
      {
        replacements: {
          email: invitation['email'],
          name: invitation['name'],
          password: crypto.createHash('md5').update(password).digest('hex'),
        },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    const newUserId = result[0].id; /* recupera o id recem criado */

    // confirma o convite
    await this.markInvitation(invitation['id']);

    // torna membro
    await this.addMember(invitation['communityId'], newUserId);

    return { success: true };
  }

  async markInvitation(id) {
    await db.instance().query(
      ` update invites
        set "confirmedAt" = NOW()
        where id = :id`,
      {
        replacements: { id },
        type: Sequelize.QueryTypes.UPDATE,
      },
    );
  }

  async participate(user, communityId, initiativeName, isADM) {
    /* Verifica se o user ja e' membro da comunidade */
    const [{ count: countMembership }] = await db.instance().query(
      `
      select count(*)::integer from dorothy_members 
      where "userId" = :userId and "communityId" = :communityId
      `,
      {
        replacements: { userId: user.id, communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (countMembership > 0) throw new Error('already_member');

    /* verifica se ja existe registro user_id, id */
    const [{ count: countParticipate }] = await db.instance().query(
      `
      select count(*)::integer from participar 
      where "userId" = :userId and "communityId" = :communityId and "resolvedAt" is null
      `,
      {
        replacements: { userId: user.id, communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (countParticipate > 0) throw new Error('already_in_list');

    /* cadastra participacao */
    await db.instance().query(
      `
          insert into participar("communityId", "userId", adm, initiative_name, "createdAt", "updatedAt") 
          values(:communityId, :userId, :adm, :initiativeName, NOW(), NOW())`,
      {
        replacements: { userId: user.id, communityId, adm: isADM, initiativeName },
        type: Sequelize.QueryTypes.INSERT,
      },
    );

    /**************** 
     * NOTIFICACAO
    *****************/

    /* se for isADM, notificacao e' para o contato da sec executiva */
    /* se nao for isADM, descobre moderadores, se nao tiver moderador, envia para a sec executiva */

    let to = 'sec';
    if (!isADM) {
      const [{ total }] = await db.instance().query(
        `
        select count(*) as total
        from dorothy_members m
        where m."communityId" = :communityId and m."type" = 'adm'
        `,
        {
          replacements: { communityId },
          type: Sequelize.QueryTypes.SELECT,
        },
      );
      if (total > 0) to = 'gt'
    }

    let content = {
      communityId,
      initiativeName,
      userId: user.id,
      userName: user.name,
      isADM,
      to,
    }

    let room = `room_c${communityId}_t1`;
    if (to === 'sec') {
      // descobre a comunidade adm da comunidade referida
      const adms = await db.instance().query(`
      select 
        p.adm_community_id
      from community_types ct 
      inner join perspectives p on p.id = ct.perspective_id 
      inner join dorothy_communities dc on trim(dc.alias) = ct.alias 
      where dc.id = :communityId
      `,
        {
          replacements: { communityId },
          type: Sequelize.QueryTypes.SELECT,
        },
      )

      if (adms.length && adms[0].adm_community_id) room = `room_c${adms[0].adm_community_id}_t1`;
    }

    await Messagery.sendNotification({ id: 0 }, room, {
      content,
      userId: 0,
      tool: {
        type: "native",
        element: "ParticipationNotification"
      },
    });

    return { success: true };
  }

  async addMember(communityId, userId, type = 'adm', order = 0) {
    /* type: MEMBER */

    // recupera as comunidades do usuário
    const communities = await db.instance().query(`
    select 
      coalesce(array_agg(dm."communityId"::text), '{}') as communities,
	    coalesce(max(dm."order"),0)::integer as "max_order"
    from dorothy_members dm 
    where dm."userId" = :userId
    `,
      {
        replacements: { userId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    // verifica se já é membro da comunidade em questão
    // se já é membro da comunidade, retorna
    if (communities[0].communities.includes(String(communityId))) return { error: 'already_in_community' }

    // inclui como membro da comunidade em questao
    await db.instance().query(
      ` insert into dorothy_members("communityId", "userId", "type", "createdAt", "updatedAt", "order")
        values(:communityId, :userId, :type, NOW(), NOW(), :order)
        `,
      {
        replacements: { communityId, userId, type, order },
        type: Sequelize.QueryTypes.INSERT,
      },
    );

    /* FOLLOW - verifica se usuário já segue a comunidade */
    const entities = await db.instance().query(
      `
        SELECT f.id
        from dorothy_following f
        where f."userId" = :userId and f.room = 'room_c${communityId}_t1'
        `,
      {
        replacements: { userId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    if (!entities.length) {
      /* INSERT - insere usuário como seguidor da comunidade */

      await db.instance().query(
        `
        INSERT INTO dorothy_following("userId", room, "communityId")
        VALUES(:userId, 'room_c${communityId}_t1', :communityId )
        `,
        {
          replacements: { userId, communityId },
          type: Sequelize.QueryTypes.INSERT,
        },
      );
    }

    // recupera a rede da comunidade em questão
    const networks = await db.instance().query(`
    select p.network_community_id::text
    from dorothy_communities dc 
    inner join community_types ct on ct.alias = trim(dc.alias)
    inner join perspectives p on p.id = ct.perspective_id 
    where dc.id <> p.network_community_id and dc.id = :communityId
    `,
      {
        replacements: { communityId },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    // se não há rede retorna
    let result;
    if (!networks.length || !networks[0].network_community_id) {

      result = { success: true, network: null }

    } else {
      // verifica se usuário já é membdo a rede da comunidade em questão
      if (!communities[0].communities.includes(networks[0].network_community_id)) {
        // não é? insere o usuário como membro da rede da comunidade em questão
        await db.instance().query(
          ` insert into dorothy_members("communityId", "userId", "type", "createdAt", "updatedAt", "order")
            values(:communityId, :userId, :type, NOW(), NOW(), :order)
            `,
          {
            replacements: { communityId: networks[0].network_community_id, userId, type: 'member', order: communities[0].max_order + 1 },
            type: Sequelize.QueryTypes.INSERT,
          },
        );
      }

      result = { success: true, network: networks[0].network_community_id }
    }

    // comando instantane para atualizar GTs do usuário
    // TODO: está atualizando o usuário conectado - ERRO!
    // Messagery.command('update_user', { userId })
    return result;
  }

  async getTotalMembersInPerspective(perspective_id) {
    const members = await db.instance().query(`
      select count(distinct dm."userId")::integer as total 
      from dorothy_communities dc
      inner join dorothy_members dm on dm."communityId" = dc.id
      where dc.descriptor_json->>'perspective' = :perspective_id
    `,
      {
        replacements: { perspective_id },
        type: Sequelize.QueryTypes.SELECT,
      },
    );

    return members[0].total;
  }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
