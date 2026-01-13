const FeatureText = ({ title, description, color = "text-white" }) => (
  <div className="flex flex-col gap-6">
    <h2 className={`text-[32px] sm:text-[36px] lg:text-[40px] font-semibold ${color}`}>
      {title}
    </h2>
    <p className={`text-[18px] sm:text-[20px] ${color}`}>
      {description}
    </p>
  </div>
);
export default FeatureText;