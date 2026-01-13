import "server-only";

import { getEvent } from "@/lib/server/data/events";
import { getCase } from "@/lib/server/data/cases";
import { getResult, saveResult } from "@/lib/server/data/results";
import { NextResponse } from "next/server";
import { isAccessAllowed } from "@/lib/server/api-utils";
import {
  getNegMessages,
  getFeedback,
  getNegId,
} from "@/lib/server/data/practice";
import { getFeedbackLabels } from "@/lib/server/data/ai";

const pickCaseInstructions = (acase, language) => {
  if (!acase?.instructions) return null;

  const defaultLang = acase.defaultLang || "en";
  const normalizedLang = language?.toLowerCase();
  const source = acase.instructions;

  return (
    source[normalizedLang] ||
    source[defaultLang] ||
    source.en ||
    null
  );
};

async function getRoundsData(event, participantId) {
  const eventId = event.id;
  const aRounds = await Promise.all(
    event.rounds.map(async (round) => {
      const oCase = await getCase(round.caseId);
      const selectedInstructions = pickCaseInstructions(oCase, round.language);
      if (selectedInstructions) {
        oCase.generalInstruct = selectedInstructions.general ?? oCase.generalInstruct;
        oCase.aInstruct = selectedInstructions.partyA ?? oCase.aInstruct;
        oCase.bInstruct = selectedInstructions.partyB ?? oCase.bInstruct;
      }
      const caseLanguage = round.language || oCase.defaultLang || "en";
      const aiSide = round.aiSide || "n";
      const bVsAI = aiSide !== "n";
      const { enemy, own, teamMatch } = getTeams(
        event,
        participantId,
        oCase,
        round.round,
        bVsAI
      );
      let negId,
        feedback,
        messages = [];
      if (bVsAI) {
        const negIdAndMgs = await getNegMessages(
          eventId,
          own,
          round.round
        );
        negId = negIdAndMgs.negId;
        messages = negIdAndMgs.messages;
        feedback = await getFeedback(negId);
      } else {
        const negIdAndMgs = await getNegMessages(
          eventId,
          own,
          round.round,
          false,
          enemy.team
        );
        negId = negIdAndMgs.negId;
        messages = negIdAndMgs.messages;
      }
      const roundResults = await getResult(eventId, participantId, round.round);
      return {
        round: round.round,
        vsAI: bVsAI,
        feedback,
        messages,
        results: roundResults,
        enemy,
        ownTeam: own,
        case: {
          caseTitle: oCase.title,
          language: caseLanguage,
          gender: oCase.gender || "female",
          generalInstructions: oCase.generalInstruct,
          partyInstructions: enemy?.team?.side
            ? enemy?.team?.side === "a"
              ? oCase.bInstruct
              : oCase.aInstruct
            : "",
          params: oCase.params.map((param) => ({ ...param, value: "" })),
          opponent: enemy.team.sideName,
        },
        inAppChat: round.inAppChat,
      };
    })
  );
  aRounds.sort((a, b) => a.round - b.round);
  // console.log("getRoundsData aRounds", aRounds);
  return aRounds;
}

export async function GET(req, { params }) {
  try {
    const { isAllowed } = await isAccessAllowed(req, ["negotiator"]);
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    //
    const { eventId, participantId } = await params;
    const event = await getEvent(eventId);
    // console.log("event", event);

    // Parse round number from query string
    const { searchParams } = new URL(req.url);
    const roundParam = searchParams.get("round");
    const requestedRound = roundParam ? parseInt(roundParam, 10) : null;

    let data;
    // Use requestedRound if provided, otherwise fall back to event.currentRound or last round
    const currentRound =
      requestedRound ||
      event.currentRound ||
      event.rounds[event.roundsCount - 1].round;
    const timeNow = Date.now();
    if (!currentRound)
      return NextResponse.json({ message: "not-started" }, { status: 200 });
    const oRound = event.rounds[currentRound - 1];
    // If user requested a specific round and it hasn't started yet, return 403
    if (requestedRound && oRound && oRound.viewTime > timeNow) {
      return NextResponse.json(
        { error: "Round has not started yet" },
        { status: 403 }
      );
    }
    if (!oRound) {
      const rounds = await getRoundsData(event, participantId);
      const bHasFeedbacks = rounds.some((round) => round.feedback);
      const data = {
        eventEnded: true,
        feedbackLabels: bHasFeedbacks ? getFeedbackLabels() : null,
        event: { title: event.title },
        survey: getRoundSurvey(),
        rounds,
      };
      return NextResponse.json({ data }, { status: 200 });
    }
    const acase = await getCase(oRound.case?.id || oRound.caseId);
    const instructions = pickCaseInstructions(acase, oRound.language);
    if (instructions) {
      acase.generalInstruct = instructions.general ?? acase.generalInstruct;
      acase.aInstruct = instructions.partyA ?? acase.aInstruct;
      acase.bInstruct = instructions.partyB ?? acase.bInstruct;
    }
    const caseLanguage = oRound.language || acase.defaultLang || "en";
    const aiSide = oRound?.aiSide || "n";
    const bVsAI = aiSide !== "n";
    const bRequiresSVI = (acase.relationRatio[0] ?? 0) > 0;
    if (event.rounds[currentRound - 1].startTime < timeNow) {
      const { enemy, own } = getTeams(
        event,
        participantId,
        acase,
        currentRound,
        bVsAI
      );
      // console.log("teams", own, enemy);
      let negId,
        stats,
        feedback,
        aiParams,
        messages = [];
      const negIdAndMgs = await getNegMessages(
        eventId,
        own,
        currentRound,
        bVsAI,
        enemy.team,
      );
      negId = negIdAndMgs.negId;
      messages = negIdAndMgs.messages;
      if (bVsAI) {
        if (messages.length) stats = messages[messages.length - 1].stats;
        feedback = await getFeedback(negId);
        aiParams = oRound.aiParams;
      }
      const roundResults = await getResult(
        eventId,
        participantId,
        currentRound
      );
      const bHasResults = Object.keys(roundResults?.agreement || {}).length > 0;
      let enemyResults;
      if (enemy?.participants?.length)
        enemyResults = await getResult(
          eventId,
          enemy.participants[0].id,
          currentRound
        );
      const bHasEnemyResults =
        Object.keys(enemyResults?.agreement || {}).length > 0;
      if (bHasResults) {
        const agreementConflict = acase.agreeMatch
          ? bHasEnemyResults
            ? !hasSameAgreedVals(roundResults, enemyResults)
            : false
          : false;
        roundResults.agreementConflict = agreementConflict;
      }
      if (
        bHasEnemyResults &&
        (roundResults?.madeDeal === null ||
          roundResults?.madeDeal === undefined)
      ) {
        if (
          enemyResults.madeDeal !== null &&
          enemyResults.madeDeal !== undefined
        )
          roundResults.madeDeal = enemyResults.madeDeal;
      }
      data = {
        vsAI: bVsAI,
        negId,
        messages,
        stats,
        feedback,
        feedbackLabels: feedback ? getFeedbackLabels() : null,
        aiParams,
        event: {
          title: event.title,
          currentRound: currentRound,
          roundsCount: event.roundsCount,
          started: true,
          roundEndTime: event.roundEndTime,
        },
        case: {
          caseTitle: acase.title,
          caseId: acase.id,
          language: caseLanguage,
          gender: acase.gender || "female",
          generalInstructions: acase.generalInstruct,
          partyInstructions: enemy?.team?.side
            ? enemy?.team?.side === "a"
              ? acase.bInstruct
              : acase.aInstruct
            : "",
          params: acase.params.map((param) => ({ ...param, value: "" })),
          scorable: acase.scorable,
          opponent: enemy.team.sideName,
        },
        enemy,
        ownTeam: own,
        survey: getRoundSurvey(),
        results: roundResults,
        finished: event.rounds[currentRound - 1].endTime < timeNow,
        requiresSVI: bRequiresSVI,
        inAppChat: oRound.inAppChat,
      };
    } else if (event.viewTime <= timeNow) {
      const { enemy, own } = getTeams(
        event,
        participantId,
        acase,
        currentRound,
        bVsAI
      );
      data = {
        vsAI: bVsAI,
        event: {
          title: event.title,
        },
        enemy,
        ownTeam: own,
        preview: true,
      };
    } else if (event.viewTime > timeNow && currentRound > 1) {
      const prevCurrRound = currentRound - 1;
      const oPrevRound = event.rounds[prevCurrRound - 1];
      const aPrevCase = await getCase(oPrevRound.caseId);
      const prevInstructions = pickCaseInstructions(aPrevCase, oPrevRound.language);
      if (prevInstructions) {
        aPrevCase.generalInstruct = prevInstructions.general ?? aPrevCase.generalInstruct;
        aPrevCase.aInstruct = prevInstructions.partyA ?? aPrevCase.aInstruct;
        aPrevCase.bInstruct = prevInstructions.partyB ?? aPrevCase.bInstruct;
      }

      const aiPrevSide = oPrevRound?.aiSide || "n";
      const bPrevVsAI = aiPrevSide !== "n";
      const { enemy, own } = getTeams(
        event,
        participantId,
        aPrevCase,
        prevCurrRound,
        bPrevVsAI
      );
      const negId = await getNegId(eventId, own.team, prevCurrRound, enemy.team);
      const feedback = await getFeedback(negId);
      const prevRoundResults = await getResult(
        eventId,
        participantId,
        prevCurrRound
      );
      data = {
        finished: true,
        vsAI: bPrevVsAI,
        event: {
          title: event.title,
        },
        case: {
          caseTitle: aPrevCase.title,
          caseId: aPrevCase.id,
          gender: aPrevCase.gender || "female",
          generalInstructions: aPrevCase.generalInstruct,
          partyInstructions: enemy?.team?.side
            ? enemy?.team?.side === "a"
              ? aPrevCase.bInstruct
              : aPrevCase.aInstruct
            : "",
          opponent: enemy.team.sideName,
          params: aPrevCase.params.map((param) => ({ ...param, value: "" })),
        },
        results: prevRoundResults,
        enemy,
        ownTeam: own,
        pastView: true,
        feedback,
        feedbackLabels: feedback ? getFeedbackLabels() : null,
        negId,
        survey: getRoundSurvey(),
        requiresSVI: bRequiresSVI,
      };
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const { isAllowed } = await isAccessAllowed(req, ["negotiator"]);
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let { participantId, eventId } = await params;

    let { data } = await req.json();
    // return NextResponse.json({ data: "huehue" }, { status: 200 });
    const resultId = await saveResult(data, eventId, participantId);
    return NextResponse.json({ data: resultId }, { status: 200 });
  } catch (error) {
    console.error("Error saveing new case data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

function getTeams(event, participantId, acase, roundNo, vsAI) {
  // console.log("getTeams", roundNo, vsAI, participantId);
  const ownParticipant = event.participants.find(
    (user) => user.id === participantId
  );
  const ownTeamId = ownParticipant?.team;
  // console.log("ownTeamId", ownTeamId);
  if (!ownTeamId) return null;

  const roundIndex = isNaN(roundNo) || !roundNo ? (roundNo || 1) - 1 : roundNo - 1;

  // check if the participant is included in this round
  const isParticipantInRound = (participant, roundIdx) => {
    const rounds = participant.rounds;
    if (rounds === null || rounds === undefined) return true; // null/undefined means all rounds
    return Array.isArray(rounds) && rounds.includes(roundIdx);
  };

  // check if current participant is in this round
  if (!isParticipantInRound(ownParticipant, roundIndex)) {
    return null; // Participant is skipped for this round
  }

  // const ownTeamId = ownTeam.id;
  //find opposing team in event.matches using ownTeam and event.currentRound
  let match, teamMatch;
  if (event.matches) {
    match = oRound.matches.find(
      (match) =>
        match.round ===
        (isNaN(roundNo) || !roundNo ? event.currentRound : roundNo) &&
        // (match) => match.round === 1 &&
        match.matches.some(
          (pair) => pair.a === ownTeamId || pair.b === ownTeamId
        )
    );
    // console.log("match", match);
    if (!match) return null;
    teamMatch = match.matches.find(
      (pair) => pair.a === ownTeamId || pair.b === ownTeamId
    );
    // console.log("teamMatch", teamMatch);
  } else {
    // console.log("roundIndex", roundIndex);
    //   console.log(event.rounds[roundIndex]);
    const oRound = event.rounds[roundIndex];
    match = oRound.matches.find(
      (match) => match.a === ownTeamId || match.b === ownTeamId
    );
    teamMatch = match;
    // console.log("teamMatch", teamMatch);
    if (!teamMatch) return null;
  }

  // console.log("teamMatch", teamMatch);

  const ownSide = teamMatch?.a === ownTeamId ? "a" : "b";
  const oTeams = {
    enemy: false,
    own: {
      team: ownTeamId,
      sideName: ownSide === "a" ? acase.aName : acase.bName,
      side: ownSide,
    },
  };

  // console.log("teamMatch", teamMatch);
  oTeams.enemy = {
    team: {
      id: ownSide === "a" ? teamMatch.b : teamMatch.a,
      side: ownSide === "a" ? "b" : "a",
      sideName: ownSide === "a" ? acase.bName : acase.aName,
    },
    participants: [],
  };
  // console.log("enemyTeam", oTeams);
  if (vsAI) {
    return oTeams;
  }

  // filter participants by round inclusion
  const enemies = event.participants.filter(
    (user) => user.team === oTeams.enemy.team.id && isParticipantInRound(user, roundIndex)
  );
  const teammates = event.participants.filter(
    (user) => user.team === ownTeamId && isParticipantInRound(user, roundIndex)
  );
  oTeams.enemy = { ...oTeams.enemy, participants: enemies };
  oTeams.own.participants = teammates;
  // console.log("enemies", enemies);
  return oTeams;
}

function hasSameAgreedVals(results, enemyResults) {
  // console.log("hasSameAgreedVals", results.agreement, enemyResults.agreement);
  if (results.agreement) {
    const keys = Object.keys(results.agreement);
    for (const key of keys) {
      if (results.agreement[key] !== enemyResults.agreement[key]) return false;
    }
  }
  return true;
}

function getRoundSurvey() {
  return [
    {
      label:
        "How satisfied are you with your own outcome—i.e., the extent to which the terms of your agreement (or lack of agreement) benefit you?",
      fieldName: "satisfaction",
      tip: "Answer on scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
      minDesc: "Not at all",
      maxDesc: "Perfectly",
    },
    {
      label:
        "How satisfied are you with the balance between your own outcome and your counterpart’s outcome?",
      fieldName: "balance",
      tip: "Answer on scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
      minDesc: "Not at all",
      maxDesc: "Perfectly",
    },
    {
      label: "Did you feel like you forfeited or “lost” in this negotiation?",
      fieldName: "forfeited",
      tip: "Answer on scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Totally'",
      minDesc: "Not at all",
      maxDesc: "Totally",
    },
    {
      label:
        "Do you think the terms of your agreement are consistent with principles of legitimacy or objective criteria (e.g., common standards of fairness, precedent, industry practice, legality, etc.)?",
      fieldName: "legitimacy",
      tip: "Answer on scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
      minDesc: "Not at all",
      maxDesc: "Perfectly",
    },
    {
      label:
        "Did you “lose face” (i.e., damage your sense of pride) in the negotiation?",
      fieldName: "loseFace",
      tip: "Answer on scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Totally'",
      minDesc: "Not at all",
      maxDesc: "Totally",
    },
    {
      label:
        "Did this negotiation make you feel more or less competent as a negotiator?",
      fieldName: "competence",
      tip: "Answer on scale of 1 to 7, where 1 means 'It made me feel less competent' and 7 means 'It made me feel more competent'",
      minDesc: "It made me feel less competent",
      maxDesc: "It made me feel more competent",
    },
    {
      label: "Did you behave according to your own principles and values?",
      fieldName: "principles",
      tip: "Answer on scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
      minDesc: "Not at all",
      maxDesc: "Perfectly",
    },
    {
      label:
        "Did this negotiation positively or negatively impact your self-image or your impression of yourself?",
      fieldName: "selfImage",
      tip: "Answer on scale of 1 to 7, where 1 means 'It negatively impacted my self-image' and 7 means 'It positively impacted my self-image'",
      minDesc: "It negatively impacted my self-image",
      maxDesc: "It positively impacted my self-image",
    },
    {
      label: "Do you feel your counterpart listened to your concerns?",
      fieldName: "listened",
      tip: "Answer on scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
      minDesc: "Not at all",
      maxDesc: "Perfectly",
    },
    {
      label: "Would you characterize the negotiation process as fair?",
      fieldName: "fairness",
      tip: "Answer on scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
      minDesc: "Not at all",
      maxDesc: "Perfectly",
    },
    {
      label:
        "How satisfied are you with the ease (or difficulty) of reaching an agreement?",
      fieldName: "ease",
      tip: "Answer on scale of 1 to 7, where 1 means 'Not satisfied at all' and 7 means 'Perfectly satisfied'",
      minDesc: "Not satisfied at all",
      maxDesc: "Perfectly satisfied",
    },
    {
      label: "Did your counterpart consider your wishes, opinions, or needs?",
      fieldName: "considered",
      tip: "Answer on scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
      minDesc: "Not at all",
      maxDesc: "Perfectly",
    },
    {
      label:
        "What kind of “overall” impression did your counterpart make on you?",
      fieldName: "impression",
      tip: "Answer on scale of 1 to 7, where 1 means 'Extremely negative' and 7 means 'Extremely positive'",
      minDesc: "Extremely negative",
      maxDesc: "Extremely positive",
    },
    {
      label:
        "How satisfied are you with your relationship with your counterpart as a result of this negotiation?",
      fieldName: "relationshipSatisfaction",
      tip: "Answer on scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
      minDesc: "Not at all",
      maxDesc: "Perfectly",
    },
    {
      label: "Did the negotiation make you trust your counterpart?",
      fieldName: "trust",
      tip: "Answer on scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
      minDesc: "Not at all",
      maxDesc: "Perfectly",
    },
    {
      label:
        "Did the negotiation build a good foundation for a future relationship with your counterpart?",
      fieldName: "futureRelationship",
      tip: "Answer on scale of 1 to 7, where 1 means 'Not at all' and 7 means 'Perfectly'",
      minDesc: "Not at all",
      maxDesc: "Perfectly",
    },
  ];
}
