'use client';
import { useState } from "react";
import notifications from "./community.json";

export default function CommunityFeed() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const itemsPerRow = 3;

  // Sorting
  const sorted = [...notifications].sort((a, b) => b.time - a.time);
  const visibleNotifications = isExpanded ? sorted : sorted.slice(0, itemsPerRow);

  const toggleItem = (i) => {
    setExpandedItems((prev) => ({
      ...prev,
      [i]: !prev[i],
    }));
  };

  return (
    <div className="flex flex-col gap-4 px-4 sm:px-8 py-6 ">
      {/* Notifications */}
      <div className="flex flex-col gap-4 sm:gap-6">
        {visibleNotifications.map((n, i) => {
          const isItemExpanded = expandedItems[i];

          return (
            <div
              key={i}
              onClick={() => toggleItem(i)}
              className={`flex flex-row sm:items-center gap-2 sm:gap-3 rounded-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.25)] px-3 py-2 sm:py-3 bg-white relative min-h-[64px] 
                ${isItemExpanded ? "cursor-default" : "cursor-pointer sm:cursor-default"}`}
            >
              {/* Avatar */}
              <img
                src={n.profileImage}
                alt={n.username}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0 self-center"
              />

              {/* Content */}
              <div className="flex flex-col justify-center flex-1 min-w-0 pr-14">
                <div
                  className={`text-[14px] sm:text-[20px] text-[#101828] font-medium ${
                    isItemExpanded
                      ? "whitespace-normal break-words"
                      : "line-clamp-1 sm:line-clamp-none"
                  }`}
                >
                  <span className="font-semibold">{n.username}</span>{" "}
                  {n.chunks.map((chunk, j) =>
                    chunk.style === "emphasized" ? (
                      <span key={j} className="font-semibold text-[#0973F7]">
                        {chunk.text}
                      </span>
                    ) : (
                      <span key={j}>{chunk.text}</span>
                    )
                  )}
                </div>
              </div>

              {/* Date */}
              <span className="absolute bottom-1 sm:bottom-2 right-2 sm:right-3 text-[12px] sm:text-[14px] font-medium text-[#98A2B3] whitespace-nowrap pointer-events-none">
                {new Date(n.time * 1000).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Load More / Show Less */}
      {sorted.length > itemsPerRow && (
        <div className="flex items-center justify-center gap-2 sm:gap-4 w-full mt-4 sm:mt-6">
          <div className="border-t border-[#F2F4F7] flex-grow" />
          <button
            className="text-[14px] sm:text-[20px] font-regular text-[#98A2B3] underline hover:no-underline transition-colors duration-300"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show less" : "Load more"}
          </button>
          <div className="border-t border-[#F2F4F7] flex-grow" />
        </div>
      )}
    </div>
  );
}
