"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import ChatWindow from "@/components/negotiation/ChatWindow";
import { useChatWindowState } from "@/hooks/useChatWindowState";
import { listPractices, getPracticeSession } from "@/actions/practice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import CasePanel from "@/components/negotiation/CasePanel";
import "@/public/case.css";

export default function PracticeHistoryPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const sessions = await listPractices();
        if (!ignore) setItems(sessions || []);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true };
  }, [user?.uid]);

  useEffect(() => {
    let ignore = false;
    const loadDetail = async () => {
      if (!selected) { setDetail(null); return; }
      try {
        const d = await getPracticeSession(selected);
        if (!ignore) setDetail(d);
      } catch (_) {}
    };
    loadDetail();
    return () => { ignore = true };
  }, [selected]);

  const initialMessages = useMemo(() => detail?.messages || [], [detail?.messages?.length]);
  const initialStats = useMemo(() => ({ score: 0, offer: [] }), []);

  const chatState = useChatWindowState({
    initialMessages,
    initialStats,
    initialNegId: detail?.negId || null,
    acase: detail?.case || null,
    user,
    isPractice: true,
    aiSide: detail?.aiSide || "a",
    onSettled: () => {},
    onOffer: () => {},
    viewOnly: Boolean(detail?.completed),
    vsAI: true,
    enemyIds: null,
    ownTeamIds: null,
    params: detail?.case?.params ?? null,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-white via-pale-blue/30 to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-white/80 backdrop-blur-sm border-pale-gray shadow-lg">
          <CardHeader>
            <CardTitle>Your practice negotiations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div className="text-sm text-gray-600">Loading…</div>}
            {!loading && items.length === 0 && (
              <div className="text-sm text-gray-600">No practice sessions yet.</div>
            )}
            {!loading && items.length > 0 && (
              <div className="space-y-2">
                {items.map((it) => (
                  <button
                    key={it.negId}
                    onClick={() => setSelected(it.negId)}
                    className={`w-full text-left p-3 rounded-xl border transition ${selected === it.negId ? 'border-vivid-blue bg-blue-50' : 'border-pale-gray bg-white/90 hover:border-vivid-blue'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-medium">{it.title}</div>
                      <span className={`text-xs ${it.completed ? 'text-green-700' : 'text-amber-700'}`}>{it.completed ? 'Completed' : 'Ongoing'}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {it.time ? new Date(it.time).toLocaleString() : ''}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          {!selected && (
            <Card className="bg-white/80 backdrop-blur-sm border-pale-gray shadow-lg">
              <CardContent className="p-6 text-sm text-gray-600">Select a negotiation to view or continue.</CardContent>
            </Card>
          )}

          {selected && detail && detail.completed && (
            <>
              <Card className="bg-white/80 backdrop-blur-sm border-pale-gray shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{detail?.case?.title || 'Practice negotiation'}</CardTitle>
                    <Button variant="outline" onClick={() => setSelected(null)}>Back</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <CasePanel
                    acase={detail?.case}
                    ownTeam={{ sideName: (detail?.aiSide === 'a') ? (detail?.case?.bName || detail?.case?.partyName) : (detail?.case?.aName || detail?.case?.partyName) }}
                    vsAI={true}
                    user={user}
                    enemy={{ team: { sideName: (detail?.aiSide === 'a') ? (detail?.case?.aName || detail?.case?.opponent) : (detail?.case?.bName || detail?.case?.opponent) } }}
                    isPractice={true}
                  />
                </CardContent>
              </Card>

              <Card className="bg-white/90 border-pale-gray shadow-lg">
                <CardHeader>
                  <CardTitle>Negotiation Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[60vh] rounded-2xl drop-shadow-lg bg-white border-2 border-soft-gray overflow-hidden">
                    <ChatWindow
                      messages={chatState?.messages ?? []}
                      messageInput=""
                      setMessageInput={() => {}}
                      handleSendMessage={() => {}}
                      isEnded={true}
                      setIsEnded={() => {}}
                      inReq={false}
                      stats={chatState?.stats ?? { score: 0, offer: [] }}
                      feedback={chatState?.feedback ?? null}
                      toggleAutoReading={() => {}}
                      isAutoReadingDisabled={true}
                      isSpeachSynthSupported={false}
                      speechRecognitionSupported={false}
                      toggleRecording={() => {}}
                      isRecording={false}
                      showDealInputs={false}
                      setShowDealInputs={() => {}}
                      negId={detail?.negId || null}
                      setNegId={() => {}}
                      updateStats={() => {}}
                      setMessages={() => {}}
                      setFeedback={() => {}}
                      acase={detail?.case}
                      user={user}
                      isPractice={true}
                      vsAI={true}
                      viewOnly={true}
                    />
                  </div>
                </CardContent>
              </Card>

              {detail?.agreement && (
                <Card className="bg-white/90 border-pale-gray shadow-lg">
                  <CardHeader>
                    <CardTitle>Final Agreement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Array.isArray(detail?.case?.params) && detail.case.params.map((p) => (
                        <div key={p.id} className="flex items-start justify-between border border-soft-gray rounded-xl p-3 bg-white">
                          <div className="font-medium text-sm text-dark-gray mr-2">{p.name || p.id}</div>
                          <div className="text-sm text-gray-700 font-semibold">{String(detail.agreement?.[p.id] ?? '')}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {detail?.feedback && (
                <Card className="bg-white/90 border-pale-gray shadow-lg">
                  <CardHeader>
                    <CardTitle>AI Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full rounded-2xl flex flex-col gap-4 mb-6 px-4 sm:px-6 py-6 sm:py-8 bg-gradient-to-br from-soft-pink to-pale-blue/20">
                      <div className="flex items-start gap-3">
                        <Image src="/ai-stars-purple.png" width={40} height={40} className="sm:w-12 sm:h-12 flex-shrink-0" alt="" />
                        <div className="flex-1">
                          <p className="text-lg sm:text-xl font-semibold mb-2">Nice job on that negotiation, {user?.displayName?.split(" ")[0] || ""}!</p>
                          <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{detail?.feedback?.summary}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                      {Object.entries(detail?.feedback?.scores || {}).map(([key, value]) => (
                        <FeedbackItem
                          key={key}
                          label={detail?.feedbackLabels?.[key] || key}
                          reasoning={detail?.feedback?.reasoning?.[key] || ''}
                          score={value}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {selected && detail && !detail.completed && (
            <Card className="bg-white/90 border-pale-gray shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{detail?.case?.title || 'Practice negotiation'}</CardTitle>
                  <Button variant="outline" onClick={() => setSelected(null)}>Back</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl drop-shadow-lg bg-white mb-4 p-2">
                  <CasePanel
                    acase={detail?.case}
                    ownTeam={{ sideName: (detail?.aiSide === 'a') ? (detail?.case?.bName || detail?.case?.partyName) : (detail?.case?.aName || detail?.case?.partyName) }}
                    vsAI={true}
                    user={user}
                    enemy={{ team: { sideName: (detail?.aiSide === 'a') ? (detail?.case?.aName || detail?.case?.opponent) : (detail?.case?.bName || detail?.case?.opponent) } }}
                    isPractice={true}
                  />
                </div>


                <div className="h-[70vh] rounded-2xl drop-shadow-lg bg-white border-2 border-soft-gray overflow-hidden">
                  <ChatWindow
                    messages={chatState?.messages ?? []}
                    messageInput={chatState?.messageInput ?? ""}
                    setMessageInput={chatState?.setMessageInput ?? (() => { })}
                    handleSendMessage={chatState?.handleSendMessage ?? (() => { })}
                    isEnded={chatState?.isEnded ?? false}
                    setIsEnded={chatState?.setIsEnded ?? (() => { })}
                    inReq={chatState?.inReq ?? false}
                    stats={chatState?.stats ?? { score: 0, offer: [] }}
                    feedback={chatState?.feedback ?? null}
                    toggleAutoReading={chatState?.toggleAutoReading ?? (() => { })}
                    isAutoReadingDisabled={chatState?.isAutoReadingDisabled ?? false}
                    isSpeachSynthSupported={chatState?.isSpeachSynthSupported ?? false}
                    speechRecognitionSupported={chatState?.speechRecognitionSupported ?? false}
                    toggleRecording={chatState?.toggleRecording ?? (() => { })}
                    isRecording={chatState?.isRecording ?? false}
                    showDealInputs={chatState?.showDealInputs ?? false}
                    setShowDealInputs={chatState?.setShowDealInputs ?? (() => { })}
                    negId={chatState?.negId ?? null}
                    setNegId={chatState?.setNegId ?? (() => { })}
                    updateStats={chatState?.updateStats ?? (() => { })}
                    setMessages={chatState?.setMessages ?? (() => { })}
                    setFeedback={chatState?.setFeedback ?? (() => { })}
                    acase={detail?.case}
                    user={user}
                    isPractice={true}
                    vsAI={true}
                    viewOnly={false}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}



const FeedbackItem = ({ label, reasoning, score }) => {
  const scoreColor = score < 3 ? "text-red-500" : score > 3 ? "text-green-500" : "text-dark-gray";
  return (
    <div className="flex flex-col items-center justify-around gap-2 border-2 rounded-2xl p-3 sm:p-4 border-soft-gray">
      <p className="text-sm sm:text-lg text-dark-gray font-semibold text-center">{label}</p>
      <p className="text-gray-500 text-center leading-5 text-xs sm:text-sm">{reasoning}</p>
      <p className={`text-xl sm:text-2xl font-semibold ${scoreColor}`}>{score}/5</p>
    </div>
  );
};
