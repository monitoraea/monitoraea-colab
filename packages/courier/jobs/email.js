// const os = require('os');
const { parentPort, workerData } = require('worker_threads');

const Cabin = require('cabin');
const { Client } = require('pg');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const logger = new Cabin();

// store boolean if the job is cancelled
let isCancelled = false;


let clientDB = new Client(workerData.dbUrl);

// how many emails to send at once
// const concurrency = os.cpus().length;

// handle cancellation (this is a very simple example)
if (parentPort)
    parentPort.once('message', message => {
        if (message === 'cancel') isCancelled = true;
    });

let query, result;
(async () => {
    console.log('E-mail Job canceled!')
    parentPort.postMessage('done');
    
    // try {
    //     console.log('Abre conexões...');

    //     await clientDB.connect();

    //     query = `
    //     select a.id, a.room, u.name, u.email
    //     from dorothy_alerts a
    //     inner join dorothy_users u on u.id = a."userId" 
    //     where a."pendingEmail" = true 
    //     and a."readAt" is null
    //     and a."canceledAt" is null
    //     `;

    //     result = await clientDB.query(query);

    //     await Promise.all(
    //         result.rows.map(async (row) => {
    //             return new Promise(async (resolve, reject) => {
    //                 try {
    //                     if (isCancelled) return;

    //                     const to = `${row['name']} <${row['email']}>`;

    //                     const message = `TODO: ${row['room']}`;

    //                     const msg = {
    //                         to, 
    //                         from: process.env.CONTACT_EMAIL,
    //                         subject: `Voce tem novas notificacoes na plataforma`,
    //                         text: message,
    //                         html: message.replace(/(?:\r\n|\r|\n)/g, '<br>')
    //                     };

    //                     await sgMail.send(msg);
                        
    //                     // marcar como enviado!
    //                     query = `
    //                     update dorothy_alerts 
    //                     set 
    //                         "pendingEmail" = false,
    //                         "emailedAt" = NOW()
    //                     where id = ${row['id']}
    //                     `;

    //                     await clientDB.query(query);
    //                     resolve();
                        
    //                 } catch (err) {
    //                     console.log('err!');
    //                     reject(err);
    //                 }
    //             })
    //         })
    //     );

    // } catch (e) {
    //     console.log('Error', e);
    // } finally {
    //     clientDB.end();

    //     console.log('Fecha conexões...');

    //     // signal to parent that the job is done
    //     if (parentPort) parentPort.postMessage('done');
    //     else process.exit(0);
    // }
})();