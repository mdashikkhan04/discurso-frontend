import React from "react";

const ActiveNegotiation = ({ title, description, href = "#" }) => {
  return (
    <div className="relative w-full lg:w-[496px] h-[360px] rounded-[20px] bg-[#FAE4FF] flex flex-col p-10 justify-between">
      {/* Icon */}
      <img
        src="/ai-stars-purple.png"
        alt="Stars"
        className="absolute top-2 left-2 w-10 h-10"
      />

      {/* Title */}
      <h3 className="text-[24px] font-medium text-black">{title}</h3>

      {/* Description */}
      <p className="text-[16px] font-normal text-gray-500">{description}</p>

      {/* Button */}
      <a
        href={href}
        className="flex items-center justify-center gap-2 px-5 py-3 bg-white rounded-[60px] shadow hover:shadow-md"
      >
        <img
          src="/negotiator-dashboard/chat-purple.png"
          alt="Chat"
          className="w-5 h-5"
        />
        <span className="text-[#CB6DE1] text-[14px] font-bold">
          Jump back in
        </span>
      </a>
    </div>
  );
};

export default ActiveNegotiation;