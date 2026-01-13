const Feature = ({ imageSrc, title, description, reverse = false }) => {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
      <div
        className={`max-w-[1280px] w-full flex flex-col lg:flex-row ${
          reverse ? "lg:flex-row-reverse" : ""
        } items-center lg:items-start gap-8 lg:gap-[113px]`}
      >
        <div className="w-full lg:w-1/2">
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-auto lg:h-[354px] max-h-[354px] rounded-[20px] object-cover"
          />
        </div>

        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <h2 className="text-[32px] sm:text-[36px] lg:text-[40px] font-semibold leading-tight text-gray-800">
            {title}
          </h2>
          <p className="text-[18px] sm:text-[19px] lg:text-[20px] text-gray-700">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
};
export default Feature;