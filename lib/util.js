import crypto from "crypto";

export function print(...args) {
    if (process.env.NEXT_PUBLIC_ENVIRON === "local") console.log(...args);
}

export function getMinName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .map((word, index) =>
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join('')
        .slice(0, 20) || 'user';
}

export function makeTempPassword() {
    const tempPassword = `Tmp!${Math.random().toString(36).slice(2)}${Date.now()}`.slice(0, 20);
    return tempPassword;
}

export function makeHash(input) {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
}

export function getNiceNum(num, decimals = 4) {
    if (num == null || isNaN(num)) return null;

    const factor = Math.pow(10, decimals);
    return (Math.round((num + Number.EPSILON) * factor) / factor);
}

export function getTimeLeft(endTime) {
    const currentTime = Date.now();
    if (endTime > currentTime) {

        const diff = endTime - currentTime;
        const units = [
            { unit: "days", threshold: 24 * 60 * 60 * 1000 },
            { unit: "hours", threshold: 60 * 60 * 1000 },
            { unit: "minutes", threshold: 60 * 1000 },
            { unit: "seconds", threshold: 1000 },
        ];

        for (let { unit, threshold } of units) {
            const value = Math.floor(diff / threshold);
            if (value > 0) {
                return { value, unit, diff };
            }
        }
    }

    return { value: 0, unit: "seconds", diff: 0 };
}

export function makeP2PNegId(eventId, round, teamA, teamB) {
    return makeNegId(`p2p-${eventId}-${round}-${teamA}-${teamB}`);
}

export function makeAiNegId(userId, caseId) {
    return makeNegId(`ai-${userId}-${caseId}-${Date.now().toString()}`);
}

function makeNegId(sourceText) {
    const negId = makeHash(sourceText);
    return negId;
}