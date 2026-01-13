/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable max-lines-per-function */
"use client";

import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { getEvents } from "@/actions/events";
import InstructorDashboardEventSection from "@/components/Instructor/EventSection";
import Feed from "@/components/Instructor/Feed";
import InstructorHeroSection from "@/components/Instructor/Hero";
import { Button } from "@/components/ui/button";
import { useLoading } from "@/contexts/LoadingContext";
import { useUser } from "@/contexts/UserContext";

import { InstructorDashboardEvent } from "@/types/interfaces";

export default function InstructorDashboardPage() {
  const [events, setEvents] = useState<InstructorDashboardEvent[]>([]);
  const { showLoading, hideLoading } = useLoading();
  const hasFetchedData = useRef(false);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    const fetchDashboardData = async () => {
      showLoading();
      try {
        const result = await getEvents(false, 1, "");
        const eventsArray = result?.events || [];
        setEvents(Array.isArray(eventsArray) ? eventsArray as unknown as InstructorDashboardEvent[] : []);
      } catch (error) {
        console.error("Failed to fetch events via server action:", error);
        setEvents([]);
      } finally {
        hideLoading();
      }
    };

    if (!hasFetchedData.current) {
      fetchDashboardData();
      hasFetchedData.current = true;
    }
  }, [showLoading, hideLoading, user]);

  if (!user) return null;

  return (
    <div className="relative w-full bg-white min-h-screen">
      <div className="absolute top-0 left-0 w-full h-[700px] bg-gradient-to-b from-[#0A77FF] to-[#004499] z-0" />
      <div className="relative z-10 flex justify-center px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#F2F4F7] rounded-[32px] w-full max-w-[1280px] p-6 sm:p-8 mt-8">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch justify-between">
            <InstructorHeroSection user={user} />
            <Feed events={events} />
          </div>

          {/* AI message is displayed inside the Instructor hero; no external banner here */}

          <div className="w-full mt-12">
            <hr className="w-full border-t-2 border-[#F2F4F7]" />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full mt-8 mb-6">
            <h2 className="text-[28px] sm:text-[40px] font-normal text-gray-900">
              Events
            </h2>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto flex-shrink-0 items-stretch sm:items-center gap-3 sm:gap-4">
              <Button
                title="Select negotiation case for this round"
                variant="outline"
                className="flex items-center justify-center gap-2 rounded-full border-2"
              >
                <Search strokeWidth={2} className="p-0" />
                <span className="font-medium text-md">Search</span>
              </Button>
              <Link
                href="/instructor/new-event"
                className="flex items-center justify-center text-center"
              >
                <Button
                  variant="default"
                  className="flex items-center justify-center gap-2 rounded-full bg-primary w-full sm:w-auto"
                >
                  <Plus className="w-6 h-6" />
                  <span className="font-medium text-md">New event</span>
                </Button>
              </Link>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-gray-500">No events found. Create one!</p>
            </div>
          ) : (
            <InstructorDashboardEventSection events={events} />
          )}
        </div>
      </div>
    </div>
  );
}