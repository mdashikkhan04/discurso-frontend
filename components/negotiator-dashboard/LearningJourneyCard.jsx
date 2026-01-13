import React from "react";

const LearningJourneyCard = ({
  bgColor = "#F9FAFB",
  accentColor = "#0A77FF",
  thirdColor = "#004499",
  icon,
  title,
  description,
  progress = 0,
  link = "#",
}) => {
  const completed = progress === 100;

  return (
    <a href={link} className="block group">
      <div
        className="rounded-[12px] p-4 flex flex-col justify-between h-[290px] transition-transform duration-300 hover:scale-[1.02] overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        <div className="flex flex-col gap-4 flex-grow min-h-0">
          {/* Icon + Progress */}
          <div className="flex justify-between items-center flex-shrink-0">
            <img src={icon} alt={title} className="w-8 h-8" />

            {/* <div className="relative flex items-center justify-center w-8 h-8 flex-shrink-0">
              <svg className="w-8 h-8 transform -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke={completed ? accentColor : "#E5E7EB"}
                  strokeWidth="3"
                  fill="none"
                />
                {!completed && (
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke={`url(#progressGradient)`}
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 14}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 14 * (1 - progress / 100)
                    }`}
                    fill="none"
                  />
                )}
                <defs>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0A77FF" />
                    <stop offset="100%" stopColor="#004499" />
                  </linearGradient>
                </defs>
              </svg>
              <span
                className={`absolute text-[9px] font-medium ${
                  completed ? `text-[${accentColor}]` : "text-gray-500"
                }`}
              >
                {progress}%
              </span>
            </div> */}
          </div>

          {/* Title */}
          <h3 className="text-[18px] font-medium text-black">
            {title}
          </h3>

          {/* Description */}
          <p
            className="text-[14px] text-gray-500 overflow-hidden text-ellipsis line-clamp-3"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
            }}
          >
            {description}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 flex-shrink-0">
          {completed ? (
            <div
              className="rounded-[8px] py-2 text-center text-white text-[14px] font-medium"
              style={{ backgroundColor: thirdColor }}
            >
              Completed
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span
                className="text-[14px] font-normal transition-all duration-300 group-hover:underline group-hover:translate-x-1"
                style={{ color: thirdColor }}
              >
                Start Learning
              </span>
              <div
                className="w-7 h-7 flex items-center justify-center rounded-full"
                style={{ backgroundColor: accentColor }}
              >
                <img
                  src="/negotiator-dashboard/arrow.svg"
                  alt="Start"
                  className="w-3 h-3"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </a>
  );
};

export default LearningJourneyCard;
