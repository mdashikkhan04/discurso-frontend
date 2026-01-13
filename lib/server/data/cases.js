import "server-only";
import { getDocs, saveDoc, deleteDoc, getDoc, updateDoc } from "@/lib/server/data/data";

export async function getCase(caseId) {
  const caseDoc = await getDoc(caseId, "cases");
  return caseDoc;
}

export async function getCasesForEventEditor(caseIds) {
  if (!caseIds || !caseIds.length) return {};
  const cases = await getDocs(
    "cases",
    [
      {
        field: "F_ID",
        in: true,
        value: caseIds,
      },
    ],
    ["title", "aName", "bName"],
  );
  const slimCases = {};
  cases.forEach((c) => {
    slimCases[c.id] = {
      title: c.title,
      aName: c.aName,
      bName: c.bName,
    }
  });
  return slimCases;
}

export async function getAllCases(ai) {
  let filters = [];
  const bAI = ai !== undefined && ai !== null;
  if (ai) {
    filters.push({
      field: "ai",
      value: "n",
      not: ai,
    });
  }
  let cases = await getDocs("cases", filters.length ? filters : null);
  if (bAI) cases = cases.filter(c => !c.isDraft);
  return cases;
}

export async function saveCaseInterest(caseId, interest, side) {
  const updatedCaseId = await updateDoc(caseId, {
    [`${side}Interest`]: interest
  }, "cases");
  return updatedCaseId;
}

export async function saveCase(caseDoc) {
  const caseId = await saveDoc(caseDoc, "cases");
  return caseId;
}

export async function deleteCase(caseId) {
  const deleted = await deleteDoc(caseId, "cases");
  return deleted;
}
