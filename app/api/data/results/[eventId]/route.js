import "server-only";

import { getResults, saveResult, deleteResult, getResultsRangeByCaseId } from "@/lib/server/data/results";
import { getEvent } from "@/lib/server/data/events";
import { getCase } from "@/lib/server/data/cases";
// import { getUserRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";
import { getFeedbacksData } from "@/actions/feedbacks";

export async function GET(req, { params }) {
  try {
    const { isAllowed } = await isAccessAllowed(req, ["instructor"]);
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const oEvent = await getEvent(eventId);
    const currRound = oEvent.currentRound;
    const oCurrRound = currRound ? oEvent.rounds[currRound - 1] : null;
    const agreementsTotal = oEvent.finished ? 0 : currRound ? ((oEvent.matches ? oEvent.matches[currRound - 1].matches.length : oEvent.rounds[currRound - 1].matches.length) * (oCurrRound ? (oCurrRound.aiSide !== "n" ? 1 : 2) : 0)) : 0;
    const caseIds = [];
    const rounds = {};

    for (let idx = 0; idx < oEvent.rounds.length; idx++) {
      const round = oEvent.rounds[idx];
      const roundNo = idx + 1;

      caseIds.push(round.case?.id || round.caseId);

      let feedbackData;
      try {
        feedbackData = round.aiRound
          ? await getFeedbacksData(oEvent, idx)
          : null;
      } catch (er) {
        console.warn(er);
      }

      rounds[roundNo] = {
        ...round,
        feedbackSumm: round.feedbackSumm?.text,
        feedbackData: feedbackData?.feedbackData || null,
      };
    }
    const fullCases = await Promise.all(
      caseIds.map(async (caseId) => {
        const acase = await getCase(caseId);
        const ranges = await getResultsRangeByCaseId(acase.id, acase.scoreFormulaA, acase.scoreFormulaB);
        return { ...acase, ranges };
      })
    );

    const cases = fullCases.reduce((acc, acase) => {
      let params = acase.params.reduce((acc, param) => {
        acc[param.id] = { dataType: param.dataType, name: param.name, listItems: param.listItems };
        return acc;
      }, {})
      acc[acase.id] = {
        aName: acase.aName,
        bName: acase.bName,
        params,
        maxScoreA: acase.ranges.maxA,
        maxScoreB: acase.ranges.maxB,
        minScoreA: acase.ranges.minA,
        minScoreB: acase.ranges.minB,
        maxSumA: acase.ranges.maxSumA,
        maxSumB: acase.ranges.maxSumB,
        scorable: acase.scorable
      };
      return acc;
    }, {})
    const results = (await getResults(eventId, oEvent)).filter(res => (!res.team.startsWith("AI-")));
    // console.log("results.length", results?.length);
    // const results = await getResults(eventId, oEvent);
    // const minMaxResRanges = await Promise.all(caseIds.map(getResultMinMaxRange));
    const teams = Object.entries(oEvent.teams).reduce((acc, [teamId, team]) => {
      acc[teamId] = oEvent.participants.filter(participant => participant.team === teamId);
      return acc;
    }, {});
    return NextResponse.json({ results, teams, agreementsTotal, rounds, cases }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { isAllowed } = await isAccessAllowed(req, ["instructor"]);
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { result } = await req.json();
    // console.log("results POST data", result);
    if (result.delete) {
      const bDeleted = await deleteResult(result.id);
      if (!bDeleted) throw new Error("Failed to delete result");
      return NextResponse.json({ data: bDeleted }, { status: 200 });
    } else {
      const resultId = await saveResult(result, null, null, true);
      // console.log("newResultsId", newResultsId);

      return NextResponse.json({ data: resultId }, { status: 200 });
    }
  } catch (error) {
    console.error("Error updating results:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// export async function DELETE(req) {
//   try {
//     const { isAllowed } = await isAccessAllowed(req, ["instructor"]);
//     if (!isAllowed) {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     // console.log("results POST eventId", eventId);
//     const { resultId } = await req.json();
//     // console.log("results POST data", result);
//     const bDeleted = await deleteResult(resultId);
//     // console.log("newResultsId", newResultsId);
//     if (!bDeleted) throw new Error("Failed to delete result");
//     return NextResponse.json({ data: resultId }, { status: 200 });
//   } catch (error) {
//     console.error("Error saving event round results:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }