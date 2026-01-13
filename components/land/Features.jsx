"use client";

import { motion } from "motion/react";

const Features = () => {
  return (
    <section
      className="mt-[50px] xs:mt-[100px] sm:mt-[150px] md:mt-[200px] lg:mt-[350px] xl:mt-[400px] mb-6 md:mb-12 py-4 md:py-8 px-4 md:px-6 mx-6 md:mx-12 rounded-3xl bg-white shadow-sm border border-pale-gray"
      id="benefits"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-4">
          <span className="inline-block px-4 py-1 rounded-full bg-pale-blue text-blue-500">
            Benefits
          </span>
        </div>

        <h2 className="text-2xl md:text-4xl text-center mb-4 md:mb-8">
          From Negotiation Learner To Leader
        </h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          // viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:-gap-8"
        >
          {/* Feature 1 */}
          <motion.div
            variants={{
              hidden: { opacity: 0, translateY: -20 },
              visible: {
                opacity: 1,
                translateY: 0,
                transition: {
                  duration: 0.5,
                  type: "spring",
                  stiffness: 150,
                  delay: 0.2,
                },
              },
            }}
            className="bg-white hover:bg-darker-gray rounded-lg overflow-hidden shadow-sm transition-colors duration-300 group border border-pale-gray"
          >
            <div className="w-full h-48 p-2 md:p-4">
              <img
                src="/land/features-1.png"
                alt="Person using tablet for personalized learning path"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="p-2 md:p-6 text-center">
              <h3 className="text-lg font-bold mb-2 group-hover:text-white transition-colors duration-300">
                Personalized Learning Path
              </h3>
              <p className="text-gray-600 group-hover:text-white transition-colors duration-300">
                Follow a structured journey built on the latest negotiation
                research, tailored to your skill level and goals.
              </p>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            variants={{
              hidden: { opacity: 0, translateY: -20 },
              visible: {
                opacity: 1,
                translateY: 0,
                transition: {
                  duration: 0.5,
                  type: "spring",
                  stiffness: 150,
                  delay: 0.4,
                },
              },
            }}
            className="bg-white hover:bg-darker-gray rounded-lg overflow-hidden shadow-sm transition-colors duration-300 group border border-pale-gray"
          >
            <div className="w-full h-48 p-2 md:p-4">
              <img
                src="/land/features-2.png"
                alt="Person receiving real-time feedback on tablet during negotiation"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="p-2 md:p-6 text-center">
              <h3 className="text-lg font-bold mb-2 group-hover:text-white transition-colors duration-300">
                Get AI-powered Feedback
              </h3>
              <p className="text-gray-600 group-hover:text-white transition-colors duration-300">
                Receive instant, science-driven feedback on your negotiation
                strategies and refine your approach with data-backed insights.
              </p>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            variants={{
              hidden: { opacity: 0, translateY: -20 },
              visible: {
                opacity: 1,
                translateY: 0,
                transition: {
                  duration: 0.5,
                  type: "spring",
                  stiffness: 150,
                  delay: 0.6,
                },
              },
            }}
            className="bg-white hover:bg-darker-gray rounded-lg overflow-hidden shadow-sm transition-colors duration-300 group border border-pale-gray"
          >
            <div className="w-full h-48 p-2 md:p-4">
              <img
                src="/land/features-3.png"
                alt="Business professionals practicing negotiation scenarios"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="p-2 md:p-6 text-center">
              <h3 className="text-lg font-bold mb-2 group-hover:text-white transition-colors duration-300">
                Practice Real Negotiations
              </h3>
              <p className="text-gray-600 group-hover:text-white transition-colors duration-300">
                Engage in interactive simulations based on award winning cases
                to develop winning strategies and build confidence.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
