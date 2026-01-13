import "server-only";
import {
  saveDoc,
  getLatestDoc,
  getDocs,
  saveDocs,
  deleteDoc,
} from "@/lib/server/data/data";
import { makeP2PNegId } from "@/lib/util";

export async function saveMessage(message, isPractice) {
  // console.log("saveMessage()", message);
  const { stats, ...rest } = message;
  if (stats) {
    const messageId = await saveDoc(
      message,
      isPractice ? "practice" : "messages"
    );
    return messageId;
  }
  return null;
}

export async function saveMessages(messages, isPractice) {
  const savingResult = await saveDocs(
    messages,
    isPractice ? "practice" : "messages"
  );
  return savingResult;
}

export async function getLatestMessageTime(foreign) {
  const latestMessage = await getLatestDoc("messages", foreign);
  return latestMessage?.time || 0;
}

export async function getLatestPracticeTime(foreign) {
  const latestMessage = await getLatestDoc("practice", foreign);
  return latestMessage?.time || 0;
}

export async function getMessageSince(
  timeSince,
  limit = 1000,
  lastDocTime = null
) {
  let filters = [{ field: "time", greater: true, value: timeSince }];

  if (lastDocTime) {
    filters.push({ field: "time", greater: true, value: lastDocTime });
  }

  const messages = await getDocs("practice", filters, null, limit);
  return messages;
}

export async function getNegId(eventId, teamId, roundNo) {
  const negId = await getStringHash(`${eventId}-${teamId}-${roundNo}`);
  return negId;
}

export async function getNegMessages(
  eventId,
  ownTeam,
  roundNo,
  vsAi = true,
  enemy,
) {
  // console.log(teamId, enemy);
  let negId;
  let negMessages;
  if (vsAi) {
    negId = await getNegId(eventId, ownTeam.team, roundNo);
    negMessages = await getDocs("messages", [{ field: "negId", value: negId }]);
    negMessages = negMessages.map((msg) => ({
      ...msg,
      indecent: !Boolean(msg.decent),
      role: msg.role === "user" ? "user" : "assistant",
    }));
  } else {
    // console.log("ownTeam", ownTeam);
    // console.log("enemy", enemy);
    if (ownTeam.side === "a") {
      negId = makeP2PNegId(eventId, roundNo, ownTeam.team, enemy.id);
    } else {
      negId = makeP2PNegId(eventId, roundNo, enemy.id, ownTeam.team);
    }
    // console.log("Generated p2pNegId:", negId);
    negMessages = await getDocs("p2pMessages", [
      { field: "negId", value: negId },
    ]);
  }
  negMessages.sort((a, b) => a.time - b.time);
  // console.log("getNegMessages()", negMessages, negId);
  return { messages: negMessages, negId };
}

export async function getMessages(negId) {
  if (!negId) return [];

  const [practiceIdMessages, negotiationIdMessages, realNegotMessages] =
    await Promise.all([
      getDocs("practice", [{ field: "practiceId", value: negId }]),
      getDocs("practice", [{ field: "negId", value: negId }]),
      getDocs("messages", [{ field: "negId", value: negId }]),
    ]);

  // Combine results and remove duplicates (in case a message has both IDs)
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

export async function saveFeedback(feedback) {
  // console.log("saveFeedback()", feedback);
  const feedbackId = await saveDoc(feedback, "feedback");
  return feedbackId;
}

export async function saveSurvey(survey) {
  // console.log("saveFeedback()", feedback);
  const surveyId = await saveDoc(survey, "survey");
  return surveyId;
}

export async function getFeedback(negId) {
  const allFeedbacks = await getFeedbacks(negId, true);
  if (!allFeedbacks?.length) return null;
  const { timestamp, ...feedback } = allFeedbacks[0] || null;
  return feedback;
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

export async function getFeedbacks(negId, realOnly) {
  // Use two separate queries and combine the results for an OR condition
  let practiceIdFeedbacks = [];
  if (!realOnly)
    practiceIdFeedbacks = await getDocs("feedback", [
      { field: "practiceId", value: negId },
    ]);

  const negotiationIdFeedbacks = await getDocs("feedback", [
    { field: "negId", value: negId },
  ]);

  // Combine results and remove duplicates
  const feedbackMap = new Map();

  [...practiceIdFeedbacks, ...negotiationIdFeedbacks].forEach((feedback) => {
    if (!feedbackMap.has(feedback.id)) {
      const { timestamp, ...rest } = feedback;
      feedbackMap.set(feedback.id, rest);
    }
  });

  // Convert to array and sort by time
  return Array.from(feedbackMap.values()).sort((a, b) => a.time - b.time);
}

export async function getSurveys(negId) {
  // Use two separate queries and combine the results for an OR condition
  const surveys = await getDocs("survey", [{ field: "negId", value: negId }]);

  // Combine results and remove duplicates
  const surveyMap = new Map();

  surveys.forEach((survey) => {
    if (!surveyMap.has(survey.id)) {
      const { timestamp, ...rest } = survey;
      surveyMap.set(survey.id, rest);
    }
  });

  // Convert to array and sort by time
  return Array.from(surveyMap.values()).sort((a, b) => a.time - b.time);
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

    // Skip if no valid ID is found
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

export async function getStringHash(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
