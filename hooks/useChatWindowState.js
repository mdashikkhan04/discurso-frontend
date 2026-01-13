import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { sendP2PMessage, getCombinedSnapshot } from "@/lib/client/data";
import { useParams, useRouter } from "next/navigation";
import { getNegotiationResponse } from "@/actions/ai";

export function useChatWindowState({
  initialMessages,
  initialStats,
  initialNegId,
  initialHasAgreement,
  initialHasConflict,
  acase,
  user,
  isPractice,
  aiSide,
  onSettled,
  onOffer,
  viewOnly,
  vsAI,
  enemyIds,
  ownTeamIds,
  params,
  madeDeal,
  isAgreementFinal,
  setHasConflict,
  finalizeAgreement,
  roundEndTime,
  onTimeExpired,
}) {
  const [stats, setStats] = useState(initialStats || { score: 0, offer: [] });
  const [feedback, setFeedback] = useState(null);
  const [messages, setMessages] = useState(() =>
    (initialMessages || []).map((msg) => ({ ...msg, shouldSpeak: false }))
  );
  const [messageInput, setMessageInput] = useState("");
  const [isEnded, setIsEnded] = useState(viewOnly ?? false);
  const [inReq, setInReq] = useState(false);
  const [pendingOfferUpdate, setPendingOfferUpdate] = useState(null);
  const [negId, setNegId] = useState(initialNegId);
  const [showDealInputs, setShowDealInputs] = useState(true);

  const [agreements, setAgreements] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [hasEnemyAgreement, setHasEnemyAgreement] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const { eventId, roundId } = useParams();
  const router = useRouter();
  const recognitionRef = useRef(null);
  const initialLoad = useRef(true);
  const previousMessagesRef = useRef(messages);
  const [isAutoReadingDisabled, setIsAutoReadingDisabled] = useState(false);
  const finalizationTimeoutRef = useRef(null);
  const subscriptionRef = useRef(null);
  const finalizationAttemptedRef = useRef(false);

  const isSpeachSynthSupported = typeof window !== "undefined";
  const speechRecognitionSupported =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const memoizedEnemyIds = useMemo(() => {
    return Array.isArray(enemyIds) ? enemyIds : [];
  }, [enemyIds?.length, enemyIds?.[0]]);

  const memoizedOwnTeamIds = useMemo(() => {
    return Array.isArray(ownTeamIds) ? ownTeamIds : [];
  }, [ownTeamIds?.length, ownTeamIds?.[0]]);

  const caseId = useMemo(
    () => acase?.id || acase?.caseId,
    [acase?.id, acase?.caseId]
  );

  const handleAutomaticFinalization = useCallback(
    (currentConflicts) => {
      if (vsAI || isFinalizing || isEnded || !finalizeAgreement) {
        return;
      }

       if (madeDeal === false) return;

      if (isAgreementFinal) {
        console.debug("Agreement already finalized, skipping...");
        return;
      }

      const ownAgreement = agreements.find(
        (agreement) =>
          agreement.participants &&
          agreement.participants.some((pid) => memoizedOwnTeamIds.includes(pid))
      );

      console.debug("Own Agreement:", ownAgreement);

      const enemyAgreement = agreements.find(
        (agreement) =>
          agreement.participants &&
          agreement.participants.some((pid) => memoizedEnemyIds.includes(pid))
      );

      console.debug("Enemy Agreement:", enemyAgreement);

      const hasOwnAgreement =
        ownAgreement && Object.keys(ownAgreement.agreement || {}).length > 0;
      const hasEnemyAgreementData =
        enemyAgreement && Object.keys(enemyAgreement.agreement || {}).length > 0;

      const isOwnAgreementFinal = ownAgreement?.final === true;
      const isEnemyAgreementFinal = enemyAgreement?.final === true;

      if (
        hasOwnAgreement &&
        hasEnemyAgreementData &&
        currentConflicts.length === 0 &&
        !isOwnAgreementFinal &&
        !isEnemyAgreementFinal
      ) {
        console.debug("Finalizing agreement...");
        if (finalizationTimeoutRef.current) {
          clearTimeout(finalizationTimeoutRef.current);
        }
        setIsFinalizing(true);
        finalizeAgreement(true);
      } else {
        console.debug("Not finalizing agreement.", {
          hasOwnAgreement,
          hasEnemyAgreementData,
          conflictsCount: currentConflicts.length,
          isOwnAgreementFinal,
          isEnemyAgreementFinal,
          isFinalizing,
          isAgreementFinalProp: isAgreementFinal
        });
        if (finalizationTimeoutRef.current) {
          clearTimeout(finalizationTimeoutRef.current);
          finalizationTimeoutRef.current = null;
        }
      }
    },
    [vsAI, isFinalizing, isEnded, finalizeAgreement, agreements, memoizedOwnTeamIds, memoizedEnemyIds, isAgreementFinal, madeDeal]
  );

  useEffect(() => {
    if (initialMessages) {
      const msgs = initialMessages.map((msg) => ({
        ...msg,
        shouldSpeak: false,
      }));
      setMessages(msgs);
      previousMessagesRef.current = msgs;
      initialLoad.current = true;
    }
  }, [initialMessages]);

  useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
    }
  }, [initialStats]);

  useEffect(() => {
    if (initialNegId) {
      setNegId(initialNegId);
    }
  }, [initialNegId]);

  useEffect(() => {
    setIsEnded(viewOnly ?? false);
  }, [viewOnly]);

  useEffect(() => {
    if (madeDeal && isAgreementFinal) {
      setIsEnded(true);
    }
  }, [madeDeal, isAgreementFinal]);

  // Single useEffect to handle automatic finalization
  // Only triggers ONCE when we have both agreements and no conflicts
  useEffect(() => {
    if (vsAI || isAgreementFinal || isFinalizing) return;

    // Only check finalization if we have agreements from both parties and no conflicts
    const shouldFinalize = hasEnemyAgreement && initialHasAgreement && conflicts.length === 0;

    if (shouldFinalize && !finalizationAttemptedRef.current) {
      console.debug("Conditions met for finalization check - attempting finalization");
      finalizationAttemptedRef.current = true;
      handleAutomaticFinalization(conflicts);
    } else if (!shouldFinalize) {
      // Reset the flag if conditions are no longer met
      finalizationAttemptedRef.current = false;
    }
  }, [vsAI, hasEnemyAgreement, initialHasAgreement, conflicts.length, isAgreementFinal, isFinalizing, conflicts, handleAutomaticFinalization, madeDeal]);

  useEffect(() => {
    if (madeDeal === null || madeDeal === undefined) {
      return;
    }

    if (!isAgreementFinal && madeDeal === false) {
      setShowDealInputs(true);
      return;
    }

    setShowDealInputs(false);
  }, [madeDeal, isAgreementFinal]);

  useEffect(() => {
    const storedAutoReading = window.localStorage.getItem(
      "autoReadingDisabled"
    );
    if (storedAutoReading !== null) {
      setIsAutoReadingDisabled(storedAutoReading === "true");
    }
  }, []);

  useEffect(() => {
    if (!roundEndTime || isEnded) return;

    const timeLeft = roundEndTime - Date.now();
    if (timeLeft <= 0) {
      handleTimeExpired();
      return;
    }

    const timeout = setTimeout(() => {
      handleTimeExpired();
    }, timeLeft);

    return () => clearTimeout(timeout);
  }, [roundEndTime, isEnded]);

  const handleTimeExpired = useCallback(() => {
    setIsEnded(true);
    if (onTimeExpired) {
      onTimeExpired();
    }
  }, [onTimeExpired]);

  function toggleAutoReading() {
    setIsAutoReadingDisabled((prev) => {
      const newValue = !prev;
      window.localStorage.setItem("autoReadingDisabled", newValue);
      return newValue;
    });
  }

  const updateStats = useCallback((newStats) => {
    setStats((prevStats) => {
      if (!prevStats) {
        setPendingOfferUpdate(newStats?.offer || []);
        return newStats;
      }
      const newOffer = newStats?.offer || [];
      let prevOffer = prevStats?.offer || [];
      const uniqueIds = new Set(prevOffer.map((p) => p.id));
      prevOffer = prevOffer.filter((p) => {
        if (uniqueIds.has(p.id)) {
          uniqueIds.delete(p.id);
          return true;
        }
        return false;
      });
      const updatedOffer = prevOffer.map((p) => {
        const np = newOffer.find((n) => n.id === p.id);
        return np ? np : p;
      });
      newOffer.forEach((np) => {
        if (!prevOffer.find((p) => p.id === np.id)) updatedOffer.push(np);
      });
      setPendingOfferUpdate(updatedOffer);
      return { ...newStats, offer: updatedOffer };
    });
  }, []);

  useEffect(() => {
    if (pendingOfferUpdate !== null) {
      if (onOffer) onOffer(pendingOfferUpdate);
      setPendingOfferUpdate(null);
    }
  }, [pendingOfferUpdate, onOffer]);

  const setMessagesFromSnapshot = useCallback((newMessages) => {
    if (initialLoad.current) {
      initialLoad.current = false;
      const msgs = newMessages.map((msg) => ({ ...msg, shouldSpeak: false }));
      previousMessagesRef.current = msgs;
      setMessages(msgs);
    } else {
      const previousMessages = previousMessagesRef.current;

      const newMessagesWithFlag = newMessages.map((msg) => {
        const isNew = !previousMessages.some(
          (prevMsg) => prevMsg.id === msg.id
        );
        return { ...msg, shouldSpeak: isNew };
      });

      previousMessagesRef.current = newMessagesWithFlag;
      setMessages(newMessagesWithFlag);
    }
  }, []);

  const setAgreementsFromSnapshot = useCallback(
    (newAgreements) => {
      if (vsAI) return;

      setAgreements(newAgreements);

      const enemyHasAgreement = newAgreements.some(
        (agreement) =>
          agreement.participants &&
          agreement.participants.some((pid) =>
            memoizedEnemyIds.includes(pid)
          ) &&
          Object.keys(agreement.agreement || {}).length > 0
      );
      setHasEnemyAgreement(enemyHasAgreement);
    },
    [vsAI, memoizedEnemyIds]
  );

  const setConflictsFromSnapshot = useCallback(
    (newConflicts) => {
      if (vsAI) return;

      setConflicts(newConflicts);

      const hasConflict = newConflicts.length > 0;
      if (setHasConflict) {
        setHasConflict(hasConflict);
      }
    },
    [vsAI, setHasConflict]
  );

  // useEffect(() => {
  //   if (handleAutomaticFinalization) {
  //     handleAutomaticFinalization(conflicts);
  //   }
  // }, [handleAutomaticFinalization, conflicts]);

  const resetFinalizingState = useCallback(() => {
    setIsFinalizing(false);
  }, []);

  useEffect(() => {
    if (!negId || vsAI || !eventId || !roundId || !user?.uid) return;
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = null;
    }

    const unsubscribe = getCombinedSnapshot(
      {
        onMessages: setMessagesFromSnapshot,
        onAgreements: setAgreementsFromSnapshot,
        onConflicts: setConflictsFromSnapshot,
      },
      eventId,
      roundId,
      user.uid,
      memoizedEnemyIds,
      memoizedOwnTeamIds,
      negId
    );

    subscriptionRef.current = unsubscribe;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [
    negId,
    vsAI,
    eventId,
    roundId,
    user?.uid,
    memoizedEnemyIds,
    memoizedOwnTeamIds,
    setMessagesFromSnapshot,
    setAgreementsFromSnapshot,
    setConflictsFromSnapshot,
  ]);

  useEffect(() => {
    return () => {
      if (finalizationTimeoutRef.current) {
        clearTimeout(finalizationTimeoutRef.current);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event) => {
          let interimTranscript = "";
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interimTranscript += transcript;
            }
          }
          if (finalTranscript) {
            setMessageInput((prev) => prev + finalTranscript);
          }
        };
        recognition.onend = () => {
          setIsRecording(false);
        };
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const queryAI = async (query, pastMessages, currentOffer) => {
    setInReq(true);
    const oData = {
      negId,
      caseId,
      userQuery: query,
      pastMessages: pastMessages.map(msg => {
        const { role, content, ...rest } = msg;
        return { role, content };
      }),
      offer: currentOffer,
      userId: user?.uid,
      aiSide,
      isPractice,
      eventId,
      params,
    };
    if (!isPractice) oData.stats = stats;
    try {
      const response = await getNegotiationResponse(oData);
      setInReq(false);
      if (response.negId) return response;
      console.error("Failed to query AI:", response.error);
      return null;
    } catch (error) {
      setInReq(false);
      console.error("Failed to query AI:", error);
      if (error?.message?.includes("Unauthorized") || error?.message?.includes("token")) {
        router.push("/signin?auth=true");
        return null;
      }
      return null;
    }
  };

  const handleSendMessage = async (e, currentMessages = messages) => {
    if (e) e.preventDefault();
    setIsRecording(false);
    if (!vsAI) {
      handleSendP2PMessage();
      return;
    }
    if (inReq) return;
    const newQuery = messageInput.trim();
    if (!newQuery) return;
    setMessages((prev) => [...prev, { role: "user", content: newQuery }]);
    const typingIndicatorTimeout = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", waiting: true },
      ]);
    }, 2000);
    setMessageInput("");
    const response = await queryAI(
      newQuery,
      currentMessages.filter((m) => !m.indecent),
      stats?.offer?.length > 0 ? stats.offer : null
    );
    setMessages((prev) => {
      clearTimeout(typingIndicatorTimeout);
      const updated = [...prev].map((m) => {
        return { ...m, shouldSpeak: false };
      });
      if (updated.length && updated[updated.length - 1].waiting) updated.pop();
      if (response?.indecent) {
        updated[updated.length - 1].indecent = true;
        updated[updated.length - 1].flags = response.flags;
      }
      if (response?.answer?.length)
        updated.push({
          role: "assistant",
          content: response.answer,
          shouldSpeak: true,
        });
      return updated;
    });
    if (response?.shouldEnd) {
      setIsEnded(true);
      if (onSettled) onSettled(stats.offer, response.overrideEnd);
    }
    if (response?.stats) {
      updateStats(response.stats);
    }
    if (response?.feedback && typeof response?.feedback === "string") {
      setFeedback(response.feedback);
    }
    if (response?.negId) setNegId(response.negId);
  };

  function handleSendP2PMessage() {
    if (!messageInput.trim() || !user?.uid) return;
    sendP2PMessage(negId, messageInput.trim(), user, caseId, eventId, roundId)
      .then((messageId) => {
        // Message sent successfully
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        if (error?.message?.includes("permission") || error?.message?.includes("auth") || error?.code === "permission-denied") {
          router.push("/signin?auth=true");
        } else {
          alert("Failed to send message. Please try again.");
        }
      });
    setMessageInput("");
  }

  return {
    messages,
    messageInput,
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
    handleSendP2PMessage,
    negId,
    setNegId,
    updateStats,
    setMessages,
    setFeedback,
    setStats,
    setMessageInput,
    setIsRecording,
    setInReq,
    agreements,
    conflicts,
    hasEnemyAgreement,
    setAgreements,
    setConflicts,
    isFinalizing,
    resetFinalizingState,
  };
}
