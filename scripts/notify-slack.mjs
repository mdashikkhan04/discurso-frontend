import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const SLACK_TOKEN = process.env.HOURS_SLACK_TOKEN;
const DEV_USER_IDS = ["U0854ET7022"];
const USER_IDS = ["U085B2SS9DY", "U0854ET7022"];
const environment = process.env.NEXT_PUBLIC_ENVIRON?.toUpperCase() || "";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const timestampFile = path.join(__dirname, "../public/build-timestamp.json");

let buildTime = Date.now();
try {
    const raw = fs.readFileSync(timestampFile, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.buildTime) buildTime = parsed.buildTime;
} catch (err) {
    console.error("Failed to read build timestamp, using current time:", err.message);
}

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    dateStyle: "medium",
    timeStyle: "short"
});

const text = `🚀 *Deployment Completed*
Rollout in ${environment} at ${timeFormatter.format(new Date(buildTime))}`;

async function sendToUser(userId) {
    const dmRes = await fetch("https://slack.com/api/conversations.open", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SLACK_TOKEN}`
        },
        body: JSON.stringify({ users: userId })
    });
    const dmData = await dmRes.json();
    if (!dmData.ok) {
        console.error(`Failed to open DM with ${userId}:`, dmData.error);
        return;
    }
    const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SLACK_TOKEN}`
        },
        body: JSON.stringify({
            channel: dmData.channel.id,
            text
        })
    });
    const result = await res.json();
    if (!result.ok) console.error(`Failed to notify ${userId}:`, result.error);
}

(async () => {
    if (!SLACK_TOKEN) {
        console.error("SLACK_TOKEN is not set. Skipping Slack.");
        return;
    }
    if (!environment) {
        console.error("NEXT_PUBLIC_ENVIRON is not set. Skipping Slack.");
        return;
    }
    const aUserIds = environment === "DEV" ? DEV_USER_IDS : USER_IDS;
    console.log("Sending Slack messages to users:", aUserIds.join(", "), "for env:", environment);
    for (const userId of aUserIds) {
        await sendToUser(userId);
    }
})();
