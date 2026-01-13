const { MailtrapClient } = require("mailtrap");

const getClient = (apiKey) => {
    const client = new MailtrapClient({ token: apiKey });
    return client;
}

const sendEmail = async (client, from, to, subject, text, type) => {
    const sender = { email: from, name: "Discurso" };
    let recipients;
    if (typeof to === "string") {
        recipients = [{ email: to }];
    } else {
        recipients = to.map(address => ({ email: address }))
    }

    await client.send({
        from: sender,
        to: recipients,
        subject: subject,
        text: text,
        category: type || "notification",
    });

}

exports.sendEmail = sendEmail;
exports.getClient = getClient;