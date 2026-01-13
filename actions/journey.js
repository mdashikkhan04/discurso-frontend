'use server';

import { verifyAccess } from "@/lib/server/auth";
import {
  listStages as listStagesDb,
  saveStage as saveStageDb,
  deleteStage as deleteStageDb,
  getJourneysSummary as getJourneysSummaryDb,
  getActiveJourneyName,
  setActiveJourney as setActiveJourneyDb
} from "@/lib/server/data/journeys";
import { getDocs } from "@/lib/server/data/data";
import { getUserProfile } from "@/lib/server/data/profiles";

export async function listJourneysSummary() {
  const { role } = await verifyAccess(["admin"]);
  if (role !== "admin") throw new Error("Unauthorized");
  const items = await getJourneysSummaryDb();
  const active = await getActiveJourneyName();
  return items.map(it => ({ ...it, active: it.name === active }));
}

export async function listStages(journeyName) {
  const { role } = await verifyAccess(["admin"]);
  if (role !== "admin") throw new Error("Unauthorized");
  return await listStagesDb(journeyName);
}

export async function saveStage(stage) {
  const { role } = await verifyAccess(["admin"]);
  if (role !== "admin") throw new Error("Unauthorized");
  return await saveStageDb(stage);
}

export async function deleteStage(stageId) {
  const { role } = await verifyAccess(["admin"]);
  if (role !== "admin") throw new Error("Unauthorized");
  return await deleteStageDb(stageId);
}

export async function setActiveJourney(name) {
  const { role } = await verifyAccess(["admin"]);
  if (role !== "admin") throw new Error("Unauthorized");
  return await setActiveJourneyDb(name);
}

export async function markStageCompleted(stageId) {
  const { uid } = await verifyAccess([]);
  if (!uid) throw new Error("Unauthorized");
  const { addCompletedStage } = await import("@/lib/server/data/profiles");
  await addCompletedStage(uid, stageId);
  return true;
}

export async function getRecommendation() {
  const { uid } = await verifyAccess();
  if (!uid) throw new Error("Unauthorized");
  const profile = await getUserProfile(uid);
  const activeJourney = await getActiveJourneyName();
  if (!activeJourney) return [];
  const allStages = await listStagesDb(activeJourney);
  const completedArr = profile.completedStages || [];
  const completedMap = profile.completedJourney || {};
  const completed = new Set([...(completedArr || []), ...Object.keys(completedMap || {})]);
  const eligible = allStages.filter(s => !completed.has(s.id) && (!Number.isFinite(s.proficiencyLevel) || s.proficiencyLevel <= (profile.level || 0)));

  let candidates = eligible;
  const worst = profile.worstCompetencies || [];
  if (worst && worst.length) {
    candidates = eligible.filter(s => (s.tags || []).some(t => worst.includes(t)));
    if (candidates.length === 0) candidates = eligible;
  }

  const resIds = Array.from(new Set(candidates.map(s => s.resource).filter(Boolean)));
  const resDocs = resIds.length ? await getDocs('resources', [{ field: 'F_ID', in: true, value: resIds }]) : [];
  const cleanResDocs = resDocs.map(res => {
    const { timestamp, ...rest } = res;
    return rest;
  })
  const resById = new Map(cleanResDocs.map(r => [r.id, r]));

  // prefer varied types
  const byType = new Map();
  for (const s of candidates) {
    const r = resById.get(s.resource);
    const type = r?.type || 'text';
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type).push({ stage: s, res: r });
  }
  const orderTypes = ['video', 'audio', 'quiz', 'text', 'negotiation'];
  const pick = [];
  for (const t of orderTypes) {
    const arr = byType.get(t) || [];
    if (arr.length) pick.push(arr.shift());
    if (pick.length >= 4) break;
  }
  // fill remaining
  if (pick.length < 4) {
    const rest = [];
    for (const [_, arr] of byType) rest.push(...arr);
    while (pick.length < 4 && rest.length) pick.push(rest.shift());
  }
  return pick.map(x => ({ ...x.stage, resourceDoc: x.res }));
}

