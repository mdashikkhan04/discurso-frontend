"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Mic, MicOff } from "lucide-react";
import CaseSearch from "@/components/CaseSearch";
import ParamsAI from "@/components/ParamsAI";
import { useUser } from "@/contexts/UserContext";
import { getCaseByIdForPreview } from "@/actions/cases";
import { getNiceNum } from "@/lib/util";
import { createClient } from "@/lib/client/ai/realtime";
import "@/public/case.css";

export default function RealtimeAiChatPage() {
  const { user } = useUser();

  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  const [showCaseSearch, setShowCaseSearch] = useState(false);
  const [aiSide, setAiSide] = useState("n");

  const [behaviour, setBehaviour] = useState({
    hardOnPeople: 1,
    hardOnProblem: 5,
    processDrive: 1,
    concessionsDist: 5,
    ethics: 5,
  });

  const [behaviorOpen, setBehaviorOpen] = useState(true);
  const [mode, setMode] = useState("audio"); // "text" | "audio"
  const [voice, setVoice] = useState("cedar"); // "marin" | "cedar"
  const [aiModel, setAiModel] = useState("OPENAI=gpt-realtime");
  const [locked, setLocked] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [totalCost, setTotalCost] = useState("0");
  const [isConnected, setIsConnected] = useState(false);

  const clientRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const sendButtonRef = useRef(null);

  const userLabel = "You";
  const aiLabel = selectedCase ? `${aiSide === "a" ? selectedCase.aName : selectedCase.bName}` : "AI";
  const userSide = aiSide === "a" ? "b" : "a";

  useEffect(() => {
    if (messagesContainerRef.current && transcript.length > 0) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight - container.clientHeight;
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

  const canStart = () => {
    return !!(user && selectedCase && (aiSide === "a" || aiSide === "b"));
  };

  const canSend = () => {
    return !!(clientRef.current && mode === "text" && input.trim() && !sending && isConnected);
  };

  const resetChat = () => {
    if (!window.confirm("Reset chat and allow new setup?")) return;
    try { clientRef.current?.close?.(); } catch { }
    clientRef.current = null;
    setTranscript([]);
    setInput("");
    setLocked(false);
    setTotalCost("0");
    setIsConnected(false);
  };

  const startChat = async () => {
    if (!canStart()) return;
    setLocked(true);

    const withAudio = mode === "audio";
    const c = createClient({
      caseId: selectedCase.id,
      userId: user?.uid,
      aiModel,
      aiSide,
      behaviourParams: behaviour,
      withAudio,
      voice,
      audioElId: "oai-remote-audio",
      onMessage: (msg) => {
        if (msg?.trim()) {
          setTranscript((t) => [...t, { role: "ai", content: msg }]);
        }
      },
      onUsage: ({ totals }) => {
        setTotalCost(totals?.totalCost || "0");
      },
      onError: (err) => {
        console.error(err);
        if (mode === "text") {
          setTranscript((t) => [...t, { role: "event", content: "Error: " + (err?.message || "Unknown error") }]);
        }
        setLocked(false);
        setIsConnected(false);
      },
      onConnected: () => {
        setIsConnected(true);
      },
    });

    clientRef.current = c;

    try {
      await c.connect();
    } catch (e) {
      console.error("Connection failed:", e);
      setLocked(false);
      setIsConnected(false);
    }
  };

  const sendMessage = async () => {
    if (!canSend()) return;
    const userMsg = input.trim();
    setInput("");
    setSending(true);
    setTranscript((t) => [...t, { role: "user", content: userMsg }]);
    try {
      clientRef.current?.sendText(userMsg);
      clientRef.current?.endTurn();
    } catch (e) {
      console.error(e);
      setTranscript((t) => [...t, { role: "event", content: "Send error." }]);
    } finally {
      setSending(false);
    }
  };

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

          {locked ? (
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4 flex items-center justify-center">
              <Button variant="destructive" onClick={resetChat} className="w-full">
                Reset Chat
              </Button>
            </div>
          ) : (
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="mb-2 block font-medium">AI Model:</Label>
                  <Select value={aiModel} onValueChange={setAiModel} disabled={locked}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPENAI=gpt-realtime">gpt-realtime</SelectItem>
                      <SelectItem value="OPENAI=gpt-realtime-mini">gpt-realtime-mini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs block mb-1">Mode</Label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text only</SelectItem>
                      <SelectItem value="audio">Audio (voice)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {mode === "audio" && (
                  <div className="flex-1">
                    <Label className="text-xs block mb-1">Voice</Label>
                    <Select value={voice} onValueChange={setVoice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marin">Marin</SelectItem>
                        <SelectItem value="cedar">Cedar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}
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
            {!locked && (
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
            )}

            <Card className="bg-white border-2 border-gray-200 h-[500px] flex flex-col">
              <CardHeader className="border-b-2 border-gray-200 flex-shrink-0">
                <CardTitle>
                  {mode === "text" ? "Chat" : "Audio Chat"}{Number(totalCost) > 0 ? ` ($${getNiceNum(totalCost, 4)})` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
                {mode === "text" ? (
                  <div className="flex flex-col h-full">
                    <div
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto p-4 space-y-4"
                    >
                      {transcript.length > 0 ? (
                        transcript.map((m, i) => (
                          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] ${m.role === "user" ? "order-last" : ""}`}>
                              <div className={`text-sm font-medium mb-1 px-1 ${m.role === "user" ? "text-right" : "text-left"}`}>
                                {m.role === "ai" ? aiLabel : m.role === "user" ? userLabel : "·"}
                              </div>
                              <div
                                className={`rounded-lg px-2 py-2 whitespace-pre-wrap ${m.role === "ai"
                                  ? "bg-gray-100 text-gray-800 border border-gray-200"
                                  : m.role === "user"
                                    ? "bg-blue-600 text-white"
                                    : "bg-yellow-100 text-yellow-900 border border-yellow-200"
                                  }`}
                              >
                                {m.content}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          {!locked ? "Start a chat to begin the conversation" : !isConnected ? "Connecting..." : "Type your first message below"}
                        </div>
                      )}
                    </div>

                    <div ref={sendButtonRef} className="border-t-2 border-gray-200 p-4 flex gap-3 flex-shrink-0">
                      {!locked ? (
                        <Button
                          onClick={startChat}
                          disabled={!canStart()}
                          className="w-full"
                        >
                          Start chat
                        </Button>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 w-full">
                            <Textarea
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              placeholder={isConnected ? `Message ${aiLabel}` : "Connecting..."}
                              className="min-h-[60px] border-2 border-gray-200 flex-1"
                              disabled={!isConnected}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  sendMessage();
                                } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                  sendMessage();
                                }
                              }}
                            />
                            <div className="flex flex-col items-center gap-2">
                              {!isConnected && (
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              )}
                              <Button
                                onClick={sendMessage}
                                disabled={!canSend()}
                                className="self-end"
                              >
                                {sending ? "Sending..." : "Send"}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    {!locked ? (
                      <div className="text-center space-y-4">
                        <div className="text-gray-600 mb-4">{canStart() ? "Ready to start audio conversation" : "Select case and role first"}</div>
                        <Button
                          onClick={startChat}
                          disabled={!canStart()}
                          className="px-8 py-3"
                        >
                          Start Audio Chat
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                          {isConnected ? (
                            <>
                              <div className={`p-6 rounded-full ${isConnected ? 'bg-blue-100 border-4 border-blue-500' : 'bg-gray-100 border-4 border-gray-300'} transition-all duration-300`}>
                                <Mic
                                  size={48}
                                  className={`${isConnected ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`}
                                />
                              </div>
                              <div className="text-lg font-medium text-gray-800">
                                Audio chat active with {aiLabel}
                              </div>
                              <div className="text-sm text-gray-600">
                                Speak naturally. The conversation is live.
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="p-6 rounded-full bg-gray-100 border-4 border-gray-300">
                                <MicOff size={48} className="text-gray-400" />
                              </div>
                              <div className="text-lg font-medium text-gray-600">
                                Connecting to {aiLabel}...
                              </div>
                              <div className="text-sm text-gray-500">
                                Please wait while we establish the connection.
                              </div>
                            </>
                          )}
                        </div>

                        {/* Audio element for playback */}
                        <audio id="oai-remote-audio" autoPlay className="hidden" />

                        <div className="mt-8">
                          <Button variant="outline" onClick={resetChat}>
                            End Audio Chat
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
