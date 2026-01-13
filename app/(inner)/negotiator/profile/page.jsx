'use client';

import { useEffect, useState } from 'react';
import ProfileHeader from "@/components/profile/ProfileHeader";
import Stat from "@/components/profile/Stat";
import AchievementsSection from "@/components/profile/AchievementsSection";
import { getProfileData, getProfileStats, getUserAchievements } from "@/actions/profile";
import SpiderWebGraph from "@/components/profile/SpiderWebChart";
import PercentileBox from "@/components/profile/PercentileBox";
import Leaderboard from "@/components/profile/Leaderboard";
import CommunityFeed from '@/components/profile/CommunityFeed';
import { useUser } from "@/contexts/UserContext";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    async function fetchData() {
      if (!user?.uid) return;
      const profileData = await getProfileData();
      const statsData = await getProfileStats();
      const achievementsData = await getUserAchievements();

      setProfile(profileData);
      setStats(statsData);
      setAchievements(achievementsData);
    }

    fetchData();
  }, [user?.uid]);

  if (!profile || !stats) return <div>Loading...</div>;

  return (
    <div className="relative w-full bg-white ">
      <div className="absolute top-0 left-0 w-full h-[700px] bg-gradient-to-b from-[#0A77FF] to-[#004499] z-0" />
      <div className="flex justify-center px-4">
        <div className="bg-white border border-[#F2F4F7] flex flex-col p-4 w-full rounded-[32px] max-w-[1280px] mt-8 z-10 relative">
          {/* Streak */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 text-center font-medium text-[16px] rounded-b-[24px] py-1 px-6 shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
            style={{
              background: "linear-gradient(90deg, #0A77FF, #004499)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {profile.streak} day streak
          </div>

          {/* Profile Header */}
          <ProfileHeader
            nickname={profile.nickname}
            profile_id={profile.profile_id}
            level={profile.level}
            negotiation_points={profile.points}
            avatarUrl={profile.avatarUrl}
            date_of_joining={profile.date_of_joining}
            friends_count={profile.friends_count}
            proficiency={profile.proficiency}
          />

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-4 sm:px-8 mt-12">
            <Stat
              icon={<img src="/profile/negotiations_done.svg" alt="Negotiations done" className="w-8 h-8" />}
              value={stats.negotiationsDone}
              label="Negotiations done"
            />
            <Stat
              icon={<img src="/profile/placement.svg" alt="Placement" className="w-8 h-8" />}
              value={`Top ${stats.topScore}%`}
              label="In average placement"
            />
            <Stat
              icon={<img src="/profile/competency.svg" alt="Competency" className="w-8 h-8" />}
              value={stats.competency}
              label="Best competency"
            />
            <Stat
              icon={<img src="/profile/modules.svg" alt="Modules" className="w-8 h-8" />}
              value={stats.modulesDone}
              label="Modules Completed"
            />
          </div>

          {/* Separator */}
          <div className="w-full px-4 sm:px-8 mt-12">
            <hr className="w-full border-t-2 border-[#F2F4F7]" />
          </div>

          {/* Competency Assessment */}
          <div className="flex flex-col w-full mt-12 px-4">
            <h2 className="text-[28px] sm:text-[40px] font-regular text-gray-900 mb-8">Competency Assessment:</h2>
            <SpiderWebGraph userId={user?.uid} />

            <div className="flex flex-col gap-8 w-full px-0 sm:px-8 mt-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <PercentileBox value={profile.percentile_substantive} label="Percentile substantive" />
                <PercentileBox value={profile.percentile_relational} label="Percentile relational" />
              </div>
              <div className="w-full">
                <PercentileBox value={profile.proficiency} label="Overall proficiency" />
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="w-full px-4 sm:px-8 mt-12">
            <hr className="w-full border-t-2 border-[#F2F4F7]" />
          </div>

          {/* Achievements */}
          <section id="achievements" className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full mt-12 px-4 sm:px-8 gap-4">
            <h2 className="text-[28px] sm:text-[40px] font-regular text-gray-900">Achievements:</h2>
            <span
              className="text-[24px] sm:text-[33px] font-semibold sm:px-8"
              style={{
                background: 'linear-gradient(90deg, #0A77FF, #004499)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {achievements.filter(a => !a.locked).length}/{achievements.length}
            </span>
          </section>
          <AchievementsSection achievements={achievements} />

          {/* Leaderboards */}
          <div className="flex justify-start items-center w-full mt-12 px-4 sm:px-8">
            <h2 className="text-[28px] sm:text-[40px] font-regular text-gray-900">
              Leaderboard
            </h2>
          </div>

          <div className="flex justify-center w-full px-4 sm:px-8 mt-12">
            <Leaderboard currentUser={profile} icon="/profile/globe.svg" title="GLOBAL" />
            {/* <Leaderboard currentUser={profile} icon="/profile/friends_black.svg" title="FRIENDS" /> */}
          </div>

          {/* Separator */}
          {/* <div className="w-full px-4 sm:px-8 mt-12">
            <hr className="w-full border-t-2 border-[#F2F4F7]" />
          </div> */}
          {/* Community */}
          {/* <div className="flex justify-between items-center w-full mt-12 px-4 sm:px-8">
            <h2 className="text-[28px] sm:text-[40px] font-regular text-gray-900">Community:</h2>
          </div>
          <div className="mt-8">
            <CommunityFeed />
          </div> */}
        </div>
      </div>
    </div>
  );
}
