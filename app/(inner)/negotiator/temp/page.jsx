"use client";

import { fetcher } from "@/lib/fetcher";
import { useLoading } from "@/contexts/LoadingContext";
import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import AchievementsSection from "@/components/negotiator-dashboard/AchievementsSection";
import AITrainer from "@/components/negotiator-dashboard/AI-Trainer";
import { getProfileData } from "@/actions/profile";
import LearningJourneySection from "@/components/negotiator-dashboard/LearningJourneySection";
import EndedNegotiationCarousel from "@/components/negotiator-dashboard/EndedNegotiationCarousel";
import EventsList from "@/components/negotiator-dashboard/EventsList";
import Link from "next/link";
import NegotiationsCarousel from "@/components/negotiator-dashboard/NegotiationsCarousel";
import YouTubeOverlay from "@/components/negotiator-dashboard/YoutubeOverlay";

export default function NegotiatorDashboardPage() {
  const [events, setEvents] = useState(null);
  const [profile, setProfile] = useState(null);
  const { user } = useUser();
  const { showLoading, hideLoading } = useLoading();

  const [isIntroOverlayOpen, setIntroOverlayOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      showLoading();
      try {
        const [eventsRes] = await Promise.all([
          fetcher.get(`/api/data/events?participant=${user.uid}`, user),
        ]);

        if (eventsRes.ok) {
          setEvents(eventsRes.result.data);
        } else {
          console.error("Failed to fetch events");
        }

        const profileData = await getProfileData();
        setProfile(profileData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        hideLoading();
      }
    };
    fetchData();
  }, [user]);

  const handleCloseIntroOverlay = () => {
    setIntroOverlayOpen(false);
  };

  if (!events || !profile) return null;

  return (
    <div className="relative w-full bg-white min-h-screen">
      <div className="absolute top-0 left-0 w-full h-[700px] bg-gradient-to-b from-[#0A77FF] to-[#004499] z-0" />
      <div className="relative z-10 flex justify-center px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#F2F4F7] rounded-[32px] w-full max-w-[1280px] p-6 sm:p-8 mt-8">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch justify-between">
            <AITrainer nickname={profile.nickname} />
            <AchievementsSection />
          </div>

          <div className="w-full mt-12">
            <hr className="w-full border-t-2 border-[#F2F4F7]" />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full mt-8 mb-6">
            <h2 className="text-[28px] sm:text-[40px] font-normal text-gray-900">
              Learning Journey:
            </h2>
            <Link href="/journey">
              <button className="bg-[#0A77FF] text-white hover:bg-blue-600 px-5 py-3 rounded-full text-[14px] font-bold flex items-center gap-2">
                <img src="/negotiator-dashboard/eye.png" alt="See all cases" />
                See all stages
              </button>
            </Link>
          </div>
          <LearningJourneySection nickname={profile.nickname} />

          <div className="w-full mt-12">
            <hr className="w-full border-t-2 border-[#F2F4F7]" />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full mt-12 mb-6">
            <h2 className="text-[28px] sm:text-[40px] font-normal text-gray-900">
              AI Negotiations:
            </h2>
            <Link href="/negotiator/practice">
              <button className="bg-[#FAE4FF] border border-[#CB6DE1] text-[#CB6DE1] hover:bg-[#E0C1FF] px-5 py-3 rounded-full text-[14px] font-bold flex items-center gap-2">
                <img src="/ai-stars-purple.png" alt="Start an AI Negotiation" className="w-4 h-4"/>
                Start an AI Negotiation
              </button>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 w-full mt-8 mb-6">
            <NegotiationsCarousel />
            <EndedNegotiationCarousel events={events} />
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full mt-12 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-[28px] sm:text-[40px] font-normal text-gray-900">
                Events:
              </h2>
              <div
                className="inline-flex items-center justify-center w-5 h-5 bg-gray-500 rounded-full cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => setIntroOverlayOpen(true)} 
              >
                <span className="text-white text-xs font-bold">i</span>
              </div>
            </div>

            <a
              href="https://thenegotiationchallenge.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="bg-[#0A77FF] text-white hover:bg-blue-600 px-5 py-3 rounded-full text-[14px] font-bold flex items-center gap-2">
                <img src="/negotiator-dashboard/plus.png" alt="Apply for TNC" />
                Apply for TNC
              </button>
            </a>
          </div>

          <div className="mt-12">
            <EventsList />
          </div>
        </div>
      </div>
      <YouTubeOverlay
        isOpen={isIntroOverlayOpen}
        youtubeId={"H0Wpsfi2T4Q"}
        onClose={handleCloseIntroOverlay}
        showDoNotShowAgainButton={false}
      />
    </div>
  );
}