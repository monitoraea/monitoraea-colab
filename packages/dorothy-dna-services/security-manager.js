const { isMember } = require('./services/user');

class SecurityManager {
    constructor() {
        this.routes = {};
    }

    check(callback, keyRule) {
        return async (req, res) => {
            let service = req.baseUrl;

            const key = keyRule ? `RULE__${service}__${keyRule}` : `${req.method}__${service}__${req.route.path}`;

            /* get the specific rule */
            if (!!this.routes[key]) {
                if (typeof this.routes[key] === 'function') {
                    /* functional rule */
                    let granted = await this.routes[key](res.locals.user, req);

                    if (!granted) {
                        res.status(401).send({ error: 'Permission denied!', route: req.originalUrl });
                        return;
                    }
                } else {
                    /* textual rule */
                    console.log('Textual Rules are not implemented!', this.routes[key])
                }
            }

            if (typeof callback === 'function') callback(req, res);
        }
    }

    add(service, rules) { 
        if (!Array.isArray(rules)) return;

        rules.forEach(r => { /* r: method, route, func | rule, func  */
            if (r.rule) {
                this.routes[`RULE__/${service}__${r.rule}`] = r.func;
            } else {
                let method = r.method.toUpperCase();
                this.routes[`${method}__/${service}__${r.route}`] = r.func;
            }
        });
    }
    addFromConfig(config) {
        Object.keys(config).map(service => this.add(service, config[service]));
    }

    async isMember(user, communities) {
        if(!user) return false;
        return await isMember(user.id, communities);
    }
}

const singletonInstance = new SecurityManager();
module.exports = singletonInstance;