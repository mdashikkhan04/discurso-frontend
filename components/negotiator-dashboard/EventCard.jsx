"use client";

import React from "react";
import { useRouter } from "next/navigation";

const EventCard = ({ 
  image, 
  title, 
  status, 
  endingDate, 
  timeLeft, 
  eventId, 
  roundId,
  onContinueClick
}) => {
  const router = useRouter();
  const isEnded = status === "Ended";

  return (
    <div className="flex flex-col gap-6 p-4 rounded-[20px] bg-white shadow">
      <img
        src={image}
        alt={title}
        className="w-full h-[220px] object-cover rounded-[12px]"
      />
      <div className="flex flex-col gap-4 flex-1 justify-between">
        <div>
          <h3 className="text-[24px] font-medium text-black">{title}</h3>
          <span className="text-[16px] font-normal text-gray-500">{status}</span>
        </div>

        {!isEnded && (
          <div className="flex justify-between items-center">
            <span className="text-[16px] font-normal text-gray-500">
              Ends: {endingDate}
            </span>
            <div className="flex items-center gap-1">
              <img
                src="/negotiator-dashboard/clock.png"
                alt="Clock"
                className="w-4 h-4"
              />
              <span className="text-[14px] font-normal text-gray-500">
                {timeLeft}
              </span>
            </div>
          </div>
        )}
        {!isEnded && (
          <button
            className="w-full flex items-center justify-center gap-[10px] bg-[#0973F7] text-white font-bold text-[14px] py-[12px] px-[20px] rounded-full hover:bg-[#0A66DD] transition-all"
            onClick={onContinueClick}
          >
            <img src="/negotiator-dashboard/play.png" alt="Continue" className="w-4 h-4" />
            Continue
          </button>
        )}
        {isEnded && (
          <div className="flex flex-row w-full gap-[10px]">
            <button
              className="flex-1 flex items-center justify-center gap-[10px] bg-[#F5F6F6] text-black font-bold text-[14px] py-[12px] px-[20px] rounded-full hover:bg-[#E8E9EA] transition-all"
              onClick={() =>
                router.push(`/negotiator/events/${eventId}/${roundId}/feedback`)
              }
            >
              <img
                src="/negotiator-dashboard/results.png"
                alt="Results"
                className="w-4 h-4"
              />
              Results
            </button>

            <button
              className="flex-1 flex items-center justify-center gap-[10px] bg-[#F5F6F6] text-black font-bold text-[14px] py-[12px] px-[20px] rounded-full hover:bg-[#E8E9EA] transition-all"
              onClick={() => router.push(`/negotiator/events/${eventId}/${roundId}`)}
            >
              <img
                src="/negotiator-dashboard/history.png"
                alt="History"
                className="w-4 h-4"
              />
              History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;