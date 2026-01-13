"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLoading } from "@/contexts/LoadingContext";
import { useUser } from "@/contexts/UserContext";
import { getEvents } from "@/actions/events";
import Pagination from "@/components/Pagination";
import {
    Search,
    Plus,
    Calendar,
    Clock,
    User,
    Play,
    CheckCircle,
    Edit,
    FileText,
} from "lucide-react";

export default function AdminEventsPage() {
    const [search, setSearch] = useState("");
    const [events, setEvents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const { showLoading, hideLoading } = useLoading();
    const { user } = useUser();

    const fetchEvents = async (page = 1, searchTerm = "") => {
        if (!user) return;
        showLoading();
        try {
            const result = await getEvents(false, page, searchTerm);
            setEvents(result.events);
            setTotalPages(result.totalPages);
            setTotal(result.total);
            setCurrentPage(result.currentPage);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            hideLoading();
        }
    };

    useEffect(() => {
        fetchEvents(1, "");
    }, [user]);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
    };

    const handleSearchSubmit = () => {
        setCurrentPage(1);
        fetchEvents(1, search);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchEvents(page, search);
    };

    const filteredEvents = events;

    const groupedEvents = {
        draft: filteredEvents.filter(e => e.draft),
        upcoming: filteredEvents.filter(e => !e.draft && !e.started),
        active: filteredEvents.filter(e => !e.draft && e.started && !e.finished),
        finished: filteredEvents.filter(e => !e.draft && e.finished)
    };

    const EventCard = ({ event }) => {
        const getStatusConfig = () => {
            if (event.draft) {
                return {
                    bgColor: "bg-gray-50 border-gray-200",
                    statusColor: "text-gray-600",
                    statusIcon: FileText,
                    statusText: "DRAFT",
                    statusBg: "bg-gray-100"
                };
            } else if (event.finished) {
                return {
                    bgColor: "bg-green-50 border-green-200",
                    statusColor: "text-green-700",
                    statusIcon: CheckCircle,
                    statusText: "COMPLETED",
                    statusBg: "bg-green-100"
                };
            } else if (event.started) {
                return {
                    bgColor: "bg-blue-50 border-blue-200",
                    statusColor: "text-blue-700",
                    statusIcon: Play,
                    statusText: "ACTIVE",
                    statusBg: "bg-blue-100"
                };
            } else {
                return {
                    bgColor: "bg-purple-50 border-purple-200",
                    statusColor: "text-purple-700",
                    statusIcon: Clock,
                    statusText: "UPCOMING",
                    statusBg: "bg-purple-100"
                };
            }
        };

        const config = getStatusConfig();
        const StatusIcon = config.statusIcon;

        return (
            <Card className={`${config.bgColor} shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
                <CardHeader className="bg-gradient-to-r from-white/50 to-transparent border-b border-pale-gray">
                    <CardTitle className="flex flex-col space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex flex-1 min-w-0 items-start gap-3">
                                {event.coverLink && (
                                    <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/60 bg-slate-100 shadow-sm">
                                        <Image
                                            src={event.coverLink}
                                            alt="Event cover"
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                            unoptimized
                                        />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-semibold text-darker-gray truncate">
                                        {event.title}
                                    </h3>
                                    <div className="mt-2 flex items-center gap-2 text-gray-600">
                                        <User size={16} />
                                        <span className="text-sm truncate">Instructor: {event.instructorEmail}</span>
                                    </div>
                                </div>
                            </div>
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.statusBg} ${config.statusColor} text-xs font-medium`}>
                                <StatusIcon size={14} />
                                {config.statusText}
                            </span>
                        </div>
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                        {event.finished && !event.draft && (
                            <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle size={16} />
                                <span className="text-sm">Ended on {new Date(event.endTime).toLocaleDateString()}</span>
                            </div>
                        )}

                        {!event.finished && event.started && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <Play size={16} />
                                    <span className="text-sm">
                                        Started {new Date(event.startTime).toLocaleDateString()}, ends {new Date(event.endTime).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-vivid-blue">
                                    <Calendar size={16} />
                                    <span className="text-sm font-medium">Round {event.currentRound} of {event.roundsCount}</span>
                                </div>
                            </div>
                        )}

                        {!event.started && (
                            <div className="flex items-center gap-2 text-purple-700">
                                <Clock size={16} />
                                <span className="text-sm">Starts on {new Date(event.startTime).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-pale-gray">
                        <Link href={`/admin/content/events/${event.id}`}>
                            <Button
                                variant={!event.started || event.draft ? "default" : "outline"}
                                className="h-10 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                            >
                                <Edit size={16} className="mr-2" />
                                Edit Event
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const EventSection = ({ title, events, icon: Icon, count }) => {
        if (events.length === 0) return null;

        return (
            <div className="mb-12">
                <div className="flex items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-vivid-blue/10 text-vivid-blue">
                            <Icon size={20} />
                        </div>
                        <h2 className="text-2xl font-semibold text-darker-gray">{title}</h2>
                        <span className="px-3 py-1 rounded-full bg-pale-blue text-vivid-blue text-sm font-medium">
                            {count}
                        </span>
                    </div>
                </div>
                <div className="grid gap-6">
                    {events.map((event, index) => (
                        <EventCard key={index} event={event} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-soft-white via-pale-blue/30 to-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-pale-gray shadow-lg p-6 mb-8">
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <Input
                                    type="text"
                                    placeholder="Search events by title, instructor..."
                                    value={search}
                                    onChange={handleSearch}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                                    className="pl-10 h-12 bg-white border-pale-gray focus:border-vivid-blue focus:ring-vivid-blue/20"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleSearchSubmit}
                                    variant="outline"
                                    className="h-12 px-6 rounded-xl font-medium border-pale-gray hover:border-vivid-blue hover:text-vivid-blue transition-all duration-200"
                                >
                                    <Search size={20} className="mr-2" />
                                    Search
                                </Button>
                                <Link href="/admin/content/events/new">
                                    <Button
                                        className="bg-vivid-blue hover:bg-deep-blue text-white h-12 px-6 rounded-xl font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
                                    >
                                        <Plus size={20} className="mr-2" />
                                        Create Event
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-pale-gray">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-vivid-blue">{total}</div>
                                <div className="text-sm text-gray-600">Total Events</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{groupedEvents.active.length}</div>
                                <div className="text-sm text-gray-600">Active</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{groupedEvents.upcoming.length}</div>
                                <div className="text-sm text-gray-600">Upcoming</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{groupedEvents.finished.length}</div>
                                <div className="text-sm text-gray-600">Completed</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <EventSection
                        title="Draft Events"
                        events={groupedEvents.draft}
                        icon={FileText}
                        count={groupedEvents.draft.length}
                    />

                    <EventSection
                        title="Active Events"
                        events={groupedEvents.active}
                        icon={Play}
                        count={groupedEvents.active.length}
                    />

                    <EventSection
                        title="Upcoming Events"
                        events={groupedEvents.upcoming}
                        icon={Clock}
                        count={groupedEvents.upcoming.length}
                    />

                    <EventSection
                        title="Completed Events"
                        events={groupedEvents.finished}
                        icon={CheckCircle}
                        count={groupedEvents.finished.length}
                    />
                </div>

                {filteredEvents.length === 0 && (
                    <div className="text-center py-12">
                        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                        <p className="text-gray-600 mb-6">Try adjusting your search criteria or create a new event.</p>
                    </div>
                )}

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
}