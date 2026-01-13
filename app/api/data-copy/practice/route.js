import "server-only";

import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";
import { saveDocs } from "@/lib/server/data/data";
import { getLatestMessageTime, getMessageSince } from "@/lib/server/data/practice";

const status = {
    going: false,
    totalDocs: 0,
    doneDocs: 0,
    lastProcessedTime: null,
    isComplete: false
};

const PAGE_SIZE = 500;

export async function GET(req) {
    const { isAllowed } = await isAccessAllowed(req, ["admin"]);
    if (!isAllowed) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ status }, { status: 200 });
}

export async function POST(req) {
    if (!process.env.NEXT_PUBLIC_ENVIRON.toLowerCase().includes("prod")) {
        return NextResponse.json(
            { message: "Teapot empty" },
            { status: 418 }
        );
    }
    try {
        const { isAllowed } = await isAccessAllowed(req, ["admin"]);
        const { key } = await req.json();
        const oUrl = new URL(req.url, `http://${req.headers.get("host")}`);
        const bOnlyRead = process.env.NEXT_PUBLIC_ENVIRON.toLowerCase().includes("prod") || oUrl.searchParams.get("read") === "yes";

        if (key !== process.env.DATA_COPY_KEY && !isAllowed) {
            return NextResponse.json({ error: "Forbidden" }, { status: 401 });
        }

        if (bOnlyRead) {
            const practTimeSince = Number(oUrl.searchParams.get("practTime")) || 0;
            const msgTimeSince = Number(oUrl.searchParams.get("msgTime")) || 0;
            const page = Number(oUrl.searchParams.get("page")) || 1;
            const lastPractTime = Number(oUrl.searchParams.get("lastPractTime")) || null;
            const lastMsgTime = Number(oUrl.searchParams.get("lastMsgTime")) || null;

            const practice = await getMessageSince(practTimeSince, PAGE_SIZE, lastPractTime);
            const messages = await getMessageSince(msgTimeSince, PAGE_SIZE, lastMsgTime);
            const hasMore = practice.length === PAGE_SIZE || messages.length === PAGE_SIZE;

            return NextResponse.json({
                practice,
                messages,
                hasMore,
                nextPractLastTime: practice.length > 0 ? practice[practice.length - 1].time : null,
                nextMsgLastTime: messages.length > 0 ? messages[messages.length - 1].time : null,
                page
            }, { status: 200 });
        } else {
            if (status.going) {
                return NextResponse.json({ status, message: "Already copying" }, { status: 200 });
            }

            status.going = true;
            status.totalDocs = 0;
            status.doneDocs = 0;
            status.lastProcessedTime = null;
            status.isComplete = false;

            const msgTimeSince = await getLatestMessageTime(true);
            const practTimeSince = await getLatestPracticeTime(true);

            await copyDataPaginated(practTimeSince, msgTimeSince);

            return NextResponse.json({ status }, { status: 201 });
        }
    } catch (error) {
        console.error("Error copying data:", error);
        status.going = false;
        return NextResponse.json(
            { error: "Internal Server Error", message: error.message },
            { status: 500 }
        );
    }
}

async function copyDataPaginated(practTimeSince, msgTimeSInce) {
    try {
        let currentPage = 1;
        let hasMore = true;
        let lastPractTime = null;
        let lastMsgTime = null;

        while (hasMore && status.going) {
            const response = await fetch(
                `https://discurso.ai/api/data-copy/practice?read=yes&practTime=${practTimeSince}&msgTime=${msgTimeSInce}&page=${currentPage}&lastPractTime=${lastPractTime || ''}&lastMsgTime=${lastMsgTime || ''}`,
                // `https://disc.anhalt.dev/api/data-copy/practice?read=yes&time=${timeSince}&page=${currentPage}&lastTime=${lastTime || ''}`,
                {
                    method: "POST",
                    body: JSON.stringify({ key: process.env.DATA_COPY_KEY })
                }
            );

            if (!response.ok) throw new Error("Failed data fetch");

            const data = await response.json();
            const practice = data.practice;
            const messages = data.messages;
            // const maxLength = Math.max(practice.length, messages.length);

            // if (currentPage === 1) {
            //     status.totalDocs = maxLength * (data.hasMore ? 2 : 1);
            // } else if (data.hasMore) {
            //     status.totalDocs = status.doneDocs + (practice.length + messages.length) * 2;
            // } else {
            //     status.totalDocs = status.doneDocs + (practice.length + messages.length);
            // }

            if (practice?.length) {
                for (let pract of practice) {
                    pract.foreign = true;
                }
                await saveDocs(practice, "practice");
                status.doneDocs += practice.length;
                status.lastProcessedTime = data.nextPractLastTime;
            }
            if (messages?.length) {
                for (let msg of messages) {
                    msg.foreign = true;
                }
                await saveDocs(messages, "messages");
                status.doneDocs += messages.length;
                status.lastProcessedTime = data.nextMsgLastTime;
            }

            hasMore = data.hasMore;
            if (hasMore) {
                lastPractTime = data.nextPractLastTime;
                lastMsgTime = data.nextMsgLastTime;
                currentPage++;

                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        status.isComplete = true;
        status.going = false;

        console.log(`Practice data [${status.doneDocs}] copied`);

        return status;
    } catch (error) {
        console.error("Error in paginated copy:", error);
        status.going = false;
        throw error;
    }
}

function getChunkedArr(orgArr, size = 500) {
    const chunks = [];
    for (let i = 0; i < orgArr.length; i += size) {
        chunks.push(orgArr.slice(i, i + size));
    }
    return chunks;
}