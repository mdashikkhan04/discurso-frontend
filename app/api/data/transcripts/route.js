import "server-only";

export const maxDuration = 600;

import { verifyAccess } from "@/lib/server/auth";
import { processTranscriptUpload } from "@/lib/server/data/transcripts";
import { NextResponse } from "next/server";


export async function POST(req) {
    const access = await verifyAccess();
    if (!access?.uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const uploadData = {
        transcriptFile: form.get("transcriptFile"),
        speakerMap: form.get("speakerMap"),
        eventId: form.get("eventId") || undefined,
        round: form.get("round") ? Number.parseInt(String(form.get("round")), 10) : undefined,
        userId: access.uid,
    };
    const processedTranscript = await processTranscriptUpload(uploadData);
    const status = processedTranscript?.success ? 201 : 400;
    return NextResponse.json(processedTranscript, { status });
}