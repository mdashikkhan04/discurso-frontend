"use client";

import Header from "@/components/land/Header";
import Footer from "@/components/land/Footer";
import React from "react";
import CompanyMarquee from "@/components/for-common/CompanyMarquee";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import HeroImage from "@/components/for-common/HeroImage";
import Feature from "@/components/for-common/Feature";
import FeatureText from "@/components/for-common/FeatureText";
import InfoCard from "@/components/for-common/InfoCard";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const ForProfessorsPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-soft-white">
      <Header interLinks={true} darkThemed={true} />
      <HeroImage caption="For Professors" imagesrc="/for-common/professors.jpg" />
      <main className="flex-grow overflow-hidden">
        <div className="flex flex-col gap-[80px]">
          {/* Section 1 */}
          <section className="w-full flex justify-center px-4 sm:px-6 lg:px-8 py-12 pt-16 ">
            <div className="flex flex-col lg:flex-row items-start md:items-start gap-12 lg:gap-24 max-w-[1280px] w-full ">
              <div className="flex-shrink-0">
                <CompanyMarquee />
              </div>

              <FeatureText
                title="Trusted By Thought Leaders"
                description="Discurso.AI is a science-based negotiation training platform used by leading universities to help students build critical skills in communication, conflict resolution, and decision-making. Developed in collaboration with researchers and tested across diverse academic settings, our platform combines rigorous pedagogy with hands-on, AI-driven practice. Negotiation is a vital capability across disciplines, from business and law to public policy, and Discurso.AI is used today by universities from every continent to teach it."
                color="text-gray-800"
              />
            </div>
          </section>

          {/* Section 2 */}
          <section className="w-full bg-blue-600 px-4 sm:px-6 md:px-8 lg:px-16 xl:px-20 py-6 lg:py-8">
            <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row justify-between items-start gap-12">
              <div className="w-full lg:w-1/2">
                <FeatureText
                  title="Benefits At A Glance"
                  description="Discurso.AI combines the speed of AI-powered feedback with the depth of collaborative, peer-based learning. Students can practice negotiations asynchronously and receive instant, personalized insights to improve independently and at their own pace. At the same time, the platform enables live negotiation simulations in pairs or groups, bringing learners together to debate, persuade, and reflect in realistic academic or professional contexts. It’s a flexible and engaging way to teach negotiation, fit for modern classrooms, whether in person or online."
                />
              </div>

              {/* InfoCards with sequential animation */}
              <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6 justify-items-center sm:justify-items-end">
                {[
                  {
                    iconSrc: "/for-common/clock.svg",
                    title: "Save Time",
                    description: "On simulation setup and analysis with our tools",
                  },
                  {
                    iconSrc: "/for-common/knowledge.svg",
                    title: "Instant Feedback",
                    description: "For your students after every AI negotiation",
                  },
                  {
                    iconSrc: "/for-common/chat.svg",
                    title: "Run Simulations",
                    description: "With award-winning cases or create your own",
                  },
                  {
                    iconSrc: "/for-common/control.svg",
                    title: "Bundled Insight",
                    description: "Of the strengths and weaknesses of your class",
                  },
                ].map((card, idx) => {
                  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
                  return (
                    <motion.div
                      ref={ref}
                      key={idx}
                      initial={{ opacity: 0, y: 30 }}
                      animate={inView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.5, delay: idx * 0.2 }}
                      className="w-full"
                    >
                      <InfoCard {...card} />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Feature sections with slide-in animations */}
          {[
            {
              imageSrc: "for-common/feature1.jpg",
              title: "AI Negotiations & Feedback",
              description:
                "With Discurso.AI, students can negotiate directly with AI-driven counterparts that simulate realistic scenarios, from business deals to international conflicts and law disputes. Each interaction is scored across key competencies and followed by immediate, structured feedback, helping learners reflect, adapt, and improve without needing constant instructor input. Whether used for self-paced assignments or as part of a course curriculum, AI-powered negotiation practice makes learning faster, deeper, and  more scalable across the classroom.",
              reverse: false,
            },
            {
              imageSrc: "for-common/feature2.jpg",
              title: "Peer To Peer Negotiations",
              description:
                "Discurso.AI enables professors to run live, interactive negotiation simulations between students, making learning more engaging, experiential, and applied. Learners take on different roles in realistic scenarios, practice persuasion and strategy, and gain perspective by experiencing both sides of a negotiation. Whether integrated into lectures, workshops, or online courses, peer-to-peer simulations foster deeper understanding, critical thinking, and lasting skill development, all with minimal setup and analysis work for instructors.",
              reverse: true,
            },
            {
              imageSrc: "for-common/feature3.jpg",
              title: "Personalized Learning Journey",
              description:
                "Discurso.AI helps professors support every student’s growth by automatically analyzing performance and identifying specific areas for improvement. Based on each learner’s results, the platform recommends targeted material and exercises to address weaknesses and reinforce strengths. This adaptive approach ensures students follow personalized learning journeys, maximizing class-wide engagement while allowing instructors to focus on mentoring rather than manual feedback.",
              reverse: false,
            },
            {
              imageSrc: "for-common/feature4.jpg",
              title: "AI Case Builder",
              description:
                "Don’t see the perfect case for your course yet? No problem. With our AI Case Builder, professors can instantly generate custom negotiation scenarios tailored to their learning objectives, student level, and subject area. Simply provide a brief description, and the AI creates a scientifically grounded case, complete with roles, objectives, and scoring criteria. It’s a fast, flexible way to design relevant, engaging exercises without spending hours writing from scratch.",
              reverse: true,
            },
            {
              imageSrc: "for-common/feature5.jpg",
              title: "All The Data You Need",
              description:
                "Want to understand exactly how your students are progressing, and where they need support? Discurso.AI provides detailed analytics for every negotiation, tracking key negotiation competencies. Our instructor dashboard highlights individual and class-wide performance, making it easy to identify strengths, spot patterns, and intervene where needed. With clear, structured data at your fingertips, you can monitor growth, guide learning, and make your teaching even more impactful.",
              reverse: false,
            },
          ].map((feat, idx) => {
            const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });
            return (
              <motion.div
                ref={ref}
                key={idx}
                initial={{ opacity: 0, x: feat.reverse ? 100 : -100 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6 }}
              >
                <Feature {...feat} />
              </motion.div>
            );
          })}

          {/* CTA */}
          <div className="bg-dark-gray text-white text-center py-6 px-4 mx-12 md:mx-48 rounded-2xl mb-4 mt-8">
            <h2 className="text-2xl md:text-3xl font-semibold mb-8">
              Curious about trying out Discurso<span className="text-blue-600">.AI</span> yourself soon?
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
