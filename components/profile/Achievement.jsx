'use client';
import { useState, useRef, useEffect } from "react";

export default function Achievement({
  icon,
  lockedIcon,
  title,
  description,
  points,
  locked,
  progress,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOverflowed, setIsOverflowed] = useState(false);

  const titleRef = useRef(null);
  const descRef = useRef(null);

  useEffect(() => {
    const titleOverflow =
      titleRef.current && titleRef.current.scrollWidth > titleRef.current.clientWidth;
    const descOverflow =
      descRef.current && descRef.current.scrollWidth > descRef.current.clientWidth;

    setIsOverflowed(titleOverflow || descOverflow);
  }, [title, description]);

  return (
    <div
      className={`relative flex flex-col items-center p-4 sm:p-6 rounded-[24px] sm:w-full lm:max-w-[250px] cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.25)]
        overflow-hidden transition-all duration-500 ease-in-out
        ${isHovered && isOverflowed ? "max-h-[500px]" : "max-h-[212px]"}`}
      onMouseEnter={() => isOverflowed && setIsHovered(true)}
      onMouseLeave={() => isOverflowed && setIsHovered(false)}
    >
      {/* Icon */}
      <div className="mb-3 sm:mb-4">{locked ? lockedIcon : icon}</div>

      {/* Name */}
      <h3
        ref={titleRef}
        className={`text-[18px] sm:text-[24px] font-medium text-gray-900 text-center w-full mb-1 sm:mb-2
          transition-all duration-500 ease-in-out
          ${isHovered ? "whitespace-normal overflow-visible" : "whitespace-nowrap overflow-hidden text-ellipsis"}`}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        ref={descRef}
        className={`text-[14px] sm:text-[20px] text-[#98A2B3] text-center w-full
          transition-all duration-700 ease-in-out
          ${isHovered ? "whitespace-normal overflow-visible" : "overflow-hidden text-ellipsis whitespace-nowrap"}`}
      >
        {description}
      </p>

      {/* Points */}
      <span className="mt-1 sm:mt-2 text-[12px] sm:text-[16px] font-semibold text-[#0A77FF] transition-all duration-500 ease-in-out">
        +{points} negotiation points
      </span>

      {/* Locked progress */}
      {locked && (
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 text-xs sm:text-sm font-semibold text-[#0A77FF] transition-all duration-500 ease-in-out">
          {progress}%
        </div>
      )}
    </div>
  );
}
