"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

const CheckIcon = () => (
  <Image src="/land/check.png" alt="Check icon" width={24} height={24} />
);

const forCompaniesList = [
  "Equip your teams with high-level negotiation skills to maximize value in every deal.",
  "Train employees with real-world scenarios and customized AI coaching.",
  "Host in-company negotiation simulations based on award winning cases.",
  "Easily onboard and upskill employees with structured learning paths.",
];

const forLearnersList = [
  "Learn from research-based negotiation frameworks used by professionals.",
  "Participate in negotiation simulations with a large library of award-winning cases.",
  "Improve in real-time, data-driven insights on your negotiation performance from an AI coach.",
  "Gain negotiation confidence, maximize your results, and stand out within your industry.",
];

const forProffessorsList = [
  "Host world-class negotiation simulations with zero setup and analysis work.",
  "Get access to a large back-catalog of quality negotiation simulation used by professors around the globe.",
  "Provide students with personalized AI-based feedback to accelerate learning.",
  "Leverage data and analytics to explore your classes' negotiation dynamics.",
];

const listItemVariants = {
  hidden: { opacity: 0, translateY: 20 },
  visible: {
    opacity: 1,
    translateY: 0,
  },
};

const imageVariants = {
  hidden: { opacity: 0, translateY: 20 },
  visible: {
    opacity: 1,
    translateY: 0,
    transition: {
      duration: 0.3,
      type: "spring",
      stiffness: 150,
      delay: 0.5,
    },
  },
};

const ForSection = () => (
  <section className="py-10 md:py-20 relative">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Timeline connector */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-vivid-blue -translate-x-1/2 z-0" />

      {/* For Companies */}
      <div className="relative mb-10 md:mb-20" id="for-companies">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* text (left of center) */}
          <div className="order-2 md:order-1 flex justify-center md:pr-8 z-10">
            {forCompaniesList && (
              <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm py-6 px-6 border border-pale-gray">
                <h2 className="text-lg font-medium mb-6">For Companies</h2>
                <ul className="space-y-4">
                  {forCompaniesList.map((item, index) => (
                    <motion.li
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={listItemVariants}
                      transition={{
                        delay: index * 0.1 + 0.2,
                        duration: 0.3,
                        type: "spring",
                        stiffness: 150,
                      }}
                      key={index}
                      className="flex items-start"
                    >
                      <CheckIcon />
                      <span className="ml-2 text-md text-gray-600">{item}</span>
                    </motion.li>
                  ))}
                </ul>
                <Link href="/for-companies">
                  <Button className="bg-primary text-white hover:bg-primary/90 mt-6 font-semibold rounded-full">
                    Find out more
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* image (right of center) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={imageVariants}
            className="order-1 md:order-2 flex justify-center md:pl-8 z-10"
          >
            <div className="w-full max-w-xl rounded-lg shadow-lg overflow-hidden">
              <img
                src="/land/team-1.png"
                alt="Business professionals in a negotiation meeting"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>

        {/* arrow icon */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <img
            src="/land/icon-right.png"
            alt="right arrow"
            className="w-8 h-8"
          />
        </div>
      </div>

      {/* For Learners */}
      <div className="relative mb-10 md:mb-20" id="for-learners">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* image (left of center) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={imageVariants} className="flex justify-center md:pr-8 z-10">
            <div className="w-full max-w-xl rounded-lg shadow-lg overflow-hidden">
              <img
                src="/land/team-2.png"
                alt="Team collaborating around a table with laptops"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* text (right of center) */}
          <div className="flex justify-center md:pl-8 z-10">
            <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm py-6 px-6 border border-pale-gray">
              <h2 className="text-lg font-medium mb-6">For Learners</h2>
              <ul className="space-y-4">
                {forLearnersList.map((item, index) => (
                  <motion.li
                    initial="hidden"
                    whileInView="visible"
                    variants={listItemVariants}
                    viewport={{ once: true }}
                    transition={{
                      delay: index * 0.1 + 0.2,
                      duration: 0.3,
                      type: "spring",
                      stiffness: 150,
                    }}
                    key={index}
                    className="flex items-start"
                  >
                    <CheckIcon />
                    <span className="ml-2 text-md text-gray-600">{item}</span>
                  </motion.li>
                ))}
              </ul>
              <Link href="/for-learners">
                <Button className="bg-primary text-white hover:bg-primary/90 mt-6 font-semibold rounded-full">
                  Find out more
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* arrow icon */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <img src="/land/icon-left.png" alt="left arrow" className="w-8 h-8" />
        </div>
      </div>

      {/* For Professors */}
      <div className="relative" id="for-professors">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* text (left of center) */}
          <div className="order-2 md:order-1 flex justify-center md:pr-8 z-10">
            <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm py-6 px-6 border border-pale-gray">
              <h2 className="text-lg font-medium mb-6">For Professors</h2>
              <ul className="space-y-4">
                {forProffessorsList.map((item, index) => (
                  <motion.li
                    initial="hidden"
                    whileInView="visible"
                    variants={listItemVariants}
                    viewport={{ once: true }}
                    transition={{
                      delay: index * 0.1 + 0.2,
                      duration: 0.3,
                      type: "spring",
                      stiffness: 150,
                    }}
                    key={index}
                    className="flex items-start"
                  >
                    <CheckIcon />
                    <span className="ml-2 text-md text-gray-600">{item}</span>
                  </motion.li>
                ))}
              </ul>
              <Link href="/for-professors">
                <Button className="bg-primary text-white hover:bg-primary/90 mt-6 font-semibold rounded-full">
                  Find out more
                </Button>
              </Link>
            </div>
          </div>

          {/* image (right of center) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={imageVariants} className="order-1 md:order-2 flex justify-center md:pl-8 z-10">
            <div className="w-full max-w-xl rounded-lg shadow-lg overflow-hidden">
              <img
                src="/land/team-3.png"
                alt="Professor facilitating a negotiation training with students"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>

        {/* arrow icon */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <img
            src="/land/icon-right.png"
            alt="right arrow"
            className="w-8 h-8"
          />
        </div>
      </div>
    </div>
  </section>
);

export default ForSection;
