const facilitators = require('./facilitators.json');
require('dotenv').config({ path: '../../.env' });

const dayjs = require('dayjs');

const Sequelize = require('sequelize');
const db = require('../../../services/database');

(async () => {
    await db.instance().query('TRUNCATE TABLE public.facilitators RESTART IDENTITY RESTRICT');

    for (let f of facilitators) {        

        try {
            let stamp = 'NULL';
            if(dayjs(f.carimbo, 'D/M/YYYY HH:mm').isValid()) stamp = `'${dayjs(f.carimbo, 'D/M/YYYY HH:mm').format('YYYY-MM-DD HH:mm')}'`;

            const query = `
            INSERT INTO public.facilitators
            (id, "userId", "name", email, photo, institution, state, territory_group, stamp, "createdAt", "updatedAt")
            VALUES(nextval('facilitators_id_seq'::regclass), null, '${f.nome}', '${f.email}', '${f.foto}', '${f.instituiçao}', '${f.estado}', '${f.grupoterritorial}', ${stamp}, NOW(), NOW());
            `;

            // console.log(query);

            await db.instance().query(
                query,
                {
                    type: Sequelize.QueryTypes.INSERT,
                }
            );

        } catch (err) {
            console.log(err);
        }
    }

    console.log('DONE.')

    process.exit(0);

})()