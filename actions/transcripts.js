'use server';

import { verifyAccess } from "@/lib/server/auth";
import { saveTranscriptMessages, getTranscriptMessages } from "@/lib/server/data/transcripts";
import { getEvent } from "@/lib/server/data/events";

export async function hasTranscript({ eventId, round, negId }) {
    const access = await verifyAccess(null, undefined, true);
    if (!access?.uid) throw new Error("Unauthorized");

    const numericRound = typeof round === "string" ? parseInt(round, 10) : round;
    if (!eventId || !Number.isFinite(numericRound)) return false;

    const filter = negId ? { negId } : { eventId, round: numericRound };
    const rows = await getTranscriptMessages(filter);
    return Array.isArray(rows) && rows.length > 0;
}

export async function saveTranscript({ messages, eventId, round, negId, sides, source }) {
    const access = await verifyAccess(null, undefined, true);
    if (!access?.uid) throw new Error("Unauthorized");

    if (!Array.isArray(messages) || messages.length === 0) throw new Error("No messages to save");
    if (!eventId) throw new Error("eventId is required");
    if (!negId) throw new Error("negId is required");

    const numericRound = typeof round === "string" ? parseInt(round, 10) : round;
    if (!Number.isFinite(numericRound)) throw new Error("round is required");

    const alreadyExists = await hasTranscript({ eventId, round: numericRound, negId });
    if (alreadyExists) {
        throw new Error("Transcript for this match already exists");
    }

    let caseId = null;
    try {
        const event = await getEvent(eventId);
        const idx = Number(numericRound) - 1;
        const roundObj = event?.rounds?.[idx];
        caseId = roundObj?.case?.id || roundObj?.caseId || null;
    } catch (_) {
        caseId = null;
    }

    await saveTranscriptMessages({
        messages,
        eventId,
        round: numericRound,
        negId,
        caseId,
        sides: sides || { a: [], b: [] },
        uploadedBy: access.uid,
        source: source || null,
        uploadedAt: Date.now(),
    });

    return true;
}