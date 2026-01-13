"use client";
import React, { useEffect, useState } from "react";
import Achievement from "./Achievement";
import { getUserAchievements } from "@/actions/profile";
import Link from "next/link";

const AchievementsSection = () => {
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    async function fetchAchievements() {
      const data = await getUserAchievements();
      setAchievements(data);
    }
    fetchAchievements();
  }, []);

  const unlocked = achievements.filter((a) => !a.locked);
  const locked = achievements.filter((a) => a.locked);

  const selectedAchievements = [
    ...unlocked.slice(0, 2),
    ...locked.slice(0, 1),
  ];

  return (
    <div className="w-full lg:max-w-[346px] bg-white border border-gray-200 rounded-[20px] flex flex-col">
      <div className="flex justify-between bg-[#EFEFEF] items-center px-4 py-2 rounded-t-[20px]">
        <span className="text-[18px] font-medium text-gray-900">Achievements</span>
        <span
          className="text-[16px] font-bold"
          style={{
            background: 'linear-gradient(90deg, #0A77FF, #004499)',
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {unlocked.length}/{achievements.length}
        </span>
      </div>
      <div className="flex flex-col gap-3 px-4 py-2">
        {selectedAchievements.map((ach, idx) => (
          <Achievement
            key={idx}
            icon={ach.icon}
            lockedIcon={ach.lockedIcon}
            title={ach.title}
            description={ach.description}
            locked={ach.locked}
          />
        ))}
      </div>
      <Link href="/negotiator/profile#achievements">
        <button className="w-full bg-[#0A77FF] text-white font-bold text-[14px] py-2 rounded-b-[20px] hover:bg-[#004499] transition-colors duration-300">
          View all
        </button>
      </Link>
    </div>
  );
};

export default AchievementsSection;
