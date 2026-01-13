'use client';
import { useState, useEffect } from "react";
import Achievement from "./Achievement";
import { getUserAchievements } from "@/actions/profile";

export default function AchievementsSection({ userId }) {
  const [achievements, setAchievements] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false);
  const [filteredAchievements, setFilteredAchievements] = useState([]);

  useEffect(() => {
    async function fetchAchievements() {
      const data = await getUserAchievements(userId);
      setAchievements(data);
    }
    fetchAchievements();
  }, [userId]);

  useEffect(() => {
    setIsExpanded(false);

    const filtered = achievements.filter((ach) => {
      if (filter === "all") return true;
      if (filter === "locked") return ach.locked;
      if (filter === "unlocked") return !ach.locked;
    });

    setFilteredAchievements(filtered);
  }, [filter, achievements]);

  const itemsPerRow = 4;
  const visibleCount = isExpanded ? filteredAchievements.length : itemsPerRow * 2;

  return (
    <div className="flex flex-col gap-6 sm:gap-9 w-full mt-8 sm:mt-12 px-4 sm:px-8">
      {/* Filters */}
      <div className="flex gap-4 sm:gap-6 w-full flex-wrap">
        {["all", "locked", "unlocked"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 sm:px-5 sm:py-3  sm:w-[112px] rounded-[60px] border-2 transition-colors duration-300 capitalize
                ${filter === f
                  ? "bg-[#F5F6F6] text-black "
                  : "border-[#F5F6F6] text-black hover:bg-[#F5F6F6]"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Achievement list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {filteredAchievements.slice(0, visibleCount).map((ach, index) => (
          <Achievement
            key={index}
            icon={<img src={ach.icon} alt={ach.title} className="w-10 h-10 sm:w-12 sm:h-12" />}
            lockedIcon={<img src={ach.lockedIcon} alt="Locked" className="w-10 h-10 sm:w-12 sm:h-12 opacity-50" />}
            title={ach.title}
            description={ach.description}
            points={ach.points}
            locked={ach.locked}
            progress={ach.progress}
            alwaysHoverable={true}
          />
        ))}
      </div>

      {/* Load More / Show Less */}
      {filteredAchievements.length > itemsPerRow * 2 && (
        <div className="flex items-center justify-center gap-2 sm:gap-4 w-full mt-4 sm:mt-6">
          <div className="border-t border-[#F2F4F7] flex-grow" />
          <button
            className="text-[16px] sm:text-[20px] font-regular text-[#98A2B3] underline hover:no-underline transition-colors duration-300"
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
