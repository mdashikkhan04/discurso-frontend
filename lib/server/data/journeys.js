import "server-only";
import { getDocs, saveDoc, deleteDoc } from "@/lib/server/data/data";

const STAGES = "journeys";
const META = "journeys_meta";

export async function listStages(journeyName) {
  let stages;
  if (journeyName) {
    stages = await getDocs(STAGES, [{ field: "journey", value: journeyName }]);
  } else {
    stages = await getDocs(STAGES);
  }
  stages = stages.map(stage => {
    const { timestamp, ...rest } = stage;
    return rest;
  });
  return stages;
}

export async function saveStage(stage) {
  if (!stage?.journey) throw new Error("Journey name required");
  if (!stage?.resource) throw new Error("Main resource ID required");
  const now = Date.now();
  const base = { createdAt: stage.createdAt || now, updatedAt: now };
  let doc = { ...stage, ...base };
  if (!Number.isFinite(stage.order)) {
    const stages = await listStages(stage.journey);
    const maxOrder = Math.max(0, ...stages.map(s => Number.isFinite(s.order) ? s.order : 0));
    doc.order = maxOrder + 1;
  }
  const id = await saveDoc(doc, STAGES);
  return id;
}

export async function deleteStage(stageId) {
  if (!stageId) return false;
  return await deleteDoc(stageId, STAGES);
}

export async function getActiveJourneyName() {
  const docs = await getDocs(META, [{ field: "id", value: "active" }]);
  const active = (docs && docs[0]) || null;
  return active?.journey || "default";
}

export async function setActiveJourney(name) {
  if (!name) throw new Error("Journey name required");
  await saveDoc({ id: "active", journey: name, updatedAt: Date.now() }, META);
  return true;
}

export async function getJourneysSummary() {
  const stages = await listStages();
  const active = await getActiveJourneyName();
  const map = new Map();
  for (const s of stages) {
    const j = s.journey || "";
    map.set(j, (map.get(j) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, count]) => ({ name, count, active: name === active }));
}
