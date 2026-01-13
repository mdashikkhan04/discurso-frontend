import "server-only";
import { getDocs, saveDoc, getDoc, deleteDoc } from "@/lib/server/data/data";
import { getCase } from "@/lib/server/data/cases";
import { getEvent } from "@/lib/server/data/events";
import { getScore } from "@/lib/scoreFuncUtil";
import { calculateProficiencyScores } from "@/lib/server/data/profiles";


async function updateUserProfileScores(participants) {
  try {
    if (participants && Array.isArray(participants)) {
      const updatePromises = participants.map(participantId =>
        calculateProficiencyScores(participantId).catch(error => {
          console.warn(`Failed to update proficiency scores for participant ${participantId}:`, error);
        })
      );
      Promise.all(updatePromises).catch(() => { _ });
    }
  } catch (error) {
    console.warn("Failed to update proficiency scores:", error);
  }
}

async function getResultById(resultId) {
  const resultDoc = await getDoc(resultId, "results");
  return resultDoc;
}

export async function getResult(eventId, participantId, round, teamId) {
  let filters = [{ field: "eventId", value: eventId }];
  if (teamId) {
    filters.push({ field: "team", value: teamId });
  } else if (participantId) {
    filters.push({ field: "participants", value: participantId, contains: true });
  }
  if (round) {
    filters.push({ field: "round", value: round });
  }
  const resultDocs = await getDocs("results", filters);
  if (resultDocs.length > 0) {
    let resultDoc = resultDocs[0];
    if (resultDoc.survey) {
      //convert all 0 vals to ""
      for (let key in resultDoc.survey) {
        if (resultDoc.survey[key] === 0) {
          resultDoc.survey[key] = "";
        }
      }
    }
    return resultDocs[0];
  }
  return {};
}

export async function getResultMinMaxRange(caseId) {
  let results = await getDocs("results", [
    {
      field: "caseId",
      value: caseId,
    },
  ], "agreement");
  return results
}

export async function getResultsByCaseId(caseId, roundIndex) {// TODO needs fixing?
  let results = await getDocs("results", [
    {
      field: "caseId",
      value: caseId,
    },
  ]);
  const eventIds = [...new Set(results.map(result => result.eventId))];
  // console.log("eventIds", eventIds);
  // return;
  // object with eventId as key and event object as value
  const events = await Promise.all(eventIds.map(eventId => getEvent(eventId)));
  // console.log("events", Object.keys(events).length, "results", results.length);
  // object with eventId as key and arr of results with matching eventId as value
  // const resultsByEvent = {};
  // for (let result of results) {
  //   if (!resultsByEvent[result.eventId]) resultsByEvent[result.eventId] = [];
  //   resultsByEvent[result.eventId].push(result);
  // }
  // const allResults = [];
  // for (let results of )
  // let enrichedResults = await enrichResults(results, event, roundIndex);
  // return enrichedResults;
}

export async function getResults(eventId, event, roundIndex) {
  let results = await getDocs("results", [
    {
      field: "eventId",
      value: eventId,
    },
  ]);
  let enrichedResults = await enrichResults(results, event, roundIndex);
  return enrichedResults;
}

export async function deleteResult(resultId) {
  const bDeleted = await deleteDoc(resultId, "results");
  return bDeleted;
}

export async function deleteResultsByEventId(eventId) {
  const results = await getDocs("results", [{ field: "eventId", value: eventId }]);
  await Promise.all(results.map(result => deleteDoc(result.id, "results")));
  return results.length;
}

export async function saveResult(result, eventId, participantId, overwrite, teamId, overriden) {
  if (overwrite) {
    if (result.vsAI) { // ugliest 'fix' :(
      result.team = result.opponent.split("-")[1];
      const { disqualified, ...rest } = result;
      result = rest;
    }
    const existingResult = result.id ? await getResultById(result.id) : {};
    const orgResult = { ...existingResult, ...result };
    const incomingAgreement = Object.prototype.hasOwnProperty.call(result, "agreement") ? result.agreement : undefined;
    const incomingSurvey = Object.prototype.hasOwnProperty.call(result, "survey") ? result.survey : undefined;

    if (incomingAgreement !== undefined) {
      orgResult.agreement = incomingAgreement === null
        ? existingResult.agreement || {}
        : cleanUpValues(incomingAgreement);
    } else if (existingResult.agreement !== undefined && orgResult.agreement === undefined) {
      orgResult.agreement = existingResult.agreement;
    } else if (orgResult.agreement === undefined) {
      orgResult.agreement = {};
    }

    if (incomingSurvey !== undefined) {
      orgResult.survey = incomingSurvey === null
        ? existingResult.survey || {}
        : cleanUpValues(incomingSurvey);
    } else if (existingResult.survey !== undefined && orgResult.survey === undefined) {
      orgResult.survey = existingResult.survey;
    } else if (orgResult.survey === undefined) {
      orgResult.survey = {};
    }

    if (result.madeDeal !== undefined && result.madeDeal !== null) {
      orgResult.madeDeal = result.madeDeal
      orgResult.final = result.final
    }
    const resultId = await saveDoc(orgResult, "results");

    if (orgResult.final && orgResult.participants) {
      updateUserProfileScores(orgResult.participants);
    }

    return resultId;
  }
  let oEvent = await getEvent(eventId);
  const hasIncomingAgreement = Object.prototype.hasOwnProperty.call(result, "agreement");
  const hasIncomingSurvey = Object.prototype.hasOwnProperty.call(result, "survey");
  const incomingAgreementValue = hasIncomingAgreement ? result.agreement : undefined;
  const incomingSurveyValue = hasIncomingSurvey ? result.survey : undefined;
  const incomingMadeDealValue = Object.prototype.hasOwnProperty.call(result, "madeDeal") ? result.madeDeal : undefined;
  const shouldPreserveAgreement = (!hasIncomingAgreement || incomingAgreementValue === null) && incomingMadeDealValue !== false;
  const shouldPreserveSurvey = !hasIncomingSurvey || incomingSurveyValue === null;
  let isFinal = result.final || (result.survey ? (Object.keys(result.survey).length ? true : false) : false);
  let resolvedTeamId;
  if (teamId) {
    resolvedTeamId = teamId;
  } else if (participantId) {
    resolvedTeamId = oEvent.participants.find(participant => participant.id === participantId)?.team;
  }
  let currentRound = oEvent.currentRound || oEvent.rounds.length;
  if (overriden) {
    if (!currentRound) currentRound = oEvent.rounds.length;
    if (currentRound > 1) currentRound = currentRound - 1;
  }
  let roundEndTime = oEvent.rounds[currentRound - 1].endTime;
  let isAfterRoundEnd = Date.now() > roundEndTime;
  let storedResult = await getResult(eventId, null, currentRound, resolvedTeamId);
  let hasStoredResult = storedResult.id;
  if (hasStoredResult) {
    result.id = storedResult.id;
    if (storedResult.madeDeal !== null && storedResult.madeDeal !== undefined) {
      result.madeDeal = storedResult.madeDeal
    }
    if (storedResult.final) {
      result.agreement = storedResult.agreement;
    }
  }
  if (isAfterRoundEnd) {
    if (hasStoredResult) {
      result.agreement = storedResult.agreement;
      result.survey = storedResult.survey;
      result.comment = storedResult.comment;
      isFinal = storedResult.final;
      resolvedTeamId = storedResult.team;
      result.madeDeal = storedResult.madeDeal;
    } else if (!overriden) {
      result.agreement = {};
      result.survey = {};
      result.comment = "";
      // bFinal = true;
    }
  }
  if (participantId) {
    if (!resolvedTeamId) resolvedTeamId = oEvent.participants.find(participant => participant.id === participantId)?.team;
    let teamParticipants = oEvent.teams[resolvedTeamId].participants;
    result.participants = teamParticipants;
  }
  if ((result.agreement === undefined || result.agreement === null) && shouldPreserveAgreement) {
    result.agreement = hasStoredResult
      ? (storedResult.agreement ? { ...storedResult.agreement } : {})
      : {};
  }
  if ((result.survey === undefined || result.survey === null) && shouldPreserveSurvey) {
    result.survey = hasStoredResult
      ? (storedResult.survey ? { ...storedResult.survey } : {})
      : {};
  }
  result.agreement = result.agreement ? cleanUpValues(result.agreement) : {};
  result.survey = result.survey ? cleanUpValues(result.survey) : {};
  const caseId = oEvent.rounds[currentRound - 1].case?.id || oEvent.rounds[currentRound - 1].caseId;
  const oResult = { ...result, final: isFinal, team: resolvedTeamId, caseId, round: result.round ? result.round : currentRound, eventId };
  const resultId = await saveDoc(oResult, "results");

  // Update proficiency scores if this is a final result with participants
  if (isFinal && result.participants) {
    updateUserProfileScores(result.participants);
  }

  return resultId;
}

function getTeamSide(oEvent, sTeam, iRound) {
  let matches = oEvent.matches?.[iRound - 1]?.matches || oEvent.rounds[iRound - 1].matches;
  let sSide, sEnemy;
  for (let match of matches) {
    if (match.a === sTeam) {
      sSide = "a";
      sEnemy = match.b;
      break;
    }
    if (match.b === sTeam) {
      sSide = "b";
      sEnemy = match.a;
      break;
    }
  }
  return { side: sSide, opponent: sEnemy };
}

export async function getResultsRangeByCaseId(caseId, scoreFormulaA, scoreFormulaB) {
  let results = await getDocs("results", [
    {
      field: "caseId",
      value: caseId,
    },
  ]);
  let scores = await getScores(results, scoreFormulaA, scoreFormulaB);
  let maxSumIndex = scores.a.map((a, i) => a + scores.b[i]).reduce((maxIndex, currentSum, currentIndex, arr) =>
    currentSum > arr[maxIndex] ? currentIndex : maxIndex, 0);

  let oRanges = {
    maxA: Math.max(...scores.a),
    minA: Math.min(...scores.a),
    maxB: Math.max(...scores.b),
    minB: Math.min(...scores.b),
    maxSumA: scores.a[maxSumIndex],
    maxSumB: scores.b[maxSumIndex],
  };
  return oRanges;
}

async function getScores(rawResults, scoreFormulaA, scoreFormulaB) {
  let aScores = { a: [], b: [] };
  for (let result of rawResults) {
    let aScore = getScore(scoreFormulaA, result.agreement);
    let bScore = getScore(scoreFormulaB, result.agreement);
    aScores.a.push(aScore);
    aScores.b.push(bScore);
  }
  return aScores;
}

async function enrichResults(results, event, roundIndex) {
  results = coalesceResultsByTeamAndRound(results);
  const oEvent = event || (results[0]?.eventId ? await getEvent(results[0].eventId) : null);
  let caseCache = {};
  let enrichedResults = [];
  let roundStats = {};
  if (!results.length) {
    if (!oEvent?.rounds?.length) return results;
    const targetRoundIndex = roundIndex ?? 0;
    if (!oEvent.rounds[targetRoundIndex]) return results;
    const pendingResults = await addNoShowParticipants([], oEvent, targetRoundIndex);
    return replaceTeamNamesWithParticipantNamesForAI(pendingResults, oEvent);
  }
  if (!results.length) return results;
  if (roundIndex && oEvent?.rounds?.[roundIndex]) {
    results = results.filter(result => result.round === (roundIndex + 1));
  }
  for (let result of results) {
    const { side, opponent } = getTeamSide(oEvent, result.team, result.round);
    let caseData = caseCache[result.caseId];
    if (!caseData) {
      caseData = await getCase(result.caseId);
      caseCache[result.caseId] = caseData;
    }
    result.relWeight = caseData.relationRatio[0];
    let agreement = result.agreement;
    if (!Object.keys(agreement).length) result.madeDeal = false;
    let agreeStats = {
      aScore: getScore(caseData.scoreFormulaA, agreement),
      bScore: getScore(caseData.scoreFormulaB, agreement),
    };
    let survey = result.survey;
    if (!result.madeDeal) result.disqualified = true;
    let surveyStats = {
      instrumental: getAverage([survey.satisfaction, survey.balance, 8 - survey.forfeited, survey.legitimacy]),
      self: getAverage([8 - survey.loseFace, survey.competence, survey.principles, survey.selfImage]),
      process: getAverage([survey.listened, survey.fairness, survey.ease, survey.considered]),
      relationship: getAverage([survey.impression, survey.relationshipSatisfaction, survey.trust, survey.futureRelationship]),
    };
    surveyStats.global = getAverage(Object.values(surveyStats || {}));
    surveyStats.processAndRelationship = getAverage([surveyStats.process, surveyStats.relationship]);
    result.hasSvi = surveyStats.processAndRelationship !== null && surveyStats.processAndRelationship !== 0;
    let enriched = { ...result, agreeStats, surveyStats, side, opponent };
    enrichedResults.push(enriched);

    if (!roundStats[result.round]) roundStats[result.round] = { round: result.round };
    if (!roundStats[result.round][side]) roundStats[result.round][side] = { side: side };
    if (!roundStats[result.round][side].prScores) roundStats[result.round][side].prScores = [];
    if (!roundStats[result.round].aScores) roundStats[result.round].aScores = [];
    if (!roundStats[result.round].bScores) roundStats[result.round].bScores = [];
    if (result.hasSvi) roundStats[result.round][side].prScores.push(surveyStats.processAndRelationship);
    if (!result.disqualified) {
      roundStats[result.round].aScores.push(agreeStats.aScore);
      roundStats[result.round].bScores.push(agreeStats.bScore);
    }
  }

  for (let round in roundStats) {
    roundStats[round].vsAI = (event.rounds[round - 1].aiSide || "n") !== "n";
    if (roundStats[round].a) {
      roundStats[round].a.prMean = getAverage(roundStats[round].a.prScores);
      roundStats[round].a.prStdev = stdevP(roundStats[round].a.prScores);
    }

    if (roundStats[round].b) {
      roundStats[round].b.prMean = getAverage(roundStats[round].b.prScores);
      roundStats[round].b.prStdev = stdevP(roundStats[round].b.prScores);
    }

    roundStats[round].aScoresMean = getAverage(roundStats[round].aScores);
    roundStats[round].aScoresStdev = stdevP(roundStats[round].aScores);
    roundStats[round].bScoresMean = getAverage(roundStats[round].bScores);
    roundStats[round].bScoresStdev = stdevP(roundStats[round].bScores);
  }

  for (let res of enrichedResults) {
    res.vsAI = roundStats[res.round].vsAI;

    if (res.hasSvi) {
      res.surveyStats.prMean = roundStats[res.round][res.side].prMean;
      res.surveyStats.prStdev = roundStats[res.round][res.side].prStdev;
      res.surveyStats.prZScore = standardize(res.surveyStats.processAndRelationship, roundStats[res.round][res.side].prMean, roundStats[res.round][res.side].prStdev);
    } else {
      res.surveyStats.prMean = null;
      res.surveyStats.prStdev = null;
      res.surveyStats.prZScore = null;
    }

    if (!res.disqualified) {
      res.agreeStats.aScoreZScore = standardize(res.agreeStats.aScore, roundStats[res.round].aScoresMean, roundStats[res.round].aScoresStdev);
      res.agreeStats.bScoreZScore = standardize(res.agreeStats.bScore, roundStats[res.round].bScoresMean, roundStats[res.round].bScoresStdev);
      res.agreeStats.aScoresMean = roundStats[res.round].aScoresMean;
      res.agreeStats.aScoresStdev = roundStats[res.round].aScoresStdev;
      res.agreeStats.bScoresMean = roundStats[res.round].bScoresMean;
      res.agreeStats.bScoresStdev = roundStats[res.round].bScoresStdev;
      res.agreeStats.scoreZScore = res.side === "a" ? res.agreeStats.aScoreZScore : res.agreeStats.bScoreZScore;
      res.agreeStats.subScore = res.side === "a" ? res.agreeStats.aScoreZScore : res.agreeStats.bScoreZScore;
      res.agreeStats = {
        score: res.side === "a" ? res.agreeStats.aScore : res.agreeStats.bScore,
        scoreMean: res.side === "a" ? res.agreeStats.aScoresMean : res.agreeStats.bScoresMean,
        scoreStdev: res.side === "a" ? res.agreeStats.aScoresStdev : res.agreeStats.bScoresStdev,
        subScore: res.side === "a" ? res.agreeStats.aScoreZScore : res.agreeStats.bScoreZScore
      }
    }
  }

  for (let res of enrichedResults) {
    let opposingResult = enrichedResults.find(result => result.team === res.opponent && result.round === res.round);
    if (opposingResult && opposingResult.hasSvi) {
      res.surveyStats.relScore = opposingResult.surveyStats.prZScore;
      if (!res.disqualified && res.agreeStats.subScore !== undefined && res.agreeStats.subScore !== null) {
        res.surveyStats.totalZScore = getWeightedAverage(res.agreeStats.subScore, opposingResult.surveyStats.prZScore, res.relWeight);
      }
    } else {
      res.surveyStats.relScore = null;
      if (!res.disqualified && res.agreeStats.subScore !== undefined && res.agreeStats.subScore !== null) {
        res.surveyStats.totalZScore = res.agreeStats.subScore;
      }
    }
    if (!opposingResult?.hasSvi) res.noEnemySvi = true;
  }

  const resultsByRound = {};
  for (let result of enrichedResults) {
    if (!resultsByRound[result.round]) {
      resultsByRound[result.round] = [];
    }
    resultsByRound[result.round].push(result);
    // if(result.disqualified) console.log("Disqualified result found:", result.team, result.side);
  }

  for (const round in resultsByRound) {

    const sideAResults = resultsByRound[round].filter(result => result.side === 'a');
    const sideBResults = resultsByRound[round].filter(result => result.side === 'b');

    // Rank side A
    sideAResults.sort((a, b) => {
      if (a.disqualified === b.disqualified) {
        const aHasDealNoSvi = a.madeDeal && !a.hasSvi;
        const bHasDealNoSvi = b.madeDeal && !b.hasSvi;
        const aHasNoDeal = !a.madeDeal;
        const bHasNoDeal = !b.madeDeal;
        if (aHasDealNoSvi && bHasNoDeal) return -1;
        if (bHasDealNoSvi && aHasNoDeal) return 1;
        if (a.surveyStats.totalZScore === null || a.surveyStats.totalZScore === undefined) return 1;
        if (b.surveyStats.totalZScore === null || b.surveyStats.totalZScore === undefined) return -1;
        if (a.surveyStats.totalZScore === b.surveyStats.totalZScore) return 0;
        if (a.surveyStats.totalZScore < b.surveyStats.totalZScore) return 1;
        if (a.surveyStats.totalZScore > b.surveyStats.totalZScore) return -1;
        return 0;
      }
      return a.disqualified ? 1 : -1;
    });

    // Rank side B
    sideBResults.sort((a, b) => {
      if (a.disqualified === b.disqualified) {
        const aHasDealNoSvi = a.madeDeal && !a.hasSvi;
        const bHasDealNoSvi = b.madeDeal && !b.hasSvi;
        const aHasNoDeal = !a.madeDeal;
        const bHasNoDeal = !b.madeDeal;
        if (aHasDealNoSvi && bHasNoDeal) return -1;
        if (bHasDealNoSvi && aHasNoDeal) return 1;
        if (a.surveyStats.totalZScore === null || a.surveyStats.totalZScore === undefined) return 1;
        if (b.surveyStats.totalZScore === null || b.surveyStats.totalZScore === undefined) return -1;
        if (a.surveyStats.totalZScore === b.surveyStats.totalZScore) return 0;
        if (a.surveyStats.totalZScore < b.surveyStats.totalZScore) return 1;
        if (a.surveyStats.totalZScore > b.surveyStats.totalZScore) return -1;
        return 0;
      }
      return a.disqualified ? 1 : -1;
    });

    // Assign ranks to side A with dense ranking
    let currentRankA = 1;
    let prevScoreA = null;

    sideAResults.forEach((result) => {
      const hasDealNoSvi = result.madeDeal && !result.hasSvi;
      const hasNoDeal = !result.madeDeal;
      const bHasTotalZScore = result?.surveyStats?.totalZScore !== undefined && result?.surveyStats?.totalZScore !== null;

      if (hasNoDeal) {
        return;
      }

      if (hasDealNoSvi) {
        const normalResults = sideAResults.filter(r => r.madeDeal && r.hasSvi && r.surveyStats?.totalZScore !== undefined && r.surveyStats?.totalZScore !== null);
        const maxNormalRank = normalResults.length > 0 ? normalResults.length : 0;
        result.rank = maxNormalRank + 1;
        return;
      }

      if (bHasTotalZScore) {
        if (prevScoreA !== null && result.surveyStats.totalZScore !== prevScoreA) {
          currentRankA++;
        }

        result.rank = currentRankA;
        prevScoreA = result.surveyStats.totalZScore;
      }
    });

    // Assign ranks to side B with dense ranking
    let currentRankB = 1;
    let prevScoreB = null;

    sideBResults.forEach((result) => {
      const hasDealNoSvi = result.madeDeal && !result.hasSvi;
      const hasNoDeal = !result.madeDeal;
      const bHasTotalZScore = result?.surveyStats?.totalZScore !== undefined && result?.surveyStats?.totalZScore !== null;

      if (hasNoDeal) {
        return;
      }

      if (hasDealNoSvi) {
        const normalResults = sideBResults.filter(r => r.madeDeal && r.hasSvi && r.surveyStats?.totalZScore !== undefined && r.surveyStats?.totalZScore !== null);
        const maxNormalRank = normalResults.length > 0 ? normalResults.length : 0;
        result.rank = maxNormalRank + 1;
        return;
      }

      if (bHasTotalZScore) {
        if (prevScoreB !== null && result.surveyStats.totalZScore !== prevScoreB) {
          currentRankB++;
        }

        result.rank = currentRankB;
        prevScoreB = result.surveyStats.totalZScore;
      }
    });
  }

  enrichedResults = Object.values(resultsByRound).flat();
  enrichedResults = await addNoShowParticipants(enrichedResults, oEvent, roundIndex);
  enrichedResults = replaceTeamNamesWithParticipantNamesForAI(enrichedResults, oEvent);

  return enrichedResults;
}

function coalesceResultsByTeamAndRound(results) {
  if (!Array.isArray(results) || results.length === 0) return results || [];
  const byKey = new Map();
  for (const r of results) {
    const key = r && r.eventId && r.team && r.round ? `${r.eventId}|${r.round}|${r.team}` : null;
    if (!key) {
      const fallbackKey = `__no_key__|${r?.id || Math.random().toString(36).slice(2)}`;
      if (!byKey.has(fallbackKey)) byKey.set(fallbackKey, r);
      continue;
    }
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, r);
    } else {
      byKey.set(key, selectBestResult(current, r));
    }
  }
  return Array.from(byKey.values());
}

function selectBestResult(a, b) {
  if (!a) return b;
  if (!b) return a;
  const fieldCount = (obj) => (obj && typeof obj === 'object') ? Object.keys(obj).length : 0;
  const getTimestamp = (r) => {
    const cands = ['updatedAt', 'updated_at', 'updated', 'ts', 'timestamp', '_updatedAt', 'createdAt', 'created_at', '_createdAt'];
    for (const k of cands) {
      const v = r?.[k];
      if (typeof v === 'number') return v;
      if (v && typeof v === 'object') {
        if (typeof v._seconds === 'number') return v._seconds;
        if (typeof v.seconds === 'number') return v.seconds;
      }
    }
    return 0;
  };

  if (!!a.final !== !!b.final) return a.final ? a : b;
  const aSurveyLen = fieldCount(a.survey);
  const bSurveyLen = fieldCount(b.survey);
  if (aSurveyLen !== bSurveyLen) return aSurveyLen > bSurveyLen ? a : b;
  if (!!a.madeDeal !== !!b.madeDeal) return a.madeDeal ? a : b;
  const aAgreeLen = fieldCount(a.agreement);
  const bAgreeLen = fieldCount(b.agreement);
  if (aAgreeLen !== bAgreeLen) return aAgreeLen > bAgreeLen ? a : b;
  const aTime = getTimestamp(a);
  const bTime = getTimestamp(b);
  if (aTime !== bTime) return aTime > bTime ? a : b;
  const aId = a.id || '';
  const bId = b.id || '';
  if (aId !== bId) return aId > bId ? a : b;
  return a; // stable fallback
}

function standardize(x, mean, standardDev) {
  if (x === undefined || x === null || isNaN(x)) return 0;
  if (mean === undefined || mean === null || isNaN(mean)) return 0;
  if (standardDev === undefined || standardDev === null || isNaN(standardDev) || standardDev === 0) return 0;

  return (x - mean) / standardDev;
}

function stdevP(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return 0;
  const validValues = arr.filter(x => x !== undefined && x !== null && !isNaN(Number(x)));
  if (validValues.length === 0) return 0;
  const numericArr = validValues.map(x => Number(x));
  const mean = getAverage(numericArr);
  const variance = numericArr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericArr.length;
  return Math.sqrt(variance);
}

function getAverage(arr) {
  if (!arr?.length) return null;
  const validValues = arr
    .filter(x => x !== undefined && x !== null && !isNaN(Number(x)))
    .map(x => Number(x));
  if (validValues.length === 0) return 0;
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
}

function getWeightedAverage(a, b, weight) {
  const weightedA = a * ((100 - weight) / 100);
  const weightedB = b * (weight / 100);
  return weightedA + weightedB;
}

function cleanUpValues(obj) {
  if (!obj || typeof obj !== "object") {
    return {};
  }
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (typeof value === 'string') {
        const trimmedValue = value.trim();
        if (!isNaN(trimmedValue) && trimmedValue === String(Number(trimmedValue))) {
          const floatValue = parseFloat(trimmedValue);
          return [key, Number.isInteger(floatValue) ? parseInt(trimmedValue, 10) : floatValue];
        }
      }
      return [key, value];
    })
  );
}

async function addNoShowParticipants(richResults, oEvent, roundIndex) {
  const roundsToCheck = roundIndex !== undefined ? [roundIndex + 1] : oEvent.rounds.map((_, idx) => idx + 1);
  const noShowResults = [];
  for (const round of roundsToCheck) {
    const roundData = oEvent.rounds[round - 1];
    const roundEndTime = roundData.endTime;
    const bRoundHasEnded = roundEndTime && Date.now() > roundEndTime;
    const roundResults = richResults.filter(result => result.round === round);
    const teamsWithResults = new Set(roundResults.map(result => result.team));
    const allTeamsInRound = new Set();
    if (roundData.matches) {
      roundData.matches.forEach(match => {
        if (match.a && !match.a.startsWith('AI-')) allTeamsInRound.add(match.a);
        if (match.b && !match.b.startsWith('AI-')) allTeamsInRound.add(match.b);
      });
    } else if (oEvent.matches && oEvent.matches[round - 1]) {
      oEvent.matches[round - 1].matches?.forEach(match => {
        if (match.a && !match.a.startsWith('AI-')) allTeamsInRound.add(match.a);
        if (match.b && !match.b.startsWith('AI-')) allTeamsInRound.add(match.b);
      });
    }
    const noShowTeams = [...allTeamsInRound].filter(team => !teamsWithResults.has(team));
    for (const teamId of noShowTeams) {
      const { side, opponent } = getTeamSide(oEvent, teamId, round);
      if (side) {
        const noShowResult = {
          eventId: oEvent.id,
          team: teamId,
          round: round,
          caseId: roundData.case?.id || roundData.caseId,
          agreement: {},
          survey: {},
          agreeStats: {},
          surveyStats: {},
          comment: "",
          final: true,
          madeDeal: false,
          hasSvi: false,
          disqualified: bRoundHasEnded ? true : false,
          side: side,
          opponent: opponent,
          vsAI: (roundData.aiSide || "n") !== "n",
          participants: oEvent.teams?.[teamId]?.participants || []
        };
        if (!bRoundHasEnded) {
          noShowResult.pending = true;
        }
        noShowResults.push(noShowResult);
      }
    }
  }
  return [...richResults, ...noShowResults];
}

function replaceTeamNamesWithParticipantNamesForAI(richResults, oEvent) {
  return richResults.map(result => {
    const roundData = oEvent.rounds[result.round - 1];
    const isAIRound = (roundData.aiSide || "n") !== "n";
    if (isAIRound) {
      const teamParticipants = oEvent.teams?.[result.team]?.participants || [];
      const participant = oEvent.participants?.find(p => teamParticipants.includes(p.id));
      if (participant) {
        result.teamId = result.team;
        result.team = participant.name || participant.email || result.team;
      }
      if (result.opponent && !result.opponent.startsWith('AI-')) {
        const opponentTeamParticipants = oEvent.teams?.[result.opponent]?.participants || [];
        const opponentParticipant = oEvent.participants?.find(p => opponentTeamParticipants.includes(p.id));
        if (opponentParticipant) {
          result.opponent = opponentParticipant.name || opponentParticipant.email || result.opponent;
        }
      }
    }
    return result;
  });
}
