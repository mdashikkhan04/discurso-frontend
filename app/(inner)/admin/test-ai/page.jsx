"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import {
    Play,
    RefreshCw,
    Sparkles,
    Settings,
    Bot,
    MessageSquare,
    BarChart3,
    FileText,
    Zap,
    Target,
    Users,
    TrendingUp
} from "lucide-react";
import CaseSearch from "@/components/CaseSearch";
import ParamsAI from "@/components/ParamsAI";
import { useUser } from "@/contexts/UserContext";
import { getBotResponse, getBotFeedback } from "@/actions/testAI";
import LlmConfig from "@/components/LlmConfig";
import InfoTooltip from "@/components/InfoTooltip";
import { getNiceNum } from "@/lib/util";

function ChatTranscript({ transcript }) {
    const containerRef = useRef(null);
    useLayoutEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [transcript]);
    return (
        <div ref={containerRef} className="max-h-[85vh] overflow-auto p-2 border-2 border-gray-300 rounded-xl bg-gradient-to-b from-gray-50 to-white shadow-inner">
            <div className="space-y-2">
                {transcript.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "A" ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[85%] ${m.role === "A" ? "mr-auto" : "ml-auto"}`}>
                            <div className={`text-xs font-bold mb-1 ${m.role === "A" ? "text-blue-700 text-left" : "text-emerald-700 text-right"}`}>
                                Side {m.role}
                            </div>
                            <div
                                className={`px-2 py-1 rounded-2xl text-base whitespace-pre-wrap shadow-md border-2 leading-relaxed ${m.role === "A"
                                    ? "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 border-blue-200 rounded-tl-sm"
                                    : "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-900 border-emerald-200 rounded-tr-sm"
                                    }`}
                            >
                                {m.content}
                                {(m.cost || m.duration) && (
                                    <div className="text-xs text-gray-800 mt-1">
                                        {m.cost ? `Cost: $${m.cost}` : ""}{m.duration ? `  |  Duration: ${m.duration}s` : ""}{m.models ? `  |  Models: ${m.models}` : ""}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const randomizeParams = () => {
    const rnd = () => Math.floor(Math.random() * 5) + 1; // 1‑5 inclusive
    return {
        hardOnPeople: rnd(),
        hardOnProblem: rnd(),
        processDrive: rnd(),
        concessionsDist: rnd(),
        ethics: rnd(),
    };
};

const getFeedback = async (transcript, side, params, caseId, userId) => {
    const feedback = getBotFeedback(transcript, side, params, caseId, userId);
    return feedback;
}

const getResponse = async (transcript, negId, caseId, side, params, offer, user, ans, llmConfig) => {
    const pastMessages = transcript.map((m) => ({
        role: m.role === side ? "assistant" : "user",
        content: m.content,
    }));
    const userQuery = (pastMessages.pop()).content;
    const oData = {
        userQuery,
        pastMessages,
        currentOffer: offer,
        negId: negId || null,
        caseId,
        isPractice: false,
        isBotSim: true,
        aiSide: side.toLowerCase(),
        behaviourParams: params,
        userId: user.uid,
        llmConfig,
        returnExtra: true,
    }

    const response = await getBotResponse(oData);
    return response;
}

const simulateNegotiation = async ({ maxTurns, openingMsg, paramsA, paramsB, caseId, delay = 300, onTurn, user, llmConfig }) => {
    const transcript = [];
    let turn = 0;
    let role = "A";
    transcript.push({ role, content: openingMsg });
    onTurn?.([...transcript]);
    let localNegId, offer;
    while (turn < maxTurns) {
        turn++;
        role = role === "A" ? "B" : "A";
        let params = role === "A" ? paramsA : paramsB;
        let bOverflow = turn >= maxTurns;
        if (!bOverflow) {
            const ans = `reply ${turn} by ${role}`;
            const startTime = Date.now();
            const responseData = await getResponse(transcript.map(msg => ({ role: msg.role, content: msg.content })), localNegId, caseId, role, params, offer, user, ans, llmConfig);
            if (!responseData) {
                transcript.push({ role, content: "<NEGOTIATION TERMINATED BY SOFTWARE DUE TO MESSAGE OVERFLOW FAILED GENERATION>" });
                const totalCost = transcript.reduce((sum, msg) => sum + (msg.cost || 0), 0);
                onTurn?.([...transcript], totalCost);
                break;
            }
            const { answer, negId, stats, cost, config } = responseData;
            localNegId = negId;
            if (stats?.offer) offer = stats.offer;
            transcript.push({
                role,
                content: answer,
                cost,
                duration: getNiceNum((Date.now() - startTime) / 1000, 1),
                models: config ? [config?.final?.model?.split("=")?.[1], config?.helper?.model?.split("=")?.[1]].filter(Boolean).join(" / ") : undefined
            });
            const totalCost = transcript.reduce((sum, msg) => sum + (msg.cost || 0), 0);
            onTurn?.([...transcript], totalCost);
            if (answer.includes("NEGOT_ENDED")) break;
        } else {
            transcript.push({ role, content: "<NEGOTIATION TERMINATED BY SOFTWARE DUE TO MESSAGE OVERFLOW>" });
            const totalCost = transcript.reduce((sum, msg) => sum + (msg.cost || 0), 0);
            onTurn?.([...transcript], totalCost);
            break;
        }
    }
    return transcript;
};

const generateFeedback = async (transcript, side, params, caseId, userId, feedLLMConfig) => {
    const sConv = transcript.map((m) => `Side ${m.role}:\n${m.content}`).join("\n----------------\n");
    let botFeedback = await getBotFeedback(sConv, side, params, caseId, userId, feedLLMConfig);
    if (typeof botFeedback === "string") botFeedback = JSON.parse(botFeedback);
    return botFeedback;
};

const makeSim = (idx) => ({
    id: idx,
    paramsA: randomizeParams(),
    paramsB: randomizeParams(),
    status: "pending",
    transcript: [],
    totalCost: 0,
    feedbackA: null,
    feedbackB: null,
});

export default function TestingAI() {
    const [selectedCase, setSelectedCase] = useState(null);
    const [searchingCase, setSearchingCase] = useState(false);
    const [numSims, setNumSims] = useState(1);
    const [maxTurns, setMaxTurns] = useState(15);
    const [openingMsg, setOpeningMsg] = useState("Hello");

    const [sims, setSims] = useState(() => Array.from({ length: numSims }, (_, i) => makeSim(i)));
    const [editingLocked, setEditingLocked] = useState(false);
    const [fetchingFb, setFetchingFb] = useState(false);
    const [negotFinalLLM, setNegotFinalLLm] = useState({ model: "OPENAI=gpt-4.1-mini", temperature: 0.7, maxTokens: 10240 });
    const [negotHelperLLM, setNegotHelperLLm] = useState({ model: "OPENAI=gpt-4.1-mini", temperature: 0.7, maxTokens: 10240 });
    const [feedLLM, setFeedLLm] = useState({ model: "OPENAI=o4-mini", reasoning: "high", maxTokens: 10240 });
    const { user } = useUser();

    useEffect(() => {
        if (!editingLocked) setSims(Array.from({ length: numSims }, (_, i) => makeSim(i)));
    }, [numSims, editingLocked]);

    const updateSim = (idx, patch) =>
        setSims((prev) => {
            const arr = [...prev];
            arr[idx] = { ...arr[idx], ...patch };
            return arr;
        });

    const startRuns = async () => {
        if (!selectedCase) return alert("Select a case first");
        setEditingLocked(true);
        setSims((s) => s.map((x) => ({ ...x, status: "running" })));
        await Promise.all(
            sims.map(async (sim, idx) => {
                try {
                    const transcript = await simulateNegotiation({
                        maxTurns,
                        openingMsg,
                        paramsA: sim.paramsA,
                        paramsB: sim.paramsB,
                        caseId: selectedCase.id,
                        onTurn: (t, totalCost) => updateSim(idx, { transcript: t, totalCost: getNiceNum(totalCost, 4) }),
                        user,
                        llmConfig: { final: negotFinalLLM, helper: negotHelperLLM }
                    });
                    updateSim(idx, { transcript, status: "finished" });
                    console.debug(`Simulation ${idx + 1} finished`, transcript);
                } catch (error) {
                    console.error(`Simulation ${idx + 1} failed:`, error);
                    updateSim(idx, { status: "timeout" });
                }
            })
        );
    };

    const genFeedbacks = async () => {
        setFetchingFb(true);
        await Promise.all(
            sims.map(async (sim, idx) => {
                if (sim.status !== "finished") return;
                const [fa, fb] = await Promise.all([
                    generateFeedback(sim.transcript, "A", sim.paramsA, selectedCase.id, user.uid, feedLLM),
                    generateFeedback(sim.transcript, "B", sim.paramsB, selectedCase.id, user.uid, feedLLM),
                ]);
                updateSim(idx, { feedbackA: fa, feedbackB: fb });
            })
        );
        setFetchingFb(false);
    };

    const averages = (() => {
        const agg = {};
        let n = 0;
        sims.forEach((s) => {
            [s.feedbackA, s.feedbackB].forEach((fb) => {
                if (!fb) return;
                n++;
                Object.entries(fb.scores).forEach(([k, v]) => (agg[k] = (agg[k] || 0) + v));
            });
        });
        return Object.fromEntries(Object.entries(agg).map(([k, v]) => [k, n ? (v / n).toFixed(2) : "‑"]));
    })();

    return (
        <div className="min-h-screen bg-gradient-to-br from-soft-white via-pale-blue/30 to-white p-2 md:p-4">
            <div className="max-w-full mx-auto">

                <div className="space-y-6">
                    <Accordion type="single" collapsible defaultValue="setup">
                        <AccordionItem value="setup">
                            <Card className="bg-white/90 backdrop-blur-sm border-pale-gray shadow-lg rounded-2xl overflow-hidden">
                                <AccordionTrigger className="px-6 py-4 hover:bg-pale-blue/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-vivid-blue text-white">
                                            <Settings size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xl font-semibold">Setup Configuration</div>
                                            <div className="text-sm text-gray-600">Configure simulation parameters and models</div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-start space-x-2">
                                                <Label className="text-sm font-medium text-gray-700">Negotiation Case</Label>
                                                <InfoTooltip iconOnly={true} info="Case to be used for all negotiation simulations" />
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="w-full h-12 rounded-xl border-pale-gray hover:border-vivid-blue hover:bg-pale-blue/50 transition-all duration-200"
                                                disabled={editingLocked}
                                                onClick={() => setSearchingCase(true)}
                                            >
                                                <FileText size={16} className="mr-2" />
                                                {selectedCase ? selectedCase.title : "Select case"}
                                            </Button>
                                            {searchingCase && (
                                                <CaseSearch
                                                    onClose={() => setSearchingCase(false)}
                                                    onCaseSelected={(c) => {
                                                        setSelectedCase(c);
                                                        setSearchingCase(false);
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-start space-x-2">
                                                <Label className="text-sm font-medium text-gray-700">Number of Simulations</Label>
                                                <InfoTooltip iconOnly={true} info="Quantity of simultaneous negotiation simulations" />
                                            </div>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={numSims}
                                                disabled={editingLocked}
                                                onChange={(e) => setNumSims(parseInt(e.target.value))}
                                                className="h-12 rounded-xl border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-start space-x-2">
                                                <Label className="text-sm font-medium text-gray-700">Max Messages per Simulation</Label>
                                                <InfoTooltip iconOnly={true} info="Number of messages allowed in negotiation, if exceeded the simulation will be stopped" />
                                            </div>
                                            <Input
                                                type="number"
                                                min={5}
                                                max={50}
                                                value={maxTurns}
                                                disabled={editingLocked}
                                                onChange={(e) => setMaxTurns(parseInt(e.target.value))}
                                                className="h-12 rounded-xl border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-start space-x-2">
                                                <Label className="text-sm font-medium text-gray-700">Opening Message</Label>
                                                <InfoTooltip iconOnly={true} info="First message in chat / negotiation by Side A" />
                                            </div>
                                            <Input
                                                type="text"
                                                value={openingMsg}
                                                disabled={editingLocked}
                                                onChange={(e) => setOpeningMsg(e.target.value)}
                                                className="h-12 rounded-xl border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-start space-x-2">
                                                <Label className="text-sm font-medium text-gray-700">Negotiation Helper LLM</Label>
                                                <InfoTooltip iconOnly={true} info="Model settings for generating helping content which will be injected into final negotiation prompt" />
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                <LlmConfig
                                                    initConfig={negotHelperLLM}
                                                    onChange={(config) => setNegotHelperLLm(config)}
                                                    disabled={editingLocked}
                                                    expanded={true}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-start space-x-2">
                                                <Label className="text-sm font-medium text-gray-700">Negotiation Final LLM</Label>
                                                <InfoTooltip iconOnly={true} info="Model settings for generating negotiation chat message" />
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                <LlmConfig
                                                    initConfig={negotFinalLLM}
                                                    onChange={(config) => setNegotFinalLLm(config)}
                                                    disabled={editingLocked}
                                                    expanded={true}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3 md:col-span-2">
                                            <div className="flex items-center justify-start space-x-2">
                                                <Label className="text-sm font-medium text-gray-700">Feedback LLM</Label>
                                                <InfoTooltip iconOnly={true} info="Model settings for generating feedback / assessment of negotiating model's performance" />
                                            </div>
                                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200">
                                                <LlmConfig
                                                    initConfig={feedLLM}
                                                    onChange={(config) => setFeedLLm(config)}
                                                    expanded={true}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>
                    </Accordion>

                    <Accordion type="single" collapsible defaultValue="sims">
                        <AccordionItem value="sims">
                            <Card className="bg-white/90 backdrop-blur-sm border-pale-gray shadow-lg rounded-2xl overflow-hidden">
                                <AccordionTrigger className="px-6 py-4 hover:bg-pale-blue/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-green-100 text-green-600">
                                            <Bot size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xl font-semibold">AI Simulations</div>
                                            <div className="text-sm text-gray-600">Run and monitor AI vs AI negotiations</div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <div className="flex justify-center gap-4 mt-4 mb-6">
                                        <Button
                                            onClick={startRuns}
                                            disabled={editingLocked || sims.some((s) => s.status === "running")}
                                            className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 px-6 font-medium transition-all duration-200 hover:scale-105"
                                        >
                                            <Play className="h-4 w-4 mr-2" />
                                            Start Simulations
                                        </Button>
                                        {editingLocked && (
                                            <Button
                                                variant="outline"
                                                className="rounded-xl h-12 px-6 border-orange-400 text-orange-600 hover:bg-orange-50"
                                                disabled={sims.some((s) => s.status === "running")}
                                                onClick={() => {
                                                    if (confirm("Wipe all feedbacks and start again?") == true) setEditingLocked(false)
                                                }}
                                            >
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Start Over
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-6">
                                        {sims.map((sim, idx) => (
                                            <Card key={sim.id} className="border-pale-gray shadow-md rounded-2xl overflow-hidden">
                                                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 border-b border-pale-gray">
                                                    <div className="flex items-center justify-between">
                                                        <h2 className="text-lg font-semibold text-darker-gray flex items-center gap-2">
                                                            <Target size={20} className="text-vivid-blue" />
                                                            Simulation {idx + 1}
                                                        </h2>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${sim.status === "running" ? "bg-blue-100 text-blue-700" :
                                                            sim.status === "finished" ? "bg-green-100 text-green-700" :
                                                                sim.status === "timeout" ? "bg-red-100 text-red-700" :
                                                                    "bg-gray-100 text-gray-700"
                                                            }`}>
                                                            {sim.status.charAt(0).toUpperCase() + sim.status.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-6 space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="text-blue-700 font-semibold text-lg flex items-center gap-2">
                                                                    <Users size={18} />
                                                                    Side A: AI Parameters
                                                                </span>
                                                                {!editingLocked && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        title="Randomize"
                                                                        onClick={() => updateSim(idx, { paramsA: randomizeParams() })}
                                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                                                    >
                                                                        <RefreshCw className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <ParamsAI initParams={sim.paramsA} onChange={(p) => updateSim(idx, { paramsA: p })} disabled={editingLocked} />
                                                        </div>
                                                        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="text-green-700 font-semibold text-lg flex items-center gap-2">
                                                                    <Users size={18} />
                                                                    Side B: AI Parameters
                                                                </span>
                                                                {!editingLocked && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        title="Randomize"
                                                                        onClick={() => updateSim(idx, { paramsB: randomizeParams() })}
                                                                        className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                                                    >
                                                                        <RefreshCw className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <ParamsAI initParams={sim.paramsB} onChange={(p) => updateSim(idx, { paramsB: p })} disabled={editingLocked} />
                                                        </div>
                                                    </div>
                                                    {sim.transcript.length > 0 && (
                                                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200">
                                                            <h3 className="text-purple-700 font-semibold mb-3 text-lg flex items-center gap-2">
                                                                <MessageSquare size={20} />
                                                                Transcript
                                                                <span className="text-sm bg-white px-2 py-1 rounded-full border border-purple-200">
                                                                    ${sim.totalCost?.toFixed(4) || '0.0000'}
                                                                </span>
                                                            </h3>
                                                            <ChatTranscript transcript={sim.transcript} />
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>
                    </Accordion>

                    <Accordion type="single" collapsible defaultValue="fb">
                        <AccordionItem value="fb">
                            <Card className="bg-white/90 backdrop-blur-sm border-pale-gray shadow-lg rounded-2xl overflow-hidden">
                                <AccordionTrigger className="px-6 py-4 hover:bg-pale-blue/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                                            <BarChart3 size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xl font-semibold">AI Feedbacks</div>
                                            <div className="text-sm text-gray-600">Generate and analyze performance feedback</div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <div className="flex justify-center mb-6 mt-4">
                                        <Button
                                            disabled={fetchingFb || sims.some((s) => s.status !== "finished") || sims.every((s) => s.feedbackA !== null)}
                                            onClick={genFeedbacks}
                                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 px-6 font-medium transition-all duration-200 hover:scale-105"
                                        >
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Generate Feedbacks
                                        </Button>
                                    </div>
                                    <div className="space-y-6">
                                        {sims.map((sim, idx) => (
                                            <Card key={`fb-${idx}`} className="border-pale-gray shadow-md rounded-2xl overflow-hidden">
                                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 border-b border-pale-gray">
                                                    <h4 className="text-lg font-semibold text-darker-gray flex items-center gap-2">
                                                        <TrendingUp size={20} className="text-purple-600" />
                                                        Simulation {idx + 1} - Performance Analysis
                                                    </h4>
                                                </div>
                                                <div className="p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {sim.feedbackA && (
                                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                                                <div className="flex items-center gap-2 mb-4">
                                                                    <Users size={18} className="text-blue-600" />
                                                                    <p className="font-semibold text-blue-700 text-lg">Side A Performance</p>
                                                                </div>
                                                                <div className="space-y-4">
                                                                    {Object.entries(sim.feedbackA.scores).map(([k, v]) => (
                                                                        <div key={k} className="bg-white p-3 rounded-lg border border-blue-100">
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <span className="capitalize font-semibold text-gray-700">{k}</span>
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                                                        {v}
                                                                                    </div>
                                                                                    <span className="text-gray-500 text-sm">/5</span>
                                                                                </div>
                                                                            </div>
                                                                            <p className="italic text-sm text-gray-600 leading-relaxed">{sim.feedbackA.reasoning[k]}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {sim.feedbackB && (
                                                            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                                                <div className="flex items-center gap-2 mb-4">
                                                                    <Users size={18} className="text-green-600" />
                                                                    <p className="font-semibold text-green-700 text-lg">Side B Performance</p>
                                                                </div>
                                                                <div className="space-y-4">
                                                                    {Object.entries(sim.feedbackB.scores).map(([k, v]) => (
                                                                        <div key={k} className="bg-white p-3 rounded-lg border border-green-100">
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <span className="capitalize font-semibold text-gray-700">{k}</span>
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="w-8 h-8 bg-green-400 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                                                        {v}
                                                                                    </div>
                                                                                    <span className="text-gray-500 text-sm">/5</span>
                                                                                </div>
                                                                            </div>
                                                                            <p className="italic text-sm text-gray-600 leading-relaxed">{sim.feedbackB.reasoning[k]}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                    {Object.keys(averages).length > 0 && (
                                        <Card className="border-pale-gray shadow-lg rounded-2xl overflow-hidden mt-6 w-full md:w-2/3 mx-auto">
                                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 border-b border-pale-gray">
                                                <h3 className="text-amber-700 font-semibold text-xl flex items-center gap-2">
                                                    <FileText size={20} />
                                                    Average Performance Scores
                                                </h3>
                                            </div>
                                            <div className="p-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Object.entries(averages).map(([k, v]) => (
                                                        <div key={k} className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200">
                                                            <span className="capitalize font-semibold text-gray-600 text-lg">{k}</span>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-10 h-10 bg-gradient-to-r from-vivid-blue/75 to-deep-blue/75 text-white rounded-full flex items-center justify-center font-bold">
                                                                    {v}
                                                                </div>
                                                                <span className="text-gray-500">/5</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Card>
                                    )}
                                </AccordionContent>
                            </Card>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    );
};

