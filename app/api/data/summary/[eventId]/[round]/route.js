import "server-only";

import { saveEvent } from "@/actions/events";
import { makeFeedbackSummaryText } from "@/lib/server/ai";
import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";
import { getUserIdByToken } from "@/lib/server/auth";
import { getFeedbacksData } from "@/actions/feedbacks";

async function generateFeedbackSummary(theEvent, roundIndex, userId) {
    const { feedbackData, event } = await getFeedbacksData(theEvent, roundIndex);
    if (!feedbackData) {
        return NextResponse.json(
            { error: "Feedback data not found" },
            { status: 404 }
        );
    }
    const summaryText = await makeFeedbackSummaryText(feedbackData.feedbacks, userId);
    const feedbackSummary = { text: summaryText.text, cost: summaryText.cost, unixTime: Date.now() };
    const updatedEvent = {
        ...event,
        rounds: event.rounds.map((round, index) => {
            if (index === roundIndex) {
                return { ...round, feedbackSumm: feedbackSummary };
            }
            return round;
        })
    };
    await saveEvent(updatedEvent, true);
    return { feedbackSummary, event };
}

export async function POST(req, { params }) {
    const token = req.cookies?.get("session")?.value || null;
    let userId = "system";
    const apiKey = req.headers.get("api-key");
    if (apiKey) {
        if (apiKey !== process.env.FUNCTIONS_API_KEY) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
    } else if (token) {
        const { isAllowed } = await isAccessAllowed(req, ["negotiator"]);
        if (!isAllowed) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        userId = await getUserIdByToken(token);
    }

    try {
        const { eventId, round } = await params;
        const roundIndex = parseInt(round, 10);
        let bAllRound;
        try {
            const { allRounds } = await req.json();
            bAllRound = allRounds;
        } catch (er) {
            console.warn("Missing body in POST request, assuming single round");
        }
        if (bAllRound) {
            const allFeedbackSumms = [];
            const { event: oEvent, feedbackSummary } = await generateFeedbackSummary(eventId, 0, userId);
            allFeedbackSumms.push(feedbackSummary);
            if (oEvent.rounds.length > 1) {
                for (let roundI = 1; roundI < oEvent.rounds.length; roundI++) {
                    const { feedbackSummary } = await generateFeedbackSummary(eventId, roundI, userId);
                    allFeedbackSumms.push(feedbackSummary);
                }
            }
            return NextResponse.json({ allFeedbackSumms }, { status: 200 });
        } else {
            const { feedbackSummary } = await generateFeedbackSummary(eventId, roundIndex, userId);
            return NextResponse.json({ feedbackSummary }, { status: 200 });
        }
    } catch (error) {
        console.error("Error in POST request:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET(req, { params }) {
    const apiKey = req.headers.get("api-key");
    if (apiKey !== process.env.FUNCTIONS_API_KEY) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }
    try {
        const { eventId, round } = await params;
        const roundIndex = parseInt(round, 10);
        const { feedbackData } = await getFeedbacksData(eventId, roundIndex);
        return NextResponse.json(feedbackData, { status: 200 });
    } catch (error) {
        console.error("Error getting summary data:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}