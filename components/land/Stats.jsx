"use client";

import { motion } from "motion/react";

const Stats = () => {
  return (
    <section className="py-8 md:py-16 text-white my-4 md:my-8 z-10 relative overflow-hidden mx-6 md:mx-12 rounded-3xl">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: { width: 0 },
          visible: {
            width: "100%",
            transition: {
              duration: 1.5,
              delay: 0.4,
              ease: "easeInOut",
            },
          },
        }}
        className="absolute w-1/3 h-full bg-darker-gray top-0 left-0 -z-10"
      ></motion.div>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="container mx-auto px-4 md:px-8 z-50"
      >
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          variants={{
            hidden: { opacity: 0, translateY: -20 },
            visible: {
              opacity: 1,
              translateY: 0,
              transition: {
                duration: 0.3,
                type: "spring",
                stiffness: 150,
                delay: 2,
              },
            },
          }}
        >
          <div>
            <p className="text-5xl font-bold">$54</p>
            <p className="text-md text-gray-100 mt-4 w-4/5 mx-auto">
              Return for every $1
              <br />
              Invested in Negotiation
              <br />
              Training
            </p>
          </div>
          <motion.div
            variants={{
              hidden: { opacity: 0, translateY: -20 },
              visible: {
                opacity: 1,
                translateY: 0,
                transition: {
                  duration: 0.3,
                  type: "spring",
                  stiffness: 150,
                  delay: 2.2,
                },
              },
            }}
          >
            <p className="text-5xl font-bold">28%</p>
            <p className="text-md text-gray-100 mt-4 w-4/5 mx-auto">
              Bigger Odds of
              <br />
              Promotion for
              <br />
              Negotiation Learners
            </p>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, translateY: -20 },
              visible: {
                opacity: 1,
                translateY: 0,
                transition: {
                  duration: 0.3,
                  type: "spring",
                  stiffness: 150,
                  delay: 2.4,
                },
              },
            }}
          >
            <p className="text-5xl font-bold">13%</p>
            <p className="text-md text-gray-100 mt-4 w-4/5 mx-auto">
              Higher Earnings
              <br />
              for Skilled
              <br />
              Negotiators
            </p>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, translateY: -20 },
              visible: {
                opacity: 1,
                translateY: 0,
                transition: {
                  duration: 0.3,
                  type: "spring",
                  stiffness: 150,
                  delay: 2.6,
                },
              },
            }}
          >
            <div className="flex items-center justify-center -space-x-6 md:-space-x-4">
              <img
                src="/land/persona-1.png"
                alt="User"
                className="h-12 aspect-square rounded-full border-2 border-white"
              />
              <img
                src="/land/persona-2.png"
                alt="User"
                className="h-12 aspect-square rounded-full border-2 border-white"
              />
              <img
                src="/land/persona-3.png"
                alt="User"
                className="h-12 aspect-square rounded-full border-2 border-white"
              />
              <img
                src="/land/persona-4.png"
                alt="User"
                className="h-12 aspect-square rounded-full border-2 border-white"
              />
              <div className="h-12 aspect-square rounded-full bg-gray-700 border-2 border-white flex items-center justify-center text-sm font-bold">
                100+
              </div>
            </div>
            <p className="text-md text-gray-100 mt-4">Join Now!</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Stats;
