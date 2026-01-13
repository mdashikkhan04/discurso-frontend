"use client";

import Header from "@/components/land/Header";
import Footer from "@/components/land/Footer";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import HeroImage from "@/components/for-common/HeroImage";
import Feature from "@/components/for-common/Feature";
import FeatureText from "@/components/for-common/FeatureText";
import InfoCard from "@/components/for-common/InfoCard";
import { motion } from "framer-motion";

const ForProfessorsPage = () => {
  const infoCards = [
    {
      iconSrc: "/for-common/research.svg",
      title: "Research",
      description: "Backed and university tested",
    },
    {
      iconSrc: "/for-common/library.svg",
      title: "Large Library",
      description: "Of award-winning negotiation cases",
    },
    {
      iconSrc: "/for-common/feedback.svg",
      title: "Feedback",
      description: "That is both data-driven and personalized",
    },
    {
      iconSrc: "/for-common/confidence.svg",
      title: "Build Confidence",
      description: "To tackle even the most challenging negotiations",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-soft-white">
      <Header interLinks={true} darkThemed={true} />
      <HeroImage caption="For Learners" imagesrc="/for-common/learners.jpg" />
      <main className="flex-grow overflow-hidden">
        <div className="flex flex-col gap-[80px]">
          {/* ===== Features with animations ===== */}
          <section className="flex flex-col gap-[32px]">
            {[
              {
                imageSrc: "for-common/feature1.jpg",
                title: "AI Negotiations & Feedback",
                description:
                  "With Discurso.AI, learners can negotiate directly with AI-driven counterparts that simulate realistic scenarios, from high-stakes business deals to internal conflicts and cross-functional negotiations. Each interaction is scored across key competencies and followed by immediate, structured feedback, enabling users to reflect, adapt, and improve without the need for a live coach. AI-powered negotiation practice accelerates growth, deepens insight, and scales effortlessly across teams and organizations.",
              },
              {
                imageSrc: "for-common/feature2.jpg",
                title: "Personalized Learning Journey",
                description:
                  "Discurso.AI supports your growth by automatically analyzing your performance and identifying key areas for improvement. Based on individual results, the platform suggests targeted materials and exercises to help strengthen weak spots and build on existing strengths. This adaptive approach makes learning more focused and effective, making it work for you in your specific circumstances.",
                reverse: true,
              },
              {
                imageSrc: "for-common/feature3.jpg",
                title: "Your Own AI Teacher",
                description:
                  "Meet your AI Teacher: a smart, adaptive guide that supports you every step of the way. It doesn’t just analyze your negotiation performance, it talks to you, encourages you, and helps you reflect. Whether you’re just getting started or working to master advanced skills, the AI Teacher offers guidance, explains your results, and recommends what to focus on next. It’s like having a personal coach in your corner, always ready to push you forward, one piece of advice at a time.",
              },
              {
                imageSrc: "for-common/feature4.jpg",
                title: "Earn Achievements & Levels",
                description:
                  "Learning negotiation should feel rewarding, and with Discurso.AI, it does. As you progress in your learning, you will unlock achievements, and level up your profile on the site. It’s a fun and motivating way to track growth, celebrate milestones, and stay engaged throughout the journey. Whether you’re training solo or with a team, every step forward gets recognized.",
                reverse: true,
              },
              {
                imageSrc: "for-common/feature5.jpg",
                title: "Data-Driven Leaderboards",
                description:
                  "With Discurso.AI’s data-driven leaderboards, learners can see how they perform compared to top negotiators on the platform. After each case, results are benchmarked, highlighting where you excel and where you can improve. Whether you’re curious about how you rank in a specific scenario or aiming to reach the top, these insights turn progress into a clear, motivating journey. It’s not just about competing, it’s about learning from the best.",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: feature.reverse ? 100 : -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
              >
                <Feature {...feature} />
              </motion.div>
            ))}
          </section>

          {/* ===== Benefits section with InfoCards ===== */}
          <section className="w-full bg-blue-600 px-4 sm:px-6 md:px-8 lg:px-16 xl:px-20 py-6 lg:py-8">
            <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row justify-between items-start gap-12">
              {/* Left: title + description */}
              <div className="w-full lg:w-1/2">
                <FeatureText
                  title="Benefits At A Glance"
                  description="Discurso.AI combines fast, AI-powered feedback with the energy of real human interaction. As a learner, you can practice negotiations asynchronously, get instant, personalized feedback, and improve at your own pace, anytime, anywhere. You can also join live peer-to-peer simulations, where you’ll debate, persuade, and learn from others in realistic, challenging scenarios. It’s a flexible and powerful way to build real negotiation skills, whether you’re learning on your own or as part of a broader community."
                />
              </div>

              {/* Right: InfoCards with staggered animation */}
              <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6 justify-items-center sm:justify-items-end">
                {infoCards.map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: idx * 0.2 }}
                  >
                    <InfoCard {...card} />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ===== CTA box ===== */}
          <div className="bg-dark-gray text-white text-center py-6 px-4 mx-12 md:mx-48 rounded-2xl mb-4 mt-8">
            <h2 className="text-2xl md:text-3xl font-semibold mb-8">
              Curious about trying out Discurso
              <span className="text-blue-600">.AI</span> yourself soon?
            </h2>
            <Link href="/signin?mode=signup">
              <Button className="bg-blue-500 text-white hover:bg-blue-600 px-8 py-2 h-auto rounded-full font-semibold">
                Join the Waiting List
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForProfessorsPage;
