export default function Stat({ icon, value, label }) {
  return (
    <div className="flex flex-col w-full items-start p-4 sm:p-6 rounded-[24px] gap-1 sm:gap-2 shadow-[0_1px_4px_rgba(0,0,0,0.25)]">
      <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-[18px] sm:text-[24px] font-semibold text-[#003366]">
        {value}
      </div>
      <div className="text-[14px] sm:text-[20px] font-light text-gray-500 break-words">
        {label}
      </div>
    </div>
  );
}
