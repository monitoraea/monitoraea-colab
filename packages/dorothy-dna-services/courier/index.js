const Bree = require('bree');
const Cabin = require('cabin');
const path = require('path');

const Sequelize = require('sequelize');
const db = require('../database');

class Service {
    constructor() {
        this.prepareJobs();
    }

    async prepareJobs() {
        let jobs = [
            this.emailAndPulseConfig(),
        ]

        this.bree = new Bree({
            root: path.join(path.dirname(require.resolve('.')), 'jobs'), /* TODO: best practices */
            logger: new Cabin(),
            jobs
        });

        this.bree.start();
    }

    emailAndPulseConfig() {
        let config = {
            // runs `./jobs/pulse.js`
            name: 'pulse',
        }

        config.interval = `${process.env.EMAIL_ALERTS_PULSE || 10}m`
        console.log(`E-mail and Alerts pulse interval: ${process.env.EMAIL_ALERTS_PULSE || 10}m`);

        return config;
    }
}

module.exports = function (...args) {
    return new Service(...args);
}