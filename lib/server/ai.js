import "server-only";

import { saveMessage, saveFeedback, saveSurvey, getPeerMessages, savePracticeResult, getSurveyLabels, getFeedbackLabels } from "@/lib/server/data/ai";
import { getCase, saveCaseInterest } from "@/lib/server/data/cases";
import { getEvent } from "@/lib/server/data/events";
import { getScore } from "@/lib/scoreFuncUtil";
import { getNiceNum, makeAiNegId, print } from "@/lib/util";

const API_BASE = process.env.DISCURSO_API_BASE_URL || "http://localhost:8000";
const API_KEY = process.env.DISCURSO_API_KEY || "";
const API_TIMEOUT_MS = 600_000

async function apiReq(path, body) {
  if (!API_BASE) throw new Error("Missing DISCURSO_API_BASE_URL");
  const urlPath = path.startsWith("/") ? path : `/${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1000, API_TIMEOUT_MS));
  print("apiReq", urlPath);
  try {
    const res = await fetch(`${API_BASE}${urlPath}`,
      { method: "POST", headers: { "Content-Type": "application/json", "X-API-Key": API_KEY }, body: JSON.stringify(body || {}), signal: controller.signal }
    );
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(text || `API request failed: ${res.status}`);
    }
    const result = text ? JSON.parse(text) : {};
    print("apiReq result", urlPath, result);
    try { return text ? JSON.parse(text) : {}; }
    catch { return { ok: true, text }; }
  } finally {
    clearTimeout(timeout);
  }
}

export async function getModeration(content) {
  return await apiReq('/v1/moderation', { content });
}

export async function getNegotiationResponse({
  negId, caseId, userQuery, pastMessages, offer, userId, aiSide, isPractice,
  isBotSim, overrideEnd, behaviourParams, llmConfig, returnExtra
}) {
  if (!userId) throw new Error("User ID is required");
  if (!negId) negId = makeAiNegId(userId, caseId);
  const { decent, flags } = await getModeration(userQuery);
  const incomingMessage = { role: "user", content: userQuery, decent, userId, negId, caseId, time: Date.now() };
  if (!isBotSim) saveMessage(incomingMessage, isPractice);
  if (!decent) return { indecent: true, flags, negId };
  const oCase = await getCase(caseId);
  if (!oCase) throw new Error("No case found for ID " + caseId);

  const finalAiSide = aiSide || oCase.ai;

  const sDealParams = getDealParamsString(oCase.params);
  const rescaledConcessionDist = behaviourParams?.concessionsDist
    ? getRescaledConcessionDistVal(behaviourParams.concessionsDist, pastMessages?.length || 0)
    : undefined;
  const adjustedBehaviourParams = rescaledConcessionDist !== undefined
    ? { ...behaviourParams, concessionsDist: rescaledConcessionDist }
    : behaviourParams;

  const caseInterest = oCase[`${finalAiSide}Interest`];
  const generalInstruct = oCase.generalInstruct || oCase.instructions?.en?.general || "";
  const aiSideInstruct = finalAiSide === "a"
    ? (oCase.aInstruct || oCase.instructions?.en?.aParty || "")
    : (oCase.bInstruct || oCase.instructions?.en?.bParty || "");
  const opponentSideInstruct = finalAiSide === "a"
    ? (oCase.bInstruct || oCase.instructions?.en?.bParty || "")
    : (oCase.aInstruct || oCase.instructions?.en?.aParty || "");

  const result = await apiReq('/v1/negotiation/response', {
    negId,
    caseId,
    userQuery,
    pastMessages,
    offer,
    userId,
    aiSide: finalAiSide,
    isPractice,
    isBotSim,
    overrideEnd,
    behaviourParams: adjustedBehaviourParams,
    llmConfig,
    returnExtra,
    sDealParams,
    generalInstruct,
    aiSideInstruct,
    opponentSideInstruct,
    aiSideName: finalAiSide === "a" ? oCase.aName : oCase.bName,
    opponentName: finalAiSide === "a" ? oCase.bName : oCase.aName,
    caseInterest,
  });
  print("getNegotiationResponse result", result);
  if (result?.generatedInterest) {
    await saveCaseInterest(caseId, result.generatedInterest, finalAiSide);
    oCase[`${finalAiSide}Interest`] = { version: "v2", text: result.generatedInterest };
  }

  if (result?.feedback) {
    const feedbackToSave = {
      ...(result.feedback),
      negId,
      caseId: oCase.id,
      model: result?.models?.scoreModel || "",
      cost: getNiceNum(result?.feedback?.totalCost || 0, 4),
      isPractice: Boolean(isPractice),
      time: Date.now(),
      userId,
      type: "ai"
    };
    // if (metadata?.eventId) feedbackToSave.eventId = metadata.eventId;
    // if (metadata?.round) feedbackToSave.round = metadata.round;
    // if (metadata?.team) feedbackToSave.team = metadata.team;
    // if (metadata?.agreement) feedbackToSave.agreement = metadata.agreement;
    await saveFeedback(feedbackToSave);
    if (isPractice) {
      const labels = getFeedbackLabels();
      const feedback = result.feedback;
      let sFullFeedback = `${feedback.summary}\n\n\nScores:\n\n`;
      Object.keys(labels).forEach(label => {
        if (feedback.scores && feedback.scores[label] !== undefined) {
          sFullFeedback += `${labels[label]} - ${feedback.scores[label]}/5\n${feedback.reasoning?.[label] || ''}\n\n`;
        }
      });
      result.feedback = sFullFeedback;
    } else {
      const { summary, scores, reasoning, ...rest } = result.feedback;
      result.feedback = { summary, scores, reasoning };
    }
  }

  if (!isBotSim && result?.answer) {
    const aiMessage = {
      role: "ai",
      content: result.answer || "",
      decent: true,
      userId,
      negId,
      shouldEnd: Boolean(result.shouldEnd),
      caseId,
      time: Date.now(),
      cost: typeof result.cost === "number" ? result.cost : 0
    };
    try {
      const offerItems = result?.stats?.offer;
      // if (!isPractice && oCase?.scorable && Array.isArray(offerItems) && offerItems.length) {
      if (oCase?.scorable && Array.isArray(offerItems) && offerItems.length) {
        const offerParamsObj = offerItems.reduce((acc, p) => {
          let v = parseFloat(p.value);
          if (isNaN(v)) v = p.value;
          acc[p.id] = v;
          return acc;
        }, {});
        const scoreFormula = aiSide === "a" ? oCase.scoreFormulaB : oCase.scoreFormulaA;
        const latestScore = getScore(scoreFormula, offerParamsObj) || 0;
        aiMessage.stats = { score: latestScore, offer: offerItems };
        result.stats = { score: latestScore, offer: offerItems };
        print("getNegotiationResponse score", latestScore, offerParamsObj);
      } else if (result?.stats) {
        aiMessage.stats = result.stats;
      }
    } catch { }
    saveMessage(aiMessage, isPractice);
  }

  if (isPractice && result?.shouldEnd) {
    const offerItems = result?.stats?.offer;
    if (Array.isArray(offerItems) && offerItems.length) {
      await savePracticeAgreementFromOfferParams({ offerParams: offerItems, negId, oCase, userId, aiSide });
    } else {
      const allMessages = Array.isArray(pastMessages) ? pastMessages : [];
      await savePracticeAgreementFromMessages({
        messages: allMessages,
        negId,
        oCase,
        userId,
        aiSide,
        llmConfig: (llmConfig && (llmConfig.helper || llmConfig.final)) || llmConfig,
      });
    }
  }

  return result;
}

export async function getPeerOffer({ negId, caseId, userId, llmModel }) {
  const [oCase, rawMessages] = await Promise.all([
    getCase(caseId),
    getPeerMessages(negId)
  ]);
  if (!rawMessages?.length) throw new Error("No messages found for negId " + negId);
  if (!oCase) throw new Error("No case found for ID " + caseId);

  const sDealParams = getDealParamsString(oCase.params);
  const userA = rawMessages[0].userId;
  const sMessages = rawMessages.map(m => `${m.userId === userA ? 'Side A' : 'Side B'}: ${m.content}`).join("\n\n");

  const res = await apiReq('/v1/negotiation/peer-offer', {
    negId,
    caseId,
    sMessages,
    sDealParams,
    userId,
    llmModel
  });
  return res;
}

async function savePracticeAgreementFromOfferParams({ offerParams, negId, oCase, userId, aiSide }) {
  try {
    const agreement = (offerParams || []).reduce((acc, p) => {
      let v = parseFloat(p.value);
      if (isNaN(v)) v = p.value;
      acc[p.id] = v;
      return acc;
    }, {});
    await savePracticeResult({
      negId,
      caseId: oCase.id,
      userId,
      agreement,
      madeDeal: Object.keys(agreement).length > 0,
      vsAI: true,
      isPractice: true,
      time: Date.now(),
      aiSide,
    });
    return { saved: true, agreement };
  } catch (e) {
    console.warn("Failed to save practice result", e);
    return { saved: false };
  }
}

async function savePracticeAgreementFromMessages({ messages, negId, oCase, userId, aiSide, llmConfig }) {
  try {
    const llmModel = (llmConfig && (llmConfig.model || llmConfig.final?.model)) || undefined;
    const rawMessages = (messages || [])
      .map(m => {
        const role = (m.role || "").toLowerCase();
        const userIdNorm = role === "user" ? "user" : role === "ai" ? "ai" : (m.userId || "user");
        return { userId: userIdNorm, content: m.content || "" };
      })
      .filter(x => x.content);
    const resp = await apiReq('/v1/negotiation/peer-offer', {
      negId,
      caseId: oCase.id,
      acase: oCase,
      messages: rawMessages,
      userId,
      llmModel
    });
    const offerItems = resp?.offer || [];
    const cost = resp?.cost || 0;
    if (Array.isArray(offerItems) && offerItems.length) {
      const res = await savePracticeAgreementFromOfferParams({ offerParams: offerItems, negId, oCase, userId, aiSide });
      return { ...res, cost };
    }
    return { saved: false, cost };
  } catch (e) {
    console.warn("Failed to save practice result", e);
    return { saved: false, cost: 0 };
  }
}

export async function makePeersFeedbacks({ eventId, round, negId, llmModel, messages, sides }) {
  const oEvent = await getEvent(eventId);
  if (!oEvent) throw new Error("No event found for ID " + eventId);
  const roundIndex = ((typeof round === "string" ? parseInt(round) : round) || 1) - 1;
  const oRound = oEvent.rounds?.[roundIndex];
  if (!oRound) throw new Error("No round " + (roundIndex + 1) + " found for event ID " + eventId);

  const roundCaseId = oRound.case?.id || oRound.caseId;
  if (!roundCaseId) throw new Error("Round is missing case information for event ID " + eventId);
  const oCase = await getCase(roundCaseId);
  if (!oCase) throw new Error("No case found for ID " + roundCaseId);

  const normalizedNegIds = Array.isArray(negId) ? negId.filter(Boolean) : negId ? [negId] : [];
  const fallbackBaseNegId = `transcript-${eventId || "p2p"}-${roundIndex + 1}-${Date.now()}`;
  const resolvedNegIds = normalizedNegIds.length ? normalizedNegIds : [fallbackBaseNegId];

  const isTranscriptMode = Array.isArray(messages) && messages.length > 0;

  let rawMessages;
  if (isTranscriptMode) {
    rawMessages = messages
      .map(msg => {
        const userId = (msg?.userId ?? msg?.user ?? msg?.speaker ?? "").toString().trim();
        const content = (msg?.content ?? msg?.text ?? "").toString().trim();
        if (!userId || !content) return null;
        return { userId, content };
      })
      .filter(Boolean);
  } else {
    const negIdArg = resolvedNegIds.length > 1 ? resolvedNegIds : resolvedNegIds[0];
    rawMessages = await getPeerMessages(negIdArg);
  }

  if (!rawMessages?.length) throw new Error("No messages found for negId " + (Array.isArray(negId) ? negId.join(",") : negId));

  const normalizedMessages = rawMessages
    .map(msg => ({
      userId: (msg?.userId ?? "").toString().trim(),
      content: (msg?.content ?? "").toString(),
    }))
    .filter(msg => msg.userId && msg.content);

  if (!normalizedMessages.length) throw new Error("No valid messages available for feedback generation");

  const userIds = [...new Set(normalizedMessages.map(msg => msg.userId))];
  if (!userIds.length) throw new Error("No users found in negotiation messages");

  const matches = oEvent.matches?.[roundIndex]?.matches || oRound.matches;
  if (!matches?.length) throw new Error("No matches found for round");

  const resolveSideForUser = (userId) => {
    if (!userId) return undefined;
    if (sides.a.includes(userId)) return "a";
    if (sides.b.includes(userId)) return "b";

    const participant = oEvent.participants.find(p => p.name === userId || p.id === userId);
    const ids = [participant?.name, participant?.id, participant?.team].filter(id => Boolean(id));
    const match = matches.find(m => ids.includes(m.a) || ids.includes(m.b));
    if (!match) return undefined;
    if (ids.includes(match.a)) return "a";
    if (ids.includes(match.b)) return "b";

    return null;
  };

  const feedbackPromises = userIds.map(async (userId, index) => {
    const userSide = resolveSideForUser(userId);
    // if (!userSide) throw new Error(`Could not determine side for user ${userId}`);
    if (!userSide) return null;
    const opponentSide = userSide === "a" ? "b" : "a";
    const feedNegId = resolvedNegIds[Math.min(index, resolvedNegIds.length - 1)];
    const formattedMessages = normalizedMessages.map(msg => ({
      role: msg.userId === userId ? "user" : "ai",
      content: msg.content,
    }));

    const participant = oEvent.participants.find(p => p.name === userId || p.id === userId);
    const team = participant?.team || null;

    const feedback = await makeFeedback(
      feedNegId,
      formattedMessages,
      oCase,
      userId,
      opponentSide,
      llmModel,
      false,
      true,
      { eventId, round: roundIndex + 1, team }
    );
    return { userId, feedbackId: feedback.id };
  });

  const feedbackResults = await Promise.all(feedbackPromises);
  return Object.fromEntries(feedbackResults.filter(res => Boolean(res)).map(result => [result.userId, result.feedbackId]));
}

export async function makeFeedback(negId, negMessages, oCase, userId, aiSide, llmModel, isPractice, isP2P, metadata) {
  const userPartyName = aiSide === "a" ? oCase.bName : oCase.aName;
  const transcript = getTranscript(negMessages, oCase, aiSide);
  const generalInstruct = oCase.generalInstruct || "";
  const userInstruct = aiSide === "a" ? oCase.aInstruct : oCase.bInstruct || "";

  const result = await apiReq('/v1/feedback/make', {
    negId,
    userId,
    aiSide,
    llmModel,
    isPractice,
    isP2P,
    metadata,
    userPartyName,
    transcript,
    generalInstruct,
    userInstruct
  });

  const feedback = typeof result === 'string' ? { summary: result } : (result || {});
  const feedbackToSave = {
    ...feedback,
    negId,
    caseId: oCase.id,
    model: llmModel || feedback.model || "",
    cost: getNiceNum((feedback?.cost || 0), 4),
    isPractice: Boolean(isPractice),
    time: Date.now(),
    userId,
    type: isP2P ? "p2p" : "ai",
  };
  if (metadata?.eventId) feedbackToSave.eventId = metadata.eventId;
  if (metadata?.round) feedbackToSave.round = metadata.round;
  if (metadata?.team) feedbackToSave.team = metadata.team;
  if (metadata?.agreement) feedbackToSave.agreement = metadata.agreement;

  const feedbackId = await saveFeedback(feedbackToSave);
  feedback.id = feedbackId;

  if (isPractice) {
    const labels = getFeedbackLabels();
    let sFullFeedback = `${feedback.summary || ''}\n\n\nScores:\n\n`;
    Object.keys(labels).forEach(label => {
      if (feedback.scores && feedback.scores[label] !== undefined) {
        sFullFeedback += `${labels[label]} - ${feedback.scores[label]}/5\n${feedback.reasoning?.[label] || ''}\n\n`;
      }
    });
    return sFullFeedback.trim();
  }
  return feedback;
}

export async function makeCaseIdeas(outline, userId, pastIdeas) {
  const res = await apiReq('/v1/cases/ideas', { outline, userId, pastIdeas });
  return Array.isArray(res) ? res : (res?.ideas || []);
}

export async function makeFullCaseIdea(outline, idea, userId) {
  return await apiReq('/v1/cases/ideas/full', { outline, idea, userId });
}

export async function makeRefinedCaseIdea(caseJson, commentJson, userId) {
  return await apiReq('/v1/cases/refine', { caseJson, commentJson, userId });
}

export async function makeCaseSummary(caseJson, userId) {
  return await apiReq('/v1/cases/summary', { caseJson, userId });
}

export async function makeCaseScoreFormula(instruction, params, userId, prevVal) {
  return await apiReq('/v1/cases/score-formula', { instruction, params, userId, prevVal });
}

export async function getCaseMatchingTags(caseJson, allTags, userId) {
  const res = await apiReq('/v1/cases/tags', { caseJson, allTags, userId });
  return Array.isArray(res) ? res : (res?.tags || []);
}

export async function makeBotFeedback(transcript, side, behaviour, caseId, userId, llmConfig) {
  const oCase = await getCase(caseId);
  if (!oCase) throw new Error("No case found for ID " + caseId);

  const lowerSide = side.toLowerCase();
  const caseRole = oCase[`${lowerSide}Instruct`];
  const interest = oCase[`${lowerSide}Interest`]?.text || '';
  const params = getDealParamsString(oCase.params);
  const generalInstruct = oCase.generalInstruct || '';

  return await apiReq('/v1/bot/feedback', {
    transcript,
    side,
    behaviour,
    caseId,
    userId,
    llmConfig,
    caseRole,
    interest,
    params,
    generalInstruct
  });
}

export async function makeSurvey(negId, messages, acase, userId, aiSide, model, isPractice) {
  const aiPartyName = aiSide === "a" ? acase.aName : acase.bName;
  const aiInstructions = aiSide === "a" ? acase.aInstruct : acase.bInstruct;
  const transcript = getTranscript(messages, acase, aiSide, true);
  const generalInstruct = acase.generalInstruct || "";

  const survey = await apiReq('/v1/surveys/make', {
    negId,
    userId,
    aiSide,
    model,
    isPractice,
    aiPartyName,
    aiInstructions,
    transcript,
    generalInstruct
  });

  if (isPractice) {
    const labels = getSurveyLabels();
    const s = typeof survey === 'object' ? survey : {};
    let sSurvey = "";
    Object.keys(labels).forEach(label => {
      if (s?.scores && s?.reasoning && (label in s.scores)) {
        sSurvey += `${labels[label]}\n${s.scores[label]}\n${s.reasoning[label]}\n\n`;
      }
    });
    return sSurvey.trim();
  }

  const surveyToSave = {
    ...(typeof survey === 'object' ? survey : {}),
    negId,
    caseId: acase.id,
    model,
    cost: getNiceNum((survey?.cost || 0), 4),
    isPractice: Boolean(isPractice),
    time: Date.now(),
  };
  await saveSurvey(surveyToSave);
  return surveyToSave;
}

function getTranscript(messages, acase, aiSide, forSurvey) {
  if (!messages || !messages.length) return "";
  const aiPartyName = aiSide === "a" ? acase.aName : acase.bName;
  const userPartyName = aiSide === "a" ? acase.bName : acase.aName;
  return messages.map(msg => {
    const partyName = forSurvey ? (msg.role === "user" ? userPartyName : aiPartyName) : msg.role.toUpperCase();
    return `${partyName}: ${msg.content}`;
  }).join("\n\n");
}

function getDealParamsString(params) {
  return params.map((param) => `${param.name} (id: ${param.id}, data_type: ${param.dataType}, ${param.dataType === "list" && param.listItems ? "possible values (separated by <>): " + param.listItems : ""} ${param.dataType === "number" && (!isNaN(param.bottomLimit) || !isNaN(param.topLimit)) ? "possible range: " + param.bottomLimit + " - " + param.topLimit : ""})`).join(", ");
}

function getRescaledConcessionDistVal(orgVal, pastMsgCount) {
  const delay = orgVal === 5 ? 30 : orgVal * 5;
  if (pastMsgCount < delay) return orgVal;
  const blocksPastDelay = Math.floor((pastMsgCount - delay) / 5) + 1;
  const softerSteps = Math.min(blocksPastDelay, orgVal - 1);
  const newLevel = Math.max(1, orgVal - softerSteps);
  return newLevel;
}

export async function makeFeedbackSummaryText(feedbacksData, user = "system") {
  if (!feedbacksData) return "";
  const res = await apiReq("/v1/feedback/summary", { feedbacksData, user });
  // external API returns { text, cost }
  return res;
}

export async function makeEnhancedPrompts(originalPrompts, userRequest, userId, extraData) {
  if (!originalPrompts) throw new Error("No original prompts provided");
  if (!userId) throw new Error("No user ID provided");
  if (!userRequest?.length) return null;
  return await apiReq("/v1/prompts/enhance", { originalPrompts, userRequest, userId, extraData });
}

export async function translateContent({ content, language, userId }) {
  if (!content) throw new Error("No content provided");
  if (!language) throw new Error("No target language provided");
  if (!userId) throw new Error("No user ID provided");
  const res = await apiReq("/v1/translate", { content, language, userId });
  return res;
}

export async function processTranscript({ rawTranscript, speakerMap, userId }) {
  if (!rawTranscript) throw new Error("No transcript provided");
  if (!userId) throw new Error("No user ID provided");
  const res = await apiReq("/v1/transcripts/process", { rawTranscript, speakerMap, userId });
  return res;
}

// TODO: Implement new negotiation response via external API
export async function getNewNegResponse({ userId }) {
  if (!userId) throw new Error("No user ID provided");
  return await apiReq("/v1/negotiation/new-response", { userId });
}

// TODO redo, obviously
export async function getRealtimeEphemeralKey({ caseId, userId, aiModel, aiSide, behaviourParams, withAudio, voice }) {
  if (!userId) throw new Error("User ID is required");
  const oCase = await getCase(caseId);
  if (!oCase) throw new Error("No case found for ID " + caseId);

  const finalAiSide = aiSide || oCase.ai;

  const generalInstruct = oCase.generalInstruct || "";
  const partyInstructions = finalAiSide === "a" ? oCase.aInstruct : oCase.bInstruct;
  const interest = (finalAiSide === "a" ? oCase.aInterest : oCase.bInterest);
  const sDealParams = getDealParamsString(oCase.params);
  const aiSideName = finalAiSide === "a" ? oCase.aName : oCase.bName;
  const opponentName = finalAiSide === "a" ? oCase.bName : oCase.aName;

  const res = await apiReq('/v1/negotiation/realtime-key', {
    caseId,
    userId,
    aiModel,
    aiSide: finalAiSide,
    behaviourParams,
    withAudio,
    voice,
    generalInstruct,
    partyInstructions,
    interest,
    sDealParams,
    aiSideName,
    opponentName
  });

  if (res?.generatedInterest) {
    await saveCaseInterest(caseId, {
      version: "v2",
      text: res.generatedInterest
    }, finalAiSide);
  }

  return res.key || res;
}

export async function getAndSaveCaseInterest(caseId, instructions, side) {
  const interest = await apiReq('/v1/cases/interest', { instructions });
  if (interest?.text) {
    await saveCaseInterest(caseId, {
      version: interest.version,
      text: interest.text
    }, side);
  }
  return interest?.text || "";
}