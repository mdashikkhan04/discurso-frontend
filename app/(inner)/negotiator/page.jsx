"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { fetcher } from "@/lib/fetcher";
import { useLoading } from "@/contexts/LoadingContext";
import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { getResourceFileDownloadURL } from "@/lib/client/storage";

export default function NegotiatorDashboardPage() {
  const [events, setEvents] = useState(null);
  const [resources, setResources] = useState(null);
  const { user } = useUser();
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      showLoading();
      try {
        // const [eventsRes, resourcesRes] = await Promise.all([
        const [eventsRes] = await Promise.all([
          fetcher.get(`/api/data/events?participant=${user.uid}`, user),
          // fetcher.get(`/api/data/events?participant=vpuSEEG88iWczTy98QnCDexnEbJ3`, user),//TODO remove hardcoded user ID
          // fetcher.get(`/api/data/events?participant=k9maIzmESyZW8YcOEMi1slzfkGF2`, user),//TODO remove hardcoded user ID
          // fetcher.get("/api/data/resources", user),
        ]);

        if (eventsRes.ok) {
          // console.log("eventsRes", eventsRes.result.data);
          setEvents(eventsRes.result.data);
        } else {
          console.error("Failed to fetch events");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        hideLoading();
      }
    };
    fetchData();
  }, [user]);

  if (!events) return null;

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      {user?.displayName && (
        <section className="w-full max-w-5xl mx-auto mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Hi, {user.displayName}!</h1>
        </section>
      )}

      {/* AI message is displayed inside the AI Trainer hero; no external banner here */}

      <section className="w-full max-w-5xl mb-10">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Events:</h1>
        <div className="flex flex-wrap gap-6">
          {events.map((event) => (
            <Card
              key={event.id}
              className={`p-4 border-2 rounded-xl flex flex-col justify-between text-center w-full md:w-1/2 lg:w-1/3  ${event.finished ? "bg-gray-200 border-gray-500" : "border-blue-500"}`}
            >
              <h2 className={`text-lg font-bold mb-2 ${event.finished ? "text-gray-700" : "text-blue-600"}`}>
                {event.title}
              </h2>
              {event.started && !event.finished && event.roundsStarted ? (
                <p className="text-sm text-gray-700">
                  Round: {event.currentRound} / {event.roundsCount} <br />
                  {event.timeLeft != 0 ? event.timeLeft + " " + event.timeLeftUnits + " left" : ""}
                </p>
              ) : (
                <p className="text-sm text-gray-800">
                  {event.finished ? "Ended" : "Starts"} on{" "}
                  {new Date(event.startTime).toLocaleDateString()}
                </p>
              )}

              {(event.roundsStarted || event.viewTime <= Date.now()) && (
                // {!event.finished && (event.roundsStarted || event.viewTime <= Date.now()) && (
                <Link href={`/negotiator/events/${event.id}`}>
                  <Button variant={event.finished ? "outline" : "default"} className="mt-4">
                    {event.roundsStarted ? "Continue" : "View"}
                  </Button>
                </Link>
              )}
              {/* {!event.started && event.viewTime <= Date.now() && (
                <Link href={`/negotiator/events/${event.id}`}>
                  <Button variant="default" className="mt-4">
                    View
                  </Button>
                </Link>
              )} */}
            </Card>
          ))}

          {/* <Link
            href="/negotiator/events/apply"
            className="flex items-center justify-center text-center w-full md:w-1/2 lg:w-1/3"
          >
            <div className="border-2 border-blue-500 rounded-xl p-4 w-1/2 flex flex-col items-center text-blue-500">
              <Plus className="w-8 h-8 mb-2" />
              <span className="font-medium">Apply to Event</span>
            </div>
          </Link> */}
        </div>
      </section>

      <section className="w-full max-w-5xl mb-10">
        <Card className="bg-white border shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">AI Practice</h2>
          <p className="text-gray-700">
            Enhance your skills with AI-powered negotiation practice scenarios.
            Training with AI offers personalized learning, adapting to
            individual needs for optimized skill development. It provides
            real-time feedback, simulates scenarios, and tracks progress,
            helping individuals and teams improve more efficiently.
          </p>
          <Link href="/negotiator/practice">
            <Button variant="default" className="mt-4">
              Start Practicing
            </Button>
          </Link>
        </Card>
      </section>

    
    </div>
  );
}
