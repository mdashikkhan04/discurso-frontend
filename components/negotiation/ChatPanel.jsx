import React from "react";
import ChatWindow from "@/components/negotiation/ChatWindow";

export default function ChatPanel({
  acase,
  vsAI,
  user,
  messages,
  finished,
  madeDeal,
  hasConflict,
  stats,
  negId,
  handleMadeDeal,
  handleParamChange,
  isAgreementFinal,
  hasAgreement,
  finalizeAgreement,
  handleAgreementSubmit,
  dataTypeTips,
  isOnlyAgreement,
  chatState,
  isInAppChat,
  enemy,
  ownTeam,
}) {
  const enemyIds = enemy?.participants?.map(p => typeof p === 'object' ? p.id : p) || [];
  const ownTeamIds = ownTeam?.participants?.map(p => typeof p === 'object' ? p.id : p) || [];

  return (
    acase && (
      vsAI ? (
        <ChatWindow
          messages={chatState?.messages || messages}
          messageInput={chatState?.messageInput}
          setMessageInput={chatState?.setMessageInput}
          handleSendMessage={chatState?.handleSendMessage}
          isEnded={chatState?.isEnded}
          setIsEnded={chatState?.setIsEnded}
          inReq={chatState?.inReq}
          stats={chatState?.stats || stats}
          feedback={chatState?.feedback}
          toggleAutoReading={chatState?.toggleAutoReading}
          isAutoReadingDisabled={chatState?.isAutoReadingDisabled}
          isSpeachSynthSupported={chatState?.isSpeachSynthSupported}
          speechRecognitionSupported={chatState?.speechRecognitionSupported}
          toggleRecording={chatState?.toggleRecording}
          isRecording={chatState?.isRecording}
          showDealInputs={chatState?.showDealInputs}
          setShowDealInputs={chatState?.setShowDealInputs}
          negId={chatState?.negId || negId}
          setNegId={chatState?.setNegId}
          updateStats={chatState?.updateStats}
          setMessages={chatState?.setMessages}
          setFeedback={chatState?.setFeedback}
          acase={acase}
          user={user}
          isPractice={false}
          vsAI={vsAI}
          viewOnly={madeDeal || finished}
          isInAppChat={isInAppChat}
        />
      ) : (
        <ChatWindow
          messages={chatState?.messages || messages}
          messageInput={chatState?.messageInput}
          setMessageInput={chatState?.setMessageInput}
          handleSendMessage={chatState?.handleSendMessage}
          isEnded={chatState?.isEnded}
          setIsEnded={chatState?.setIsEnded}
          inReq={chatState?.inReq}
          stats={chatState?.stats || stats}
          feedback={chatState?.feedback}
          toggleAutoReading={chatState?.toggleAutoReading}
          isAutoReadingDisabled={chatState?.isAutoReadingDisabled}
          isSpeachSynthSupported={chatState?.isSpeachSynthSupported}
          speechRecognitionSupported={chatState?.speechRecognitionSupported}
          toggleRecording={chatState?.toggleRecording}
          isRecording={chatState?.isRecording}
          showDealInputs={chatState?.showDealInputs}
          setShowDealInputs={chatState?.setShowDealInputs}
          negId={chatState?.negId || negId}
          setNegId={chatState?.setNegId}
          updateStats={chatState?.updateStats}
          setMessages={chatState?.setMessages}
          setFeedback={chatState?.setFeedback}
          acase={acase}
          user={user}
          isPractice={false}
          vsAI={vsAI}
          viewOnly={finished}
          madeDeal={madeDeal}
          finished={finished}
          handleMadeDeal={handleMadeDeal}
          handleParamChange={handleParamChange}
          isAgreementFinal={isAgreementFinal}
          hasAgreement={hasAgreement}
          finalizeAgreement={finalizeAgreement}
          handleAgreementSubmit={handleAgreementSubmit}
          dataTypeTips={dataTypeTips}
          hasConflict={hasConflict}
          isOnlyAgreement={isOnlyAgreement}
          isInAppChat={isInAppChat}
          enemyIds={enemyIds}
          ownTeamIds={ownTeamIds}
          agreements={chatState?.agreements || []}
          conflicts={chatState?.conflicts || []}
          hasEnemyAgreement={chatState?.hasEnemyAgreement || false}
        />
      )
    )
  );
}
