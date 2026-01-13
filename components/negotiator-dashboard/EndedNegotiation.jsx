import React from "react";
import Link from "next/link";

const EndedNegotiation = ({ title, negId }) => {
  return (
    <div className="relative w-full h-[168px] bg-white border border-gray-200 rounded-[20px] p-8 flex flex-col justify-between">
      {/* Icon*/}
      <img
        src="/ai-stars-gray.png"
        alt="Stars"
        className="absolute top-4 left-4 w-6 h-6"
      />

      {/* Title */}
      <h3 className="text-[20px] font-medium text-black">{title}</h3>

      {/* Button */}
      <Link
        href={`/practice?negId=${negId}`}
        className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-[#A2A2A2] rounded-[60px]"
      >
        <img
          src="/negotiator-dashboard/chat-gray.png"
          alt="Chat"
          className="w-5 h-5"
        />
        <span className="text-[14px] font-bold text-[#A2A2A2]">
          View Results & Feedback
        </span>
      </Link>
    </div>
  );
};

export default EndedNegotiation;