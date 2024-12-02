const YAML = require('yaml')
var fs = require('fs')
const dayjs = require('dayjs');

class Service {
    forms = {}

    async getForms(folder) {
        return fs.readdirSync(`../../forms/${folder}`)
    }

    async getForm(form_name) {
        if (!this.forms[form_name]) {
            this.forms[form_name] = YAML.parse(fs.readFileSync(require.resolve(`../../forms/${form_name}.yml`), 'utf8'))
        }

        return this.forms[form_name]
    }

    upFields(form) {
        return form.fields.filter(f => ['file', 'thumbnail'].includes(f.type)).map(f => ({ name: f.db_field || f.key, maxCount: 1 }))
    }

    parse(form, data) {
        const entity = JSON.parse(data)

        for(let f of form.fields) { // based on filed type
            switch(f.type) {
                case 'yearpicker':
                    if (!!entity[f.key]) entity[f.key] = dayjs(entity[f.key]).year()
                    break;
                case 'options':
                    entity[f.key] = entity[f.key] === 'none' ? null : entity[f.key]
                    break;
            }
        }

        return entity
    }
}

const singletonInstance = new Service();
module.exports = singletonInstance;
