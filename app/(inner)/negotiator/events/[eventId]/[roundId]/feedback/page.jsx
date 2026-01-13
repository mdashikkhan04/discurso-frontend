/**
 * @component
 * @returns {JSX.Element}
 *
 * @typedef {Object} Scores
 * @property {number} expressionQuality
 * @property {number} activeParticipation
 * @property {number} managingEmotions
 * @property {number} understandingValues
 * @property {number} stageSetting
 * @property {number} makingFirstOffer
 * @property {number} managingConcessions
 * @property {number} searchingTradeOffs
 * @property {number} generatingOptions
 * @property {number} objectiveCriteria
 * @property {number} postSettlement
 * @property {number} strategicAdapt
 * @property {number} trustAndRelation
 * @property {number} moralWisdom
 *
 * @typedef {Object} Reasoning
 * @property {string} expressionQuality
 * @property {string} activeParticipation
 * @property {string} managingEmotions
 * @property {string} understandingValues
 * @property {string} stageSetting
 * @property {string} makingFirstOffer
 * @property {string} managingConcessions
 * @property {string} searchingTradeOffs
 * @property {string} generatingOptions
 * @property {string} objectiveCriteria
 * @property {string} postSettlement
 * @property {string} strategicAdapt
 * @property {string} trustAndRelation
 * @property {string} moralWisdom
 *
 * @typedef {Object} FeedbackData
 * @property {string} id
 * @property {Scores} scores
 * @property {Reasoning} reasoning
 * @property {string} summary
 * @property {string} negId
 * @property {string} caseId
 * @property {string} model
 * @property {number} duration
 * @property {number} cost
 * @property {boolean} isPractice
 * @property {number} time
 *
 * @typedef {Object.<string, string>} FeedbackLabels
 *
 * @typedef {Object} EventData
 * @property {string} title
 * @property {string} currentRound
 * @property {string} caseTitle
 */
"use client";

import { useUser } from "@/contexts/UserContext";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { fetcher } from "@/lib/fetcher";
import { useLoading } from "@/contexts/LoadingContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import EventViewFlow from "@/components/negotiation/EventViewFlow";
import { ArrowLeft } from "lucide-react";

export default function FeedbackPage() {
  const { eventId, roundId } = useParams();
  const { user } = useUser();
  const { showLoading, hideLoading } = useLoading();
  const [error, setError] = useState(/** @type {string} */ "");
  const [event, setEvent] = useState(/** @type {EventData} */ null);
  const [feedbackData, setFeedbackData] = useState(
    /** @type {FeedbackData}*/ {}
  );
  const [feedbackLabels, setFeedbackLabels] = useState(
    /** @type {FeedbackLabels} */ null
  );
  const router = useRouter();

  async function fetchFeedback() {
    const agrrDataRes = await fetcher.get(
      `/api/data/events/${eventId}/${user.uid}?round=${roundId}`,
      // `/api/data/events/${eventId}/vpuSEEG88iWczTy98QnCDexnEbJ3`,
      // `/api/data/events/${eventId}/X5I6G5bHHJggWquXEcjYWdU1mol2`,
      user
    );

    if (!agrrDataRes.ok) {
      setError(agrrDataRes.error || "Failed to fetch feedback data");
      console.error("Error fetching feedback data:", agrrDataRes.error);
    } else {
      const agrrData = agrrDataRes.result.data;
      setFeedbackData(agrrData.feedback);
      if (agrrData.feedbackLabels) setFeedbackLabels(agrrData.feedbackLabels);
      setEvent({
        title: agrrData.event.title,
        currentRound: agrrData.event.currentRound,
        caseTitle: agrrData.case.caseTitle,
      });
    }

    if (agrrDataRes?.status === 403 || agrrDataRes?.result?.data?.feedback === null) {
      // Redirect back to event page if access is forbidden or feedback is not available
      router.push(`/negotiator/events/${eventId}`);
    }
  }

  useEffect(() => {
    if (!user || !eventId || !roundId) return;
    showLoading();
    fetchFeedback()
      .catch((err) => {
        console.error("Error fetching feedback:", err);
        setError("Failed to fetch feedback data");
      })
      .finally(() => hideLoading());
  }, [user, eventId, roundId, router]);

  return (
    <main className="p-2 sm:p-4 bg-white relative *:z-10 *:relative min-h-screen">
      <div className="!absolute top-0 left-0 w-screen h-[70vh] bg-gradient-to-b from-vivid-blue to-deep-blue !z-0"></div>
      <header className="text-center mt-4 sm:mt-8 w-full sm:!w-11/12 relative block mx-auto px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 text-white">
          {event?.title || ""}
        </h1>

        <div>
          <p className="text-base sm:text-lg lg:text-xl mb-6 lg:mb-0 font-semibold z-50 text-white">
            Round {event?.currentRound || roundId} -{" "}
            {event?.caseTitle || "Untitled Case"}
          </p>
        </div>

        <div className="flex items-center justify-between flex-wrap">

          <div
            onClick={() => router.push(`/negotiator/events/${eventId}`)}
            className="px-2 sm:px-4 py-1 rounded-full bg-white drop-shadow-lg cursor-pointer hover:bg-gray-200 border-2 border-transparent transition-colors"
          >
            <span className="font-semibold text-sm sm:text-lg text-darker-gray">
              <ArrowLeft className="inline-block mr-1 sm:mr-2" />
              Go back
            </span>
          </div>
          <EventViewFlow placingClassName="sm:flex hidden" />
        </div>
      </header>
      <EventViewFlow placingClassName="left-2 sm:left-0 -bottom-3 justify-center sm:hidden flex" />
      {error ? (
        <div className="w-11/12 mx-auto mb-8 mt-8 flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl backdrop-blur-sm bg-white drop-shadow-lg">
          <div className="text-black text-center">
            <h3 className="text-xl sm:text-2xl font-semibold mb-4">Something went wrong</h3>
            <p className="text-base sm:text-lg mb-6 text-black">
              We're sorry, but we couldn't load the feedback for this round. This might be due to:
            </p>
            <ul className="text-left text-sm sm:text-base mb-6 space-y-2 text-black">
              <li>The round may not have finished yet</li>
              <li>Feedback may not be available for this round</li>
              <li>You may not have permission to view this feedback</li>
              <li>There might be a temporary server issue</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <button
                onClick={() => router.push(`/negotiator/events/${eventId}`)}
                className="px-4 sm:px-6 py-2 bg-white/20 text-black rounded-full font-semibold transition-colors text-sm sm:text-base border-2 hover:bg-gray-200"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 sm:px-6 py-2 bg-vivid-blue text-white rounded-full font-semibold hover:bg-deep-blue transition-colors text-sm sm:text-base"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : feedbackData ?

        <div
          className={`flex flex-col items-center sm:w-11/12 w-full mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:mb-8 sm:mt-4 h-fit drop-shadow-lg relative bg-white rounded-3xl`}
        >
          <div className="flex flex-col lg:flex-row items-center justify-center my-4 sm:my-8 w-full gap-4 sm:gap-8">
            <div className="w-fit h-fit relative">
              <Image src="/ai-zaac.png" width={200} height={200} className="sm:w-[280px] sm:h-[280px] lg:w-[320px] lg:h-[320px] mt-4 mb-2" alt="AI Zaac" />
              <div className="flex items-center justify-center w-3/4 bottom-4 left-[12.5%] px-6 sm:px-8 lg:px-12 py-2 absolute mx-auto bg-white rounded-full">
                <p className="text-sm sm:text-lg font-semibold text-vivid-pink">AI-zaac</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:gap-4 w-full lg:w-1/3 text-center lg:text-left">
              <p className="text-xl sm:text-2xl lg:text-3xl font-semibold">Nice job on that negotiation {user?.displayName?.split(" ")[0] || ""}!</p>
              <p className="line-clamp-6 text-gray-500 leading-6 text-sm sm:text-base">{feedbackData?.summary}</p>
            </div>
          </div>
          <div className="w-full rounded-2xl flex flex-col gap-4 my-4 sm:my-8 px-4 sm:px-8 lg:px-32 pt-8 sm:pt-12 lg:pt-16 pb-4 sm:pb-6 lg:pb-8 relative bg-soft-pink p-4">
            <Image src="/ai-stars-purple.png" width={48} height={48} className="sm:w-16 sm:h-16 lg:absolute left-4 sm:left-8 top-4 sm:top-8" alt="" />
            <p className="text-xl sm:text-2xl lg:text-3xl font-semibold">AI Feedback</p>
            <p className="text-gray-500 text-sm sm:text-base">{feedbackData?.summary}</p>
            {/* <div className="flex items-center justify-center px-12 py-2 gap-4 w-fit mx-auto bg-white rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
            <Image src="/books.png" width={24} height={24} alt="" />
            <p className="text-lg font-semibold text-vivid-pink">Catch up on key concepts</p>
          </div> */}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-8 mt-8 sm:mt-16 mx-auto w-full">
            {Object.entries(feedbackData?.scores || {}).slice(0, 12).map(([key, value]) => (
              <FeedbackItem
                key={key}
                label={feedbackLabels?.[key] || key}
                reasoning={feedbackData?.reasoning?.[key] || key}
                score={value}
              />
            ))}

            <div className="hidden sm:block lg:hidden"></div>

            {Object.entries(feedbackData?.scores || {}).slice(12).map(([key, value]) => (
              <FeedbackItem
                key={key}
                label={feedbackLabels?.[key] || key}
                reasoning={feedbackData?.reasoning?.[key] || key}
                score={value}
              />
            ))}
          </div>
        </div> : <div
          className={`flex flex-col items-center justify-center sm:w-11/12 w-full min-h-[70vh] mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-8 h-fit drop-shadow-lg relative bg-white rounded-3xl`}
        >
          <p className="text-3xl font-semibold text-center">Feedback unavailable for this negotiations</p>
        </div>}
    </main >
  );
}

const FeedbackItem = ({ label, reasoning, score }) => {
  const scoreColor =
    score < 3 ? "text-red-500" : score > 3 ? "text-green-500" : "text-dark-gray";

  return (
    <div className="flex flex-col items-center justify-around gap-2 border-2 rounded-2xl p-3 sm:p-4 border-soft-gray">
      <p className="text-sm sm:text-lg text-dark-gray font-semibold text-center">{label}</p>
      <p className="text-gray-500 text-center leading-5 text-xs sm:text-sm">{reasoning}</p>
      <p className={`text-xl sm:text-2xl font-semibold ${scoreColor}`}>{score}/5</p>
    </div>
  );
};