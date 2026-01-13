"use server";

import { makeBotFeedback, getNegotiationResponse } from "@/lib/server/ai";

export async function getBotResponse(data) {
    const response = await getNegotiationResponse({...data});
    return response;
}

export async function getBotFeedback(transcript, side, behaviour, caseId, userId, llmConfig) {
    const feedback = await makeBotFeedback(transcript, side, behaviour, caseId, userId, llmConfig);
    return feedback;
}