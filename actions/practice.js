'use server';

import { verifyAccess } from "@/lib/server/auth";
import { getDocs } from "@/lib/server/data/data";
import { getCase } from "@/lib/server/data/cases";
import { getMessages as getAiMessages, getFeedbackLabels } from "@/lib/server/data/ai";


export async function listPractices() {
  const access = await verifyAccess(["negotiator"]);
  if (!access?.uid) throw new Error("Unauthorized");
  const uid = access.uid;

  const rows = await getDocs("practice", [{ field: "userId", value: uid }], ["negId", "caseId", "time"]);
  if (!rows?.length) return [];

  const byNeg = new Map();
  for (const r of rows) {
    const id = r.negId || r.practiceId;
    if (!id) continue;
    const t = r.time?.toMillis ? r.time.toMillis() : (r.time?.getTime ? r.time.getTime() : Number(r.time || 0));
    const prev = byNeg.get(id);
    if (!prev) byNeg.set(id, { negId: id, caseId: r.caseId, time: t || 0 });
    else {
      if (!prev.caseId && r.caseId) prev.caseId = r.caseId;
      if ((t || 0) > (prev.time || 0)) prev.time = t || 0;
    }
  }

  const sessions = Array.from(byNeg.values());
  const caseIds = [...new Set(sessions.map(s => s.caseId).filter(Boolean))];

  const feedbacks = await getDocs("feedback", [
    { field: "userId", value: uid },
    { field: "isPractice", value: true },
  ], ["negId", "time", "id"]);
  const completedSet = new Set((feedbacks || []).map(f => f.negId));

  let caseTitleMap = {};
  if (caseIds.length) {
    const chunk = async (arr, size) => {
      const out = [];
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
      return out;
    };
    const chunks = await chunk(caseIds, 10);
    for (const ids of chunks) {
      const part = await getDocs("cases", [{ field: "F_ID", in: true, value: ids }], ["id", "title"]);
      part.forEach(c => { caseTitleMap[c.id] = c.title; });
    }
  }

  const result = sessions
    .map(s => ({
      negId: s.negId,
      caseId: s.caseId,
      title: caseTitleMap[s.caseId] || "Untitled Case",
      time: s.time,
      completed: completedSet.has(s.negId)
    }))
    .sort((a, b) => (b.time || 0) - (a.time || 0));

  return result;
}

export async function getPracticeSession(negId) {
  const access = await verifyAccess(["negotiator"]);
  if (!access?.uid) throw new Error("Unauthorized");
  const uid = access.uid;

  const rawMessages = await getAiMessages(negId);
  if (!rawMessages?.length) return null;

  const sorted = [...rawMessages].sort((a, b) => (a.time || 0) - (b.time || 0));
  const caseId = sorted[0]?.caseId;
  const acase = caseId ? await getCase(caseId) : null;

  const clientMessages = sorted.map(m => ({
    role: m.role === 'ai' ? 'assistant' : 'user',
    content: String(m.content || ''),
    senderId: m.role === 'user' ? (m.userId || uid) : 'AI',
    id: m.id || undefined,
  }));

  const fbs = await getDocs("feedback", [
    { field: "negId", value: negId },
    { field: "userId", value: uid },
    { field: "isPractice", value: true },
  ]);
  const feedback = (fbs && fbs[0]) ? (() => { const { timestamp, ...rest } = fbs[0]; return rest; })() : null;

  const prs = await getDocs("practiceResults", [
    { field: "negId", value: negId },
    { field: "userId", value: uid },
  ]);
  const practiceResult = prs?.[0] || null;

  let feedbackText = null;
  const labels = getFeedbackLabels();
  if (feedback?.summary && feedback?.scores) {
    let s = `${feedback.summary}`;
    s += `\n\n\nScores:\n\n`;
    Object.keys(labels).forEach(k => {
      if (feedback.scores[k] !== undefined) {
        s += `${labels[k]} - ${feedback.scores[k]}/5\n${feedback.reasoning?.[k] || ''}\n\n`;
      }
    });
    feedbackText = s;
  }

  const aiSide = acase?.ai || 'a';

  const latestMsgTime = sorted.length ? (sorted[sorted.length - 1].time || 0) : 0;
  const time = practiceResult?.time || feedback?.time || latestMsgTime || 0;

  return {
    negId,
    case: acase,
    caseId,
    messages: clientMessages,
    completed: Boolean(feedback),
    feedback,
    feedbackText,
    feedbackLabels: labels,
    aiSide,
    agreement: practiceResult?.agreement || null,
    madeDeal: practiceResult?.madeDeal || false,
    time,
  };
}
