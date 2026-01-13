"use client";

import React, { useEffect, useState } from "react";
import EventCard from "./EventCard";
import { getEvents } from "@/actions/events";
import { getTimeLeft } from "@/lib/util";
import { useRouter } from "next/navigation"; 
import YouTubeOverlay from "./YoutubeOverlay";

const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const router = useRouter();

  const [showOverlay, setShowOverlay] = useState(false);
  const [targetEventId, setTargetEventId] = useState(null);
  const [overlayYoutubeId, setOverlayYoutubeId] = useState("H0Wpsfi2T4Q"); 

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEvents(true);
        const normalized = Array.isArray(data) ? data : data.events || [];
        setEvents(normalized);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const navigateToEvent = () => {
    if (targetEventId) {
      router.push(`/negotiator/events/${targetEventId}`);
      setTargetEventId(null);
    }
  };

  const handleContinueClick = (eventId, eventYoutubeId) => {
    const hideVideo = localStorage.getItem("eventIntroHidden");

    if (hideVideo) {
      router.push(`/negotiator/events/${eventId}`);
    } else {
      setTargetEventId(eventId);
      if (eventYoutubeId) {
        setOverlayYoutubeId(eventYoutubeId); 
      }
      setShowOverlay(true);
    }
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    navigateToEvent(); 
  };

  const handleDoNotShowAgain = () => {
    localStorage.setItem("eventIntroHidden", "true");
    setShowOverlay(false);
    navigateToEvent();
  };


  if (loading) return <div>Loading events...</div>;
  if (!events.length) return <div>No events found.</div>;

  const filteredEvents = events.filter((event) => {
    if (filter === "active") return !event.finished;
    if (filter === "ended") return event.finished;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 sm:gap-6 w-full flex-wrap">
        {["all", "active", "ended"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 sm:px-5 sm:py-3 sm:w-[112px] rounded-[60px] border-2 transition-colors duration-300 capitalize
              ${
                filter === f
                  ? "bg-[#F5F6F6] text-black"
                  : "border-[#F5F6F6] text-black hover:bg-[#F5F6F6]"
              }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const endTimeMs = event.endTime?.seconds
            ? event.endTime.seconds * 1000
            : new Date(event.endTime).getTime();
          const diff = endTimeMs - Date.now();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const timeLeftStr = `${String(hours).padStart(2, "0")}:${String(
            minutes
          ).padStart(2, "0")}`;

          return (
            <EventCard
              key={event.id}
              image={event.coverLink || "/default-event.jpg"}
              title={event.title}
              status={event.finished ? "Ended" : "Active"}
              endingDate={new Date(endTimeMs).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
              timeLeft={event.finished ? "00:00" : timeLeftStr}
              eventId={event.id}
              roundId={event.roundId || 1}
              onContinueClick={() => handleContinueClick(event.id, event.youtubeId)}
            />
          );
        })}
      </div>
      <YouTubeOverlay
        isOpen={showOverlay}
        youtubeId={overlayYoutubeId}
        onClose={handleCloseOverlay}
        onDoNotShowAgain={handleDoNotShowAgain}
      />
    </div>
  );
};

export default EventsList;