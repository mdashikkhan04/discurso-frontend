"use server";

import { getNegIds, getMessages, getFeedbacks, getSurveys, deleteFeedback as deleteDbFeedback, deleteSurvey as deleteDbSurvey, getFeedbacksByCaseId, getFeedbackLabels, getSurveyLabels, getNegId, getPeerMessages, getP2PNegIds } from "@/lib/server/data/ai";
import { makeFeedback, makeSurvey } from "@/lib/server/ai";
import { makeP2PFeedbacks } from "@/actions/ai";
import { getCase } from "@/lib/server/data/cases";
import { getEvent } from "@/actions/events";

export async function fetchNegIds() {
    try {
        const [aiNegIds, p2pNegIds] = await Promise.all([
            getNegIds(),
            getP2PNegIds()
        ]);
        return {
            success: true,
            data: {
                ai: aiNegIds,
                p2p: p2pNegIds
            }
        };
    } catch (error) {
        console.error("Error fetching practice IDs:", error);
        return { success: false, error: error.message };
    }
}

export async function fetchPracticeMessages(negId) {
    try {
        const allMessages = await getMessages(negId);
        const oCase = await getCase(allMessages[0].caseId);
        const practiceMessages = allMessages.sort((a, b) => a.time - b.time);
        return { success: true, data: practiceMessages, case: oCase.title, type: 'ai' };
    } catch (error) {
        console.error("Error fetching practice messages:", error);
        return { success: false, error: error.message };
    }
}

export async function fetchPeerMessages(negId, caseId, eventId, round) {
    try {
        const peerMessages = await getPeerMessages(negId, eventId, round);
        if (!peerMessages?.length) {
            return { success: false, error: "No P2P messages found for this negId" };
        }
        let oCase = null;
        if (caseId) await getCase(caseId);
        const serializedMessages = peerMessages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp?.toMillis ? msg.timestamp.toMillis() : msg.timestamp
        }));

        const sides = peerMessages?.[0]?.sides

        return { success: true, data: serializedMessages, case: (oCase?.title || "P2P Negotiation"), type: 'p2p', sides };
    } catch (error) {
        console.error("Error fetching peer messages:", error);
        return { success: false, error: error.message };
    }
}

export async function fetchFeedbacks(negId) {
    try {
        const feedbacks = await getFeedbacks(negId);
        return { success: true, data: feedbacks, labels: getFeedbackLabels() };
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return { success: false, error: error.message };
    }
}

export async function fetchSurveys(negId) {
    try {
        const surveys = await getSurveys(negId);
        return { success: true, data: surveys, labels: getSurveyLabels() };
    } catch (error) {
        console.error("Error fetching surveys:", error);
        return { success: false, error: error.message };
    }
}

export async function generateFeedback(negId, model, isPractice, aiSide) {
    try {
        const allMessages = await getMessages(negId);
        const messages = allMessages.sort((a, b) => a.time - b.time);
        if (!messages?.length) return { success: false, error: "No messages found for this practice ID." };
        const oCase = await getCase(messages[0].caseId);
        let feedback = await makeFeedback(negId, allMessages, oCase, "admin-experimental", aiSide ?? oCase.ai, model, isPractice);
        return { success: true, feedback };
    } catch (error) {
        console.error("Error generating feedback:", error);
        return { success: false, error: error.message };
    }
}

export async function generateSurvey(negId, model, isPractice, aiSide) {
    try {
        const allMessages = await getMessages(negId);
        const messages = allMessages.sort((a, b) => a.time - b.time);
        if (!messages?.length) return { success: false, error: "No messages found for this practice ID." };
        const oCase = await getCase(messages[0].caseId);
        let survey = await makeSurvey(negId, allMessages, oCase, "admin-experimental", aiSide ?? oCase.ai, model, isPractice);
        return { success: true, survey };
    } catch (error) {
        console.error("Error generating feedback:", error);
        return { success: false, error: error.message };
    }
}

export async function generateP2PFeedback({ eventId, round, negId, model, messages, sides }) {
    try {
        const validSides = (sides && Array.isArray(sides.a) && Array.isArray(sides.b)) ? sides : null;
        let resolvedSides = validSides;

        if (!resolvedSides) {
            resolvedSides = messages?.[0]?.sides
        }

        const feedbackMap = await makeP2PFeedbacks({
            eventId,
            round,
            negId,
            llmModel: model,
            messages,
            sides: resolvedSides,
        });
        return { success: true, feedbackMap };
    } catch (error) {
        console.error("Error generating P2P feedback:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteFeedback(feedbackId) {
    try {
        await deleteDbFeedback(feedbackId);
        return { success: true };
    } catch (error) {
        console.error("Error deleting feedback:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteSurvey(surveyId) {
    try {
        await deleteDbSurvey(surveyId);
        return { success: true };
    } catch (error) {
        console.error("Error deleting survey:", error);
        return { success: false, error: error.message };
    }
}

export async function getFeedbacksData(event, roundIndex) {
    if (typeof event === "string") event = await getEvent(event);
    if (!event) throw new Error("Event not found");
    const oRound = event.rounds?.[roundIndex];
    if (!oRound) throw new Error(`Missing round data [${roundIndex}] in event ${event.id}`);
    const caseId = oRound.case?.id || oRound.caseId;
    const teamIds = [
        ...(event.matches?.[roundIndex]?.matches || oRound.matches)?.map(match => match.a).filter(Boolean),
        ...(event.matches?.[roundIndex]?.matches || oRound.matches)?.map(match => match.b).filter(Boolean),
    ].filter(teamId => !teamId.startsWith("AI-"));
    const negIdPairs = await Promise.all(
        teamIds.map(async teamId => {
            const negId = await getNegId(
                event.id,
                teamId,
                (roundIndex + 1).toString()
            );
            return [negId, teamId];
        })
    );
    const negIDsToTeamIDs = Object.fromEntries(negIdPairs);
    const negIDs = Object.keys(negIDsToTeamIDs);
    const feedbacks = await getFeedbacksByCaseId(caseId);
    if (!feedbacks?.length) throw new Error("Missing feedback data for this event");
    const thisEventFeedbacks = feedbacks
        .filter(fb => negIDs.includes(fb.negId))
        .map(fb => ({ negId: fb.negId, scores: fb.scores }));
    const otherEventFeedbacks = feedbacks
        .filter(fb => !negIDs.includes(fb.negId))
        .map(fb => ({ negId: fb.negId, scores: fb.scores }));

    const feedbackData = {
        feedbacks: enrichFeedbackData(thisEventFeedbacks, negIDsToTeamIDs, event),
        otherFeedbacks: enrichFeedbackData(otherEventFeedbacks, negIDsToTeamIDs),
    };
    return { feedbackData, event };
}

function enrichFeedbackData(feedbacks, negIds, event) {
    if (!feedbacks?.length) {
        return null;
    }
    const categories = Object.keys(feedbacks[0].scores);

    const totalScore = scores =>
        Object.values(scores).reduce((sum, v) => sum + v, 0);

    const sums = {};
    const distribution = {};
    const distributionUsers = {};
    categories.forEach(cat => {
        sums[cat] = 0;
        distribution[cat] = {};
        distributionUsers[cat] = {};
    });

    feedbacks.forEach(fb => {
        const userName = event ? getUsernameByTeamId(negIds[fb.negId], event) : negIds[fb.negId] || `Team ${fb.negId}`;
        categories.forEach(cat => {
            const v = fb.scores[cat] ?? 0;
            sums[cat] += v;
            distribution[cat][v] = (distribution[cat][v] || 0) + 1;

            if (!distributionUsers[cat][v]) {
                distributionUsers[cat][v] = [];
            }
            distributionUsers[cat][v].push(userName || `Team ${negIds[fb.negId] || fb.negId}`);
        });
    });

    const average = {};
    categories.forEach(cat => {
        const avg = sums[cat] / feedbacks.length;
        average[cat] = Number(avg.toFixed(1));
    });

    const sortedFeedbacks = feedbacks.sort((a, b) =>
        totalScore(b.scores) - totalScore(a.scores)
    );

    let numToInclude;
    if (feedbacks.length >= 6) {
        numToInclude = 3;
    } else if (feedbacks.length >= 4) {
        numToInclude = 2;
    } else {
        numToInclude = 1;
    }

    const best = sortedFeedbacks
        .slice(0, numToInclude)
        .map((fb, index) => ({
            team: getUsernameByTeamId(negIds[fb.negId], event),
            rank: index + 1
        }));

    const worstFeedbacks = sortedFeedbacks.slice(-numToInclude);
    const worst = worstFeedbacks.map((fb, index) => ({
        team: getUsernameByTeamId(negIds[fb.negId], event),
        rank: sortedFeedbacks.length - numToInclude + index + 1
    }));

    const byTeam = sortedFeedbacks.map((fb, index) => ({
        team: getUsernameByTeamId(negIds[fb.negId], event),
        teamId: negIds[fb.negId] || fb.negId,
        rank: index + 1,
        scores: fb.scores,
    }));

    return { best, worst, average, distribution, distributionUsers, byTeam, categories };
};

function getUsernameByTeamId(teamId, event) {
    const team = event?.teams?.[teamId];
    if (!team) return teamId;
    const participant = event.participants.find(user => user.team === teamId);
    return participant ? participant.name : teamId;
}