"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, } from "@/components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent, } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { showErrorToast, showSuccessToast } from "@/components/toast";
import { Loader2, Plus, CheckCircle, RefreshCcw } from "lucide-react";
import { getCaseIdeas, buildCase, refineCase, saveGeneratedCase, } from "@/actions/cases";
import { useLoading } from "@/contexts/LoadingContext";
import InfoTooltip from "@/components/InfoTooltip";
import { useUser } from "@/contexts/UserContext";
import "@/public/case.css";

export default function CaseBuilder() {
    const [currentStage, setCurrentStage] = useState(0);
    const stageIds = ["outline", "ideas", "build"];
    const [activeAccordion, setActiveAccordion] = useState("outline");

    const [caseType, setCaseType] = useState("");
    const [scorable, setScorable] = useState(false);
    const [setting, setSetting] = useState("");
    const [learningGoal, setLearningGoal] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [extraInfo, setExtraInfo] = useState("");

    const [ideas, setIdeas] = useState([]); // [{ caseTitle, partyAName, partyBName, context, parameters }]
    const [ideasLoading, setIdeasLoading] = useState(false);
    const [selectedIdeaIdx, setSelectedIdeaIdx] = useState(null);

    const [fullCase, setFullCase] = useState(null); // { title, generalInstruct, aName, aInstruct, bName, bInstruct, params: [{id, name, dataType}], scorable }
    const [caseLoading, setCaseLoading] = useState(false);
    const [comments, setComments] = useState({
        title: "",
        generalInstruct: "",
        aName: "",
        aInstruct: "",
        bName: "",
        bInstruct: "",
        params: "",
        general: "" // Overall feedback
    }); // structured comments for refinement
    const [refining, setRefining] = useState(false);

    const { showLoading, hideLoading } = useLoading();
    const { user } = useUser();

    const caseTypeOptions = [
        { id: "intro", label: "Quick warm‑up (1‑issue)", adminTip: "Short introductory" },
        { id: "distributive", label: "Classic price haggle (1‑issue)", adminTip: "Scorable distributive" },
        { id: "integrative", label: "Relationship‑building multi‑issue", adminTip: "Non-corable integrative" },
        { id: "multiIssue", label: "Complex multi‑issue", adminTip: "Scorable multi-issue" },
        // { id: "multipartySimple", label: "Multiparty single‑issue", adminTip: "Scorable multiparty" },
        // { id: "multipartyComplex", label: "Multiparty multi‑issue", adminTip: "Scorable multiparty multi-issue" },
    ];

    const outlineCompleted = () => caseType && setting.trim();
    const ideasCompleted = () => selectedIdeaIdx !== null;

    const handleResetOutline = () => {
        setCurrentStage(0);
        setActiveAccordion("outline");
        setIdeas([]);
        setSelectedIdeaIdx(null);
        setFullCase(null);
        setComments({
            title: "",
            generalInstruct: "",
            aName: "",
            aInstruct: "",
            bName: "",
            bInstruct: "",
            params: "",
            general: ""
        });
    };

    const handleGenerateIdeas = async () => {
        if (!outlineCompleted()) {
            showErrorToast("Please complete the outline first.");
            return;
        }
        setIdeasLoading(true);
        showLoading();
        try {
            const outline = {
                caseType,
                scorable,
                setting,
                learningGoal,
                targetAudience,
                extraInfo,
            };
            const newIdeas = await getCaseIdeas(outline, user.uid, ideas ?? null);
            if (!newIdeas?.length) {
                showErrorToast("No ideas. Try again.");
                throw new Error("No ideas returned from AI");
            }
            setIdeas((prev) => {
                if (!prev?.length) prev = [];
                return [...prev, ...newIdeas || []];
            });
            setCurrentStage(1);
            setActiveAccordion("ideas");
        } catch (err) {
            console.error(err);
            showErrorToast("Failed to generate ideas.");
        }
        hideLoading();
        setIdeasLoading(false);
    };

    const handleBuildCase = async () => {
        if (selectedIdeaIdx === null) {
            showErrorToast("Select an idea first.");
            return;
        }
        setFullCase(null);
        setCaseLoading(true);
        showLoading();
        try {
            const outline = {
                caseType,
                scorable,
                setting,
                learningGoal,
                targetAudience,
                extraInfo,
            };
            const idea = ideas[selectedIdeaIdx];
            const result = await buildCase(outline, idea, user.uid);
            setFullCase(result);
            setCurrentStage(2);
            setActiveAccordion("build");
        } catch (err) {
            console.error(err);
            showErrorToast("Failed to build case.");
        }
        hideLoading();
        setCaseLoading(false);
    };

    const handleRefineCase = async () => {
        const hasComments = Object.values(comments).some(comment => comment.trim());
        if (!hasComments) {
            showErrorToast("Enter feedback before iterating.");
            return;
        }
        setRefining(true);
        showLoading();
        try {
            const result = await refineCase(fullCase, comments, user.uid);
            setFullCase(result);
            setComments({
                title: "",
                generalInstruct: "",
                aName: "",
                aInstruct: "",
                bName: "",
                bInstruct: "",
                params: "",
                general: ""
            });
            showSuccessToast("Case updated.");
        } catch (err) {
            console.error(err);
            showErrorToast("Refinement failed.");
        }
        hideLoading();
        setRefining(false);
    };

    const handleSaveCase = async () => {
        if (!fullCase) return;
        showLoading();
        try {
            const result = await saveGeneratedCase(fullCase, user.uid);
            if (result?.success) {
                showSuccessToast("Case saved!");
                setFullCase((prev) => {
                    return { ...prev, id: result.id };
                });
            } else {
                showErrorToast(result?.error || "Save failed.");
            }
        } catch (err) {
            console.error(err);
            showErrorToast("Save failed.");
        }
        hideLoading();
    };

    const StageBadge = ({ num }) => (
        <div className="inline-flex items-center justify-center w-5 h-5 bg-blue-700 rounded-full mr-2">
            <span className="text-white text-xs font-bold">{num}</span>
        </div>
    );

    const DisabledOverlay = () => (
        <div className="absolute inset-0 bg-white/50 cursor-not-allowed" />
    );

    return (
        <div className="flex flex-col min-h-screen p-2 md:p-4">
            <h1 className="text-3xl font-bold text-blue-700 mb-2">New Negotiation Case</h1>

            <Accordion
                type="single"
                className="w-full"
                value={activeAccordion}
                onValueChange={(value) => setActiveAccordion(value)}
                collapsible
            >
                <AccordionItem value="outline">
                    <div className="flex items-center justify-start space-x-2">
                        <AccordionTrigger disabled={false}>
                            <div className="text-md inline-flex items-center">
                                <StageBadge num={1} />
                                <span className="font-semibold text-blue-700">General Outline</span>
                                {outlineCompleted() && (
                                    <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                                )}
                            </div>
                        </AccordionTrigger>
                        <InfoTooltip iconOnly={true} info="This is where you set the high-level direction for your new case. The AI can work with just a setting, but the more detail you give here, the more tailored and realistic the scenario will be." />
                    </div>

                    <AccordionContent>
                        <div className="relative">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 py-1">
                                <div className="space-y-1">
                                    <div className="flex items-start space-x-2">
                                        <Label className="text-blue-700 font-semibold" htmlFor="caseType">
                                            Case Type
                                        </Label>
                                        <InfoTooltip iconOnly={true} info="Chooses the overall structure and complexity of the simulation – from a quick warm-up to a multi-issue negotiation. It guides how many issues, parties, and points of tension the AI should include." />
                                    </div>
                                    <Select
                                        id="caseType"
                                        disabled={currentStage > 0}
                                        onValueChange={(v) => setCaseType(v)}
                                        defaultValue={caseType}
                                    >
                                        <SelectTrigger className="rounded-2xl">
                                            <SelectValue placeholder="Select case type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {caseTypeOptions.map((opt) => (
                                                <SelectItem key={opt.id} value={opt.id}>
                                                    {opt.label} {process.env.NEXT_PUBLIC_ENVIRON !== "prod" && (<span className="text-orange-600">[{opt.adminTip}]</span>)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center">
                                    <Switch
                                        id="scorable"
                                        checked={scorable}
                                        onCheckedChange={(v) => setScorable(v)}
                                        disabled={currentStage > 0}
                                        className="mr-2"
                                    />
                                    <div className="flex items-start space-x-2">
                                        <Label htmlFor="scorable" className="text-blue-700 font-semibold">
                                            Scorable case
                                        </Label>
                                        <InfoTooltip iconOnly={true} info="Turn scoring on when you want an automatic points formula for each party. At least one deal parameter must be numeric so the AI can calculate scores." />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2 py-2">
                                <div className="space-y-1">
                                    <div className="flex items-start space-x-2">
                                        <Label
                                            className="text-blue-700 font-semibold"
                                            htmlFor="setting"
                                        >
                                            Setting (required)
                                        </Label>
                                        <InfoTooltip iconOnly={true} info="Describe who is negotiating with whom and about what. Example: 'Supplier from Brazil selling specialty coffee beans to a U.S. roaster.' (required)." />
                                    </div>
                                    <Textarea
                                        id="setting"
                                        placeholder="Who negotiates with whom, what about, etc."
                                        value={setting}
                                        onChange={(e) => setSetting(e.target.value)}
                                        disabled={currentStage > 0}
                                        className="rounded-2xl min-h-[6rem]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-start space-x-2">
                                        <Label className="text-blue-700 font-semibold" htmlFor="learningGoal">
                                            Learning Goal
                                        </Label>
                                        <InfoTooltip iconOnly={true} info="What skill or concept should participants practice? For example 'Expand the pie and create joint gains' or 'Master hard distributive bargaining'." />
                                    </div>
                                    <Textarea
                                        id="learningGoal"
                                        placeholder="What should this simulation teach?"
                                        value={learningGoal}
                                        onChange={(e) => setLearningGoal(e.target.value)}
                                        disabled={currentStage > 0}
                                        className="rounded-2xl min-h-[6rem]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-start space-x-2">
                                        <Label className="text-blue-700 font-semibold" htmlFor="targetAudience">
                                            Target Audience
                                        </Label>
                                        <InfoTooltip iconOnly={true} info="Who will use the case? Their background helps the AI pick appropriate jargon and stakes. Ex: MBA students, in-house counsel, sales managers." />
                                    </div>
                                    <Textarea
                                        id="targetAudience"
                                        placeholder="e.g., MBA students, litigators, sales reps"
                                        value={targetAudience}
                                        onChange={(e) => setTargetAudience(e.target.value)}
                                        disabled={currentStage > 0}
                                        className="rounded-2xl min-h-[6rem]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-start space-x-2">
                                        <Label className="text-blue-700 font-semibold" htmlFor="extraInfo">
                                            Extra Info
                                        </Label>
                                        <InfoTooltip iconOnly={true} info="Anything else that could shape the scenario – cultural context, preferred industry, constraints to include, or elements to avoid." />
                                    </div>
                                    <Textarea
                                        id="extraInfo"
                                        placeholder="Any other considerations."
                                        value={extraInfo}
                                        onChange={(e) => setExtraInfo(e.target.value)}
                                        disabled={currentStage > 0}
                                        className="rounded-2xl min-h-[6rem]"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end px-2 py-2">
                                {currentStage === 0 && (
                                    <Button
                                        variant="default"
                                        disabled={!outlineCompleted()}
                                        className="rounded-full"
                                        onClick={() => handleGenerateIdeas()}
                                    >
                                        Next
                                    </Button>
                                )}
                                {currentStage > 0 && outlineCompleted() && (
                                    <Button
                                        variant="outline"
                                        className="rounded-full border-red-300 text-red-600 hover:bg-red-50"
                                        onClick={handleResetOutline}
                                    >
                                        <RefreshCcw className="h-4 w-4 mr-2" />
                                        Reset & Start Over
                                    </Button>
                                )}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ideas">
                    <div className="flex items-center justify-start space-x-2">
                        <AccordionTrigger disabled={currentStage < 1}>
                            <div className="text-md inline-flex items-center">
                                <StageBadge num={2} />
                                <span className="font-semibold text-blue-700">Initial Ideas</span>
                                {ideasCompleted() && (
                                    <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                                )}
                            </div>
                        </AccordionTrigger>
                        <InfoTooltip iconOnly={true} info="Click an idea card to select it as the base for a full case, or generate another batch if nothing fits." />
                    </div>
                    <AccordionContent>
                        <div className="relative">
                            {currentStage < 1 && (
                                <div className="text-center py-8 text-gray-500">
                                    Complete the outline first to generate ideas.
                                </div>
                            )}
                            {currentStage >= 1 && ideas.length === 0 && (
                                <div className="flex justify-center py-4">
                                    <Button
                                        variant="default"
                                        className="rounded-full"
                                        onClick={handleGenerateIdeas}
                                        disabled={ideasLoading}
                                    >
                                        {ideasLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Plus className="h-4 w-4" />
                                        )}
                                        Generate Ideas
                                    </Button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {ideas.map((idea, idx) => (
                                    <Card
                                        key={idx}
                                        className={`p-4 cursor-pointer border-2 rounded-2xl transition-all duration-200 ${selectedIdeaIdx === idx
                                            ? "border-blue-600 border-4 shadow-2xl shadow-blue-400/60 ring-4 ring-blue-300/30"
                                            : "border-transparent hover:border-blue-300 hover:shadow-xl hover:shadow-blue-400/30 hover:ring-2 hover:ring-blue-300/15"
                                            }`}
                                        onClick={() => {
                                            setSelectedIdeaIdx(idx);
                                            if (fullCase && selectedIdeaIdx !== idx) {
                                                setCurrentStage(Math.max(1, currentStage));
                                            }
                                        }}
                                    >
                                        <h2 className="font-semibold text-blue-700 mb-1">
                                            {idea.caseTitle}
                                        </h2>
                                        <p className="text-sm mb-1">{idea.context}</p>
                                        <p className="text-sm text-gray-700 mb-1">
                                            <strong>Parties:</strong> {idea.partyAName} vs {idea.partyBName}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            <strong>Deal parameters:</strong> {idea.parameters}
                                        </p>
                                    </Card>
                                ))}
                            </div>

                            {ideas.length > 0 && (
                                <div className="flex justify-end gap-2 py-4">
                                    <Button
                                        variant="outline"
                                        className="rounded-full"
                                        disabled={ideasLoading}
                                        onClick={handleGenerateIdeas}
                                        title="Generate another batch"
                                    >
                                        <RefreshCcw className="h-4 w-4" /> Get more ideas
                                    </Button>
                                    {selectedIdeaIdx !== null && (
                                        <Button
                                            variant="default"
                                            className="rounded-full font-semibold"
                                            disabled={caseLoading}
                                            onClick={handleBuildCase}
                                        >
                                            {caseLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Plus className="h-4 w-4" strokeWidth={4} />
                                            )}
                                            {fullCase ? "Generate New Case" : "Create Case"}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="build" disabled={currentStage < 2}>
                    <div className="flex items-center justify-start space-x-2">
                        <AccordionTrigger
                            className={currentStage < 2 ? "cursor-not-allowed" : ""}
                            onClick={(e) => {
                                if (currentStage < 2) e.preventDefault();
                            }}
                        >
                            <div className="text-md inline-flex items-center">
                                <StageBadge num={3} />
                                <span className="font-semibold text-blue-700">Full Case</span>
                            </div>
                        </AccordionTrigger>
                        <InfoTooltip iconOnly={true} info="Review every section, add comments where you’d like changes, then press ‘Iterate’. Repeat until satisfied, then save the finished case." />
                    </div>
                    <AccordionContent>
                        {caseLoading && (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        )}

                        {fullCase && (
                            <div className="space-y-6">
                                <Card className="p-6 border-2 border-blue-200 shadow-xl shadow-blue-100/50 ring-2 ring-blue-100/30 rounded-3xl bg-gradient-to-br from-white to-blue-50/30">
                                    <div className="space-y-6">
                                        <div className="border-b border-blue-100 pb-4">
                                            <h2 className="text-2xl font-bold text-blue-700 mb-3">
                                                {fullCase.title}
                                            </h2>
                                            <div className="relative group px-2">
                                                <Textarea
                                                    placeholder="💭 Comments on title..."
                                                    value={comments.title}
                                                    rows={1}
                                                    onChange={(e) => setComments(prev => ({ ...prev, title: e.target.value }))}
                                                    className="italic text-sm min-h-[2.5rem] border-blue-200 bg-white/80 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder:text-gray-400"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="font-bold text-lg text-blue-600 flex items-center gap-2">
                                                📋 General Instructions
                                            </h3>
                                            <div className="bg-white/80 p-4 rounded-xl border-2 border-blue-200 shadow-sm">
                                                <div
                                                    className="text-gray-800 whitespace-pre-wrap"
                                                    dangerouslySetInnerHTML={{ __html: fullCase.generalInstruct }}
                                                />
                                            </div>
                                            <div className="relative group px-2">
                                                <Textarea
                                                    placeholder="💭 Comments on general instructions..."
                                                    value={comments.generalInstruct}
                                                    onChange={(e) => setComments(prev => ({ ...prev, generalInstruct: e.target.value }))}
                                                    className="italic text-sm min-h-[2.5rem] border-blue-200 bg-white/60 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder:text-gray-400"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <h3 className="font-bold text-lg text-blue-600 flex items-center gap-2">
                                                    👤 {fullCase.aName} Instructions
                                                </h3>
                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border-2 border-blue-200 shadow-sm max-h-60 overflow-y-auto">
                                                    <div
                                                        className="text-gray-800 whitespace-pre-wrap"
                                                        dangerouslySetInnerHTML={{ __html: fullCase.aInstruct }}
                                                    />
                                                </div>
                                                <div className="relative group px-2">
                                                    <Textarea
                                                        placeholder={`💭 Comments on ${fullCase.aName} instructions...`}
                                                        value={comments.aInstruct}
                                                        onChange={(e) => setComments(prev => ({ ...prev, aInstruct: e.target.value }))}
                                                        className="italic text-sm min-h-[2.5rem] border-blue-200 bg-white/60 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder:text-gray-400"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="font-bold text-lg text-blue-600 flex items-center gap-2">
                                                    👤 {fullCase.bName} Instructions
                                                </h3>
                                                <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 rounded-xl border-2 border-green-200 shadow-sm max-h-60 overflow-y-auto">
                                                    <div
                                                        className="text-gray-800 whitespace-pre-wrap"
                                                        dangerouslySetInnerHTML={{ __html: fullCase.bInstruct }}
                                                    />
                                                </div>
                                                <div className="relative group px-2">
                                                    <Textarea
                                                        placeholder={`💭 Comments on ${fullCase.bName} instructions...`}
                                                        value={comments.bInstruct}
                                                        onChange={(e) => setComments(prev => ({ ...prev, bInstruct: e.target.value }))}
                                                        className="italic text-sm min-h-[2.5rem] border-green-200 bg-white/60 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-green-300 focus:border-green-400 placeholder:text-gray-400"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="font-bold text-lg text-blue-600 flex items-center gap-2">
                                                ⚙️ Deal Parameters
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {fullCase.params?.map((param, idx) => (
                                                    <div key={param.id} className="bg-white/80 p-3 rounded-xl border-2 border-gray-200 shadow-sm">
                                                        <span className="font-semibold text-gray-800">{param.name}</span>
                                                        <span className="text-gray-500 ml-2">({param.dataType === 'number' ? 'number' : 'text'})</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="relative group px-2">
                                                <Textarea
                                                    placeholder="💭 Comments on parameters..."
                                                    value={comments.params}
                                                    onChange={(e) => setComments(prev => ({ ...prev, params: e.target.value }))}
                                                    className="italic text-sm min-h-[2.5rem] border-blue-200 bg-white/60 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder:text-gray-400"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-4 border-t border-blue-100">
                                            <span className="font-bold text-blue-600 text-lg">📊 Scorable Case:</span>
                                            <span className={`px-4 py-2 rounded-full font-semibold ${fullCase.scorable ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                                                {fullCase.scorable ? '✅ Yes' : '❌ No'}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="font-bold text-lg text-blue-600 flex items-center gap-2">
                                                💬 General Feedback & Overall Comments
                                            </h3>
                                            <Textarea
                                                id="generalComment"
                                                className="rounded-xl min-h-[5rem] border-blue-200 bg-white/80 transition-all duration-200 focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                                                placeholder="💭 Overall feedback on the case, structure, or any other general comments..."
                                                value={comments.general}
                                                onChange={(e) => setComments(prev => ({ ...prev, general: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </Card>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="rounded-full border-blue-300 text-blue-600 hover:bg-blue-50 transition-all duration-200"
                                        onClick={handleRefineCase}
                                        disabled={refining}
                                    >
                                        {refining ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCcw className="h-4 w-4" />
                                        )}
                                        Iterate
                                    </Button>
                                    <Button
                                        variant="default"
                                        className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                                        onClick={handleSaveCase}
                                    >
                                        💾 Save Case
                                    </Button>
                                </div>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
