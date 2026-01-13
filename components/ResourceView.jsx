"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { getResourceMediaUrl } from "@/actions/resources";
import { getCaseByIdForPreview } from "@/actions/cases";
import QuizView from "@/components/QuizView";
import ChatWindow from "@/components/negotiation/ChatWindow";
import { useUser } from "@/contexts/UserContext";
import { useChatWindowState } from "@/hooks/useChatWindowState";
import { Button } from "@/components/ui/button";
import '@/public/case.css'

export default function ResourceView({ resource, onComplete, stageId, readOnly }) {
  const { user } = useUser?.() || {};
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [acase, setAcase] = useState(null);
  const [loadingCase, setLoadingCase] = useState(false);
  const completedOnce = useRef(false);
  const isNegotiation = resource?.type === 'negotiation' && !readOnly;

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if ((resource?.type === 'audio' || resource?.type === 'video') && resource.storageRef) {
        try {
          setLoading(true);
          const url = await getResourceMediaUrl(resource.storageRef);
          if (!ignore) setMediaUrl(url || "");
        } catch (_) {}
        finally { if (!ignore) setLoading(false); }
      }
    };
    load();
    return () => { ignore = true };
  }, [resource?.type, resource?.storageRef]);

  useEffect(() => {
    let ignore = false;
    const loadCase = async () => {
      if (resource?.type === 'negotiation' && resource.caseId && !readOnly) {
        try {
          setLoadingCase(true);
          const c = await getCaseByIdForPreview(resource.caseId);
          if (!ignore) setAcase(c || null);
        } catch (_) {}
        finally { if (!ignore) setLoadingCase(false); }
      } else {
        setAcase(null);
      }
    };
    loadCase();
  }, [resource?.type, resource?.caseId, readOnly]);

  if (!resource) return null;

  const finish = () => {
    if (completedOnce.current) return;
    completedOnce.current = true;
    if (typeof onComplete === 'function') onComplete(stageId || null);
  };

  const selectedCase = useMemo(() => {
    if (!acase) return null;
    return {
      ...acase,
      caseTitle: acase.title,
      partyInstructions: acase.instructions,
      generalInstructions: acase.context,
      side: resource?.side || 'a',
      params: resource?.aiParams || null,
    };
  }, [acase, resource?.side, resource?.aiParams]);

  const chatState = useChatWindowState({
    initialMessages: [],
    initialStats: { score: 0, offer: [] },
    initialNegId: null,
    acase: isNegotiation ? selectedCase : null,
    user,
    isPractice: isNegotiation,
    aiSide: (resource?.side === 'a') ? 'b' : 'a',
    onSettled: () => {},
    onOffer: () => {},
    viewOnly: !isNegotiation,
    vsAI: isNegotiation,
    enemyIds: null,
    ownTeamIds: null,
    params: resource?.aiParams ?? null,
  });

  useEffect(() => {
    if (isNegotiation && chatState?.isEnded && !readOnly) {
      finish();
    }
  }, [isNegotiation, chatState?.isEnded, readOnly]);

  switch (resource.type) {
    case 'text':
      return (
        <div className="space-y-4">
          <div className="p-4 bg-white/90 rounded-2xl border border-pale-gray max-h-[60vh] overflow-auto">
            <div dangerouslySetInnerHTML={{ __html: resource.text || '' }} />
          </div>
          {!readOnly && (
            <Button onClick={finish} className="bg-vivid-blue hover:bg-deep-blue text-white rounded-full px-6">Mark as complete</Button>
          )}
        </div>
      );
    case 'quiz':
      return <QuizView quiz={resource.quiz} onComplete={() => !readOnly && finish()} readOnly={readOnly} />;
    case 'audio':
      return (
        <div className="space-y-4">
          {loading && <div className="text-sm text-gray-500">Loading audio...</div>}
          {mediaUrl && <audio src={mediaUrl} controls className="w-full" />}
          {!readOnly && (
            <Button onClick={finish} className="bg-vivid-blue hover:bg-deep-blue text-white rounded-full px-6">Mark as complete</Button>
          )}
        </div>
      );
    case 'video':
      return (
        <div className="space-y-4">
          {loading && <div className="text-sm text-gray-500">Loading video...</div>}
          {mediaUrl && (
            <video src={mediaUrl} controls className="w-full rounded-xl border border-pale-gray max-h-[60vh]" />
          )}
          {!readOnly && (
            <Button onClick={finish} className="bg-vivid-blue hover:bg-deep-blue text-white rounded-full px-6">Mark as complete</Button>
          )}
        </div>
      );
    case 'negotiation':
      if (readOnly) {
        return (
          <div className="space-y-3 p-4 rounded-2xl border border-pale-gray bg-white/90">
            <div className="text-lg font-semibold">{resource.title || 'Negotiation'}</div>
            <div className="text-sm text-gray-700">Case: {resource.caseTitle || resource.caseId} • Side: {resource.side?.toUpperCase?.()}</div>
            {resource.aiParams && (
              <div className="text-xs text-gray-600">
                <div className="font-semibold mb-1">AI Parameters</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(resource.aiParams).map(([k,v]) => (
                    <div key={k} className="flex justify-between border rounded px-2 py-1">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-mono text-gray-800">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      if (loadingCase || !selectedCase) {
        return <div className="text-sm text-gray-600">Loading negotiation...</div>;
      }
      return (
        <div className="rounded-2xl border border-pale-gray bg-white/90 overflow-hidden">
          <div className="px-4 py-3 border-b border-pale-gray flex items-center justify-between bg-white">
            <div>
              <div className="font-semibold">{resource.title || selectedCase.caseTitle || 'Negotiation'}</div>
              <div className="text-xs text-gray-600">Side: {String(resource?.side || 'a').toUpperCase()} • AI Side: {resource?.side === 'a' ? 'B' : 'A'}</div>
            </div>
            <div className="text-xs text-gray-500">Completion auto-marks when negotiation ends</div>
          </div>
          <div className="h-[70vh]">
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
              user={user}
              acase={selectedCase}
              vsAI={true}
              isPractice={true}
              viewOnly={false}
            />
          </div>
        </div>
      );
    default:
      return null;
  }
}
