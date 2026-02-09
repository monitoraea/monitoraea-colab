const Bree = require('bree');
const path = require('path');

const dayjs = require('dayjs');

class Service {
    constructor(...args) {
        let jobs = [];

        const [ port ] = args;

        // REPORT JOB
        const reportJob = this.reportJobConfig();
        if (reportJob !== false) jobs.push(reportJob);

        if (!!jobs.length) {
            this.bree = new Bree({
                root: path.join(path.dirname(require.resolve('.')), 'jobs'), /* TODO: best practices */
                worker: {
                    workerData: {
                        port,
                    }
                },
                jobs
            });
            this.bree.start();
        }
    }

    reportJobConfig() {
        if (process.env.REPORT_CRON === 'OFF') {
            console.log('Report DISABLED');
            return false;
        }

        // runs `./jobs/report.js`,
        let config = { name: 'report' };
        if (process.env.REPORT_CRON) {
            config.cron = process.env.REPORT_CRON;
            console.log(`Report schedule: ${process.env.REPORT_CRON} (cron)`);
        } else {
            config.date = dayjs().add(5, 'second').toDate();
        }

        return config;
    }
}

module.exports = function (...args) {
    // return new Service(...args);
    return false;
}