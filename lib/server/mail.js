import "server-only";
import { MailtrapClient } from "mailtrap";

const IN_DEV = process.env.NODE_ENV === "development";
const TOKEN = IN_DEV ? process.env.MAILTRAP_TEST_API_KEY : process.env.MAILTRAP_API_KEY;
const SENDER_ADDRESS = process.env.MAILTRAP_SENDER_ADDRESS;

const CLIENT = new MailtrapClient(IN_DEV ? {
  token: TOKEN,
  testInboxId: 3353713
} : {
  token: TOKEN,
});

const SENDER = {
  email: SENDER_ADDRESS,
  name: "Discurso",
};

export async function sendAdminWelcomeEmail(adminEmails, newUsers, emailsSent, eventName) {
  if (!adminEmails?.length) {
    console.warn("No admin emails provided for welcome notification.");
    return;
  }
  const subject = `Onboarding emails sent`;
  const message = `Sent ${emailsSent} onboarding email when creating ${newUsers} new users for event ${eventName}`;
  return await sendEmail({
    recipients: adminEmails.map(email => ({ email })),
    subject,
    message
  }, "admin");
}

export async function sendWelcomeEmail(email, name, link) {
  if (email.includes("example.com")) return;
  if (email.includes("demo.net")) return;
  if (email.includes("company.co")) return;
  if (email.includes("mail.org")) return;
  return await sendEmail({
    recipients: [{ email }], subject: `Welcome to Discurso.AI`, message: `Dear Negotiator,

Welcome to Discurso.AI, a science-based, interactive platform designed to help you develop and practice your negotiation skills.

We are thrilled to have you with us! To get started, please set up your account password by following the single-use link below:

${link}

If you have any questions or need assistance, feel free to reach out to us at support@discurso.ai

Happy negotiating!
Your Discurson.AI Team`
  }, "welcome");
}

export async function sendEmail(mail, category) {
  const recipients = mail.recipients || mail.to.map((receiver) => {
    return { email: receiver };
  });
  if (IN_DEV) {
    // if (false) {
    console.log("Sending test email", SENDER);
    await CLIENT.testing.send({
      from: {
        email: "hello@example.com",
        name: "Mailtrap Test",
      },
      to: [{ email: "eryk@anhalt.dev" }],
      subject: mail.subject,
      text: mail.message || `This is a test email with the subject: "${mail.subject}"`,
      category: category || "communication",
    })
  } else {
    await CLIENT.bulk.send({
      from: SENDER,
      to: recipients,
      subject: mail.subject,
      text: mail.message || `This is a test email with the subject: "${mail.subject}"`,
      category: category || "communication",
    });
  }
}