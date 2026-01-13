'use client';
import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { getSpiderWebStats, getAverageSpiderWebStats } from "@/actions/profile";

// Mouse Tooltip
const CustomTooltip = ({ active, payload, isMobile }) => {
  if (!active || !payload || !payload.length) return null;

  if (isMobile) {
    const user = payload.find((p) => p.dataKey === "value")?.value;
    const avg = payload.find((p) => p.dataKey === "avgValue")?.value;
    const label = payload[0]?.payload?.subject;

    return (
      <div className="flex flex-col items-center bg-white py-2 px-4 rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.25)] text-center">
        <span className="font-semibold text-[14px]">{label}</span>
        <span className="text-gray-500 text-[12px]">{`Avg: ${avg ?? 0}%`}</span>
        <span className="text-[#0973F7] text-[12px]">{`You: ${user ?? 0}%`}</span>
      </div>
    );
  }

  const avg = payload.find((p) => p.dataKey === "avgValue")?.value;
  const user = payload.find((p) => p.dataKey === "value")?.value;

  return (
    <div className="flex items-center gap-2 text-[16px] font-semibold bg-white py-1 px-3 rounded-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.25)]">
      {avg !== undefined && <span className="text-gray-500">{`${avg}%`}</span>}
      {avg !== undefined && user !== undefined && <span className="text-gray-500">|</span>}
      {user !== undefined && <span className="text-[#0973F7]">{`${user}%`}</span>}
    </div>
  );
};

export default function SpiderWebGraph({ userId }) {
  const [data, setData] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      const userData = await getSpiderWebStats(userId);
      const avgData = await getAverageSpiderWebStats();

      const mergedData = userData.map((u, i) => ({
        subject: u.subject,
        value: u.value,
        avgValue: avgData[i]?.value || 0
      }));

      setData(mergedData);
    }

    fetchStats();
  }, [userId]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

    return (
    <div className="w-full flex justify-center">
      <div
        className={`w-full ${isMobile ? "aspect-square" : "h-[400px]"}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart outerRadius={isMobile ? "80%" : "90%"} data={data}>
            <PolarGrid />
            {!isMobile && (
              <PolarAngleAxis
                dataKey="subject"
                className="text-[12px] sm:text-[14px]"
              />
            )}
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="User"
              dataKey="value"
              stroke="#0973F7"
              strokeWidth={3}
              fill="#0974f7ff"
              fillOpacity={0.1}
            />
            <Radar
              name="Average"
              dataKey="avgValue"
              strokeWidth={3}
              stroke="#101828"
              strokeOpacity={0.5}
              fill="#B0B0B0"
              fillOpacity={0.1}
            />
            <Tooltip content={<CustomTooltip isMobile={isMobile} />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
