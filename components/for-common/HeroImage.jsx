const HeroImage = ({ imagesrc, caption }) => {
  return (
    <figure className="relative w-full my-8 px-[clamp(4px,2vw,24px)] sm:px-6 md:px-8 lg:px-10 xl:px-8 2xl:px-10">
      <img
        src={imagesrc}
        alt={caption}
        className="rounded-[24px] w-full max-w-none object-cover max-h-[600px]"
        style={{ aspectRatio: "1 / 1" }}
      />
      <figcaption
        className="
        absolute bottom-10
        left-[clamp(4px,2vw,24px)] sm:left-6 md:left-8 lg:left-10 xl:left-8 2xl:left-10
        bg-dark-gray text-white font-semibold py-5 px-3
        rounded-tr-[24px] rounded-br-[24px]
        text-3xl sm:text-4xl md:text-5xl lg:text-[48px]
        "
      >
        {caption}
      </figcaption>
    </figure>
  );
};

export default HeroImage;