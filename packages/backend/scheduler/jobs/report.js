// const os = require('os');
const { parentPort, workerData } = require('worker_threads');

const axios = require('axios');

// store boolean if the job is cancelled
let isCancelled = false;

// handle cancellation (this is a very simple example)
if (parentPort)
    parentPort.once('message', message => {
        if (message === 'cancel') isCancelled = true;
    });

async function report() {

    // create and store report
    return await require('../../services/adm').buildBasicReport();
}

(async () => {

    try {

        const reportData = await report();

        // notification
        await axios.post(`http://localhost:${workerData.port}/adm/send_system_notification/7d44067a-5b09-4128-ac77-75b351a9d43b`, {
            result: 'success',
            reportId: reportData.id,
        });

        // signal to parent that the job is done
        if (parentPort) parentPort.postMessage({
            result: 'success',
            reportId: reportData.id,
        });

        process.exit(0);
    } catch (e) {

        // notification
        await axios.post(`http://localhost:${workerData.port}/adm/send_system_notification/7d44067a-5b09-4128-ac77-75b351a9d43b`, {
            result: 'error',
            error: e.stack,
        });

        console.log('Error', e);
        // signal to parent that the job fail
        if (parentPort) parentPort.postMessage({
            result: 'error',
            message: e.message,
        });

        process.exit(0);
    }
})();