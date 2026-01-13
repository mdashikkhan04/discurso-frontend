import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ArrowRight, RotateCcw, LockKeyhole } from "lucide-react";

/**
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
  return n.toString().padStart(2, "0");
}

/**
 * @param {Date} d
 * @returns {string}
 */
function dateStr(d) {
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/**
 * @param {number} start
 * @param {number} end
 * @param {number} now
 * @param {"upcoming"|"ongoing"|"finished"} state
 * @returns {string}
 */
function getRelativeTime(start, end, now, state) {
  if (state === "upcoming") {
    const diff = start - now;
    if (diff > 0) {
      const mins = Math.round(diff / 60000);
      if (mins < 60) return `Starts in ${mins}m`;
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      if (hours < 24)
        return `Starts in ${hours}h${remMins > 0 ? ` ${remMins}m` : ""}`;
      const days = Math.floor(hours / 24);
      return `Starts in ${days}d${hours % 24 > 0 ? ` ${hours % 24}h` : ""}`;
    }
    return "Upcoming";
  }
  if (state === "ongoing") {
    const diff = end - now;
    if (diff > 0) {
      const mins = Math.round(diff / 60000);
      if (mins < 60) return `Ends in ${mins}m`;
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      if (hours < 24)
        return `Ends in ${hours}h${remMins > 0 ? ` ${remMins}m` : ""}`;
      const days = Math.floor(hours / 24);
      return `Ends in ${days}d${hours % 24 > 0 ? ` ${hours % 24}h` : ""}`;
    }
    return "Ongoing";
  }
  return "";
}

/**
 * @param {object} props
 * @param {string} props.title
 * @param {number} props.startTime
 * @param {number} props.endTime
 * @param {boolean} props.aiRound
 * @param {number} props.index
 * @param {string|number} props.eventId
 * @param {"finished"|"ongoing"|"upcoming"} [props.activityState]
 * @param {boolean} props.finished
 * @param {string} [props.roundingClass]
 * @param {boolean} [props.hasMadeDeal]
 */
export default function RoundsViewRound({
  title,
  viewTime,
  startTime,
  endTime,
  aiRound,
  index,
  eventId,
  activityState: forcedState,
  finished,
  roundingClass,
  hasMadeDeal,
}) {
  const [activityState, setActivityState] = useState(forcedState || "upcoming");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (forcedState) return;
    const now = Date.now();
    if (endTime < now) {
      setActivityState("finished");
    } else if (startTime <= now && endTime >= now) {
      setActivityState("ongoing");
    } else {
      setActivityState("upcoming");
    }
    if (!forcedState && activityState !== "finished") {
      const interval = setInterval(() => setNow(Date.now()), 30000);
      return () => clearInterval(interval);
    }
  }, [startTime, endTime, forcedState, activityState]);

  const start = new Date(startTime);
  const end = new Date(endTime);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  let timeDisplay;
  if (sameDay) {
    timeDisplay = `${dateStr(start)} - ${pad(end.getHours())}:${pad(
      end.getMinutes()
    )}`;
  } else {
    timeDisplay = `${dateStr(start)} - ${dateStr(end)}`;
  }

  let timeContent;
  if (activityState === "finished") {
    timeContent = (
      <div className="flex flex-col items-center text-sm" title={timeDisplay}>
        <span>{dateStr(start)}</span>
        <span>{dateStr(end)}</span>
      </div>
    );
  } else {
    timeContent = (
      <span className="text-sm font-semibold" title={timeDisplay}>
        {getRelativeTime(startTime, endTime, now, activityState)}
      </span>
    );
  }

  const isActive =
    activityState === "finished" ||
    activityState === "ongoing" ||
    (viewTime && now >= viewTime);

  return (
    <div
      className={`flex-1 flex flex-col items-center justify-between bg-white overflow-hidden min-h-[450px] ${isActive ? "opacity-100" : "opacity-90"
        } ${roundingClass} ${!isActive ? 'lg:h-[450px] h-[400px]' : 'h-[500px]'}`}
      style={{
        minHeight: isActive ? '500px' : '450px'
      }}
    >
      <div className="flex w-full items-center sm:h-16 h-fit flex-shrink-0 relative">
        <div className="absolute bottom-0 w-2/4 left-1/4 rounded-full bg-soft-gray h-0.5"></div>
        <div className="flex items-center justify-center p-2 w-full h-full">
          <p className={`uppercase text-xl font-semibold text-black`}>
            {activityState}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 py-2 px-6 w-full">
          <CalendarDays className="w-5 h-5 text-black mr-2" />
          {timeContent}
        </div>
      </div>
      <div className="h-full flex items-center flex-col justify-center">
        <h3 className="text-2xl font-semibold text-black">Round {index + 1}</h3>
        <p className="text-lg text-black mt-2">{title || "Untitled Round"}</p>
      </div>
      <div className="flex w-full items-center sm:h-16 h-fit flex-shrink-0 relative">
        <div className="absolute top-0 w-2/4 left-1/4 rounded-full bg-soft-gray h-0.5"></div>
        {activityState === "upcoming" && viewTime && now >= viewTime ? (
          <Link
            className={`flex items-center justify-center gap-2 p-2 w-full h-full transition-colors hover:bg-soft-gray`}
            href={`/negotiator/events/${eventId}/${index + 1}`}
          >
            <p className="flex items-center justify-center gap-2 p-2 px-6 bg-gradient-to-b from-vivid-blue to-deep-blue text-white rounded-full font-bold">
              View
              <ArrowRight className="w-5 h-5 mr-2 text-white" />
            </p>
          </Link>
        ) : activityState === "upcoming" ? (
          <span
            className={`flex items-center justify-center gap-2 p-2 w-full h-full transition-colors`}
            style={{ cursor: "not-allowed", opacity: 0.6 }}
          >
            <LockKeyhole className="w-5 h-5 text-black" />
          </span>
        ) : (
          <Link
            className={`flex items-center justify-center gap-2 p-2 w-full h-full transition-colors hover:bg-soft-gray `}
            href={`/negotiator/events/${eventId}/${index + 1}`}
          >
            <p className="flex items-center justify-center text-sm gap-2 p-2 px-6 bg-gradient-to-b from-vivid-blue to-deep-blue text-white rounded-full font-bold">
              {activityState === "ongoing" && !finished && "Continue Negotiation"}
                  {activityState === "finished" || finished ? <RotateCcw className="w-5 h-5 mr-2 text-white" /> : <ArrowRight className="w-5 h-5 mr-2 text-white" />}
              {(activityState === "finished" || finished) && "Round history"}
            </p>
          </Link>
        )}
        {(finished || activityState === "finished") && hasMadeDeal &&
          (aiRound ? (
            <Link
              href={`/negotiator/events/${eventId}/${index + 1}/feedback`}
              className="flex items-center justify-center p-2 w-full h-full hover:bg-soft-gray transition-colors"
            >
              <Image
                src="/ai-stars.png"
                width={24}
                height={24}
                alt="Feedback"
                className="mr-2"
              />
              Feedback
            </Link>
          ) : (
            <div
              title="Feedback is available only for AI rounds"
              className="flex items-center justify-center p-2 w-full h-full hover:bg-soft-gray transition-colors cursor-not-allowed"
            >
              <Image
                src="/ai-stars.png"
                width={24}
                height={24}
                alt="Feedback"
                className="mr-2"
              />
              Feedback
            </div>
          ))}
      </div>
    </div>
  );
}

RoundsViewRound.propTypes = {
  title: PropTypes.string,
  startTime: PropTypes.number.isRequired,
  endTime: PropTypes.number.isRequired,
  aiRound: PropTypes.bool,
  index: PropTypes.number.isRequired,
  isLast: PropTypes.bool,
  eventId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  activityState: PropTypes.oneOf(["finished", "ongoing", "upcoming"]),
};
