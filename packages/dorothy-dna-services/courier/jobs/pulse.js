// const os = require('os');
const { parentPort, workerData } = require('worker_threads');

const Cabin = require('cabin');
const axios = require('axios');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const logger = new Cabin();

// store boolean if the job is cancelled
let isCancelled = false;

// how many emails to send at once
// const concurrency = os.cpus().length;

// handle cancellation (this is a very simple example)
if (parentPort)
    parentPort.once('message', message => {
        if (message === 'cancel') isCancelled = true;
    });

let query, result;
(async () => {
    const port = process.env.PORT || 4006;

    console.log(`Running pulse`)

    await axios.post(`http://localhost:${port}/messagery/pulse`);

    // signal to parent that the job is done
    if (parentPort) parentPort.postMessage({
        result: 'success',
        // amount,
    });

    process.exit(0);

})();