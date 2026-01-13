import "server-only";
import { getDocs, saveDoc } from "@/lib/server/data/data";
import { getUser } from "@/lib/server/auth";
import { getCase } from "@/lib/server/data/cases";
import { getEvent } from "@/lib/server/data/events";
import { getScore } from "@/lib/scoreFuncUtil";

const COMPETENCIES = [
    "empathy",
    "trustAndRelationshipBuilding",
    "strategicAdaptability",
    "qualityOfExpression",
    "postSettlementSettlements",
    "activeListeningAndQuestioning",
    "usingObjectiveCriteria",
    "managingEmotions",
    "generatingCreativeOptions",
    "understandingInterestsAndOptions",
    "searchingForTradeOffs",
    "settingTheStage",
    "managingConcessions",
    "makingTheFirstOffer",
    "ethics",
] as const;

const FEEDBACK_TO_COMPETENCY: Record<string, typeof COMPETENCIES[number]> = {
    expressionQuality: "qualityOfExpression",
    activeParticipation: "activeListeningAndQuestioning",
    managingEmotions: "managingEmotions",
    understandingValues: "understandingInterestsAndOptions",
    stageSetting: "settingTheStage",
    makingFirstOffer: "makingTheFirstOffer",
    managingConcessions: "managingConcessions",
    searchingTradeOffs: "searchingForTradeOffs",
    generatingOptions: "generatingCreativeOptions",
    objectiveCriteria: "usingObjectiveCriteria",
    postSettlement: "postSettlementSettlements",
    strategicAdapt: "strategicAdaptability",
    trustAndRelation: "trustAndRelationshipBuilding",
    moralWisdom: "ethics",
    empathy: "empathy",
};

export interface UserProfile {
    id: string;
    userId: string;
    nickname?: string;
    avatarUrl?: string;
    level: number;
    points: number;
    streak: number;
    friends_count: number;
    dateOfJoining: number;
    lastLoginAt?: number;
    proficiencyScores: {
        relational: number;
        substantive: number;
        competency: number;
        total: number;
        overallProficiency?: number;
    };
    percentiles: {
        substantive: number;
        relational: number;
    };
    competencyAverages: {
        empathy: number;
        trustAndRelationshipBuilding: number;
        strategicAdaptability: number;
        qualityOfExpression: number;
        postSettlementSettlements: number;
        activeListeningAndQuestioning: number;
        usingObjectiveCriteria: number;
        managingEmotions: number;
        generatingCreativeOptions: number;
        understandingInterestsAndOptions: number;
        searchingForTradeOffs: number;
        settingTheStage: number;
        managingConcessions: number;
        makingTheFirstOffer: number;
        ethics: number;
    };
    negotiationsDone: number;
    topScore: number;
    modulesDone: number;
    currentCompetency: string;
    worstCompetencies: string[];
    completedStages?: string[];
    completedJourney?: Record<string, number>;
    lastCalculated: number;
    createdAt: number;
    updatedAt: number;
}

export interface NegotiationResult {
    userId: string;
    negId: string;
    eventId: string;
    caseId: string;
    round: number;
    side: string;
    madeDeal: boolean;
    hasSvi: boolean;
    final: boolean;
    agreeStats?: {
        score: number;
        subScore: number;
    };
    surveyStats?: {
        relScore: number;
        totalZScore: number;
        processAndRelationship: number;
    };
    feedbackScores?: Record<string, number>;
    completedAt: number;
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
    if (!userId) throw new Error("User ID is required");
    try {
        const profiles = await getDocs("profiles", [{ field: "userId", value: userId }]);
        if (profiles.length > 0) {
            return profiles[0] as UserProfile;
        }
        return await createUserProfile(userId);
    } catch (error) {
        console.error("Error getting user profile:", error);
        throw new Error("Failed to get user profile");
    }
}

export async function createUserProfile(userId: string): Promise<UserProfile> {
    if (!userId) throw new Error("User ID is required");
    const oUser = await getUser(userId);
    const timeNow = Date.now();
    const createdAtTs = oUser?.metadata?.creationTime
        ? new Date(oUser.metadata.creationTime).getTime()
        : timeNow;
    const emailLocal = (oUser?.email || "").split("@")[0] || "";
    const nickname = (oUser?.displayName || emailLocal || "User").trim();
    const baseCompAvg: UserProfile["competencyAverages"] = {
        empathy: 2.5,
        trustAndRelationshipBuilding: 2.5,
        strategicAdaptability: 2.5,
        qualityOfExpression: 2.5,
        postSettlementSettlements: 2.5,
        activeListeningAndQuestioning: 2.5,
        usingObjectiveCriteria: 2.5,
        managingEmotions: 2.5,
        generatingCreativeOptions: 2.5,
        understandingInterestsAndOptions: 2.5,
        searchingForTradeOffs: 2.5,
        settingTheStage: 2.5,
        managingConcessions: 2.5,
        makingTheFirstOffer: 2.5,
        ethics: 3,
    };
    const worstComps = Object.entries(baseCompAvg)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 5)
        .map(([k]) => k);

    const newProfile: Omit<UserProfile, "id"> = {
        userId,
        nickname,
        avatarUrl: "", // avatar handling is wired elsewhere (storage)
        level: 1,
        points: 0,
        streak: 0,
        friends_count: 0,
        dateOfJoining: createdAtTs,
        lastLoginAt: timeNow,
        proficiencyScores: {
            relational: 0,
            substantive: 0,
            competency: 0,
            total: 0,
            overallProficiency: 0,
        },
        percentiles: {
            substantive: 0,
            relational: 0,
        },
        competencyAverages: baseCompAvg,
        worstCompetencies: worstComps,
        negotiationsDone: 0,
        topScore: 0,
        modulesDone: 0,
        currentCompetency: "Getting Started",
        lastCalculated: 0,
        createdAt: timeNow,
        updatedAt: timeNow,
    };

    const profileId = await saveDoc(newProfile, "profiles");
    return { id: profileId, ...newProfile };
}

export async function updateUserProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, "id" | "userId" | "createdAt">>
): Promise<void> {
    if (!userId) throw new Error("User ID is required");

    try {
        const profile = await getUserProfile(userId);
        const updatedProfile = {
            ...profile,
            ...updates,
            updatedAt: Date.now(),
        };

        await saveDoc(updatedProfile, "profiles");
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw new Error("Failed to update user profile");
    }
}

export async function calculateProficiencyScores(userId: string): Promise<void> {
    if (!userId) throw new Error("User ID is required");
    try {
        const userRawResults = await getDocs("results", [
            { field: "participants", value: userId, contains: true },
            { field: "final", value: true },
        ]);

        if (!userRawResults?.length) return;

        const caseIds = Array.from(new Set<string>(userRawResults.map((r: any) => r.caseId as string).filter(Boolean))) as string[];
        const eventCache = new Map<string, any>();
        const caseCache = new Map<string, any>();

        const loadEvent = async (eventId: string) => {
            if (!eventId) return null;
            if (!eventCache.has(eventId)) eventCache.set(eventId, await getEvent(eventId));
            return eventCache.get(eventId);
        };
        const loadCase = async (caseId: string) => {
            if (!caseId) return null;
            if (!caseCache.has(caseId)) caseCache.set(caseId, await getCase(caseId));
            return caseCache.get(caseId);
        };

        const ranges = await buildCaseScoreRanges(caseIds);

        const perResultRelational: number[] = [];
        const perResultSubstantive: number[] = [];

        const negIds = Array.from(new Set<string>((userRawResults || []).map((r: any) => r.negId).filter(Boolean)));
        const feedbackByNegId: Map<string, Record<string, number>> = new Map();
        if (negIds.length) {
            const chunks: string[][] = [];
            for (let i = 0; i < negIds.length; i += 10) chunks.push(negIds.slice(i, i + 10));
            for (const chunk of chunks) {
                const feedbacks = await getDocs("feedback", [{ field: "negId", in: true, value: chunk }]);
                for (const f of feedbacks) feedbackByNegId.set(f.negId, f.scores);
            }
        }

        const enrichedForCompetency: NegotiationResult[] = [];

        for (const r of userRawResults) {
            const survey = r.survey || {};
            const agreement = r.agreement || {};
            const madeDeal = Boolean(r.madeDeal);
            const caseId = r.caseId;
            const eventId = r.eventId;
            const round = r.round;
            const team = r.team;

            const pr = getProcessRelationshipAverage(survey);
            if (typeof pr === "number") {
                perResultRelational.push(clampToZeroOne(pr / 7) * 100);
            }

            const oCase = await loadCase(caseId);
            if (oCase && oCase.scorable !== false && madeDeal) {
                const oEvent = await loadEvent(eventId);
                const side = getSideFromEvent(oEvent, team, round);
                if (side === "a" || side === "b") {
                    const score = side === "a"
                        ? getScore(oCase.scoreFormulaA, agreement)
                        : getScore(oCase.scoreFormulaB, agreement);
                    const pct = getSubstantivePercentage(score, oCase, side, ranges, caseId);
                    if (pct !== null) perResultSubstantive.push(pct * 100);
                }
            }

            const negId = r.negId || "";
            const feedbackScores = feedbackByNegId.get(negId);
            enrichedForCompetency.push({
                userId,
                negId,
                eventId,
                caseId,
                round: round || 1,
                side: "", // not needed for competency averages
                madeDeal: madeDeal,
                hasSvi: Boolean(Object.keys(survey || {}).length),
                final: true,
                agreeStats: undefined,
                surveyStats: undefined,
                feedbackScores,
                completedAt: r.timestamp?._seconds ? r.timestamp._seconds * 1000 : Date.now(),
            });
        }

        const relationalProficiency = averageOf(perResultRelational) ?? 0;
        const substantiveProficiency = averageOf(perResultSubstantive) ?? 0;

        const competencyAverages = calculateCompetencyAverages(enrichedForCompetency);
        const competencyValues = Object.values(competencyAverages || {})
            .filter((v) => typeof v === "number" && !Number.isNaN(v)) as number[];
        const competencyAvg = averageOf(competencyValues) ?? 0;
        const competencyProficiency = clampToZeroOne(competencyAvg / 5) * 100;

        const present: number[] = [];
        if (Number.isFinite(relationalProficiency)) present.push(relationalProficiency);
        if (Number.isFinite(substantiveProficiency)) present.push(substantiveProficiency);
        if (Number.isFinite(competencyProficiency)) present.push(competencyProficiency);
        const totalProficiency = present.length ? (present.reduce((s, v) => s + v, 0) / present.length) : 0;

        const allFinalResults = await getDocs("results", [{ field: "final", value: true }]);
        const allPR = allFinalResults
            .map((r: any) => getProcessRelationshipAverage(r.survey || {}))
            .filter((v: any) => typeof v === "number") as number[];
        const relationalPercentile = calculatePercentile(
            (averageOf(perResultRelational.map(v => (v / 100) * 7)) ?? 0),
            allPR
        );

        const allCaseResults = await getFinalResultsForCaseIds(caseIds);
        const allSubPct: number[] = [];
        for (const r of allCaseResults) {
            const oCase = await loadCase(r.caseId);
            if (!oCase || oCase.scorable === false || !r.madeDeal) continue;
            const oEvent = await loadEvent(r.eventId);
            const side = getSideFromEvent(oEvent, r.team, r.round);
            if (side !== "a" && side !== "b") continue;
            const score = side === "a"
                ? getScore(oCase.scoreFormulaA, r.agreement || {})
                : getScore(oCase.scoreFormulaB, r.agreement || {});
            const pct = getSubstantivePercentage(score, oCase, side, ranges, r.caseId);
            if (pct !== null) allSubPct.push(pct * 100);
        }
        const substantivePercentile = calculatePercentile(substantiveProficiency, allSubPct);

        const worstCompsNow = Object.entries(competencyAverages)
            .sort((a, b) => a[1] - b[1])
            .slice(0, 5)
            .map(([k]) => k as string);

        await updateUserProfile(userId, {
            proficiencyScores: {
                relational: Math.round(relationalProficiency),
                substantive: Math.round(substantiveProficiency),
                competency: Math.round(competencyProficiency),
                total: Math.round(totalProficiency),
                overallProficiency: Math.round(totalProficiency),
            },
            percentiles: {
                relational: Math.round(relationalPercentile),
                substantive: Math.round(substantivePercentile),
            },
            competencyAverages,
            worstCompetencies: worstCompsNow,
            negotiationsDone: userRawResults.length,
            topScore: Math.round(Math.max(relationalPercentile, substantivePercentile)),
            lastCalculated: Date.now(),
        });
    } catch (error) {
        console.error("Error calculating proficiency scores:", error);
        throw new Error("Failed to calculate proficiency scores");
    }
}

function calculatePercentile(userScore: number, allScores: number[]): number {
    if (allScores.length === 0) return 50;
    const sortedScores = [...allScores].sort((a, b) => a - b);
    const rank = sortedScores.filter(score => score < userScore).length;
    return (rank / sortedScores.length) * 100;
}

function calculateCompetencyAverages(results: NegotiationResult[]): UserProfile["competencyAverages"] {
    const averages: Record<string, number> = {};
    for (const comp of COMPETENCIES) {
        const scores: number[] = [];
        for (const r of results) {
            const fs = r.feedbackScores;
            if (!fs) continue;
            for (const [k, v] of Object.entries(fs)) {
                const mapped = FEEDBACK_TO_COMPETENCY[k];
                if (mapped === comp && typeof v === "number") scores.push(v);
            }
        }
        averages[comp] = scores.length ? (scores.reduce((s, v) => s + v, 0) / scores.length) : 2.5;
    }
    return averages as UserProfile["competencyAverages"];
}

export async function updateProfileAvatar(userId: string, avatarUrl: string): Promise<void> {
    await updateUserProfile(userId, { avatarUrl });
}

export async function getGlobalCompetencyAverages(): Promise<UserProfile["competencyAverages"]> {
    try {
        const feedbacks = await getDocs("feedback", []);
        if (feedbacks.length === 0) {
            return {
                empathy: 3,
                trustAndRelationshipBuilding: 3.5,
                strategicAdaptability: 3,
                qualityOfExpression: 3.5,
                postSettlementSettlements: 2.5,
                activeListeningAndQuestioning: 3,
                usingObjectiveCriteria: 3,
                managingEmotions: 3,
                generatingCreativeOptions: 3,
                understandingInterestsAndOptions: 3.5,
                searchingForTradeOffs: 2.5,
                settingTheStage: 3.5,
                managingConcessions: 3,
                makingTheFirstOffer: 3,
                ethics: 4,
            };
        }
        const competencyTotals: Record<string, number> = {};
        const competencyCounts: Record<string, number> = {};
        feedbacks.forEach(feedback => {
            const fs = feedback.scores || {};
            for (const [key, val] of Object.entries(fs)) {
                const comp = FEEDBACK_TO_COMPETENCY[key];
                if (!comp) continue;
                if (competencyTotals[comp] === undefined) {
                    competencyTotals[comp] = 0;
                    competencyCounts[comp] = 0;
                }
                competencyTotals[comp] += Number(val) || 0;
                competencyCounts[comp]! += 1;
            }
        });
        const averages: any = {};
        for (const comp of Object.keys(competencyTotals)) {
            averages[comp] = competencyTotals[comp] / competencyCounts[comp];
        }
        return averages;
    } catch (error) {
        console.error("Error calculating global competency averages:", error);
        throw new Error("Failed to get global averages");
    }
}

// ---------- Helpers (human-sized, focused) ----------

function averageOf(values: number[] | null | undefined): number | null {
    if (!values || !values.length) return null;
    const nums = values.filter((v) => Number.isFinite(v)) as number[];
    if (!nums.length) return null;
    return nums.reduce((s, v) => s + v, 0) / nums.length;
}

function clampToZeroOne(x: number): number {
    if (!Number.isFinite(x)) return 0;
    return Math.max(0, Math.min(1, x));
}

function getProcessRelationshipAverage(survey: Record<string, any>): number | null {
    const processVals = [survey.listened, survey.fairness, survey.ease, survey.considered];
    const relationshipVals = [
        survey.impression,
        survey.relationshipSatisfaction,
        survey.trust,
        survey.futureRelationship,
    ];
    const processAvg = averageOf(toNumericArray(processVals));
    const relationshipAvg = averageOf(toNumericArray(relationshipVals));
    if (processAvg === null && relationshipAvg === null) return null;
    if (processAvg === null) return relationshipAvg;
    if (relationshipAvg === null) return processAvg;
    return (processAvg + relationshipAvg) / 2;
}

function toNumericArray(arr: any[]): number[] {
    return (arr || [])
        .map((x) => (x === undefined || x === null ? null : Number(x)))
        .filter((x) => typeof x === "number" && !Number.isNaN(x)) as number[];
}

function normalizeToZeroOneRange(val: number, min: number, max: number): number | null {
    if (!Number.isFinite(val) || !Number.isFinite(min) || !Number.isFinite(max)) return null;
    const span = max - min;
    if (span === 0) return 1; // everyone at the same score, treated as 100%
    return clampToZeroOne((val - min) / span);
}

function getSubstantivePercentage(
    score: number,
    oCase: any,
    side: "a" | "b",
    ranges: Map<string, { min: number; max: number }>,
    caseId: string
): number | null {
    if (!Number.isFinite(score)) return null;
    const explicitMax = side === "a" ? (oCase.maxScoreA ?? oCase.maxScore) : (oCase.maxScoreB ?? oCase.maxScore);
    if (Number.isFinite(explicitMax) && explicitMax > 0) {
        return clampToZeroOne(score / explicitMax);
    }
    const range = ranges.get(`${caseId}:${side}`);
    return range ? normalizeToZeroOneRange(score, range.min, range.max) : null;
}

function getSideFromEvent(oEvent: any, teamId: string, round: number): "a" | "b" | "" {
    if (!oEvent || !teamId || !round) return "";
    const matches = oEvent.matches?.[round - 1]?.matches || oEvent.rounds?.[round - 1]?.matches;
    if (!matches) return "";
    for (const m of matches) {
        if (m.a === teamId) return "a";
        if (m.b === teamId) return "b";
    }
    return "";
}

async function getFinalResultsForCaseIds(caseIds: string[]): Promise<any[]> {
    if (!caseIds?.length) return [];
    const chunks: string[][] = [];
    for (let i = 0; i < caseIds.length; i += 10) chunks.push(caseIds.slice(i, i + 10));
    const all: any[] = [];
    for (const chunk of chunks) {
        const docs = await getDocs("results", [
            { field: "caseId", in: true, value: chunk },
            { field: "final", value: true },
        ]);
        all.push(...docs);
    }
    return all;
}

async function buildCaseScoreRanges(caseIds: string[]): Promise<Map<string, { min: number; max: number }>> {
    const ranges = new Map<string, { min: number; max: number }>();
    const results = await getFinalResultsForCaseIds(caseIds);
    const eventCache = new Map<string, any>();
    const caseCache = new Map<string, any>();

    const loadEvent = async (eventId: string) => {
        if (!eventId) return null;
        if (!eventCache.has(eventId)) eventCache.set(eventId, await getEvent(eventId));
        return eventCache.get(eventId);
    };
    const loadCase = async (caseId: string) => {
        if (!caseId) return null;
        if (!caseCache.has(caseId)) caseCache.set(caseId, await getCase(caseId));
        return caseCache.get(caseId);
    };

    for (const r of results) {
        const oCase = await loadCase(r.caseId);
        if (!oCase || oCase.scorable === false || !r.madeDeal) continue;
        const oEvent = await loadEvent(r.eventId);
        const side = getSideFromEvent(oEvent, r.team, r.round);
        if (side !== "a" && side !== "b") continue;
        const agreement = r.agreement || {};
        const score = side === "a" ? getScore(oCase.scoreFormulaA, agreement) : getScore(oCase.scoreFormulaB, agreement);
        if (!Number.isFinite(score)) continue;
        const key = `${r.caseId}:${side}`;
        const existing = ranges.get(key);
        if (!existing) {
            ranges.set(key, { min: score, max: score });
        } else {
            existing.min = Math.min(existing.min, score);
            existing.max = Math.max(existing.max, score);
        }
    }
    return ranges;
}

export async function incrementStreak(userId: string): Promise<void> {
    if (!userId) throw new Error("User ID is required");
    const profile = await getUserProfile(userId);
    const now = Date.now();
    const last = profile.lastLoginAt || 0;
    const days = getDaysBetweenUTC(last, now);

    let newStreak = profile.streak || 0;
    if (days === 1) {
        newStreak = newStreak + 1 || 1;
    } else if (days !== 0) {
        newStreak = 1;
    }
    await updateUserProfile(userId, { streak: newStreak, lastLoginAt: now });
}

function getStartOfUTCDay(ts: number): number {
    const d = new Date(ts || 0);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function getDaysBetweenUTC(a: number, b: number): number {
    if (!a) return Infinity; // force reset to 1 on first run
    const A = getStartOfUTCDay(a);
    const B = getStartOfUTCDay(b);
    return Math.floor((B - A) / 86400000);
}

export async function addCompletedStage(userId: string, stageId: string): Promise<void> {
  if (!userId || !stageId) throw new Error("Args required");
  const profile = await getUserProfile(userId);
  const completedAt = Date.now();
  const set = new Set<string>(profile.completedStages as any || []);
  set.add(stageId);
  const journeyMap = { ...(profile as any).completedJourney, [stageId]: completedAt } as Record<string, number>;
  await updateUserProfile(userId, { completedStages: Array.from(set), completedJourney: journeyMap, modulesDone: (profile.modulesDone || 0) + 1 } as any);
}

export async function getCompletedStages(userId: string): Promise<string[]> {
  const profile = await getUserProfile(userId);
  const arr = (profile as any).completedStages || [];
  const map = (profile as any).completedJourney || {};
  const keys = Object.keys(map);
  return keys.length ? keys : arr;
}
