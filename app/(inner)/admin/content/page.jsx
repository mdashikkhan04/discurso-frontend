"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";
import { useLoading } from "@/contexts/LoadingContext"; // Import useLoading
import { useUser } from "@/contexts/UserContext";

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState("events"); // Default to 'cases'
  const [search, setSearch] = useState("");
  const [cases, setCases] = useState([]);
  const [events, setEvents] = useState([]);
  const [resources, setResources] = useState([]);
  const [submisions, setSubmisions] = useState([]);
  const { showLoading, hideLoading } = useLoading();
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      showLoading();
      try {
        const [casesRes, resourcesRes, eventsRes] = await Promise.all([
          fetcher.get("/api/data/cases", user),
          fetcher.get("/api/data/resources", user),
          fetcher.get("/api/data/events", user),
        ]);

        if (casesRes.ok) {
          setCases(casesRes.result.data);
        } else {
          console.error("Failed to fetch cases");
        }

        if (resourcesRes.ok) {
          const allResources = resourcesRes.result.data;
          const approvedResources = allResources.filter(
            (resource) => resource.approved
          );
          const unapprovedResources = allResources.filter(
            (resource) => !resource.approved
          );
          setResources(approvedResources);
          setSubmisions(unapprovedResources);
        } else {
          console.error("Failed to fetch resources");
        }

        if (eventsRes.ok) {
          // console.log("events:", eventsRes.result.data);
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

  const handleSearch = (e) => {
    setSearch(e.target.value.toLowerCase());
  };

  const filterData = (data) => {
    const searchTerm = search.trim().toLowerCase(); // Trim the search term

    if (!searchTerm) {
      return data; // Return the full data if search term is falsy (empty after trimming)
    }

    return data.filter((item) => {
      // Check if any text property contains the search term
      const matchesTextFields = Object.values(item).some(
        (value) =>
          typeof value === "string" && value.toLowerCase().includes(searchTerm)
      );

      // Check if search term is 'ai' and item.ai is true
      const matchesAi = searchTerm.includes("ai") ? item.ai !== "n" : true;

      return matchesTextFields && matchesAi;
    });
  };

  const filteredCases = filterData(cases);
  const filteredResouces = filterData(resources);
  const filteredSubmisions = filterData(submisions);
  const filteredEvents = filterData(events);

  return (
    <div className="flex flex-col min-h-screen p-6 ">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Management</h1>
        <p className="text-gray-700">
          Manage all platform content, including events, cases, AI cases,
          resources, and submissions.
        </p>
        <Input
          type="text"
          placeholder="Search across all content..."
          value={search}
          onChange={handleSearch}
          className="mt-4 w-full max-w-lg"
        />
      </header>

      <Tabs
        defaultValue={activeTab}
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="mb-6">
          {/* Disable other tabs */}
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events">
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Events</h2>
              <Link href={`/admin/content/events/new`}>
                <Button variant="default">Add New Event</Button>
              </Link>
            </div>
            {filteredEvents.map((e, index) => (
              <Card
                key={index}
                className={` ${e.finished && !e.draft ? "bg-gray-200" : e.started && !e.draft ? "bg-blue-50" : "bg-white"
                  } border shadow-lg rounded-lg`}
              >
                <CardHeader>
                  <CardTitle>
                    <span
                      className={`text-md mt-2 ${e.finished && !e.draft
                          ? "text-gray-500"
                          : e.started
                            ? "text-blue-900"
                            : "text-black"
                        }`}
                    >
                      {e.title}{e.draft ? (<span className="text-gray-600"> (DRAFT)</span>):""}
                    </span>

                    <br />
                    <span className="text-base text-gray-600 mt-2">
                      Instructor: {e.instructorEmail}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {e.finished && !e.draft && (
                    <p>Ended on {new Date(e.endTime).toLocaleDateString()}</p>
                  )}
                  {!e.finished && e.started && (
                    <div>
                      <p>
                        Started on {new Date(e.startTime).toLocaleDateString()},
                        ends on {new Date(e.endTime).toLocaleDateString()}
                      </p>
                      <p>
                        Round {e.currentRound} / {e.roundsCount}
                      </p>
                    </div>
                  )}
                  {!e.started && (
                    <p>
                      Starts on {new Date(e.startTime).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex space-x-4">
                    <Link href={`/admin/content/events/${e.id}`}>
                      <Button variant={!e.started || e.draft ? "default" : "secondary"}>Edit</Button>
                    </Link>
                    {/* <Button variant="destructive">Delete</Button> */}
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </TabsContent>

        {/* Cases Tab */}
        <TabsContent value="cases">
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Cases</h2>
              <Link href={`/admin/content/cases/new`}>
                <Button variant="default">Add New Case</Button>
              </Link>
            </div>
            {filteredCases.map((c, index) => (
              <Card
                key={index}
                className="bg-white border shadow-lg rounded-lg"
              >
                <CardHeader>
                  <CardTitle>
                    {c.title}
                    {c.ai !== "n" && (
                      <span className="text-base text-blue-900 ml-4">
                        [available to AI]
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{c.summary}</p>
                  <div className="flex space-x-4">
                    <Link href={`/admin/content/cases/${c.id}`}>
                      <Button variant="secondary">Edit</Button>
                    </Link>
                    {/* <Button variant="destructive">Delete</Button> */}
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources">
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Resources</h2>
              <Link href={`/admin/content/resources/new`}>
                <Button variant="default">Add New Resource</Button>
              </Link>
            </div>
            {filteredResouces.map((r, index) => (
              <Card
                key={index}
                className="bg-white border shadow-lg rounded-lg"
              >
                <CardHeader>
                  <CardTitle>
                    <div className="space-y-2">
                      <span>{r.title}</span>
                      <br />
                      <span className="text-base text-gray-600">
                        {r.author}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{r.desc}</p>
                  <div className="flex space-x-4">
                    <Link href={`/admin/content/resources/${r.id}`}>
                      <Button variant="secondary">Edit</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Submissions</h2>
            </div>
            {filteredSubmisions.map((s, index) => (
              <Card
                key={index}
                className="bg-white border shadow-lg rounded-lg"
              >
                <CardHeader>
                  <CardTitle>
                    <div className="space-y-2">
                      <span>{s.title}</span>
                      <br />
                      <span className="text-base text-gray-600">
                        {s.author}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{s.desc}</p>
                  <div className="flex space-x-4">
                    <Link href={`/admin/content/resources/${s.id}`}>
                      <Button variant="secondary">Edit</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
