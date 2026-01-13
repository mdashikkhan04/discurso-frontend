"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "motion/react";

const TNC = () => {
  return (
    <motion.section
      initial={{ opacity: 0, translateY: 20 }}
      whileInView={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 150, delay: 1 }}
      viewport={{ once: true }}
      className="py-4 md:py-8"
      id="tnc"
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
          <div className="max-w-xl">
            <span className="inline-block px-4 py-2 rounded-full bg-pale-blue text-blue-500 mb-4 text-sm">
              Success Stories
            </span>
            <h2 className="text-4xl font-semibold text-gray-900 mt-4 mb-6">
              Proudly Powering The Negotiation Challenge
            </h2>
            <p className="text-gray-600 mb-8">
              Discurso.AI helps TNC to determine
              <br />
              the world champion in negotiation
            </p>
            {/* <Link href="/signin?mode=signup">
              <Button className="bg-blue-500 text-white hover:bg-blue-600 px-8 py-2 h-auto rounded-full font-semibold">
                Join the Waiting List
              </Button>
            </Link> */}
          </div>
          <div className="flex-shrink-0">
            <div className="p-4 md:p-8 rounded-3xl">
              <Link href="https://thenegotiationchallenge.org/">
                <img
                  src="/land/tnc_logo.png"
                  alt="The Negotiation Challenge Logo"
                  className="w-72 h-72 object-contain opacity-90 hover:opacity-100 transition-opacity"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default TNC;
