"use client";

import Marquee from "react-fast-marquee";
import Image from "next/image";

const logos = [
  {
    href: "https://www.hhl.de/",
    src: "/land/hhl_logo.png",
    alt: "HHL Leipzig Graduate School of Management",
  },
  {
    href: "https://www.unibocconi.it/",
    src: "/land/bocconi_logo.png",
    alt: "Bocconi University",
  },
  {
    href: "https://www.esan.edu.pe/",
    src: "/land/esan_logo.png",
    alt: "ESAN Graduate School of Business",
  },
  {
    href: "https://escp-businessschool.fr/",
    src: "/land/escp_logo.png",
    alt: "ESCP Business School",
  },
  {
    href: "https://www.eafit.edu.co/",
    src: "/land/eafit_logo.svg",
    alt: "EAFIT University",
  },
  {
    href: "https://www.unsw.edu.au/",
    src: "/land/unsw_logo.png",
    alt: "Uni of New South Wales",
  },
  {
    href: "https://www.unimelb.edu.au/",
    src: "/land/melbourne_logo.png",
    alt: "The University of Melbourne",
  },
  {
    href: "https://www.ostfalia.de/cms/en/",
    src: "/land/ostfalia_logo.png",
    alt: "University of Applied Sciences Ostfalia",
  },
];

const CompanyMarquee = () => {
  return (
    <section className="w-[628px] h-[384px] overflow-hidden rounded-[16px]">
      {/* Top row - normal order */}
      <Marquee direction="left" speed={40} loop={0} gradient={false} className="mb-4">
        {logos.map((logo, i) => (
          <div
            key={`top-${i}`}
            className="w-[290px] h-[184px] bg-gray-100 rounded-[16px] flex items-center justify-center mr-6"
          >
            <a href={logo.href} target="_blank" rel="noopener noreferrer" className="w-[80%] h-[80%] relative">
              <Image
                src={logo.src}
                alt={logo.alt}
                fill
                className="object-contain"
              />
            </a>
          </div>
        ))}
      </Marquee>

      {/* Bottom row - reversed order */}
      <Marquee direction="right" speed={40} loop={0} gradient={false}>
        {logos
          .slice()
          .reverse()
          .map((logo, i) => (
            <div
              key={`bottom-${i}`}
              className="w-[290px] h-[184px] bg-gray-100 rounded-[16px] flex items-center justify-center mr-6"
            >
              <a href={logo.href} target="_blank" rel="noopener noreferrer" className="w-[80%] h-[80%] relative">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  className="object-contain"
                />
              </a>
            </div>
          ))}
      </Marquee>
    </section>
  );
};

export default CompanyMarquee;