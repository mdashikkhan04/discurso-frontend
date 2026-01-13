"use client";

import Link from "next/link";
import { motion } from "motion/react";

const logos = [
  {
    href: "https://www.hhl.de/",
    src: "/land/hhl_logo.png",
    alt: "HHL Leipzig Graduate School of Management",
    imgClassName: "h-28 object-contain",
  },
  {
    href: "https://www.unibocconi.it/",
    src: "/land/bocconi_logo.png",
    alt: "Bocconi University",
    imgClassName: "h-28 object-contain",
  },
  {
    href: "https://www.esan.edu.pe/",
    src: "/land/esan_logo.png",
    alt: "ESAN Graduate School of Business",
    imgClassName: "h-28 p-2 md:p-6 object-contain",
  },
  {
    href: "https://escp-businessschool.fr/",
    src: "/land/escp_logo.png",
    alt: "ESCP Business School",
    imgClassName: "h-28 object-contain",
  },
  {
    href: "https://www.eafit.edu.co/",
    src: "/land/eafit_logo.svg",
    alt: "EAFIT University",
    imgClassName: "h-20 object-contain",
  },
  {
    href: "https://www.unsw.edu.au/",
    src: "/land/unsw_logo.png",
    alt: "Uni of New South Wales",
    imgClassName: "h-20 object-contain",
  },
  {
    href: "https://www.unimelb.edu.au/",
    src: "/land/melbourne_logo.png",
    alt: "The University of Melbourne",
    imgClassName: "h-28 object-contain",
  },
  {
    href: "https://www.ostfalia.de/cms/en/",
    src: "/land/ostfalia_logo.png",
    alt: "University of Applied Sciences Ostfalia",
    imgClassName: "h-16 object-contain",
  },
];

const TrustedBy = () => {
  return (
    <motion.section
      initial={{ opacity: 0, translateY: 20 }}
      whileInView={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 150, delay: 1 }}
      viewport={{ once: true }}
      className="pb-6"
      id="about-us"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold text-center mb-8">Trusted by</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
          {logos.map((logo, i) => (
            <motion.div
              key={logo.href}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1 + (i * 0.2), type: "spring", stiffness: 100 }}
              className="w-full h-full"
            >
              <Link
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center items-center bg-gray-50 rounded-xl p-2 w-full h-full transition-opacity opacity-90 hover:opacity-100"
              >
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className={`${logo.imgClassName} transition-opacity`}
                />
              </Link>
            </motion.div>
          ))}
        </div>
        <p className="text-gray-500 text-center mt-8">
          And other leading institutions
        </p>
      </div>
    </motion.section>
  );
};

export default TrustedBy;
