"use client";
import React, { useEffect, useState } from "react";
import EndedNegotiation from "./EndedNegotiation";
import { listPractices } from "@/actions/practice";

const EndedNegotiationsCarousel = () => {
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchEndedNegotiations = async () => {
      try {
        const data = await listPractices();
        const ended = data.filter((n) => n.completed);
        setNegotiations(ended);
      } catch (err) {
        console.error("Error fetching ended negotiations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEndedNegotiations();
  }, []);

  if (loading) return <div>Loading ended negotiations...</div>;
  if (!negotiations.length) return <div>No ended negotiations found.</div>;

  const itemsPerSlide = 4;
  const slides = Math.ceil(negotiations.length / itemsPerSlide);

  const visibleItems = negotiations.slice(
    activeIndex * itemsPerSlide,
    activeIndex * itemsPerSlide + itemsPerSlide
  );

  return (
    <div className="w-full h-full flex flex-col items-center justify-between gap-6 lg:max-w-[696px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
        {visibleItems.map((neg) => (
          <EndedNegotiation
            key={neg.negId}
            title={neg.title}
            negId={neg.negId}
          />
        ))}
      </div>
      {slides > 1 && (
        <div className="flex flex-row gap-6 items-center">
          <button
            onClick={() =>
              setActiveIndex((prev) =>
                prev === 0 ? slides - 1 : prev - 1
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
            {activeIndex + 1} / {slides}
          </span>
          <button
            onClick={() =>
              setActiveIndex((prev) =>
                prev === slides - 1 ? 0 : prev + 1
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

export default EndedNegotiationsCarousel;