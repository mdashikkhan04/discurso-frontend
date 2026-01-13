"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { fetcher } from "@/lib/fetcher";
import { useUser } from "@/contexts/UserContext";
import { useLoading } from "@/contexts/LoadingContext";
import RoundsViewRound from "@/components/negotiation/RoundsViewRound";
import { ArrowLeft } from "lucide-react";

export default function NegotiatorEventsPage() {
  const { eventId } = useParams();
  const { user } = useUser();
  const { showLoading, hideLoading } = useLoading();
  const [rounds, setRounds] = useState(null);
  const [eventTitle, setEventTitle] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const router = useRouter();

  useEffect(() => {
    if (!user || !eventId) return;
    const fetchRounds = async () => {
      setError("");
      showLoading();
      try {
        const res = await fetcher.get(
          `/api/data/events/${eventId}/${user.uid}/rounds`,
          user
        );
        if (res.ok) {
          setEventTitle(res.result.eventTitle || "Event");
          setRounds(res.result.rounds);
          // if (res.result.rounds && res.result.rounds?.length === 1 && now >= res.result.rounds[0].viewTime && !res.result.rounds[0].hasMadeDeal) {
          //   router.push(`/negotiator/events/${eventId}/1`);
          // }
        } else if (res.status === 403) {
          // Redirect back to event page if access is forbidden
          router.push(`/negotiator/events/${eventId}`);
        } else {
          setError(res.error || "Failed to fetch rounds");
        }
      } catch (error) {
        console.error("Error fetching rounds:", error);
        setError("Failed to fetch rounds");
      } finally {
        hideLoading();
      }
    };
    fetchRounds();
  }, [user, eventId, router]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (rounds && now >= rounds[0].viewTime && rounds[0].endTime > now && !rounds[0].hasMadeDeal) {
      router.push(`/negotiator/events/${eventId}/1?backToDashboard=true`);
    }
  }, [rounds]);

  return (
    <main className="bg-gradient-to-b from-vivid-blue to-deep-blue min-h-screen h-fit pb-8 pt-16 flex flex-col xl:justify-center items-center relative">
      <div
        onClick={() => router.push("/negotiator")}
        className="absolute z-50 px-4 py-1 rounded-full left-4 top-4 bg-white drop-shadow-lg cursor-pointer"
      >
        <span className="font-semibold text-lg text-darker-gray">
          <ArrowLeft className="inline-block mr-2" />
          Go back
        </span>
      </div>
      <h2 className="text-soft-white text-4xl font-semibold text-center px-2">{eventTitle}</h2>
      <p className="text-soft-white font-semibold text-lg mt-2 mb-16 text-center">
        Choose round
      </p>
      {error && (
        <div className="w-11/12 mx-auto mb-8 mt-8 flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl backdrop-blur-sm bg-white drop-shadow-lg">
          <div className="text-black text-center">
            <h3 className="text-2xl font-semibold mb-4">Something went wrong</h3>
            <p className="text-lg mb-6 text-black/90">
              We're sorry, but we couldn't load the rounds for this event. This might be due to:
            </p>
            <ul className="text-left text-base mb-6 space-y-2 text-black/80">
              <li>The event may not be available yet</li>
              <li>You may not have permission to view this content</li>
              <li>There might be a temporary server issue</li>
            </ul>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-vivid-blue text-white rounded-full font-semibold hover:bg-deep-blue transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/negotiator")}
                className="px-6 py-2 bg-white/20 text-black rounded-full font-semibold hover:bg-gray-200 border-2 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
      {rounds?.length > 0 ? (
        <div className="2xl:w-4/5 xl:w-11/12 md:w-[500px] w-full p-2 xl:gap-0 gap-8 flex flex-col overflow-y-auto xl:flex-row xl:items-center rounded-2xl">
          {rounds.map((round, idx) => {

            let rounding = "xl:rounded-none rounded-2xl ";
            if (idx === 0) {
              rounding += "xl:!rounded-l-2xl ";
            }
            if (idx === rounds.length - 1 || (rounds[idx + 1]?.viewTime > now && now >= round.viewTime)) {
              rounding += "xl:rounded-r-2xl ";
            }

            return (
              <RoundsViewRound
                key={idx}
                title={round.title}
                viewTime={round.viewTime}
                startTime={round.startTime}
                endTime={round.endTime}
                aiRound={round.aiRound}
                index={idx}
                eventId={eventId}
                finished={round.finished}
                roundingClass={rounding}
                hasMadeDeal={round.hasMadeDeal}
              />
            )
          })}
        </div>
      ) : !error ? (
        <div className="w-3/4 flex items-center justify-center p-4 rounded-2xl">
          <p className="text-soft-white text-2xl font-medium">
            No rounds available
          </p>
        </div>
      ) : null}
    </main>
  );
}
