const Bree = require('bree');
const Cabin = require('cabin');
const path = require('path');

class Service {
    constructor(dbUrl) {
        this.bree = new Bree({
            root: path.join(path.dirname(require.resolve('.')), 'jobs'), /* TODO: best practices */
            worker: {
                workerData: {
                    dbUrl,
                }
            },
            logger: new Cabin(),
            jobs: [
                {
                    // runs `./jobs/email.js`
                    name: 'email',
                    interval: '10m'
                }
            ]
        });
        this.bree.start();
    }
}

module.exports = function (...args) {
    // return new Service(...args);
    return false;
}