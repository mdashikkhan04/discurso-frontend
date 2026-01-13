"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchNegIds, fetchPracticeMessages, fetchPeerMessages, fetchFeedbacks, fetchSurveys, generateFeedback, generateSurvey, generateP2PFeedback, deleteFeedback, deleteSurvey } from "@/actions/feedbacks";
import { getP2POffer } from "@/actions/ai";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import TranscriptUpload from "@/components/TranscriptUpload";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    Loader2,
    Trash2,
    MessageSquare,
    BarChart3,
    FileText,
    Zap,
    Bot,
    User,
    ChevronDown,
    TrendingUp,
    Brain,
    Users
} from "lucide-react";

export default function FeedbacksPage() {
    const [aiNegIds, setAiNegIds] = useState([]);
    const [p2pNegIds, setP2pNegIds] = useState([]);
    const [localP2PNegotiations, setLocalP2PNegotiations] = useState([]);
    const [selectedNegId, setSelectedNegId] = useState(null);
    const [showTranscriptUpload, setShowTranscriptUpload] = useState(false);
    const [messages, setMessages] = useState([]);
    const [p2pMessages, setP2pMessages] = useState([]);
    const [acase, setCase] = useState(null);
    const [messageType, setMessageType] = useState('ai');
    const [feedbacks, setFeedbacks] = useState(null);
    const [p2pFeedbacks, setP2pFeedbacks] = useState(null);
    const [surveys, setSurveys] = useState(null);
    const [labels, setLabels] = useState(null);
    const [survLabels, setSurvLabels] = useState(null);
    const [isAINegotiationsOpen, setIsAINegotiationsOpen] = useState(false);
    const [isP2PNegotiationsOpen, setIsP2PNegotiationsOpen] = useState(false);
    const [p2pOffer, setP2pOffer] = useState([]);
    const [loading, setLoading] = useState({
        negIds: true,
        messages: false,
        p2pMessages: false,
        feedback: false,
        survey: false,
        generating: false
    });
    const [error, setError] = useState(null);
    const { user } = useUser();

    const combinedP2PNegotiations = useMemo(() => {
        if (!localP2PNegotiations.length) return [...p2pNegIds];
        const merged = [...localP2PNegotiations, ...p2pNegIds];
        return merged.sort((a, b) => (b.time || 0) - (a.time || 0));
    }, [localP2PNegotiations, p2pNegIds]);

    const findP2PNegotiationById = useCallback((id) => {
        if (!id) return undefined;
        return localP2PNegotiations.find(neg => neg.id === id) || p2pNegIds.find(neg => neg.id === id);
    }, [localP2PNegotiations, p2pNegIds]);

    useEffect(() => {
        loadNegIds();
    }, []);

    useEffect(() => {
        if (!selectedNegId) return;

        loadMessages(selectedNegId);

        const selectedP2PNeg = findP2PNegotiationById(selectedNegId);
        const isLocalP2P = selectedP2PNeg?.isLocal;
        const feedbackTarget = selectedNegId ||selectedP2PNeg?.negIds;

        if (selectedP2PNeg && selectedP2PNeg.negIds && !isLocalP2P) {
            loadFeedbacks(feedbackTarget);
            loadSurvey(selectedNegId);
        } else if (!selectedP2PNeg) {
            loadFeedbacks(feedbackTarget);
            loadSurvey(selectedNegId);
        } else {
            setFeedbacks(null);
            setP2pFeedbacks(null);
            setSurveys(null);
            setLabels(null);
            setSurvLabels(null);
        }
    }, [selectedNegId, findP2PNegotiationById]);

    const loadNegIds = async () => {
        setLoading(prev => ({ ...prev, negIds: true }));
        setError(null);
        try {
            const result = await fetchNegIds();
            if (result.success) {
                setAiNegIds(result.data.ai || []);
                setP2pNegIds(result.data.p2p || []);
            } else {
                setError(`Failed to load practice IDs: ${result.error}`);
            }
        } catch (err) {
            setError(`Error loading practice IDs: ${err.message}`);
        } finally {
            setLoading(prev => ({ ...prev, negIds: false }));
        }
    };

    const loadMessages = async (negId) => {
        setLoading(prev => ({ ...prev, messages: true, p2pMessages: true }));
        setError(null);
        setP2pOffer([]);

        const selectedP2PNeg = findP2PNegotiationById(negId);
        if (selectedP2PNeg?.isLocal) {
            setMessages([]);
            setP2pMessages(selectedP2PNeg.messages || []);
            setCase(selectedP2PNeg.caseLabel || null);
            setMessageType('p2p');
            setLoading(prev => ({ ...prev, messages: false, p2pMessages: false }));
            return;
        }

        try {
            if (selectedP2PNeg) {
                const result = await fetchPeerMessages(selectedP2PNeg.negIds, selectedP2PNeg.caseId, selectedP2PNeg.eventId, selectedP2PNeg.round);
                if (result.success) {
                    setMessages(result.data);
                    setP2pMessages(result.data);
                    setCase(result.case);
                    setMessageType('p2p');
                } else {
                    setError(`Failed to load P2P messages: ${result.error}`);
                    setMessages([]);
                    setP2pMessages([]);
                    setCase(null);
                    setMessageType('p2p');
                }
            } else {
                const result = await fetchPracticeMessages(negId);
                if (result.success) {
                    setMessages(result.data);
                    setCase(result.case);
                    setMessageType('ai');
                    setP2pMessages([]);
                } else {
                    setError(`Failed to load AI messages: ${result.error}`);
                    setMessages([]);
                    setCase(null);
                    setMessageType('ai');
                    setP2pMessages([]);
                }
            }
        } catch (err) {
            setError(`Error loading messages: ${err.message}`);
            setMessages([]);
            setCase(null);
            setMessageType(null);
            setP2pMessages([]);
        } finally {
            setLoading(prev => ({ ...prev, messages: false, p2pMessages: false }));
        }
    };

    const loadFeedbacks = async (negId) => {
        setLoading(prev => ({ ...prev, feedback: true }));
        setError(null);
        try {
            const result = await fetchFeedbacks(negId);
            if (result.success) {
                setFeedbacks(result.data);
                setLabels(result.labels);
            } else {
                setError(`Failed to load feedback: ${result.error}`);
            }
        } catch (err) {
            setError(`Error loading feedback: ${err.message}`);
        } finally {
            setLoading(prev => ({ ...prev, feedback: false }));
        }
    };

    const handleGenerateFeedback = async (model) => {
        if (!selectedNegId) return;
        if (confirm("Do you want generate feedback? Mind the cost...") === false) return;

        setLoading(prev => ({ ...prev, generating: true }));
        setError(null);
        try {
            const result = await generateFeedback(selectedNegId, model);
            if (result.success) {
                await loadFeedbacks(selectedNegId);
            } else {
                setError(`Failed to generate feedback: ${result.error}`);
            }
        } catch (err) {
            setError(`Error generating feedback: ${err.message}`);
        } finally {
            setLoading(prev => ({ ...prev, generating: false }));
        }
    };

    const handleGenerateP2PFeedback = async (model) => {
        if (!selectedNegId) return;
        if (confirm("Do you want to generate P2P feedback? Mind the cost...") === false) return;

        const selectedP2PNeg = findP2PNegotiationById(selectedNegId);
        if (!selectedP2PNeg) {
            setError("P2P negotiation data not found");
            return;
        }
        if (selectedP2PNeg.isLocal && (!selectedP2PNeg.eventId || !selectedP2PNeg.round || !selectedP2PNeg.negIds || !selectedP2PNeg.negIds.length)) {
            setError("Transcript negotiation is missing event details required for feedback generation.");
            return;
        }

        const feedbackPayload = {
            eventId: selectedP2PNeg.eventId,
            round: selectedP2PNeg.round,
            negId: selectedP2PNeg.negIds,
            model,
        };

        if (selectedP2PNeg.messages) feedbackPayload.messages = selectedP2PNeg.messages;
        if (selectedP2PNeg.sides) feedbackPayload.sides = selectedP2PNeg.sides;

        setLoading(prev => ({ ...prev, generating: true }));
        setError(null);
        try {
            const result = await generateP2PFeedback(feedbackPayload);
            if (result.success) {
                setP2pFeedbacks(result.feedbackMap);
                await loadFeedbacks(feedbackPayload.negId);
            } else {
                setError(`Failed to generate P2P feedback: ${result.error}`);
            }
        } catch (err) {
            setError(`Error generating P2P feedback: ${err.message}`);
        } finally {
            setLoading(prev => ({ ...prev, generating: false }));
        }
    };

    const handleExtractP2POffer = async (model) => {
        if (!selectedNegId) return;
        if (confirm("Do you want to extract P2P offer? Mind the cost...") === false) return;

        const selectedP2PNeg = findP2PNegotiationById(selectedNegId);
        if (!selectedP2PNeg) {
            setError("P2P negotiation data not found");
            return;
        }
        if (selectedP2PNeg.isLocal && (!selectedP2PNeg.caseId || !selectedP2PNeg.negIds || !selectedP2PNeg.negIds.length)) {
            setError("Transcript negotiation is missing case or negotiation identifiers required for offer extraction.");
            return;
        }

        setLoading(prev => ({ ...prev, generating: true }));
        setError(null);
        try {
            const result = await getP2POffer({
                negId: selectedP2PNeg.negIds,
                caseId: selectedP2PNeg.caseId,
                userId: user.uid,
                llmModel: model
            });
            if (result?.offer) {
                setP2pOffer(result.offer);
            } else {
                setError(`Failed to extract P2P offer: ${result?.error || "Unknown error"}`);
            }
        } catch (err) {
            setError(`Error extracting P2P offer: ${err.message}`);
        } finally {
            setLoading(prev => ({ ...prev, generating: false }));
        }
    };

    const handleTranscriptComplete = useCallback(async ({ messages: transcriptMessages = [], sides = { a: [], b: [] }, eventId, round }) => {
        if (!Array.isArray(transcriptMessages) || transcriptMessages.length === 0) {
            return;
        }

        const baseTimestamp = Date.now();
        const normalisedMessages = transcriptMessages
            .map((message, index) => {
                const userLabel = (message?.user || "").trim() || `Speaker ${index + 1}`;
                const content = (message?.content || "").trim();
                if (!content) return null;
                return {
                    userId: userLabel,
                    content,
                    timestamp: baseTimestamp + index,
                };
            })
            .filter(Boolean);

        if (!normalisedMessages.length) {
            return;
        }

        const uniqueUserIds = [...new Set(normalisedMessages.map(msg => msg.userId))];
        const numericRound = typeof round === "number" && Number.isFinite(round) ? round : Number.isFinite(Number(round)) ? Number(round) : undefined;

        const matchedExisting = (() => {
            if (!eventId || !numericRound) return undefined;
            const roundMatches = p2pNegIds.filter(neg => neg.eventId === eventId && Number(neg.round) === Number(numericRound));
            if (!roundMatches.length) return undefined;
            if (uniqueUserIds.length) {
                const directMatch = roundMatches.find(neg => (neg.userIds || []).every(id => uniqueUserIds.includes(id)) || uniqueUserIds.every(id => (neg.userIds || []).includes(id)));
                if (directMatch) return directMatch;
            }
            return roundMatches[0];
        })();

        const createHashId = async (value) => {
            try {
                if (typeof window !== "undefined" && window.crypto?.subtle) {
                    const encoder = new TextEncoder();
                    const data = encoder.encode(value);
                    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
                    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
                }
            } catch (hashError) {
                console.error("Failed to create transcript hash", hashError);
            }
            return `${value}-${Math.random().toString(36).slice(2, 10)}`;
        };

        const baseId = `transcript-${baseTimestamp}`;
        let negIds = Array.isArray(matchedExisting?.negIds) ? [...matchedExisting.negIds] : [];
        if (!negIds.length) {
            const sideA = uniqueUserIds[0] || "sideA";
            const sideB = uniqueUserIds[1] || "sideB";
            const contextEvent = eventId || "transcript";
            const contextRound = numericRound || 1;
            const hashA = await createHashId(`${contextEvent}-${contextRound}-${sideA}-${baseId}-a`);
            const hashB = await createHashId(`${contextEvent}-${contextRound}-${sideB}-${baseId}-b`);
            negIds = Array.from(new Set([hashA, hashB].filter(Boolean)));
        }

        const caseLabel = matchedExisting?.caseId
            ? matchedExisting.caseId
            : eventId
                ? `${eventId}${numericRound ? ` • Round ${numericRound}` : ""}`
                : "Transcript Upload";

        const newEntry = {
            id: baseId,
            label: negIds?.[0] || baseId,
            time: baseTimestamp,
            count: normalisedMessages.length,
            negIds,
            caseId: matchedExisting?.caseId || null,
            eventId: matchedExisting?.eventId || eventId || null,
            round: matchedExisting?.round || numericRound || null,
            userIds: uniqueUserIds,
            real: false,
            isLocal: true,
            messages: normalisedMessages,
            sides,
            teamA: matchedExisting?.teamA,
            teamB: matchedExisting?.teamB,
            caseLabel,
        };

        setLocalP2PNegotiations(prev => [newEntry, ...prev.filter(neg => neg.id !== baseId)]);
        setSelectedNegId(baseId);
        setCase(newEntry.caseLabel);
        setP2pMessages(normalisedMessages);
        setMessages([]);
        setMessageType('p2p');
        setP2pOffer([]);
        setFeedbacks(null);
        setP2pFeedbacks(null);
        setSurveys(null);
        setLabels(null);
        setSurvLabels(null);
        setShowTranscriptUpload(false);
    }, [p2pNegIds]);

    const handleDeleteFeedback = async (feedbackId) => {
        if (!confirm("Are you sure you want to delete this feedback?")) return;

        try {
            const result = await deleteFeedback(feedbackId);
            if (result.success) {
                setFeedbacks(prevFeedbacks =>
                    prevFeedbacks.filter(feedback => feedback.id !== feedbackId)
                );
            } else {
                setError(`Failed to delete feedback: ${result.error}`);
            }
        } catch (err) {
            setError(`Error deleting feedback: ${err.message}`);
        }
    };

    const loadSurvey = async (negId) => {
        setLoading(prev => ({ ...prev, survey: true }));
        setError(null);
        try {
            const result = await fetchSurveys(negId);
            if (result.success) {
                setSurveys(result.data);
                setSurvLabels(result.labels);
            } else {
                setError(`Failed to load survey: ${result.error}`);
            }
        } catch (err) {
            setError(`Error loading survey: ${err.message}`);
        } finally {
            setLoading(prev => ({ ...prev, survey: false }));
        }
    };

    const handleGenerateSurvey = async (model) => {
        if (!selectedNegId) return;
        if (confirm("Do you want generate survey? Mind the cost...") === false) return;

        setLoading(prev => ({ ...prev, generating: true }));
        setError(null);
        try {
            const result = await generateSurvey(selectedNegId, model);
            if (result.success) {
                await loadSurvey(selectedNegId);
            } else {
                setError(`Failed to generate survey: ${result.error}`);
            }
        } catch (err) {
            setError(`Error generating survey: ${err.message}`);
        } finally {
            setLoading(prev => ({ ...prev, generating: false }));
        }
    };

    const handleDeleteSurvey = async (surveyId) => {
        if (!confirm("Are you sure you want to delete this survey?")) return;

        try {
            const result = await deleteSurvey(surveyId);
            if (result.success) {
                setSurveys(prevSurveys =>
                    prevSurveys.filter(survey => survey.id !== surveyId)
                );
            } else {
                setError(`Failed to delete survey: ${result.error}`);
            }
        } catch (err) {
            setError(`Error deleting survey: ${err.message}`);
        }
    };

    const getSelectedNegotiationType = () => {
        if (!selectedNegId) return null;
        if (findP2PNegotiationById(selectedNegId)) {
            return 'p2p';
        }
        if (aiNegIds.find(neg => neg.id === selectedNegId)) {
            return 'ai';
        }
        return 'ai';
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '—';
        const parsed = new Date(timestamp);
        if (Number.isNaN(parsed.getTime())) return '—';
        return parsed.toLocaleString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-soft-white via-pale-blue/30 to-white p-2 md:p-4">
            <div className="max-w-full mx-auto">
                <div className="mb-8">

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="font-medium">{error}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-1 space-y-4">
                        <Collapsible open={isAINegotiationsOpen} onOpenChange={setIsAINegotiationsOpen}>
                            <Card className="bg-white/90 backdrop-blur-sm border-pale-gray shadow-lg rounded-2xl overflow-hidden">
                                <CollapsibleTrigger className="w-full">
                                    <CardHeader className="bg-gradient-to-r from-vivid-blue to-deep-blue text-white hover:from-vivid-blue/90 hover:to-deep-blue/90 transition-colors">
                                        <CardTitle className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Bot size={20} />
                                                AI Negotiations
                                            </div>
                                            <ChevronDown className={`h-5 w-5 transition-transform ${isAINegotiationsOpen ? 'rotate-180' : ''}`} />
                                        </CardTitle>
                                    </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <CardContent className="p-2">
                                        {loading.negIds ? (
                                            <div className="flex justify-center py-8">
                                                <Loader2 className="h-8 w-8 animate-spin text-vivid-blue" />
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                                {aiNegIds.map((neg) => (
                                                    <Button
                                                        key={neg.id}
                                                        variant={selectedNegId === neg.id ? "default" : "outline"}
                                                        className={`w-full p-3 h-auto rounded-xl transition-all duration-200 hover:scale-105 ${selectedNegId === neg.id
                                                            ? "bg-vivid-blue text-white shadow-lg"
                                                            : "border-pale-gray hover:border-vivid-blue hover:bg-pale-blue/50"
                                                            }`}
                                                        onClick={() => {
                                                            setSelectedNegId(neg.id);
                                                            setCase(null);
                                                        }}
                                                    >
                                                        <div className="flex flex-col items-start text-left w-full">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-xs font-mono px-2 py-1 rounded-full ${selectedNegId === neg.id
                                                                    ? "bg-white/20 text-white"
                                                                    : neg.real ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                                                                    }`}>
                                                                    {neg.id.substring(0, neg.real ? 34 : 38)}...
                                                                </span>
                                                                {neg.real && (
                                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${selectedNegId === neg.id
                                                                        ? "bg-white/20 text-white"
                                                                        : "bg-green-100 text-green-700"
                                                                        }`}>
                                                                        REAL
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className={`text-xs ${selectedNegId === neg.id ? "text-white/80" : "text-gray-600"
                                                                }`}>
                                                                {formatTimestamp(neg.time)}
                                                            </span>
                                                            <span className={`text-sm font-medium ${selectedNegId === neg.id ? "text-white" : "text-vivid-blue"
                                                                }`}>
                                                                {neg.count} messages
                                                            </span>
                                                        </div>
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>

                        <Collapsible open={isP2PNegotiationsOpen} onOpenChange={setIsP2PNegotiationsOpen}>
                            <Card className="bg-white/90 backdrop-blur-sm border-pale-gray shadow-lg rounded-2xl overflow-hidden">
                                <CollapsibleTrigger className="w-full">
                                    <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-600/90 hover:to-emerald-600/90 transition-colors">
                                        <CardTitle className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users size={20} />
                                                P2P Negotiations
                                            </div>
                                            <ChevronDown className={`h-5 w-5 transition-transform ${isP2PNegotiationsOpen ? 'rotate-180' : ''}`} />
                                        </CardTitle>
                                    </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <CardContent className="p-2">
                                        {loading.negIds ? (
                                            <div className="flex justify-center py-8">
                                                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                                    {combinedP2PNegotiations.map((neg) => {
                                                        const isSelected = selectedNegId === neg.id;
                                                        const baseClasses = isSelected
                                                            ? "bg-green-600 text-white shadow-lg"
                                                            : "border-pale-gray hover:border-green-600 hover:bg-green-50";
                                                        return (
                                                            <Button
                                                                key={neg.id}
                                                                variant={isSelected ? "default" : "outline"}
                                                                className={`w-full p-3 h-auto rounded-xl transition-all duration-200 hover:scale-105 ${baseClasses}`}
                                                                onClick={() => {
                                                                    setSelectedNegId(neg.id);
                                                                    setCase(null);
                                                                }}
                                                            >
                                                                <div className="flex flex-col items-start text-left w-full">
                                                                    <div className="flex items-center gap-2 mb-1 w-full">
                                                                        <span
                                                                            className={`text-xs font-mono px-2 py-1 rounded-full truncate max-w-[220px] ${isSelected ? "bg-white/20 text-white" : "bg-green-100 text-green-700"}`}
                                                                            title={neg.label || neg.id}
                                                                        >
                                                                            {neg.label || neg.id}
                                                                        </span>
                                                                        {(neg.isLocal || neg.isTranscript) && (
                                                                            <span className="text-xs px-2 py-1 rounded-full font-medium bg-emerald-100 text-emerald-700">
                                                                                TRANSCRIPT
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className={`text-xs ${isSelected ? "text-white/80" : "text-gray-600"}`}>
                                                                        {formatTimestamp(neg.time)}
                                                                    </span>
                                                                    <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-green-600"}`}>
                                                                        {neg.count} messages
                                                                    </span>
                                                                </div>
                                                            </Button>
                                                        );
                                                    })}
                                                    {combinedP2PNegotiations.length === 0 && (
                                                        <div className="text-center py-4 text-gray-500 text-sm">
                                                            No P2P negotiations found
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    className="w-full p-3 h-auto rounded-xl bg-gradient-to-r from-green-600 via-emerald-600 to-green-500 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-green-500 hover:to-emerald-500"
                                                    onClick={() => setShowTranscriptUpload(true)}
                                                >
                                                    <div className="flex flex-col items-center text-center w-full">
                                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                                            <FileText size={16} />
                                                            Load from Transcript
                                                        </div>
                                                        <span className="text-xs text-white/80 mt-1">
                                                            Upload a negotiation transcript to review
                                                        </span>
                                                    </div>
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>
                    </div>

                    <div className="lg:col-span-3">
                        {selectedNegId ? (
                            <div className="space-y-4">
                                {acase && (
                                    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 shadow-lg rounded-2xl overflow-hidden">
                                        <CardContent className="p-4">
                                            <h2 className="text-2xl font-bold text-center text-darker-gray flex items-center justify-center gap-2">
                                                <FileText size={24} className="text-vivid-blue" />
                                                {acase}
                                            </h2>
                                        </CardContent>
                                    </Card>
                                )}

                                <Card className="bg-white/90 backdrop-blur-sm border-pale-gray shadow-lg rounded-2xl overflow-hidden">
                                    <Accordion type="single" collapsible className="w-full">
                                        {getSelectedNegotiationType() === 'ai' && (
                                            <AccordionItem value="messages" className="border-b border-pale-gray">
                                                <AccordionTrigger className="px-4 py-3 hover:bg-pale-blue/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                                                            <MessageSquare size={20} />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="text-xl font-semibold">AI Messages</div>
                                                            <div className="text-sm text-gray-600">Chat conversation with AI</div>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="px-4 pb-4">
                                                    {loading.messages ? (
                                                        <div className="flex justify-center py-8">
                                                            <Loader2 className="h-8 w-8 animate-spin text-vivid-blue" />
                                                        </div>
                                                    ) : messages.length > 0 ? (
                                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                                            {messages.map((message, index) => (
                                                                <Card key={index} className={`${message.role === "user"
                                                                    ? "bg-blue-50 border-blue-200 ml-8"
                                                                    : "bg-gray-50 border-gray-200 mr-8"
                                                                    } shadow-sm rounded-xl`}>
                                                                    <CardHeader className="py-3 px-4">
                                                                        <div className="flex justify-between items-center">
                                                                            <div className="flex items-center gap-2">
                                                                                {message.role === "user" ? (
                                                                                    <User size={16} className="text-blue-600" />
                                                                                ) : (
                                                                                    <Bot size={16} className="text-gray-600" />
                                                                                )}
                                                                                <span className="font-medium text-sm">
                                                                                    {message.role === "user" ? "User" : "AI"}
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-xs text-gray-500">
                                                                                {formatTimestamp(message.time)}
                                                                            </span>
                                                                        </div>
                                                                    </CardHeader>
                                                                    <CardContent className="py-2 px-4">
                                                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                                                            <p className="text-gray-500">No messages found for this practice session.</p>
                                                        </div>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        )}

                                        {getSelectedNegotiationType() === 'p2p' && (
                                            <AccordionItem value="p2p-messages" className="border-b border-pale-gray">
                                                <AccordionTrigger className="px-4 py-3 hover:bg-pale-blue/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-xl bg-green-100 text-green-600">
                                                            <MessageSquare size={20} />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="text-xl font-semibold">P2P Messages</div>
                                                            <div className="text-sm text-gray-600">Peer-to-peer conversation</div>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="px-4 pb-4">
                                                    {loading.p2pMessages ? (
                                                        <div className="flex justify-center py-8">
                                                            <Loader2 className="h-8 w-8 animate-spin text-vivid-blue" />
                                                        </div>
                                                    ) : p2pMessages.length > 0 ? (
                                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                                            {p2pMessages.map((message, index) => {
                                                                const uniqueUserIds = [...new Set(p2pMessages.map(msg => msg.userId))];
                                                                const isFirstUser = message.userId === uniqueUserIds[0];

                                                                return (
                                                                    <Card key={index} className={`${isFirstUser
                                                                        ? "bg-blue-50 border-blue-200 ml-8"
                                                                        : "bg-purple-50 border-purple-200 mr-8"
                                                                        } shadow-sm rounded-xl`}>
                                                                        <CardHeader className="py-3 px-4">
                                                                            <div className="flex justify-between items-center">
                                                                                <div className="flex items-center gap-2">
                                                                                    <User size={16} className={isFirstUser ? "text-blue-600" : "text-purple-600"} />
                                                                                    <span className="font-medium text-sm">
                                                                                        {message.userId}
                                                                                    </span>
                                                                                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                                                                                        P2P
                                                                                    </span>
                                                                                </div>
                                                                                <span className="text-xs text-gray-500">
                                                                                    {formatTimestamp(message.timestamp)}
                                                                                </span>
                                                                            </div>
                                                                        </CardHeader>
                                                                        <CardContent className="py-2 px-4">
                                                                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                                                                        </CardContent>
                                                                    </Card>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                                                            <p className="text-gray-500">No P2P messages found for this practice session.</p>
                                                        </div>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        )}

                                        {getSelectedNegotiationType() === 'ai' && (
                                            <>
                                                <AccordionItem value="feedback" className="border-b border-pale-gray">
                                                    <AccordionTrigger className="px-4 py-3 hover:bg-pale-blue/30 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-xl bg-green-100 text-green-600">
                                                                <BarChart3 size={20} />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-xl font-semibold">Feedback</div>
                                                                <div className="text-sm text-gray-600">AI evaluation of user performance</div>
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-4 pb-4">
                                                        <div className="space-y-4">
                                                            {loading.feedback ? (
                                                                <div className="flex justify-center py-8">
                                                                    <Loader2 className="h-8 w-8 animate-spin text-vivid-blue" />
                                                                </div>
                                                            ) : feedbacks?.length > 0 ? (
                                                                <div className="space-y-4">
                                                                    <Accordion type="single" collapsible className="w-full space-y-4">
                                                                        {feedbacks.map((feedback, feedbackIndex) => (
                                                                            <AccordionItem key={feedbackIndex} value={`feedback-${feedbackIndex}`} className="border-0">
                                                                                <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-sm rounded-xl overflow-hidden">
                                                                                    <AccordionTrigger className="px-4 py-4 hover:bg-green-50/50 transition-colors [&[data-state=open]>div>div:last-child]:rotate-180">
                                                                                        <div className="flex justify-between items-center w-full mr-4">
                                                                                            <div className="flex items-center gap-3">
                                                                                                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                                                                                                    <TrendingUp size={16} />
                                                                                                </div>
                                                                                                <div className="text-left">
                                                                                                    <div className="text-md font-medium text-gray-900">
                                                                                                        {messageType === 'p2p' && feedback.isP2P ? (() => {
                                                                                                            const selectedP2PNeg = p2pNegIds.find(neg => neg.id === selectedNegId);
                                                                                                            if (selectedP2PNeg && selectedP2PNeg.negIds && selectedP2PNeg.userIds) {
                                                                                                                const negIdIndex = selectedP2PNeg.negIds.indexOf(feedback.negId);
                                                                                                                const userId = negIdIndex >= 0 ? selectedP2PNeg.userIds[negIdIndex] : feedback.negId;
                                                                                                                return `User ${userId} • `;
                                                                                                            }
                                                                                                            return '';
                                                                                                        })() : ''}Generated: {formatTimestamp(feedback.time)}
                                                                                                    </div>
                                                                                                    <div className="text-sm text-gray-800">
                                                                                                        {feedback.duration}s • {feedback.model} {feedback.cost ? `• $${feedback.cost}` : ""}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleDeleteFeedback(feedback.id);
                                                                                                }}
                                                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                                                                            >
                                                                                                <Trash2 size={16} />
                                                                                            </Button>
                                                                                        </div>
                                                                                    </AccordionTrigger>
                                                                                    <AccordionContent className="px-4 pb-4">
                                                                                        <div className="space-y-4">
                                                                                            <div>
                                                                                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Summary</h3>
                                                                                                <p className="text-sm text-gray-700 leading-relaxed">{feedback.summary}</p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance Scores</h3>
                                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                                    {Object.keys(labels).map((label, index) => (
                                                                                                        <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                                                                                            <div className="flex items-center justify-between mb-2">
                                                                                                                <span className="text-sm font-medium text-gray-900">{labels[label]}</span>
                                                                                                                <div className="flex items-center gap-1">
                                                                                                                    <span className="text-sm font-bold text-vivid-blue">{feedback.scores[label]}/5</span>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                            <p className="text-sm text-gray-700 leading-relaxed">{feedback.reasoning[label]}</p>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </AccordionContent>
                                                                                </Card>
                                                                            </AccordionItem>
                                                                        ))}
                                                                    </Accordion>
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-8">
                                                                    <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                                                                    <p className="text-gray-500 mb-4">No feedback available.</p>
                                                                </div>
                                                            )}

                                                            <div className="flex justify-start">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            disabled={loading.generating}
                                                                            className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 px-6 font-medium transition-all duration-200 hover:scale-105"
                                                                        >
                                                                            {loading.generating ? (
                                                                                <>
                                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                    Generating...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Zap className="mr-2 h-4 w-4" />
                                                                                    Generate Feedback
                                                                                    <ChevronDown className="ml-2 h-4 w-4" />
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent className="w-56">
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("OPENAI=gpt-5")} className="text-sm">
                                                                            GPT-5 (high)
                                                                            <Brain className="ml-1 h-4 w-4" />
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("OPENAI=gpt-5-mini")} className="text-sm">
                                                                            GPT-5 Mini
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("OPENAI=gpt-5-nano")} className="text-sm">
                                                                            GPT-5 Nano
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("OPENAI=gpt-4.1")} className="text-sm">
                                                                            GPT-4.1
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("OPENAI=gpt-4.1-mini")} className="text-sm">
                                                                            GPT-4.1 Mini
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("OPENAI=gpt-4.1-nano")} className="text-sm">
                                                                            GPT-4.1 Nano
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("OPENAI=gpt-4o")} className="text-sm">
                                                                            GPT-4o
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("OPENAI=gpt-4o-mini")} className="text-sm">
                                                                            GPT-4o Mini
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("OPENAI=o4-mini")} className="text-sm">
                                                                            o4-Mini (high)
                                                                            <Brain className="ml-1 h-4 w-4" />
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("OPENAI=o3-mini")} className="text-sm">
                                                                            o3-Mini (high)
                                                                            <Brain className="ml-1 h-4 w-4" />
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("GOOGLE=gemini-2.5-pro")} className="text-sm">
                                                                            Gemini 2.5 Pro
                                                                            <Brain className="ml-1 h-4 w-4" />
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("GOOGLE=gemini-2.5-flash")} className="text-sm">
                                                                            Gemini 2.5 Flash
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("GOOGLE=gemini-2.5-flash-lite")} className="text-sm">
                                                                            Gemini 2.5 Flash-Lite
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("GOOGLE=gemini-2.0-flash")} className="text-sm">
                                                                            Gemini 2.0 Flash
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateFeedback("XAI=grok-4-fast")} className="text-sm">
                                                                            Grok 4 Fast
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>

                                                <AccordionItem value="survey">
                                                    <AccordionTrigger className="px-4 py-3 hover:bg-pale-blue/30 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                                                                <Brain size={20} />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-xl font-semibold">Survey</div>
                                                                <div className="text-sm text-gray-600">AI's perspective and evaluation</div>
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-4 pb-4">
                                                        <div className="space-y-4">
                                                            {loading.survey ? (
                                                                <div className="flex justify-center py-8">
                                                                    <Loader2 className="h-8 w-8 animate-spin text-vivid-blue" />
                                                                </div>
                                                            ) : surveys?.length > 0 ? (
                                                                <div className="space-y-4">
                                                                    <Accordion type="single" collapsible className="w-full space-y-4">
                                                                        {surveys.map((survey, surveyIndex) => (
                                                                            <AccordionItem key={surveyIndex} value={`survey-${surveyIndex}`} className="border-0">
                                                                                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-sm rounded-xl overflow-hidden">
                                                                                    <AccordionTrigger className="px-4 py-4 hover:bg-purple-50/50 transition-colors [&[data-state=open]>div>div:last-child]:rotate-180">
                                                                                        <div className="flex justify-between items-center w-full mr-4">
                                                                                            <div className="flex items-center gap-3">
                                                                                                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                                                                                                    <Brain size={16} />
                                                                                                </div>
                                                                                                <div className="text-left">
                                                                                                    <div className="text-sm font-medium text-gray-900">
                                                                                                        Generated: {formatTimestamp(survey.time)}
                                                                                                    </div>
                                                                                                    <div className="text-sm text-gray-800">
                                                                                                        {survey.duration}s • {survey.model} {survey.cost ? `• $${survey.cost}` : ""}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleDeleteSurvey(survey.id);
                                                                                                }}
                                                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                                                                            >
                                                                                                <Trash2 size={16} />
                                                                                            </Button>
                                                                                        </div>
                                                                                    </AccordionTrigger>
                                                                                    <AccordionContent className="px-4 pb-4">
                                                                                        <div>
                                                                                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Survey Responses</h3>
                                                                                            <div className="space-y-3">
                                                                                                {Object.keys(survLabels).map((label, index) => (
                                                                                                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                                                                                        <h4 className="text-sm font-medium text-gray-900 mb-2">{survLabels[label]}</h4>
                                                                                                        <p className="text-sm font-bold text-purple-600 mb-2">{survey.scores[label]}</p>
                                                                                                        <p className="text-sm text-gray-700 leading-relaxed">{survey.reasoning[label]}</p>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    </AccordionContent>
                                                                                </Card>
                                                                            </AccordionItem>
                                                                        ))}
                                                                    </Accordion>
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-8">
                                                                    <Brain size={48} className="mx-auto text-gray-400 mb-4" />
                                                                    <p className="text-gray-500 mb-4">No survey available.</p>
                                                                </div>
                                                            )}

                                                            <div className="flex justify-start">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            disabled={loading.generating}
                                                                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 px-6 font-medium transition-all duration-200 hover:scale-105"
                                                                        >
                                                                            {loading.generating ? (
                                                                                <>
                                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                    Generating...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Brain className="mr-2 h-4 w-4" />
                                                                                    Generate Survey
                                                                                    <ChevronDown className="ml-2 h-4 w-4" />
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent className="w-56">
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("OPENAI=gpt-5")} className="text-sm">
                                                                            GPT-5 (high)
                                                                            <Brain className="ml-1 h-4 w-4" />
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("OPENAI=gpt-5-mini")} className="text-sm">
                                                                            GPT-5 Mini
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("OPENAI=gpt-5-nano")} className="text-sm">
                                                                            GPT-5 Nano
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("OPENAI=gpt-4.1")} className="text-sm">
                                                                            GPT-4.1
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("OPENAI=gpt-4.1-mini")} className="text-sm">
                                                                            GPT-4.1 Mini
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("OPENAI=gpt-4.1-nano")} className="text-sm">
                                                                            GPT-4.1 Nano
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("OPENAI=o4-mini")} className="text-sm">
                                                                            o4-Mini (high)
                                                                            <Brain className="ml-1 h-4 w-4" />
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("OPENAI=o3-mini")} className="text-sm">
                                                                            o3-Mini (high)
                                                                            <Brain className="ml-1 h-4 w-4" />
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("OPENAI=gpt-4o")} className="text-sm">
                                                                            GPT-4o
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("OPENAI=gpt-4o-mini")} className="text-sm">
                                                                            GPT-4o Mini
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("GOOGLE=gemini-2.5-pro")} className="text-sm">
                                                                            Gemini 2.5 Pro
                                                                            <Brain className="ml-1 h-4 w-4" />
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("GOOGLE=gemini-2.5-flash")} className="text-sm">
                                                                            Gemini 2.5 Flash
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("GOOGLE=gemini-2.5-flash-lite")} className="text-sm">
                                                                            Gemini 2.5 Flash-Lite
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("GOOGLE=gemini-2.0-flash")} className="text-sm">
                                                                            Gemini 2.0 Flash
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGenerateSurvey("XAI=grok-4-fast")} className="text-sm">
                                                                            Grok 4 Fast
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </>
                                        )}                                        {getSelectedNegotiationType() === 'p2p' && (
                                            <>
                                                <AccordionItem value="p2p-feedback" className="border-b border-pale-gray">
                                                    <AccordionTrigger className="px-4 py-3 hover:bg-pale-blue/30 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-xl bg-green-100 text-green-600">
                                                                <BarChart3 size={20} />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-xl font-semibold">P2P Feedback</div>
                                                                <div className="text-sm text-gray-600">AI feedback based on peer conversation</div>
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-4 pb-4">
                                                        <div className="space-y-4">
                                                            {loading.feedback ? (
                                                                <div className="flex justify-center py-8">
                                                                    <Loader2 className="h-8 w-8 animate-spin text-vivid-blue" />
                                                                </div>
                                                            ) : feedbacks?.length > 0 ? (
                                                                <div className="space-y-4">
                                                                    <div className="space-y-4">
                                                                        <Accordion type="single" collapsible className="w-full space-y-4">
                                                                            {feedbacks.map((feedback, feedbackIndex) => (
                                                                                <AccordionItem key={feedbackIndex} value={`p2p-feedback-${feedbackIndex}`} className="border-0">
                                                                                    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-sm rounded-xl overflow-hidden">
                                                                                        <AccordionTrigger className="px-4 py-4 hover:bg-green-50/50 transition-colors [&[data-state=open]>div>div:last-child]:rotate-180">
                                                                                            <div className="flex justify-between items-center w-full mr-4">
                                                                                                <div className="flex items-center gap-3">
                                                                                                    <div className="p-2 rounded-lg bg-green-100 text-green-600">
                                                                                                        <TrendingUp size={16} />
                                                                                                    </div>
                                                                                                    <div className="text-left">
                                                                                                        <div className="text-md font-medium text-gray-900">
                                                                                                            {messageType === 'p2p' && feedback.isP2P ? (() => {
                                                                                                                if (feedback.userId) return `${feedback.userId} • `;
                                                                                                                const selectedP2PNeg = p2pNegIds.find(neg => neg.id === selectedNegId);
                                                                                                                if (selectedP2PNeg?.userIds) {
                                                                                                                    const userIndex = selectedP2PNeg.negIds.indexOf(feedback.negId);
                                                                                                                    if (userIndex >= 0) {
                                                                                                                        return `User ${selectedP2PNeg.userIds[userIndex]} • `;
                                                                                                                    }
                                                                                                                }
                                                                                                                return 'P2P User • ';
                                                                                                            })() : ''}Generated: {formatTimestamp(feedback.time)}
                                                                                                        </div>
                                                                                                        <div className="text-sm text-gray-800">
                                                                                                            {feedback.duration}s • {feedback.model} {feedback.cost ? `• $${feedback.cost}` : ""}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <Button
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        handleDeleteFeedback(feedback.id);
                                                                                                    }}
                                                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                                                                                >
                                                                                                    <Trash2 size={16} />
                                                                                                </Button>
                                                                                            </div>
                                                                                        </AccordionTrigger>
                                                                                        <AccordionContent className="px-4 pb-4">
                                                                                            <div className="space-y-4">
                                                                                                <div>
                                                                                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Summary</h3>
                                                                                                    <p className="text-sm text-gray-700 leading-relaxed">{feedback.summary}</p>
                                                                                                </div>
                                                                                                <div>
                                                                                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance Scores</h3>
                                                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                                        {Object.keys(labels).map((label, index) => (
                                                                                                            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                                                                                                <div className="flex items-center justify-between mb-2">
                                                                                                                    <span className="text-sm font-medium text-gray-900">{labels[label]}</span>
                                                                                                                    <div className="flex items-center gap-1">
                                                                                                                        <span className="text-sm font-bold text-green-600">{feedback.scores[label]}/5</span>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                                <p className="text-sm text-gray-700 leading-relaxed">{feedback.reasoning[label]}</p>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </AccordionContent>
                                                                                    </Card>
                                                                                </AccordionItem>
                                                                            ))}
                                                                        </Accordion>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-8">
                                                                    <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                                                                    <p className="text-gray-500 mb-4">No P2P feedback available.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        className="border-green-200 text-green-700 hover:bg-green-50 font-medium"
                                                                        disabled={loading.generating}
                                                                    >
                                                                        {loading.generating ? (
                                                                            <>
                                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                Generating...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Zap className="mr-2 h-4 w-4" />
                                                                                Generate P2P Feedback
                                                                                <ChevronDown className="ml-2 h-4 w-4" />
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent className="w-56">
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("OPENAI=gpt-5")} className="text-sm">
                                                                        GPT-5 (high)
                                                                        <Brain className="ml-1 h-4 w-4" />
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("OPENAI=gpt-5-mini")} className="text-sm">
                                                                        GPT-5 Mini
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("OPENAI=gpt-5-nano")} className="text-sm">
                                                                        GPT-5 Nano
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("OPENAI=gpt-4.1")} className="text-sm">
                                                                        GPT-4.1
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("OPENAI=gpt-4.1-mini")} className="text-sm">
                                                                        GPT-4.1 Mini
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("OPENAI=gpt-4.1-nano")} className="text-sm">
                                                                        GPT-4.1 Nano
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("OPENAI=gpt-4o")} className="text-sm">
                                                                        GPT-4o
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("OPENAI=gpt-4o-mini")} className="text-sm">
                                                                        GPT-4o Mini
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("OPENAI=o4-mini")} className="text-sm">
                                                                        o4-Mini (high)
                                                                        <Brain className="ml-1 h-4 w-4" />
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("OPENAI=o3-mini")} className="text-sm">
                                                                        o3-Mini (high)
                                                                        <Brain className="ml-1 h-4 w-4" />
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("GOOGLE=gemini-2.5-pro")} className="text-sm">
                                                                        Gemini 2.5 Pro
                                                                        <Brain className="ml-1 h-4 w-4" />
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("GOOGLE=gemini-2.5-flash")} className="text-sm">
                                                                        Gemini 2.5 Flash
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("GOOGLE=gemini-2.5-flash-lite")} className="text-sm">
                                                                        Gemini 2.5 Flash-Lite
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("GOOGLE=gemini-2.0-flash")} className="text-sm">
                                                                        Gemini 2.0 Flash
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleGenerateP2PFeedback("XAI=grok-4-fast")} className="text-sm">
                                                                        Grok 4 Fast
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>

                                                <AccordionItem value="p2p-offer" className="border-b border-pale-gray">
                                                    <AccordionTrigger className="px-4 py-3 hover:bg-pale-blue/30 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                                                                <TrendingUp size={20} />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-xl font-semibold">P2P Offer Extraction</div>
                                                                <div className="text-sm text-gray-600">Extract latest offer from P2P conversation</div>
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-4 pb-4">
                                                        <div className="space-y-4">
                                                            <div className="flex flex-col sm:flex-row gap-2">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            className="border-orange-200 text-orange-700 hover:bg-orange-50 font-medium"
                                                                            disabled={loading.generating}
                                                                        >
                                                                            {loading.generating ? (
                                                                                <>
                                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                    Extracting...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <TrendingUp className="mr-2 h-4 w-4" />
                                                                                    Extract P2P Offer
                                                                                    <ChevronDown className="ml-2 h-4 w-4" />
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent className="w-56">
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("OPENAI=gpt-5")} className="text-sm">
                                                                            GPT-5 (high)
                                                                            <Brain className="ml-1 h-4 w-4" />
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("OPENAI=gpt-5-mini")} className="text-sm">
                                                                            GPT-5 Mini
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("OPENAI=gpt-5-nano")} className="text-sm">
                                                                            GPT-5 Nano
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("OPENAI=gpt-4.1")} className="text-sm">
                                                                            GPT-4.1
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("OPENAI=gpt-4.1-mini")} className="text-sm">
                                                                            GPT-4.1 Mini
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("OPENAI=gpt-4.1-nano")} className="text-sm">
                                                                            GPT-4.1 Nano
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("OPENAI=gpt-4o")} className="text-sm">
                                                                            GPT-4o
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("OPENAI=gpt-4o-mini")} className="text-sm">
                                                                            GPT-4o Mini
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("OPENAI=o4-mini")} className="text-sm">
                                                                            o4-Mini (high)
                                                                            <Brain className="ml-1 h-4 w-4" />
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("OPENAI=o3-mini")} className="text-sm">
                                                                            o3-Mini (high)
                                                                            <Brain className="ml-1 h-4 w-4" />
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("GOOGLE=gemini-2.5-pro")} className="text-sm">
                                                                            Gemini 2.5 Pro
                                                                            <Brain className="ml-1 h-4 w-4" />
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("GOOGLE=gemini-2.5-flash")} className="text-sm">
                                                                            Gemini 2.5 Flash
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("GOOGLE=gemini-2.5-flash-lite")} className="text-sm">
                                                                            Gemini 2.5 Flash-Lite
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("GOOGLE=gemini-2.0-flash")} className="text-sm">
                                                                            Gemini 2.0 Flash
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleExtractP2POffer("XAI=grok-4-fast")} className="text-sm">
                                                                            Grok 4 Fast
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>

                                                            {p2pOffer?.length > 0 && (
                                                                <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 shadow-sm rounded-xl">
                                                                    <CardHeader className="py-3 px-4 border-b border-orange-100">
                                                                        <CardTitle className="text-lg text-orange-800">Latest P2P Offer</CardTitle>
                                                                    </CardHeader>
                                                                    <CardContent className="p-0 flex flex-col">
                                                                        {p2pOffer.map((item, index) => (
                                                                            <div key={index} className="p-4 border-b border-orange-200 last:border-0">
                                                                                <div className="font-medium text-gray-700">{item.name}:</div>
                                                                                <div className="font-semibold text-black">{item.value}</div>
                                                                                {item.source && (
                                                                                    <div className="italic text-gray-600 text-sm">{item.source}</div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </CardContent>
                                                                </Card>
                                                            )}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </>
                                        )}
                                    </Accordion>
                                </Card>
                            </div>
                        ) : (
                            <Card className="bg-white/80 backdrop-blur-sm border-pale-gray shadow-lg rounded-2xl overflow-hidden">
                                <CardContent className="p-12 text-center">
                                    <Bot size={64} className="mx-auto text-gray-400 mb-6" />
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Negotiation</h3>
                                    <p className="text-gray-600 max-w-md mx-auto">
                                        Choose an AI negotiation session from the sidebar to view messages, feedback, and survey data.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
            {showTranscriptUpload && (
                <TranscriptUpload
                    onClose={() => setShowTranscriptUpload(false)}
                    onDone={handleTranscriptComplete}
                />
            )}
        </div>
    );
}
