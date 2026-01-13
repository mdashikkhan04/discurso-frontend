import ProfileInfo from './ProfileInfo';

export default function ProfileHeader({
  level,
  negotiation_points,
  avatarUrl,
  nickname,
  profile_id,
  date_of_joining,
  friends_count,
  proficiency,
}) {
  return (
    <div className="w-full h-full px-4 sm:px-8 p-6 flex flex-col md:flex-row gap-6 relative">
      {/* Top right buttons (desktop) */}
      <div className="absolute top-4 right-4 hidden md:flex gap-4">
        {/* <button className="bg-[#0A77FF] text-white hover:bg-blue-600 px-5 py-3 rounded-full text-[14px] font-bold flex items-center gap-2">
          Add friend
        </button> */}
        <button className="bg-[#0A77FF] text-white hover:bg-blue-600 px-5 py-3 rounded-full text-[14px] font-bold">
          Edit Profile
        </button>
      </div>

      {/* Left Column - Avatar */}
      <div className="flex flex-col items-center w-full md:w-[273px]">
        <div className="relative w-full" style={{ aspectRatio: '1 / 1', maxHeight: '273px' }}>
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover rounded-[16px] max-h-[273px] md:h-[273px]"
          />

          {/* Negotiation Points */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white px-3 py-1 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.25)] inline-flex items-center gap-1 text-[14px] sm:text-[16px] whitespace-nowrap">
            <span className="text-blue-600 font-semibold">{negotiation_points}</span>
            <span className="text-gray-500">Negotiation Points</span>
          </div>

          {/* Edit Icon */}
          <button className="absolute top-[-10px] right-[-10px] bg-white border px-2 py-2 rounded-[24px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] hover:bg-gray-100">
            <img src="/profile/edit_profile.svg" alt="Edit Profile" />
          </button>
        </div>

        {/* Mobile / Tablet buttons */}
        <div className="flex flex-col gap-3 w-full mt-4 md:hidden py-4">
          {/* <button className="bg-[#0A77FF] text-white hover:bg-blue-600 px-5 py-3 rounded-full text-[14px] font-bold flex items-center justify-center gap-2">
            Add friend
          </button> */}
          <button className="bg-[#0A77FF] text-white hover:bg-blue-600 px-5 py-3 rounded-full text-[14px] font-bold">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col flex-1 mt-8 md:mt-0">
        {/* Top Section: Name, ID and Level */}
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex flex-col">
            <h1 className="text-[24px] sm:text-[28px] md:text-[32px] font-semibold">{nickname}</h1>
            <p className="text-[14px] sm:text-[16px] text-gray-500 font-light">{profile_id}</p>
          </div>

          {/* Level */}
          <div
            className="inline-flex items-center justify-center rounded-full p-[6px] ml-auto md:ml-0"
            style={{ background: 'linear-gradient(90deg, #0A77FF, #004499)' }}
          >
            <div className="bg-white rounded-full flex items-center justify-center px-3 aspect-square">
              <span className="bg-gradient-to-r from-[#0A77FF] to-[#004499] bg-clip-text text-transparent font-bold text-[16px] sm:text-[18px] md:text-[20px] whitespace-nowrap">
                {level}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-6 flex flex-col gap-4 sm:gap-6 md:gap-9 text-gray-500 font-light">
          <ProfileInfo
            icon={<img src="/profile/clock.svg" alt="Date Joined" />}
            text={`Joined ${date_of_joining}`}
          />
          {/* <ProfileInfo
            icon={<img src="/profile/friends.svg" alt="Friends Count" />}
            text={`${friends_count} Friends`}
          /> */}
          <ProfileInfo
            icon={<img src="/profile/proficiency.svg" alt="Proficiency" />}
            text={`${proficiency}% Proficiency`}
          />
        </div>
      </div>
    </div>
  );
}
