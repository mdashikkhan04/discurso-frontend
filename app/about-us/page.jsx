"use client";

import Header from "@/components/land/Header";
import Footer from "@/components/land/Footer";
import JoinUsCTA from "@/components/land/JoinUs";
import Link from "next/link";
import { motion, MotionConfig } from "motion/react";

const fadeInUp = (delay) => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.5,
      type: "spring",
      stiffness: 100,
    },
  },
});

const fadeInUpWhileInView = (delay) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.5,
      type: "spring",
      stiffness: 100,
    },
  },
  viewport: { once: true },
});

const AboutHeading = ({ text }) => (
  <h2 className="text-4xl font-bold text-gray-900 mt-4 mb-6">
    {text.split(" ").map((word, i) => (
      <motion.span
        key={i}
        {...fadeInUp(0.5 + i * 0.1)}
        className="inline-block mr-1.5"
      >
        {word}{" "}
      </motion.span>
    ))}
  </h2>
);

const MissionHeading = ({ text }) => (
  <h3 className="text-3xl font-bold text-gray-900 mt-4 mb-6">
    {text.split(" ").map((word, i) => (
      <motion.span
        key={i}
        {...fadeInUpWhileInView(0.5 + i * 0.1)}
        className="inline-block mr-1.5"
      >
        {word}{" "}
      </motion.span>
    ))}
  </h3>
);

const InfoCard = ({ delay, title, description }) => (
  <motion.div
    {...fadeInUpWhileInView(delay)}
    className="bg-white hover:bg-darker-gray rounded-lg overflow-hidden shadow-sm transition-colors duration-300 group border border-pale-gray"
  >
    <div className="p-6 text-center">
      <h3 className="text-lg font-bold mb-2 group-hover:text-white transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-700 group-hover:text-white transition-colors duration-300">
        {description}
      </p>
    </div>
  </motion.div>
);

const TeamMember = ({ delay, href, imgSrc, alt, name, role }) => (
  <motion.div {...fadeInUpWhileInView(delay)} className="text-center">
    <div className="w-40 h-40 mx-auto bg-gray-300 rounded-full mb-4">
      <Link href={href}>
        <img
          src={imgSrc}
          alt={alt}
          className="h-40 object-contain opacity-90 hover:opacity-100 transition-opacity"
        />
      </Link>
    </div>
    <h4 className="text-xl font-semibold">{name}</h4>
    <p className="text-gray-700">{role}</p>
  </motion.div>
);

const AboutUsPage = () => {
  const aboutHeading =
    "The First Science–Based AI Platform For Negotiation Learning";
  const missionHeading = "Transforming Negotiation Education Through AI";

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-soft-white">
        <Header interLinks={true} darkThemed={true} />

        <section className="py-6 mt-32 md:py-12" id="about-us">
          <div id="company" className="container mx-auto px-4 md:px-12">
            {/* Company Overview */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12 mb-12 md:mb-24 px-4 md:px-12">
              <div className="max-w-xl">
                <span className="inline-block px-4 py-2 rounded-full bg-pale-blue text-blue-500 mb-4 text-sm">
                  About Discurso.AI
                </span>
                <AboutHeading text={aboutHeading} />
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: 1.5,
                      duration: 0.5,
                      type: "spring",
                      stiffness: 100,
                    },
                  }}
                  className="text-gray-700 mb-8"
                >
                  We believe that AI is a paradigm shift in how negotiation is
                  learned and taught, enabling personalized, data-driven insights
                  that accelerate skill development, deepen understanding, and
                  make world-class training accessible to everyone.
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: 1,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100,
                  },
                }}
                className="w-full md:w-1/2 h-80 rounded-lg overflow-hidden"
              >
                <img
                  src="/land/team-5.png"
                  alt="Work Image"
                  className="w-full h-full object-cover rounded-lg"
                />
              </motion.div>
            </div>

            {/* What the Platform Does */}
            <div id="what-we-do" className="mb-12 md:mb-24 px-4 md:px-12">
              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 1, duration: 0.5 } }}
                className="text-3xl font-bold text-gray-900 mb-6"
              >
                Improve Your Skills Through:
              </motion.h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                <InfoCard
                  delay={1.2}
                  title="A Personalized Learning Path"
                  description="Follow a structured journey built on the latest negotiation research, tailored to your skill level and goals."
                />
                <InfoCard
                  delay={1.4}
                  title="AI-Powered Feedback"
                  description="Receive instant, science-driven feedback on your negotiation strategies and refine your approach with data-backed insights."
                />
                <InfoCard
                  delay={1.6}
                  title="Practicing Real Negotiations"
                  description="Engage in interactive simulations based on award winning cases to develop winning strategies and build confidence."
                />
              </div>
            </div>

            {/* Our Mission */}
            <div
              id="mission"
              className="flex flex-col md:flex-row-reverse items-center justify-between gap-6 md:gap-12 mb-12 md:mb-24 px-4 md:px-12"
            >
              <div className="max-w-xl">
                <span className="inline-block px-4 py-2 rounded-full bg-pale-blue text-blue-500 mb-4 text-sm">
                  Our Mission
                </span>
                <MissionHeading text={missionHeading} />
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: 1,
                      duration: 0.5,
                      type: "spring",
                      stiffness: 100,
                    },
                  }}
                  viewport={{ once: true }}
                  className="text-gray-700 mb-8"
                >
                  Our mission is to make proven, high-quality negotiation training
                  available to everyone, regardless of background, experience, or
                  location. We believe that the ability to negotiate well is a
                  life-changing skill, and we’re committed to delivering
                  practical, engaging, and accessible learning that helps people
                  grow personally and professionally.
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: 1,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100,
                  },
                }}
                viewport={{ once: true }}
                className="w-full md:w-1/2 h-80 rounded-lg overflow-hidden"
              >
                <img
                  src="/land/team-4.png"
                  alt="Discussion Image"
                  className="w-full h-full object-cover rounded-lg"
                />
              </motion.div>
            </div>

            {/* Our Team */}
            <div id="our-team" className="mb-8 md:mb-16 px-4 md:px-12">
              <h3 className="text-3xl font-bold text-gray-900 text-center mb-5 md:mb-10">
                Our Team
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 px-10 md:px-20 lg:px-40">
                <TeamMember
                  delay={0.5}
                  href="https://www.linkedin.com/in/jansmolinski"
                  imgSrc="/land/jan_smol.png"
                  alt="Jan Smolinski Picture"
                  name="Jan Smolinski"
                  role="Founder & CEO"
                />
                <TeamMember
                  delay={0.75}
                  href="https://www.linkedin.com/in/drsmolinski/"
                  imgSrc="/land/remi_smol.png"
                  alt="Remi Smolinski Picture"
                  name="Prof. Dr. Remi Smolinski"
                  role="Founder & Scientific Advisor"
                />
              </div>
            </div>

            <div className="mb-4 md:mb-8 px-8 md:px-32">
              <JoinUsCTA />
            </div>
          </div>
        </section>

        <Footer interLinks={true} />
      </div>
    </MotionConfig>
  );
};

export default AboutUsPage;
