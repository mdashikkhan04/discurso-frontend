const InfoCard = ({ iconSrc, title, description }) => {
  return (
    <div className="flex flex-col h-[173px] max-w-[249px] gap-4 items-center text-center sm:items-start sm:text-left">
      <img src={iconSrc} alt={title} className="w-16 h-16 object-contain" />
      <h3 className="text-[24px] sm:text-[26px] md:text-[28px] font-medium leading-snug text-white">
        {title}
      </h3>
      <p className="text-[18px] sm:text-[20px] text-gray-700 leading-tight text-white">
        {description}
      </p>
    </div>
  );
};

export default InfoCard;
