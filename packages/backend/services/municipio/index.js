const Sequelize = require('sequelize');
const db = require('../database');

const { applyJoins, applyWhere } = require('../../utils');

class Service {

    async list(config) {
        const list = await db.instance().query(`
        SELECT m.cd_mun as value, m.nm_mun as name, m.nm_uf as uf_name
        FROM municipios m
        order by m.nm_mun
    `, {
            type: Sequelize.QueryTypes.SELECT,
        });

        let prepared_list = [...list];
        if (config.uf) {
            prepared_list = prepared_list.map(m => ({ ...m, name: `${m.name} - ${m.uf_name}` }))
        }

        return { list: prepared_list };
    }

    async getSingle(cd_mun) {
        const entities = await db.instance().query(`
        SELECT m.cd_mun as id, m.nm_mun as name
        FROM municipios m
        where m.cd_mun = :cd_mun
    `, {
            replacements: { cd_mun },
            type: Sequelize.QueryTypes.SELECT,
        });

        return entities[0];
    }

    async get(cd_mun) {
        const entities = await db.instance().query(`
        SELECT m.cd_mun as value, m.nm_mun as name
        FROM municipios m
        where m.cd_mun = :cd_mun
    `, {
            replacements: { cd_mun },
            type: Sequelize.QueryTypes.SELECT,
        });

        return entities[0];
    }

    async getRelated(config) {
        let where = [];
        let replacements = {};

        if (config.search) {
            where.push(`unaccent(m.nm_mun) ilike unaccent(:search)`);
            replacements.search = `%${config.search}%`;
        }

        if (config.uf) {
            where.push(`m.cd_uf = :uf`);
            replacements.uf = config.uf.split('_')[1]; // CD_GEOCUF
        }

        const entities = await db.instance().query(`
        SELECT m.cd_mun as id, m.nm_mun as name
        FROM municipios m
        ${applyWhere(where)}
        ORDER BY m.nm_mun
        LIMIT 20
    `, {
            type: Sequelize.QueryTypes.SELECT,
            replacements,
        });

        return { list: entities };
    }

    async bbox(cd_mun) {

        const [bbox] = await db.instance().query(`
        with bounds as (
            select ST_Extent(ST_Transform(geom,4326)) as bbox
            from municipios m 
            where m.cd_mun = :cd_mun and geom is not null
        )
        select ST_YMin(bbox) as y1, ST_XMin(bbox) as x1, ST_YMax(bbox) as y2, ST_XMax(bbox) as x2 
        from bounds
    `,
            {
                replacements: { cd_mun },
                type: Sequelize.QueryTypes.SELECT,
            });

        return bbox;
    }

    async feature(cd_mun) {
        const geoms = await db.instance().query(`
        select ST_AsGeoJSON((ST_Dump(ST_Simplify(m.geom,0.001))).geom)::jsonb as geojson
        from municipios m 
        where m.cd_mun = :cd_mun
        `,
            {
                replacements: { cd_mun },
                type: Sequelize.QueryTypes.SELECT,
            });

        return geoms.map(({ geojson }) => geojson)
    }
}



const singletonInstance = new Service();
module.exports = singletonInstance;
