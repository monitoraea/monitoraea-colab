const Sequelize = require('sequelize');
const db = require('../database');

const { applyJoins, applyWhere } = require('../../utils');

const { Messagery } = require('dorothy-dna-services');

const dayjs = require('dayjs');

class Service {

    test() {
        return 'Test Ok';
    }

    async sendContact(name, email, message) {
        /* NOTIFICACAO */

        let content = {
            name,
            email,
            message,
        }

        await Messagery.sendNotification({ id: 0 }, 'room_c1_t1', {
            content,
            userId: 0,
            tool: {
                type: "native",
                element: "NewGeneralContactFromSite"
            },
        });

        return {
            success: true,
        }
    }

    async updateRecipes(uuid) {
        if (uuid != '7d44067a-5b09-4128-ac77-75b351a9d43b') return { success: false };

        const types = [
            { id: 'project' },
            { id: 'adm' },
            { id: 'facilitador' },
            { id: 'network' },
        ];

        // recupera as receitas
        for (let type of types) {
            const recipe = await db.instance().query(`
            select descriptor_json
            from dorothy_community_recipes
            where type = '${type.id}'
            `, {
                type: Sequelize.QueryTypes.SELECT,
            });

            type.recipe = recipe[0].descriptor_json;
        }

        // recupera todas as comunidades
        const communities = await db.instance().query(`
            select dc.id, TRIM(dc."type") as "type", dc.descriptor_json->>'title' as "name"  
            from dorothy_communities dc 
            order by type
            `, {
            type: Sequelize.QueryTypes.SELECT,
        });

        for (let community of communities) {
            const type = types.find(t => t.id === community.type)

            if (!type) continue;

            const descriptor_json = JSON.stringify(type.recipe).replace('%TITLE%', community.name);

            await db.instance().query(`
                update dorothy_communities
                set descriptor_json = '${descriptor_json}'
                where id = ${community.id}
                `, {
                type: Sequelize.QueryTypes.UPDATE,
            });
        }

        return { success: true };
    }

    async buildBasicReport() {

        // retrieve last report date
        const lastReport = await db.instance().query(`
            select r."createdAt"
            from reports r
            where TRIM(type) = 'basic'
            order by r."createdAt" DESC
            `, {
            type: Sequelize.QueryTypes.SELECT,
        });

        // define start_date (if there is no last report -> now - 1 month)
        let start_date;
        if (!!lastReport.length) start_date = dayjs(lastReport[0].createdAt).format('YYYY-MM-DD');
        else start_date = dayjs().subtract(1, 'month').format('YYYY-MM-DD');

        // request data

        const published = await db.instance().query(`
        select p.id, p.community_id, p.nome, p.publicacao as "when"
        from projetos p 
        where publicacao >= :start_date
        order by p.publicacao
        `, {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { start_date }
        });

        const institutions = await db.instance().query(`
        select i.id, i.nome, i."createdAt" as "when" 
        from instituicoes i 
        where i."createdAt" >= :start_date
        order by i."createdAt"
        `, {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { start_date }
        });

        const projects = await db.instance().query(`
        select p.id, p.community_id, p.nome, pr."createdAt" as "when"
        from projetos_rascunho pr 
        inner join projetos p on p.id = pr.projeto_id 
        where pr."createdAt" >= :start_date
        order by pr."createdAt"
        `, {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { start_date }
        });

        const indications = await db.instance().query(`
        select 
            p_i.id, 
            p.community_id, 
            p_i."name", 
            pii.contact_name,
            pii.contact_email,
            pii.contact_phone,
            pii.website,
            p_i."createdAt" as "when"
        from projetos_indicados p_i
        left join projetos_rascunho pr on pr.id = p_i.projeto_id 
        left join projetos p on p.id = pr.projeto_id 
        left join projetos_indicados_info pii on pii.projeto_indicado_id = p_i.id 
        where p_i."createdAt" >= :start_date
        and (pr."createdAt" is null or pr."createdAt" >= :start_date)
        order by p_i."createdAt"
        `, {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { start_date }
        });

        // create report
        let content = JSON.stringify({
            published,
            institutions,
            projects,
            indications,
            data_range: [
                start_date,
                dayjs().format('YYYY-MM-DD'),
            ]
        });

        // save data in report table
        const result = await db.instance().query(`
        insert into reports (version, content, "type", "createdAt", "updatedAt")
        values (1, :content, 'basic', NOW(), NOW())
        RETURNING id
        `, {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { content }
        });

        return {
            id: result[0].id,
            content,
        }

    }

    async sendSystemNotification(uuid, content) {
        if (uuid != '7d44067a-5b09-4128-ac77-75b351a9d43b') return { success: false };

        /* send notification w/ watch */
        await Messagery.sendNotification({ id: 0 }, 'room_c1_t1', {
            content,
            userId: 0, //TODO: user? 
            tool: {
                type: "native",
                element: "BasicReportNotification"
            },
        });

        return { success: true };
    }

    async getReport(id) {
        const reports = await db.instance().query(`
        select *
        from reports
        where id = :id
        `, {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { id }
        });

        return reports[0];
    }

    buildFiltersWhere(filters, where = [], exclude = []) {
        let whereArray = [...where];
        if (filters['f_modalidades'] && !exclude.includes('f_modalidades'))
            whereArray.push(`p.modalidade_id IN (${filters['f_modalidades']})`);

        if (filters['f_regioes'] && !exclude.includes('f_regioes'))
            whereArray.push(
                `pa.nm_regiao IN (${filters['f_regioes']
                    .split(',')
                    .map(r => `'${r}'`)
                    .join(',')})`,
            );

        if (filters['f_ufs'] && !exclude.includes('f_ufs')) whereArray.push(`m.cd_uf IN (${filters['f_ufs']})`);
        if (filters['f_municipios'] && !exclude.includes('f_municipios'))
            whereArray.push(`m.cd_mun IN (${filters['f_municipios']})`);

        return whereArray.length ? `WHERE ${whereArray.join(' AND ')}` : '';
    }

    async getIndicStatistics(
        type,
        lae_id,
        indic_id,
        question_id,
        filters,
    ) {
        let query, result, total;

        const key = `${parseInt(lae_id)}_${parseInt(indic_id)}`;
        if (!!question_id /* base nao tem */) question_id = parseInt(question_id);

        const where = this.buildFiltersWhere(filters, ['publicacao is NOT NULL']);
        let filteredQuery = `
        select distinct p.id, indicadores 
        from projetos p
        left join projetos_atuacao pa on pa.projeto_id = p.id
        left join municipios m on m.cd_mun = pa.cd_mun
        ${where}
        `;


        const withStatement = `with filtered_projects as (${filteredQuery})`;

        switch (type) {
            case 'int1':
                query = `
                ${withStatement}
                select 
                    avg(cast(regexp_replace(indicadores#>>'{${key}, ${question_id}}', '\\D','','g') as INTEGER)) as average
                from filtered_projects p 
                where indicadores is not null
                and indicadores#>>'{${key}, base}' = 'sim'
                and indicadores#>>'{${key}, ${question_id}}' <> ''
                `;

                // retrieve
                result = await db.instance().query(query, {
                    type: Sequelize.QueryTypes.SELECT,
                });

                // prepare
                result = parseFloat(result[0].average)
                break;
            case 'int2':
                query = `
                with distribution as (
                    with answers as (
                        ${withStatement}                        
                        select 
                            cast(regexp_replace(indicadores#>>'{${key}, ${question_id}}', '\\D','','g') as INTEGER) as qtd,
                            count(*) as freq
                        from filtered_projects p 
                        where indicadores is not null
                        and indicadores#>>'{${key}, base}' = 'sim'
                        group by qtd
                    )
                    SELECT 
                        qtd,
                        freq,	    
                        NTILE(5) OVER(
                            ORDER BY qtd
                        ) as bucket
                    FROM
                        answers
                )
                select bucket, min(qtd), max(qtd), sum(freq)::int 
                from distribution
                group by bucket
                order by bucket
                `;

                // retrieve
                result = await db.instance().query(query, {
                    type: Sequelize.QueryTypes.SELECT,
                });

                //prepare
                total = result.reduce((acc, i) => acc += i.sum, 0)
                result = result.map((i, idx) => ({ ...i, id: idx + 1, name: `${i.min !== i.max ? `de ${i.min} a ${i.max}` : i.min}`, total: i.sum, percent: i.sum / total }))

                break;
            case 'sn':
                query = `
                ${withStatement}
                select 
                    indicadores#>>'{${key}, ${question_id}}' as answer,
                    count(*) as qtd
                from filtered_projects p 
                where indicadores is not null
                and indicadores#>>'{${key}, base}' = 'sim'
                group by answer
                `;

                // retrieve
                result = await db.instance().query(query, {
                    type: Sequelize.QueryTypes.SELECT,
                });

                // prepare
                total = result.reduce((acc, i) => acc += parseInt(i.qtd), 0)
                result = result.map((i, idx) => ({ ...i, id: idx + 1, name: base_titles[i.answer], total: parseInt(i.qtd), percent: parseInt(i.qtd) / total }))
                break;
            case 'ss':
                query = `
                ${withStatement}
                select 
                    indicadores#>>'{${key}, ${question_id}}' as answer,
                    count(*)::int as qtd
                from filtered_projects p 
                where indicadores is not null
                and indicadores#>>'{${key}, base}' = 'sim'
                group by answer
                `;

                // retrieve
                result = await db.instance().query(query, {
                    type: Sequelize.QueryTypes.SELECT,
                });

                // prepare
                total = result.reduce((acc, i) => acc += parseInt(i.qtd), 0)
                result = result.map((i, idx) => ({ ...i, id: idx + 1, name: i.answer, total: parseInt(i.qtd), percent: parseInt(i.qtd) / total }))
                break;
            case 'sso':
                query = `
                ${withStatement}
                select 
                    case 
                        when indicadores#>>'{${key}, ${question_id}, other}' is not null then 100 
                        else cast(regexp_replace(indicadores#>>'{${key}, ${question_id}, value}', '\D','','g') as INTEGER)
                    end as answer,
                    count(*)::int as qtd
                from filtered_projects p 
                where indicadores is not null
                and indicadores#>>'{${key}, base}' = 'sim'
                group by answer
                order by answer
                `;

                // retrieve
                result = await db.instance().query(query, {
                    type: Sequelize.QueryTypes.SELECT,
                });

                // prepare
                total = result.reduce((acc, i) => acc += parseInt(i.qtd), 0)
                result = result.map((i, idx) => ({ ...i, id: idx + 1, name: i.answer, total: parseInt(i.qtd), percent: parseInt(i.qtd) / total }))
                break;
            case 'sm':
                query = `
                ${withStatement}
                select 
                    jsonb_array_elements(indicadores#>'{${key}, ${question_id}}') as answer,
                    count(*)::int as qtd
                from filtered_projects p 
                where indicadores is not null
                and indicadores#>>'{${key}, base}' = 'sim'
                group by answer
                `;

                // retrieve
                result = await db.instance().query(query, {
                    type: Sequelize.QueryTypes.SELECT,
                });

                // prepare
                /* total = result.reduce((acc, i) => acc += parseInt(i.qtd),0) */
                result = result.map((i, idx) => ({ ...i, id: idx + 1, name: i.answer, total: parseInt(i.qtd)/* , percent: parseInt(i.qtd) / total */ }))
                result.sort((a, b) => a.total > b.total ? -1 : 1)
                break;
            case 'smo':
                query = `
                with all_options as (
                    ${withStatement}                    
                    select 
                        case 
                            when indicadores#>>'{${key}, ${question_id}, other}' is not null then '[100]'
                            else indicadores#>'{${key}, ${question_id}, items}'
                        end as ans
                    from filtered_projects p 
                    where indicadores is not null
                    and indicadores#>>'{${key}, base}' = 'sim'
                )
                select 
                    jsonb_array_elements(ans) as answer,
                    count(*)::int as qtd
                from all_options
                group by answer
                order by answer
                `;

                // retrieve
                result = await db.instance().query(query, {
                    type: Sequelize.QueryTypes.SELECT,
                });

                // prepare
                /* total = result.reduce((acc, i) => acc += parseInt(i.qtd),0) */
                result = result.map((i, idx) => ({ ...i, id: idx + 1, name: i.answer, total: parseInt(i.qtd)/* , percent: parseInt(i.qtd) / total */ }))
                result.sort((a, b) => a.total > b.total ? -1 : 1)
                break;
            case 'se_aplica':
                query = `
                ${withStatement}
                select 
                    count(*)::int as qtd
                from filtered_projects p 
                where indicadores is not null
                and indicadores#>>'{${key}, base}' = 'sim'
                `;

                // retrieve
                result = await db.instance().query(query, {
                    type: Sequelize.QueryTypes.SELECT,
                });

                // prepare
                result = result[0].qtd;

                break;
            default: // BASE
                query = `
                ${withStatement}
                select 
                    indicadores#>>'{${key}, base}' as answer,
                    count(*) as qtd
                from filtered_projects p 
                where indicadores is not null
                and indicadores#>'{${key}, base}' is not null
                group by answer
                `

                // retrieve
                result = await db.instance().query(query, {
                    type: Sequelize.QueryTypes.SELECT,
                });

                // prepare
                total = result.reduce((acc, i) => acc += parseInt(i.qtd), 0)
                result = result.map((i, idx) => ({ ...i, id: idx + 1, name: base_titles[i.answer], total: parseInt(i.qtd), percent: parseInt(i.qtd) / total }))

        }

        return result;
    }

    async getNumberOfMembers() {
        // retrieve
        let result = await db.instance().query(`
            with distribution as (
                with answers as (
                    with members_count as (
                        select 
                            dc.id,
                            count(*) as "total"
                        from dorothy_communities dc
                        inner join dorothy_members dm on dm."communityId" = dc.id
                        where dc."type" = 'project'
                        group by 1
                    )
                    select 
                        total as qtd,
                        count(*) as freq
                    from members_count
                    group by 1
                )
                SELECT 
                    qtd,
                    freq,       
                    NTILE(5) OVER(
                        ORDER BY qtd
                    ) as bucket
                FROM
                    answers
            )
            select bucket, min(qtd), max(qtd), sum(freq)::int 
            from distribution
            group by bucket
            order by bucket
            `, {
            type: Sequelize.QueryTypes.SELECT,
        });

        //prepare
        const total = result.reduce((acc, i) => acc += i.sum, 0)
        result = result.map((i, idx) => ({ ...i, id: idx + 1, name: `${i.min !== i.max ? `de ${i.min} a ${i.max}` : i.min}`, total: i.sum, percent: i.sum / total }))

        return result;
    }

    async getNumberOfMembersRank() {
        // retrieve
        let result = await db.instance().query(`
        select 
            dc.id, 
            dc.descriptor_json->>'title' as "name",
            count(*) as "total"
        from dorothy_communities dc
        inner join dorothy_members dm on dm."communityId" = dc.id
        where dc."type" = 'project'
        group by 1,2
        order by 3 desc
        limit 8
        `, {
            type: Sequelize.QueryTypes.SELECT,
        });

        return result;
    }

    async getTotalOfInitiatives() {
        // retrieve
        let result = await db.instance().query(`
            select 
                count(*)::integer as total
            from dorothy_communities dc
            where dc.alias in ('comissao', 'projeto', 'politica')
            `, {
            type: Sequelize.QueryTypes.SELECT,
        });

        return result[0].total;
    }
}

const base_titles = {
    'sim': 'Sim',
    'nao': 'Não',
    'nao_aplica': 'Não se aplica',
}

const singletonInstance = new Service();
module.exports = singletonInstance;