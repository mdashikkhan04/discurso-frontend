"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import CaseSearch from "@/components/CaseSearch";
import ParamsAI from "@/components/ParamsAI";
import LlmConfig from "@/components/LlmConfig";
import { useUser } from "@/contexts/UserContext";
import { getNegotiationResponse } from "@/actions/ai";
import { getCaseByIdForPreview } from "@/actions/cases";
import { getNiceNum } from "@/lib/util";
import "@/public/case.css";

export default function AiChatPage() {
  const { user } = useUser();

  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  const [showCaseSearch, setShowCaseSearch] = useState(false);
  const [aiSide, setAiSide] = useState("n");
  const [aiMode, setAiMode] = useState("standard"); // standard | experimental

  const [behaviour, setBehaviour] = useState({
    hardOnPeople: 1,
    hardOnProblem: 5,
    processDrive: 1,
    concessionsDist: 5,
    ethics: 5,
  });

  const [overrideModel, setOverrideModel] = useState(false);
  const [helperModelConfig, setHelperModelConfig] = useState({ model: "OPENAI=gpt-4.1-mini", temperature: 0.7, maxTokens: 4096, reasoningEffort: "high", verbosity: "medium" });
  const [finalModelConfig, setFinalModelConfig] = useState({ model: "OPENAI=gpt-4.1-mini", temperature: 0.7, maxTokens: 4096, reasoningEffort: "high", verbosity: "medium" });
  const [behaviorOpen, setBehaviorOpen] = useState(true);

  const [transcript, setTranscript] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [negId, setNegId] = useState(null);
  const [locked, setLocked] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [offer, setOffer] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const endRef = useRef(null);
  const sendButtonRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (messagesContainerRef.current && transcript.length > 0) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    if (sendButtonRef.current) {
      sendButtonRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [transcript]);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      if (selectedCase?.id) {
        try {
          const details = await getCaseByIdForPreview(selectedCase.id);
          setCaseDetails(details);
        } catch (error) {
          console.error("Error fetching case details:", error);
          setCaseDetails(null);
        }
      } else {
        setCaseDetails(null);
      }
    };

    fetchCaseDetails();
  }, [selectedCase]);

  const canSend = () => {
    return !!(user && selectedCase && aiSide !== "n" && input.trim() && !sending);
  };

  const resetChat = () => {
    if (window.confirm("Are you sure you want to reset the chat? This will clear all messages.")) {
      setTranscript([]);
      setInput("");
      setNegId(null);
      setLocked(false);
      setTotalCost(0);
      setOffer([]);
      setFeedback(null);
    }
  };

  const sendMessage = async () => {
    if (!canSend()) return;
    const userMsg = input.trim();
    setInput("");
    setLocked(true);
    setTranscript((t) => [...t, { role: "user", content: userMsg }]);
    setSending(true);
    try {
      const pastMessages = transcript.filter(m => !m.indecent)
        .concat({ role: "user", content: userMsg })
        .map((m) => ({ role: m.role === "ai" ? "ai" : "user", content: m.content }));
      const start = Date.now();
      const resp = await getNegotiationResponse({
        negId: negId || undefined,
        caseId: selectedCase.id,
        userQuery: userMsg,
        pastMessages,
        userId: user?.uid,
        aiSide,
        isPractice: true,
        behaviourParams: behaviour,
        llmConfig: overrideModel ? { helper: helperModelConfig, final: finalModelConfig } : undefined,
        returnExtra: true,
        offer: offer?.length ? offer : undefined,
      });
      if (resp?.indecent) {
        setTranscript((t) => {
          const newTranscript = [...t];
          for (let i = newTranscript.length - 1; i >= 0; i--) {
            if (newTranscript[i].role === "user") {
              newTranscript[i] = { ...newTranscript[i], indecent: true, flags: resp.flags };
              break;
            }
          }
          return newTranscript;
        });
        setSending(false);
        return;
      }
      setNegId(resp?.negId || negId);
      if (resp?.stats?.offer) setOffer(resp.stats.offer);
      if (resp?.feedback) setFeedback(resp.feedback);
      const models = resp?.config ? [resp?.config?.final?.model?.split("=")?.[1], resp?.config?.helper?.model?.split("=")?.[1]].filter(Boolean).join(" / ") : undefined;
      const duration = getNiceNum((Date.now() - start) / 1000, 1);
      const messageCost = resp?.cost ? parseFloat(resp.cost) : 0;
      if (messageCost > 0) {
        setTotalCost(prev => prev + messageCost);
      }
      setTranscript((t) => [
        ...t,
        {
          role: "ai",
          content: resp?.answer || "",
          cost: resp?.cost ? getNiceNum(resp.cost, 4) : undefined,
          duration,
          models,
        },
      ]);
    } catch (e) {
      console.error(e);
      setTranscript((t) => [...t, { role: "ai", content: "Error getting response." }]);
    } finally {
      setSending(false);
    }
  };

  const userLabel = "You";
  const aiLabel = selectedCase ? `${aiSide === "a" ? selectedCase.aName : selectedCase.bName}` : "AI";
  const userSide = aiSide === "a" ? "b" : "a";

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
            <Label className="mb-2 block font-medium">Negotiation Case:</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={selectedCase ? selectedCase.title : "Pick a case"}
                onClick={() => !locked && setShowCaseSearch(true)}
                className="cursor-pointer"
              />
              <Button variant="outline" onClick={() => setShowCaseSearch(true)} disabled={locked}>
                Select
              </Button>
            </div>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
            <Label className="mb-2 block font-medium">AI Role:</Label>
            <Select value={aiSide} onValueChange={setAiSide} disabled={locked || !selectedCase}>
              <SelectTrigger>
                <SelectValue placeholder="Select side" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">{selectedCase?.aName || "Party A"}</SelectItem>
                <SelectItem value="b">{selectedCase?.bName || "Party B"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
            <Label className="mb-2 block font-medium">AI Mode:</Label>
            <div className=" flex flex-row">
              <Select value={aiMode} onValueChange={setAiMode} disabled={locked}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  {/* <SelectItem value="experimental">Experimental</SelectItem> */}
                </SelectContent>
              </Select>
              {locked && (
                <div className=" items-center justify-center ml-2">
                  <Button variant="destructive" onClick={resetChat} className="w-full">
                    Reset Chat
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {caseDetails && (
              <>
                {caseDetails.generalInstruct && (
                  <Card className="bg-white border-2 border-gray-200">
                    <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                      <CardTitle className="text-gray-800">General Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div
                        className="prose prose-sm max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ __html: caseDetails.generalInstruct }}
                      />
                    </CardContent>
                  </Card>
                )}
                {((userSide === "a" && caseDetails.aInstruct) || (userSide === "b" && caseDetails.bInstruct)) && (
                  <Card className="bg-white border-2 border-gray-200">
                    <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                      <CardTitle>
                        Your Role: {userSide === "a" ? caseDetails.aName : caseDetails.bName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div
                        className="prose prose-sm max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{
                          __html: userSide === "a" ? caseDetails.aInstruct : caseDetails.bInstruct
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
          <div className="space-y-6">
            <Card className="bg-white border-2 border-gray-200">
              <Collapsible open={behaviorOpen} onOpenChange={setBehaviorOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 border-b-2 border-gray-200">
                    <CardTitle className="flex items-center justify-between">
                      <span>Behavior Parameters</span>
                      {behaviorOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-4">
                    <ParamsAI initParams={behaviour} onChange={setBehaviour} disabled={false} subtleFont={true} />
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
            <Card className="bg-white border-2 border-gray-200">
              <CardHeader className="border-b-2 border-gray-200">
                <CardTitle className="flex items-center gap-3">
                  <Switch checked={overrideModel} onCheckedChange={setOverrideModel} id="override" />
                  <Label htmlFor="override" className="cursor-pointer">Override Model Settings</Label>
                </CardTitle>
              </CardHeader>
              {overrideModel && (
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Helper Model (Summaries & Processing)</Label>
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <LlmConfig initConfig={helperModelConfig} onChange={setHelperModelConfig} expanded={true} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Final Model (Main Response)</Label>
                    <div className="border border-gray-200 rounded-lg p-3 bg-blue-50">
                      <LlmConfig initConfig={finalModelConfig} onChange={setFinalModelConfig} expanded={true} />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
            {offer?.length > 0 && (
              <Card className="bg-white border-2 border-gray-200">
                <CardHeader className="border-b-2 border-gray-200 flex-shrink-0">
                  <CardTitle>
                    Latest Offer
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col">
                  {offer.map((item, index) => {
                    return (
                      <div key={index} className="p-4 border-b border-gray-200 last:border-0">
                        <div className="font-medium text-gray-700">{item.name}:</div>
                        <div className="font-semibold text-black">{item.value}</div>
                        <div className="italic text-gray-600 text-sm">{item.source}</div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}
            <Card className="bg-white border-2 border-gray-200" style={{ maxHeight: '95vh' }}>
              <CardHeader className="border-b-2 border-gray-200 flex-shrink-0">
                <CardTitle>
                  Chat{totalCost > 0 ? ` ($${getNiceNum(totalCost, 4)})` : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-col">
                <div className="flex flex-col">
                  {transcript.length > 0 && (
                    <div
                      ref={messagesContainerRef}
                      className="max-h-[calc(95vh-180px)] overflow-y-auto p-4 space-y-4"
                    >
                      {transcript.map((m, i) => (
                        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] ${m.role === "user" ? "order-last" : ""}`}>
                            <div className={`text-sm font-medium mb-1 px-1 ${m.role === "user" ? "text-right" : "text-left"}`}>
                              {m.role === "ai" ? aiLabel : userLabel}
                            </div>
                            <div
                              className={`rounded-lg px-2 py-2 whitespace-pre-wrap ${m.role === "ai"
                                ? "bg-gray-100 text-gray-800 border border-gray-200"
                                : m.indecent ? "bg-red-200 text-red-800" : "bg-blue-600 text-white"
                                }`}
                            >
                              {m.content}
                              {(m.cost || m.duration || m.models) && (
                                <div className="text-xs mt-2 opacity-80 border-t border-current pt-2">
                                  {m.cost ? `Cost: $${m.cost}` : ""}
                                  {m.duration ? `${m.cost ? "  |  " : ""}Duration: ${m.duration}s` : ""}
                                  {m.models ? `${m.cost || m.duration ? "  |  " : ""}Models: ${m.models}` : ""}
                                </div>
                              )}
                            </div>
                            {m.flags?.length && (
                              <div className="text-xs mt-2 text-red-700 font-medium">Flagged for: {m.flags.join(", ")}</div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={endRef} />
                    </div>
                  )}
                  <div ref={sendButtonRef} className="border-t-2 border-gray-200 p-4 flex gap-3 flex-shrink-0">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={!selectedCase || aiSide === "n" ? "Pick a case and role first" : `Message ${aiLabel}`}
                      className="min-h-[60px] border-2 border-gray-200"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          sendMessage();
                        }
                      }}
                    />
                    <Button onClick={sendMessage} disabled={!canSend()} className="self-end">
                      {sending ? "Sending..." : "Send"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {feedback && (
              <Card className="bg-white border-2 border-gray-200">
                <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
                  <CardTitle>
                    Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-gray-700 whitespace-pre-wrap">{feedback}</div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        {showCaseSearch && (
          <CaseSearch
            onClose={() => setShowCaseSearch(false)}
            onCaseSelected={(c) => {
              setSelectedCase(c);
              setAiSide(c?.ai || "a");
            }}
            userId={user?.uid}
          />
        )}
      </div>
    </div>
  );
}
