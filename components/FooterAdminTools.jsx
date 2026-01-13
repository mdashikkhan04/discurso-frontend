"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function FooterAdminTools() {
  const [minimised, setMinimised] = useState(false);

  const [buildTimestamp, setBuildTimestamp] = useState(null);
  const [shouldShowFooter, setShouldShowFooter] = useState(false);
  const { role } = useUser();

  useEffect(() => {
    updateShouldShowFooter();
  }, [role]);

  useEffect(() => {
    if (!shouldShowFooter) return;
    async function fetchBuildTimestamp() {
      try {
        const res = await fetch("/build-timestamp.json");
        if (!res.ok) throw new Error("Failed to fetch build timestamp");
        const rawTimestamp = await res.json();
        const buildTimestamp = new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date(rawTimestamp.buildTime));
        setBuildTimestamp(buildTimestamp);
      } catch (error) {
        setBuildTimestamp("Failed timestamp");
        console.warn(error);
      }
    }

    fetchBuildTimestamp();
  }, [shouldShowFooter]);

  const updateShouldShowFooter = () => {
    setShouldShowFooter(role === "admin");
  };

  if (!shouldShowFooter) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 z-50 right-4 bg-red-500/40 text-white text-xs rounded-lg shadow-lg flex flex-col space-y-2 ${minimised ? "p-1" : "p-3"}`}
      style={{ backdropFilter: "blur(5px)" }}
    >
      <div className="flex items-center justify-between">
        {!minimised && (
          <span className="font-semibold centered mr-2">ADMIN TOOLS:</span>
        )}
        <Button
          variant="outline"
          className="text-xs text-white bg-transparent font-bold py-1 px-1 h-5 min-h-0 leading-none"
          onClick={() => setMinimised((prev) => !prev)}
        >
          {minimised ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </Button>
      </div>
      {!minimised && (
        <>
          <div className="font-bold">{buildTimestamp}</div>
          <div className="flex flex-col space-y-1">
            <Link href="/negotiator" className="underline hover:text-gray-200">
              Negotiator Dashboard
            </Link>
            <Link href="/instructor" className="underline hover:text-gray-200">
              Instructor Dashboard
            </Link>
            <Link href="/admin" className="underline hover:text-gray-200">
              Admin Dashboard
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
