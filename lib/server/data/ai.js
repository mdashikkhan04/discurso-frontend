import { saveDoc, getDocs, deleteDoc } from "@/lib/server/data/data";
import { getTranscriptMessages } from "@/lib/server/data/transcripts";

export async function saveMessage(message, isPractice) {
    try {
        await saveDoc(message, isPractice ? "practice" : "messages");
    } catch (error) {
        console.error("Error saving message:", error);
        throw error;
    }
}

export async function saveFeedback(feedback) {
    try {
        const savedId = await saveDoc(feedback, "feedback");
        return savedId
    } catch (error) {
        console.error("Error saving feedback:", error);
        throw error;
    }
}

export async function saveSurvey(survey) {
    try {
        const savedId = await saveDoc(survey, "survey");
        return savedId
    } catch (error) {
        console.error("Error saving survey:", error);
        throw error;
    }
}

export async function getNegIds() {
    const practices = await getDocs(
        "practice",
        null,
        ["practiceId", "negId", "time"],
        null
    );
    const negots = (await getDocs("messages", null, ["negId", "time"], null)).map(
        (negot) => ({ ...negot, real: true })
    );
    const idMap = new Map();
    [...practices, ...negots].forEach((msg) => {
        const { practiceId, negId, time, real } = msg;
        const id = negId || practiceId;
        if (!id) return;
        if (!idMap.has(id)) {
            idMap.set(id, { id, time, count: 1, real });
        } else {
            const existing = idMap.get(id);
            existing.count += 1;
            if (time > existing.time) {
                existing.time = time;
            }
        }
    });
    const result = Array.from(idMap.values());
    result.sort((a, b) => b.time - a.time);
    return result;
}

export async function getMessages(negId) {
    if (!negId) return [];
    const [practiceIdMessages, negotiationIdMessages, realNegotMessages] =
        await Promise.all([
            getDocs("practice", [{ field: "practiceId", value: negId }]),
            getDocs("practice", [{ field: "negId", value: negId }]),
            getDocs("messages", [{ field: "negId", value: negId }]),
        ]);
    const messageMap = new Map();
    [
        ...practiceIdMessages,
        ...negotiationIdMessages,
        ...realNegotMessages,
    ].forEach((msg) => {
        if (msg.decent && !messageMap.has(msg.id)) {
            const { timestamp, ...message } = msg;
            messageMap.set(msg.id, message);
        }
    });
    return Array.from(messageMap.values());
}

export async function getPeerMessages(negId, eventId = undefined, round = undefined) {
    const filter = Array.isArray(negId) ? [{ field: "negId", in: true, value: negId }] : [{ field: "negId", value: negId }];
    const messages = await getDocs("p2pMessages", filter);
    const p2p = messages.sort((a, b) => a.time - b.time).map(msg => ({ userId: msg.userId, content: msg.content, timestamp: msg.time }));

    // optionally merge in transcript messages grouped to this negotiation (by negId or by event/round)
    let transcripts = [];
    try {
        if (Array.isArray(negId) && negId.length) {
            const results = await Promise.all(
                negId.filter(Boolean).map(id => getTranscriptMessages({ negId: id }))
            );
            transcripts = results.flat();
        } else if (typeof negId === "string" && negId) {
            transcripts = await getTranscriptMessages({ negId });
        } else if (eventId && (typeof round === "number" || typeof round === "string")) {
            const numericRound = typeof round === "string" ? parseInt(round, 10) : round;
            if (eventId && Number.isFinite(numericRound)) {
                transcripts = await getTranscriptMessages({ eventId, round: numericRound });
            }
        }
    } catch (e) {
        console.error("Failed to fetch transcript messages", e);
    }

    const combined = [...p2p, ...transcripts];
    combined.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    return combined;
}

export async function getP2PNegIds() {
    const allP2PMessages = await getDocs("p2pMessages", null, ["negId", "time", "userId"], null);
    const p2pNegIdMap = new Map();
    for (const message of allP2PMessages) {
        if (message.negId && message.userId) {
            const messageTime = message.time?.toMillis ? message.time.toMillis() :
                message.time?.getTime ? message.time.getTime() :
                    Number(message.time || 0);

            if (p2pNegIdMap.has(message.negId)) {
                const existing = p2pNegIdMap.get(message.negId);
                existing.count += 1;
                existing.userIds.add(message.userId);
                if (messageTime > existing.time) {
                    existing.time = messageTime;
                }
            } else {
                p2pNegIdMap.set(message.negId, {
                    id: message.negId,
                    time: messageTime,
                    count: 1,
                    userIds: new Set([message.userId]),
                    real: true
                });
            }
        }
    }
    const events = await getDocs("events", null, ["id", "rounds", "matches", "teams", "participants"], null);
    const pairedNegotiations = new Map();
    for (const event of events) {
        if (!event.rounds || !event.participants) continue;
        const userToTeamMap = {};
        event.participants.forEach(participant => {
            if (participant.id && participant.team) {
                userToTeamMap[participant.id] = participant.team;
            }
        });
        for (let roundIndex = 0; roundIndex < event.rounds.length; roundIndex++) {
            const round = event.rounds[roundIndex];
            const matches = event.matches?.[roundIndex]?.matches || round.matches;
            if (!matches?.length) continue;
            const caseId = round.case?.id || round.caseId;
            if (!caseId) continue;
            for (const match of matches) {
                if (!match.a || !match.b || match.a.startsWith('AI-') || match.b.startsWith('AI-')) continue;
                const negIdA = await getStringHash(`${event.id}-${match.a}-${roundIndex + 1}`);
                const negIdB = await getStringHash(`${event.id}-${match.b}-${roundIndex + 1}`);
                const messagesA = p2pNegIdMap.get(negIdA);
                const messagesB = p2pNegIdMap.get(negIdB);
                if (messagesA || messagesB) {
                    let validPairing = true;
                    if (messagesA) {
                        const teamAUserIds = Array.from(messagesA.userIds);
                        validPairing = teamAUserIds.some(userId => userToTeamMap[userId] === match.a);
                    }
                    if (messagesB && validPairing) {
                        const teamBUserIds = Array.from(messagesB.userIds);
                        validPairing = teamBUserIds.some(userId => userToTeamMap[userId] === match.b);
                    }
                    if (validPairing) {
                        const pairKey = [negIdA, negIdB].sort().join('-');
                        const timeA = messagesA ? messagesA.time : 0;
                        const timeB = messagesB ? messagesB.time : 0;
                        const latestTime = Math.max(timeA, timeB);
                        const countA = messagesA ? messagesA.count : 0;
                        const countB = messagesB ? messagesB.count : 0;
                        const totalCount = countA + countB;
                        const allUserIds = new Set();
                        if (messagesA) messagesA.userIds.forEach(id => allUserIds.add(id));
                        if (messagesB) messagesB.userIds.forEach(id => allUserIds.add(id));

                        if (!pairedNegotiations.has(pairKey) || pairedNegotiations.get(pairKey).time < latestTime) {
                            pairedNegotiations.set(pairKey, {
                                id: pairKey,
                                negIds: [negIdA, negIdB],
                                caseId: caseId,
                                time: latestTime,
                                count: totalCount,
                                real: true,
                                eventId: event.id,
                                round: roundIndex + 1,
                                teamA: match.a,
                                teamB: match.b,
                                userIds: Array.from(allUserIds)
                            });
                        }
                    }
                }
            }
        }
    }

    const transcriptRows = await getDocs("transcripts", null, ["negId", "time", "speaker", "eventId", "round", "caseId", "sides"], null);
    const transcriptMap = new Map();
    for (const row of transcriptRows) {
        const id = row.negId;
        if (!id) continue;
        const t = row.time?.toMillis ? row.time.toMillis() : (row.time?.getTime ? row.time.getTime() : Number(row.time || 0));
        if (!transcriptMap.has(id)) {
            transcriptMap.set(id, {
                id,
                negIds: [id],
                time: t || 0,
                count: 1,
                real: true,
                eventId: row.eventId,
                round: row.round,
                caseId: row.caseId,
                userIds: new Set(row.speaker ? [row.speaker] : []),
                sidesA: new Set(Array.isArray(row?.sides?.a) ? row.sides.a : []),
                sidesB: new Set(Array.isArray(row?.sides?.b) ? row.sides.b : []),
            });
        } else {
            const acc = transcriptMap.get(id);
            acc.count += 1;
            if (t > acc.time) acc.time = t;
            if (row.speaker) acc.userIds.add(row.speaker);
            if (!acc.eventId && row.eventId) acc.eventId = row.eventId;
            if (!acc.round && row.round) acc.round = row.round;
            if (!acc.caseId && row.caseId) acc.caseId = row.caseId;
            if (Array.isArray(row?.sides?.a)) row.sides.a.forEach(u => acc.sidesA.add(u));
            if (Array.isArray(row?.sides?.b)) row.sides.b.forEach(u => acc.sidesB.add(u));
        }
    }
    const transcriptNegotiations = Array.from(transcriptMap.values()).map(v => ({
        id: v.id,
        negIds: v.negIds,
        time: v.time,
        count: v.count,
        real: v.real,
        eventId: v.eventId,
        round: v.round,
        caseId: v.caseId,
        userIds: Array.from(v.userIds),
        sides: { a: Array.from(v.sidesA), b: Array.from(v.sidesB) },
        isTranscript: true,
    }));

    const result = [...pairedNegotiations.values(), ...transcriptNegotiations];
    result.sort((a, b) => b.time - a.time);
    return result;
}

export async function getFeedbacks(negId, realOnly) {
    let practiceIdFeedbacks = [];
    if (!realOnly)
        practiceIdFeedbacks = await getDocs("feedback", [
            { field: "practiceId", value: negId },
        ]);
    const filter = Array.isArray(negId) ? [{ field: "negId", in: true, value: negId }] : [{ field: "negId", value: negId }];
    const negotiationIdFeedbacks = await getDocs("feedback", filter);
    const feedbackMap = new Map();
    [...practiceIdFeedbacks, ...negotiationIdFeedbacks].forEach((feedback) => {
        if (!feedbackMap.has(feedback.id)) {
            const { timestamp, ...rest } = feedback;
            feedbackMap.set(feedback.id, rest);
        }
    });
    return Array.from(feedbackMap.values()).sort((a, b) => a.time - b.time);
}

export async function getFeedbacksByCaseId(caseId) {
    const feedbacks = await getDocs("feedback", [
        { field: "caseId", value: caseId },
    ]);
    return feedbacks.map((feedback) => {
        const { timestamp, ...rest } = feedback;
        return rest;
    });
}

export async function getSurveys(negId) {
    const surveys = await getDocs("survey", [{ field: "negId", value: negId }]);
    const surveyMap = new Map();
    surveys.forEach((survey) => {
        if (!surveyMap.has(survey.id)) {
            const { timestamp, ...rest } = survey;
            surveyMap.set(survey.id, rest);
        }
    });
    return Array.from(surveyMap.values()).sort((a, b) => a.time - b.time);
}

export async function deleteFeedback(feedbackId) {
    try {
        await deleteDoc(feedbackId, "feedback");
        return true;
    } catch (error) {
        console.error("Error deleting feedback:", error);
        throw new Error("Failed to delete feedback");
    }
}

export async function deleteSurvey(surveyId) {
    try {
        await deleteDoc(surveyId, "survey");
        return true;
    } catch (error) {
        console.error("Error deleting feedback:", error);
        throw new Error("Failed to delete feedback");
    }
}

export async function getNegId(eventId, teamId, roundNo) {
    const negId = await getStringHash(`${eventId}-${teamId}-${roundNo}`);
    return negId;
}

async function getStringHash(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return hashHex;
}

export function getSurveyLabels() {
    return {
        "satisfaction": "How satisfied are you with your own outcome—i.e., the extent to which the terms of your agreement (or lack of agreement) benefit you?",
        "balance": "How satisfied are you with the balance between your own outcome and your counterpart's outcome?",
        "forfeited": "Did you feel like you forfeited or \"lost\" in this negotiation?",
        "legitimacy": "Do you think the terms of your agreement are consistent with principles of legitimacy or objective criteria (e.g., common standards of fairness, precedent, industry practice, legality, etc.)?",
        "loseFace": "Did you \"lose face\" (i.e., damage your sense of pride) in the negotiation?",
        "competence": "Did this negotiation make you feel more or less competent as a negotiator?",
        "principles": "Did you behave according to your own principles and values?",
        "selfImage": "Did this negotiation positively or negatively impact your self-image or your impression of yourself?",
        "listened": "Do you feel your counterpart listened to your concerns?",
        "fairness": "Would you characterize the negotiation process as fair?",
        "ease": "How satisfied are you with the ease (or difficulty) of reaching an agreement?",
        "considered": "Did your counterpart consider your wishes, opinions, or needs?",
        "impression": "What kind of \"overall\" impression did your counterpart make on you?",
        "relationshipSatisfaction": "How satisfied are you with your relationship with your counterpart as a result of this negotiation?",
        "trust": "Did the negotiation make you trust your counterpart?",
        "futureRelationship": "Did the negotiation build a good foundation for a future relationship with your counterpart?"
    };
}

export function getFeedbackLabels() {
    return {
        "expressionQuality": "Quality of Expression",
        "activeParticipation": "Active Listening and Questioning",
        "managingEmotions": "Managing Emotions",
        "understandingValues": "Understanding Interests and Options",
        "stageSetting": "Stage Setting",
        "makingFirstOffer": "Making the First Offer",
        "managingConcessions": "Managing Concessions",
        "searchingTradeOffs": "Searching for Trade-Offs",
        "generatingOptions": "Generating Creative Options",
        "objectiveCriteria": "Using Objective Criteria",
        "postSettlement": "Post-Settlement Settlement",
        "strategicAdapt": "Strategic Adaptability",
        "trustAndRelation": "Trust and Relationship Building",
        "empathy": "Empathy",
        "ethics": "Ethics"
    };
}

export async function savePracticeResult(result) {
  try {
    const savedId = await saveDoc(result, "practiceResults");
    return savedId;
  } catch (error) {
    console.error("Error saving practice result:", error);
    throw error;
  }
}
