const { MailerSend, EmailParams, Sender, Recipient } = require ("mailersend");

const mailerSend = new MailerSend({
    apiKey: process.env.MAILERSEND_TOKEN,
});

module.exports.sendEmail = async (msg) => {

  const sentFrom = new Sender(msg.contact_email || process.env.CONTACT_EMAIL, msg.contact_name || process.env.CONTACT_NAME);

  const recipients = [
    new Recipient(msg.to_email, msg.to_name)
  ];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject(msg.subject)
    .setHtml(msg.html)
    .setText(msg.text || msg.html);

  await mailerSend.email.send(emailParams);
}