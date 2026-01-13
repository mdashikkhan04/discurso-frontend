'use client';

import Header from "@/components/land/Header";
import Hero from "@/components/land/Hero";
import Features from "@/components/land/Features";
import Stats from "@/components/land/Stats";
import ForSection from "@/components/land/ForSection";
import TNC from "@/components/land/TNC";
import TrustedBy from "@/components/land/TrustedBy";
import Footer from "@/components/land/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MotionConfig } from "motion/react";


const LandingPage = () => {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-soft-white">
        <div className="m-4 p-2 rounded-3xl bg-gradient-to-b from-vivid-blue to-deep-blue ">
          <Header />
          <Hero />
        </div>
        <Features />
        <Stats />
        <ForSection />
        <TNC />
        <TrustedBy />

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

        <Footer />
      </div>
    </MotionConfig>
  );
};

export default LandingPage;