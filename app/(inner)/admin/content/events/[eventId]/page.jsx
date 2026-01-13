"use client";

import { useState, useEffect } from "react";
import { fetcher } from "@/lib/fetcher";
import { useLoading } from "@/contexts/LoadingContext";
import { useUser } from "@/contexts/UserContext";
import EventEditor from "@/components/EventEditor";

export default function EditEventPage({ params }) {
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
        } else {
          console.error("Failed to fetch event:", response.error);
        }
      } catch (error) {
        console.error("Error during fetch:", error);
      }
      hideLoading();
    };

    getEvent();
  }, [eventId, user]);

  if (!eventData) return null;

  return (
    <div>
      <EventEditor event={eventData} />
    </div>
  );
}
