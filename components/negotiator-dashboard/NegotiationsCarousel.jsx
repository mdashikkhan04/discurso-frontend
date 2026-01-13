"use client";
import React, { useEffect, useState } from "react";
import ActiveNegotiation from "./ActiveNegotiation";
import { listPractices } from "@/actions/practice";

const NegotiationsCarousel = () => {
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchNegotiations = async () => {
      try {
        const data = await listPractices();

        const activeOnes = data
          .filter((item) => !item.completed)
          .map((item) => ({
            title: item.title || item.case?.title || "Untitled Case",
            description:
              item.summary ||
              item.case?.summary ||
              "No description available.",
            negId: item.negId,
            href: `/practice?negId=${item.negId}`,
          }));

        setNegotiations(activeOnes);
      } catch (err) {
        console.error("Error fetching negotiations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNegotiations();
  }, []);

  if (loading) return <div>Loading negotiations...</div>;
  if (!negotiations.length) return <div>No active negotiations found.</div>;

  const activeNegotiation = negotiations[activeIndex];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full lg:max-w-[496px]">
        <ActiveNegotiation
          title={activeNegotiation.title}
          description={activeNegotiation.description}
          href={activeNegotiation.href}
        />
      </div>

      {/* Pagination */}
      {negotiations.length > 1 && (
      <div className="flex flex-row gap-6 items-center">
        <button
          onClick={() =>
            setActiveIndex((prev) =>
              prev === 0 ? negotiations.length - 1 : prev - 1
            )
          }
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition"
        >
          <img
            src="/negotiator-dashboard/arrow.svg"
            alt="Previous"
            className="w-5 h-5 rotate-180"
          />
        </button>
        <span className="text-sm text-gray-500 font-bold">
          {activeIndex + 1} / {negotiations.length}
        </span>
        <button
          onClick={() =>
            setActiveIndex((prev) =>
              prev === negotiations.length - 1 ? 0 : prev + 1
            )
          }
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition"
        >
          <img
            src="/negotiator-dashboard/arrow.svg"
            alt="Next"
            className="w-5 h-5"
          />
        </button>
      </div>
)}
    </div>
  );
};

export default NegotiationsCarousel;
