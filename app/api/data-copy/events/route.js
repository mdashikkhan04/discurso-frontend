import "server-only";

import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";
import { getDocs, saveDocs } from "@/lib/server/data/data";

const status = { going: false, totalDocs: 0, doneDocs: 0 };

export async function GET(req) {
    const { isAllowed } = await isAccessAllowed(req, ["admin"]);
    if (!isAllowed) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ status }, { status: 200 });
}

export async function POST(req) {
    try {
        const { isAllowed } = await isAccessAllowed(req, ["admin"]);
        const { key } = await req.json();
        const bOnlyRead = process.env.NEXT_PUBLIC_ENVIRON.toLowerCase().includes("prod") || req.url.toLowerCase().includes("?read=yes");
        if (key !== process.env.DATA_COPY_KEY && !isAllowed) {
            return NextResponse.json({ error: "Forbidden" }, { status: 401 });
        }

        let events, results, cases, feedbacks;

        if (bOnlyRead) {
            events = await getDocs("events");
            results = await getDocs("results");
            cases = await getDocs("cases");
            feedbacks = await getDocs("feedback");
            return NextResponse.json({ events, results, cases, feedbacks }, { status: 200 });
        } else {
            const response = await fetch("https://discurso.ai/api/data-copy/events?read=yes", { method: "POST", body: JSON.stringify({ key: process.env.DATA_COPY_KEY }) })
            if (!response.ok) throw new Error("Failed data fetch");
            const data = await response.json();
            events = data.events;
            results = data.results;
            cases = data.cases;
            feedbacks = data.feedbacks;
            status.totalDocs = events.length + results.length + cases.length + feedbacks?.length || 0;
        }

        status.going = true;

        if (cases?.length) {
            const casesChunks = getChunkedArr(cases);
            for (let chunk of casesChunks) {
                await saveDocs(chunk, "cases");
                status.doneDocs += chunk.length;
            }
        }

        if (results?.length) {
            const resultsChunks = getChunkedArr(results);
            for (let chunk of resultsChunks) {
                await saveDocs(chunk, "results");
                status.doneDocs += chunk.length;
            }
        }

        if (feedbacks?.length) {
            const feedbacksChunks = getChunkedArr(feedbacks);
            for (let chunk of feedbacksChunks) {
                await saveDocs(chunk, "feedback");
                status.doneDocs += chunk.length;
            }
        }

        if (events?.length) {
            for (let event of events) {
                for (let user of event.participants) {
                    user.email = "";
                }
            }
            const eventsChunks = getChunkedArr(events);
            for (let chunk of eventsChunks) {
                await saveDocs(chunk, "events");
                status.doneDocs += chunk.length;
            }
        }

        status.going = false;

        const oTempStatus = { ...status };
        status.totalDocs = 0;
        status.doneDocs = 0;

        return NextResponse.json({ status: oTempStatus }, { status: 201 });
    } catch (error) {
        console.error("Error copying data:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }

}

function getChunkedArr(orgArr, size = 500) {
    const chunks = [];
    for (let i = 0; i < orgArr.length; i += size) {
        chunks.push(orgArr.slice(i, i + size));
    }
    return chunks;
}