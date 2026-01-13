const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { getAuth } = require("firebase-admin/auth");
const jwt = require("jsonwebtoken");
const TEXTS = require("./textTemplates.json");

console.debug("-Periodic function [emails & summaries]", new Date().toISOString());

const mailer = require("./mailer");
initializeApp();

const APP_DOMAIN = defineSecret("APP_DOMAIN");
const MAILTRAP_API_KEY = defineSecret("MAILTRAP_API_KEY");
const MAILTRAP_SENDER_ADDRESS = defineSecret("MAILTRAP_SENDER_ADDRESS");
const FUNCTIONS_API_KEY = defineSecret("FUNCTIONS_API_KEY");
const NEXT_PUBLIC_ENVIRON = defineSecret("NEXT_PUBLIC_ENVIRON");
const WELCOME_SECRET_KEY = defineSecret("WELCOME_SECRET_KEY");

const BLACKLISTED_EMAIL_DOMAINS = ["example.com", "mail.org", "demo.net", "company.co"];

const getAdminEmails = async () => {
    const auth = getAuth();
    const admins = new Set();
    let nextPageToken;
    do {
        const result = await auth.listUsers(1000, nextPageToken);
        for (const user of result.users) {
            const role = user.customClaims?.role;
            if (role === "admin" && user.email) {
                const domain = user.email.split("@")[1];
                if (!BLACKLISTED_EMAIL_DOMAINS.includes(domain)) {
                    admins.add(user.email);
                }
            }
        }
        nextPageToken = result.pageToken;
    } while (nextPageToken);
    return Array.from(admins);
}

const getRoundEmailText = (eventName, round, pathLink, roundEndTime) => {
    return TEXTS.roundEmail
        .replace("<EVENT_NAME>", eventName)
        .replace("<ROUND>", round)
        .replace("<PATH_LINK>", pathLink)
        .replace("<ROUND_END_TIME>", roundEndTime);
}

const getSummaryEmailText = (eventName, roundNo, summary, link) => {
    return TEXTS.summaryEmail
        .replace("<EVENT_NAME>", eventName)
        .replace("<ROUND>", roundNo)
        .replace("<SUMMARY>", summary)
        .replace("<LINK>", link);
}

const getWelcomeEmailText = (welcomeLink) => {
    return TEXTS.welcomeEmail.replace("<WELCOME_LINK>", welcomeLink);
}

const getAdminWelcomeEmailText = (emailsSent, eventName) => {
    return TEXTS.adminWelcomeEmail
        .replace("<EMAILS_SENT>", emailsSent)
        .replace("<EVENT_NAME>", eventName);
}

const getWelcomeToken = (uid, email) => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        sub: uid,
        email,
        purpose: "welcome",
        ver: 1,
        iat: now,
        exp: now + (7 * 24 * 3600), // 7 days
    };
    return jwt.sign(payload, WELCOME_SECRET_KEY.value(), { algorithm: "HS256" });
}

const getWelcomeLoginLink = (uid, email) => {
    const welcomeToken = getWelcomeToken(uid, email);
    const domain = APP_DOMAIN.value();
    const isLocal = domain?.includes("localhost");
    return `${isLocal ? "" : "https://"}${domain}/signin/set-password?token=${welcomeToken}`;
}

const sendOnboardingEmails = async (event, db, adminEmails) => {
    const auth = getAuth();
    const mailClient = mailer.getClient(MAILTRAP_API_KEY.value());
    const senderEmail = MAILTRAP_SENDER_ADDRESS.value();
    const items = [];
    for (const participant of event.participants || []) {
        if (!participant?.email) continue;
        const domain = participant.email.split("@")[1];
        if (BLACKLISTED_EMAIL_DOMAINS.includes(domain)) continue;
        try {
            const user = await auth.getUser(participant.id);
            if (user.customClaims?.onboarded) continue;
            const createdMs = new Date(user.metadata.creationTime).getTime();
            // const graceWindowMs = 30 * 24 * 60 * 60 * 1000; // 30 days before event start
            const graceWindowMs = 3 * 24 * 60 * 60 * 1000; // 3 days before event start
            if (Number.isFinite(createdMs) && createdMs < (event.startTime - graceWindowMs)) continue;
            const welcomeLink = getWelcomeLoginLink(user.uid, user.email);
            items.push({
                uid: user.uid,
                email: participant.email,
                sendPromise: mailer.sendEmail(
                    mailClient,
                    senderEmail,
                    participant.email,
                    "Welcome to Discurso.AI",
                    getWelcomeEmailText(welcomeLink),
                    "welcome"
                )
            });
        } catch (er) {
            console.error(`Error preparing onboarding email for ${participant.email}:`, er);
        }
    }
    if (items.length === 0) {
        await db.collection("events").doc(event.id).update({ onboarded: true });
        return;
    }
    try {
        const results = await Promise.allSettled(items.map(it => it.sendPromise));
        let successCount = 0;
        const nowTs = Date.now();
        for (let i = 0; i < results.length; i++) {
            const res = results[i];
            const { uid, email } = items[i];
            if (res.status === 'fulfilled') {
                successCount++;
                try {
                    const existingClaims = (await auth.getUser(uid)).customClaims || {};
                    await auth.setCustomUserClaims(uid, { ...existingClaims, onboarded: nowTs });
                } catch (er) {
                    console.error(`Failed setting onboarded claim for ${email} (${uid})`, er);
                }
            } else {
                console.error(`Failed to send onboarding email to ${email} (${uid})`, results[i].reason);
            }
        }
        console.debug(`Sent ${successCount} out of ${items.length} onboarding emails for event ${event.title}`);
        if (successCount === items.length) {
            await db.collection("events").doc(event.id).update({ onboarded: true });
        }
        if (adminEmails?.length && successCount > 0) {
            await mailer.sendEmail(
                mailClient,
                senderEmail,
                adminEmails,
                "Onboarding emails sent",
                getAdminWelcomeEmailText(successCount, event.title),
                "admin"
            );
            console.debug(`Notified ${adminEmails.length} admin(s) of onboarding emails`);
        }
    } catch (er) {
        console.error(`Error sending onboarding emails for event ${event.title}:`, er);
    }
}

const sendRoundEmails = async (event, round, roundNo, db, adminEmails) => {
    // filter participants to only include those active in this round
    const roundIndex = roundNo - 1;
    const isParticipantInRound = (participant) => {
        const rounds = participant.rounds;
        if (rounds === null || rounds === undefined) return true; // null/undefined means all rounds
        return Array.isArray(rounds) && rounds.includes(roundIndex);
    };

    const emails = event.participants
        .filter(participant => isParticipantInRound(participant))
        .map(participant => participant.email)
        .filter(email => (email && !BLACKLISTED_EMAIL_DOMAINS.includes(email.split("@")[1])));
    console.debug(`Active round ${roundNo} of ${event.title}, emails: ${emails.length}`);
    const mailClient = mailer.getClient(MAILTRAP_API_KEY.value());
    const senderEmail = MAILTRAP_SENDER_ADDRESS.value();
    const appDomain = APP_DOMAIN.value();
    try {
        const emailsToSend = emails.map(email => (mailer.sendEmail(mailClient, senderEmail, email,
            `${event.title} - Round ${roundNo}`,
            getRoundEmailText(event.title,
                roundNo,
                `https://${appDomain}/negotiator/${event.id}`,
                `${new Date(round.endTime).toLocaleString('en-GB', {
                    timeZone: 'CET',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })} CET`))));
        let emailsResults = await Promise.allSettled(emailsToSend);
        let iGoodSends = emailsResults.filter(result => result.status === 'fulfilled').length;
        console.debug(`Sent out ${iGoodSends} out of ${emailsResults.length} emails`);
        if (iGoodSends > 0 || iGoodSends == emailsToSend.length) {
            const updatedEvent = { ...event }
            updatedEvent.rounds[roundNo - 1].notified = true;
            const eventDoc = db.collection("events").doc(event.id);
            await eventDoc.set(updatedEvent);
        }
        if (adminEmails?.length) {
            await mailer.sendEmail(
                mailClient,
                senderEmail,
                adminEmails,
                "Round start notifications sent",
                `${event.title} - round ${roundNo}, sent ${iGoodSends} out of ${emailsResults.length}`,
                "admin"
            );
            console.debug(`Notified ${adminEmails.length} admin(s) of sent emails`);
        } else {
            console.warn("No admin users found to notify.");
        }
    } catch (er) {
        console.error(er);
    }
}

const sendFeedbackSummaryEmail = async (event, summary, roundNo) => {
    const senderEmail = MAILTRAP_SENDER_ADDRESS.value();
    const appDomain = APP_DOMAIN.value();
    const emailText = getSummaryEmailText(event.title, roundNo, summary, `https://${appDomain}/instructor/events/${event.id}`);
    try {
        const instructorEmail = (await getAuth().getUser(event.instructor || event.instructorId)).email;
        if (!instructorEmail ||
            BLACKLISTED_EMAIL_DOMAINS.includes(instructorEmail.split("@")[1])) {
            console.warn(
                `Instructor email ${instructorEmail} is blacklisted or not set, skipping summary email.`,
            );
            return;
        }
        const mailClient = mailer.getClient(MAILTRAP_API_KEY.value());
        await mailer.sendEmail(mailClient, senderEmail, instructorEmail,
            `${event.title} - Round ${roundNo} Summary`,
            emailText);
        console.debug(`Sent summary email for round ${roundNo} of event ${event.title} to instructor ${instructorEmail}`);
    } catch (er) {
        console.error(`Error sending summary email for round ${roundNo} of event ${event.title}:`, er);
    }
}

const getRoundFeedbackSummary = async (event, roundIndex) => {
    const resp = await fetch(`https://${APP_DOMAIN.value()}/api/data/summary/${event}/${roundIndex}`, {
        method: "POST",
        cache: "no-cache",
        headers: {
            "api-key": FUNCTIONS_API_KEY.value()
        }
    });
    if (!resp.ok) {
        console.error(`Error fetching feedback summary for event ${event}, round ${roundIndex}:`, resp.statusText);
        return null;
    }
    const { feedbackSummary } = await resp.json();
    if (!feedbackSummary?.text) {
        console.warn(`No feedback summary text found for event ${event}, round ${roundIndex + 1}`);
        return null;
    }
    return feedbackSummary.text;
}

exports.emailsAndSummaries = onSchedule({
    schedule: "every 10 minutes",
    secrets: [MAILTRAP_API_KEY, MAILTRAP_SENDER_ADDRESS, APP_DOMAIN, FUNCTIONS_API_KEY, NEXT_PUBLIC_ENVIRON, WELCOME_SECRET_KEY],
    timeoutSeconds: 300
}, async (e) => {
    const nowTime = Date.now();
    const weekAgoTime = nowTime - 7 * 24 * 60 * 60 * 1000;
    let nowIso = new Date().toISOString();
    console.debug("-In emailsAndSummaries()", nowIso, e);

    const db = getFirestore();
    const collection = db.collection("events").where("startTime", ">", weekAgoTime).where("startTime", "<=", nowTime); // TODO add index to allow .where("draft", "==", false);
    const snapshot = await collection.get();
    const allEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }))
    const events = allEvents.filter(event => (event.draft == false));

    let adminEmails;

    for (let event of events) {
        if (event.startTime < nowTime && !event.onboarded && event.participants?.length) {
            if (!adminEmails) adminEmails = await getAdminEmails();
            await sendOnboardingEmails(event, db, adminEmails);
        }
        const aRounds = event.rounds;
        if (!aRounds?.length) continue;
        let roundNo = 0;
        let bSentEmails;
        for (let round of aRounds) {
            roundNo++;
            if (NEXT_PUBLIC_ENVIRON.value() !== "prod") {
                if (!bSentEmails && round.startTime < nowTime && round.endTime > nowTime && !round.notified) {
                    if (!adminEmails) adminEmails = await getAdminEmails();
                    await sendRoundEmails(event, round, roundNo, db, adminEmails);
                    bSentEmails = true;
                }
            }
            if (round.startTime < nowTime && round.endTime < nowTime && round.aiRound && !round.feedbackSumm) {
                const sFeedbackSumm = await getRoundFeedbackSummary(event.id, roundNo - 1);
                if (sFeedbackSumm) await sendFeedbackSummaryEmail(event, sFeedbackSumm, roundNo);
            }
        }
    }
})