const db = require("./database");
const Sequelize = require("sequelize");
const Sentry = require("@sentry/node");

let cachedCommunities = {};
let cachedTools = {};

module.exports.sendError = function(res, error, status = 500) {
    if(process.env.NODE_ENV !== 'production') console.log(error);
    if (process.env.GLITCHTIP_DSN) Sentry.captureException(error);
    res.status(status).send({ error });
}

module.exports.toPGArray = function(value) {
    if(!value) return null;
    return `{${value.join(',')}}`;
}

module.exports.prepareAlert = async function(room, id) {
    const regexpC = /c(\d*)/, regexpT = /t(\d*)/, regexpI = /i(\d*)/;
    let matchC = room.match(regexpC);
    let matchT = room.match(regexpT);
    let matchI = room.match(regexpI);

    let tool = await getTool(matchT[1])

    let data = {
        t: matchT[1],
        text: `in ${tool.name}`, /* so ferramenta */
        extended: {
            toolName: tool.name,
            toolAlias: tool.alias,
        },
    }

    if (matchI) {
        data.extended.item_id = matchI[1];
        data.text = `item #${data.extended.item_id} of ${tool.name}`; /* item de ferramenta */
    }
    if (matchC) {
        let community = await getCommunity(matchC[1]);
        data.c = matchC[1];
        data.extended.communityName = community.name;
        data.extended.communityAlias = community.alias;
        if (matchI) data.text = `item #${data.extended.item_id} of ${tool.name} in community ${community.name}`; /* item de ferramenta em comunidade */
        else data.text = `${tool.name} in community ${community.name}`; /* ferramenta em comunidade */
    }

    return {
        id,
        data,
    }
}

async function getTool(id) {
    const sequelize = db.instance();

    if (!cachedTools[id]) {
        let item = await sequelize.query(`
    select 
        t.descriptor_json->>'title' as "name", 
        t.descriptor_json->>'alias' as "alias"
    from ${process.env.DB_PREFIX}tools t
    where t.id = :id
    `, {
            replacements: { id },
            type: Sequelize.QueryTypes.SELECT,
        })
        cachedTools[id] = item[0];
    }
    return cachedTools[id];
}
async function getCommunity(id) {
    const sequelize = db.instance();

    if (!cachedCommunities[id]) {
        let item = await sequelize.query(`
    select 
        c.descriptor_json->>'title' as "name",
        c."alias"
    from ${process.env.DB_PREFIX}communities c
    where c.id = :id
    `, {
            replacements: { id },
            type: Sequelize.QueryTypes.SELECT,
        })
        cachedCommunities[id] = item[0];
    }
    return cachedCommunities[id];
}

module.exports.applyJoins = function (joins) {
    return joins.join('\n');
}

module.exports.applyWhere = function (where, contained = false) {
    if (!where.length) return '';
    
    return !contained ? `where ${where.join('\nand ')}` : `where (${where.join('\nand ')})`;
}

module.exports.capitalize = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

module.exports.getIds = function (list) {
    return list.map(({ id }) => id).join(',')
}

module.exports.defaults = {
    limit: 10,
}

module.exports.protect = {
    order: (text) => text.split(' ')[0],
    direction: (text) => text.split(' ')[0],
    number_array: (text) => text.split(' ')[0],
}