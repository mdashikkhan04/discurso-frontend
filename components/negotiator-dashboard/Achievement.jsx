import React from "react";

const Achievement = ({ icon, lockedIcon, title, description, locked }) => {
  return (
    <div className="flex items-center gap-4 p-2">
      {/* Icon*/}
      <img
        src={locked ? lockedIcon : icon}
        alt={title}
        className="w-[44px] h-[44px] object-contain"
      />

      {/* Text */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <span className="text-sm text-gray-400">{description}</span>
      </div>
    </div>
  );
};

export default Achievement;
