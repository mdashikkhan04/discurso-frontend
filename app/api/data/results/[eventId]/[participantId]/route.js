import "server-only";

import { saveResult, getResult } from "@/lib/server/data/results";
import { getEvent } from "@/lib/server/data/events";
import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";
import { generateSurvey, generateFeedback } from "@/actions/feedbacks";

export async function GET(req, { params }) {
    try {
        const { isAllowed } = await isAccessAllowed(req, ["negotiator"]);
        if (!isAllowed) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { eventId, participantId, round } = await params;
        const data = await getResult(eventId, participantId, round);
        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error("Error fetching data:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(req, { params }) {
    try {
        const { isAllowed } = await isAccessAllowed(req, ["negotiator"]);
        if (!isAllowed) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { eventId, participantId } = await params;
        const { data } = await req.json();
        // console.log("/api/data/results/id/id data", data);

        if ((data.agreement && data.madeDeal && data.final && data.fromAI) || data.overridden) {
            const toSaveForAI = { ...data, comment: "", byAI: true, survey: (await generateSurvey(data.negId, "o4-mini", false, data.aiSide)).survey.scores };
            // console.log("AI RES", toSaveForAI, data.aiTeamId);
            await saveResult(toSaveForAI, eventId, null, null, data.aiTeamId, data.overridden);
            
            if (data.makeFeedback) await generateFeedback(data.negId, "o4-mini", false, data.aiSide);
        }
        // return NextResponse.json({ data: "heheh" }, { status: 500 });
        const newResultsId = await saveResult(data, eventId, participantId, null, null, data.overridden);
        return NextResponse.json({ data: newResultsId }, { status: 200 });
    } catch (error) {
        console.error("Error saveing event round results:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}