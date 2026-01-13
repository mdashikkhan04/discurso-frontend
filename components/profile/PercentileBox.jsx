'use client';

export default function PercentileBox({ value, label }) {
  return (
    <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.25)] relative overflow-hidden">
      {/* Gradient background filled in % */}
      <div
        className="absolute top-0 left-0 h-full rounded-[24px] -z-10 opacity-10"
        style={{
          width: `${value}%`,
          background: "linear-gradient(90deg, #0A77FF, #004499)",
        }}
      />
      {/* Number */}
      <div className="text-[18px] sm:text-[24px] font-semibold text-[#0973F7]">
        {value}%
      </div>
      {/* Label */}
      <div className="text-[18px] sm:text-[24px] font-semibold text-[#101828]">
        {label}
      </div>
    </div>
  );
}
