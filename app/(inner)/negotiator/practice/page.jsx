"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useLoading } from "@/contexts/LoadingContext";
import { fetcher } from "@/lib/fetcher";
import ChatWindow from "@/components/negotiation/ChatWindow";
import { useChatWindowState } from "@/hooks/useChatWindowState";

import "@/public/case.css";
import CasePanel from "@/components/negotiation/CasePanel";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";

import { getPracticeSession } from "@/actions/practice";

export default function PracticePage() {
  const [selectedCase, setSelectedCase] = useState(null);
  const [availableCases, setAvailableCases] = useState([]);
  const [direction, setDirection] = useState("horizontal");
  const { showLoading, hideLoading } = useLoading();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const negIdFromUrl = searchParams?.get("negId");

  // Obsługa responsywności
  useEffect(() => {
    const handleResize = () => {
      setDirection(window.innerWidth < 1024 ? "vertical" : "horizontal");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Wczytanie wszystkich dostępnych cases
  useEffect(() => {
    if (!user) return;
    const fetchCases = async () => {
      showLoading();
      try {
        const response = await fetcher.get("/api/data/cases?ai=true", user);
        if (response.ok) {
          setAvailableCases(response.result.data);
        } else {
          console.error("Failed to fetch cases:", response.error);
        }
      } catch (error) {
        console.error("Error during fetch:", error);
      }
      hideLoading();
    };
    fetchCases();
  }, [user?.id]);

  // Jeśli mamy negId w URL, wczytaj od razu negocjację
  useEffect(() => {
    if (!user || !negIdFromUrl) return;

    const fetchPractice = async () => {
      showLoading();
      try {
        const session = await getPracticeSession(negIdFromUrl);
        if (session && session.case) {
          setSelectedCase({
            ...session.case,
            id: session.caseId,
            negId: session.negId,
            title: session.case.title,
            free: true, // lub dostosuj według potrzeby
          });
        }
      } catch (err) {
        console.error("Failed to fetch practice session:", err);
      }
      hideLoading();
    };

    fetchPractice();
  }, [user, negIdFromUrl]);

  const startPractice = (practiceCase) => {
    const chosenCase = {
      ...practiceCase,
      caseTitle: practiceCase.title,
      partyInstructions: practiceCase.instructions,
      generalInstructions: practiceCase.context,
    };
    setSelectedCase(chosenCase);
  };

  const initialMessages = useMemo(() => [], []);
  const initialStats = useMemo(() => ({ score: 0, offer: [] }), []);

  const chatState = useChatWindowState({
    initialMessages,
    initialStats,
    initialNegId: selectedCase?.negId ?? null,
    acase: selectedCase,
    user,
    isPractice: true,
    aiSide: selectedCase?.side === "a" ? "b" : "a",
    onSettled: () => {},
    onOffer: () => {},
    viewOnly: false,
    vsAI: true,
    enemyIds: null,
    ownTeamIds: null,
    handleMadeDeal: null,
    finalizeAgreement: null,
    params: selectedCase?.params ?? null,
  });

  // Reszta JSX pozostaje bez zmian
  return !selectedCase ? (
    <div className="flex flex-col z-10 *:z-10 bg-white relative min-h-screen p-2">
      <div className="!absolute top-0 left-0 w-screen h-full bg-gradient-to-b from-vivid-blue to-deep-blue !z-0"></div>

      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">
          Practice Negotiations
        </h1>
        <p className="text-white text-center text-lg">
          Hone your negotiation skills with AI-powered practice scenarios.
          Select a case below and start practicing with simulated feedback.
        </p>
      </header>

      <section className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 md:mx-4 mx-2">
        {availableCases.map((c, index) => (
          <Card
            key={index}
            className="bg-white border-2 border-soft-gray rounded-2xl drop-shadow-lg"
          >
            <CardHeader>
              <CardTitle>{c.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-darker-gray">{c.summary}</p>
              <div className="flex space-x-4">
                <Button
                  variant="default"
                  onClick={() => startPractice(c)}
                  className="w-full"
                >
                  Train as {c.partyName}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  ) : (
    <main className="p-2 bg-white relative *:z-10 *:relative overflow-y-hidden">
      <div className="!absolute top-0 left-0 w-screen min-h-[70vh] lg:h-[70%] h-full bg-gradient-to-b from-vivid-blue to-deep-blue !z-0"></div>
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-semibold mb-2 my-6 text-white">
          {selectedCase.title}
        </h1>
      </header>

      {direction === "horizontal" ? (
        <ResizablePanelGroup
          direction="horizontal"
          className={`flex flex-col lg:flex-row xl:!w-11/12 w-full mx-auto !h-[80vh] drop-shadow-lg relative bg-white rounded-3xl`}
        >
          <ResizablePanel
            defaultSize={50}
            minSize={32}
            className="h-full p-4 flex flex-col flex-1"
          >
            <CasePanel
              acase={selectedCase}
              ownTeam={{ sideName: selectedCase.partyName }}
              vsAI={true}
              user={user}
              enemy={{
                team: {
                  sideName: selectedCase.opponent,
                },
              }}
              isPractice={true}
            />
          </ResizablePanel>
          <ResizableHandle withHandle direction="horizontal" />
          <ResizablePanel defaultSize={50} minSize={32} className="flex-1">
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-hidden">
                <div className="h-full">
                  <ChatWindow
                    messages={chatState?.messages ?? []}
                    messageInput={chatState?.messageInput ?? ""}
                    setMessageInput={chatState?.setMessageInput ?? (() => {})}
                    handleSendMessage={chatState?.handleSendMessage ?? (() => {})}
                    isEnded={chatState?.isEnded ?? false}
                    setIsEnded={chatState?.setIsEnded ?? (() => {})}
                    inReq={chatState?.inReq ?? false}
                    stats={chatState?.stats ?? { score: 0, offer: [] }}
                    feedback={chatState?.feedback ?? null}
                    toggleAutoReading={chatState?.toggleAutoReading ?? (() => {})}
                    isAutoReadingDisabled={chatState?.isAutoReadingDisabled ?? false}
                    isSpeachSynthSupported={chatState?.isSpeachSynthSupported ?? false}
                    speechRecognitionSupported={chatState?.speechRecognitionSupported ?? false}
                    toggleRecording={chatState?.toggleRecording ?? (() => {})}
                    isRecording={chatState?.isRecording ?? false}
                    showDealInputs={chatState?.showDealInputs ?? false}
                    setShowDealInputs={chatState?.setShowDealInputs ?? (() => {})}
                    negId={chatState?.negId ?? null}
                    setNegId={chatState?.setNegId ?? (() => {})}
                    updateStats={chatState?.updateStats ?? (() => {})}
                    setMessages={chatState?.setMessages ?? (() => {})}
                    setFeedback={chatState?.setFeedback ?? (() => {})}
                    acase={selectedCase}
                    user={user}
                    isPractice={true}
                    vsAI={true}
                    viewOnly={false}
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="py-4 px-2 h-fit xl:!w-11/12 w-full mx-auto lg:mt-0">
          <div className="rounded-2xl drop-shadow-lg bg-white h-full mb-4 p-2">
            <CasePanel
              acase={selectedCase}
              ownTeam={{ sideName: selectedCase.partyName }}
              vsAI={true}
              user={user}
              enemy={{
                team: {
                  sideName: selectedCase.opponent,
                },
              }}
              isPractice={true}
            />
          </div>
          <div className="rounded-2xl drop-shadow-lg bg-white h-[80vh] mb-4 border-2 border-soft-gray overflow-hidden">
            <ChatWindow
              messages={chatState?.messages ?? []}
              messageInput={chatState?.messageInput ?? ""}
              setMessageInput={chatState?.setMessageInput ?? (() => {})}
              handleSendMessage={chatState?.handleSendMessage ?? (() => {})}
              isEnded={chatState?.isEnded ?? false}
              setIsEnded={chatState?.setIsEnded ?? (() => {})}
              inReq={chatState?.inReq ?? false}
              stats={chatState?.stats ?? { score: 0, offer: [] }}
              feedback={chatState?.feedback ?? null}
              toggleAutoReading={chatState?.toggleAutoReading ?? (() => {})}
              isAutoReadingDisabled={chatState?.isAutoReadingDisabled ?? false}
              isSpeachSynthSupported={chatState?.isSpeachSynthSupported ?? false}
              speechRecognitionSupported={chatState?.speechRecognitionSupported ?? false}
              toggleRecording={chatState?.toggleRecording ?? (() => {})}
              isRecording={chatState?.isRecording ?? false}
              showDealInputs={chatState?.showDealInputs ?? false}
              setShowDealInputs={chatState?.setShowDealInputs ?? (() => {})}
              negId={chatState?.negId ?? null}
              setNegId={chatState?.setNegId ?? (() => {})}
              updateStats={chatState?.updateStats ?? (() => {})}
              setMessages={chatState?.setMessages ?? (() => {})}
              setFeedback={chatState?.setFeedback ?? (() => {})}
              acase={selectedCase}
              user={user}
              isPractice={true}
              vsAI={true}
              viewOnly={false}
            />
          </div>
        </div>
      )}
    </main>
  );
}
