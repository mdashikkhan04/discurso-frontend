"use client";

import { useState, useEffect } from "react";
import EventResults from "@/components/EventResults";
import { fetcher } from "@/lib/fetcher";
import { useLoading } from "@/contexts/LoadingContext";
import { useUser } from "@/contexts/UserContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EventEditor from "@/components/EventEditor";
import { useSearchParams } from "next/navigation";

export default function EventPage({ params }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam ||  "results");
  const [eventData, setEventData] = useState(null);
  const [eventId, setEventId] = useState(null);
  const { showLoading, hideLoading } = useLoading();
  const { user } = useUser();

  useEffect(() => {
    const getEventId = async () => {
      const resolvedParams = await params;
      setEventId(resolvedParams.eventId);
    };

    getEventId();
  }, [params]);

  useEffect(() => {
    if (!user || !eventId) return;
    const getEvent = async () => {
      showLoading();
      try {
        const response = await fetcher.get(`/api/data/events/${eventId}`, user);
        if (response.ok) {
          setEventData(response.result.data);
          if (response?.result?.data?.draft && !tabParam) {
            setActiveTab("settings");
          }
        } else {
          console.error("Failed to fetch event:", response.error);
        }
      } catch (error) {
        console.error("Error during fetch:", error);
      }
      hideLoading();
    };

    getEvent();
  }, [eventId, user, tabParam]);
  if (!eventData) return null;

  return (
    <div>
      <header className="text-left mb-1 md:mb-4 ml-2 pt-2">
        <h1 className="text-3xl font-bold text-blue-600">
          {eventData.title}
          {eventData.draft ? <span className="text-gray-700 font-semibold"> (DRAFT)</span> : ""}
        </h1>
      </header>
      <div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)}>
          <TabsList className="mb-1 md:mb-2 ml-2">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            <EventResults event={eventData} />
          </TabsContent>

          <TabsContent value="settings">
            <EventEditor event={eventData} initInstructorId={eventData.instructorId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
