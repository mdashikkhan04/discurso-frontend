"use client";

import React, { useState, useEffect, useMemo } from "react";
import { fetcher } from "@/lib/fetcher";
import { useLoading } from "@/contexts/LoadingContext";
import { useUser } from "@/contexts/UserContext";
import { useParams } from "next/navigation";
import { showSuccessToast, showErrorToast, showInfoToast } from "@/components/toast";
import "@/public/case.css";
import { useRouter, useSearchParams } from "next/navigation";
import { getTimeLeft } from "@/lib/util";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import SurveyOfSatisfaction from "@/components/negotiation/SurveyOfSatisfaction";
import CasePanel from "@/components/negotiation/CasePanel";
import AgreementPanel from "@/components/negotiation/AgreementPanel";
import ChatPanel from "@/components/negotiation/ChatPanel";
import EventViewHeader from "@/components/negotiation/EventViewHeader";
import { useChatWindowState } from "@/hooks/useChatWindowState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TranscriptUpload from "@/components/TranscriptUpload";
import { hasTranscript } from "@/actions/transcripts";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";

function TranscriptOption({ hasExistingTranscript, setShowTranscriptUpload, checkingTranscript }) {
  return (
    <div className="w-full max-w-md text-left">
      <label className="block text-gray-800 font-medium mb-2 text-center md:text-left">
        Negotiation Transcript
      </label>
      <p className="text-sm text-gray-600 mb-3 text-center md:text-left">
        Please upload your negotiation transcript to receive feedback.
      </p>
      {hasExistingTranscript ? (
        <div className="flex items-center justify-center md:justify-start gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle2 size={20} />
          <span className="text-sm font-medium">Transcript uploaded</span>
        </div>
      ) : (
        <Button
          onClick={() => setShowTranscriptUpload(true)}
          variant="outline"
          disabled={checkingTranscript}
          className="w-full"
        >
          {checkingTranscript ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Transcript
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export default function AgreementPage() {
  const [event, setEvent] = useState(null);
  const [acase, setCase] = useState(null);
  const [formData, setFormData] = useState(null);
  const [enemy, setEnemy] = useState(null);
  const [ownTeam, setOwnTeam] = useState(null);
  const [hasAgreement, setHasAgreement] = useState(false);
  // const [hasResult, setHasResult] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [isAgreementFinal, setIsAgreementFinal] = useState(false);
  const [comment, setComment] = useState("");
  const [finished, setFinished] = useState(true);
  const [madeDeal, setMadeDeal] = useState(undefined);
  const [vsAI, setVsAI] = useState(false);
  // const [messages, setMessages] = useState([]);
  const [negId, setNegId] = useState(null);
  const [stats, setStats] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [offer, setOffer] = useState(null);
  const [paramsAI, setParamsAI] = useState(null);
  const [isHandling, setIsHandling] = useState(false);
  const [requiresSVI, setRequiresSVI] = useState(false);
  const [isOnlyAgreement, setIsOnlyAgreement] = useState(false);
  const [direction, setDirection] = useState("horizontal");
  const [fetchedMessages, setFetchedMessages] = useState([]);
  const [isInAppChat, setIsInAppChat] = useState(true);
  const [showCongratulationsDialog, setShowCongratulationsDialog] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showTranscriptUpload, setShowTranscriptUpload] = useState(false);
  const [hasExistingTranscript, setHasExistingTranscript] = useState(false);
  const [checkingTranscript, setCheckingTranscript] = useState(false);
  const { eventId, roundId } = useParams();
  const [matched, setMatched] = useState("none");

  const { user } = useUser();
  const { showLoading, hideLoading } = useLoading();
  const router = useRouter();

  const searchParams = useSearchParams()
  const onlyAgreementParam = searchParams.get('onlyAgreement')

  useEffect(() => {
    const handleResize = () => {
      setDirection(window.innerWidth < 1024 ? "vertical" : "horizontal");
    };
    handleResize();

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dataTypeTips = {
    list: "Select one of the values from the list",
    number:
      "Enter a numeric value - must be a number without any letters or symbols, e.g. 90000.99",
    text: "Enter a text value - can be any text",
  };

  const fetchData = async () => {
    showLoading();
    try {
      const agrrDataRes = await fetcher.get(
        `/api/data/events/${eventId}/${user.uid}?round=${roundId}`,
        // `/api/data/events/${eventId}/vpuSEEG88iWczTy98QnCDexnEbJ3`,
        // `/api/data/events/${eventId}/X5I6G5bHHJggWquXEcjYWdU1mol2`,
        user
      );
      // console.debug("roundDataRes", roundDataRes);

      console.log(agrrDataRes)
      if (agrrDataRes.ok) {
        const agrrData = agrrDataRes.result.data;
        // console.debug("agrrData", agrrData);
        if (!agrrData) return;
        if (agrrData.eventEnded) {
          setEvent(agrrData.event);
          // router.back();
          return;
        }
        setEvent(agrrData.event);
        // if (roundData.event.roundEndTime) {
        //   setTimeLeft(getTimeLeft(roundData.event.roundEndTime));
        //   const timeLeftInterval = setInterval(() => {
        //     const oTimeLeft = getTimeLeft(roundData.event.roundEndTime);
        //     setTimeLeft(oTimeLeft);
        //     if (oTimeLeft.value <= 0) {
        //       clearInterval(timeLeftInterval);
        //       setTimeLeft(null);
        //       setOffer(currentOffer => {
        //         console.log("in set:", currentOffer);
        //         handleAiAgreed(currentOffer, true, true);
        //         return currentOffer;
        //       })
        //     }
        //   }, 1000);
        // }
        if (agrrData.results?.agreement) {
          for (const [key, value] of Object.entries(
            agrrData.results.agreement
          )) {
            agrrData.case.params.find((param) => param.id === key).value =
              value;
          }
          if (Object.keys(agrrData?.results?.agreement || {}).length > 0)
            setHasAgreement(true);
        }
        if (agrrData.results?.madeDeal === false) {
          setHasAgreement(true);
        }
        setEnemy(agrrData.enemy);
        setOwnTeam(agrrData.ownTeam);
        setVsAI(agrrData.vsAI);
        if (Object.values(agrrData?.results?.survey || []).filter((e) => e !== "").length > 0) {
          setRequiresSVI(false);
          // console.log(agrrData.requiresSVI, agrrData.results.survey);
        } else {
          setRequiresSVI(agrrData.requiresSVI ?? true);
        }
        setCase(agrrData.case);
        // console.debug("case", agrrData.case);
        if (!agrrData.preview) {
          if (agrrData.messages) {
            setFetchedMessages(agrrData.messages);
          }
          // console.debug("messages", agrrData.messages);
          if (agrrData.negId) {
            setNegId(agrrData.negId);
          }
          if (agrrData.stats) {
            setStats(agrrData.stats);
          }
          if (agrrData.stats?.offer) setOffer(agrrData.stats.offer);
          if (agrrData.aiParams) setParamsAI(agrrData.aiParams);
          setIsAgreementFinal(prev => agrrData.results?.final || prev);
          setMadeDeal(prev => agrrData.results?.madeDeal ?? prev);
          setFinished(agrrData.finished);
          setComment(agrrData.results?.comment || "");
          setHasConflict(agrrData.results?.agreementConflict || false);
          setIsInAppChat(agrrData.inAppChat ?? true);
          // console.log("isInAppChat", agrrData.inAppChat)
          if (agrrData?.results?.survey && agrrData?.survey) {
            setFormData(
              agrrData.survey.map((input) => ({
                ...input,
                value: agrrData.results?.survey?.[input?.fieldName] ?? "",
              }))
            );
          }
        }
      } else if (agrrDataRes.code === 403 && agrrDataRes.error === "Round has not started yet") {
        showErrorToast("This round has not started yet.");
        router.replace(`/negotiator/events/${eventId}`);
      } else {
        console.error("agrrDataRes", agrrDataRes);
        console.error("Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  useEffect(() => {
    if (event?.roundEndTime && !finished) {
      setTimeLeft(getTimeLeft(event.roundEndTime));
      let hasEnded = false;

      const timeLeftInterval = setInterval(() => {
        const oTimeLeft = getTimeLeft(event.roundEndTime);
        setTimeLeft(oTimeLeft);
        if (oTimeLeft.value <= 0 && !hasEnded) {
          // console.debug("in timeout");
          // console.debug("hasEnded", hasEnded);
          // console.debug("oTimeLeft", oTimeLeft);
          // console.debug("offer", offer);
          clearInterval(timeLeftInterval);
          setTimeLeft(null);
          hasEnded = true;
          // console.debug("hasEnded", hasEnded);
          // setOffer(currentOffer => currentOffer);
          // if (offer) {
          // console.debug("in effect");
          if (vsAI) {
            console.log(offer)
            handleAiAgreed(offer, true, true);
          }
          // setFinished(true);
          // }
        }
      }, 1000);

      return () => clearInterval(timeLeftInterval);
    }
  }, [event?.roundEndTime]);

  // Then add a separate effect to handle timeout action
  // useEffect(() => {
  //   if (timeLeft && timeLeft.value <= 0 && offer) {
  //     console.log("in effect");
  //     handleAiAgreed(offer, true, true);
  //   }
  // }, [timeLeft, offer]);

  const handleInputChange = (fieldName, value) => {
    // if (finished) return;
    // console.log("handleInputChange", fieldName, value, formData);
    if (value < 1 || value > 7) value = "";
    setFormData((prev) => {
      const updatedData = prev.map((input) => {
        if (input.fieldName === fieldName) {
          return { ...input, value }; // Return a new object with the updated value
        }
        return input; // Return the original object if no update is needed
      });
      // console.log("updatedData", updatedData);
      return updatedData;
    });
  };

  const handleParamChange = (paramId, value, dataType) => {
    // console.log("handleParamChange", paramId, value, dataType);
    const paramIndex = acase.params.findIndex(param => param.id === paramId);
    if (paramIndex === -1) return;

    const updatedParams = [...acase.params];

    // Convert value based on data type
    let processedValue = value;
    if (dataType === 'number') {
      processedValue = value === '' ? null : parseFloat(value);
    }

    updatedParams[paramIndex] = {
      ...updatedParams[paramIndex],
      value: processedValue
    };

    setCase((prev) => ({ ...prev, params: updatedParams }));
  };

  //   const calculateAverage = (fields) => {
  //     const validValues = fields.map((field) => Number(formData[field] || 0));
  //     const sum = validValues.reduce((acc, value) => acc + value, 0);
  //     return fields.length > 0 ? (sum / fields.length).toFixed(1) : "0";
  //   };

  const handleSubmit = async (
    e,
    agreement,
    survey,
    skipSurveyCheck,
    hasMadeDeal,
    fromAI,
    overridden,
    timedout,
  ) => {
    if (e) e.preventDefault();
    if (isHandling) return;
    setIsHandling(true);
    // return;

    let bGoodSubmit = false;

    let surveyData = {};
    if (survey) {
      surveyData = formData.reduce((acc, input) => {
        acc[input.fieldName] = input.value;
        return acc;
      }, {});

      // if (!skipSurveyCheck) {
      //   for (const value of Object.values(surveyData)) {
      //     if (!value) {
      //       showErrorToast("Missing survey values");
      //       return;
      //     }
      //   };
      // }
    }

    let agreementData = null;
    let sources;
    const agreeParams = Array.isArray(agreement) ? agreement : null;
    const hasAgreementValues = Array.isArray(agreeParams) && agreeParams.some((param) => {
      const value = param?.value;
      if (value === null || value === undefined) {
        return false;
      }
      if (typeof value === "string") {
        return value.trim() !== "";
      }
      return true;
    });
    const effectiveHasMadeDeal = hasMadeDeal !== undefined ? hasMadeDeal : madeDeal;
    const shouldValidateAgreement = Boolean(agreeParams) && (effectiveHasMadeDeal === undefined || effectiveHasMadeDeal);
    const shouldAutoSetDeal = Boolean(agreeParams) && !skipSurveyCheck && hasAgreementValues;

    if (agreeParams) {
      agreementData = agreeParams.reduce((acc, param) => {
        acc[param.id] = param.value;
        return acc;
      }, {});

      if (fromAI) {
        sources = agreeParams.map((param) => param.source);
      }

      if (shouldValidateAgreement || shouldAutoSetDeal) {
        for (const param of agreeParams) {
          const value = param.value;
          const bIsUnset = value === null || value === undefined || value === '';
          const bIsEmptyText = param.dataType === 'text' && typeof value === 'string' && value.trim() === '';
          if (bIsUnset || bIsEmptyText) {
            showErrorToast("All agreement fields must be filled. Empty values are not allowed.");
            setIsHandling(false);
            return;
          }
        }
      } else if (!hasAgreementValues) {
        agreementData = null;
      }
    }

    let finalMadeDeal = hasMadeDeal ?? madeDeal;
    if (shouldAutoSetDeal && finalMadeDeal !== true) {
      finalMadeDeal = true;
    }
    const bNoDeal = finalMadeDeal === false;
    const dataToSubmit = {
      comment,
      final: fromAI || bNoDeal,
    };

    if (agreementData !== null) {
      dataToSubmit.agreement = agreementData;
    }

    if (survey) {
      dataToSubmit.survey = surveyData;
    }

    console.log(dataToSubmit.final, dataToSubmit.madeDeal)


    const agreements = chatState?.agreements || [];

    const ownAgreement = agreements.find(agreement =>
      agreement.participants &&
      agreement.participants.some(pid => ownTeamIds.includes(pid))
    );
    const enemyAgreement = agreements.find(agreement =>
      agreement.participants &&
      agreement.participants.some(pid => enemyIds.includes(pid))
    );
    const hasOwnAgreement = ownAgreement && Object.keys(ownAgreement.agreement || {}).length > 0;
    const hasEnemyAgreementData = enemyAgreement && Object.keys(enemyAgreement.agreement || {}).length > 0;

    let status = "none"

    if (hasOwnAgreement && hasEnemyAgreementData) {
      if (hasConflict) {
        status = "conflict";
      } else {
        status = "match";
      }
    } else if (hasOwnAgreement && !hasEnemyAgreementData) {
      status = "waiting";
    } else if (!hasOwnAgreement && hasEnemyAgreementData) {
      status = "enemy_submitted";
    } else {
      status = "none";
    }

    if (status === "match" && !vsAI) {
      dataToSubmit.final = true
    } else {
      dataToSubmit.final = false
    }

    if (fromAI) {
      const bOverriden = Boolean(overridden);
      dataToSubmit.overridden = bOverriden;
      dataToSubmit.fromAI = fromAI;
      dataToSubmit.aiTeamId = enemy.team.id;
      dataToSubmit.negId = negId;
      dataToSubmit.makeFeedback = timedout;
      dataToSubmit.aiSide = enemy?.team?.side;
    }

    if (sources) {
      dataToSubmit.agreementSources = sources;
    }

    console.log(dataToSubmit.final, dataToSubmit.madeDeal)

    if (finalMadeDeal !== null && finalMadeDeal !== undefined) {
      dataToSubmit.madeDeal = finalMadeDeal;
    }

    if (!dataToSubmit.madeDeal) {
      dataToSubmit.final = true
    }

    console.log(dataToSubmit.final, dataToSubmit.madeDeal)
    // if (fromAI) return;
    console.log(dataToSubmit)
    // return;
    showLoading();
    try {
      const response = await fetcher.post(
        `/api/data/results/${eventId}/${user.uid}`,
        // `/api/data/results/${eventId}/ZZoVTnxauYPGont0AADvCCIX0623`,
        {
          data: dataToSubmit,
        },
        user
      );
      if (response.ok) {
        showSuccessToast("Agreement saved");
        if (!survey) { await fetchData(); }
        bGoodSubmit = true;
        if (timedout) {
          showInfoToast("Time is up! Agreement submitted automatically.");
          router.push(`/negotiator/events/${eventId}/${roundId}?onlyAgreement=true`);
        }
        // router.back();
      } else {
        console.error("Failed to save Agreement:", response.error);
        showErrorToast("Failed to save Agreement");
      }
      console.log(dataToSubmit.final, dataToSubmit.madeDeal)
      if (dataToSubmit.final && !dataToSubmit.madeDeal && !isAgreementFinal) {
        const response = await fetcher.post(
          `/api/data/results/${eventId}/${enemy.participants[0].id}`,
          // `/api/data/results/${eventId}/ZZoVTnxauYPGont0AADvCCIX0623`,
          {
            data: dataToSubmit,
          },
          user
        );
        if (response.ok) {
          showSuccessToast("Agreement saved");
          if (!survey) { await fetchData(); }
          bGoodSubmit = true;
          if (timedout) {
            showInfoToast("Time is up! Agreement submitted automatically.");
            router.push(`/negotiator/events/${eventId}/${roundId}?onlyAgreement=true`);
          }
          // router.back();
        } else {
          console.error("Failed to save Agreement:", response.error);
          showErrorToast("Failed to save Agreement");
        }
      }
      if (status === "match" && !vsAI) {
        const response = await fetcher.post(
          `/api/data/results/${eventId}/${enemy.participants[0].id}`,
          // `/api/data/results/${eventId}/ZZoVTnxauYPGont0AADvCCIX0623`,
          {
            data: dataToSubmit,
          },
          user
        );
        if (response.ok) {
          showSuccessToast("Agreement saved");
          if (!survey) { await fetchData(); }
          bGoodSubmit = true;
          if (timedout) {
            showInfoToast("Time is up! Agreement submitted automatically.");
            router.push(`/negotiator/events/${eventId}/${roundId}?onlyAgreement=true`);
          }
          // router.back();
        } else {
          console.error("Failed to save Agreement:", response.error);
          showErrorToast("Failed to save Agreement");
        }
      }
    } catch (error) {
      console.error("Error submitting results:", error);
      showErrorToast("An error occurred. Please try again.");
    } finally {
      setIsHandling(false);
      hideLoading();
    }
    return bGoodSubmit;
  };

  const finalizeAgreement = async (skipCheck) => {
    if (isFinalizing) {
      console.debug("Finalization already in progress, skipping...");
      return;
    }

    if (isAgreementFinal) {
      console.debug("Agreement already finalized, skipping...");
      return;
    }

    if (skipCheck || confirm("Are you sure you want to finalize the agreement?")) {
      setIsFinalizing(true);
      try {
        let bSubmitted = await handleSubmit(null, acase.params, formData, true);
        if (bSubmitted) {
          setIsAgreementFinal(true);
        }
      } finally {
        // reset the flag after a delay to allow Firestore to propagate
        setTimeout(() => {
          setIsFinalizing(false);
          if (chatState?.resetFinalizingState) {
            chatState.resetFinalizingState();
          }
        }, 1000);
      }
    }
  };

  const handleAgreementSubmit = async (fromAI) => {
    const bSubmitted = await handleSubmit(null, acase.params, null, fromAI);
    if (bSubmitted) {
      setHasAgreement(true);
    }
  };

  const handleSurveySubmit = async () => {
    const bSubmitted = await handleSubmit(null, null, formData);
    if (bSubmitted) {
      if (vsAI) {
        router.push(`/negotiator/events/${eventId}/${roundId}/feedback`);
      } else {
        setRequiresSVI(false);
        setShowCongratulationsDialog(true);
      }
    }
    // if (bSubmitted) setHasResult(true);
  };

  const handleMadeDeal = async (hasMadeDeal) => {
    setMadeDeal(hasMadeDeal);
    const bSubmitted = await handleSubmit(null, null, null, true, hasMadeDeal);
    if (!bSubmitted) {
      console.log("Submission failed, resetting madeDeal to undefined");
      setMadeDeal(undefined);
    } else {
      console.log("Submission successful, madeDeal set to:", hasMadeDeal);
      if (hasMadeDeal === false) {
        setIsAgreementFinal(true);
        setHasAgreement(true);
      }
    }
    return bSubmitted;
  };

  const handleAiAgreed = async (params, overridden, timedout) => {
    // console.debug("handleAiAgreed", params, overridden, timedout, isHandling);
    if (isHandling || hasAgreement) return;
    setIsHandling(true);
    const bSubmitted = await handleSubmit(
      null,
      params,
      null,
      true,
      true,
      true,
      overridden,
      timedout
    );
    if (bSubmitted) {
      setHasAgreement(true);
      setMadeDeal(true);
      setIsAgreementFinal(true);
    }
  };

  const enemyIds = useMemo(() => enemy?.participants?.map((e) => e.id) || [], [enemy?.participants]);
  const ownTeamIds = useMemo(() => ownTeam?.participants?.map((e) => e.id) || [], [ownTeam?.participants]);

  const chatState = useChatWindowState({
    initialMessages: fetchedMessages,
    initialStats: stats,
    initialNegId: negId,
    initialHasAgreement: hasAgreement,
    initialHasConflict: hasConflict,
    acase,
    user,
    isPractice: false,
    aiSide: enemy?.team?.side,
    onSettled: handleAiAgreed,
    onOffer: setOffer,
    viewOnly: finished,
    vsAI,
    enemyIds,
    ownTeamIds,
    params: paramsAI,
    madeDeal,
    isAgreementFinal,
    setHasConflict,
    finalizeAgreement,
  });

  // useEffect(() => {
  //   console.log("State values:", {
  //     finished,
  //     madeDeal,
  //     isAgreementFinal,
  //     hasAgreement,
  //     isOnlyAgreement
  //   });
  // }, [finished, madeDeal, isAgreementFinal, hasAgreement, isOnlyAgreement]);

  useEffect(() => {
    let showAgreementOnly = false;

    if (vsAI) {
      const hasOutcome = isAgreementFinal || madeDeal === true || madeDeal === false;
      const canShowSurvey = requiresSVI && hasOutcome && !finished;
      showAgreementOnly =
        onlyAgreementParam === "true" || canShowSurvey;
    } else {
      showAgreementOnly =
        (isAgreementFinal && onlyAgreementParam === "true") ||
        (isAgreementFinal && requiresSVI) ||
        (hasAgreement && requiresSVI);
    }

    setIsOnlyAgreement(showAgreementOnly);

    if (showAgreementOnly) {
      router.push(`/negotiator/events/${eventId}/${roundId}?onlyAgreement=true`);
    }
  }, [finished, onlyAgreementParam, requiresSVI, madeDeal, vsAI, eventId, roundId, router, isAgreementFinal, hasAgreement,]);

  useEffect(() => {
    if (!isAgreementFinal || isInAppChat || !negId) return;

    const checkTranscript = async () => {
      setCheckingTranscript(true);
      try {
        const exists = await hasTranscript({
          eventId,
          round: parseInt(roundId, 10),
          negId
        });
        setHasExistingTranscript(exists);
      } catch (error) {
        console.error("Error checking transcript:", error);
        setHasExistingTranscript(false);
      } finally {
        setCheckingTranscript(false);
      }
    };

    checkTranscript();
  }, [isAgreementFinal, isInAppChat, eventId, roundId, negId]);


  useEffect(() => {
    const agreements = chatState?.agreements || [];

    const ownAgreement = agreements.find(agreement =>
      agreement.participants &&
      agreement.participants.some(pid => ownTeamIds.includes(pid))
    );
    const enemyAgreement = agreements.find(agreement =>
      agreement.participants &&
      agreement.participants.some(pid => enemyIds.includes(pid))
    );
    const hasOwnAgreement = ownAgreement && Object.keys(ownAgreement.agreement || {}).length > 0;
    const hasEnemyAgreementData = enemyAgreement && Object.keys(enemyAgreement.agreement || {}).length > 0;

    let status = "none"

    if (hasOwnAgreement && hasEnemyAgreementData) {
      if (hasConflict) {
        status = "conflict";
      } else {
        status = "match";
      }
    } else if (hasOwnAgreement && !hasEnemyAgreementData) {
      status = "waiting";
    } else if (!hasOwnAgreement && hasEnemyAgreementData) {
      status = "enemy_submitted";
    } else {
      status = "none";
    }

    setMatched(status)


  }, [chatState.agreements, ownTeamIds, enemyIds]);

  if (!event) return null;

  console.log(matched)
  const state = vsAI ? isOnlyAgreement : isAgreementFinal ? true : matched === "match";
  return (
    <main className="p-2 bg-white relative *:z-10 *:relative overflow-y-hidden">
      <div className="!absolute top-0 left-0 w-screen min-h-[70vh] h-[70%] bg-gradient-to-b from-vivid-blue to-deep-blue !z-0"></div>
      {/* <Button className="mb-4" onClick={() => handleAiAgreed(offer, true, true)} variant="destructive" /> */}

      <EventViewHeader
        event={event}
        finished={finished}
        timeLeft={timeLeft}
        eventId={eventId}
        roundId={roundId}
        flowDisabled={vsAI ? ((!finished && requiresSVI) || madeDeal == null) : requiresSVI ? true : false}
        hideFeedback={
          !(chatState?.messages?.length || 0)
        }
      />

      {direction === "horizontal" ? <ResizablePanelGroup
        direction="horizontal"
        className={`flex xl:!w-11/12 w-full mx-auto !h-[80vh] drop-shadow-lg relative bg-white rounded-3xl`}
      >
        {state ? <ResizablePanel
          minSize={direction === "horizontal" ? 32 : 0}
          className="h-full"
        >
          <SurveyOfSatisfaction
            formData={formData}
            handleInputChange={handleInputChange}
            requiresSVI={requiresSVI}
            finished={finished}
            handleSurveySubmit={handleSurveySubmit}
            comment={comment}
            setComment={setComment}
            timeLeft={timeLeft}
          />
        </ResizablePanel> :
          <ResizablePanel
            className="h-full p-4 flex flex-col flex-1"
            minSize={direction === "horizontal" ? 32 : 0}
          >
            <CasePanel
              acase={acase}
              ownTeam={ownTeam}
              enemy={enemy}
              vsAI={vsAI}
              user={user}
            />
          </ResizablePanel>}
        <ResizableHandle withHandle />
        {state ? <ResizablePanel
          minSize={direction === "horizontal" ? 32 : 0}
          className="h-full overflow-y-auto max-h-full relative"
        >{madeDeal === false ? (
          <>
            <div className="p-4 text-md text-gray-600 font-semibold flex justify-center">
              No deal was made.
            </div>
            {!isInAppChat && (
              <div className="p-4 m-4">
                <TranscriptOption
                  hasExistingTranscript={hasExistingTranscript}
                  setShowTranscriptUpload={setShowTranscriptUpload}
                  checkingTranscript={checkingTranscript} />
              </div>
            )}
          </>
        ) : (
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
            requiresSVI={requiresSVI}
            vsAI={vsAI}
            isInAppChat={isInAppChat}
            hasExistingTranscript={hasExistingTranscript}
            checkingTranscript={checkingTranscript}
            onUploadTranscript={() => setShowTranscriptUpload(true)}
            agreements={chatState?.agreements || []}
            conflicts={chatState?.conflicts || []}
            enemyIds={enemyIds}
            ownTeamIds={ownTeamIds}
            stats={chatState?.stats || stats}
          />
        )}
        </ResizablePanel> : <ResizablePanel minSize={direction === "horizontal" ? 32 : 0} className="flex-1">
          <ChatPanel
            acase={acase}
            vsAI={vsAI}
            user={user}
            messages={chatState?.messages || []}
            handleAiAgreed={handleAiAgreed}
            finished={finished}
            madeDeal={madeDeal}
            setOffer={setOffer}
            hasConflict={hasConflict}
            eventId={eventId}
            paramsAI={paramsAI}
            enemy={enemy}
            ownTeam={ownTeam}
            stats={chatState?.stats || stats}
            negId={chatState?.negId || negId}
            handleMadeDeal={handleMadeDeal}
            handleParamChange={handleParamChange}
            isAgreementFinal={isAgreementFinal}
            hasAgreement={hasAgreement}
            finalizeAgreement={finalizeAgreement}
            handleAgreementSubmit={handleAgreementSubmit}
            dataTypeTips={dataTypeTips}
            isOnlyAgreement={isOnlyAgreement}
            chatState={chatState}
            isInAppChat={isInAppChat}
          />
        </ResizablePanel>}
      </ResizablePanelGroup> :
        <>
          {state ? <div
            className="py-4 px-2 h-fit xl:!w-11/12 w-full mx-auto"
          >
            <div className="rounded-2xl drop-shadow-lg relative bg-white h-full mb-4">
              {madeDeal === false ? (
                <div className="p-6 text-gray-700 flex flex-col items-center gap-4 text-center">
                  <p className="text-md font-semibold">No deal was made.</p>
                  {!isInAppChat && (
                    <TranscriptOption
                      hasExistingTranscript={hasExistingTranscript}
                      setShowTranscriptUpload={setShowTranscriptUpload}
                      checkingTranscript={checkingTranscript} />
                  )}
                </div>
              ) : (
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
                  requiresSVI={requiresSVI}
                  vsAI={vsAI}
                  isInAppChat={isInAppChat}
                  hasExistingTranscript={hasExistingTranscript}
                  checkingTranscript={checkingTranscript}
                  onUploadTranscript={() => setShowTranscriptUpload(true)}
                  agreements={chatState?.agreements || []}
                  conflicts={chatState?.conflicts || []}
                  enemyIds={enemyIds}
                  ownTeamIds={ownTeamIds}
                  stats={chatState?.stats || stats}
                />
              )}
            </div>
            <div className="rounded-2xl drop-shadow-lg bg-white h-full">
              <SurveyOfSatisfaction
                formData={formData}
                handleInputChange={handleInputChange}
                requiresSVI={requiresSVI}
                finished={finished}
                handleSurveySubmit={handleSurveySubmit}
                comment={comment}
                setComment={setComment}
                timeLeft={timeLeft}
              />
            </div>
          </div> :
            <div
              className="py-4 px-2 h-fit xl:!w-11/12 w-full mx-auto lg:mt-0"
            >
              <div className="rounded-2xl drop-shadow-lg bg-white h-full mb-4 p-2">
                <CasePanel
                  acase={acase}
                  ownTeam={ownTeam}
                  enemy={enemy}
                  vsAI={vsAI}
                  user={user}
                />
              </div>
              <div className="rounded-2xl drop-shadow-lg bg-white h-[80vh] mb-4 border-2 border-soft-gray">
                <ChatPanel
                  acase={acase}
                  vsAI={vsAI}
                  user={user}
                  messages={chatState?.messages || []}
                  handleAiAgreed={handleAiAgreed}
                  finished={finished}
                  madeDeal={madeDeal}
                  setOffer={setOffer}
                  hasConflict={hasConflict}
                  eventId={eventId}
                  paramsAI={paramsAI}
                  enemy={enemy}
                  ownTeam={ownTeam}
                  stats={chatState?.stats || stats}
                  negId={chatState?.negId || negId}
                  handleMadeDeal={handleMadeDeal}
                  handleParamChange={handleParamChange}
                  isAgreementFinal={isAgreementFinal}
                  hasAgreement={hasAgreement}
                  finalizeAgreement={finalizeAgreement}
                  handleAgreementSubmit={handleAgreementSubmit}
                  dataTypeTips={dataTypeTips}
                  isOnlyAgreement={isOnlyAgreement}
                  chatState={chatState}
                  isInAppChat={isInAppChat}
                />
              </div>
            </div>
          }
        </>
      }
      <Dialog open={showCongratulationsDialog} onOpenChange={setShowCongratulationsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Congratulations!</DialogTitle>
            <DialogDescription className="pt-4">
              You have successfully completed the negotiation. You can now close this window.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => {
                setShowCongratulationsDialog(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showTranscriptUpload && (
        <div>
          <TranscriptUpload
            onClose={() => setShowTranscriptUpload(false)}
            onDone={() => {
              setHasExistingTranscript(true);
              setShowTranscriptUpload(false);
            }}
            eventId={eventId}
            round={parseInt(roundId, 10)}
            negId={negId}
            aSideName={ownTeam?.name || "A"}
            bSideName={enemy?.name || "B"}
            closeOnStart={false}
          />
        </div>
      )}
    </main>
  );
}
