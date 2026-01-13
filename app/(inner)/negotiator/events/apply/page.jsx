"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/contexts/UserContext";
import { fetcher } from "@/lib/fetcher";
import { useLoading } from "@/contexts/LoadingContext";
import { useRouter } from "next/navigation";
import { showSuccessToast, showErrorToast } from "@/components/toast";

export default function EventApplyPage() {
  const [formData, setFormData] = useState({
    eventId: "",
    reason: "",
  });
  const [events, setEvents] = useState([]);
  const { user } = useUser();
  const { showLoading, hideLoading } = useLoading();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const fetchEvents = async () => {
      showLoading();
      try {
        const eventsRes = await fetcher.get(
          `/api/data/events?available=true&participant=${user.uid}`,
          user
        );
        if (eventsRes.ok) {
          setEvents(eventsRes.result.data);
        } else {
          console.error("Failed to fetch evetns ");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        hideLoading();
      }
    };

    fetchEvents();
  }, [user]);

  const handleReasonChange = (e) => {
    setFormData({ ...formData, reason: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showLoading();
    try {
      const response = await fetcher.post("/api/data/events/apply", formData, user);
      if (response.ok) {
        showSuccessToast("Application submitted");
        router.replace("/negotiator");
      } else {
        showErrorToast("Failed to submit application.");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      showErrorToast("An error occurred. Please try again.");
    }
    hideLoading();
    // console.log("Application Submitted:", formData);
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Apply to Join an Event</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-10"
      >
        <div className="col-span-full">
          <label htmlFor="eventId" className="font-medium text-gray-700">
            Select Event:
          </label>
          <Select
            onValueChange={(value) =>
              setFormData({ ...formData, eventId: value })
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Choose an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-full">
          <label htmlFor="reason" className="font-medium text-gray-700">
            Why do you want to join this event?
          </label>
          <Textarea
            id="reason"
            placeholder="Enter your reason for joining"
            value={formData.reason}
            onChange={handleReasonChange}
            rows={5}
            className="mt-2 w-full"
          />
        </div>

        <div className="col-span-full flex justify-center mt-8">
          <Button type="submit" variant="default" className="px-6 py-3 text-lg">
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  );
}
