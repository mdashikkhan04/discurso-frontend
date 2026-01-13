const ProfileInfo = ({ icon, text }) => {
  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-[14px] sm:text-[20px] text-gray-500 font-light break-words flex-1 min-w-0">
        {text}
      </p>
    </div>
  );
};

export default ProfileInfo;
