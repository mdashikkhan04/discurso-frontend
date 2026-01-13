'use client';

import mockUsers from "./mockUsers.json"; // 15 mock users

export default function Leaderboard({ title, currentUser, icon }) {
  const allUsers = [...mockUsers, currentUser].filter(
    (u, i, arr) => arr.findIndex(x => x.profile_id === u.profile_id) === i
  );

  const sorted = allUsers.sort((a, b) => b.proficiency - a.proficiency);
  const currentUserIndex = sorted.findIndex(u => u.profile_id === currentUser.profile_id);
  const currentUserRank = currentUserIndex + 1;

  const top15 = sorted.slice(0, 15);

  const displayUsers = top15.some(u => u.profile_id === currentUser.profile_id)
    ? top15
    : [...top15, { ...currentUser, __isOutside: true, __rank: currentUserRank }];

  return (
    <div className="flex flex-col gap-3 sm:gap-4 pt-3 sm:pt-[12px] rounded-[24px] shadow-[0_1px_4px_rgba(0,0,0,0.25)] bg-white w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 sm:gap-3 justify-center">
          <img src={icon} alt="Leaderboard icon" className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-[20px] sm:text-[28px] font-regular text-black">{title}</span>
        </div>
        <hr className="w-full border-t-2 border-[#F2F4F7]" />
      </div>

      {/* Column headers (desktop only) */}
      <div className="hidden sm:flex flex-row mx-2 px-4 py-2 rounded-[24px]" style={{ backgroundColor: "#101828" }}>
        <div className="flex-1 text-white font-semibold text-[16px] text-center">User</div>
        <div className="w-36 text-white font-semibold text-[16px] text-center">Negotiation Points</div>
        <div className="w-36 text-white font-semibold text-[16px] text-center">Proficiency</div>
      </div>

      {/* Users list */}
      <div className="flex flex-col ">
        {displayUsers.map((user, index) => {
          const rank = user.__isOutside ? user.__rank : index + 1;
          const isCurrent = user.profile_id === currentUser.profile_id;

          return (
            <div
              key={user.profile_id}
              className={`flex flex-row sm:flex-row items-center px-2 sm:px-3 py-2 sm:py-3 gap-2 sm:gap-3 w-full
                ${isCurrent
                  ? "bg-[#0973F7] text-white"
                  : index % 2 === 0
                  ? "bg-[#F5F6F6]"
                  : "bg-white"
                }`}
            >
              {/* Placement */}
              <div className="w-8 sm:w-12 text-center font-regular text-[12px] sm:text-[16px]">{rank}.</div>

              {/* Avatar + nickname */}
              <div className="flex flex-row items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <img
                  src={user.avatarUrl}
                  alt={user.nickname}
                  className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full ${isCurrent ? "border-2 border-white" : ""}`}
                />
                <span className="text-[12px] sm:text-[20px] font-regular truncate flex-1 min-w-0">
                  {user.nickname}
                </span>
              </div>

              {/* Negotiation Points */}
              <div className="w-20 sm:w-36 text-center text-[12px] sm:text-[20px] font-regular truncate">{user.points}</div>

              {/* Proficiency */}
              <div className="w-20 sm:w-36 text-center text-[12px] sm:text-[20px] font-bold truncate">{user.proficiency}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
