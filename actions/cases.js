"use server";

import { getDocs, saveDoc } from "@/lib/server/data/data";
import { getCase } from "@/lib/server/data/cases";
import {
    makeCaseIdeas,
    makeFullCaseIdea,
    makeRefinedCaseIdea,
    makeCaseSummary,
    makeCaseScoreFormula,
    getCaseMatchingTags
} from "@/lib/server/ai";
import { getTags } from "@/actions/tags";
import { verifyAccess } from "@/lib/server/auth";

export async function makeCaseFormula(instruction, params, userId, previousValue) {
    return await makeCaseScoreFormula(instruction, params, userId, previousValue);
};

export async function saveGeneratedCase(caseData, userId) {
    try {
        const { sSummary, language, scoreFormulaA, scoreFormulaB } = await Promise.all([
            makeCaseSummary(caseData, userId),
            caseData.scorable ? makeCaseScoreFormula(`${caseData.generalInstruct}\n\n${caseData.aInstruct}`, caseData.params, userId) : Promise.resolve(""),
            caseData.scorable ? makeCaseScoreFormula(`${caseData.generalInstruct}\n\n${caseData.bInstruct}`, caseData.params, userId) : Promise.resolve("")
        ]).then(([summary, formulaA, formulaB]) => ({ sSummary: summary.summary, language: summary.langCode, scoreFormulaA: formulaA, scoreFormulaB: formulaB }));
        const tags = await getCaseMatchingTags({ ...caseData, sSummary }, (await getTags("case")).map(tag => ({ value: tag.value })), userId);
        caseData.instructions = {};
        caseData.instructions[language] = {
            general: caseData.generalInstruct,
            partyA: caseData.aInstruct,
            partyB: caseData.bInstruct
        };
        const caseToSave = {
            ...caseData,
            scoreFormulaA,
            scoreFormulaB,
            author: "AI Generated",
            owner: userId,
            time: Date.now(),
            summary: sSummary,
            language,
            tags: tags || [],
            ai: caseData.ai || "n",
            agreeMatch: true,
            relationRatio: [50],
            relationWeight: 50,
        };
        const result = await saveDoc(caseToSave, "cases");
        return { success: true, id: result };
    } catch (error) {
        console.error("Error saving generated case:", error);
        return { success: false, error: error.message };
    }
};

export async function getCaseIdeas(outline, userId, pastIdeas) {
    return await makeCaseIdeas(outline, userId, pastIdeas);
};

export async function buildCase(outline, idea, userId) {
    return await makeFullCaseIdea(outline, idea, userId);
};

export async function refineCase(acase, comments, userId) {
    return await makeRefinedCaseIdea(acase, comments, userId);
};

export async function getCaseByIdForPreview(caseId) {
    const acase = await getCase(caseId);
    const { timestamp, instructions, ...caseData } = acase;
    const defaultLang = caseData.defaultLang || "en";
    const resolved = instructions?.[defaultLang] || instructions?.en;
    caseData.generalInstruct = resolved?.general ?? caseData.generalInstruct;
    caseData.aInstruct = resolved?.partyA ?? caseData.aInstruct;
    caseData.bInstruct = resolved?.partyB ?? caseData.bInstruct;
    caseData.languages = getCaseLanguages(instructions);
    return caseData;
}

export async function getCaseTitlesOnly() {
    const aCases = await getDocs("cases", null, ["id", "title"]);
    return aCases;
}

export async function getAllCases(userId, page = 1, search = "", pageSize = 50) {
    const access = await verifyAccess(["instructor"]);
    if (!access?.uid) throw new Error("Unauthorized");
    // let filters = [];

    const aCases = await getDocs("cases", null,
        ["id", "title", "author", "summary", "aName", "bName", "params", "tags", "ai", "scorable", "owner", "instructions", "isDraft"],
        null, "title", "asc");

    if (!aCases?.length) return { cases: [], total: 0, totalPages: 0, currentPage: page, pageSize };

    let filteredCases = aCases;

    if (search) {
        const searchLower = search.toLowerCase();
        filteredCases = aCases.filter(c =>
            c.title?.toLowerCase().includes(searchLower) ||
            c.author?.toLowerCase().includes(searchLower) ||
            c.summary?.toLowerCase().includes(searchLower) ||
            c.aName?.toLowerCase().includes(searchLower) ||
            c.bName?.toLowerCase().includes(searchLower) ||
            c.params?.some(param => param.name.toLowerCase().includes(searchLower))
        );
    }

    const draftCases = filteredCases.filter(c => c.isDraft);
    const nonDraftCases = filteredCases.filter(c => !c.isDraft);

    const nonDraftTotal = nonDraftCases.length;
    const nonDraftTotalPages = Math.ceil(nonDraftTotal / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedNonDraftCases = nonDraftCases.slice(start, end);

    const combinedCases = [...draftCases, ...paginatedNonDraftCases];

    const foundCases = combinedCases.map(c => {
        const { instructions, ...rest } = c;
        return {
            ...rest,
            params: rest.params.map(p => ({
                name: p.name,
                id: p.id,
                type: p.type
            })),
            languages: getCaseLanguages(instructions)
        };
    });

    return {
        cases: foundCases,
        total: filteredCases.length,
        totalPages: nonDraftTotalPages,
        currentPage: page,
        pageSize,
        draftCount: draftCases.length,
        nonDraftCount: nonDraftTotal
    };
}

export async function getCasesBySearch(keywords, tags, skipSearch = false, userId, page = 1) {
    const access = await verifyAccess(["instructor"]);
    if (!access?.uid) throw new Error("Unauthorized");
    const pageSize = 10;
    let filters = [];
    if (tags?.length && !skipSearch) {
        filters.push({ field: "tags", containsAny: true, value: tags });
    }
    const aCases = await getDocs("cases",
        filters?.length ? filters : null,
        ["id", "title", "author", "summary", "aName", "bName", "params", "tags", "ai", "scorable", "owner", "instructions", "isDraft"]);
    if (!aCases?.length) return { cases: [], total: 0, totalPages: 0, currentPage: page, pageSize };
    let filteredCases = userId ? aCases.filter(c => (c.owner === userId || !c.owner) && !c.isDraft) : aCases;
    if (!skipSearch) {
        if (keywords?.length) {
            const lowerKeywords = keywords.map(k => k.toLowerCase());
            filteredCases = aCases.filter(c => {
                return lowerKeywords.some(keyword =>
                    c.title?.toLowerCase().includes(keyword) ||
                    c.author?.toLowerCase().includes(keyword) ||
                    c.summary?.toLowerCase().includes(keyword) ||
                    c.aName?.toLowerCase().includes(keyword) ||
                    c.bName?.toLowerCase().includes(keyword) ||
                    c.params?.map(param => param.name.toLowerCase()).includes(keyword)
                );
            });
            if (!filteredCases?.length) return { cases: [], total: 0, totalPages: 0, currentPage: page, pageSize };
        }
    }
    const total = filteredCases.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const foundCases = filteredCases.slice(start, end).map(c => {
        const { instructions, ...rest } = c;
        return {
            ...rest,
            params: rest.params.map(p => {
                return {
                    name: p.name,
                    id: p.id,
                    type: p.type
                }
            }),
            languages: getCaseLanguages(instructions)
        }
    })

    return {
        cases: foundCases,
        total,
        totalPages,
        currentPage: page,
        pageSize
    };
}

function getCaseLanguages(instructions) {
    const langs = Object.keys(instructions || {})
        .map(langCode => langCode.trim().toUpperCase());
    return langs.length ? langs : [];
}