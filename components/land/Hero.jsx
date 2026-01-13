"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "motion/react";

const FloatingAvatar = ({
  src,
  alt,
  className,
  style,
  label,
  delay,
  size = 10,
}) => (
  <motion.div
    initial={{ opacity: 0, translateY: -40 }}
    animate={{
      opacity: 1,
      translateY: 0,
      transition: {
        duration: 0.2,
        delay,
        type: "spring",
        stiffness: 100,
      },
    }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.8 }}
    className={className}
    style={style}
  >
    <img
      src={src}
      alt={alt}
      className={`w-${size} h-${size} rounded-full border-2 border-white`}
    />
    {label && (
      <span className="text-sm font-medium text-gray-800 pr-2">{label}</span>
    )}
  </motion.div>
);

const Hero = () => (
  <motion.section
    initial={{ opacity: 0, translateY: -40 }}
    animate={{
      opacity: 1,
      translateY: 0,
      transition: {
        duration: 0.2,
        delay: 0.4,
        type: "spring",
        stiffness: 100,
      },
    }}
    id="hero"
    className="rounded-3xl text-white pt-32 pb-16 md:pb-64 relative"
  >
    <svg
      className="hidden md:block absolute inset-0 w-full h-full z-0 pointer-events-none"
      viewBox="0 0 1000 600"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="50%"
        cy="110%"
        r="450"
        fill="none"
        stroke="white"
        strokeWidth="1"
        strokeDasharray="4 6"
        strokeOpacity="0.5"
      />
      <circle
        cx="50%"
        cy="110%"
        r="600"
        fill="none"
        stroke="white"
        strokeWidth="1"
        strokeDasharray="4 6"
        strokeOpacity="0.5"
      />
    </svg>

    <div className="container mx-auto px-4 sm:px-6 lg:px-8 bg-transparent">
      <motion.div
        initial={{ opacity: 0, translateY: -40 }}
        animate={{
          opacity: 1,
          translateY: 0,
          transition: {
            duration: 0.2,
            delay: 0.8,
            type: "spring",
            stiffness: 100,
          },
        }}
        className="text-center max-w-3xl mx-auto mb-8 relative z-10 bg-transparent"
      >
        <h1 className="text-5xl font-semibold mb-6" id="hero">
          Master{" "}
          <span className="relative">
            Negotiation
            <svg
              className="absolute w-full h-6 bottom-0 left-0"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
            >
              <path
                d="M0,40 Q70,15 100,40"
                stroke="white"
                strokeWidth="3"
                fill="none"
              />
            </svg>
          </span>{" "}
          with Science
        </h1>
        <h1 className="text-5xl font-semibold mb-6">
          Based{" "}
          <span className="relative">
            Training
            <svg
              className="absolute w-full h-6 bottom-0 left-0"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
            >
              <path
                d="M0,40 Q40,20 100,40"
                stroke="white"
                strokeWidth="3"
                fill="none"
              />
            </svg>
          </span>
        </h1>
        <p className="text-md md:text-lg mb-8">
          Sharpen your skills with AI-driven coaching and world-class
          simulations.
        </p>
        <div>
          <Link href="/signin?mode=signup">
            <Button className="bg-white text-primary hover:bg-blue-500 hover:text-white px-6 py-2 h-auto rounded-full font-semibold">
              Join the Waiting List
            </Button>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, translateY: -40 }}
        animate={{
          opacity: 1,
          translateY: 0,
          transition: {
            duration: 0.2,
            delay: 1.2,
            type: "spring",
            stiffness: 100,
          },
        }}
        className="relative z-10"
      >
        <div className="p-0 pointer-events-none md:absolute md:left-1/2 md:-translate-x-1/2 md:top-full w-full max-w-6xl">
          <div className="pointer-events-none p-0 md:p-2 rounded-xl border border-white/30 bg-white/5 backdrop-blur-sm shadow-[0_0_60px_rgba(60,130,255,0.15)]">
            <div className="rounded-md overflow-hidden">
              <img
                src="/land/dashboard_screenshot.png"
                alt="Dashboard UI"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <FloatingAvatar
        src="/land/persona-5.png"
        alt="User"
        className="absolute hidden md:flex top-24 left-36 rounded-full"
        delay={2}
        size={10}
      />
      <FloatingAvatar
        src="/land/persona-3.png"
        alt="User"
        className="absolute hidden md:flex top-64 left-8 bg-white/95 rounded-full items-center space-x-2"
        delay={1.8}
        size={12}
        label="Effortless Learning"
      />
      <FloatingAvatar
        src="/land/persona-4.png"
        alt="User"
        className="absolute hidden md:flex bottom-24 left-16 rounded-full"
        delay={1.6}
        size={10}
      />
      <FloatingAvatar
        src="/land/persona-1.png"
        alt="User"
        className="absolute hidden md:flex top-32 right-16 bg-white/95 rounded-full items-center space-x-2"
        delay={2.2}
        size={12}
        label="AI Feedback"
      />
      <FloatingAvatar
        src="/land/persona-2.png"
        alt="User"
        className="absolute hidden md:flex bottom-24 right-16 rounded-full"
        delay={2.4}
        size={10}
      />
    </div>
  </motion.section>
);

export default Hero;
