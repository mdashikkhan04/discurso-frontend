"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import Message from "./Message";
import AgreementPanel from "./AgreementPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "../ui/button";
import { Mic, MicOff, Send } from "lucide-react";
import { Volume1, VolumeOff } from "lucide-react";
import { TalkingAvatar } from "@/components/avatar/TalkingAvatar";
import { useEdgeTtsPlayer } from "@/hooks/useEdgeTtsPlayer";

export default function ChatWindow({
  messages = [],
  messageInput,
  setMessageInput,
  handleSendMessage,
  isEnded,
  setIsEnded,
  inReq,
  stats,
  feedback,
  toggleAutoReading,
  isAutoReadingDisabled,
  isSpeachSynthSupported,
  speechRecognitionSupported,
  toggleRecording,
  isRecording,
  showDealInputs,
  setShowDealInputs,
  user,
  acase,
  vsAI,
  isPractice,
  madeDeal,
  handleMadeDeal,
  handleParamChange,
  isAgreementFinal,
  hasAgreement,
  finalizeAgreement,
  handleAgreementSubmit,
  dataTypeTips,
  finished,
  hasConflict,
  viewOnly,
  isInAppChat = true,
  agreements = [],
  conflicts = [],
  hasEnemyAgreement = false,
  enemyIds = [],
  ownTeamIds = [],
}) {
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sharedAudioRef = useRef(null);
  const caseGender = useMemo(() => {
    if (acase?.gender === "male") return "male";
    return "female";
  }, [acase?.gender]);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("chatViewMode") || "text";
    }
    return "text";
  });
  const voiceProfile = caseGender;
  const languageCode = useMemo(() => {
    const lang = acase?.language || acase?.caseLanguage || "";
    return typeof lang === "string" ? lang.toLowerCase() : "";
  }, [acase?.language, acase?.caseLanguage]);

  const spokenMessageIdsRef = useRef(new Set());
  const lastAvatarReplayRef = useRef(null);

  const voicePlayer = useEdgeTtsPlayer({
    voice: voiceProfile,
    enableLipsync: viewMode === "avatar",
    audioRef: sharedAudioRef,
    language: languageCode,
  });

  const latestAssistantMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (
        msg &&
        (msg.role === "assistant" || msg.role === "ai") &&
        msg.content
      ) {
        return msg.content;
      }
    }
    return "";
  }, [messages]);

  const placeholderText = useMemo(() => {
    return (isEnded || isAgreementFinal)
      ? "Negotiation has ended. No messages to display."
      : "Start the negotiation by sending a message.";
  }, [isEnded, isAgreementFinal]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("chatViewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (isAutoReadingDisabled) {
      voicePlayer.stop();
    }
  }, [isAutoReadingDisabled, voicePlayer]);

  // Stop any ongoing audio when user sends a new message
  const handleSendWithStop = useCallback(
    (e) => {
      voicePlayer.stop();
      handleSendMessage(e);
    },
    [handleSendMessage, voicePlayer]
  );

  const handleSpeak = useCallback(
    (text, options = {}) => {
      voicePlayer.speak(text, { ...options, voice: voiceProfile });
    },
    [voicePlayer, voiceProfile]
  );

  useEffect(() => {
    if (!messages?.length) return;
    const latest = [...messages].reverse().find((msg) => {
      const isAssistant = msg?.role === "assistant" || msg?.role === "ai";
      return isAssistant && msg.content && msg.shouldSpeak !== false;
    });
    if (!latest) return;
    const key = latest.id || latest.createdAt || latest.content;
    if (spokenMessageIdsRef.current.has(key)) return;

    const autoAllowed = viewMode === "avatar" || !isAutoReadingDisabled;
    if (!autoAllowed) return;

    spokenMessageIdsRef.current.add(key);
    handleSpeak(latest.content, {
      onStart: latest.onStart,
      onEnd: latest.onEnd,
    });
  }, [messages, viewMode, isAutoReadingDisabled, handleSpeak]);

  useEffect(() => {
    // When in avatar view we rely on regular auto-play; avoid double-play.
    if (viewMode !== "avatar") {
      lastAvatarReplayRef.current = null;
    }
  }, [viewMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  return (isPractice && feedback) ? (
    <div id="feedback" className="bg-white p-4 mb-2 overflow-y-auto h-full">
      <p className="text-lg mb-4 font-semibold text-blue-900">
        Negotiation summary:
      </p>
      <p className="whitespace-pre-wrap">{feedback}</p>
    </div>
  ) : (
    <ResizablePanelGroup direction="vertical">
      <ResizablePanel
        defaultSize={
          vsAI ? (stats.offer?.length > 0 ? 16 : 8) : ((!isEnded && !finished && !isAgreementFinal) ? 32 : 8)
        }
        minSize={vsAI ? (stats.offer?.length > 0 ? 16 : 8) : ((!isEnded && !finished && !isAgreementFinal) ? 24 : 8)}
        maxSize={50}
        className="h-full overflow-y-auto max-h-full"
      >
        {vsAI ? ((!isEnded && !finished) ? <AgreementPanel
          acase={acase}
          handleParamChange={handleParamChange}
          isAgreementFinal={isAgreementFinal}
          finished={finished}
          hasAgreement={hasAgreement}
          finalizeAgreement={finalizeAgreement}
          handleAgreementSubmit={handleAgreementSubmit}
          hasConflict={hasConflict}
          dataTypeTips={dataTypeTips}
          vsAI={vsAI}
          agreements={agreements}
          conflicts={conflicts}
          hasEnemyAgreement={hasEnemyAgreement}
          enemyIds={enemyIds}
          ownTeamIds={ownTeamIds}
          stats={stats}
        /> : <div className="w-full h-full flex flex-col justify-center items-center border-b border-gray-200">
          <p className="ext-center text-sm text-gray-600">Agreement has been finalized</p>
        </div>) : showDealInputs ? (
          // showDealInputs = true: Show decision buttons
          <div className="w-full h-full flex flex-col justify-center items-center">
            <h3 className="text-xl my-4 text-gray-900 text-center">
              Have you reached an agreement?
            </h3>
            <div className="flex gap-4">
              <Button
                className="mb-4 w-32"
                onClick={async () => {
                  if (
                    confirm(
                      "Are you sure you have not reached an agreement?"
                    ) === true
                  ) {
                    let success = true;
                    if (handleMadeDeal) {
                      success = await handleMadeDeal(false);
                    }
                    if (success) {
                      setIsEnded(true);
                      setShowDealInputs(false);
                    }
                  }
                }}
                variant="destructive"
              >
                No
              </Button>
              <Button
                className="mb-4 w-32"
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you have reached an agreement?"
                    ) === true
                  ) {
                    setShowDealInputs(false); // Switch to agreement panel
                    if (handleMadeDeal) handleMadeDeal(true);
                  }
                }}
                variant="default"
              >
                Yes
              </Button>
            </div>
          </div>
        ) : (
          // showDealInputs = false: Show agreement panel
          (!isAgreementFinal && !finished) ? (
            <AgreementPanel
              acase={acase}
              handleParamChange={handleParamChange}
              isAgreementFinal={isAgreementFinal}
              finished={finished}
              hasAgreement={hasAgreement}
              finalizeAgreement={finalizeAgreement}
              handleAgreementSubmit={handleAgreementSubmit}
              hasConflict={hasConflict}
              dataTypeTips={dataTypeTips}
              vsAI={vsAI}
              agreements={agreements}
              conflicts={conflicts}
              hasEnemyAgreement={hasEnemyAgreement}
              enemyIds={enemyIds}
              ownTeamIds={ownTeamIds}
            />
          ) : isAgreementFinal ? (
            <div className="w-full h-full flex flex-col justify-center items-center border-b border-gray-200">
              <p className="ext-center text-sm text-gray-600">Agreement has been finalized</p>
            </div>
          ) : (!isAgreementFinal && finished) ? (
            <div className="w-full h-full flex flex-col justify-center items-center border-b border-gray-200">
              <p className="ext-center text-sm text-gray-600">Negotiation has ended. without agreement</p>
            </div>
          ) : null
        )}
        {isEnded && !isInAppChat && (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <p className="ext-center text-sm text-gray-600">Finalized agreement, check it on agreement tab</p>
          </div>
        )}
      </ResizablePanel>
      {!isEnded && !isAgreementFinal && isInAppChat && (
        <ResizableHandle withHandle />
      )}
      {isInAppChat && (
        <ResizablePanel className="flex flex-col min-h-0" minSize={viewOnly ? 4 : 40}>
          <audio ref={sharedAudioRef} className="hidden" aria-hidden="true" />
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
            {vsAI && (
              <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode("text")}
                  className={`px-3 py-1 text-sm ${viewMode === "text" ? "bg-blue-100 text-blue-700" : "text-gray-700"}`}
                >
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("avatar")}
                  className={`px-3 py-1 text-sm ${viewMode === "avatar" ? "bg-blue-100 text-blue-700" : "text-gray-700"}`}
                >
                  Avatar
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <div
              ref={chatContainerRef}
              className={`overflow-y-auto p-2 px-4 rounded-md flex-1 bg-white ${viewMode === "avatar" ? "hidden" : "block"}`}
            >
              {messages.length > 0 ? (
                messages.map((msg, i) => (
                  <Message
                    key={msg?.id || i}
                    msg={msg}
                    acase={acase}
                    isOwnMessage={
                      msg.senderId === user?.id || ownTeamIds.includes(msg.senderId)
                    }
                    shouldSpeak={msg.shouldSpeak}
                    onSpeak={handleSpeak}
                    autoReadDisabled={viewMode === "avatar" ? false : isAutoReadingDisabled}
                  />
                ))
              ) : (
                <p className="text-gray-500 text-center">
                  {(isEnded || isAgreementFinal)
                    ? "Negotiation has ended. No messages to display."
                    : "Start the negotiation by sending a message."}
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>
            {vsAI && viewMode === "avatar" && (
              <div className="flex-1 p-0 bg-white min-h-0">
                <TalkingAvatar
                  model={caseGender}
                  messageText={
                    latestAssistantMessage || placeholderText
                  }
                  isLoading={inReq}
                  className="w-full h-full"
                  showCameraTuner={false}
                  audioRef={sharedAudioRef}
                />
              </div>
            )}
          </div>
          {!isEnded && (
            <form
              onSubmit={handleSendWithStop}
              className="flex gap-2 items-end p-2 border-t border-gray-200"
            >
              <textarea
                className="flex-1 p-2 px-4 border-2 border-soft-gray rounded-xl bg-white text-black resize-none"
                placeholder="Type your message here..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                rows={1}
                style={{
                  minHeight: 40,
                  maxHeight: 150,
                  overflowY:
                    messageInput?.split("\n").length > 5 ? "auto" : "hidden",
                }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  const newHeight = Math.min(e.target.scrollHeight, 150);
                  e.target.style.height = `${newHeight}px`;
                  e.target.style.overflowY =
                    e.target.scrollHeight > 150 ? "auto" : "hidden";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              {speechRecognitionSupported && (
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full self-end border-2 relative ${isRecording
                    ? "bg-red-100 border-red-500"
                    : "bg-gray-100 text-black"
                    }`}
                >
                  {isRecording && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-50"></span>
                  )}
                  {isRecording ? (
                    <MicOff className="text-red-500" />
                  ) : (
                    <Mic className="text-gray-500" />
                  )}
                </button>
              )}
              {isSpeachSynthSupported && (
                <button
                  type="button"
                  className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors ${isAutoReadingDisabled
                    ? "bg-gray-100 border-gray-300 text-gray-500"
                    : "bg-blue-100 border-blue-500 text-blue-600"
                    }`}
                  onClick={toggleAutoReading}
                  title={
                    isAutoReadingDisabled
                      ? "Enable auto-reading"
                      : "Disable auto-reading"
                  }
                >
                  {isAutoReadingDisabled ? (
                    <VolumeOff className="w-5 h-5" />
                  ) : (
                    <Volume1 className="w-5 h-5" />
                  )}
                </button>
              )}
              <button
                type="submit"
                disabled={!messageInput?.trim() || inReq}
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  );
}
