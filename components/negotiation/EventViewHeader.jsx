import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EventViewFlow from "@/components/negotiation/EventViewFlow";
import { ArrowLeft } from "lucide-react";

export default function EventViewHeader({
  event,
  finished,
  timeLeft,
  eventId,
  roundId,
  flowDisabled,
  hideFeedback = false,
}) {
  const router = useRouter();
  const searchParams = useSearchParams()
  const backToDashboardParam = searchParams.get('backToDashboard');
  
  return (
    <header className="text-center mt-8 lg:mb-4 xl:mx-auto px-2 xl:!w-11/12 w-full z-50 box-border grid md:grid-cols-2 grid-cols-1 gap-4 md:grid-rows-1 grid-rows-2 items-center justify-between">
      {!finished && timeLeft ? (
        <div className="flex items-center gap-2 z-50 h-10 sm:justify-start justify-center">
          <div
          title="Go back to event overview"
            onClick={
              backToDashboardParam ? () => router.push('/negotiator') : () => router.push(`/negotiator/events/${eventId}`)
            }
            className="px-4 py-1 rounded-full bg-white drop-shadow-lg cursor-pointer flex items-center gap-1 hover:bg-gray-200 transition-colors border-2 border-transparent"
          >
            <ArrowLeft className="inline-block text-lg my-0.5 xl:my-0" />
            <span className="font-semibold text-lg xl:inline hidden text-darker-gray">
              Go back
            </span>
          </div>
          <div className="rounded-full border-2 border-white bg-transparent drop-shadow-lg px-4 py-1 flex-shrink-0">
            <span className="font-semibold text-lg text-white">
              Round {event.currentRound || roundId}
            </span>
          </div>
          <div className={`rounded-full box-border drop-shadow-lg px-4 py-1 flex-shrink-0 ${timeLeft.unit === 'seconds' ? 'bg-red-500 !text-white' : 'bg-transparent !text-white border-2 border-white'}`}>
            {timeLeft.unit === "seconds" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-25"></span>}
            <span className="font-semibold text-lg text-white">
              {timeLeft.value} {timeLeft.unit} left
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full z-50 h-10 sm:justify-start gap-2">
          <div
            onClick={() => router.push(`/negotiator/events/${eventId}`)}
            className="flex items-center z-50 h-10 sm:w-fit w-full md:justify-start justify-center px-2 sm:px-4 py-1 rounded-full bg-white drop-shadow-lg cursor-pointer sm:flex-shrink-0"
          >
            <span className="font-semibold text-lg text-darker-gray">
              <ArrowLeft className="inline-block mr-1 sm:mr-2" />
              Go back
            </span>
          </div>
          <div className="rounded-full bg-white drop-shadow-lg sm:w-fit w-full px-4 py-1.5 sm:flex-shrink-0">
            <span className="font-semibold text-lg text-darker-gray">
              Round {event.currentRound || roundId}
            </span>
          </div>
        </div>
      )}
      {/* <p title={event.title} className="text-3xl text-center font-semibold mb-2 text-white truncate lg:order-none md:order-last order-none lg:col-span-1 md:col-span-2">
        {event.title}
      </p> */}
      <EventViewFlow hideFeedback={hideFeedback} disabled={flowDisabled} onlyCurrentPage={flowDisabled} />
    </header>
  );
} 