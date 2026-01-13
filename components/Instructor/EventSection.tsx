"use client";

import { useState } from "react";
import { InstructorDashboardEvent } from "@/types/interfaces";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { IoPodiumOutline } from "react-icons/io5";
import Link from "next/link";

export default function InstructorDashboardEventSection({
  events,
}: {
  events: InstructorDashboardEvent[];
}) {
  const [filter, setFilter] = useState("all");

  const filteredEvents = events.filter((event) => {
    if (filter === "drafts") return event.draft;
    if (filter === "active") return !event.finished && !event.draft;
    if (filter === "ended") return event.finished && !event.draft;
    return true; // 'all'
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Filters */}
      <div className="flex gap-4 sm:gap-6 w-full flex-wrap">
        {["all", "drafts", "active", "ended"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 sm:px-5 sm:py-3 rounded-[60px] border-2 transition-colors duration-300 capitalize
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

      {/* List of events */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <InstructorDashboardEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

function InstructorDashboardEventCard({
  event,
}: {
  event: InstructorDashboardEvent;
}) {
  return (
    <div className="min-h-[380px] sm:min-h-[400px] border flex flex-col p-3 sm:p-4 gap-4 sm:gap-6 rounded-2xl">
      <div
        className={`rounded-lg border overflow-hidden relative after:content-[''] after:absolute after:inset-0 after:shadow-[inset_0_0px_8px_rgb(0,0,0,0.4)] ${
          event.finished && !event.draft ? "grayscale brightness-90" : ""
        }`}
      >
        <Image
          src={event.coverLink || "/MockEventImage.png"}
          width={400}
          height={300}
          alt={event.title}
          className="w-full h-auto"
        />
      </div>
      <h3
        className={`text-lg sm:text-xl font-medium text-center line-clamp-2 ${
          event.draft ? "text-primary" : "text-black"
        }`}
      >
        {event.title}
      </h3>
      {!event.draft && (
        <p className="text-xs sm:text-sm text-gray-600 text-center line-clamp-2">
          {event.finished
            ? `Ended on: ${new Date(event.endTime).toLocaleDateString()}`
            : event.started
            ? `Round: ${event.currentRound} / ${event.roundsCount}`
            : event.startTime
            ? `Starts on: ${new Date(
                event.startTime
              ).toLocaleDateString()} | ${new Date(
                event.startTime
              ).toLocaleTimeString()}`
            : "Not started"}
        </p>
      )}
      {event.draft ? (
        <>
          <h3 className="text-primary font-semibold text-center text-sm sm:text-base">(DRAFT)</h3>
          <Link
            href={`/instructor/events/${event.id}`}
            className="w-full mt-auto"
          >
            <Button variant="outline" className="w-full text-sm sm:text-base">
              <Settings className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              Continue Editing
            </Button>
          </Link>
        </>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-2 mt-auto">
          <Link href={`/instructor/events/${event.id}`} className="w-full">
            <Button variant="outline" className="w-full text-sm sm:text-base">
              <IoPodiumOutline className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              Results
            </Button>
          </Link>
          <Link
            href={`/instructor/events/${event.id}?tab=settings`}
            className="w-full"
          >
            <Button variant="outline" className="w-full text-sm sm:text-base">
              <Settings className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              Settings
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}